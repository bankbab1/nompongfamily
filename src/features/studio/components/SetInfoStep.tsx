import { confirm } from '@/components/ui/ConfirmDialog'
import { Checkbox, RadioCards, Select, TextArea, TextField } from '@/components/ui/Field'
import { STICKER_COUNTS, type StickerCount } from '@/lib/api/types'
import { pad2 } from '@/lib/utils/id'
import { fieldError, LIMITS, type BriefIssue } from '@/lib/validation/brief'
import { hiddenFilledSlots, setCount, type DraftData } from '../model/draft'

function rangeLabel(positions: number[]): string {
  if (!positions.length) return ''
  return positions.length === 1 ? pad2(positions[0]) : `${pad2(positions[0])}–${pad2(positions.at(-1)!)}`
}

export function SetInfoStep({
  data,
  issues,
  showErrors,
  onChange,
}: {
  data: DraftData
  issues: BriefIssue[]
  showErrors: boolean
  onChange(fn: (d: DraftData) => DraftData): void
}) {
  const err = (field: string) => (showErrors ? fieldError(issues, 'set', field) : undefined)

  async function changeCount(count: StickerCount) {
    if (count < data.stickerCount) {
      const hidden = hiddenFilledSlots(data, count)
      if (hidden.length) {
        const ok = await confirm({
          title: `ลดเหลือ ${count} ภาพ?`,
          description: (
            <>
              <p>
                ช่อง <strong>{rangeLabel(hidden)}</strong> มีข้อมูลอยู่ ({hidden.length} ช่อง) ช่องเหล่านี้จะถูก<strong>ซ่อน</strong>ไว้ ไม่ถูกลบ
              </p>
              <p className="text-muted">ถ้าเพิ่มจำนวนกลับ ข้อมูลจะกลับมา แต่ถ้าส่งคำขอด้วยจำนวน {count} ภาพ ช่องที่ซ่อนจะไม่ถูกส่งไปด้วย</p>
            </>
          ),
          confirmLabel: `ลดเหลือ ${count} ภาพ`,
        })
        if (!ok) return
      }
    }
    onChange((d) => setCount(d, count))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-ink">ข้อมูลชุดสติกเกอร์</h2>
        <p className="mt-1 text-sm text-muted">ตั้งชื่อ เลือกจำนวน และเล่าธีมของชุดให้ทีมงานเข้าใจ</p>
      </div>

      <TextField
        label="ชื่อชุดสติกเกอร์"
        required
        value={data.setName}
        maxChars={LIMITS.setName}
        onChange={(e) => onChange((d) => ({ ...d, setName: e.target.value }))}
        placeholder="เช่น นมผงวัยทำงาน"
        error={err('setName')}
        autoComplete="off"
        lang="th"
      />

      <RadioCards<StickerCount>
        name="stickerCount"
        legend={
          <>
            จำนวนสติกเกอร์ <span className="text-danger">*</span>
          </>
        }
        columns={5}
        value={data.stickerCount}
        onChange={(n) => void changeCount(n)}
        options={STICKER_COUNTS.map((n) => ({ value: n, label: <span className="font-display text-lg">{n}</span> }))}
        error={err('stickerCount')}
      />

      <Select label="ภาษาบนสติกเกอร์" value={data.language} disabled hint="ตอนนี้รองรับภาษาไทย ภาษาอื่นจะเปิดในอนาคต" onChange={() => undefined}>
        <option value="th">ภาษาไทย</option>
      </Select>

      <TextArea
        label="ธีม / คอนเซปต์ของชุด"
        optional
        rows={3}
        value={data.theme ?? ''}
        maxChars={LIMITS.theme}
        onChange={(e) => onChange((d) => ({ ...d, theme: e.target.value }))}
        placeholder="เช่น ชีวิตออฟฟิศ ประชุม ส่งงาน เลิกงาน โทนสดใส"
        error={err('theme')}
        lang="th"
      />

      <TextArea
        label="โน้ตเพิ่มเติมถึงทีมงาน"
        optional
        rows={3}
        value={data.notes ?? ''}
        maxChars={LIMITS.notes}
        onChange={(e) => onChange((d) => ({ ...d, notes: e.target.value }))}
        placeholder="สิ่งที่อยากให้ทีมงานรู้ เช่น โทนสีที่ชอบ หรือสิ่งที่ไม่ต้องการ"
        error={err('notes')}
        lang="th"
      />

      <Checkbox
        checked={!!data.allowPublicIdea}
        onChange={(e) => onChange((d) => ({ ...d, allowPublicIdea: e.target.checked }))}
        label="ยินยอมให้ทีมงานแสดงไอเดียนี้ต่อสาธารณะ (หลังผ่านการคัดกรอง)"
        description="จะแสดงเฉพาะชื่อชุด ธีม และตัวอย่างข้อความ ไม่แสดงชื่อบัญชีหรือไฟล์แนบ"
      />
    </div>
  )
}
