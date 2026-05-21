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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on open/item change
    if (open && item) setQty(String(item.quantity))
  }, [open, item])

  if (!item) return null

  const numQty = Number(qty.replace(",", "."))
  const valid = qty !== "" && Number.isFinite(numQty) && numQty > 0
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
      <SheetContent
        side="bottom"
        className="flex max-h-[80dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle>{item.food.name}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mi-qty">
              Quantidade ({UNIT_LABEL[item.food.measure_type]})
            </Label>
            <Input
              id="mi-qty"
              autoFocus
              type="number"
              inputMode="decimal"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              enterKeyHint="done"
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) {
                  e.preventDefault()
                  handle()
                }
              }}
            />
          </div>

          {preview && (
            <p className="text-muted-foreground tabular-nums rounded-xl bg-muted/40 px-3 py-2 text-center text-xs">
              {r(preview.kcal)} kcal · C {r(preview.carb_g)}g · P{" "}
              {r(preview.protein_g)}g · G {r(preview.fat_g)}g
            </p>
          )}
        </div>

        <div className="pb-sheet-footer flex gap-2 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur">
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
      </SheetContent>
    </Sheet>
  )
}
