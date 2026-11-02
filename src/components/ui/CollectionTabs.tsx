import { useEffect, useRef, type RefObject } from 'react'
import { cn } from '@/lib/utils/cn'
import { SlidingPill, useSlidingPill } from './SlidingPill'
import { useCollectionScroll } from './useCollectionScroll'

export interface CollectionTab {
  id: string
  label: string
  count: number
}

/**
 * The pinned tab bar for a page made of collections (stickers by version, wallpapers by series):
 * "All" plus one tab per collection, each with a count chip. It sticks under the header, a single
 * highlight slides between tabs, and while "All" is chosen the highlight follows whichever
 * collection you're reading (sections marked `data-collection` inside `sections`).
 * The active tab is kept scrolled into view on narrow screens.
 */
export function CollectionTabs({
  tabs,
  selected,
  onSelect,
  sections,
  resetKey,
  label,
}: {
  /** Include the "All" tab first, with id `all`. */
  tabs: CollectionTab[]
  /** The filter in the URL: `all` or a collection id. */
  selected: string
  onSelect: (id: string) => void
  sections: RefObject<HTMLElement | null>
  /** Changes whenever the list's layout changes (filter, search, view, language). */
  resetKey: string
  label: string
}) {
  const bar = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const reading = useCollectionScroll(sections, bar, resetKey)
  const active = selected === 'all' ? reading : selected
  const pill = useSlidingPill(track, '[aria-pressed="true"]', [active, tabs.map((t) => t.label).join()])

  useEffect(() => {
    const container = scroller.current
    const button = track.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!container || !button) return
    const left =
      container.scrollLeft + button.getBoundingClientRect().left - container.getBoundingClientRect().left + button.offsetWidth / 2 - container.clientWidth / 2
    container.scrollTo({ left: Math.max(0, left), behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [active])

  return (
    <div ref={bar} className="sticky top-16 z-20 -mx-4 mt-3 bg-background/90 px-4 py-2.5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div ref={scroller} className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div ref={track} role="group" aria-label={label} className="relative inline-flex rounded-full bg-surface-muted p-1">
          <SlidingPill pill={pill.pill} ready={pill.ready} className="selected-chip rounded-full" />
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={active === t.id}
              onClick={() => {
                onSelect(t.id)
                window.scrollTo({ top: 0, behavior: t.id === 'all' ? 'instant' : 'smooth' })
              }}
              className={cn(
                'relative inline-flex min-h-9 items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3.5 text-sm whitespace-nowrap transition-colors duration-300',
                active === t.id ? 'font-semibold text-ink' : 'font-medium text-muted hover:text-ink',
              )}
            >
              {t.label}
              {/* The count as its own small chip, so it reads apart from the name. */}
              <span
                className={cn(
                  'min-w-7 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-none font-semibold tabular-nums transition-colors duration-300',
                  active === t.id ? 'brand-primary' : 'bg-line/70 text-muted',
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
