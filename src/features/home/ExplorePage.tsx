import { ChevronRight, CreditCard, Heart, HelpCircle, Image, Palette, ShoppingBag, Sticker } from 'lucide-react'
import { Link } from 'react-router'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const ITEMS = [
  { to: '/about', icon: Heart, title: 'รู้จักนมผง', body: 'เรื่องราวและนิสัยของน้องนมผง' },
  { to: '/stickers', icon: Sticker, title: 'สติกเกอร์ LINE', body: 'ซีรีส์ V, M, CR และชุดแนะนำตัว' },
  { to: '/wallpapers', icon: Image, title: 'วอลเปเปอร์', body: 'ดาวน์โหลดฟรีสำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์' },
  { to: '/suggest', icon: Palette, title: 'ออกแบบสติกเกอร์ LINE', body: 'เลือกจำนวนภาพ ตั้งชื่อชุด ใส่คำและท่าทางทีละภาพ' },
  { to: '/shop', icon: ShoppingBag, title: 'ร้านค้า', body: 'สินค้าจริงของนมผง (เร็วๆ นี้)' },
  { to: '/cards', icon: CreditCard, title: 'การ์ดสะสม', body: 'การ์ดนมผงรุ่นพิเศษ (เร็วๆ นี้)' },
  { to: '/faq', icon: HelpCircle, title: 'คำถามที่พบบ่อย', body: 'เกี่ยวกับสติกเกอร์และ Nompong Studio' },
]

export default function ExplorePage() {
  usePageMeta('สำรวจ')
  return (
    <Page narrow>
      <PageHeader title="สำรวจโลกของนมผง" />
      <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
        {ITEMS.map((it) => (
          <li key={it.to}>
            <Link to={it.to} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-surface-muted">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                <it.icon size={20} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{it.title}</span>
                <span className="block text-sm text-muted">{it.body}</span>
              </span>
              <ChevronRight size={18} className="text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
