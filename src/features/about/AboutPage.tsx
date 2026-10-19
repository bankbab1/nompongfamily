import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Page } from '@/components/layout/AppShell'
import { setCover, SetStatusBadge, StoreLink } from '@/features/stickers/components'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/**
 * Character profiles. Copy and artwork are placeholders until the brand master reference
 * and Thai copy tone are approved (open decision §18.5).
 */
const CHARACTERS = [
  {
    name: 'น้องนมผง',
    en: 'Nompong',
    color: 'bg-sunny-100',
    traits: ['(รอข้อมูลคาแรกเตอร์)'],
    story: 'ข้อความแนะนำตัวน้องนมผง — รอเนื้อหาและบุคลิกจากต้นแบบคาแรกเตอร์ที่อนุมัติแล้ว',
  },
  {
    name: 'พี่ก๊วย',
    en: "P'Guay",
    color: 'bg-mint-100',
    traits: ['(รอข้อมูลคาแรกเตอร์)'],
    story: 'ข้อความแนะนำตัวพี่ก๊วยและความสัมพันธ์กับน้องนมผง — รอเนื้อหาจากต้นแบบคาแรกเตอร์ที่อนุมัติแล้ว',
  },
]

export default function AboutPage() {
  usePageMeta('รู้จักนมผง', 'ทำความรู้จักน้องนมผงและพี่ก๊วย คาแรกเตอร์ของ nompong family')
  const intro = useQuery({ queryKey: qk.set('intro01'), queryFn: () => api.catalog.getSet('intro01') })

  return (
    <Page>
      <h1 className="font-display text-3xl sm:text-4xl">รู้จักนมผง & พี่ก๊วย</h1>
      <p className="mt-2 max-w-2xl text-muted">คาแรกเตอร์ของ nompong family ที่อยู่ในทุกชุดสติกเกอร์ ทุกภาพวาดจากต้นแบบคาแรกเตอร์ที่อนุมัติแล้วเท่านั้น</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {CHARACTERS.map((c) => (
          <article key={c.en} className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className={`flex aspect-[16/9] items-center justify-center ${c.color}`} aria-hidden>
              <span className="rounded-3xl border-4 border-dashed border-brown/30 px-6 py-8 font-display text-brown/60">ภาพ {c.en} (approved artwork)</span>
            </div>
            <div className="p-5">
              <h2 className="font-display text-2xl">
                {c.name} <span className="text-base text-muted">{c.en}</span>
              </h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {c.traits.map((t) => (
                  <li key={t} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-sm">
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[15px] leading-relaxed">{c.story}</p>
            </div>
          </article>
        ))}
      </div>

      {intro.data && (
        <section aria-labelledby="foundation" className="mt-12 grid items-center gap-6 rounded-3xl border border-line bg-sunny-50 p-5 sm:p-8 md:grid-cols-[1fr_1.2fr]">
          <img src={setCover(intro.data)} alt="" className="w-full rounded-2xl" />
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <Sparkles size={16} aria-hidden /> Foundation Collection · {intro.data.code}
            </p>
            <h2 id="foundation" className="mt-1 font-display text-2xl">
              {intro.data.titleTh}
            </h2>
            <p className="mt-2 text-muted">
              ชุดแนะนำตัว {intro.data.stickerCount} ภาพที่เล่าว่านมผงคือใคร (ชื่อชุดยังรออนุมัติ) — แยกจากซีรีส์ V1–V60 และ M
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SetStatusBadge set={intro.data} />
              <StoreLink set={intro.data} />
              <Link to={`/stickers/${intro.data.slug}`} className="inline-flex min-h-11 items-center gap-1 font-medium">
                ดูรายละเอียด <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}
    </Page>
  )
}
