/**
 * Tenant scoping helpers.
 *
 * EVERY Server Action/Query that touches data scoped to a `Pelada` MUST start
 * by calling `getPeladaContext(slug)` to:
 *   1. Confirm the user is logged in
 *   2. Confirm the user has a Membership in that pelada
 *   3. Return the verified context (user, membership, pelada)
 *
 * Subsequent queries derive `peladaId` from `ctx.pelada.id` — NEVER trust
 * a pelada id coming from URL/form input directly.
 *
 * See ARCHITECTURE.md §6.3 and CODING_STANDARDS.md §13.
 */

import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  type Membership,
  type MembershipRole,
  memberships,
  type Pelada,
  peladas,
} from "@/lib/db/schema";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export type PeladaContext = {
  user: CurrentUser;
  membership: Membership;
  pelada: Pelada;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new ForbiddenError("user is not authenticated");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
}

export async function getPeladaContext(slug: string): Promise<PeladaContext> {
  const user = await getCurrentUser();

  const [pelada] = await db.select().from(peladas).where(eq(peladas.slug, slug)).limit(1);
  if (!pelada) {
    throw new NotFoundError("Pelada", slug);
  }

  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.peladaId, pelada.id), eq(memberships.userId, user.id)))
    .limit(1);

  if (!membership) {
    throw new ForbiddenError(`user is not a member of pelada ${slug}`);
  }

  return { user, membership, pelada };
}

export function assertRole(ctx: PeladaContext, ...allowed: MembershipRole[]): void {
  if (!allowed.includes(ctx.membership.role)) {
    throw new ForbiddenError(
      `role ${ctx.membership.role} is not allowed (required: ${allowed.join(" | ")})`,
    );
  }
}
