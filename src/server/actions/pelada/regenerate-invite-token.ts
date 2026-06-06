"use server";

/**
 * regenerateInviteToken — admin-only rotation.
 *
 * Issues a fresh `inviteToken` for the pelada, immediately invalidating
 * the previous public link. Useful when a link leaks.
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { peladas } from "@/lib/db/schema";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

export type RegenerateInviteTokenState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function regenerateInviteTokenAction(
  slug: string,
  _prev: RegenerateInviteTokenState,
  _formData: FormData,
): Promise<RegenerateInviteTokenState> {
  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin");

    await db
      .update(peladas)
      .set({ inviteToken: crypto.randomUUID() })
      .where(eq(peladas.id, ctx.pelada.id));

    revalidatePath(`/p/${slug}`);
    return { status: "success", message: "Link de convite renovado." };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Pelada não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admins podem renovar o link." };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível renovar o link." };
    }
    throw error;
  }
}
