import { Info } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page } from '@/components/layout/AppShell'
import { SlidingPill, useSlidingPill } from '@/components/ui/SlidingPill'
import { TypingText } from '@/components/ui/TypingText'
import { NompongArt } from '@/features/nompong/art'
import { useCopy } from '@/lib/copy'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { StickerSetBuilder } from './builder'
import { SuggestionCard } from './components'
import { MOODS, sortSuggestions, type MoodId, type SuggestionSort } from './model'
import { SUGGESTIONS_ON_DEVICE_ONLY } from './store'
import { useCreateSuggestion, useSuggestions, useToggleVote } from './useSuggestions'

export default function SuggestPage() {
  const c = useCopy()
  usePageMeta(c.suggest.metaTitle, c.suggest.metaDesc)
  const q = useSuggestions()
  const create = useCreateSuggestion()
  const vote = useToggleVote()
  const [sort, setSort] = useState<SuggestionSort>('popular')
  const [mood, setMood] = useState<MoodId | 'all'>('all')
  const [justAdded, setJustAdded] = useState<string>()
  const sortTrack = useRef<HTMLDivElement>(null)
  const sortPill = useSlidingPill(sortTrack, '[aria-pressed="true"]', [sort, c.suggest.popular])

  const items = useMemo(() => {
    const list = q.data ?? []
    return sortSuggestions(mood === 'all' ? list : list.filter((s) => s.mood === mood), sort)
  }, [q.data, sort, mood])

  const filters: { id: MoodId | 'all'; label: string; emoji: string }[] = [
    { id: 'all', label: c.suggest.all, emoji: '' },
    ...MOODS.map((m) => ({ id: m.id, label: c.moods[m.id], emoji: m.emoji })),
  ]

  return (
    <>
      <Page className="flex items-center gap-5 pt-8 pb-2 sm:gap-8 sm:pt-12 sm:pb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">{c.suggest.eyebrow}</p>
          <h1 className="t-page mt-2 font-display">
            <TypingText phrases={[c.suggest.title]} />
          </h1>
          <p className="t-lead mt-3 max-w-xl">{c.suggest.body}</p>
        </div>
        <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-full bg-sunny-100 sm:flex" aria-hidden>
          <NompongArt pose="wave" className="h-28 w-auto" decorative />
        </div>
      </Page>

      <Page>
        <section aria-labelledby="form-title" className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 id="form-title" className="t-section font-display">
              {c.builder.title}
            </h2>
            {SUGGESTIONS_ON_DEVICE_ONLY && (
              <p className="flex gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs text-muted">
                <Info size={14} className="mt-px shrink-0" aria-hidden />
                {c.suggest.deviceNote}
              </p>
            )}
          </div>
          <StickerSetBuilder
            submitting={create.isPending}
            onSubmit={async (input) => {
              try {
                const s = await create.mutateAsync(input)
                setMood('all')
                setSort('newest')
                setJustAdded(s.id)
                toast.success(c.suggest.sent)
                requestAnimationFrame(() => document.getElementById(`s-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
              } catch (e) {
                toast.error(c.suggest.sendFailed)
                throw e
              }
            }}
          />
        </section>

        <section aria-labelledby="wall-title" className="mt-14 min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="wall-title" className="t-section font-display">
              {c.suggest.wallTitle} {q.data && <span className="text-base font-normal text-muted">({q.data.length})</span>}
            </h2>
            <div ref={sortTrack} role="group" aria-label={c.suggest.sortLabel} className="relative inline-flex rounded-full bg-surface-muted p-1">
              <SlidingPill pill={sortPill.pill} ready={sortPill.ready} className="rounded-full bg-surface shadow-sm" />
              {(['popular', 'newest'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={sort === id}
                  onClick={() => setSort(id)}
                  className={cn(
                    'relative min-h-9 rounded-full px-4 text-sm font-medium transition-colors duration-300',
                    sort === id ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {c.suggest[id]}
                </button>
              ))}
            </div>
          </div>

          <div className="no-scrollbar -mx-4 mt-4 overflow-x-auto px-4">
            <div role="group" aria-label={c.suggest.filterLabel} className="flex gap-2">
              {filters.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={mood === m.id}
                  onClick={() => setMood(m.id)}
                  className={cn(
                    'inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-sm',
                    mood === m.id ? 'border-brown bg-brown font-medium text-cream' : 'border-line text-muted hover:border-line-strong hover:text-ink',
                  )}
                >
                  {m.emoji && <span aria-hidden>{m.emoji}</span>}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {q.isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-3xl" />
                ))}
              </div>
            ) : q.isError ? (
              <ErrorState error={q.error} onRetry={() => q.refetch()} />
            ) : items.length === 0 ? (
              <EmptyState title={c.suggest.emptyTitle} description={c.suggest.emptyBody} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <li key={s.id} id={`s-${s.id}`}>
                    <SuggestionCard
                      s={s}
                      highlight={s.id === justAdded}
                      voting={vote.isPending && vote.variables === s.id}
                      onVote={() => vote.mutate(s.id, { onError: () => toast.error(c.suggest.voteFailed) })}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </Page>
    </>
  )
}
