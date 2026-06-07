/**
 * Match queries — read-only. Callers MUST have already gone through
 * `getPeladaContext(slug)` and pass the verified peladaId here.
 */

import { and, asc, count, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  type Match,
  type MatchEvent,
  matchEvents,
  matches,
  memberships,
  type PlayerRating,
  playerRatings,
  type RosterEntryStatus,
  rosterEntries,
  type Team,
  teamPlayers,
  teams,
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

export type TeamWithPlayers = {
  team: Team;
  playerMembershipIds: string[];
};

export type MatchEventRow = MatchEvent & {
  displayName: string;
};

export type MatchDetail = {
  match: Match;
  roster: RosterRow[];
  teams: TeamWithPlayers[];
  events: MatchEventRow[];
};

export type MatchListItem = {
  match: Match;
  confirmedCount: number;
};

/**
 * Lists matches for a pelada, newest first. Pass `status` to filter (e.g.
 * upcoming vs finished). When no status is passed, returns everything.
 */
export async function listMatches(
  peladaId: string,
  options: { status?: Match["status"][]; limit?: number } = {},
): Promise<MatchListItem[]> {
  const { status, limit = 50 } = options;

  const matchRows = await db
    .select()
    .from(matches)
    .where(
      status && status.length > 0
        ? and(eq(matches.peladaId, peladaId), inArray(matches.status, status))
        : eq(matches.peladaId, peladaId),
    )
    .orderBy(desc(matches.scheduledFor))
    .limit(limit);

  if (matchRows.length === 0) return [];

  const counts = await db
    .select({
      matchId: rosterEntries.matchId,
      confirmedCount: count(rosterEntries.id),
    })
    .from(rosterEntries)
    .where(
      and(
        inArray(
          rosterEntries.matchId,
          matchRows.map((m) => m.id),
        ),
        eq(rosterEntries.status, "confirmed"),
      ),
    )
    .groupBy(rosterEntries.matchId);

  const countLookup = new Map(counts.map((c) => [c.matchId, c.confirmedCount]));

  return matchRows.map((m) => ({
    match: m,
    confirmedCount: countLookup.get(m.id) ?? 0,
  }));
}

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

  const teamRows = await db.select().from(teams).where(eq(teams.matchId, matchId));
  const teamPlayerRows =
    teamRows.length > 0
      ? await db
          .select({ teamId: teamPlayers.teamId, membershipId: teamPlayers.membershipId })
          .from(teamPlayers)
          .where(
            inArray(
              teamPlayers.teamId,
              teamRows.map((t) => t.id),
            ),
          )
      : [];
  const teamsWithPlayers: TeamWithPlayers[] = teamRows.map((t) => ({
    team: t,
    playerMembershipIds: teamPlayerRows
      .filter((tp) => tp.teamId === t.id)
      .map((tp) => tp.membershipId),
  }));

  const eventRows = await db
    .select({
      id: matchEvents.id,
      matchId: matchEvents.matchId,
      teamId: matchEvents.teamId,
      membershipId: matchEvents.membershipId,
      type: matchEvents.type,
      minute: matchEvents.minute,
      notes: matchEvents.notes,
      createdAt: matchEvents.createdAt,
      nickname: memberships.nickname,
      userName: users.name,
      userEmail: users.email,
    })
    .from(matchEvents)
    .innerJoin(memberships, eq(memberships.id, matchEvents.membershipId))
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(matchEvents.matchId, matchId))
    .orderBy(asc(matchEvents.createdAt));

  const events: MatchEventRow[] = eventRows.map((e) => ({
    id: e.id,
    matchId: e.matchId,
    teamId: e.teamId,
    membershipId: e.membershipId,
    type: e.type,
    minute: e.minute,
    notes: e.notes,
    createdAt: e.createdAt,
    displayName: e.nickname ?? e.userName ?? e.userEmail?.split("@")[0] ?? "Jogador",
  }));

  return { match, roster: rows, teams: teamsWithPlayers, events };
}

export async function listRecentMatches(peladaId: string, limit = 5): Promise<Match[]> {
  return db
    .select()
    .from(matches)
    .where(eq(matches.peladaId, peladaId))
    .orderBy(desc(matches.scheduledFor))
    .limit(limit);
}

export async function listMatchRatings(matchId: string): Promise<PlayerRating[]> {
  return db.select().from(playerRatings).where(eq(playerRatings.matchId, matchId));
}
