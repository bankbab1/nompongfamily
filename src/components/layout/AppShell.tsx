import { ChevronUp, Compass, Home, Palette, UserRound } from 'lucide-react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router'
import { PageSkeleton } from '@/components/feedback/States'
import { SlidingPill, useSlidingPill } from '@/components/ui/SlidingPill'
import { useLocale, useT, type Bilingual } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { AccountMenu } from './AccountMenu'
import { Footer } from './Footer'
import { LanguageSwitch, MobileSettings, ThemeSwitch } from './HeaderSwitches'
import { Wordmark } from './Wordmark'

/** Per-route layout hints, set via the route `handle`. */
export interface RouteHandle {
  /** Page name. The mobile header no longer shows it (it always shows the wordmark); kept as route metadata. */
  title?: Bilingual
  /** The page one level up. Not shown in the header any more; kept as route metadata. */
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
] as const

function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 lg:sticky border-b border-line/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 w-full items-center gap-2 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-10">
        {/* Mobile: always the wordmark. Moving between pages is the bottom nav's job (and the phone's own back gesture). */}
        <div className="flex min-w-0 flex-1 items-center lg:hidden">
          <Wordmark />
        </div>
        <div className="hidden justify-self-start lg:block">
          <Wordmark />
        </div>
        <DesktopNav />
        <div className="flex items-center gap-1 justify-self-end">
          {/* Desktop: language, theme, Studio and account. Phones: one settings button (account lives in the bottom nav). */}
          <div className="mr-1 hidden items-center gap-1 lg:flex">
            <LanguageSwitch />
            <ThemeSwitch />
          </div>
          <NavLink
            to="/suggest"
            className={({ isActive }) =>
              cn(
                'hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors lg:inline-flex',
                isActive ? 'brand-primary ring-2 ring-accent/30' : 'brand-primary',
              )
            }
          >
            <Palette size={16} aria-hidden />
            Nompong Studio
          </NavLink>
          <div className="hidden lg:block">
            <AccountMenu />
          </div>
          <div className="-mr-2 lg:hidden">
            <MobileSettings />
          </div>
        </div>
      </div>
    </header>
  )
}

/** Desktop menu: one soft pill slides to the current page instead of the highlight jumping. */
function DesktopNav() {
  const t = useT()
  const locale = useLocale()
  const { pathname } = useLocation()
  const ref = useRef<HTMLElement>(null)
  const { pill, ready } = useSlidingPill(ref, '[aria-current="page"]', [pathname, locale])
  return (
    <nav ref={ref} aria-label={t('nav.mainMenu')} className="relative hidden min-w-0 items-center gap-0.5 justify-self-center lg:flex">
      <SlidingPill
        pill={pill}
        ready={ready}
        className="rounded-full bg-[var(--nav-pill)] shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_0_0_1px_var(--nav-pill-edge)]"
      />
      {desktopLinks.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            cn(
              'relative rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors duration-200',
              // The selected item sits on the sliding pill; the others get a soft wash on hover.
              isActive ? 'font-semibold text-ink' : 'font-medium text-muted hover:bg-surface-muted hover:text-ink',
            )
          }
        >
          {t(l.key)}
        </NavLink>
      ))}
    </nav>
  )
}

const scrollTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })

/**
 * Back to top: fades in once you are well down a long page, and hides again near the very end,
 * where a page's own closing buttons sit, so it never covers them. Sits above the phone tab bar.
 */
function ScrollTopButton({ raised }: { raised: boolean }) {
  const t = useT()
  const { pathname } = useLocation()
  const [show, setShow] = useState(false)
  useEffect(() => {
    const check = () => {
      const fromEnd = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      setShow(window.scrollY > window.innerHeight * 1.2 && fromEnd > 160)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [pathname])
  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label={t('nav.backToTop')}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={cn(
        'fixed right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full brand-primary shadow-lg shadow-black/15 transition duration-300 active:scale-95 lg:right-6 lg:bottom-6',
        raised ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(1rem+env(safe-area-inset-bottom))]',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ChevronUp size={22} strokeWidth={2.5} aria-hidden />
    </button>
  )
}

/** Mobile: Home / Explore / Studio (design a sticker set) / My Nompong. Tapping the tab you are on scrolls to the top. */
function MobileBottomNav() {
  const t = useT()
  const { pathname } = useLocation()
  const items = [
    { to: '/', label: t('nav.home'), icon: Home, active: pathname === '/' },
    {
      to: '/explore',
      label: t('nav.explore'),
      icon: Compass,
      active: ['/explore', '/stickers', '/wallpapers', '/about', '/shop', '/cards'].some((p) => pathname.startsWith(p)),
    },
    // Studio = designing a sticker set (the builder).
    { to: '/suggest', label: t('nav.studio'), icon: Palette, active: pathname.startsWith('/suggest') || pathname.startsWith('/studio') },
    { to: '/my', label: t('nav.my'), icon: UserRound, active: pathname.startsWith('/my') || pathname === '/login' },
  ]
  return (
    <nav aria-label={t('nav.bottomMenu')} className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-background/85 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ to, label, icon: Icon, active }) => (
          <li key={to}>
            <Link
              to={to}
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                if (to === pathname) scrollTop()
              }}
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:scale-95',
                active ? 'text-ink' : 'text-muted',
              )}
            >
              <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-sunny-100 text-ink')}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
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
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRoute = useRef(true)
  // After a page change, focus moves to the new page instead of staying on the menu link that was
  // clicked: screen readers start at the new content, and Tab continues from there.
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false
      return
    }
    const a = document.activeElement
    if (!a || a === document.body || a.closest('header, nav')) mainRef.current?.focus({ preventScroll: true })
  }, [pathname])
  return (
    <div className="app-shell flex flex-col">
      <a href="#main" className="sr-only z-50 rounded-xl bg-brown px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        {t('nav.skipToContent')}
      </a>
      <PublicHeader />
      {/* Mobile header is fixed so browser-toolbar resizing cannot leave a sticky header clipped. */}
      <div className="h-16 shrink-0 lg:hidden" aria-hidden />
      <main ref={mainRef} id="main" tabIndex={-1} className={cn('flex-1 focus:outline-none', !handle.hideBottomNav && 'pb-24 lg:pb-0')}>
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 py-8">
              <PageSkeleton />
            </div>
          }
        >
          {/* Keyed by page, so each screen arrives with a soft fade and rise (skipped for reduced motion). */}
          <div key={pathname} className="motion-safe:animate-page">
            <Outlet />
          </div>
        </Suspense>
      </main>
      {!handle.hideBottomNav && <Footer />}
      {!handle.hideBottomNav && <MobileBottomNav />}
      <ScrollTopButton raised={!handle.hideBottomNav} />
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
        <h1 className="t-page font-display text-ink">{title}</h1>
        {description && <p className="t-lead mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
