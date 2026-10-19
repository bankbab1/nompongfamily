import { useSyncExternalStore } from 'react'
import { isReachable } from '@/lib/api/mock/db'

/** Browser connectivity (plus the mock "simulate offline" switch while the mock adapter is active). */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
      }
    },
    () => isReachable(),
  )
}
