import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { getNextUpcomingMatch } from "@/server/queries/matches";
import { InvitePanel } from "./invite-panel";

type Params = Promise<{ peladaSlug: string }>;

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  referee: "Juiz",
  player: "Jogador",
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { peladaSlug } = await params;
  return { title: `${peladaSlug} — resenha` };
}

export default async function PeladaDashboardPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
    throw error;
  }

  const { pelada, membership } = ctx;
  const upcoming = await getNextUpcomingMatch(pelada.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Pelada</p>
          <h1 className="truncate text-3xl font-bold tracking-tight">{pelada.name}</h1>
          {pelada.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{pelada.description}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {ROLE_LABELS[membership.role] ?? membership.role}
        </span>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Quando e onde
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Info label="Dia">{WEEKDAY_LABELS[pelada.weekday] ?? pelada.weekday}</Info>
          <Info label="Horário">{pelada.startTime}</Info>
          <Info label="Local">{pelada.location}</Info>
          <Info label="Capacidade">Até {pelada.maxPlayers} jogadores</Info>
        </dl>
        {pelada.address && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{pelada.address}</p>
        )}
      </section>

      <UpcomingMatchSection
        slug={pelada.slug}
        maxPlayers={pelada.maxPlayers}
        isAdmin={membership.role === "admin"}
        upcoming={upcoming}
      />

      {membership.role === "admin" && (
        <InvitePanel slug={pelada.slug} inviteToken={pelada.inviteToken} />
      )}
    </div>
  );
}

function UpcomingMatchSection({
  slug,
  maxPlayers,
  isAdmin,
  upcoming,
}: {
  slug: string;
  maxPlayers: number;
  isAdmin: boolean;
  upcoming: Awaited<ReturnType<typeof getNextUpcomingMatch>>;
}) {
  if (!upcoming) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <h2 className="text-lg font-semibold">Nenhuma partida agendada</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {isAdmin
            ? "Agenda a próxima e abre a lista de presença pra galera."
            : "Quando o admin agendar, ela aparece aqui."}
        </p>
        {isAdmin && (
          <Link
            href={`/p/${slug}/nova-partida`}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Agendar partida
          </Link>
        )}
      </section>
    );
  }

  const { match, confirmedCount, waitlistCount } = upcoming;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Próxima partida
          </h2>
          <p className="mt-1 text-lg font-semibold first-letter:capitalize">
            {MATCH_DATE_FORMATTER.format(match.scheduledFor)}
          </p>
          {match.locationOverride && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{match.locationOverride}</p>
          )}
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold">{confirmedCount}</span>
            <span className="text-zinc-500"> / {maxPlayers} confirmados</span>
            {waitlistCount > 0 && (
              <span className="text-zinc-500"> · {waitlistCount} na espera</span>
            )}
          </p>
        </div>
        <Link
          href={`/p/${slug}/m/${match.id}`}
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Abrir
        </Link>
      </div>

      {isAdmin && (
        <div className="mt-4 text-right">
          <Link
            href={`/p/${slug}/nova-partida`}
            className="text-xs text-zinc-500 underline-offset-4 hover:underline"
          >
            + Agendar outra partida
          </Link>
        </div>
      )}
    </section>
  );
}

const MATCH_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-base font-medium">{children}</dd>
    </div>
  );
}
