import { ChevronRight, Heart, PartyPopper } from 'lucide-react'
import { Link } from 'react-router'
import { AdminOverviewSkeleton } from '@/components/feedback/Skeletons'
import { Card, ErrorState } from '@/components/feedback/States'
import { PageHeader } from '@/components/layout/AppShell'
import { IDEA_STATUS_INFO, IdeaStatusBadge } from '@/features/suggestions/IdeaStatus'
import { IDEA_STATUSES, localName } from '@/features/suggestions/model'
import { useSuggestions } from '@/features/suggestions/useSuggestions'
import { formatRelative } from '@/lib/utils/format'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/**
 * Admin home. Sticker sets themselves are managed in LINE Creators Market; this app's admin only
 * looks after fans' design-set ideas (series CR): what's waiting, and where each one stands.
 */
export default function OverviewPage() {
  usePageMeta('Admin', undefined, { noindex: true })
  const ideas = useSuggestions()

  if (ideas.isPending) return <AdminOverviewSkeleton />
  if (ideas.isError) return <ErrorState error={ideas.error} onRetry={() => ideas.refetch()} />

  const all = ideas.data
  const count = (s: (typeof IDEA_STATUSES)[number]) => all.filter((i) => i.status === s).length
  // Waiting for a decision, most wanted first.
  const pending = all.filter((i) => i.status === 'pending').sort((a, b) => b.votes - a.votes)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="ภาพรวม" description="ไอเดียชุดสติกเกอร์จากแฟนๆ (ซีรีส์ CR) — ส่วนชุดที่วางขายจัดการใน LINE Creators Market" />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {IDEA_STATUSES.map((s) => {
          const info = IDEA_STATUS_INFO[s]
          return (
            <li key={s}>
              <Link
                to={`/admin/ideas?status=${s}`}
                className="flex h-full flex-col rounded-3xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
              >
                <info.icon size={20} className="text-muted" aria-hidden />
                <span className="mt-3 font-display text-3xl tabular-nums">{count(s)}</span>
                <span className="text-sm text-muted">{info.label.th}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl">รอพิจารณา ({pending.length})</h2>
          <Link to="/admin/ideas" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium">
            ไอเดียทั้งหมด <ChevronRight size={16} aria-hidden />
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted">
            พิจารณาครบทุกไอเดียแล้ว <PartyPopper size={15} aria-hidden />
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.slice(0, 8).map((i) => (
              <li key={i.id}>
                <Link to={`/admin/ideas/${i.id}`} className="-mx-2 flex min-h-14 items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-muted/60">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium" lang="th">
                      {localName(i, 'th').main}
                    </span>
                    <span className="text-xs text-muted">
                      {i.stickerCount} ภาพ · {i.nickname || 'ไม่ระบุชื่อ'} · {formatRelative(i.createdAt)}
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
      </Card>
    </div>
  )
}
