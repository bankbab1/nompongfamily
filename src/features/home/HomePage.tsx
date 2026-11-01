import { useEffect } from 'react'
import { ChevronRight, CreditCard, Heart, Image, ShoppingBag, Sticker } from 'lucide-react'
import { RevealItem } from '@/components/ui/Reveal'
import { Link } from 'react-router'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { TypingText } from '@/components/ui/TypingText'
import { NompongArt } from '@/features/nompong/art'
import { LineSetCard } from '@/features/stickers/LineSetCard'
import { LINE_SERIES, LINE_SETS, versionName, VERSIONS } from '@/features/stickers/lineStore'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { pick, useLocale, useTx } from '@/lib/i18n'

/** The hero's second line types itself out and cycles through these. */
const HERO_LINES = {
  th: ['จากน้องนมผง', 'สำหรับทุกแชต', 'ที่คุณออกแบบเองได้'],
  en: ['from Nompong', 'for every chat', 'you can design yourself'],
}

const SHORTCUTS = [
  { to: '/about', label: { th: 'รู้จักนมผง', en: 'Meet Nompong' }, icon: Heart },
  { to: '/stickers', label: { th: 'สติกเกอร์', en: 'Stickers' }, icon: Sticker },
  { to: '/wallpapers', label: { th: 'วอลเปเปอร์', en: 'Wallpapers' }, icon: Image },
  { to: '/shop', label: { th: 'ร้านค้า', en: 'Shop' }, icon: ShoppingBag },
  { to: '/cards', label: { th: 'การ์ดสะสม', en: 'Cards' }, icon: CreditCard },
]

/** Nompong on a soft yellow disc. */
function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem]" aria-hidden>
      <div className="absolute inset-[6%] rounded-full bg-sunny-100" />
      <div className="absolute inset-[12%] flex items-center justify-center">
        <NompongArt pose="sit" className="h-full w-auto max-w-full" decorative />
      </div>
    </div>
  )
}

export default function HomePage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(
    'nompong family',
    tx(
      'บ้านอย่างเป็นทางการของน้องนมผง สติกเกอร์ LINE วอลเปเปอร์ และ Nompong Studio',
      'The official home of Nompong: LINE stickers, wallpapers and Nompong Studio',
    ),
  )
  // Straight from the LINE Store sync: the store lists newest first, so new sets show up here on their own.
  const latest = LINE_SETS.slice(0, 6)

  // Fetch the set page's code ahead of time, so the first tap opens (and animates) without a wait.
  useEffect(() => {
    void import('@/features/stickers/LineSetPage')
  }, [])

  return (
    <>
      <Page className="grid items-center gap-10 pt-10 pb-6 sm:pt-16 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="t-hero font-display">
            {tx('สติกเกอร์อุ่นใจ', 'Warm-hearted stickers')}
            <br />
            <TypingText phrases={HERO_LINES[locale]} className="text-brown-400" caretClassName="bg-sunny" />
          </h1>
          <p className="t-lead mt-5 max-w-md">
            {tx(
              'ส่งความน่ารักในทุกแชต แล้วมาร่วมสร้างชุดสติกเกอร์ชุดใหม่ไปด้วยกันที่ Nompong Studio',
              'Send a little warmth in every chat, then help create the next sticker set together at Nompong Studio.',
            )}
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <LinkButton to="/suggest" variant="primary" size="lg" iconRight={<ChevronRight size={18} />}>
              {tx('ออกแบบชุดสติกเกอร์', 'Design a sticker set')}
            </LinkButton>
            {/* Grows into the gallery's search bar on the next page (shared view-transition name). */}
            <LinkButton to="/stickers" viewTransition variant="secondary" size="lg" style={{ viewTransitionName: 'stickers-entry' }}>
              {tx('ดูสติกเกอร์ทั้งหมด', 'See all stickers')}
            </LinkButton>
          </div>
        </div>
        <HeroArt />
      </Page>

      <Page className="pt-0 sm:pt-0">
        <nav aria-label={tx('ทางลัด', 'Shortcuts')} className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {SHORTCUTS.map((s) => (
              <li key={s.to} className="shrink-0">
                <Link
                  to={s.to}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium transition-colors hover:border-line-strong"
                >
                  <s.icon size={16} className="text-muted" aria-hidden />
                  {pick(s.label, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="latest" className="mt-16">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="latest" className="t-section font-display">
              {tx('ชุดล่าสุด', 'Latest sets')}
            </h2>
            <Link to="/stickers" viewTransition className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              {tx('ดูทั้งหมด', 'See all')} <ChevronRight size={16} aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {latest.map((s) => (
              <RevealItem key={s.id}>
                <LineSetCard set={s} />
              </RevealItem>
            ))}
          </ul>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl bg-brown p-6 text-cream sm:p-8">
            <h2 className="font-display text-2xl">{tx('มีไอเดียสติกเกอร์ในใจ?', 'Got a sticker idea?')}</h2>
            <p className="mt-2 max-w-md text-cream/70">
              {tx(
                'ออกแบบชุดสติกเกอร์ LINE ที่อยากให้นมผงทำ ชุดที่มีคนอยากได้มากที่สุดจะได้วาดก่อน และวางขายแบบสาธารณะใน LINE Sticker Store',
                'Design the LINE sticker set you want Nompong to make. The most-wanted sets get drawn first and go on public sale in the LINE Sticker Store.',
              )}
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              <Link to="/suggest" className="inline-flex h-11 items-center gap-2 rounded-full bg-sunny px-5 font-medium text-[#26221f] hover:brightness-95">
                {tx('ออกแบบชุดสติกเกอร์', 'Design a sticker set')} <ChevronRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
          {/* Every version with its live set count; the numbers follow the LINE Store sync. */}
          <div className="flex flex-col rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <p className="text-sm text-muted">{tx(`สติกเกอร์นมผงใน LINE ทั้งหมด ${LINE_SETS.length} ชุด`, `${LINE_SETS.length} Nompong sets on LINE`)}</p>
            <h2 className="mt-1 font-display text-2xl">{tx('เลือกดูตามเวอร์ชัน', 'Browse by version')}</h2>
            <ul className="mt-4 divide-y divide-line">
              {LINE_SERIES.map((v) => (
                <li key={v.id}>
                  <Link to={`/stickers?series=${v.id}`} className="flex min-h-12 items-center gap-3 py-2 hover:text-ink">
                    <span className="font-medium">{versionName(v.id)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted">{VERSIONS[v.id] ? tx(VERSIONS[v.id].th, VERSIONS[v.id].en) : ''}</span>
                    <span className="text-sm text-muted tabular-nums">{v.count}</span>
                    <ChevronRight size={16} className="text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Page>
    </>
  )
}
