import { CreditCard, Sparkles } from 'lucide-react'
import { Alert } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { pick, useLocale, useTx } from '@/lib/i18n'

/** P2/P3 shell. Claims will be validated server-side; no blockchain or trading (spec §9.6). */
const SERIES = [
  { name: { th: 'Series 1 — สวัสดีนมผง', en: 'Series 1 — Hello Nompong' }, cards: 24, status: { th: 'กำลังออกแบบ', en: 'In design' } },
  { name: { th: 'Series 2 — นมผงทั้งปี', en: 'Series 2 — Nompong all year' }, cards: 24, status: { th: 'วางแผน', en: 'Planned' } },
]

export default function CardsPage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(tx('การ์ดสะสม', 'Collectible cards'), tx('การ์ดสะสมนมผง — เร็วๆ นี้', 'Nompong collectible cards — coming soon'))
  return (
    <Page>
      <PageHeader
        title={tx('การ์ดสะสมนมผง', 'Nompong collectible cards')}
        description={tx(
          'การ์ดจริงที่สะสมได้ และอัลบั้มดิจิทัลใน My Nompong (เร็วๆ นี้)',
          'Real cards to collect, plus a digital album in My Nompong (coming soon)',
        )}
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {SERIES.map((s) => (
          <li key={s.name.en} className="flex gap-4 rounded-3xl border border-line bg-surface p-5">
            <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sunny to-peach">
              <CreditCard size={24} aria-hidden />
            </span>
            <div>
              <p className="font-display text-lg">{pick(s.name, locale)}</p>
              <p className="text-sm text-muted">
                {s.cards} {tx('ใบ', 'cards')}
              </p>
              <Badge tone="accent" className="mt-2" icon={<Sparkles size={12} aria-hidden />}>
                {pick(s.status, locale)}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      <Alert tone="info" className="mt-6">
        {tx(
          'การรับการ์ดด้วยรหัสจะตรวจสอบที่เซิร์ฟเวอร์ทุกครั้ง ไม่มีการซื้อขายหรือเทรดการ์ดบนเว็บไซต์',
          'Card codes are always checked on the server. There is no buying, selling or trading of cards on this website.',
        )}
      </Alert>
    </Page>
  )
}
