import { useQueryClient } from '@tanstack/react-query'
import { FlaskConical, RotateCcw, WifiOff } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { FULL_APP } from '@/app/phase'
import { USING_MOCK_API } from '@/lib/api'
import { getDevSettings, onDevSettings, resetMockDb, setDevSettings } from '@/lib/api/mock/db'
import { confirm } from '@/components/ui/ConfirmDialog'
import { localDrafts } from '@/lib/storage/drafts'

/**
 * Makes mock mode impossible to miss (spec §11: "mock data must be clearly marked") and
 * exposes test switches for offline / reset. Renders nothing once a real adapter is used.
 */
export function DevBanner() {
  const settings = useSyncExternalStore(onDevSettings, () => JSON.stringify(getDevSettings()))
  const { offline } = JSON.parse(settings) as ReturnType<typeof getDevSettings>
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  // Phase 1 shows no mock backend data, so the test bar would only confuse visitors.
  if (!USING_MOCK_API || !FULL_APP) return null

  return (
    <div className="border-b border-sunny-200 bg-sunny-100 text-xs text-brown">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <FlaskConical size={13} aria-hidden /> โหมดทดสอบ — ข้อมูลจำลอง (mock)
        </span>
        {offline && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brown px-2 py-0.5 font-semibold text-cream">
            <WifiOff size={12} aria-hidden /> จำลองออฟไลน์
          </span>
        )}
        <button type="button" className="ml-auto min-h-8 rounded-lg px-2 font-medium underline underline-offset-2" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'ซ่อนเครื่องมือ' : 'เครื่องมือทดสอบ'}
        </button>
      </div>
      {open && (
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pb-2">
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-sunny-200 bg-surface px-3">
            <input type="checkbox" checked={offline} onChange={(e) => setDevSettings({ offline: e.target.checked })} />
            จำลองเซิร์ฟเวอร์ออฟไลน์
          </label>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-sunny-200 bg-surface px-3"
            onClick={async () => {
              const ok = await confirm({
                title: 'รีเซ็ตข้อมูลจำลอง?',
                description: 'คืนค่าข้อมูลเซิร์ฟเวอร์จำลองและลบฉบับร่างในเครื่องนี้ทั้งหมด',
                confirmLabel: 'รีเซ็ต',
                tone: 'danger',
              })
              if (!ok) return
              resetMockDb()
              for (const d of await localDrafts.list()) await localDrafts.remove(d.clientDraftId)
              qc.invalidateQueries()
            }}
          >
            <RotateCcw size={13} aria-hidden /> รีเซ็ตข้อมูลตัวอย่าง
          </button>
        </div>
      )}
    </div>
  )
}
