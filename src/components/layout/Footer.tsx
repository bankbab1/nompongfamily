import { Link } from 'react-router'
import { FULL_APP } from '@/app/phase'
import { PortalFooter } from './PortalChrome'
import { Wordmark } from './Wordmark'

const groups = [
  {
    title: 'สำรวจ',
    links: [
      ['/about', 'รู้จักนมผง'],
      ['/stickers', 'สติกเกอร์ LINE'],
      ['/wallpapers', 'วอลเปเปอร์'],
      ['/ideas', 'บอร์ดไอเดีย'],
    ],
  },
  {
    title: 'Nompong Studio',
    links: [
      ['/studio', 'เกี่ยวกับสตูดิโอ'],
      ['/studio/new?type=community', 'เสนอไอเดีย'],
      ['/studio/new?type=commission', 'สั่งทำชุดสติกเกอร์'],
      ['/my/requests', 'ติดตามคำขอ'],
    ],
  },
  {
    title: 'ช่วยเหลือ',
    links: [
      ['/faq', 'คำถามที่พบบ่อย'],
      ['/terms', 'ข้อกำหนดการใช้งาน'],
      ['/privacy', 'นโยบายความเป็นส่วนตัว'],
    ],
  },
] as const

export function Footer() {
  if (!FULL_APP) return <PortalFooter />
  return (
    <footer className="mt-12 border-t border-line bg-surface-muted/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted">บ้านอย่างเป็นทางการของน้องนมผงและพี่ก๊วย สติกเกอร์ LINE สาธารณะ และ Nompong Studio</p>
          {/* Official social links: fill in once the accounts are confirmed. */}
          <p className="mt-3 text-sm text-muted">ติดต่อทีมงาน: hello@nompong.example</p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="font-display text-base text-ink">{g.title}</h2>
            <ul className="mt-2 space-y-0.5">
              {g.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="inline-flex min-h-10 items-center text-sm text-muted hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} nompong family · สติกเกอร์ทุกชุดมีเป้าหมายวางจำหน่ายแบบสาธารณะใน LINE Sticker Store
      </div>
    </footer>
  )
}
