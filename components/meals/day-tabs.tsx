"use client"

import { motion } from "framer-motion"

import { dayName, today } from "@/lib/date"
import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

/** Ordem padrão Seg→Dom (semana brasileira), fixa — não rotaciona pelo dia atual. */
const FIXED_WEEK = [1, 2, 3, 4, 5, 6, 0] as const

export function getFixedWeek(): readonly number[] {
  return FIXED_WEEK
}

export function DayTabs({
  selected,
  onSelect,
  accent,
}: {
  selected: number
  onSelect: (dayOfWeek: number) => void
  accent?: string
}) {
  const todayDow = today().getDay()
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FIXED_WEEK.map((d) => {
        const active = d === selected
        const isToday = d === todayDow
        return (
          <button
            key={d}
            type="button"
            onClick={() => {
              if (active) return
              haptic(6)
              onSelect(d)
            }}
            className={cn(
              "relative flex shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-2 text-xs font-medium transition-colors",
              active
                ? "text-foreground border-transparent"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            style={
              active && accent
                ? { backgroundColor: `${accent}22`, borderColor: accent }
                : undefined
            }
            aria-pressed={active}
            aria-label={`Dia ${dayName(d, true)}${isToday ? " (hoje)" : ""}`}
          >
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              {isToday ? "Hoje" : dayName(d)}
            </span>
            <span className="text-sm font-semibold">
              {dayName(d, true).slice(0, 3)}
            </span>
            {isToday && !active && (
              <motion.span
                aria-hidden
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full"
                style={{ backgroundColor: accent ?? "#a78bfa" }}
                layoutId="todayDot"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
