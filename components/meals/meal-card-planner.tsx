"use client"

import { Clock } from "lucide-react"

import { CategoryDot } from "@/components/foods/category-badge"
import { mealTotals, normalizeFoodItem, r } from "@/lib/calculations/macros"
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
      className="bg-card hover:bg-muted/30 flex w-full flex-col gap-3 rounded-2xl border border-border px-4 py-3 text-left transition-colors"
    >
      {/* Cabeçalho: nome + horário */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate font-medium">{meal.name}</p>
        {time && (
          <span className="text-muted-foreground tabular-nums flex items-center gap-1 text-xs">
            <Clock className="size-3" />
            {time}
          </span>
        )}
      </div>

      {/* Totais — em cima dos itens */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <Stat label="kcal" value={r(totals.kcal)} bold />
        <Stat label="C" value={`${r(totals.carb_g)}g`} />
        <Stat label="P" value={`${r(totals.protein_g)}g`} />
        <Stat label="G" value={`${r(totals.fat_g)}g`} />
      </div>

      {/* Lista de alimentos: nome + qty + kcal inline com pontos */}
      {meal.items.length > 0 ? (
        <ul className="border-border flex flex-col gap-1 border-t pt-2">
          {meal.items.map((it) => {
            const macros = normalizeFoodItem(it.food, it.quantity)
            return (
              <li
                key={it.id}
                className="flex items-center gap-1.5 text-xs leading-snug"
              >
                <CategoryDot category={it.food.category} />
                <span className="text-foreground">{it.food.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {r(it.quantity)}
                  {UNIT_LABEL[it.food.measure_type]}
                  {" · "}
                  {r(macros.kcal)} kcal
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground/60 border-border border-t pt-2 text-xs italic">
          Sem alimentos — toque pra adicionar
        </p>
      )}
    </button>
  )
}

function Stat({
  label,
  value,
  bold,
}: {
  label: string
  value: string | number
  bold?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[10px] uppercase">
        {label}
      </span>
      <span className={`tabular-nums text-sm ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  )
}
