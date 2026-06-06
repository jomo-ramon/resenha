/**
 * Server component that renders the live score and the rosters of both
 * teams. Used in `teams_drafted`, `in_progress`, and `finished`.
 */

import type { Match } from "@/lib/db/schema";
import { computeScore, MATCH_EVENT_LABELS } from "@/lib/domain/match-event";
import { TEAM_DARK, TEAM_LIGHT } from "@/lib/domain/team-draft";
import type { MatchEventRow, TeamWithPlayers } from "@/server/queries/matches";

type DisplayLookup = Map<string, string>;

export function TeamsBoard({
  match,
  teams,
  events,
  rosterLookup,
}: {
  match: Match;
  teams: TeamWithPlayers[];
  events: MatchEventRow[];
  rosterLookup: DisplayLookup;
}) {
  const lightTeam = teams.find((t) => t.team.name === TEAM_LIGHT.name);
  const darkTeam = teams.find((t) => t.team.name === TEAM_DARK.name);
  if (!lightTeam || !darkTeam) return null;

  const isFinished = match.status === "finished";
  const score = isFinished
    ? { light: lightTeam.team.finalScore ?? 0, dark: darkTeam.team.finalScore ?? 0 }
    : computeScore(events, lightTeam.team.id, darkTeam.team.id);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Time Claro</p>
          <p className="text-5xl font-bold tabular-nums">{score.light}</p>
        </div>
        <div className="text-2xl font-light text-zinc-400">×</div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Time Escuro</p>
          <p className="text-5xl font-bold tabular-nums">{score.dark}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TeamRoster team={lightTeam} tone="light" rosterLookup={rosterLookup} events={events} />
        <TeamRoster team={darkTeam} tone="dark" rosterLookup={rosterLookup} events={events} />
      </div>
    </section>
  );
}

function TeamRoster({
  team,
  tone,
  rosterLookup,
  events,
}: {
  team: TeamWithPlayers;
  tone: "light" | "dark";
  rosterLookup: DisplayLookup;
  events: MatchEventRow[];
}) {
  const headerClass =
    tone === "light"
      ? "bg-zinc-100 text-zinc-900"
      : "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900";

  const eventsByMember = new Map<string, MatchEventRow[]>();
  for (const e of events.filter((e) => e.teamId === team.team.id)) {
    const list = eventsByMember.get(e.membershipId) ?? [];
    list.push(e);
    eventsByMember.set(e.membershipId, list);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <header className={`px-4 py-3 ${headerClass}`}>
        <h2 className="text-sm font-semibold uppercase tracking-wider">{team.team.name}</h2>
      </header>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {team.playerMembershipIds.map((mid) => {
          const playerEvents = eventsByMember.get(mid) ?? [];
          const goals = playerEvents.filter((e) => e.type === "goal").length;
          const isCaptain = team.team.captainMembershipId === mid;
          return (
            <li
              key={mid}
              className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 dark:bg-zinc-950"
            >
              <span className="flex min-w-0 items-center gap-2">
                {isCaptain && (
                  <span className="shrink-0 rounded-full border border-amber-500 bg-amber-100 px-1.5 text-xs text-amber-700">
                    ★
                  </span>
                )}
                <span className="truncate text-sm">{rosterLookup.get(mid) ?? "—"}</span>
              </span>
              {goals > 0 && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  ⚽ {goals}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MatchEventsTimeline({
  events,
  rosterLookup,
  teamLookup,
}: {
  events: MatchEventRow[];
  rosterLookup: DisplayLookup;
  teamLookup: Map<string, string>;
}) {
  if (events.length === 0) {
    return (
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Eventos
        </h2>
        <p className="text-sm text-zinc-500">Nenhum evento registrado ainda.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Eventos ({events.length})
      </h2>
      <ol className="space-y-1.5">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <span className="font-mono text-xs text-zinc-500">
              {e.minute !== null ? `${e.minute}'` : "—"}
            </span>
            <span className="font-medium">{MATCH_EVENT_LABELS[e.type]}</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              · {rosterLookup.get(e.membershipId) ?? "?"} ({teamLookup.get(e.teamId) ?? "?"})
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
