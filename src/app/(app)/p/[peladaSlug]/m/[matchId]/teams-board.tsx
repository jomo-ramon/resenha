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
  const isLive = match.status === "in_progress";
  const score = isFinished
    ? { light: lightTeam.team.finalScore ?? 0, dark: darkTeam.team.finalScore ?? 0 }
    : computeScore(events, lightTeam.team.id, darkTeam.team.id);

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-md)]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
          <ScorePane
            label="Time Claro"
            score={score.light}
            tone="light"
            winning={score.light > score.dark && isFinished}
          />
          <div className="flex flex-col items-center justify-center bg-[color:var(--color-surface)] px-4 py-6">
            <span className="text-2xl font-bold text-[color:var(--color-ink-muted)]">×</span>
            {isLive && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--color-brand)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Ao vivo
              </span>
            )}
            {isFinished && (
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
                Final
              </span>
            )}
          </div>
          <ScorePane
            label="Time Escuro"
            score={score.dark}
            tone="dark"
            winning={score.dark > score.light && isFinished}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TeamRoster team={lightTeam} tone="light" rosterLookup={rosterLookup} events={events} />
        <TeamRoster team={darkTeam} tone="dark" rosterLookup={rosterLookup} events={events} />
      </div>
    </section>
  );
}

function ScorePane({
  label,
  score,
  tone,
  winning,
}: {
  label: string;
  score: number;
  tone: "light" | "dark";
  winning?: boolean;
}) {
  const isLight = tone === "light";
  const bg = isLight
    ? "bg-[color:var(--color-team-light)] text-[color:var(--color-team-light-ink)]"
    : "bg-[color:var(--color-team-dark)] text-[color:var(--color-team-dark-ink)]";
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-4 py-7 ${bg}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className={`text-6xl font-extrabold tabular-nums sm:text-7xl ${winning ? "" : ""}`}>
        {score}
      </p>
      {winning && (
        <span className="text-xs font-bold uppercase tracking-wider opacity-90">🏆 Venceu</span>
      )}
    </div>
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
      ? "bg-[color:var(--color-team-light)] text-[color:var(--color-team-light-ink)]"
      : "bg-[color:var(--color-team-dark)] text-[color:var(--color-team-dark-ink)]";

  const eventsByMember = new Map<string, MatchEventRow[]>();
  for (const e of events.filter((e) => e.teamId === team.team.id)) {
    const list = eventsByMember.get(e.membershipId) ?? [];
    list.push(e);
    eventsByMember.set(e.membershipId, list);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
      <header className={`flex items-center gap-2 px-4 py-3 ${headerClass}`}>
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: team.team.color ?? undefined }}
        />
        <h2 className="text-sm font-bold uppercase tracking-wider">{team.team.name}</h2>
        <span className="ml-auto text-xs opacity-70">{team.playerMembershipIds.length}</span>
      </header>
      <ul className="divide-y divide-[color:var(--color-border)]">
        {team.playerMembershipIds.map((mid) => {
          const playerEvents = eventsByMember.get(mid) ?? [];
          const goals = playerEvents.filter((e) => e.type === "goal").length;
          const yellows = playerEvents.filter((e) => e.type === "yellow_card").length;
          const reds = playerEvents.filter((e) => e.type === "red_card").length;
          const isCaptain = team.team.captainMembershipId === mid;
          return (
            <li key={mid} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                {isCaptain && (
                  <span className="shrink-0 rounded-full bg-[color:var(--color-captain)] px-1.5 text-[10px] font-bold text-white">
                    C
                  </span>
                )}
                <span className="truncate text-sm font-medium text-[color:var(--color-ink)]">
                  {rosterLookup.get(mid) ?? "—"}
                </span>
              </span>
              <span className="flex items-center gap-2 text-xs">
                {goals > 0 && (
                  <span className="font-bold text-[color:var(--color-brand-strong)]">
                    ⚽ {goals}
                  </span>
                )}
                {yellows > 0 && <span>🟨{yellows > 1 ? yellows : ""}</span>}
                {reds > 0 && <span>🟥{reds > 1 ? reds : ""}</span>}
              </span>
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
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
          Eventos
        </h2>
        <p className="rounded-xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-raised)] px-4 py-6 text-center text-sm text-[color:var(--color-ink-muted)]">
          Nenhum evento registrado.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
        Eventos ({events.length})
      </h2>
      <ol className="space-y-1.5">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2 text-sm"
          >
            <span className="w-8 shrink-0 text-right font-mono text-xs text-[color:var(--color-ink-muted)]">
              {e.minute !== null ? `${e.minute}'` : "—"}
            </span>
            <span className="shrink-0 text-base">{eventEmoji(e.type)}</span>
            <span className="flex-1 truncate">
              <span className="font-semibold">{rosterLookup.get(e.membershipId) ?? "?"}</span>
              <span className="text-[color:var(--color-ink-muted)]">
                {" "}
                · {teamLookup.get(e.teamId) ?? "?"} · {MATCH_EVENT_LABELS[e.type]}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function eventEmoji(type: string): string {
  switch (type) {
    case "goal":
      return "⚽";
    case "own_goal":
      return "🙃";
    case "assist":
      return "🅰️";
    case "yellow_card":
      return "🟨";
    case "red_card":
      return "🟥";
    default:
      return "•";
  }
}
