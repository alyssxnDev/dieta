"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

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
import { normalizeFoodItem, r } from "@/lib/calculations/macros"
import type { Food, MealTemplateItem } from "@/types/database"

const UNIT_LABEL: Record<Food["measure_type"], string> = {
  g: "g",
  ml: "ml",
  unit: "un",
}

/** Sub-sheet de edição da quantidade de um item dentro de uma refeição. */
export function MealItemQtySheet({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  item: (MealTemplateItem & { food: Food }) | null
  onSave: (newQty: number) => Promise<void> | void
}) {
  const [qty, setQty] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset numpad value quando o sheet abre/troca item
    if (open && item) setQty(String(item.quantity))
  }, [open, item])

  if (!item) return null

  const numQty = Number(qty.replace(",", "."))
  const valid = qty && Number.isFinite(numQty) && numQty > 0
  const preview = valid ? normalizeFoodItem(item.food, numQty) : null

  const handle = async () => {
    if (!valid) return
    setSaving(true)
    try {
      await onSave(numQty)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh]">
        <SheetHeader>
          <SheetTitle>{item.food.name}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <KeypadDisplay value={qty} unit={UNIT_LABEL[item.food.measure_type]} />
          {preview && (
            <p className="text-muted-foreground tabular-nums text-center text-xs">
              {r(preview.kcal)} kcal · C {r(preview.carb_g)}g · P{" "}
              {r(preview.protein_g)}g · G {r(preview.fat_g)}g
            </p>
          )}
          <NumericKeypad value={qty} onChange={setQty} allowDecimal />
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handle}
              disabled={!valid || saving}
            >
              {saving && <Loader2 className="animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
