import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { PerfilForm } from "./perfil-form";

type Params = Promise<{ peladaSlug: string }>;

export const metadata: Metadata = {
  title: "Meu perfil — resenha",
};

export default async function PerfilPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
    throw error;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href={`/p/${peladaSlug}`}
        className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
      >
        ← Voltar pra pelada
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
          Em {ctx.pelada.name}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Meu perfil</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Seu apelido aparece pra galera nos times e no ranking.
        </p>
      </header>

      <PerfilForm
        slug={peladaSlug}
        defaults={{
          nickname: ctx.membership.nickname ?? "",
          shirtNumber: ctx.membership.shirtNumber,
          preferredPosition: ctx.membership.preferredPosition,
        }}
      />
    </div>
  );
}
