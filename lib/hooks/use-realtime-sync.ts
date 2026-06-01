"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { foodKeys, mealKeys, profileKeys, waterKeys } from "@/lib/queries/keys"
import { createClient } from "@/lib/supabase/client"

/**
 * Sync ao vivo entre os 2 celulares. Subscreve mudanças no Postgres via
 * Supabase Realtime e invalida as queries afetadas (com debounce pra não
 * thrashar quando o próprio usuário faz várias edições seguidas).
 *
 * Requer as tabelas na publication `supabase_realtime` (ver sql/schema.sql).
 */
export function useRealtimeSync() {
  const qc = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    const bump = (k: string, queryKey: readonly unknown[]) => {
      const t = timers.get(k)
      if (t) clearTimeout(t)
      timers.set(
        k,
        setTimeout(() => qc.invalidateQueries({ queryKey }), 250),
      )
    }

    const tbl = (table: string) =>
      ({ event: "*", schema: "public", table }) as const

    const channel = supabase
      .channel("dieta-sync")
      .on("postgres_changes", tbl("meal_item_completions"), () =>
        bump("meals", mealKeys.all),
      )
      .on("postgres_changes", tbl("meal_templates"), () =>
        bump("meals", mealKeys.all),
      )
      .on("postgres_changes", tbl("meal_template_items"), () =>
        bump("meals", mealKeys.all),
      )
      .on("postgres_changes", tbl("water_logs"), () =>
        bump("water", waterKeys.all),
      )
      .on("postgres_changes", tbl("foods"), () => bump("foods", foodKeys.all))
      .on("postgres_changes", tbl("profiles"), () =>
        bump("profiles", profileKeys.all),
      )
      .subscribe()

    return () => {
      timers.forEach((t) => clearTimeout(t))
      supabase.removeChannel(channel)
    }
  }, [qc])
}
