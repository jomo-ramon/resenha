"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { type AcceptInviteState, acceptInviteAction } from "@/server/actions/pelada/accept-invite";

const initialState: AcceptInviteState = { status: "idle" };

export function AcceptInviteForm({ slug, token }: { slug: string; token: string }) {
  const boundAction = acceptInviteAction.bind(null, slug, token);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.status === "error" && state.message && (
        <p className="rounded-xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)]">
          {state.message}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="xl" fullWidth disabled={pending}>
      {pending ? "Entrando..." : "Entrar na pelada"}
    </Button>
  );
}
