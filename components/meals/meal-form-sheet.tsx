"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { AlphaKeypad } from "@/components/ui/alpha-keypad"
import { Button } from "@/components/ui/button"
import { KeypadField } from "@/components/ui/keypad-field"
import { NumericKeypad } from "@/components/ui/numeric-keypad"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { dayName } from "@/lib/date"
import { useCreateMealTemplates } from "@/lib/queries/meals"
import { cn } from "@/lib/utils"

type FieldName = "name" | "time"

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

/** "0730" → "07:30". Limita a 4 dígitos, valida hh<=23 e mm<=59. */
function formatTime(raw: string): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function timeToPostgres(raw: string): string | null {
  const d = raw.replace(/\D/g, "")
  if (d.length !== 4) return null
  const h = parseInt(d.slice(0, 2), 10)
  const m = parseInt(d.slice(2, 4), 10)
  if (h > 23 || m > 59) return null
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
}

function postgresToRaw(t: string | null): string {
  if (!t) return ""
  // "HH:MM:SS" → "HHMM"
  return t.replace(/\D/g, "").slice(0, 4)
}

export function MealFormSheet({
  open,
  onOpenChange,
  profileId,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  profileId: string
}) {
  const create = useCreateMealTemplates()
  const [focused, setFocused] = useState<FieldName>("name")
  const [name, setName] = useState("")
  const [timeRaw, setTimeRaw] = useState("") // "0730"
  const [notify, setNotify] = useState(true)
  const [days, setDays] = useState<number[]>([...ALL_DAYS])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form on open
    setFocused("name")
    setError(null)
    setName("")
    setTimeRaw("")
    setNotify(true)
    setDays([...ALL_DAYS])
  }, [open])

  const allSelected = days.length === 7
  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }
  const toggleAll = () => setDays(allSelected ? [] : [...ALL_DAYS])

  const setTimeFromRaw = (s: string) => {
    // só dígitos, max 4
    setTimeRaw(s.replace(/\D/g, "").slice(0, 4))
  }

  const onSave = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return setError("Nome é obrigatório")
    if (days.length === 0) return setError("Escolha pelo menos 1 dia")
    if (timeRaw && timeToPostgres(timeRaw) === null)
      return setError("Horário inválido (00:00–23:59)")

    setSubmitting(true)
    try {
      await create.mutateAsync(
        days.map((day_of_week) => ({
          profile_id: profileId,
          day_of_week,
          name: trimmed,
          time: timeRaw ? timeToPostgres(timeRaw) : null,
          notify,
        })),
      )
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[95dvh] flex-col p-0"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>Nova refeição</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
          <KeypadField
            label="Nome"
            value={name}
            placeholder="Café da manhã"
            active={focused === "name"}
            onClick={() => setFocused("name")}
          />

          <KeypadField
            label="Horário (opcional)"
            value={formatTime(timeRaw)}
            placeholder="HH:MM"
            active={focused === "time"}
            onClick={() => setFocused("time")}
          />

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
            <span className="text-sm">Notificar</span>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Dias</span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-muted-foreground text-xs underline-offset-2 hover:underline"
              >
                {allSelected ? "Limpar" : "Todos os dias"}
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {ALL_DAYS.map((d) => {
                const sel = days.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium transition-colors",
                      sel
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "border-border text-muted-foreground",
                    )}
                    aria-pressed={sel}
                  >
                    {dayName(d).slice(0, 1)}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="text-destructive text-center text-xs">{error}</p>
          )}
        </div>

        <div className="border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
          {focused === "name" ? (
            <AlphaKeypad value={name} onChange={setName} maxLength={60} />
          ) : (
            <NumericKeypad
              value={timeRaw}
              onChange={setTimeFromRaw}
              allowDecimal={false}
              maxLength={4}
            />
          )}
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={onSave} className="flex-1" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Criar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// Exports utilitários (usados pelo MealDetailSheet)
export { formatTime, postgresToRaw, timeToPostgres }
