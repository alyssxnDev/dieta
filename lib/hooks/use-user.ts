"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

/** Usuário Supabase logado. Atualiza em SIGNED_IN/OUT/TOKEN_REFRESHED. */
export function useUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { user, isLoading: user === undefined }
}
