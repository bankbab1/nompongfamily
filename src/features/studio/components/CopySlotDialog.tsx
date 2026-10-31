import { useEffect, useState } from 'react'
import { Alert } from '@/components/feedback/States'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { Checkbox, Select } from '@/components/ui/Field'
import { pad2 } from '@/lib/utils/id'
import { slotStatus } from '@/lib/validation/brief'
import { copyItem, type CopyField, type DraftData } from '../model/draft'
import { pick, useLocale, useTx } from '@/lib/i18n'

const FIELDS: { key: CopyField; label: { th: string; en: string } }[] = [
  { key: 'pose', label: { th: 'ท่าทาง / อารมณ์', en: 'Pose / mood' } },
  { key: 'clothingProps', label: { th: 'เครื่องแต่งกาย / พร็อพ', en: 'Outfit / props' } },
  { key: 'colorNotes', label: { th: 'โน้ตเรื่องสี', en: 'Colour notes' } },
  { key: 'caption', label: { th: 'ข้อความ', en: 'Word' } },
]

/** Copy details from another slot into the current one, with confirmation before overwriting. */
export function CopySlotDialog({
  open,
  onOpenChange,
  data,
  target,
  onApply,
}: {
  open: boolean
  onOpenChange(o: boolean): void
  data: DraftData
  target: number
  onApply(fn: (d: DraftData) => DraftData): void
}) {
  const tx = useTx()
  const locale = useLocale()
  const sources = data.items.slice(0, data.stickerCount).filter((it) => it.position !== target && slotStatus(it) !== 'empty')
  const [from, setFrom] = useState<number>(sources[0]?.position ?? 0)
  const [fields, setFields] = useState<CopyField[]>(['pose', 'clothingProps', 'colorNotes'])

  useEffect(() => {
    if (open) setFrom(sources[0]?.position ?? 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target])

  const src = data.items[from - 1]
  const dst = data.items[target - 1]
  const overwrites = fields.filter((f) => (dst?.[f] ?? '').trim() && (dst?.[f] ?? '') !== (src?.[f] ?? ''))

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={tx(`คัดลอกรายละเอียดมาที่ภาพ ${pad2(target)}`, `Copy details to sticker ${pad2(target)}`)}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {tx('ยกเลิก', 'Cancel')}
          </Button>
          <Button
            variant={overwrites.length ? 'danger' : 'primary'}
            disabled={!from || !fields.length}
            onClick={() => {
              onApply((d) => copyItem(d, from, target, fields))
              onOpenChange(false)
            }}
          >
            {overwrites.length ? tx(`คัดลอกและแทนที่ ${overwrites.length} ช่อง`, `Copy and replace ${overwrites.length}`) : tx('คัดลอก', 'Copy')}
          </Button>
        </>
      }
    >
      {sources.length === 0 ? (
        <p className="text-sm text-muted">{tx('ยังไม่มีภาพอื่นที่กรอกข้อมูลไว้ให้คัดลอก', 'No other sticker has details to copy yet.')}</p>
      ) : (
        <div className="space-y-4">
          <Select label={tx('คัดลอกจากภาพ', 'Copy from sticker')} value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {sources.map((s) => (
              <option key={s.position} value={s.position}>
                {pad2(s.position)} — {s.caption || tx('(ยังไม่มีข้อความ)', '(no word yet)')}
              </option>
            ))}
          </Select>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{tx('เลือกสิ่งที่จะคัดลอก', 'Choose what to copy')}</legend>
            {FIELDS.map((f) => (
              <Checkbox
                key={f.key}
                label={pick(f.label, locale)}
                description={src?.[f.key] ? <span lang="th">“{src[f.key]}”</span> : tx('ว่าง', 'Empty')}
                checked={fields.includes(f.key)}
                onChange={(e) => setFields((cur) => (e.target.checked ? [...cur, f.key] : cur.filter((x) => x !== f.key)))}
              />
            ))}
          </fieldset>
          {overwrites.length > 0 && (
            <Alert tone="warning" title={tx('ข้อมูลเดิมในภาพนี้จะถูกแทนที่', 'This sticker’s existing details will be replaced')}>
              {overwrites.map((f) => pick(FIELDS.find((x) => x.key === f)!.label, locale)).join(', ')}
            </Alert>
          )}
        </div>
      )}
    </ResponsiveModal>
  )
}
