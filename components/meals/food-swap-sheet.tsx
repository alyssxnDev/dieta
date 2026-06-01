"use client"

import { RotateCcw } from "lucide-react"
import { useMemo } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { equivalentQuantity, normalizeFoodItem, r } from "@/lib/calculations/macros"
import { useFoods } from "@/lib/queries/foods"
import type { Food } from "@/types/database"

const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

const CATEGORY_LABEL = {
  carbo: "carboidrato",
  proteina: "proteína",
  gordura: "gordura",
  livre: "peso",
} as const

/**
 * Troca um item por outro alimento da MESMA categoria, com quantidade
 * equivalente calculada automaticamente (iguala o macro da categoria).
 */
export function FoodSwapSheet({
  open,
  onOpenChange,
  originalFood,
  originalQty,
  currentFoodId,
  hasOverride,
  onPick,
  onClear,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  originalFood: Food
  originalQty: number
  /** id do alimento ativo agora (original ou substituto) */
  currentFoodId: string
  hasOverride: boolean
  onPick: (food: Food, qty: number) => void
  onClear: () => void
}) {
  const { data: foods } = useFoods()
  const category = originalFood.category

  // Candidatos: mesma categoria, exceto o próprio original.
  const candidates = useMemo(() => {
    if (!category) return []
    return (foods ?? [])
      .filter((f) => f.category === category && f.id !== originalFood.id)
      .map((f) => {
        const qty = equivalentQuantity(originalFood, originalQty, f, category)
        const macros = normalizeFoodItem(f, qty)
        return { food: f, qty, kcal: macros.kcal }
      })
      .sort((a, b) => a.food.name.localeCompare(b.food.name, "pt-BR"))
  }, [foods, category, originalFood, originalQty])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[85dvh] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle>Trocar {originalFood.name}</SheetTitle>
          <SheetDescription>
            {category
              ? `Mesma categoria · iguala a ${CATEGORY_LABEL[category]}`
              : "Sem categoria definida"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {/* Voltar ao original */}
          {hasOverride && (
            <button
              type="button"
              onClick={onClear}
              className="hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left"
            >
              <RotateCcw className="text-muted-foreground size-4 shrink-0" />
              <span className="text-sm">
                Voltar ao original ({originalFood.name},{" "}
                {r(originalQty)}
                {UNIT_LABEL[originalFood.measure_type]})
              </span>
            </button>
          )}

          {!category ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Esse alimento não tem categoria. Edite ele na aba Alimentos e
              defina a categoria pra poder trocar.
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Nenhum outro alimento de {CATEGORY_LABEL[category]} cadastrado.
              Cadastra um na aba Alimentos.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {candidates.map(({ food, qty, kcal }) => {
                const active = food.id === currentFoodId
                return (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => onPick(food, qty)}
                      className="hover:bg-muted flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2.5 text-left"
                      aria-pressed={active}
                      style={
                        active ? { backgroundColor: "var(--muted)" } : undefined
                      }
                    >
                      <span className="truncate text-sm">
                        {food.name}
                        {active && (
                          <span className="text-muted-foreground"> · atual</span>
                        )}
                      </span>
                      <span className="text-muted-foreground tabular-nums shrink-0 text-xs">
                        {r(qty)}
                        {UNIT_LABEL[food.measure_type]} · {r(kcal)} kcal
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
