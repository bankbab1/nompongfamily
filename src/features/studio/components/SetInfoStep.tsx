import { confirm } from '@/components/ui/ConfirmDialog'
import { Checkbox, RadioCards, Select, TextArea, TextField } from '@/components/ui/Field'
import { STICKER_COUNTS, type StickerCount } from '@/lib/api/types'
import { pad2 } from '@/lib/utils/id'
import { fieldError, LIMITS, type BriefIssue } from '@/lib/validation/brief'
import { hiddenFilledSlots, setCount, type DraftData } from '../model/draft'
import { useTx } from '@/lib/i18n'

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
  const tx = useTx()
  const err = (field: string) => (showErrors ? fieldError(issues, 'set', field) : undefined)

  async function changeCount(count: StickerCount) {
    if (count < data.stickerCount) {
      const hidden = hiddenFilledSlots(data, count)
      if (hidden.length) {
        const ok = await confirm({
          title: tx(`ลดเหลือ ${count} ภาพ?`, `Reduce to ${count} stickers?`),
          description: (
            <>
              <p>
                {tx('ช่อง', 'Slots')} <strong>{rangeLabel(hidden)}</strong>{' '}
                {tx(`มีข้อมูลอยู่ (${hidden.length} ช่อง) ช่องเหล่านี้จะถูก`, `have content (${hidden.length} slots). They will be `)}
                <strong>{tx('ซ่อน', 'hidden')}</strong>
                {tx('ไว้ ไม่ถูกลบ', ', not deleted')}
              </p>
              <p className="text-muted">
                {tx(
                  `ถ้าเพิ่มจำนวนกลับ ข้อมูลจะกลับมา แต่ถ้าส่งคำขอด้วยจำนวน ${count} ภาพ ช่องที่ซ่อนจะไม่ถูกส่งไปด้วย`,
                  `Increase the count again and they come back. If you send with ${count} stickers, hidden slots aren’t sent.`,
                )}
              </p>
            </>
          ),
          confirmLabel: tx(`ลดเหลือ ${count} ภาพ`, `Reduce to ${count}`),
        })
        if (!ok) return
      }
    }
    onChange((d) => setCount(d, count))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-ink">{tx('ข้อมูลชุดสติกเกอร์', 'Sticker set details')}</h2>
        <p className="mt-1 text-sm text-muted">
          {tx('ตั้งชื่อ เลือกจำนวน และเล่าธีมของชุดให้ทีมงานเข้าใจ', 'Name it, choose how many, and describe the theme for the team.')}
        </p>
      </div>

      <TextField
        label={tx('ชื่อชุดสติกเกอร์', 'Sticker set name')}
        required
        value={data.setName}
        maxChars={LIMITS.setName}
        onChange={(e) => onChange((d) => ({ ...d, setName: e.target.value }))}
        placeholder={tx('เช่น นมผงวัยทำงาน', 'e.g. Nompong at Work')}
        error={err('setName')}
        autoComplete="off"
        lang="th"
      />

      <RadioCards<StickerCount>
        name="stickerCount"
        legend={
          <>
            {tx('จำนวนสติกเกอร์', 'Number of stickers')} <span className="text-danger">*</span>
          </>
        }
        columns={5}
        value={data.stickerCount}
        onChange={(n) => void changeCount(n)}
        options={STICKER_COUNTS.map((n) => ({ value: n, label: <span className="font-display text-lg">{n}</span> }))}
        error={err('stickerCount')}
      />

      <Select
        label={tx('ภาษาบนสติกเกอร์', 'Sticker language')}
        value={data.language}
        disabled
        hint={tx('ตอนนี้รองรับภาษาไทย ภาษาอื่นจะเปิดในอนาคต', 'Thai for now; other languages will come later')}
        onChange={() => undefined}
      >
        <option value="th">{tx('ภาษาไทย', 'Thai')}</option>
      </Select>

      <TextArea
        label={tx('ธีม / คอนเซปต์ของชุด', 'Theme / concept')}
        optional
        rows={3}
        value={data.theme ?? ''}
        maxChars={LIMITS.theme}
        onChange={(e) => onChange((d) => ({ ...d, theme: e.target.value }))}
        placeholder={tx('เช่น ชีวิตออฟฟิศ ประชุม ส่งงาน เลิกงาน โทนสดใส', 'e.g. office life, meetings, deadlines, home time, bright colours')}
        error={err('theme')}
        lang="th"
      />

      <TextArea
        label={tx('โน้ตเพิ่มเติมถึงทีมงาน', 'Notes for the team')}
        optional
        rows={3}
        value={data.notes ?? ''}
        maxChars={LIMITS.notes}
        onChange={(e) => onChange((d) => ({ ...d, notes: e.target.value }))}
        placeholder={tx(
          'สิ่งที่อยากให้ทีมงานรู้ เช่น โทนสีที่ชอบ หรือสิ่งที่ไม่ต้องการ',
          'Anything the team should know, e.g. colours you like or things to avoid',
        )}
        error={err('notes')}
        lang="th"
      />

      <Checkbox
        checked={!!data.allowPublicIdea}
        onChange={(e) => onChange((d) => ({ ...d, allowPublicIdea: e.target.checked }))}
        label={tx('ยินยอมให้ทีมงานแสดงไอเดียนี้ต่อสาธารณะ (หลังผ่านการคัดกรอง)', 'Allow the team to show this idea publicly (after moderation)')}
        description={tx(
          'จะแสดงเฉพาะชื่อชุด ธีม และตัวอย่างข้อความ ไม่แสดงชื่อบัญชีหรือไฟล์แนบ',
          'Only the set name, theme and sample words are shown — never your account name or files.',
        )}
      />
    </div>
  )
}
