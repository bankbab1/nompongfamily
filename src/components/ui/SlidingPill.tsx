import { useEffect, useLayoutEffect, useState, type DependencyList, type RefObject } from 'react'
import { cn } from '@/lib/utils/cn'

interface PillBox {
  left: number
  top: number
  width: number
  height: number
  on: boolean
}

/**
 * Measures the selected item inside `track` (found with `selector`) so one highlight can slide to it,
 * instead of the highlight jumping between items. Re-measures on resize and whenever `deps` change.
 * The first paint has no slide; only later changes animate.
 */
export function useSlidingPill(track: RefObject<HTMLElement | null>, selector: string, deps: DependencyList) {
  const [pill, setPill] = useState<PillBox | null>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const measure = () => {
      const root = track.current
      const el = root?.querySelector<HTMLElement>(selector)
      if (!root || !el) {
        setPill((p) => (p ? { ...p, on: false } : null))
        return
      }
      const r = root.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      setPill({ left: b.left - r.left - root.clientLeft, top: b.top - r.top - root.clientTop, width: b.width, height: b.height, on: true })
    }
    measure()
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (ro && track.current) ro.observe(track.current)
    return () => ro?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 60)
    return () => window.clearTimeout(id)
  }, [])

  return { pill, ready }
}

/** The highlight itself. Put it first inside a `relative` track; items above it need `relative`. */
export function SlidingPill({ pill, ready, className }: { pill: PillBox | null; ready: boolean; className?: string }) {
  if (!pill) return null
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-0 left-0',
        ready && 'transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(.3,1.2,.5,1)] motion-reduce:transition-none',
        !pill.on && 'opacity-0',
        className,
      )}
      style={{ width: pill.width, height: pill.height, transform: `translate(${pill.left}px, ${pill.top}px)` }}
    />
  )
}
