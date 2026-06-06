import type { Metadata } from "next";
import { NovaPeladaForm } from "./nova-pelada-form";

export const metadata: Metadata = {
  title: "Nova pelada — resenha",
};

export default function NovaPeladaPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Nova pelada</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Cria sua pelada. Você vira admin automaticamente e pode convidar a galera depois.
        </p>
      </header>

      <NovaPeladaForm />
    </div>
  );
}
