import { createStore, del, entries, get, set } from 'idb-keyval'
import type { LocalDraft } from '@/features/studio/model/draft'

/**
 * Device-local draft store (spec §6.5): IndexedDB survives refresh, app restart and
 * offline periods. Falls back to an in-memory map where IndexedDB is unavailable
 * (some private modes / in-app browsers) so editing still works for the session.
 */

let store: ReturnType<typeof createStore> | null = null
const memory = new Map<string, LocalDraft>()
let idbBroken = false

function idb() {
  if (idbBroken || typeof indexedDB === 'undefined') return null
  store ??= createStore('nompong-studio', 'drafts')
  return store
}

async function guard<T>(op: (s: ReturnType<typeof createStore>) => Promise<T>, fallback: () => T): Promise<T> {
  const s = idb()
  if (!s) return fallback()
  try {
    return await op(s)
  } catch {
    idbBroken = true
    return fallback()
  }
}

export const localDrafts = {
  get(clientDraftId: string): Promise<LocalDraft | undefined> {
    return guard(
      (s) => get<LocalDraft>(clientDraftId, s),
      () => memory.get(clientDraftId),
    )
  },

  put(draft: LocalDraft): Promise<void> {
    memory.set(draft.clientDraftId, draft)
    return guard(
      (s) => set(draft.clientDraftId, draft, s),
      () => undefined,
    )
  },

  remove(clientDraftId: string): Promise<void> {
    memory.delete(clientDraftId)
    return guard(
      (s) => del(clientDraftId, s),
      () => undefined,
    )
  },

  async list(): Promise<LocalDraft[]> {
    const all = await guard(
      async (s) => (await entries<string, LocalDraft>(s)).map(([, v]) => v),
      () => [...memory.values()],
    )
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  /** Drafts visible to this viewer: their own, plus guest drafts on this device. */
  async listFor(userId: string | null): Promise<LocalDraft[]> {
    return (await this.list()).filter((d) => d.ownerId === null || d.ownerId === userId)
  },

  findByServerId: async (serverId: string) => (await localDrafts.list()).find((d) => d.serverId === serverId),

  /** Guest drafts become the signed-in user's (so they can sync and submit). */
  async adoptGuestDrafts(userId: string): Promise<number> {
    const guests = (await this.list()).filter((d) => d.ownerId === null)
    await Promise.all(guests.map((d) => this.put({ ...d, ownerId: userId, dirty: true })))
    return guests.length
  },

  /** Shared-device policy (spec §6.5): on sign-out the user chooses to wipe their drafts. */
  async removeOwnedBy(userId: string): Promise<void> {
    const mine = (await this.list()).filter((d) => d.ownerId === userId)
    await Promise.all(mine.map((d) => this.remove(d.clientDraftId)))
  },

  async unsyncedCount(userId: string): Promise<number> {
    return (await this.list()).filter((d) => d.ownerId === userId && d.dirty).length
  },
}
