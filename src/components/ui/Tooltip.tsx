import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

const SHOW_DELAY = 350
const MARGIN = 8

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  /** Disable without unmounting the wrapper. */
  disabled?: boolean
  side?: 'top' | 'bottom'
  className?: string
}

/**
 * The one tooltip (UI.md §4): never the native `title`. Shows after 350ms,
 * positioned at the cursor, portaled so no ancestor clips it, and suppressed
 * below `lg` where hover is not a deliberate gesture.
 *
 * The wrapper is `display: contents`, so positioning measures its child.
 * Icon-only triggers still need their own `aria-label`.
 */
export function Tooltip({ content, children, disabled, side = 'top', className }: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const anchor = useRef<{ x: number; y: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  const schedule = useCallback(
    (point: { x: number; y: number } | null) => {
      if (disabled || !content) return
      if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches) return
      anchor.current = point
      clear()
      timer.current = setTimeout(() => setOpen(true), SHOW_DELAY)
    },
    [disabled, content],
  )

  const hide = () => {
    clear()
    setOpen(false)
  }

  useEffect(() => clear, [])

  useLayoutEffect(() => {
    if (!open || !tipRef.current) return
    const tip = tipRef.current.getBoundingClientRect()
    let x: number
    let y: number
    if (anchor.current) {
      x = anchor.current.x
      y = anchor.current.y
    } else {
      const child = wrapRef.current?.firstElementChild as HTMLElement | null
      const r = child?.getBoundingClientRect()
      x = r ? r.left + r.width / 2 : 0
      y = r ? (side === 'top' ? r.top : r.bottom) : 0
    }
    let top = side === 'top' ? y - tip.height - MARGIN - 4 : y + MARGIN + 12
    if (top < MARGIN) top = y + MARGIN + 12
    const left = Math.min(Math.max(MARGIN, x - tip.width / 2), window.innerWidth - tip.width - MARGIN)
    setPos({ top, left })
  }, [open, side])

  return (
    <>
      <span
        ref={wrapRef}
        style={{ display: 'contents' }}
        onMouseEnter={(e) => schedule({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => {
          if (!open) anchor.current = { x: e.clientX, y: e.clientY }
        }}
        onMouseLeave={hide}
        onFocus={() => schedule(null)}
        onBlur={hide}
        onPointerDown={hide}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[100] max-w-xs rounded-md bg-brown-800 px-2 py-1 text-xs leading-snug text-cream shadow-lg',
              className,
            )}
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}
