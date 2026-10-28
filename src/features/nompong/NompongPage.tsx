import { ArrowRight, Heart, PawPrint, Sparkles } from 'lucide-react'
import { Page } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useCopy } from '@/features/portal/copy'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { GALLERY_POSES, NompongArt, NompongLogo } from './art'

export default function NompongPage() {
  const c = useCopy()
  const n = c.nompong
  usePageMeta(c.nav.nompong, n.tagline)

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-sunny-100 to-cream">
        <Paws />
        <Page className="relative grid items-center gap-8 py-10 sm:py-14 md:grid-cols-[1.1fr_1fr]">
          <div className="order-2 text-center md:order-1 md:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1 text-sm font-medium text-brown shadow-sm">
              <PawPrint size={15} aria-hidden /> {c.profile.eyebrow}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-none font-semibold sm:text-6xl">
              {n.name}
              <span className="ml-3 align-middle text-2xl font-normal text-muted sm:text-3xl">{n.altName}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-lg text-ink/90 md:mx-0">{n.tagline}</p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start" aria-label={c.profile.traitsLabel}>
              {n.traits.map((t) => (
                <li key={t} className="rounded-full border border-line-strong bg-surface px-3 py-1 text-sm font-medium">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 mx-auto w-full max-w-[16rem] sm:max-w-sm md:order-2 md:max-w-md">
            <NompongArt pose="sit" className="nompong-float" />
          </div>
        </Page>
      </section>

      <Page>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-[2rem] border border-line bg-surface p-6 sm:p-8">
            <h2 className="font-display text-2xl">{c.profile.helloTitle}</h2>
            <p className="mt-3 text-[17px] leading-relaxed">{n.intro}</p>
            <p className="mt-3 text-[17px] leading-relaxed text-muted">{n.story}</p>
          </article>
          <aside className="rounded-[2rem] bg-brown p-6 text-cream sm:p-8" aria-labelledby="facts">
            <h2 id="facts" className="font-display text-2xl">
              {c.profile.factsTitle}
            </h2>
            <dl className="mt-4 divide-y divide-cream/15">
              {n.facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-cream/70">{f.label}</dt>
                  <dd className="text-right font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-5 inline-flex items-center gap-1.5 font-display text-lg">
              <Heart size={18} className="text-peach" fill="currentColor" aria-hidden /> {c.profile.likesTitle}
            </h3>
            <p className="mt-1 text-cream/85">{n.likes.join(' · ')}</p>
          </aside>
        </div>

        <section aria-labelledby="poses" className="mt-14">
          <h2 id="poses" className="font-display text-2xl sm:text-3xl">
            {c.profile.posesTitle}
          </h2>
          <p className="mt-1 text-muted">{c.profile.posesBody}</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {GALLERY_POSES.map((p) => (
              <li key={p} className="flex flex-col items-center rounded-3xl border border-line bg-surface p-4 transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex h-32 w-full items-center justify-center sm:h-40">
                  <NompongArt pose={p} className="max-h-full w-auto max-w-full" decorative />
                </div>
                <p className="mt-2 text-center text-sm font-medium">{c.poses[p]}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 grid items-center gap-6 rounded-[2rem] border border-line bg-sunny-50 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
          <NompongLogo className="mx-auto w-44 sm:w-52" decorative />
          <div className="text-center md:text-left">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <Sparkles size={16} aria-hidden /> {c.profile.soon}
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl">{c.profile.familyTitle}</h2>
            <p className="mt-2 max-w-xl text-muted">{n.family}</p>
            <LinkButton to="/suggest" variant="primary" size="lg" className="mt-5 h-auto min-h-12 py-2 whitespace-normal" iconRight={<ArrowRight size={18} />}>
              {c.profile.familyCta}
            </LinkButton>
          </div>
        </section>
      </Page>
    </>
  )
}

/** Soft paw prints in the hero background. */
export function Paws() {
  const spots = [
    'top-8 left-[6%] rotate-[-20deg]',
    'top-1/3 left-[44%] rotate-[15deg]',
    'bottom-10 left-[18%] rotate-[10deg]',
    'top-12 right-[8%] rotate-[25deg]',
    'bottom-8 right-[38%] rotate-[-12deg]',
  ]
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {spots.map((s) => (
        <PawPrint key={s} size={34} className={`absolute text-taupe/20 ${s}`} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  )
}
