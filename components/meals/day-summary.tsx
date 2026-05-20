"use client"

import { r } from "@/lib/calculations/macros"
import { cn } from "@/lib/utils"
import type { MealTotals, Profile } from "@/types/database"

export function DaySummary({
  profile,
  consumed,
  planned,
}: {
  profile: Profile
  consumed: MealTotals
  planned: MealTotals
}) {
  return (
    <section
      aria-label="Resumo do dia"
      className="bg-card flex flex-col gap-3 rounded-2xl border border-border p-4"
    >
      <KcalBar
        consumed={consumed.kcal}
        goal={profile.daily_kcal_goal}
        planned={planned.kcal}
        color={profile.color}
      />

      <div className="grid grid-cols-3 gap-3">
        <MacroBar
          label="Carb"
          consumed={consumed.carb_g}
          goal={profile.daily_carb_g_goal}
          color={profile.color}
        />
        <MacroBar
          label="Prot"
          consumed={consumed.protein_g}
          goal={profile.daily_protein_g_goal}
          color={profile.color}
        />
        <MacroBar
          label="Gord"
          consumed={consumed.fat_g}
          goal={profile.daily_fat_g_goal}
          color={profile.color}
        />
      </div>
    </section>
  )
}

function KcalBar({
  consumed,
  goal,
  planned,
  color,
}: {
  consumed: number
  goal: number
  planned: number
  color: string
}) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0
  const plannedPct = goal > 0 ? Math.min(100, (planned / goal) * 100) : 0
  const over = consumed > goal
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          Kcal
        </span>
        <span className="tabular-nums text-sm">
          <span className={cn("font-semibold", over && "text-destructive")}>
            {r(consumed)}
          </span>
          <span className="text-muted-foreground"> / {r(goal)}</span>
        </span>
      </div>
      <div className="bg-muted relative h-2 overflow-hidden rounded-full">
        {/* Planejado em background (mais opaco) */}
        <div
          className="absolute inset-y-0 left-0 opacity-25"
          style={{ width: `${plannedPct}%`, backgroundColor: color }}
        />
        {/* Consumido por cima */}
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function MacroBar({
  label,
  consumed,
  goal,
  color,
}: {
  label: string
  consumed: number
  goal: number
  color: string
}) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
          {label}
        </span>
        <span className="text-muted-foreground tabular-nums text-[10px]">
          {r(consumed)}/{r(goal)}g
        </span>
      </div>
      <div className="bg-muted h-1 overflow-hidden rounded-full">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
