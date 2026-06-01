// Types do schema do Supabase (Step 2).
// Escritos à mão pra evitar dependência do supabase CLI — manter em sync com
// sql/schema.sql se mudar o schema.

export type MeasureType = "g" | "ml" | "unit"

// Categoria do macro dominante — usada na substituição automática.
// Trocar um alimento só lista outros da MESMA categoria, igualando o macro:
// carbo→carboidrato, proteina→proteína, gordura→gordura, livre→por peso (verduras).
export type FoodCategory = "carbo" | "proteina" | "gordura" | "livre"

export interface Profile {
  id: string
  name: string
  color: string
  daily_kcal_goal: number
  daily_carb_g_goal: number
  daily_protein_g_goal: number
  daily_fat_g_goal: number
  daily_water_ml_goal: number
  water_reminder_enabled: boolean
  water_reminder_count: number
  water_reminder_start_time: string // HH:MM:SS
  water_reminder_end_time: string
  created_at: string
}

export interface Food {
  id: string
  name: string
  measure_type: MeasureType
  reference_quantity: number
  kcal: number
  carb_g: number
  protein_g: number
  fat_g: number
  category: FoodCategory | null
  created_at: string
}

export interface MealTemplate {
  id: string
  profile_id: string
  day_of_week: number // 0–6 (0=domingo)
  name: string
  time: string | null // HH:MM:SS ou null
  notify: boolean
  order_index: number
  created_at: string
}

export interface MealTemplateItem {
  id: string
  meal_template_id: string
  food_id: string
  quantity: number
  order_index: number
}

/** Substituiu MealCompletion. Agora marcamos por ITEM (banana, aveia, etc).
 *  Refeição "completa" = todos seus items marcados no dia. */
export interface MealItemCompletion {
  id: string
  profile_id: string
  meal_template_item_id: string
  date: string // YYYY-MM-DD
  completed_at: string
}

/** Troca de um item por um substituto, só naquele dia (Hoje). */
export interface MealItemOverride {
  id: string
  profile_id: string
  meal_template_item_id: string
  date: string // YYYY-MM-DD
  substitute_food_id: string
  quantity: number
  created_at: string
  food: Food // join do alimento substituto
}

export interface WaterLog {
  id: string
  profile_id: string
  date: string // YYYY-MM-DD
  amount_ml: number
  logged_at: string
}

// Conveniências usadas no client
export interface MealTemplateWithItems extends MealTemplate {
  items: (MealTemplateItem & { food: Food })[]
}

export interface MealTotals {
  kcal: number
  carb_g: number
  protein_g: number
  fat_g: number
}
