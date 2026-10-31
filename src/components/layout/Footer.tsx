import { Link } from 'react-router'
import { Wordmark } from './Wordmark'
import { pick, useLocale, useTx } from '@/lib/i18n'

const groups = [
  {
    title: { th: 'สำรวจ', en: 'Explore' },
    links: [
      ['/about', { th: 'รู้จักนมผง', en: 'Meet Nompong' }],
      ['/stickers', { th: 'สติกเกอร์ LINE', en: 'LINE stickers' }],
      ['/wallpapers', { th: 'วอลเปเปอร์', en: 'Wallpapers' }],
      ['/suggest', { th: 'ออกแบบสติกเกอร์ LINE', en: 'Design LINE stickers' }],
    ],
  },
  {
    title: 'Nompong Studio',
    links: [
      ['/studio', { th: 'เกี่ยวกับสตูดิโอ', en: 'About the Studio' }],
      ['/studio/new', { th: 'เสนอไอเดีย', en: 'Share an idea' }],
      ['/my/requests', { th: 'ติดตามคำขอ', en: 'Track requests' }],
    ],
  },
  {
    title: { th: 'ช่วยเหลือ', en: 'Help' },
    links: [
      ['/faq', { th: 'คำถามที่พบบ่อย', en: 'FAQ' }],
      ['/terms', { th: 'ข้อกำหนดการใช้งาน', en: 'Terms of use' }],
      ['/privacy', { th: 'นโยบายความเป็นส่วนตัว', en: 'Privacy policy' }],
    ],
  },
] as const

export function Footer() {
  const locale = useLocale()
  const tx = useTx()
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted">
            {tx(
              'บ้านอย่างเป็นทางการของน้องนมผง สติกเกอร์ LINE สาธารณะ และ Nompong Studio',
              'The official home of Nompong: public LINE stickers and Nompong Studio.',
            )}
          </p>
          {/* Official social links: fill in once the accounts are confirmed. */}
          <p className="mt-3 text-sm text-muted">{tx('ติดต่อทีมงาน', 'Contact the team')}: hello@nompong.example</p>
        </div>
        {groups.map((g) => (
          <nav key={pick(g.title, 'en')} aria-label={pick(g.title, locale)}>
            <h2 className="text-xs font-semibold tracking-wide text-ink uppercase">{pick(g.title, locale)}</h2>
            <ul className="mt-2 space-y-0.5">
              {g.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="inline-flex min-h-9 items-center text-sm text-muted transition-colors hover:text-ink">
                    {pick(label, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-6xl border-t border-line px-4 py-6 text-xs text-muted">
        © {new Date().getFullYear()} nompong family ·{' '}
        {tx('สติกเกอร์ทุกชุดมีเป้าหมายวางจำหน่ายแบบสาธารณะใน LINE Sticker Store', 'Every sticker set is made for public sale on the LINE Sticker Store')}
      </div>
    </footer>
  )
}
