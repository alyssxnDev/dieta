"use client"

import { Loader2, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { FoodPickerSheet } from "@/components/meals/food-picker-sheet"
import { MealItemQtySheet } from "@/components/meals/meal-item-qty-sheet"
import {
  formatTime,
  postgresToRaw,
  timeToPostgres,
} from "@/components/meals/meal-form-sheet"
import { AlphaKeypad } from "@/components/ui/alpha-keypad"
import { Button } from "@/components/ui/button"
import { ConfirmSheet } from "@/components/ui/confirm-sheet"
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
import { mealTotals, normalizeFoodItem, r } from "@/lib/calculations/macros"
import { dayName } from "@/lib/date"
import {
  useAddMealItem,
  useDeleteMealItem,
  useDeleteMealTemplate,
  useUpdateMealItem,
  useUpdateMealTemplate,
} from "@/lib/queries/meals"
import type { Food, MealTemplateItem, MealTemplateWithItems } from "@/types/database"

type FieldName = "name" | "time"

const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

// Usa key={meal.id} no parent — quando trocar de refeição, remonta e o
// useState pega valores frescos sem useEffect/setState.
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
  const addItem = useAddMealItem()
  const updItem = useUpdateMealItem()
  const delItem = useDeleteMealItem()

  const [focused, setFocused] = useState<FieldName>("name")
  const [name, setName] = useState(meal.name)
  const [timeRaw, setTimeRaw] = useState(postgresToRaw(meal.time))
  const [notify, setNotify] = useState(meal.notify)
  const [savingMeta, setSavingMeta] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  // Guarda só os IDs — derivamos os objetos do cache atual via useMemo, assim
  // qty editor reflete mudanças (e fecha sozinho se item for deletado).
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [deletingMeal, setDeletingMeal] = useState(false)

  const editingItem = useMemo<
    (MealTemplateItem & { food: Food }) | null
  >(
    () =>
      editingItemId
        ? meal.items.find((it) => it.id === editingItemId) ?? null
        : null,
    [editingItemId, meal.items],
  )
  const deletingItem = useMemo<
    (MealTemplateItem & { food: Food }) | null
  >(
    () =>
      deletingItemId
        ? meal.items.find((it) => it.id === deletingItemId) ?? null
        : null,
    [deletingItemId, meal.items],
  )

  const totals = mealTotals(meal.items)
  const pgTime = timeRaw ? timeToPostgres(timeRaw) : null
  const dirty =
    name.trim() !== meal.name ||
    pgTime !== meal.time ||
    notify !== meal.notify

  const saveMeta = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return setError("Nome é obrigatório")
    if (timeRaw && pgTime === null)
      return setError("Horário inválido (00:00–23:59)")
    setSavingMeta(true)
    try {
      await update.mutateAsync({
        id: meal.id,
        profileId: meal.profile_id,
        patch: { name: trimmed, time: pgTime, notify },
      })
    } finally {
      setSavingMeta(false)
    }
  }

  const removeMeal = async () => {
    await del.mutateAsync({ id: meal.id, profileId: meal.profile_id })
    setDeletingMeal(false)
    onOpenChange(false)
  }

  const removeItem = async () => {
    if (!deletingItem) return
    await delItem.mutateAsync({
      id: deletingItem.id,
      profileId: meal.profile_id,
    })
    setDeletingItemId(null)
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

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={async (o) => {
          if (!o && dirty) await saveMeta()
          onOpenChange(o)
        }}
      >
        <SheetContent
          side="bottom"
          className="flex max-h-[95dvh] flex-col p-0"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle>Editar refeição · {dayName(meal.day_of_week, true)}</SheetTitle>
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
              label="Horário"
              value={formatTime(timeRaw)}
              placeholder="HH:MM"
              active={focused === "time"}
              onClick={() => setFocused("time")}
            />

            <label
              htmlFor="meal-notify"
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <span className="text-sm">Notificar</span>
              <Switch id="meal-notify" checked={notify} onCheckedChange={setNotify} />
            </label>

            {dirty && (
              <Button
                onClick={saveMeta}
                variant="secondary"
                size="sm"
                disabled={savingMeta}
              >
                {savingMeta && <Loader2 className="animate-spin" />}
                Salvar alterações
              </Button>
            )}

            {error && (
              <p className="text-destructive text-center text-xs">{error}</p>
            )}

            {/* Items */}
            <div className="border-border border-t pt-3 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">Alimentos</h3>
                <span className="text-muted-foreground tabular-nums text-xs">
                  {r(totals.kcal)} kcal
                </span>
              </div>
              {meal.items.length === 0 ? (
                <p className="text-muted-foreground rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs">
                  Sem alimentos. Adiciona o primeiro.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {meal.items.map((it) => {
                    const macros = normalizeFoodItem(it.food, it.quantity)
                    return (
                      <li
                        key={it.id}
                        className="bg-card flex items-center gap-2 rounded-xl border border-border px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => setEditingItemId(it.id)}
                          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
                        >
                          <span className="truncate text-sm">{it.food.name}</span>
                          <span className="text-muted-foreground tabular-nums text-xs">
                            {r(it.quantity)}
                            {UNIT_LABEL[it.food.measure_type]} · {r(macros.kcal)} kcal
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItemId(it.id)}
                          aria-label={`Excluir ${it.food.name}`}
                          className="text-muted-foreground hover:text-destructive flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              <Button
                onClick={() => setPickerOpen(true)}
                variant="secondary"
                size="sm"
              >
                <Plus />
                Adicionar alimento
              </Button>
            </div>

            <Button
              variant="destructive"
              onClick={() => setDeletingMeal(true)}
              className="mt-1"
            >
              <Trash2 />
              Excluir refeição
            </Button>
          </div>

          {/* Keypad sticky */}
          <div className="border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
            {focused === "name" ? (
              <AlphaKeypad value={name} onChange={setName} maxLength={60} />
            ) : (
              <NumericKeypad
                value={timeRaw}
                onChange={(v) =>
                  setTimeRaw(v.replace(/\D/g, "").slice(0, 4))
                }
                allowDecimal={false}
                maxLength={4}
              />
            )}
          </div>

          <SheetFooter className="border-t border-border px-4 py-3">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FoodPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPicked={handlePicked}
        replicateContext={{ profileId: meal.profile_id, mealName: meal.name }}
      />

      <MealItemQtySheet
        open={!!editingItem}
        onOpenChange={(o) => !o && setEditingItemId(null)}
        item={editingItem}
        onSave={async (q) => {
          if (!editingItem) return
          await updItem.mutateAsync({
            id: editingItem.id,
            profileId: meal.profile_id,
            quantity: q,
          })
        }}
      />

      <ConfirmSheet
        open={!!deletingItem}
        onOpenChange={(o) => !o && setDeletingItemId(null)}
        title={`Excluir ${deletingItem?.food.name ?? "alimento"}?`}
        description={`Remove só desta refeição. Você pode adicionar de novo quando quiser.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={removeItem}
      />

      <ConfirmSheet
        open={deletingMeal}
        onOpenChange={setDeletingMeal}
        title={`Excluir "${meal.name}"?`}
        description={`Remove esta refeição apenas de ${dayName(meal.day_of_week, true)}. Os alimentos cadastrados não são afetados.`}
        confirmLabel="Excluir refeição"
        destructive
        onConfirm={removeMeal}
      />
    </>
  )
}
