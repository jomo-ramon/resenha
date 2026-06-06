"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { suggestSlugFromName } from "@/lib/domain/pelada";
import { type CreatePeladaState, createPeladaAction } from "@/server/actions/pelada/create-pelada";

const initialState: CreatePeladaState = { status: "idle" };

const weekdayOptions = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
] as const;

export function NovaPeladaForm() {
  const [state, formAction] = useActionState(createPeladaAction, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(suggestSlugFromName(name));
    }
  }, [name, slugTouched]);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {state.message}
        </div>
      )}

      <Field label="Nome da pelada" htmlFor="name" error={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Cornetas FC"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        label="Endereço (URL)"
        htmlFor="slug"
        hint="Vai virar resenha.app/p/seu-endereco"
        error={state.fieldErrors?.slug}
      >
        <div className="flex items-stretch">
          <span className="inline-flex select-none items-center rounded-l-md border border-r-0 border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            /p/
          </span>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="cornetas"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            className={`${inputClass} rounded-l-none`}
          />
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Dia da semana" htmlFor="weekday" error={state.fieldErrors?.weekday}>
          <select
            id="weekday"
            name="weekday"
            required
            defaultValue="saturday"
            className={inputClass}
          >
            {weekdayOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Horário" htmlFor="startTime" error={state.fieldErrors?.startTime}>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            defaultValue="16:00"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Local" htmlFor="location" error={state.fieldErrors?.location}>
        <input
          id="location"
          name="location"
          type="text"
          required
          placeholder="Campo do Bairro"
          className={inputClass}
        />
      </Field>

      <Field
        label="Endereço completo"
        htmlFor="address"
        hint="Opcional — endereço pra Google Maps."
        error={state.fieldErrors?.address}
      >
        <input
          id="address"
          name="address"
          type="text"
          placeholder="Rua das Palmeiras, 123 — São Paulo/SP"
          className={inputClass}
        />
      </Field>

      <Field
        label="Máximo de jogadores"
        htmlFor="maxPlayers"
        hint="Quem chegar depois entra na lista de espera."
        error={state.fieldErrors?.maxPlayers}
      >
        <input
          id="maxPlayers"
          name="maxPlayers"
          type="number"
          inputMode="numeric"
          required
          min={4}
          max={100}
          defaultValue={20}
          className={inputClass}
        />
      </Field>

      <Field
        label="Descrição"
        htmlFor="description"
        hint="Opcional — regras curtas, valor da mensalidade, etc."
        error={state.fieldErrors?.description}
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={280}
          placeholder="Pelada amistosa, sem catimba."
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
      className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-base font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Criando..." : "Criar pelada"}
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
