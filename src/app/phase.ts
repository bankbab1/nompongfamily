/**
 * Phase switch for the portal.
 *
 * Phase 1 (default) shows only the Nompong introduction and the sticker suggestion wall.
 * The older Studio / admin / shop / wallpaper features stay in the codebase and come back
 * when the site is built with `VITE_FULL_APP=true` (e.g. `VITE_FULL_APP=true npm run dev`).
 */
export const FULL_APP = import.meta.env.VITE_FULL_APP === 'true'
