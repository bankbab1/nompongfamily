import { Copy } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NompongMascot } from '@/features/nompong/Mascot'
import { toast } from '@/components/feedback/Toast'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import type { StickerRequest } from '@/lib/api/types'
import { pick, useLocale, useTx } from '@/lib/i18n'

const NEXT_STEPS: Record<StickerRequest['channel'], { th: string; en: string }[]> = {
  community: [
    { th: 'ทีมงานจะอ่านไอเดียของคุณ อาจใช้เวลาสักระยะ', en: 'The team will read your idea. This can take a while.' },
    { th: 'ถ้าต้องการข้อมูลเพิ่ม เราจะขอผ่านหน้าคำขอ และคุณแก้ไขได้', en: 'If we need more details, we’ll ask on the request page and you can edit it.' },
    {
      th: 'ถ้าได้รับเลือก สถานะจะเปลี่ยนเป็น “ได้รับเลือก” และชุดจะวางขายแบบสาธารณะ',
      en: 'If it’s chosen, the status changes to “Selected” and the set goes on public sale.',
    },
  ],
  commission: [],
}

export function SubmittedView({ request }: { request: StickerRequest }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const locale = useLocale()
  const tx = useTx()
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <NompongMascot pose="success" className="mx-auto h-40 w-40" decorative />
      <h1 ref={headingRef} tabIndex={-1} className="mt-5 font-display text-3xl text-ink focus:outline-none">
        {tx('ส่งคำขอเรียบร้อย!', 'Request sent!')}
      </h1>
      <p className="mt-2 text-muted">{tx('ขอบคุณที่ร่วมสร้างโลกของนมผง', 'Thank you for helping build Nompong’s world')}</p>

      <div className="mt-6 rounded-3xl border border-line bg-surface p-5 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted">{tx('เลขที่คำขอ', 'Request number')}</p>
            <p className="font-display text-2xl tracking-wide" data-testid="request-id">
              {request.id}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Copy size={16} />}
            onClick={() => navigator.clipboard?.writeText(request.id).then(() => toast.success(tx('คัดลอกเลขที่คำขอแล้ว', 'Request number copied')))}
          >
            {tx('คัดลอก', 'Copy')}
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          {tx('สถานะ', 'Status')}: <StatusBadge status={request.status} channel={request.channel} />
        </div>
        <h2 className="mt-5 font-display text-lg">{tx('ขั้นตอนถัดไป', 'What happens next')}</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
          {NEXT_STEPS[request.channel].map((s) => (
            <li key={s.en}>{pick(s, locale)}</li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <LinkButton to={`/my/requests/${request.id}`} variant="primary" size="lg">
          {tx('ดูรายละเอียดคำขอ', 'See request details')}
        </LinkButton>
        <LinkButton to="/my/requests" variant="secondary" size="lg">
          {tx('คำขอทั้งหมดของฉัน', 'All my requests')}
        </LinkButton>
      </div>
    </div>
  )
}
