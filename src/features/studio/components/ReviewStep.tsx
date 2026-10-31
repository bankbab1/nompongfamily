import { AlertCircle, CloudOff, EyeOff, Globe, PenLine } from 'lucide-react'
import { Link } from 'react-router'
import { Alert } from '@/components/feedback/States'
import { ChannelBadge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Field'
import { pad2 } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { slotStatus, TERMS_VERSION, type BriefIssue } from '@/lib/validation/brief'
import { CHANNEL_DISCLOSURE, PUBLIC_DISCLOSURE, RIGHTS_NOTICE } from '../content'
import { hiddenFilledSlots, type DraftData, type WizardStep } from '../model/draft'

const SET_FIELD_LABEL: Record<string, string> = {
  setName: 'ชื่อชุด',
  stickerCount: 'จำนวนสติกเกอร์',
  theme: 'ธีม',
  notes: 'โน้ต',
  channel: 'ประเภทคำขอ',
  items: 'ช่องสติกเกอร์',
}

export function ReviewStep({
  data,
  issues,
  termsAccepted,
  onTerms,
  onJump,
  online,
}: {
  data: DraftData
  issues: BriefIssue[]
  termsAccepted: boolean
  onTerms(v: boolean): void
  onJump(step: WizardStep, slot?: number): void
  online: boolean
}) {
  const visible = data.items.slice(0, data.stickerCount)
  const setIssues = issues.filter((i) => i.scope === 'set')
  const slotIssues = [...new Set(issues.filter((i) => typeof i.scope === 'number').map((i) => i.scope as number))]
  const hidden = hiddenFilledSlots(data, data.stickerCount)
  const termsIssue = issues.find((i) => i.scope === 'terms')
  const blocking = setIssues.length + slotIssues.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-ink">ตรวจทานก่อนส่ง</h2>
        <p className="mt-1 text-sm text-muted">ตรวจข้อความทุกภาพให้ถูกต้อง ข้อความจะถูกใช้ตามที่พิมพ์ทุกตัวอักษร</p>
      </div>

      {blocking > 0 && (
        <section aria-labelledby="missing-title" className="rounded-3xl border-2 border-danger/30 bg-danger-soft p-4" tabIndex={-1} id="review-issues">
          <h3 id="missing-title" className="flex items-center gap-2 font-semibold text-danger">
            <AlertCircle size={18} aria-hidden /> ยังส่งไม่ได้ — มี {blocking} จุดที่ต้องแก้
          </h3>
          {setIssues.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {setIssues.map((i) => (
                <li key={i.field + i.message}>
                  <button type="button" onClick={() => onJump(2)} className="min-h-9 text-left underline underline-offset-2">
                    {SET_FIELD_LABEL[i.field] ?? i.field}: {i.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {slotIssues.length > 0 && (
            <div className="mt-3">
              <p className="text-sm">ภาพที่ยังไม่ครบ ({slotIssues.length}) — แตะเพื่อไปแก้:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {slotIssues.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => onJump(3, p)}
                      className="flex h-11 min-w-11 items-center justify-center rounded-xl border-2 border-danger/40 bg-surface px-2 font-display text-sm text-danger"
                      aria-label={`ไปแก้ภาพ ${pad2(p)}`}
                    >
                      {pad2(p)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <ChannelBadge channel={data.channel} />
            <h3 className="mt-2 font-display text-2xl break-words" lang="th">
              {data.setName.trim() || <span className="text-muted">(ยังไม่ได้ตั้งชื่อ)</span>}
            </h3>
          </div>
          <button type="button" onClick={() => onJump(2)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium hover:bg-surface-muted">
            <PenLine size={16} aria-hidden /> แก้ไข
          </button>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">จำนวน</dt>
            <dd>{data.stickerCount} ภาพ</dd>
          </div>
          <div>
            <dt className="text-muted">ภาษา</dt>
            <dd>ภาษาไทย</dd>
          </div>
          {data.theme && (
            <div className="sm:col-span-2">
              <dt className="text-muted">ธีม</dt>
              <dd className="whitespace-pre-wrap" lang="th">
                {data.theme}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted">ภาพอ้างอิง</dt>
            <dd>{data.references.length} ไฟล์</dd>
          </div>
        </dl>
      </section>

      {hidden.length > 0 && (
        <Alert tone="info" icon={<EyeOff size={18} />} title={`มีข้อมูลในช่องที่ซ่อนอยู่ ${hidden.length} ช่อง`}>
          ช่อง {hidden.map(pad2).join(', ')} อยู่นอกจำนวน {data.stickerCount} ภาพ จะไม่ถูกส่ง ถ้าต้องการให้ส่งด้วย ให้เพิ่มจำนวนสติกเกอร์
        </Alert>
      )}

      <section aria-labelledby="slots-review">
        <h3 id="slots-review" className="mb-2 font-display text-lg">
          ทุกภาพ ({visible.length})
        </h3>
        <ol className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {visible.map((it) => {
            const st = slotStatus(it)
            const bad = slotIssues.includes(it.position)
            return (
              <li key={it.id} className={cn('flex gap-3 px-4 py-3', bad && 'bg-danger-soft/50')}>
                <span className="w-7 shrink-0 pt-0.5 font-display text-muted tabular-nums">{pad2(it.position)}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-display text-base break-words whitespace-pre-wrap', !it.caption.trim() && 'text-danger')} lang="th">
                    {it.caption.trim() ? it.caption : 'ยังไม่มีข้อความ'}
                  </p>
                  <p className={cn('mt-0.5 line-clamp-2 text-sm', it.pose.trim() ? 'text-muted' : 'text-danger')} lang="th">
                    {it.pose.trim() ? it.pose : 'ยังไม่ได้อธิบายท่าทาง'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onJump(3, it.position)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-surface-muted"
                  aria-label={`แก้ไขภาพ ${pad2(it.position)}${st !== 'complete' ? ' (ยังไม่ครบ)' : ''}`}
                >
                  <PenLine size={18} aria-hidden />
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="disclosures" className="space-y-3">
        <h3 id="disclosures" className="font-display text-lg">
          ข้อตกลงก่อนส่ง
        </h3>
        <Alert tone="info" icon={<Globe size={18} />} title={PUBLIC_DISCLOSURE.title}>
          {PUBLIC_DISCLOSURE.body}
        </Alert>
        <Alert tone="warning" title={CHANNEL_DISCLOSURE[data.channel].title}>
          {CHANNEL_DISCLOSURE[data.channel].body}
        </Alert>
        <p className="text-sm text-muted">{RIGHTS_NOTICE}</p>
        <div className="rounded-2xl border border-line bg-surface px-4 py-2">
          <Checkbox
            checked={termsAccepted}
            onChange={(e) => onTerms(e.target.checked)}
            error={termsIssue?.message}
            label={
              <>
                ฉันได้อ่านและยอมรับ{' '}
                <Link to="/terms" target="_blank" className="font-medium underline">
                  ข้อกำหนดการใช้งาน
                </Link>{' '}
                (ฉบับ {TERMS_VERSION}) และ{' '}
                <Link to="/privacy" target="_blank" className="font-medium underline">
                  นโยบายความเป็นส่วนตัว
                </Link>{' '}
                รวมถึงเข้าใจว่าชุดนี้ตั้งใจวางขายแบบสาธารณะ และไม่รับประกันการผลิตหรือการอนุมัติ
              </>
            }
          />
        </div>
      </section>

      {!online && (
        <Alert tone="warning" icon={<CloudOff size={18} />} title="ออฟไลน์อยู่">
          ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อส่งคำขอ ฉบับร่างบันทึกไว้ในเครื่องนี้แล้ว ไม่หายแน่นอน
        </Alert>
      )}
    </div>
  )
}
