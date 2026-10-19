import { Check, CircleDashed, PenLine, RotateCcw, ThumbsUp } from 'lucide-react'
import type { Ref } from 'react'
import { t } from '@/lib/i18n'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'

export type SlotVisualState = 'empty' | 'partial' | 'complete' | 'revision' | 'approved'

const styles: Record<SlotVisualState, string> = {
  empty: 'border-dashed border-line-strong bg-surface text-muted',
  partial: 'border-sunny-200 bg-sunny-100 text-brown',
  complete: 'border-brown bg-brown text-cream',
  revision: 'border-danger/40 bg-danger-soft text-danger',
  approved: 'border-success/40 bg-success-soft text-success',
}

const icons: Record<SlotVisualState, typeof Check> = {
  empty: CircleDashed,
  partial: PenLine,
  complete: Check,
  revision: RotateCcw,
  approved: ThumbsUp,
}

const iconColor: Record<SlotVisualState, string> = {
  empty: 'text-muted',
  partial: 'text-brown',
  complete: 'text-brown',
  revision: 'text-danger',
  approved: 'text-success',
}

/**
 * Numbered slot button (spec §6.4). State is shown by fill, border style AND an icon,
 * and announced in the accessible name — never colour alone.
 */
export function StickerSlotChip({
  position,
  state,
  selected,
  invalid,
  onClick,
  size = 'md',
  ref,
}: {
  position: number
  state: SlotVisualState
  selected?: boolean
  invalid?: boolean
  onClick?: () => void
  size?: 'md' | 'lg'
  ref?: Ref<HTMLButtonElement>
}) {
  const Icon = icons[state]
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      aria-label={`${t('common.sticker')} ${pad2(position)} — ${t(`slotState.${state}`)}${invalid ? ' (มีข้อผิดพลาด)' : ''}`}
      className={cn(
        'relative flex shrink-0 flex-col items-center justify-center rounded-xl border-2 font-display font-medium tabular-nums transition-transform',
        size === 'lg' ? 'h-14 w-14 text-base' : 'h-11 w-11 text-sm',
        styles[state],
        selected && 'ring-[3px] ring-sunny ring-offset-2 ring-offset-background',
        invalid && !selected && 'outline-2 outline-offset-1 outline-danger outline-dashed',
      )}
    >
      <span aria-hidden>{pad2(position)}</span>
      <Icon
        strokeWidth={3}
        className={cn('absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-surface p-0.5 shadow-sm ring-1 ring-line', iconColor[state])}
        aria-hidden
      />
    </button>
  )
}
