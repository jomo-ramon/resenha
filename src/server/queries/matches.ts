/**
 * Match queries — read-only. Callers MUST have already gone through
 * `getPeladaContext(slug)` and pass the verified peladaId here.
 */

import { and, asc, desc, eq, gte, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  type Match,
  matches,
  memberships,
  type RosterEntryStatus,
  rosterEntries,
  users,
} from "@/lib/db/schema";

export type NextMatchSummary = {
  match: Match;
  confirmedCount: number;
  waitlistCount: number;
};

export async function getNextUpcomingMatch(peladaId: string): Promise<NextMatchSummary | null> {
  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.peladaId, peladaId),
        ne(matches.status, "cancelled"),
        ne(matches.status, "finished"),
        gte(matches.scheduledFor, new Date(Date.now() - 6 * 60 * 60 * 1000)),
      ),
    )
    .orderBy(asc(matches.scheduledFor))
    .limit(1);

  if (!match) return null;

  const entries = await db
    .select({ status: rosterEntries.status })
    .from(rosterEntries)
    .where(eq(rosterEntries.matchId, match.id));

  let confirmedCount = 0;
  let waitlistCount = 0;
  for (const e of entries) {
    if (e.status === "confirmed") confirmedCount++;
    else if (e.status === "waitlist") waitlistCount++;
  }

  return { match, confirmedCount, waitlistCount };
}

export type RosterRow = {
  entryId: string;
  membershipId: string;
  status: RosterEntryStatus;
  listPosition: number;
  respondedAt: Date;
  promotedFromWaitlistAt: Date | null;
  displayName: string;
  nickname: string | null;
};

export type MatchDetail = {
  match: Match;
  roster: RosterRow[];
};

export async function getMatchWithRoster(
  peladaId: string,
  matchId: string,
): Promise<MatchDetail | null> {
  const [match] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.peladaId, peladaId)))
    .limit(1);

  if (!match) return null;

  const roster = await db
    .select({
      entryId: rosterEntries.id,
      membershipId: rosterEntries.membershipId,
      status: rosterEntries.status,
      listPosition: rosterEntries.listPosition,
      respondedAt: rosterEntries.respondedAt,
      promotedFromWaitlistAt: rosterEntries.promotedFromWaitlistAt,
      nickname: memberships.nickname,
      userName: users.name,
      userEmail: users.email,
    })
    .from(rosterEntries)
    .innerJoin(memberships, eq(memberships.id, rosterEntries.membershipId))
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(rosterEntries.matchId, matchId))
    .orderBy(asc(rosterEntries.listPosition));

  const rows: RosterRow[] = roster.map((r) => ({
    entryId: r.entryId,
    membershipId: r.membershipId,
    status: r.status,
    listPosition: r.listPosition,
    respondedAt: r.respondedAt,
    promotedFromWaitlistAt: r.promotedFromWaitlistAt,
    displayName: r.nickname ?? r.userName ?? r.userEmail?.split("@")[0] ?? "Jogador",
    nickname: r.nickname,
  }));

  return { match, roster: rows };
}

export async function listRecentMatches(peladaId: string, limit = 5): Promise<Match[]> {
  return db
    .select()
    .from(matches)
    .where(eq(matches.peladaId, peladaId))
    .orderBy(desc(matches.scheduledFor))
    .limit(limit);
}
