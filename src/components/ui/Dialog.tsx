import * as RDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { pick } from '@/lib/i18n'

/**
 * Dialogs opened from state would return focus to <body> on close; remember the
 * element that had focus and restore it (WCAG focus restoration).
 */
function useReturnFocus(open: boolean) {
  const returnTo = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (open) returnTo.current = document.activeElement as HTMLElement | null
  }, [open])
  return (event: Event) => {
    const el = returnTo.current
    if (el && el !== document.body && document.contains(el)) {
      event.preventDefault()
      el.focus()
    }
  }
}

export interface ResponsiveModalProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Prevent dismissing on backdrop click (e.g. unsaved comment). */
  closeOnBackdrop?: boolean
  className?: string
}

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-5xl' }

const closeBtn = '-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-ink'

/** Bottom sheet below 640px (thumb-reachable, safe-area aware), centred dialog above. */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className,
}: ResponsiveModalProps) {
  const onCloseAutoFocus = useReturnFocus(open)
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-brown-800/40 backdrop-blur-[1px]" />
        <RDialog.Content
          onPointerDownOutside={(e) => !closeOnBackdrop && e.preventDefault()}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'fixed z-50 flex flex-col border-line bg-surface shadow-2xl focus:outline-none',
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl border-t',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border',
            widths[size],
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3">
            <div className="min-w-0 pt-1.5">
              <RDialog.Title className="font-display text-lg font-medium text-ink">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-0.5 text-sm text-muted">{description}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</RDialog.Description>
              )}
            </div>
            <RDialog.Close className={closeBtn} aria-label={pick({ th: 'ปิด', en: 'Close' })}>
              <X size={20} />
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="mobile-sticky-actions flex flex-col-reverse gap-2 border-t border-line px-5 pt-3 sm:flex-row sm:items-center sm:justify-end sm:pb-3">
              {footer}
            </div>
          )}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

/** Right-hand details drawer (proof details, admin panels); full-width on phones. */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: Omit<ResponsiveModalProps, 'size' | 'closeOnBackdrop' | 'className'> & { wide?: boolean }) {
  const onCloseAutoFocus = useReturnFocus(open)
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-brown-800/30" />
        <RDialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface shadow-2xl focus:outline-none',
            wide ? 'md:max-w-3xl' : 'sm:max-w-xl',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3">
            <div className="min-w-0 pt-1.5">
              <RDialog.Title className="font-display text-lg font-medium text-ink">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-0.5 text-sm text-muted">{description}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{pick({ th: 'รายละเอียด', en: 'Details' })}</RDialog.Description>
              )}
            </div>
            <RDialog.Close className={closeBtn} aria-label={pick({ th: 'ปิด', en: 'Close' })}>
              <X size={20} />
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="mobile-sticky-actions flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 pt-3">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}
