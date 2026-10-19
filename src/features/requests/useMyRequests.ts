import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { LocalDraft } from '@/features/studio/model/draft'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { localDrafts } from '@/lib/storage/drafts'

export function useMyRequests() {
  return useQuery({ queryKey: qk.myRequests, queryFn: () => api.requests.getMyRequests() })
}

/** Drafts that exist only on this device (never synced, or guest drafts). */
export function useLocalOnlyDrafts(userId: string | null) {
  const [drafts, setDrafts] = useState<LocalDraft[]>([])
  useEffect(() => {
    localDrafts.listFor(userId).then((all) => setDrafts(all.filter((d) => !d.serverId)))
  }, [userId])
  return drafts
}
