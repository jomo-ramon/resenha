import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  EmptyState,
  MatchStatusBadge,
} from "@/components/ui";
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
  const fullName = session?.user?.name ?? "você";
  const firstName = fullName.split(" ")[0] ?? "você";

  const { pelada, membership } = ctx;
  const upcoming = await getNextUpcomingMatch(pelada.id);
  const isAdmin = membership.role === "admin";

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3">
        <Avatar name={fullName} tone="brand" size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
            E aí, {firstName}
          </p>
          <h1 className="truncate text-3xl font-extrabold leading-tight tracking-tight">
            {pelada.name}
          </h1>
        </div>
        <Badge tone={isAdmin ? "brand" : "neutral"} size="sm">
          {ROLE_LABELS[membership.role] ?? membership.role}
        </Badge>
      </section>

      <UpcomingMatchHero
        slug={pelada.slug}
        maxPlayers={pelada.maxPlayers}
        isAdmin={isAdmin}
        upcoming={upcoming}
        defaultLocation={pelada.location}
        weekdayLabel={WEEKDAY_LABELS[pelada.weekday] ?? pelada.weekday}
        startTime={pelada.startTime}
      />

      <section>
        <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
          Atalhos
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ShortcutCard href={`/p/${pelada.slug}/partidas`} label="Partidas" icon={<CalIcon />} />
          <ShortcutCard href={`/p/${pelada.slug}/ranking`} label="Ranking" icon={<TrophyIcon />} />
          <ShortcutCard href={`/p/${pelada.slug}/perfil`} label="Meu perfil" icon={<UserIcon />} />
          {isAdmin ? (
            <>
              <ShortcutCard
                href={`/p/${pelada.slug}/nova-partida`}
                label="Nova partida"
                icon={<PlusIcon />}
                tone="brand"
              />
              <ShortcutCard
                href={`/p/${pelada.slug}/configuracoes`}
                label="Configurações"
                icon={<GearIcon />}
              />
            </>
          ) : (
            <ShortcutCard href="/peladas" label="Trocar pelada" icon={<SwitchIcon />} />
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
          Quando e onde
        </h2>
        <Card>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info label="Dia">{WEEKDAY_LABELS[pelada.weekday] ?? pelada.weekday}</Info>
            <Info label="Horário">{pelada.startTime}</Info>
            <Info label="Local">{pelada.location}</Info>
            <Info label="Capacidade">{pelada.maxPlayers}</Info>
          </CardBody>
          {pelada.address && (
            <div className="border-t border-[color:var(--color-border)] px-5 py-3 text-xs text-[color:var(--color-ink-soft)]">
              📍 {pelada.address}
            </div>
          )}
        </Card>
      </section>

      {pelada.description && (
        <p className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-5 py-4 text-sm text-[color:var(--color-ink-soft)]">
          💬 {pelada.description}
        </p>
      )}

      {isAdmin && <InvitePanel slug={pelada.slug} inviteToken={pelada.inviteToken} />}
    </div>
  );
}

function UpcomingMatchHero({
  slug,
  maxPlayers,
  isAdmin,
  upcoming,
  defaultLocation,
  weekdayLabel,
  startTime,
}: {
  slug: string;
  maxPlayers: number;
  isAdmin: boolean;
  upcoming: Awaited<ReturnType<typeof getNextUpcomingMatch>>;
  defaultLocation: string;
  weekdayLabel: string;
  startTime: string;
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
            ? `Próxima ${weekdayLabel.toLowerCase()} às ${startTime}? Agenda aí.`
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
  const timeLabel = TIME_FORMATTER.format(match.scheduledFor);
  const pct = Math.min(100, Math.round((confirmedCount / maxPlayers) * 100));
  const full = pct >= 100;

  return (
    <Link
      href={`/p/${slug}/m/${match.id}`}
      className="group relative block overflow-hidden rounded-3xl border border-[color:var(--color-brand)]/30 bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-brand)]"
    >
      {/* glow halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[color:var(--color-brand)] opacity-20 blur-3xl"
      />

      <div className="relative space-y-5 p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
            Próxima partida
          </p>
          <MatchStatusBadge status={match.status} />
        </div>

        <div>
          <p className="text-2xl font-extrabold leading-tight tracking-tight text-[color:var(--color-ink)] first-letter:capitalize">
            {dateLabel}
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tabular-nums tracking-tighter text-[color:var(--color-brand)]">
              {timeLabel}
            </span>
            <span className="text-sm text-[color:var(--color-ink-muted)]">
              · {match.locationOverride ?? defaultLocation}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-[color:var(--color-ink-soft)]">
              <span className="text-2xl font-extrabold tabular-nums text-[color:var(--color-ink)]">
                {confirmedCount}
              </span>
              <span className="text-[color:var(--color-ink-muted)]"> / {maxPlayers}</span>
              <span className="ml-1.5">confirmados</span>
            </p>
            {waitlistCount > 0 && (
              <Badge tone="warning" size="sm">
                +{waitlistCount} na espera
              </Badge>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
            <div
              className={`h-full rounded-full transition-all ${full ? "bg-[color:var(--color-warning)]" : "bg-[color:var(--color-brand)]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm font-bold text-[color:var(--color-brand)] transition-transform group-hover:translate-x-0.5">
          <span>Abrir partida</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}

function ShortcutCard({
  href,
  label,
  icon,
  tone = "default",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone?: "default" | "brand";
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-95 ${
        tone === "brand"
          ? "border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)] hover:shadow-[var(--shadow-brand)]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink)] hover:border-[color:var(--color-border-strong)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          tone === "brand"
            ? "bg-[color:var(--color-brand)] text-[color:var(--color-brand-ink)]"
            : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-brand)]"
        }`}
      >
        {icon}
      </span>
      <span className="text-sm font-bold leading-tight">{label}</span>
    </Link>
  );
}

const MATCH_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-bold text-[color:var(--color-ink)]">{children}</dd>
    </div>
  );
}

function CalIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Partidas</title>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Ranking</title>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M17 5h3v3a3 3 0 0 1-3 3M7 5H4v3a3 3 0 0 0 3 3" />
      <path d="M9 21h6M10 17h4l-.5 4h-3Z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Perfil</title>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4 21c1.6-4 4.6-6 8-6s6.4 2 8 6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <title>Nova</title>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Configurações</title>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
function SwitchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Trocar</title>
      <path d="M7 7h12l-3-3M17 17H5l3 3" />
    </svg>
  );
}
