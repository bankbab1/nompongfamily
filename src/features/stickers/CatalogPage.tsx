import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useDeferredValue } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { Checkbox, inputClass } from '@/components/ui/Field'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import type { SeriesKind } from '@/lib/api/types'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { SERIES_LABEL, StickerSetCard } from './components'

const TABS: (SeriesKind | 'all')[] = ['all', 'V', 'M', 'CR', 'INTRO']

/** V, M, CR and Foundation are distinct namespaces and tabs — never interleaved by number (FE-14). */
export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const series: SeriesKind | 'all' = (params.get('series') as SeriesKind | null) ?? 'all'
  const q = params.get('q') ?? ''
  const liveOnly = params.get('live') === '1'
  const deferredQ = useDeferredValue(q)
  usePageMeta('สติกเกอร์ LINE', 'สติกเกอร์ LINE ทุกชุดของนมผง — Standard V, Special M, Community CR และ Foundation')

  const filter = { series, q: deferredQ, liveOnly }
  const sets = useQuery({ queryKey: qk.sets(filter), queryFn: () => api.catalog.listSets(filter), placeholderData: (prev) => prev })

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  // Within a series, sort by its own number so V2 < V10.
  const sorted = [...(sets.data ?? [])].sort((a, b) =>
    a.series === b.series ? Number(a.code.replace(/\D/g, '')) - Number(b.code.replace(/\D/g, '')) : TABS.indexOf(a.series) - TABS.indexOf(b.series),
  )

  return (
    <Page>
      <PageHeader title="สติกเกอร์ LINE" description="ทุกชุดวางขายแบบสาธารณะใน LINE Sticker Store" />

      <div className="space-y-4">
        <label className="relative block">
          <span className="sr-only">ค้นหาชุดสติกเกอร์</span>
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => set('q', e.target.value || null)}
            placeholder="ค้นหาชื่อชุด ธีม หรือข้อความ เช่น ง่วง"
            className={cn(inputClass, 'h-12 pl-10')}
            lang="th"
          />
        </label>
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <div role="tablist" aria-label="ซีรีส์" className="inline-flex gap-1 rounded-2xl bg-surface-muted p-1">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={series === t}
                onClick={() => set('series', t === 'all' ? null : t)}
                className={cn('min-h-10 rounded-xl px-4 text-sm font-medium whitespace-nowrap', series === t ? 'bg-surface shadow-sm' : 'text-muted hover:text-ink')}
              >
                {t === 'all' ? 'ทั้งหมด' : SERIES_LABEL[t].th}
              </button>
            ))}
          </div>
        </div>
        <Checkbox label="แสดงเฉพาะชุดที่วางขายแล้ว" checked={liveOnly} onChange={(e) => set('live', e.target.checked ? '1' : null)} />
      </div>

      <div className="mt-6" aria-live="polite" aria-busy={sets.isFetching}>
        {sets.isPending ? (
          <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-72" />
              </li>
            ))}
          </ul>
        ) : sets.isError ? (
          <ErrorState error={sets.error} onRetry={() => sets.refetch()} />
        ) : sorted.length === 0 ? (
          <EmptyState title="ไม่พบชุดที่ตรงกับการค้นหา" description="ลองคำอื่น หรือเลือกซีรีส์ “ทั้งหมด”" />
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">{sorted.length} ชุด</p>
            <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {sorted.map((s) => (
                <li key={s.id}>
                  <StickerSetCard set={s} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Page>
  )
}
