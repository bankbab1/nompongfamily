import { Laptop, Server } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import type { StickerRequest } from '@/lib/api/types'
import { formatDateTime } from '@/lib/utils/format'
import { slotStatus } from '@/lib/validation/brief'
import type { LocalDraft } from '../model/draft'

/** Local vs server divergence (spec §6.5): the user picks which version to keep. Nothing is discarded silently. */
export function ConflictDialog({
  open,
  local,
  server,
  onResolve,
  busy,
}: {
  open: boolean
  local: LocalDraft
  server: StickerRequest
  onResolve(keep: 'local' | 'server'): void
  busy?: boolean
}) {
  const localDone = local.data.items.slice(0, local.data.stickerCount).filter((i) => slotStatus(i) === 'complete').length
  const serverDone = server.items.slice(0, server.stickerCount).filter((i) => slotStatus(i) === 'complete').length
  const card = 'flex-1 rounded-2xl border border-line p-4'
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={() => undefined}
      closeOnBackdrop={false}
      title="พบฉบับร่างสองเวอร์ชัน"
      description="ฉบับร่างนี้ถูกแก้จากอีกอุปกรณ์หรือแท็บหนึ่ง ขณะที่เครื่องนี้มีการแก้ที่ยังไม่ได้ซิงก์ เลือกเวอร์ชันที่ต้องการเก็บ"
      size="lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className={card}>
          <p className="flex items-center gap-2 font-medium">
            <Laptop size={18} aria-hidden /> เวอร์ชันในเครื่องนี้
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-muted">ชื่อชุด: </dt>
              <dd className="inline" lang="th">
                {local.data.setName || '—'}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">กรอกครบ: </dt>
              <dd className="inline">
                {localDone}/{local.data.stickerCount} ภาพ
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">แก้ล่าสุด: </dt>
              <dd className="inline">{formatDateTime(local.updatedAt)}</dd>
            </div>
          </dl>
          <Button className="mt-4" block variant="primary" loading={busy} onClick={() => onResolve('local')}>
            ใช้เวอร์ชันในเครื่องนี้
          </Button>
        </div>
        <div className={card}>
          <p className="flex items-center gap-2 font-medium">
            <Server size={18} aria-hidden /> เวอร์ชันบนเซิร์ฟเวอร์
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-muted">ชื่อชุด: </dt>
              <dd className="inline" lang="th">
                {server.setName || '—'}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">กรอกครบ: </dt>
              <dd className="inline">
                {serverDone}/{server.stickerCount} ภาพ
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">แก้ล่าสุด: </dt>
              <dd className="inline">{formatDateTime(server.updatedAt)}</dd>
            </div>
          </dl>
          <Button className="mt-4" block variant="secondary" disabled={busy} onClick={() => onResolve('server')}>
            ใช้เวอร์ชันบนเซิร์ฟเวอร์
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">เวอร์ชันที่ไม่ได้เลือกจะถูกแทนที่</p>
    </ResponsiveModal>
  )
}
