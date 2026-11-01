import { Moon, SlidersHorizontal, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SlidingPill, useSlidingPill } from '@/components/ui/SlidingPill'
import { Tooltip } from '@/components/ui/Tooltip'
import { useCopy } from '@/lib/copy'
import { setLocale, useLocale, useTx, type Locale } from '@/lib/i18n'
import { setTheme, useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils/cn'

/** TH / EN switch. The choice is remembered on this device. */
export function LanguageSwitch() {
  const c = useCopy()
  const locale = useLocale()
  const track = useRef<HTMLDivElement>(null)
  const { pill, ready } = useSlidingPill(track, '[aria-pressed="true"]', [locale])
  const options: { id: Locale; label: string; full: string }[] = [
    { id: 'th', label: 'TH', full: 'ภาษาไทย' },
    { id: 'en', label: 'EN', full: 'English' },
  ]
  return (
    <div ref={track} role="group" aria-label={c.nav.language} className="relative inline-flex h-9 items-center rounded-full bg-surface-muted p-0.5">
      {/* One pill slides between TH and EN. */}
      <SlidingPill pill={pill} ready={ready} className="rounded-full bg-surface shadow-sm" />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          lang={o.id}
          aria-pressed={locale === o.id}
          aria-label={o.full}
          onClick={() => setLocale(o.id)}
          className={cn(
            'relative h-full min-w-9 rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors duration-300',
            locale === o.id ? 'text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Compact one-button language toggle for narrow headers: shows the language you'd switch to. */
export function LanguageToggle() {
  const locale = useLocale()
  const next: Locale = locale === 'th' ? 'en' : 'th'
  return (
    <button
      type="button"
      lang={next}
      onClick={() => setLocale(next)}
      aria-label={next === 'en' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold tracking-wide text-ink hover:bg-line"
    >
      {next.toUpperCase()}
    </button>
  )
}

/** Light / dark switch. The choice is remembered; with no choice the device setting is used. */
export function ThemeSwitch() {
  const c = useCopy()
  const dark = useTheme() === 'dark'
  return (
    <Tooltip content={dark ? c.nav.toLight : c.nav.toDark}>
      <button
        type="button"
        onClick={() => setTheme(dark ? 'light' : 'dark')}
        aria-label={dark ? c.nav.toLight : c.nav.toDark}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-[color,background-color,transform] hover:bg-surface-muted hover:text-ink active:scale-90 pointer-coarse:h-10 pointer-coarse:w-10"
      >
        {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
      </button>
    </Tooltip>
  )
}

/**
 * Phones: one quiet button in the header instead of a row of switches. It opens a small panel
 * with language and light/dark. Closes on outside tap, Escape, or after a choice is made elsewhere.
 */
export function MobileSettings() {
  const tx = useTx()
  const locale = useLocale()
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const row = 'flex items-center justify-between gap-4 py-2'
  const seg = (on: boolean) =>
    cn('h-8 min-w-11 rounded-full px-3 text-xs font-semibold transition-colors', on ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={tx('ตั้งค่าการแสดงผล', 'Display settings')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full text-ink transition-[background-color,transform] active:scale-90',
          open ? 'bg-surface-muted' : 'hover:bg-surface-muted',
        )}
      >
        <SlidersHorizontal size={19} aria-hidden />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={tx('ตั้งค่าการแสดงผล', 'Display settings')}
          className="animate-toast-in absolute top-12 right-0 z-40 w-60 rounded-2xl border border-line bg-surface p-3 shadow-lg"
        >
          <div className={row}>
            <span className="text-sm">{tx('ภาษา', 'Language')}</span>
            <div className="inline-flex rounded-full bg-surface-muted p-0.5">
              {(['th', 'en'] as const).map((l) => (
                <button key={l} type="button" lang={l} aria-pressed={locale === l} onClick={() => setLocale(l)} className={seg(locale === l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className={row}>
            <span className="text-sm">{tx('ธีม', 'Theme')}</span>
            <div className="inline-flex rounded-full bg-surface-muted p-0.5">
              <button
                type="button"
                aria-pressed={theme !== 'dark'}
                aria-label={tx('สว่าง', 'Light')}
                onClick={() => setTheme('light')}
                className={seg(theme !== 'dark')}
              >
                <Sun size={15} className="mx-auto" aria-hidden />
              </button>
              <button
                type="button"
                aria-pressed={theme === 'dark'}
                aria-label={tx('มืด', 'Dark')}
                onClick={() => setTheme('dark')}
                className={seg(theme === 'dark')}
              >
                <Moon size={15} className="mx-auto" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
