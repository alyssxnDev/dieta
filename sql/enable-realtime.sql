-- =============================================================================
-- Habilitar Realtime — SEGURO, não apaga nada.
-- Rode isso UMA vez no SQL Editor pra ligar o sync ao vivo entre os celulares.
-- (Só adiciona as tabelas na publication; não toca nos seus dados.)
-- =============================================================================
do $$
begin
  alter publication supabase_realtime add table
    public.profiles,
    public.foods,
    public.meal_templates,
    public.meal_template_items,
    public.meal_item_completions,
    public.water_logs;
exception
  when duplicate_object then null;  -- já estava habilitado, tudo certo
end $$;
