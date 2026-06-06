"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type ClearDraftState, clearDraftAction } from "@/server/actions/match/clear-draft";

const initial: ClearDraftState = { status: "idle" };

export function ClearDraftButton({ slug, matchId }: { slug: string; matchId: string }) {
  const bound = clearDraftAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, initial);
  return (
    <form action={formAction}>
      <SubmitButton />
      {state.status === "error" && state.message && (
        <p className="mt-1 text-xs text-red-600">{state.message}</p>
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
      className="text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400 disabled:opacity-50"
    >
      {pending ? "Desfazendo..." : "Refazer sorteio"}
    </button>
  );
}
