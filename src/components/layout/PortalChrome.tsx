import { ChevronLeft, Heart, Home, Lightbulb, Moon, Sun } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router'
import { useCopy } from '@/features/portal/copy'
import { setLocale, useLocale, type Locale } from '@/lib/i18n'
import { setTheme, useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils/cn'
import { Wordmark } from './Wordmark'

/** Phase-1 header, bottom tabs and footer (Home, Nompong, suggestions). */

function LanguageSwitch() {
  const c = useCopy()
  const locale = useLocale()
  const options: { id: Locale; label: string; full: string }[] = [
    { id: 'th', label: 'TH', full: 'ภาษาไทย' },
    { id: 'en', label: 'EN', full: 'English' },
  ]
  return (
    <div role="group" aria-label={c.nav.language} className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          lang={o.id}
          aria-pressed={locale === o.id}
          aria-label={o.full}
          onClick={() => setLocale(o.id)}
          className={cn(
            'h-full min-w-10 rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors',
            locale === o.id ? 'bg-brown text-cream' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ThemeSwitch() {
  const c = useCopy()
  const theme = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? c.nav.toLight : c.nav.toDark}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:bg-surface-muted"
    >
      {dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  )
}

export function PortalHeader() {
  const c = useCopy()
  const { pathname } = useLocation()
  const subpage = pathname.startsWith('/nompong') ? c.nav.nompong : pathname.startsWith('/suggest') ? c.nav.suggest : undefined
  const links = [
    { to: '/', label: c.nav.home, end: true },
    { to: '/nompong', label: c.nav.nompong, end: false },
  ]
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-md supports-[backdrop-filter]:bg-cream/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 lg:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:hidden">
          {subpage ? (
            <>
              <Link to="/" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-surface-muted" aria-label={c.nav.back}>
                <ChevronLeft size={24} />
              </Link>
              <span className="truncate font-display text-lg">{subpage}</span>
            </>
          ) : (
            <Wordmark />
          )}
        </div>
        <div className="hidden lg:block">
          <Wordmark />
        </div>
        <nav aria-label={c.nav.menu} className="hidden flex-1 items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => cn('rounded-full px-4 py-2 text-[15px] font-medium hover:bg-surface-muted', isActive ? 'bg-sunny-100 text-ink' : 'text-ink/80')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitch />
          <ThemeSwitch />
          <NavLink
            to="/suggest"
            className={({ isActive }) =>
              cn(
                'ml-1 hidden h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium shadow-sm lg:inline-flex',
                isActive ? 'bg-sunny text-ink' : 'bg-brown text-cream hover:bg-brown-800',
              )
            }
          >
            <Lightbulb size={18} aria-hidden />
            {c.nav.suggest}
          </NavLink>
        </div>
      </div>
    </header>
  )
}

export function PortalBottomNav() {
  const c = useCopy()
  const { pathname } = useLocation()
  const items = [
    { to: '/', label: c.nav.home, icon: Home, active: pathname === '/' },
    { to: '/nompong', label: c.nav.nompongShort, icon: Heart, active: pathname.startsWith('/nompong') },
    { to: '/suggest', label: c.nav.suggestShort, icon: Lightbulb, active: pathname.startsWith('/suggest') },
  ]
  return (
    <nav aria-label={c.nav.bottomMenu} className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-3">
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

export function PortalFooter() {
  const c = useCopy()
  const links = [
    ['/', c.nav.home],
    ['/nompong', c.nav.nompong],
    ['/suggest', c.nav.suggest],
  ] as const
  return (
    <footer className="mt-16 border-t border-line bg-surface-muted/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted">{c.footer.blurb}</p>
        </div>
        <nav aria-label={c.footer.links}>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {links.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="inline-flex min-h-10 items-center text-sm text-muted hover:text-ink hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted">© {new Date().getFullYear()} nompong family</div>
    </footer>
  )
}
