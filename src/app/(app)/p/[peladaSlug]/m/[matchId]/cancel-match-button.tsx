"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { type CancelMatchState, cancelMatchAction } from "@/server/actions/match/cancel-match";

const initialState: CancelMatchState = { status: "idle" };

export function CancelMatchButton({ slug, matchId }: { slug: string; matchId: string }) {
  const [confirming, setConfirming] = useState(false);
  const bound = cancelMatchAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-10 items-center justify-center rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
      >
        Cancelar partida
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-red-700 dark:text-red-300">Tem certeza?</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        Não
      </button>
      <ConfirmButton />
      {state.status === "error" && state.message && (
        <p className="w-full text-xs text-red-700 dark:text-red-300">{state.message}</p>
      )}
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Cancelando..." : "Sim, cancelar"}
    </button>
  );
}
