import { ChevronRight, Heart } from 'lucide-react'
import { useDeferredValue, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AdminIdeasSkeleton } from '@/components/feedback/Skeletons'
import { EmptyState, ErrorState } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/AppShell'
import { SearchField } from '@/components/ui/SearchField'
import { IDEA_STATUS_INFO, IdeaStatusBadge } from '@/features/suggestions/IdeaStatus'
import { IDEA_STATUSES, localName, type IdeaStatus } from '@/features/suggestions/model'
import { useSuggestions } from '@/features/suggestions/useSuggestions'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'

type Filter = IdeaStatus | 'all'

/** Every fan idea, filtered by status (pending first by default) and searchable. */
export default function IdeasPage() {
  usePageMeta('ไอเดีย CR', undefined, { noindex: true })
  const [params, setParams] = useSearchParams()
  const filter = (params.get('status') as Filter | null) ?? 'pending'
  const q = params.get('q') ?? ''
  const needle = useDeferredValue(q).trim().toLowerCase()
  const ideas = useSuggestions()

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  const all = useMemo(() => ideas.data ?? [], [ideas.data])
  const list = useMemo(
    () =>
      all
        .filter((i) => filter === 'all' || i.status === filter)
        .filter((i) => !needle || [i.nameTh, i.nameEn, i.nickname].some((t) => t.toLowerCase().includes(needle)))
        // Pending: most wanted first. Everything else: latest change first.
        .sort((a, b) => (filter === 'pending' ? b.votes - a.votes : (b.statusAt ?? b.createdAt).localeCompare(a.statusAt ?? a.createdAt))),
    [all, filter, needle],
  )

  if (ideas.isPending) return <AdminIdeasSkeleton />
  if (ideas.isError) return <ErrorState error={ideas.error} onRetry={() => ideas.refetch()} />

  const tabs: { id: Filter; label: string; count: number }[] = [
    ...IDEA_STATUSES.map((s) => ({ id: s, label: IDEA_STATUS_INFO[s].label.th, count: all.filter((i) => i.status === s).length })),
    { id: 'all', label: 'ทั้งหมด', count: all.length },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="ไอเดีย CR" description="ไอเดียชุดสติกเกอร์ที่แฟนๆ ออกแบบ เปลี่ยนสถานะแล้วผู้ส่งจะเห็นทันที" />

      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div role="group" aria-label="สถานะ" className="inline-flex gap-1 rounded-full bg-surface-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={filter === t.id}
              onClick={() => set('status', t.id === 'pending' ? null : t.id)}
              className={cn(
                'min-h-9 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors',
                filter === t.id ? 'selected-chip text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'ml-1.5 inline-block min-w-7 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-none font-semibold tabular-nums',
                  filter === t.id ? 'bg-brown text-cream' : 'bg-line/70 text-muted',
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <SearchField className="mt-4 max-w-md" value={q} onChange={(v) => set('q', v || null)} label="ค้นหาไอเดีย" placeholder="ค้นหาชื่อชุดหรือชื่อผู้ส่ง" />

      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyState title="ไม่มีไอเดียในสถานะนี้" description="ลองเลือกสถานะอื่น หรือดู “ทั้งหมด”" />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
            {list.map((i) => (
              <li key={i.id}>
                <Link to={`/admin/ideas/${i.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface-muted/60">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium" lang="th">
                      {localName(i, 'th').main}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {i.stickerCount} ภาพ · {i.nickname || 'ไม่ระบุชื่อ'} · ส่งเมื่อ {formatRelative(i.createdAt)}
                      {i.isExample && ' · ตัวอย่าง'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-muted tabular-nums" title="จำนวนคนที่อยากได้">
                    <Heart size={14} aria-hidden /> {i.votes}
                  </span>
                  <IdeaStatusBadge status={i.status} className="hidden sm:inline-flex" />
                  <ChevronRight size={16} className="text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
