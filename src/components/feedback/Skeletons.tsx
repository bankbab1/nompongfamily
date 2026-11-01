import { pick } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from './States'

/*
 * Loading placeholders shaped like the content they stand in for: a card loads as a card, a list
 * row as a list row, a detail page as its two columns. Keep each one in step with its screen.
 */

const loading = () => pick({ th: 'กำลังโหลด', en: 'Loading' })

/** An idea card on the ideas wall: badges, title, description, word chips, footer. */
export function IdeaCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-line bg-surface p-5" aria-hidden>
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="ml-auto h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-3 h-4 w-full" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[16, 20, 14, 18].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between pt-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  )
}

export function IdeaCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label={loading()}>
      {Array.from({ length: count }).map((_, i) => (
        <IdeaCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** "My ideas" cards: name + meta on the left, status badge on the right, a hint line. */
export function MyIdeaSkeleton({ count = 2 }: { count?: number }) {
  return (
    <ul className="space-y-3" role="status" aria-label={loading()}>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="rounded-3xl border border-line bg-surface p-4 sm:p-5" aria-hidden>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-1/2" />
        </li>
      ))}
    </ul>
  )
}

/** Rows in a bordered list: title + meta, a small figure, a badge. */
export function ListRowsSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <ul className={cn('divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface', className)} role="status" aria-label={loading()}>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex min-h-16 items-center gap-3 px-4 py-3" aria-hidden>
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-10" />
          <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
        </li>
      ))}
    </ul>
  )
}

/** Admin overview: page title, five status tiles, the pending list. */
export function AdminOverviewSkeleton() {
  return (
    <div className="mx-auto max-w-6xl" role="status" aria-label={loading()}>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 mb-6 h-4 w-2/3 max-w-md" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="rounded-3xl border border-line bg-surface p-4">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="mt-3 h-8 w-10" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </li>
        ))}
      </ul>
      <ListRowsSkeleton rows={4} className="mt-6" />
    </div>
  )
}

/** Admin ideas list: title, status tabs, search, rows. */
export function AdminIdeasSkeleton() {
  return (
    <div className="mx-auto max-w-6xl" role="status" aria-label={loading()}>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-2 mb-6 h-4 w-2/3 max-w-md" />
      <Skeleton className="h-11 w-full max-w-xl rounded-full" />
      <Skeleton className="mt-4 h-11 w-full max-w-md rounded-full" />
      <ListRowsSkeleton className="mt-5" />
    </div>
  )
}

/** Admin idea detail: the idea (two cards) beside the status panel. */
export function AdminIdeaDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl" role="status" aria-label={loading()}>
      <Skeleton className="mb-4 h-5 w-28" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-hidden>
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-7 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
          <div className="space-y-3 rounded-3xl border border-line bg-surface p-5">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-3xl border border-line bg-surface p-5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mb-2 h-3 w-4/5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
          <Skeleton className="mt-2 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** Wallpaper detail: phone-shaped preview beside title, sizes and download button. */
export function WallpaperDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" role="status" aria-label={loading()}>
      <div className="flex justify-center rounded-3xl bg-surface-muted p-4 sm:p-8" aria-hidden>
        <Skeleton className="aspect-[9/16] w-full max-w-64 rounded-2xl" />
      </div>
      <div aria-hidden>
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <Skeleton className="mt-8 mb-3 h-5 w-28" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-full sm:w-48" />
      </div>
    </div>
  )
}
