import { Backpack, Gift, KeyRound, Shirt, Sticker, ToyBrick } from 'lucide-react'
import { Alert } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { pick, useLocale, useTx } from '@/lib/i18n'

/**
 * P2 shell: category preview only. Never shows fake stock, prices or checkout (spec §9.5) —
 * products appear here once inventory is real.
 */
const CATEGORIES = [
  { icon: Sticker, name: { th: 'สติกเกอร์แผ่น', en: 'Sticker sheets' } },
  { icon: KeyRound, name: { th: 'พวงกุญแจ', en: 'Keychains' } },
  { icon: Shirt, name: { th: 'เสื้อและหมวก', en: 'Shirts and caps' } },
  { icon: Backpack, name: { th: 'กระเป๋า', en: 'Bags' } },
  { icon: ToyBrick, name: { th: 'ตุ๊กตา / ฟิกเกอร์', en: 'Plush toys / figures' } },
  { icon: Gift, name: { th: 'ของขวัญเทศกาล', en: 'Festival gifts' } },
]

export default function ShopPage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(tx('ร้านค้า', 'Shop'), tx('สินค้าของนมผง — เร็วๆ นี้', 'Nompong merchandise — coming soon'))
  return (
    <Page>
      <PageHeader
        title={tx('ร้านค้า nompong family', 'nompong family shop')}
        description={tx(
          'สินค้าจริงของนมผงกำลังจะมา ติดตามประกาศเปิดขายได้ที่หน้าแรก',
          'Real Nompong merchandise is on the way. Watch the home page for the launch.',
        )}
      />
      <Alert tone="info" className="mb-6">
        {tx('ตอนนี้ยังไม่เปิดขาย ไม่มีการรับสั่งซื้อหรือชำระเงินบนเว็บไซต์', 'Not open yet. This website takes no orders or payments.')}
      </Alert>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <li key={c.name.en} className="flex flex-col items-center rounded-3xl border border-line bg-surface p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-peach-100">
              <c.icon size={28} aria-hidden />
            </span>
            <p className="mt-3 font-display text-lg">{pick(c.name, locale)}</p>
            <Badge tone="accent" className="mt-2">
              Coming Soon
            </Badge>
          </li>
        ))}
      </ul>
    </Page>
  )
}
