import { Briefcase, Lightbulb, Lock } from 'lucide-react'
import { Alert } from '@/components/feedback/States'
import { RadioCards } from '@/components/ui/Field'
import type { RequestChannel } from '@/lib/api/types'
import { useStudioContent } from '../content'

export function ChannelStep({ channel, locked, onChange }: { channel: RequestChannel; locked: boolean; onChange(c: RequestChannel): void }) {
  const { CHANNEL_INFO } = useStudioContent()
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-ink">คุณต้องการสร้างคำขอแบบไหน?</h2>
        <p className="mt-1 text-sm text-muted">ทั้งสองแบบใช้ฟอร์มบรีฟเดียวกัน ต่างกันที่เงื่อนไขและขั้นตอนหลังส่ง</p>
      </div>
      {locked && (
        <Alert tone="info" icon={<Lock size={18} />} title="ประเภทคำขอถูกล็อกแล้ว">
          คำขอที่ส่งแล้วเปลี่ยนประเภทไม่ได้ ถ้าต้องการอีกแบบ ให้สร้างฉบับร่างใหม่
        </Alert>
      )}
      <RadioCards<RequestChannel>
        name="channel"
        legend="ประเภทคำขอ"
        hideLegend
        value={channel}
        onChange={onChange}
        options={(['community', 'commission'] as const).map((c) => ({
          value: c,
          disabled: locked && c !== channel,
          icon: c === 'community' ? <Lightbulb size={22} /> : <Briefcase size={22} />,
          label: CHANNEL_INFO[c].title,
          description: (
            <>
              {CHANNEL_INFO[c].summary}
              <ul className="mt-2 list-disc space-y-0.5 pl-4">
                {CHANNEL_INFO[c].points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          ),
        }))}
      />
    </div>
  )
}
