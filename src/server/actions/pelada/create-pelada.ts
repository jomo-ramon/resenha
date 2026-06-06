"use server";

/**
 * createPelada — onboarding action.
 *
 * Creates a new `Pelada` and an `admin` `Membership` for the current user
 * in a single transaction. A Pelada always has at least one admin (its creator),
 * enforced by this transaction.
 *
 * Slug uniqueness is enforced at the DB level. We catch the unique violation
 * and return a friendly conflict error.
 */

import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { memberships, peladas } from "@/lib/db/schema";
import { type CreatePeladaInput, createPeladaInputSchema } from "@/lib/domain/pelada";
import { AppError, ConflictError, ValidationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/multitenancy";

export type CreatePeladaState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof CreatePeladaInput, string>>;
};

const PG_UNIQUE_VIOLATION = "23505";

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

export async function createPeladaAction(
  _prev: CreatePeladaState,
  formData: FormData,
): Promise<CreatePeladaState> {
  let createdSlug: string | null = null;

  try {
    const user = await getCurrentUser();

    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      weekday: formData.get("weekday"),
      startTime: formData.get("startTime"),
      location: formData.get("location"),
      address: formData.get("address"),
      maxPlayers: formData.get("maxPlayers"),
    };

    const parsed = createPeladaInputSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: CreatePeladaState["fieldErrors"] = {};
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

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(peladas)
        .values({
          slug: input.slug,
          name: input.name,
          description: input.description || null,
          weekday: input.weekday,
          startTime: input.startTime,
          location: input.location,
          address: input.address || null,
          maxPlayers: input.maxPlayers,
          ownerUserId: user.id,
        })
        .returning({ id: peladas.id, slug: peladas.slug });

      if (!created) {
        throw new AppError("failed to insert pelada", "INSERT_FAILED");
      }

      await tx.insert(memberships).values({
        userId: user.id,
        peladaId: created.id,
        role: "admin",
        status: "active",
      });

      createdSlug = created.slug;
    });
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return {
        status: "error",
        message: "Esse endereço já está em uso. Escolhe outro.",
        fieldErrors: { slug: "Endereço já em uso." },
      };
    }
    if (error instanceof ValidationError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível criar a pelada. Tenta de novo." };
    }
    throw error;
  }

  if (createdSlug) {
    redirect(`/p/${createdSlug}`);
  }

  return { status: "idle" };
}
