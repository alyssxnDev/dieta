/**
 * Calcula os horários dos lembretes de água espaçados igualmente entre
 * start e end. Retorna array de "HH:MM".
 *
 * Ex.: start=07:00, end=22:00, count=8
 *      → ["07:00", "09:09", "11:17", "13:26", "15:34", "17:43", "19:51", "22:00"]
 */
export function computeReminderTimes(
  startHHMM: string,
  endHHMM: string,
  count: number,
): string[] {
  if (count < 1) return []
  const startMin = parseHHMM(startHHMM)
  const endMin = parseHHMM(endHHMM)
  if (endMin <= startMin) return [formatHHMM(startMin)]

  if (count === 1) return [formatHHMM(startMin)]

  const step = (endMin - startMin) / (count - 1)
  return Array.from({ length: count }, (_, i) =>
    formatHHMM(Math.round(startMin + step * i)),
  )
}

function parseHHMM(s: string): number {
  // Aceita "HH:MM" ou "HH:MM:SS" (formato do Postgres time)
  const [h, m] = s.split(":").map(Number)
  return h * 60 + m
}

function formatHHMM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
