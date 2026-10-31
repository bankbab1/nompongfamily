import { Moon, Sun } from 'lucide-react'
import { useRef } from 'react'
import { SlidingPill, useSlidingPill } from '@/components/ui/SlidingPill'
import { Tooltip } from '@/components/ui/Tooltip'
import { useCopy } from '@/lib/copy'
import { setLocale, useLocale, type Locale } from '@/lib/i18n'
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
