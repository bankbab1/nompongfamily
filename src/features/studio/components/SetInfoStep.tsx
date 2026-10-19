import { useQuery } from '@tanstack/react-query'
import { Briefcase, Info } from 'lucide-react'
import { Alert, Skeleton } from '@/components/feedback/States'
import { confirm } from '@/components/ui/ConfirmDialog'
import { Checkbox, RadioCards, Select, TextArea, TextField } from '@/components/ui/Field'
import { api } from '@/lib/api'
import { qk } from '@/lib/api/queryKeys'
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
  const packages = useQuery({ queryKey: qk.packages, queryFn: () => api.requests.getPackages(), enabled: data.channel === 'commission' })
  const pkg = packages.data?.find((p) => p.stickerCount === data.stickerCount)

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

      {data.channel === 'commission' ? (
        <div className="space-y-4 rounded-3xl border border-line bg-sunny-50 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Briefcase size={18} aria-hidden />
            <h3 className="font-display text-lg">แพ็กเกจ {data.stickerCount} ภาพ</h3>
          </div>
          {packages.isPending ? (
            <Skeleton className="h-16" />
          ) : pkg ? (
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-muted">ราคา</dt>
                <dd className="font-medium">{pkg.priceLabel}</dd>
              </div>
              <div>
                <dt className="text-muted">แก้ไขได้</dt>
                <dd className="font-medium">{pkg.revisionRounds} รอบ</dd>
              </div>
              <div>
                <dt className="text-muted">ระยะเวลาโดยประมาณ</dt>
                <dd className="font-medium">{pkg.turnaroundDays} วัน</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">ยังไม่มีแพ็กเกจสำหรับจำนวนนี้ ทีมงานจะติดต่อกลับ</p>
          )}
          <TextField
            label="เลขอ้างอิงงาน Fastwork"
            optional
            value={data.fastworkReference ?? ''}
            maxChars={LIMITS.fastworkReference}
            onChange={(e) => onChange((d) => ({ ...d, fastworkReference: e.target.value }))}
            placeholder="เช่น FW-58213"
            hint="ใส่ได้ภายหลังเมื่อยืนยันงานบน Fastwork แล้ว ห้ามใส่ข้อมูลบัตรหรือการชำระเงิน"
            error={err('fastworkReference')}
            autoComplete="off"
            inputMode="text"
          />
          <Alert tone="info" icon={<Info size={18} />}>
            ราคาและเงื่อนไขกำหนดโดยทีมงานและตกลงกันบน Fastwork เว็บไซต์นี้ใช้รับบรีฟและตรวจงานเท่านั้น ไม่มีการชำระเงินที่นี่
          </Alert>
        </div>
      ) : (
        <Checkbox
          checked={!!data.allowPublicIdea}
          onChange={(e) => onChange((d) => ({ ...d, allowPublicIdea: e.target.checked }))}
          label="ยินยอมให้แสดงไอเดียนี้บนบอร์ดไอเดียสาธารณะ (หลังผ่านการคัดกรอง)"
          description="จะแสดงเฉพาะชื่อชุด ธีม และตัวอย่างข้อความ ไม่แสดงชื่อบัญชีหรือไฟล์แนบ"
        />
      )}
    </div>
  )
}
