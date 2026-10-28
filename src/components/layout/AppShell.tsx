import { ChevronLeft, Compass, Home, Palette, UserRound } from 'lucide-react'
import { Suspense } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router'
import { PageSkeleton } from '@/components/feedback/States'
import { FULL_APP } from '@/app/phase'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { AccountMenu, Avatar } from './AccountMenu'
import { DevBanner } from './DevBanner'
import { Footer } from './Footer'
import { PortalBottomNav, PortalHeader } from './PortalChrome'
import { Wordmark } from './Wordmark'

/** Per-route layout hints, set via the route `handle`. */
export interface RouteHandle {
  /** Mobile header title. */
  title?: string
  /** Explicit back target on mobile (more predictable than history.back for deep links). */
  back?: string
  /** Hide the bottom nav so a page's own sticky action bar owns the bottom edge (builder). */
  hideBottomNav?: boolean
}

function useHandle(): RouteHandle {
  const matches = useMatches()
  return matches.reduce<RouteHandle>((acc, m) => ({ ...acc, ...((m.handle as RouteHandle | undefined) ?? {}) }), {})
}

const desktopLinks = [
  { to: '/about', key: 'nav.about' },
  { to: '/stickers', key: 'nav.stickers' },
  { to: '/wallpapers', key: 'nav.wallpapers' },
  { to: '/ideas', key: 'nav.ideas' },
] as const

function PublicHeader({ handle }: { handle: RouteHandle }) {
  const t = useT()
  const user = useCurrentUser()
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 lg:gap-6">
        {/* Mobile: back button or wordmark */}
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:hidden">
          {handle.back ? (
            <>
              <Link to={handle.back} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-surface-muted" aria-label={t('nav.back')}>
                <ChevronLeft size={24} />
              </Link>
              <span className="truncate font-display text-lg">{handle.title}</span>
            </>
          ) : (
            <Wordmark />
          )}
        </div>
        <div className="hidden lg:block">
          <Wordmark />
        </div>
        <nav aria-label="เมนูหลัก" className="hidden flex-1 items-center gap-1 lg:flex">
          {desktopLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn('rounded-xl px-3 py-2 text-[15px] font-medium hover:bg-surface-muted', isActive ? 'bg-sunny-100 text-ink' : 'text-ink/80')
              }
            >
              {t(l.key)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <NavLink
            to="/studio"
            className={({ isActive }) =>
              cn(
                'hidden h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-medium lg:inline-flex',
                isActive ? 'bg-brown text-cream' : 'bg-sunny text-brown hover:bg-sunny-200',
              )
            }
          >
            <Palette size={18} aria-hidden />
            Nompong Studio
          </NavLink>
          <div className="hidden lg:block">
            <AccountMenu />
          </div>
          <div className="lg:hidden">
            {user ? (
              <Link to="/my" className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label={t('nav.account')}>
                <Avatar name={user.displayName} />
              </Link>
            ) : (
              <Link to="/login" className="inline-flex h-11 items-center rounded-xl px-3 text-[15px] font-medium hover:bg-surface-muted">
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/** Mobile: Home / Explore / Studio / My Nompong (spec §4). */
function MobileBottomNav() {
  const t = useT()
  const { pathname } = useLocation()
  const items = [
    { to: '/', label: t('nav.home'), icon: Home, active: pathname === '/' },
    {
      to: '/explore',
      label: t('nav.explore'),
      icon: Compass,
      active: ['/explore', '/stickers', '/wallpapers', '/about', '/shop', '/cards', '/ideas'].some((p) => pathname.startsWith(p)),
    },
    { to: '/studio', label: t('nav.studio'), icon: Palette, active: pathname.startsWith('/studio') },
    { to: '/my', label: t('nav.my'), icon: UserRound, active: pathname.startsWith('/my') || pathname === '/login' },
  ]
  return (
    <nav aria-label="เมนูด้านล่าง" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ to, label, icon: Icon, active }) => (
          <li key={to}>
            <Link
              to={to}
              aria-current={active ? 'page' : undefined}
              className={cn('flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium', active ? 'text-ink' : 'text-muted')}
            >
              <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-sunny')}>
                <Icon size={21} strokeWidth={active ? 2.4 : 2} aria-hidden />
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AppShell() {
  const t = useT()
  const handle = useHandle()
  return (
    <div className="app-shell flex flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-xl bg-brown px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('nav.skipToContent')}
      </a>
      <DevBanner />
      {FULL_APP ? <PublicHeader handle={handle} /> : <PortalHeader />}
      <main id="main" tabIndex={-1} className={cn('flex-1 focus:outline-none', !handle.hideBottomNav && 'pb-24 lg:pb-0')}>
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 py-8">
              <PageSkeleton />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      {!handle.hideBottomNav && <Footer />}
      {!handle.hideBottomNav && (FULL_APP ? <MobileBottomNav /> : <PortalBottomNav />)}
      <ScrollRestoration />
    </div>
  )
}

/** Standard page container. */
export function Page({ children, className, narrow }: { children: React.ReactNode; className?: string; narrow?: boolean }) {
  return <div className={cn('mx-auto w-full px-4 py-6 sm:py-8', narrow ? 'max-w-3xl' : 'max-w-6xl', className)}>{children}</div>
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-sm font-medium text-muted">{eyebrow}</div>}
        <h1 className="font-display text-2xl leading-tight font-medium text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
