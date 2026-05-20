"use client"

import { BottomTabBar } from "@/components/tabs/bottom-tab-bar"
import { ProfileSwitcher } from "@/components/profile-switcher"
import { useActiveProfile } from "@/lib/hooks/use-active-profile"

// Shell autenticado.
//  - pt-safe cobre o notch / Dynamic Island
//  - pb-tabbar reserva o espaço da BottomTabBar (que é fixed + pb-safe)
//  - ProfileSwitcher fica fixo no topo, sempre visível
//  - Accent da tab ativa pega a cor do perfil ativo
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { active } = useActiveProfile()

  return (
    <div className="pt-safe pb-tabbar flex min-h-full flex-col">
      <header className="px-4">
        <ProfileSwitcher />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomTabBar accent={active?.color} />
    </div>
  )
}
