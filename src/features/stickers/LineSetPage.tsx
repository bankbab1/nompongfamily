import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, Skeleton } from '@/components/feedback/States'
import { Page } from '@/components/layout/AppShell'
import { Button, buttonBase, buttonSizes, buttonVariants } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { useLocale, useTx } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { findLineSet, LINE_SETS, lineUrl, loadSetDetails, stickerImage, versionName, VERSIONS, type LineSet } from './lineStore'

/**
 * One LINE sticker set inside the app: every sticker in a grid, tap one to see it big.
 * Buying still happens on LINE (the store can't be embedded), so "Buy on LINE" is the main action.
 */
export default function LineSetPage({ id }: { id: string }) {
  const set = findLineSet(id)
  const locale = useLocale()
  const tx = useTx()
  const details = useQuery({ queryKey: ['line-set', id], queryFn: () => loadSetDetails(id), staleTime: Infinity })
  const [zoom, setZoom] = useState<number | null>(null)
  usePageMeta(set ? set.title : tx('ไม่พบชุดสติกเกอร์', 'Sticker set not found'), details.data?.desc)

  if (!set) {
    return (
      <Page>
        <BackLink />
        <EmptyState
          title={tx('ไม่พบชุดสติกเกอร์นี้', 'We couldn’t find this sticker set')}
          description={tx('อาจถูกย้ายหรือยังไม่ได้อัปเดต ลองดูชุดอื่นก่อนนะ', 'It may have moved or isn’t synced yet. Have a look at the other sets.')}
        />
      </Page>
    )
  }

  const info = VERSIONS[set.series]
  const stickers = details.data?.stickers ?? []
  const buyUrl = lineUrl(set.url, locale)
  const related = LINE_SETS.filter((s) => s.series === set.series && s.id !== set.id).slice(0, 6)

  return (
    <Page>
      <BackLink />

      {/* Set header: cover, name, version, count and price, and the way to buy it. */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-surface-muted sm:h-40 sm:w-40">
          <img src={set.image} alt="" width={240} height={240} className="h-full w-full object-contain p-3" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to={`/stickers?series=${set.series}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-sunny-100 px-3 py-1 text-xs font-semibold text-ink hover:bg-sunny-200"
          >
            {versionName(set.series)} · {set.code}
          </Link>
          <h1 className="t-page mt-2 font-display" lang="th">
            {set.name}
          </h1>
          <p className="t-meta mt-1 text-sm">
            {details.data ? `${stickers.length} ${tx('ภาพ', 'stickers')}` : info ? tx(info.th, info.en) : ''}
            {details.data?.price && ` · ${details.data.price}`}
          </p>
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, 'mt-4 w-full sm:w-auto')}
          >
            {tx('ซื้อใน LINE STORE', 'Buy on the LINE STORE')}
            <ArrowUpRight size={18} aria-hidden />
          </a>
        </div>
      </header>

      {details.data?.desc && (
        <p className="t-lead mt-6 max-w-3xl" lang="th">
          {details.data.desc}
        </p>
      )}

      {/* Every sticker in the set */}
      <section aria-labelledby="all-stickers" className="mt-8">
        <h2 id="all-stickers" className="t-section mb-4 font-display">
          {tx('สติกเกอร์ทั้งหมดในชุด', 'Every sticker in this set')}
        </h2>
        {details.isPending ? (
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 lg:grid-cols-8">
            {Array.from({ length: 16 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="aspect-square rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : stickers.length === 0 ? (
          <EmptyState
            title={tx('ยังไม่มีภาพตัวอย่างของชุดนี้', 'No preview for this set yet')}
            description={tx('ดูสติกเกอร์ทุกภาพได้ใน LINE STORE', 'You can see every sticker on the LINE STORE.')}
          />
        ) : (
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 lg:grid-cols-8">
            {stickers.map((sid, i) => (
              <li key={sid}>
                <button
                  type="button"
                  onClick={() => setZoom(i)}
                  aria-label={tx(`ดูภาพที่ ${i + 1} แบบขยาย`, `View sticker ${i + 1} larger`)}
                  className="group block aspect-square w-full overflow-hidden rounded-2xl bg-surface-muted transition-colors hover:bg-sunny-100"
                >
                  <img
                    src={stickerImage(sid)}
                    alt=""
                    width={120}
                    height={120}
                    loading={i < 16 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full object-contain p-1.5 transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none sm:p-2"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="more-sets" className="mt-12">
          <h2 id="more-sets" className="t-section mb-4 font-display">
            {tx(`ชุดอื่นใน ${versionName(set.series)}`, `More ${versionName(set.series)} sets`)}
          </h2>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-6">
            {related.map((s) => (
              <li key={s.id}>
                <RelatedCard set={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <StickerZoom stickers={stickers} index={zoom} onIndex={setZoom} buyUrl={buyUrl} />
    </Page>
  )
}

function BackLink() {
  const tx = useTx()
  return (
    <Link to="/stickers" className="-ml-1 mb-5 inline-flex min-h-10 items-center gap-1 rounded-full pr-3 text-sm font-medium text-muted hover:text-ink">
      <ChevronLeft size={18} aria-hidden />
      {tx('สติกเกอร์ทั้งหมด', 'All stickers')}
    </Link>
  )
}

function RelatedCard({ set }: { set: LineSet }) {
  return (
    <Link to={`/stickers/${set.id}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-2xl bg-surface-muted transition-colors group-hover:bg-sunny-100">
        <img
          src={set.image}
          alt=""
          width={160}
          height={160}
          loading="lazy"
          className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs leading-snug font-medium" lang="th">
        {set.name}
      </p>
    </Link>
  )
}

/** One sticker, big. Arrows (and ← → keys) step through the set. */
function StickerZoom({ stickers, index, onIndex, buyUrl }: { stickers: number[]; index: number | null; onIndex: (i: number | null) => void; buyUrl: string }) {
  const tx = useTx()
  const open = index !== null
  const i = index ?? 0
  const prev = () => onIndex(Math.max(0, i - 1))
  const next = () => onIndex(Math.min(stickers.length - 1, i + 1))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onIndex(Math.max(0, i - 1))
      if (e.key === 'ArrowRight') onIndex(Math.min(stickers.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, i, stickers.length, onIndex])

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(o) => !o && onIndex(null)}
      title={tx(`ภาพที่ ${i + 1} จาก ${stickers.length}`, `Sticker ${i + 1} of ${stickers.length}`)}
      size="sm"
      footer={
        <a href={buyUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md, 'w-full sm:w-auto')}>
          {tx('ซื้อชุดนี้ใน LINE', 'Buy this set on LINE')}
          <ArrowUpRight size={16} aria-hidden />
        </a>
      }
    >
      {open && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" iconOnly label={tx('ภาพก่อนหน้า', 'Previous sticker')} icon={<ChevronLeft size={22} />} disabled={i === 0} onClick={prev} />
          <div className="flex aspect-square min-w-0 flex-1 items-center justify-center rounded-2xl bg-surface-muted">
            <img key={stickers[i]} src={stickerImage(stickers[i], true)} alt="" className="h-full w-full object-contain p-4" />
          </div>
          <Button
            variant="ghost"
            iconOnly
            label={tx('ภาพถัดไป', 'Next sticker')}
            icon={<ChevronRight size={22} />}
            disabled={i === stickers.length - 1}
            onClick={next}
          />
        </div>
      )}
    </ResponsiveModal>
  )
}
