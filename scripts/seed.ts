/**
 * Dev seed — populates a realistic "Cornetas" pelada so we don't have
 * to click through onboarding every time we wipe the DB.
 *
 * Usage:
 *   SEED_ADMIN_EMAIL=you@gmail.com pnpm db:seed
 *
 * The admin user is matched by `email` — if it already exists, we attach
 * them to the seeded pelada as admin. If not, we create a placeholder
 * user record (no OAuth account) so the next sign-in lands you straight
 * in the pelada.
 *
 * Idempotent: removes the existing `seed-cornetas` pelada (cascade) and
 * recreates it from scratch every run.
 */

import { config as loadEnv } from "dotenv";

// ⚠️  Load .env BEFORE importing anything that touches process.env
// (lib/db/client.ts throws if DATABASE_URL is missing at import time).
loadEnv({ path: ".env.local", override: false });
loadEnv({ override: false });

const SLUG = "seed-cornetas";

const PLAYERS: Array<{
  name: string;
  nickname: string;
  shirtNumber: number;
  preferredPosition: "goalkeeper" | "defender" | "midfielder" | "forward" | "outfield";
}> = [
  { name: "Joaquim Bastos", nickname: "Joaquim", shirtNumber: 1, preferredPosition: "goalkeeper" },
  { name: "Roberto Lima", nickname: "Beto", shirtNumber: 5, preferredPosition: "defender" },
  { name: "Diego Castro", nickname: "Diego", shirtNumber: 10, preferredPosition: "midfielder" },
  { name: "Lucas Pinto", nickname: "Luquinha", shirtNumber: 9, preferredPosition: "forward" },
  { name: "Felipe Andrade", nickname: "Felipão", shirtNumber: 7, preferredPosition: "midfielder" },
  { name: "Bruno Carvalho", nickname: "Brunão", shirtNumber: 4, preferredPosition: "defender" },
  { name: "Caio Rocha", nickname: "Caio", shirtNumber: 11, preferredPosition: "forward" },
  { name: "Paulo Soares", nickname: "Paulinho", shirtNumber: 6, preferredPosition: "midfielder" },
  { name: "André Martins", nickname: "Dedé", shirtNumber: 8, preferredPosition: "midfielder" },
  {
    name: "Marcos Henrique",
    nickname: "Marquinhos",
    shirtNumber: 3,
    preferredPosition: "defender",
  },
  { name: "Tiago Almeida", nickname: "Tiago", shirtNumber: 2, preferredPosition: "defender" },
  { name: "Rafael Souza", nickname: "Rafa", shirtNumber: 99, preferredPosition: "outfield" },
];

function nextSaturdayAt(hour: number, minute = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const offset = (6 - day + 7) % 7 || 7;
  const d = new Date(now);
  d.setDate(now.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    console.error(
      "\n❌  SEED_ADMIN_EMAIL não definido.\n\n" +
        "   Rode com o seu email:\n" +
        "     SEED_ADMIN_EMAIL=voce@gmail.com pnpm db:seed\n",
    );
    process.exit(1);
  }

  console.log(`🌱 Iniciando seed — admin: ${adminEmail}`);

  // dynamic imports → guarantee env vars are loaded before db/client.ts runs
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db/client");
  const { matches, memberships, peladas, rosterEntries, users } = await import(
    "../src/lib/db/schema"
  );

  // 1) garantir admin user
  const [adminUser] = await db
    .insert(users)
    .values({ email: adminEmail, name: "Admin (seed)" })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: "Admin (seed)" },
    })
    .returning();

  if (!adminUser) throw new Error("Falha ao garantir admin user.");
  console.log(`   👤  admin user → ${adminUser.id}`);

  // 2) limpar pelada antiga (cascade apaga memberships, matches, etc)
  const existing = await db
    .select({ id: peladas.id })
    .from(peladas)
    .where(eq(peladas.slug, SLUG))
    .limit(1);
  if (existing.length > 0 && existing[0]) {
    await db.delete(peladas).where(eq(peladas.id, existing[0].id));
    console.log(`   🧹  pelada antiga removida (${SLUG})`);
  }

  // 3) criar pelada
  const [pelada] = await db
    .insert(peladas)
    .values({
      slug: SLUG,
      name: "Cornetas FC",
      description: "Pelada de teste — populada por scripts/seed.ts",
      weekday: "saturday",
      startTime: "16:00",
      location: "Quadra do Zezinho",
      address: "Rua das Palmeiras, 123 — São Paulo/SP",
      maxPlayers: 14,
      ownerUserId: adminUser.id,
    })
    .returning();

  if (!pelada) throw new Error("Falha ao criar pelada.");
  console.log(`   ⚽  pelada criada → /p/${pelada.slug}`);

  // 4) admin membership
  await db.insert(memberships).values({
    userId: adminUser.id,
    peladaId: pelada.id,
    role: "admin",
    nickname: "Capitão",
    shirtNumber: 10,
    preferredPosition: "midfielder",
  });

  // 5) phantom users + memberships
  const phantomMemberships: string[] = [];
  for (const p of PLAYERS) {
    const phantomEmail = `${p.nickname.toLowerCase().replace(/\W+/g, "")}@resenha.seed`;
    const [phantomUser] = await db
      .insert(users)
      .values({ email: phantomEmail, name: p.name })
      .onConflictDoUpdate({ target: users.email, set: { name: p.name } })
      .returning();
    if (!phantomUser) throw new Error(`Falha no phantom user ${phantomEmail}`);

    const [m] = await db
      .insert(memberships)
      .values({
        userId: phantomUser.id,
        peladaId: pelada.id,
        role: "player",
        nickname: p.nickname,
        shirtNumber: p.shirtNumber,
        preferredPosition: p.preferredPosition,
      })
      .returning();
    if (m) phantomMemberships.push(m.id);
  }
  console.log(`   👥  ${phantomMemberships.length} jogadores criados`);

  // 6) match com lista aberta no próximo sábado — Joaquim escalado como juiz
  const refereeMembershipId = phantomMemberships[0] ?? null;
  const [match] = await db
    .insert(matches)
    .values({
      peladaId: pelada.id,
      scheduledFor: nextSaturdayAt(16),
      status: "roster_open",
      activeRefereeId: refereeMembershipId,
      notes: "Trazer colete escuro.",
    })
    .returning();
  if (!match) throw new Error("Falha ao criar match.");
  console.log(`   📅  partida criada (status=roster_open) → ${match.id}`);
  if (refereeMembershipId) console.log(`   🧑‍⚖️  juiz designado: ${PLAYERS[0]?.nickname}`);

  // 7) confirmar primeiros 9 jogadores (skip juiz, deixa alguns sem responder)
  const candidates = phantomMemberships.filter((id) => id !== refereeMembershipId);
  const toConfirm = candidates.slice(0, 9);
  let pos = 1;
  for (const mid of toConfirm) {
    await db.insert(rosterEntries).values({
      matchId: match.id,
      membershipId: mid,
      status: "confirmed",
      listPosition: pos++,
    });
  }
  console.log(`   ✅  ${toConfirm.length} jogadores confirmados`);

  console.log(`\n✨ Pronto! Faça login com ${adminEmail} e abra:\n   /p/${SLUG}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n💥 Erro no seed:", err);
  process.exit(1);
});
