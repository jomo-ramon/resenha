"use server";

/**
 * startMatch — admin/referee transitions teams_drafted → in_progress.
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { matches } from "@/lib/db/schema";
import { canTransition } from "@/lib/domain/match";
import { canRefereeMatch } from "@/lib/domain/permissions";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";

export type StartMatchState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function startMatchAction(
  slug: string,
  matchId: string,
  _prev: StartMatchState,
  _formData: FormData,
): Promise<StartMatchState> {
  try {
    const ctx = await getPeladaContext(slug);

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
    if (!canTransition(match.status, "in_progress")) {
      throw new ConflictError("Não dá pra começar a partida nesse estado.");
    }

    await db.update(matches).set({ status: "in_progress" }).where(eq(matches.id, matchId));
    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}`);

    return { status: "success", message: "Partida começou." };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admin ou juiz pode começar a partida." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível começar a partida." };
    }
    throw error;
  }
}
