"use server";

/**
 * Attendance actions: confirm + decline.
 *
 * Both run inside a single transaction so the roster state (confirmed
 * count vs maxPlayers, waitlist FIFO promotion) is always consistent.
 *
 * Rules:
 * - Confirm with a free slot → status `confirmed`.
 * - Confirm with no free slot → status `waitlist`.
 * - Decline while previously `confirmed` → promote the oldest waitlist
 *   entry to `confirmed` (FIFO by listPosition).
 * - Decline while on the waitlist → just decline; nobody gets promoted.
 *
 * `listPosition` is the global insertion order for a match. Promotion
 * uses MIN(listPosition) WHERE status='waitlist' for stable FIFO.
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { matches, rosterEntries } from "@/lib/db/schema";
import { isRosterAcceptingResponses } from "@/lib/domain/match";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";

export type AttendanceState = {
  status: "idle" | "success" | "error";
  message?: string;
};

async function loadMatchScopedToPelada(slug: string, matchId: string) {
  const ctx = await getPeladaContext(slug);
  const [match] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.peladaId, ctx.pelada.id)))
    .limit(1);

  if (!match) {
    throw new NotFoundError("Match", matchId);
  }
  return { ctx, match };
}

export async function confirmAttendanceAction(
  slug: string,
  matchId: string,
  _prev: AttendanceState,
  _formData: FormData,
): Promise<AttendanceState> {
  try {
    const { ctx, match } = await loadMatchScopedToPelada(slug, matchId);
    if (!isRosterAcceptingResponses(match.status)) {
      throw new ConflictError("A lista dessa partida não está aberta.");
    }

    await db.transaction(async (tx) => {
      const aggRows = await tx
        .select({
          confirmedCount: sql<number>`COUNT(*) FILTER (WHERE ${rosterEntries.status} = 'confirmed')::int`,
          maxList: sql<number | null>`MAX(${rosterEntries.listPosition})::int`,
        })
        .from(rosterEntries)
        .where(eq(rosterEntries.matchId, matchId));

      const confirmedCount = aggRows[0]?.confirmedCount ?? 0;
      const maxList = aggRows[0]?.maxList ?? null;

      const nextPosition = (maxList ?? 0) + 1;
      const targetStatus: "confirmed" | "waitlist" =
        confirmedCount < ctx.pelada.maxPlayers ? "confirmed" : "waitlist";

      const [existing] = await tx
        .select({ id: rosterEntries.id, status: rosterEntries.status })
        .from(rosterEntries)
        .where(
          and(
            eq(rosterEntries.matchId, matchId),
            eq(rosterEntries.membershipId, ctx.membership.id),
          ),
        )
        .limit(1);

      if (!existing) {
        await tx.insert(rosterEntries).values({
          matchId,
          membershipId: ctx.membership.id,
          status: targetStatus,
          listPosition: nextPosition,
        });
        return;
      }

      if (existing.status === "confirmed" || existing.status === "waitlist") {
        return; // already in roster — no-op
      }

      // existing was 'declined': re-join at current tail position
      await tx
        .update(rosterEntries)
        .set({
          status: targetStatus,
          listPosition: nextPosition,
          respondedAt: new Date(),
          promotedFromWaitlistAt: null,
        })
        .where(eq(rosterEntries.id, existing.id));
    });

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}`);
    return { status: "success", message: "Presença confirmada." };
  } catch (error) {
    return mapError(error, "Não foi possível confirmar a presença.");
  }
}

export async function declineAttendanceAction(
  slug: string,
  matchId: string,
  _prev: AttendanceState,
  _formData: FormData,
): Promise<AttendanceState> {
  try {
    const { ctx, match } = await loadMatchScopedToPelada(slug, matchId);
    if (!isRosterAcceptingResponses(match.status)) {
      throw new ConflictError("A lista dessa partida não está aberta.");
    }

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: rosterEntries.id, status: rosterEntries.status })
        .from(rosterEntries)
        .where(
          and(
            eq(rosterEntries.matchId, matchId),
            eq(rosterEntries.membershipId, ctx.membership.id),
          ),
        )
        .limit(1);

      const wasConfirmed = existing?.status === "confirmed";

      if (!existing) {
        const maxRows = await tx
          .select({ maxList: sql<number | null>`MAX(${rosterEntries.listPosition})::int` })
          .from(rosterEntries)
          .where(eq(rosterEntries.matchId, matchId));
        const maxList = maxRows[0]?.maxList ?? null;

        await tx.insert(rosterEntries).values({
          matchId,
          membershipId: ctx.membership.id,
          status: "declined",
          listPosition: (maxList ?? 0) + 1,
        });
      } else if (existing.status !== "declined") {
        await tx
          .update(rosterEntries)
          .set({ status: "declined", respondedAt: new Date() })
          .where(eq(rosterEntries.id, existing.id));
      }

      if (!wasConfirmed) return;

      // Promote the oldest waitlist entry to confirmed.
      const [nextUp] = await tx
        .select({ id: rosterEntries.id })
        .from(rosterEntries)
        .where(and(eq(rosterEntries.matchId, matchId), eq(rosterEntries.status, "waitlist")))
        .orderBy(asc(rosterEntries.listPosition))
        .limit(1);

      if (nextUp) {
        await tx
          .update(rosterEntries)
          .set({ status: "confirmed", promotedFromWaitlistAt: new Date() })
          .where(eq(rosterEntries.id, nextUp.id));
      }
    });

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}`);
    return { status: "success", message: "Presença cancelada." };
  } catch (error) {
    return mapError(error, "Não foi possível cancelar a presença.");
  }
}

function mapError(error: unknown, fallback: string): AttendanceState {
  if (error instanceof NotFoundError) {
    return { status: "error", message: "Partida não encontrada." };
  }
  if (error instanceof ForbiddenError) {
    return { status: "error", message: "Você não é membro dessa pelada." };
  }
  if (error instanceof ConflictError) {
    return { status: "error", message: error.message };
  }
  if (error instanceof AppError) {
    return { status: "error", message: fallback };
  }
  throw error;
}
