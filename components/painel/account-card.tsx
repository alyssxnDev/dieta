"use client"

import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"

export function AccountCard() {
  const { user } = useUser()
  const router = useRouter()

  const signOut = async () => {
    if (!window.confirm("Sair da conta?")) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <section
      aria-label="Conta"
      className="bg-card flex flex-col gap-3 rounded-2xl border border-zinc-800 p-4"
    >
      <header className="flex items-center gap-2">
        <User className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">Conta</h3>
      </header>
      <p className="text-muted-foreground truncate text-xs">
        {user?.email ?? "—"}
      </p>
      <Button variant="destructive" onClick={signOut} size="sm">
        <LogOut />
        Sair
      </Button>
    </section>
  )
}
