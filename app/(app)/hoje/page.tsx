"use client"

import { useMemo } from "react"

import { DaySummary } from "@/components/meals/day-summary"
import { TodayMealCard } from "@/components/meals/today-meal-card"
import { WaterCard } from "@/components/water/water-card"
import { Skeleton } from "@/components/ui/skeleton"
import { dayTotals } from "@/lib/calculations/macros"
import { formatLongDate, today, toIsoDate } from "@/lib/date"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"
import {
  useMealCompletions,
  useMealTemplatesByDay,
  useToggleMealCompletion,
} from "@/lib/queries/meals"

export default function HojePage() {
  const { active, isLoading: profileLoading } = useActiveProfile()
  const date = useMemo(() => toIsoDate(today()), [])
  const dow = today().getDay()

  const { data: meals, isLoading: mealsLoading } = useMealTemplatesByDay(
    active?.id ?? null,
    dow,
  )
  const { data: completions } = useMealCompletions(active?.id ?? null, date)
  const toggle = useToggleMealCompletion()

  const completedIds = useMemo(
    () => new Set((completions ?? []).map((c) => c.meal_template_id)),
    [completions],
  )

  const totals = useMemo(
    () => dayTotals(meals ?? [], completedIds),
    [meals, completedIds],
  )

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const sortedMeals = useMemo(() => {
    return [...(meals ?? [])].sort((a, b) => {
      // sem time vai pro fim, depois ordena por time/order_index
      if (!a.time && !b.time) return a.order_index - b.order_index
      if (!a.time) return 1
      if (!b.time) return -1
      return a.time.localeCompare(b.time)
    })
  }, [meals])

  if (profileLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4">
        <Skeleton className="h-16 w-2/3 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </main>
    )
  }

  if (!active) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhum perfil encontrado. Roda o `sql/schema.sql` no Supabase
          (cria os seeds dos 2 perfis).
        </p>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
      <header>
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {formatLongDate(today()).split(",")[0]}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {formatLongDate(today()).split(",")[1]?.trim()}
        </h1>
      </header>

      <DaySummary profile={active} consumed={totals.consumed} planned={totals.planned} />

      <section aria-label="Refeições" className="flex flex-col gap-2">
        {mealsLoading ? (
          <>
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </>
        ) : sortedMeals.length === 0 ? (
          <p className="text-muted-foreground bg-card rounded-2xl border border-zinc-800 px-4 py-6 text-center text-sm">
            Sem refeições planejadas pra hoje. Cria no Planner.
          </p>
        ) : (
          sortedMeals.map((m) => {
            const completed = completedIds.has(m.id)
            const mealMin = m.time
              ? Number(m.time.slice(0, 2)) * 60 + Number(m.time.slice(3, 5))
              : null
            const late = mealMin !== null && nowMin > mealMin
            return (
              <TodayMealCard
                key={m.id}
                meal={m}
                completed={completed}
                late={late}
                accentColor={active.color}
                onToggle={() =>
                  toggle.mutate({
                    profileId: active.id,
                    mealId: m.id,
                    date,
                    currentlyCompleted: completed,
                  })
                }
              />
            )
          })
        )}
      </section>

      <WaterCard profile={active} date={date} />
    </main>
  )
}
