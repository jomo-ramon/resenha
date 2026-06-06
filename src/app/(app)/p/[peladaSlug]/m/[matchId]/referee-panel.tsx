"use client";

/**
 * Referee panel — record goals/cards live during in_progress.
 * Renders two big "+ Gol" buttons (one per team) that open a player picker.
 */

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
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
        <ScoreButton
          tone="light"
          label={lightTeam.name}
          onClick={() => setPicker({ team: lightTeam, type: "goal" })}
        >
          + Gol Claro
        </ScoreButton>
        <ScoreButton
          tone="dark"
          label={darkTeam.name}
          onClick={() => setPicker({ team: darkTeam, type: "goal" })}
        >
          + Gol Escuro
        </ScoreButton>
      </div>

      <details className="rounded-md border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">
          Outros eventos (assistência, cartões)
        </summary>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {(["assist", "yellow_card", "red_card", "own_goal"] as MatchEventType[]).map((t) => (
            <div key={t} className="flex flex-col gap-1">
              <p className="text-xs text-zinc-500">{MATCH_EVENT_LABELS[t]}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPicker({ team: lightTeam, type: t })}
                  className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Claro
                </button>
                <button
                  type="button"
                  onClick={() => setPicker({ team: darkTeam, type: t })}
                  className="flex-1 rounded-md bg-zinc-900 px-2 py-1.5 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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

function ScoreButton({
  tone,
  label,
  onClick,
  children,
}: {
  tone: "light" | "dark";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const cls =
    tone === "light"
      ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
      : "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Marcar gol pro ${label}`}
      className={`flex h-16 items-center justify-center rounded-xl text-base font-bold ${cls}`}
    >
      {children}
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
      <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-4 shadow-2xl dark:bg-zinc-900">
        <header className="flex items-center justify-between">
          <h3 id="player-picker-title" className="text-base font-semibold">
            {MATCH_EVENT_LABELS[type]} — {team.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ✕
          </button>
        </header>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Minuto:</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={180}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            placeholder="opcional"
            className="h-9 w-24 rounded-md border border-zinc-300 px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {team.players.map((p) => (
            <li key={p.membershipId}>
              <button
                type="button"
                disabled={isPending && selected === p.membershipId}
                onClick={() => submit(p.membershipId)}
                className="flex w-full items-center justify-between rounded-md border border-zinc-200 px-3 py-2.5 text-left text-sm hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                <span>{p.displayName}</span>
                <span className="text-xs text-zinc-500">
                  {isPending && selected === p.membershipId ? "..." : "→"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {state.status === "error" && state.message && (
          <p className="text-xs text-red-600 dark:text-red-400">{state.message}</p>
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
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
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
    <li className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <span className="font-mono text-xs text-zinc-500 w-8 text-right">
        {event.minute !== null ? `${event.minute}'` : "—"}
      </span>
      <span className="flex-1 truncate">
        <span className="font-medium">{MATCH_EVENT_LABELS[event.type]}</span>
        <span className="text-zinc-500"> · {event.displayName}</span>
      </span>
      <form action={formAction}>
        <RemoveButton />
      </form>
      {state.status === "error" && state.message && (
        <span className="text-xs text-red-600">{state.message}</span>
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
      className="text-xs text-zinc-500 underline-offset-4 hover:text-red-700 hover:underline disabled:opacity-50"
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
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 px-5 text-base font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        Encerrar partida
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <p className="text-sm">
        {hasEvents
          ? "Encerrar fecha o placar e libera o ranking. Você pode editar eventos depois."
          : "Sem nenhum evento registrado, o placar vai ser 0x0. Tem certeza?"}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Cancelar
        </button>
        <FinishSubmit />
      </div>
      {state.status === "error" && state.message && (
        <p className="mt-2 text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}

function FinishSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Encerrando..." : "Sim, encerrar"}
    </button>
  );
}
