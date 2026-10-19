import { useQuery } from '@tanstack/react-query'
import { Factory } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, ErrorState, PageSkeleton, ProgressIndicator } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/AppShell'
import { ChannelBadge, StatusBadge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { QA_CHECKS } from '@/lib/api/types'
import { formatRelative } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'

export default function ProductionListPage() {
  usePageMeta('งานผลิต', undefined, { noindex: true })
  const q = useQuery({ queryKey: qk.admin.jobs, queryFn: () => api.admin.listProductionJobs() })
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="งานผลิต" description="ความคืบหน้ารายภาพ อัปโหลดเวอร์ชัน และปล่อยงานให้ลูกค้าตรวจ" />
      {q.isPending ? (
        <PageSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState icon={<Factory size={24} />} title="ยังไม่มีงานผลิต" description="งานจะถูกสร้างเมื่อเปลี่ยนสถานะคำขอเป็น “กำลังผลิต”" />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {q.data.map((j) => {
            const done = j.items.filter((i) => i.stage === 'approved' || i.stage === 'proof_uploaded').length
            const qa = QA_CHECKS.filter((c) => j.qa[c]).length
            return (
              <li key={j.requestId}>
                <Link to={`/admin/production/${j.requestId}`} className="block rounded-3xl border border-line bg-surface p-5 hover:border-line-strong">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={j.request.status} channel={j.request.channel} />
                    <ChannelBadge channel={j.request.channel} />
                  </div>
                  <p className="mt-2 font-display text-lg" lang="th">
                    {j.request.setName}
                  </p>
                  <p className="text-sm text-muted">
                    {j.requestId} · อัปเดต {formatRelative(j.request.updatedAt)}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressIndicator value={done} max={j.items.length} label="ภาพที่ส่งตรวจหรืออนุมัติแล้ว" className="flex-1" />
                    <span className="text-sm tabular-nums">
                      {done}/{j.items.length}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    QA {qa}/{QA_CHECKS.length}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
