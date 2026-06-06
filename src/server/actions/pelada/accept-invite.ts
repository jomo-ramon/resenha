"use server";

/**
 * acceptInvite — validates a public invite link and creates a player Membership.
 *
 * Idempotent when the user is already a member: just redirects to the
 * dashboard. Token must match the pelada's current `inviteToken` — once
 * an admin rotates it, old links stop working.
 */

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { memberships, peladas } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/multitenancy";

export type AcceptInviteState = {
  status: "idle" | "error";
  message?: string;
};

export async function acceptInviteAction(
  slug: string,
  token: string,
  _prev: AcceptInviteState,
  _formData: FormData,
): Promise<AcceptInviteState> {
  let targetSlug: string | null = null;

  try {
    const user = await getCurrentUser();

    const [pelada] = await db
      .select({ id: peladas.id, slug: peladas.slug, inviteToken: peladas.inviteToken })
      .from(peladas)
      .where(eq(peladas.slug, slug))
      .limit(1);

    if (!pelada || pelada.inviteToken !== token) {
      return {
        status: "error",
        message: "Esse link de convite não vale mais. Pede um novo ao admin.",
      };
    }

    const [existing] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.peladaId, pelada.id), eq(memberships.userId, user.id)))
      .limit(1);

    if (!existing) {
      await db.insert(memberships).values({
        userId: user.id,
        peladaId: pelada.id,
        role: "player",
        status: "active",
      });
    }

    targetSlug = pelada.slug;
  } catch (error) {
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível aceitar o convite." };
    }
    throw error;
  }

  if (targetSlug) {
    redirect(`/p/${targetSlug}`);
  }

  return { status: "idle" };
}
