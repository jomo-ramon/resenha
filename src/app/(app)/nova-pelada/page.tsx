import type { Metadata } from "next";
import Link from "next/link";
import { NovaPeladaForm } from "./nova-pelada-form";

export const metadata: Metadata = {
  title: "Nova pelada — resenha",
};

export default function NovaPeladaPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/peladas"
        className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
      >
        ← Voltar pras peladas
      </Link>

      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand)]">
          Nova pelada
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Como vai chamar?</h1>
        <p className="text-sm text-[color:var(--color-ink-soft)]">
          Você vira admin automaticamente e pode convidar a galera depois.
        </p>
      </header>

      <NovaPeladaForm />
    </div>
  );
}
