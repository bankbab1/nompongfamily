import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, CreditCard, Heart, Image, ShoppingBag, Sticker } from 'lucide-react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { TypingText } from '@/components/ui/TypingText'
import { NompongArt } from '@/features/nompong/art'
import { setDesc, setName, StickerSetCard } from '@/features/stickers/components'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
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
  const featured = useQuery({ queryKey: qk.sets({ liveOnly: true }), queryFn: () => api.catalog.listSets({ liveOnly: true }) })
  const sets = featured.data ?? []
  const latest = [...sets].sort((a, b) => (b.releasedAt ?? '').localeCompare(a.releasedAt ?? '')).slice(0, 4)
  const community = sets.find((s) => s.series === 'CR')

  return (
    <>
      <Page className="grid items-center gap-10 pt-10 pb-6 sm:pt-16 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-sunny" aria-hidden /> nompong family
          </p>
          <h1 className="t-hero mt-5 font-display">
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
            <LinkButton to="/suggest" variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
              {tx('ออกแบบชุดสติกเกอร์', 'Design a sticker set')}
            </LinkButton>
            <LinkButton to="/stickers" variant="secondary" size="lg">
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
            <Link to="/stickers" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              {tx('ดูทั้งหมด', 'See all')} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {featured.isPending
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i}>
                    <Skeleton className="h-72" />
                  </li>
                ))
              : latest.map((s) => (
                  <li key={s.id}>
                    <StickerSetCard set={s} />
                  </li>
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
                {tx('ออกแบบชุดสติกเกอร์', 'Design a sticker set')} <ArrowRight size={18} aria-hidden />
              </Link>
              <Link to="/studio" className="inline-flex h-11 items-center gap-2 rounded-full px-4 font-medium text-cream/80 hover:text-cream">
                Nompong Studio <ArrowUpRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
          {community && (
            <Link
              to={`/stickers/${community.slug}`}
              className="group flex flex-col rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-line-strong sm:p-8"
            >
              <p className="text-sm text-muted">{tx('ชุดจากไอเดียของแฟนๆ', 'A set from fans’ ideas')}</p>
              <h2 className="mt-1 font-display text-2xl">{setName(community, locale).main}</h2>
              <p className="mt-2 text-muted">{setDesc(community, locale)}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium">
                {tx('ดูชุด', 'See set')} {community.code} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          )}
        </section>
      </Page>
    </>
  )
}
