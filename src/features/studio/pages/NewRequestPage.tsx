import { FilePlus2, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState, PageSkeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/features/auth/useAuth'
import type { RequestChannel } from '@/lib/api/types'
import { track } from '@/lib/analytics'
import { localDrafts } from '@/lib/storage/drafts'
import { formatRelative } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { completedCount, newDraft, type LocalDraft } from '../model/draft'
import { Wizard } from '../components/Wizard'

type Phase = { kind: 'loading' } | { kind: 'choose'; existing: LocalDraft } | { kind: 'missing' } | { kind: 'ready'; draft: LocalDraft }

/**
 * /studio/new?type=community|commission[&draft=<clientDraftId>]
 * The draft id lives in the URL, so a refresh (or accidental pull-to-refresh) reopens
 * the exact same draft from IndexedDB (FE-04, FE-12).
 */
export default function NewRequestPage() {
  const [params, setParams] = useSearchParams()
  const { data: user, isPending } = useSession()
  const type: RequestChannel = params.get('type') === 'commission' ? 'commission' : 'community'
  const draftId = params.get('draft')
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  usePageMeta(type === 'commission' ? 'สั่งทำชุดสติกเกอร์' : 'เสนอไอเดียสติกเกอร์', undefined, { noindex: true })

  useEffect(() => {
    if (isPending) return
    let cancelled = false
    ;(async () => {
      const uid = user?.id ?? null
      if (draftId) {
        const found = await localDrafts.get(draftId)
        if (cancelled) return
        if (found && (found.ownerId === null || found.ownerId === uid)) setPhase({ kind: 'ready', draft: found })
        else setPhase({ kind: 'missing' })
        return
      }
      const mine = (await localDrafts.listFor(uid)).filter((d) => d.data.channel === type && !d.serverId)
      if (cancelled) return
      if (mine[0]) setPhase({ kind: 'choose', existing: mine[0] })
      else start()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, isPending, user?.id, type])

  function start() {
    const d = newDraft(type, user?.id ?? null)
    track('draft_created', { channel: type })
    void localDrafts.put(d).then(() => setParams({ type, draft: d.clientDraftId }, { replace: true }))
  }

  function resume(d: LocalDraft) {
    setParams({ type, draft: d.clientDraftId }, { replace: true })
  }

  if (phase.kind === 'loading' || isPending)
    return (
      <Page>
        <PageSkeleton />
      </Page>
    )

  if (phase.kind === 'missing')
    return (
      <Page narrow>
        <EmptyState
          title="ไม่พบฉบับร่างนี้ในเครื่อง"
          description="ฉบับร่างอาจถูกส่งแล้ว ถูกลบ หรือสร้างจากอุปกรณ์อื่น ฉบับร่างที่ซิงก์แล้วดูได้ที่ “คำขอของฉัน”"
          actions={
            <Button variant="primary" icon={<FilePlus2 size={18} />} onClick={start}>
              เริ่มฉบับร่างใหม่
            </Button>
          }
        />
      </Page>
    )

  if (phase.kind === 'choose') {
    const d = phase.existing
    return (
      <Page narrow>
        <div className="rounded-3xl border border-line bg-surface p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sunny-100">
            <PenLine size={24} aria-hidden />
          </div>
          <h1 className="mt-4 font-display text-2xl">มีฉบับร่างที่ยังทำไม่เสร็จ</h1>
          <p className="mt-2 text-muted" lang="th">
            “{d.data.setName || 'ยังไม่ได้ตั้งชื่อ'}” · กรอกแล้ว {completedCount(d.data)}/{d.data.stickerCount} ภาพ · แก้ล่าสุด {formatRelative(d.updatedAt)}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="primary" size="lg" onClick={() => resume(d)}>
              ทำต่อจากเดิม
            </Button>
            <Button variant="secondary" size="lg" onClick={start}>
              เริ่มชุดใหม่
            </Button>
          </div>
        </div>
      </Page>
    )
  }

  return <Wizard key={phase.draft.clientDraftId} initial={phase.draft} user={user ?? null} />
}
