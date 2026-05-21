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
import { r } from "@/lib/calculations/macros"
import { useCreateFood, useUpdateFood } from "@/lib/queries/foods"
import { cn } from "@/lib/utils"
import type { Food, MeasureType } from "@/types/database"

const MEASURES: { value: MeasureType; label: string }[] = [
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "unit", label: "un" },
]

const toNum = (s: string): number => {
  const n = Number(s.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}
const fromNum = (n: number | null | undefined): string =>
  n === null || n === undefined ? "" : String(n)

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on open
    setError(null)
    if (initial) {
      setName(initial.name)
      setMeasure(initial.measure_type)
      setRefQty(fromNum(initial.reference_quantity))
      setCarb(fromNum(initial.carb_g))
      setProt(fromNum(initial.protein_g))
      setFat(fromNum(initial.fat_g))
    } else {
      setName("")
      setMeasure("g")
      setRefQty("100")
      setCarb("")
      setProt("")
      setFat("")
    }
  }, [open, initial])

  const computedKcal = deriveKcal(toNum(carb), toNum(prot), toNum(fat))

  const onSave = async () => {
    setError(null)
    const trimmedName = name.trim()
    const refQtyN = toNum(refQty)
    if (!trimmedName) return setError("Nome é obrigatório")
    if (refQtyN <= 0) return setError("Quantidade base precisa ser maior que 0")

    const payload = {
      name: trimmedName,
      measure_type: measure,
      reference_quantity: refQtyN,
      kcal: computedKcal,
      carb_g: toNum(carb),
      protein_g: toNum(prot),
      fat_g: toNum(fat),
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
        className="flex h-[92dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle>{initial ? "Editar alimento" : "Novo alimento"}</SheetTitle>
        </SheetHeader>

        {/* Scrollable form */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ff-name">Nome</Label>
            <Input
              id="ff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aveia, banana, frango..."
              autoCapitalize="sentences"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="next"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ff-refqty">Quantidade base</Label>
              <Input
                id="ff-refqty"
                type="number"
                inputMode="decimal"
                step="any"
                value={refQty}
                onChange={(e) => setRefQty(e.target.value)}
                enterKeyHint="next"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unidade</Label>
              <div className="flex h-10 gap-1 rounded-md border border-border p-1">
                {MEASURES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMeasure(m.value)}
                    className={cn(
                      "rounded px-2.5 text-xs font-medium transition-colors",
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ff-carb">Carb (g)</Label>
              <Input
                id="ff-carb"
                type="number"
                inputMode="decimal"
                step="any"
                value={carb}
                onChange={(e) => setCarb(e.target.value)}
                enterKeyHint="next"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ff-prot">Prot (g)</Label>
              <Input
                id="ff-prot"
                type="number"
                inputMode="decimal"
                step="any"
                value={prot}
                onChange={(e) => setProt(e.target.value)}
                enterKeyHint="next"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ff-fat">Gord (g)</Label>
              <Input
                id="ff-fat"
                type="number"
                inputMode="decimal"
                step="any"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                enterKeyHint="done"
              />
            </div>
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

        {/* Sticky footer (acima do home indicator) */}
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
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
