"use client"

import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react"

import { CategoryBadge } from "@/components/foods/category-badge"
import { r } from "@/lib/calculations/macros"
import type { Food } from "@/types/database"

const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

export function FoodRow({
  food,
  onEdit,
  onDelete,
  onSubstitutes,
}: {
  food: Food
  onEdit: () => void
  onDelete: () => void
  onSubstitutes: () => void
}) {
  return (
    <div className="bg-card flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{food.name}</p>
          <CategoryBadge category={food.category} />
        </div>
        <p className="text-muted-foreground tabular-nums truncate text-xs">
          {r(food.reference_quantity)}
          {UNIT_LABEL[food.measure_type]} · {r(food.kcal)} kcal · C{" "}
          {r(food.carb_g)}g · P {r(food.protein_g)}g · G {r(food.fat_g)}g
        </p>
      </div>

      <button
        type="button"
        onClick={onSubstitutes}
        aria-label={`Substitutos de ${food.name}`}
        className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
      >
        <ArrowLeftRight className="size-4" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${food.name}`}
        className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Excluir ${food.name}`}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
