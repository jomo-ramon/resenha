"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  type RegenerateInviteTokenState,
  regenerateInviteTokenAction,
} from "@/server/actions/pelada/regenerate-invite-token";

const initialState: RegenerateInviteTokenState = { status: "idle" };

export function InvitePanel({ slug, inviteToken }: { slug: string; inviteToken: string }) {
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${slug}/entrar?token=${inviteToken}`
      : `/p/${slug}/entrar?token=${inviteToken}`;

  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const boundAction = regenerateInviteTokenAction.bind(null, slug);
  const [state, formAction] = useActionState(boundAction, initialState);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback handled by browser; intentionally no toast yet
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Convidar galera
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Compartilha esse link no grupo. Quem entrar vira jogador da pelada.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="block h-11 flex-1 truncate rounded-md border border-zinc-300 bg-zinc-50 px-3 font-mono text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        />
        <button
          type="button"
          onClick={copyToClipboard}
          className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {state.status === "success" && state.message ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{state.message}</p>
        ) : state.status === "error" && state.message ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.message}</p>
        ) : (
          <p className="text-xs text-zinc-500">
            Renovar o link revoga o anterior. Quem ainda não entrou perde o acesso.
          </p>
        )}

        {confirming ? (
          <form action={formAction} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs text-zinc-500 underline-offset-4 hover:underline"
            >
              Cancelar
            </button>
            <ConfirmRegenerateButton onConfirmed={() => setConfirming(false)} />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            Renovar link
          </button>
        )}
      </div>
    </section>
  );
}

function ConfirmRegenerateButton({ onConfirmed }: { onConfirmed: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => {
        setTimeout(onConfirmed, 0);
      }}
      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
    >
      {pending ? "Renovando..." : "Confirmar renovar"}
    </button>
  );
}
