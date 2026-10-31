import { ArrowRight, CreditCard, Heart, Image, Lightbulb, Palette, ShoppingBag, Sticker } from 'lucide-react'
import { Link } from 'react-router'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { GALLERY_POSES, NompongArt, NompongLogo } from '@/features/nompong/art'
import { Paws } from '@/features/nompong/NompongPage'
import { localName, moodEmoji, sortSuggestions } from '@/features/suggestions/model'
import { useSuggestions } from '@/features/suggestions/useSuggestions'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { useLocale } from '@/lib/i18n'
import { fill, useCopy } from './copy'

/** What the portal will grow into. Shown as "coming soon" — none of these are links yet. */
const COMING_STYLE = [
  { icon: Sticker, tone: 'bg-sunny-100' },
  { icon: Image, tone: 'bg-mint-100' },
  { icon: Palette, tone: 'bg-peach-100' },
  { icon: ShoppingBag, tone: 'bg-taupe-100' },
  { icon: CreditCard, tone: 'bg-surface-muted' },
]

export default function PortalHomePage() {
  const c = useCopy()
  const h = c.home
  const locale = useLocale()
  usePageMeta(c.site.name, h.metaDesc)
  const ideas = useSuggestions()
  const top = sortSuggestions(ideas.data ?? [], 'popular').slice(0, 3)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-sunny-100 via-cream to-peach-100/50">
        <Paws />
        <Page className="relative grid items-center gap-6 py-8 sm:py-16 md:grid-cols-[1.15fr_1fr] md:gap-8">
          <div className="order-2 text-center md:order-1 md:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1 text-sm font-medium shadow-sm">
              <Heart size={14} className="text-heart" fill="currentColor" aria-hidden /> {c.site.name}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.15] font-semibold sm:text-6xl">
              {h.hello}
              <br />
              {h.iAm} <span className="underline decoration-peach decoration-[6px] underline-offset-[10px]">{c.nompong.name}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg text-ink/85 md:mx-0">{c.nompong.tagline}</p>
            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row md:justify-start">
              <LinkButton to="/nompong" variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                {h.meetCta}
              </LinkButton>
              <LinkButton to="/suggest" variant="secondary" size="lg" icon={<Lightbulb size={18} />}>
                {h.suggestCta}
              </LinkButton>
            </div>
          </div>
          <div className="order-1 mx-auto w-full max-w-[15rem] sm:max-w-sm md:order-2 md:max-w-md">
            <NompongLogo className="nompong-float w-full drop-shadow-xl" />
          </div>
        </Page>
      </section>

      <Page>
        {/* Meet Nompong */}
        <section aria-labelledby="meet" className="grid items-center gap-6 overflow-hidden rounded-[2rem] border border-line bg-surface md:grid-cols-[1fr_1.2fr]">
          <div className="flex items-end justify-center bg-gradient-to-b from-sunny-50 to-sunny-100 px-8 pt-8">
            <NompongArt pose="sit" className="w-full max-w-xs" />
          </div>
          <div className="p-6 sm:p-10">
            <h2 id="meet" className="font-display text-3xl">
              {h.meetTitle}
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed">{c.nompong.intro}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {c.nompong.traits.map((t) => (
                <li key={t} className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium">
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/nompong" className="mt-6 inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:underline">
              {h.readProfile} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>

        {/* Pose strip */}
        <section aria-label={h.posesLabel} className="no-scrollbar -mx-4 mt-8 overflow-x-auto px-4">
          <ul className="flex gap-3 sm:grid sm:grid-cols-6">
            {GALLERY_POSES.map((p) => (
              <li key={p} className="flex h-28 w-32 shrink-0 items-center justify-center rounded-3xl bg-surface p-3 shadow-sm ring-1 ring-line sm:h-32 sm:w-auto">
                <NompongArt pose={p} className="max-h-full w-auto max-w-full" />
              </li>
            ))}
          </ul>
        </section>

        {/* Suggestion call-out */}
        <section aria-labelledby="wish" className="mt-14 overflow-hidden rounded-[2rem] bg-brown text-cream">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <Lightbulb size={30} className="text-peach" aria-hidden />
              <h2 id="wish" className="mt-3 font-display text-3xl leading-tight">
                {h.wishTitle1}
                <br />
                {h.wishTitle2}
              </h2>
              <p className="mt-3 text-cream/80">{h.wishBody}</p>
              <LinkButton to="/suggest" variant="accent" size="lg" className="mt-6" iconRight={<ArrowRight size={18} />}>
                {h.wishCta}
              </LinkButton>
            </div>
            <ul className="grid gap-3" aria-label={h.topIdeas}>
              {top.map((s, i) => (
                <li key={s.id}>
                  <Link to="/suggest" className="flex items-center gap-4 rounded-2xl bg-cream/10 p-4 transition-colors hover:bg-cream/15">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunny font-display text-lg text-brown">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg">{localName(s, locale).main}</span>
                      <span className="block truncate text-sm text-cream/70">
                        {fill(c.card.count, { n: s.stickerCount })} · {moodEmoji(s.mood)} {c.moods[s.mood]}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm tabular-nums">
                      <Heart size={15} className="text-peach" fill="currentColor" aria-hidden /> {s.votes}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Coming soon */}
        <section aria-labelledby="soon" className="mt-14">
          <h2 id="soon" className="font-display text-2xl sm:text-3xl">
            {h.soonTitle}
          </h2>
          <p className="mt-1 text-muted">{h.soonBody}</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {h.coming.map((item, i) => {
              const { icon: Icon, tone } = COMING_STYLE[i]
              return (
                <li key={item.title} className={`relative flex flex-col rounded-3xl border border-line bg-surface p-5 ${i === 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted">{item.desc}</p>
                  <span className="absolute top-4 right-4 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted">{h.soonBadge}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </Page>
    </>
  )
}
