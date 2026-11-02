import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { useDeferredValue, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback/States'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { CollectionTabs, type CollectionTab } from '@/components/ui/CollectionTabs'
import { RevealItem } from '@/components/ui/Reveal'
import { SearchField } from '@/components/ui/SearchField'
import { useViewMode, ViewSwitch } from '@/components/ui/ViewSwitch'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
import type { Wallpaper } from '@/lib/api/types'
import { useLocale, useTx } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { wallpaperAsset } from './collection'

/** "W2 · Dreamy Nights" → "W2" (the collection code), so tabs and URLs stay short. */
const collectionId = (w: Wallpaper) => w.theme.match(/^\s*([A-Za-z]+\d+)/)?.[1] ?? w.theme

/**
 * Every wallpaper, grouped by collection (W1, W2…). Same top section as the sticker page:
 * search + grid/list (phones), and pinned collection tabs that follow what you're reading.
 */
export default function WallpapersPage() {
  const locale = useLocale()
  const tx = useTx()
  const [params, setParams] = useSearchParams()
  const selected = params.get('c') ?? 'all'
  const q = params.get('q') ?? ''
  const deferredQ = useDeferredValue(q)
  const [view, changeView] = useViewMode('nompong.wallpapers.view')
  const sections = useRef<HTMLDivElement>(null)
  const query = useQuery({ queryKey: qk.wallpapers, queryFn: () => api.catalog.listWallpapers() })
  const all = useMemo(() => query.data ?? [], [query.data])

  usePageMeta(
    tx('วอลเปเปอร์', 'Wallpapers'),
    tx('วอลเปเปอร์นมผงฟรี สำหรับมือถือ แท็บเล็ต และคอมพิวเตอร์', 'Free Nompong wallpapers for phone, tablet and computer'),
  )

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  // Collections in the order they come (newest first), each with its display name and count.
  const collections = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: Wallpaper[] }>()
    for (const w of all) {
      const id = collectionId(w)
      const name = locale === 'en' ? w.themeEn || w.theme : w.theme
      if (!map.has(id)) map.set(id, { id, name, items: [] })
      map.get(id)!.items.push(w)
    }
    return [...map.values()]
  }, [all, locale])

  const needle = deferredQ.trim().toLowerCase()
  const groups = collections
    .filter((g) => selected === 'all' || g.id === selected)
    .map((g) => ({
      ...g,
      items: g.items.filter((w) => !needle || [w.titleTh, w.titleEn, w.theme, w.themeEn].some((t) => t?.toLowerCase().includes(needle))),
    }))
    .filter((g) => g.items.length > 0)
  const shown = groups.reduce((n, g) => n + g.items.length, 0)

  const tabs: CollectionTab[] = [
    { id: 'all', label: tx('ทั้งหมด', 'All'), count: all.length },
    ...collections.map((g) => ({ id: g.id, label: g.name, count: g.items.length })),
  ]

  return (
    <Page>
      <PageHeader
        className="mb-5"
        title={tx('วอลเปเปอร์', 'Wallpapers')}
        description={
          all.length
            ? tx(
                `วอลเปเปอร์นมผง ${all.length} แบบ ดาวน์โหลดฟรี เลือกขนาดให้ตรงกับอุปกรณ์ ไม่ต้องสมัครสมาชิก`,
                `${all.length} free Nompong wallpapers. Pick the size for your device; no sign-up needed.`,
              )
            : tx('ดาวน์โหลดฟรี เลือกขนาดให้ตรงกับอุปกรณ์ ไม่ต้องสมัครสมาชิก', 'Free downloads. Pick the size for your device; no sign-up needed.')
        }
      />

      <div className="flex items-center gap-2">
        <SearchField
          className="flex-1"
          inputClassName="sm:h-12"
          value={q}
          onChange={(v) => set('q', v || null)}
          label={tx('ค้นหาวอลเปเปอร์', 'Search wallpapers')}
          placeholder={tx('ค้นหาชื่อหรือคอลเลกชัน เช่น ดวงจันทร์, W2', 'Search a name or collection, e.g. moon, W2')}
          lang="th"
        />
        <ViewSwitch view={view} onChange={changeView} />
      </div>

      {/* Collection tabs stay pinned under the header, like the sticker page. */}
      <CollectionTabs
        tabs={tabs}
        selected={selected}
        onSelect={(id) => set('c', id === 'all' ? null : id)}
        sections={sections}
        resetKey={`${selected}:${deferredQ}:${view}:${locale}:${all.length}`}
        label={tx('คอลเลกชัน', 'Collections')}
      />

      <div className="mt-4" aria-live="polite">
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4" role="status" aria-label={tx('กำลังโหลด', 'Loading')}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[9/19.5] rounded-3xl" />
            ))}
          </div>
        ) : shown === 0 ? (
          <EmptyState
            title={tx('ไม่พบวอลเปเปอร์ที่ตรงกับการค้นหา', 'No wallpapers match your search')}
            description={tx('ลองคำอื่น หรือเลือก “ทั้งหมด”', 'Try another word, or choose “All”')}
          />
        ) : (
          <>
            {deferredQ && (
              <p className="t-meta mb-3">
                {shown} {tx('แบบ', shown === 1 ? 'wallpaper' : 'wallpapers')}
              </p>
            )}
            <div ref={sections} className="space-y-10">
              {groups.map((g) => (
                <section key={g.id} data-collection={g.id} aria-labelledby={`c-${g.id}`}>
                  <h2 id={`c-${g.id}`} className="t-section mb-4 flex items-baseline gap-2 font-display">
                    {g.name}
                    <span className="t-meta tabular-nums">
                      {g.items.length} {tx('แบบ', g.items.length === 1 ? 'design' : 'designs')}
                    </span>
                  </h2>
                  <ul className={cn('grid sm:grid-cols-3 sm:gap-4 md:grid-cols-4', view === 'list' ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4')}>
                    {g.items.map((w) => (
                      <RevealItem key={w.id}>
                        <WallpaperCard w={w} collection={g.name} list={view === 'list'} />
                      </RevealItem>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </Page>
  )
}

/** A wallpaper's preview and name. `list` (phones only): a compact row with a small preview. */
/** "…/moon-cloud-desktop.jpg" → "…/moon-cloud-desktop-thumb.jpg" (480px wide, made for list rows). */
const desktopThumb = (path: string) => path.replace(/-desktop\.(jpe?g|png|webp)$/i, '-desktop-thumb.jpg')

function WallpaperCard({ w, collection, list }: { w: Wallpaper; collection: string; list: boolean }) {
  const locale = useLocale()
  const tx = useTx()
  const desktop = w.variants.find((v) => v.device === 'desktop')?.assetPath
  return (
    <Link
      to={`/wallpapers/${w.slug}`}
      className={cn(
        'group block rounded-3xl transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100',
        list &&
          'max-sm:flex max-sm:min-h-24 max-sm:items-center max-sm:gap-3 max-sm:rounded-2xl max-sm:border max-sm:border-line max-sm:bg-surface max-sm:p-2 max-sm:pr-3',
      )}
    >
      {/* List rows (phones): the wide desktop design reads better in a row than the tall phone one. */}
      {list && desktop && (
        <div className="aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:hidden">
          <img
            src={wallpaperAsset(desktopThumb(desktop))}
            onError={(e) => {
              // No small thumbnail for this one yet: use the full desktop image.
              const full = wallpaperAsset(desktop)
              if (e.currentTarget.src !== new URL(full, location.href).href) e.currentTarget.src = full
            }}
            alt=""
            loading="lazy"
            width={480}
            height={270}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className={cn('overflow-hidden rounded-3xl bg-surface-muted shadow-sm', list && desktop && 'max-sm:hidden')}>
        <img
          src={wallpaperAsset(w.previewPath!)}
          alt=""
          loading="lazy"
          width={w.variants[0].width}
          height={w.variants[0].height}
          className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none"
        />
      </div>
      <div className={cn(list && 'max-sm:min-w-0 max-sm:flex-1')}>
        <p className={cn('mt-2 font-display text-base', list && 'max-sm:mt-0')}>{locale === 'en' ? w.titleEn : w.titleTh}</p>
        <p className="text-sm text-muted">
          {list && <span className="sm:hidden">{collection} · </span>}
          {w.variants.length} {tx('ขนาด', 'sizes')}
        </p>
      </div>
      {list && <ChevronRight size={18} className="shrink-0 text-muted sm:hidden" aria-hidden />}
    </Link>
  )
}
