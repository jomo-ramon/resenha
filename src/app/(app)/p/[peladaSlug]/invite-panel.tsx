"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
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

  async function shareInvite() {
    if (typeof navigator === "undefined" || !navigator.share) {
      copyToClipboard();
      return;
    }
    try {
      await navigator.share({
        title: "Entra na pelada",
        text: "Tô te chamando pra essa pelada. Entra aí:",
        url: inviteUrl,
      });
    } catch {
      // user cancelled; ignore
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight">Convidar galera</h2>
            <p className="mt-0.5 text-xs text-[color:var(--color-ink-soft)]">
              Compartilha esse link no grupo. Quem entrar vira jogador da pelada.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="block h-11 flex-1 truncate rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 font-mono text-xs text-[color:var(--color-ink-soft)]"
          />
          <div className="flex gap-2">
            <Button type="button" variant="primary" size="md" onClick={copyToClipboard}>
              {copied ? "✓ Copiado" : "Copiar"}
            </Button>
            <Button type="button" variant="outline" size="md" onClick={shareInvite}>
              Compartilhar
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {state.status === "success" && state.message ? (
            <p className="text-xs font-medium text-[color:var(--color-brand-strong)]">
              {state.message}
            </p>
          ) : state.status === "error" && state.message ? (
            <p className="text-xs font-medium text-[color:var(--color-danger)]">{state.message}</p>
          ) : (
            <p className="text-xs text-[color:var(--color-ink-muted)]">
              Renovar revoga o link anterior.
            </p>
          )}

          {confirming ? (
            <form action={formAction} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-xs text-[color:var(--color-ink-muted)] underline-offset-4 hover:underline"
              >
                Cancelar
              </button>
              <ConfirmRegenerateButton onConfirmed={() => setConfirming(false)} />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="shrink-0 text-xs text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
            >
              Renovar link
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function ConfirmRegenerateButton({ onConfirmed }: { onConfirmed: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => setTimeout(onConfirmed, 0)}
    >
      {pending ? "Renovando..." : "Confirmar"}
    </Button>
  );
}
