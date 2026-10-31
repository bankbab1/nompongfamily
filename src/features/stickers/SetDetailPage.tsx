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
import { SERIES_LABEL, setCover, setDesc, setName, SetStatusBadge, StoreLink } from './components'
import { useLocale, useTx } from '@/lib/i18n'

export default function SetDetailPage() {
  const { slug = '' } = useParams()
  const q = useQuery({ queryKey: qk.set(slug), queryFn: () => api.catalog.getSet(slug) })
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(q.data ? `${setName(q.data, locale).main} (${q.data.code})` : tx('ชุดสติกเกอร์', 'Sticker set'), q.data ? setDesc(q.data, locale) : undefined)

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
        <img src={setCover(s)} alt={`${tx('ปกชุด', 'Cover of')} ${setName(s, locale).main}`} className="w-full rounded-3xl border border-line" />
        <div>
          <p className="text-sm text-muted">
            {tx(SERIES_LABEL[s.series].th, SERIES_LABEL[s.series].en)} · <span className="font-display">{s.code}</span>
          </p>
          <h1 className="t-page mt-1 font-display">{setName(s, locale).main}</h1>
          <p className="text-muted">{setName(s, locale).alt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SetStatusBadge set={s} />
            <span className="text-sm text-muted">
              {s.stickerCount} {tx('ภาพ', 'stickers')}
            </span>
            {s.releasedAt && (
              <span className="text-sm text-muted">
                · {tx('วางขาย', 'Released')} {formatDate(s.releasedAt)}
              </span>
            )}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed">{setDesc(s, locale)}</p>
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
              <Alert tone="info" icon={<Clock size={18} />} title={tx('ยังไม่วางขาย', 'Not on sale yet')}>
                {tx('ลิงก์ LINE Store จะแสดงเมื่อชุดนี้เผยแพร่จริงแล้วเท่านั้น', 'The LINE Store link appears only once this set is actually published.')}
              </Alert>
            )}
          </div>
        </div>
      </div>

      {s.status === 'live' && (
        <section aria-labelledby="preview" className="mt-10">
          <h2 id="preview" className="mb-4 font-display text-xl">
            {tx('ตัวอย่างในชุด', 'Preview')}
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
