"use client";

/**
 * RefereePicker — admin-only sheet to designate (or clear) the juiz of
 * the match. Lists every active pelada member that is NOT already in
 * the roster as confirmed/waitlist (the server enforces the same rule;
 * we filter on the client just to keep the UI honest).
 */

import { useActionState, useState, useTransition } from "react";
import { Avatar, Badge, Button, Sheet, SheetHandle } from "@/components/ui";
import { type SetRefereeState, setMatchRefereeAction } from "@/server/actions/match/set-referee";

export type RefereeCandidate = {
  membershipId: string;
  displayName: string;
  shirtNumber: number | null;
  role: "admin" | "player";
  isCurrent: boolean;
};

const initialState: SetRefereeState = { status: "idle" };

export function RefereePicker({
  slug,
  matchId,
  hasReferee,
  candidates,
}: {
  slug: string;
  matchId: string;
  hasReferee: boolean;
  candidates: RefereeCandidate[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const bound = setMatchRefereeAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, initialState);
  const [isPending, startTransition] = useTransition();

  function pick(membershipId: string | null) {
    setPendingId(membershipId ?? "__clear__");
    const fd = new FormData();
    if (membershipId !== null) fd.set("membershipId", membershipId);
    startTransition(() => {
      formAction(fd);
    });
  }

  const filtered = query
    ? candidates.filter((c) => c.displayName.toLowerCase().includes(query.toLowerCase()))
    : candidates;

  const showSuccess = state.status === "success";
  if (showSuccess && open) {
    setTimeout(() => setOpen(false), 250);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {hasReferee ? "Trocar juiz" : "Escalar juiz"}
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={hasReferee ? "Trocar juiz da partida" : "Escalar juiz da partida"}
      >
        <SheetHandle />
        <div className="space-y-3">
          <p className="text-xs text-[color:var(--color-ink-muted)]">
            O juiz não joga essa partida. Quem já confirmou presença ou está na espera não aparece
            aqui — peça pra desconfirmar antes.
          </p>

          <input
            type="search"
            placeholder="Buscar jogador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-muted)] focus-visible:border-[color:var(--color-brand)] focus-visible:outline-none"
          />

          {state.status === "error" && state.message && (
            <p className="rounded-xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger-soft)] px-3 py-2 text-xs font-bold text-[color:var(--color-danger)]">
              {state.message}
            </p>
          )}

          <ul className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <li className="py-6 text-center text-sm text-[color:var(--color-ink-muted)]">
                Nenhum jogador disponível.
              </li>
            ) : (
              filtered.map((c) => {
                const busy = isPending && pendingId === c.membershipId;
                return (
                  <li key={c.membershipId}>
                    <button
                      type="button"
                      disabled={busy || isPending}
                      onClick={() => pick(c.membershipId)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${
                        c.isCurrent
                          ? "border-[color:var(--color-brand)]/50 bg-[color:var(--color-brand-soft)]"
                          : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-brand)]/40 hover:bg-[color:var(--color-brand-soft)]"
                      }`}
                    >
                      <Avatar
                        name={c.displayName}
                        shirtNumber={c.shirtNumber}
                        size="sm"
                        tone={c.isCurrent ? "brand" : "default"}
                      />
                      <span className="flex-1 truncate">{c.displayName}</span>
                      {c.role === "admin" && (
                        <Badge tone="info" size="xs">
                          Admin
                        </Badge>
                      )}
                      {c.isCurrent && (
                        <Badge tone="brand" size="xs">
                          Juiz atual
                        </Badge>
                      )}
                      <span className="text-[color:var(--color-ink-muted)]">
                        {busy ? "..." : "→"}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {hasReferee && (
            <button
              type="button"
              onClick={() => pick(null)}
              disabled={isPending}
              className="block w-full rounded-xl border border-dashed border-[color:var(--color-border-strong)] bg-transparent px-3 py-3 text-center text-xs font-bold text-[color:var(--color-ink-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-ink)] disabled:opacity-50"
            >
              {isPending && pendingId === "__clear__"
                ? "Limpando..."
                : "↺ Sem juiz designado (admin apita)"}
            </button>
          )}
        </div>
      </Sheet>
    </>
  );
}
