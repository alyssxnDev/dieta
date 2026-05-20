"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"

import { profileKeys } from "./keys"

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.list(),
    queryFn: async (): Promise<Profile[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as Profile[]
    },
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      patch: Partial<Omit<Profile, "id" | "created_at">>
    }): Promise<Profile> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .update(input.patch)
        .eq("id", input.id)
        .select("*")
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
