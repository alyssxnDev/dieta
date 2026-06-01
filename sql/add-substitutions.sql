-- =============================================================================
-- Substituições — SEGURO, não apaga nada.
-- Rode UMA vez no SQL Editor. Adiciona:
--   1. coluna `category` em foods (carbo/proteina/gordura/livre)
--   2. backfill da categoria dos alimentos já cadastrados
--   3. tabela meal_item_overrides (a troca do dia no Hoje)
--   4. RLS + realtime da nova tabela
-- =============================================================================

-- 1) Coluna category (idempotente)
alter table public.foods
  add column if not exists category text
  check (category in ('carbo', 'proteina', 'gordura', 'livre'));

-- 2) Backfill — só preenche onde ainda está nulo (não sobrescreve o que você editou)
update public.foods set category = 'carbo'    where category is null and lower(name) in (
  'arroz branco cozido','banana prata','banana caturra','mamão','pão francês',
  'pão de forma (fatia)','batata cozida','aveia','maçã'
);
update public.foods set category = 'proteina' where category is null and lower(name) in (
  'peito de frango cru','peito de frango grelhado','peito de frango desfiado',
  'coxa/sobrecoxa de frango assada','acém cozido','músculo cozido',
  'carne moída (patinho) cozida','iogurte natural sem lactose','ovo'
);
update public.foods set category = 'gordura'  where category is null and lower(name) in (
  'abacate','azeite de oliva'
);
update public.foods set category = 'livre'    where category is null and lower(name) in (
  'alface','tomate'
);

-- 2b) Catch-all: qualquer alimento ainda sem categoria, decide pelos macros.
--     (garante que NENHUM alimento fique sem categoria — inclusive customizados)
update public.foods set category = case
  when reference_quantity > 0 and (kcal / reference_quantity) * 100 < 35 then 'livre'
  when (fat_g * 9) >= (carb_g * 4) and (fat_g * 9) >= (protein_g * 4) then 'gordura'
  when (protein_g * 4) >= (carb_g * 4) then 'proteina'
  else 'carbo'
end
where category is null;

-- 3) Tabela de overrides (troca do dia)
create table if not exists public.meal_item_overrides (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles(id)            on delete cascade,
  meal_template_item_id uuid not null references public.meal_template_items(id) on delete cascade,
  date                  date not null,
  substitute_food_id    uuid not null references public.foods(id)              on delete cascade,
  quantity              numeric not null check (quantity > 0),
  created_at            timestamptz not null default now(),
  unique (profile_id, meal_template_item_id, date)
);

create index if not exists meal_item_overrides_profile_date_idx
  on public.meal_item_overrides (profile_id, date);

-- 4) RLS
alter table public.meal_item_overrides enable row level security;
drop policy if exists "authenticated_full_access" on public.meal_item_overrides;
create policy "authenticated_full_access" on public.meal_item_overrides
  for all to authenticated using (true) with check (true);

-- 5) Realtime
do $$
begin
  alter publication supabase_realtime add table public.meal_item_overrides;
exception when duplicate_object then null;
end $$;
