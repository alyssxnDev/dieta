"use client"

import { cn } from "@/lib/utils"

/**
 * "Fake input" pra usar com KeypadFormSheet pattern.
 * Renderiza um card clicável com label + valor. Quando `active` true, fica
 * destacado (parent sabe qual campo o keypad está editando).
 */
export function KeypadField({
  label,
  value,
  placeholder,
  active,
  onClick,
  unit,
}: {
  label: string
  value: string | number | null | undefined
  placeholder?: string
  active: boolean
  onClick: () => void
  unit?: string
}) {
  const display =
    value === "" || value === null || value === undefined ? "" : String(value)
  const empty = !display
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/30",
      )}
      aria-pressed={active}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "tabular-nums truncate text-base",
            empty && "text-muted-foreground/40",
          )}
        >
          {display || placeholder || "—"}
        </span>
        {unit && (
          <span className="text-muted-foreground shrink-0 text-xs">{unit}</span>
        )}
      </div>
    </button>
  )
}
