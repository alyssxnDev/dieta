import { cn } from "@/lib/utils"
import type { FoodCategory } from "@/types/database"

const STYLE: Record<FoodCategory, { label: string; className: string }> = {
  carbo: { label: "Carbo", className: "bg-blue-500/15 text-blue-700" },
  proteina: { label: "Proteína", className: "bg-rose-500/15 text-rose-700" },
  gordura: { label: "Gordura", className: "bg-yellow-500/20 text-yellow-700" },
  livre: { label: "Livre", className: "bg-zinc-500/15 text-zinc-600" },
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
