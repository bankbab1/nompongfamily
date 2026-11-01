import { Briefcase, Heart, House, Laugh, PartyPopper, Smile, Sparkles, Sun, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { MoodId } from './model'

/** One icon per set mood. The app uses icons, never emoji, so they look the same on every device. */
export const MOOD_ICONS: Record<MoodId, LucideIcon> = {
  cute: Smile,
  funny: Laugh,
  daily: Sun,
  work: Briefcase,
  love: Heart,
  family: House,
  festival: PartyPopper,
  other: Sparkles,
}

export function MoodIcon({ id, size = 15, className }: { id: MoodId; size?: number; className?: string }) {
  const Icon = MOOD_ICONS[id] ?? Sparkles
  return <Icon size={size} className={cn('shrink-0', className)} aria-hidden />
}
