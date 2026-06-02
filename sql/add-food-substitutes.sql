-- =============================================================================
-- Substitutos por alimento (simétrico) — SEGURO, não apaga nada.
-- Rode UMA vez no SQL Editor.
--
-- Modelo: você cadastra os substitutos NO alimento (ex.: Peito de frango →
-- acém, músculo). O vínculo é simétrico (cruzado): adicionar B em A também
-- faz A virar substituto de B — o app grava as duas direções.
-- No Hoje, a troca mostra só os substitutos cadastrados (não a categoria toda).
-- =============================================================================

create table if not exists public.food_substitutes (
  id                  uuid primary key default gen_random_uuid(),
  food_id             uuid not null references public.foods(id) on delete cascade,
  substitute_food_id  uuid not null references public.foods(id) on delete cascade,
  created_at          timestamptz not null default now(),
  unique (food_id, substitute_food_id),
  check (food_id <> substitute_food_id)
);

create index if not exists food_substitutes_food_idx
  on public.food_substitutes (food_id);

-- RLS
alter table public.food_substitutes enable row level security;
drop policy if exists "authenticated_full_access" on public.food_substitutes;
create policy "authenticated_full_access" on public.food_substitutes
  for all to authenticated using (true) with check (true);

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.food_substitutes;
exception when duplicate_object then null;
end $$;
