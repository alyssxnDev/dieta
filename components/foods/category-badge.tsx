import { cn } from "@/lib/utils"
import type { FoodCategory } from "@/types/database"

const STYLE: Record<FoodCategory, { label: string; className: string }> = {
  carbo: { label: "Carbo", className: "bg-blue-500/15 text-blue-700" },
  proteina: { label: "Proteína", className: "bg-rose-500/15 text-rose-700" },
  gordura: { label: "Gordura", className: "bg-yellow-500/20 text-yellow-700" },
  livre: { label: "Livre", className: "bg-zinc-500/15 text-zinc-600" },
}

// Cor do dot (compacto, pra Planner/Hoje) — tonalidade mais clara, casando
// com o visual leve do badge da aba Alimentos.
const DOT: Record<FoodCategory, string> = {
  carbo: "bg-blue-400",
  proteina: "bg-rose-400",
  gordura: "bg-yellow-400",
  livre: "bg-zinc-300",
}

/** Bolinha de categoria — leitura rápida da composição da refeição. */
export function CategoryDot({
  category,
  className,
}: {
  category: FoodCategory | null
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        category ? DOT[category] : "bg-transparent",
        className,
      )}
    />
  )
}

/** Badge de categoria de macro (carbo/proteína/gordura/livre). */
export function CategoryBadge({
  category,
  className,
}: {
  category: FoodCategory | null
  className?: string
}) {
  if (!category) return null
  const s = STYLE[category]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  )
}
