"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { WaterLog } from "@/types/database"

import { waterKeys } from "./keys"

export function useWaterLogs(profileId: string | null, date: string) {
  return useQuery({
    enabled: !!profileId,
    queryKey: waterKeys.forDate(profileId ?? "_", date),
    queryFn: async (): Promise<WaterLog[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("water_logs")
        .select("*")
        .eq("profile_id", profileId)
        .eq("date", date)
        .order("logged_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as WaterLog[]
    },
  })
}

export function useAddWaterLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      date: string
      amount_ml: number
    }): Promise<WaterLog> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("water_logs")
        .insert({
          profile_id: input.profileId,
          date: input.date,
          amount_ml: input.amount_ml,
        })
        .select("*")
        .single()
      if (error) throw error
      return data as WaterLog
    },
    onMutate: async (input) => {
      const key = waterKeys.forDate(input.profileId, input.date)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<WaterLog[]>(key) ?? []
      const optimistic: WaterLog = {
        id: `optimistic-${Date.now()}`,
        profile_id: input.profileId,
        date: input.date,
        amount_ml: input.amount_ml,
        logged_at: new Date().toISOString(),
      }
      qc.setQueryData(key, [optimistic, ...prev])
      return { prev }
    },
    onError: (_err, input, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(waterKeys.forDate(input.profileId, input.date), ctx.prev)
      }
    },
    onSettled: (_, __, input) => {
      qc.invalidateQueries({
        queryKey: waterKeys.forDate(input.profileId, input.date),
      })
    },
  })
}

/** Remove o water_log mais recente do dia. */
export function useUndoLastWaterLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      profileId: string
      date: string
    }): Promise<void> => {
      const supabase = createClient()
      // pega o último (logged_at desc, primeiro)
      const { data: last, error: e1 } = await supabase
        .from("water_logs")
        .select("id")
        .eq("profile_id", input.profileId)
        .eq("date", input.date)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (e1) throw e1
      if (!last) return
      const { error: e2 } = await supabase
        .from("water_logs")
        .delete()
        .eq("id", last.id)
      if (e2) throw e2
    },
    onSuccess: (_, input) =>
      qc.invalidateQueries({
        queryKey: waterKeys.forDate(input.profileId, input.date),
      }),
  })
}

export function useWaterLogsRange(
  profileId: string | null,
  fromDate: string,
  toDate: string,
) {
  return useQuery({
    enabled: !!profileId,
    queryKey: waterKeys.range(profileId ?? "_", fromDate, toDate),
    queryFn: async (): Promise<WaterLog[]> => {
      if (!profileId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("water_logs")
        .select("*")
        .eq("profile_id", profileId)
        .gte("date", fromDate)
        .lte("date", toDate)
      if (error) throw error
      return (data ?? []) as WaterLog[]
    },
  })
}
