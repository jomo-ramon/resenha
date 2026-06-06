"use server";

/**
 * Update the current user's profile WITHIN a specific pelada.
 *
 * Membership is per-pelada, so the same person can have different
 * nicknames/shirt numbers in different peladas.
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { memberships } from "@/lib/db/schema";
import {
  type UpdateMembershipProfileInput,
  updateMembershipProfileSchema,
} from "@/lib/domain/membership";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";

export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof UpdateMembershipProfileInput, string>>;
};

export async function updateMyMembershipAction(
  slug: string,
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  try {
    const ctx = await getPeladaContext(slug);

    const raw = {
      nickname: formData.get("nickname"),
      shirtNumber: formData.get("shirtNumber"),
      preferredPosition: formData.get("preferredPosition"),
    };

    const parsed = updateMembershipProfileSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: UpdateProfileState["fieldErrors"] = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) {
          (fieldErrors as Record<string, string>)[key] = issue.message;
        }
      }
      return { status: "error", message: "Confere os campos.", fieldErrors };
    }

    const input = parsed.data;
    const shirt =
      input.shirtNumber === "" || input.shirtNumber === undefined ? null : input.shirtNumber;

    await db
      .update(memberships)
      .set({
        nickname: input.nickname && input.nickname !== "" ? input.nickname : null,
        shirtNumber: shirt,
        preferredPosition: input.preferredPosition,
      })
      .where(eq(memberships.id, ctx.membership.id));

    revalidatePath(`/p/${slug}`);
    revalidatePath(`/p/${slug}/perfil`);

    return { status: "success", message: "Perfil atualizado." };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Pelada não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Você não é membro dessa pelada." };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível salvar." };
    }
    throw error;
  }
}
