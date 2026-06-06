"use server";

/**
 * draftTeams — admin commits the manual team partition for a match.
 *
 * One-shot atomic transaction:
 *   1. Validates roster membership (every assigned id is currently
 *      in `confirmed` status for this match).
 *   2. Validates partition (no duplicates, captain in team, etc.).
 *   3. Deletes any existing teams/teamPlayers for the match.
 *   4. Inserts both teams and their players.
 *   5. Moves match status to `teams_drafted`.
 *
 * Re-running this action re-drafts cleanly. Match must be in
 * `roster_open` or `teams_drafted` to allow drafting.
 */

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { matches, rosterEntries, teamPlayers, teams } from "@/lib/db/schema";
import {
  type DraftTeamsInput,
  draftTeamsInputSchema,
  TEAM_DARK,
  TEAM_LIGHT,
} from "@/lib/domain/team-draft";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";

export type DraftTeamsState = {
  status: "idle" | "error";
  message?: string;
};

function parseJsonPayload(formData: FormData): unknown {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function draftTeamsAction(
  slug: string,
  matchId: string,
  _prev: DraftTeamsState,
  formData: FormData,
): Promise<DraftTeamsState> {
  let shouldRedirect = false;

  try {
    const ctx = await getPeladaContext(slug);
    assertRole(ctx, "admin");

    const payload = parseJsonPayload(formData);
    const parsed = draftTeamsInputSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Sorteio inválido.",
      };
    }
    const input: DraftTeamsInput = parsed.data;

    await db.transaction(async (tx) => {
      const [match] = await tx
        .select({ id: matches.id, status: matches.status })
        .from(matches)
        .where(and(eq(matches.id, matchId), eq(matches.peladaId, ctx.pelada.id)))
        .limit(1);

      if (!match) throw new NotFoundError("Match", matchId);
      if (match.status !== "roster_open" && match.status !== "teams_drafted") {
        throw new ConflictError("Essa partida não está aceitando sorteio agora.");
      }

      const allAssigned = [...input.light.members, ...input.dark.members];
      const confirmedRows = await tx
        .select({ id: rosterEntries.membershipId })
        .from(rosterEntries)
        .where(
          and(
            eq(rosterEntries.matchId, matchId),
            eq(rosterEntries.status, "confirmed"),
            inArray(rosterEntries.membershipId, allAssigned),
          ),
        );
      const confirmedSet = new Set(confirmedRows.map((r) => r.id));
      const notConfirmed = allAssigned.filter((id) => !confirmedSet.has(id));
      if (notConfirmed.length > 0) {
        throw new ConflictError(
          "Tem jogador no sorteio que não está confirmado. Atualiza a lista e tenta de novo.",
        );
      }

      await tx
        .delete(teamPlayers)
        .where(
          inArray(
            teamPlayers.teamId,
            tx.select({ id: teams.id }).from(teams).where(eq(teams.matchId, matchId)),
          ),
        );
      await tx.delete(teams).where(eq(teams.matchId, matchId));

      const [lightTeam] = await tx
        .insert(teams)
        .values({
          matchId,
          name: TEAM_LIGHT.name,
          color: TEAM_LIGHT.color,
          captainMembershipId: input.light.captainMembershipId,
        })
        .returning({ id: teams.id });

      const [darkTeam] = await tx
        .insert(teams)
        .values({
          matchId,
          name: TEAM_DARK.name,
          color: TEAM_DARK.color,
          captainMembershipId: input.dark.captainMembershipId,
        })
        .returning({ id: teams.id });

      if (!lightTeam || !darkTeam) {
        throw new AppError("failed to create teams", "INSERT_FAILED");
      }

      await tx
        .insert(teamPlayers)
        .values([
          ...input.light.members.map((mid) => ({ teamId: lightTeam.id, membershipId: mid })),
          ...input.dark.members.map((mid) => ({ teamId: darkTeam.id, membershipId: mid })),
        ]);

      await tx.update(matches).set({ status: "teams_drafted" }).where(eq(matches.id, matchId));
    });

    revalidatePath(`/p/${slug}/m/${matchId}`);
    revalidatePath(`/p/${slug}`);
    shouldRedirect = true;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { status: "error", message: "Partida não encontrada." };
    }
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "Só admins sorteiam os times." };
    }
    if (error instanceof ConflictError) {
      return { status: "error", message: error.message };
    }
    if (error instanceof AppError) {
      return { status: "error", message: "Não foi possível salvar o sorteio." };
    }
    throw error;
  }

  if (shouldRedirect) {
    redirect(`/p/${slug}/m/${matchId}`);
  }

  return { status: "idle" };
}
