import { Backpack, Gift, KeyRound, Shirt, Sticker, ToyBrick } from 'lucide-react'
import { Alert } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/Badge'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/**
 * P2 shell: category preview only. Never shows fake stock, prices or checkout (spec §9.5) —
 * products appear here once inventory is real.
 */
const CATEGORIES = [
  { icon: Sticker, name: 'สติกเกอร์แผ่น' },
  { icon: KeyRound, name: 'พวงกุญแจ' },
  { icon: Shirt, name: 'เสื้อและหมวก' },
  { icon: Backpack, name: 'กระเป๋า' },
  { icon: ToyBrick, name: 'ตุ๊กตา / ฟิกเกอร์' },
  { icon: Gift, name: 'ของขวัญเทศกาล' },
]

export default function ShopPage() {
  usePageMeta('ร้านค้า', 'สินค้าของนมผง — เร็วๆ นี้')
  return (
    <Page>
      <PageHeader title="ร้านค้า nompong family" description="สินค้าจริงของนมผงกำลังจะมา ติดตามประกาศเปิดขายได้ที่หน้าแรก" />
      <Alert tone="info" className="mb-6">
        ตอนนี้ยังไม่เปิดขาย ไม่มีการรับสั่งซื้อหรือชำระเงินบนเว็บไซต์
      </Alert>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <li key={c.name} className="flex flex-col items-center rounded-3xl border border-line bg-surface p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-peach-100">
              <c.icon size={28} aria-hidden />
            </span>
            <p className="mt-3 font-display text-lg">{c.name}</p>
            <Badge tone="accent" className="mt-2">
              Coming Soon
            </Badge>
          </li>
        ))}
      </ul>
    </Page>
  )
}
