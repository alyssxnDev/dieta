"use client"

import { Droplet, Flame, type LucideIcon, UtensilsCrossed } from "lucide-react"

import { cn } from "@/lib/utils"

const ICONS = {
  water: Droplet,
  meals: UtensilsCrossed,
} satisfies Record<string, LucideIcon>

export function StreakCard({
  kind,
  count,
  label,
  accentColor,
}: {
  kind: keyof typeof ICONS
  count: number
  label: string
  accentColor: string
}) {
  const Icon = ICONS[kind]
  const active = count > 0
  return (
    <div className="bg-card flex flex-col gap-2 rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </span>
        <Icon
          className={cn("size-4", active ? "" : "text-muted-foreground")}
          style={active ? { color: accentColor } : undefined}
        />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="tabular-nums text-3xl font-bold">{count}</span>
        <span className="text-muted-foreground text-sm">
          {count === 1 ? "dia" : "dias"}
        </span>
        {active && (
          <Flame
            className="ml-auto size-5"
            style={{ color: accentColor }}
            fill={accentColor}
          />
        )}
      </div>
    </div>
  )
}
