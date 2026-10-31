import { FilePlus2, HardDrive, Inbox } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useCurrentUser } from '@/features/auth/useAuth'
import { completedCount } from '@/features/studio/model/draft'
import { requestGroup, type RequestGroup } from '@/lib/domain/status'
import { formatRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { RequestCard } from './components'
import { useLocalOnlyDrafts, useMyRequests } from './useMyRequests'

const TABS: { key: 'all' | RequestGroup; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'active', label: 'กำลังดำเนินการ' },
  { key: 'drafts', label: 'ฉบับร่าง' },
  { key: 'done', label: 'เสร็จสิ้น' },
]

export default function MyRequestsPage() {
  const user = useCurrentUser()!
  const q = useMyRequests()
  const local = useLocalOnlyDrafts(user.id)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all')
  usePageMeta('คำขอของฉัน', undefined, { noindex: true })

  const rows = (q.data ?? []).filter((r) => tab === 'all' || requestGroup(r.status) === tab)
  const showLocal = tab === 'all' || tab === 'drafts'
  const counts = (k: RequestGroup) => (q.data ?? []).filter((r) => requestGroup(r.status) === k).length + (k === 'drafts' ? local.length : 0)

  return (
    <Page>
      <PageHeader
        title="คำขอของฉัน"
        description="ฉบับร่าง คำขอที่ส่งแล้ว และงานที่รอให้คุณตรวจ"
        actions={
          <LinkButton to="/studio" variant="primary" icon={<FilePlus2 size={18} />}>
            สร้างคำขอใหม่
          </LinkButton>
        }
      />
      <div className="no-scrollbar -mx-4 mb-5 overflow-x-auto px-4">
        <div role="tablist" aria-label="กรองคำขอ" className="inline-flex gap-1 rounded-2xl bg-surface-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn('min-h-10 rounded-xl px-4 text-sm font-medium whitespace-nowrap', tab === t.key ? 'bg-surface shadow-sm' : 'text-muted hover:text-ink')}
            >
              {t.label}
              {t.key !== 'all' && <span className="ml-1.5 text-xs text-muted tabular-nums">{counts(t.key)}</span>}
            </button>
          ))}
        </div>
      </div>

      {q.isPending ? (
        <PageSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : rows.length === 0 && (!showLocal || local.length === 0) ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title={tab === 'all' ? 'ยังไม่มีคำขอ' : 'ไม่มีรายการในหมวดนี้'}
          description="เริ่มจากเสนอไอเดียชุดสติกเกอร์ฟรี"
          actions={
            <LinkButton to="/studio" variant="primary">
              ไปที่สตูดิโอ
            </LinkButton>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {showLocal &&
            local.map((d) => (
              <li key={d.clientDraftId}>
                <Link
                  to={`/studio/new?type=${d.data.channel}&draft=${d.clientDraftId}`}
                  className="flex h-full flex-col rounded-3xl border border-dashed border-line-strong bg-surface p-4 hover:border-brown"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                    <HardDrive size={14} aria-hidden /> ฉบับร่างในเครื่องนี้ (ยังไม่ซิงก์)
                  </span>
                  <span className="mt-3 font-display text-lg break-words" lang="th">
                    {d.data.setName || 'ฉบับร่างยังไม่ตั้งชื่อ'}
                  </span>
                  <span className="mt-1 text-sm text-muted">
                    {completedCount(d.data)}/{d.data.stickerCount} ภาพ · แก้ล่าสุด {formatRelative(d.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          {rows.map((r) => (
            <li key={r.id}>
              <RequestCard request={r} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
