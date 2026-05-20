"use client"

import { ProfileSettingsSheet } from "@/components/profile-settings-sheet"
import { ProfileSwitcher } from "@/components/profile-switcher"
import { BottomTabBar } from "@/components/tabs/bottom-tab-bar"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"

// Shell autenticado.
//  - min-h-dvh em vez de min-h-full (dvh é o viewport real do iOS PWA)
//  - pt-safe cobre notch / Dynamic Island
//  - pb-tabbar reserva o espaço da BottomTabBar (que é fixed + safe-bottom)
//  - Header: ProfileSwitcher + gear icon de configurações
//  - Accent da tab ativa pega a cor do perfil ativo
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { active } = useActiveProfile()

  return (
    <div className="pt-safe pb-tabbar flex min-h-dvh flex-col">
      <header className="relative flex items-center px-4">
        <div className="flex-1">
          <ProfileSwitcher />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <ProfileSettingsSheet />
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomTabBar accent={active?.color} />
    </div>
  )
}
