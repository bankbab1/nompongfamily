import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { create } from 'zustand'
import { pick } from '@/lib/i18n'

type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastItem {
  id: number
  type: ToastType
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  duration: number
}

interface ToastState {
  items: ToastItem[]
  push(t: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }): void
  dismiss(id: number): void
}

let seq = 0

export const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (t) =>
    set((s) => {
      if (s.items.some((x) => x.title === t.title && x.type === t.type)) return s
      const item: ToastItem = { id: ++seq, duration: t.duration ?? (t.type === 'error' ? 7000 : 4000), ...t }
      return { items: [...s.items, item].slice(-3) }
    }),
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}))

type Opts = Partial<Omit<ToastItem, 'id' | 'type' | 'title'>>
export const toast = {
  success: (title: string, o: Opts = {}) => useToasts.getState().push({ type: 'success', title, ...o }),
  info: (title: string, o: Opts = {}) => useToasts.getState().push({ type: 'info', title, ...o }),
  warning: (title: string, o: Opts = {}) => useToasts.getState().push({ type: 'warning', title, ...o }),
  error: (title: string, o: Opts = {}) => useToasts.getState().push({ type: 'error', title, ...o }),
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-success" aria-hidden />,
  info: <Info size={18} className="text-info" aria-hidden />,
  warning: <AlertTriangle size={18} className="text-warning" aria-hidden />,
  error: <XCircle size={18} className="text-danger" aria-hidden />,
}

function ToastView({ item }: { item: ToastItem }) {
  const dismiss = useToasts((s) => s.dismiss)
  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), item.duration)
    return () => clearTimeout(t)
  }, [item.id, item.duration, dismiss])
  return (
    <div
      role={item.type === 'error' ? 'alert' : 'status'}
      className="animate-toast-in pointer-events-auto flex w-full items-start gap-2.5 rounded-2xl border border-line bg-surface p-3.5 shadow-lg sm:w-96"
    >
      <span className="mt-0.5">{icons[item.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
        {item.action && (
          <button
            type="button"
            className="mt-1.5 text-sm font-semibold text-ink underline underline-offset-2"
            onClick={() => {
              item.action?.onClick()
              dismiss(item.id)
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label={pick({ th: 'ปิดการแจ้งเตือน', en: 'Dismiss' })}
        className="-m-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-muted"
      >
        <X size={16} />
      </button>
    </div>
  )
}

/** Top on phones (clear of sticky bottom action bars and the bottom nav); bottom-right on desktop. */
export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[calc(76px+env(safe-area-inset-top))] z-[90] flex flex-col gap-2 sm:inset-x-auto sm:right-4 lg:top-auto lg:right-6 lg:bottom-28"
    >
      {items.map((t) => (
        <ToastView key={t.id} item={t} />
      ))}
    </div>
  )
}
