import { useQuery } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { useParams } from 'react-router'
import { Alert, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { stickerArt } from '@/lib/api/mock/art'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import { formatDate } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { SERIES_LABEL, setCover, SetStatusBadge, StoreLink } from './components'

export default function SetDetailPage() {
  const { slug = '' } = useParams()
  const q = useQuery({ queryKey: qk.set(slug), queryFn: () => api.catalog.getSet(slug) })
  usePageMeta(q.data ? `${q.data.titleTh} (${q.data.code})` : 'ชุดสติกเกอร์', q.data?.description)

  if (q.isPending)
    return (
      <Page>
        <PageSkeleton />
      </Page>
    )
  if (q.isError)
    return (
      <Page>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Page>
    )
  const s = q.data

  return (
    <Page>
      <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-10">
        <img src={setCover(s)} alt={`ปกชุด ${s.titleTh}`} className="w-full rounded-3xl border border-line" />
        <div>
          <p className="text-sm text-muted">
            {SERIES_LABEL[s.series].th} · <span className="font-display">{s.code}</span>
          </p>
          <h1 className="mt-1 font-display text-3xl">{s.titleTh}</h1>
          <p className="text-muted">{s.titleEn}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SetStatusBadge set={s} />
            <span className="text-sm text-muted">{s.stickerCount} ภาพ</span>
            {s.releasedAt && <span className="text-sm text-muted">· วางขาย {formatDate(s.releasedAt)}</span>}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed">{s.description}</p>
          {s.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {s.tags.map((t) => (
                <li key={t} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-sm">
                  #{t}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            {s.status === 'live' ? (
              <StoreLink set={s} />
            ) : (
              <Alert tone="info" icon={<Clock size={18} />} title="ยังไม่วางขาย">
                ลิงก์ LINE Store จะแสดงเมื่อชุดนี้เผยแพร่จริงแล้วเท่านั้น
              </Alert>
            )}
          </div>
        </div>
      </div>

      {s.status === 'live' && (
        <section aria-labelledby="preview" className="mt-10">
          <h2 id="preview" className="mb-4 font-display text-xl">
            ตัวอย่างในชุด
          </h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {s.sampleCaptions.map((c, i) => (
              <li key={c + i}>
                <img src={stickerArt({ position: i + 1, caption: c })} alt={c} loading="lazy" className="w-full rounded-2xl border border-line bg-surface" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  )
}
