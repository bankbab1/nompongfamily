import { ArrowUpRight, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { buttonBase, buttonSizes, buttonVariants } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { SlidingPill, useSlidingPill } from '@/components/ui/SlidingPill'
import { useLocale, useTx } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
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

  const tabs = [{ id: 'all', count: LINE_SETS.length }, ...LINE_SERIES]
  const track = useRef<HTMLDivElement>(null)
  const pill = useSlidingPill(track, '[aria-pressed="true"]', [series, locale])

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

      <label className="relative block">
        <span className="sr-only">{tx('ค้นหาชุดสติกเกอร์', 'Search sticker sets')}</span>
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => set('q', e.target.value || null)}
          placeholder={tx('ค้นหาชื่อชุดหรือรหัส เช่น บิงซู, v140', 'Search a name or code, e.g. v140')}
          className={cn(inputClass, 'h-11 rounded-full pl-11 sm:h-12')}
          lang="th"
        />
      </label>

      {/* Version tabs stay pinned under the header while scrolling the long list. */}
      <div className="sticky top-16 z-20 -mx-4 mt-3 bg-background/90 px-4 py-2.5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <div ref={track} role="group" aria-label={tx('เวอร์ชัน', 'Version')} className="relative inline-flex rounded-full bg-surface-muted p-1">
            <SlidingPill pill={pill.pill} ready={pill.ready} className="rounded-full bg-surface shadow-sm" />
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={series === t.id}
                onClick={() => {
                  set('series', t.id === 'all' ? null : t.id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={cn(
                  'relative min-h-9 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-300 sm:px-4',
                  series === t.id ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {t.id === 'all' ? tx('ทั้งหมด', 'All') : versionName(t.id)}
                <span className="ml-1.5 text-xs text-muted tabular-nums">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

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
            <div className="space-y-10">
              {groupByVersion(items).map((g) => {
                const info = VERSIONS[g.id]
                return (
                  <section key={g.id} aria-labelledby={`v-${g.id}`}>
                    <header className="mb-4">
                      <h2 id={`v-${g.id}`} className="t-section flex items-baseline gap-2 font-display">
                        {versionName(g.id)}
                        <span className="t-meta tabular-nums">
                          {g.sets.length} {tx('ชุด', g.sets.length === 1 ? 'set' : 'sets')}
                        </span>
                      </h2>
                      {info && <p className="t-meta mt-0.5 text-sm">{tx(info.th, info.en)}</p>}
                    </header>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {g.sets.map((s) => (
                        <li key={s.id}>
                          <LineSetCard set={s} locale={locale} />
                        </li>
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

function LineSetCard({ set, locale }: { set: LineSet; locale: 'th' | 'en' }) {
  return (
    <a
      href={lineUrl(set.url, locale)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl focus-visible:outline-offset-4"
      aria-label={`${set.title} — LINE STORE`}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted transition-colors group-hover:bg-sunny-100">
        <img
          src={set.image}
          alt=""
          width={240}
          height={240}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
        <span className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-muted opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight size={14} aria-hidden />
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium text-ink" lang="th">
        {set.name}
      </p>
      <p className="t-meta">{set.code}</p>
    </a>
  )
}
