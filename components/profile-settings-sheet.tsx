"use client"

import { Settings } from "lucide-react"

import { ProfileSettingsCard } from "@/components/painel/profile-settings-card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"

/** Gear icon no header da app → sheet com as configurações do perfil ativo. */
export function ProfileSettingsSheet() {
  const { active } = useActiveProfile()
  if (!active) return null
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Configurações"
        className="hover:bg-muted text-muted-foreground hover:text-foreground flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        <Settings className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex h-[92dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle>Configurações de {active.name}</SheetTitle>
          <SheetDescription>
            Nome, cor, metas diárias e lembretes de água.
          </SheetDescription>
        </SheetHeader>
        <div className="pb-sheet-footer flex-1 overflow-y-auto px-4 pt-3">
          {/* key force-remounts on profile switch */}
          <ProfileSettingsCard key={active.id} profile={active} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
