import { ChevronRight, CreditCard, Heart, HelpCircle, Image, Palette, ShoppingBag, Sticker } from 'lucide-react'
import { Link } from 'react-router'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { pick, useLocale, useTx } from '@/lib/i18n'

const ITEMS = [
  {
    to: '/about',
    icon: Heart,
    title: { th: 'รู้จักนมผง', en: 'Meet Nompong' },
    body: { th: 'เรื่องราวและนิสัยของน้องนมผง', en: 'Nompong’s story and personality' },
  },
  {
    to: '/stickers',
    icon: Sticker,
    title: { th: 'สติกเกอร์ LINE', en: 'LINE stickers' },
    body: { th: 'ซีรีส์ V, M, CR และชุดแนะนำตัว', en: 'V, M and CR series, plus the intro set' },
  },
  {
    to: '/wallpapers',
    icon: Image,
    title: { th: 'วอลเปเปอร์', en: 'Wallpapers' },
    body: { th: 'ดาวน์โหลดฟรีสำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์', en: 'Free for phone, tablet and computer' },
  },
  {
    to: '/suggest',
    icon: Palette,
    title: { th: 'ออกแบบสติกเกอร์ LINE', en: 'Design LINE stickers' },
    body: { th: 'เลือกจำนวนภาพ ตั้งชื่อชุด ใส่คำและท่าทางทีละภาพ', en: 'Pick a size, name the set, add a word and pose per sticker' },
  },
  {
    to: '/shop',
    icon: ShoppingBag,
    title: { th: 'ร้านค้า', en: 'Shop' },
    body: { th: 'สินค้าจริงของนมผง (เร็วๆ นี้)', en: 'Nompong merchandise (coming soon)' },
  },
  {
    to: '/cards',
    icon: CreditCard,
    title: { th: 'การ์ดสะสม', en: 'Collectible cards' },
    body: { th: 'การ์ดนมผงรุ่นพิเศษ (เร็วๆ นี้)', en: 'Special-edition Nompong cards (coming soon)' },
  },
  {
    to: '/faq',
    icon: HelpCircle,
    title: { th: 'คำถามที่พบบ่อย', en: 'FAQ' },
    body: { th: 'เกี่ยวกับสติกเกอร์และ Nompong Studio', en: 'About the stickers and Nompong Studio' },
  },
]

export default function ExplorePage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(tx('สำรวจ', 'Explore'))
  return (
    <Page narrow>
      <PageHeader title={tx('สำรวจโลกของนมผง', 'Explore Nompong’s world')} />
      <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
        {ITEMS.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-surface-muted">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                <it.icon size={20} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{pick(it.title, locale)}</span>
                <span className="block text-sm text-muted">{pick(it.body, locale)}</span>
              </span>
              <ChevronRight size={18} className="text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
