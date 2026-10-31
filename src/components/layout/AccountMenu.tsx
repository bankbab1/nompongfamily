import { FileText, LayoutDashboard, LogOut, Shield, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { SignOutDialog } from './SignOutDialog'

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-peach-100 font-display text-sm font-medium text-brown', className)}
      aria-hidden
    >
      {[...name.trim()][0] ?? '?'}
    </span>
  )
}

/** Desktop account dropdown; on mobile the header links straight to /my. */
export function AccountMenu() {
  const t = useT()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) {
    return (
      <Link to="/login" className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-ink hover:bg-surface-muted">
        {t('nav.signIn')}
      </Link>
    )
  }

  const item = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-ink hover:bg-surface-muted'
  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full pr-2 pl-1 hover:bg-surface-muted"
      >
        <Avatar name={user.displayName} />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium xl:block">{user.displayName}</span>
        <span className="sr-only">{t('nav.account')}</span>
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-40 mt-2 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{user.displayName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" className={item} onClick={() => go('/my')}>
            <LayoutDashboard size={18} aria-hidden /> {t('nav.my')}
          </button>
          <button role="menuitem" className={item} onClick={() => go('/my/requests')}>
            <FileText size={18} aria-hidden /> {t('nav.myRequests')}
          </button>
          <button role="menuitem" className={item} onClick={() => go('/my/profile')}>
            <UserIcon size={18} aria-hidden /> {t('nav.profile')}
          </button>
          {user.role === 'admin' && (
            <button role="menuitem" className={item} onClick={() => go('/admin')}>
              <Shield size={18} aria-hidden /> {t('nav.admin')}
            </button>
          )}
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false)
              setSigningOut(true)
            }}
          >
            <LogOut size={18} aria-hidden /> {t('nav.signOut')}
          </button>
        </div>
      )}
      <SignOutDialog open={signingOut} onOpenChange={setSigningOut} />
    </div>
  )
}
