/**
 * Match event domain — what the referee can record during a match.
 */

import { z } from "zod";
import type { MatchEventType } from "@/lib/db/schema";

export const matchEventTypeSchema = z.enum([
  "goal",
  "own_goal",
  "assist",
  "yellow_card",
  "red_card",
]);

export const MATCH_EVENT_LABELS: Record<MatchEventType, string> = {
  goal: "Gol",
  own_goal: "Gol contra",
  assist: "Assistência",
  yellow_card: "Cartão amarelo",
  red_card: "Cartão vermelho",
};

export const addMatchEventInputSchema = z.object({
  teamId: z.string().min(1, "Time obrigatório."),
  membershipId: z.string().min(1, "Jogador obrigatório."),
  type: matchEventTypeSchema,
  minute: z.coerce.number().int().min(0).max(180).optional().nullable(),
});

export type AddMatchEventInput = z.infer<typeof addMatchEventInputSchema>;

/**
 * Computes the live score from a list of events.
 * - `goal` for team X: +1 for X
 * - `own_goal` for team X: +1 for the OTHER team (the team that benefits)
 *
 * F1 convention: when the referee records an own_goal, they tag the
 * scorer's own team. The point goes to the opposing team automatically.
 */
export function computeScore(
  events: Array<{ teamId: string; type: MatchEventType }>,
  lightTeamId: string,
  darkTeamId: string,
): { light: number; dark: number } {
  let light = 0;
  let dark = 0;
  for (const e of events) {
    if (e.type === "goal") {
      if (e.teamId === lightTeamId) light++;
      else if (e.teamId === darkTeamId) dark++;
    } else if (e.type === "own_goal") {
      if (e.teamId === lightTeamId) dark++;
      else if (e.teamId === darkTeamId) light++;
    }
  }
  return { light, dark };
}
