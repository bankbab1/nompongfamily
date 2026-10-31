import { Link } from 'react-router'
import { Wordmark } from './Wordmark'

const groups = [
  {
    title: 'สำรวจ',
    links: [
      ['/about', 'รู้จักนมผง'],
      ['/stickers', 'สติกเกอร์ LINE'],
      ['/wallpapers', 'วอลเปเปอร์'],
      ['/suggest', 'ออกแบบสติกเกอร์ LINE'],
    ],
  },
  {
    title: 'Nompong Studio',
    links: [
      ['/studio', 'เกี่ยวกับสตูดิโอ'],
      ['/studio/new', 'เสนอไอเดีย'],
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
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted">บ้านอย่างเป็นทางการของน้องนมผง สติกเกอร์ LINE สาธารณะ และ Nompong Studio</p>
          {/* Official social links: fill in once the accounts are confirmed. */}
          <p className="mt-3 text-sm text-muted">ติดต่อทีมงาน: hello@nompong.example</p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="text-xs font-semibold tracking-wide text-ink uppercase">{g.title}</h2>
            <ul className="mt-2 space-y-0.5">
              {g.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="inline-flex min-h-9 items-center text-sm text-muted transition-colors hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-6xl border-t border-line px-4 py-6 text-xs text-muted">
        © {new Date().getFullYear()} nompong family · สติกเกอร์ทุกชุดมีเป้าหมายวางจำหน่ายแบบสาธารณะใน LINE Sticker Store
      </div>
    </footer>
  )
}
