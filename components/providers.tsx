"use client"

import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { useState } from "react"

// Storage noop pro SSR (não há localStorage no server). No client, usa o real.
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados "frescos" por 30s; depois refetch em background ao reusar.
            staleTime: 30 * 1000,
            // Cache em memória dura 24h sem uso (>= maxAge do persister).
            gcTime: 24 * 60 * 60 * 1000,
            // PWA de casal: ao reabrir (foco) ou reconectar, busca dados novos
            // — assim um vê o que o outro mexeu.
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      }),
  )

  // Persiste o cache em localStorage. Ao reabrir o PWA, a UI hidrata
  // instantâneo com o último estado conhecido e revalida em background —
  // some o "skeleton → espera rede → dados" a cada abertura.
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : noopStorage,
      key: "dieta:query-cache",
      throttleTime: 1000,
    }),
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24h
        // Bump essa string quando o shape dos dados mudar (invalida cache antigo).
        // v2: foods agora carregam `category` nas refeições.
        buster: "v2",
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
