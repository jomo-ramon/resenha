import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MatchCard } from "@/components/domain/match-card";
import { ButtonLink, EmptyState } from "@/components/ui";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { listMatches } from "@/server/queries/matches";

type Params = Promise<{ peladaSlug: string }>;

export const metadata: Metadata = {
  title: "Partidas — resenha",
};

export default async function PartidasPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
    throw error;
  }

  const upcoming = await listMatches(ctx.pelada.id, {
    status: ["scheduled", "roster_open", "teams_drafted", "in_progress"],
  });
  const past = await listMatches(ctx.pelada.id, {
    status: ["finished", "cancelled"],
    limit: 30,
  });

  const isAdmin = ctx.membership.role === "admin";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
            {ctx.pelada.name}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Partidas</h1>
        </div>
        {isAdmin && (
          <ButtonLink
            href={`/p/${peladaSlug}/nova-partida`}
            variant="primary"
            size="md"
            leadingIcon={<span aria-hidden="true">+</span>}
          >
            Nova partida
          </ButtonLink>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
          Próximas ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon />}
            title="Nenhuma partida agendada"
            description={
              isAdmin ? "Bora marcar a próxima rachado?" : "Aguarda o admin marcar a próxima."
            }
            action={
              isAdmin && (
                <ButtonLink href={`/p/${peladaSlug}/nova-partida`} variant="primary" size="md">
                  Agendar partida
                </ButtonLink>
              )
            }
          />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((m) => (
              <li key={m.match.id}>
                <MatchCard
                  match={m.match}
                  peladaSlug={peladaSlug}
                  confirmedCount={m.confirmedCount}
                  maxPlayers={ctx.pelada.maxPlayers}
                  highlight={m === upcoming[0]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
            Histórico ({past.length})
          </h2>
          <ul className="space-y-3">
            {past.map((m) => (
              <li key={m.match.id}>
                <MatchCard
                  match={m.match}
                  peladaSlug={peladaSlug}
                  confirmedCount={m.confirmedCount}
                  maxPlayers={ctx.pelada.maxPlayers}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Sem partidas</title>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}
