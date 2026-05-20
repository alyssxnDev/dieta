"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCreateFood, useUpdateFood } from "@/lib/queries/foods"
import type { Food, MeasureType } from "@/types/database"

const schema = z.object({
  name: z.string().min(1, "Obrigatório").max(120),
  measure_type: z.enum(["g", "ml", "unit"]),
  reference_quantity: z.number().positive("Maior que 0"),
  kcal: z.number().nonnegative(),
  carb_g: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
})

type FormData = z.infer<typeof schema>

const MEASURES: { value: MeasureType; label: string }[] = [
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "unit", label: "un" },
]

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      measure_type: "g",
      reference_quantity: 100,
      kcal: 0,
      carb_g: 0,
      protein_g: 0,
      fat_g: 0,
    },
  })

  // Sincroniza valores quando trocar de initial / abrir
  useEffect(() => {
    if (!open) return
    reset(
      initial
        ? {
            name: initial.name,
            measure_type: initial.measure_type,
            reference_quantity: initial.reference_quantity,
            kcal: initial.kcal,
            carb_g: initial.carb_g,
            protein_g: initial.protein_g,
            fat_g: initial.fat_g,
          }
        : {
            name: "",
            measure_type: "g",
            reference_quantity: 100,
            kcal: 0,
            carb_g: 0,
            protein_g: 0,
            fat_g: 0,
          },
    )
  }, [open, initial, reset])

  const onSubmit = async (values: FormData) => {
    if (initial) {
      await update.mutateAsync({ id: initial.id, patch: values })
    } else {
      await create.mutateAsync(values)
    }
    onOpenChange(false)
  }

  const measure = watch("measure_type")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initial ? "Editar alimento" : "Novo alimento"}</SheetTitle>
          <SheetDescription>
            Macros por referência — depois cada item da refeição escala pela quantidade.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} autoComplete="off" autoCapitalize="sentences" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="reference_quantity">Quantidade base</Label>
              <Input
                id="reference_quantity"
                type="number"
                inputMode="decimal"
                step="any"
                {...register("reference_quantity", { valueAsNumber: true })}
              />
              {errors.reference_quantity && (
                <p className="text-destructive text-xs">
                  {errors.reference_quantity.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Unidade</Label>
              <div className="flex h-9 overflow-hidden rounded-md border border-input">
                {MEASURES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setValue("measure_type", m.value, { shouldDirty: true })}
                    className={`flex-1 text-xs transition-colors ${
                      measure === m.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="kcal">Kcal</Label>
              <Input id="kcal" type="number" inputMode="decimal" step="any" {...register("kcal", { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="carb_g">Carb (g)</Label>
              <Input id="carb_g" type="number" inputMode="decimal" step="any" {...register("carb_g", { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="protein_g">Proteína (g)</Label>
              <Input id="protein_g" type="number" inputMode="decimal" step="any" {...register("protein_g", { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fat_g">Gordura (g)</Label>
              <Input id="fat_g" type="number" inputMode="decimal" step="any" {...register("fat_g", { valueAsNumber: true })} />
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 px-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="animate-spin" />}
              Salvar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
