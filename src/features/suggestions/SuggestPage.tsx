import { Info, Lightbulb } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page } from '@/components/layout/AppShell'
import { NompongArt } from '@/features/nompong/art'
import { Paws } from '@/features/nompong/NompongPage'
import { useCopy } from '@/features/portal/copy'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { SuggestionCard, SuggestionForm } from './components'
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
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-sunny-100 to-cream">
        <Paws />
        <Page className="relative flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:py-10 sm:text-left">
          <NompongArt pose="wave" className="w-32 shrink-0 sm:w-40" decorative />
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <Lightbulb size={16} aria-hidden /> {c.suggest.eyebrow}
            </p>
            <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{c.suggest.title}</h1>
            <p className="mt-2 max-w-xl text-muted">{c.suggest.body}</p>
          </div>
        </Page>
      </section>

      <Page>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <section aria-labelledby="form-title" className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
            <h2 id="form-title" className="font-display text-2xl">
              {c.suggest.formTitle}
            </h2>
            {SUGGESTIONS_ON_DEVICE_ONLY && (
              <p className="mt-2 flex gap-2 rounded-2xl bg-info-soft px-3 py-2 text-sm text-info">
                <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
                {c.suggest.deviceNote}
              </p>
            )}
            <div className="mt-5">
              <SuggestionForm
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
            </div>
          </section>

          <section aria-labelledby="wall-title" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="wall-title" className="font-display text-2xl">
                {c.suggest.wallTitle} {q.data && <span className="text-base font-normal text-muted">({q.data.length})</span>}
              </h2>
              <div role="group" aria-label={c.suggest.sortLabel} className="inline-flex rounded-full border border-line-strong bg-surface p-1">
                {(['popular', 'newest'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={sort === id}
                    onClick={() => setSort(id)}
                    className={cn('min-h-9 rounded-full px-4 text-sm font-medium', sort === id ? 'bg-brown text-cream' : 'text-ink/80 hover:bg-surface-muted')}
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
                      mood === m.id ? 'border-brown bg-sunny-100 font-medium' : 'border-line text-ink/80 hover:bg-surface-muted',
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-3xl" />
                  ))}
                </div>
              ) : q.isError ? (
                <ErrorState error={q.error} onRetry={() => q.refetch()} />
              ) : items.length === 0 ? (
                <EmptyState title={c.suggest.emptyTitle} description={c.suggest.emptyBody} />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </Page>
    </>
  )
}
