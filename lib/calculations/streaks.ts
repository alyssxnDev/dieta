/**
 * Streak de água: dias passados consecutivos onde a soma de water_logs >= meta.
 * Não conta hoje (pra não zerar o streak durante o dia).
 * Itera do mais recente pro mais antigo, para no 1º dia que não bateu.
 */
export function waterStreak(
  daysWithTotal: { date: string; total_ml: number }[],
  goalMl: number,
): number {
  const byDate = new Map(daysWithTotal.map((d) => [d.date, d.total_ml]))
  let count = 0
  // ordena por data desc (string YYYY-MM-DD ordena como data)
  const sorted = [...byDate.keys()].sort().reverse()
  for (const date of sorted) {
    const total = byDate.get(date) ?? 0
    if (total >= goalMl) count++
    else break
  }
  return count
}

/**
 * Streak de refeições: dias passados consecutivos onde todas as refeições do
 * dia foram marcadas (count completions == count planned). Itera do mais
 * recente pro mais antigo, para no 1º dia que não bateu.
 *
 * `days` deve vir com `planned > 0` (dia sem refeições planejadas é pulado
 * por convenção — não conta como vitória nem quebra streak).
 */
export function mealStreak(
  days: { date: string; planned: number; completed: number }[],
): number {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1))
  let count = 0
  for (const d of sorted) {
    if (d.planned === 0) continue
    if (d.completed >= d.planned) count++
    else break
  }
  return count
}
