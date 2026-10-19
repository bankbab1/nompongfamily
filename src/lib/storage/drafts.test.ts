import { beforeEach, describe, expect, it } from 'vitest'
import { newDraft } from '@/features/studio/model/draft'
import { localDrafts } from './drafts'

describe('local draft store (IndexedDB)', () => {
  beforeEach(async () => {
    for (const d of await localDrafts.list()) await localDrafts.remove(d.clientDraftId)
  })

  it('round-trips a draft with exact Thai content', async () => {
    const d = newDraft('community', null)
    d.data.items[0].caption = 'ง่วงงงงง'
    await localDrafts.put(d)
    const back = await localDrafts.get(d.clientDraftId)
    expect(back?.data.items[0].caption).toBe('ง่วงงงงง')
  })

  it('guest drafts are adopted on sign-in and removed on sign-out when chosen', async () => {
    const guest = newDraft('community', null)
    const other = newDraft('community', 'u_other')
    await localDrafts.put(guest)
    await localDrafts.put(other)
    expect(await localDrafts.adoptGuestDrafts('u_me')).toBe(1)
    expect((await localDrafts.listFor('u_me')).map((d) => d.clientDraftId)).toEqual([guest.clientDraftId])
    expect(await localDrafts.unsyncedCount('u_me')).toBe(1)
    await localDrafts.removeOwnedBy('u_me')
    expect(await localDrafts.listFor('u_me')).toEqual([])
    expect(await localDrafts.get(other.clientDraftId)).toBeTruthy()
  })
})
