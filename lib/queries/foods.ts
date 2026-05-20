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
