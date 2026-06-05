# Setup — bootstrap do projeto

> Roteiro **passo a passo** pra montar o projeto do zero (Next.js + tooling completo).
> Execute na ordem. A cada **CHECKPOINT**, me passe o output indicado.
> Tempo estimado: **~30 min**.
>
> Pré-preenchido com seus dados:
> - **Nome**: Jomo Ramon dos Santos
> - **E-mail**: 62065739+jomo-ramon@users.noreply.github.com
> - **GitHub username**: `jomo-ramon`
> - **Repo**: `resenha` (público)

---

## CHECKPOINT 0 — Abra o terminal na pasta certa

Abra o **PowerShell** e navegue até a pasta do projeto:

```powershell
cd "$env:USERPROFILE\Documents\pasta pessoal\Projects\resenha"
```

Confirma que está no lugar certo:

```powershell
pwd
ls
```

Deve mostrar os arquivos atuais (`ARCHITECTURE.md`, `CODING_STANDARDS.md`, `README.md`, `WIREFRAMES_F1.md`, `.editorconfig`, `.gitignore`, pasta `.git`).

---

## CHECKPOINT 1 — Verificar ferramentas instaladas

Cole tudo de uma vez:

```powershell
Write-Host "=== Node ===" -ForegroundColor Cyan
node --version
Write-Host "=== npm ===" -ForegroundColor Cyan
npm --version
Write-Host "=== pnpm ===" -ForegroundColor Cyan
pnpm --version
Write-Host "=== git ===" -ForegroundColor Cyan
git --version
Write-Host "=== gh ===" -ForegroundColor Cyan
gh --version
Write-Host "=== git user ===" -ForegroundColor Cyan
git config --global user.name
git config --global user.email
```

📤 **Me passe o output completo.**

> Se `pnpm` ou `gh` derem "command not found", segue pro próximo checkpoint que orienta como instalar. Os outros (`node`, `npm`, `git`) devem estar OK já que você confirmou ter Node + GitHub.

---

## CHECKPOINT 2 — Instalar o que faltar

### 2.1 `pnpm` (se não tiver)

```powershell
npm install -g pnpm
pnpm --version
```

> Alternativa via Corepack (recomendada se Node ≥ 16.10):
> ```powershell
> corepack enable
> corepack prepare pnpm@latest --activate
> pnpm --version
> ```

### 2.2 `gh` — GitHub CLI (opcional mas recomendado)

Sem `gh`, criamos o repo pelo site. Com `gh`, é 1 comando.

```powershell
winget install --id GitHub.cli -e
```

Reabra o PowerShell e confirme:
```powershell
gh --version
gh auth login
```

> `gh auth login` te guia pra autenticar (escolha **GitHub.com** → **HTTPS** → **Login with a web browser**). Vai abrir o navegador.

### 2.3 Configurar git (se ainda não está)

Só rode se o CHECKPOINT 1 mostrou `user.name` ou `user.email` vazios:

```powershell
git config --global user.name "Jomo Ramon dos Santos"
git config --global user.email "62065739+jomo-ramon@users.noreply.github.com"
git config --global init.defaultBranch main
git config --global core.autocrlf false
git config --global core.eol lf
```

> `core.autocrlf false` + `core.eol lf` evitam dor de cabeça com line endings entre Windows ↔ macOS/Linux.

📤 **Me confirme: "Tudo instalado, pode seguir."**

---

## CHECKPOINT 3 — Renomear branch local de `master` → `main`

Padrão moderno do GitHub.

```powershell
git branch -m master main
git branch
```

Deve listar `* main`.

📤 **Me confirme: "Branch renomeado pra main."**

---

## CHECKPOINT 4 — Criar repo no GitHub

### Opção A — com `gh` CLI (1 comando)

```powershell
gh repo create resenha `
  --public `
  --source=. `
  --remote=origin `
  --description "Plataforma web pra organizar peladas amadoras de futebol" `
  --push
```

> Esse comando: cria o repo público, conecta como `origin`, e dá push do que já tem.

### Opção B — pelo site

1. Acesse https://github.com/new
2. **Repository name**: `resenha`
3. **Description**: "Plataforma web pra organizar peladas amadoras de futebol"
4. **Public**
5. **NÃO** marque "Add a README", `.gitignore` nem license (já temos).
6. Clica **Create repository**.

Depois cole no terminal:

```powershell
git remote add origin https://github.com/jomo-ramon/resenha.git
git push -u origin main
```

📤 **Me passe a URL do repo** (ex: `https://github.com/jomo-ramon/resenha`).

---

## CHECKPOINT 5 — Scaffolding do Next.js

> ⚠️ **Armadilha conhecida**: o `create-next-app` **aborta silenciosamente** se a pasta atual tiver qualquer arquivo/pasta fora do whitelist dele. Mesmo com `--yes`, ele não pergunta — só sai com erro.
>
> O whitelist aceita: `.git`, `.gitignore`, `.gitattributes`, `.idea`, `LICENSE`, **`docs/`**, e algumas outras. Qualquer outro arquivo conflita.
>
> Solução: mover nossos `.md` e `.editorconfig` pra dentro de uma pasta `docs/` temporária (que está no whitelist), rodar o scaffold, e mover de volta.

### 5.1 — Mover arquivos pra `docs/` (whitelist do create-next-app)

```powershell
mkdir docs
Move-Item .editorconfig       docs\
Move-Item ARCHITECTURE.md     docs\
Move-Item CODING_STANDARDS.md docs\
Move-Item README.md           docs\
Move-Item SETUP.md            docs\
Move-Item WIREFRAMES_F1.md    docs\
ls -Force
```

> O `ls -Force` deve mostrar **só** `.git`, `.gitignore` e `docs/`.

### 5.2 — Rodar o scaffold

```powershell
pnpm create next-app@latest . `
  --ts `
  --tailwind `
  --app `
  --src-dir `
  --import-alias "@/*" `
  --use-pnpm `
  --no-eslint `
  --turbopack `
  --yes
```

> Flags:
> - `--no-eslint` — usaremos **Biome** no lugar (CODING_STANDARDS §9.1)
> - `--turbopack` — default do Next 16, mais rápido
> - `--yes` — responde "yes" pra qualquer pergunta interativa
>
> Vai criar `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/`, `public/`, `AGENTS.md`, `CLAUDE.md`, `pnpm-workspace.yaml`, e rodar `pnpm install` automaticamente (~2-3 min).

### 5.3 — Mover docs de volta pra raiz

```powershell
Move-Item docs\README.md       . -Force
Move-Item docs\.editorconfig   . -Force
Move-Item docs\ARCHITECTURE.md .
Move-Item docs\CODING_STANDARDS.md .
Move-Item docs\SETUP.md        .
Move-Item docs\WIREFRAMES_F1.md .
Remove-Item docs
```

> O `-Force` em `README.md` e `.editorconfig` sobrescreve os arquivos que o Next criou.

### 5.4 — Validar

```powershell
ls -Force
pnpm dev
```

Acesse http://localhost:3000 e confirme que sobe. Mata com **Ctrl+C**.

📤 **Me confirme: "Next.js scaffoldado, sobe na 3000."**

---

## CHECKPOINT 6 — Instalar deps extras (de uma vez)

```powershell
# Runtime
pnpm add `
  drizzle-orm `
  postgres `
  @auth/core `
  next-auth@beta `
  @auth/drizzle-adapter `
  zod `
  react-hook-form `
  @hookform/resolvers `
  zustand `
  date-fns `
  clsx `
  tailwind-merge `
  lucide-react `
  next-pwa

# Dev / build
pnpm add -D `
  drizzle-kit `
  @types/node `
  @biomejs/biome `
  husky `
  lint-staged `
  @commitlint/cli `
  @commitlint/config-conventional `
  vitest `
  @vitest/coverage-v8 `
  @testing-library/react `
  @testing-library/jest-dom `
  jsdom `
  @playwright/test
```

📤 **Me confirme: "Deps instaladas."**

---

## CHECKPOINT 7 — Configurar Biome (lint + format)

```powershell
pnpm exec biome init
```

📤 **Me confirme** quando terminar. Eu vou te passar o conteúdo final do `biome.json` pra colar (configuração nossa: regras do CODING_STANDARDS aplicadas).

---

## CHECKPOINT 8 — Configurar Husky + lint-staged + commitlint

```powershell
# Husky setup
pnpm exec husky init

# Cria hooks (preencho conteúdo no próximo passo)
echo "" > .husky/pre-commit
echo "" > .husky/commit-msg
```

📤 **Me confirme** — depois eu te passo o conteúdo exato de cada arquivo (pre-commit, commit-msg, commitlint.config.js, .lintstagedrc).

---

## CHECKPOINT 9 — Estrutura de pastas

Eu vou criar os arquivos via tools quando você chegar aqui (é melhor do que ficar criando pasta por pasta no terminal).

Apenas me confirme: **"Estou no CHECKPOINT 9"**.

Vou criar:
- `src/lib/db/{schema,repositories,migrations}/`
- `src/lib/domain/`
- `src/lib/auth/`
- `src/lib/utils/`
- `src/server/{actions,queries,services}/`
- `src/components/{ui,domain}/`
- `tests/e2e/`
- `.github/workflows/ci.yml`
- `drizzle.config.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `tsconfig.json` (atualizado com strict + branded IDs prep)
- `next.config.mjs` (com PWA wrapper)

E vou popular cada arquivo de config com nossos padrões.

---

## CHECKPOINT 10 — Primeiro commit do scaffold

```powershell
git add -A
git status
```

📤 **Me passe o `git status`** pra eu validar que não tá indo nada estranho.

Depois:

```powershell
git commit -m "feat: scaffold Next.js app with Biome, Drizzle, Auth.js and testing tools"
git push
```

📤 **Me confirme.** Aí seguimos pra primeira feature de verdade.

---

## Próximos passos (depois do CHECKPOINT 10)

1. Configurar conta no **Supabase** (DB + storage)
2. Criar projeto no **Google Cloud** (OAuth credentials)
3. Criar `.env.example` e `.env.local` com vars necessárias
4. Definir schema Drizzle das entidades F1 (User, Pelada, Membership, Match, Team, RosterEntry, MatchEvent)
5. Rodar primeira migration
6. Configurar Auth.js
7. **Primeira tela funcional**: landing + login (Google)
8. Deploy inicial na **Vercel** conectada ao repo (auto-deploy a cada push)

A partir daí você já tem o app **rodando em produção**, pronto pra ir entregando feature por feature da F1.

---

## Troubleshooting comum

### "pnpm: command not found" depois de instalar
Feche e reabra o PowerShell pra atualizar o PATH.

### "execution policy" do PowerShell bloqueando scripts
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### `create-next-app` perguntando coisas que não estão nas flags
Responde "y" pra prosseguir, "yes" pra usar Tailwind, "yes" pra App Router. Se errar, dá pra abortar com Ctrl+C e rodar de novo.

### Push pra GitHub pedindo senha
Se for via HTTPS, configure o `gh auth setup-git` (preenche credentials automaticamente).
