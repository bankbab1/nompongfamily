import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useCurrentUser } from '@/features/auth/useAuth'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { CUSTOMER_EDITABLE } from '@/lib/domain/status'
import { localDrafts } from '@/lib/storage/drafts'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { ConflictDialog } from '../components/ConflictDialog'
import { Wizard } from '../components/Wizard'
import { fromServer, type LocalDraft } from '../model/draft'
import { useTx } from '@/lib/i18n'

/**
 * /my/requests/:id/edit — reopen a server draft (or a request waiting for clarification).
 * If this device holds unsynced edits made against an older server version, the user
 * chooses which version wins before editing (spec §6.5 conflict resolution).
 */
export default function EditRequestPage() {
  const { id = '' } = useParams()
  const user = useCurrentUser()!
  const tx = useTx()
  usePageMeta(tx('แก้ไขคำขอ', 'Edit request'), undefined, { noindex: true })
  const q = useQuery({ queryKey: qk.request(id), queryFn: () => api.requests.getRequest(id), staleTime: 0 })
  const [initial, setInitial] = useState<LocalDraft | null>(null)
  const [pending, setPending] = useState<{ local: LocalDraft } | null>(null)

  useEffect(() => {
    const server = q.data
    if (!server || initial) return
    ;(async () => {
      const local = (await localDrafts.get(server.clientDraftId)) ?? (await localDrafts.findByServerId(server.id))
      const fresh = fromServer(server, user.id)
      if (local && local.dirty) {
        if (local.serverVersion === server.version) setInitial({ ...local, serverId: server.id, ownerId: user.id })
        else setPending({ local })
      } else {
        setInitial(local ? { ...fresh, step: local.step, activeSlot: local.activeSlot } : fresh)
      }
    })()
  }, [q.data, initial, user.id])

  if (q.isPending)
    return (
      <Page>
        <PageSkeleton />
      </Page>
    )
  if (q.isError)
    return (
      <Page>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Page>
    )

  const server = q.data
  if (!CUSTOMER_EDITABLE.includes(server.status))
    return (
      <Page narrow>
        <EmptyState
          icon={<Lock size={24} />}
          title={tx('บรีฟนี้ถูกล็อกแล้ว', 'This brief is locked')}
          description={tx(
            'คำขอที่ส่งแล้วหรืออนุมัติบรีฟแล้วแก้ไขโดยตรงไม่ได้ ถ้าต้องการเปลี่ยนแปลง ทีมงานจะเปิดให้แก้ผ่านขั้นตอนขอข้อมูลเพิ่มหรือรอบแก้ไขงาน',
            'A sent or approved brief can’t be edited directly. If changes are needed, the team will reopen it by asking for more information.',
          )}
          actions={
            <LinkButton to={`/my/requests/${server.id}`} variant="primary">
              {tx('กลับไปที่คำขอ', 'Back to the request')}
            </LinkButton>
          }
        />
      </Page>
    )

  if (pending)
    return (
      <Page>
        <ConflictDialog
          open
          local={pending.local}
          server={server}
          onResolve={(keep) => {
            const base = fromServer(server, user.id)
            setInitial(keep === 'server' ? base : { ...pending.local, ownerId: user.id, serverId: server.id, serverVersion: server.version, dirty: true })
            setPending(null)
          }}
        />
      </Page>
    )

  if (!initial)
    return (
      <Page>
        <PageSkeleton />
      </Page>
    )

  return <Wizard key={initial.clientDraftId} initial={initial} user={user} serverStatus={server.status} />
}
