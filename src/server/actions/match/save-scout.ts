"use server";

/**
 * saveMatchScout — post-game scout/rating bulk save.
 *
 * Run by referee/admin on the finished match's `/scout` page. Atomically:
 *   1. Replaces every existing matchEvent for this match with the new
 *      counts (one row per goal/assist/etc).
 *   2. Upserts a `playerRating` (0-10) for each player with notes.
 *
 * Using a delete+insert for events keeps the schema and ranking math
 * simple. Validation runs at the action boundary; the domain layer
 * stays pure.
 */

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { matchEvents, matches, playerRatings, teamPlayers, teams } from "@/lib/db/schema";
import { matchEventTypeSchema } from "@/lib/domain/match-event";
import { MAX_RATING, MIN_RATING } from "@/lib/domain/player-rating";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

const eventCountsSchema = z.record(matchEventTypeSchema, z.coerce.number().int().min(0).max(99));

const playerScoutSchema = z.object({
  membershipId: z.string().min(1),
  teamId: z.string().min(1),
  counts: eventCountsSchema,
  rating: z.coerce.number().int().min(MIN_RATING).max(MAX_RATING).nullable(),
  notes: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
});

const saveScoutInputSchema = z.object({
  players: z.array(playerScoutSchema).min(1),
});

export type SaveScoutState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function saveMatchScoutAction(
  slug: string,
  matchId: string,
  _prev: SaveScoutState,
  formData: FormData,
): Promise<SaveScoutState> {
  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin", "referee");

    const payloadRaw = formData.get("payload");
    if (typeof payloadRaw !== "string") {
      return { status: "error", message: "Payload ausente." };
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(payloadRaw);
    } catch {
      return { status: "error", message: "Payload inválido." };
    }

    const parsed = saveScoutInputSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    const { players } = parsed.data;

    const [match] = await db
      .select({ id: matches.id, status: matches.status })
      .from(matches)
      .where(and(eq(matches.id, matchId), eq(matches.peladaId, ctx.pelada.id)))
      .limit(1);

    if (!match) throw new NotFoundError("Match", matchId);
    if (match.status !== "finished") {
      throw new ConflictError("Scout só pode ser salvo após encerrar a partida.");
    }

    const teamRows = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.matchId, matchId));
    const teamIds = new Set(teamRows.map((t) => t.id));

    const teamPlayerRows = await db
      .select({ membershipId: teamPlayers.membershipId, teamId: teamPlayers.teamId })
      .from(teamPlayers)
      .where(
        inArray(
          teamPlayers.teamId,
          teamRows.map((t) => t.id),
        ),
      );
    const playerTeam = new Map(teamPlayerRows.map((tp) => [tp.membershipId, tp.teamId]));

    for (const p of players) {
      if (!teamIds.has(p.teamId)) {
        throw new ConflictError("Time inválido.");
      }
      const realTeam = playerTeam.get(p.membershipId);
      if (realTeam !== p.teamId) {
        throw new ConflictError("Jogador não pertence ao time informado.");
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(matchEvents).where(eq(matchEvents.matchId, matchId));

      const inserts: Array<typeof matchEvents.$inferInsert> = [];
      for (const p of players) {
        for (const [type, count] of Object.entries(p.counts) as Array<
          [z.infer<typeof matchEventTypeSchema>, number]
        >) {
          for (let i = 0; i < count; i++) {
            inserts.push({
              matchId,
              teamId: p.teamId,
              membershipId: p.membershipId,
              type,
            });
          }
        }
      }
      if (inserts.length > 0) {
        await tx.insert(matchEvents).values(inserts);
      }

      for (const p of players) {
        if (p.rating === null) {
          await tx
            .delete(playerRatings)
            .where(
              and(
                eq(playerRatings.matchId, matchId),
                eq(playerRatings.membershipId, p.membershipId),
              ),
            );
          continue;
        }

        const insertValues: typeof playerRatings.$inferInsert = {
          matchId,
          membershipId: p.membershipId,
          rating: p.rating,
          ratedByMembershipId: ctx.membership.id,
          ...(p.notes !== undefined ? { notes: p.notes } : {}),
        };

        await tx
          .insert(playerRatings)
          .values(insertValues)
          .onConflictDoUpdate({
            target: [playerRatings.matchId, playerRatings.membershipId],
            set: {
              rating: p.rating,
              notes: p.notes ?? null,
              ratedByMembershipId: ctx.membership.id,
              updatedAt: new Date(),
            },
          });
      }
    });

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}/m/${matchId}/scout`);
    revalidatePath(`/p/${slug}/ranking`);

    return { status: "success" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admin ou juiz pode editar o scout." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível salvar." };
    }
    throw error;
  }
}
