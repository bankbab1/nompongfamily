import { useEffect, useState } from 'react'
import { NompongArt } from '@/features/nompong/art'
import { pick } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

const SHOW_MS = 900
const FADE_MS = 300

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** The intro plays every time the Studio opens, unless the visitor prefers reduced motion. */
export function shouldPlayStudioIntro() {
  return !reduced()
}

/**
 * A short "opening the studio" moment: Nompong pops in with a wiggle on a yellow disc while three
 * paint dots bounce. Under a second, each time the Studio opens; tap anywhere to skip. `onDone` fires when it
 * starts fading, so the page underneath can begin its own entrance.
 */
export function StudioIntro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  const finish = () => {
    if (leaving) return
    setLeaving(true)
    onDone()
    window.setTimeout(() => setGone(true), FADE_MS)
  }

  useEffect(() => {
    const t = window.setTimeout(finish, SHOW_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (gone) return null
  return (
    <div
      role="status"
      aria-label={pick({ th: 'กำลังเปิดสตูดิโอ', en: 'Opening the studio' })}
      onClick={finish}
      className={cn(
        'fixed inset-0 z-40 flex flex-col items-center justify-center bg-background transition-opacity ease-out',
        leaving ? 'opacity-0' : 'opacity-100',
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="studio-intro-disc flex h-40 w-40 items-center justify-center rounded-full bg-sunny-100" aria-hidden>
        <NompongArt pose="wave" className="studio-intro-pop h-32 w-auto" decorative />
      </div>
      <div className="mt-6 flex gap-1.5" aria-hidden>
        {['bg-sunny', 'bg-brown-400', 'bg-brown'].map((c, i) => (
          <span key={c} className={cn('studio-intro-dot h-2.5 w-2.5 rounded-full', c)} style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </div>
      <p className="mt-3 font-display text-base text-muted">{pick({ th: 'กำลังเปิดสตูดิโอ…', en: 'Opening the studio…' })}</p>
    </div>
  )
}
