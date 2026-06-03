# Coding Standards — resenha

> Padrões de código para o projeto **resenha**.
> Filosofia: código legível, testável, consistente, e que envelhece bem.
> Este documento é **opinionado**. Quando houver divergência entre o que está aqui e seu gosto pessoal, **siga o documento** — consistência > preferência.

---

## 1. Filosofia

### 1.1 Princípios norteadores

| Princípio | Tradução prática |
|---|---|
| **Clean Code** (Robert C. Martin) | Nome > comentário. Função pequena > comentário. |
| **SOLID** | Aplicado **com bom senso** — não dogma. |
| **KISS** (Keep It Simple, Stupid) | Solução boba que funciona > abstração brilhante. |
| **YAGNI** (You Aren't Gonna Need It) | Não construa pra "talvez". Construa pra **agora** + interface limpa. |
| **DRY com bom senso** | Duplicação aceitável é melhor que abstração errada. Aceite 2x, refatore na 3x. |
| **Composição > herança** | Classes só quando justificável (entidades de domínio, services). |
| **Tipos primeiro** | Modele o tipo, o código segue. |
| **Falha cedo, falha alto** | Validação na borda. Estado inválido não entra no sistema. |

### 1.2 Hierarquia de decisão

Quando estiver na dúvida sobre uma escolha, decida nesta ordem:

1. **Correção** — está certo?
2. **Legibilidade** — outra pessoa entende em 30s?
3. **Testabilidade** — dá pra testar sem mock pesado?
4. **Performance** — só depois das três acima.
5. **Esperteza** — nunca. Código esperto envelhece mal.

---

## 2. Língua

### 2.1 Regra geral: **inglês no código, português na UI/docs/domínio cultural**

| Onde | Língua | Exemplo |
|---|---|---|
| Nomes de variáveis, funções, classes, tipos | **Inglês** | `getMatchById`, `PlayerRating`, `createTeam` |
| Nomes de arquivos e pastas | **Inglês** | `match-service.ts`, `team-draft.tsx` |
| Mensagens de commit | **Inglês** | `feat: add team draft algorithm` |
| Comentários de código | **Inglês** | `// Skip inactive memberships` |
| Documentação (`*.md`) | **Português** | Este documento. |
| Copy de UI (textos visíveis) | **Português (pt-BR)** | "Confirmar presença", "Sortear times" |
| Mensagens de erro pro usuário | **Português** | "Você não tem permissão pra editar essa pelada" |
| Mensagens de erro de sistema (logs/exceções) | **Inglês** | `throw new ForbiddenError("user is not a pelada admin")` |

### 2.2 Exceções: termos culturais intraduzíveis

Alguns conceitos **perdem essência se traduzidos** e ficam **em português** (com `JSDoc` explicando):

| Termo PT | Por que não traduzir | Como referenciar em código |
|---|---|---|
| **Pelada** | Termo brasileiro específico (futebol amador recorrente entre amigos). "Pickup game" perde a conotação social. | `Pelada`, `peladaId`, `peladaSlug` |
| **Resenha** | Conversa/celebração pós-jogo. "Recap" não captura. | `Resenha`, `resenhaPost` |
| **Racha** *(se usado)* | Sinônimo regional de pelada. | manter como está |

Todos os outros conceitos vão pra inglês. Veja o **glossário PT↔EN** em `ARCHITECTURE.md` §5.

---

## 3. Naming conventions

### 3.1 TypeScript / React

| Tipo | Convenção | Exemplo |
|---|---|---|
| Variáveis e funções | `camelCase` | `currentUser`, `getPlayerStats()` |
| Componentes React | `PascalCase` | `MatchCard`, `PlayerAvatar` |
| Tipos, interfaces, classes | `PascalCase` | `type MatchStatus`, `class TeamDraftService` |
| Constantes (env, config) | `SCREAMING_SNAKE_CASE` | `MAX_PLAYERS_PER_PELADA` |
| Enums | `PascalCase` (tipo) + `PascalCase` (valor) | `MatchStatus.Scheduled` |
| Hooks | `use` + `PascalCase` | `useCurrentPelada()` |
| Booleanos | `is`/`has`/`can`/`should` + adjetivo | `isAdmin`, `hasConfirmed`, `canEditMatch` |
| Handlers | `handle` + Evento OU `on` + Evento (em props) | `handleSubmit`, `onConfirm` |
| Funções async que buscam | `get`/`fetch`/`load` | `getMatchById`, `fetchPlayerStats` |
| Funções async que mudam | `create`/`update`/`delete`/`toggle` | `createMatch`, `togglePresence` |

### 3.2 Arquivos e pastas

| Tipo | Convenção | Exemplo |
|---|---|---|
| Componentes React | `kebab-case.tsx` | `match-card.tsx` |
| Server Actions | `kebab-case.ts` | `create-match.ts` |
| Hooks | `use-kebab-case.ts` | `use-current-pelada.ts` |
| Tipos puros | `kebab-case.ts` | `match-status.ts` |
| Testes | `*.test.ts` ao lado do arquivo | `team-draft.test.ts` |
| Pasta de rota dinâmica (Next.js) | `[param]` | `app/p/[peladaSlug]/...` |
| Pasta de grupo (Next.js) | `(group)` | `app/(app)/...` |

> **Por que kebab-case em arquivos?** Funciona em todos os filesystems (Windows, Linux, macOS) sem problemas de case-sensitivity. Importável de qualquer SO.

### 3.3 Antipadrões proibidos

- ❌ Abreviações criativas: `usrSvc`, `getMtchInf` → ✅ `userService`, `getMatchInfo`
- ❌ Notação húngara: `strName`, `intCount` → ✅ `name`, `count` (TS já tipa)
- ❌ Nomes de uma letra: exceto `i` em loop curto ou `e` em catch — e olhe lá
- ❌ Negativas duplas: `isNotInactive` → ✅ `isActive`
- ❌ Sufixos vagos: `data`, `info`, `manager`, `helper`, `util` (use o **que faz**, não o **que é**)

---

## 4. TypeScript

### 4.1 Configuração mínima do `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 4.2 Regras de tipo

- **`any` é proibido.** Use `unknown` e narrow.
- **Prefira `type` a `interface`** — exceto quando precisar de declaration merging (raro).
- **Use union types pra estados finitos**, não strings soltas:
  ```ts
  // ❌
  status: string
  // ✅
  status: 'scheduled' | 'in_progress' | 'finished'
  ```
- **Discriminated unions** pra estados que carregam dados diferentes:
  ```ts
  type MatchState =
    | { status: 'scheduled'; scheduledFor: Date }
    | { status: 'in_progress'; startedAt: Date }
    | { status: 'finished'; finalScore: Score; finishedAt: Date }
  ```
- **Não use `enum`** — use union literal types ou `as const` objects:
  ```ts
  export const MatchStatus = {
    Scheduled: 'scheduled',
    InProgress: 'in_progress',
    Finished: 'finished',
  } as const
  export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus]
  ```
- **`readonly` agressivo** em props e DTOs.
- **Branded types** pra IDs (evita misturar `userId` com `peladaId`):
  ```ts
  type UserId = string & { readonly __brand: 'UserId' }
  type PeladaId = string & { readonly __brand: 'PeladaId' }
  ```

### 4.3 Validação na borda

Tudo que entra no sistema (form, query param, body de request, env vars) **passa por Zod**:

```ts
import { z } from 'zod'

const CreateMatchInput = z.object({
  peladaId: z.string().uuid(),
  scheduledFor: z.coerce.date(),
  location: z.string().min(3).max(120).optional(),
})

export type CreateMatchInput = z.infer<typeof CreateMatchInput>
```

**Princípio**: dentro do sistema, tipos são **garantia**. Na borda, validação **prova**.

---

## 5. Estrutura e camadas

### 5.1 Camadas (já no `ARCHITECTURE.md`, reforçando regras)

```
app/                  →  UI + composição
server/actions/       →  orquestração + autorização
server/queries/       →  leitura (igual actions, só read)
lib/domain/           →  regras puras, zero framework
lib/db/               →  persistência (Drizzle)
```

### 5.2 Regras de dependência (estritas)

```
app/        →  server/*, components/*, lib/utils/*
server/*    →  lib/domain/*, lib/db/*, lib/utils/*
lib/domain/ →  lib/utils/*  (ZERO mais)
lib/db/     →  lib/utils/*  (ZERO mais)
```

- `lib/domain/*` **nunca** importa Drizzle, Next.js, Auth.js. Funções puras.
- `lib/db/*` **nunca** importa de `app/` ou `server/`.
- `components/ui/*` (shadcn) **nunca** importa lógica de negócio.

Vamos enforçar com **`eslint-plugin-boundaries`** quando configurarmos o linter.

### 5.3 Design Patterns adotados

| Pattern | Onde | Por quê |
|---|---|---|
| **Repository (light)** | `lib/db/repositories/*` | Encapsula queries complexas. Não vira interface se não for testar. |
| **Service** | `server/services/*` | Orquestração de múltiplas operações (ex: `MatchService.finalize()`). |
| **Factory** | `lib/domain/factories/*` | Criação de entidades com defaults sensatos. |
| **State Machine (FSM)** | `lib/domain/state-machines/*` | Status de `Match`, `Membership` — transições válidas explícitas. |
| **Result/Either** | `lib/utils/result.ts` | Funções de domínio que podem falhar previsivelmente (validação) retornam `Result<T, DomainError>`. Erros inesperados continuam sendo `throw`. |
| **Observer (via Realtime)** | F2+ | Supabase Realtime pra placar ao vivo. |

#### Exemplo: Result pattern

```ts
// lib/utils/result.ts
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

// Uso em domain:
function calculateRating(input: RatingInput): Result<Rating, InvalidRatingError> {
  if (input.value < 0 || input.value > 10) {
    return err(new InvalidRatingError('rating must be 0-10'))
  }
  return ok({ value: input.value, ratedBy: input.ratedBy })
}
```

### 5.4 Hierarquia de erros

```ts
// lib/errors.ts
export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 'FORBIDDEN')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly issues: unknown) {
    super(message, 'VALIDATION_ERROR')
  }
}

// Domain-specific:
export class InvalidMatchStateTransitionError extends AppError { /* ... */ }
export class PeladaFullError extends AppError { /* ... */ }
```

**Regra**: Server Actions **capturam** essas exceções e transformam em mensagem amigável pra UI. Domain **lança**.

---

## 6. React / Next.js

### 6.1 Server Components first

```
Padrão: Server Component
Exceção: precisa de interatividade/estado/effects → 'use client'
```

Mantenha `'use client'` o mais "perto das folhas" possível. Páginas e layouts ficam Server quando dá.

### 6.2 Server Actions sobre API routes

Pra **mutações internas do app**, use Server Actions (`'use server'`). API routes só para:

- Webhooks externos (Stripe, etc.)
- Endpoints públicos consumidos por terceiros
- Cron jobs

### 6.3 Componentes

- **Um componente por arquivo.** Sub-componentes pequenos podem ficar no mesmo arquivo se forem privados.
- **Props como `type Props`** explicitamente:
  ```tsx
  type Props = {
    match: Match
    onEdit?: (id: MatchId) => void
  }

  export function MatchCard({ match, onEdit }: Props) { /* ... */ }
  ```
- **Default export apenas** em arquivos de página/layout do Next.js. Tudo mais: **named export**.
- **Composição > prop drilling**. Use `children`, slots, e (último recurso) Context.

### 6.4 Forms

- **React Hook Form + Zod resolver** sempre.
- Schema compartilhado entre client (form) e server (action) — single source of truth.

### 6.5 Estado

| Tipo de estado | Onde mora |
|---|---|
| UI local (modal aberto, input controlado) | `useState` no componente |
| URL state (filtros, paginação) | `searchParams` (Next.js) |
| Server state (dados da API) | Server Components OU TanStack Query em client islands |
| Global client state (tema, sidebar) | **Zustand** quando necessário |
| Sessão/auth | Auth.js helpers |

**Não usaremos Redux.** Não justifica a complexidade nesse projeto.

---

## 7. Testes

### 7.1 Estratégia em pirâmide

```
          ┌─────────┐
          │   E2E   │   poucos, fluxos críticos
          └─────────┘
         /           \
        /  Integração \   Server Actions com DB de teste
       └───────────────┘
      /                 \
     /   Unit/Domain     \   muitos, regras de negócio puras
    └─────────────────────┘
```

### 7.2 Ferramentas

- **Vitest** — unit + integração (mais rápido que Jest, ESM-first, ótimo com TS)
- **React Testing Library** — componentes
- **Playwright** — E2E (smoke tests dos fluxos críticos da F1)
- **MSW** — mock de HTTP quando necessário

### 7.3 Cobertura mínima

| Camada | Cobertura alvo |
|---|---|
| `lib/domain/` | **100%** — é a alma do produto |
| `lib/db/repositories/` | Smoke tests com DB de teste |
| `server/actions/` | Casos felizes + 1 erro por action |
| Componentes | Os com lógica não-trivial |
| E2E | 1 fluxo end-to-end por fase (F1: criar pelada → marcar partida → registrar gol) |

### 7.4 Nomenclatura de testes

```ts
describe('TeamDraft.balance', () => {
  it('distributes players evenly when count is divisible', () => { /* ... */ })
  it('puts extra player in the lower-skill team when count is odd', () => { /* ... */ })
  it('throws InvalidInputError when player list is empty', () => { /* ... */ })
})
```

Padrão: `it('faz X quando Y')`. Sempre em inglês.

---

## 8. Comentários

### 8.1 Regra: comentário explica **por quê**, não **o quê**

```ts
// ❌ Increment counter
counter++

// ❌ Loop through users
for (const user of users) { /* ... */ }

// ✅ Skip soft-deleted users — they shouldn't count toward billing
const billableUsers = users.filter(u => !u.deletedAt)
```

### 8.2 Quando comentar

- Decisões não-óbvias ("Por que não usamos X?")
- Workarounds ("HACK: Supabase realtime não dispara em batch updates")
- Constantes mágicas que escaparam (sempre prefira `MAX_X` nomeado)
- TODOs com contexto: `// TODO(joao): refatorar quando ticket #123 sair`

### 8.3 JSDoc/TSDoc em APIs públicas

```ts
/**
 * Sorts players into balanced teams based on historical ratings.
 *
 * @param players - list of confirmed players for the match
 * @param teamCount - number of teams to create (typically 2)
 * @returns array of teams, each with roughly equal average rating
 * @throws {InvalidInputError} when players.length < teamCount
 */
export function balanceTeams(
  players: Player[],
  teamCount: number,
): Team[] { /* ... */ }
```

### 8.4 Não comente código morto. Apague. Git lembra.

---

## 9. Tooling

### 9.1 Stack de qualidade

| Ferramenta | Para que | Configuração |
|---|---|---|
| **Biome** | Lint + format (substitui ESLint+Prettier) | `biome.json` na raiz |
| **TypeScript strict** | Tipagem | `tsconfig.json` (veja §4.1) |
| **Husky** | Git hooks | `.husky/` |
| **lint-staged** | Roda lint/format só em arquivos modificados no pre-commit | `.lintstagedrc` |
| **commitlint** | Valida formato dos commits | `.commitlintrc` |
| **Vitest** | Testes | `vitest.config.ts` |
| **Playwright** | E2E | `playwright.config.ts` |

> **Por que Biome em vez de ESLint+Prettier?** Mais rápido (escrito em Rust), zero-config razoável, all-in-one. ESLint+Prettier ainda é mais maduro com plugins específicos — se precisarmos de regras muito customizadas (ex: `eslint-plugin-boundaries`), reavaliamos.

### 9.2 Scripts padrão (`package.json`)

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "prepare": "husky"
  }
}
```

### 9.3 CI (GitHub Actions)

Pipeline mínima em `.github/workflows/ci.yml`:

1. `pnpm install`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test:ci`
5. `pnpm build`

PRs **não fundem** se algum passo quebrar.

---

## 10. Git workflow

### 10.1 Conventional Commits (obrigatório)

```
<tipo>(<escopo opcional>): <descrição curta em inglês, imperativo>

[corpo opcional]

[footer opcional, ex: BREAKING CHANGE: ...]
```

**Tipos aceitos**:

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade visível pro usuário |
| `fix` | Bug fix |
| `refactor` | Mudança que não altera comportamento externo |
| `docs` | Documentação |
| `test` | Adicionar/ajustar testes |
| `chore` | Tarefas de manutenção (deps, build, scripts) |
| `style` | Formatação, sem mudança de código |
| `perf` | Melhoria de performance |
| `ci` | Mudança em pipeline de CI |
| `build` | Mudança no sistema de build |

**Exemplos**:

```
feat(match): add team draft algorithm with balanced ratings
fix(presenca): prevent duplicate confirmations in lista
refactor(domain): extract MatchStateMachine to dedicated module
docs: update ARCHITECTURE with multi-tenancy notes
test(team-draft): cover edge case of single player
```

### 10.2 Branches

Modelo **trunk-based** simplificado:

- `main` — sempre deployável
- `feat/*`, `fix/*`, `chore/*` — branches curtas (max 3 dias de vida)
- PR pra `main`, squash merge

Evitar long-lived branches. Mantém merges baratos.

### 10.3 Pull Request template

`.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## O que mudou?

<descrição curta>

## Por quê?

<contexto / link de issue>

## Como testar?

1. ...
2. ...

## Checklist

- [ ] Lint passa (`pnpm lint`)
- [ ] Tipos passam (`pnpm typecheck`)
- [ ] Testes passam (`pnpm test:ci`)
- [ ] Documentação atualizada (se aplicável)
- [ ] Screenshots/vídeo (se mudou UI)
```

---

## 11. Acessibilidade (a11y)

Não é negociável.

- **Todo botão é `<button>`**, não `<div onClick>`.
- **Todo input tem `<label>`** associado (ou `aria-label`).
- **Contraste mínimo AA** (Tailwind helper + browser devtools verifica).
- **Foco visível** sempre (Tailwind `focus-visible:` classes do shadcn já cuidam).
- **Navegável por teclado** — testar com Tab.
- **`alt` em toda imagem** (use string vazia se decorativa: `alt=""`).
- Plugin **`@axe-core/playwright`** rodando em testes E2E pra pegar regressões.

---

## 12. Performance

- **Lighthouse score mínimo**: 90 em todas as categorias (mobile).
- **Server Components** pra reduzir bundle JS.
- **`next/image`** sempre — nunca `<img>` puro.
- **`next/font`** pra fontes self-hosted.
- **Lazy load** componentes pesados com `dynamic()`.
- **Database**: index nas FKs e em colunas de filtro comum (`pelada_id`, `match_id`, `created_at`).
- **N+1 queries**: usar Drizzle `with` (joins) ou DataLoader pattern quando aplicável.

---

## 13. Segurança

- **Nunca commitar `.env`** (já tá no `.gitignore`).
- **Validar todo input** em Server Actions com Zod, mesmo de "usuário logado".
- **SQL injection**: usar Drizzle queries parametrizadas (default). **Nunca** SQL via template string com input de usuário.
- **CSRF**: Server Actions já têm proteção nativa do Next.js. Não desligar.
- **Autorização explícita** em toda action: `getPeladaContext()` valida que o user tem acesso ao tenant.
- **Headers de segurança**: configurar via `next.config.mjs` (CSP, X-Frame-Options, etc.).
- **Rate limiting** em endpoints públicos (F4 — usar Upstash quando precisar).
- **Auditoria**: actions críticas (transferir admin, deletar pelada) logam evento em tabela `audit_log`.

---

## 14. Checklist de "definition of done"

Uma feature **só está pronta** quando:

- [ ] Código segue todos os padrões deste documento
- [ ] Tipagem completa, sem `any`
- [ ] Input validado com Zod nas bordas
- [ ] Domain logic com testes unitários
- [ ] Pelo menos 1 teste de integração no fluxo principal
- [ ] Lint, typecheck e testes passam
- [ ] UI funciona no mobile (DevTools 360px de largura)
- [ ] A11y básica verificada (teclado + alt texts)
- [ ] Commit messages no formato Conventional Commits
- [ ] README/ARCHITECTURE atualizados se houve mudança estrutural

---

## 15. Atualizando este documento

Este é um documento **vivo**. Quando uma decisão técnica relevante for tomada (ou revertida) durante o desenvolvimento:

1. Atualize a seção pertinente
2. Mencione a mudança no commit: `docs(standards): adopt Drizzle relations over manual joins`
3. Se for uma mudança de política (não só refinamento), discuta em PR antes de mergear
