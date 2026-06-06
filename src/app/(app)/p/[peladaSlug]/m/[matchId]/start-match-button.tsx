"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { type StartMatchState, startMatchAction } from "@/server/actions/match/start-match";

const initial: StartMatchState = { status: "idle" };

export function StartMatchButton({ slug, matchId }: { slug: string; matchId: string }) {
  const bound = startMatchAction.bind(null, slug, matchId);
  const [state, formAction] = useActionState(bound, initial);
  return (
    <form action={formAction} className="space-y-2">
      <SubmitButton />
      {state.status === "error" && state.message && (
        <p className="text-xs font-medium text-[color:var(--color-danger)]">{state.message}</p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="xl" fullWidth disabled={pending}>
      {pending ? "Começando..." : "▶ Começar partida"}
    </Button>
  );
}
