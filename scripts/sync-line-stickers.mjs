#!/usr/bin/env node
/*
 * Reads every sticker set on our LINE Store author page and saves the list to
 * src/data/line-stickers.json, which the "My stickers" page shows.
 *
 *   node scripts/sync-line-stickers.mjs
 *
 * Why a script and not a live embed: LINE sends X-Frame-Options: SAMEORIGIN (no iframes) and
 * no CORS headers (no fetch from the browser), so the list has to be read at build time.
 * If LINE is down or changes its layout, the script keeps the last saved file and exits 0,
 * so a deploy never breaks because of it.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AUTHOR_ID = '6750228'
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/line-stickers.json')
const MAX_PAGES = 30

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()

/** One store page → [{ id, title }]. Each item is a product link followed by its thumbnail's alt text. */
function parsePage(html) {
  const items = []
  const re = /href="\/stickershop\/product\/(\d+)\/[a-z]+"[\s\S]*?alt="([^"]*)"/g
  let m
  while ((m = re.exec(html))) items.push({ id: m[1], title: decode(m[2]) })
  return items
}

/** "นมผง บิงซูของน้อง (v140)" → { name: "บิงซูของน้อง", code: "v140", series: "V" } */
function split(title) {
  const code = title.match(/\(([A-Za-z]+\d+)\)\s*$/)?.[1] ?? ''
  const name = title
    .replace(/\s*\([A-Za-z]+\d+\)\s*$/, '')
    .replace(/^นมผง\s*/, '')
    .trim()
  const series = code.replace(/\d+$/, '').toUpperCase()
  return { name: name || title, code, series }
}

async function fetchPage(page) {
  const url = `https://store.line.me/stickershop/author/${AUTHOR_ID}/th?page=${page}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (nompongfamily sync)', 'Accept-Language': 'th' } })
  // Past the last page LINE answers 404: that just means "no more sets".
  if (res.status === 404 && page > 1) return ''
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.text()
}

/* ---------- Each set's stickers (for the in-app preview page) ---------- */

const DETAILS_OUT = resolve(dirname(OUT), 'line-sticker-details.json')
const CONCURRENCY = 4

/** LINE numbers a set's stickers one after another: store "first + count", or the full list if not. */
function compactIds(ids) {
  const run = ids.every((id, i) => id === ids[0] + i)
  return run ? { first: ids[0], count: ids.length } : { ids, count: ids.length }
}

/** One set page → its sticker ids, whether they move, price and description. */
function parseProduct(html) {
  const previews = [...html.matchAll(/data-preview='([^']*)'/g)].map((m) => {
    try {
      return JSON.parse(decode(m[1]))
    } catch {
      return null
    }
  })
  // The first preview is the set's cover; the stickers are the ones under /sticker/.
  const stickers = previews.filter((p) => p && /\/sticker\/\d+\//.test(p.staticUrl ?? ''))
  const text = (re) => decode((html.match(re)?.[1] ?? '').replace(/\s+/g, ' '))
  return {
    ...compactIds(stickers.map((p) => Number(p.id))),
    animated: stickers.some((p) => p.type && p.type !== 'static'),
    price: text(/data-test="sticker-price">([^<]*)</),
    desc: text(/<p class="mdCMN38Item01Txt">([\s\S]*?)<\/p>/),
  }
}

async function fetchDetails(id) {
  const res = await fetch(`https://store.line.me/stickershop/product/${id}/th`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (nompongfamily sync)', 'Accept-Language': 'th' },
  })
  if (!res.ok) throw new Error(`set ${id} → HTTP ${res.status}`)
  const d = parseProduct(await res.text())
  if (d.count === 0) throw new Error(`set ${id}: no stickers found`)
  return d
}

/** A published set never changes, so only sets we have not read yet are fetched. */
async function syncDetails(ids) {
  let details = {}
  try {
    details = JSON.parse(await readFile(DETAILS_OUT, 'utf8'))
  } catch {
    /* first run */
  }
  const todo = ids.filter((id) => !details[id])
  let failed = 0
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(batch.map(fetchDetails))
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') details[batch[j]] = r.value
      else {
        failed++
        console.warn(`LINE stickers: ${r.reason.message}`)
      }
    })
  }
  if (todo.length === 0) {
    console.log('LINE stickers: every set already has its stickers.')
    return
  }
  // Same order as the list, so diffs stay readable.
  const ordered = Object.fromEntries(ids.filter((id) => details[id]).map((id) => [id, details[id]]))
  await writeFile(DETAILS_OUT, JSON.stringify(ordered) + '\n')
  console.log(`LINE stickers: read ${todo.length - failed} new sets' stickers${failed ? `, ${failed} failed (retried next run)` : ''}.`)
}

async function main() {
  const seen = new Map()
  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = parsePage(await fetchPage(page))
    if (items.length === 0) break
    for (const it of items) if (!seen.has(it.id)) seen.set(it.id, it)
  }
  if (seen.size === 0) throw new Error('No sticker sets found — the LINE page layout may have changed.')

  // The store lists newest first; keep that order.
  const sets = [...seen.values()].map(({ id, title }) => ({
    id,
    title,
    ...split(title),
    url: `https://store.line.me/stickershop/product/${id}/th`,
    image: `https://stickershop.line-scdn.net/stickershop/v1/product/${id}/LINEStorePC/main.png`,
  }))

  const data = { authorUrl: `https://store.line.me/stickershop/author/${AUTHOR_ID}`, syncedAt: new Date().toISOString(), sets }
  await mkdir(dirname(OUT), { recursive: true })

  // Skip the write when nothing but the timestamp changed, so the file only shows up in git on real changes.
  let same = false
  try {
    same = JSON.stringify(JSON.parse(await readFile(OUT, 'utf8')).sets) === JSON.stringify(sets)
  } catch {
    /* first run */
  }
  if (same) console.log(`LINE stickers: ${sets.length} sets, no change.`)
  else {
    await writeFile(OUT, JSON.stringify(data, null, 2) + '\n')
    console.log(`LINE stickers: saved ${sets.length} sets to src/data/line-stickers.json`)
  }

  await syncDetails(sets.map((s) => s.id))
}

main().catch((err) => {
  console.warn(`LINE stickers: sync skipped, keeping the last saved list. (${err.message})`)
})
