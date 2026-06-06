"use server";

/**
 * cancelMatch — admin-only.
 *
 * Allowed only while the match is still in `scheduled` or `roster_open`.
 * Once teams are sorted or events are recorded, cancellation would
 * corrupt history; admins should finish the match instead.
 */

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { matches } from "@/lib/db/schema";
import { canCancelMatch } from "@/lib/domain/match";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

export type CancelMatchState = {
  status: "idle" | "error";
  message?: string;
};

export async function cancelMatchAction(
  slug: string,
  matchId: string,
  _prev: CancelMatchState,
  _formData: FormData,
): Promise<CancelMatchState> {
  let shouldRedirect = false;

  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin");

    const [match] = await db
      .select({ id: matches.id, status: matches.status })
      .from(matches)
      .where(and(eq(matches.id, matchId), eq(matches.peladaId, ctx.pelada.id)))
      .limit(1);

    if (!match) {
      throw new NotFoundError("Match", matchId);
    }

    if (!canCancelMatch(match.status)) {
      throw new ConflictError(
        "Essa partida já avançou demais pra ser cancelada. Finaliza pelo modo juiz.",
      );
    }

    await db.update(matches).set({ status: "cancelled" }).where(eq(matches.id, matchId));

    revalidatePath(`/p/${slug}`);
    revalidatePath(`/p/${slug}/m/${matchId}`);
    shouldRedirect = true;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admins podem cancelar a partida." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível cancelar a partida." };
    }
    throw error;
  }

  if (shouldRedirect) {
    redirect(`/p/${slug}`);
  }

  return { status: "idle" };
}
