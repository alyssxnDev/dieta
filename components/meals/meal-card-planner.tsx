"use client"

import { Clock } from "lucide-react"

import { mealTotals, r } from "@/lib/calculations/macros"
import type { MealTemplateWithItems } from "@/types/database"

const UNIT_LABEL = { g: "g", ml: "ml", unit: "un" } as const

export function MealCardPlanner({
  meal,
  onClick,
}: {
  meal: MealTemplateWithItems
  onClick: () => void
}) {
  const totals = mealTotals(meal.items)
  const time = meal.time?.slice(0, 5)

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card hover:border-zinc-700 flex w-full flex-col gap-2 rounded-2xl border border-zinc-800 px-4 py-3 text-left transition-colors"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate font-medium">{meal.name}</p>
        {time && (
          <span className="text-muted-foreground tabular-nums flex items-center gap-1 text-xs">
            <Clock className="size-3" />
            {time}
          </span>
        )}
      </div>
      {meal.items.length > 0 ? (
        <p className="text-muted-foreground line-clamp-2 text-xs">
          {meal.items
            .map(
              (it) =>
                `${it.food.name} ${r(it.quantity)}${UNIT_LABEL[it.food.measure_type]}`,
            )
            .join(" · ")}
        </p>
      ) : (
        <p className="text-muted-foreground/60 text-xs italic">Sem alimentos</p>
      )}
      <p className="text-muted-foreground tabular-nums text-xs">
        {r(totals.kcal)} kcal · C {r(totals.carb_g)}g · P {r(totals.protein_g)}g · G{" "}
        {r(totals.fat_g)}g
      </p>
    </button>
  )
}
