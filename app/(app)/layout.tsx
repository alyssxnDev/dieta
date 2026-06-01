"use client"

import { ProfileSettingsSheet } from "@/components/profile-settings-sheet"
import { ProfileSwitcher } from "@/components/profile-switcher"
import { BottomTabBar } from "@/components/tabs/bottom-tab-bar"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"
import { useRealtimeSync } from "@/lib/hooks/use-realtime-sync"

// Shell autenticado.
//  - min-h-screen (vh) é estável em PWA standalone iOS — dvh tava causando
//    layout shift no carregamento inicial (tab bar "subia" antes de iOS
//    calcular safe-area-inset-bottom)
//  - BottomTabBar renderiza FORA do container interno via fragment, garantindo
//    que `position: fixed` ancore direto ao viewport sem interferência
//  - pt-safe cobre notch / Dynamic Island
//  - pb-tabbar reserva espaço da BottomTabBar no scroll
//  - Header: ProfileSwitcher + gear icon (sempre visível em todas as abas)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { active } = useActiveProfile()
  // Sync ao vivo entre os 2 celulares (Supabase Realtime).
  useRealtimeSync()

  return (
    <>
      <div className="pt-safe pb-tabbar flex min-h-screen flex-col">
        <header className="relative flex items-center px-4">
          <div className="flex-1">
            <ProfileSwitcher />
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ProfileSettingsSheet />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
      <BottomTabBar accent={active?.color} />
    </>
  )
}
