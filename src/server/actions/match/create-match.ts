"use server";

/**
 * createMatch — admin schedules a new match for a pelada.
 *
 * The match is created already in `roster_open` so the admin can confirm
 * their own attendance immediately. There's no UX win in a separate "open
 * roster" step at MVP scope.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { matches } from "@/lib/db/schema";
import { type CreateMatchInput, createMatchInputSchema } from "@/lib/domain/match";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

export type CreateMatchState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof CreateMatchInput, string>>;
};

export async function createMatchAction(
  slug: string,
  _prev: CreateMatchState,
  formData: FormData,
): Promise<CreateMatchState> {
  let createdMatchId: string | null = null;

  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin");

    const raw = {
      scheduledFor: formData.get("scheduledFor"),
      locationOverride: formData.get("locationOverride"),
      notes: formData.get("notes"),
    };

    const parsed = createMatchInputSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: CreateMatchState["fieldErrors"] = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) {
          (fieldErrors as Record<string, string>)[key] = issue.message;
        }
      }
      return {
        status: "error",
        message: "Confere os campos marcados aí.",
        fieldErrors,
      };
    }

    const input = parsed.data;

    const [created] = await db
      .insert(matches)
      .values({
        peladaId: ctx.pelada.id,
        scheduledFor: new Date(input.scheduledFor),
        locationOverride: input.locationOverride || null,
        notes: input.notes || null,
        status: "roster_open",
      })
      .returning({ id: matches.id });

    if (!created) {
      throw new AppError("failed to insert match", "INSERT_FAILED");
    }

    createdMatchId = created.id;
    revalidatePath(`/p/${slug}`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Pelada não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admins podem agendar partida." };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível agendar a partida." };
    }
    throw error;
  }

  if (createdMatchId) {
    redirect(`/p/${slug}/m/${createdMatchId}`);
  }

  return { status: "idle" };
}
