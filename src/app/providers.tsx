import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ConfirmHost } from '@/components/ui/ConfirmDialog'
import { Toaster } from '@/components/feedback/Toast'
import { isApiError } from '@/lib/api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't hammer a server that said no; do retry flaky networks once.
      retry: (count, err) => count < 1 && isApiError(err, 'network'),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ConfirmHost />
      <Toaster />
    </QueryClientProvider>
  )
}
