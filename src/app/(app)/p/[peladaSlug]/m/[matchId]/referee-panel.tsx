"use client";

/**
 * Referee panel — record goals/cards live during in_progress.
 * Renders two huge "+ Gol" buttons (one per team) that open a player picker.
 */

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import type { MatchEventType } from "@/lib/db/schema";
import { MATCH_EVENT_LABELS } from "@/lib/domain/match-event";
import { type AddEventState, addMatchEventAction } from "@/server/actions/match/add-event";
import { type FinishMatchState, finishMatchAction } from "@/server/actions/match/finish-match";
import { type RemoveEventState, removeMatchEventAction } from "@/server/actions/match/remove-event";

type TeamSummary = {
  id: string;
  name: string;
  players: Array<{ membershipId: string; displayName: string }>;
};

type EventListItem = {
  id: string;
  type: MatchEventType;
  minute: number | null;
  teamId: string;
  membershipId: string;
  displayName: string;
};

const addInitial: AddEventState = { status: "idle" };
const removeInitial: RemoveEventState = { status: "idle" };
const finishInitial: FinishMatchState = { status: "idle" };

export function RefereePanel({
  slug,
  matchId,
  lightTeam,
  darkTeam,
  events,
}: {
  slug: string;
  matchId: string;
  lightTeam: TeamSummary;
  darkTeam: TeamSummary;
  events: EventListItem[];
}) {
  const [picker, setPicker] = useState<{ team: TeamSummary; type: MatchEventType } | null>(null);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <BigGoalButton tone="light" onClick={() => setPicker({ team: lightTeam, type: "goal" })} />
        <BigGoalButton tone="dark" onClick={() => setPicker({ team: darkTeam, type: "goal" })} />
      </div>

      <details className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          Outros eventos (assistência, cartões, gol contra)
        </summary>
        <div className="grid grid-cols-2 gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-4">
          {(["assist", "yellow_card", "red_card", "own_goal"] as MatchEventType[]).map((t) => (
            <div key={t} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
                {MATCH_EVENT_LABELS[t]}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPicker({ team: lightTeam, type: t })}
                  className="flex-1 rounded-lg border border-[color:var(--color-border-strong)] bg-[color:var(--color-team-light)] px-2 py-1.5 text-xs font-semibold text-[color:var(--color-team-light-ink)] hover:opacity-90"
                >
                  Claro
                </button>
                <button
                  type="button"
                  onClick={() => setPicker({ team: darkTeam, type: t })}
                  className="flex-1 rounded-lg bg-[color:var(--color-team-dark)] px-2 py-1.5 text-xs font-semibold text-[color:var(--color-team-dark-ink)] hover:opacity-90"
                >
                  Escuro
                </button>
              </div>
            </div>
          ))}
        </div>
      </details>

      {picker && (
        <PlayerPicker
          slug={slug}
          matchId={matchId}
          team={picker.team}
          type={picker.type}
          onClose={() => setPicker(null)}
        />
      )}

      <EventsEditableList slug={slug} matchId={matchId} events={events} />

      <FinishMatchForm slug={slug} matchId={matchId} hasEvents={events.length > 0} />
    </section>
  );
}

function BigGoalButton({ tone, onClick }: { tone: "light" | "dark"; onClick: () => void }) {
  const isLight = tone === "light";
  const cls = isLight
    ? "bg-[color:var(--color-team-light)] text-[color:var(--color-team-light-ink)] border-[color:var(--color-border-strong)]"
    : "bg-[color:var(--color-team-dark)] text-[color:var(--color-team-dark-ink)] border-transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-lg font-extrabold uppercase tracking-wider shadow-[var(--shadow-md)] active:scale-95 transition-transform ${cls}`}
    >
      <span className="text-3xl">⚽</span>
      <span>+ Gol {isLight ? "Claro" : "Escuro"}</span>
    </button>
  );
}

function PlayerPicker({
  slug,
  matchId,
  team,
  type,
  onClose,
}: {
  slug: string;
  matchId: string;
  team: TeamSummary;
  type: MatchEventType;
  onClose: () => void;
}) {
  const bound = addMatchEventAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, addInitial);
  const [isPending, startTransition] = useTransition();
  const [minute, setMinute] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  function submit(membershipId: string) {
    setSelected(membershipId);
    const fd = new FormData();
    fd.set("teamId", team.id);
    fd.set("membershipId", membershipId);
    fd.set("type", type);
    if (minute) fd.set("minute", minute);
    startTransition(() => {
      formAction(fd);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-picker-title"
    >
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-[color:var(--color-surface-raised)] p-4 shadow-[var(--shadow-lg)]">
        <header className="flex items-center justify-between">
          <h3 id="player-picker-title" className="text-base font-bold">
            {MATCH_EVENT_LABELS[type]} — {team.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-[color:var(--color-ink-soft)]">Minuto:</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={180}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            placeholder="opcional"
            className="h-9 w-24 rounded-lg border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-2 text-sm"
          />
        </label>

        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {team.players.map((p) => (
            <li key={p.membershipId}>
              <button
                type="button"
                disabled={isPending && selected === p.membershipId}
                onClick={() => submit(p.membershipId)}
                className="flex w-full items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-left text-sm font-medium hover:border-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-soft)] disabled:opacity-50"
              >
                <span>{p.displayName}</span>
                <span className="text-[color:var(--color-ink-muted)]">
                  {isPending && selected === p.membershipId ? "..." : "→"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {state.status === "error" && state.message && (
          <p className="text-xs font-medium text-[color:var(--color-danger)]">{state.message}</p>
        )}
      </div>
    </div>
  );
}

function EventsEditableList({
  slug,
  matchId,
  events,
}: {
  slug: string;
  matchId: string;
  events: EventListItem[];
}) {
  if (events.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
        Eventos ({events.length})
      </h3>
      <ul className="space-y-1.5">
        {events.map((e) => (
          <EventLine key={e.id} slug={slug} matchId={matchId} event={e} />
        ))}
      </ul>
    </section>
  );
}

function EventLine({
  slug,
  matchId,
  event,
}: {
  slug: string;
  matchId: string;
  event: EventListItem;
}) {
  const bound = removeMatchEventAction.bind(null, slug, matchId, event.id);
  const [state, formAction] = useActionState(bound, removeInitial);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2 text-sm">
      <span className="w-8 shrink-0 text-right font-mono text-xs text-[color:var(--color-ink-muted)]">
        {event.minute !== null ? `${event.minute}'` : "—"}
      </span>
      <span className="flex-1 truncate">
        <span className="font-semibold">{MATCH_EVENT_LABELS[event.type]}</span>
        <span className="text-[color:var(--color-ink-muted)]"> · {event.displayName}</span>
      </span>
      <form action={formAction}>
        <RemoveButton />
      </form>
      {state.status === "error" && state.message && (
        <span className="text-xs text-[color:var(--color-danger)]">{state.message}</span>
      )}
    </li>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-[color:var(--color-ink-muted)] underline-offset-4 hover:text-[color:var(--color-danger)] hover:underline disabled:opacity-50"
    >
      {pending ? "..." : "remover"}
    </button>
  );
}

function FinishMatchForm({
  slug,
  matchId,
  hasEvents,
}: {
  slug: string;
  matchId: string;
  hasEvents: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const bound = finishMatchAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, finishInitial);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => setConfirming(true)}
      >
        Encerrar partida
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-muted)] p-4"
    >
      <p className="text-sm">
        {hasEvents
          ? "Encerrar fecha o placar e libera o ranking. Você pode editar eventos depois."
          : "Sem nenhum evento registrado, o placar vai ser 0×0. Tem certeza?"}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
        >
          Cancelar
        </button>
        <FinishSubmit />
      </div>
      {state.status === "error" && state.message && (
        <p className="mt-2 text-xs font-medium text-[color:var(--color-danger)]">{state.message}</p>
      )}
    </form>
  );
}

function FinishSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="md" disabled={pending}>
      {pending ? "Encerrando..." : "Sim, encerrar"}
    </Button>
  );
}
