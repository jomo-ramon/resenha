"use server";

/**
 * updatePeladaRules — admin-only edit of per-pelada scoring weights.
 *
 * Receives a flat record of `<MatchEventType>=<points>` form fields and
 * persists them under `peladas.rules.eventPoints`. Empty / missing keys
 * fall back to defaults at read-time (see DEFAULT_EVENT_POINTS).
 */

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { peladas } from "@/lib/db/schema";
import { matchEventTypeSchema } from "@/lib/domain/match-event";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

const eventPointSchema = z.coerce.number().int().min(-99).max(99);

export type UpdateRulesState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function updatePeladaRulesAction(
  slug: string,
  _prev: UpdateRulesState,
  formData: FormData,
): Promise<UpdateRulesState> {
  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin");

    const eventPoints: Record<string, number> = {};
    for (const type of matchEventTypeSchema.options) {
      const raw = formData.get(`points.${type}`);
      if (raw === null || raw === "") continue;
      const parsed = eventPointSchema.safeParse(raw);
      if (!parsed.success) {
        return {
          status: "error",
          message: `Valor inválido para ${type}: ${parsed.error.issues[0]?.message ?? ""}`,
        };
      }
      eventPoints[type] = parsed.data;
    }

    const nextRules = { ...(ctx.pelada.rules ?? {}), eventPoints };

    await db.update(peladas).set({ rules: nextRules }).where(eq(peladas.id, ctx.pelada.id));

    revalidatePath(`/p/${slug}`);
    revalidatePath(`/p/${slug}/ranking`);
    revalidatePath(`/p/${slug}/configuracoes`);

    return { status: "success" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Pelada não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admin pode mudar as regras da pelada." };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível salvar." };
    }
    throw error;
  }
}
