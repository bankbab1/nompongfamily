import { CheckCircle2, Copy } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from '@/components/feedback/Toast'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import type { StickerRequest } from '@/lib/api/types'

const NEXT_STEPS: Record<StickerRequest['channel'], string[]> = {
  community: [
    'ทีมงานจะอ่านไอเดียของคุณ อาจใช้เวลาสักระยะ',
    'ถ้าต้องการข้อมูลเพิ่ม เราจะขอผ่านหน้าคำขอ และคุณแก้ไขได้',
    'ถ้าได้รับเลือก สถานะจะเปลี่ยนเป็น “ได้รับเลือก” และชุดจะวางขายแบบสาธารณะ',
  ],
  commission: [],
}

export function SubmittedView({ request }: { request: StickerRequest }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 size={44} aria-hidden />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="mt-5 font-display text-3xl text-ink focus:outline-none">
        ส่งคำขอเรียบร้อย!
      </h1>
      <p className="mt-2 text-muted">ขอบคุณที่ร่วมสร้างโลกของนมผง</p>

      <div className="mt-6 rounded-3xl border border-line bg-surface p-5 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted">เลขที่คำขอ</p>
            <p className="font-display text-2xl tracking-wide" data-testid="request-id">
              {request.id}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Copy size={16} />}
            onClick={() => navigator.clipboard?.writeText(request.id).then(() => toast.success('คัดลอกเลขที่คำขอแล้ว'))}
          >
            คัดลอก
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          สถานะ: <StatusBadge status={request.status} channel={request.channel} />
        </div>
        <h2 className="mt-5 font-display text-lg">ขั้นตอนถัดไป</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
          {NEXT_STEPS[request.channel].map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <LinkButton to={`/my/requests/${request.id}`} variant="primary" size="lg">
          ดูรายละเอียดคำขอ
        </LinkButton>
        <LinkButton to="/my/requests" variant="secondary" size="lg">
          คำขอทั้งหมดของฉัน
        </LinkButton>
      </div>
    </div>
  )
}
