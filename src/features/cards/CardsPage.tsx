import { CreditCard, Sparkles } from 'lucide-react'
import { Alert } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/** P2/P3 shell. Claims will be validated server-side; no blockchain or trading (spec §9.6). */
const SERIES = [
  { name: 'Series 1 — สวัสดีนมผง', cards: 24, status: 'กำลังออกแบบ' },
  { name: 'Series 2 — นมผงทั้งปี', cards: 24, status: 'วางแผน' },
]

export default function CardsPage() {
  usePageMeta('การ์ดสะสม', 'การ์ดสะสมนมผง — เร็วๆ นี้')
  return (
    <Page>
      <PageHeader title="การ์ดสะสมนมผง" description="การ์ดจริงที่สะสมได้ และอัลบั้มดิจิทัลใน My Nompong (เร็วๆ นี้)" />
      <ul className="grid gap-4 sm:grid-cols-2">
        {SERIES.map((s) => (
          <li key={s.name} className="flex gap-4 rounded-3xl border border-line bg-surface p-5">
            <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sunny to-peach">
              <CreditCard size={24} aria-hidden />
            </span>
            <div>
              <p className="font-display text-lg">{s.name}</p>
              <p className="text-sm text-muted">{s.cards} ใบ</p>
              <Badge tone="accent" className="mt-2" icon={<Sparkles size={12} aria-hidden />}>
                {s.status}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      <Alert tone="info" className="mt-6">
        การรับการ์ดด้วยรหัสจะตรวจสอบที่เซิร์ฟเวอร์ทุกครั้ง ไม่มีการซื้อขายหรือเทรดการ์ดบนเว็บไซต์
      </Alert>
    </Page>
  )
}
