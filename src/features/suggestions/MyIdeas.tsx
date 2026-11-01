import { ChevronRight, Lightbulb } from 'lucide-react'
import { Link } from 'react-router'
import { MyIdeaSkeleton } from '@/components/feedback/Skeletons'
import { EmptyState } from '@/components/feedback/States'
import { LinkButton } from '@/components/ui/LinkButton'
import { pick, useLocale, useTx } from '@/lib/i18n'
import { formatRelative } from '@/lib/utils/format'
import { TeamNote } from './components'
import { IDEA_STATUS_INFO, IdeaStatusBadge } from './IdeaStatus'
import { localName } from './model'
import { useSuggestions } from './useSuggestions'

/** The design-set ideas this person sent, and where each one stands. */
export function MyIdeas() {
  const tx = useTx()
  const locale = useLocale()
  const q = useSuggestions()
  const mine = (q.data ?? []).filter((s) => s.mine).sort((a, b) => (b.statusAt ?? b.createdAt).localeCompare(a.statusAt ?? a.createdAt))

  return (
    <section aria-labelledby="my-ideas" className="mt-8">
      <h2 id="my-ideas" className="mb-3 font-display text-xl">
        {tx('ไอเดียของฉัน', 'My ideas')}
        {mine.length > 0 && <span className="ml-2 text-base text-muted tabular-nums">{mine.length}</span>}
      </h2>

      {q.isPending ? (
        <MyIdeaSkeleton />
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={22} aria-hidden />}
          title={tx('ยังไม่มีไอเดีย', 'No ideas yet')}
          description={tx(
            'ออกแบบชุดสติกเกอร์ที่อยากให้นมผงทำ แล้วติดตามสถานะได้ที่นี่',
            'Design a sticker set you’d love Nompong to have, then follow it here.',
          )}
          actions={
            <LinkButton to="/suggest" variant="primary" iconRight={<ChevronRight size={18} />}>
              {tx('ออกแบบชุดสติกเกอร์', 'Design a sticker set')}
            </LinkButton>
          }
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((s) => (
            <li key={s.id} className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium" lang={locale}>
                    {localName(s, locale).main}
                  </p>
                  <p className="text-xs text-muted">
                    {tx(`${s.stickerCount} ภาพ`, `${s.stickerCount} stickers`)} · {tx('ส่งเมื่อ', 'sent')} {formatRelative(s.createdAt)}
                  </p>
                </div>
                <IdeaStatusBadge status={s.status} />
              </div>
              <p className="mt-2 text-sm text-muted">{pick(IDEA_STATUS_INFO[s.status].hint, locale)}</p>
              {s.statusNote && <TeamNote note={s.statusNote} />}
              {s.status === 'published' && s.lineSetId && (
                <Link to={`/stickers/${s.lineSetId}`} className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-medium">
                  {tx('ดูชุดนี้ใน LINE', 'See this set on LINE')} <ChevronRight size={16} aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
