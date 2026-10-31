import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

/*
 * Types text out automatically, one grapheme at a time, with a blinking caret.
 * - One phrase: types it once on every mount.
 * - Several phrases: types one, pauses, erases it, then types the next, forever.
 * - Thai-safe: steps by grapheme cluster, so tone marks and vowels never appear on their own.
 * - No layout shift: every phrase is laid out invisibly in the same spot, so the box is always
 *   the size of the longest one and nothing below it jumps.
 * - Screen readers get the first phrase at once; reduced motion shows it with no animation.
 */
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
  }
  return Array.from(text)
}

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED_MOTION).matches

export function TypingText({ phrases, className, caretClassName }: { phrases: string[]; className?: string; caretClassName?: string }) {
  // Restart cleanly when the phrases change (e.g. switching TH/EN).
  return <Typing key={phrases.join('\u0000')} phrases={phrases} className={className} caretClassName={caretClassName} />
}

function Typing({ phrases, className, caretClassName }: { phrases: string[]; className?: string; caretClassName?: string }) {
  const still = reduced()
  const loop = phrases.length > 1
  const [index, setIndex] = useState(0)
  const parts = graphemes(phrases[index] ?? '')
  const [shown, setShown] = useState(still ? parts.length : 0)
  const [erasing, setErasing] = useState(false)

  useEffect(() => {
    if (still) return
    let timer: number
    // About 1.4 s to type a line, whatever its length; erasing is twice as fast.
    const typeStep = Math.min(80, Math.max(35, 1400 / parts.length))
    if (!erasing) {
      if (shown < parts.length) timer = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 400 : typeStep)
      else if (loop) timer = window.setTimeout(() => setErasing(true), 2200)
    } else if (shown > 0) {
      timer = window.setTimeout(() => setShown((n) => n - 1), typeStep / 2)
    } else {
      setErasing(false)
      setIndex((i) => (i + 1) % phrases.length)
    }
    return () => window.clearTimeout(timer)
  }, [still, loop, shown, erasing, parts.length, phrases.length])

  const done = !loop && shown >= parts.length

  return (
    <span className={cn('inline-grid', className)}>
      <span className="sr-only">{phrases[0]}</span>
      {/* Every phrase, invisible, stacked in one cell: reserves the size of the longest one. */}
      {phrases.map((p) => (
        <span key={p} aria-hidden className="invisible col-start-1 row-start-1">
          {p}
        </span>
      ))}
      <span aria-hidden className="col-start-1 row-start-1">
        {parts.slice(0, shown).join('')}
        {!still && !done && <Caret className={caretClassName} />}
      </span>
    </span>
  )
}

/** A zero-width inline anchor, so the caret never pushes or re-wraps the text around it. */
function Caret({ className }: { className?: string }) {
  return (
    <span className="relative">
      <span className={cn('animate-caret-blink absolute top-[0.14em] left-[0.06em] h-[1em] w-[0.07em] rounded-full bg-current', className)} />
    </span>
  )
}
