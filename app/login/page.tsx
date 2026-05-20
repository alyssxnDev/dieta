import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "Entrar",
}

export default function LoginPage() {
  return (
    <main className="pt-safe pb-safe flex min-h-full flex-1 flex-col items-center justify-center gap-12 px-6">
      <div className="flex flex-col items-center gap-2">
        <div
          aria-hidden
          className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#a78bfa] text-3xl font-bold text-zinc-950"
        >
          D
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Dieta</h1>
        <p className="text-muted-foreground text-sm">
          Entra com seu email e senha
        </p>
      </div>
      <LoginForm />
    </main>
  )
}
