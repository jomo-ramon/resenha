/**
 * Pelada (tenant) + Membership (User ↔ Pelada).
 *
 * `Pelada` is the tenant. Every query in the app filters by pelada
 * via `Membership` of the current user.
 *
 * See ARCHITECTURE.md §5.2 and §6.3.
 */

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./auth";

export type Sport = "football";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/**
 * Membership role — perpetual position in the pelada.
 *
 * `referee` is NOT a role here: refereeing is per-match, set on
 * `matches.activeRefereeId` by the admin. A "juiz" is just a player
 * the admin picked to officiate that one match.
 */
export type MembershipRole = "admin" | "player";

export type MembershipStatus = "active" | "inactive" | "invited";

export type PreferredPosition = "goalkeeper" | "defender" | "midfielder" | "forward" | "outfield";

/**
 * Per-pelada configurable rules. Kept as JSONB so we can evolve the shape
 * without migrations. Validated at the application boundary with Zod.
 *
 * `eventPoints` overrides the default per-event score (DEFAULT_EVENT_POINTS
 * in lib/domain/scout.ts). Any missing key falls back to the default —
 * admins only override what they want different.
 */
export type PeladaRules = {
  matchDurationMinutes?: number;
  teamsPerMatch?: number;
  pointsForWin?: number;
  pointsForDraw?: number;
  eventPoints?: Partial<
    Record<"goal" | "own_goal" | "assist" | "save" | "tackle" | "yellow_card" | "red_card", number>
  >;
};

export const peladas = pgTable("pelada", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  sport: text("sport").$type<Sport>().notNull().default("football"),
  weekday: text("weekday").$type<Weekday>().notNull(),
  startTime: text("startTime").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  maxPlayers: integer("maxPlayers").notNull().default(20),
  rules: jsonb("rules").$type<PeladaRules>().notNull().default({}),
  /**
   * Public-link invite token. Rotating it revokes the previous link.
   * Validated together with the slug in the accept-invite flow.
   */
  inviteToken: text("inviteToken")
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
  ownerUserId: text("ownerUserId")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "membership",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    peladaId: text("peladaId")
      .notNull()
      .references(() => peladas.id, { onDelete: "cascade" }),
    role: text("role").$type<MembershipRole>().notNull().default("player"),
    nickname: text("nickname"),
    shirtNumber: integer("shirtNumber"),
    preferredPosition: text("preferredPosition")
      .$type<PreferredPosition>()
      .notNull()
      .default("outfield"),
    status: text("status").$type<MembershipStatus>().notNull().default("active"),
    joinedAt: timestamp("joinedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (m) => [unique("membership_userId_peladaId_unique").on(m.userId, m.peladaId)],
);

export type Pelada = InferSelectModel<typeof peladas>;
export type NewPelada = InferInsertModel<typeof peladas>;
export type Membership = InferSelectModel<typeof memberships>;
export type NewMembership = InferInsertModel<typeof memberships>;
