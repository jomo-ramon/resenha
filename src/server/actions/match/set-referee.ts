"use server";

/**
 * setMatchReferee — admin designates (or clears) the juiz of a match.
 *
 * A juiz is a regular player picked just for this match. To prevent
 * conflicts, the juiz CANNOT be in the roster as `confirmed` or
 * `waitlist` — we block the assignment with an error and let the admin
 * resolve it (ask the player to desconfirmar, then assign).
 *
 * Pass `membershipId = ""` (or no field) to clear the juiz.
 */

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { matches, memberships, rosterEntries, users } from "@/lib/db/schema";
import { canAssignReferee } from "@/lib/domain/permissions";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

export type SetRefereeState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function setMatchRefereeAction(
  slug: string,
  matchId: string,
  _prev: SetRefereeState,
  formData: FormData,
): Promise<SetRefereeState> {
  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin");

    const raw = formData.get("membershipId");
    const targetMembershipId = typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;

    const [match] = await db
      .select({
        id: matches.id,
        status: matches.status,
        activeRefereeId: matches.activeRefereeId,
      })
      .from(matches)
      .where(and(eq(matches.id, matchId), eq(matches.peladaId, ctx.pelada.id)))
      .limit(1);

    if (!match) throw new NotFoundError("Match", matchId);
    if (!canAssignReferee(ctx.membership, match)) {
      throw new ConflictError("Partida já encerrada ou cancelada — não dá pra trocar o juiz.");
    }

    if (targetMembershipId !== null) {
      const [target] = await db
        .select({
          id: memberships.id,
          nickname: memberships.nickname,
          userName: users.name,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(and(eq(memberships.id, targetMembershipId), eq(memberships.peladaId, ctx.pelada.id)))
        .limit(1);

      if (!target) {
        throw new ConflictError("Jogador escolhido não é membro dessa pelada.");
      }

      const conflict = await db
        .select({ status: rosterEntries.status })
        .from(rosterEntries)
        .where(
          and(
            eq(rosterEntries.matchId, matchId),
            eq(rosterEntries.membershipId, targetMembershipId),
            inArray(rosterEntries.status, ["confirmed", "waitlist"]),
          ),
        )
        .limit(1);

      if (conflict.length > 0) {
        const displayName = target.nickname ?? target.userName ?? "Esse jogador";
        throw new ConflictError(
          `${displayName} já está no roster da partida — peça pra desconfirmar antes de escalar como juiz.`,
        );
      }
    }

    await db
      .update(matches)
      .set({ activeRefereeId: targetMembershipId })
      .where(eq(matches.id, matchId));

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}`);

    return { status: "success" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admin pode escalar juiz." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível escalar o juiz." };
    }
    throw error;
  }
}
