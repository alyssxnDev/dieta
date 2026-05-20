# Dieta

App PWA mobile-first pra um casal acompanhar dieta — refeições por dia da semana, água, metas, streaks. Mira na cara de app nativo iOS.

Stack: **Next.js 16** (App Router) · **TypeScript** · **Tailwind v4** · **shadcn/ui** · **Framer Motion** · **TanStack Query** · **Supabase** (Postgres + Auth + REST).

> Construção incremental em 10 passos. Estado atual: **Passo 1 (Setup base) ✅**.

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- Conta no Supabase (free tier basta)

## Setup Supabase (uma vez)

1. Acesse <https://supabase.com> e crie uma conta (recomendado: login com GitHub).
2. **New project**:
   - Nome: `dieta`
   - Region: `South America (São Paulo)` — menor latência
   - Database password: gera senha forte e guarda.
3. Aguarde o provisioning (~2 min).
4. **Settings → API**: copie `Project URL` e `anon public key`.
5. **Authentication → Sign In / Up**:
   - Email provider: **habilitado**
   - **Desabilite "Confirm email"** (assim não precisa configurar SMTP).
   - Google / GitHub / Outros: desabilitados.
6. Copie `.env.local.example` → `.env.local` e cole os 2 valores:
   ```bash
   cp .env.local.example .env.local
   ```
7. **Criar os 2 usuários e rodar o SQL fica pro Passo 2** — não precisa agora.

> 🔒 **Por que o repo pode ser público**: signup está desabilitado, então só os 2 usuários criados manualmente no painel conseguem se autenticar. Todas as tabelas têm RLS exigindo `authenticated`, então sem login você não lê nem escreve nada.

## Rodar local

```bash
pnpm install
pnpm dev
```

Abre em <http://localhost:3000>. `/` redireciona pra `/hoje` (placeholder por enquanto).

### Comandos úteis

```bash
pnpm dev      # dev server (Service Worker desabilitado em dev)
pnpm build    # build de produção (gera public/sw.js)
pnpm start    # roda o build de produção
pnpm lint     # ESLint
```

## Decisões arquiteturais

| Área | Escolha |
|---|---|
| Package manager | pnpm 9 (Node 20 não suporta pnpm 10+) |
| PWA / Service Worker | [Serwist](https://serwist.pages.dev) (`@serwist/next`) |
| Data fetching | TanStack Query v5 + `@supabase/ssr` (client-side) |
| Forms | react-hook-form + zod |
| Auth | `@supabase/ssr` — 3 clients (browser / server / proxy) |
| Tema | Dark fixo, palette base `neutral` (próxima do zinc) |

## Estrutura

```
app/
├── (app)/              # group route — telas autenticadas
│   ├── hoje/           # placeholder (real no Passo 7)
│   └── layout.tsx      # vai virar shell com BottomTabBar
├── login/              # vazio (Passo 3)
├── layout.tsx          # root: <Providers> + meta iOS PWA
├── page.tsx            # redirect → /hoje
├── globals.css         # Tailwind v4 + tokens shadcn
├── manifest.ts         # PWA manifest
└── sw.ts               # Serwist service worker
components/
├── ui/                 # shadcn (button instalado por padrão)
└── providers.tsx       # QueryClient + futuros providers
lib/
└── supabase/           # client, server, middleware (chamado de proxy.ts)
public/
├── icons/              # SVG placeholders (D em #a78bfa)
└── splash/             # SVG placeholder iOS
proxy.ts                # Next 16 renomeou middleware → proxy
```

## Roadmap

- [x] **1. Setup base** — Next + Tailwind + shadcn + Supabase clients + PWA shell
- [ ] **2. SQL schema** — tabelas, RLS, seeds, criar os 2 usuários no painel Auth
- [ ] **3. Login + proteção de rotas**
- [ ] **4. ProfileContext + ProfileSwitcher**
- [ ] **5. Aba Alimentos** (CRUD)
- [ ] **6. Aba Planner** (refeições por dia da semana)
- [ ] **7. Aba Hoje** (check refeições, água, totais)
- [ ] **8. Aba Painel** (streaks, gráficos, configurações)
- [ ] **9. Polimento UI** (ícones definitivos, splash iOS, animações, haptic)
- [ ] **10. README completo** (deploy Vercel, instalação iPhone)

## Nota: Next 16

Esse repo usa Next 16 (mais recente). Mudança principal vs Next 14/15:
- `middleware.ts` → `proxy.ts` (mesma semântica, nome novo).
