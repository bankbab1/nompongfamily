import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, Eraser, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { confirm } from '@/components/ui/ConfirmDialog'
import { TextArea, TextField } from '@/components/ui/Field'
import type { ReferenceAsset, StickerBriefItem } from '@/lib/api/types'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { fieldError, LIMITS, slotStatus, type BriefIssue } from '@/lib/validation/brief'

export interface SlotEditorProps {
  item: StickerBriefItem
  total: number
  references: ReferenceAsset[]
  issues: BriefIssue[]
  showErrors: boolean
  onChange(patch: Partial<StickerBriefItem>): void
  onPrev(): void
  onNext(): void
  onMove(direction: -1 | 1): void
  onCopy(): void
  onToggleReference(id: string): void
}

/**
 * One sticker at a time (spec §4 mobile). Caption inputs disable autocorrect/spellcheck
 * and store exactly what was typed — Thai tone marks and intentionally repeated letters
 * are never altered (FE-03).
 */
export function SlotEditor({
  item,
  total,
  references,
  issues,
  showErrors,
  onChange,
  onPrev,
  onNext,
  onMove,
  onCopy,
  onToggleReference,
}: SlotEditorProps) {
  const err = (f: string) => (showErrors ? fieldError(issues, item.position, f) : undefined)
  const status = slotStatus(item)
  const hasAnything = status !== 'empty' || !!item.clothingProps || !!item.colorNotes || !!item.referenceAssetIds?.length

  async function clear() {
    const ok = await confirm({
      title: `ล้างข้อมูลภาพ ${pad2(item.position)}?`,
      description: 'ข้อความ ท่าทาง และโน้ตของช่องนี้จะถูกลบ',
      confirmLabel: 'ล้างข้อมูล',
      tone: 'danger',
    })
    if (ok) onChange({ caption: '', pose: '', clothingProps: '', colorNotes: '', referenceAssetIds: [] })
  }

  return (
    <section aria-labelledby={`slot-${item.id}-title`} className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 id={`slot-${item.id}-title`} className="font-display text-xl whitespace-nowrap text-ink">
          ภาพที่ {pad2(item.position)}
          <span className="ml-1.5 text-base text-muted">/ {pad2(total)}</span>
        </h3>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
            status === 'complete' ? 'bg-success-soft text-success' : status === 'partial' ? 'bg-warning-soft text-warning' : 'bg-surface-muted text-muted',
          )}
        >
          {status === 'complete' ? 'ครบแล้ว' : status === 'partial' ? 'กรอกบางส่วน' : 'ยังไม่กรอก'}
        </span>
        <div className="-mr-2 ml-auto flex items-center">
          <Button size="sm" variant="ghost" iconOnly label="เลื่อนขึ้น (สลับกับภาพก่อนหน้า)" icon={<ArrowUp size={18} />} disabled={item.position === 1} onClick={() => onMove(-1)} />
          <Button size="sm" variant="ghost" iconOnly label="เลื่อนลง (สลับกับภาพถัดไป)" icon={<ArrowDown size={18} />} disabled={item.position === total} onClick={() => onMove(1)} />
          <Button size="sm" variant="ghost" iconOnly label="คัดลอกรายละเอียดจากภาพอื่น" icon={<Copy size={18} />} onClick={onCopy} />
          <Button size="sm" variant="ghost" iconOnly label="ล้างข้อมูลช่องนี้" icon={<Eraser size={18} />} disabled={!hasAnything} onClick={() => void clear()} />
        </div>
      </header>

      <div className="space-y-4">
        <TextField
          key={`${item.id}-caption`}
          label="ข้อความบนสติกเกอร์"
          required
          value={item.caption}
          maxChars={LIMITS.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="เช่น ง่วงงงงง"
          hint="พิมพ์ตามที่ต้องการให้ปรากฏจริง ระบบจะไม่แก้คำสะกดหรือตัวอักษรซ้ำ"
          error={err('caption')}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          lang="th"
          className="font-display text-lg"
        />
        <TextArea
          key={`${item.id}-pose`}
          label="ท่าทาง / อารมณ์"
          required
          rows={3}
          value={item.pose}
          maxChars={LIMITS.pose}
          onChange={(e) => onChange({ pose: e.target.value })}
          placeholder="อธิบายให้เห็นภาพ เช่น ตาปรือ หาวปากกว้าง กอดหมอนไว้ข้างตัว"
          error={err('pose')}
          spellCheck={false}
          lang="th"
        />
        <details className="group rounded-2xl border border-line px-4 open:pb-4" open={!!(item.clothingProps || item.colorNotes)}>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-ink">รายละเอียดเพิ่มเติม (ไม่บังคับ)</summary>
          <div className="space-y-4 pt-1">
            <TextArea
              label="เครื่องแต่งกาย / พร็อพ"
              optional
              rows={2}
              value={item.clothingProps ?? ''}
              maxChars={LIMITS.clothingProps}
              onChange={(e) => onChange({ clothingProps: e.target.value })}
              placeholder="เช่น ใส่ผ้ากันเปื้อนสีเหลือง ถือแก้วชานม"
              error={err('clothingProps')}
              lang="th"
            />
            <TextField
              label="โน้ตเรื่องสี"
              optional
              value={item.colorNotes ?? ''}
              maxChars={LIMITS.colorNotes}
              onChange={(e) => onChange({ colorNotes: e.target.value })}
              placeholder="เช่น พื้นหลังโทนพีช"
              error={err('colorNotes')}
              lang="th"
            />
          </div>
        </details>

        {references.length > 0 && (
          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
              <ImageIcon size={16} aria-hidden /> ภาพอ้างอิงสำหรับภาพนี้ <span className="text-xs font-normal text-muted">(ไม่บังคับ)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {references.map((r) => {
                const on = item.referenceAssetIds?.includes(r.id)
                return (
                  <label
                    key={r.id}
                    className={cn(
                      'relative h-16 w-16 cursor-pointer overflow-hidden rounded-xl border-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown',
                      on ? 'border-brown' : 'border-line opacity-70 hover:opacity-100',
                    )}
                  >
                    <input type="checkbox" className="sr-only" checked={!!on} onChange={() => onToggleReference(r.id)} aria-label={`ใช้ภาพอ้างอิง ${r.name}`} />
                    <img src={r.url} alt="" className="h-full w-full object-cover" />
                    {on && <span className="absolute right-1 bottom-1 rounded-full bg-brown px-1.5 text-[10px] font-semibold text-cream">ใช้</span>}
                  </label>
                )
              })}
            </div>
          </fieldset>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
        <Button variant="secondary" icon={<ChevronLeft size={18} />} disabled={item.position === 1} onClick={onPrev}>
          ภาพก่อนหน้า
        </Button>
        <Button variant="secondary" iconRight={<ChevronRight size={18} />} disabled={item.position === total} onClick={onNext}>
          ภาพถัดไป
        </Button>
      </div>
    </section>
  )
}
