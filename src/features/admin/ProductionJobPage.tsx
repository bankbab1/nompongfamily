import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Send, Sparkles, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert, Card, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { ChannelBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { confirm } from '@/components/ui/ConfirmDialog'
import { Checkbox, InlineSelect } from '@/components/ui/Field'
import { ProofStateBadge } from '@/features/proofs/components'
import { stickerArt } from '@/lib/api/mock/art'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import { QA_CHECKS, type ProductionItem, type ProductionStage, type QaCheck } from '@/lib/api/types'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const STAGES: { value: ProductionStage; label: string }[] = [
  { value: 'pending', label: 'รอเริ่ม' },
  { value: 'designing', label: 'กำลังออกแบบ' },
  { value: 'qa', label: 'QA' },
  { value: 'proof_uploaded', label: 'ส่งตรวจแล้ว' },
  { value: 'revision', label: 'แก้ไข' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
]

const QA_LABEL: Record<QaCheck, string> = {
  thaiSpelling: 'ตรวจคำสะกดภาษาไทยตรงกับบรีฟทุกตัวอักษร',
  characterConsistency: 'คาแรกเตอร์ตรงกับต้นแบบที่อนุมัติ',
  transparentBackground: 'พื้นหลังโปร่งใส',
  lineSpecs: 'ตรงตามสเปกล่าสุดของ LINE Creators Market',
}

function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(file)
  })
}

export default function ProductionJobPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: qk.admin.job(id), queryFn: () => api.admin.getProductionJob(id) })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadFor, setUploadFor] = useState<ProductionItem | null>(null)
  usePageMeta('งานผลิต', undefined, { noindex: true })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.admin.job(id) })
    qc.invalidateQueries({ queryKey: qk.admin.jobs })
  }
  const stage = useMutation({
    mutationFn: (v: { itemId: string; stage: ProductionStage }) => api.admin.setStage(id, v.itemId, v.stage),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  })
  const upload = useMutation({
    mutationFn: (v: { itemId: string; dataUrl: string; note?: string }) => api.admin.uploadArtwork(id, v.itemId, { dataUrl: v.dataUrl, note: v.note }),
    onSuccess: () => {
      refresh()
      toast.success('อัปโหลดเวอร์ชันใหม่แล้ว')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const qa = useMutation({
    mutationFn: (v: { check: QaCheck; value: boolean }) => api.admin.setQa(id, v.check, v.value),
    onSuccess: refresh,
  })
  const release = useMutation({
    mutationFn: () => api.admin.releaseProof(id),
    onSuccess: (p) => {
      refresh()
      qc.invalidateQueries({ queryKey: qk.admin.all })
      toast.success(`ปล่อยงานรอบที่ ${p.proofVersion} ให้ลูกค้าตรวจแล้ว`)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (q.isPending) return <PageSkeleton />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const job = q.data
  const r = job.request
  const proofState = new Map(job.proof?.items.map((p) => [p.itemId, p]) ?? [])
  const canRelease = r.channel === 'commission' && ['in_production', 'revision_requested'].includes(r.status)
  const needsNew = job.items.filter((it) => {
    if (proofState.get(it.itemId)?.state === 'approved') return false
    const latest = it.versions.at(-1)?.version ?? 0
    return latest === 0 || latest <= (it.releasedVersion ?? 0)
  })
  const qaDone = QA_CHECKS.every((c) => job.qa[c])

  async function confirmRelease() {
    const ok = await confirm({
      title: 'ปล่อยงานให้ลูกค้าตรวจ?',
      description: `ลูกค้าจะเห็นภาพเวอร์ชันล่าสุดของทุกภาพที่ยังไม่อนุมัติ (${job.items.length - job.items.filter((i) => proofState.get(i.itemId)?.state === 'approved').length} ภาพ) เป็นรอบที่ ${(job.proof?.proofVersion ?? 0) + 1}`,
      confirmLabel: 'ปล่อยงาน',
    })
    if (ok) release.mutate()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/admin/production" className="mb-3 inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
        ← งานผลิต
      </Link>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.status} channel={r.channel} />
            <ChannelBadge channel={r.channel} />
            {job.proof && <span className="text-sm text-muted">proof รอบล่าสุด: {job.proof.proofVersion}</span>}
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl" lang="th">
            {r.setName}
          </h1>
          <Link to={`/admin/requests/${r.id}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium">
            {r.id} — ดูบรีฟและสถานะ <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        {canRelease && (
          <Button variant="accent" size="lg" icon={<Send size={18} />} loading={release.isPending} disabled={needsNew.length > 0 || !qaDone} onClick={() => void confirmRelease()}>
            ปล่อยงานให้ลูกค้าตรวจ
          </Button>
        )}
      </header>

      {canRelease && (needsNew.length > 0 || !qaDone) && (
        <Alert tone="warning" className="mb-5" title="ยังปล่อยงานไม่ได้">
          {needsNew.length > 0 && <p>ต้องอัปโหลดเวอร์ชันใหม่ของภาพ: {needsNew.map((n) => pad2(n.position)).join(', ')}</p>}
          {!qaDone && <p>ต้องผ่าน QA checklist ครบทุกข้อ</p>}
        </Alert>
      )}
      {r.channel === 'community' && (
        <Alert tone="info" className="mb-5">
          ชุด Community ผลิตภายใน ไม่มีรอบให้ลูกค้าตรวจ เมื่อเสร็จให้เปลี่ยนสถานะเป็น “ส่ง LINE แล้ว” ที่หน้าคำขอ
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
          {job.items.map((it) => {
            const p = proofState.get(it.itemId)
            const latest = it.versions.at(-1)
            const lastComment = p?.comments.filter((c) => c.actor === 'customer').at(-1)
            return (
              <li key={it.itemId} className={cn('rounded-3xl border bg-surface p-3', p?.state === 'revision_requested' ? 'border-danger/40' : 'border-line')}>
                <div className="flex gap-3">
                  {latest ? (
                    <img src={latest.imageUrl} alt={`ภาพ ${pad2(it.position)} v${latest.version}`} className="h-24 w-24 shrink-0 rounded-2xl border border-line object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-line-strong text-xs text-muted">ยังไม่มีไฟล์</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display">
                      {pad2(it.position)} <span className="font-sans text-sm" lang="th">{it.caption}</span>
                    </p>
                    <p className="line-clamp-2 text-xs text-muted" lang="th">
                      {it.pose}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      {latest && <span className="rounded-md bg-surface-muted px-1.5">v{latest.version}</span>}
                      {it.releasedVersion && <span className="text-muted">ส่งตรวจ v{it.releasedVersion}</span>}
                      {p && <ProofStateBadge state={p.state} />}
                    </div>
                  </div>
                </div>
                {lastComment && p?.state === 'revision_requested' && (
                  <p className="mt-2 rounded-2xl bg-danger-soft px-3 py-2 text-sm" lang="th">
                    <span className="text-xs text-muted">ลูกค้า (v{lastComment.artworkVersion}): </span>
                    {lastComment.body}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <InlineSelect aria-label={`ขั้นตอนของภาพ ${pad2(it.position)}`} value={it.stage} className="min-w-36 flex-1" onChange={(e) => stage.mutate({ itemId: it.itemId, stage: e.target.value as ProductionStage })}>
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </InlineSelect>
                  {p?.state !== 'approved' && (
                    <>
                      <Button size="sm" variant="secondary" iconOnly label={`อัปโหลดไฟล์ภาพ ${pad2(it.position)}`} icon={<Upload size={16} />} onClick={() => {
                        setUploadFor(it)
                        fileRef.current?.click()
                      }} />
                      <Button
                        size="sm"
                        variant="ghost"
                        iconOnly
                        label="สร้างภาพตัวอย่าง (mock)"
                        icon={<Sparkles size={16} />}
                        onClick={() =>
                          upload.mutate({
                            itemId: it.itemId,
                            dataUrl: stickerArt({ position: it.position, caption: it.caption, version: (latest?.version ?? 0) + 1 }),
                            note: lastComment ? 'แก้ตามคอมเมนต์แล้ว' : undefined,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <aside className="space-y-6">
          <Card>
            <h2 className="mb-2 font-display text-lg">QA checklist</h2>
            {QA_CHECKS.map((c) => (
              <Checkbox key={c} label={QA_LABEL[c]} checked={job.qa[c]} onChange={(e) => qa.mutate({ check: c, value: e.target.checked })} />
            ))}
          </Card>
          <Card>
            <h2 className="mb-2 font-display text-lg">การส่ง LINE</h2>
            <p className="text-sm text-muted">
              {job.lineSubmission?.storeUrl ? (
                <a href={job.lineSubmission.storeUrl} target="_blank" rel="noopener noreferrer" className="break-all underline">
                  {job.lineSubmission.storeUrl}
                </a>
              ) : job.lineSubmission?.submittedAt ? (
                'ส่งให้ LINE พิจารณาแล้ว — เมื่ออนุมัติ ให้บันทึกลิงก์ร้านที่หน้าคำขอ (สถานะ “วางขายแล้ว”)'
              ) : (
                'บันทึกสถานะการส่งและลิงก์ร้านทางการผ่านการเปลี่ยนสถานะที่หน้าคำขอ'
              )}
            </p>
          </Card>
        </aside>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f && uploadFor) upload.mutate({ itemId: uploadFor.itemId, dataUrl: await readFile(f) })
          e.target.value = ''
        }}
      />
    </div>
  )
}
