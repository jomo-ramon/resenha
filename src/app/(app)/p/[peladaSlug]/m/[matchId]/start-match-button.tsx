"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type StartMatchState, startMatchAction } from "@/server/actions/match/start-match";

const initial: StartMatchState = { status: "idle" };

export function StartMatchButton({ slug, matchId }: { slug: string; matchId: string }) {
  const bound = startMatchAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, initial);
  return (
    <form action={formAction} className="space-y-2">
      <SubmitButton />
      {state.status === "error" && state.message && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center rounded-full bg-emerald-600 px-5 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "Começando..." : "Começar partida"}
    </button>
  );
}
