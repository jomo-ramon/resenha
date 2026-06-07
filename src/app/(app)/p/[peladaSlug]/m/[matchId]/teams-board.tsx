/**
 * Server component that renders the live score and the rosters of both
 * teams. Used in `teams_drafted`, `in_progress`, and `finished`.
 *
 * Designed Cartola-style: massive score (8xl mobile), team chips show
 * Avatar + shirtNumber + name + per-player goal counter inline.
 */

import { Avatar, Badge, LiveBadge } from "@/components/ui";
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

  const winner: "light" | "dark" | "draw" | null = isFinished
    ? score.light === score.dark
      ? "draw"
      : score.light > score.dark
        ? "light"
        : "dark"
    : null;

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-md)]">
        {/* status strip */}
        <div className="flex items-center justify-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-2">
          {isLive && <LiveBadge />}
          {isFinished && (
            <Badge tone="neutral" size="sm">
              {winner === "draw" ? "Empate" : "Final"}
            </Badge>
          )}
          {!isLive && !isFinished && (
            <Badge tone="info" size="sm">
              Times sorteados
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-7 sm:px-6">
          <ScoreSide label="Claro" score={score.light} tone="light" isWinner={winner === "light"} />
          <span className="text-3xl font-extrabold text-[color:var(--color-ink-muted)]">×</span>
          <ScoreSide label="Escuro" score={score.dark} tone="dark" isWinner={winner === "dark"} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TeamRoster team={lightTeam} tone="light" rosterLookup={rosterLookup} events={events} />
        <TeamRoster team={darkTeam} tone="dark" rosterLookup={rosterLookup} events={events} />
      </div>
    </section>
  );
}

function ScoreSide({
  label,
  score,
  tone,
  isWinner,
}: {
  label: string;
  score: number;
  tone: "light" | "dark";
  isWinner?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.15em] ${
          tone === "light"
            ? "bg-[color:var(--color-team-light)] text-[color:var(--color-team-light-ink)]"
            : "bg-[color:var(--color-team-dark)] text-[color:var(--color-team-dark-ink)] ring-1 ring-[color:var(--color-border-strong)]"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${tone === "light" ? "bg-[color:var(--color-team-light-ink)]" : "bg-[color:var(--color-team-dark-ink)]"}`}
        />
        Time {label}
      </span>
      <span
        className={`text-7xl font-extrabold tabular-nums leading-none tracking-tighter sm:text-8xl ${
          isWinner ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-ink)]"
        }`}
      >
        {score}
      </span>
      {isWinner && (
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand)]">
          🏆 Vencedor
        </span>
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
  const headerStyle =
    tone === "light"
      ? "bg-[color:var(--color-team-light)] text-[color:var(--color-team-light-ink)]"
      : "bg-[color:var(--color-team-dark)] text-[color:var(--color-team-dark-ink)] ring-1 ring-[color:var(--color-border-strong)]";

  const eventsByMember = new Map<string, MatchEventRow[]>();
  for (const e of events.filter((e) => e.teamId === team.team.id)) {
    const list = eventsByMember.get(e.membershipId) ?? [];
    list.push(e);
    eventsByMember.set(e.membershipId, list);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
      <header className={`flex items-center gap-2 px-4 py-3 ${headerStyle}`}>
        <span className="h-3 w-3 rounded-full bg-current opacity-70" />
        <h2 className="text-xs font-extrabold uppercase tracking-[0.18em]">{team.team.name}</h2>
        <span className="ml-auto rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-bold tabular-nums">
          {team.playerMembershipIds.length}
        </span>
      </header>
      <ul className="divide-y divide-[color:var(--color-border)]">
        {team.playerMembershipIds.map((mid) => {
          const playerEvents = eventsByMember.get(mid) ?? [];
          const goals = playerEvents.filter((e) => e.type === "goal").length;
          const assists = playerEvents.filter((e) => e.type === "assist").length;
          const yellows = playerEvents.filter((e) => e.type === "yellow_card").length;
          const reds = playerEvents.filter((e) => e.type === "red_card").length;
          const isCaptain = team.team.captainMembershipId === mid;
          const name = rosterLookup.get(mid) ?? "—";
          return (
            <li key={mid} className="flex items-center gap-3 px-4 py-2.5">
              <Avatar name={name} size="sm" tone={tone === "light" ? "team-light" : "team-dark"} />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate text-sm font-bold text-[color:var(--color-ink)]">
                  {name}
                </span>
                {isCaptain && (
                  <span
                    title="Capitão"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-[9px] font-extrabold text-[color:var(--color-accent-ink)]"
                  >
                    C
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                {goals > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-[color:var(--color-brand-soft)] px-1.5 py-0.5 font-extrabold tabular-nums text-[color:var(--color-brand)]">
                    ⚽ {goals}
                  </span>
                )}
                {assists > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-[color:var(--color-info-soft)] px-1.5 py-0.5 font-extrabold tabular-nums text-[color:var(--color-info)]">
                    🅰 {assists}
                  </span>
                )}
                {yellows > 0 && (
                  <span title={`${yellows} amarelo${yellows > 1 ? "s" : ""}`}>
                    🟨{yellows > 1 ? yellows : ""}
                  </span>
                )}
                {reds > 0 && (
                  <span title={`${reds} vermelho${reds > 1 ? "s" : ""}`}>
                    🟥{reds > 1 ? reds : ""}
                  </span>
                )}
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
        <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
          Eventos
        </h2>
        <p className="rounded-2xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-raised)] px-4 py-6 text-center text-sm text-[color:var(--color-ink-muted)]">
          Nenhum evento registrado.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
        Eventos ({events.length})
      </h2>
      <ol className="space-y-1.5">
        {events.map((e) => {
          const name = rosterLookup.get(e.membershipId) ?? "?";
          const teamName = teamLookup.get(e.teamId) ?? "?";
          return (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2.5 text-sm"
            >
              <span className="w-9 shrink-0 text-right font-mono text-xs font-bold text-[color:var(--color-ink-muted)] tabular-nums">
                {e.minute !== null ? `${e.minute}'` : "—"}
              </span>
              <span className="shrink-0 text-lg">{eventEmoji(e.type)}</span>
              <Avatar name={name} size="xs" tone="default" />
              <span className="flex-1 truncate">
                <span className="font-bold">{name}</span>
                <span className="text-[color:var(--color-ink-muted)]">
                  {" "}
                  · {teamName} · {MATCH_EVENT_LABELS[e.type]}
                </span>
              </span>
            </li>
          );
        })}
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
      return "🅰";
    case "yellow_card":
      return "🟨";
    case "red_card":
      return "🟥";
    default:
      return "•";
  }
}
