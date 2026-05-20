"use client"

import { CalendarPlus, Plus } from "lucide-react"
import { useState } from "react"

import { DayTabs } from "@/components/meals/day-tabs"
import { MealCardPlanner } from "@/components/meals/meal-card-planner"
import { MealDetailSheet } from "@/components/meals/meal-detail-sheet"
import { MealFormSheet } from "@/components/meals/meal-form-sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dayTotals } from "@/lib/calculations/macros"
import { r } from "@/lib/calculations/macros"
import { dayName, today } from "@/lib/date"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"
import { useMealTemplatesByDay } from "@/lib/queries/meals"
import type { MealTemplateWithItems } from "@/types/database"

export default function PlannerPage() {
  const { active } = useActiveProfile()
  const [selectedDay, setSelectedDay] = useState<number>(today().getDay())
  const { data: meals, isLoading } = useMealTemplatesByDay(
    active?.id ?? null,
    selectedDay,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<MealTemplateWithItems | null>(
    null,
  )

  const totals = dayTotals(meals ?? [])

  return (
    <main className="flex flex-1 flex-col gap-3 pb-4">
      <header className="px-4">
        <h1 className="text-2xl font-semibold tracking-tight">Planner</h1>
        <p className="text-muted-foreground text-xs">
          Toque num dia pra ver e editar. Toca em uma refeição pra editar só ela.
        </p>
      </header>

      <DayTabs selected={selectedDay} onSelect={setSelectedDay} accent={active?.color} />

      <section className="px-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">{dayName(selectedDay, true)}</h2>
          <span className="text-muted-foreground tabular-nums text-xs">
            {r(totals.planned.kcal)} kcal · C {r(totals.planned.carb_g)}g · P{" "}
            {r(totals.planned.protein_g)}g · G {r(totals.planned.fat_g)}g
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (meals ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="bg-card flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800">
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
                <MealCardPlanner meal={m} onClick={() => setEditingMeal(m)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FAB */}
      <Button
        size="icon-lg"
        onClick={() => setFormOpen(true)}
        className="pb-safe fixed right-4 bottom-20 z-30 size-14 rounded-full shadow-lg"
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
          defaultDay={selectedDay}
        />
      )}
      {editingMeal && (
        <MealDetailSheet
          key={editingMeal.id}
          open
          onOpenChange={(o) => !o && setEditingMeal(null)}
          meal={editingMeal}
        />
      )}
    </main>
  )
}
