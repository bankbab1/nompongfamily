import { expect, it } from 'vitest'
import { WALLPAPER_COLLECTION } from './collection'
import { mockApi } from '@/lib/api/mock'
import { db } from '@/lib/api/mock/db'

it('publishes the complete Sunny Garden collection with four designs and sixteen downloads', () => {
  const garden = WALLPAPER_COLLECTION.filter(w => w.theme.startsWith('W3 ·'))
  expect(garden.map(w => w.slug)).toEqual([
    'w3-daisy-peek', 'w3-butterfly-hello', 'w3-strawberry-picnic', 'w3-watering-day',
  ])
  expect(garden.flatMap(w => w.variants)).toHaveLength(16)
})

it('serves published wallpapers even when an existing browser has stale mock catalog data', async () => {
  const previous = db().wallpapers
  db().wallpapers = []
  try {
    const items = await mockApi.catalog.listWallpapers()
    expect(items).toHaveLength(WALLPAPER_COLLECTION.length)
    for (const w of WALLPAPER_COLLECTION) {
      expect((await mockApi.catalog.getWallpaper(w.slug)).variants).toHaveLength(4)
      expect(w.variants.map(v => v.device)).toEqual(['mobile', 'tablet', 'tablet', 'desktop'])
      expect(w.variants.every(v => v.assetPath && v.sizeKb > 0)).toBe(true)
    }
  } finally { db().wallpapers = previous }
})
