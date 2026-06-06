"use server";

/**
 * clearDraft — admin undoes the team draft.
 *
 * Allowed only while the match is still in `teams_drafted` (no events,
 * no score). Drops teams + teamPlayers and moves status back to roster_open.
 */

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { matches, teamPlayers, teams } from "@/lib/db/schema";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

export type ClearDraftState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function clearDraftAction(
  slug: string,
  matchId: string,
  _prev: ClearDraftState,
  _formData: FormData,
): Promise<ClearDraftState> {
  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin");

    await db.transaction(async (tx) => {
      const [match] = await tx
        .select({ id: matches.id, status: matches.status })
        .from(matches)
        .where(and(eq(matches.id, matchId), eq(matches.peladaId, ctx.pelada.id)))
        .limit(1);

      if (!match) throw new NotFoundError("Match", matchId);
      if (match.status !== "teams_drafted") {
        throw new ConflictError("Só dá pra refazer o sorteio antes da partida começar.");
      }

      await tx
        .delete(teamPlayers)
        .where(
          inArray(
            teamPlayers.teamId,
            tx.select({ id: teams.id }).from(teams).where(eq(teams.matchId, matchId)),
          ),
        );
      await tx.delete(teams).where(eq(teams.matchId, matchId));

      await tx.update(matches).set({ status: "roster_open" }).where(eq(matches.id, matchId));
    });

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}`);
    return { status: "success", message: "Sorteio desfeito." };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admins podem refazer o sorteio." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível refazer o sorteio." };
    }
    throw error;
  }
}
