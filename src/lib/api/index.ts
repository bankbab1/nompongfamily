import { mockApi } from './mock'
import type { Api } from './services'

/**
 * The single place the adapter is chosen. Only the mock exists today; when the backend
 * spec lands, add `httpApi` and select it here (e.g. by `import.meta.env.VITE_API_URL`).
 * Mock data must never ship in production flows (spec §11) — the banner in AppShell
 * makes the mock obvious while it is in use.
 */
export const api: Api = mockApi
export const USING_MOCK_API = true

export * from './errors'
export type * from './services'
export type * from './types'
