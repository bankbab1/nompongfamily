import { useEffect, useState, type RefObject } from 'react'

/** Reading position is independent of the URL filter: scrolling never hides other collections. */
export function useCollectionScroll(root: RefObject<HTMLElement | null>, bar: RefObject<HTMLElement | null>, resetKey: string) {
  const [active, setActive] = useState('all')
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      if (!root.current || !bar.current) { setActive('all'); return }
      const edge = bar.current.getBoundingClientRect().bottom
      const line = edge + Math.max(24, (window.innerHeight - edge) * 0.25)
      let next = 'all'
      for (const section of root.current.querySelectorAll<HTMLElement>('[data-collection]')) {
        if (section.getBoundingClientRect().top <= line) next = section.dataset.collection ?? next
        else break
      }
      setActive(next)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    if (root.current) observer?.observe(root.current)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [root, bar, resetKey])
  return active
}
