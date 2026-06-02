-- =============================================================================
-- ⚠️ RESET — APAGA TUDO. Use só se quiser zerar o banco de propósito.
-- =============================================================================
-- Dropa todas as tabelas (e todos os dados). Depois rode sql/schema.sql pra
-- recriar do zero com os 2 perfis seed.
--
-- NÃO rode isso a não ser que você queira MESMO perder alimentos, refeições,
-- registros de água e histórico. Não tem desfazer.
-- =============================================================================

drop table if exists public.food_substitutes cascade;
drop table if exists public.meal_item_overrides cascade;
drop table if exists public.meal_item_completions cascade;
drop table if exists public.meal_completions cascade;  -- tabela legada (v1)
drop table if exists public.water_logs cascade;
drop table if exists public.meal_template_items cascade;
drop table if exists public.meal_templates cascade;
drop table if exists public.foods cascade;
drop table if exists public.profiles cascade;
