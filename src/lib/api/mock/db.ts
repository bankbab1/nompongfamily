import { ApiError } from '../errors'
import { createSeed, type MockDb } from './seed'

/**
 * The "server" for the mock adapter. State lives in localStorage so it survives reloads
 * (acting like a remote backend), completely separate from the device draft store in
 * IndexedDB — that separation is what lets offline/conflict paths be exercised.
 */

const DB_KEY = 'nompong-mock-db-v7' // v7: English set descriptions, wallpaper themes and sizes
const DEV_KEY = 'nompong-dev'

export interface DevSettings {
  /** Simulate the backend being unreachable. */
  offline: boolean
  latencyMs: number
}

const isTest = import.meta.env.MODE === 'test'

export function getDevSettings(): DevSettings {
  try {
    const raw = localStorage.getItem(DEV_KEY)
    if (raw) return { offline: false, latencyMs: isTest ? 0 : 350, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { offline: false, latencyMs: isTest ? 0 : 350 }
}

const devListeners = new Set<() => void>()
export function setDevSettings(patch: Partial<DevSettings>) {
  localStorage.setItem(DEV_KEY, JSON.stringify({ ...getDevSettings(), ...patch }))
  devListeners.forEach((l) => l())
  // Mirror the browser's own event so sync code reacts identically to a real outage.
  window.dispatchEvent(new Event(patch.offline ? 'offline' : 'online'))
}
export function onDevSettings(cb: () => void) {
  devListeners.add(cb)
  return () => devListeners.delete(cb)
}

let cache: MockDb | null = null

export function db(): MockDb {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb
      if (parsed.schema === 1) return (cache = parsed)
    }
  } catch {
    /* corrupt → reseed */
  }
  cache = createSeed()
  persist()
  return cache
}

export function persist() {
  if (!cache) return
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache))
  } catch {
    /* quota: keep in memory */
  }
}

export function resetMockDb() {
  cache = createSeed()
  persist()
}

export function isReachable(): boolean {
  const online = typeof navigator === 'undefined' || navigator.onLine !== false
  return online && !getDevSettings().offline
}

/** Simulated round trip: latency, then fail with `network` when unreachable. */
export async function roundTrip(): Promise<void> {
  const { latencyMs } = getDevSettings()
  if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs * (0.7 + Math.random() * 0.6)))
  if (!isReachable()) throw new ApiError('network', 'Network unavailable')
}

/** Deep copy so callers can never mutate "server" state by reference. */
export const clone = <T>(v: T): T => structuredClone(v)
