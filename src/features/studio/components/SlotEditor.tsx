import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, Eraser, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { confirm } from '@/components/ui/ConfirmDialog'
import { TextArea, TextField } from '@/components/ui/Field'
import type { ReferenceAsset, StickerBriefItem } from '@/lib/api/types'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { fieldError, LIMITS, slotStatus, type BriefIssue } from '@/lib/validation/brief'
import { useTx } from '@/lib/i18n'

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
export function SlotEditor({ item, total, references, issues, showErrors, onChange, onPrev, onNext, onMove, onCopy, onToggleReference }: SlotEditorProps) {
  const tx = useTx()
  const err = (f: string) => (showErrors ? fieldError(issues, item.position, f) : undefined)
  const status = slotStatus(item)
  const hasAnything = status !== 'empty' || !!item.clothingProps || !!item.colorNotes || !!item.referenceAssetIds?.length

  async function clear() {
    const ok = await confirm({
      title: tx(`ล้างข้อมูลภาพ ${pad2(item.position)}?`, `Clear sticker ${pad2(item.position)}?`),
      description: tx('ข้อความ ท่าทาง และโน้ตของช่องนี้จะถูกลบ', 'The word, pose and notes for this slot will be deleted.'),
      confirmLabel: tx('ล้างข้อมูล', 'Clear'),
      tone: 'danger',
    })
    if (ok) onChange({ caption: '', pose: '', clothingProps: '', colorNotes: '', referenceAssetIds: [] })
  }

  return (
    <section aria-labelledby={`slot-${item.id}-title`} className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 id={`slot-${item.id}-title`} className="font-display text-xl whitespace-nowrap text-ink">
          {tx('ภาพที่', 'Sticker')} {pad2(item.position)}
          <span className="ml-1.5 text-base text-muted">/ {pad2(total)}</span>
        </h3>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
            status === 'complete' ? 'bg-success-soft text-success' : status === 'partial' ? 'bg-warning-soft text-warning' : 'bg-surface-muted text-muted',
          )}
        >
          {status === 'complete' ? tx('ครบแล้ว', 'Complete') : status === 'partial' ? tx('กรอกบางส่วน', 'Partly filled') : tx('ยังไม่กรอก', 'Empty')}
        </span>
        <div className="-mr-2 ml-auto flex items-center">
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            label={tx('เลื่อนขึ้น (สลับกับภาพก่อนหน้า)', 'Move up (swap with the previous one)')}
            icon={<ArrowUp size={18} />}
            disabled={item.position === 1}
            onClick={() => onMove(-1)}
          />
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            label={tx('เลื่อนลง (สลับกับภาพถัดไป)', 'Move down (swap with the next one)')}
            icon={<ArrowDown size={18} />}
            disabled={item.position === total}
            onClick={() => onMove(1)}
          />
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            label={tx('คัดลอกรายละเอียดจากภาพอื่น', 'Copy details from another sticker')}
            icon={<Copy size={18} />}
            onClick={onCopy}
          />
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            label={tx('ล้างข้อมูลช่องนี้', 'Clear this slot')}
            icon={<Eraser size={18} />}
            disabled={!hasAnything}
            onClick={() => void clear()}
          />
        </div>
      </header>

      <div className="space-y-4">
        <TextField
          key={`${item.id}-caption`}
          label={tx('ข้อความบนสติกเกอร์', 'Word on the sticker')}
          required
          value={item.caption}
          maxChars={LIMITS.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder={tx('เช่น ง่วงงงงง', 'e.g. ง่วงงงงง (sleepyyy)')}
          hint={tx(
            'พิมพ์ตามที่ต้องการให้ปรากฏจริง ระบบจะไม่แก้คำสะกดหรือตัวอักษรซ้ำ',
            'Type it exactly as it should appear. Spelling and repeated letters are never changed.',
          )}
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
          label={tx('ท่าทาง / อารมณ์', 'Pose / mood')}
          required
          rows={3}
          value={item.pose}
          maxChars={LIMITS.pose}
          onChange={(e) => onChange({ pose: e.target.value })}
          placeholder={tx('อธิบายให้เห็นภาพ เช่น ตาปรือ หาวปากกว้าง กอดหมอนไว้ข้างตัว', 'Paint a picture, e.g. droopy eyes, a big yawn, hugging a pillow')}
          error={err('pose')}
          spellCheck={false}
          lang="th"
        />
        <details className="group rounded-2xl border border-line px-4 open:pb-4" open={!!(item.clothingProps || item.colorNotes)}>
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-ink">
            {tx('รายละเอียดเพิ่มเติม (ไม่บังคับ)', 'More details (optional)')}
          </summary>
          <div className="space-y-4 pt-1">
            <TextArea
              label={tx('เครื่องแต่งกาย / พร็อพ', 'Outfit / props')}
              optional
              rows={2}
              value={item.clothingProps ?? ''}
              maxChars={LIMITS.clothingProps}
              onChange={(e) => onChange({ clothingProps: e.target.value })}
              placeholder={tx('เช่น ใส่ผ้ากันเปื้อนสีเหลือง ถือแก้วชานม', 'e.g. a yellow apron, holding a cup of milk tea')}
              error={err('clothingProps')}
              lang="th"
            />
            <TextField
              label={tx('โน้ตเรื่องสี', 'Colour notes')}
              optional
              value={item.colorNotes ?? ''}
              maxChars={LIMITS.colorNotes}
              onChange={(e) => onChange({ colorNotes: e.target.value })}
              placeholder={tx('เช่น พื้นหลังโทนพีช', 'e.g. a peach background')}
              error={err('colorNotes')}
              lang="th"
            />
          </div>
        </details>

        {references.length > 0 && (
          <fieldset>
            <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
              <ImageIcon size={16} aria-hidden /> {tx('ภาพอ้างอิงสำหรับภาพนี้', 'References for this sticker')}{' '}
              <span className="text-xs font-normal text-muted">{tx('(ไม่บังคับ)', '(optional)')}</span>
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
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!on}
                      onChange={() => onToggleReference(r.id)}
                      aria-label={`${tx('ใช้ภาพอ้างอิง', 'Use reference')} ${r.name}`}
                    />
                    <img src={r.url} alt="" className="h-full w-full object-cover" />
                    {on && (
                      <span className="absolute right-1 bottom-1 rounded-full bg-brown px-1.5 text-[10px] font-semibold text-cream">{tx('ใช้', 'Used')}</span>
                    )}
                  </label>
                )
              })}
            </div>
          </fieldset>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
        <Button variant="secondary" icon={<ChevronLeft size={18} />} disabled={item.position === 1} onClick={onPrev}>
          {tx('ภาพก่อนหน้า', 'Previous')}
        </Button>
        <Button variant="secondary" iconRight={<ChevronRight size={18} />} disabled={item.position === total} onClick={onNext}>
          {tx('ภาพถัดไป', 'Next')}
        </Button>
      </div>
    </section>
  )
}
