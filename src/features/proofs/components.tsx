import { CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import type { ArtworkVersion, ProofItem, ProofItemState, RevisionComment as Comment } from '@/lib/api/types'
import { formatDateTime } from '@/lib/utils/format'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'

export const PROOF_STATE: Record<ProofItemState, { label: string; tone: 'warning' | 'success' | 'danger'; icon: typeof Clock }> = {
  pending: { label: 'รอตรวจ', tone: 'warning', icon: Clock },
  approved: { label: 'อนุมัติแล้ว', tone: 'success', icon: CheckCircle2 },
  revision_requested: { label: 'ขอแก้ไข', tone: 'danger', icon: RotateCcw },
}

export function ProofStateBadge({ state }: { state: ProofItemState }) {
  const s = PROOF_STATE[state]
  return (
    <Badge tone={s.tone} icon={<s.icon size={12} aria-hidden />}>
      {s.label}
    </Badge>
  )
}

/**
 * Large artwork view with optional previous/latest comparison (spec §7). Image URLs are
 * treated as protected: the real adapter supplies short-lived signed URLs, never public ones.
 */
export function ArtworkViewer({ item }: { item: ProofItem }) {
  const latest = item.versions.at(-1)!
  const [selected, setSelected] = useState<number>(latest.version)
  const [compare, setCompare] = useState(false)
  const shown = item.versions.find((v) => v.version === selected) ?? latest
  const previous = item.versions.length > 1 ? item.versions.at(-2)! : null

  const Img = ({ v, label }: { v: ArtworkVersion; label?: string }) => (
    <figure className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-2xl border border-line bg-[repeating-conic-gradient(#f3ede3_0%_25%,#fff_0%_50%)] bg-[length:20px_20px]">
        <img src={v.imageUrl} alt={`ภาพที่ ${pad2(item.position)} เวอร์ชัน ${v.version}: ${item.caption}`} className="mx-auto aspect-[37/32] max-h-[42dvh] w-full object-contain lg:max-h-[60vh]" draggable={false} />
      </div>
      <figcaption className="mt-1.5 text-center text-xs text-muted">
        {label ?? `เวอร์ชัน ${v.version}`} · {formatDateTime(v.uploadedAt)}
      </figcaption>
    </figure>
  )

  return (
    <div>
      {compare && previous ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Img v={previous} label={`ก่อนหน้า (v${previous.version})`} />
          <Img v={latest} label={`ล่าสุด (v${latest.version})`} />
        </div>
      ) : (
        <Img v={shown} />
      )}
      {item.versions.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="เลือกเวอร์ชัน" className="inline-flex rounded-xl bg-surface-muted p-1">
            {item.versions.map((v) => (
              <button
                key={v.version}
                type="button"
                role="radio"
                aria-checked={!compare && selected === v.version}
                onClick={() => {
                  setCompare(false)
                  setSelected(v.version)
                }}
                className={cn('min-h-9 rounded-lg px-3 text-sm font-medium', !compare && selected === v.version ? 'bg-surface shadow-sm' : 'text-muted')}
              >
                v{v.version}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={compare}
            onClick={() => setCompare((c) => !c)}
            className={cn('min-h-11 rounded-xl border px-3 text-sm font-medium', compare ? 'border-brown bg-sunny-100' : 'border-line-strong bg-surface')}
          >
            เทียบเวอร์ชันก่อนหน้า
          </button>
        </div>
      )}
    </div>
  )
}

export function RevisionComment({ comment }: { comment: Comment }) {
  const mine = comment.actor === 'customer'
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm', mine ? 'rounded-br-md bg-peach-100' : 'rounded-bl-md bg-sunny-100')}>
        <p className="text-xs text-muted">
          <span className="font-medium text-ink">{comment.actorName}</span> · v{comment.artworkVersion} · {formatDateTime(comment.at)}
        </p>
        <p className="mt-1 whitespace-pre-wrap" lang="th">
          {comment.body}
        </p>
      </div>
    </li>
  )
}
