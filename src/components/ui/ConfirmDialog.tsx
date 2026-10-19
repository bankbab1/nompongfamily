import type { ReactNode } from 'react'
import { create } from 'zustand'
import { Button } from './Button'
import { ResponsiveModal } from './Dialog'

interface ConfirmRequest {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  resolve(ok: boolean): void
}

const useConfirmStore = create<{ req: ConfirmRequest | null; set(r: ConfirmRequest | null): void }>((set) => ({
  req: null,
  set: (req) => set({ req }),
}))

/** Promise-based confirmation: `if (await confirm({...})) doIt()`. */
export function confirm(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.getState().set({ ...opts, resolve }))
}

export function ConfirmHost() {
  const { req, set } = useConfirmStore()
  const close = (ok: boolean) => {
    req?.resolve(ok)
    set(null)
  }
  if (!req) return null
  return (
    <ResponsiveModal
      open
      onOpenChange={(o) => !o && close(false)}
      title={req.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>
            {req.cancelLabel ?? 'ยกเลิก'}
          </Button>
          <Button variant={req.tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
            {req.confirmLabel ?? 'ยืนยัน'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-[15px] leading-relaxed text-ink">{req.description}</div>
    </ResponsiveModal>
  )
}
