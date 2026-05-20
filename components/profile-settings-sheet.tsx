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
        className="max-h-[90dvh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Configurações de {active.name}</SheetTitle>
          <SheetDescription>
            Nome, cor, metas diárias e lembretes de água.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {/* key force-remounts on profile switch */}
          <ProfileSettingsCard key={active.id} profile={active} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
