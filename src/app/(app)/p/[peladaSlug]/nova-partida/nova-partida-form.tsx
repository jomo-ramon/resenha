"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, inputClass } from "@/components/ui";
import { type CreateMatchState, createMatchAction } from "@/server/actions/match/create-match";

const initialState: CreateMatchState = { status: "idle" };

function nextSaturdayLocalDateTime(): string {
  const now = new Date();
  const day = now.getDay();
  const offset = (6 - day + 7) % 7 || 7;
  const target = new Date(now);
  target.setDate(now.getDate() + offset);
  target.setHours(16, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
}

export function NovaPartidaForm({ slug }: { slug: string }) {
  const bound = createMatchAction.bind(null, slug);
  const [state, formAction] = useActionState(bound, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message && (
        <p className="rounded-xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)]">
          {state.message}
        </p>
      )}

      <Field
        label="Data e hora"
        htmlFor="scheduledFor"
        required
        hint="Padrão: próximo sábado às 16:00."
        error={state.fieldErrors?.scheduledFor}
      >
        <input
          id="scheduledFor"
          name="scheduledFor"
          type="datetime-local"
          required
          defaultValue={nextSaturdayLocalDateTime()}
          className={inputClass}
        />
      </Field>

      <Field
        label="Local específico"
        htmlFor="locationOverride"
        hint="Opcional — use se for diferente do local padrão da pelada."
        error={state.fieldErrors?.locationOverride}
      >
        <input
          id="locationOverride"
          name="locationOverride"
          type="text"
          placeholder="Quadra 2"
          className={inputClass}
        />
      </Field>

      <Field
        label="Observações"
        htmlFor="notes"
        hint="Opcional — algo que a galera precisa saber."
        error={state.fieldErrors?.notes}
      >
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={280}
          placeholder="Levar colete escuro."
          className={`${inputClass} min-h-[80px] py-2`}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="xl" fullWidth disabled={pending}>
      {pending ? "Agendando..." : "Agendar partida"}
    </Button>
  );
}
