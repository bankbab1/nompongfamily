import { ChevronRight, Check, Circle, MessageSquare, PenLine, XCircle } from 'lucide-react'
import { Link } from 'react-router'
import { ChannelBadge, StatusBadge } from '@/components/ui/Badge'
import type { StickerRequest, TimelineEvent } from '@/lib/api/types'
import { awaitingCustomer, MILESTONES, milestoneIndex, statusLabel } from '@/lib/domain/status'
import { formatDateTime, formatRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { pick, useTx } from '@/lib/i18n'

export function nextActionLabel(r: StickerRequest): string | null {
  if (r.status === 'draft') return pick({ th: 'ทำบรีฟต่อ', en: 'Continue the brief' })
  if (r.status === 'clarification_requested') return pick({ th: 'ส่งข้อมูลเพิ่ม', en: 'Send more details' })
  if (r.status === 'proof_ready') return pick({ th: 'ตรวจงาน', en: 'Review artwork' })
  return null
}

export function requestHref(r: StickerRequest): string {
  if (r.status === 'draft' || r.status === 'clarification_requested') return `/my/requests/${r.id}/edit`
  if (r.status === 'proof_ready') return `/my/requests/${r.id}/proof`
  return `/my/requests/${r.id}`
}

export function RequestCard({ request: r }: { request: StickerRequest }) {
  const tx = useTx()
  const action = nextActionLabel(r)
  return (
    <article className="relative flex h-full flex-col rounded-3xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={r.status} channel={r.channel} />
        <ChannelBadge channel={r.channel} />
      </div>
      <h3 className="mt-3 font-display text-lg leading-snug break-words" lang="th">
        <Link to={`/my/requests/${r.id}`} className="after:absolute after:inset-0 after:rounded-3xl">
          {r.setName || tx('ฉบับร่างยังไม่ตั้งชื่อ', 'Untitled draft')}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted">
        {r.id} · {r.stickerCount} {tx('ภาพ', 'stickers')} · {tx('อัปเดต', 'updated')} {formatRelative(r.updatedAt)}
      </p>
      {action && awaitingCustomer(r.status) && (
        <Link
          to={requestHref(r)}
          className="relative z-10 mt-4 inline-flex min-h-11 items-center justify-between gap-2 rounded-xl bg-sunny px-4 text-sm font-medium text-brown hover:bg-sunny-200"
        >
          {action}
          <ChevronRight size={16} aria-hidden />
        </Link>
      )}
    </article>
  )
}

/** Milestone track (spec §7 timeline). Uses icons + text so state is not colour-only. */
export function MilestoneTrack({ request: r }: { request: StickerRequest }) {
  const tx = useTx()
  const steps = MILESTONES[r.channel]
  const idx = milestoneIndex(r.channel, r.status)
  const declined = r.status === 'declined'
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const done = i < idx || (i === idx && ['published', 'closed'].includes(r.status))
        const current = i === idx && !done
        const label = current && r.status !== s ? statusLabel(r.status, r.channel) : statusLabel(s, r.channel)
        return (
          <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && <span className={cn('absolute top-8 bottom-0 left-[15px] w-0.5', done ? 'bg-brown' : 'bg-line')} aria-hidden />}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                done && 'border-brown bg-brown text-cream',
                current && !declined && 'border-brown bg-sunny text-brown',
                current && declined && 'border-danger bg-danger-soft text-danger',
                !done && !current && 'border-line-strong bg-surface text-muted',
              )}
              aria-hidden
            >
              {done ? <Check size={16} strokeWidth={3} /> : current && declined ? <XCircle size={16} /> : <Circle size={10} fill="currentColor" />}
            </span>
            <div className="min-w-0 pt-1">
              <p className={cn('text-sm', current ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-muted')}>
                {current && declined ? statusLabel('declined', r.channel) : label}
                <span className="sr-only">
                  {done ? tx(' (เสร็จแล้ว)', ' (done)') : current ? tx(' (ขั้นตอนปัจจุบัน)', ' (current step)') : tx(' (ยังไม่ถึง)', ' (upcoming)')}
                </span>
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function EventLog({ events }: { events: TimelineEvent[] }) {
  const tx = useTx()
  if (!events.length) return <p className="text-sm text-muted">{tx('ยังไม่มีความเคลื่อนไหว', 'No activity yet')}</p>
  return (
    <ol className="space-y-4">
      {[...events].reverse().map((e) => (
        <li key={e.id} className="flex gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              e.actor === 'admin' ? 'bg-sunny-100' : e.actor === 'customer' ? 'bg-peach-100' : 'bg-surface-muted',
            )}
            aria-hidden
          >
            {e.message ? <MessageSquare size={16} /> : <PenLine size={16} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-medium">{e.actorName}</span>
              {e.status && (
                <>
                  {' '}
                  <span className="text-muted">→</span> <StatusBadge status={e.status} />
                </>
              )}
            </p>
            <time className="text-xs text-muted" dateTime={e.at}>
              {formatDateTime(e.at)}
            </time>
            {e.message && (
              <p className="mt-1.5 rounded-2xl bg-surface-muted px-3 py-2 text-sm whitespace-pre-wrap" lang="th">
                {e.message}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
