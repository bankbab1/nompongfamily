import { ClipboardPaste, LayoutGrid, Lightbulb } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ProgressIndicator } from '@/components/feedback/States'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { track } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { slotStatus, type BriefIssue } from '@/lib/validation/brief'
import { POSE_EXAMPLES } from '../content'
import { completedCount, moveItem, toggleItemReference, updateItem, type DraftData } from '../model/draft'
import { BulkPasteDialog } from './BulkPasteDialog'
import { CopySlotDialog } from './CopySlotDialog'
import { SlotEditor } from './SlotEditor'
import { StickerSlotChip } from './StickerSlotChip'

function isTyping(el: Element | null) {
  return !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable)
}

export function PoseGuidance({ className }: { className?: string }) {
  return (
    <aside className={cn('rounded-3xl border border-line bg-mint-100/60 p-4', className)} aria-labelledby="pose-tips">
      <h3 id="pose-tips" className="flex items-center gap-2 font-display text-base">
        <Lightbulb size={18} aria-hidden /> เขียนท่าทางให้เห็นภาพ
      </h3>
      <p className="mt-1 text-sm text-muted">ยิ่งละเอียด ทีมงานยิ่งวาดได้ตรงใจ (ตัวอย่างเท่านั้น ระบบไม่แก้ข้อความของคุณ)</p>
      <ul className="mt-3 space-y-3 text-sm">
        {POSE_EXAMPLES.map((ex) => (
          <li key={ex.bad} className="rounded-2xl bg-surface p-3">
            <p className="text-muted">
              แทนที่จะเขียน <span className="line-through">“{ex.bad}”</span>
            </p>
            <p className="mt-0.5 text-ink">ลองเขียน “{ex.good}”</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export function SlotsStep({
  data,
  active,
  issues,
  showErrors,
  onChange,
  onActive,
}: {
  data: DraftData
  active: number
  issues: BriefIssue[]
  showErrors: boolean
  onChange(fn: (d: DraftData) => DraftData): void
  onActive(position: number): void
}) {
  const t = useT()
  const [bulkOpen, setBulkOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [gridOpen, setGridOpen] = useState(false)
  const [announce, setAnnounce] = useState('')
  const stripRef = useRef<HTMLDivElement>(null)
  const total = data.stickerCount
  const visible = data.items.slice(0, total)
  const item = data.items[Math.min(active, total) - 1]
  const done = completedCount(data)
  const invalidSlots = new Set(showErrors ? issues.filter((i) => typeof i.scope === 'number').map((i) => i.scope as number) : [])

  const go = (p: number) => onActive(Math.max(1, Math.min(total, p)))

  // Keep the active chip visible in the mobile strip.
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-pos="${active}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  // Desktop-only shortcuts that never fire while typing (spec §6.4).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!window.matchMedia('(min-width: 1024px)').matches) return
      if (isTyping(document.activeElement) || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === ']' || e.key === 'ArrowRight') {
        e.preventDefault()
        go(active + 1)
      } else if (e.key === '[' || e.key === 'ArrowLeft') {
        e.preventDefault()
        go(active - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const patchItem = (patch: Parameters<typeof updateItem>[2]) => {
    const before = slotStatus(item)
    onChange((d) => updateItem(d, item.position, patch))
    const after = slotStatus({ ...item, ...patch })
    if (before !== 'complete' && after === 'complete') track('slot_completed', { position: item.position, total })
  }

  const move = (dir: -1 | 1) => {
    const to = item.position + dir
    onChange((d) => moveItem(d, item.position, to))
    onActive(to)
    setAnnounce(`ย้ายภาพ ${pad2(item.position)} ไปตำแหน่ง ${pad2(to)} แล้ว`)
  }

  const chips = (size: 'md' | 'lg' = 'md', onPick?: () => void) =>
    visible.map((it) => (
      <span key={it.id} data-pos={it.position} className="p-1">
        <StickerSlotChip
          position={it.position}
          state={slotStatus(it)}
          selected={it.position === item.position}
          invalid={invalidSlots.has(it.position)}
          size={size}
          onClick={() => {
            go(it.position)
            onPick?.()
          }}
        />
      </span>
    ))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">รายละเอียดสติกเกอร์ทีละภาพ</h2>
          <p className="mt-1 text-sm text-muted">ใส่ข้อความและท่าทางให้ครบทุกภาพ บันทึกอัตโนมัติทุกครั้งที่พิมพ์</p>
        </div>
        <Button size="sm" variant="secondary" icon={<ClipboardPaste size={16} />} onClick={() => setBulkOpen(true)}>
          วางข้อความหลายภาพ
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <ProgressIndicator value={done} max={total} label="ความคืบหน้าการกรอก" className="flex-1" />
        <span className="shrink-0 text-sm font-medium tabular-nums">{t('wizard.progress', { done, total })}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_17rem]">
        {/* Slot overview: horizontal strip on phones, grid beside the editor from md. */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 md:hidden">
            <div ref={stripRef} className="no-scrollbar -mx-1 flex min-w-0 flex-1 overflow-x-auto py-1" role="group" aria-label="เลือกภาพ">
              {chips()}
            </div>
            <Button size="md" variant="secondary" iconOnly label="ดูทุกภาพ" icon={<LayoutGrid size={18} />} onClick={() => setGridOpen(true)} />
          </div>
          <div className="sticky top-20 hidden rounded-3xl border border-line bg-surface p-3 md:block">
            <p className="mb-2 px-1 text-sm font-medium">ทุกภาพ ({total})</p>
            <div className="-m-1 flex flex-wrap" role="group" aria-label="เลือกภาพ">
              {chips()}
            </div>
            <p className="mt-3 hidden px-1 text-xs text-muted lg:block">
              คีย์ลัด: <kbd className="rounded border border-line px-1">[</kbd> <kbd className="rounded border border-line px-1">]</kbd> หรือลูกศร
              ซ้าย/ขวา เมื่อไม่ได้พิมพ์อยู่
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <SlotEditor
            item={item}
            total={total}
            references={data.references}
            issues={issues}
            showErrors={showErrors}
            onChange={patchItem}
            onPrev={() => go(item.position - 1)}
            onNext={() => go(item.position + 1)}
            onMove={move}
            onCopy={() => setCopyOpen(true)}
            onToggleReference={(id) => onChange((d) => toggleItemReference(d, item.position, id))}
          />
          <PoseGuidance className="mt-5 xl:hidden" />
        </div>

        <PoseGuidance className="hidden self-start xl:sticky xl:top-20 xl:block" />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <ResponsiveModal open={gridOpen} onOpenChange={setGridOpen} title="เลือกภาพ" description={t('wizard.progress', { done, total })}>
        <div className="-m-1 grid grid-cols-5 justify-items-center gap-1 sm:grid-cols-8">{chips('lg', () => setGridOpen(false))}</div>
      </ResponsiveModal>
      <BulkPasteDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        data={data}
        onApply={(fn, first) => {
          onChange(fn)
          go(first)
        }}
      />
      <CopySlotDialog open={copyOpen} onOpenChange={setCopyOpen} data={data} target={item.position} onApply={onChange} />
    </div>
  )
}
