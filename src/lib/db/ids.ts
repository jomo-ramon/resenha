/**
 * Branded ID types — prevent accidentally passing a UserId where a PeladaId
 * is expected, etc. Zero runtime cost; compile-time enforcement only.
 *
 * See ARCHITECTURE.md §5.2 and CODING_STANDARDS.md §4.2.
 */

declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type UserId = Brand<string, "UserId">;
export type PeladaId = Brand<string, "PeladaId">;
export type MembershipId = Brand<string, "MembershipId">;
export type MatchId = Brand<string, "MatchId">;
export type TeamId = Brand<string, "TeamId">;
export type RosterEntryId = Brand<string, "RosterEntryId">;
export type MatchEventId = Brand<string, "MatchEventId">;
export type PlayerRatingId = Brand<string, "PlayerRatingId">;
export type ResenhaId = Brand<string, "ResenhaId">;

// --- Constructors (use at trust boundaries: db reads, validated inputs) ---

export const asUserId = (value: string): UserId => value as UserId;
export const asPeladaId = (value: string): PeladaId => value as PeladaId;
export const asMembershipId = (value: string): MembershipId => value as MembershipId;
export const asMatchId = (value: string): MatchId => value as MatchId;
export const asTeamId = (value: string): TeamId => value as TeamId;
export const asRosterEntryId = (value: string): RosterEntryId => value as RosterEntryId;
export const asMatchEventId = (value: string): MatchEventId => value as MatchEventId;
export const asPlayerRatingId = (value: string): PlayerRatingId => value as PlayerRatingId;
export const asResenhaId = (value: string): ResenhaId => value as ResenhaId;
