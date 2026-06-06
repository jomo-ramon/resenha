import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { getTopScorers } from "@/server/queries/ranking";

type Params = Promise<{ peladaSlug: string }>;

export const metadata: Metadata = {
  title: "Ranking — resenha",
};

export default async function RankingPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
    throw error;
  }

  const ranking = await getTopScorers(ctx.pelada.id, 50);

  return (
    <div className="space-y-6">
      <Link
        href={`/p/${peladaSlug}`}
        className="text-sm text-zinc-500 underline-offset-4 hover:underline"
      >
        ← Voltar pra pelada
      </Link>

      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Ranking de artilharia</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Soma de gols, assistências e cartões nas partidas encerradas.
        </p>
      </header>

      {ranking.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-base font-semibold">Ranking vazio</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Quando a primeira partida for encerrada com gols registrados, ele aparece aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2.5 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">Jogador</th>
                <th className="px-3 py-2.5 text-center font-medium" title="Gols">
                  ⚽
                </th>
                <th className="px-3 py-2.5 text-center font-medium" title="Assistências">
                  🅰️
                </th>
                <th className="px-3 py-2.5 text-center font-medium" title="Cartões amarelos">
                  🟨
                </th>
                <th className="px-3 py-2.5 text-center font-medium" title="Cartões vermelhos">
                  🟥
                </th>
                <th className="px-3 py-2.5 text-center font-medium" title="Partidas">
                  J
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {ranking.map((row, i) => {
                const isMe = row.membershipId === ctx.membership.id;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <tr
                    key={row.membershipId}
                    className={isMe ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}
                  >
                    <td className="px-3 py-2.5 font-mono text-zinc-500">{medal ?? i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className={isMe ? "font-semibold" : ""}>
                        {row.displayName}
                        {row.shirtNumber !== null && (
                          <span className="ml-1.5 text-xs text-zinc-500">#{row.shirtNumber}</span>
                        )}
                        {isMe && <span className="ml-1.5 text-xs text-zinc-500">(você)</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums font-semibold">
                      {row.goals}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                      {row.assists}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                      {row.yellowCards || ""}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                      {row.redCards || ""}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-zinc-500">
                      {row.matchesPlayed}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
