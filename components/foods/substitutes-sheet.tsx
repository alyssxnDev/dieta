"use client"

import { Loader2, Plus, X } from "lucide-react"
import { useMemo } from "react"

import { CategoryBadge } from "@/components/foods/category-badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { r } from "@/lib/calculations/macros"
import {
  useAddSubstitute,
  useFoods,
  useFoodSubstitutes,
  useRemoveSubstitute,
} from "@/lib/queries/foods"
import type { Food } from "@/types/database"

const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

/**
 * Gerencia os substitutos de um alimento (simétrico). Só lista candidatos da
 * MESMA categoria (pra equivalência de macro fazer sentido).
 */
export function SubstitutesSheet({
  open,
  onOpenChange,
  food,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  food: Food
}) {
  const { data: foods } = useFoods()
  const { data: subs } = useFoodSubstitutes(open ? food.id : null)
  const add = useAddSubstitute()
  const remove = useRemoveSubstitute()

  const subIds = useMemo(() => new Set((subs ?? []).map((s) => s.id)), [subs])

  // Candidatos pra adicionar: mesma categoria, não é o próprio, ainda não é sub.
  const candidates = useMemo(() => {
    if (!food.category) return []
    return (foods ?? [])
      .filter(
        (f) =>
          f.category === food.category &&
          f.id !== food.id &&
          !subIds.has(f.id),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }, [foods, food, subIds])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[85dvh] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2">
            Substitutos de {food.name}
            <CategoryBadge category={food.category} />
          </SheetTitle>
          <SheetDescription>
            Vínculo é cruzado — adicionar aqui também faz {food.name} virar
            substituto do outro.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!food.category ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Defina a categoria desse alimento primeiro (no lápis) pra poder
              cadastrar substitutos.
            </p>
          ) : (
            <>
              {/* Atuais */}
              <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">
                Substitutos atuais
              </p>
              {(subs ?? []).length === 0 ? (
                <p className="text-muted-foreground mb-4 text-sm">
                  Nenhum ainda. Adicione abaixo.
                </p>
              ) : (
                <ul className="mb-4 flex flex-col gap-1.5">
                  {(subs ?? []).map((s) => (
                    <li
                      key={s.id}
                      className="bg-card flex items-center gap-2 rounded-xl border border-border px-3 py-2"
                    >
                      <span className="flex-1 truncate text-sm">{s.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          remove.mutate({
                            foodId: food.id,
                            substituteFoodId: s.id,
                          })
                        }
                        aria-label={`Remover ${s.name}`}
                        className="text-muted-foreground hover:text-destructive flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Adicionar */}
              <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">
                Adicionar (mesma categoria)
              </p>
              {candidates.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum outro alimento dessa categoria disponível.
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {candidates.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() =>
                          add.mutate({
                            foodId: food.id,
                            substituteFoodId: f.id,
                          })
                        }
                        disabled={add.isPending}
                        className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left"
                      >
                        {add.isPending ? (
                          <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                        ) : (
                          <Plus className="text-muted-foreground size-4 shrink-0" />
                        )}
                        <span className="flex-1 truncate text-sm">{f.name}</span>
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
