"use client"

import { useMemo, useState } from "react"

import { DaySummary } from "@/components/meals/day-summary"
import { FoodSwapSheet } from "@/components/meals/food-swap-sheet"
import { TodayMealCard } from "@/components/meals/today-meal-card"
import { WaterCard } from "@/components/water/water-card"
import { Skeleton } from "@/components/ui/skeleton"
import { dayTotals, type OverrideMap } from "@/lib/calculations/macros"
import { formatLongDate } from "@/lib/date"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"
import { useToday } from "@/lib/hooks/use-today"
import { useFoodsWithSubstitutes } from "@/lib/queries/foods"
import {
  useClearMealItemOverride,
  useMealItemCompletions,
  useMealItemOverrides,
  useMealTemplatesByDay,
  useSetMealItemOverride,
  useToggleAllMealItems,
  useToggleMealItemCompletion,
} from "@/lib/queries/meals"
import type { Food, MealTemplateItem } from "@/types/database"

type SwapTarget = {
  item: MealTemplateItem & { food: Food }
}

export default function HojePage() {
  const { active, isLoading: profileLoading } = useActiveProfile()
  const { iso: date, date: todayDate, dow } = useToday()

  const { data: meals, isLoading: mealsLoading } = useMealTemplatesByDay(
    active?.id ?? null,
    dow,
  )
  const { data: completions } = useMealItemCompletions(active?.id ?? null, date)
  const { data: overridesData } = useMealItemOverrides(active?.id ?? null, date)
  const { data: foodsWithSubs } = useFoodsWithSubstitutes()
  const toggleItem = useToggleMealItemCompletion()
  const toggleAll = useToggleAllMealItems()
  const setOverride = useSetMealItemOverride()
  const clearOverride = useClearMealItemOverride()

  const [swap, setSwap] = useState<SwapTarget | null>(null)

  const completedItemIds = useMemo(
    () => new Set((completions ?? []).map((c) => c.meal_template_item_id)),
    [completions],
  )

  // Map item_id → {food substituto, quantity} pro dia
  const overrides = useMemo<OverrideMap>(() => {
    const m: OverrideMap = new Map()
    for (const o of overridesData ?? []) {
      m.set(o.meal_template_item_id, { food: o.food, quantity: o.quantity })
    }
    return m
  }, [overridesData])

  const totals = useMemo(
    () => dayTotals(meals ?? [], completedItemIds, overrides),
    [meals, completedItemIds, overrides],
  )

  const swappableFoodIds = useMemo(
    () => new Set(foodsWithSubs ?? []),
    [foodsWithSubs],
  )

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const sortedMeals = useMemo(() => {
    return [...(meals ?? [])].sort((a, b) => {
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
          Nenhum perfil encontrado. Roda o <code>sql/schema.sql</code> no
          Supabase (cria os seeds dos 2 perfis).
        </p>
      </main>
    )
  }

  const swapOverride = swap ? overrides.get(swap.item.id) : undefined

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
      <header>
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {formatLongDate(todayDate).split(",")[0]}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {formatLongDate(todayDate).split(",")[1]?.trim()}
        </h1>
      </header>

      <DaySummary profile={active} consumed={totals.consumed} />

      <WaterCard profile={active} date={date} />

      <section aria-label="Refeições" className="flex flex-col gap-2">
        {mealsLoading ? (
          <>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </>
        ) : sortedMeals.length === 0 ? (
          <p className="text-muted-foreground bg-card rounded-2xl border border-border px-4 py-6 text-center text-sm">
            Sem refeições planejadas pra hoje. Cria no Planner.
          </p>
        ) : (
          sortedMeals.map((m) => {
            const mealMin = m.time
              ? Number(m.time.slice(0, 2)) * 60 + Number(m.time.slice(3, 5))
              : null
            const late = mealMin !== null && nowMin > mealMin
            return (
              <TodayMealCard
                key={m.id}
                meal={m}
                completedItemIds={completedItemIds}
                overrides={overrides}
                swappableFoodIds={swappableFoodIds}
                late={late}
                accentColor={active.color}
                onToggleItem={(itemId, currentlyCompleted) =>
                  toggleItem.mutate({
                    profileId: active.id,
                    mealItemId: itemId,
                    date,
                    currentlyCompleted,
                  })
                }
                onToggleAll={(complete) =>
                  toggleAll.mutate({
                    profileId: active.id,
                    mealItemIds: m.items.map((it) => it.id),
                    date,
                    complete,
                  })
                }
                onSwapItem={(item) => setSwap({ item })}
              />
            )
          })
        )}
      </section>

      {swap && (
        <FoodSwapSheet
          open
          onOpenChange={(o) => !o && setSwap(null)}
          originalFood={swap.item.food}
          originalQty={swap.item.quantity}
          currentFoodId={swapOverride?.food.id ?? swap.item.food.id}
          hasOverride={!!swapOverride}
          onPick={(food, qty) => {
            setOverride.mutate({
              profileId: active.id,
              mealItemId: swap.item.id,
              date,
              substituteFood: food,
              quantity: qty,
            })
            setSwap(null)
          }}
          onClear={() => {
            clearOverride.mutate({
              profileId: active.id,
              mealItemId: swap.item.id,
              date,
            })
            setSwap(null)
          }}
        />
      )}
    </main>
  )
}
