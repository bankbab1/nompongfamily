import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { coverArt } from '@/lib/api/mock/art'
import type { SeriesKind, StickerSet } from '@/lib/api/types'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils/cn'

export const SERIES_LABEL: Record<SeriesKind, { th: string; short: string }> = {
  V: { th: 'Standard V Series', short: 'V' },
  M: { th: 'Special M Series', short: 'M' },
  CR: { th: 'Community CR Series', short: 'CR' },
  INTRO: { th: 'Foundation / Featured', short: 'Foundation' },
}

/** Mock-only cover: real covers come from the catalog's approved artwork. */
export const setCover = (s: StickerSet) => coverArt({ code: s.code, title: s.titleTh, hue: s.coverHue })

export function SetStatusBadge({ set }: { set: StickerSet }) {
  if (set.status === 'live') return <Badge tone="success">วางขายแล้ว</Badge>
  if (set.status === 'coming_soon') return <Badge tone="accent">เร็วๆ นี้</Badge>
  return <Badge>ร่าง</Badge>
}

export function StoreLink({ set, className, size = 'md' }: { set: StickerSet; className?: string; size?: 'sm' | 'md' }) {
  // Only after actual publication (spec §9.2).
  if (set.status !== 'live' || !set.lineStoreUrl) return null
  return (
    <a
      href={set.lineStoreUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('sticker_store_clicked', { set: set.code })}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#06C755] font-medium text-white hover:brightness-95',
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-[15px]',
        className,
      )}
    >
      ดูใน LINE Store <ExternalLink size={size === 'sm' ? 14 : 16} aria-hidden />
    </a>
  )
}

export function StickerSetCard({ set }: { set: StickerSet }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-shadow hover:shadow-md">
      <img src={setCover(set)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-display text-xs">{set.code}</span>
          <SetStatusBadge set={set} />
        </div>
        <h3 className="mt-2 font-display text-lg leading-snug">
          <Link to={`/stickers/${set.slug}`} className="after:absolute after:inset-0">
            {set.titleTh}
          </Link>
        </h3>
        <p className="text-sm text-muted">{set.titleEn}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-sm">{set.description}</p>
        <p className="mt-3 text-xs text-muted">{set.stickerCount} ภาพ</p>
      </div>
    </article>
  )
}
