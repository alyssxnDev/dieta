"use client"

import { Loader2, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { FoodPickerSheet } from "@/components/meals/food-picker-sheet"
import { MealItemQtySheet } from "@/components/meals/meal-item-qty-sheet"
import { Button } from "@/components/ui/button"
import { ConfirmSheet } from "@/components/ui/confirm-sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { mealTotals, normalizeFoodItem, r } from "@/lib/calculations/macros"
import { dayName } from "@/lib/date"
import {
  useAddMealItem,
  useDeleteFoodFromAllMeals,
  useDeleteMealItem,
  useDeleteMealTemplate,
  useUpdateMealItem,
  useUpdateMealTemplate,
} from "@/lib/queries/meals"
import type {
  Food,
  MealTemplateItem,
  MealTemplateWithItems,
} from "@/types/database"

const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

const timeToHHMM = (t: string | null): string => (t ? t.slice(0, 5) : "")
const HHMMtoPostgres = (t: string): string | null =>
  /^\d{2}:\d{2}$/.test(t) ? `${t}:00` : null

// Use key={meal.id} no parent — quando trocar de refeição, remonta e os
// useStates pegam valores frescos.
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
  const delFromAll = useDeleteFoodFromAllMeals()

  const [name, setName] = useState(meal.name)
  const [time, setTime] = useState(timeToHHMM(meal.time))
  const [notify, setNotify] = useState(meal.notify)
  const [savingMeta, setSavingMeta] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [deletingMeal, setDeletingMeal] = useState(false)

  const editingItem = useMemo<
    (MealTemplateItem & { food: Food }) | null
  >(
    () =>
      editingItemId
        ? (meal.items.find((it) => it.id === editingItemId) ?? null)
        : null,
    [editingItemId, meal.items],
  )
  const deletingItem = useMemo<
    (MealTemplateItem & { food: Food }) | null
  >(
    () =>
      deletingItemId
        ? (meal.items.find((it) => it.id === deletingItemId) ?? null)
        : null,
    [deletingItemId, meal.items],
  )

  const totals = mealTotals(meal.items)
  const pgTime = time ? HHMMtoPostgres(time) : null
  const dirty =
    name.trim() !== meal.name || pgTime !== meal.time || notify !== meal.notify

  const saveMeta = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return setError("Nome é obrigatório")
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

  const removeItemOnlyHere = async () => {
    if (!deletingItem) return
    await delItem.mutateAsync({
      id: deletingItem.id,
      profileId: meal.profile_id,
    })
    setDeletingItemId(null)
  }

  const removeItemEverywhere = async () => {
    if (!deletingItem) return
    await delFromAll.mutateAsync({
      profileId: meal.profile_id,
      foodId: deletingItem.food.id,
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
          className="flex h-[92dvh] flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>
              Editar refeição · {dayName(meal.day_of_week, true)}
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content com pb-sheet-footer no fim */}
          <div className="pb-sheet-footer flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md-name">Nome</Label>
              <Input
                id="md-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoCapitalize="sentences"
                autoComplete="off"
                enterKeyHint="done"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md-time">Horário</Label>
              <Input
                id="md-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            {/* Notify discreto, sem border pesada */}
            <label
              htmlFor="md-notify"
              className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
            >
              <span className="text-sm">Notificar</span>
              <Switch
                id="md-notify"
                checked={notify}
                onCheckedChange={setNotify}
              />
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
            <div className="border-border flex flex-col gap-2 border-t pt-3">
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
                          <span className="truncate text-sm">
                            {it.food.name}
                          </span>
                          <span className="text-muted-foreground tabular-nums text-xs">
                            {r(it.quantity)}
                            {UNIT_LABEL[it.food.measure_type]} ·{" "}
                            {r(macros.kcal)} kcal
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

      {/* Multi-action delete: só desta refeição vs de TODAS as refeições */}
      <DeleteItemSheet
        open={!!deletingItem}
        onOpenChange={(o) => !o && setDeletingItemId(null)}
        foodName={deletingItem?.food.name ?? ""}
        onlyHerePending={delItem.isPending}
        everywherePending={delFromAll.isPending}
        onOnlyHere={removeItemOnlyHere}
        onEverywhere={removeItemEverywhere}
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

function DeleteItemSheet({
  open,
  onOpenChange,
  foodName,
  onlyHerePending,
  everywherePending,
  onOnlyHere,
  onEverywhere,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  foodName: string
  onlyHerePending: boolean
  everywherePending: boolean
  onOnlyHere: () => void
  onEverywhere: () => void
}) {
  const pending = onlyHerePending || everywherePending
  return (
    <Sheet open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <SheetContent
        side="bottom"
        className="flex max-h-[60dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="px-4 py-3">
          <SheetTitle>Excluir {foodName}?</SheetTitle>
          <p className="text-muted-foreground text-xs">
            Escolha onde remover.
          </p>
        </SheetHeader>
        <div className="pb-sheet-footer flex flex-col gap-2 px-4 pt-3">
          <Button
            variant="destructive"
            onClick={onOnlyHere}
            disabled={pending}
            className="w-full"
          >
            {onlyHerePending && <Loader2 className="animate-spin" />}
            Só desta refeição
          </Button>
          <Button
            variant="destructive"
            onClick={onEverywhere}
            disabled={pending}
            className="w-full"
          >
            {everywherePending && <Loader2 className="animate-spin" />}
            De todas as refeições com este alimento
          </Button>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
