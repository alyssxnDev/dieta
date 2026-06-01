"use client"

import { useMemo, useSyncExternalStore } from "react"

import { toIsoDate } from "@/lib/date"

// Store externo que notifica React quando o dia vira (meia-noite) ou quando o
// app volta ao foco (PWA que ficou aberto cruzando a meia-noite).
function subscribe(callback: () => void) {
  let timer: ReturnType<typeof setTimeout>

  function scheduleMidnight() {
    const now = new Date()
    const next = new Date(now)
    next.setHours(24, 0, 0, 200) // 200ms depois da meia-noite, por segurança
    timer = setTimeout(() => {
      callback()
      scheduleMidnight()
    }, next.getTime() - now.getTime())
  }
  scheduleMidnight()

  const onFocus = () => callback()
  window.addEventListener("focus", onFocus)
  document.addEventListener("visibilitychange", onFocus)

  return () => {
    clearTimeout(timer)
    window.removeEventListener("focus", onFocus)
    document.removeEventListener("visibilitychange", onFocus)
  }
}

// Snapshot = string YYYY-MM-DD (estável por valor; muda só quando o dia muda).
function getSnapshot(): string {
  return toIsoDate(new Date())
}
function getServerSnapshot(): string {
  return ""
}

/** Data "de hoje" reativa — atualiza sozinha na virada do dia. */
export function useToday() {
  const iso = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return useMemo(() => {
    if (!iso) {
      const d = new Date()
      return { iso: toIsoDate(d), date: d, dow: d.getDay() }
    }
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return { iso, date, dow: date.getDay() }
  }, [iso])
}
