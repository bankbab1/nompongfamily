import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox, inputClass } from '@/components/ui/Field'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import type { CommissionPackage, RequestStatus } from '@/lib/api/types'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
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

function PackageRow({ pkg }: { pkg: CommissionPackage }) {
  const qc = useQueryClient()
  const [p, setP] = useState(pkg)
  const dirty = JSON.stringify(p) !== JSON.stringify(pkg)
  const save = useMutation({
    mutationFn: () => api.admin.savePackage(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.admin.packages })
      qc.invalidateQueries({ queryKey: qk.packages })
      toast.success(`บันทึกแพ็กเกจ ${p.stickerCount} ภาพแล้ว`)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const cell = cn(inputClass, 'h-10 text-sm')
  return (
    <tr className="align-middle">
      <th scope="row" className="px-3 py-2 text-left font-display font-normal whitespace-nowrap">
        {p.stickerCount} ภาพ
      </th>
      <td className="px-2 py-2">
        <input aria-label={`ราคา ${p.stickerCount} ภาพ`} className={cn(cell, 'min-w-48')} value={p.priceLabel} onChange={(e) => setP({ ...p, priceLabel: e.target.value })} />
      </td>
      <td className="px-2 py-2">
        <input aria-label={`รอบแก้ ${p.stickerCount} ภาพ`} type="number" min={0} className={cn(cell, 'w-20')} value={p.revisionRounds} onChange={(e) => setP({ ...p, revisionRounds: Number(e.target.value) })} />
      </td>
      <td className="px-2 py-2">
        <input aria-label={`ระยะเวลา ${p.stickerCount} ภาพ`} type="number" min={1} className={cn(cell, 'w-20')} value={p.turnaroundDays} onChange={(e) => setP({ ...p, turnaroundDays: Number(e.target.value) })} />
      </td>
      <td className="px-2 py-2">
        <Checkbox label={<span className="sr-only">เปิดใช้ {p.stickerCount} ภาพ</span>} checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} />
      </td>
      <td className="px-2 py-2">
        <Button size="sm" variant="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>
          บันทึก
        </Button>
      </td>
    </tr>
  )
}

export default function SettingsPage() {
  usePageMeta('ตั้งค่า', undefined, { noindex: true })
  const pkgs = useQuery({ queryKey: qk.admin.packages, queryFn: () => api.admin.listPackages() })
  const admins = useQuery({ queryKey: qk.admin.admins, queryFn: () => api.admin.listAdmins() })
  const audit = useQuery({ queryKey: qk.admin.audit, queryFn: () => api.admin.audit() })

  if (pkgs.isPending) return <PageSkeleton />
  if (pkgs.isError) return <ErrorState error={pkgs.error} onRetry={() => pkgs.refetch()} />

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="ตั้งค่า" description="แพ็กเกจ สถานะ บทบาท และนโยบาย" />

      <Card>
        <h2 className="font-display text-xl">แพ็กเกจงานสั่งทำ</h2>
        <p className="mt-1 mb-4 text-sm text-muted">ข้อความราคาแสดงต่อลูกค้าตามที่กรอก ไม่มีการคำนวณหรือรับชำระเงินบนเว็บ</p>
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">จำนวน</th>
                <th scope="col" className="px-2 py-2 font-medium">ข้อความราคา</th>
                <th scope="col" className="px-2 py-2 font-medium">รอบแก้</th>
                <th scope="col" className="px-2 py-2 font-medium">วัน</th>
                <th scope="col" className="px-2 py-2 font-medium">เปิดใช้</th>
                <th scope="col" className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pkgs.data.map((p) => (
                <PackageRow key={p.id} pkg={p} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
