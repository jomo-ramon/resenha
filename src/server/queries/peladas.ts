/**
 * Pelada queries — read-only, scoped to the current user.
 *
 * NOT a Server Action — these are imported directly by Server Components.
 * Auth check happens via getCurrentUser(); no need for getPeladaContext
 * because we're reading across peladas (the user's own set).
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { type MembershipRole, memberships, peladas } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/multitenancy";

export type UserPelada = {
  id: string;
  slug: string;
  name: string;
  weekday: string;
  startTime: string;
  location: string;
  role: MembershipRole;
  joinedAt: Date;
};

export async function listPeladasOfCurrentUser(): Promise<UserPelada[]> {
  const user = await getCurrentUser();

  const rows = await db
    .select({
      id: peladas.id,
      slug: peladas.slug,
      name: peladas.name,
      weekday: peladas.weekday,
      startTime: peladas.startTime,
      location: peladas.location,
      role: memberships.role,
      joinedAt: memberships.joinedAt,
    })
    .from(memberships)
    .innerJoin(peladas, eq(peladas.id, memberships.peladaId))
    .where(and(eq(memberships.userId, user.id), eq(memberships.status, "active")))
    .orderBy(desc(memberships.joinedAt));

  return rows;
}
