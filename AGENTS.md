<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:resenha-conventions -->
# Padrões do projeto resenha

Leia os documentos abaixo **antes** de propor mudanças. Não invente padrões — siga os existentes.

- 📐 [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) — naming, TypeScript, patterns, tooling, git workflow
- 📄 [`ARCHITECTURE.md`](./ARCHITECTURE.md) — modelo de domínio, fases F1→F4, multi-tenancy, regras de negócio (§5.4)
- 🎨 [`WIREFRAMES_F1.md`](./WIREFRAMES_F1.md) — fluxos e UX da fase atual
- 🚀 [`SETUP.md`](./SETUP.md) — bootstrap operacional

## Regras-resumo (não exaustivo)

**Língua**
- Código (variáveis, funções, tipos, arquivos, commits, logs) em **inglês**.
- UI/copy em **pt-BR**. Termos `Pelada` e `Resenha` permanecem em PT por serem culturais.

**TypeScript**
- Sem `any`. Use `unknown` + narrow. Validação nas bordas com **Zod**.
- Branded IDs (`UserId`, `PeladaId`, etc.) em `src/lib/db/ids.ts`.
- Union literal types, não `enum`.

**Arquitetura de camadas**
- `lib/domain/*` é PURO — NUNCA importa Drizzle, Next.js, Auth.js.
- `lib/db/*` não importa de `app/` ou `server/`.
- `app/*` importa `server/*` e `components/*` — nunca diretamente de `lib/db/*`.
- Toda Server Action chama `getPeladaContext(slug)` antes de qualquer query (tenant isolation).

**Next.js**
- Server Components first; `'use client'` só nas folhas.
- Mutações via **Server Actions**, não API routes (exceto webhooks externos).
- Forms via React Hook Form + Zod resolver com schema compartilhado client↔server.

**Erros**
- Domain: lança `AppError`/subclasses OU retorna `Result<T, E>`.
- Server Actions capturam e convertem em mensagem amigável.

**Git**
- Conventional Commits em inglês (`feat:`, `fix:`, `refactor:`, etc.).
- Branches curtas: `feat/*`, `fix/*`, `chore/*`. Merge para `main` via PR.

**Definition of Done** (CS §14)
- Tipagem completa, sem `any`. Input validado com Zod. Domain com testes. Lint/typecheck/testes passam. Mobile OK. A11y básica. Docs atualizados.
<!-- END:resenha-conventions -->

<!-- BEGIN:current-state -->
# Estado atual da sessão (2026-06-06)

> Esta seção é **temporária** — atualizar conforme avançamos. Quando F1 estiver pronto, remover.

## ✅ Concluído

### Infra & tooling

- Scaffold Next.js 16 + React 19 + TS strict (commits `1d914ce`, `85de91c`)
- Tooling: Biome, Husky, lint-staged, commitlint, Vitest, Playwright, Drizzle Kit
- Estrutura de pastas em `src/` (camadas: `app`, `server/{actions,queries,services}`, `lib/{domain,db,auth,utils,errors}`, `components/{ui,domain}`)
- Utils base: `cn`, `Result`, `AppError` hierarchy, branded IDs
- CI workflow (`.github/workflows/ci.yml`) — verde no último push
- `commitlint` flexibilizado pra ignorar commits internos de ferramentas (`checkpoint`, `Merge`, `Revert`, `WIP`) — commit `6631424`
- `dotenv` devDep + `drizzle.config.ts` lê `.env.local` automaticamente
- `biome.json` ignora `src/lib/db/migrations/` (evita guerra de format com drizzle-kit)
- `vitest.test:ci` com `--passWithNoTests` (CI não bloqueia enquanto a gente não tem testes)

### Serviços externos (todas as 3 etapas humanas concluídas)

- **Supabase**: projeto criado (sa-east-1), `DATABASE_URL` (pooler 6543) em `.env.local`
- **Auth.js secret**: `AUTH_SECRET` gerado em `.env.local`
- **Google OAuth**: Client criado no Google Cloud Console; `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` em `.env.local`; redirect URIs configuradas pra `http://localhost:3000` **e** `https://resenha-ten.vercel.app`
- **Resend**: conta criada, API key em `AUTH_RESEND_KEY`; remetente `onboarding@resend.dev` (sandbox — só envia pro e-mail dono da conta)
- **Vercel**: projeto importado de `jomo-ramon/resenha`, todas as env vars cadastradas (incluindo `AUTH_URL`/`NEXTAUTH_URL` apontando pra prod), deploy ao vivo em **https://resenha-ten.vercel.app/**

> ⚠️ **Pendências menores no Vercel/Supabase** (não bloqueiam F1):
> - Vars de Supabase Storage (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) ficaram vazias — só precisam quando ligarmos upload de foto (F2).
> - Domínio próprio na Vercel — F4 (cobrança/marketing). Por enquanto `resenha-ten.vercel.app` serve.

### Persistência

- **Schema F1 completo** em `src/lib/db/schema/` — 11 tabelas:
  - `auth.ts`: `user`, `account`, `session`, `verificationToken` (compat 100% com `@auth/drizzle-adapter`)
  - `peladas.ts`: `pelada`, `membership` (com unique `userId+peladaId`)
  - `matches.ts`: `match`, `rosterEntry`, `team`, `teamPlayer`, `matchEvent`
- **Drizzle client singleton** em `src/lib/db/client.ts` (Postgres.js + pooled, `prepare: false`)
- **Primeira migration** (`0000_past_wither.sql`) aplicada no Supabase

### Auth + multi-tenancy

- **Auth.js v5** em `src/lib/auth/index.ts` — DrizzleAdapter + Google + Resend (magic link), session strategy `database`, `trustHost: true`
- **Route handler** em `src/app/api/auth/[...nextauth]/route.ts`
- **`getPeladaContext(slug)` + `assertRole(...)`** em `src/lib/multitenancy.ts` — toda Server Action escopada por Pelada DEVE começar por aqui

### Primeira UI funcional

- **`/entrar`** (`src/app/(auth)/entrar/page.tsx`) — botão Google + form de magic link, mensagens de erro em pt-BR. Honra `callbackUrl` (com proteção open-redirect).
- **`/`** — landing pública; logado → redireciona pra `/peladas`.
- **Validado em prod**: login Google + sair (06/06 ~01:20).

### Onboarding (criar pelada)

- **Domain** `src/lib/domain/pelada.ts` — schemas Zod compartilhados (slug, weekday, createPeladaInput) + helper `suggestSlugFromName` + 15 testes.
- **Server Action** `createPeladaAction` — Pelada + Membership(admin) em transação única; trata `23505` (slug duplicado) com erro amigável.
- **Query** `listPeladasOfCurrentUser`.
- **(app) route group** com layout autenticado (header + sair).
- **`/peladas`** lista; vazia → redireciona pra `/nova-pelada`.
- **`/nova-pelada`** form (useActionState + slug auto-sugerido do nome).
- **`/p/[peladaSlug]`** dashboard mínimo via `getPeladaContext`.
- **Validado em prod** (06/06 ~01:40).

### Convite de jogadores (link público)

- **Schema** `pelada.inviteToken text unique not null` (migration `0001_*` com backfill seguro).
- **Server Actions** `acceptInviteAction` (idempotente), `regenerateInviteTokenAction` (admin only).
- **`/p/[slug]/entrar?token=…`** página pública: token inválido → tela específica; deslogado → `/entrar?callbackUrl=…`; logado → form de aceitar.
- **InvitePanel** no dashboard (admin only) — URL copiável, feedback "Copiado!" 2s, renovar com confirm inline.
- **Validado em prod** (06/06 ~02:30).

### Agendar partida + lista de presença

- **Domain** `src/lib/domain/match.ts` — `createMatchInputSchema`, FSM helpers (`canTransition`, `isRosterAcceptingResponses`, `canCancelMatch`) + 14 testes.
- **Server Actions**: `createMatchAction` (admin only, status=roster_open), `confirmAttendanceAction`/`declineAttendanceAction` (transação + promoção FIFO da waitlist), `cancelMatchAction` (admin only, antes do sorteio).
- **Query**: `getNextUpcomingMatch` (com contagens agregadas), `getMatchWithRoster` (com teams + eventos já no shape final).
- **`/p/[slug]/nova-partida`** form (próximo sábado às 11h como default).
- **`/p/[slug]/m/[matchId]`** página da partida.
- **Validado em prod** (06/06 ~03:00).

### Perfil de membership

- **Domain** `src/lib/domain/membership.ts` — `updateMembershipProfileSchema` + `PREFERRED_POSITION_LABELS`.
- **Server Action** `updateMyMembershipAction` — escopo por pelada, nickname + shirtNumber + preferredPosition.
- **`/p/[slug]/perfil`** form simples; "Editar perfil" no header do dashboard.

### Sorteio manual de times

- **Domain** `src/lib/domain/team-draft.ts` — `TEAM_LIGHT`/`TEAM_DARK`, `draftTeamsInputSchema`, `buildDraftFromAssignments` + 10 testes.
- **Server Actions** `draftTeamsAction` (admin only, atômica: valida confirmação, dropa teams, recria), `clearDraftAction` (volta pra `roster_open`).
- **`/p/[slug]/m/[matchId]/times`** editor 3-zonas (pool / Claro / Escuro), capitão togglável (★), "Embaralhar aleatoriamente" como conveniência, X vs Y count + warning se desigual.
- **TeamsBoard** (server component) usado em `teams_drafted`/`in_progress`/`finished` com placar grande + rosters por time com goal counters.

### Modo juiz (sem lock — convenção)

- **Domain** `src/lib/domain/match-event.ts` — `addMatchEventInputSchema`, `computeScore` (own_goal vai pro outro time) + 8 testes.
- **Server Actions** (admin|referee, status-guarded): `startMatchAction` (teams_drafted → in_progress), `addMatchEventAction` (valida player num dos 2 times), `removeMatchEventAction` (in_progress OR finished), `finishMatchAction` (computa placar, grava `team.finalScore`, status='finished').
- **RefereePanel** (client): 2 botões grandes "+ Gol Claro / + Gol Escuro" como caso 95%, `<details>` recolhível com assist + cards + own_goal, modal player picker com minuto opcional, timeline editável, encerrar com confirm inline.
- **`activeRefereeId` lock**: deferido pra F2 (F1 funciona pela convenção "um juiz por vez").

### Ranking artilharia

- **Query** `getTopScorers(peladaId)` em `src/server/queries/ranking.ts` — agrega `matchEvent` JOIN `match` (status=finished), retorna gols/assists/cartões/partidas-jogadas; sort por gols → assists → menos partidas.
- **`/p/[slug]/ranking`** tabela responsiva com medalhas no top 3, destaca usuário atual, empty state amigável.

### PWA

- **`src/app/manifest.ts`** (`MetadataRoute.Manifest`) — `start_url=/peladas`, `display: standalone`, theme zinc.
- **`src/app/icon.tsx`** + **`apple-icon.tsx`** — PNGs gerados em runtime via `next/og` `ImageResponse` (sem binários no repo).
- **`public/sw.js`** — service worker mínimo: network-first em navegações, cache-first em `/_next/static`, sem precache.
- **`PWARegister`** (client) registra SW só em production após `load`.
- Meta tags `appleWebApp` + viewport portrait + `theme_color` no root layout.

### Design system + visual identity (sessão 06/06 tarde)

- **Tokens em `globals.css`**: paleta verde-grama (#16a34a brand + brand-strong/soft/ink), neutros warm-stone, cores funcionais (warning/danger/captain/medal), team Light/Dark, radii 0.5→1.5rem, sombras 3 níveis + `--shadow-brand`. Geist Sans aplicada (era Arial fallback). Utilities `.bg-pitch` (gradiente listrado de gramado) e `.bg-brand-gradient`.
- **UI primitives em `src/components/ui/`**: Button + ButtonLink (5 variants × 4 sizes), Badge + LiveBadge animada, Card/CardHeader/CardBody, Field+inputClass compartilhado, EmptyState, Logo + BallGlyph (SVG inline), MatchStatusBadge.
- **App shell em `src/components/app-shell/`**: AppHeader sticky com avatar (next/image) + BottomTabBar (4 abas: Início/Partidas/Ranking/Perfil, slug parseado do pathname, safe-area-inset).
- **MatchCard domain**: card reutilizável usado na lista de partidas e dashboard.
- **Telas redesenhadas**: landing (hero `.bg-pitch`), entrar, aceitar convite, /peladas (cards), /nova-pelada, dashboard (próxima partida com gradient brand + presence bar + 4 atalhos), partida (status badge + scoreboard 6xl + roster com goal counters inline), referee panel (botões "+ Gol" 96px), ranking (pódio top 3 + tabela com medalhas).
- **Nova rota**: `/p/[slug]/partidas` (lista próximas + histórico, ancora a tab "Partidas") + query `listMatches(peladaId, { status, limit })`.

## 🤖 Próximos blocos (agent pode tocar sozinho)

Validação humana só **no final de cada bloco** (visual + smoke test).

1. **Edição de pelada** — admin trocar nome/dia/horário/local sem precisar de DB direto.
2. **Gerenciar members** — admin remover, promover/rebaixar role (admin↔referee↔player); página `/p/[slug]/jogadores`.
3. **Editar/cancelar partida** — mudar horário/local; cancelar com motivo registrado.
4. **Histórico de partidas** — `/p/[slug]/historico` paginado com filtro por mês.
5. **Compartilhar placar no WhatsApp** — botão na tela `finished` usando Web Share API com texto formatado.
6. **UX polish** — skeletons de loading (Suspense), toasts de feedback, breadcrumb no `AppHeader`, onboarding pra primeira pelada.
7. **Foto de perfil** — Supabase Storage upload no `/p/[slug]/perfil` (precisa preencher vars `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).
8. **Algoritmo de balanceamento** — quando a gente tiver ratings (F2/F3).
9. **`activeRefereeId` lock otimista** — pra ter mais de 1 admin sem step on each other.

### ✅ Concluído nesta sessão (madrugada 07/06)

- **Seed dev** (`pnpm db:seed`) — cria `seed-cornetas` com 12 jogadores fictícios + 1 partida com lista aberta (9 confirmados). Idempotente: limpa a pelada anterior antes. Requer `SEED_ADMIN_EMAIL=voce@gmail.com`.
- **Destaques da partida** — agregação de artilheiros/assists/cartões por partida no card `finished`.
- **Scout estilo Cartola FC** (3 commits):
  1. Schema: novos `MatchEventType` (`save`, `tackle`), tabela `playerRating` (0–10), `peladaRules.eventPoints` configurável. Domínio puro em `lib/domain/scout.ts` (`DEFAULT_EVENT_POINTS`, `computePoints`, `aggregateCounts`) e `lib/domain/player-rating.ts`. Migration `0002_chunky_quicksilver`. 23 novos testes.
  2. Captura: botões "+ Defesa" e "+ Desarme" ao vivo no referee panel + nova página `/p/[slug]/m/[matchId]/scout` (admin/referee) com counters por evento + slider 0–10 + comentário. Ação `saveMatchScoutAction` faz delete+reinsert atômico dos events da partida e upsert dos ratings.
  3. Exibição: ranking refeito por **pontos** (Cartola-style) com nota média e colunas detalhadas (gols/assists/defesas/desarmes/cartões); `MatchHighlights` mostra "Pontuação" como primeira seção; nova página `/p/[slug]/configuracoes` (admin) pra editar pesos por evento; atalho "Configurações" no dashboard admin.

## 📦 Estado do Git

- Branch `main` sincronizada com `origin/main` após push final desta sessão (tarde 06/06).
- Últimos commits: design tokens + UI primitives, app shell + Partidas page, rebuild visual de todas as telas.
- CI verde, build ok (17 rotas), 47 tests.

## 🔑 Princípios de trabalho

- **Validação por bloco, não por linha.** Agent entrega features fechadas com checklist; humano valida visualmente e testa fluxo.
- **Sempre rodar `pnpm typecheck && pnpm lint && pnpm test:ci && pnpm build` antes de commit.**
- **Decisões de arquitetura grandes** (algoritmo de sorteio equilibrado, modelo de cobrança F4) só com cabeça fresca — agendar pra sessão diurna.
<!-- END:current-state -->
