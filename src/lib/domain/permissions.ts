/**
 * Permission predicates — pure functions used by both server actions
 * (authorization) and UI (gating buttons / panels).
 *
 * Domain rule (in plain words):
 *   - Admin: can do everything in the pelada.
 *   - Juiz of a match: is the membership in `match.activeRefereeId`.
 *     Has full referee powers on THAT match only.
 *   - When `match.activeRefereeId` is null, any admin can referee as
 *     fallback so a match can always be played.
 *
 * `referee` is NOT a perpetual role — it's a per-match designation
 * picked by the admin (see ARCHITECTURE.md §5.4).
 */

import type { Match } from "@/lib/db/schema/matches";
import type { Membership } from "@/lib/db/schema/peladas";

/**
 * True if this membership is allowed to officiate this match — i.e.
 * start, register events, edit scout, finish.
 */
export function canRefereeMatch(
  membership: Membership,
  match: Pick<Match, "activeRefereeId">,
): boolean {
  if (match.activeRefereeId === membership.id) return true;
  if (membership.role === "admin" && match.activeRefereeId === null) return true;
  return false;
}

/**
 * True if this membership is the explicitly designated juiz of the match.
 * Used to decide whether to show the "🟢 Juiz: você" badge in the UI and
 * to block the juiz from confirming attendance.
 */
export function isDesignatedReferee(
  membership: Membership,
  match: Pick<Match, "activeRefereeId">,
): boolean {
  return match.activeRefereeId !== null && match.activeRefereeId === membership.id;
}

/**
 * True if this membership can change the designated juiz on this match.
 * Only admins can — and only before the match is finished or cancelled.
 */
export function canAssignReferee(membership: Membership, match: Pick<Match, "status">): boolean {
  if (membership.role !== "admin") return false;
  return match.status !== "finished" && match.status !== "cancelled";
}
