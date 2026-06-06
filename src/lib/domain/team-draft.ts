/**
 * Team draft domain — manual side-picking for a match.
 *
 * F1 fixes the team count at 2 (Time Claro / Time Escuro). The schema
 * supports N teams; refactor when that demand actually shows up.
 */

import { z } from "zod";

export type TeamSlug = "light" | "dark";

export const TEAM_LIGHT = {
  slug: "light" as TeamSlug,
  name: "Time Claro",
  color: "#f4f4f5", // zinc-100
  textOn: "dark" as const,
};

export const TEAM_DARK = {
  slug: "dark" as TeamSlug,
  name: "Time Escuro",
  color: "#18181b", // zinc-900
  textOn: "light" as const,
};

export const TEAMS = [TEAM_LIGHT, TEAM_DARK] as const;

const teamAssignmentSchema = z.object({
  members: z.array(z.string().min(1)).min(1, "Cada time precisa ter ao menos 1 jogador."),
  captainMembershipId: z.string().min(1, "Cada time precisa de um capitão."),
});

export const draftTeamsInputSchema = z
  .object({
    light: teamAssignmentSchema,
    dark: teamAssignmentSchema,
  })
  .refine((data) => data.light.members.includes(data.light.captainMembershipId), {
    message: "Capitão do time claro precisa estar no time claro.",
    path: ["light", "captainMembershipId"],
  })
  .refine((data) => data.dark.members.includes(data.dark.captainMembershipId), {
    message: "Capitão do time escuro precisa estar no time escuro.",
    path: ["dark", "captainMembershipId"],
  })
  .refine(
    (data) => {
      const intersection = data.light.members.filter((id) => data.dark.members.includes(id));
      return intersection.length === 0;
    },
    {
      message: "Tem jogador em mais de um time.",
      path: ["light", "members"],
    },
  );

export type DraftTeamsInput = z.infer<typeof draftTeamsInputSchema>;

/**
 * Builds the team partition from a flat assignment map. The pool param
 * is the set of confirmed memberships eligible to be drafted.
 *
 * Returns an Err result with a message when validation fails so callers
 * can surface it directly to the UI.
 */
export function buildDraftFromAssignments(
  pool: readonly string[],
  assignments: Record<string, TeamSlug | null>,
  captains: { light: string | null; dark: string | null },
): { ok: true; input: DraftTeamsInput } | { ok: false; message: string } {
  const lightMembers: string[] = [];
  const darkMembers: string[] = [];

  for (const membershipId of pool) {
    const team = assignments[membershipId];
    if (team === "light") lightMembers.push(membershipId);
    else if (team === "dark") darkMembers.push(membershipId);
  }

  if (lightMembers.length === 0 || darkMembers.length === 0) {
    return { ok: false, message: "Cada time precisa ter ao menos 1 jogador." };
  }

  const lightCaptain = captains.light ?? lightMembers[0];
  const darkCaptain = captains.dark ?? darkMembers[0];

  if (!lightCaptain || !darkCaptain) {
    return { ok: false, message: "Não foi possível definir os capitães." };
  }

  const parsed = draftTeamsInputSchema.safeParse({
    light: { members: lightMembers, captainMembershipId: lightCaptain },
    dark: { members: darkMembers, captainMembershipId: darkCaptain },
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Sorteio inválido." };
  }

  return { ok: true, input: parsed.data };
}
