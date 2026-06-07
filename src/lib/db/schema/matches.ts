/**
 * Match aggregate: Match, RosterEntry, Team, TeamPlayer, MatchEvent.
 *
 * Match status is an FSM enforced in lib/domain/match-state-machine.ts.
 * See ARCHITECTURE.md §5.2 and §5.4.
 */

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { memberships, peladas } from "./peladas";

export type MatchStatus =
  | "scheduled"
  | "roster_open"
  | "teams_drafted"
  | "in_progress"
  | "finished"
  | "cancelled";

export type RosterEntryStatus = "confirmed" | "declined" | "waitlist";

export type MatchEventType =
  | "goal"
  | "own_goal"
  | "assist"
  | "save"
  | "tackle"
  | "yellow_card"
  | "red_card";

export const matches = pgTable("match", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  peladaId: text("peladaId")
    .notNull()
    .references(() => peladas.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduledFor", { mode: "date", withTimezone: true }).notNull(),
  locationOverride: text("locationOverride"),
  status: text("status").$type<MatchStatus>().notNull().default("scheduled"),
  activeRefereeId: text("activeRefereeId").references(() => memberships.id, {
    onDelete: "set null",
  }),
  finishedAt: timestamp("finishedAt", { mode: "date", withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const rosterEntries = pgTable(
  "rosterEntry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matchId: text("matchId")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    membershipId: text("membershipId")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    status: text("status").$type<RosterEntryStatus>().notNull(),
    listPosition: integer("listPosition").notNull(),
    respondedAt: timestamp("respondedAt", { mode: "date" }).notNull().defaultNow(),
    promotedFromWaitlistAt: timestamp("promotedFromWaitlistAt", { mode: "date" }),
  },
  (r) => [unique("rosterEntry_matchId_membershipId_unique").on(r.matchId, r.membershipId)],
);

export const teams = pgTable("team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("matchId")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  captainMembershipId: text("captainMembershipId")
    .notNull()
    .references(() => memberships.id, { onDelete: "restrict" }),
  finalScore: integer("finalScore"),
});

export const teamPlayers = pgTable(
  "teamPlayer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("teamId")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    membershipId: text("membershipId")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
  },
  (tp) => [unique("teamPlayer_teamId_membershipId_unique").on(tp.teamId, tp.membershipId)],
);

/**
 * playerRatings — subjective 0–10 grade that the referee/admin gives
 * to each player after a match. One rating per (match, player) pair.
 *
 * Pre-aggregated stats (goals/assists/etc) live in `matchEvents`; ratings
 * here are the human-judged complement that scout numbers can't capture
 * (positioning, work ethic, leadership). Used by the ranking page and,
 * later, by the team-draft balancer.
 */
export const playerRatings = pgTable(
  "playerRating",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matchId: text("matchId")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    membershipId: text("membershipId")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    notes: text("notes"),
    ratedByMembershipId: text("ratedByMembershipId")
      .notNull()
      .references(() => memberships.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (r) => [unique("playerRating_matchId_membershipId_unique").on(r.matchId, r.membershipId)],
);

export const matchEvents = pgTable("matchEvent", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: text("matchId")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  teamId: text("teamId")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  membershipId: text("membershipId")
    .notNull()
    .references(() => memberships.id, { onDelete: "restrict" }),
  type: text("type").$type<MatchEventType>().notNull(),
  minute: integer("minute"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export type Match = InferSelectModel<typeof matches>;
export type NewMatch = InferInsertModel<typeof matches>;
export type RosterEntry = InferSelectModel<typeof rosterEntries>;
export type NewRosterEntry = InferInsertModel<typeof rosterEntries>;
export type Team = InferSelectModel<typeof teams>;
export type NewTeam = InferInsertModel<typeof teams>;
export type TeamPlayer = InferSelectModel<typeof teamPlayers>;
export type MatchEvent = InferSelectModel<typeof matchEvents>;
export type NewMatchEvent = InferInsertModel<typeof matchEvents>;
export type PlayerRating = InferSelectModel<typeof playerRatings>;
export type NewPlayerRating = InferInsertModel<typeof playerRatings>;
