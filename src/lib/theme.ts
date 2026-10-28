import { useSyncExternalStore } from 'react'

/**
 * Light / dark theme. The visitor's choice is saved; with no choice the site follows the
 * device setting. The resolved theme is written to <html data-theme="…">, which tokens.css
 * reads. index.html applies it before first paint so there is no flash.
 */
export type Theme = 'light' | 'dark'

const KEY = 'nompong.theme'
const listeners = new Set<() => void>()
const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : undefined

function saved(): Theme | undefined {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : undefined
  } catch {
    return undefined
  }
}

function resolve(): Theme {
  return saved() ?? (media?.matches ? 'dark' : 'light')
}

function apply() {
  const theme = resolve()
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1c1512' : '#fdf8f0')
  listeners.forEach((l) => l())
}

media?.addEventListener('change', () => {
  if (!saved()) apply()
})

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage blocked: still switch for this visit */
  }
  apply()
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
    () => 'light',
  )
}
