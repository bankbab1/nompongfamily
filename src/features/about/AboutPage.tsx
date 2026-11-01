import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Page } from '@/components/layout/AppShell'
import { NompongArt } from '@/features/nompong/art'
import { setCover, setName, SetStatusBadge, StoreLink } from '@/features/stickers/components'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { pick, useLocale, useTx } from '@/lib/i18n'

/** Nompong's profile. Copy is a placeholder until the brand master reference is approved. */
const NOMPONG = {
  name: { th: 'น้องนมผง', en: 'Nompong' },
  en: 'Nompong',
  traits: [{ th: '(รอข้อมูลคาแรกเตอร์)', en: '(character details coming soon)' }],
  story: {
    th: 'ข้อความแนะนำตัวน้องนมผง — รอเนื้อหาและบุคลิกจากต้นแบบคาแรกเตอร์ที่อนุมัติแล้ว',
    en: 'Nompong’s introduction — waiting for the story and personality from the approved character reference.',
  },
}

export default function AboutPage() {
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(tx('รู้จักนมผง', 'Meet Nompong'), tx('ทำความรู้จักน้องนมผง คาแรกเตอร์ของ nompong family', 'Meet Nompong, the character of nompong family'))
  const intro = useQuery({
    queryKey: qk.set('intro01'),
    queryFn: () => api.catalog.getSet('intro01'),
  })
  const c = NOMPONG

  return (
    <Page>
      <h1 className="t-page font-display">{tx('รู้จักน้องนมผง', 'Meet Nompong')}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {tx(
          'น้องนมผงคือคาแรกเตอร์เดียวของ nompong family อยู่ในทุกชุดสติกเกอร์ ทุกภาพวาดจากต้นแบบคาแรกเตอร์ที่อนุมัติแล้วเท่านั้น',
          'Nompong is the one character of nompong family and appears in every sticker set. Every drawing follows the approved character reference.',
        )}
      </p>

      <article className="mt-8 grid overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-[1fr_1.2fr]">
        <div className="flex aspect-[4/3] items-center justify-center bg-sunny-100 p-6 md:aspect-auto" aria-hidden>
          <NompongArt pose="sit" className="h-full max-h-72 w-auto" decorative />
        </div>
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-2xl">
            {pick(c.name, locale)} {locale === 'th' && <span className="text-base text-muted">{c.en}</span>}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {c.traits
              .map((tr) => pick(tr, locale))
              .map((t) => (
                <li key={t} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-sm">
                  {t}
                </li>
              ))}
          </ul>
          <p className="mt-3 text-[15px] leading-relaxed">{pick(c.story, locale)}</p>
        </div>
      </article>

      {intro.data && (
        <section
          aria-labelledby="foundation"
          className="mt-12 grid items-center gap-6 rounded-3xl border border-line bg-sunny-50 p-5 sm:p-8 md:grid-cols-[1fr_1.2fr]"
        >
          <img src={setCover(intro.data)} alt="" className="w-full rounded-2xl" />
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <Sparkles size={16} aria-hidden /> Foundation Collection · {intro.data.code}
            </p>
            <h2 id="foundation" className="mt-1 font-display text-2xl">
              {setName(intro.data, locale).main}
            </h2>
            <p className="mt-2 text-muted">
              {tx(
                `ชุดแนะนำตัว ${intro.data.stickerCount} ภาพที่เล่าว่านมผงคือใคร (ชื่อชุดยังรออนุมัติ) — แยกจากซีรีส์ V1–V60 และ M`,
                `A ${intro.data.stickerCount}-sticker intro set telling who Nompong is (name not final) — separate from the V1–V60 and M series`,
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SetStatusBadge set={intro.data} />
              <StoreLink set={intro.data} />
              <Link to={`/stickers/${intro.data.slug}`} className="inline-flex min-h-11 items-center gap-1 font-medium">
                {tx('ดูรายละเอียด', 'See details')} <ChevronRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}
    </Page>
  )
}
