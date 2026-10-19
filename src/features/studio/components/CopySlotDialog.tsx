import { useEffect, useState } from 'react'
import { Alert } from '@/components/feedback/States'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { Checkbox, Select } from '@/components/ui/Field'
import { pad2 } from '@/lib/utils/id'
import { slotStatus } from '@/lib/validation/brief'
import { copyItem, type CopyField, type DraftData } from '../model/draft'

const FIELDS: { key: CopyField; label: string }[] = [
  { key: 'pose', label: 'ท่าทาง / อารมณ์' },
  { key: 'clothingProps', label: 'เครื่องแต่งกาย / พร็อพ' },
  { key: 'colorNotes', label: 'โน้ตเรื่องสี' },
  { key: 'caption', label: 'ข้อความ' },
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
      title={`คัดลอกรายละเอียดมาที่ภาพ ${pad2(target)}`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant={overwrites.length ? 'danger' : 'primary'}
            disabled={!from || !fields.length}
            onClick={() => {
              onApply((d) => copyItem(d, from, target, fields))
              onOpenChange(false)
            }}
          >
            {overwrites.length ? `คัดลอกและแทนที่ ${overwrites.length} ช่อง` : 'คัดลอก'}
          </Button>
        </>
      }
    >
      {sources.length === 0 ? (
        <p className="text-sm text-muted">ยังไม่มีภาพอื่นที่กรอกข้อมูลไว้ให้คัดลอก</p>
      ) : (
        <div className="space-y-4">
          <Select label="คัดลอกจากภาพ" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {sources.map((s) => (
              <option key={s.position} value={s.position}>
                {pad2(s.position)} — {s.caption || '(ยังไม่มีข้อความ)'}
              </option>
            ))}
          </Select>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">เลือกสิ่งที่จะคัดลอก</legend>
            {FIELDS.map((f) => (
              <Checkbox
                key={f.key}
                label={f.label}
                description={src?.[f.key] ? <span lang="th">“{src[f.key]}”</span> : 'ว่าง'}
                checked={fields.includes(f.key)}
                onChange={(e) => setFields((cur) => (e.target.checked ? [...cur, f.key] : cur.filter((x) => x !== f.key)))}
              />
            ))}
          </fieldset>
          {overwrites.length > 0 && (
            <Alert tone="warning" title="ข้อมูลเดิมในภาพนี้จะถูกแทนที่">
              {overwrites.map((f) => FIELDS.find((x) => x.key === f)!.label).join(', ')}
            </Alert>
          )}
        </div>
      )}
    </ResponsiveModal>
  )
}
