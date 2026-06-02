@AGENTS.md

# Dieta — Handoff pro próximo agente

App PWA mobile-first pra um casal (Alysson + Taina) trackear dieta: refeições por dia da semana, água, metas, streaks. Deploy: Vercel. Backend: Supabase. Repo público no GitHub (segurança via Supabase Auth + RLS).

**Status:** Passos 1-8 ✅ entregues. **Passos 9 e 10 PENDENTES** — ver no fim deste arquivo.

---

## Stack (locked — não trocar)

| Área | Escolha | Notas |
|---|---|---|
| Framework | **Next.js 16** (App Router) | ⚠️ `middleware.ts` foi renomeado pra `proxy.ts` no v16 |
| React | 19.2.4 | |
| Lang | TypeScript estrito | |
| CSS | **Tailwind v4** | Config via CSS (`@theme inline` no `globals.css`), NÃO tem `tailwind.config.ts` |
| UI primitives | **shadcn/ui** (`base-nova` style, `@base-ui/react`) | Botão Primitive já usa base-ui, NÃO Radix |
| Tema | **Light fixo** (off-white + warmth sutil) | User vetou dark, NÃO oferecer toggle |
| State / data | **TanStack Query v5** + `@supabase/ssr` | Tudo client-side, queries em `lib/queries/` |
| Forms | react-hook-form + zod em alguns + manual useState em outros (refator histórico) | |
| PWA | **Serwist** (`@serwist/next`) | Disabled em dev. Build com `--webpack` (Serwist não suporta Turbopack ainda) |
| Pkg mgr | **pnpm 9** (Node 20) | pnpm 10+ exige Node 22 |
| Auth | `@supabase/ssr` 3 clients | `lib/supabase/{client,server,middleware}.ts` |

---

## Setup do user (Supabase)

Project ID: `uokgyabohzgnfdwquqcw`. URL e anon key estão em `.env.local` (gitignored). Mesmas em Vercel env vars.

- 2 perfis seedados via `sql/schema.sql`: Você (`#a78bfa`) e Ela (`#f472b6`)
- Signup desabilitado no painel Auth
- Usuários criados manualmente no painel Auth → "Add user" com "Auto Confirm User"
- RLS: `authenticated_full_access` em todas as 6 tabelas (qualquer um dos 2 vê tudo)

---

## Arquitetura de pastas

```
app/
├── (app)/                 # rotas autenticadas (group route)
│   ├── alimentos/         # CRUD de alimentos
│   ├── hoje/              # tela inicial: refeições + água + totais
│   ├── painel/            # streaks + gráficos + conta
│   ├── planner/           # refeições por dia da semana
│   └── layout.tsx         # shell: ProfileSwitcher + gear + BottomTabBar
├── login/                 # único route público
├── layout.tsx             # root: <Providers> + meta iOS PWA + viewport
├── manifest.ts            # PWA manifest
└── sw.ts                  # Serwist service worker

components/
├── ui/                    # shadcn primitives + extras nossos
│   ├── confirm-sheet.tsx  # action sheet de confirmação (substitui window.confirm)
│   └── ...                # button, input, sheet, popover, etc.
├── auth/login-form.tsx
├── foods/                 # FoodRow, FoodFormSheet
├── meals/                 # MealCardPlanner, MealFormSheet, MealDetailSheet,
│                          # MealItemQtySheet, TodayMealCard, FoodPickerSheet, DayTabs, DaySummary
├── painel/                # StreakCard, KcalChart, CompletionChart,
│                          # ProfileSettingsCard, AccountCard
├── water/water-card.tsx
├── tabs/bottom-tab-bar.tsx
├── profile-switcher.tsx
├── profile-settings-sheet.tsx  # gear icon do header → abre ProfileSettingsCard
└── providers.tsx          # QueryClient

lib/
├── supabase/{client,server,middleware}.ts  # 3 clients @supabase/ssr
├── queries/{keys,profiles,foods,meals,water}.ts  # TanStack Query
├── calculations/{macros,streaks,reminders}.ts
├── hooks/{use-user,use-active-profile}.ts
├── date.ts                # today, toIsoDate, dayName, formatLongDate
├── haptic.ts              # navigator.vibrate wrapper
└── utils.ts               # cn() do shadcn

sql/schema.sql             # NÃO-DESTRUTIVO: create-if-not-exists + drop/create policy + seeds guardados. Seguro rerodar.
sql/enable-realtime.sql    # snippet isolado pra ligar realtime sem tocar dados
sql/reset.sql              # ⚠️ destrutivo — só pra zerar de propósito
types/database.ts          # interfaces TS manuais (manter em sync com schema.sql)
proxy.ts                   # Next 16 middleware (chama updateSession + redirects)
```

---

## Convenções importantes

### Tema light fixo
- `<html>` SEM classe `dark` (foi removido). `:root` tem as cores light no `globals.css`.
- Status bar PWA: `apple-mobile-web-app-status-bar-style: default` (barra opaca clara, ícones escuros).
- Theme color: `#fafafa`.
- ⚠️ **NUNCA** usar cores hardcoded tipo `border-zinc-800`, `bg-zinc-950` — use tokens (`border-border`, `bg-card`, `bg-muted`, `text-muted-foreground`). Exceções intencionais: avatares do perfil têm bg na cor do perfil + `text-zinc-950` (preto sobre cor); o check verde do checkbox tem `bg-emerald-500 text-zinc-950`.

### Safe areas iOS (notch + home indicator)
Utilitários custom no `globals.css` — usar SEMPRE em vez de inline `env()`:
- `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` — safe-area inset
- `pt-safe-or-3`, `pt-safe-or-4`, `pb-safe-or-4` — min padding
- `pb-tabbar` — reserva 3.5rem + safe pro BottomTabBar (use em `<main>`)
- `bottom-fab` — posiciona FAB acima da tabbar (use em FAB fixed)
- `pb-sheet-footer` — `max(1.25rem, env(safe-area-inset-bottom) + 0.75rem)` — usar em footers de sheet ou último item do scroll de sheet, evita botões "encostados" no home indicator
- `tabular-nums` — `font-variant-numeric: tabular-nums` (usar em qualquer número)

### Sheets (padrão atual depois do revert do custom keypad)
Sheets com input usam **`h-[92dvh]`** (altura fixa) — antes era `max-h` mas colapsava demais quando iOS keyboard abria:

```tsx
<SheetContent
  side="bottom"
  className="flex h-[92dvh] flex-col gap-0 p-0"
>
  <SheetHeader className="border-b border-border px-4 py-3">
    <SheetTitle>...</SheetTitle>
  </SheetHeader>
  {/* scroll area */}
  <div className="pb-sheet-footer flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3">
    {/* content */}
  </div>
</SheetContent>
```

Sheets de confirmação curtos (sem input) usam `max-h-[50dvh|60dvh]`.

**Decisão importante (revert 7f47dd3):** voltamos pro teclado nativo iOS. Custom keypad foi tentado e descartado — apps nativos usam o teclado do sistema. Não voltar pra essa decisão sem pedir.

### Teclado iOS + viewport
- Viewport meta: `interactiveWidget: 'resizes-content'` (em `app/layout.tsx`)
- Inputs com `font-size: 16px` (em globals.css) pra evitar auto-zoom iOS
- `input[type="time/date"]` com `appearance: none + max-width: 100%` (iOS aplicava estilo "button" extrapolando largura)

### Confirmações
- `<ConfirmSheet>` (`components/ui/confirm-sheet.tsx`) — NUNCA `window.confirm()` (dialog nativo iOS quebra o tema).
- Para escolhas múltiplas (ex.: "excluir só desta refeição vs todas"), criar componente inline tipo `DeleteItemSheet` em `meal-detail-sheet.tsx` — botões verticais + Cancelar.

### Queries (TanStack Query)
- Keys centralizados em `lib/queries/keys.ts`.
- Mutações com `onSuccess` invalidando keys relevantes. Em algumas com latência percebida (toggle item check, add water), tem optimistic update via `onMutate`/`onError`/`onSettled`.
- Patterns que valem:
  - `useMealTemplatesByDay(profileId, dayOfWeek)` — refeições de um dia
  - `useAllMealTemplates(profileId)` — todas (pra painel)
  - `useMealItemCompletions(profileId, date)` — checks daquele dia
  - `useToggleMealItemCompletion` — toggle 1 item (optimistic)
  - `useToggleAllMealItems` — bulk
  - `useAddMealItemToAllByName` — adiciona alimento em todas refeições do mesmo nome
  - `useDeleteFoodFromAllMeals` — remove alimento de todas as refeições do perfil

### Schema (item-level completions — mudou no lote anterior)
- `meal_completions` foi REMOVIDA e substituída por **`meal_item_completions`** (check por alimento, não por refeição inteira).
- Refeição "completa" = todos os items dela checados naquele dia.
- Streak de refeição computado em `painel/page.tsx` agrupando items por meal.

### Substituições (substitutos por alimento, simétricos + override do dia)
- `foods.category` (`carbo|proteina|gordura|livre`) — macro dominante. Cadastro sugere automático (`suggestCategory`), usuário confirma. Badge na aba Alimentos, dot (cor `-400`) no Planner/Hoje (`components/foods/category-badge.tsx`).
- **`food_substitutes`** — substitutos cadastrados POR alimento, **simétricos** (adicionar B em A grava `(A,B)` e `(B,A)`). Configurado na aba Alimentos via `SubstitutesSheet` (ícone ↔ no `FoodRow`). Picker só lista **mesma categoria**. `useAddSubstitute`/`useRemoveSubstitute` (foods.ts) gravam/apagam as 2 direções.
- **`meal_item_overrides`** — a troca de um item por um substituto **só naquele dia** (Hoje), sem mexer no planner. Sincroniza via realtime.
- No Hoje, `FoodSwapSheet` lista **só os substitutos cadastrados** do alimento (`useFoodSubstitutes`), NÃO a categoria toda. `equivalentQuantity` calcula a qty igualando o macro da categoria do original (`livre` = por peso).
- `effectiveItem(item, overrides)` resolve food/qty efetivos; `dayTotals`/`mealTotals` aceitam `OverrideMap`.
- Reads de override e substitutos são **defensivos** (retornam `[]` se a tabela não existir).
- SQL isolado seguro: `sql/add-substitutions.sql` (category + overrides) e `sql/add-food-substitutes.sql` (tabela de substitutos). Espelhados no `schema.sql`.

### Forced light bg em recharts tooltips
Tooltips dos gráficos no painel usam strings literais `#ffffff` / `#e4e4e7` / `#71717a` / `#18181b` porque recharts não pega CSS custom properties bem.

### Layout shell (notch + tab bar)
`app/(app)/layout.tsx`:
```tsx
<>
  <div className="pt-safe pb-tabbar flex min-h-screen flex-col">
    <header>... ProfileSwitcher + gear icon ...</header>
    <div className="flex flex-1 flex-col">{children}</div>
  </div>
  <BottomTabBar accent={active?.color} />
</>
```

`min-h-screen` (vh, não dvh) é deliberado — dvh causava layout shift no init do PWA enquanto iOS calcula safe area. BottomTabBar renderiza FORA do container interno (fragment) pra `fixed` ancorar direto ao viewport.

---

## ⚠️ Gotchas Next 16

1. **Middleware → Proxy**: arquivo é `proxy.ts` (raiz), função exportada é `proxy()`. Mesma semântica.
2. **Build precisa `--webpack`** (Serwist incompatível com Turbopack). Já no `package.json scripts.build`.
3. **Dev usa Turbopack** mas Serwist auto-desabilita em dev (`process.env.NODE_ENV === 'development'`). `turbopack: {}` no `next.config.ts` silencia o aviso de "webpack config sem turbopack config".
4. **ESLint v9 + React Compiler**: regra `react-hooks/set-state-in-effect` é estrita. Padrões aceitos:
   - Form resets em `useEffect`: usar `// eslint-disable-next-line react-hooks/set-state-in-effect -- justificativa`
   - Sync de prop → state: preferir key prop OR derivar via `useMemo`
5. **lucide-react 1.x**: APIs estáveis, mas atenção em imports.
6. **shadcn `base-nova` + `@base-ui/react`**:
   - `<PopoverTrigger>` NÃO aceita `asChild` (era Radix). Use `render={<Button />}` ou estilize o trigger direto.
   - Botão tem variantes `default | outline | secondary | ghost | destructive | link` e sizes `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`.

---

## Como rodar / deploy

```bash
pnpm install
pnpm dev          # http://localhost:3000 (Turbopack, SW off)
pnpm build        # build com webpack (Serwist on)
pnpm lint
```

Deploy: push pra `main` → Vercel auto-deploya. Env vars já configuradas (URL + anon key).

Para testar PWA no iPhone:
- Abrir URL Vercel no Safari → Compartilhar → Adicionar à Tela de Início
- Status bar = barra clara opaca (style default)
- Pra debug, usar `pnpm dlx cloudflared tunnel --url http://localhost:3000`

---

## ✅ Status: o que já foi feito

| # | Passo | Status |
|---|---|---|
| 1 | Setup base (Next + Tailwind + shadcn + clients Supabase + PWA shell) | ✅ |
| 2 | SQL schema (6 tabelas + RLS + seeds dos 2 perfis) | ✅ (migrado pra `meal_item_completions`) |
| 3 | Login + proteção de rotas (`proxy.ts` + redirects + `useUser`) | ✅ |
| 4 | ProfileContext (via `useActiveProfile` com `useSyncExternalStore` + localStorage) + ProfileSwitcher + BottomTabBar | ✅ |
| 5 | Aba Alimentos (CRUD com lápis/lixeira inline + ConfirmSheet, kcal auto-calc 4·C+4·P+9·G) | ✅ |
| 6 | Aba Planner (DayTabs fixo Seg→Dom, MealFormSheet multi-dia default ALL, MealDetailSheet com itens + replicar alimento) | ✅ |
| 7 | Aba Hoje (refeições colapsáveis com `X/Y` items, check por alimento, bulk com confirm, água acima das refeições, WaterCard com quick-add + custom) | ✅ |
| 8 | Aba Painel (streaks água/refeições, KcalChart + CompletionChart 7 dias, AccountCard com sign out — config do perfil saiu daqui pro gear icon do header) | ✅ |

**Lotes de UX feedback iterados:**
- Tema light migrado (era dark)
- Layout fix (`min-h-screen` em vez de dvh, FAB position com `bottom-fab`, tab bar `h-14`)
- iOS keyboard handling (viewport `interactiveWidget: resizes-content`, sheets `h-[92dvh]`, time input fix com `appearance-none`)
- Multi-action delete (alimento da refeição: só desta vs todas)
- Excluir alimento global usa `ConfirmSheet`
- Bulk mark refeição = link discreto (não botão grande)
- KcalBar sem preenchimento fantasma do planned
- Custom keypad tentado → revertido em `7f47dd3` (decisão: usar teclado iOS, padrão profissional)

---

## ❌ PENDENTE — Passos 9 e 10

### Passo 9 — Polimento UI

**Ícones definitivos (substituir placeholders SVG):**
- Hoje: `public/icons/{icon-192,icon-512,icon-maskable,apple-touch-icon}.svg` são SVGs simples com letra "D" em `#a78bfa` sobre `#09090b`.
- Precisa: PNGs (ou WebP) com arte de verdade — ícone do app na tela de início iOS, manifest icons pra PWA install.
- Tool sugerida: `pwa-asset-generator` ou Figma → export. Sizes:
  - `icon-192.png` (192×192)
  - `icon-512.png` (512×512)
  - `icon-maskable.png` (512×512 com safe zone 80%)
  - `apple-touch-icon.png` (180×180, sem transparência)
- Atualizar `app/manifest.ts` e `app/layout.tsx` (metadata.icons) pra apontar pros `.png`.

**Splash screens iOS:**
- Hoje só tem 1 SVG placeholder em `public/splash/launch.svg`.
- iOS exige splash dimensionada por device. Lista das resoluções (iPhone 12 → 16 Pro Max):
  - 1170×2532, 1284×2778, 1290×2796, 1320×2868, 1206×2622, 1179×2556, 1242×2688, etc.
- Tool: `pwa-asset-generator` gera tudo de um SVG/PNG fonte.
- Cada arquivo precisa de `<link rel="apple-touch-startup-image" media="..." href="..." />` no `<head>` — adicionar em `app/layout.tsx`.

**Animações Framer Motion (microinterações):**
- Page transitions entre abas (slide horizontal ou fade) — `framer-motion` + `AnimatePresence` no `(app)/layout`.
- Skeleton com shimmer animado (não estático).
- Spring no toggle de item check já está. Adicionar:
  - Stagger fade-in nos cards de refeição da Hoje (entrada da lista)
  - Spring no ProfileSwitcher (já tem) — verificar fluidez
  - Bounce no FAB ao tocar
  - Haptic nos pontos críticos já está (`haptic()` em check, +água, switch perfil). Verificar se faltou em algum.

**Detalhes visuais:**
- Confirmar contraste em todas as cores acentuadas dos perfis (#a78bfa, #f472b6) com texto.
- Revisar densidade de informação em telas com pouco conteúdo (vazio).
- Possivelmente adicionar pequenos ícones lucide nos vazios pra aliviar.

### Passo 10 — README completo

`README.md` atual é incremental — falta:

1. **Setup Supabase passo-a-passo com screenshots:**
   - Criar conta + projeto.
   - Settings → API: copiar URL + anon key.
   - Authentication → desabilitar "Allow new users to sign up".
   - Authentication → Users → criar 2 usuários com "Auto Confirm".
   - SQL Editor → colar `sql/schema.sql` → Run.

2. **Deploy Vercel:**
   - `vercel.com/new` → importar repo `alyssxnDev/dieta`.
   - Build: já é `next build --webpack` no package.json (sem override).
   - Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (3 envs: Production, Preview, Development).
   - Redeploy quando atualizar env vars.

3. **Instalação no iPhone (PWA):**
   - Abrir URL Vercel no Safari (não Chrome — Chrome iOS não instala PWA).
   - Tocar Compartilhar → "Adicionar à Tela de Início".
   - Confirmar que abre em standalone (sem barra do Safari).

4. **Manutenção:**
   - Atualizações: push → Vercel auto-deploy.
   - Backup do banco: Supabase faz daily, pode export manual em Settings → Database → Backups.
   - Reset de senha de usuário: painel Auth → user → "Edit user" → set new password.

5. **Nota de segurança (repo público):**
   - Por que é seguro: signup off + RLS authenticated-only em todas as tabelas. Anon key é pública por design — mesmo vazada, não dá acesso (sem login válido).
   - Riscos remanescentes: se anon key for invalidada por compromise, regenerar em Supabase Settings → API e atualizar em Vercel envs.

6. **Estrutura do projeto + dev workflow:**
   - Reproduzir o que tá no início deste CLAUDE.md (sumarizado).

---

## Notas pro próximo agente

- **Não reintroduzir custom keypad** — foi descartado em `7f47dd3` por decisão de UX (apps profissionais usam teclado iOS).
- **Não voltar pro tema dark** — light é definitivo.
- **Schema do Supabase**: se alterar, atualizar `sql/schema.sql` E `types/database.ts` na mesma PR. ⚠️ **NUNCA reintroduzir `drop table` no `schema.sql`** — o usuário tem dados reais cadastrados. Schema é NÃO-DESTRUTIVO (`create table if not exists`, `drop policy if exists`+create, seeds só se perfis vazios). Pra mudanças de schema use `alter table ... add column if not exists` etc. O destrutivo vive isolado em `sql/reset.sql`.
- **Antes de mudar layout do shell**: cuidado com `min-h-screen` vs `dvh` — testar inicialização em PWA standalone iOS (vh estável, dvh shifta).
- **Antes de mudar sheets com input**: confirmar que `h-[92dvh]` ainda dá conta quando iOS keyboard abre. Se trocar, testar em iPhone real.
- **Lint**: `react-hooks/set-state-in-effect` é estrita; preferir `useMemo`/`useSyncExternalStore`/key-prop, e usar disable inline só com comentário justificativo.
- **Build sempre com `--webpack`** (no script).
- Pra PR de Passo 9 ou 10, commitar incremental + push automático. Vercel deploya sozinho.
- **Próximo agente vai ser Sonnet** — execução rápida, mas trate cada UX feedback com cuidado: o user testa em iPhone real e identifica detalhes visuais. Pedir screenshot quando dúvida.
