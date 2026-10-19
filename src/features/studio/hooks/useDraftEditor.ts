import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SaveState } from '@/components/feedback/States'
import { api } from '@/lib/api'
import { ApiError, isApiError } from '@/lib/api/errors'
import { qk } from '@/lib/api/queryKeys'
import type { StickerRequest, User } from '@/lib/api/types'
import { localDrafts } from '@/lib/storage/drafts'
import { fromServer, type DraftData, type LocalDraft } from '../model/draft'

const LOCAL_DEBOUNCE = 400
const SERVER_DEBOUNCE = 1200

export interface Conflict {
  local: LocalDraft
  server: StickerRequest
}

/**
 * Draft persistence pipeline (spec §6.5):
 *   1. every edit updates React state immediately;
 *   2. debounced write to IndexedDB (survives refresh / offline);
 *   3. signed-in users: debounced sync to the server with optimistic versioning.
 * The local copy carries `dirty` until the server accepts it, so nothing is lost if the
 * network drops; reconnecting resumes the sync automatically.
 */
export function useDraftEditor(initial: LocalDraft, user: User | null) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState<LocalDraft>(initial)
  const [saveState, setSaveState] = useState<SaveState>(initial.dirty ? 'idle' : 'saved')
  const [conflict, setConflict] = useState<Conflict | null>(null)

  const latest = useRef(draft)
  latest.current = draft
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const serverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncing = useRef<Promise<LocalDraft | null> | null>(null)
  const userRef = useRef(user)
  userRef.current = user

  const writeLocal = useCallback(async (d: LocalDraft) => {
    await localDrafts.put(d)
  }, [])

  /** Push the latest local copy to the server. Resolves with the synced draft, or null on failure. */
  const syncNow = useCallback(async (): Promise<LocalDraft | null> => {
    const u = userRef.current
    if (!u) {
      setSaveState('local')
      return latest.current
    }
    if (syncing.current) await syncing.current.catch(() => null)
    const run = (async () => {
      const d = latest.current
      if (!d.dirty && d.serverId) {
        setSaveState('saved')
        return d
      }
      setSaveState('saving')
      try {
        let saved: StickerRequest
        if (!d.serverId) {
          // Idempotent by clientDraftId — a retried create never duplicates (spec §6.5).
          saved = await api.requests.createDraft({ clientDraftId: d.clientDraftId, ...d.data })
          if (saved.version !== 1 || saved.status !== 'draft') {
            // The create had already landed earlier; push current content as an update.
            saved = await api.requests.updateDraft(saved.id, d.data, saved.version)
          }
        } else {
          saved = await api.requests.updateDraft(d.serverId, d.data, d.serverVersion ?? 0)
        }
        const stillSame = latest.current.updatedAt === d.updatedAt
        const next: LocalDraft = {
          ...latest.current,
          ownerId: u.id,
          serverId: saved.id,
          serverVersion: saved.version,
          dirty: !stillSame,
        }
        latest.current = next
        setDraft(next)
        await writeLocal(next)
        qc.invalidateQueries({ queryKey: qk.myRequests })
        setSaveState(stillSame ? 'saved' : 'saving')
        return next
      } catch (e) {
        if (isApiError(e, 'network')) setSaveState('offline')
        else if (isApiError(e, 'conflict')) {
          setConflict({ local: latest.current, server: (e as ApiError<StickerRequest>).detail! })
          setSaveState('conflict')
        } else setSaveState('error')
        return null
      }
    })()
    syncing.current = run
    const res = await run
    syncing.current = null
    // Edits that arrived during the round trip get their own sync.
    if (res && latest.current.dirty) scheduleServer()
    return res
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, writeLocal])

  const scheduleServer = useCallback(() => {
    if (serverTimer.current) clearTimeout(serverTimer.current)
    serverTimer.current = setTimeout(() => void syncNow(), SERVER_DEBOUNCE)
  }, [syncNow])

  /** Apply an edit. `meta` changes (step/active slot) persist locally but don't dirty the server copy. */
  const update = useCallback(
    (fn: (d: DraftData) => DraftData, opts: { meta?: Partial<Pick<LocalDraft, 'step' | 'activeSlot'>> } = {}) => {
      setDraft((prev) => {
        const data = fn(prev.data)
        const changed = data !== prev.data
        const next: LocalDraft = {
          ...prev,
          ...opts.meta,
          data,
          dirty: prev.dirty || changed,
          updatedAt: changed ? new Date().toISOString() : prev.updatedAt,
        }
        latest.current = next
        return next
      })
      setSaveState((s) => (s === 'conflict' ? s : 'saving'))
      if (localTimer.current) clearTimeout(localTimer.current)
      localTimer.current = setTimeout(async () => {
        await writeLocal(latest.current)
        if (!userRef.current) setSaveState('local')
        else if (latest.current.dirty) scheduleServer()
        else setSaveState('saved')
      }, LOCAL_DEBOUNCE)
    },
    [writeLocal, scheduleServer],
  )

  const setMeta = useCallback((meta: Partial<Pick<LocalDraft, 'step' | 'activeSlot'>>) => {
    setDraft((prev) => {
      const next = { ...prev, ...meta }
      latest.current = next
      void localDrafts.put(next)
      return next
    })
  }, [])

  /** Flush pending writes immediately (before submit, on page hide). */
  const flush = useCallback(async () => {
    if (localTimer.current) clearTimeout(localTimer.current)
    if (serverTimer.current) clearTimeout(serverTimer.current)
    await writeLocal(latest.current)
    return syncNow()
  }, [writeLocal, syncNow])

  const resolveConflict = useCallback(
    async (keep: 'local' | 'server') => {
      if (!conflict) return
      const u = userRef.current!
      if (keep === 'server') {
        const next = { ...fromServer(conflict.server, u.id), step: latest.current.step, activeSlot: latest.current.activeSlot }
        latest.current = next
        setDraft(next)
        await writeLocal(next)
        setConflict(null)
        setSaveState('saved')
      } else {
        // Re-base this device's content on the server's latest version, then push it.
        const next = { ...latest.current, serverVersion: conflict.server.version, dirty: true }
        latest.current = next
        setDraft(next)
        setConflict(null)
        await writeLocal(next)
        await syncNow()
      }
    },
    [conflict, writeLocal, syncNow],
  )

  // Initial: persist the draft locally and attempt a sync if it carries unsynced edits.
  useEffect(() => {
    void writeLocal(latest.current)
    if (latest.current.dirty) {
      if (userRef.current) void syncNow()
      else setSaveState('local')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reconnect → resume sync. Page hidden → flush (tab backgrounding on mobile).
  useEffect(() => {
    const onOnline = () => latest.current.dirty && void syncNow()
    const onOffline = () => latest.current.dirty && setSaveState('offline')
    const onHide = () => {
      if (document.visibilityState === 'hidden') void writeLocal(latest.current)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [syncNow, writeLocal])

  // Best-effort unload protection while a write is pending (spec §6.5).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (localTimer.current || saveState === 'saving') {
        void writeLocal(latest.current)
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saveState, writeLocal])

  useEffect(
    () => () => {
      if (localTimer.current) clearTimeout(localTimer.current)
      if (serverTimer.current) clearTimeout(serverTimer.current)
      void localDrafts.put(latest.current)
    },
    [],
  )

  return { draft, update, setMeta, saveState, retry: syncNow, flush, conflict, resolveConflict }
}
