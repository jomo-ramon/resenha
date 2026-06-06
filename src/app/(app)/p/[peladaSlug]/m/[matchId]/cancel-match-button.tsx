"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { type CancelMatchState, cancelMatchAction } from "@/server/actions/match/cancel-match";

const initialState: CancelMatchState = { status: "idle" };

export function CancelMatchButton({ slug, matchId }: { slug: string; matchId: string }) {
  const [confirming, setConfirming] = useState(false);
  const bound = cancelMatchAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, initialState);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => setConfirming(true)}
        className="border-[color:var(--color-danger)]/30 text-[color:var(--color-danger)]"
      >
        Cancelar partida
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-[color:var(--color-danger)]">Tem certeza?</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
      >
        Não
      </button>
      <ConfirmButton />
      {state.status === "error" && state.message && (
        <p className="w-full text-xs font-medium text-[color:var(--color-danger)]">
          {state.message}
        </p>
      )}
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Cancelando..." : "Sim, cancelar"}
    </Button>
  );
}
