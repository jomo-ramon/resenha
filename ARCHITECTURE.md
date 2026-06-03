# resenha — Arquitetura do Produto

> Plataforma web para organizar peladas de futebol amador.
> Pelada piloto: **Cornetas** (sábados).

Status: **draft v0.1** — documento vivo. Atualize conforme decisões evoluírem.

---

## 1. Visão geral

### 1.1 O problema

Peladas amadoras hoje são organizadas via **WhatsApp + Google Sheets**:

- Lista de presença numerada e copiada na mão toda semana
- Capitães escolhem times "na boca" sem registro
- Placar/gols mandados por mensagem se perdem no histórico
- Notas do juiz vivem em planilha que ninguém abre
- Artilharia anual é atualizada manualmente — sujeita a erros
- Nada que crie engajamento entre uma pelada e outra

### 1.2 A proposta

Um produto **mobile-first** que digitaliza esse fluxo, mantendo a leveza do WhatsApp mas adicionando:

- **Histórico permanente** de partidas, gols, times e notas
- **Perfil do jogador** com estatísticas individuais
- **Gamificação** via Cartola-like + ligas + conquistas
- **Multi-pelada** desde o dia 1 — pronto pra crescer pra outras turmas

### 1.3 Princípios de design

| Princípio | O que significa |
|---|---|
| **Resenha first** | UX deve ser divertida; texto e tom informais ("artilheiro do mês", "perna de pau", etc.) |
| **Substitui WhatsApp, não compete** | Notificações vão pro WhatsApp/grupo. App é onde o dado vive. |
| **Zero fricção pra entrar** | Login com Google em 1 clique. Convite via link. |
| **Mobile-first sempre** | Tudo precisa funcionar bem com 1 polegar, em pé, no campo |
| **Offline-tolerante** | Sinal de campo de futebol é ruim. PWA precisa funcionar offline pro juiz lançar gols/notas. |

---

## 2. Glossário de domínio (PT ↔ EN)

> Código é escrito em **inglês**. UI e documentação em **português**.
> Veja `CODING_STANDARDS.md` §2 pra regras completas.
> **Pelada** e **Resenha** ficam em PT por serem termos culturais intraduzíveis.

| Conceito (PT — UI/docs) | Identificador (EN — código) | Definição |
|---|---|---|
| **Pelada** | `Pelada` | Comunidade de jogadores que se encontra regularmente. É o **tenant** do sistema. *(termo mantido em PT)* |
| **Jogador (vínculo)** | `Membership` | Usuário vinculado a uma pelada com um papel (admin, referee, player). |
| **Partida** | `Match` | Um encontro da pelada num dia. Ciclo de vida: `scheduled` → `roster_open` → `teams_drafted` → `in_progress` → `finished`. |
| **Lista** | `Roster` | Inscrição de presença pra uma partida. Limitada por `Pelada.maxPlayers`. |
| **Presença** | `RosterEntry` | Item da lista — um jogador confirmando, negando ou em espera. |
| **Time** | `Team` | Subdivisão dos jogadores presentes numa partida. Tem capitão, nome/cor. |
| **Jogador do time** | `TeamPlayer` | Vínculo `Team ↔ Membership` numa partida. |
| **Evento** | `MatchEvent` | Algo que aconteceu na partida: gol, assistência, cartão. |
| **Avaliação / Nota** | `PlayerRating` | Nota (0–10) dada pelo juiz pra um jogador numa partida. |
| **Resenha** | `Resenha` | Post pós-jogo (markdown). *(termo mantido em PT)* |
| **Ranking** | `Ranking` (view) | Cálculo — não é tabela. Ex: artilharia anual, média de notas, mais vitórias. |
| **Liga** *(F3)* | `League` | Competição de Cartola entre jogadores. |
| **Escalação** *(F3)* | `FantasyLineup` | Time virtual que o jogador monta pra rodada do Cartola. |
| **Pontuação da rodada** *(F3)* | `RoundScore` | Pontos da escalação numa rodada. |
| **Conquista** *(F3)* | `Achievement` | Badge desbloqueado por feito (hat-trick, 10 jogos seguidos, etc.). |
| **Conquista do jogador** *(F3)* | `PlayerAchievement` | Vínculo de uma conquista a um jogador. |

---

## 3. Faseamento

Cada fase é **um produto utilizável** por si só. Não passar pra próxima sem F-anterior madura.

### F1 — Operacional (substitui a planilha)

**Objetivo**: a Cornetas larga a planilha e o WhatsApp organizado pelo admin, e usa o app.

- Cadastro de pelada + admin
- Convite de jogadores (link + e-mail)
- Lista de presença semanal (auto-recorrente)
- Sorteio/escolha de times (2 capitães selecionam OU sorteio automático equilibrado)
- Registro de placar, gols e assistências
- Ranking anual de artilharia (público dentro da pelada)
- Histórico de partidas

**Critério de "pronto"**: rodar 4 sábados seguidos sem precisar do WhatsApp pra coordenar lista.

### F2 — Engajamento básico (cada jogador tem "sua página")

- Perfil do jogador (foto, posição, número, apelido, bio)
- Notas do juiz por partida (0–10 + comentário)
- Estatísticas individuais (média de notas, gols/jogo, vitórias %, etc.)
- Histórico pessoal de partidas
- Resenha pós-jogo (post markdown editável por quem jogou)

**Critério de "pronto"**: jogadores começam a abrir o app fora do dia do jogo.

### F3 — Gamificação (a camada divertida)

- **Cartola-like**: jogadores montam escalação virtual com pessoal da pelada; pontua conforme desempenho real
- **Ligas internas**: subconjuntos de jogadores competindo entre si
- **Conquistas/badges**: hat-trick, primeiro gol, 10 jogos seguidos, MVP do mês, perna-de-pau-de-ouro (humor!)
- **Notificações push** (PWA)

**Critério de "pronto"**: NPS interno > 50 na pelada piloto.

### F4 — Escala (vira produto)

- Onboarding self-service de novas peladas
- Cobrança/mensalidade (Stripe ou Pagar.me)
- Tier free (pelada única, X jogadores) vs pago (várias peladas, white-label leve)
- Suporte a campeonatos amadores (várias peladas competindo)
- Painel administrativo da plataforma

**Critério de "pronto"**: 5+ peladas ativas pagando.

---

## 4. Stack tecnológica

### 4.1 Resumo

```
┌──────────────────────────────────────────────┐
│  Frontend + Backend                          │
│  Next.js 15 (App Router) + TypeScript        │
│  Tailwind CSS + shadcn/ui                    │
│  next-pwa (PWA)                              │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│  Auth.js (Google + Magic Link e-mail)        │
│  Drizzle ORM                                 │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│  Supabase                                    │
│  • PostgreSQL                                │
│  • Storage (fotos jogadores/peladas)         │
│  • Realtime (placar ao vivo — F2/F3)         │
└──────────────────────────────────────────────┘
```

### 4.2 Justificativas

| Escolha | Por quê |
|---|---|
| **Next.js 15 (App Router)** | Frontend + backend num único codebase. Server Actions eliminam camada de API boilerplate. Deploy trivial na Vercel. |
| **TypeScript** | Pega bugs cedo. Indispensável num app que vai crescer em camadas (F1→F4). |
| **Tailwind + shadcn/ui** | Você é dono do código dos componentes (copy-paste). UI lindo sem ser designer. Tema fácil de customizar pra cores de cada pelada. |
| **next-pwa** | PWA com 1 plugin. Service worker pra offline, instalável no celular. |
| **Auth.js (NextAuth)** | De-facto standard pra Next.js. Suporta Google + magic link + custom providers. Self-hosted, sem custo extra. |
| **Drizzle ORM** | Mais leve e SQL-first que Prisma. Migrações simples. Type-safe. |
| **PostgreSQL** | Relacional faz sentido pro domínio (peladas, jogadores, partidas, times). |
| **Supabase** | Tudo num lugar: DB + storage + realtime + auth opcional. Free tier generoso. Quando crescer, vc migra peças sem reescrever o app. |
| **Vercel** | Hospedagem nativa de Next.js. Free tier serve pro MVP e pra primeiras peladas de teste. |

### 4.3 Custos (preocupação levantada)

#### Fase 1–2 (validação na Cornetas + 1–2 peladas-piloto)

| Serviço | Plano | Custo |
|---|---|---|
| Vercel | Hobby | **R$ 0** |
| Supabase | Free (500 MB DB, 1 GB storage, 2 GB bandwidth/mês) | **R$ 0** |
| Domínio (opcional) | `.com.br` registro.br | ~R$ 40/ano |
| **Total** | | **~R$ 0–40/ano** |

> ⚠️ **Atenção Supabase free**: projeto pausa após 7 dias de inatividade. Você "acorda" abrindo o painel. Pra desenvolvimento e 1 pelada testando, é OK. Quando entrar uma 2ª pelada, considere o plano Pro.
>
> ⚠️ **Atenção Vercel Hobby**: licença é não-comercial. Você só pode cobrar mensalidade quando estiver no Pro ($20/mês ≈ R$ 100/mês).

#### Fase 3–4 (várias peladas, possivelmente cobrando)

| Serviço | Plano | Custo |
|---|---|---|
| Vercel | Pro | $20/mês (~R$ 100) |
| Supabase | Pro | $25/mês (~R$ 125) |
| Domínio | | R$ 40/ano |
| **Total** | | **~R$ 225/mês** |

Com mensalidade de R$ 5/jogador/mês e 50 jogadores ativos, você já cobre os custos. Modelo sustentável.

#### Alternativas mais baratas (com mais trabalho operacional)

- **Self-hosted em VPS** (Hostinger/Hetzner): R$ 15–40/mês, mas você gerencia tudo (Postgres, backup, SSL, deploy).
- **Railway** ($5 grátis/mês): cabe um MVP pequeno, mas créditos acabam rápido se DB ficar ativo.
- **Render** (free tier com sleep): similar ao Supabase free.

**Recomendação**: começar com **Vercel + Supabase free**. Quando precisar escalar OU monetizar, migra pra Pro.

---

## 5. Modelo de domínio

### 5.1 Diagrama lógico

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│   User   │────────►│  Membership  │◄────────│  Pelada  │
└──────────┘  N:M    │ role,apelido │   N:M   └─────┬────┘
                     └──────────────┘               │
                                                    │ 1:N
                                                    ▼
                                              ┌──────────┐
                                              │ Partida  │
                                              └────┬─────┘
                                                   │ 1:N
                              ┌────────────────────┼────────────────────┐
                              ▼                    ▼                    ▼
                        ┌──────────┐         ┌──────────┐         ┌──────────────┐
                        │ Presenca │         │   Time   │         │  Avaliacao   │
                        └──────────┘         └────┬─────┘         │ (F2 — nota)  │
                                                  │               └──────────────┘
                                                  │ 1:N
                                                  ▼
                                            ┌──────────┐
                                            │  Evento  │
                                            │ gol/cart │
                                            └──────────┘
```

### 5.2 Entidades (F1 + F2)

> Identificadores em inglês (ver §2 — Glossário PT↔EN). `Pelada` e `Resenha` ficam em PT por serem termos culturais.

```typescript
// === Branded IDs (lib/db/ids.ts) ===
type UserId       = string & { readonly __brand: 'UserId' }
type PeladaId     = string & { readonly __brand: 'PeladaId' }
type MembershipId = string & { readonly __brand: 'MembershipId' }
type MatchId      = string & { readonly __brand: 'MatchId' }
type TeamId       = string & { readonly __brand: 'TeamId' }

// === F1 — Operational ===

type User = {
  id: UserId
  email: string
  name: string
  avatarUrl?: string
  authProviders: ('google' | 'email')[]
  createdAt: Date
}

type Pelada = {                   // tenant — termo PT mantido
  id: PeladaId
  slug: string                    // ex: "cornetas"
  name: string
  description?: string
  logoUrl?: string
  weekday: Weekday                // 'monday' | ... | 'sunday'
  startTime: string               // "16:00"
  location: string
  address?: string
  maxPlayers: number              // ex: 30
  rules: PeladaRules              // JSON tipado
  ownerUserId: UserId
  createdAt: Date
}

type Membership = {               // User ↔ Pelada
  id: MembershipId
  userId: UserId
  peladaId: PeladaId
  role: 'admin' | 'referee' | 'player'
  nickname?: string
  shirtNumber?: number
  preferredPosition: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'outfield'
  status: 'active' | 'inactive' | 'invited'
  joinedAt: Date
}

type Match = {
  id: MatchId
  peladaId: PeladaId
  scheduledFor: Date
  locationOverride?: string
  status: MatchStatus             // FSM — ver lib/domain/match-state-machine.ts
  notes?: string
  createdAt: Date
}

type MatchStatus =
  | 'scheduled'
  | 'roster_open'
  | 'teams_drafted'
  | 'in_progress'
  | 'finished'
  | 'cancelled'

type RosterEntry = {              // presença na lista
  id: string
  matchId: MatchId
  membershipId: MembershipId
  status: 'confirmed' | 'declined' | 'waitlist'
  listPosition: number            // 1, 2, 3...
  respondedAt: Date
}

type Team = {
  id: TeamId
  matchId: MatchId
  name: string                    // "Coletes", "Sem colete", "Time A"
  color: string                   // hex
  captainMembershipId: MembershipId
  finalScore?: number
}

type TeamPlayer = {
  id: string
  teamId: TeamId
  membershipId: MembershipId
}

type MatchEvent = {
  id: string
  matchId: MatchId
  teamId: TeamId
  membershipId: MembershipId
  type: 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card'
  minute?: number
  notes?: string
  createdAt: Date
}

// === F2 — Engagement ===

type PlayerRating = {             // nota do juiz
  id: string
  matchId: MatchId
  membershipId: MembershipId
  ratedByMembershipId: MembershipId
  value: number                   // 0.0 – 10.0
  comment?: string
  createdAt: Date
}

type Resenha = {                  // post pós-jogo — termo PT mantido
  id: string
  matchId: MatchId
  authorMembershipId: MembershipId
  contentMarkdown: string
  createdAt: Date
  updatedAt: Date
}

// === F3 — Gamification (esboço — detalhar antes de implementar) ===

type League            = { id; peladaId; name; rules; startDate; endDate }
type LeagueMembership  = { id; leagueId; membershipId; totalPoints }
type FantasyLineup     = { id; leagueId; matchId; membershipId; pickedPlayers: MembershipId[] }
type RoundScore        = { id; lineupId; points }

type Achievement       = { id; code; name; description; iconUrl; criteria }
type PlayerAchievement = { id; membershipId; achievementId; unlockedAt; matchId? }
```

### 5.3 Decisões importantes do modelo

- **`Membership` é a "identidade do jogador na pelada"**, não `User`. Isso permite o mesmo `User` jogar em várias peladas com apelidos/números/posições diferentes. Todos os `MatchEvent`, `PlayerRating`, `RosterEntry` referenciam `membershipId`, não `userId`.
- **`Pelada` é o tenant**. Todas as queries devem ser filtradas por pelada (via membership do usuário logado). Garantir isso na camada de query (Drizzle helpers).
- **Rankings são views/queries**, não tabelas. Artilharia = `SUM(matchEvent WHERE type='goal') GROUP BY membershipId`. Mantém o dado normalizado.
- **`Match.status` é uma máquina de estado** (`lib/domain/match-state-machine.ts`). Transições permitidas validadas no domínio (ex: não pode ir de `scheduled` direto pra `finished`).
- **Branded IDs**: `UserId`, `PeladaId`, `MatchId` etc. são tipos branded — o compilador rejeita misturar (ex: passar um `UserId` onde se espera `PeladaId`). Reforça segurança de tipos sem custo em runtime.
- **Status enums em snake_case minúsculo** (`'in_progress'`, `'roster_open'`): casa com convenção de DB/JSON e fica neutro entre idiomas.

---

## 6. Arquitetura macro do código

### 6.1 Organização de pastas

> Nomes de arquivos em **kebab-case**, nomes de pastas de domínio em **inglês**.
> URLs em português pra UX (`/p/cornetas/partidas`).

```
resenha/
├── src/
│   ├── app/                          # Next.js App Router (URLs em PT pra UX)
│   │   ├── (marketing)/              # landing pública (F4)
│   │   ├── (auth)/
│   │   │   ├── entrar/
│   │   │   └── cadastro/
│   │   ├── (app)/                    # área logada
│   │   │   ├── peladas/              # lista das peladas do user
│   │   │   ├── nova-pelada/
│   │   │   └── p/[peladaSlug]/       # tenant na URL
│   │   │       ├── page.tsx          # dashboard
│   │   │       ├── partidas/
│   │   │       │   ├── [matchId]/
│   │   │       │   └── nova/
│   │   │       ├── jogadores/
│   │   │       ├── ranking/
│   │   │       ├── perfil/[membershipId]/   # F2
│   │   │       └── cartola/                 # F3
│   │   └── api/                      # webhooks (Stripe), integrações
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn primitives (Button, Card...)
│   │   └── domain/                   # match-card, player-avatar, team-badge
│   │
│   ├── server/
│   │   ├── actions/                  # Server Actions (mutações)
│   │   │   ├── match/
│   │   │   │   ├── create-match.ts
│   │   │   │   ├── finalize-match.ts
│   │   │   │   └── ...
│   │   │   ├── roster/
│   │   │   └── team/
│   │   ├── queries/                  # leituras tipadas
│   │   │   ├── ranking.ts
│   │   │   └── ...
│   │   └── services/                 # orquestração entre múltiplas actions
│   │       └── match-service.ts
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema/               # Drizzle schemas (1 arquivo por entidade)
│   │   │   ├── repositories/         # queries complexas reutilizáveis
│   │   │   ├── client.ts             # Drizzle client
│   │   │   ├── ids.ts                # branded ID types
│   │   │   └── migrations/
│   │   ├── auth/                     # Auth.js config
│   │   ├── domain/                   # 🔑 regras puras, zero framework
│   │   │   ├── team-draft.ts         # algoritmo de sorteio equilibrado
│   │   │   ├── ranking.ts            # cálculo de artilharia, médias
│   │   │   ├── match-state-machine.ts
│   │   │   ├── fantasy-scoring.ts    # (F3) pontuação cartola
│   │   │   └── achievements/         # (F3) critérios de badges
│   │   ├── multitenancy.ts           # getPeladaContext(), authorization helpers
│   │   ├── errors.ts                 # hierarquia de erros (AppError...)
│   │   └── utils/
│   │       ├── result.ts             # Result<T, E> type
│   │       └── ...
│   │
│   └── styles/
│       └── globals.css
│
├── public/
│   ├── manifest.json                 # PWA
│   └── icons/
│
├── tests/
│   └── e2e/                          # Playwright
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .husky/
├── biome.json
├── drizzle.config.ts
├── next.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── ARCHITECTURE.md
├── CODING_STANDARDS.md
├── README.md
└── package.json
```

**Por que `src/`?** Separa código-fonte de configuração na raiz. Padrão moderno em projetos TS.

### 6.2 Camadas e regras

```
┌─────────────────────────────────────┐
│ Pages (app/)                        │  ← UI, composição
│ • só monta UI + chama actions/queries
└─────────────────────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ Server Actions / Queries (server/)  │  ← orquestração, autorização
│ • valida user, valida tenant
│ • chama domain + db
└─────────────────────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ Domain (lib/domain/)                │  ← regras puras, testáveis
│ • sem framework, sem db
│ • input → output
└─────────────────────────────────────┘
                ▼
┌─────────────────────────────────────┐
│ DB (lib/db/)                        │  ← persistência
│ • Drizzle schemas + helpers
└─────────────────────────────────────┘
```

**Regra de ouro**: `lib/domain/*` **nunca** importa de `lib/db/*` ou de Next.js. Recebe dados via parâmetro e devolve resultado. Isso permite testar com `vitest` sem mock de banco.

### 6.3 Multi-tenancy

Tenant na URL: `/p/cornetas/partidas/123`.

Toda Server Action / Query usa um helper:

```typescript
// src/lib/multitenancy.ts
export async function getPeladaContext(slug: string): Promise<PeladaContext> {
  const user = await getCurrentUser()                  // Auth.js
  const membership = await db.query.memberships.findFirst({
    where: and(eq(peladas.slug, slug), eq(memberships.userId, user.id)),
    with: { pelada: true },
  })
  if (!membership) throw new ForbiddenError('user is not a member of this pelada')
  return { user, membership, pelada: membership.pelada }
}

export function assertRole(ctx: PeladaContext, ...allowed: MembershipRole[]): void {
  if (!allowed.includes(ctx.membership.role)) {
    throw new ForbiddenError(`role ${ctx.membership.role} is not allowed`)
  }
}
```

Garante que nenhum dado vaze entre peladas. **Toda query do banco filtra por `peladaId` derivado do contexto** — nunca confia em ID vindo da URL/form.

---

## 7. Roteiro de implementação — Fase 1

Ordem sugerida (cada item ≈ 1 sessão de dev focada):

1. **Scaffolding** — `pnpm create next-app`, Tailwind, shadcn, Drizzle, Auth.js, Supabase setup
2. **Schema F1** + migration inicial
3. **Auth fluxo completo** (Google + magic link)
4. **Onboarding**: criar pelada → virar admin
5. **Convite de jogadores** (link compartilhável)
6. **Página da pelada** (dashboard básico)
7. **Criar partida** + lista de presença (confirmar/negar)
8. **Sorteio de times** (manual e automático)
9. **Registro de placar/gols** durante/após partida
10. **Ranking de artilharia** (página de leaderboard)
11. **PWA** (manifest, ícones, service worker básico)
12. **Polimento mobile + testes na Cornetas**

> Marco F1: rodar 1 sábado real da Cornetas usando o app.

---

## 8. Considerações de UX

- **Toda ação principal acessível em 1 tap** da home da pelada (lista, time, placar)
- **Push notifications** (F3) para: lista aberta, sua presença confirmada, times sorteados, partida começando, suas notas saíram
- **Empty states divertidos** — copy informal ("ninguém marcou ainda, vai ser pelada de 1?")
- **Suporte a "modo juiz"**: durante a partida, UI simplificada com botões grandes (gol, falta, cartão)
- **Dark mode** — sol no campo é traiçoeiro, sair do estádio à noite também
- **Tipografia grande** — uso com 1 mão, em pé, com tela suada

---

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Sinal ruim no campo (juiz não consegue lançar) | PWA offline + sync quando voltar online |
| Adoção: pessoal não quer trocar WhatsApp | Integração via webhook/share: app posta resumo no grupo |
| Disputas de notas/gols (galera reclama) | Histórico de edição auditável + permitir contestar |
| Custo escalando antes da monetização | Free tiers cobrem fase 1–2; revisar antes de F3 |
| Você sozinho no projeto | Faseamento agressivo: cada fase já vale por si |

---

## 10. Decisões em aberto (pra revisitar)

- [ ] Cobrar mensalidade por pelada ou por jogador?
- [ ] Suporte multi-esporte (vôlei, futsal) — só futebol no MVP?
- [ ] Integração com WhatsApp oficial via API ou só link share?
- [ ] Foto da partida (galeria) entra em F2 ou F3?
- [ ] Sistema de "ranking ELO" entre jogadores (algoritmo de matchmaking de times)?

---

## 11. Próximos passos imediatos

1. ✅ Documento de arquitetura (este arquivo)
2. ✅ Padrões de código (`CODING_STANDARDS.md`)
3. ⏳ Validar conteúdo com você (ajustes e refinamentos)
4. ⏳ Detalhar **algoritmo de sorteio equilibrado** (decisão de UX importante)
5. ⏳ Mapear telas da F1 (wireframes/sketches em texto)
6. ⏳ Scaffolding do projeto (passo 1 do roteiro)

---

## 12. Documentos relacionados

- 📐 [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) — padrões de código, naming, tooling, design patterns
- 📖 [`README.md`](./README.md) — pitch do produto e visão de alto nível
