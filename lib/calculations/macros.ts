import type {
  Food,
  FoodCategory,
  MealTemplateItem,
  MealTemplateWithItems,
  MealTotals,
} from "@/types/database"

const ZERO: MealTotals = { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0 }

/** Substituto efetivo de um item: {food, quantity}, considerando override do dia. */
export type EffectiveItem = { food: Food; quantity: number }

/** Map meal_template_item_id → substituto do dia. */
export type OverrideMap = Map<string, EffectiveItem>

/** Sugere a categoria do alimento pelo macro de maior aporte calórico.
 *  Kcal muito baixo (verdura) → 'livre'. É só sugestão — usuário confirma. */
export function suggestCategory(f: {
  kcal: number
  carb_g: number
  protein_g: number
  fat_g: number
  reference_quantity: number
}): FoodCategory {
  // kcal por 100 unidades de referência (normaliza g/ml/unit)
  const kcalPer100 =
    f.reference_quantity > 0 ? (f.kcal / f.reference_quantity) * 100 : f.kcal
  if (kcalPer100 < 35) return "livre"
  const c = f.carb_g * 4
  const p = f.protein_g * 4
  const g = f.fat_g * 9
  const max = Math.max(c, p, g)
  if (max === g) return "gordura"
  if (max === p) return "proteina"
  return "carbo"
}

/** Quantidade do macro-alvo (da categoria) por 1 unidade de medida do alimento. */
function targetMacroPerUnit(food: Food, category: FoodCategory): number {
  if (food.reference_quantity <= 0) return 0
  const perRef =
    category === "carbo"
      ? food.carb_g
      : category === "proteina"
        ? food.protein_g
        : category === "gordura"
          ? food.fat_g
          : 0
  return perRef / food.reference_quantity
}

/**
 * Calcula a quantidade do substituto que iguala o macro da categoria.
 * Ex.: 120g frango (36g proteína) → carne moída (0.27g prot/g) = 133g.
 * 'livre' (verdura) iguala por peso (mesma quantidade).
 * Arredonda: unidade → inteiro (min 1); g/ml → inteiro.
 */
export function equivalentQuantity(
  original: Food,
  originalQty: number,
  substitute: Food,
  category: FoodCategory,
): number {
  if (category === "livre") {
    return Math.max(1, Math.round(originalQty))
  }
  const targetAmount = targetMacroPerUnit(original, category) * originalQty
  const subPerUnit = targetMacroPerUnit(substitute, category)
  if (subPerUnit <= 0) return Math.max(1, Math.round(originalQty)) // fallback
  const qty = targetAmount / subPerUnit
  return substitute.measure_type === "unit"
    ? Math.max(1, Math.round(qty))
    : Math.max(1, Math.round(qty))
}

/** Escala macros de um alimento pra quantity informada. */
export function normalizeFoodItem(
  food: Food,
  quantity: number,
): MealTotals {
  if (!food.reference_quantity || food.reference_quantity <= 0) return ZERO
  const ratio = quantity / food.reference_quantity
  return {
    kcal: food.kcal * ratio,
    carb_g: food.carb_g * ratio,
    protein_g: food.protein_g * ratio,
    fat_g: food.fat_g * ratio,
  }
}

export function sumTotals(a: MealTotals, b: MealTotals): MealTotals {
  return {
    kcal: a.kcal + b.kcal,
    carb_g: a.carb_g + b.carb_g,
    protein_g: a.protein_g + b.protein_g,
    fat_g: a.fat_g + b.fat_g,
  }
}

/** Resolve o alimento/quantidade efetivos de um item, aplicando override do dia. */
export function effectiveItem(
  item: MealTemplateItem & { food: Food },
  overrides?: OverrideMap,
): EffectiveItem {
  const ov = overrides?.get(item.id)
  return ov ?? { food: item.food, quantity: item.quantity }
}

export function mealTotals(
  items: (MealTemplateItem & { food: Food })[],
  overrides?: OverrideMap,
): MealTotals {
  return items.reduce((acc, item) => {
    const eff = effectiveItem(item, overrides)
    return sumTotals(acc, normalizeFoodItem(eff.food, eff.quantity))
  }, ZERO)
}

/**
 * Planejado: todos os items de todas as refeições.
 * Consumido: só os items cujo ID está em `completedItemIds`.
 * `overrides` (opcional) troca o alimento/quantidade pelo substituto do dia.
 */
export function dayTotals(
  meals: MealTemplateWithItems[],
  completedItemIds?: Set<string>,
  overrides?: OverrideMap,
): { planned: MealTotals; consumed: MealTotals } {
  let planned = ZERO
  let consumed = ZERO
  for (const meal of meals) {
    for (const item of meal.items) {
      const eff = effectiveItem(item, overrides)
      const t = normalizeFoodItem(eff.food, eff.quantity)
      planned = sumTotals(planned, t)
      if (completedItemIds?.has(item.id)) {
        consumed = sumTotals(consumed, t)
      }
    }
  }
  return { planned, consumed }
}

/** Quantos items de uma refeição estão marcados. */
export function mealProgress(
  meal: MealTemplateWithItems,
  completedItemIds: Set<string>,
): { completed: number; total: number; allDone: boolean } {
  const total = meal.items.length
  const completed = meal.items.filter((it) => completedItemIds.has(it.id)).length
  return { completed, total, allDone: total > 0 && completed === total }
}

/** Arredondamento de display (1 casa pra kcal/macros). */
export function r(n: number, places = 0): number {
  const f = Math.pow(10, places)
  return Math.round(n * f) / f
}
