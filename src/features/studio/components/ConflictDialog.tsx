import { Laptop, Server } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ResponsiveModal } from '@/components/ui/Dialog'
import type { StickerRequest } from '@/lib/api/types'
import { formatDateTime } from '@/lib/utils/format'
import { slotStatus } from '@/lib/validation/brief'
import type { LocalDraft } from '../model/draft'
import { useTx } from '@/lib/i18n'

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
  const tx = useTx()
  const localDone = local.data.items.slice(0, local.data.stickerCount).filter((i) => slotStatus(i) === 'complete').length
  const serverDone = server.items.slice(0, server.stickerCount).filter((i) => slotStatus(i) === 'complete').length
  const card = 'flex-1 rounded-2xl border border-line p-4'
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={() => undefined}
      closeOnBackdrop={false}
      title={tx('พบฉบับร่างสองเวอร์ชัน', 'Two versions of this draft')}
      description={tx(
        'ฉบับร่างนี้ถูกแก้จากอีกอุปกรณ์หรือแท็บหนึ่ง ขณะที่เครื่องนี้มีการแก้ที่ยังไม่ได้ซิงก์ เลือกเวอร์ชันที่ต้องการเก็บ',
        'This draft was changed on another device or tab while this one has unsynced edits. Choose the version to keep.',
      )}
      size="lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className={card}>
          <p className="flex items-center gap-2 font-medium">
            <Laptop size={18} aria-hidden /> {tx('เวอร์ชันในเครื่องนี้', 'This device')}
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-muted">{tx('ชื่อชุด', 'Set name')}: </dt>
              <dd className="inline" lang="th">
                {local.data.setName || '—'}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">{tx('กรอกครบ', 'Complete')}: </dt>
              <dd className="inline">
                {localDone}/{local.data.stickerCount}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">{tx('แก้ล่าสุด', 'Last edited')}: </dt>
              <dd className="inline">{formatDateTime(local.updatedAt)}</dd>
            </div>
          </dl>
          <Button className="mt-4" block variant="primary" loading={busy} onClick={() => onResolve('local')}>
            {tx('ใช้เวอร์ชันในเครื่องนี้', 'Keep this device’s version')}
          </Button>
        </div>
        <div className={card}>
          <p className="flex items-center gap-2 font-medium">
            <Server size={18} aria-hidden /> {tx('เวอร์ชันบนเซิร์ฟเวอร์', 'Server')}
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline text-muted">{tx('ชื่อชุด', 'Set name')}: </dt>
              <dd className="inline" lang="th">
                {server.setName || '—'}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">{tx('กรอกครบ', 'Complete')}: </dt>
              <dd className="inline">
                {serverDone}/{server.stickerCount}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted">{tx('แก้ล่าสุด', 'Last edited')}: </dt>
              <dd className="inline">{formatDateTime(server.updatedAt)}</dd>
            </div>
          </dl>
          <Button className="mt-4" block variant="secondary" disabled={busy} onClick={() => onResolve('server')}>
            {tx('ใช้เวอร์ชันบนเซิร์ฟเวอร์', 'Keep the server version')}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">{tx('เวอร์ชันที่ไม่ได้เลือกจะถูกแทนที่', 'The other version will be replaced.')}</p>
    </ResponsiveModal>
  )
}
