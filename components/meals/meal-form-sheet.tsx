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
import { Switch } from "@/components/ui/switch"
import { dayName } from "@/lib/date"
import { useCreateMealTemplates } from "@/lib/queries/meals"
import { cn } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(1, "Obrigatório").max(120),
  time: z.string().optional(), // HH:mm
  notify: z.boolean(),
  days: z.array(z.number().min(0).max(6)).min(1, "Escolha pelo menos 1 dia"),
})

type FormData = z.infer<typeof schema>

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

export function MealFormSheet({
  open,
  onOpenChange,
  profileId,
  defaultDay,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  profileId: string
  /** Dia pré-selecionado (o que o usuário tava vendo). */
  defaultDay?: number
}) {
  const create = useCreateMealTemplates()

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
      time: "",
      notify: true,
      days: [0, 1, 2, 3, 4, 5, 6],
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name: "",
      time: "",
      notify: true,
      days: [0, 1, 2, 3, 4, 5, 6],
    })
  }, [open, defaultDay, reset])

  const days = watch("days")
  const notify = watch("notify")
  const allSelected = days.length === 7

  const toggleDay = (d: number) => {
    setValue(
      "days",
      days.includes(d) ? days.filter((x) => x !== d) : [...days, d],
      { shouldDirty: true, shouldValidate: true },
    )
  }

  const toggleAll = () => {
    setValue("days", allSelected ? [] : [...ALL_DAYS], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const onSubmit = async (values: FormData) => {
    await create.mutateAsync(
      values.days.map((day_of_week) => ({
        profile_id: profileId,
        day_of_week,
        name: values.name,
        time: values.time ? `${values.time}:00` : null,
        notify: values.notify,
      })),
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova refeição</SheetTitle>
          <SheetDescription>
            Cria 1 registro por dia escolhido. Cada um pode ser editado depois individualmente.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 pb-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Café da manhã"
              {...register("name")}
              autoCapitalize="sentences"
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="time">Horário (opcional)</Label>
            <Input id="time" type="time" {...register("time")} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <div>
              <p className="text-sm">Notificar</p>
              <p className="text-muted-foreground text-xs">
                Push real ainda não tá ativo (v2). Já salva pra quando ligar.
              </p>
            </div>
            <Switch
              checked={notify}
              onCheckedChange={(v) => setValue("notify", v, { shouldDirty: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Dias</Label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-muted-foreground text-xs underline-offset-2 hover:underline"
              >
                {allSelected ? "Limpar" : "Todos os dias"}
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {ALL_DAYS.map((d) => {
                const selected = days.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "border-border text-muted-foreground",
                    )}
                    aria-pressed={selected}
                  >
                    {dayName(d).slice(0, 1)}
                  </button>
                )
              })}
            </div>
            {errors.days && (
              <p className="text-destructive text-xs">{errors.days.message}</p>
            )}
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
              Criar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
