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
