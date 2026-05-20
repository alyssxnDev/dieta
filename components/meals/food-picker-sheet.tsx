"use client"

import { Loader2, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  KeypadDisplay,
  NumericKeypad,
} from "@/components/ui/numeric-keypad"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
 * Picker em 2 etapas: busca → quantidade (com numpad in-app, sem teclado iOS).
 * Se `replicateContext` passado, oferece toggle "adicionar em todas as
 * refeições com este nome" no passo da quantidade.
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
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Food | null>(null)
  const [qty, setQty] = useState<string>("")
  const [replicateAll, setReplicateAll] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (foods ?? []).filter((f) =>
      q ? f.name.toLowerCase().includes(q) : true,
    )
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }, [foods, query])

  const reset = () => {
    setQuery("")
    setSelected(null)
    setQty("")
    setReplicateAll(false)
  }

  const numericQty = Number(qty.replace(",", "."))
  const validQty = qty && Number.isFinite(numericQty) && numericQty > 0

  const preview = useMemo(() => {
    if (!selected || !validQty) return null
    return normalizeFoodItem(selected, numericQty)
  }, [selected, validQty, numericQty])

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
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {selected ? selected.name : "Adicionar alimento"}
          </SheetTitle>
          <SheetDescription>
            {selected
              ? `Por ${r(selected.reference_quantity)}${UNIT_LABEL[selected.measure_type]}: ${r(selected.kcal)} kcal`
              : "Busca no seu banco e escolhe."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          {!selected ? (
            <>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {filtered.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Nada encontrado.{" "}
                  {(foods ?? []).length === 0 &&
                    "Cadastra alimentos na aba Alimentos primeiro."}
                </p>
              ) : (
                <ul className="flex max-h-[45dvh] flex-col gap-1 overflow-y-auto">
                  {filtered.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(f)}
                        className="hover:bg-muted flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2.5 text-left"
                      >
                        <span className="truncate text-sm">{f.name}</span>
                        <span className="text-muted-foreground tabular-nums shrink-0 text-xs">
                          {r(f.kcal)} kcal / {r(f.reference_quantity)}
                          {UNIT_LABEL[f.measure_type]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              {/* Display numérico do valor atual */}
              <KeypadDisplay
                value={qty}
                unit={UNIT_LABEL[selected.measure_type]}
              />

              {/* Preview do impacto */}
              {preview ? (
                <div className="bg-muted/40 rounded-xl border border-border px-3 py-2 text-center">
                  <p className="tabular-nums text-sm">
                    {r(preview.kcal)} kcal · C {r(preview.carb_g)}g · P{" "}
                    {r(preview.protein_g)}g · G {r(preview.fat_g)}g
                  </p>
                </div>
              ) : (
                <div className="bg-muted/20 rounded-xl border border-dashed border-border px-3 py-2 text-center">
                  <p className="text-muted-foreground text-xs">
                    Digita a quantidade
                  </p>
                </div>
              )}

              {/* Numpad in-app (sem teclado iOS) */}
              <NumericKeypad value={qty} onChange={setQty} />

              {replicateContext && (
                <label className="bg-card flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className="flex flex-col">
                    <span className="text-sm">
                      Em todas as “{replicateContext.mealName}”
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Adiciona em todas as refeições com esse nome (qualquer dia).
                    </span>
                  </span>
                  <Switch
                    checked={replicateAll}
                    onCheckedChange={setReplicateAll}
                  />
                </label>
              )}

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-muted-foreground self-start text-xs underline-offset-2 hover:underline"
              >
                ← Trocar alimento
              </button>
            </>
          )}

          <SheetFooter className="flex-row gap-2 px-0">
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
              disabled={!selected || !validQty || addToAll.isPending}
              className="flex-1"
            >
              {addToAll.isPending && <Loader2 className="animate-spin" />}
              Adicionar
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
