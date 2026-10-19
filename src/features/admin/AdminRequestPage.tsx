import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Factory, History, Lock, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Card, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Badge, ChannelBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { Select, TextArea, TextField } from '@/components/ui/Field'
import { EventLog } from '@/features/requests/components'
import { api } from '@/lib/api'
import { errorMessage, isApiError } from '@/lib/api/errors'
import type { AdminRequestRow } from '@/lib/api/services'
import { qk } from '@/lib/api/queryKeys'
import type { Priority } from '@/lib/api/types'
import { adminTransitions, statusLabel, type Transition } from '@/lib/domain/status'
import { formatBytes, formatDateTime } from '@/lib/utils/format'
import { pad2 } from '@/lib/utils/id'
import { usePageMeta } from '@/lib/utils/usePageMeta'

function TransitionDialog({
  row,
  transition,
  onClose,
}: {
  row: AdminRequestRow
  transition: Transition | null
  onClose(): void
}) {
  const qc = useQueryClient()
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string>()
  const mut = useMutation({
    mutationFn: () => api.admin.transition(row.id, transition!.to, { message, storeUrl: url, version: row.version }),
    onSuccess: (r) => {
      qc.setQueryData(qk.admin.request(row.id), r)
      qc.invalidateQueries({ queryKey: qk.admin.all })
      toast.success(`เปลี่ยนสถานะเป็น “${statusLabel(r.status, r.channel)}” แล้ว`)
      setMessage('')
      setUrl('')
      onClose()
    },
    onError: (e) => {
      setError(errorMessage(e))
      if (isApiError(e, 'conflict')) qc.invalidateQueries({ queryKey: qk.admin.request(row.id) })
    },
  })
  if (!transition) return null
  return (
    <ResponsiveModal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`เปลี่ยนเป็น “${statusLabel(transition.to, row.channel)}”`}
      description={`${row.id} · ${row.setName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant={transition.danger ? 'danger' : 'primary'} loading={mut.isPending} onClick={() => mut.mutate()}>
            ยืนยัน
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextArea
          label={transition.needsMessage ? 'ข้อความถึงลูกค้า' : 'ข้อความถึงลูกค้า'}
          required={transition.needsMessage}
          optional={!transition.needsMessage}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          hint="ลูกค้าจะเห็นข้อความนี้ในไทม์ไลน์ของคำขอ (สำหรับโน้ตภายใน ให้ใช้ช่องโน้ตภายใน)"
          lang="th"
        />
        {transition.needsUrl && (
          <TextField label="ลิงก์ทางการใน LINE Store" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://store.line.me/stickershop/product/…" inputMode="url" />
        )}
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      </div>
    </ResponsiveModal>
  )
}

export default function AdminRequestPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: qk.admin.request(id), queryFn: () => api.admin.getRequest(id) })
  const admins = useQuery({ queryKey: qk.admin.admins, queryFn: () => api.admin.listAdmins() })
  const [transition, setTransition] = useState<Transition | null>(null)
  const [note, setNote] = useState('')
  usePageMeta(q.data ? `${q.data.id} (admin)` : 'Admin', undefined, { noindex: true })

  const onRow = (r: AdminRequestRow) => {
    qc.setQueryData(qk.admin.request(id), r)
    qc.invalidateQueries({ queryKey: ['admin', 'requests'] })
  }
  const addNote = useMutation({
    mutationFn: () => api.admin.addNote(id, note),
    onSuccess: (r) => {
      onRow(r)
      setNote('')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const meta = useMutation({
    mutationFn: (patch: Parameters<typeof api.admin.updateMeta>[1]) => api.admin.updateMeta(id, patch),
    onSuccess: (r) => {
      onRow(r)
      toast.success('บันทึกการมอบหมายแล้ว')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (q.isPending) return <PageSkeleton />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const r = q.data
  const transitions = adminTransitions(r.channel, r.status)
  const hasJob = ['brief_approved', 'in_production', 'proof_ready', 'revision_requested', 'artwork_approved', 'line_submitted', 'published'].includes(r.status)

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/admin/requests" className="mb-3 inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
        ← กล่องคำขอ
      </Link>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} channel={r.channel} />
          <ChannelBadge channel={r.channel} />
          {r.meta.priority === 'high' && <Badge tone="danger">ด่วน</Badge>}
        </div>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl" lang="th">
          {r.setName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {r.id} · {r.ownerName} · {r.stickerCount} ภาพ{r.fastworkReference && ` · Fastwork ${r.fastworkReference}`}
          {r.packageId && ` · ${r.packageId}`}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="mb-1 font-display text-xl">บรีฟ</h2>
            {r.theme && (
              <p className="mb-1 text-sm" lang="th">
                <span className="text-muted">ธีม: </span>
                {r.theme}
              </p>
            )}
            {r.notes && (
              <p className="mb-1 text-sm whitespace-pre-wrap" lang="th">
                <span className="text-muted">โน้ตจากลูกค้า: </span>
                {r.notes}
              </p>
            )}
            <div className="-mx-5 mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="bg-surface-muted text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-medium">#</th>
                    <th scope="col" className="px-3 py-2 font-medium">ข้อความ</th>
                    <th scope="col" className="px-3 py-2 font-medium">ท่าทาง</th>
                    <th scope="col" className="px-3 py-2 font-medium">เครื่องแต่งกาย/สี</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {r.items.slice(0, r.stickerCount).map((it) => (
                    <tr key={it.id} className="align-top">
                      <td className="px-5 py-2.5 font-display text-muted">{pad2(it.position)}</td>
                      <td className="px-3 py-2.5 font-display whitespace-pre-wrap" lang="th">
                        {it.caption}
                      </td>
                      <td className="px-3 py-2.5" lang="th">
                        {it.pose}
                      </td>
                      <td className="px-3 py-2.5 text-muted" lang="th">
                        {[it.clothingProps, it.colorNotes].filter(Boolean).join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {r.references.length > 0 && (
            <Card>
              <h2 className="mb-3 font-display text-xl">ภาพอ้างอิง ({r.references.length})</h2>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {r.references.map((ref) => (
                  <li key={ref.id}>
                    <img src={ref.url} alt={ref.name} className="aspect-square w-full rounded-xl object-cover" />
                    <p className="mt-1 truncate text-xs">{ref.name}</p>
                    <p className="text-xs text-muted">{formatBytes(ref.size)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 font-display text-xl">ไทม์ไลน์ (ลูกค้าเห็น)</h2>
            <EventLog events={r.timeline} />
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
              <History size={20} aria-hidden /> ประวัติบรีฟ
            </h2>
            {r.meta.snapshots.length === 0 ? (
              <p className="text-sm text-muted">ยังไม่มี</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {r.meta.snapshots.map((s, i) => (
                  <li key={s.at + i} className="rounded-2xl bg-surface-muted px-3 py-2">
                    ฉบับที่ {i + 1} · {formatDateTime(s.at)} · “{s.setName}” · {s.items.length} ภาพ
                    {i > 0 && (
                      <span className="text-muted">
                        {' '}
                        · เปลี่ยน {s.items.filter((it, j) => it.caption !== r.meta.snapshots[i - 1].items[j]?.caption || it.pose !== r.meta.snapshots[i - 1].items[j]?.pose).length} ภาพจากฉบับก่อน
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="mb-3 font-display text-lg">เปลี่ยนสถานะ</h2>
            {transitions.length === 0 ? (
              <p className="text-sm text-muted">
                {r.status === 'in_production' || r.status === 'revision_requested'
                  ? 'ปล่อยงานให้ลูกค้าตรวจจากหน้างานผลิต'
                  : r.status === 'proof_ready'
                    ? 'รอลูกค้าตรวจงาน'
                    : 'ไม่มีการเปลี่ยนสถานะที่ทำได้'}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {transitions.map((t) => (
                  <Button key={t.to} variant={t.danger ? 'secondary' : 'primary'} className={t.danger ? 'text-danger' : ''} onClick={() => setTransition(t)}>
                    → {statusLabel(t.to, r.channel)}
                  </Button>
                ))}
              </div>
            )}
            {hasJob && (
              <Link to={`/admin/production/${r.id}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                <Factory size={16} aria-hidden /> ไปที่งานผลิต <ArrowRight size={14} aria-hidden />
              </Link>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
              <Lock size={16} aria-hidden /> การมอบหมาย (ภายใน)
            </h2>
            <div className="space-y-3">
              <Select label="ผู้รับผิดชอบ" value={r.meta.assigneeId ?? ''} onChange={(e) => meta.mutate({ assigneeId: e.target.value || null })}>
                <option value="">— ยังไม่มอบหมาย —</option>
                {(admins.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName}
                  </option>
                ))}
              </Select>
              <Select label="ความสำคัญ" value={r.meta.priority} onChange={(e) => meta.mutate({ priority: e.target.value as Priority })}>
                <option value="high">สูง</option>
                <option value="normal">ปกติ</option>
                <option value="low">ต่ำ</option>
              </Select>
              <TextField label="กำหนดส่งภายใน" type="date" value={r.meta.deadline ?? ''} onChange={(e) => meta.mutate({ deadline: e.target.value || null })} />
            </div>
          </Card>

          <Card className="border-sunny-200 bg-sunny-50">
            <h2 className="mb-1 flex items-center gap-2 font-display text-lg">
              <StickyNote size={16} aria-hidden /> โน้ตภายใน
            </h2>
            <p className="mb-3 text-xs text-muted">ลูกค้าไม่เห็นส่วนนี้</p>
            <ul className="mb-3 space-y-2">
              {r.meta.notes.map((n) => (
                <li key={n.id} className="rounded-2xl bg-surface px-3 py-2 text-sm">
                  <p className="text-xs text-muted">
                    {n.authorName} · {formatDateTime(n.at)}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
            <form noValidate
              onSubmit={(e) => {
                e.preventDefault()
                if (note.trim()) addNote.mutate()
              }}
              className="space-y-2"
            >
              <TextArea label="เพิ่มโน้ตภายใน" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              <Button type="submit" size="sm" variant="secondary" loading={addNote.isPending} disabled={!note.trim()}>
                บันทึกโน้ต
              </Button>
            </form>
          </Card>
        </aside>
      </div>
      <TransitionDialog row={r} transition={transition} onClose={() => setTransition(null)} />
    </div>
  )
}
