import { useQuery } from '@tanstack/react-query'
import { RevealItem } from '@/components/ui/Reveal'
import { ArrowUpRight, ChevronLeft, ChevronRight, Copy, MessageCircle, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState, Skeleton } from '@/components/feedback/States'
import { toast } from '@/components/feedback/Toast'
import { Page } from '@/components/layout/AppShell'
import { Button, buttonBase, buttonSizes, buttonVariants } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { useLocale, useTx } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { usePageMeta } from '@/lib/utils/usePageMeta'
import { coverTransition, findLineSet, LINE_SETS, lineUrl, loadSetDetails, stickerImage, versionName, VERSIONS, type LineSet } from './lineStore'

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
      {/* Phones: centred, like a store listing. Larger screens: cover beside the details. */}
      <header className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <div
          className="flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl bg-sticker-tile"
          style={{ viewTransitionName: coverTransition(set.id) }}
        >
          <img src={set.image} alt="" width={240} height={240} className="h-full w-full object-contain p-3" />
        </div>
        <div className="flex w-full min-w-0 flex-1 flex-col items-center sm:items-start">
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
          <div className="mt-4 flex w-full gap-2 sm:w-auto">
            <ShareButton title={set.title} />
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, 'min-w-0 flex-1 whitespace-normal px-3 text-sm leading-snug sm:flex-none sm:px-6 sm:text-base')}
            >
              {tx('ซื้อใน LINE STORE', 'Buy on the LINE STORE')}
              <ArrowUpRight size={18} aria-hidden />
            </a>
          </div>
        </div>
      </header>

      {details.data?.desc && (
        <p className="t-lead mx-auto mt-6 max-w-3xl text-center sm:mx-0 sm:text-left" lang="th">
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
              <RevealItem key={sid}>
                <button
                  type="button"
                  onClick={() => setZoom(i)}
                  aria-label={tx(`ดูภาพที่ ${i + 1} แบบขยาย`, `View sticker ${i + 1} larger`)}
                  className="group block aspect-square w-full overflow-hidden rounded-2xl bg-sticker-tile transition-colors hover:bg-sticker-tile-hover"
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
              </RevealItem>
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
              <RevealItem key={s.id}>
                <RelatedCard set={s} />
              </RevealItem>
            ))}
          </ul>
        </section>
      )}

      <StickerZoom set={set} stickers={stickers} index={zoom} onIndex={setZoom} buyUrl={buyUrl} />
    </Page>
  )
}

/** Share actions with a display-only URL: opening the sheet never focuses a text field. */
function ShareButton({ title }: { title: string }) {
  const tx = useTx()
  const [open, setOpen] = useState(false)
  const url = window.location.href
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // Local HTTP previews do not expose Clipboard API. Select only after an explicit copy tap.
        const field = document.createElement('textarea')
        const previous = document.activeElement as HTMLElement | null
        field.value = url
        field.readOnly = true
        field.style.cssText = 'position:fixed;top:0;left:-9999px;font-size:16px'
        document.body.append(field)
        try {
          field.select()
          if (!document.execCommand('copy')) throw new Error('Copy failed')
        } finally {
          field.remove()
          previous?.focus({ preventScroll: true })
        }
      }
      toast.success(tx('คัดลอกลิงก์แล้ว', 'Link copied'))
    } catch {
      toast.error(tx('คัดลอกลิงก์ไม่สำเร็จ', 'Couldn’t copy the link'))
    }
  }
  return (
    <>
      <Button variant="secondary" iconOnly label={tx('แชร์', 'Share')} icon={<Share2 size={18} />} onClick={() => setOpen(true)} />
      <ResponsiveModal open={open} onOpenChange={setOpen} title={tx('แชร์ชุดนี้', 'Share this set')} description={title} size="sm">
        <div className="space-y-3">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonBase, buttonSizes.lg, 'w-full justify-start gap-3 bg-[#06c755] text-white hover:brightness-95')}
          >
            <MessageCircle size={20} aria-hidden /> {tx('แชร์บน LINE', 'Share on LINE')}
          </a>
          <Button variant="secondary" size="lg" block className="justify-start" icon={<Copy size={20} />} onClick={() => void copy()}>
            {tx('คัดลอกลิงก์', 'Copy link')}
          </Button>
          <p className="rounded-2xl border border-line bg-surface-muted px-3 py-3 text-sm text-muted [overflow-wrap:anywhere]" dir="ltr">
            {url}
          </p>
        </div>
      </ResponsiveModal>
    </>
  )
}

function BackLink() {
  const tx = useTx()
  return (
    <Link
      to="/stickers"
      viewTransition
      className="-ml-1 mb-5 inline-flex min-h-10 items-center gap-1 rounded-full pr-3 text-sm font-medium text-muted hover:text-ink"
    >
      <ChevronLeft size={18} aria-hidden />
      {tx('สติกเกอร์ทั้งหมด', 'All stickers')}
    </Link>
  )
}

function RelatedCard({ set }: { set: LineSet }) {
  return (
    <Link
      to={`/stickers/${set.id}`}
      viewTransition
      className="group block transition-transform duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100"
    >
      <div
        className="aspect-square overflow-hidden rounded-2xl bg-sticker-tile transition-colors group-hover:bg-sticker-tile-hover"
        style={{ viewTransitionName: coverTransition(set.id) }}
      >
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
function StickerZoom({
  set,
  stickers,
  index,
  onIndex,
  buyUrl,
}: {
  set: LineSet
  stickers: number[]
  index: number | null
  onIndex: (i: number | null) => void
  buyUrl: string
}) {
  const tx = useTx()
  const open = index !== null
  const swipe = useRef<{ x: number; y: number } | null>(null)
  // Keep the selected sticker visible while Radix plays the closing animation.
  const [lastIndex, setLastIndex] = useState(index ?? 0)
  if (index !== null && index !== lastIndex) setLastIndex(index)
  const i = index ?? lastIndex
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
      title={<span lang="th">{set.name}</span>}
      description={`${versionName(set.series)} · ${set.code}`}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <ShareButton title={set.title} />
          <a href={buyUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md, 'flex-1 sm:flex-none')}>
            {tx('ซื้อชุดนี้ใน LINE', 'Buy this set on LINE')}
            <ArrowUpRight size={16} aria-hidden />
          </a>
        </div>
      }
    >
      {(
        <div className="flex items-center gap-2">
          <Button variant="ghost" iconOnly label={tx('ภาพก่อนหน้า', 'Previous sticker')} icon={<ChevronLeft size={22} />} disabled={i === 0} onClick={prev} />
          {/* Swipe left/right on the sticker to step through the set (down still closes the sheet). */}
          <div
            className="flex aspect-square min-w-0 flex-1 touch-pan-y items-center justify-center rounded-2xl bg-sticker-tile"
            onTouchStart={(e) => (swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
            onTouchEnd={(e) => {
              const s = swipe.current
              swipe.current = null
              if (!s) return
              const dx = e.changedTouches[0].clientX - s.x
              const dy = e.changedTouches[0].clientY - s.y
              if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
              if (dx < 0) next()
              else prev()
            }}
          >
            <img
              key={stickers[i]}
              src={stickerImage(stickers[i], true)}
              alt=""
              draggable={false}
              className="h-full w-full object-contain p-4 select-none motion-safe:animate-[fade-in_180ms_ease-out]"
            />
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
      {(
        <div className="mx-auto mt-4 max-w-56">
          <p className="text-center text-sm font-medium text-muted tabular-nums" aria-live="polite">
            <span className="sr-only">{tx('ภาพที่', 'Sticker')} </span>
            <span className="text-ink">{i + 1}</span> / {stickers.length}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-brown transition-[width] duration-200" style={{ width: `${((i + 1) / stickers.length) * 100}%` }} />
          </div>
        </div>
      )}
    </ResponsiveModal>
  )
}
