"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type AcceptInviteState, acceptInviteAction } from "@/server/actions/pelada/accept-invite";

const initialState: AcceptInviteState = { status: "idle" };

export function AcceptInviteForm({ slug, token }: { slug: string; token: string }) {
  const boundAction = acceptInviteAction.bind(null, slug, token);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.status === "error" && state.message && (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
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
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-base font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Aceitando..." : "Aceitar convite"}
    </button>
  );
}
