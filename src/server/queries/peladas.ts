/**
 * Pelada queries — read-only, scoped to the current user.
 *
 * NOT a Server Action — these are imported directly by Server Components.
 * Auth check happens via getCurrentUser(); no need for getPeladaContext
 * because we're reading across peladas (the user's own set).
 */

import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { type MembershipRole, memberships, peladas, users } from "@/lib/db/schema";
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

export type PeladaMember = {
  membershipId: string;
  userId: string;
  displayName: string;
  nickname: string | null;
  shirtNumber: number | null;
  role: MembershipRole;
};

/**
 * Lists every active member of a pelada — used by admin pickers
 * (e.g. designating the juiz of a match). Caller must have already
 * verified the requester is allowed to see this list.
 */
export async function listPeladaMembers(peladaId: string): Promise<PeladaMember[]> {
  const rows = await db
    .select({
      membershipId: memberships.id,
      userId: memberships.userId,
      nickname: memberships.nickname,
      shirtNumber: memberships.shirtNumber,
      role: memberships.role,
      userName: users.name,
      userEmail: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.peladaId, peladaId), eq(memberships.status, "active")))
    .orderBy(asc(memberships.nickname), asc(users.name));

  return rows.map((r) => ({
    membershipId: r.membershipId,
    userId: r.userId,
    displayName: r.nickname ?? r.userName ?? r.userEmail?.split("@")[0] ?? "Jogador",
    nickname: r.nickname,
    shirtNumber: r.shirtNumber,
    role: r.role,
  }));
}

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
