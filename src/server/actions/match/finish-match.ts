"use server";

/**
 * finishMatch — admin/referee ends the match.
 *
 * Computes the final score from recorded events and persists it on each
 * team. Sets match.status = 'finished' and match.finishedAt.
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { matchEvents, matches, teams } from "@/lib/db/schema";
import { canTransition } from "@/lib/domain/match";
import { computeScore } from "@/lib/domain/match-event";
import { canRefereeMatch } from "@/lib/domain/permissions";
import { TEAM_DARK, TEAM_LIGHT } from "@/lib/domain/team-draft";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";

export type FinishMatchState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function finishMatchAction(
  slug: string,
  matchId: string,
  _prev: FinishMatchState,
  _formData: FormData,
): Promise<FinishMatchState> {
  try {
    const ctx = await getPeladaContext(slug);

    await db.transaction(async (tx) => {
      const [match] = await tx
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
      if (!canTransition(match.status, "finished")) {
        throw new ConflictError("A partida não está em andamento.");
      }

      const teamRows = await tx
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(eq(teams.matchId, matchId));

      const lightTeam = teamRows.find((t) => t.name === TEAM_LIGHT.name);
      const darkTeam = teamRows.find((t) => t.name === TEAM_DARK.name);
      if (!lightTeam || !darkTeam) {
        throw new ConflictError("Times não encontrados pra essa partida.");
      }

      const events = await tx
        .select({ teamId: matchEvents.teamId, type: matchEvents.type })
        .from(matchEvents)
        .where(eq(matchEvents.matchId, matchId));

      const score = computeScore(events, lightTeam.id, darkTeam.id);

      await tx.update(teams).set({ finalScore: score.light }).where(eq(teams.id, lightTeam.id));
      await tx.update(teams).set({ finalScore: score.dark }).where(eq(teams.id, darkTeam.id));

      await tx
        .update(matches)
        .set({ status: "finished", finishedAt: new Date() })
        .where(eq(matches.id, matchId));
    });

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}`);
    revalidatePath(`/p/${slug}/ranking`);

    return { status: "success", message: "Partida encerrada." };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admin ou juiz pode encerrar a partida." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível encerrar." };
    }
    throw error;
  }
}
