import { AlertTriangle, CheckCircle2, Cloud, CloudOff, Info, Loader2, Lock, RefreshCw, SearchX, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { errorMessage, isApiError } from '@/lib/api/errors'
import { pick, useT, useTx } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

export function Spinner({ className, label = pick({ th: 'กำลังโหลด', en: 'Loading' }) }: { className?: string; label?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-muted', className)} aria-label={label} role="status" />
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-skeleton rounded-xl bg-line/70', className)} style={style} aria-hidden />
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 py-2" role="status" aria-label={pick({ th: 'กำลังโหลด', en: 'Loading' })}>
      <Skeleton className="h-8 w-2/3 max-w-sm" />
      <Skeleton className="h-4 w-1/2 max-w-xs" />
      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center', className)}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sunny-100 text-brown">{icon ?? <SearchX size={24} />}</div>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, title, className }: { error: unknown; onRetry?: () => void; title?: string; className?: string }) {
  const forbidden = isApiError(error, 'forbidden')
  const notFound = isApiError(error, 'not_found')
  const offline = isApiError(error, 'network')
  const tx = useTx()
  const heading =
    title ??
    (forbidden
      ? tx('ไม่มีสิทธิ์เข้าถึง', 'No access')
      : notFound
        ? tx('ไม่พบหน้านี้', 'Page not found')
        : offline
          ? tx('ออฟไลน์อยู่', 'You are offline')
          : tx('โหลดข้อมูลไม่สำเร็จ', 'Could not load this'))
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)} role="alert">
      <div
        className={cn(
          'mb-3 flex h-14 w-14 items-center justify-center rounded-full',
          forbidden ? 'bg-warning-soft text-warning' : offline ? 'bg-info-soft text-info' : 'bg-danger-soft text-danger',
        )}
      >
        {forbidden ? <Lock size={24} /> : offline ? <CloudOff size={24} /> : <XCircle size={24} />}
      </div>
      <h3 className="font-display text-lg text-ink">{heading}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{errorMessage(error)}</p>
      {onRetry && !forbidden && !notFound && (
        <Button className="mt-5" variant="secondary" icon={<RefreshCw size={16} />} onClick={onRetry}>
          {tx('ลองอีกครั้ง', 'Try again')}
        </Button>
      )}
    </div>
  )
}

type AlertTone = 'info' | 'success' | 'warning' | 'danger'
const alertTones: Record<AlertTone, { cls: string; icon: ReactNode }> = {
  info: { cls: 'border-mint bg-info-soft text-ink', icon: <Info size={18} className="text-info" /> },
  success: { cls: 'border-success/25 bg-success-soft text-ink', icon: <CheckCircle2 size={18} className="text-success" /> },
  warning: { cls: 'border-sunny-200 bg-warning-soft text-ink', icon: <AlertTriangle size={18} className="text-warning" /> },
  danger: { cls: 'border-danger/25 bg-danger-soft text-ink', icon: <XCircle size={18} className="text-danger" /> },
}

export function Alert({
  tone = 'info',
  title,
  children,
  actions,
  className,
  icon,
}: {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <div className={cn('flex gap-3 rounded-2xl border px-4 py-3 text-sm', alertTones[tone].cls, className)} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="mt-0.5 shrink-0" aria-hidden>
        {icon ?? alertTones[tone].icon}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'leading-relaxed')}>{children}</div>}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function ProgressIndicator({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-line', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-300', pct === 100 ? 'bg-success' : 'bg-sunny')} style={{ width: `${pct}%` }} />
    </div>
  )
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'local' | 'offline' | 'error' | 'conflict'

/** Polite live region so screen readers hear save state changes (spec §4, §6.5). */
export function AutosaveIndicator({ state, onRetry, className }: { state: SaveState; onRetry?: () => void; className?: string }) {
  const t = useT()
  const icon = {
    idle: null,
    saving: <Loader2 size={14} className="animate-spin" aria-hidden />,
    saved: <Cloud size={14} aria-hidden />,
    local: <CheckCircle2 size={14} aria-hidden />,
    offline: <CloudOff size={14} aria-hidden />,
    error: <AlertTriangle size={14} aria-hidden />,
    conflict: <AlertTriangle size={14} aria-hidden />,
  }[state]
  const tone = state === 'error' || state === 'conflict' ? 'text-danger' : state === 'offline' ? 'text-warning' : 'text-muted'
  return (
    <span className={cn('inline-flex min-h-6 items-center gap-1.5 text-xs font-medium', tone, className)}>
      <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5">
        {icon}
        {state !== 'idle' && t(`autosave.${state}`)}
      </span>
      {state === 'error' && onRetry && (
        <button type="button" onClick={onRetry} className="ml-1 rounded px-1 underline underline-offset-2">
          {t('common.retry')}
        </button>
      )}
    </span>
  )
}

export function Card({ children, className, as: As = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <As className={cn('min-w-0 rounded-3xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(38,34,31,0.04)]', className)}>{children}</As>
}
