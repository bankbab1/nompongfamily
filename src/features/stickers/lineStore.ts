import data from '@/data/line-stickers.json'

/**
 * Our real sticker sets on the LINE Store, read from the author page by
 * `scripts/sync-line-stickers.mjs` at build time (LINE can't be iframed or fetched from the browser).
 * Newest first, as the store lists them.
 */
export interface LineSet {
  id: string
  title: string
  /** Title without the "นมผง" prefix and the code, e.g. "บิงซูของน้อง". */
  name: string
  /** e.g. "v140", "A16", "G11". */
  code: string
  /** Code letter, upper case: "V", "A", "G"… */
  series: string
  url: string
  image: string
}

export const LINE_AUTHOR_URL: string = data.authorUrl
export const LINE_SYNCED_AT: string = data.syncedAt
export const LINE_SETS: LineSet[] = data.sets

/**
 * What each code letter means. The letter comes from the "(X12)" suffix of a set's title.
 * Listed in the order the tabs show them.
 */
export const VERSIONS: Record<string, { name: string; th: string; en: string }> = {
  V: { name: 'Daily', th: 'นมผงทุกวัน คุยได้ทุกเรื่อง', en: 'Everyday Nompong for every chat' },
  A: { name: 'Silent', th: 'ไม่ต้องพูด ท่าทางบอกหมด', en: 'No words, just acting' },
  G: { name: 'Meme', th: 'มุกฮา แคปชั่นโดน', en: 'Gags with captions that hit' },
  Z: { name: 'Global', th: 'นมผงพูดอังกฤษ', en: 'Nompong in English' },
  F: { name: 'Festive', th: 'ตามเทศกาล', en: 'For every festival' },
  M: { name: 'Special', th: 'ชุดพิเศษ ฉบับลิมิเต็ด', en: 'Special limited sets' },
}
const ORDER = Object.keys(VERSIONS)

/** Display name of a version letter; unknown letters fall back to the letter itself. */
export const versionName = (id: string) => VERSIONS[id]?.name ?? id

/** Version letters in tab order (known ones first, then any new letter LINE adds), with set counts. */
export const LINE_SERIES: { id: string; count: number }[] = Object.entries(
  LINE_SETS.reduce<Record<string, number>>((acc, s) => {
    const k = s.series || '?'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {}),
)
  .map(([id, count]) => ({ id, count }))
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.id)
    const ib = ORDER.indexOf(b.id)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || b.count - a.count
  })

/** The store link in the visitor's language. */
export const lineUrl = (url: string, locale: 'th' | 'en') => url.replace(/\/th$/, `/${locale}`)
