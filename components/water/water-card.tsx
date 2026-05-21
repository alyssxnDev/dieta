"use client"

import { Droplet, Plus, Undo2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { computeReminderTimes } from "@/lib/calculations/reminders"
import { haptic } from "@/lib/haptic"
import {
  useAddWaterLog,
  useUndoLastWaterLog,
  useWaterLogs,
} from "@/lib/queries/water"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/database"

const QUICK_AMOUNTS = [200, 300, 500]

export function WaterCard({
  profile,
  date,
}: {
  profile: Profile
  date: string
}) {
  const { data: logs } = useWaterLogs(profile.id, date)
  const add = useAddWaterLog()
  const undo = useUndoLastWaterLog()
  const [customOpen, setCustomOpen] = useState(false)
  const [customMl, setCustomMl] = useState("")

  const total = (logs ?? []).reduce((acc, l) => acc + l.amount_ml, 0)
  const goal = profile.daily_water_ml_goal
  const pct = goal > 0 ? Math.min(100, (total / goal) * 100) : 0
  const hit = total >= goal

  const addAmount = (ml: number) => {
    haptic(8)
    add.mutate({ profileId: profile.id, date, amount_ml: ml })
  }

  const submitCustom = () => {
    const n = Number(customMl)
    if (!Number.isFinite(n) || n <= 0) return
    addAmount(n)
    setCustomMl("")
    setCustomOpen(false)
  }

  const reminders = profile.water_reminder_enabled
    ? computeReminderTimes(
        profile.water_reminder_start_time,
        profile.water_reminder_end_time,
        profile.water_reminder_count,
      )
    : []

  return (
    <>
      <section
        aria-label="Água"
        className="bg-card flex flex-col gap-3 rounded-2xl border border-border p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-sky-500/15">
              <Droplet className="size-4 text-sky-600" />
            </div>
            <span className="font-medium">Água</span>
          </div>
          <span className="tabular-nums text-sm">
            <span className={cn("font-semibold", hit && "text-emerald-600")}>
              {total}
            </span>
            <span className="text-muted-foreground"> / {goal} ml</span>
          </span>
        </div>

        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="h-full bg-sky-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((ml) => (
            <Button
              key={ml}
              variant="secondary"
              size="sm"
              onClick={() => addAmount(ml)}
            >
              +{ml}
            </Button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCustomOpen(true)}
          >
            outro
          </Button>
        </div>

        {(logs ?? []).length > 0 && (
          <button
            type="button"
            onClick={() => {
              haptic(6)
              undo.mutate({ profileId: profile.id, date })
            }}
            className="text-muted-foreground hover:text-foreground self-end flex items-center gap-1 text-xs"
          >
            <Undo2 className="size-3" />
            Desfazer último
          </button>
        )}

        {reminders.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-muted-foreground mb-1.5 text-[10px] uppercase tracking-wide">
              Lembretes (informativo)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {reminders.map((t) => (
                <span
                  key={t}
                  className="bg-muted text-muted-foreground tabular-nums rounded-full px-2 py-0.5 text-[10px]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <Sheet open={customOpen} onOpenChange={setCustomOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[92dvh] flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>Adicionar água</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wc-ml">Quantidade (ml)</Label>
              <Input
                id="wc-ml"
                autoFocus
                type="number"
                inputMode="numeric"
                step="50"
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                placeholder="ml"
                enterKeyHint="done"
                onKeyDown={(e) => e.key === "Enter" && submitCustom()}
              />
            </div>
          </div>
          <div className="pb-sheet-footer flex gap-2 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setCustomMl("")
                setCustomOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={submitCustom}
              disabled={!customMl || Number(customMl) <= 0}
            >
              <Plus />
              Adicionar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
