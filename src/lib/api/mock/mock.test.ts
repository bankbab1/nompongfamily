import { beforeEach, describe, expect, it } from 'vitest'
import { newDraft, setCount, submittedItems, updateItem } from '@/features/studio/model/draft'
import { ApiError } from '../errors'
import { resetMockDb, setDevSettings } from './db'
import { mockApi as api } from './index'

async function asUser(id: string) {
  await api.auth.signInAs(id)
}

function completeDraft() {
  const d = newDraft('community', 'u_ploy')
  let data = setCount(d.data, 8)
  data = { ...data, setName: '  ทดสอบระบบ  ' }
  for (let i = 1; i <= 8; i++) data = updateItem(data, i, { caption: i === 1 ? 'ง่วงงงงง' : `ข้อความ ${i}`, pose: `ท่า ${i}` })
  return { ...d, data }
}

describe('mock adapter contract', () => {
  beforeEach(async () => {
    localStorage.clear()
    resetMockDb()
    await api.auth.signOut()
  })

  it('requires sign-in for customer endpoints', async () => {
    await expect(api.requests.getMyRequests()).rejects.toMatchObject({ code: 'unauthorized' })
  })

  it('createDraft is idempotent per clientDraftId', async () => {
    await asUser('u_ploy')
    const d = completeDraft()
    const a = await api.requests.createDraft({ clientDraftId: d.clientDraftId, ...d.data })
    const b = await api.requests.createDraft({ clientDraftId: d.clientDraftId, ...d.data })
    expect(b.id).toBe(a.id)
    const mine = await api.requests.getMyRequests()
    expect(mine.filter((r) => r.clientDraftId === d.clientDraftId)).toHaveLength(1)
  })

  it('rejects stale versions with a conflict carrying the server copy', async () => {
    await asUser('u_ploy')
    const d = completeDraft()
    const created = await api.requests.createDraft({ clientDraftId: d.clientDraftId, ...d.data })
    await api.requests.updateDraft(created.id, { setName: 'v2' }, created.version)
    const err = await api.requests.updateDraft(created.id, { setName: 'stale' }, created.version).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('conflict')
    expect(err.detail.setName).toBe('v2')
  })

  it('submits once (idempotent), trims to the visible count, keeps Thai captions exact', async () => {
    await asUser('u_ploy')
    const d = completeDraft()
    const created = await api.requests.createDraft({ clientDraftId: d.clientDraftId, ...d.data })
    const s1 = await api.requests.submitRequest(created.id, { termsVersion: 't' })
    const s2 = await api.requests.submitRequest(created.id, { termsVersion: 't' })
    expect(s1.status).toBe('submitted')
    expect(s2.version).toBe(s1.version)
    expect(s1.items).toHaveLength(8)
    expect(s1.setName).toBe('ทดสอบระบบ')
    expect(s1.items[0].caption).toBe(submittedItems(d.data)[0].caption)
    expect(s1.termsAcceptedAt).toBeTruthy()
    // Locked after submission
    await expect(api.requests.updateDraft(s1.id, { setName: 'x' }, s1.version)).rejects.toMatchObject({ code: 'invalid_state' })
  })

  it('refuses to submit an incomplete brief', async () => {
    await asUser('u_ploy')
    const d = completeDraft()
    const data = updateItem(d.data, 4, { pose: '' })
    const created = await api.requests.createDraft({ clientDraftId: d.clientDraftId, ...data })
    await expect(api.requests.submitRequest(created.id, { termsVersion: 't' })).rejects.toMatchObject({ code: 'validation' })
  })

  it('hides other customers requests and admin endpoints', async () => {
    await asUser('u_ploy')
    await expect(api.requests.getRequest('NP-26-0101')).rejects.toMatchObject({ code: 'not_found' })
    await expect(api.admin.listRequests()).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('publishing a community request assigns the next CR code, never V/M', async () => {
    await asUser('u_admin')
    let r = await api.admin.getRequest('NP-26-0103') // under_review community
    r = await api.admin.transition(r.id, 'accepted', { version: r.version })
    r = await api.admin.transition(r.id, 'in_production', { version: r.version })
    r = await api.admin.transition(r.id, 'line_submitted', { version: r.version })
    await expect(api.admin.transition(r.id, 'published', { version: r.version, storeUrl: 'https://example.com' })).rejects.toMatchObject({ code: 'validation' })
    r = await api.admin.transition(r.id, 'published', { version: r.version, storeUrl: 'https://store.line.me/stickershop/product/1/th' })
    expect(r.catalogCode).toBe('CR2')
    const sets = await api.catalog.listSets({ series: 'CR' })
    expect(sets.map((s) => s.code).sort()).toEqual(['CR1', 'CR2'])
  })

  it('never lists draft catalog sets publicly', async () => {
    const all = await api.catalog.listSets()
    expect(all.some((s) => s.status === 'draft')).toBe(false)
    await expect(api.catalog.getSet('v8')).rejects.toMatchObject({ code: 'not_found' })
  })

  it('fails with a network error while simulated offline', async () => {
    await asUser('u_ploy')
    setDevSettings({ offline: true })
    await expect(api.requests.getMyRequests()).rejects.toMatchObject({ code: 'network' })
    setDevSettings({ offline: false })
    await expect(api.requests.getMyRequests()).resolves.toBeTruthy()
  })
})
