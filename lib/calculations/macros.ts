import type {
  Food,
  MealTemplateItem,
  MealTemplateWithItems,
  MealTotals,
} from "@/types/database"

const ZERO: MealTotals = { kcal: 0, carb_g: 0, protein_g: 0, fat_g: 0 }

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

export function mealTotals(
  items: (MealTemplateItem & { food: Food })[],
): MealTotals {
  return items.reduce(
    (acc, item) => sumTotals(acc, normalizeFoodItem(item.food, item.quantity)),
    ZERO,
  )
}

/**
 * Planejado: todos os items de todas as refeições.
 * Consumido: só os items cujo ID está em `completedItemIds`.
 */
export function dayTotals(
  meals: MealTemplateWithItems[],
  completedItemIds?: Set<string>,
): { planned: MealTotals; consumed: MealTotals } {
  let planned = ZERO
  let consumed = ZERO
  for (const meal of meals) {
    for (const item of meal.items) {
      const t = normalizeFoodItem(item.food, item.quantity)
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
