/**
 * Scout / pontuação — turns a list of match events into per-player points.
 *
 * Pure domain code: no DB or framework deps so it stays trivially testable
 * and can be reused by ranking queries, match highlights, and the future
 * team-balancing algorithm.
 *
 * Each pelada can override `DEFAULT_EVENT_POINTS` via `peladaRules.eventPoints`
 * (admin → /configuracoes). Missing keys in the override fall back to the
 * default so partial customization is safe.
 */

import type { MatchEventType } from "@/lib/db/schema";
import type { PeladaRules } from "@/lib/db/schema/peladas";

/**
 * Default point weights — chosen to feel familiar to Cartola FC players
 * while staying simple enough that the math holds up in a pelada.
 *
 * Tweak with care: changing defaults retroactively re-scores every past
 * match in the ranking.
 */
export const DEFAULT_EVENT_POINTS: Record<MatchEventType, number> = {
  goal: 8,
  assist: 5,
  save: 3,
  tackle: 1,
  yellow_card: -2,
  red_card: -5,
  own_goal: -3,
};

/**
 * Resolves the effective point weight for an event type given a pelada's
 * (possibly partial) override.
 */
export function getEventPoints(
  type: MatchEventType,
  rules: PeladaRules | null | undefined,
): number {
  const override = rules?.eventPoints?.[type];
  return typeof override === "number" ? override : DEFAULT_EVENT_POINTS[type];
}

export type ScoutEvent = {
  membershipId: string;
  type: MatchEventType;
};

/**
 * Aggregates points by player. Iterates events once and returns a Map keyed
 * by membershipId. Players with zero events don't appear in the map.
 */
export function computePoints(
  events: ScoutEvent[],
  rules: PeladaRules | null | undefined,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of events) {
    const pts = getEventPoints(e.type, rules);
    out.set(e.membershipId, (out.get(e.membershipId) ?? 0) + pts);
  }
  return out;
}

/**
 * Per-player aggregated counts. Useful for the scout post-game screen and
 * ranking tables that need to show "5⚽ 2🅰 1🟨" rather than just total
 * points.
 */
export type PlayerEventCounts = {
  goal: number;
  own_goal: number;
  assist: number;
  save: number;
  tackle: number;
  yellow_card: number;
  red_card: number;
  totalPoints: number;
};

export function emptyCounts(): PlayerEventCounts {
  return {
    goal: 0,
    own_goal: 0,
    assist: 0,
    save: 0,
    tackle: 0,
    yellow_card: 0,
    red_card: 0,
    totalPoints: 0,
  };
}

export function aggregateCounts(
  events: ScoutEvent[],
  rules: PeladaRules | null | undefined,
): Map<string, PlayerEventCounts> {
  const out = new Map<string, PlayerEventCounts>();
  for (const e of events) {
    let bucket = out.get(e.membershipId);
    if (!bucket) {
      bucket = emptyCounts();
      out.set(e.membershipId, bucket);
    }
    bucket[e.type] += 1;
    bucket.totalPoints += getEventPoints(e.type, rules);
  }
  return out;
}
