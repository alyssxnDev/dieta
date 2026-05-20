"use client"

import { Delete } from "lucide-react"
import { type ReactNode, useCallback } from "react"

import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

/**
 * Keypad numérico próprio do app — evita teclado nativo iOS (que sobrepõe
 * inputs em sheets). Use junto de um "display" controlled pelo parent.
 */
export function NumericKeypad({
  value,
  onChange,
  allowDecimal = true,
  maxLength = 6,
}: {
  value: string
  onChange: (v: string) => void
  allowDecimal?: boolean
  maxLength?: number
}) {
  const tap = useCallback(
    (key: string) => {
      haptic(4)
      if (key === "backspace") {
        return onChange(value.slice(0, -1))
      }
      if (key === ".") {
        if (!allowDecimal) return
        if (value.includes(".")) return
        if (!value) return onChange("0.")
        return onChange(value + ".")
      }
      if (value.length >= maxLength) return
      // Sem zero à esquerda (a não ser que seja "0.")
      if (value === "0") return onChange(key)
      onChange(value + key)
    },
    [value, onChange, allowDecimal, maxLength],
  )

  const keys: Array<{ key: string; label: ReactNode; disabled?: boolean }> = [
    { key: "1", label: "1" },
    { key: "2", label: "2" },
    { key: "3", label: "3" },
    { key: "4", label: "4" },
    { key: "5", label: "5" },
    { key: "6", label: "6" },
    { key: "7", label: "7" },
    { key: "8", label: "8" },
    { key: "9", label: "9" },
    {
      key: ".",
      label: ".",
      disabled: !allowDecimal || value.includes("."),
    },
    { key: "0", label: "0" },
    {
      key: "backspace",
      label: <Delete className="size-5" />,
      disabled: value.length === 0,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado numérico">
      {keys.map((k) => (
        <button
          key={k.key}
          type="button"
          onClick={() => tap(k.key)}
          disabled={k.disabled}
          aria-label={
            k.key === "backspace"
              ? "Apagar"
              : k.key === "."
                ? "Vírgula decimal"
                : k.key
          }
          className={cn(
            "bg-card flex h-12 items-center justify-center rounded-2xl border border-border text-xl font-medium",
            "active:scale-[0.97] active:bg-muted transition-transform",
            "disabled:opacity-30 disabled:active:scale-100",
          )}
        >
          {k.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Display grande pra mostrar o valor sendo digitado pelo NumericKeypad.
 * Use acima do keypad.
 */
export function KeypadDisplay({
  value,
  unit,
  placeholder = "0",
}: {
  value: string
  unit?: string
  placeholder?: string
}) {
  const empty = !value
  return (
    <div className="flex items-baseline justify-center gap-1.5 py-3">
      <span
        className={cn(
          "tabular-nums text-4xl font-semibold",
          empty && "text-muted-foreground/40",
        )}
      >
        {empty ? placeholder : value}
      </span>
      {unit && (
        <span className="text-muted-foreground text-sm font-medium">
          {unit}
        </span>
      )}
    </div>
  )
}
