"use client"

import { motion } from "framer-motion"
import { CalendarPlus, Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { DayTabs, getFixedWeek } from "@/components/meals/day-tabs"
import { MealCardPlanner } from "@/components/meals/meal-card-planner"
import { MealDetailSheet } from "@/components/meals/meal-detail-sheet"
import { MealFormSheet } from "@/components/meals/meal-form-sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dayTotals, r } from "@/lib/calculations/macros"
import { dayName, today } from "@/lib/date"
import { haptic } from "@/lib/haptic"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"
import { useMealTemplatesByDay } from "@/lib/queries/meals"

const WEEK = getFixedWeek()

export default function PlannerPage() {
  const { active } = useActiveProfile()
  const [selectedDay, setSelectedDay] = useState<number>(today().getDay())
  const [direction, setDirection] = useState(0)
  const { data: meals, isLoading } = useMealTemplatesByDay(
    active?.id ?? null,
    selectedDay,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editingMealId, setEditingMealId] = useState<string | null>(null)
  const editingMeal = useMemo(() => {
    if (!editingMealId || !meals) return null
    return meals.find((m) => m.id === editingMealId) ?? null
  }, [editingMealId, meals])

  const totals = dayTotals(meals ?? [])

  // Navega pra um dia pelo índice na semana fixa (Seg→Dom), guardando a
  // direção pra animar o slide.
  const goToIndex = (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= WEEK.length) return
    const curIdx = WEEK.indexOf(selectedDay)
    haptic(6)
    setDirection(nextIdx > curIdx ? 1 : -1)
    setSelectedDay(WEEK[nextIdx])
  }

  const selectDay = (d: number) => {
    const curIdx = WEEK.indexOf(selectedDay)
    const nextIdx = WEEK.indexOf(d)
    setDirection(nextIdx > curIdx ? 1 : -1)
    setSelectedDay(d)
  }

  return (
    <main className="flex flex-1 flex-col gap-3 pb-4">
      <header className="px-4">
        <h1 className="text-2xl font-semibold tracking-tight">Planner</h1>
      </header>

      <DayTabs selected={selectedDay} onSelect={selectDay} accent={active?.color} />

      {/* Área deslizável: arrasta pros lados pra trocar de dia */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_e, info) => {
            const threshold = 60
            const curIdx = WEEK.indexOf(selectedDay)
            if (info.offset.x < -threshold) goToIndex(curIdx + 1)
            else if (info.offset.x > threshold) goToIndex(curIdx - 1)
          }}
          className="px-4"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium">{dayName(selectedDay, true)}</h2>
            <span className="text-muted-foreground tabular-nums text-xs">
              {r(totals.planned.kcal)} kcal · C {r(totals.planned.carb_g)}g · P{" "}
              {r(totals.planned.protein_g)}g · G {r(totals.planned.fat_g)}g
            </span>
          </div>

          {/* key={selectedDay} → slide-in ao trocar de dia */}
          <motion.div
            key={selectedDay}
            initial={{ x: direction * 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : (meals ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="bg-card flex h-14 w-14 items-center justify-center rounded-full border border-border">
                  <CalendarPlus className="text-muted-foreground size-6" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Sem refeições neste dia. Cria a primeira.
                </p>
                <Button onClick={() => setFormOpen(true)}>
                  <Plus />
                  Nova refeição
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {(meals ?? []).map((m) => (
                  <li key={m.id}>
                    <MealCardPlanner
                      meal={m}
                      onClick={() => setEditingMealId(m.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* FAB */}
      <Button
        size="icon-lg"
        onClick={() => setFormOpen(true)}
        className="bottom-fab fixed right-4 z-30 size-14 rounded-full shadow-lg"
        aria-label="Nova refeição"
        disabled={!active}
      >
        <Plus />
      </Button>

      {active && (
        <MealFormSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          profileId={active.id}
        />
      )}
      {editingMeal && (
        <MealDetailSheet
          key={editingMeal.id}
          open
          onOpenChange={(o) => !o && setEditingMealId(null)}
          meal={editingMeal}
        />
      )}
    </main>
  )
}
