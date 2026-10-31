import { ChevronLeft, ChevronRight, Eraser } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { TextArea, TextField } from '@/components/ui/Field'
import { NompongArt, type NompongPose } from '@/features/nompong/art'
import { fill, useCopy } from '@/lib/copy'
import { cn } from '@/lib/utils/cn'
import { emptySticker, ERROR_LIMIT, isFilled, LIMITS, type StickerIdea, type SuggestionErrorCode, type SuggestionErrors } from './model'

/**
 * Sticker editing: one big card per sticker in a swipeable row (scroll-snap), with
 * previous/next buttons and a number strip above it for jumping around.
 */

const PREVIEW_POSES: NompongPose[] = ['sit', 'wave', 'curious', 'sleep', 'lazy', 'side']

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** "‹  Sticker 3 of 24  ›" */
export function StickerPager({ active, total, onGo }: { active: number; total: number; onGo: (i: number) => void }) {
  const b = useCopy().builder
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <Button variant="secondary" iconOnly label={b.prev} icon={<ChevronLeft size={22} />} disabled={active === 0} onClick={() => onGo(active - 1)} />
      <p className="text-sm font-semibold tabular-nums" aria-live="polite">
        {fill(b.stickerOf, { n: active + 1, total })}
      </p>
      <Button variant="secondary" iconOnly label={b.next} icon={<ChevronRight size={22} />} disabled={active === total - 1} onClick={() => onGo(active + 1)} />
    </div>
  )
}

/** Numbers to jump to a sticker. A scrolling row of circles on phones; a grid with each word on larger screens. */
export function StickerStrip({
  stickers,
  active,
  onSelect,
  errorAt,
}: {
  stickers: StickerIdea[]
  active: number
  onSelect: (i: number) => void
  errorAt: SuggestionErrors['stickers']
}) {
  const b = useCopy().builder
  const strip = useRef<HTMLUListElement>(null)

  // Keep the active number in view on the phone strip without moving the page.
  useEffect(() => {
    const el = strip.current
    const chip = el?.children[active] as HTMLElement | undefined
    if (!el || !chip || el.scrollWidth <= el.clientWidth) return
    el.scrollTo({
      left: chip.offsetLeft - el.clientWidth / 2 + chip.clientWidth / 2,
      behavior: reduceMotion() ? 'auto' : 'smooth',
    })
  }, [active])

  return (
    <ul
      ref={strip}
      aria-label={b.gridLabel}
      className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 py-1 sm:mx-0 sm:grid sm:grid-cols-6 sm:overflow-visible sm:px-0 xl:grid-cols-8"
    >
      {stickers.map((s, i) => {
        const on = i === active
        const bad = !!errorAt[i]
        const done = isFilled(s)
        return (
          <li key={i} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={on ? 'true' : undefined}
              aria-label={`${fill(b.sticker, { n: i + 1 })}: ${s.word || (done ? s.style : b.empty)}`}
              className={cn(
                'relative flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors',
                'sm:h-14 sm:w-full sm:flex-col sm:items-start sm:justify-start sm:rounded-xl sm:px-2 sm:py-1.5',
                on
                  ? 'border-brown bg-brown text-cream'
                  : bad
                    ? 'border-danger text-danger'
                    : done
                      ? 'border-transparent bg-surface-muted text-ink'
                      : 'border-line bg-surface text-muted hover:border-line-strong',
              )}
            >
              <span className="sm:text-xs">{i + 1}</span>
              <span className={cn('hidden w-full truncate text-left text-[13px] leading-tight font-medium sm:block', on ? 'text-cream' : 'text-ink')}>
                {s.word}
              </span>
              {done && !on && (
                <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success sm:top-1.5 sm:right-1.5" aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** One big card per sticker; swipe sideways (or use the pager) to move between them. */
export function StickerCarousel({
  stickers,
  active,
  onActive,
  errorsAt,
  onChange,
}: {
  stickers: StickerIdea[]
  active: number
  onActive: (i: number) => void
  errorsAt: SuggestionErrors['stickers']
  onChange: (i: number, patch: Partial<StickerIdea>) => void
}) {
  const c = useCopy()
  const b = c.builder
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLInputElement | null)[]>([])
  const focusNext = useRef<number | null>(null)
  const drag = useRef<{
    id: number
    x: number
    y: number
    dx: number
    on: boolean
  } | null>(null)
  const errText = (code?: SuggestionErrorCode) => (code ? fill(c.errors[code], { max: ERROR_LIMIT[code] }) : undefined)

  /* The row is moved with a transform, not native scrolling, so nothing on the page can
     interrupt it. Swipes are handled here; vertical page scrolling is left to the browser. */
  const place = (dx = 0, animate = true) => {
    const el = track.current
    if (!el) return
    el.style.transition = animate && !reduceMotion() ? 'transform 280ms cubic-bezier(.2,.8,.2,1)' : 'none'
    el.style.transform = `translateX(calc(${-active * 100}% + ${dx}px))`
  }

  useEffect(() => {
    place()
    // After Enter, focus the next card's word once it is no longer inert.
    if (focusNext.current === active) {
      wordRefs.current[active]?.focus({ preventScroll: true })
      focusNext.current = null
    }
  })

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return // mouse users have the arrows and number strip
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      dx: 0,
      on: false,
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null // vertical: let the page scroll
        return
      }
      if (Math.abs(dx) < 10) return
      d.on = true
      try {
        viewport.current?.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already released: the swipe still works without capture */
      }
    }
    // Resist at the first and last card.
    const edge = (active === 0 && dx > 0) || (active === stickers.length - 1 && dx < 0)
    d.dx = edge ? dx / 3 : dx
    place(d.dx, false)
  }

  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d || d.id !== e.pointerId || !d.on) return
    const width = viewport.current?.clientWidth ?? 1
    const step = Math.abs(d.dx) > width * 0.18 ? (d.dx < 0 ? 1 : -1) : 0
    const next = Math.min(stickers.length - 1, Math.max(0, active + step))
    if (next !== active) onActive(next)
    else place()
  }

  const goNextFrom = (i: number) => {
    if (i >= stickers.length - 1) return
    focusNext.current = i + 1
    onActive(i + 1)
  }

  return (
    <div
      ref={viewport}
      role="group"
      aria-roledescription="carousel"
      aria-label={b.step2}
      className="touch-pan-y overflow-x-clip"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div ref={track} className="flex items-start will-change-transform">
        {stickers.map((s, i) => {
          const err = errorsAt[i]
          return (
            <section
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={fill(b.stickerOf, {
                n: i + 1,
                total: stickers.length,
              })}
              // Only the card in view takes focus; swiping still reveals the others.
              inert={i !== active}
              className="w-full shrink-0 px-0.5"
            >
              <div className={cn('rounded-3xl border bg-surface p-4 sm:p-5', 'border-line', err && 'border-danger')}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-base">{fill(b.sticker, { n: i + 1 })}</h3>
                  <Button size="sm" variant="ghost" icon={<Eraser size={16} />} disabled={!isFilled(s)} onClick={() => onChange(i, emptySticker())}>
                    {b.clear}
                  </Button>
                </div>

                {/* Big preview: how the word sits on a Nompong sticker */}
                <div
                  className="relative mx-auto mb-4 flex aspect-square w-full max-w-[17rem] items-start justify-center overflow-hidden rounded-2xl bg-sunny-50 pt-[9%] sm:max-w-[19rem]"
                  aria-hidden
                >
                  <NompongArt pose={PREVIEW_POSES[i % PREVIEW_POSES.length]} className="h-[68%] w-auto" decorative />
                  <span
                    className={cn(
                      'absolute inset-x-3 bottom-3 truncate rounded-xl px-3 py-1.5 text-center font-display text-xl sm:text-2xl',
                      s.word.trim() ? 'bg-surface text-ink' : 'bg-surface/70 text-muted/70',
                    )}
                  >
                    {s.word.trim() || b.wordPh}
                  </span>
                </div>

                <div className="space-y-4">
                  <TextField
                    ref={(el) => {
                      wordRefs.current[i] = el
                    }}
                    label={b.word}
                    placeholder={b.wordPh}
                    value={s.word}
                    onChange={(e) => onChange(i, { word: e.target.value })}
                    maxChars={LIMITS.word}
                    error={errText(err?.word)}
                    autoComplete="off"
                    enterKeyHint="next"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        goNextFrom(i)
                      }
                    }}
                  />
                  <TextArea
                    label={b.style}
                    placeholder={b.stylePh}
                    value={s.style}
                    onChange={(e) => onChange(i, { style: e.target.value })}
                    maxChars={LIMITS.style}
                    error={errText(err?.style)}
                    rows={3}
                  />
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
