"use client"

import { ArrowBigUp, Delete } from "lucide-react"
import { type ReactNode, useCallback, useState } from "react"

import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

const ROW1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
const ROW2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
const ROW3 = ["z", "x", "c", "v", "b", "n", "m"]
const ACCENTS = ["á", "â", "ã", "é", "ê", "í", "ó", "ô", "ú", "ç"]

type ShiftState = "off" | "on" | "lock"

/**
 * Teclado alfabético in-app — evita teclado nativo iOS em sheets.
 * Layout QWERTY-pt: 3 linhas + linha de acentos + shift/backspace + espaço.
 */
export function AlphaKeypad({
  value,
  onChange,
  maxLength = 80,
}: {
  value: string
  onChange: (v: string) => void
  maxLength?: number
}) {
  const [shift, setShift] = useState<ShiftState>(
    value.length === 0 ? "on" : "off",
  )

  const press = useCallback(
    (k: string) => {
      haptic(3)
      if (k === "backspace") {
        onChange(value.slice(0, -1))
        if (value.length <= 1) setShift("on")
        return
      }
      if (k === "space") {
        if (value.length >= maxLength) return
        onChange(value + " ")
        setShift("on")
        return
      }
      if (k === "shift") {
        setShift((s) => (s === "off" ? "on" : s === "on" ? "lock" : "off"))
        return
      }
      if (value.length >= maxLength) return
      const letter = shift !== "off" ? k.toUpperCase() : k
      onChange(value + letter)
      if (shift === "on") setShift("off")
    },
    [value, onChange, maxLength, shift],
  )

  return (
    <div
      className="flex flex-col gap-1.5"
      role="group"
      aria-label="Teclado alfabético"
    >
      {/* Row 1 — 10 keys */}
      <div className="flex gap-1">
        {ROW1.map((k) => (
          <LetterKey key={k} k={k} onPress={press} shift={shift} />
        ))}
      </div>
      {/* Row 2 — 9 keys (offset) */}
      <div className="flex gap-1 px-[5%]">
        {ROW2.map((k) => (
          <LetterKey key={k} k={k} onPress={press} shift={shift} />
        ))}
      </div>
      {/* Row 3 — shift + 7 + backspace */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => press("shift")}
          aria-pressed={shift !== "off"}
          aria-label="Caixa alta"
          className={cn(
            "flex h-10 items-center justify-center rounded-lg border border-border text-base font-medium",
            "active:scale-[0.97] transition-transform",
            shift === "lock"
              ? "bg-primary text-primary-foreground"
              : shift === "on"
                ? "bg-muted"
                : "bg-card",
          )}
          style={{ flex: 1.5 }}
        >
          <ArrowBigUp
            className="size-5"
            fill={shift !== "off" ? "currentColor" : "none"}
          />
        </button>
        {ROW3.map((k) => (
          <LetterKey key={k} k={k} onPress={press} shift={shift} />
        ))}
        <button
          type="button"
          onClick={() => press("backspace")}
          aria-label="Apagar"
          disabled={value.length === 0}
          className={cn(
            "bg-card flex h-10 items-center justify-center rounded-lg border border-border",
            "active:scale-[0.97] active:bg-muted transition-transform",
            "disabled:opacity-30",
          )}
          style={{ flex: 1.5 }}
        >
          <Delete className="size-5" />
        </button>
      </div>
      {/* Acentos PT-BR */}
      <div className="flex gap-1">
        {ACCENTS.map((a) => (
          <LetterKey key={a} k={a} onPress={press} shift={shift} accent />
        ))}
      </div>
      {/* Space */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => press("space")}
          aria-label="Espaço"
          className={cn(
            "bg-card flex h-10 flex-1 items-center justify-center rounded-lg border border-border text-base font-medium",
            "active:scale-[0.97] active:bg-muted transition-transform",
          )}
        >
          espaço
        </button>
      </div>
    </div>
  )
}

function LetterKey({
  k,
  onPress,
  shift,
  accent,
}: {
  k: string
  onPress: (k: string) => void
  shift: ShiftState
  accent?: boolean
}): ReactNode {
  return (
    <button
      type="button"
      onClick={() => onPress(k)}
      className={cn(
        "flex h-10 items-center justify-center rounded-lg border border-border text-base font-medium",
        "active:scale-[0.97] active:bg-muted transition-transform",
        accent ? "bg-muted/40" : "bg-card",
      )}
      style={{ flex: 1 }}
    >
      {shift !== "off" ? k.toUpperCase() : k}
    </button>
  )
}
