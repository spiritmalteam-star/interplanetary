"use client";

/* THE HOUSE'S SERVER-STATE CARRIER — TanStack Query rides above every
   room so fetched truth (wallet, ledger, analytics) is fetched once,
   deduped across windows, cached with gentle staleness, and never
   pinned across accounts: the cache breathes out on unmount of the
   account through gcTime, and every private query carries the owner's
   key so no two visitors can ever share a drawer. */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /* server truth is trusted briefly; refetch on focus keeps
               wallet balances honest without hammering the door */
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
