-- =============================================================================
-- Dieta — Schema completo
-- =============================================================================
--
-- IMPORTANTE: se você JÁ rodou uma versão anterior desse schema, esse arquivo
-- DROPa todas as tabelas (e os dados) antes de recriar. Roda de novo:
--   1. Abre o SQL Editor: https://supabase.com/dashboard/project/_/sql/new
--   2. Cola TUDO desse arquivo
--   3. Clica em "Run"
--
-- Mudança principal vs versão anterior:
--   meal_completions → meal_item_completions
--   Agora checamos por ITEM (banana, aveia, etc), não por refeição inteira.
--   Refeição "completa" = todos os itens dela marcados.
--
-- Depois do schema:
--   1. Authentication → Users → Add user → "Create new user"
--      2 usuários, marca "Auto Confirm User"
--   2. Authentication → Sign In / Up: "Allow new users to sign up" DESABILITADO
--
-- Segurança (repo público): signup off + RLS authenticated-only em todas as
-- tabelas. Os 2 usuários têm acesso total a TUDO (intencional — casal).
-- =============================================================================

drop table if exists public.meal_item_completions cascade;
drop table if exists public.meal_completions cascade;
drop table if exists public.water_logs cascade;
drop table if exists public.meal_template_items cascade;
drop table if exists public.meal_templates cascade;
drop table if exists public.foods cascade;
drop table if exists public.profiles cascade;


-- =============================================================================
-- profiles
-- =============================================================================
create table public.profiles (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  color                       text not null,
  daily_kcal_goal             int  not null default 2000,
  daily_carb_g_goal           int  not null default 250,
  daily_protein_g_goal        int  not null default 150,
  daily_fat_g_goal            int  not null default 65,
  daily_water_ml_goal         int  not null default 2500,
  water_reminder_enabled      boolean not null default false,
  water_reminder_count        int  not null default 8,
  water_reminder_start_time   time not null default '07:00',
  water_reminder_end_time     time not null default '22:00',
  created_at                  timestamptz not null default now()
);


-- =============================================================================
-- foods — banco compartilhado entre os 2 perfis
-- reference_quantity é a quantidade-base pra normalizar macros.
-- =============================================================================
create table public.foods (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  measure_type        text not null check (measure_type in ('g', 'ml', 'unit')),
  reference_quantity  numeric not null check (reference_quantity > 0),
  kcal                numeric not null default 0 check (kcal       >= 0),
  carb_g              numeric not null default 0 check (carb_g     >= 0),
  protein_g           numeric not null default 0 check (protein_g  >= 0),
  fat_g               numeric not null default 0 check (fat_g      >= 0),
  created_at          timestamptz not null default now()
);

create index foods_name_lower_idx on public.foods (lower(name));


-- =============================================================================
-- meal_templates — 1 registro por refeição por dia da semana
-- day_of_week: 0=domingo, 1=segunda, ..., 6=sábado
-- =============================================================================
create table public.meal_templates (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  day_of_week  int  not null check (day_of_week between 0 and 6),
  name         text not null,
  time         time,                                     -- horário opcional
  notify       boolean not null default true,            -- v2 de notificações
  order_index  int  not null default 0,
  created_at   timestamptz not null default now()
);

create index meal_templates_profile_day_idx
  on public.meal_templates (profile_id, day_of_week, order_index);
create index meal_templates_name_idx
  on public.meal_templates (profile_id, lower(name));


-- =============================================================================
-- meal_template_items — alimentos dentro de cada refeição
-- =============================================================================
create table public.meal_template_items (
  id                uuid primary key default gen_random_uuid(),
  meal_template_id  uuid not null references public.meal_templates(id) on delete cascade,
  food_id           uuid not null references public.foods(id)          on delete cascade,
  quantity          numeric not null check (quantity > 0),
  order_index       int not null default 0
);

create index meal_template_items_template_idx
  on public.meal_template_items (meal_template_id, order_index);


-- =============================================================================
-- meal_item_completions — "marquei esse alimento hoje"
-- Refeição "completa" = todos os itens dela marcados no mesmo dia.
-- =============================================================================
create table public.meal_item_completions (
  id                       uuid primary key default gen_random_uuid(),
  profile_id               uuid not null references public.profiles(id)              on delete cascade,
  meal_template_item_id    uuid not null references public.meal_template_items(id)   on delete cascade,
  date                     date not null,
  completed_at             timestamptz not null default now(),
  unique (profile_id, meal_template_item_id, date)
);

create index meal_item_completions_profile_date_idx
  on public.meal_item_completions (profile_id, date);


-- =============================================================================
-- water_logs — cada copo/dose registrada
-- =============================================================================
create table public.water_logs (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  date         date not null,
  amount_ml    int  not null check (amount_ml > 0),
  logged_at    timestamptz not null default now()
);

create index water_logs_profile_date_idx
  on public.water_logs (profile_id, date);


-- =============================================================================
-- RLS — só `authenticated` entra.
-- =============================================================================
alter table public.profiles                enable row level security;
alter table public.foods                   enable row level security;
alter table public.meal_templates          enable row level security;
alter table public.meal_template_items     enable row level security;
alter table public.meal_item_completions   enable row level security;
alter table public.water_logs              enable row level security;

create policy "authenticated_full_access" on public.profiles
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on public.foods
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on public.meal_templates
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on public.meal_template_items
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on public.meal_item_completions
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on public.water_logs
  for all to authenticated using (true) with check (true);


-- =============================================================================
-- Seeds — os 2 perfis. Banco de alimentos começa vazio.
-- =============================================================================
insert into public.profiles
  (name, color, daily_kcal_goal, daily_carb_g_goal, daily_protein_g_goal,
   daily_fat_g_goal, daily_water_ml_goal)
values
  ('Você', '#a78bfa', 2400, 300, 180, 80, 3000),
  ('Ela',  '#f472b6', 1800, 220, 120, 60, 2500);
