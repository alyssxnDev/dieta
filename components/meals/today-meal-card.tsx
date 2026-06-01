"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown, Clock } from "lucide-react"
import { useState } from "react"

import { normalizeFoodItem, r } from "@/lib/calculations/macros"
import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"
import type { MealTemplateWithItems } from "@/types/database"

const UNIT_LABEL = { g: "g", ml: "ml", unit: "un" } as const

export function TodayMealCard({
  meal,
  completedItemIds,
  late,
  accentColor,
  onToggleItem,
  onToggleAll,
}: {
  meal: MealTemplateWithItems
  completedItemIds: Set<string>
  late: boolean
  accentColor: string
  onToggleItem: (itemId: string, currentlyCompleted: boolean) => void
  onToggleAll: (complete: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const total = meal.items.length
  const completed = meal.items.filter((it) => completedItemIds.has(it.id)).length
  const allDone = total > 0 && completed === total
  const partial = completed > 0 && !allDone
  const consumed = meal.items
    .filter((it) => completedItemIds.has(it.id))
    .reduce((acc, it) => acc + normalizeFoodItem(it.food, it.quantity).kcal, 0)
  const time = meal.time?.slice(0, 5)

  const toggleExpand = () => {
    haptic(6)
    setExpanded((v) => !v)
  }

  // Badge toca → marca/desmarca a refeição inteira, direto (sem confirmação).
  const toggleWholeMeal = () => {
    if (total === 0) return
    haptic(12)
    onToggleAll(!allDone)
  }

  return (
    <motion.div
      animate={{ opacity: allDone ? 0.7 : 1 }}
      className="bg-card flex flex-col overflow-hidden rounded-2xl border border-border"
    >
      <div className="flex items-center gap-3 py-3 pr-2 pl-3">
        {/* Badge = toggle da refeição inteira */}
        <button
          type="button"
          onClick={toggleWholeMeal}
          disabled={total === 0}
          aria-label={
            allDone ? "Desmarcar refeição inteira" : "Marcar refeição inteira"
          }
          className="shrink-0 transition-transform active:scale-90 disabled:opacity-50"
        >
          <StatusBadge
            allDone={allDone}
            partial={partial}
            completed={completed}
            total={total}
            accentColor={accentColor}
          />
        </button>

        {/* Resto = expandir */}
        <button
          type="button"
          onClick={toggleExpand}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-medium">{meal.name}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                {late && !allDone && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700">
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
            <div className="text-muted-foreground tabular-nums flex items-baseline gap-2 text-xs">
              <span>
                <span
                  className={cn("font-medium", allDone && "text-emerald-600")}
                  style={partial && !allDone ? { color: accentColor } : undefined}
                >
                  {completed}/{total}
                </span>{" "}
                {total === 1 ? "item" : "itens"}
              </span>
              {consumed > 0 && <span>· {r(consumed)} kcal</span>}
            </div>
          </div>

          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Items expandidos */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-border border-t">
              {meal.items.length === 0 ? (
                <p className="text-muted-foreground py-3 text-center text-xs">
                  Sem alimentos cadastrados nesta refeição.
                </p>
              ) : (
                <div className="flex flex-col gap-0.5 px-2 py-2">
                  {meal.items.map((it) => {
                    const done = completedItemIds.has(it.id)
                    const macros = normalizeFoodItem(it.food, it.quantity)
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          haptic(8)
                          onToggleItem(it.id, done)
                        }}
                        className="hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
                        aria-pressed={done}
                      >
                        <motion.div
                          initial={false}
                          animate={{ scale: done ? 1 : 0.92 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 18,
                          }}
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            done
                              ? "border-transparent bg-emerald-500 text-zinc-950"
                              : "border-border",
                          )}
                        >
                          {done && <Check className="size-3.5" strokeWidth={3} />}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm",
                              done && "text-muted-foreground line-through",
                            )}
                          >
                            {it.food.name}
                          </p>
                          <p className="text-muted-foreground tabular-nums text-[11px]">
                            {r(it.quantity)}
                            {UNIT_LABEL[it.food.measure_type]} ·{" "}
                            {r(macros.kcal)} kcal
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatusBadge({
  allDone,
  partial,
  completed,
  total,
  accentColor,
}: {
  allDone: boolean
  partial: boolean
  completed: number
  total: number
  accentColor: string
}) {
  if (allDone) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
        <Check className="size-5" strokeWidth={3} />
      </div>
    )
  }
  return (
    <div
      className="flex size-10 items-center justify-center rounded-full border-2"
      style={
        partial
          ? { borderColor: accentColor, color: accentColor }
          : { borderColor: "var(--border)" }
      }
    >
      <span className="tabular-nums text-[11px] font-semibold">
        {completed}/{total}
      </span>
    </div>
  )
}
