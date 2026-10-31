import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Alert } from '@/components/feedback/States'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import { Select, TextArea } from '@/components/ui/Field'
import { pad2 } from '@/lib/utils/id'
import { applyBulkCaptions, planBulkCaptions, type DraftData } from '../model/draft'
import { useTx } from '@/lib/i18n'

/** One caption per line → preview mapping → explicit confirm before replacing (spec §6.4). */
export function BulkPasteDialog({
  open,
  onOpenChange,
  data,
  onApply,
}: {
  open: boolean
  onOpenChange(o: boolean): void
  data: DraftData
  onApply(fn: (d: DraftData) => DraftData, firstPosition: number): void
}) {
  const tx = useTx()
  const [text, setText] = useState('')
  const [start, setStart] = useState(1)
  const [confirming, setConfirming] = useState(false)
  const plan = useMemo(() => planBulkCaptions(data, text, start), [data, text, start])
  const replacing = plan.mapping.filter((m) => m.previous && m.previous !== m.caption)

  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setText('')
      setConfirming(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={close}
      title={tx('วางข้อความหลายภาพพร้อมกัน', 'Paste words for many stickers')}
      description={tx('พิมพ์หรือวางข้อความ 1 บรรทัดต่อ 1 ภาพ', 'Type or paste one line per sticker')}
      size="lg"
      closeOnBackdrop={!text}
      footer={
        <>
          <Button variant="secondary" onClick={() => (confirming ? setConfirming(false) : close(false))}>
            {confirming ? tx('กลับไปแก้', 'Go back') : tx('ยกเลิก', 'Cancel')}
          </Button>
          {!confirming ? (
            <Button
              variant="primary"
              disabled={!plan.mapping.length}
              onClick={() => (replacing.length ? setConfirming(true) : (onApply((d) => applyBulkCaptions(d, plan.mapping), start), close(false)))}
            >
              {tx(`ใส่ข้อความ ${plan.mapping.length} ภาพ`, `Fill ${plan.mapping.length} stickers`)}
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() => {
                onApply((d) => applyBulkCaptions(d, plan.mapping), start)
                close(false)
              }}
            >
              {tx(`ยืนยันแทนที่ ${replacing.length} ภาพ`, `Replace ${replacing.length} stickers`)}
            </Button>
          )}
        </>
      }
    >
      {!confirming ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <TextArea
              label={tx('ข้อความ (บรรทัดละภาพ)', 'Words (one line per sticker)')}
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'สวัสดีค่าาา\nขอบคุณน้าาา\nง่วงงงงง'}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              lang="th"
              hint={tx('บรรทัดว่างจะถูกข้าม ข้อความแต่ละบรรทัดจะถูกเก็บตามที่พิมพ์ทุกตัวอักษร', 'Empty lines are skipped. Each line is kept exactly as typed.')}
            />
            <Select label={tx('เริ่มที่ภาพ', 'Start at sticker')} value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {Array.from({ length: data.stickerCount }, (_, i) => (
                <option key={i} value={i + 1}>
                  {pad2(i + 1)}
                </option>
              ))}
            </Select>
          </div>
          {plan.overflow.length > 0 && (
            <Alert tone="warning" title={tx(`มี ${plan.overflow.length} บรรทัดเกินจำนวนภาพ`, `${plan.overflow.length} line(s) more than the stickers`)}>
              {tx('บรรทัดเหล่านี้จะไม่ถูกใส่', 'These lines won’t be used')}: {plan.overflow.slice(0, 3).join(', ')}
              {plan.overflow.length > 3 && ' …'}
            </Alert>
          )}
          {plan.mapping.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">{tx('ตัวอย่างการจับคู่', 'Preview')}</h3>
              <ol className="max-h-64 divide-y divide-line overflow-y-auto rounded-2xl border border-line">
                {plan.mapping.map((m) => (
                  <li key={m.position} className="flex items-baseline gap-3 px-3 py-2 text-sm">
                    <span className="w-7 shrink-0 font-display text-muted tabular-nums">{pad2(m.position)}</span>
                    <span className="min-w-0 flex-1 font-medium break-words whitespace-pre-wrap" lang="th">
                      {m.caption}
                    </span>
                    {m.previous && m.previous !== m.caption && (
                      <span className="max-w-[40%] shrink-0 truncate text-xs text-warning line-through" lang="th">
                        {m.previous}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Alert
            tone="warning"
            icon={<AlertTriangle size={18} />}
            title={tx(`ข้อความเดิม ${replacing.length} ภาพจะถูกแทนที่`, `${replacing.length} existing word(s) will be replaced`)}
          >
            {tx('ตรวจรายการด้านล่างก่อนยืนยัน', 'Check the list below before confirming.')}
          </Alert>
          <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-2xl border border-line text-sm">
            {replacing.map((m) => (
              <li key={m.position} className="grid grid-cols-[2rem_1fr] gap-x-3 px-3 py-2">
                <span className="row-span-2 font-display text-muted">{pad2(m.position)}</span>
                <span className="text-muted line-through" lang="th">
                  {m.previous}
                </span>
                <span className="font-medium" lang="th">
                  {m.caption}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ResponsiveModal>
  )
}
