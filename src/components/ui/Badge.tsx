import {
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  Eye,
  HelpCircle,
  Inbox,
  Lock,
  PenLine,
  RotateCcw,
  Send,
  Sparkles,
  Store,
  ThumbsUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { RequestChannel, RequestStatus } from '@/lib/api/types'
import { STATUS_TONE, statusLabel, type Tone } from '@/lib/domain/status'
import { cn } from '@/lib/utils/cn'

export const toneClass: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-ink border-line',
  info: 'bg-info-soft text-info border-mint',
  warning: 'bg-warning-soft text-warning border-sunny-200',
  success: 'bg-success-soft text-success border-success/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  accent: 'bg-sunny-100 text-brown border-sunny-200',
}

export function Badge({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClass[tone],
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

const STATUS_ICON: Record<RequestStatus, LucideIcon> = {
  draft: PenLine,
  submitted: Send,
  under_review: Eye,
  clarification_requested: HelpCircle,
  accepted: ThumbsUp,
  declined: XCircle,
  brief_approved: Lock,
  in_production: Sparkles,
  proof_ready: Inbox,
  revision_requested: RotateCcw,
  artwork_approved: CheckCircle2,
  line_submitted: Clock,
  published: Store,
  closed: CircleDashed,
}

/** Status is always icon + text, never colour alone (spec §4 accessibility). */
export function StatusBadge({ status, channel, className }: { status: RequestStatus; channel?: RequestChannel; className?: string }) {
  const Icon = STATUS_ICON[status] ?? CircleDot
  return (
    <Badge tone={STATUS_TONE[status]} icon={<Icon size={12} aria-hidden />} className={className}>
      {statusLabel(status, channel)}
    </Badge>
  )
}

export function ChannelBadge({ channel }: { channel: RequestChannel }) {
  return <Badge tone={channel === 'commission' ? 'accent' : 'info'}>{channel === 'commission' ? 'Commission' : 'Community'}</Badge>
}
