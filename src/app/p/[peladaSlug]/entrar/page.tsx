import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { peladas } from "@/lib/db/schema";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata: Metadata = {
  title: "Convite — resenha",
};

type Params = Promise<{ peladaSlug: string }>;
type SearchParams = Promise<{ token?: string }>;

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { peladaSlug } = await params;
  const { token } = await searchParams;

  if (!token) {
    return <InvalidInviteScreen />;
  }

  const [pelada] = await db
    .select({
      id: peladas.id,
      slug: peladas.slug,
      name: peladas.name,
      location: peladas.location,
      weekday: peladas.weekday,
      startTime: peladas.startTime,
      inviteToken: peladas.inviteToken,
    })
    .from(peladas)
    .where(eq(peladas.slug, peladaSlug))
    .limit(1);

  if (!pelada || pelada.inviteToken !== token) {
    return <InvalidInviteScreen />;
  }

  const session = await auth();
  if (!session?.user) {
    const callbackUrl = `/p/${peladaSlug}/entrar?token=${encodeURIComponent(token)}`;
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Convite</p>
          <h1 className="text-3xl font-bold tracking-tight">{pelada.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {WEEKDAY_LABELS[pelada.weekday] ?? pelada.weekday} às {pelada.startTime} ·{" "}
            {pelada.location}
          </p>
        </header>

        <p className="text-base text-zinc-700 dark:text-zinc-300">
          Você foi convidado a entrar nessa pelada.
        </p>

        <AcceptInviteForm slug={pelada.slug} token={token} />

        <Link
          href="/peladas"
          className="inline-block text-sm text-zinc-500 underline-offset-4 hover:underline"
        >
          Agora não
        </Link>
      </div>
    </main>
  );
}

function InvalidInviteScreen() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Convite inválido</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Esse link expirou ou foi revogado. Pede um novo ao admin da pelada.
        </p>
        <Link
          href="/"
          className="inline-block text-sm text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
        >
          Voltar pro início
        </Link>
      </div>
    </main>
  );
}

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};
