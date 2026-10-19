/**
 * Development-only placeholder artwork. Deliberately NOT a character drawing: production
 * art must come from the approved Nompong master reference (spec §1, §5). Every image
 * is stamped "PLACEHOLDER" so mock data can never be mistaken for real artwork.
 */

const HUES = ['#F5D76E', '#F2B5A7', '#9DCFC9', '#F7C99B', '#C9D7A5', '#D9C2E8', '#A9CBE8', '#F3C4D6']

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function hueFor(n: number): string {
  return HUES[(n - 1 + HUES.length) % HUES.length]
}

function toDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Square sticker proof tile: position, caption and version are drawn in. */
export function stickerArt(opts: { position: number; caption: string; version?: number; hue?: string }): string {
  const { position, caption, version } = opts
  const hue = opts.hue ?? hueFor(position + (version ?? 1) - 1)
  const label = caption.length > 18 ? `${caption.slice(0, 17)}…` : caption
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 320" width="370" height="320">
<rect width="370" height="320" rx="28" fill="#FFF9EF"/>
<rect x="14" y="14" width="342" height="292" rx="22" fill="${hue}" opacity="0.55"/>
<circle cx="185" cy="138" r="70" fill="#FFF9EF" stroke="#514A43" stroke-width="5" stroke-dasharray="10 9"/>
<text x="185" y="160" text-anchor="middle" font-family="Mitr, sans-serif" font-size="58" font-weight="600" fill="#514A43">${String(position).padStart(2, '0')}</text>
<text x="185" y="252" text-anchor="middle" font-family="Mitr, 'Noto Sans Thai', sans-serif" font-size="30" font-weight="500" fill="#514A43">${esc(label)}</text>
<text x="30" y="44" font-family="sans-serif" font-size="15" font-weight="700" fill="#514A43" opacity="0.65">PLACEHOLDER</text>
${version ? `<text x="340" y="44" text-anchor="end" font-family="sans-serif" font-size="16" font-weight="700" fill="#514A43">v${version}</text>` : ''}
</svg>`
  return toDataUrl(svg)
}

/** Catalog cover placeholder. */
export function coverArt(opts: { code: string; title: string; hue: string }): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
<rect width="400" height="300" fill="${opts.hue}"/>
<circle cx="330" cy="60" r="90" fill="#FFF9EF" opacity="0.45"/>
<circle cx="70" cy="260" r="80" fill="#FFF9EF" opacity="0.35"/>
<rect x="120" y="70" width="160" height="140" rx="26" fill="#FFF9EF" stroke="#514A43" stroke-width="4" stroke-dasharray="9 8"/>
<text x="200" y="156" text-anchor="middle" font-family="Mitr, sans-serif" font-size="44" font-weight="600" fill="#514A43">${esc(opts.code)}</text>
<text x="200" y="258" text-anchor="middle" font-family="Mitr, 'Noto Sans Thai', sans-serif" font-size="24" font-weight="500" fill="#514A43">${esc(opts.title.length > 20 ? `${opts.title.slice(0, 19)}…` : opts.title)}</text>
<text x="18" y="30" font-family="sans-serif" font-size="13" font-weight="700" fill="#514A43" opacity="0.6">PLACEHOLDER</text>
</svg>`
  return toDataUrl(svg)
}

/** Wallpaper preview at a given aspect ratio (crop-safe zone outlined, spec §9.4). */
export function wallpaperArt(opts: { palette: [string, string, string]; width: number; height: number; title: string }): string {
  const { width: w, height: h, palette } = opts
  const r = Math.min(w, h)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
<rect width="${w}" height="${h}" fill="${palette[0]}"/>
<circle cx="${w * 0.8}" cy="${h * 0.2}" r="${r * 0.35}" fill="${palette[1]}"/>
<circle cx="${w * 0.15}" cy="${h * 0.85}" r="${r * 0.3}" fill="${palette[2]}"/>
<rect x="${w * 0.1}" y="${h * 0.18}" width="${w * 0.8}" height="${h * 0.64}" rx="${r * 0.04}" fill="none" stroke="#514A43" stroke-opacity="0.25" stroke-width="${r * 0.006}" stroke-dasharray="${r * 0.03} ${r * 0.02}"/>
<text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="Mitr, sans-serif" font-size="${r * 0.07}" font-weight="600" fill="#514A43">${esc(opts.title)}</text>
<text x="${w / 2}" y="${h / 2 + r * 0.07}" text-anchor="middle" font-family="sans-serif" font-size="${r * 0.03}" fill="#514A43" opacity="0.7">PLACEHOLDER · ${w}×${h}</text>
</svg>`
  return toDataUrl(svg)
}
