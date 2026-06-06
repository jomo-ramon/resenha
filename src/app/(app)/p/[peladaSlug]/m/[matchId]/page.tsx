import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  MatchStatusBadge,
} from "@/components/ui";
import { canCancelMatch, isRosterAcceptingResponses } from "@/lib/domain/match";
import { TEAM_DARK, TEAM_LIGHT } from "@/lib/domain/team-draft";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { getMatchWithRoster } from "@/server/queries/matches";
import { AttendanceButtons } from "./attendance-buttons";
import { CancelMatchButton } from "./cancel-match-button";
import { ClearDraftButton } from "./clear-draft-button";
import { RefereePanel } from "./referee-panel";
import { StartMatchButton } from "./start-match-button";
import { MatchEventsTimeline, TeamsBoard } from "./teams-board";

type Params = Promise<{ peladaSlug: string; matchId: string }>;

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { peladaSlug } = await params;
  return { title: `Partida — ${peladaSlug} — resenha` };
}

export default async function MatchPage({ params }: { params: Params }) {
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

  const { match, roster, teams, events } = detail;

  const confirmed = roster.filter((r) => r.status === "confirmed");
  const waitlist = roster.filter((r) => r.status === "waitlist");
  const declined = roster.filter((r) => r.status === "declined");

  const myEntry = roster.find((r) => r.membershipId === ctx.membership.id) ?? null;
  const isAdmin = ctx.membership.role === "admin";
  const isReferee = isAdmin || ctx.membership.role === "referee";
  const rosterOpen = isRosterAcceptingResponses(match.status);
  const cancellable = isAdmin && canCancelMatch(match.status);

  const rosterLookup = new Map<string, string>();
  for (const r of roster) rosterLookup.set(r.membershipId, r.displayName);

  const teamLookup = new Map<string, string>();
  for (const t of teams) teamLookup.set(t.team.id, t.team.name);

  const lightTeam = teams.find((t) => t.team.name === TEAM_LIGHT.name);
  const darkTeam = teams.find((t) => t.team.name === TEAM_DARK.name);

  const showTeams =
    match.status === "teams_drafted" ||
    match.status === "in_progress" ||
    match.status === "finished";

  const showRosterPanels = match.status === "roster_open";

  return (
    <div className="space-y-5">
      <Link
        href={`/p/${peladaSlug}/partidas`}
        className="inline-block text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
      >
        ← Partidas
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <MatchStatusBadge status={match.status} />
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight first-letter:capitalize">
            {DATE_FORMATTER.format(match.scheduledFor)}
          </h1>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-[color:var(--color-ink-soft)]">
            {TIME_FORMATTER.format(match.scheduledFor)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            📍 {match.locationOverride ?? ctx.pelada.location}
          </p>
        </div>
      </header>

      {match.notes && (
        <p className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-ink-soft)]">
          💬 {match.notes}
        </p>
      )}

      {rosterOpen && (
        <Card tone={myEntry?.status === "confirmed" ? "brand" : "default"}>
          <CardBody>
            <CardTitle>Sua presença</CardTitle>
            <p className="mt-1 text-sm text-[color:var(--color-ink)]">
              {myEntry?.status === "confirmed"
                ? "✓ Você tá confirmado pra essa partida."
                : myEntry?.status === "waitlist"
                  ? `Você está na lista de espera (posição ${waitlist.findIndex((w) => w.membershipId === ctx.membership.id) + 1}).`
                  : myEntry?.status === "declined"
                    ? "Você desistiu. Pode confirmar de novo se mudar de ideia."
                    : "Você ainda não respondeu."}
            </p>
            <div className="mt-4">
              <AttendanceButtons
                slug={peladaSlug}
                matchId={matchId}
                currentStatus={myEntry?.status ?? null}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {match.status === "roster_open" && isAdmin && confirmed.length >= 2 && (
        <ButtonLink
          href={`/p/${peladaSlug}/m/${matchId}/times`}
          variant="primary"
          size="xl"
          fullWidth
        >
          Sortear times →
        </ButtonLink>
      )}

      {showTeams && lightTeam && darkTeam && (
        <TeamsBoard match={match} teams={teams} events={events} rosterLookup={rosterLookup} />
      )}

      {match.status === "teams_drafted" && isReferee && (
        <div className="space-y-2">
          <StartMatchButton slug={peladaSlug} matchId={matchId} />
          {isAdmin && (
            <div className="text-right">
              <ClearDraftButton slug={peladaSlug} matchId={matchId} />
            </div>
          )}
        </div>
      )}

      {match.status === "in_progress" && isReferee && lightTeam && darkTeam && (
        <RefereePanel
          slug={peladaSlug}
          matchId={matchId}
          lightTeam={{
            id: lightTeam.team.id,
            name: lightTeam.team.name,
            players: lightTeam.playerMembershipIds.map((mid) => ({
              membershipId: mid,
              displayName: rosterLookup.get(mid) ?? "—",
            })),
          }}
          darkTeam={{
            id: darkTeam.team.id,
            name: darkTeam.team.name,
            players: darkTeam.playerMembershipIds.map((mid) => ({
              membershipId: mid,
              displayName: rosterLookup.get(mid) ?? "—",
            })),
          }}
          events={events.map((e) => ({
            id: e.id,
            type: e.type,
            minute: e.minute,
            teamId: e.teamId,
            membershipId: e.membershipId,
            displayName: e.displayName,
          }))}
        />
      )}

      {match.status === "finished" && (
        <MatchEventsTimeline events={events} rosterLookup={rosterLookup} teamLookup={teamLookup} />
      )}

      {showRosterPanels && (
        <RosterSection
          title={`Confirmados ${confirmed.length}/${ctx.pelada.maxPlayers}`}
          emptyLabel="Ninguém confirmou ainda."
          rows={confirmed}
          highlightMembershipId={ctx.membership.id}
        />
      )}

      {showRosterPanels && waitlist.length > 0 && (
        <RosterSection
          title={`Lista de espera (${waitlist.length})`}
          emptyLabel="Lista vazia."
          rows={waitlist}
          highlightMembershipId={ctx.membership.id}
          showPosition
        />
      )}

      {showRosterPanels && declined.length > 0 && (
        <RosterSection
          title={`Desistiram (${declined.length})`}
          emptyLabel=""
          rows={declined}
          highlightMembershipId={ctx.membership.id}
          muted
        />
      )}

      {cancellable && (
        <Card tone="danger" className="border-[color:var(--color-danger)]/30">
          <CardHeader className="border-[color:var(--color-danger)]/20">
            <CardTitle className="text-[color:var(--color-danger)]">Zona perigosa</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-[color:var(--color-danger)]">
              Cancelar partida apaga tudo. Antes do sorteio dos times.
            </p>
            <CancelMatchButton slug={peladaSlug} matchId={matchId} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function RosterSection({
  title,
  emptyLabel,
  rows,
  highlightMembershipId,
  muted,
  showPosition,
}: {
  title: string;
  emptyLabel: string;
  rows: Array<{ entryId: string; membershipId: string; displayName: string }>;
  highlightMembershipId: string;
  muted?: boolean;
  showPosition?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--color-ink-muted)]">{emptyLabel}</p>
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
          {rows.map((r, idx) => {
            const isMe = r.membershipId === highlightMembershipId;
            return (
              <li
                key={r.entryId}
                className={`flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-3 last:border-0 ${
                  muted ? "text-[color:var(--color-ink-muted)]" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  {showPosition && (
                    <span className="w-5 text-right font-mono text-xs text-[color:var(--color-ink-muted)]">
                      {idx + 1}.
                    </span>
                  )}
                  <span className={isMe ? "font-bold" : "font-medium"}>
                    {r.displayName}
                    {isMe && (
                      <Badge tone="brand" size="xs" className="ml-2">
                        Você
                      </Badge>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
