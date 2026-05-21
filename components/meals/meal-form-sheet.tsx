"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { dayName } from "@/lib/date"
import { useCreateMealTemplates } from "@/lib/queries/meals"
import { cn } from "@/lib/utils"

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

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
  const [name, setName] = useState("")
  const [time, setTime] = useState("") // HH:mm string do <input type="time">
  const [notify, setNotify] = useState(true)
  const [days, setDays] = useState<number[]>([...ALL_DAYS])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on open
    setError(null)
    setName("")
    setTime("")
    setNotify(true)
    setDays([...ALL_DAYS])
  }, [open])

  const allSelected = days.length === 7
  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    )
  const toggleAll = () => setDays(allSelected ? [] : [...ALL_DAYS])

  const onSave = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return setError("Nome é obrigatório")
    if (days.length === 0) return setError("Escolha pelo menos 1 dia")

    setSubmitting(true)
    try {
      await create.mutateAsync(
        days.map((day_of_week) => ({
          profile_id: profileId,
          day_of_week,
          name: trimmed,
          time: time ? `${time}:00` : null,
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
        className="flex h-[92dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle>Nova refeição</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mf-name">Nome</Label>
            <Input
              id="mf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Café da manhã"
              autoCapitalize="sentences"
              autoComplete="off"
              enterKeyHint="next"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mf-time">Horário (opcional)</Label>
            <Input
              id="mf-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <span className="text-sm">Notificar</span>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Dias</Label>
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

        <div className="pb-sheet-footer flex gap-2 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur">
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
