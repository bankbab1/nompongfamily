import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, ChevronLeft, ChevronRight, ImageOff, Lock, RotateCcw, ThumbsUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Alert, EmptyState, ErrorState, PageSkeleton, ProgressIndicator } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { confirm } from '@/components/ui/ConfirmDialog'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { TextArea } from '@/components/ui/Field'
import { LinkButton } from '@/components/ui/LinkButton'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import type { ArtworkProof, ProofItem, ProofItemState } from '@/lib/api/types'
import { track } from '@/lib/analytics'
import { formatDateTime } from '@/lib/utils/format'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { ArtworkViewer, ProofStateBadge, RevisionComment } from './components'

type Filter = 'all' | ProofItemState

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอตรวจ' },
  { key: 'revision_requested', label: 'ขอแก้ไข' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
]

function ProofDetail({
  item,
  canReview,
  onReview,
  busy,
}: {
  item: ProofItem
  canReview: boolean
  onReview(decision: 'approve' | 'revise', comment?: string): Promise<void>
  busy: boolean
}) {
  const [mode, setMode] = useState<'idle' | 'revise'>('idle')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const latest = item.versions.at(-1)!

  useEffect(() => {
    setMode('idle')
    setComment('')
    setError(undefined)
  }, [item.itemId, latest.version])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
      <div className="lg:sticky lg:top-0">
        <ArtworkViewer key={`${item.itemId}-${latest.version}`} item={item} />
      </div>
      <div className="min-w-0 space-y-5">
      <dl className="grid gap-3 rounded-2xl bg-surface-muted p-4 text-sm">
        <div>
          <dt className="text-muted">ข้อความ</dt>
          <dd className="font-display text-lg" lang="th">
            {item.caption}
          </dd>
        </div>
        <div>
          <dt className="text-muted">ท่าทางที่ขอ</dt>
          <dd lang="th">{item.pose}</dd>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <div>
            <dt className="inline text-muted">เวอร์ชันล่าสุด: </dt>
            <dd className="inline font-medium">v{latest.version}</dd>
          </div>
          {item.approvedVersion && (
            <div>
              <dt className="inline text-muted">อนุมัติเวอร์ชัน: </dt>
              <dd className="inline font-medium">v{item.approvedVersion}</dd>
            </div>
          )}
        </div>
        {item.adminNote && (
          <div>
            <dt className="text-muted">โน้ตจากทีมงาน</dt>
            <dd lang="th">{item.adminNote}</dd>
          </div>
        )}
      </dl>

      {item.comments.length > 0 && (
        <section aria-label="ประวัติคอมเมนต์">
          <h3 className="mb-2 text-sm font-medium">คอมเมนต์</h3>
          <ul className="space-y-2">
            {item.comments.map((c) => (
              <RevisionComment key={c.id} comment={c} />
            ))}
          </ul>
        </section>
      )}

      {canReview &&
        (mode === 'revise' ? (
          <form noValidate
            className="space-y-3 rounded-2xl border border-line p-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!comment.trim()) {
                setError('กรุณาระบุสิ่งที่ต้องการให้แก้ (จำเป็น)')
                return
              }
              await onReview('revise', comment)
            }}
          >
            <TextArea
              label="ต้องการให้แก้อะไร"
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              error={error}
              placeholder="เช่น อยากให้ตาปรือกว่านี้ และขยับมือให้ปิดปากมากขึ้น"
              maxChars={1000}
              lang="th"
              autoFocus
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setMode('idle')}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="danger" loading={busy} icon={<RotateCcw size={16} />}>
                ส่งคำขอแก้ไข
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={<RotateCcw size={18} />} onClick={() => setMode('revise')} disabled={busy}>
              ขอแก้ไข
            </Button>
            <Button variant="success" icon={<ThumbsUp size={18} />} loading={busy} disabled={item.state === 'approved'} onClick={() => void onReview('approve')}>
              {item.state === 'approved' ? 'อนุมัติแล้ว' : `อนุมัติ v${latest.version}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProofReviewPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const req = useQuery({ queryKey: qk.request(id), queryFn: () => api.requests.getRequest(id) })
  const proof = useQuery({ queryKey: qk.proof(id), queryFn: () => api.requests.getProof(id) })
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  usePageMeta('ตรวจงาน', undefined, { noindex: true })

  useEffect(() => {
    if (proof.data) track('proof_opened', { request: id, round: proof.data.proofVersion })
  }, [proof.data?.proofVersion]) // eslint-disable-line react-hooks/exhaustive-deps

  const review = useMutation({
    mutationFn: (v: { itemId: string; decision: 'approve' | 'revise'; comment?: string }) => api.requests.reviewArtwork(id, v.itemId, v.decision, v.comment),
    onSuccess: (p, v) => {
      qc.setQueryData(qk.proof(id), p)
      qc.invalidateQueries({ queryKey: qk.request(id) })
      qc.invalidateQueries({ queryKey: qk.myRequests })
      track(v.decision === 'approve' ? 'artwork_approved' : 'revision_requested', { request: id })
      toast.success(v.decision === 'approve' ? 'อนุมัติภาพแล้ว' : 'ส่งคำขอแก้ไขแล้ว')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const finalApprove = useMutation({
    mutationFn: (p: ArtworkProof) => api.requests.approveFinalSet(id, p.proofVersion),
    onSuccess: (p) => {
      qc.setQueryData(qk.proof(id), p)
      qc.invalidateQueries({ queryKey: qk.request(id) })
      qc.invalidateQueries({ queryKey: qk.myRequests })
      toast.success('อนุมัติทั้งชุดเรียบร้อย ขอบคุณค่ะ!')
    },
    onError: (e) => {
      toast.error(errorMessage(e))
      qc.invalidateQueries({ queryKey: qk.proof(id) })
    },
  })

  const items = useMemo(() => proof.data?.items ?? [], [proof.data])
  const visible = items.filter((i) => filter === 'all' || i.state === filter)
  const openIndex = visible.findIndex((i) => i.itemId === openId)
  const open = items.find((i) => i.itemId === openId) ?? null

  if (req.isPending || proof.isPending)
    return (
      <Page>
        <PageSkeleton rows={6} />
      </Page>
    )
  if (req.isError || proof.isError)
    return (
      <Page>
        <ErrorState error={req.error ?? proof.error} onRetry={() => (req.refetch(), proof.refetch())} />
      </Page>
    )

  const r = req.data
  const p = proof.data
  if (!p)
    return (
      <Page narrow>
        <EmptyState
          icon={<ImageOff size={24} />}
          title="ยังไม่มีงานให้ตรวจ"
          description="เมื่อทีมงานส่งงานรอบแรก ภาพทั้งหมดจะแสดงที่นี่"
          actions={<LinkButton to={`/my/requests/${id}`}>กลับไปที่คำขอ</LinkButton>}
        />
      </Page>
    )

  const canReview = r.status === 'proof_ready' && !p.finalApproval
  const approved = items.filter((i) => i.state === 'approved').length
  const pending = items.filter((i) => i.state === 'pending').length
  const revising = items.filter((i) => i.state === 'revision_requested').length
  const allApproved = approved === items.length

  async function confirmFinal() {
    const ok = await confirm({
      title: 'อนุมัติทั้งชุด?',
      description: (
        <>
          <p>
            คุณกำลังอนุมัติงาน <strong>รอบที่ {p!.proofVersion}</strong> ทั้งหมด {items.length} ภาพ ระบบจะบันทึกเวอร์ชันที่อนุมัติของทุกภาพพร้อมเวลา
          </p>
          <p className="rounded-xl bg-surface-muted p-2 text-xs">{items.map((i) => `${pad2(i.position)}:v${i.approvedVersion}`).join('  ')}</p>
          <p className="text-muted">หลังอนุมัติ งานจะเป็นแบบอ่านอย่างเดียว และทีมงานจะเตรียมส่ง LINE Creators Market (ไม่รับประกันผลการอนุมัติของ LINE)</p>
        </>
      ),
      confirmLabel: 'อนุมัติทั้งชุด',
    })
    if (ok) finalApprove.mutate(p!)
  }

  return (
    <Page className="pb-32">
      <PageHeader
        eyebrow={`${r.id} · รอบที่ ${p.proofVersion} · ส่งเมื่อ ${formatDateTime(p.releasedAt)}`}
        title={<span lang="th">ตรวจงาน: {r.setName}</span>}
        description="แตะภาพเพื่อดูขนาดใหญ่ เทียบเวอร์ชัน และอนุมัติหรือขอแก้ไขทีละภาพ"
      />

      {p.finalApproval ? (
        <Alert tone="success" icon={<Lock size={18} />} title="อนุมัติทั้งชุดแล้ว — อ่านอย่างเดียว" className="mb-5">
          โดย {p.finalApproval.actorName} เมื่อ {formatDateTime(p.finalApproval.at)} (รอบที่ {p.finalApproval.proofVersion})
        </Alert>
      ) : r.status === 'revision_requested' ? (
        <Alert tone="info" title="ส่งคำขอแก้ไขแล้ว" className="mb-5">
          ทีมงานกำลังแก้ {revising} ภาพ เมื่อพร้อมจะส่งรอบใหม่ให้ตรวจ ภาพที่อนุมัติแล้วจะคงไว้
        </Alert>
      ) : null}

      <div className="mb-4 flex items-center gap-3">
        <ProgressIndicator value={approved} max={items.length} label="อนุมัติแล้ว" className="flex-1" />
        <span className="shrink-0 text-sm font-medium tabular-nums">
          อนุมัติ {approved}/{items.length}
        </span>
      </div>
      <p className="mb-4 text-sm text-muted">
        รอตรวจ {pending} · ขอแก้ไข {revising}
      </p>

      <div className="no-scrollbar -mx-4 mb-5 overflow-x-auto px-4">
        <div role="tablist" aria-label="กรองภาพ" className="inline-flex gap-1 rounded-2xl bg-surface-muted p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn('min-h-10 rounded-xl px-4 text-sm font-medium whitespace-nowrap', filter === f.key ? 'bg-surface shadow-sm' : 'text-muted')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((it) => (
          <li key={it.itemId}>
            <button
              type="button"
              onClick={() => setOpenId(it.itemId)}
              className={cn(
                'group w-full overflow-hidden rounded-2xl border-2 bg-surface text-left transition-colors',
                it.state === 'approved' ? 'border-success/40' : it.state === 'revision_requested' ? 'border-danger/40' : 'border-line hover:border-line-strong',
              )}
              aria-label={`ภาพ ${pad2(it.position)} ${it.caption} — ${it.state === 'approved' ? 'อนุมัติแล้ว' : it.state === 'pending' ? 'รอตรวจ' : 'ขอแก้ไข'}`}
            >
              <img src={it.versions.at(-1)!.imageUrl} alt="" loading="lazy" className="aspect-[37/32] w-full object-cover" draggable={false} />
              <div className="space-y-1.5 p-2.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display text-sm text-muted">
                    {pad2(it.position)} · v{it.versions.at(-1)!.version}
                  </span>
                </div>
                <ProofStateBadge state={it.state} />
                <p className="truncate text-sm font-medium" lang="th">
                  {it.caption}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Whole-set approval: only when every image is approved (FE-09). */}
      {canReview && (
        <div className="mobile-sticky-actions fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 border-t border-line bg-cream/95 px-4 pt-3 backdrop-blur lg:bottom-0">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {allApproved ? 'อนุมัติครบทุกภาพแล้ว พร้อมอนุมัติทั้งชุด' : `อนุมัติครบทุกภาพก่อน จึงอนุมัติทั้งชุดได้ (เหลือ ${items.length - approved} ภาพ)`}
            </p>
            <Button variant="accent" size="lg" icon={<CheckCheck size={20} />} disabled={!allApproved} loading={finalApprove.isPending} onClick={() => void confirmFinal()}>
              อนุมัติทั้งชุด
            </Button>
          </div>
        </div>
      )}

      <ResponsiveModal
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        size="xl"
        title={open ? `ภาพที่ ${pad2(open.position)}` : ''}
        description={open ? <ProofStateBadge state={open.state} /> : undefined}
        footer={
          open && (
            <div className="flex w-full items-center justify-between gap-2">
              <Button variant="ghost" icon={<ChevronLeft size={18} />} disabled={openIndex <= 0} onClick={() => setOpenId(visible[openIndex - 1]?.itemId ?? null)}>
                ก่อนหน้า
              </Button>
              <span className="text-sm text-muted tabular-nums">
                {openIndex + 1}/{visible.length}
              </span>
              <Button variant="ghost" iconRight={<ChevronRight size={18} />} disabled={openIndex < 0 || openIndex >= visible.length - 1} onClick={() => setOpenId(visible[openIndex + 1]?.itemId ?? null)}>
                ถัดไป
              </Button>
            </div>
          )
        }
      >
        {open && (
          <ProofDetail
            item={open}
            canReview={canReview}
            busy={review.isPending}
            onReview={async (decision, comment) => {
              await review.mutateAsync({ itemId: open.itemId, decision, comment }).catch(() => undefined)
            }}
          />
        )}
      </ResponsiveModal>
    </Page>
  )
}
