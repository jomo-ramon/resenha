"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, inputClass } from "@/components/ui";
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
        <p className="rounded-xl border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] px-4 py-3 text-sm font-medium text-[color:var(--color-brand-ink)]">
          {state.message}
        </p>
      )}
      {state.status === "error" && state.message && (
        <p className="rounded-xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)]">
          {state.message}
        </p>
      )}

      <Field
        label="Apelido"
        htmlFor="nickname"
        hint="Como a galera te chama. Aparece nos times e no ranking."
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
    <Button type="submit" variant="primary" size="xl" fullWidth disabled={pending}>
      {pending ? "Salvando..." : "Salvar perfil"}
    </Button>
  );
}
