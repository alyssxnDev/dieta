"use client"

import { motion } from "framer-motion"
import { Check, Clock } from "lucide-react"

import { mealTotals, r } from "@/lib/calculations/macros"
import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"
import type { MealTemplateWithItems } from "@/types/database"

const UNIT_LABEL = { g: "g", ml: "ml", unit: "un" } as const

export function TodayMealCard({
  meal,
  completed,
  late,
  onToggle,
  accentColor,
}: {
  meal: MealTemplateWithItems
  completed: boolean
  late: boolean
  onToggle: () => void
  accentColor: string
}) {
  const totals = mealTotals(meal.items)
  const time = meal.time?.slice(0, 5)

  return (
    <motion.div
      animate={{ opacity: completed ? 0.55 : 1 }}
      className="bg-card flex items-stretch gap-3 rounded-2xl border border-zinc-800 p-3"
    >
      <button
        type="button"
        onClick={() => {
          haptic(10)
          onToggle()
        }}
        aria-pressed={completed}
        aria-label={completed ? "Desmarcar refeição" : "Marcar refeição"}
        className="flex shrink-0 items-center justify-center self-center"
      >
        <motion.div
          initial={false}
          animate={{ scale: completed ? 1 : 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border-2 transition-colors",
            completed
              ? "border-transparent bg-emerald-500 text-zinc-950"
              : "border-zinc-700",
          )}
        >
          {completed && <Check className="size-5" strokeWidth={3} />}
        </motion.div>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium">{meal.name}</p>
          <div className="flex items-center gap-1.5">
            {late && !completed && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                atrasada
              </span>
            )}
            {time && (
              <span className="text-muted-foreground tabular-nums flex items-center gap-1 text-xs">
                <Clock className="size-3" />
                {time}
              </span>
            )}
          </div>
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
        <p className="text-muted-foreground tabular-nums mt-1 text-xs" style={{ color: completed ? undefined : accentColor }}>
          {r(totals.kcal)} kcal · C {r(totals.carb_g)}g · P {r(totals.protein_g)}g · G{" "}
          {r(totals.fat_g)}g
        </p>
      </div>
    </motion.div>
  )
}
