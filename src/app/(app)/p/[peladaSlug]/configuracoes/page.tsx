/**
 * /p/[slug]/configuracoes — pelada-level settings.
 *
 * For now: scoring weights for the ranking (eventPoints in PeladaRules).
 * Later this is where editing name/day/location and managing members
 * will land too.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui";
import type { MatchEventType } from "@/lib/db/schema";
import { MATCH_EVENT_EMOJI, MATCH_EVENT_LABELS } from "@/lib/domain/match-event";
import { DEFAULT_EVENT_POINTS } from "@/lib/domain/scout";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { RulesForm } from "./rules-form";

type Params = Promise<{ peladaSlug: string }>;

export const metadata: Metadata = {
  title: "Configurações — resenha",
};

const EVENT_ORDER: MatchEventType[] = [
  "goal",
  "assist",
  "save",
  "tackle",
  "yellow_card",
  "red_card",
  "own_goal",
];

export default async function ConfiguracoesPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
    throw error;
  }

  if (ctx.membership.role !== "admin") {
    redirect(`/p/${peladaSlug}`);
  }

  const currentPoints = ctx.pelada.rules?.eventPoints ?? {};

  const items = EVENT_ORDER.map((type) => ({
    type,
    label: MATCH_EVENT_LABELS[type],
    emoji: MATCH_EVENT_EMOJI[type],
    current: currentPoints[type] ?? DEFAULT_EVENT_POINTS[type],
    defaultValue: DEFAULT_EVENT_POINTS[type],
    isCustom:
      currentPoints[type] !== undefined && currentPoints[type] !== DEFAULT_EVENT_POINTS[type],
  }));

  return (
    <div className="space-y-5">
      <Link
        href={`/p/${peladaSlug}`}
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-muted)] underline-offset-4 hover:text-[color:var(--color-brand)] hover:underline"
      >
        ← Voltar pra pelada
      </Link>

      <header className="space-y-1">
        <Badge tone="info" size="sm">
          Admin
        </Badge>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">⚙️ Configurações</h1>
        <p className="text-sm text-[color:var(--color-ink-soft)]">
          Quantos pontos vale cada ação no ranking. Cartões e gol contra podem ser negativos. Deixe
          em branco pra usar o padrão do app.
        </p>
      </header>

      <RulesForm slug={peladaSlug} items={items} />
    </div>
  );
}
