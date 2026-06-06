"use server";

/**
 * removeMatchEvent — admin/referee deletes a previously recorded event.
 * Allowed while the match is in_progress or finished (last-minute fix).
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { matchEvents, matches } from "@/lib/db/schema";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

export type RemoveEventState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function removeMatchEventAction(
  slug: string,
  matchId: string,
  eventId: string,
  _prev: RemoveEventState,
  _formData: FormData,
): Promise<RemoveEventState> {
  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin", "referee");

    const [match] = await db
      .select({ id: matches.id, status: matches.status })
      .from(matches)
      .where(and(eq(matches.id, matchId), eq(matches.peladaId, ctx.pelada.id)))
      .limit(1);

    if (!match) throw new NotFoundError("Match", matchId);
    if (match.status !== "in_progress" && match.status !== "finished") {
      throw new ConflictError("Não dá pra editar eventos nesse estado.");
    }

    await db
      .delete(matchEvents)
      .where(and(eq(matchEvents.id, eventId), eq(matchEvents.matchId, matchId)));

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}/ranking`);

    return { status: "success" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admin ou juiz pode remover eventos." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível remover." };
    }
    throw error;
  }
}
