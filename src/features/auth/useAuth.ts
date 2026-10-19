import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import type { User } from '@/lib/api/types'
import { setLocale } from '@/lib/i18n'
import { localDrafts } from '@/lib/storage/drafts'

export function useSession() {
  return useQuery({
    queryKey: qk.session,
    queryFn: async () => {
      const u = await api.auth.getSession()
      if (u) setLocale(u.locale)
      return u
    },
    staleTime: Infinity,
  })
}

export function useCurrentUser(): User | null {
  return useSession().data ?? null
}

export function useSignIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (personaId: string) => {
      const user = await api.auth.signInAs(personaId)
      // Guest drafts made on this device become this user's so they can sync and submit.
      await localDrafts.adoptGuestDrafts(user.id)
      return user
    },
    onSuccess: (user) => {
      qc.clear()
      qc.setQueryData(qk.session, user)
    },
  })
}

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, clearLocalDrafts }: { userId: string; clearLocalDrafts: boolean }) => {
      if (clearLocalDrafts) await localDrafts.removeOwnedBy(userId)
      await api.auth.signOut()
    },
    onSuccess: () => {
      qc.clear()
      qc.setQueryData(qk.session, null)
    },
  })
}
