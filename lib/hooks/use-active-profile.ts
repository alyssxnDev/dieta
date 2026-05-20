"use client"

import { useMemo, useSyncExternalStore } from "react"

import { useProfiles } from "@/lib/queries/profiles"
import type { Profile } from "@/types/database"

const STORAGE_KEY = "dieta:active-profile-id"
const CHANGE_EVENT = "dieta:active-profile-changed"

function subscribe(callback: () => void) {
  // Mudanças vindas de outras abas
  window.addEventListener("storage", callback)
  // Mudanças vindas do próprio tab (setActive abaixo)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

function getSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY)
}

function getServerSnapshot(): string | null {
  // No SSR não temos localStorage. Cliente hidrata com o valor real.
  return null
}

/**
 * Perfil ativo. Persiste em localStorage; fallback pro 1º perfil quando nada
 * salvo ou ID salvo não existir mais. Compartilhado pelos 2 usuários — não há
 * isolamento entre logins.
 */
export function useActiveProfile() {
  const { data: profiles, isLoading } = useProfiles()
  const storedId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Active é derivado — sem useState/useEffect pra sincronizar
  const active = useMemo<Profile | null>(() => {
    if (!profiles?.length) return null
    return profiles.find((p) => p.id === storedId) ?? profiles[0]
  }, [profiles, storedId])

  const setActive = (id: string) => {
    window.localStorage.setItem(STORAGE_KEY, id)
    // storage event nativo só dispara em OUTRAS abas; emitimos manual pro próprio tab
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return {
    profiles: profiles ?? [],
    active,
    activeId: active?.id ?? null,
    setActive,
    isLoading,
  }
}
