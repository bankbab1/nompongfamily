import { useQuery } from '@tanstack/react-query'
import { Inbox, Search } from 'lucide-react'
import { useDeferredValue } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/AppShell'
import { Badge, ChannelBadge, StatusBadge } from '@/components/ui/Badge'
import { InlineSelect, inputClass } from '@/components/ui/Field'
import { api } from '@/lib/api'
import type { AdminRequestFilter } from '@/lib/api/services'
import { qk } from '@/lib/api/queryKeys'
import type { RequestStatus } from '@/lib/api/types'
import { statusLabel } from '@/lib/domain/status'
import { formatDate, formatRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const VIEWS: { key: NonNullable<AdminRequestFilter['view']>; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'new', label: 'ใหม่' },
  { key: 'clarification', label: 'รอข้อมูลเพิ่ม' },
  { key: 'ready', label: 'พร้อมผลิต' },
  { key: 'waiting', label: 'รอลูกค้า' },
  { key: 'published', label: 'วางขายแล้ว' },
]

const STATUSES: RequestStatus[] = [
  'submitted',
  'under_review',
  'clarification_requested',
  'accepted',
  'declined',
  'brief_approved',
  'in_production',
  'proof_ready',
  'revision_requested',
  'artwork_approved',
  'line_submitted',
  'published',
  'closed',
]

const PRIORITY = { high: { label: 'สูง', tone: 'danger' }, normal: { label: 'ปกติ', tone: 'neutral' }, low: { label: 'ต่ำ', tone: 'neutral' } } as const

/** Table on desktop, stacked cards on mobile (spec §10). Filters live in the URL so views are shareable. */
export default function InboxPage() {
  usePageMeta('กล่องคำขอ', undefined, { noindex: true })
  const [params, setParams] = useSearchParams()
  const filter: AdminRequestFilter = {
    view: (params.get('view') as AdminRequestFilter['view']) ?? 'all',
    channel: (params.get('channel') as AdminRequestFilter['channel']) ?? 'all',
    status: (params.get('status') as AdminRequestFilter['status']) ?? 'all',
    q: params.get('q') ?? '',
  }
  const dq = useDeferredValue(filter.q)
  const query = { ...filter, q: dq }
  const admins = useQuery({ queryKey: qk.admin.admins, queryFn: () => api.admin.listAdmins() })
  const rows = useQuery({ queryKey: qk.admin.requests(query), queryFn: () => api.admin.listRequests(query), placeholderData: (p) => p })

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (!v || v === 'all') next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }
  const adminName = (id?: string) => admins.data?.find((a) => a.id === id)?.displayName ?? '—'

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="กล่องคำขอ" description="ค้นหาด้วยเลขที่คำขอ ชื่อชุด ชื่อลูกค้า หรือเลข Fastwork" />

      <div className="no-scrollbar -mx-4 mb-4 overflow-x-auto px-4 lg:-mx-8 lg:px-8">
        <div role="tablist" aria-label="มุมมองที่บันทึกไว้" className="inline-flex gap-1 rounded-2xl bg-surface-muted p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={filter.view === v.key}
              onClick={() => set('view', v.key)}
              className={cn('min-h-10 rounded-xl px-4 text-sm font-medium whitespace-nowrap', filter.view === v.key ? 'bg-surface shadow-sm' : 'text-muted')}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_11rem_13rem]">
        <label className="relative">
          <span className="sr-only">ค้นหา</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={filter.q} onChange={(e) => set('q', e.target.value)} placeholder="ค้นหา…" className={cn(inputClass, 'h-10 pl-9 text-sm')} />
        </label>
        <InlineSelect aria-label="ประเภท" value={filter.channel} onChange={(e) => set('channel', e.target.value)}>
          <option value="all">ทุกประเภท</option>
          <option value="community">Community</option>
          <option value="commission">Commission</option>
        </InlineSelect>
        <InlineSelect aria-label="สถานะ" value={filter.status} onChange={(e) => set('status', e.target.value)}>
          <option value="all">ทุกสถานะ</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </InlineSelect>
      </div>

      {rows.isPending ? (
        <PageSkeleton />
      ) : rows.isError ? (
        <ErrorState error={rows.error} onRetry={() => rows.refetch()} />
      ) : rows.data.length === 0 ? (
        <EmptyState icon={<Inbox size={24} />} title="ไม่มีคำขอตามตัวกรองนี้" />
      ) : (
        <>
          <p className="mb-2 text-sm text-muted" aria-live="polite">
            {rows.data.length} รายการ
          </p>
          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {rows.data.map((r) => (
              <li key={r.id}>
                <Link to={`/admin/requests/${r.id}`} className="block rounded-3xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} channel={r.channel} />
                    <ChannelBadge channel={r.channel} />
                    {r.meta.priority === 'high' && <Badge tone="danger">ด่วน</Badge>}
                  </div>
                  <p className="mt-2 font-display text-lg" lang="th">
                    {r.setName}
                  </p>
                  <p className="text-sm text-muted">
                    {r.id} · {r.ownerName} · {r.stickerCount} ภาพ · {formatRelative(r.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-3xl border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs text-muted">
                <tr>
                  {['เลขที่', 'ชื่อชุด', 'ลูกค้า', 'ประเภท', 'สถานะ', 'ภาพ', 'ผู้รับผิดชอบ', 'กำหนด', 'อัปเดต'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2.5 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.data.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-muted/60">
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                      <Link to={`/admin/requests/${r.id}`} className="font-medium underline-offset-2 hover:underline">
                        {r.id}
                      </Link>
                    </td>
                    <td className="max-w-56 truncate px-3 py-2.5" lang="th">
                      {r.setName}
                      {r.meta.priority === 'high' && (
                        <Badge tone={PRIORITY.high.tone} className="ml-2">
                          ด่วน
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.ownerName}</td>
                    <td className="px-3 py-2.5">
                      <ChannelBadge channel={r.channel} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={r.status} channel={r.channel} />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{r.stickerCount}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{adminName(r.meta.assigneeId)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.meta.deadline ? formatDate(r.meta.deadline) : '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted">{formatRelative(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
