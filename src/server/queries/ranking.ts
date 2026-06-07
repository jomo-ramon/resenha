/**
 * Ranking queries — aggregated across all finished matches in a pelada.
 *
 * The headline ranking sort is by total scout points (Cartola-style),
 * with average rating as tie-breaker context. Goals, assists, saves,
 * tackles and cards are kept as visible secondary columns so the UI
 * can show *why* a player is on top.
 */

import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  type MatchEventType,
  matchEvents,
  matches,
  memberships,
  type PeladaRules,
  playerRatings,
  users,
} from "@/lib/db/schema";
import { getEventPoints } from "@/lib/domain/scout";

export type RankingRow = {
  membershipId: string;
  displayName: string;
  shirtNumber: number | null;
  points: number;
  goals: number;
  assists: number;
  saves: number;
  tackles: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  averageRating: number | null;
  ratingCount: number;
};

export async function getRanking(
  peladaId: string,
  rules: PeladaRules | null,
  limit = 50,
): Promise<RankingRow[]> {
  const eventRows = await db
    .select({
      membershipId: matchEvents.membershipId,
      type: matchEvents.type,
      count: count(matchEvents.id),
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matches.id, matchEvents.matchId))
    .where(and(eq(matches.peladaId, peladaId), eq(matches.status, "finished")))
    .groupBy(matchEvents.membershipId, matchEvents.type);

  const ratingRows = await db
    .select({
      membershipId: playerRatings.membershipId,
      rating: playerRatings.rating,
    })
    .from(playerRatings)
    .innerJoin(matches, eq(matches.id, playerRatings.matchId))
    .where(and(eq(matches.peladaId, peladaId), eq(matches.status, "finished")));

  const totals = new Map<string, Map<MatchEventType, number>>();
  for (const r of eventRows) {
    let bucket = totals.get(r.membershipId);
    if (!bucket) {
      bucket = new Map();
      totals.set(r.membershipId, bucket);
    }
    bucket.set(r.type, r.count);
  }

  const ratingTotals = new Map<string, { sum: number; count: number }>();
  for (const r of ratingRows) {
    const cur = ratingTotals.get(r.membershipId) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    ratingTotals.set(r.membershipId, cur);
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

  const membershipIds = Array.from(new Set([...totals.keys(), ...ratingTotals.keys()]));
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
    const ratingAgg = ratingTotals.get(mid);

    let points = 0;
    for (const [type, c] of bucket) {
      points += getEventPoints(type, rules) * c;
    }

    return {
      membershipId: mid,
      displayName: m?.nickname ?? m?.userName ?? m?.userEmail?.split("@")[0] ?? "Jogador",
      shirtNumber: m?.shirtNumber ?? null,
      points,
      goals: bucket.get("goal") ?? 0,
      assists: bucket.get("assist") ?? 0,
      saves: bucket.get("save") ?? 0,
      tackles: bucket.get("tackle") ?? 0,
      ownGoals: bucket.get("own_goal") ?? 0,
      yellowCards: bucket.get("yellow_card") ?? 0,
      redCards: bucket.get("red_card") ?? 0,
      matchesPlayed: matchCount.get(mid) ?? 0,
      averageRating: ratingAgg ? ratingAgg.sum / ratingAgg.count : null,
      ratingCount: ratingAgg?.count ?? 0,
    };
  });

  ranking.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    return a.matchesPlayed - b.matchesPlayed;
  });

  return ranking.slice(0, limit);
}

/**
 * @deprecated use `getRanking` — kept temporarily for callers still on
 * the goals-only ranking; will be removed once everything has migrated.
 */
export const getTopScorers = getRanking;

export type PeladaStatsSummary = {
  matchesFinished: number;
  totalGoals: number;
  topScorerName: string | null;
  topScorerGoals: number;
};

export async function getPeladaStatsSummary(
  peladaId: string,
  rules: PeladaRules | null,
): Promise<PeladaStatsSummary> {
  const finishedRows = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.peladaId, peladaId), eq(matches.status, "finished")));

  const all = await getRanking(peladaId, rules, 1000);
  const topScorer = [...all].sort((a, b) => b.goals - a.goals)[0] ?? null;
  const totalGoals = all.reduce((acc, r) => acc + r.goals, 0);

  return {
    matchesFinished: finishedRows.length,
    totalGoals,
    topScorerName: topScorer?.displayName ?? null,
    topScorerGoals: topScorer?.goals ?? 0,
  };
}
