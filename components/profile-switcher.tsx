"use client"

import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"
import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

export function ProfileSwitcher() {
  const { profiles, active, setActive, isLoading } = useActiveProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    )
  }
  if (profiles.length === 0) return null

  return (
    <div className="flex items-center justify-center gap-6 py-3">
      {profiles.map((p) => {
        const isActive = active?.id === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (isActive) return
              haptic(8)
              setActive(p.id)
            }}
            className="group flex flex-col items-center gap-1"
            aria-pressed={isActive}
            aria-label={`Trocar pro perfil ${p.name}`}
          >
            <motion.div
              initial={false}
              animate={{ scale: isActive ? 1.0 : 0.78, opacity: isActive ? 1 : 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-zinc-950 ring-zinc-950",
                isActive && "ring-2 ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: p.color, boxShadow: isActive ? `0 0 0 2px ${p.color}` : undefined }}
            >
              {p.name.charAt(0).toUpperCase()}
            </motion.div>
            <span
              className={cn(
                "text-xs transition-opacity",
                isActive ? "text-foreground opacity-100" : "text-muted-foreground opacity-0",
              )}
              aria-hidden={!isActive}
            >
              {p.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
