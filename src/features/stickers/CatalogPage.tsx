import { ArrowUpRight } from 'lucide-react'
import { RevealItem } from '@/components/ui/Reveal'
import { useDeferredValue, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { buttonBase, buttonSizes, buttonVariants } from '@/components/ui/Button'
import { SearchField } from '@/components/ui/SearchField'
import { CollectionTabs, type CollectionTab } from '@/components/ui/CollectionTabs'
import { useViewMode, ViewSwitch } from '@/components/ui/ViewSwitch'
import { useLocale, useTx } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { LineSetCard } from './LineSetCard'
import { LINE_AUTHOR_URL, LINE_SERIES, LINE_SETS, lineUrl, versionName, VERSIONS, type LineSet } from './lineStore'

/** Every Nompong set on the LINE Store. Each card opens that set's own store page. */
export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const series = params.get('series') ?? 'all'
  const q = params.get('q') ?? ''
  const deferredQ = useDeferredValue(q)
  const locale = useLocale()
  const tx = useTx()
  usePageMeta(
    tx('สติกเกอร์ LINE', 'LINE stickers'),
    tx(`สติกเกอร์ LINE ของนมผงทั้ง ${LINE_SETS.length} ชุด`, `All ${LINE_SETS.length} Nompong LINE sticker sets`),
  )

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  const items = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase()
    return LINE_SETS.filter(
      (s) =>
        (series === 'all' || s.series === series) &&
        (!needle || s.title.toLowerCase().includes(needle) || s.code.toLowerCase() === needle || versionName(s.series).toLowerCase() === needle),
    )
  }, [series, deferredQ])

  const [view, changeView] = useViewMode('nompong.stickers.view')
  const sections = useRef<HTMLDivElement>(null)
  const tabs: CollectionTab[] = [
    { id: 'all', label: tx('ทั้งหมด', 'All'), count: LINE_SETS.length },
    ...LINE_SERIES.map((v) => ({ id: v.id, label: versionName(v.id), count: v.count })),
  ]

  // Fetch the set page's code ahead of time, so the first tap opens (and animates) without a wait.
  useEffect(() => {
    void import('./LineSetPage')
  }, [])

  return (
    <Page>
      <PageHeader
        className="mb-5"
        title={tx('สติกเกอร์ LINE', 'LINE stickers')}
        description={tx(
          `นมผง ${LINE_SETS.length} ชุดใน LINE STORE แตะชุดที่ชอบเพื่อดูและซื้อ`,
          `${LINE_SETS.length} Nompong sets on the LINE STORE. Tap one to see and buy it.`,
        )}
        actions={<StoreButton locale={locale} className="hidden sm:inline-flex" label={tx('เปิด LINE STORE', 'Open LINE STORE')} />}
      />

      {/* The home page's "See all stickers" button grows into this row. */}
      <div className="flex items-center gap-2" style={{ viewTransitionName: 'stickers-entry' }}>
        <SearchField
          className="flex-1"
          inputClassName="sm:h-12"
          value={q}
          onChange={(v) => set('q', v || null)}
          label={tx('ค้นหาชุดสติกเกอร์', 'Search sticker sets')}
          placeholder={tx('ค้นหาชื่อชุดหรือรหัส เช่น นมผง, v140', 'Search a name or code, e.g. v140')}
          lang="th"
        />
        <ViewSwitch view={view} onChange={changeView} />
      </div>

      {/* Version tabs stay pinned under the header while scrolling the long list. */}
      <CollectionTabs
        tabs={tabs}
        selected={series}
        onSelect={(id) => set('series', id === 'all' ? null : id)}
        sections={sections}
        resetKey={`${series}:${deferredQ}:${view}:${locale}`}
        label={tx('เวอร์ชัน', 'Version')}
      />

      <div className="mt-4" aria-live="polite">
        {items.length === 0 ? (
          <EmptyState
            title={tx('ไม่พบชุดที่ตรงกับการค้นหา', 'No sets match your search')}
            description={tx('ลองคำอื่น หรือเลือก “ทั้งหมด”', 'Try another word, or choose “All”')}
          />
        ) : (
          <>
            {deferredQ && (
              <p className="t-meta mb-3">
                {items.length} {tx('ชุด', items.length === 1 ? 'set' : 'sets')}
              </p>
            )}
            {/* One section per version letter, newest (highest number) first inside each. */}
            <div ref={sections} className="space-y-10">
              {groupByVersion(items).map((g) => {
                const info = VERSIONS[g.id]
                return (
                  <section key={g.id} data-collection={g.id} aria-labelledby={`v-${g.id}`}>
                    <header className="mb-4">
                      <h2 id={`v-${g.id}`} className="t-section flex items-baseline gap-2 font-display">
                        {versionName(g.id)}
                        <span className="t-meta tabular-nums">
                          {g.sets.length} {tx('ชุด', g.sets.length === 1 ? 'set' : 'sets')}
                        </span>
                      </h2>
                      {info && <p className="t-meta mt-0.5 text-sm">{tx(info.th, info.en)}</p>}
                    </header>
                    <ul
                      className={cn(
                        'grid sm:grid-cols-3 sm:gap-x-3 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-6',
                        view === 'list' ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-x-3 gap-y-6',
                      )}
                    >
                      {g.sets.map((s) => (
                        <RevealItem key={s.id}>
                          <LineSetCard set={s} list={view === 'list'} />
                        </RevealItem>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
            <div className="mt-12 flex flex-col items-center gap-3 rounded-3xl bg-surface-muted px-6 py-8 text-center">
              <p className="t-card font-display">{tx('ยังมีให้ดูอีกใน LINE STORE', 'See them all on the LINE STORE')}</p>
              <StoreButton locale={locale} label={tx('เปิด LINE STORE', 'Open LINE STORE')} />
            </div>
          </>
        )}
      </div>
    </Page>
  )
}

const codeNumber = (code: string) => Number(code.replace(/\D/g, '')) || 0

/** Splits sets by version letter (keeping LINE_SERIES order) and sorts each by its number, high to low. */
function groupByVersion(sets: LineSet[]) {
  return LINE_SERIES.map(({ id }) => ({
    id,
    sets: sets.filter((s) => (s.series || '?') === id).sort((a, b) => codeNumber(b.code) - codeNumber(a.code)),
  })).filter((g) => g.sets.length > 0)
}

function StoreButton({ locale, label, className }: { locale: 'th' | 'en'; label: string; className?: string }) {
  return (
    <a
      href={lineUrl(`${LINE_AUTHOR_URL}/th`, locale)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md, className)}
    >
      {label}
      <ArrowUpRight size={16} aria-hidden />
    </a>
  )
}
