"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, inputClass } from "@/components/ui";
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
    if (!slugTouched) setSlug(suggestSlugFromName(name));
  }, [name, slugTouched]);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)]"
        >
          {state.message}
        </div>
      )}

      <Field label="Nome da pelada" htmlFor="name" required error={state.fieldErrors?.name}>
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
        label="Endereço (link)"
        htmlFor="slug"
        required
        hint="Vai virar resenha.app/p/seu-endereco"
        error={state.fieldErrors?.slug}
      >
        <div className="flex items-stretch">
          <span className="inline-flex select-none items-center rounded-l-xl border border-r-0 border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-muted)] px-3 text-sm text-[color:var(--color-ink-muted)]">
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
        <Field label="Dia da semana" htmlFor="weekday" required error={state.fieldErrors?.weekday}>
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

        <Field label="Horário" htmlFor="startTime" required error={state.fieldErrors?.startTime}>
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

      <Field label="Local" htmlFor="location" required error={state.fieldErrors?.location}>
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
        required
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
    <Button type="submit" variant="primary" size="xl" fullWidth disabled={pending}>
      {pending ? "Criando..." : "Criar pelada"}
    </Button>
  );
}
