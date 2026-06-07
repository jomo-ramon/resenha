"use client";

/**
 * ScoutForm — client UI for the post-game scout/rating editor.
 *
 * State per player:
 *   - counts: how many goals/assists/saves/tackles/cards/own goals
 *   - rating: 0-10 slider or null (no rating)
 *   - notes: free-text comment (≤500 chars)
 *
 * Submits everything as a single JSON payload to `saveMatchScoutAction`.
 * Grouped by team so the rater can run down each side quickly.
 */

import { useActionState, useState, useTransition } from "react";
import { Avatar, Button } from "@/components/ui";
import { MATCH_EVENT_EMOJI, MATCH_EVENT_LABELS } from "@/lib/domain/match-event";
import { MAX_RATING, MIN_RATING, ratingLabel } from "@/lib/domain/player-rating";
import { type SaveScoutState, saveMatchScoutAction } from "@/server/actions/match/save-scout";

type Counts = {
  goal: number;
  assist: number;
  save: number;
  tackle: number;
  yellow_card: number;
  red_card: number;
  own_goal: number;
};

export type ScoutPlayerInit = {
  membershipId: string;
  teamId: string;
  teamName: string;
  displayName: string;
  counts: Counts;
  rating: number | null;
  notes: string;
};

type PlayerState = ScoutPlayerInit;

const COUNT_FIELDS: Array<{ key: keyof Counts; label: string; emoji: string }> = [
  { key: "goal", label: MATCH_EVENT_LABELS.goal, emoji: MATCH_EVENT_EMOJI.goal },
  { key: "assist", label: MATCH_EVENT_LABELS.assist, emoji: MATCH_EVENT_EMOJI.assist },
  { key: "save", label: MATCH_EVENT_LABELS.save, emoji: MATCH_EVENT_EMOJI.save },
  { key: "tackle", label: MATCH_EVENT_LABELS.tackle, emoji: MATCH_EVENT_EMOJI.tackle },
  {
    key: "yellow_card",
    label: MATCH_EVENT_LABELS.yellow_card,
    emoji: MATCH_EVENT_EMOJI.yellow_card,
  },
  { key: "red_card", label: MATCH_EVENT_LABELS.red_card, emoji: MATCH_EVENT_EMOJI.red_card },
  { key: "own_goal", label: MATCH_EVENT_LABELS.own_goal, emoji: MATCH_EVENT_EMOJI.own_goal },
];

const initialState: SaveScoutState = { status: "idle" };

export function ScoutForm({
  slug,
  matchId,
  players,
}: {
  slug: string;
  matchId: string;
  players: ScoutPlayerInit[];
}) {
  const [rows, setRows] = useState<PlayerState[]>(players);
  const bound = saveMatchScoutAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, initialState);
  const [isPending, startTransition] = useTransition();

  const byTeam = new Map<string, PlayerState[]>();
  for (const r of rows) {
    const list = byTeam.get(r.teamId) ?? [];
    list.push(r);
    byTeam.set(r.teamId, list);
  }
  const teamGroups = Array.from(byTeam.entries()).map(([teamId, list]) => ({
    teamId,
    teamName: list[0]?.teamName ?? "—",
    players: list,
  }));

  function updatePlayer(membershipId: string, patch: Partial<PlayerState>) {
    setRows((prev) => prev.map((r) => (r.membershipId === membershipId ? { ...r, ...patch } : r)));
  }

  function updateCount(membershipId: string, key: keyof Counts, delta: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.membershipId === membershipId
          ? {
              ...r,
              counts: { ...r.counts, [key]: Math.max(0, Math.min(99, r.counts[key] + delta)) },
            }
          : r,
      ),
    );
  }

  function onSubmit(formData: FormData) {
    const payload = {
      players: rows.map((r) => ({
        membershipId: r.membershipId,
        teamId: r.teamId,
        counts: r.counts,
        rating: r.rating,
        notes: r.notes,
      })),
    };
    formData.set("payload", JSON.stringify(payload));
    startTransition(() => formAction(formData));
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {teamGroups.map((group) => (
        <section
          key={group.teamId}
          className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]"
        >
          <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider">{group.teamName}</h2>
          </header>
          <ul className="divide-y divide-[color:var(--color-border)]">
            {group.players.map((p) => (
              <li key={p.membershipId} className="p-4">
                <PlayerScoutRow
                  player={p}
                  onCount={(key, delta) => updateCount(p.membershipId, key, delta)}
                  onRating={(rating) => updatePlayer(p.membershipId, { rating })}
                  onNotes={(notes) => updatePlayer(p.membershipId, { notes })}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {state.status === "error" && state.message && (
        <p className="rounded-2xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm font-bold text-[color:var(--color-danger)]">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="rounded-2xl border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-4 py-3 text-sm font-bold text-[color:var(--color-brand)]">
          ✓ Scout salvo. O ranking foi atualizado.
        </p>
      )}

      <div className="sticky bottom-20 z-10 sm:bottom-4">
        <Button type="submit" variant="primary" size="xl" fullWidth disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar scout"}
        </Button>
      </div>
    </form>
  );
}

function PlayerScoutRow({
  player,
  onCount,
  onRating,
  onNotes,
}: {
  player: PlayerState;
  onCount: (key: keyof Counts, delta: number) => void;
  onRating: (value: number | null) => void;
  onNotes: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar name={player.displayName} size="md" tone="default" />
        <div className="flex-1 min-w-0">
          <p className="truncate font-extrabold">{player.displayName}</p>
          {player.rating !== null && (
            <p className="text-xs text-[color:var(--color-ink-muted)]">
              Nota: <span className="font-bold text-[color:var(--color-ink)]">{player.rating}</span>{" "}
              · {ratingLabel(player.rating)}
            </p>
          )}
        </div>
        <RatingPicker value={player.rating} onChange={onRating} />
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {COUNT_FIELDS.map((f) => (
          <CountStepper
            key={f.key}
            label={f.label}
            emoji={f.emoji}
            value={player.counts[f.key]}
            onInc={() => onCount(f.key, +1)}
            onDec={() => onCount(f.key, -1)}
            negative={f.key === "yellow_card" || f.key === "red_card" || f.key === "own_goal"}
          />
        ))}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer select-none font-bold text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]">
          {player.notes ? "✏ Editar comentário" : "+ Adicionar comentário"}
        </summary>
        <textarea
          value={player.notes}
          onChange={(e) => onNotes(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Ex: carregou o time no segundo tempo"
          className="mt-2 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-muted)] focus-visible:border-[color:var(--color-brand)] focus-visible:outline-none"
        />
      </details>
    </div>
  );
}

function CountStepper({
  label,
  emoji,
  value,
  onInc,
  onDec,
  negative,
}: {
  label: string;
  emoji: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
  negative?: boolean;
}) {
  const accent = negative
    ? value > 0
      ? "text-[color:var(--color-danger)] border-[color:var(--color-danger)]/40"
      : "border-[color:var(--color-border)] text-[color:var(--color-ink-muted)]"
    : value > 0
      ? "text-[color:var(--color-brand)] border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)]"
      : "border-[color:var(--color-border)] text-[color:var(--color-ink-muted)]";

  return (
    <div className="flex flex-col items-center gap-1">
      <span title={label} aria-hidden="true" className="text-base leading-none">
        {emoji}
      </span>
      <span className="sr-only">{label}</span>
      <div className={`flex items-center gap-1 rounded-lg border px-1.5 py-1 ${accent}`}>
        <button
          type="button"
          onClick={onDec}
          disabled={value === 0}
          className="flex h-6 w-6 items-center justify-center rounded text-base font-bold leading-none hover:bg-[color:var(--color-surface)] disabled:opacity-30"
        >
          −
        </button>
        <span className="min-w-[18px] text-center text-sm font-extrabold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={onInc}
          className="flex h-6 w-6 items-center justify-center rounded text-base font-bold leading-none hover:bg-[color:var(--color-surface)]"
        >
          +
        </button>
      </div>
    </div>
  );
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={MIN_RATING}
        max={MAX_RATING}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") onChange(null);
          else {
            const n = Number.parseInt(raw, 10);
            if (Number.isFinite(n)) onChange(Math.max(MIN_RATING, Math.min(MAX_RATING, n)));
          }
        }}
        placeholder="—"
        aria-label="Nota 0 a 10"
        className="h-11 w-14 rounded-xl border-2 border-[color:var(--color-brand)]/30 bg-[color:var(--color-surface)] px-2 text-center text-base font-extrabold tabular-nums text-[color:var(--color-brand)] focus-visible:border-[color:var(--color-brand)] focus-visible:outline-none"
      />
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Limpar nota"
          className="text-xs font-bold text-[color:var(--color-ink-muted)] underline-offset-4 hover:text-[color:var(--color-ink)] hover:underline"
        >
          limpar
        </button>
      )}
    </div>
  );
}
