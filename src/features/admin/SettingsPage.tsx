import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/AppShell'
import { IDEA_STATUS_INFO, IdeaStatusBadge } from '@/features/suggestions/IdeaStatus'
import { IDEA_STATUSES } from '@/features/suggestions/model'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { formatDateTime } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { TERMS_VERSION } from '@/lib/validation/brief'

export default function SettingsPage() {
  usePageMeta('ตั้งค่า', undefined, { noindex: true })
  const admins = useQuery({ queryKey: qk.admin.admins, queryFn: () => api.admin.listAdmins() })
  const audit = useQuery({ queryKey: qk.admin.audit, queryFn: () => api.admin.audit() })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="ตั้งค่า" description="สถานะไอเดีย ทีมงาน และนโยบาย" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-xl">สถานะไอเดีย</h2>
          <ul className="space-y-2">
            {IDEA_STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <IdeaStatusBadge status={s} />
                <span className="text-muted">{IDEA_STATUS_INFO[s].hint.th}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">ผู้ส่งไอเดียเห็นสถานะนี้ในการ์ดไอเดียและ My Nompong</p>
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
