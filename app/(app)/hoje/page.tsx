// Placeholder pra Passo 1 — só prova que o app boota e o roteamento funciona.
// O conteúdo real (resumo do dia, refeições, água) vem no Passo 7.
export default function HojePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
        Setup base
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">Dieta</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Esqueleto pronto. Schema do banco, login e telas vêm nos próximos passos.
      </p>
    </main>
  )
}
