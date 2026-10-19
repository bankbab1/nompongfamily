import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CreditCard, Heart, Image, Lightbulb, ShoppingBag, Sticker } from 'lucide-react'
import { Link } from 'react-router'
import { Skeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { StickerSetCard } from '@/features/stickers/components'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { usePageMeta } from '@/lib/utils/usePageMeta'

const SHORTCUTS = [
  { to: '/about', label: 'รู้จักนมผง', icon: Heart, bg: 'bg-peach-100' },
  { to: '/stickers', label: 'สติกเกอร์', icon: Sticker, bg: 'bg-sunny-100' },
  { to: '/wallpapers', label: 'วอลเปเปอร์', icon: Image, bg: 'bg-mint-100' },
  { to: '/shop', label: 'ร้านค้า', icon: ShoppingBag, bg: 'bg-surface-muted' },
  { to: '/cards', label: 'การ์ดสะสม', icon: CreditCard, bg: 'bg-surface-muted' },
]

/** Hero illustration slot — replace with the approved Nompong master artwork (spec §9.1). */
function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm" aria-hidden>
      <div className="absolute inset-[8%] rounded-[38%] bg-sunny" />
      <div className="absolute top-[6%] right-[4%] h-[28%] w-[28%] rounded-full bg-peach" />
      <div className="absolute bottom-[4%] left-[2%] h-[24%] w-[24%] rounded-full bg-mint" />
      <div className="absolute inset-[22%] flex items-center justify-center rounded-[34%] border-4 border-dashed border-brown/40 bg-cream/70 text-center">
        <span className="px-4 font-display text-sm text-brown/70">
          ภาพนมผง
          <br />
          (approved artwork)
        </span>
      </div>
    </div>
  )
}

export default function HomePage() {
  usePageMeta('nompong family', 'บ้านอย่างเป็นทางการของน้องนมผงและพี่ก๊วย สติกเกอร์ LINE วอลเปเปอร์ และ Nompong Studio')
  const featured = useQuery({ queryKey: qk.sets({ liveOnly: true }), queryFn: () => api.catalog.listSets({ liveOnly: true }) })
  const sets = featured.data ?? []
  const latest = [...sets].sort((a, b) => (b.releasedAt ?? '').localeCompare(a.releasedAt ?? '')).slice(0, 4)
  const community = sets.find((s) => s.series === 'CR')

  return (
    <>
      <section className="overflow-hidden border-b border-line bg-gradient-to-br from-sunny-100 via-cream to-peach-100/60">
        <Page className="grid items-center gap-8 py-10 sm:py-16 md:grid-cols-2">
          <div>
            <p className="font-display text-base text-muted">nompong family</p>
            <h1 className="mt-2 font-display text-4xl leading-[1.15] sm:text-5xl">สติกเกอร์อุ่นใจ จากน้องนมผง</h1>
            <p className="mt-4 max-w-md text-[17px] text-muted">ส่งความน่ารักในทุกแชต แล้วมาร่วมสร้างชุดสติกเกอร์ชุดใหม่ไปด้วยกันที่ Nompong Studio</p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <LinkButton to="/studio" variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                Create Your Sticker Set
              </LinkButton>
              <LinkButton to="/stickers" variant="secondary" size="lg">
                ดูสติกเกอร์ทั้งหมด
              </LinkButton>
            </div>
          </div>
          <HeroArt />
        </Page>
      </section>

      <Page>
        <nav aria-label="ทางลัด" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex gap-3 sm:grid sm:grid-cols-5">
            {SHORTCUTS.map((s) => (
              <li key={s.to} className="shrink-0">
                <Link to={s.to} className="flex w-24 flex-col items-center gap-2 rounded-3xl p-2 text-center sm:w-auto hover:bg-surface-muted">
                  <span className={`flex h-16 w-16 items-center justify-center rounded-3xl ${s.bg}`}>
                    <s.icon size={26} aria-hidden />
                  </span>
                  <span className="text-sm font-medium">{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="latest" className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="latest" className="font-display text-2xl">
              ชุดล่าสุด
            </h2>
            <Link to="/stickers" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium">
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

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-brown p-6 text-cream sm:p-8">
            <Lightbulb size={28} aria-hidden />
            <h2 className="mt-3 font-display text-2xl">มีไอเดียสติกเกอร์ในใจ?</h2>
            <p className="mt-2 text-cream/80">เสนอไอเดียฟรีให้ทีมงานพิจารณา หรือสั่งทำชุดของคุณผ่าน Fastwork ทุกชุดวางขายแบบสาธารณะใน LINE Sticker Store</p>
            <Link to="/studio" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-sunny px-4 font-medium text-brown">
              ไปที่ Nompong Studio <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
          {community && (
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <p className="text-sm font-medium text-muted">ชุดจากไอเดียของแฟนๆ</p>
              <h2 className="mt-1 font-display text-2xl">{community.titleTh}</h2>
              <p className="mt-2 text-muted">{community.description}</p>
              <Link to={`/stickers/${community.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-1 font-medium">
                ดูชุด {community.code} <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          )}
        </section>
      </Page>
    </>
  )
}
