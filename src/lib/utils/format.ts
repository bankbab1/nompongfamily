import { getLocale, type Locale } from '@/lib/i18n'

/* Dates follow the chosen language: Thai (Buddhist-era years) or English (en-GB). */
const TAG: Record<Locale, string> = { th: 'th-TH', en: 'en-GB' }
const cache = new Map<string, Intl.DateTimeFormat | Intl.RelativeTimeFormat>()
const dateFmt = () => {
  const k = 'd' + getLocale()
  if (!cache.has(k)) cache.set(k, new Intl.DateTimeFormat(TAG[getLocale()], { day: 'numeric', month: 'short', year: 'numeric' }))
  return cache.get(k) as Intl.DateTimeFormat
}
const dateTimeFmt = () => {
  const k = 't' + getLocale()
  if (!cache.has(k))
    cache.set(k, new Intl.DateTimeFormat(TAG[getLocale()], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
  return cache.get(k) as Intl.DateTimeFormat
}
const relFmt = () => {
  const k = 'r' + getLocale()
  if (!cache.has(k)) cache.set(k, new Intl.RelativeTimeFormat(TAG[getLocale()], { numeric: 'auto' }))
  return cache.get(k) as Intl.RelativeTimeFormat
}

export const formatDate = (iso?: string) => (iso ? dateFmt().format(new Date(iso)) : '—')
export const formatDateTime = (iso?: string) => (iso ? dateTimeFmt().format(new Date(iso)) : '—')

export function formatRelative(iso: string, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return relFmt().format(Math.round(diff), 'second')
  if (abs < 3600) return relFmt().format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return relFmt().format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return relFmt().format(Math.round(diff / 86400), 'day')
  return formatDate(iso)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
