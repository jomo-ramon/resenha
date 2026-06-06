import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  roster_open: "Lista aberta",
  teams_drafted: "Times sorteados",
  in_progress: "Em andamento",
  finished: "Finalizada",
  cancelled: "Cancelada",
};

const STATUS_TONES: Record<string, string> = {
  roster_open: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  teams_drafted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  finished: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
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
    <div className="space-y-6">
      <Link
        href={`/p/${peladaSlug}`}
        className="inline-block text-sm text-zinc-500 underline-offset-4 hover:underline"
      >
        ← Voltar pra pelada
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Partida</p>
          <h1 className="text-3xl font-bold tracking-tight first-letter:capitalize">
            {DATE_FORMATTER.format(match.scheduledFor)}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {match.locationOverride ?? ctx.pelada.location}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            STATUS_TONES[match.status] ?? "bg-zinc-100 text-zinc-700"
          }`}
        >
          {STATUS_LABELS[match.status] ?? match.status}
        </span>
      </header>

      {match.notes && (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {match.notes}
        </p>
      )}

      {rosterOpen && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Sua presença
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {myEntry?.status === "confirmed"
                ? "Você tá confirmado pra essa partida."
                : myEntry?.status === "waitlist"
                  ? `Você está na lista de espera (posição ${waitlist.findIndex((w) => w.membershipId === ctx.membership.id) + 1}).`
                  : myEntry?.status === "declined"
                    ? "Você desistiu. Pode confirmar de novo se mudar de ideia."
                    : "Você ainda não respondeu."}
            </p>
          </div>
          <div className="mt-4">
            <AttendanceButtons
              slug={peladaSlug}
              matchId={matchId}
              currentStatus={myEntry?.status ?? null}
            />
          </div>
        </section>
      )}

      {match.status === "roster_open" && isAdmin && confirmed.length >= 2 && (
        <Link
          href={`/p/${peladaSlug}/m/${matchId}/times`}
          className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-5 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sortear times
        </Link>
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
          title={`Confirmados (${confirmed.length}/${ctx.pelada.maxPlayers})`}
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
        <section className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
            Zona perigosa
          </h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            Cancelar partida apaga tudo. Antes do sorteio dos times.
          </p>
          <div className="mt-3">
            <CancelMatchButton slug={peladaSlug} matchId={matchId} />
          </div>
        </section>
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
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <ol className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {rows.map((r, idx) => {
            const isMe = r.membershipId === highlightMembershipId;
            return (
              <li
                key={r.entryId}
                className={`flex items-center justify-between gap-3 bg-white px-4 py-3 dark:bg-zinc-950 ${
                  muted ? "text-zinc-500 dark:text-zinc-500" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  {showPosition && (
                    <span className="font-mono text-xs text-zinc-500">{idx + 1}.</span>
                  )}
                  <span className={isMe ? "font-semibold" : ""}>
                    {r.displayName} {isMe && <span className="text-xs text-zinc-500">(você)</span>}
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
