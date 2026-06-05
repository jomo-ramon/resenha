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
# Estado atual da sessão (2026-06-05)

> Esta seção é **temporária** — atualizar conforme avançamos. Quando F1 estiver pronto, remover.

## ✅ Concluído

- Scaffold Next.js 16 + React 19 + TS strict (commits `1d914ce`, `85de91c`)
- Tooling: Biome, Husky, lint-staged, commitlint, Vitest, Playwright, Drizzle Kit
- Estrutura de pastas em `src/` (camadas: `app`, `server/{actions,queries,services}`, `lib/{domain,db,auth,utils,errors}`, `components/{ui,domain}`)
- Utils base: `cn`, `Result`, `AppError` hierarchy, branded IDs
- CI workflow (`.github/workflows/ci.yml`)
- **Supabase**: projeto criado (sa-east-1), `DATABASE_URL` em `.env.local`
- **Auth.js**: `AUTH_SECRET` gerado em `.env.local`
- `commitlint` flexibilizado pra ignorar commits internos de ferramentas (`checkpoint`, `Merge`, `Revert`, `WIP`) — commit `6631424`

## 🧑‍💻 Pendente do humano (não tem como agent fazer sozinho)

Pra liberar autonomia total do agent, o usuário precisa concluir, em ordem:

1. **Google OAuth credentials** — Google Cloud Console → criar OAuth Client → copiar `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` pra `.env.local`. Redirect: `http://localhost:3000/api/auth/callback/google` (e domínio Vercel depois).
2. **Resend (magic link email)** — criar conta em resend.com (free tier 3k/mês) → API key → `RESEND_API_KEY` em `.env.local`. Domínio inicial: usar `onboarding@resend.dev` em dev.
3. **Vercel** — login com GitHub → import do repo `jomo-ramon/resenha` → colar **todas** as env vars de `.env.local` no painel da Vercel → deploy.

## 🤖 Pode ser feito pelo agent sem bloqueio humano

Depois das 3 etapas acima, o agent pode entregar (validação humana apenas no final de cada bloco):

1. Schema Drizzle F1 (`src/lib/db/schema/`)
2. Drizzle migrations + seed dev
3. Auth.js v5 config (`src/lib/auth/`)
4. Server actions/queries com tenant isolation (`getPeladaContext`)
5. Onboarding (criar pelada)
6. Dashboard da pelada
7. Criar partida + lista de presença
8. Sorteio de times
9. Modo juiz + finalizar partida
10. Ranking artilharia
11. PWA setup (manifest, icons, service worker via `next-pwa`)

## 📦 Pendente no Git

- 2 commits locais ainda não pushed: `docs: update README...` (`b9a15da`) + `chore(commitlint): ignore tool-generated...` (`6631424`)
- **Próximo handoff:** o novo agent deve começar por `git push origin main`.

## 🔑 Princípios de trabalho

- **Validação por bloco, não por linha.** Agent entrega features fechadas com checklist; humano valida visualmente e testa fluxo.
- **Hoje madrugada (≥ 01h):** humano cansado — agent prioriza configurações leves e tarefas mecânicas. Decisões de arquitetura grandes ficam pra próxima sessão com cabeça fresca.
- **Sempre rodar `pnpm typecheck && pnpm lint && pnpm test` antes de commit.**
<!-- END:current-state -->
