"use server";

/**
 * addMatchEvent — referee records a goal/assist/card during the match.
 *
 * Validates that:
 * - The match is currently in_progress (only state where events can be recorded).
 * - The team belongs to this match.
 * - The membership belongs to a team in this match (assist-from-other-team
 *   would also be technically valid, but we only allow players on the match's teams).
 */

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { matchEvents, matches, teamPlayers, teams } from "@/lib/db/schema";
import { addMatchEventInputSchema } from "@/lib/domain/match-event";
import { canRefereeMatch } from "@/lib/domain/permissions";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";

export type AddEventState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function addMatchEventAction(
  slug: string,
  matchId: string,
  _prev: AddEventState,
  formData: FormData,
): Promise<AddEventState> {
  try {
    const ctx = await getPeladaContext(slug);

    const minuteRaw = formData.get("minute");
    const minute = typeof minuteRaw === "string" && minuteRaw !== "" ? minuteRaw : undefined;

    const raw = {
      teamId: formData.get("teamId"),
      membershipId: formData.get("membershipId"),
      type: formData.get("type"),
      minute,
    };

    const parsed = addMatchEventInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }
    const input = parsed.data;

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
    if (!canRefereeMatch(ctx.membership, match)) {
      throw new ForbiddenError("user is not allowed to referee this match");
    }
    if (match.status !== "in_progress") {
      throw new ConflictError("A partida não está em andamento.");
    }

    const teamRows = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.matchId, matchId));
    const teamIds = teamRows.map((t) => t.id);
    if (!teamIds.includes(input.teamId)) {
      throw new ConflictError("Time inválido pra essa partida.");
    }

    const playerCheck = await db
      .select({ id: teamPlayers.membershipId })
      .from(teamPlayers)
      .where(
        and(eq(teamPlayers.membershipId, input.membershipId), inArray(teamPlayers.teamId, teamIds)),
      )
      .limit(1);
    if (playerCheck.length === 0) {
      throw new ConflictError("Esse jogador não está em nenhum dos times dessa partida.");
    }

    await db.insert(matchEvents).values({
      matchId,
      teamId: input.teamId,
      membershipId: input.membershipId,
      type: input.type,
      minute: input.minute ?? null,
    });

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}/ranking`);

    return { status: "success" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admin ou juiz pode registrar eventos." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível registrar." };
    }
    throw error;
  }
}
