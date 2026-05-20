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
import { r } from "@/lib/calculations/macros"
import { useCreateFood, useUpdateFood } from "@/lib/queries/foods"
import { cn } from "@/lib/utils"
import type { Food, MeasureType } from "@/types/database"

type FieldName = "name" | "ref_qty" | "carb" | "prot" | "fat"

const MEASURES: { value: MeasureType; label: string }[] = [
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "unit", label: "un" },
]

const num = (s: string) => {
  const n = Number(s.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

const numStr = (n: number | null | undefined): string =>
  n === null || n === undefined || n === 0 ? "" : String(n)

/** Atwater: kcal = 4·carb + 4·prot + 9·gord */
const deriveKcal = (c: number, p: number, f: number) => 4 * c + 4 * p + 9 * f

export function FoodFormSheet({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  initial?: Food | null
}) {
  const create = useCreateFood()
  const update = useUpdateFood()

  const [focused, setFocused] = useState<FieldName>("name")
  const [name, setName] = useState("")
  const [measure, setMeasure] = useState<MeasureType>("g")
  const [refQty, setRefQty] = useState("")
  const [carb, setCarb] = useState("")
  const [prot, setProt] = useState("")
  const [fat, setFat] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form on open; key prop pattern não cabe aqui pq Sheet faz close animation
    setFocused("name")
    setError(null)
    if (initial) {
      setName(initial.name)
      setMeasure(initial.measure_type)
      setRefQty(numStr(initial.reference_quantity))
      setCarb(numStr(initial.carb_g))
      setProt(numStr(initial.protein_g))
      setFat(numStr(initial.fat_g))
    } else {
      setName("")
      setMeasure("g")
      setRefQty("100")
      setCarb("")
      setProt("")
      setFat("")
    }
  }, [open, initial])

  const computedKcal = deriveKcal(num(carb), num(prot), num(fat))

  const onSave = async () => {
    setError(null)
    const trimmedName = name.trim()
    const refQtyN = num(refQty)
    if (!trimmedName) return setError("Nome é obrigatório")
    if (refQtyN <= 0) return setError("Quantidade base precisa ser maior que 0")

    const payload = {
      name: trimmedName,
      measure_type: measure,
      reference_quantity: refQtyN,
      kcal: computedKcal,
      carb_g: num(carb),
      protein_g: num(prot),
      fat_g: num(fat),
    }
    setSubmitting(true)
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, patch: payload })
      } else {
        await create.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
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
          <SheetTitle>{initial ? "Editar alimento" : "Novo alimento"}</SheetTitle>
        </SheetHeader>

        {/* Form (scrollable) */}
        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3">
          <KeypadField
            label="Nome"
            value={name}
            placeholder="Aveia, banana, frango..."
            active={focused === "name"}
            onClick={() => setFocused("name")}
          />

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <KeypadField
              label="Quantidade base"
              value={refQty}
              placeholder="100"
              active={focused === "ref_qty"}
              onClick={() => setFocused("ref_qty")}
              unit={MEASURES.find((m) => m.value === measure)?.label}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs px-1">Unidade</span>
              <div className="flex h-[58px] gap-1 rounded-xl border border-border p-1">
                {MEASURES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMeasure(m.value)}
                    className={cn(
                      "rounded-lg px-3 text-xs font-medium transition-colors",
                      measure === m.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <KeypadField
              label="Carb"
              value={carb}
              placeholder="0"
              active={focused === "carb"}
              onClick={() => setFocused("carb")}
              unit="g"
            />
            <KeypadField
              label="Prot"
              value={prot}
              placeholder="0"
              active={focused === "prot"}
              onClick={() => setFocused("prot")}
              unit="g"
            />
            <KeypadField
              label="Gord"
              value={fat}
              placeholder="0"
              active={focused === "fat"}
              onClick={() => setFocused("fat")}
              unit="g"
            />
          </div>

          <div className="bg-muted/50 flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <span className="text-sm font-medium">Kcal</span>
            <span className="tabular-nums text-2xl font-bold">
              {r(computedKcal)}
            </span>
          </div>

          {error && (
            <p className="text-destructive text-center text-xs">{error}</p>
          )}
        </div>

        {/* Keypad (sticky bottom) */}
        <div className="border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
          {focused === "name" ? (
            <AlphaKeypad value={name} onChange={setName} />
          ) : (
            <NumericKeypad
              value={
                focused === "ref_qty"
                  ? refQty
                  : focused === "carb"
                    ? carb
                    : focused === "prot"
                      ? prot
                      : fat
              }
              onChange={(v) => {
                if (focused === "ref_qty") setRefQty(v)
                else if (focused === "carb") setCarb(v)
                else if (focused === "prot") setProt(v)
                else if (focused === "fat") setFat(v)
              }}
              allowDecimal
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
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
