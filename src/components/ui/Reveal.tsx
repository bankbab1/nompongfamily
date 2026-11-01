import { useEffect, useRef, type LiHTMLAttributes } from 'react'

/*
 * Cards that appear one after another as they come into view.
 * One shared IntersectionObserver for the whole page: the items that enter together in one batch
 * (a screenful at first, then each new row while scrolling) are staggered by their order in it.
 * The look lives in globals.css ([data-reveal]). Reduced motion turns the animation off there.
 */
const STEP_MS = 45
const MAX_STEPS = 12

let observer: IntersectionObserver | null = null

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      let n = 0
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        el.style.animationDelay = `${Math.min(n++, MAX_STEPS) * STEP_MS}ms`
        el.dataset.shown = ''
        observer?.unobserve(el)
      }
    },
    { rootMargin: '0px 0px -4% 0px' },
  )
  return observer
}

/** A list item that animates in the first time it scrolls into view. */
export function RevealItem(props: LiHTMLAttributes<HTMLLIElement>) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.shown = '' // no observer: just show it
      return
    }
    const io = getObserver()
    io.observe(el)
    return () => io.unobserve(el)
  }, [])
  return <li ref={ref} data-reveal="" {...props} />
}
