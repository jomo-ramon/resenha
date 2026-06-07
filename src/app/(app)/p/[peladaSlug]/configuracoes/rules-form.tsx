"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import type { MatchEventType } from "@/lib/db/schema";
import {
  type UpdateRulesState,
  updatePeladaRulesAction,
} from "@/server/actions/pelada/update-rules";

type RuleItem = {
  type: MatchEventType;
  label: string;
  emoji: string;
  current: number;
  defaultValue: number;
  isCustom: boolean;
};

const initialState: UpdateRulesState = { status: "idle" };

export function RulesForm({ slug, items }: { slug: string; items: RuleItem[] }) {
  const bound = updatePeladaRulesAction.bind(null, slug);
  const [state, formAction] = useActionState(bound, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]">
        <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider">Pontos por evento</h2>
        </header>
        <ul className="divide-y divide-[color:var(--color-border)]">
          {items.map((item) => (
            <li key={item.type} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden="true" className="text-xl">
                {item.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold">{item.label}</p>
                <p className="text-xs text-[color:var(--color-ink-muted)]">
                  Padrão: <span className="font-mono">{item.defaultValue}</span>
                  {item.isCustom && (
                    <span className="ml-1 text-[color:var(--color-brand)]">· customizado</span>
                  )}
                </p>
              </div>
              <input
                type="number"
                inputMode="numeric"
                name={`points.${item.type}`}
                defaultValue={item.current}
                min={-99}
                max={99}
                step={1}
                className="h-11 w-20 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-3 text-center text-base font-extrabold tabular-nums text-[color:var(--color-ink)] focus-visible:border-[color:var(--color-brand)] focus-visible:outline-none"
              />
            </li>
          ))}
        </ul>
      </div>

      {state.status === "error" && state.message && (
        <p className="rounded-2xl border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm font-bold text-[color:var(--color-danger)]">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="rounded-2xl border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-4 py-3 text-sm font-bold text-[color:var(--color-brand)]">
          ✓ Configurações salvas. Ranking recalculado.
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
      {pending ? "Salvando..." : "Salvar configurações"}
    </Button>
  );
}
