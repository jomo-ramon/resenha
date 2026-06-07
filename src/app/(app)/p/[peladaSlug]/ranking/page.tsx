import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { getRanking, type RankingRow } from "@/server/queries/ranking";

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

  const ranking = await getRanking(ctx.pelada.id, ctx.pelada.rules, 50);
  const meRow = ranking.find((r) => r.membershipId === ctx.membership.id);
  const mePosition = meRow ? ranking.indexOf(meRow) + 1 : null;

  return (
    <div className="space-y-6">
      <Link
        href={`/p/${peladaSlug}`}
        className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
      >
        ← Voltar pra pelada
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
          {ctx.pelada.name}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">🏆 Ranking</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Pontuação por desempenho (scout) somada em todas as partidas encerradas. Notas e pesos são
          ajustados pelo admin em <strong>Configurações</strong>.
        </p>
      </header>

      {ranking.length === 0 ? (
        <EmptyState
          icon={<span aria-hidden="true">🏟️</span>}
          title="Ranking vazio"
          description="Quando a primeira partida for encerrada com scout registrado, ele aparece aqui."
        />
      ) : (
        <>
          {ranking.length >= 3 && (
            <PodiumTop3 rows={ranking.slice(0, 3)} meId={ctx.membership.id} />
          )}

          <div className="overflow-x-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-sm)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[color:var(--color-surface-muted)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">#</th>
                  <th className="px-3 py-3">Jogador</th>
                  <th className="px-2 py-3 text-center" title="Pontos totais">
                    PTS
                  </th>
                  <th className="px-2 py-3 text-center" title="Nota média do juiz">
                    ★
                  </th>
                  <th className="px-2 py-3 text-center" title="Gols">
                    ⚽
                  </th>
                  <th className="px-2 py-3 text-center" title="Assistências">
                    🅰
                  </th>
                  <th className="px-2 py-3 text-center" title="Defesas difíceis">
                    🧤
                  </th>
                  <th className="px-2 py-3 text-center" title="Desarmes">
                    🛡
                  </th>
                  <th className="px-2 py-3 text-center" title="Cartões amarelos">
                    🟨
                  </th>
                  <th className="px-2 py-3 text-center" title="Cartões vermelhos">
                    🟥
                  </th>
                  <th className="px-2 py-3 text-center" title="Partidas">
                    J
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border)]">
                {ranking.map((row, i) => {
                  const isMe = row.membershipId === ctx.membership.id;
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  return (
                    <tr
                      key={row.membershipId}
                      className={isMe ? "bg-[color:var(--color-brand-soft)]/40" : ""}
                    >
                      <td className="px-3 py-3 text-center font-mono text-sm text-[color:var(--color-ink-muted)]">
                        {medal ?? i + 1}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={row.displayName}
                            shirtNumber={row.shirtNumber}
                            size="sm"
                            tone={isMe ? "brand" : "default"}
                          />
                          <span
                            className={
                              isMe ? "font-extrabold text-[color:var(--color-brand)]" : "font-bold"
                            }
                          >
                            {row.displayName}
                          </span>
                          {isMe && (
                            <Badge tone="brand" size="xs">
                              Você
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center text-base font-extrabold tabular-nums text-[color:var(--color-brand)]">
                        {row.points}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-[color:var(--color-ink-soft)]">
                        {row.averageRating !== null ? (
                          <span
                            title={`${row.ratingCount} nota${row.ratingCount === 1 ? "" : "s"}`}
                          >
                            {row.averageRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="opacity-30">—</span>
                        )}
                      </td>
                      <Cell value={row.goals} accent="brand-strong" />
                      <Cell value={row.assists} />
                      <Cell value={row.saves} />
                      <Cell value={row.tackles} />
                      <Cell value={row.yellowCards} />
                      <Cell value={row.redCards} />
                      <Cell value={row.matchesPlayed} muted />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {mePosition && mePosition > 3 && meRow && (
            <div className="rounded-2xl border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand-ink)]">
                Você
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-brand-ink)]">
                📍 {mePosition}º lugar · <span className="font-bold">{meRow.points}</span> pontos ·{" "}
                {meRow.goals} gol{meRow.goals === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Cell({
  value,
  accent,
  muted,
}: {
  value: number;
  accent?: "brand-strong";
  muted?: boolean;
}) {
  if (value === 0) {
    return <td className="px-2 py-3 text-center tabular-nums opacity-30">—</td>;
  }
  const cls =
    accent === "brand-strong"
      ? "text-[color:var(--color-brand-strong)] font-extrabold"
      : muted
        ? "text-[color:var(--color-ink-muted)]"
        : "text-[color:var(--color-ink-soft)]";
  return <td className={`px-2 py-3 text-center tabular-nums ${cls}`}>{value}</td>;
}

function PodiumTop3({ rows, meId }: { rows: RankingRow[]; meId: string }) {
  const [first, second, third] = rows;
  if (!first || !second || !third) return null;

  return (
    <div className="grid grid-cols-3 items-end gap-2">
      <PodiumCard
        place={2}
        row={second}
        isMe={second.membershipId === meId}
        height="h-28"
        emoji="🥈"
      />
      <PodiumCard
        place={1}
        row={first}
        isMe={first.membershipId === meId}
        height="h-36"
        emoji="🥇"
        highlight
      />
      <PodiumCard
        place={3}
        row={third}
        isMe={third.membershipId === meId}
        height="h-24"
        emoji="🥉"
      />
    </div>
  );
}

function PodiumCard({
  place,
  row,
  isMe,
  height,
  emoji,
  highlight,
}: {
  place: number;
  row: RankingRow;
  isMe: boolean;
  height: string;
  emoji: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-2xl">{emoji}</span>
      <p className="line-clamp-1 max-w-full px-1 text-center text-sm font-bold">
        {row.displayName}
        {isMe && <span className="ml-1 text-xs text-[color:var(--color-ink-muted)]">(você)</span>}
      </p>
      <div
        className={`flex w-full ${height} flex-col items-center justify-center rounded-t-xl ${
          highlight
            ? "bg-brand-gradient text-white shadow-[var(--shadow-md)]"
            : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-ink)]"
        }`}
      >
        <span className="text-3xl font-extrabold tabular-nums">{row.points}</span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? "text-white/85" : "text-[color:var(--color-ink-muted)]"}`}
        >
          {place}º · pts
        </span>
      </div>
    </div>
  );
}
