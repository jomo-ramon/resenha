import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, BallGlyph, ButtonLink, Card, EmptyState, MatchStatusBadge } from "@/components/ui";
import { auth } from "@/lib/auth";
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

  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "você";

  const { pelada, membership } = ctx;
  const upcoming = await getNextUpcomingMatch(pelada.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-brand)] text-white shadow-[var(--shadow-brand)]">
          <BallGlyph size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
            Olá, {firstName} 👋
          </p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{pelada.name}</h1>
        </div>
        <Badge tone={membership.role === "admin" ? "brand" : "neutral"} size="sm">
          {ROLE_LABELS[membership.role] ?? membership.role}
        </Badge>
      </div>

      {pelada.description && (
        <p className="-mt-2 text-sm text-[color:var(--color-ink-soft)]">{pelada.description}</p>
      )}

      <UpcomingMatchCard
        slug={pelada.slug}
        maxPlayers={pelada.maxPlayers}
        isAdmin={membership.role === "admin"}
        upcoming={upcoming}
        defaultLocation={pelada.location}
      />

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
          Atalhos
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ShortcutCard href={`/p/${pelada.slug}/partidas`} label="Partidas" emoji="📅" />
          <ShortcutCard href={`/p/${pelada.slug}/ranking`} label="Ranking" emoji="🏆" />
          <ShortcutCard href={`/p/${pelada.slug}/perfil`} label="Meu perfil" emoji="👤" />
          {membership.role === "admin" ? (
            <ShortcutCard
              href={`/p/${pelada.slug}/nova-partida`}
              label="Nova partida"
              emoji="➕"
              tone="brand"
            />
          ) : (
            <ShortcutCard href="/peladas" label="Trocar pelada" emoji="🔁" />
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
          Quando e onde
        </h2>
        <Card>
          <dl className="grid gap-3 p-5 sm:grid-cols-2">
            <Info label="Dia">{WEEKDAY_LABELS[pelada.weekday] ?? pelada.weekday}</Info>
            <Info label="Horário">{pelada.startTime}</Info>
            <Info label="Local">{pelada.location}</Info>
            <Info label="Capacidade">{pelada.maxPlayers} jogadores</Info>
          </dl>
          {pelada.address && (
            <p className="border-t border-[color:var(--color-border)] px-5 py-3 text-xs text-[color:var(--color-ink-soft)]">
              📍 {pelada.address}
            </p>
          )}
        </Card>
      </section>

      {membership.role === "admin" && (
        <InvitePanel slug={pelada.slug} inviteToken={pelada.inviteToken} />
      )}
    </div>
  );
}

function ShortcutCard({
  href,
  label,
  emoji,
  tone = "default",
}: {
  href: string;
  label: string;
  emoji: string;
  tone?: "default" | "brand";
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all hover:shadow-[var(--shadow-md)] ${
        tone === "brand"
          ? "border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-ink)]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink)]"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-bold">{label}</span>
    </Link>
  );
}

function UpcomingMatchCard({
  slug,
  maxPlayers,
  isAdmin,
  upcoming,
  defaultLocation,
}: {
  slug: string;
  maxPlayers: number;
  isAdmin: boolean;
  upcoming: Awaited<ReturnType<typeof getNextUpcomingMatch>>;
  defaultLocation: string;
}) {
  if (!upcoming) {
    return (
      <EmptyState
        icon={
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
            <title>Sem partida</title>
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        }
        title="Nenhuma partida agendada"
        description={
          isAdmin
            ? "Bora marcar a próxima e abrir a lista pra galera."
            : "Quando o admin agendar, ela aparece aqui."
        }
        action={
          isAdmin && (
            <ButtonLink href={`/p/${slug}/nova-partida`} variant="primary" size="md">
              Agendar partida
            </ButtonLink>
          )
        }
      />
    );
  }

  const { match, confirmedCount, waitlistCount } = upcoming;
  const dateLabel = MATCH_DATE_FORMATTER.format(match.scheduledFor);
  const pct = Math.min(100, Math.round((confirmedCount / maxPlayers) * 100));

  return (
    <section className="overflow-hidden rounded-3xl border border-[color:var(--color-brand)]/30 bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-md)]">
      <div className="bg-brand-gradient px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/85">
            Próxima partida
          </p>
          <MatchStatusBadge status={match.status} />
        </div>
        <p className="mt-1 text-2xl font-extrabold leading-tight tracking-tight first-letter:capitalize">
          {dateLabel}
        </p>
        <p className="mt-1 text-sm text-white/85">📍 {match.locationOverride ?? defaultLocation}</p>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="flex items-baseline justify-between">
            <div className="space-x-1">
              <span className="text-2xl font-extrabold tabular-nums text-[color:var(--color-ink)]">
                {confirmedCount}
              </span>
              <span className="text-sm text-[color:var(--color-ink-muted)]">
                / {maxPlayers} confirmados
              </span>
            </div>
            {waitlistCount > 0 && (
              <Badge tone="warning" size="sm">
                +{waitlistCount} na espera
              </Badge>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
            <div
              className="h-full rounded-full bg-[color:var(--color-brand)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ButtonLink href={`/p/${slug}/m/${match.id}`} variant="primary" size="lg" fullWidth>
          Abrir partida →
        </ButtonLink>
      </div>
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
      <dt className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-bold text-[color:var(--color-ink)]">{children}</dd>
    </div>
  );
}
