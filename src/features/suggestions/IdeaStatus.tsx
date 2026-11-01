import { BadgeCheck, Brush, CircleOff, Hourglass, Store, type LucideIcon } from 'lucide-react'
import { pick, useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import type { IdeaStatus } from './model'

/** How each idea status reads and looks, for the fan and the admin alike. */
export const IDEA_STATUS_INFO: Record<IdeaStatus, { label: { th: string; en: string }; hint: { th: string; en: string }; icon: LucideIcon; tone: string }> = {
  pending: {
    label: { th: 'รอพิจารณา', en: 'Pending review' },
    hint: { th: 'ทีมยังไม่ได้ดูไอเดียนี้', en: 'The team hasn’t reviewed this idea yet' },
    icon: Hourglass,
    tone: 'bg-surface-muted text-muted',
  },
  selected: {
    label: { th: 'ได้รับเลือก', en: 'Selected' },
    hint: { th: 'ทีมจะทำชุดนี้', en: 'The team will make this set' },
    icon: BadgeCheck,
    tone: 'bg-info-soft text-info',
  },
  drawing: {
    label: { th: 'กำลังวาด', en: 'Being drawn' },
    hint: { th: 'กำลังวาดสติกเกอร์อยู่', en: 'The stickers are being drawn' },
    icon: Brush,
    tone: 'bg-warning-soft text-ink',
  },
  published: {
    label: { th: 'วางขายแล้ว', en: 'On LINE' },
    hint: { th: 'ชุดนี้วางขายใน LINE STORE แล้ว', en: 'This set is on the LINE STORE' },
    icon: Store,
    tone: 'bg-success-soft text-success',
  },
  declined: {
    label: { th: 'ไม่ได้รับเลือก', en: 'Not selected' },
    hint: { th: 'รอบนี้ยังไม่ได้เลือกชุดนี้', en: 'This one wasn’t picked this time' },
    icon: CircleOff,
    tone: 'bg-surface-muted text-muted',
  },
}

export function IdeaStatusBadge({ status, className }: { status: IdeaStatus; className?: string }) {
  const locale = useLocale()
  const info = IDEA_STATUS_INFO[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', info.tone, className)}>
      <info.icon size={13} aria-hidden />
      {pick(info.label, locale)}
    </span>
  )
}
