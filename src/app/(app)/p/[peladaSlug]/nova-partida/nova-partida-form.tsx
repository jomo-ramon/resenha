"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      )}

      <Field
        label="Data e hora"
        htmlFor="scheduledFor"
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
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Agendando..." : "Agendar partida"}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass =
  "block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-900 placeholder-zinc-400 focus-visible:border-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus-visible:border-zinc-50 dark:focus-visible:ring-zinc-50";
