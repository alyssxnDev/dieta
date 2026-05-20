"use client"

import { Apple, ChevronLeft, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  KeypadDisplay,
  NumericKeypad,
} from "@/components/ui/numeric-keypad"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { normalizeFoodItem, r } from "@/lib/calculations/macros"
import { useFoods } from "@/lib/queries/foods"
import { useAddMealItemToAllByName } from "@/lib/queries/meals"
import type { Food } from "@/types/database"

const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

/**
 * 2 etapas (lista → quantidade). Sem search (lista é compacta).
 * Sem botão "trocar alimento" — usa chevron no header pra voltar.
 * Se `replicateContext` passado, oferece toggle "em todas as refeições <nome>".
 */
export function FoodPickerSheet({
  open,
  onOpenChange,
  onPicked,
  replicateContext,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  onPicked: (foodId: string, quantity: number) => Promise<void> | void
  replicateContext?: { profileId: string; mealName: string }
}) {
  const { data: foods } = useFoods()
  const addToAll = useAddMealItemToAllByName()
  const [selected, setSelected] = useState<Food | null>(null)
  const [qty, setQty] = useState<string>("")
  const [replicateAll, setReplicateAll] = useState(false)

  const sorted = useMemo(
    () => [...(foods ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [foods],
  )

  const reset = () => {
    setSelected(null)
    setQty("")
    setReplicateAll(false)
  }

  const numericQty = Number(qty.replace(",", "."))
  const validQty = qty && Number.isFinite(numericQty) && numericQty > 0
  const preview = selected && validQty ? normalizeFoodItem(selected, numericQty) : null

  const handleAdd = async () => {
    if (!selected || !validQty) return
    if (replicateAll && replicateContext) {
      await addToAll.mutateAsync({
        profileId: replicateContext.profileId,
        mealName: replicateContext.mealName,
        foodId: selected.id,
        quantity: numericQty,
      })
    } else {
      await onPicked(selected.id, numericQty)
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <SheetContent side="bottom" className="flex max-h-[95dvh] flex-col p-0">
        <SheetHeader className="relative border-b border-border">
          {selected && (
            <button
              type="button"
              onClick={() => {
                setSelected(null)
                setQty("")
              }}
              aria-label="Voltar para lista"
              className="text-muted-foreground hover:text-foreground absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          <SheetTitle className={selected ? "pl-9" : ""}>
            {selected ? selected.name : "Adicionar alimento"}
          </SheetTitle>
        </SheetHeader>

        {!selected ? (
          // ---- Lista de alimentos ----
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Apple className="text-muted-foreground/60 size-8" />
                <p className="text-muted-foreground text-sm">
                  Banco de alimentos vazio.
                </p>
                <p className="text-muted-foreground text-xs">
                  Cadastra alimentos na aba Alimentos.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {sorted.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(f)}
                      className="hover:bg-muted flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2.5 text-left"
                    >
                      <span className="truncate text-sm">{f.name}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0 text-xs">
                        {r(f.kcal)} kcal /{" "}
                        {r(f.reference_quantity)}
                        {UNIT_LABEL[f.measure_type]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // ---- Quantidade ----
          <>
            <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
              <KeypadDisplay
                value={qty}
                unit={UNIT_LABEL[selected.measure_type]}
              />
              {preview ? (
                <div className="bg-muted/40 rounded-xl border border-border px-3 py-2 text-center">
                  <p className="tabular-nums text-sm">
                    {r(preview.kcal)} kcal · C {r(preview.carb_g)}g · P{" "}
                    {r(preview.protein_g)}g · G {r(preview.fat_g)}g
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center text-xs">
                  Digita a quantidade
                </p>
              )}

              {replicateContext && (
                <label className="bg-card flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className="flex flex-col">
                    <span className="text-sm">
                      Em todas as “{replicateContext.mealName}”
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Adiciona em todas as refeições com esse nome.
                    </span>
                  </span>
                  <Switch
                    checked={replicateAll}
                    onCheckedChange={setReplicateAll}
                  />
                </label>
              )}
            </div>

            <div className="border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
              <NumericKeypad value={qty} onChange={setQty} allowDecimal />
            </div>

            <div className="flex gap-2 border-t border-border px-4 py-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset()
                  onOpenChange(false)
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!validQty || addToAll.isPending}
                className="flex-1"
              >
                {addToAll.isPending && <Loader2 className="animate-spin" />}
                Adicionar
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
