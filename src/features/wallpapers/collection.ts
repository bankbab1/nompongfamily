import type { Wallpaper } from '@/lib/api/types'
import collection from './collection.json'

/** Published artwork is versioned with the app, independent of any saved mock database. */
export const WALLPAPER_COLLECTION = collection as Wallpaper[]
export const wallpaperAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`
