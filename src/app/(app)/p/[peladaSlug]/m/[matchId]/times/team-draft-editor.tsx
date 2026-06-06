"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { buildDraftFromAssignments, type TeamSlug } from "@/lib/domain/team-draft";
import { type DraftTeamsState, draftTeamsAction } from "@/server/actions/match/draft-teams";

type PoolMember = { membershipId: string; displayName: string };

const initialActionState: DraftTeamsState = { status: "idle" };

export function TeamDraftEditor({
  slug,
  matchId,
  pool,
  initialAssignments,
  initialCaptains,
}: {
  slug: string;
  matchId: string;
  pool: PoolMember[];
  initialAssignments: Record<string, TeamSlug | null>;
  initialCaptains: { light: string | null; dark: string | null };
}) {
  const [assignments, setAssignments] =
    useState<Record<string, TeamSlug | null>>(initialAssignments);
  const [captains, setCaptains] = useState<{ light: string | null; dark: string | null }>(
    initialCaptains,
  );

  const bound = draftTeamsAction.bind(null, slug, matchId);
  const [actionState, formAction] = useActionState(bound, initialActionState);

  const pooled = useMemo(
    () => pool.filter((p) => !assignments[p.membershipId]),
    [pool, assignments],
  );
  const lightPlayers = useMemo(
    () => pool.filter((p) => assignments[p.membershipId] === "light"),
    [pool, assignments],
  );
  const darkPlayers = useMemo(
    () => pool.filter((p) => assignments[p.membershipId] === "dark"),
    [pool, assignments],
  );

  function moveTo(membershipId: string, target: TeamSlug | null) {
    setAssignments((prev) => ({ ...prev, [membershipId]: target }));
    setCaptains((prev) => {
      const next = { ...prev };
      if (next.light === membershipId && target !== "light") next.light = null;
      if (next.dark === membershipId && target !== "dark") next.dark = null;
      return next;
    });
  }

  function setCaptain(team: TeamSlug, membershipId: string) {
    setCaptains((prev) => ({ ...prev, [team]: membershipId }));
  }

  function autoShuffle() {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const next: Record<string, TeamSlug | null> = {};
    shuffled.forEach((p, i) => {
      next[p.membershipId] = i % 2 === 0 ? "light" : "dark";
    });
    setAssignments(next);
    setCaptains({ light: null, dark: null });
  }

  const built = useMemo(
    () =>
      buildDraftFromAssignments(
        pool.map((p) => p.membershipId),
        assignments,
        captains,
      ),
    [pool, assignments, captains],
  );
  const ready = built.ok;
  const localError = !built.ok ? built.message : null;
  const unequal = ready && Math.abs(lightPlayers.length - darkPlayers.length) > 1;

  const payload = built.ok ? JSON.stringify(built.input) : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {lightPlayers.length} <span className="text-zinc-500">vs</span> {darkPlayers.length}
          {unequal && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              (times desiguais)
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={autoShuffle}
          className="text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Embaralhar aleatoriamente
        </button>
      </div>

      {pooled.length > 0 && (
        <section className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Sem time ({pooled.length})
          </h2>
          <ul className="space-y-1.5">
            {pooled.map((p) => (
              <li
                key={p.membershipId}
                className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 dark:bg-zinc-950"
              >
                <span className="truncate text-sm">{p.displayName}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveTo(p.membershipId, "light")}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    → Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTo(p.membershipId, "dark")}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    → Escuro
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TeamColumn
          title="Time Claro"
          tone="light"
          players={lightPlayers}
          captainId={captains.light}
          onCaptainChange={(mid) => setCaptain("light", mid)}
          onRemove={(mid) => moveTo(mid, null)}
        />
        <TeamColumn
          title="Time Escuro"
          tone="dark"
          players={darkPlayers}
          captainId={captains.dark}
          onCaptainChange={(mid) => setCaptain("dark", mid)}
          onRemove={(mid) => moveTo(mid, null)}
        />
      </div>

      {(localError || actionState.status === "error") && (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionState.message ?? localError}
        </p>
      )}

      <form action={formAction}>
        <input type="hidden" name="payload" value={payload} />
        <SubmitButton disabled={!ready} />
      </form>
    </div>
  );
}

function TeamColumn({
  title,
  tone,
  players,
  captainId,
  onCaptainChange,
  onRemove,
}: {
  title: string;
  tone: "light" | "dark";
  players: PoolMember[];
  captainId: string | null;
  onCaptainChange: (membershipId: string) => void;
  onRemove: (membershipId: string) => void;
}) {
  const headerClass =
    tone === "light"
      ? "bg-zinc-100 text-zinc-900"
      : "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900";

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <header className={`px-4 py-3 ${headerClass}`}>
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          {title} <span className="opacity-70">({players.length})</span>
        </h2>
      </header>
      {players.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-zinc-500">Nenhum jogador.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {players.map((p) => {
            const isCaptain = captainId === p.membershipId;
            return (
              <li
                key={p.membershipId}
                className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 dark:bg-zinc-950"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCaptainChange(p.membershipId)}
                    title={isCaptain ? "Capitão" : "Marcar como capitão"}
                    className={`shrink-0 rounded-full border px-1.5 text-xs ${
                      isCaptain
                        ? "border-amber-500 bg-amber-100 text-amber-700"
                        : "border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {isCaptain ? "★ Cap" : "Cap?"}
                  </button>
                  <span className="truncate text-sm">{p.displayName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(p.membershipId)}
                  className="text-xs text-zinc-500 underline-offset-4 hover:underline"
                >
                  Tirar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Salvando..." : "Confirmar times"}
    </button>
  );
}
