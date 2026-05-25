"use client"

import { Apple, BarChart3, CalendarDays, Sun } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { haptic } from "@/lib/haptic"
import { cn } from "@/lib/utils"

type Tab = { href: string; label: string; icon: typeof Sun }

const TABS: Tab[] = [
  { href: "/hoje", label: "Hoje", icon: Sun },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/alimentos", label: "Alimentos", icon: Apple },
  { href: "/painel", label: "Painel", icon: BarChart3 },
]

export function BottomTabBar({ accent }: { accent?: string }) {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Navegação principal"
      className="bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t border-border backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid h-12 max-w-xl grid-cols-4">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`)
          const Icon = t.icon
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                onClick={() => haptic(6)}
                className={cn(
                  "flex h-full flex-col items-center justify-end gap-0.5 pb-1 text-[10px] font-medium transition-colors",
                  active ? "" : "text-muted-foreground hover:text-foreground",
                )}
                style={active && accent ? { color: accent } : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" />
                <span>{t.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
