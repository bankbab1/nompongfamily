import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { coverArt } from '@/lib/api/mock/art'
import type { SeriesKind, StickerSet } from '@/lib/api/types'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils/cn'
import { type Locale, useLocale, useTx } from '@/lib/i18n'

export const SERIES_LABEL: Record<SeriesKind, { th: string; en: string; short: string }> = {
  V: { th: 'Standard V Series', en: 'Standard V Series', short: 'V' },
  M: { th: 'Special M Series', en: 'Special M Series', short: 'M' },
  CR: { th: 'Community CR Series', en: 'Community CR Series', short: 'CR' },
  INTRO: { th: 'Foundation / Featured', en: 'Foundation / Featured', short: 'Foundation' },
}

/** Mock-only cover: real covers come from the catalog's approved artwork. */
/** The set's name in the current language, plus the other language as a subtitle. */
export const setName = (s: Pick<StickerSet, 'titleTh' | 'titleEn'>, locale: Locale) =>
  locale === 'en' && s.titleEn ? { main: s.titleEn, alt: s.titleTh } : { main: s.titleTh, alt: s.titleEn }
export const setDesc = (s: Pick<StickerSet, 'description' | 'descriptionEn'>, locale: Locale) =>
  locale === 'en' && s.descriptionEn ? s.descriptionEn : s.description

export const setCover = (s: StickerSet) => coverArt({ code: s.code, title: s.titleTh, hue: s.coverHue })

export function SetStatusBadge({ set }: { set: StickerSet }) {
  const tx = useTx()
  if (set.status === 'live') return <Badge tone="success">{tx('วางขายแล้ว', 'On sale')}</Badge>
  if (set.status === 'coming_soon') return <Badge tone="accent">{tx('เร็วๆ นี้', 'Coming soon')}</Badge>
  return <Badge>{tx('ร่าง', 'Draft')}</Badge>
}

export function StoreLink({ set, className, size = 'md' }: { set: StickerSet; className?: string; size?: 'sm' | 'md' }) {
  const tx = useTx()
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
      {tx('ดูใน LINE Store', 'View on LINE Store')} <ExternalLink size={size === 'sm' ? 14 : 16} aria-hidden />
    </a>
  )
}

export function StickerSetCard({ set }: { set: StickerSet }) {
  const locale = useLocale()
  const tx = useTx()
  const name = setName(set, locale)
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
            {name.main}
          </Link>
        </h3>
        <p className="text-sm text-muted">{name.alt}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-sm">{setDesc(set, locale)}</p>
        <p className="mt-3 text-xs text-muted">
          {set.stickerCount} {tx('ภาพ', 'stickers')}
        </p>
      </div>
    </article>
  )
}
