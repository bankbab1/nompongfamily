import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils/cn'
import { coverTransition, versionName, type LineSet } from './lineStore'

/**
 * A LINE set's cover, name and code. Opens the set's preview page in the app.
 * `list` (phones only): a compact row with a small cover; from `sm` up it is always the card.
 */
export function LineSetCard({ set, list }: { set: LineSet; list?: boolean }) {
  return (
    <Link
      to={`/stickers/${set.id}`}
      viewTransition
      className={cn(
        // Press feedback: the card gives a little under the finger.
        'group block rounded-2xl transition-transform duration-150 ease-out focus-visible:outline-offset-4 active:scale-[0.96] motion-reduce:active:scale-100',
        list && 'max-sm:flex max-sm:min-h-20 max-sm:items-center max-sm:gap-3 max-sm:border max-sm:border-line max-sm:bg-surface max-sm:p-2 max-sm:pr-3',
      )}
    >
      <div
        className={cn(
          'relative aspect-square overflow-hidden rounded-2xl bg-sticker-tile transition-colors group-hover:bg-sticker-tile-hover',
          list && 'max-sm:w-16 max-sm:shrink-0 max-sm:rounded-xl',
        )}
        style={{ viewTransitionName: coverTransition(set.id) }}
      >
        <img
          src={set.image}
          alt=""
          width={240}
          height={240}
          loading="lazy"
          decoding="async"
          className={cn(
            'h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none',
            list && 'max-sm:p-1.5',
          )}
        />
      </div>
      <div className={cn(list && 'max-sm:min-w-0 max-sm:flex-1')}>
        <p className={cn('mt-2 line-clamp-2 text-sm leading-snug font-medium text-ink', list && 'max-sm:mt-0 max-sm:text-[15px]')} lang="th">
          {set.name}
        </p>
        <p className="t-meta">
          {list && <span className="sm:hidden">{versionName(set.series)} · </span>}
          {set.code}
        </p>
      </div>
      {list && <ChevronRight size={18} className="shrink-0 text-muted sm:hidden" aria-hidden />}
    </Link>
  )
}
