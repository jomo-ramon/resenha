"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { PreferredPosition } from "@/lib/db/schema";
import { PREFERRED_POSITION_LABELS } from "@/lib/domain/membership";
import {
  type UpdateProfileState,
  updateMyMembershipAction,
} from "@/server/actions/membership/update-profile";

const initialState: UpdateProfileState = { status: "idle" };

export function PerfilForm({
  slug,
  defaults,
}: {
  slug: string;
  defaults: {
    nickname: string;
    shirtNumber: number | null;
    preferredPosition: PreferredPosition;
  };
}) {
  const bound = updateMyMembershipAction.bind(null, slug);
  const [state, formAction] = useActionState(bound, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "success" && state.message && (
        <p className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {state.message}
        </p>
      )}
      {state.status === "error" && state.message && (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      )}

      <Field
        label="Apelido"
        htmlFor="nickname"
        hint="Como a galera te chama."
        error={state.fieldErrors?.nickname}
      >
        <input
          id="nickname"
          name="nickname"
          type="text"
          maxLength={30}
          defaultValue={defaults.nickname}
          placeholder="Pelé"
          className={inputClass}
        />
      </Field>

      <Field
        label="Número da camisa"
        htmlFor="shirtNumber"
        hint="Opcional. De 0 a 99."
        error={state.fieldErrors?.shirtNumber}
      >
        <input
          id="shirtNumber"
          name="shirtNumber"
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          defaultValue={defaults.shirtNumber ?? ""}
          placeholder="10"
          className={inputClass}
        />
      </Field>

      <Field
        label="Posição preferida"
        htmlFor="preferredPosition"
        error={state.fieldErrors?.preferredPosition}
      >
        <select
          id="preferredPosition"
          name="preferredPosition"
          defaultValue={defaults.preferredPosition}
          className={inputClass}
        >
          {(Object.keys(PREFERRED_POSITION_LABELS) as PreferredPosition[]).map((pos) => (
            <option key={pos} value={pos}>
              {PREFERRED_POSITION_LABELS[pos]}
            </option>
          ))}
        </select>
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
      {pending ? "Salvando..." : "Salvar"}
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
