/**
 * /p/[slug]/m/[matchId]/scout — Post-game scout & ratings editor.
 *
 * Restricted to admin/referee. Lets the rater (a) tweak the per-player
 * event counts (goals, assists, saves, tackles, cards, own goals) and
 * (b) give each player a 0-10 rating with optional notes. All saved
 * via a single Server Action call (`saveMatchScoutAction`).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui";
import { canRefereeMatch } from "@/lib/domain/permissions";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { getMatchWithRoster, listMatchRatings } from "@/server/queries/matches";
import { ScoutForm, type ScoutPlayerInit } from "./scout-form";

type Params = Promise<{ peladaSlug: string; matchId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { peladaSlug } = await params;
  return { title: `Scout — ${peladaSlug} — resenha` };
}

export default async function ScoutPage({ params }: { params: Params }) {
  const { peladaSlug, matchId } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
    throw error;
  }

  const detail = await getMatchWithRoster(ctx.pelada.id, matchId);
  if (!detail) notFound();

  if (!canRefereeMatch(ctx.membership, detail.match)) {
    redirect(`/p/${peladaSlug}/m/${matchId}`);
  }
  if (detail.match.status !== "finished") {
    redirect(`/p/${peladaSlug}/m/${matchId}`);
  }

  const ratings = await listMatchRatings(matchId);
  const ratingLookup = new Map(ratings.map((r) => [r.membershipId, r]));

  const players: ScoutPlayerInit[] = [];
  for (const t of detail.teams) {
    for (const mid of t.playerMembershipIds) {
      const rosterRow = detail.roster.find((r) => r.membershipId === mid);
      if (!rosterRow) continue;
      const events = detail.events.filter((e) => e.membershipId === mid);
      const counts = {
        goal: 0,
        assist: 0,
        save: 0,
        tackle: 0,
        yellow_card: 0,
        red_card: 0,
        own_goal: 0,
      };
      for (const e of events) counts[e.type] += 1;

      const rating = ratingLookup.get(mid);
      players.push({
        membershipId: mid,
        teamId: t.team.id,
        teamName: t.team.name,
        displayName: rosterRow.displayName,
        counts,
        rating: rating?.rating ?? null,
        notes: rating?.notes ?? "",
      });
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/p/${peladaSlug}/m/${matchId}`}
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-muted)] underline-offset-4 hover:text-[color:var(--color-brand)] hover:underline"
      >
        ← Voltar pra partida
      </Link>

      <header className="space-y-1">
        <Badge tone="info" size="sm">
          Scout pós-jogo
        </Badge>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Dê notas e ajuste o scout
        </h1>
        <p className="text-sm text-[color:var(--color-ink-soft)]">
          Use o scout pra refinar o que rolou em campo. Ajuste contadores se algo passou batido
          durante a partida e dê uma nota de 0 a 10 pra cada jogador (opcional). Tudo conta pro
          ranking.
        </p>
      </header>

      <ScoutForm slug={peladaSlug} matchId={matchId} players={players} />
    </div>
  );
}
