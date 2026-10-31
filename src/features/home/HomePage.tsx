import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, CreditCard, Heart, Image, ShoppingBag, Sticker } from 'lucide-react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { TypingText } from '@/components/ui/TypingText'
import { NompongArt } from '@/features/nompong/art'
import { StickerSetCard } from '@/features/stickers/components'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/** The hero's second line types itself out and cycles through these. */
const HERO_LINES = ['จากน้องนมผง', 'สำหรับทุกแชต', 'ที่คุณออกแบบเองได้']

const SHORTCUTS = [
  { to: '/about', label: 'รู้จักนมผง', icon: Heart },
  { to: '/stickers', label: 'สติกเกอร์', icon: Sticker },
  { to: '/wallpapers', label: 'วอลเปเปอร์', icon: Image },
  { to: '/shop', label: 'ร้านค้า', icon: ShoppingBag },
  { to: '/cards', label: 'การ์ดสะสม', icon: CreditCard },
]

/** Nompong on a soft yellow disc. */
function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem]" aria-hidden>
      <div className="absolute inset-[6%] rounded-full bg-sunny-100" />
      <NompongArt pose="sit" className="relative mx-auto h-full w-auto p-[14%]" decorative />
    </div>
  )
}

export default function HomePage() {
  usePageMeta('nompong family', 'บ้านอย่างเป็นทางการของน้องนมผง สติกเกอร์ LINE วอลเปเปอร์ และ Nompong Studio')
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
            สติกเกอร์อุ่นใจ
            <br />
            <TypingText phrases={HERO_LINES} className="text-brown-400" caretClassName="bg-sunny" />
          </h1>
          <p className="t-lead mt-5 max-w-md">ส่งความน่ารักในทุกแชต แล้วมาร่วมสร้างชุดสติกเกอร์ชุดใหม่ไปด้วยกันที่ Nompong Studio</p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <LinkButton to="/suggest" variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
              ออกแบบชุดสติกเกอร์
            </LinkButton>
            <LinkButton to="/stickers" variant="secondary" size="lg">
              ดูสติกเกอร์ทั้งหมด
            </LinkButton>
          </div>
        </div>
        <HeroArt />
      </Page>

      <Page className="pt-0 sm:pt-0">
        <nav aria-label="ทางลัด" className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <ul className="flex gap-2">
            {SHORTCUTS.map((s) => (
              <li key={s.to} className="shrink-0">
                <Link
                  to={s.to}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium transition-colors hover:border-line-strong"
                >
                  <s.icon size={16} className="text-muted" aria-hidden />
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="latest" className="mt-16">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="latest" className="t-section font-display">
              ชุดล่าสุด
            </h2>
            <Link to="/stickers" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              ดูทั้งหมด <ArrowRight size={16} aria-hidden />
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
            <h2 className="font-display text-2xl">มีไอเดียสติกเกอร์ในใจ?</h2>
            <p className="mt-2 max-w-md text-cream/70">
              ออกแบบชุดสติกเกอร์ LINE ที่อยากให้นมผงทำ ชุดที่มีคนอยากได้มากที่สุดจะได้วาดก่อน และวางขายแบบสาธารณะใน LINE Sticker Store
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              <Link to="/suggest" className="inline-flex h-11 items-center gap-2 rounded-full bg-sunny px-5 font-medium text-[#26221f] hover:brightness-95">
                ออกแบบชุดสติกเกอร์ <ArrowRight size={18} aria-hidden />
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
              <p className="text-sm text-muted">ชุดจากไอเดียของแฟนๆ</p>
              <h2 className="mt-1 font-display text-2xl">{community.titleTh}</h2>
              <p className="mt-2 text-muted">{community.description}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium">
                ดูชุด {community.code} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          )}
        </section>
      </Page>
    </>
  )
}
