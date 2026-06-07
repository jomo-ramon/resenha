"use client";

/**
 * Referee panel — record goals/cards live during in_progress.
 *
 * Two huge "+ Gol" buttons (one per team, ~104px tall) anchor the
 * panel. Tapping any opens a bottom Sheet to pick the scorer. Other
 * events (assist, cards, own goal) hide inside a collapsible.
 *
 * Player picker is a Sheet (bottom-up on mobile, centered on md+)
 * so it stays in thumb reach when the ref is using one hand.
 */

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Avatar, Button, Sheet } from "@/components/ui";
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
        <BigEventButton
          tone="light"
          icon="⚽"
          label="Gol"
          height="h-28"
          onClick={() => setPicker({ team: lightTeam, type: "goal" })}
        />
        <BigEventButton
          tone="dark"
          icon="⚽"
          label="Gol"
          height="h-28"
          onClick={() => setPicker({ team: darkTeam, type: "goal" })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <BigEventButton
          tone="light"
          icon="🧤"
          label="Defesa"
          height="h-20"
          onClick={() => setPicker({ team: lightTeam, type: "save" })}
        />
        <BigEventButton
          tone="dark"
          icon="🧤"
          label="Defesa"
          height="h-20"
          onClick={() => setPicker({ team: darkTeam, type: "save" })}
        />
        <BigEventButton
          tone="light"
          icon="🛡"
          label="Desarme"
          height="h-20"
          onClick={() => setPicker({ team: lightTeam, type: "tackle" })}
        />
        <BigEventButton
          tone="dark"
          icon="🛡"
          label="Desarme"
          height="h-20"
          onClick={() => setPicker({ team: darkTeam, type: "tackle" })}
        />
      </div>

      <details className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]">
          Outros eventos (assistência, cartões, gol contra)
        </summary>
        <div className="grid grid-cols-2 gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
          {(["assist", "yellow_card", "red_card", "own_goal"] as MatchEventType[]).map((t) => (
            <div key={t} className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
                {MATCH_EVENT_LABELS[t]}
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPicker({ team: lightTeam, type: t })}
                  className="flex-1 rounded-lg bg-[color:var(--color-team-light)] px-2 py-2 text-xs font-extrabold text-[color:var(--color-team-light-ink)] transition-transform active:scale-95"
                >
                  Claro
                </button>
                <button
                  type="button"
                  onClick={() => setPicker({ team: darkTeam, type: t })}
                  className="flex-1 rounded-lg bg-[color:var(--color-team-dark)] px-2 py-2 text-xs font-extrabold text-[color:var(--color-team-dark-ink)] ring-1 ring-[color:var(--color-border-strong)] transition-transform active:scale-95"
                >
                  Escuro
                </button>
              </div>
            </div>
          ))}
        </div>
      </details>

      <p className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-center text-[11px] text-[color:var(--color-ink-muted)]">
        Notas (0–10) e ajustes finos ficam na tela <strong>Scout</strong> após encerrar a partida.
      </p>

      <PlayerPickerSheet
        slug={slug}
        matchId={matchId}
        state={picker}
        onClose={() => setPicker(null)}
      />

      <EventsEditableList slug={slug} matchId={matchId} events={events} />

      <FinishMatchForm slug={slug} matchId={matchId} hasEvents={events.length > 0} />
    </section>
  );
}

function BigEventButton({
  tone,
  icon,
  label,
  height,
  onClick,
}: {
  tone: "light" | "dark";
  icon: string;
  label: string;
  height: string;
  onClick: () => void;
}) {
  const isLight = tone === "light";
  const cls = isLight
    ? "bg-[color:var(--color-team-light)] text-[color:var(--color-team-light-ink)]"
    : "bg-[color:var(--color-team-dark)] text-[color:var(--color-team-dark-ink)] ring-1 ring-[color:var(--color-border-strong)]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex ${height} flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl text-xs font-extrabold uppercase tracking-[0.1em] shadow-[var(--shadow-md)] transition-transform active:scale-[0.97] ${cls}`}
    >
      <span aria-hidden="true" className="text-3xl drop-shadow-sm">
        {icon}
      </span>
      <span>
        {label} {isLight ? "Claro" : "Escuro"}
      </span>
    </button>
  );
}

function PlayerPickerSheet({
  slug,
  matchId,
  state,
  onClose,
}: {
  slug: string;
  matchId: string;
  state: { team: TeamSummary; type: MatchEventType } | null;
  onClose: () => void;
}) {
  const bound = addMatchEventAction.bind(null, slug, matchId);
  const [formState, formAction] = useActionState(bound, addInitial);
  const [isPending, startTransition] = useTransition();
  const [minute, setMinute] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  function submit(membershipId: string) {
    if (!state) return;
    setSelected(membershipId);
    const fd = new FormData();
    fd.set("teamId", state.team.id);
    fd.set("membershipId", membershipId);
    fd.set("type", state.type);
    if (minute) fd.set("minute", minute);
    startTransition(() => {
      formAction(fd);
      setMinute("");
      setSelected(null);
      setQuery("");
      onClose();
    });
  }

  const open = state !== null;
  const players = state?.team.players ?? [];
  const filtered = query
    ? players.filter((p) => p.displayName.toLowerCase().includes(query.toLowerCase()))
    : players;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        state
          ? `${MATCH_EVENT_LABELS[state.type]} — Time ${state.team.name.replace("Time ", "")}`
          : undefined
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Buscar jogador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-muted)] focus-visible:border-[color:var(--color-brand)] focus-visible:outline-none"
          />
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-[color:var(--color-ink-muted)]">Min</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={180}
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              placeholder="—"
              className="h-10 w-16 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-2 text-center text-sm font-bold tabular-nums focus-visible:border-[color:var(--color-brand)] focus-visible:outline-none"
            />
          </label>
        </div>

        <ul className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-[color:var(--color-ink-muted)]">
              Nenhum jogador encontrado.
            </li>
          ) : (
            filtered.map((p) => {
              const busy = isPending && selected === p.membershipId;
              return (
                <li key={p.membershipId}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submit(p.membershipId)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-left text-sm font-bold transition-all hover:border-[color:var(--color-brand)]/40 hover:bg-[color:var(--color-brand-soft)] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Avatar name={p.displayName} size="sm" tone="default" />
                    <span className="flex-1 truncate">{p.displayName}</span>
                    <span className="text-[color:var(--color-ink-muted)]">
                      {busy ? "..." : "→"}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {formState.status === "error" && formState.message && (
          <p className="text-xs font-bold text-[color:var(--color-danger)]">{formState.message}</p>
        )}
      </div>
    </Sheet>
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
      <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--color-ink-muted)]">
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
    <li className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2.5 text-sm">
      <span className="w-9 shrink-0 text-right font-mono text-xs font-bold text-[color:var(--color-ink-muted)] tabular-nums">
        {event.minute !== null ? `${event.minute}'` : "—"}
      </span>
      <Avatar name={event.displayName} size="xs" tone="default" />
      <span className="flex-1 truncate">
        <span className="font-extrabold">{MATCH_EVENT_LABELS[event.type]}</span>
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
      className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-danger)] disabled:opacity-50"
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
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs font-bold text-[color:var(--color-ink-muted)] underline-offset-4 hover:text-[color:var(--color-ink)] hover:underline"
        >
          Cancelar
        </button>
        <FinishSubmit />
      </div>
      {state.status === "error" && state.message && (
        <p className="mt-2 text-xs font-bold text-[color:var(--color-danger)]">{state.message}</p>
      )}
    </form>
  );
}

function FinishSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending}>
      {pending ? "Encerrando..." : "Sim, encerrar"}
    </Button>
  );
}
