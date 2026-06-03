# Wireframes — Fase 1 (Operacional)

> Wireframes textuais (ASCII) para as telas da **F1**.
> Layout **mobile-first** (canvas conceitual ~360px de largura).
> Copy em **pt-BR**, tom informal e direto.
>
> Pelada de exemplo: **Cornetas** (`/p/cornetas`).
> Personas referenciadas: **Joaquim (admin)**, **Roberto (juiz da rodada)**, **Diego (jogador)**.

Veja também:
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — modelo de dados e estrutura técnica
- [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) — padrões de código

---

## 1. Sitemap (F1)

```
/                                       → Landing (público)
/entrar                                 → Login (Google + magic link)
/cadastro                               → Cadastro (se vier sem convite)
/convite/[token]                        → Aceitar convite pra pelada

/                          (logado)     → redireciona pra /peladas OU
                                           /p/[slug] se só tem 1
/peladas                                → Minhas peladas
/peladas/nova                           → Criar nova pelada (wizard)

/p/[peladaSlug]                         → Dashboard da pelada
/p/[peladaSlug]/partidas                → Lista de partidas
/p/[peladaSlug]/partidas/nova           → Agendar partida (admin)
/p/[peladaSlug]/partidas/[matchId]      → Detalhe da partida (UI muda por status)
/p/[peladaSlug]/partidas/[matchId]/sortear   → Modo sorteio (admin/capitães)
/p/[peladaSlug]/partidas/[matchId]/juiz      → Modo juiz (durante partida)
/p/[peladaSlug]/jogadores               → Lista de jogadores da pelada
/p/[peladaSlug]/jogadores/convidar      → Convidar (link compartilhável)
/p/[peladaSlug]/ranking                 → Artilharia + outros rankings
/p/[peladaSlug]/configuracoes           → Settings (admin)

/perfil                                 → Perfil do usuário (todas as peladas)
/sair                                   → Logout
```

---

## 2. Fluxos principais

### 2.1 Onboarding — admin criando primeira pelada

```
Landing
   │
   ▼
[Entrar]──► Login Google ──► (sem peladas) ──► /peladas
                                                   │
                                                   ▼
                                          [+ Criar nova pelada]
                                                   │
                                                   ▼
                                        Wizard (3 passos)
                                                   │
                                                   ▼
                                          /p/cornetas (dashboard)
                                                   │
                                                   ▼
                                         [Convidar jogadores]
                                                   │
                                                   ▼
                                       Link compartilhável → WhatsApp
```

### 2.2 Jogador entrando via convite

```
WhatsApp: link /convite/abc123
            │
            ▼
        Página de convite (mostra nome da pelada)
            │
            ▼
       [Entrar com Google]
            │
            ▼
       (cria User + Membership automaticamente)
            │
            ▼
        /p/cornetas (já como membro)
```

### 2.3 Ciclo da semana (jornada principal — sábado)

```
SEXTA
  Admin: cria partida (ou auto-recorrente cria sozinho)
         status → roster_open
            │
            ▼ (notificação push/WhatsApp)
  Jogador: vê "Pelada de sábado, confirma aí"
           tap em [Vou] ou [Não vou]
            │
            ▼
  Lista vai enchendo até 30. Excedentes vão pra lista de espera.

SÁBADO (30min antes)
  Admin: marca 2 capitães → status muda? (opcional, ou só sinaliza)
  Admin: abre [Sortear times]
            │
            ▼
         Tela de sorteio (manual ou auto-balanceado)
            │
            ▼
         Confirma → status: teams_drafted
            │
            ▼
  Jogadores: veem seu time, cor do colete

SÁBADO (durante)
  Juiz: abre [Modo juiz]
            │
            ▼
         Status: in_progress
            │
            ▼
         A cada gol: tap no jogador → registra
         No fim: registra placar final → status: finished

SÁBADO (pós)
  Juiz: lança notas (F2 — pula no F1)
  Todos: veem o placar final, eventos, ranking atualizado
```

---

## 3. Wireframes tela a tela

> **Legenda**: `[Botão]`, `▢ Card`, `─ separador`, `…` conteúdo dinâmico.

---

### 3.1 Landing (`/`)

```
┌──────────────────────────────────┐
│  resenha                         │  ← logo + nome
│                                  │
│  A plataforma da sua pelada.     │  ← headline (h1)
│                                  │
│  Lista, sorteio, placar e        │  ← subheadline
│  artilharia num lugar só.        │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Entrar                    │  │  ← CTA primário (azul)
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Criar minha pelada        │  │  ← CTA secundário (outline)
│  └────────────────────────────┘  │
│                                  │
│  ──────────────────────────────  │
│                                  │
│  ⚽ Lista de presença            │  ← features (3-4 cards)
│  🎲 Sorteio equilibrado          │
│  📊 Artilharia automática        │
│  📱 Funciona no celular          │
│                                  │
└──────────────────────────────────┘
```

**Quem acessa**: público (não-logado).
**Comportamento**: se já estiver logado, redireciona pra `/peladas`.

---

### 3.2 Login (`/entrar`)

```
┌──────────────────────────────────┐
│  ← Voltar                        │
│                                  │
│  Entrar                          │
│                                  │
│  ┌────────────────────────────┐  │
│  │  G  Continuar com Google   │  │  ← OAuth Google
│  └────────────────────────────┘  │
│                                  │
│  ─── ou ───                      │
│                                  │
│  E-mail                          │
│  ┌────────────────────────────┐  │
│  │  voce@exemplo.com          │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Receber link de acesso    │  │  ← magic link
│  └────────────────────────────┘  │
│                                  │
│  Recebemos um e-mail com um      │  ← (após enviar)
│  link mágico. Abra no celular.   │
└──────────────────────────────────┘
```

---

### 3.3 Aceitar convite (`/convite/[token]`)

```
┌──────────────────────────────────┐
│  resenha                         │
│                                  │
│      [foto da pelada]            │
│                                  │
│  Você foi convidado pra          │
│                                  │
│  Cornetas                        │  ← nome em destaque
│                                  │
│  Pelada todo sábado, 16h         │
│  Quadra do Zezinho               │
│  18 jogadores                    │  ← contadores
│                                  │
│  ┌────────────────────────────┐  │
│  │  Entrar na pelada          │  │
│  └────────────────────────────┘  │
│                                  │
│  Convidado por Joaquim           │
└──────────────────────────────────┘
```

**Comportamento**:
- Sem login → empurra pro Google OAuth, retorna pra cá, cria `Membership` e segue.
- Com login → cria `Membership` direto e vai pro dashboard.

---

### 3.4 Minhas peladas (`/peladas`)

```
┌──────────────────────────────────┐
│  resenha           [Diego ▾]     │  ← header global
├──────────────────────────────────┤
│                                  │
│  Suas peladas                    │
│                                  │
│  ▢───────────────────────────────│
│  │ [logo] Cornetas               │
│  │        Sábado, 16h            │  ← cards
│  │        Próxima: amanhã        │  ← badge dinâmico
│  ▢───────────────────────────────│
│  │ [logo] Galera do Trabalho     │
│  │        Quarta, 19h            │
│  │        Lista aberta           │
│  ▢───────────────────────────────│
│                                  │
│  ┌────────────────────────────┐  │
│  │  + Criar nova pelada       │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

**Estados**:
- **Vazio** (primeira vez): card grande com copy "Você ainda não tá em nenhuma pelada. Comece criando uma ou peça um convite pra um amigo."
- **Loading**: skeleton dos cards.

---

### 3.5 Criar nova pelada (`/peladas/nova`) — wizard 3 passos

#### Passo 1/3 — Identidade

```
┌──────────────────────────────────┐
│  ← Cancelar      Passo 1 de 3    │
│  ▰▰▱                             │  ← progress bar
│                                  │
│  Como a galera chama?            │
│                                  │
│  Nome                            │
│  ┌────────────────────────────┐  │
│  │  Cornetas                  │  │
│  └────────────────────────────┘  │
│                                  │
│  Endereço (link)                 │
│  resenha.app/p/                  │
│  ┌────────────────────────────┐  │
│  │  cornetas                  │  │  ← auto-sugerido do nome
│  └────────────────────────────┘  │
│                                  │
│  Foto / Logo (opcional)          │
│  ┌────────────────────────────┐  │
│  │     📷 Adicionar foto      │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Continuar  →              │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

#### Passo 2/3 — Quando e onde

```
┌──────────────────────────────────┐
│  ← Voltar        Passo 2 de 3    │
│  ▰▰▱                             │
│                                  │
│  Quando rola?                    │
│                                  │
│  Dia                             │
│  ( ) Segunda  ( ) Terça          │
│  ( ) Quarta   ( ) Quinta         │
│  ( ) Sexta    (●) Sábado         │
│  ( ) Domingo                     │
│                                  │
│  Horário                         │
│  ┌────────────────────────────┐  │
│  │  16:00                     │  │  ← time picker nativo
│  └────────────────────────────┘  │
│                                  │
│  Local                           │
│  ┌────────────────────────────┐  │
│  │  Quadra do Zezinho         │  │
│  └────────────────────────────┘  │
│                                  │
│  Endereço (opcional)             │
│  ┌────────────────────────────┐  │
│  │  Rua tal, 123              │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Continuar  →              │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

#### Passo 3/3 — Regras

```
┌──────────────────────────────────┐
│  ← Voltar        Passo 3 de 3    │
│  ▰▰▰                             │
│                                  │
│  Algumas regras                  │
│                                  │
│  Máximo de jogadores             │
│  ┌────────────────────────────┐  │
│  │  ─    30    +              │  │  ← stepper
│  └────────────────────────────┘  │
│                                  │
│  Quantos times por partida       │
│  ( ) 2 times    (●) 2 times      │
│  ( ) Mais (rodízio)              │
│                                  │
│  Lista abre quando?              │
│  (●) 1 dia antes (sexta)         │
│  ( ) 2 dias antes (quinta)       │
│  ( ) Manualmente eu abro         │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Criar Cornetas            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

### 3.6 Dashboard da pelada (`/p/cornetas`)

```
┌──────────────────────────────────┐
│  ← Peladas    Cornetas  [⚙ ▾]    │  ← settings (admin) ou avatar
├──────────────────────────────────┤
│                                  │
│  Olá, Diego 👋                   │
│                                  │
│  ┌──────────────────────────────┐│
│  │  PRÓXIMA PARTIDA             ││  ← card destacado
│  │  Sábado, 1 jun, 16h          ││
│  │  Quadra do Zezinho           ││
│  │                              ││
│  │  Lista aberta                ││  ← badge status
│  │  18 de 30 confirmados        ││
│  │                              ││
│  │  ┌────────────────────────┐  ││
│  │  │  ✅ Confirmar presença │  ││  ← CTA principal
│  │  └────────────────────────┘  ││
│  │                              ││
│  │  Ver detalhes →              ││
│  └──────────────────────────────┘│
│                                  │
│  Atalhos                         │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 📋   │ │ 👥   │ │ 🏆   │      │  ← grid de 3
│  │ Part │ │ Jog  │ │ Rank │      │
│  └──────┘ └──────┘ └──────┘      │
│                                  │
│  Últimas partidas                │
│  ▢ 25 mai · Time A 5 x 3 Time B  │
│      Artilheiro: Roberto (3)     │
│  ▢ 18 mai · Time A 2 x 2 Time B  │
│      Artilheiro: Diego (2)       │
│  Ver todas →                     │
│                                  │
└──────────────────────────────────┘
[🏠] [📅] [🏆] [👤]                  ← bottom tab bar
```

**Estados**:
- **Sem próxima partida** ainda agendada: card "Nenhuma partida agendada. Admin pode criar uma."
- **Lista cheia**: CTA muda pra "Entrar na lista de espera".
- **Já confirmou**: CTA vira "✓ Você vai" + opção "Desmarcar".

---

### 3.7 Lista de partidas (`/p/cornetas/partidas`)

```
┌──────────────────────────────────┐
│  ← Cornetas   Partidas    [+]    │  ← + só pra admin
├──────────────────────────────────┤
│                                  │
│  [ Próximas ][ Histórico ]       │  ← tabs
│                                  │
│  ▢───────────────────────────────│
│  │ SÁB · 1 jun · 16h             │
│  │ Lista aberta                  │  ← badge
│  │ 18 / 30 confirmados           │
│  │ ✓ Você vai                    │  ← seu status
│  ▢───────────────────────────────│
│  │ SÁB · 8 jun · 16h             │
│  │ Agendada                      │
│  │ Lista abre sex, 18h           │
│  ▢───────────────────────────────│
│                                  │
└──────────────────────────────────┘
```

---

### 3.8 Detalhe da partida — varia por status

#### 3.8.a Status: `roster_open` (lista aberta — antes do jogo)

```
┌──────────────────────────────────┐
│  ← Partidas       [Compartilhar] │
├──────────────────────────────────┤
│                                  │
│  SÁB · 1 jun · 16h               │
│  Quadra do Zezinho               │
│  Lista aberta                    │
│                                  │
│  ┌──────────────────────────────┐│
│  │  ✓ Você vai                  ││  ← se já confirmou
│  │  ┌────────────────────────┐  ││
│  │  │  Desmarcar             │  ││
│  │  └────────────────────────┘  ││
│  └──────────────────────────────┘│
│                                  │
│  Confirmados  18 / 30            │
│  ────────────────────────────    │
│  1. Joaquim         ⭐ ADMIN     │
│  2. Roberto         ⚽ JUIZ      │
│  3. Diego           VOCÊ         │
│  4. Lucas                        │
│  5. Felipe                       │
│  ... (lista completa)            │
│                                  │
│  Não vão  3                      │
│  ────────────────────────────    │
│  · Marcos (justificou)           │
│  · Paulo                         │
│  · André                         │
│                                  │
│  Sem resposta  9                 │
│  ────────────────────────────    │
│  · Bruno   [Cutucar]             │
│  · Caio    [Cutucar]             │
│  ...                             │
│                                  │
│  ──────────────────────────────  │
│  [admin]                         │
│  ┌────────────────────────────┐  │
│  │  Sortear times             │  │  ← só admin/capitão
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

#### 3.8.b Status: `teams_drafted` (times definidos)

```
┌──────────────────────────────────┐
│  ← Partidas                      │
├──────────────────────────────────┤
│                                  │
│  SÁB · 1 jun · 16h               │
│  Times definidos                 │
│                                  │
│  ┌──────────────────────────────┐│
│  │  🟦  COLETES                 ││
│  │  Capitão: Joaquim            ││
│  │  ──────────────────────────  ││
│  │  · Joaquim (C)               ││
│  │  · Diego          ← você     ││
│  │  · Lucas                     ││
│  │  · Felipe                    ││
│  │  · Bruno                     ││
│  │  ...                         ││
│  └──────────────────────────────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │  ⬜  SEM COLETE              ││
│  │  Capitão: Roberto            ││
│  │  ──────────────────────────  ││
│  │  · Roberto (C)               ││
│  │  · Caio                      ││
│  │  · Paulo                     ││
│  │  ...                         ││
│  └──────────────────────────────┘│
│                                  │
│  ──────────────────────────────  │
│  [juiz]                          │
│  ┌────────────────────────────┐  │
│  │  Começar partida (modo juiz)│ │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

#### 3.8.c Status: `finished` (acabou — visão de histórico)

```
┌──────────────────────────────────┐
│  ← Partidas                      │
├──────────────────────────────────┤
│                                  │
│  SÁB · 1 jun · 16h               │
│  FINALIZADA                      │
│                                  │
│  ┌──────────────────────────────┐│
│  │   🟦 COLETES                 ││
│  │       5                      ││  ← placar grande
│  │       x                      ││
│  │       3                      ││
│  │   ⬜ SEM COLETE              ││
│  └──────────────────────────────┘│
│                                  │
│  Artilheiros                     │
│  ⚽ Roberto    3                 │
│  ⚽ Diego      2                 │
│  ⚽ Caio       2                 │
│  ⚽ Lucas      1                 │
│                                  │
│  Assistências                    │
│  🅰 Felipe     2                 │
│  🅰 Bruno      1                 │
│                                  │
│  Eventos                         │
│  · 5'  ⚽ Roberto (Coletes)      │
│  · 12' ⚽ Diego (Coletes)        │
│  · 18' 🟨 Caio (Sem colete)      │
│  · 23' ⚽ Caio (Sem colete)      │
│  · ...                           │
│                                  │
└──────────────────────────────────┘
```

---

### 3.9 Sortear times (`/p/cornetas/partidas/[id]/sortear`)

```
┌──────────────────────────────────┐
│  ← Cancelar      Sortear times   │
├──────────────────────────────────┤
│                                  │
│  18 jogadores confirmados        │
│                                  │
│  Como vai sortear?               │
│                                  │
│  ┌──────────────────────────────┐│
│  │  🎲  Aleatório               ││  ← cards
│  │      Embaralha e divide      ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │  ⚖  Equilibrado              ││
│  │      Usa média de notas      ││  ← desabilitado em F1
│  │      (disponível na F2)      ││     (mostrar como "em breve")
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │  👑  Capitães escolhem       ││
│  │      Modo clássico           ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │  ✋  Manual                  ││
│  │      Eu monto                ││
│  └──────────────────────────────┘│
│                                  │
└──────────────────────────────────┘
```

**Fluxo: opção "Capitães escolhem"**:

```
┌──────────────────────────────────┐
│  ← Voltar        Capitães        │
├──────────────────────────────────┤
│                                  │
│  Escolha os 2 capitães           │
│                                  │
│  Capitão 1                       │
│  ┌────────────────────────────┐  │
│  │  Joaquim                ▾  │  │  ← select
│  └────────────────────────────┘  │
│                                  │
│  Capitão 2                       │
│  ┌────────────────────────────┐  │
│  │  Roberto                ▾  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Continuar  →              │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

   ▼ depois

┌──────────────────────────────────┐
│  ← Voltar    Vez do Joaquim 🟦   │  ← header dinâmico
├──────────────────────────────────┤
│                                  │
│  🟦 COLETES (Joaquim)            │
│  · Joaquim (C)                   │
│  · Diego                         │
│  · Felipe                        │
│  Total: 3                        │
│  ────                            │
│  ⬜ SEM COLETE (Roberto)         │
│  · Roberto (C)                   │
│  · Caio                          │
│  · Lucas                         │
│  Total: 3                        │
│                                  │
│  Disponíveis (12)                │
│  ┌────────────────────────────┐  │
│  │  + Bruno                   │  │  ← tap pra escolher
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  + Paulo                   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  + André                   │  │
│  └────────────────────────────┘  │
│  ...                             │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Finalizar sorteio         │  │  ← só ativa quando vazio
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

### 3.10 Modo juiz (`/p/cornetas/partidas/[id]/juiz`)

```
┌──────────────────────────────────┐
│  ← Sair           Modo juiz      │
├──────────────────────────────────┤
│                                  │
│      🟦 COLETES                  │
│  ┌────────┐    ┌────────┐        │
│  │   2    │    │   1    │        │  ← placar GRANDE
│  └────────┘    └────────┘        │
│      ⬜ SEM COLETE               │
│                                  │
│  [ + Gol Coletes ][ + Gol Sem c ]│  ← botões grandes
│                                  │
│  ─── Eventos ────────────────    │
│  · 12'  ⚽ Diego (Coletes)       │
│  · 8'   ⚽ Caio (Sem colete)     │
│  · 5'   ⚽ Roberto (Coletes)     │  ← lista reversa
│                                  │
│  ──────────────────────────────  │
│  ┌────────────────────────────┐  │
│  │  Finalizar partida         │  │  ← confirma com modal
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Fluxo: tap em "+ Gol Coletes"**:

```
┌──────────────────────────────────┐
│  Quem fez o gol?    [Cancelar]   │
├──────────────────────────────────┤
│                                  │
│  Buscar jogador...               │
│  ┌────────────────────────────┐  │
│  │  🔍                        │  │
│  └────────────────────────────┘  │
│                                  │
│  🟦 COLETES                      │
│  ┌────────────────────────────┐  │
│  │  Joaquim                   │  │  ← lista tappável
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Diego                     │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Felipe                    │  │
│  └────────────────────────────┘  │
│  ...                             │
│                                  │
│  Outras opções                   │
│  · Gol contra                    │
│  · Jogador não cadastrado        │
└──────────────────────────────────┘

   ▼ após escolher

┌──────────────────────────────────┐
│  Detalhes (opcional) [Pular]     │
├──────────────────────────────────┤
│                                  │
│  ⚽ Diego marcou pra Coletes     │
│                                  │
│  Quem deu a assistência?         │
│  (opcional)                      │
│  ┌────────────────────────────┐  │
│  │  Felipe                 ▾  │  │
│  └────────────────────────────┘  │
│                                  │
│  Minuto (opcional)               │
│  ┌────────────────────────────┐  │
│  │  18                        │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Confirmar gol             │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

> **Princípio**: o **mínimo** pra registrar um gol é **1 tap** (no botão "Gol") + **1 tap** (no nome do jogador). Assistência e minuto são opcionais e podem ser pulados — depois o juiz edita.

---

### 3.11 Lista de jogadores (`/p/cornetas/jogadores`)

```
┌──────────────────────────────────┐
│  ← Cornetas   Jogadores  [+ ➤]   │  ← convidar
├──────────────────────────────────┤
│                                  │
│  🔍 Buscar...                    │
│                                  │
│  Ativos (18)                     │
│  ────────────────────────────    │
│  [foto] Joaquim       ADMIN      │
│  [foto] Roberto       JUIZ       │
│  [foto] Diego                    │
│  [foto] Lucas                    │
│  [foto] Felipe                   │
│  ...                             │
│                                  │
│  Inativos (3)                    │
│  ────────────────────────────    │
│  [foto] Velho amigo              │
│  ...                             │
│                                  │
└──────────────────────────────────┘
```

---

### 3.12 Convidar jogadores (`/p/cornetas/jogadores/convidar`)

```
┌──────────────────────────────────┐
│  ← Jogadores                     │
├──────────────────────────────────┤
│                                  │
│  Convidar pra Cornetas           │
│                                  │
│  Compartilha esse link com quem  │
│  você quer chamar:               │
│                                  │
│  ┌────────────────────────────┐  │
│  │ resenha.app/convite/abc123 │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  📋 Copiar link            │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  📲 Compartilhar (WhatsApp)│  │  ← Web Share API
│  └────────────────────────────┘  │
│                                  │
│  ──────────────────────────────  │
│                                  │
│  Ou convide por e-mail           │
│  ┌────────────────────────────┐  │
│  │ joao@exemplo.com           │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Enviar convite            │  │
│  └────────────────────────────┘  │
│                                  │
│  Convites pendentes (2)          │
│  · maria@exemplo.com   ✕ cancelar│
│  · pedro@exemplo.com   ✕ cancelar│
│                                  │
└──────────────────────────────────┘
```

---

### 3.13 Ranking (`/p/cornetas/ranking`)

```
┌──────────────────────────────────┐
│  ← Cornetas   Ranking            │
├──────────────────────────────────┤
│                                  │
│  Ano: [ 2026 ▾ ]                 │
│                                  │
│  [ Artilharia ][ Assists ][ Mais ]│  ← tabs/scroll horizontal
│                                  │
│  🥇 Roberto      24 gols         │
│  🥈 Diego        18 gols         │
│  🥉 Caio         15 gols         │
│  4. Joaquim      11 gols         │
│  5. Lucas         9 gols         │
│  6. Felipe        7 gols         │
│  7. Bruno         5 gols         │
│  ... (lista completa)            │
│                                  │
│  ──────────────────────────────  │
│  Você (Diego)                    │
│  📍 2º lugar · 18 gols           │  ← posição do user
│                                  │
└──────────────────────────────────┘
```

---

### 3.14 Configurações da pelada (admin) (`/p/cornetas/configuracoes`)

```
┌──────────────────────────────────┐
│  ← Cornetas    Configurações     │
├──────────────────────────────────┤
│                                  │
│  Geral                           │
│  ────────────────────────────    │
│  · Nome              Cornetas  ▸ │
│  · Foto/Logo                   ▸ │
│  · Dia da semana     Sábado    ▸ │
│  · Horário           16:00     ▸ │
│  · Local             Quadra…   ▸ │
│  · Máx jogadores     30        ▸ │
│                                  │
│  Equipe                          │
│  ────────────────────────────    │
│  · Admins (1)                  ▸ │
│  · Juízes (3)                  ▸ │
│                                  │
│  Perigo                          │
│  ────────────────────────────    │
│  · Arquivar pelada             ▸ │  ← vermelho
│                                  │
└──────────────────────────────────┘
```

---

## 4. Componentes recorrentes (design system mínimo)

| Componente | Onde aparece | Notas |
|---|---|---|
| `<AppHeader>` | Todas as telas logadas | Tenant atual + avatar + menu |
| `<BottomTabBar>` | Telas principais da pelada | 4 tabs: Início, Partidas, Ranking, Perfil |
| `<MatchCard>` | Dashboard, lista de partidas | Status badge, contador presença |
| `<PlayerListItem>` | Lista de jogadores, presença | Foto, nome, badges (admin/juiz/você) |
| `<StatusBadge>` | Cards de partida | `Lista aberta`, `Finalizada`, `Em andamento` |
| `<ScoreCard>` | Detalhe partida, dashboard | Placar grande, nomes/cores dos times |
| `<EmptyState>` | Listas vazias | Ilustração simples + copy + CTA |
| `<ConfirmDialog>` | Ações destrutivas | "Tem certeza?" + Cancelar/Confirmar |
| `<Toast>` | Feedback de ações | Topo da tela, auto-dismiss |

---

## 5. Estados sistêmicos

### 5.1 Loading

- **Listas**: skeletons no formato dos cards (não spinners).
- **Página inteira**: usar Suspense do Next.js com fallback skeleton.
- **Ação async** (botão): botão fica disabled com spinner inline.

### 5.2 Vazio

- **Sempre uma ilustração + copy + CTA**:
  - "Nenhuma partida agendada ainda. Crie a próxima!"
  - "Você ainda não tá em nenhuma pelada. Crie uma ou peça um convite pra um amigo."
  - "Sem jogadores cadastrados além de você. Convide a galera!"

### 5.3 Erro

- **Inline (form)**: mensagem vermelha embaixo do campo.
- **Global (action)**: toast no topo: "Algo deu errado. Tenta de novo?"
- **Página inteira (404/500)**: ilustração + copy + botão de voltar pra home.

### 5.4 Sem permissão

- Componentes/CTAs de admin **não aparecem** pra não-admin (não mostrar e desabilitar).
- Se acessar URL direto: redireciona pro dashboard com toast "Você não tem permissão pra isso."

---

## 6. Princípios de UX confirmados

1. **1 tap pra ação principal** da home da pelada (confirmar presença, ver placar).
2. **Botões grandes no modo juiz** — uso em movimento, suado.
3. **Empty states com personalidade** — copy informal, divertida.
4. **Push notifications** (F3+) pros momentos-chave: lista aberta, times sorteados, suas notas saíram.
5. **Dark mode** desde a F1 (custo ~0 com Tailwind + shadcn).
6. **Acessível por teclado** — todas as ações disponíveis sem mouse.
7. **PWA instalável** desde F1 — manifest + ícones + service worker básico.

---

## 7. Decisões em aberto (pra revisitar)

- [ ] **Times com mais de 2** (rodízio) — o quanto suportar na F1?
- [ ] **Lista de espera**: vira presença automaticamente quando alguém desmarca, ou pede confirmação?
- [ ] **Edição de eventos** após `finished`: só admin? Período limitado?
- [ ] **Múltiplos juízes** numa partida — quem prevalece se houver conflito?
- [ ] **Push notification** — entra na F1 (escopo PWA) ou empurra pra F3?
- [ ] **Compartilhar resultado no WhatsApp** — gerar imagem? texto formatado?
