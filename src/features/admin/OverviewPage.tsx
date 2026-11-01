import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Clock, Factory, Inbox, Store } from 'lucide-react'
import { Link } from 'react-router'
import { Card, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/AppShell'
import { ChannelBadge, StatusBadge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import type { RequestStatus } from '@/lib/api/types'
import { statusLabel } from '@/lib/domain/status'
import { formatRelative } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/** Statuses where the studio holds the ball. */
const STUDIO_TURN: RequestStatus[] = ['submitted', 'under_review', 'accepted', 'brief_approved', 'revision_requested', 'artwork_approved', 'line_submitted']

export default function OverviewPage() {
  usePageMeta('Admin', undefined, { noindex: true })
  const metrics = useQuery({ queryKey: qk.admin.metrics, queryFn: () => api.admin.metrics() })
  const queue = useQuery({ queryKey: qk.admin.requests({}), queryFn: () => api.admin.listRequests({}) })
  const audit = useQuery({ queryKey: qk.admin.audit, queryFn: () => api.admin.audit() })

  if (metrics.isPending) return <PageSkeleton />
  if (metrics.isError) return <ErrorState error={metrics.error} onRetry={() => metrics.refetch()} />
  const m = metrics.data
  const work = (queue.data ?? []).filter((r) => STUDIO_TURN.includes(r.status))

  const tiles = [
    { label: 'คำขอใหม่ (7 วัน)', value: m.newThisWeek, icon: Inbox, to: '/admin/requests?view=new' },
    { label: 'รอลูกค้า', value: m.awaitingCustomer, icon: Clock, to: '/admin/requests?view=waiting' },
    { label: 'กำลังผลิต', value: m.inProduction, icon: Factory, to: '/admin/production' },
    { label: 'วางขายแล้ว', value: m.published, icon: Store, to: '/admin/requests?view=published' },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="ภาพรวมสตูดิโอ" description="งานที่ต้องทำและสถานะคำขอทั้งหมด" />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link to={t.to} className="flex h-full flex-col rounded-3xl border border-line bg-surface p-4 hover:border-line-strong">
              <t.icon size={20} className="text-muted" aria-hidden />
              <span className="mt-3 font-display text-3xl tabular-nums">{t.value}</span>
              <span className="text-sm text-muted">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">คิวงานของสตูดิโอ ({work.length})</h2>
            <Link to="/admin/requests" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium">
              กล่องคำขอ <ChevronRight size={16} aria-hidden />
            </Link>
          </div>
          {work.length === 0 ? (
            <p className="text-sm text-muted">ไม่มีงานค้าง 🎉</p>
          ) : (
            <ul className="divide-y divide-line">
              {work.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <Link to={`/admin/requests/${r.id}`} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:bg-surface-muted/60">
                    <span className="w-24 shrink-0 text-sm text-muted tabular-nums">{r.id}</span>
                    <span className="min-w-0 flex-1 truncate font-medium" lang="th">
                      {r.setName}
                    </span>
                    <ChannelBadge channel={r.channel} />
                    <StatusBadge status={r.status} channel={r.channel} />
                    <span className="text-xs text-muted">{formatRelative(r.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-display text-lg">ตามสถานะ</h2>
            <ul className="space-y-1.5 text-sm">
              {Object.entries(m.byStatus).map(([s, n]) => (
                <li key={s} className="flex justify-between gap-2">
                  <span>{statusLabel(s as RequestStatus)}</span>
                  <span className="font-medium tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-3 font-display text-lg">กิจกรรมล่าสุด</h2>
            <ul className="space-y-2 text-sm">
              {(audit.data ?? []).slice(0, 6).map((a) => (
                <li key={a.id}>
                  <span className="font-medium">{a.actorName}</span> <span className="text-muted">{a.action}</span> · {a.target}
                  <span className="block text-xs text-muted">{formatRelative(a.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
