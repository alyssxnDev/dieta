"use client"

import { useMemo } from "react"

import { AccountCard } from "@/components/painel/account-card"
import { CompletionChart } from "@/components/painel/completion-chart"
import { KcalChart } from "@/components/painel/kcal-chart"
import { ProfileSettingsCard } from "@/components/painel/profile-settings-card"
import { StreakCard } from "@/components/painel/streak-card"
import { Skeleton } from "@/components/ui/skeleton"
import { dayTotals, r } from "@/lib/calculations/macros"
import { mealStreak, waterStreak } from "@/lib/calculations/streaks"
import { dayName, lastNDates, toIsoDate } from "@/lib/date"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"
import {
  useAllMealTemplates,
  useMealCompletionsRange,
} from "@/lib/queries/meals"
import { useWaterLogsRange } from "@/lib/queries/water"

export default function PainelPage() {
  const { active, isLoading: profileLoading } = useActiveProfile()

  // Range pros gráficos e streaks — últimos 14 dias pra streak ter folga.
  const dates14 = useMemo(() => lastNDates(14, true), [])
  const from = toIsoDate(dates14[0])
  const to = toIsoDate(dates14[dates14.length - 1])

  const { data: templates } = useAllMealTemplates(active?.id ?? null)
  const { data: completions } = useMealCompletionsRange(
    active?.id ?? null,
    from,
    to,
  )
  const { data: waterLogs } = useWaterLogsRange(active?.id ?? null, from, to)

  // Agregações
  const todayIso = toIsoDate(new Date())

  /** Pra cada dia, monta { date, kcal_consumido, planned_count, completed_count }. */
  const perDay = useMemo(() => {
    if (!templates) return []
    return dates14.map((d) => {
      const iso = toIsoDate(d)
      const dow = d.getDay()
      const mealsForDay = templates.filter((m) => m.day_of_week === dow)
      const completedForDay = new Set(
        (completions ?? [])
          .filter((c) => c.date === iso)
          .map((c) => c.meal_template_id),
      )
      const totals = dayTotals(mealsForDay, completedForDay)
      return {
        date: iso,
        dow,
        kcal: totals.consumed.kcal,
        planned: mealsForDay.length,
        completed: mealsForDay.filter((m) => completedForDay.has(m.id)).length,
      }
    })
  }, [templates, completions, dates14])

  /** Soma de água por dia. */
  const waterPerDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of waterLogs ?? []) {
      map.set(log.date, (map.get(log.date) ?? 0) + log.amount_ml)
    }
    return dates14.map((d) => ({
      date: toIsoDate(d),
      total_ml: map.get(toIsoDate(d)) ?? 0,
    }))
  }, [waterLogs, dates14])

  // Streaks (não conta hoje)
  const waterStreakCount = active
    ? waterStreak(
        waterPerDay.filter((x) => x.date !== todayIso),
        active.daily_water_ml_goal,
      )
    : 0
  const mealStreakCount = mealStreak(perDay.filter((x) => x.date !== todayIso))

  // Gráficos: últimos 7 dias só
  const last7 = perDay.slice(-7)
  const kcalChartData = last7.map((d) => ({
    label: dayName(d.dow),
    kcal: r(d.kcal),
  }))
  const completionChartData = last7.map((d) => ({
    label: dayName(d.dow),
    pct: d.planned > 0 ? Math.min(100, (d.completed / d.planned) * 100) : 0,
  }))

  if (profileLoading || !active) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-muted-foreground text-xs">
          Streaks contam dias passados consecutivos — hoje não conta pra não
          zerar durante o dia.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StreakCard
          kind="water"
          count={waterStreakCount}
          label="Água em dia"
          accentColor={active.color}
        />
        <StreakCard
          kind="meals"
          count={mealStreakCount}
          label="Refeições em dia"
          accentColor={active.color}
        />
      </div>

      <KcalChart
        data={kcalChartData}
        goal={active.daily_kcal_goal}
        color={active.color}
      />
      <CompletionChart data={completionChartData} color={active.color} />

      <ProfileSettingsCard key={active.id} profile={active} />
      <AccountCard />
    </main>
  )
}
