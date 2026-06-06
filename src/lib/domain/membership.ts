/**
 * Membership profile domain — what the player can edit about themselves.
 * Admin role changes / removals live elsewhere (out of scope for F1).
 */

import { z } from "zod";
import type { PreferredPosition } from "@/lib/db/schema";

export const preferredPositionSchema = z.enum([
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
  "outfield",
]);

export const PREFERRED_POSITION_LABELS: Record<PreferredPosition, string> = {
  goalkeeper: "Goleiro",
  defender: "Zagueiro",
  midfielder: "Meio-campo",
  forward: "Atacante",
  outfield: "Linha (sem preferência)",
};

export const updateMembershipProfileSchema = z.object({
  nickname: z.string().trim().max(30, "Apelido muito longo.").optional().or(z.literal("")),
  shirtNumber: z.union([z.literal(""), z.coerce.number().int().min(0).max(99)]).optional(),
  preferredPosition: preferredPositionSchema,
});

export type UpdateMembershipProfileInput = z.infer<typeof updateMembershipProfileSchema>;
