import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Lightbulb } from 'lucide-react'
import { useNavigate } from 'react-router'
import { EmptyState, ErrorState, PageSkeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { LinkButton } from '@/components/ui/LinkButton'
import { useCurrentUser } from '@/features/auth/useAuth'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import type { PublicIdea } from '@/lib/api/services'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'

/** Moderated public summaries only — no account names or attachments (spec §8). One vote per member, enforced server-side. */
export default function IdeasPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const qc = useQueryClient()
  usePageMeta('บอร์ดไอเดีย', 'โหวตไอเดียชุดสติกเกอร์นมผงจากแฟนๆ')
  const q = useQuery({ queryKey: qk.ideas, queryFn: () => api.catalog.listPublicIdeas() })
  const vote = useMutation({
    mutationFn: (id: string) => api.catalog.toggleVote(id),
    onSuccess: (idea) => qc.setQueryData<PublicIdea[]>(qk.ideas, (old) => old?.map((i) => (i.id === idea.id ? idea : i))),
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <Page>
      <PageHeader
        title="บอร์ดไอเดีย"
        description="ไอเดียที่ผ่านการคัดกรองและเจ้าของยินยอมให้แสดง โหวตได้ 1 ครั้งต่อไอเดีย (กดอีกครั้งเพื่อยกเลิก)"
        actions={
          <LinkButton to="/studio/new?type=community" variant="primary" icon={<Lightbulb size={18} />}>
            เสนอไอเดีย
          </LinkButton>
        }
      />
      {q.isPending ? (
        <PageSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState title="ยังไม่มีไอเดียบนบอร์ด" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((idea) => (
            <li key={idea.id} className="flex flex-col rounded-3xl border border-line bg-surface p-5">
              <h2 className="font-display text-xl">{idea.setName}</h2>
              {idea.theme && <p className="mt-1 text-sm text-muted">{idea.theme}</p>}
              <ul className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
                {idea.sampleCaptions.map((c) => (
                  <li key={c} className="rounded-full bg-sunny-100 px-2.5 py-0.5 text-sm" lang="th">
                    {c}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted">{idea.stickerCount} ภาพ</span>
                <button
                  type="button"
                  aria-pressed={idea.votedByMe}
                  disabled={vote.isPending}
                  onClick={() => (user ? vote.mutate(idea.id) : navigate('/login?next=/ideas'))}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium',
                    idea.votedByMe ? 'border-peach-700/30 bg-peach-100 text-peach-700' : 'border-line-strong bg-surface hover:bg-surface-muted',
                  )}
                >
                  <Heart size={18} fill={idea.votedByMe ? 'currentColor' : 'none'} aria-hidden />
                  <span>{idea.votedByMe ? 'โหวตแล้ว' : 'โหวต'}</span>
                  <span className="tabular-nums" aria-label={`${idea.votes} โหวต`}>
                    {idea.votes}
                  </span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
