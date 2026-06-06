/**
 * Match domain — pure validation + FSM helpers. NO Drizzle, NO Next, NO Auth.
 */

import { z } from "zod";
import type { MatchStatus } from "@/lib/db/schema";

/**
 * Form input — datetime-local value (e.g. "2026-06-08T16:00"). Parsed
 * as the user's local time, then stored as a UTC timestamp.
 */
export const createMatchInputSchema = z.object({
  scheduledFor: z
    .string()
    .min(1, "Escolhe data e hora.")
    .refine((s) => !Number.isNaN(Date.parse(s)), { message: "Data/hora inválida." })
    .refine(
      (s) => {
        const date = new Date(s);
        return date.getTime() > Date.now() - 60_000;
      },
      { message: "A partida não pode ser no passado." },
    ),
  locationOverride: z.string().trim().max(120, "Local muito longo.").optional().or(z.literal("")),
  notes: z.string().trim().max(280, "Observação muito longa.").optional().or(z.literal("")),
});

export type CreateMatchInput = z.infer<typeof createMatchInputSchema>;

/**
 * Allowed status transitions. Used both by guards in the domain and
 * (in F1) by referee mode in a later block.
 */
const TRANSITIONS: Record<MatchStatus, readonly MatchStatus[]> = {
  scheduled: ["roster_open", "cancelled"],
  roster_open: ["teams_drafted", "cancelled"],
  teams_drafted: ["in_progress", "roster_open", "cancelled"],
  in_progress: ["finished"],
  finished: [],
  cancelled: [],
};

export function canTransition(from: MatchStatus, to: MatchStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * True while members can confirm/decline attendance. Currently mirrors
 * roster_open; kept as a function so we can revisit (e.g. allow last-
 * minute swaps during teams_drafted).
 */
export function isRosterAcceptingResponses(status: MatchStatus): boolean {
  return status === "roster_open";
}

/**
 * True while the admin is still allowed to cancel a match without
 * disturbing match history (no teams sorted, no events recorded).
 */
export function canCancelMatch(status: MatchStatus): boolean {
  return status === "scheduled" || status === "roster_open";
}
