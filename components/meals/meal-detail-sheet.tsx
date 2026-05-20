"use client"

import { CopyPlus, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { FoodPickerSheet } from "@/components/meals/food-picker-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { mealTotals, normalizeFoodItem, r } from "@/lib/calculations/macros"
import { dayName } from "@/lib/date"
import {
  useAddMealItem,
  useDeleteMealItem,
  useDeleteMealTemplate,
  useReplicateMealToDays,
  useUpdateMealItem,
  useUpdateMealTemplate,
} from "@/lib/queries/meals"
import { cn } from "@/lib/utils"
import type { Food, MealTemplateWithItems } from "@/types/database"

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

// Usa key={meal.id} no parent — quando trocar de refeição, este componente
// remonta e o useState abaixo pega os valores frescos sem useEffect/setState.
export function MealDetailSheet({
  open,
  onOpenChange,
  meal,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  meal: MealTemplateWithItems
}) {
  const update = useUpdateMealTemplate()
  const del = useDeleteMealTemplate()
  const replicate = useReplicateMealToDays()
  const addItem = useAddMealItem()
  const updItem = useUpdateMealItem()
  const delItem = useDeleteMealItem()

  const [name, setName] = useState(meal.name)
  const [time, setTime] = useState(meal.time ? meal.time.slice(0, 5) : "")
  const [notify, setNotify] = useState(meal.notify)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [replicateOpen, setReplicateOpen] = useState(false)
  const [replicateDays, setReplicateDays] = useState<number[]>([])

  const totals = mealTotals(meal.items)
  const dirty =
    name !== meal.name ||
    (time ? `${time}:00` : null) !== meal.time ||
    notify !== meal.notify

  const saveMeta = async () => {
    if (!dirty) return
    await update.mutateAsync({
      id: meal.id,
      profileId: meal.profile_id,
      patch: { name, time: time ? `${time}:00` : null, notify },
    })
  }

  const removeMeal = async () => {
    if (!window.confirm(`Excluir "${meal.name}" deste dia (${dayName(meal.day_of_week, true)})?`))
      return
    await del.mutateAsync({ id: meal.id, profileId: meal.profile_id })
    onOpenChange(false)
  }

  const handlePicked = async (foodId: string, quantity: number) => {
    await addItem.mutateAsync({
      mealId: meal.id,
      profileId: meal.profile_id,
      foodId,
      quantity,
      order_index: meal.items.length,
    })
  }

  const doReplicate = async () => {
    if (replicateDays.length === 0) return
    await replicate.mutateAsync({
      sourceMealId: meal.id,
      profileId: meal.profile_id,
      targetDays: replicateDays,
    })
    setReplicateOpen(false)
    setReplicateDays([])
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={async (o) => {
          if (!o && dirty) await saveMeta()
          onOpenChange(o)
        }}
      >
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar refeição</SheetTitle>
            <SheetDescription>
              Edita só a instância de <strong>{dayName(meal.day_of_week, true)}</strong>.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="meal-name">Nome</Label>
              <Input
                id="meal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoCapitalize="sentences"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="meal-time">Horário</Label>
              <Input
                id="meal-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <label
              htmlFor="meal-notify"
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
            >
              <span className="text-sm">Notificar</span>
              <Switch
                id="meal-notify"
                checked={notify}
                onCheckedChange={setNotify}
              />
            </label>

            {dirty && (
              <Button onClick={saveMeta} variant="secondary" size="sm" disabled={update.isPending}>
                {update.isPending && <Loader2 className="animate-spin" />}
                Salvar alterações
              </Button>
            )}

            {/* Items */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">Alimentos</h3>
                <span className="text-muted-foreground tabular-nums text-xs">
                  {r(totals.kcal)} kcal · C {r(totals.carb_g)}g · P {r(totals.protein_g)}g · G{" "}
                  {r(totals.fat_g)}g
                </span>
              </div>
              {meal.items.length === 0 ? (
                <p className="text-muted-foreground bg-card rounded-xl border border-border px-3 py-4 text-center text-xs">
                  Sem alimentos. Adiciona o primeiro.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {meal.items.map((it) => {
                    const macros = normalizeFoodItem(it.food, it.quantity)
                    return (
                      <li
                        key={it.id}
                        className="bg-card flex items-center gap-2 rounded-xl border border-border px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{it.food.name}</p>
                          <p className="text-muted-foreground tabular-nums text-xs">
                            {r(macros.kcal)} kcal · C {r(macros.carb_g)}g · P {r(macros.protein_g)}g · G{" "}
                            {r(macros.fat_g)}g
                          </p>
                        </div>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          defaultValue={it.quantity}
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (!Number.isFinite(v) || v <= 0 || v === it.quantity) return
                            updItem.mutate({
                              id: it.id,
                              profileId: meal.profile_id,
                              quantity: v,
                            })
                          }}
                          className="h-8 w-16 text-right text-xs tabular-nums"
                          aria-label={`Quantidade de ${it.food.name}`}
                        />
                        <span className="text-muted-foreground w-4 text-xs">
                          {UNIT_LABEL[it.food.measure_type]}
                        </span>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() =>
                            delItem.mutate({ id: it.id, profileId: meal.profile_id })
                          }
                          aria-label="Remover"
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
              <Button onClick={() => setPickerOpen(true)} variant="secondary" size="sm">
                <Plus />
                Adicionar alimento
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setReplicateOpen(true)}>
                <CopyPlus />
                Replicar
              </Button>
              <Button variant="destructive" onClick={removeMeal}>
                <Trash2 />
                Excluir
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <FoodPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPicked={handlePicked}
        replicateContext={{ profileId: meal.profile_id, mealName: meal.name }}
      />

      {/* Replicate sheet */}
      <Sheet open={replicateOpen} onOpenChange={setReplicateOpen}>
        <SheetContent side="bottom" className="max-h-[60dvh]">
          <SheetHeader>
            <SheetTitle>Replicar pra outros dias</SheetTitle>
            <SheetDescription>
              Cria uma cópia (com os mesmos alimentos) nos dias escolhidos.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="grid grid-cols-7 gap-1">
              {ALL_DAYS.filter((d) => d !== meal.day_of_week).map((d) => {
                const sel = replicateDays.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setReplicateDays((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                      )
                    }
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium transition-colors",
                      sel
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {dayName(d).slice(0, 1)}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setReplicateDays([])
                  setReplicateOpen(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={doReplicate}
                disabled={replicateDays.length === 0 || replicate.isPending}
              >
                {replicate.isPending && <Loader2 className="animate-spin" />}
                Replicar ({replicateDays.length})
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
