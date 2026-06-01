"use client"

import {
  keepPreviousData,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type {
  Food,
  MealItemCompletion,
  MealItemOverride,
  MealTemplate,
  MealTemplateItem,
  MealTemplateWithItems,
} from "@/types/database"

import { foodKeys, mealKeys } from "./keys"

// ---------- Helpers de cache otimista ----------

/** Atualiza TODAS as queries de templates do perfil (templatesByDay + all). */
function patchTemplatesCache(
  qc: QueryClient,
  profileId: string,
  updater: (meals: MealTemplateWithItems[]) => MealTemplateWithItems[],
) {
  qc.setQueriesData<MealTemplateWithItems[]>(
    { queryKey: mealKeys.templates(profileId) },
    (old) => (old ? updater(old) : old),
  )
}

/** Snapshot pra rollback em caso de erro. */
function snapshotTemplates(qc: QueryClient, profileId: string) {
  return qc.getQueriesData<MealTemplateWithItems[]>({
    queryKey: mealKeys.templates(profileId),
  })
}
function restoreTemplates(
  qc: QueryClient,
  snapshot: ReturnType<typeof snapshotTemplates>,
) {
  for (const [key, data] of snapshot) qc.setQueryData(key, data)
}

// ---------- Reads ----------

export function useMealTemplatesByDay(
  profileId: string | null,
  dayOfWeek: number,
) {
  return useQuery({
    enabled: !!profileId,
    // Mantém o dia anterior na tela enquanto o novo carrega (carrossel liso).
    placeholderData: keepPreviousData,
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
              kcal, carb_g, protein_g, fat_g, category, created_at
            )
          )
          `,
        )
        .eq("profile_id", profileId)
        .eq("day_of_week", dayOfWeek)
        .order("order_index", { ascending: true })
        .order("time", { ascending: true, nullsFirst: false })
      if (error) throw error
      return ((data ?? []) as unknown as MealTemplateWithItems[]).map((m) => ({
        ...m,
        items: [...m.items].sort((a, b) => a.order_index - b.order_index),
      }))
    },
  })
}

// ---------- Meal Template ----------

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
    // Optimistic: some o card na hora
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: mealKeys.templates(input.profileId) })
      const snap = snapshotTemplates(qc, input.profileId)
      patchTemplatesCache(qc, input.profileId, (meals) =>
        meals.filter((m) => m.id !== input.id),
      )
      return { snap }
    },
    onError: (_e, input, ctx) => ctx && restoreTemplates(qc, ctx.snap),
    onSettled: (_, __, input) => {
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) })
    },
  })
}

export function useReplicateMealToDays() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      sourceMealId: string
      profileId: string
      targetDays: number[]
    }): Promise<void> => {
      const supabase = createClient()
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

// ---------- Meal Template Items ----------

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
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: mealKeys.templates(input.profileId) })
      const snap = snapshotTemplates(qc, input.profileId)
      // Pega o food do cache pra montar o item otimista
      const foods = qc.getQueryData<Food[]>(foodKeys.list())
      const food = foods?.find((f) => f.id === input.foodId)
      if (food) {
        patchTemplatesCache(qc, input.profileId, (meals) =>
          meals.map((m) =>
            m.id === input.mealId
              ? {
                  ...m,
                  items: [
                    ...m.items,
                    {
                      id: `optimistic-${Date.now()}`,
                      meal_template_id: m.id,
                      food_id: input.foodId,
                      quantity: input.quantity,
                      order_index: input.order_index ?? m.items.length,
                      food,
                    },
                  ],
                }
              : m,
          ),
        )
      }
      return { snap }
    },
    onError: (_e, input, ctx) => ctx && restoreTemplates(qc, ctx.snap),
    onSettled: (_, __, input) =>
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) }),
  })
}

/**
 * Adiciona MESMO alimento+quantity em TODAS as meal_templates do perfil que
 * tenham o mesmo nome (case-insensitive) da meal de referência.
 */
export function useAddMealItemToAllByName() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      mealName: string
      foodId: string
      quantity: number
    }): Promise<number> => {
      const supabase = createClient()
      const { data: meals, error: e1 } = await supabase
        .from("meal_templates")
        .select("id")
        .eq("profile_id", input.profileId)
        .ilike("name", input.mealName)
      if (e1) throw e1
      if (!meals || meals.length === 0) return 0
      const ids = meals.map((m) => m.id)
      const { data: existing, error: e2 } = await supabase
        .from("meal_template_items")
        .select("meal_template_id, order_index")
        .in("meal_template_id", ids)
      if (e2) throw e2
      const maxByMeal = new Map<string, number>()
      for (const it of existing ?? []) {
        const cur = maxByMeal.get(it.meal_template_id) ?? -1
        if (it.order_index > cur) maxByMeal.set(it.meal_template_id, it.order_index)
      }
      const rows = meals.map((m) => ({
        meal_template_id: m.id,
        food_id: input.foodId,
        quantity: input.quantity,
        order_index: (maxByMeal.get(m.id) ?? -1) + 1,
      }))
      const { error: e3 } = await supabase
        .from("meal_template_items")
        .insert(rows)
      if (e3) throw e3
      return rows.length
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
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: mealKeys.templates(input.profileId) })
      const snap = snapshotTemplates(qc, input.profileId)
      patchTemplatesCache(qc, input.profileId, (meals) =>
        meals.map((m) => ({
          ...m,
          items: m.items.map((it) =>
            it.id === input.id ? { ...it, quantity: input.quantity } : it,
          ),
        })),
      )
      return { snap }
    },
    onError: (_e, input, ctx) => ctx && restoreTemplates(qc, ctx.snap),
    onSettled: (_, __, input) =>
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
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: mealKeys.templates(input.profileId) })
      const snap = snapshotTemplates(qc, input.profileId)
      patchTemplatesCache(qc, input.profileId, (meals) =>
        meals.map((m) => ({
          ...m,
          items: m.items.filter((it) => it.id !== input.id),
        })),
      )
      return { snap }
    },
    onError: (_e, input, ctx) => ctx && restoreTemplates(qc, ctx.snap),
    onSettled: (_, __, input) =>
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) }),
  })
}

/** Remove um alimento de TODAS as refeições do perfil onde aparece. */
export function useDeleteFoodFromAllMeals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      foodId: string
    }): Promise<number> => {
      const supabase = createClient()
      const { data: meals, error: e1 } = await supabase
        .from("meal_templates")
        .select("id")
        .eq("profile_id", input.profileId)
      if (e1) throw e1
      const mealIds = (meals ?? []).map((m) => m.id)
      if (mealIds.length === 0) return 0
      const { data: deleted, error: e2 } = await supabase
        .from("meal_template_items")
        .delete()
        .eq("food_id", input.foodId)
        .in("meal_template_id", mealIds)
        .select("id")
      if (e2) throw e2
      return (deleted ?? []).length
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: mealKeys.templates(input.profileId) })
      const snap = snapshotTemplates(qc, input.profileId)
      patchTemplatesCache(qc, input.profileId, (meals) =>
        meals.map((m) => ({
          ...m,
          items: m.items.filter((it) => it.food_id !== input.foodId),
        })),
      )
      return { snap }
    },
    onError: (_e, input, ctx) => ctx && restoreTemplates(qc, ctx.snap),
    onSettled: (_, __, input) =>
      qc.invalidateQueries({ queryKey: mealKeys.templates(input.profileId) }),
  })
}

// ---------- Item Completions ----------

export function useMealItemCompletions(profileId: string | null, date: string) {
  return useQuery({
    enabled: !!profileId,
    placeholderData: keepPreviousData,
    queryKey: mealKeys.completions(profileId ?? "_", date),
    queryFn: async (): Promise<MealItemCompletion[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_item_completions")
        .select("*")
        .eq("profile_id", profileId)
        .eq("date", date)
      if (error) throw error
      return (data ?? []) as MealItemCompletion[]
    },
  })
}

export function useToggleMealItemCompletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      mealItemId: string
      date: string
      currentlyCompleted: boolean
    }): Promise<void> => {
      const supabase = createClient()
      if (input.currentlyCompleted) {
        const { error } = await supabase
          .from("meal_item_completions")
          .delete()
          .eq("profile_id", input.profileId)
          .eq("meal_template_item_id", input.mealItemId)
          .eq("date", input.date)
        if (error) throw error
      } else {
        const { error } = await supabase.from("meal_item_completions").insert({
          profile_id: input.profileId,
          meal_template_item_id: input.mealItemId,
          date: input.date,
        })
        if (error) throw error
      }
    },
    onMutate: async (input) => {
      const key = mealKeys.completions(input.profileId, input.date)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<MealItemCompletion[]>(key) ?? []
      const next = input.currentlyCompleted
        ? prev.filter((c) => c.meal_template_item_id !== input.mealItemId)
        : [
            ...prev,
            {
              id: `optimistic-${input.mealItemId}`,
              profile_id: input.profileId,
              meal_template_item_id: input.mealItemId,
              date: input.date,
              completed_at: new Date().toISOString(),
            } as MealItemCompletion,
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

/** Marca/desmarca TODOS os itens de uma refeição num dia (bulk, optimistic). */
export function useToggleAllMealItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      mealItemIds: string[]
      date: string
      complete: boolean
    }): Promise<void> => {
      if (input.mealItemIds.length === 0) return
      const supabase = createClient()
      if (input.complete) {
        const rows = input.mealItemIds.map((id) => ({
          profile_id: input.profileId,
          meal_template_item_id: id,
          date: input.date,
        }))
        const { error } = await supabase
          .from("meal_item_completions")
          .upsert(rows, {
            onConflict: "profile_id,meal_template_item_id,date",
            ignoreDuplicates: true,
          })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("meal_item_completions")
          .delete()
          .eq("profile_id", input.profileId)
          .eq("date", input.date)
          .in("meal_template_item_id", input.mealItemIds)
        if (error) throw error
      }
    },
    onMutate: async (input) => {
      const key = mealKeys.completions(input.profileId, input.date)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<MealItemCompletion[]>(key) ?? []
      const idSet = new Set(input.mealItemIds)
      let next: MealItemCompletion[]
      if (input.complete) {
        const existing = new Set(prev.map((c) => c.meal_template_item_id))
        const added = input.mealItemIds
          .filter((id) => !existing.has(id))
          .map(
            (id) =>
              ({
                id: `optimistic-${id}`,
                profile_id: input.profileId,
                meal_template_item_id: id,
                date: input.date,
                completed_at: new Date().toISOString(),
              }) as MealItemCompletion,
          )
        next = [...prev, ...added]
      } else {
        next = prev.filter((c) => !idSet.has(c.meal_template_item_id))
      }
      qc.setQueryData(key, next)
      return { prev }
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(
          mealKeys.completions(input.profileId, input.date),
          ctx.prev,
        )
      }
    },
    onSettled: (_, __, input) =>
      qc.invalidateQueries({
        queryKey: mealKeys.completions(input.profileId, input.date),
      }),
  })
}

/** Completions num range (pra painel/streaks). */
export function useMealItemCompletionsRange(
  profileId: string | null,
  fromDate: string,
  toDate: string,
) {
  return useQuery({
    enabled: !!profileId,
    placeholderData: keepPreviousData,
    queryKey: mealKeys.completionsRange(profileId ?? "_", fromDate, toDate),
    queryFn: async (): Promise<MealItemCompletion[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_item_completions")
        .select("*")
        .eq("profile_id", profileId)
        .gte("date", fromDate)
        .lte("date", toDate)
      if (error) throw error
      return (data ?? []) as MealItemCompletion[]
    },
  })
}

export function useAllMealTemplates(profileId: string | null) {
  return useQuery({
    enabled: !!profileId,
    placeholderData: keepPreviousData,
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
              kcal, carb_g, protein_g, fat_g, category, created_at
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

// ---------- Substituições do dia (overrides) ----------

const OVERRIDE_SELECT = `
  id, profile_id, meal_template_item_id, date, substitute_food_id, quantity, created_at,
  food:foods!meal_item_overrides_substitute_food_id_fkey (
    id, name, measure_type, reference_quantity,
    kcal, carb_g, protein_g, fat_g, category, created_at
  )
`

export function useMealItemOverrides(profileId: string | null, date: string) {
  return useQuery({
    enabled: !!profileId,
    placeholderData: keepPreviousData,
    queryKey: mealKeys.overrides(profileId ?? "_", date),
    queryFn: async (): Promise<MealItemOverride[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("meal_item_overrides")
        .select(OVERRIDE_SELECT)
        .eq("profile_id", profileId)
        .eq("date", date)
      // Degrada com elegância se a tabela ainda não existir (SQL não rodado).
      if (error) {
        if (typeof console !== "undefined") {
          console.warn("[overrides] indisponível:", error.message)
        }
        return []
      }
      return (data ?? []) as unknown as MealItemOverride[]
    },
  })
}

export function useSetMealItemOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      mealItemId: string
      date: string
      substituteFood: Food
      quantity: number
    }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from("meal_item_overrides").upsert(
        {
          profile_id: input.profileId,
          meal_template_item_id: input.mealItemId,
          date: input.date,
          substitute_food_id: input.substituteFood.id,
          quantity: input.quantity,
        },
        { onConflict: "profile_id,meal_template_item_id,date" },
      )
      if (error) throw error
    },
    onMutate: async (input) => {
      const key = mealKeys.overrides(input.profileId, input.date)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<MealItemOverride[]>(key) ?? []
      const next = [
        ...prev.filter((o) => o.meal_template_item_id !== input.mealItemId),
        {
          id: `optimistic-${input.mealItemId}`,
          profile_id: input.profileId,
          meal_template_item_id: input.mealItemId,
          date: input.date,
          substitute_food_id: input.substituteFood.id,
          quantity: input.quantity,
          created_at: new Date().toISOString(),
          food: input.substituteFood,
        } as MealItemOverride,
      ]
      qc.setQueryData(key, next)
      return { prev }
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(mealKeys.overrides(input.profileId, input.date), ctx.prev)
    },
    onSettled: (_, __, input) =>
      qc.invalidateQueries({
        queryKey: mealKeys.overrides(input.profileId, input.date),
      }),
  })
}

export function useClearMealItemOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      mealItemId: string
      date: string
    }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from("meal_item_overrides")
        .delete()
        .eq("profile_id", input.profileId)
        .eq("meal_template_item_id", input.mealItemId)
        .eq("date", input.date)
      if (error) throw error
    },
    onMutate: async (input) => {
      const key = mealKeys.overrides(input.profileId, input.date)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<MealItemOverride[]>(key) ?? []
      qc.setQueryData(
        key,
        prev.filter((o) => o.meal_template_item_id !== input.mealItemId),
      )
      return { prev }
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(mealKeys.overrides(input.profileId, input.date), ctx.prev)
    },
    onSettled: (_, __, input) =>
      qc.invalidateQueries({
        queryKey: mealKeys.overrides(input.profileId, input.date),
      }),
  })
}

export type { Food, MealTemplate, MealTemplateItem, MealTemplateWithItems }
