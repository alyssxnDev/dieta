"use client"

import { motion } from "framer-motion"

import { dayName, today } from "@/lib/date"
import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

/** Array de 7 dias começando no dia atual. */
export function getRotatedWeek(): number[] {
  const start = today().getDay()
  return Array.from({ length: 7 }, (_, i) => (start + i) % 7)
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
  const days = getRotatedWeek()
  const todayDow = today().getDay()
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((d, idx) => {
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
                : "border-zinc-800 text-muted-foreground hover:text-foreground",
            )}
            style={active && accent ? { backgroundColor: `${accent}22`, borderColor: accent } : undefined}
            aria-pressed={active}
          >
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              {idx === 0 ? "Hoje" : dayName(d)}
            </span>
            <span className="text-sm font-semibold">{dayName(d, true).slice(0, 3)}</span>
            {isToday && idx !== 0 && (
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
