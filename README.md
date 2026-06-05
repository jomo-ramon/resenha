# resenha

> A plataforma da sua pelada.

Organize peladas amadoras de futebol: lista de presença, sorteio de times, placar, gols, notas do juiz, ranking de artilharia e — em breve — cartola, ligas e conquistas.

**Pelada piloto**: Cornetas (sábados).

---

## Status

🏗️ **Bootstrap completo.** Stack instalado, tooling configurado, estrutura definida.
Próxima etapa: schema do banco + auth + primeira tela funcional (F1).

### Documentos

- 📄 [`ARCHITECTURE.md`](./ARCHITECTURE.md) — visão completa do produto, stack, modelo de dados e roteiro
- 📐 [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) — padrões de código, naming, tooling e design patterns
- 🎨 [`WIREFRAMES_F1.md`](./WIREFRAMES_F1.md) — sitemap, fluxos e wireframes textuais das telas da F1
- 🚀 [`SETUP.md`](./SETUP.md) — roteiro operacional pra bootstrappar o projeto
- 🤖 [`AGENTS.md`](./AGENTS.md) — instruções pra agentes de IA (Cursor, Claude, etc.) trabalhando no repo

---

## Visão por fases

| Fase | Entrega | Status |
|---|---|---|
| **F1 — Operacional** | Lista, sorteio, placar, gols, artilharia | 🎯 próximo |
| **F2 — Engajamento** | Notas do juiz, perfil, estatísticas, resenha | ⏳ planejado |
| **F3 — Gamificação** | Cartola, ligas, conquistas | ⏳ planejado |
| **F4 — Escala** | Multi-peladas, mensalidades, campeonatos | ⏳ planejado |

---

## Stack (planejada)

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **PostgreSQL** via **Supabase** (DB + Storage + Realtime)
- **Drizzle ORM**
- **Auth.js** (Google + magic link)
- **next-pwa** (mobile-first, offline-tolerante)
- **Vercel** (hospedagem) — custo zero pro MVP

---

## Começando

Requisitos: **Node 20+**, **pnpm 10+**, **PostgreSQL** (recomendado: Supabase).

```bash
pnpm install
cp .env.example .env.local   # preencher Supabase, Google OAuth, Auth.js secret
pnpm dev                     # http://localhost:3000
```

Scripts disponíveis:

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # build de produção
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome check
pnpm lint:fix     # biome check --write
pnpm format       # biome format --write
pnpm test         # vitest (watch)
pnpm test:ci      # vitest run --coverage
pnpm test:e2e     # playwright
pnpm db:generate  # drizzle-kit (gerar migration)
pnpm db:migrate   # rodar migrations
pnpm db:studio    # abrir Drizzle Studio
```
