import { useSyncExternalStore } from 'react'
import en from '@/locales/en.json'
import th from '@/locales/th.json'

/**
 * Thai-first localisation (spec §4). `th.json` is the source of truth and defines the
 * key type; `en.json` may be partial and falls back to Thai per key. Long-form page
 * copy (About, FAQ, policies) is still inline Thai — extract it when English launches.
 */
export type Locale = 'th' | 'en'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type MessageKey = Leaves<typeof th>

const dictionaries: Record<Locale, unknown> = { th, en }

const LOCALE_KEY = 'nompong.locale'

/** Saved choice first, then the browser language; Thai is the default. */
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'th' || saved === 'en') return saved
  } catch {
    /* storage blocked */
  }
  if (typeof navigator !== 'undefined' && navigator.language && !navigator.language.toLowerCase().startsWith('th')) return 'en'
  return 'th'
}

let current: Locale = typeof window === 'undefined' ? 'th' : initialLocale()
if (typeof document !== 'undefined') document.documentElement.lang = current
const listeners = new Set<() => void>()

export function setLocale(locale: Locale) {
  current = locale
  document.documentElement.lang = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    /* storage blocked: still switch for this visit */
  }
  listeners.forEach((l) => l())
}

export const getLocale = () => current

/** The active locale; re-renders the caller when it changes. */
export function useLocale(): Locale {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in node) node = (node as Record<string, unknown>)[part]
    else return undefined
  }
  return typeof node === 'string' ? node : undefined
}

export function t(key: MessageKey, vars?: Record<string, string | number>, locale: Locale = current): string {
  const raw = lookup(dictionaries[locale], key) ?? lookup(th, key) ?? key
  return vars ? raw.replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v] ?? `{${v}}`)) : raw
}

/** Re-renders the caller when the locale changes. */
export function useT() {
  const locale = useLocale()
  return (key: MessageKey, vars?: Record<string, string | number>) => t(key, vars, locale)
}
