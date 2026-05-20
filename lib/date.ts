import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** YYYY-MM-DD em fuso local (não UTC). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** 0 = domingo … 6 = sábado (JS getDay()). */
export function dayOfWeek(d: Date = new Date()): number {
  return d.getDay()
}

const SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const LONG = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
]

export function dayName(n: number, long = false): string {
  return long ? LONG[n] : SHORT[n]
}

export function formatLongDate(d: Date): string {
  return format(d, "EEEE, d 'de' MMMM", { locale: ptBR })
}

export function formatShortDate(d: Date): string {
  return format(d, "d MMM", { locale: ptBR })
}

/** Dias que somam N pra trás (inclusive hoje) — antigo → recente. */
export function lastNDates(n: number, includeToday = true): Date[] {
  const out: Date[] = []
  const start = today()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(start)
    d.setDate(start.getDate() - i)
    if (!includeToday && i === 0) continue
    out.push(d)
  }
  return out
}

/** Compara só ano/mês/dia. */
export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
