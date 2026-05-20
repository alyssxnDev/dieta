"use client"

import { Copy, Pencil, Trash2 } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  onDuplicate,
  onDelete,
}: {
  food: Food
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-card flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{food.name}</p>
        <p className="text-muted-foreground tabular-nums truncate text-xs">
          {r(food.reference_quantity)}
          {UNIT_LABEL[food.measure_type]} · {r(food.kcal)} kcal · C {r(food.carb_g)}g · P{" "}
          {r(food.protein_g)}g · G {r(food.fat_g)}g
        </p>
      </div>

      <Popover>
        <PopoverTrigger
          className="hover:bg-muted/50 text-muted-foreground flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          aria-label="Ações"
        >
          <Pencil className="size-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44 p-1">
          <button
            type="button"
            onClick={onEdit}
            className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-2 text-sm"
          >
            <Pencil className="size-4" /> Editar
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-2 text-sm"
          >
            <Copy className="size-4" /> Duplicar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="hover:bg-muted text-destructive flex w-full items-center gap-2 rounded px-2 py-2 text-sm"
          >
            <Trash2 className="size-4" /> Excluir
          </button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
