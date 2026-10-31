import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import type { RequestStatus } from '@/lib/api/types'
import { formatDateTime } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { TERMS_VERSION } from '@/lib/validation/brief'

const ALL_STATUSES: RequestStatus[] = [
  'draft',
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

export default function SettingsPage() {
  usePageMeta('ตั้งค่า', undefined, { noindex: true })
  const admins = useQuery({ queryKey: qk.admin.admins, queryFn: () => api.admin.listAdmins() })
  const audit = useQuery({ queryKey: qk.admin.audit, queryFn: () => api.admin.audit() })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="ตั้งค่า" description="สถานะ บทบาท และนโยบาย" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-xl">สถานะคำขอ</h2>
          <ul className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => (
              <li key={s}>
                <StatusBadge status={s} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">ชื่อสถานะมาจาก locales/th.json — การเปลี่ยน state machine ต้องทำที่ backend</p>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl">ทีมงาน</h2>
          <ul className="space-y-1.5 text-sm">
            {(admins.data ?? []).map((a) => (
              <li key={a.id} className="flex justify-between gap-2">
                <span>{a.displayName}</span>
                <span className="text-muted">{a.role}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">การให้สิทธิ์จริงบังคับใช้ที่ backend เสมอ</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-1 font-display text-xl">นโยบาย</h2>
        <p className="text-sm">
          ข้อกำหนดฉบับปัจจุบัน: <strong>{TERMS_VERSION}</strong> — ทุกคำขอบันทึกฉบับที่ลูกค้ายอมรับพร้อมเวลา
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-xl">ประวัติการใช้งาน (audit)</h2>
        <ul className="divide-y divide-line text-sm">
          {(audit.data ?? []).slice(0, 30).map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-3 py-2">
              <span className="w-40 shrink-0 text-muted">{formatDateTime(a.at)}</span>
              <span className="font-medium">{a.actorName}</span>
              <span>{a.action}</span>
              <span className="text-muted">{a.target}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
