/**
 * Player rating domain — the 0–10 subjective grade the referee/admin
 * gives to each player after a finished match.
 *
 * Pure domain — no DB, no Next.js. Used by the post-game scout screen and
 * by the ranking page (average rating column).
 */

import { z } from "zod";

export const MIN_RATING = 0;
export const MAX_RATING = 10;

export const playerRatingSchema = z.object({
  matchId: z.string().min(1, "Partida obrigatória."),
  membershipId: z.string().min(1, "Jogador obrigatório."),
  rating: z.coerce
    .number()
    .int("A nota deve ser um número inteiro.")
    .min(MIN_RATING, `Nota mínima é ${MIN_RATING}.`)
    .max(MAX_RATING, `Nota máxima é ${MAX_RATING}.`),
  notes: z
    .string()
    .max(500, "Comentário tem no máximo 500 caracteres.")
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
});

export type PlayerRatingInput = z.infer<typeof playerRatingSchema>;

/**
 * Maps a numeric 0–10 rating to a short adjective shown next to the score
 * in the post-game scout UI. Kept here so copy stays consistent across
 * screens.
 */
export function ratingLabel(value: number): string {
  if (value >= 9) return "Show de bola";
  if (value >= 7) return "Foi muito bem";
  if (value >= 5) return "Mediano";
  if (value >= 3) return "Apagado";
  return "Quebrou o time";
}

/**
 * Computes average rating across a player's ratings. Returns null when
 * there are no ratings yet (so callers can show "—" instead of "0.0").
 */
export function averageRating(ratings: Array<{ rating: number }>): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return sum / ratings.length;
}
