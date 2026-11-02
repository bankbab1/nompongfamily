import { useEffect, useRef, useState } from 'react'
import { useTx } from '@/lib/i18n'
import { LayeredMascot } from './LayeredMascot'
import { cn } from '@/lib/utils/cn'

export type MascotPose = 'greeting' | 'curious' | 'studio' | 'sleep' | 'success'
/** Dedicated alpha artwork; motion is intentionally small and never changes the character's anatomy. */
export function NompongMascot({ pose = 'greeting', interactive = false, decorative = false, className }: {
  pose?: MascotPose; interactive?: boolean; decorative?: boolean; className?: string
}) {
  const tx = useTx()
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [foreground, setForeground] = useState(true)
  const [reaction, setReaction] = useState(0)
  useEffect(() => {
    const element = host.current
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    if (element) observer?.observe(element)
    const change = () => setForeground(document.visibilityState !== 'hidden')
    change()
    document.addEventListener('visibilitychange', change)
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', change) }
  }, [])
  const labels = {
    greeting: tx('นมผงทักทาย', 'Nompong says hello'), curious: tx('นมผงเอียงหัวสงสัย', 'Curious Nompong'),
    studio: tx('นมผงพร้อมวาดรูป', 'Nompong is ready to draw'), sleep: tx('นมผงนอนหลับ', 'Sleeping Nompong'),
    success: tx('นมผงดีใจ', 'Happy Nompong'),
  }
  const art = (
    <span key={reaction} style={{ animationPlayState: visible && foreground ? 'running' : 'paused' }} className={cn('block h-full w-full', reaction > 0 && (pose === 'curious' ? 'mascot-curious-reaction' : pose === 'studio' ? 'mascot-studio-reaction' : 'mascot-reaction'))}>
      {(pose === 'greeting' || pose === 'curious') ? <LayeredMascot paused={!visible || !foreground} reacting={reaction > 0} label={decorative || interactive ? undefined : labels[pose]} /> : <img src={`${import.meta.env.BASE_URL}nompong/mascot-${pose}.webp`} alt={decorative || interactive ? '' : labels[pose]}
        width="1024" height="1024" draggable={false} decoding="async"
        className={cn('h-full w-full select-none object-contain', pose === 'success' ? 'mascot-celebrate' : pose === 'sleep' ? 'mascot-sleep' : 'mascot-breathe')}
        style={{ animationPlayState: visible && foreground ? 'running' : 'paused' }} />}
    </span>
  )
  return <div ref={host} className={cn('aspect-square w-full', className)}>
    {interactive ? <button type="button" onClick={() => setReaction((n) => n + 1)} aria-label={tx('ทักทายนมผง', 'Say hello to Nompong')}
      className="block h-full w-full cursor-pointer rounded-full border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brown">{art}</button> :
      <div className="h-full w-full" aria-hidden={decorative || undefined}>{art}</div>}
  </div>
}
