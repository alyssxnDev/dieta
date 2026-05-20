import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Called from the root proxy.ts (Next 16 renamed `middleware` → `proxy`).
// Refreshes the Supabase auth session cookie on every matched request.
// In step 3 this will be extended with route protection / redirect logic.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: keep this call between `createServerClient` and `return supabaseResponse`.
  // It triggers token refresh and writes the new cookies onto supabaseResponse.
  await supabase.auth.getUser()

  return supabaseResponse
}
