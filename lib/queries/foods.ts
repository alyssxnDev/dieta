"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { Food } from "@/types/database"

import { foodKeys } from "./keys"

export function useFoods() {
  return useQuery({
    queryKey: foodKeys.list(),
    queryFn: async (): Promise<Food[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .order("name", { ascending: true })
      if (error) throw error
      return (data ?? []) as Food[]
    },
    staleTime: 60_000,
  })
}

// ---------- Substitutos (simétrico) ----------

const SUB_SELECT = `
  substitute_food_id,
  food:foods!food_substitutes_substitute_food_id_fkey (
    id, name, measure_type, reference_quantity,
    kcal, carb_g, protein_g, fat_g, category, created_at
  )
`

/** Substitutos cadastrados de um alimento (lista de Food). Read defensivo. */
export function useFoodSubstitutes(foodId: string | null) {
  return useQuery({
    enabled: !!foodId,
    queryKey: foodKeys.substitutes(foodId ?? "_"),
    queryFn: async (): Promise<Food[]> => {
      if (!foodId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("food_substitutes")
        .select(SUB_SELECT)
        .eq("food_id", foodId)
      if (error) {
        if (typeof console !== "undefined")
          console.warn("[substitutes] indisponível:", error.message)
        return []
      }
      return ((data ?? []) as unknown as { food: Food }[])
        .map((r) => r.food)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    },
  })
}

/** Conjunto de food_ids que têm pelo menos 1 substituto cadastrado.
 *  Usado no Hoje pra só mostrar a flecha de troca onde faz sentido. */
export function useFoodsWithSubstitutes() {
  return useQuery({
    queryKey: [...foodKeys.substitutesAll(), "has"],
    queryFn: async (): Promise<string[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("food_substitutes")
        .select("food_id")
      if (error) {
        if (typeof console !== "undefined")
          console.warn("[substitutes] indisponível:", error.message)
        return []
      }
      return [...new Set((data ?? []).map((r) => r.food_id as string))]
    },
  })
}

/** Adiciona vínculo simétrico (A↔B). */
export function useAddSubstitute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      foodId: string
      substituteFoodId: string
    }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from("food_substitutes").upsert(
        [
          { food_id: input.foodId, substitute_food_id: input.substituteFoodId },
          { food_id: input.substituteFoodId, substitute_food_id: input.foodId },
        ],
        { onConflict: "food_id,substitute_food_id", ignoreDuplicates: true },
      )
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: foodKeys.substitutesAll() }),
  })
}

/** Remove vínculo simétrico (A↔B). */
export function useRemoveSubstitute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      foodId: string
      substituteFoodId: string
    }): Promise<void> => {
      const supabase = createClient()
      // Remove as duas direções
      const { error } = await supabase
        .from("food_substitutes")
        .delete()
        .or(
          `and(food_id.eq.${input.foodId},substitute_food_id.eq.${input.substituteFoodId}),and(food_id.eq.${input.substituteFoodId},substitute_food_id.eq.${input.foodId})`,
        )
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: foodKeys.substitutesAll() }),
  })
}

type FoodInput = Omit<Food, "id" | "created_at">

export function useCreateFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: FoodInput): Promise<Food> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("foods")
        .insert(input)
        .select("*")
        .single()
      if (error) throw error
      return data as Food
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: foodKeys.all }),
  })
}

export function useUpdateFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      patch: Partial<FoodInput>
    }): Promise<Food> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("foods")
        .update(input.patch)
        .eq("id", input.id)
        .select("*")
        .single()
      if (error) throw error
      return data as Food
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: foodKeys.all }),
  })
}

export function useDeleteFood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from("foods").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: foodKeys.all }),
  })
}
