import { type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

// Next 16 renamed `middleware.ts` → `proxy.ts`. Same semantics.
// For now this only refreshes the Supabase session cookie. Step 3 will add
// route protection: redirect unauthenticated users to /login and bounce
// authenticated users away from /login.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Match all paths except:
    //   - _next/static (build assets)
    //   - _next/image  (image optimization)
    //   - favicon.ico, sw.js, manifest.webmanifest
    //   - any file with an extension (e.g. /icons/icon-192.svg)
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.).*)",
  ],
}
