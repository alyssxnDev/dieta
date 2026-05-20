"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type {
  Food,
  MealCompletion,
  MealTemplate,
  MealTemplateItem,
  MealTemplateWithItems,
} from "@/types/database"

import { mealKeys } from "./keys"

// ---------- Reads ----------

export function useMealTemplatesByDay(
  profileId: string | null,
  dayOfWeek: number,
) {
  return useQuery({
    enabled: !!profileId,
    queryKey: mealKeys.templatesByDay(profileId ?? "_", dayOfWeek),
    queryFn: async (): Promise<MealTemplateWithItems[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_templates")
        .select(
          `
          id, profile_id, day_of_week, name, time, notify, order_index, created_at,
          items:meal_template_items (
            id, meal_template_id, food_id, quantity, order_index,
            food:foods (
              id, name, measure_type, reference_quantity,
              kcal, carb_g, protein_g, fat_g, created_at
            )
          )
          `,
        )
        .eq("profile_id", profileId)
        .eq("day_of_week", dayOfWeek)
        .order("order_index", { ascending: true })
        .order("time", { ascending: true, nullsFirst: false })
      if (error) throw error
      // Ordena items dentro de cada meal
      return ((data ?? []) as unknown as MealTemplateWithItems[]).map((m) => ({
        ...m,
        items: [...m.items].sort((a, b) => a.order_index - b.order_index),
      }))
    },
  })
}

// ---------- Meal Template (refeição) ----------

type MealTemplateInput = Omit<MealTemplate, "id" | "created_at" | "order_index">

export function useCreateMealTemplates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inputs: MealTemplateInput[]): Promise<MealTemplate[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_templates")
        .insert(inputs)
        .select("*")
      if (error) throw error
      return (data ?? []) as MealTemplate[]
    },
    onSuccess: (_, inputs) => {
      const profileIds = new Set(inputs.map((i) => i.profile_id))
      profileIds.forEach((pid) =>
        qc.invalidateQueries({ queryKey: mealKeys.templates(pid) }),
      )
    },
  })
}

export function useUpdateMealTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      profileId: string
      patch: Partial<Omit<MealTemplate, "id" | "created_at" | "profile_id">>
    }): Promise<MealTemplate> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_templates")
        .update(input.patch)
        .eq("id", input.id)
        .select("*")
        .single()
      if (error) throw error
      return data as MealTemplate
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) })
    },
  })
}

export function useDeleteMealTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; profileId: string }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from("meal_templates")
        .delete()
        .eq("id", input.id)
      if (error) throw error
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) })
    },
  })
}

/** Replica uma refeição existente em N novos dias da semana (gera 1 registro por dia). */
export function useReplicateMealToDays() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      sourceMealId: string
      profileId: string
      targetDays: number[]
    }): Promise<void> => {
      const supabase = createClient()
      // 1. Lê a meal source com items
      const { data: source, error: e1 } = await supabase
        .from("meal_templates")
        .select(
          `id, profile_id, name, time, notify, order_index,
           items:meal_template_items(food_id, quantity, order_index)`,
        )
        .eq("id", input.sourceMealId)
        .single()
      if (e1) throw e1
      const src = source as unknown as MealTemplate & {
        items: { food_id: string; quantity: number; order_index: number }[]
      }

      // 2. Cria 1 meal_template por dia alvo
      const newMeals = input.targetDays.map((d) => ({
        profile_id: src.profile_id,
        day_of_week: d,
        name: src.name,
        time: src.time,
        notify: src.notify,
        order_index: src.order_index,
      }))
      const { data: created, error: e2 } = await supabase
        .from("meal_templates")
        .insert(newMeals)
        .select("id, day_of_week")
      if (e2) throw e2

      // 3. Para cada meal nova, insere os items
      const itemRows = (created ?? []).flatMap((m) =>
        src.items.map((it) => ({
          meal_template_id: m.id,
          food_id: it.food_id,
          quantity: it.quantity,
          order_index: it.order_index,
        })),
      )
      if (itemRows.length > 0) {
        const { error: e3 } = await supabase
          .from("meal_template_items")
          .insert(itemRows)
        if (e3) throw e3
      }
    },
    onSuccess: (_, input) =>
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) }),
  })
}

// ---------- Meal Template Items (alimentos dentro da refeição) ----------

export function useAddMealItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      mealId: string
      profileId: string
      foodId: string
      quantity: number
      order_index?: number
    }): Promise<MealTemplateItem> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_template_items")
        .insert({
          meal_template_id: input.mealId,
          food_id: input.foodId,
          quantity: input.quantity,
          order_index: input.order_index ?? 0,
        })
        .select("*")
        .single()
      if (error) throw error
      return data as MealTemplateItem
    },
    onSuccess: (_, input) =>
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) }),
  })
}

export function useUpdateMealItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      profileId: string
      quantity: number
    }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from("meal_template_items")
        .update({ quantity: input.quantity })
        .eq("id", input.id)
      if (error) throw error
    },
    onSuccess: (_, input) =>
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) }),
  })
}

export function useDeleteMealItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; profileId: string }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from("meal_template_items")
        .delete()
        .eq("id", input.id)
      if (error) throw error
    },
    onSuccess: (_, input) =>
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) }),
  })
}

// ---------- Completions ----------

export function useMealCompletions(profileId: string | null, date: string) {
  return useQuery({
    enabled: !!profileId,
    queryKey: mealKeys.completions(profileId ?? "_", date),
    queryFn: async (): Promise<MealCompletion[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_completions")
        .select("*")
        .eq("profile_id", profileId)
        .eq("date", date)
      if (error) throw error
      return (data ?? []) as MealCompletion[]
    },
  })
}

export function useToggleMealCompletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      mealId: string
      date: string
      currentlyCompleted: boolean
    }): Promise<void> => {
      const supabase = createClient()
      if (input.currentlyCompleted) {
        const { error } = await supabase
          .from("meal_completions")
          .delete()
          .eq("profile_id", input.profileId)
          .eq("meal_template_id", input.mealId)
          .eq("date", input.date)
        if (error) throw error
      } else {
        const { error } = await supabase.from("meal_completions").insert({
          profile_id: input.profileId,
          meal_template_id: input.mealId,
          date: input.date,
        })
        if (error) throw error
      }
    },
    onMutate: async (input) => {
      // Optimistic: alterna na cache de completions imediatamente.
      const key = mealKeys.completions(input.profileId, input.date)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<MealCompletion[]>(key) ?? []
      const next = input.currentlyCompleted
        ? prev.filter((c) => c.meal_template_id !== input.mealId)
        : [
            ...prev,
            {
              id: `optimistic-${input.mealId}`,
              profile_id: input.profileId,
              meal_template_id: input.mealId,
              date: input.date,
              completed_at: new Date().toISOString(),
            } as MealCompletion,
          ]
      qc.setQueryData(key, next)
      return { prev }
    },
    onError: (_err, input, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(
          mealKeys.completions(input.profileId, input.date),
          ctx.prev,
        )
      }
    },
    onSettled: (_, __, input) => {
      qc.invalidateQueries({
        queryKey: mealKeys.completions(input.profileId, input.date),
      })
    },
  })
}

/** Completions num range (pra painel/streaks). */
export function useMealCompletionsRange(
  profileId: string | null,
  fromDate: string,
  toDate: string,
) {
  return useQuery({
    enabled: !!profileId,
    queryKey: mealKeys.completionsRange(profileId ?? "_", fromDate, toDate),
    queryFn: async (): Promise<MealCompletion[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_completions")
        .select("*")
        .eq("profile_id", profileId)
        .gte("date", fromDate)
        .lte("date", toDate)
      if (error) throw error
      return (data ?? []) as MealCompletion[]
    },
  })
}

/** Templates de TODOS os 7 dias (usado pra calcular streak/planejado). */
export function useAllMealTemplates(profileId: string | null) {
  return useQuery({
    enabled: !!profileId,
    queryKey: mealKeys.templates(profileId ?? "_"),
    queryFn: async (): Promise<MealTemplateWithItems[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_templates")
        .select(
          `
          id, profile_id, day_of_week, name, time, notify, order_index, created_at,
          items:meal_template_items (
            id, meal_template_id, food_id, quantity, order_index,
            food:foods (
              id, name, measure_type, reference_quantity,
              kcal, carb_g, protein_g, fat_g, created_at
            )
          )
          `,
        )
        .eq("profile_id", profileId)
        .order("day_of_week", { ascending: true })
        .order("order_index", { ascending: true })
      if (error) throw error
      return ((data ?? []) as unknown as MealTemplateWithItems[]).map((m) => ({
        ...m,
        items: [...m.items].sort((a, b) => a.order_index - b.order_index),
      }))
    },
  })
}

// Re-export tipo conveniente
export type { Food, MealTemplate, MealTemplateItem, MealTemplateWithItems }
