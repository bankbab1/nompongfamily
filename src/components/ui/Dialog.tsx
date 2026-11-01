import * as RDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { pick } from '@/lib/i18n'

/**
 * Dialogs opened from state would return focus to <body> on close; remember the
 * element that had focus and restore it (WCAG focus restoration).
 */
function useReturnFocus(open: boolean) {
  const returnTo = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (open) returnTo.current = document.activeElement as HTMLElement | null
  }, [open])
  return (event: Event) => {
    const el = returnTo.current
    if (el && el !== document.body && document.contains(el)) {
      event.preventDefault()
      el.focus()
    }
  }
}

/** Phones get the bottom-sheet layout (matches the `sm:` breakpoint below). */
const isSheet = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639.98px)').matches
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Swipe a bottom sheet down to close it, like native iOS/Android sheets.
 * - Drag from the handle, header or footer any time; from the body only while it is scrolled to the
 *   top (otherwise the drag scrolls the content as usual).
 * - The sheet follows the finger and the backdrop fades. Let go past ~30% of its height, or flick
 *   down, to close; anything less springs back.
 * - Sideways swipes are left alone (e.g. the sticker viewer's left/right swipe).
 * Touch events, not pointer events: a non-passive touchmove is the only way to stop the page
 * underneath from scrolling on iOS while the sheet is being dragged.
 */
function useSwipeToClose(
  sheet: HTMLDivElement | null,
  body: React.RefObject<HTMLDivElement | null>,
  overlay: React.RefObject<HTMLDivElement | null>,
  open: boolean,
  enabled: boolean,
  close: () => void,
) {
  useEffect(() => {
    const el = sheet
    if (!open || !enabled || !el) return
    el.style.removeProperty('--sheet-exit-y')
    overlay.current?.style.removeProperty('--sheet-exit-opacity')
    let start: { x: number; y: number; t: number } | null = null
    let dragging = false
    let dy = 0

    const setY = (y: number, animate: boolean) => {
      el.style.transition = animate && !reduceMotion() ? 'transform 240ms cubic-bezier(.2,.8,.2,1)' : 'none'
      el.style.transform = y ? `translateY(${y}px)` : ''
      const o = overlay.current
      if (o) {
        o.style.transition = animate ? 'opacity 240ms ease' : 'none'
        o.style.opacity = y ? String(Math.max(0.15, 1 - y / el.offsetHeight)) : ''
      }
    }

    const onStart = (e: TouchEvent) => {
      if (!isSheet() || e.touches.length !== 1) return
      const target = e.target as HTMLElement
      if (body.current?.contains(target) && body.current.scrollTop > 0) return
      // Text fields keep their own drag (selecting text, moving the caret).
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() }
      dragging = false
      dy = 0
    }

    const onMove = (e: TouchEvent) => {
      if (!start) return
      const mx = e.touches[0].clientX - start.x
      const my = e.touches[0].clientY - start.y
      if (!dragging) {
        if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my)) {
          start = null // sideways: not ours
          return
        }
        if (my < -6) {
          start = null // upwards: let the content scroll
          return
        }
        if (my < 8) return
        dragging = true
      }
      e.preventDefault()
      dy = Math.max(0, my)
      setY(dy, false)
    }

    const onEnd = () => {
      if (!start) return
      const velocity = dy / Math.max(1, performance.now() - start.t) // px per ms
      start = null
      if (!dragging) return
      dragging = false
      if (dy > el.offsetHeight * 0.3 || (dy > 40 && velocity > 0.5)) {
        // Let Radix Presence keep the sheet mounted for the same exit animation used by
        // backdrop taps, Escape and the close button. Continue from the finger's position.
        el.style.setProperty('--sheet-exit-y', `${dy}px`)
        overlay.current?.style.setProperty('--sheet-exit-opacity', String(Math.max(0.15, 1 - dy / el.offsetHeight)))
        el.style.transform = ''
        el.style.transition = ''
        if (overlay.current) {
          overlay.current.style.opacity = ''
          overlay.current.style.transition = ''
        }
        close()
      } else setY(0, true)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
      el.style.transform = ''
      el.style.transition = ''
    }
  }, [sheet, body, overlay, open, enabled, close])
}

/**
 * On open, focus the dialog itself rather than its first button, so the close button doesn't light
 * up with a focus ring the moment a sheet appears. Keyboard users Tab on from there. If something
 * inside already took focus on purpose (an `autoFocus` button), leave it.
 */
const focusDialog = (e: Event) => {
  const content = e.currentTarget as HTMLElement | null
  e.preventDefault()
  if (content && !content.contains(document.activeElement)) content.focus()
}

export interface ResponsiveModalProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Prevent dismissing on backdrop click (e.g. unsaved comment). */
  closeOnBackdrop?: boolean
  className?: string
}

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-5xl' }

const closeBtn = '-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-ink'

/** Bottom sheet below 640px (thumb-reachable, safe-area aware), centred dialog above. */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className,
}: ResponsiveModalProps) {
  const onCloseAutoFocus = useReturnFocus(open)
  const hasBody = children !== null && children !== undefined && children !== false
  // State, not a ref: the sheet mounts after this component's first effects run, and the swipe
  // listeners need to attach once it exists.
  const [sheet, setSheet] = useState<HTMLDivElement | null>(null)
  const body = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  // Latest onOpenChange, behind a callback that never changes, so the swipe listeners stay attached.
  const onOpenChangeRef = useRef(onOpenChange)
  useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })
  const close = useRef(() => onOpenChangeRef.current(false)).current
  useSwipeToClose(sheet, body, overlay, open, closeOnBackdrop, close)
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay ref={overlay} className="fixed inset-0 z-50 bg-brown-800/40 backdrop-blur-[1px] max-sm:motion-safe:data-[state=open]:animate-[fade-in_200ms_ease-out] max-sm:motion-safe:data-[state=closed]:animate-[sheet-backdrop-out_240ms_ease-out_forwards]" />
        <RDialog.Content
          ref={setSheet}
          onPointerDownOutside={(e) => !closeOnBackdrop && e.preventDefault()}
          onOpenAutoFocus={focusDialog}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'fixed z-50 flex flex-col border-line bg-surface shadow-2xl focus:outline-none',
            'max-sm:motion-safe:data-[state=open]:animate-[sheet-in_260ms_cubic-bezier(.2,.8,.2,1)] max-sm:motion-safe:data-[state=closed]:animate-[sheet-out_240ms_cubic-bezier(.2,.8,.2,1)_forwards]',
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl border-t',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border',
            widths[size],
            className,
          )}
        >
          {/* Grab handle: shows the sheet can be swiped down. */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden" aria-hidden>
            <span className="h-1.5 w-10 rounded-full bg-line-strong" />
          </div>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3">
            <div className="min-w-0 pt-1.5">
              <RDialog.Title className="font-display text-lg font-medium text-ink">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-0.5 text-sm text-muted">{description}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</RDialog.Description>
              )}
            </div>
            <RDialog.Close className={closeBtn} aria-label={pick({ th: 'ปิด', en: 'Close' })}>
              <X size={20} />
            </RDialog.Close>
          </div>
          {hasBody && (
            <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
          )}
          {footer && (
            <div className={cn('mobile-sticky-actions flex flex-col-reverse gap-2 border-line px-5 pt-3 sm:flex-row sm:items-center sm:justify-end sm:pb-3', hasBody && 'border-t')}>
              {footer}
            </div>
          )}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

/** Right-hand details drawer (proof details, admin panels); full-width on phones. */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: Omit<ResponsiveModalProps, 'size' | 'closeOnBackdrop' | 'className'> & { wide?: boolean }) {
  const onCloseAutoFocus = useReturnFocus(open)
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-brown-800/30" />
        <RDialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface shadow-2xl focus:outline-none',
            wide ? 'md:max-w-3xl' : 'sm:max-w-xl',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3">
            <div className="min-w-0 pt-1.5">
              <RDialog.Title className="font-display text-lg font-medium text-ink">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-0.5 text-sm text-muted">{description}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{pick({ th: 'รายละเอียด', en: 'Details' })}</RDialog.Description>
              )}
            </div>
            <RDialog.Close className={closeBtn} aria-label={pick({ th: 'ปิด', en: 'Close' })}>
              <X size={20} />
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="mobile-sticky-actions flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 pt-3">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}
