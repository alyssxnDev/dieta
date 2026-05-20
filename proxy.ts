import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

// Next 16 renomeou `middleware.ts` → `proxy.ts`. Mesma semântica.
// updateSession faz refresh de sessão + redirect de rotas autenticadas/login.
// Wrap em try/catch: se Supabase env tá ausente/quebrado, app continua subindo
// (renderiza /login que tem error state próprio).
export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch {
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    // Exclui: assets estáticos, image opt, favicon, sw.js, manifest, qualquer arquivo com extensão
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.).*)",
  ],
}
