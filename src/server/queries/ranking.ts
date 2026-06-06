/**
 * Ranking queries — aggregated across all finished matches in a pelada.
 */

import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { type MatchEventType, matchEvents, matches, memberships, users } from "@/lib/db/schema";

export type RankingRow = {
  membershipId: string;
  displayName: string;
  shirtNumber: number | null;
  goals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
};

export async function getTopScorers(peladaId: string, limit = 50): Promise<RankingRow[]> {
  const rows = await db
    .select({
      membershipId: matchEvents.membershipId,
      type: matchEvents.type,
      count: count(matchEvents.id),
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matches.id, matchEvents.matchId))
    .where(and(eq(matches.peladaId, peladaId), eq(matches.status, "finished")))
    .groupBy(matchEvents.membershipId, matchEvents.type);

  const totals = new Map<string, Map<MatchEventType, number>>();
  for (const r of rows) {
    let bucket = totals.get(r.membershipId);
    if (!bucket) {
      bucket = new Map();
      totals.set(r.membershipId, bucket);
    }
    bucket.set(r.type, r.count);
  }

  const matchesPlayed = await db
    .selectDistinct({
      membershipId: matchEvents.membershipId,
      matchId: matchEvents.matchId,
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matches.id, matchEvents.matchId))
    .where(and(eq(matches.peladaId, peladaId), eq(matches.status, "finished")));

  const matchCount = new Map<string, number>();
  for (const r of matchesPlayed) {
    matchCount.set(r.membershipId, (matchCount.get(r.membershipId) ?? 0) + 1);
  }

  const membershipIds = Array.from(totals.keys());
  if (membershipIds.length === 0) return [];

  const memberRows = await db
    .select({
      membershipId: memberships.id,
      nickname: memberships.nickname,
      shirtNumber: memberships.shirtNumber,
      userName: users.name,
      userEmail: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.peladaId, peladaId), inArray(memberships.id, membershipIds)));

  const memberLookup = new Map(memberRows.map((m) => [m.membershipId, m]));

  const ranking: RankingRow[] = membershipIds.map((mid) => {
    const bucket = totals.get(mid) ?? new Map<MatchEventType, number>();
    const m = memberLookup.get(mid);
    return {
      membershipId: mid,
      displayName: m?.nickname ?? m?.userName ?? m?.userEmail?.split("@")[0] ?? "Jogador",
      shirtNumber: m?.shirtNumber ?? null,
      goals: bucket.get("goal") ?? 0,
      assists: bucket.get("assist") ?? 0,
      ownGoals: bucket.get("own_goal") ?? 0,
      yellowCards: bucket.get("yellow_card") ?? 0,
      redCards: bucket.get("red_card") ?? 0,
      matchesPlayed: matchCount.get(mid) ?? 0,
    };
  });

  ranking.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    return a.matchesPlayed - b.matchesPlayed;
  });

  return ranking.slice(0, limit);
}

export type PeladaStatsSummary = {
  matchesFinished: number;
  totalGoals: number;
  topScorerName: string | null;
  topScorerGoals: number;
};

export async function getPeladaStatsSummary(peladaId: string): Promise<PeladaStatsSummary> {
  const finishedRows = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.peladaId, peladaId), eq(matches.status, "finished")));

  const top = await getTopScorers(peladaId, 1);
  const topScorer = top[0] ?? null;

  let totalGoals = 0;
  for (const r of top) totalGoals += r.goals;
  if (top.length === 1) {
    const all = await getTopScorers(peladaId, 1000);
    totalGoals = all.reduce((acc, r) => acc + r.goals, 0);
  }

  return {
    matchesFinished: finishedRows.length,
    totalGoals,
    topScorerName: topScorer?.displayName ?? null,
    topScorerGoals: topScorer?.goals ?? 0,
  };
}
