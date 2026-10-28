import { beforeEach, describe, expect, it } from 'vitest'
import { sortSuggestions, validateSuggestion, type SuggestionInput } from './model'
import { createLocalSuggestions, STORAGE_KEY } from './store'

const input = (over: Partial<SuggestionInput> = {}): SuggestionInput => ({
  title: 'นมผงไปทะเล',
  mood: 'cute',
  description: '',
  captions: ['ไปเที่ยวกัน', ''],
  nickname: '',
  ...over,
})

describe('local suggestions', () => {
  beforeEach(() => localStorage.clear())

  it('starts with example ideas', async () => {
    const list = await createLocalSuggestions(localStorage).list()
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((s) => s.isExample)).toBe(true)
  })

  it('saves a new idea, drops empty captions, and counts the sender as a supporter', async () => {
    const svc = createLocalSuggestions(localStorage)
    const created = await svc.create(input())
    expect(created.captions).toEqual(['ไปเที่ยวกัน'])
    expect(created.mine).toBe(true)
    expect(created.votes).toBe(1)
    expect(created.votedByMe).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toContain('นมผงไปทะเล')
    const again = await createLocalSuggestions(localStorage).list()
    expect(again[0].id).toBe(created.id)
  })

  it('toggles a vote on and off', async () => {
    const svc = createLocalSuggestions(localStorage)
    const [first] = await svc.list()
    const on = await svc.toggleVote(first.id)
    expect(on.votes).toBe(first.votes + 1)
    const off = await svc.toggleVote(first.id)
    expect(off.votes).toBe(first.votes)
  })

  it('survives corrupted storage', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const list = await createLocalSuggestions(localStorage).list()
    expect(list.length).toBeGreaterThan(0)
  })

  it('rejects an untitled idea', async () => {
    await expect(createLocalSuggestions(localStorage).create(input({ title: '   ' }))).rejects.toThrow()
  })
})

describe('validation and sorting', () => {
  it('counts Thai grapheme clusters, not code units', () => {
    // 20 Thai characters with tone marks still fit the 20-character caption limit.
    expect(validateSuggestion(input({ captions: ['น้ำ'.repeat(10)] })).captions).toBeUndefined()
    expect(validateSuggestion(input({ captions: ['ก'.repeat(21)] })).captions).toBe('captionTooLong')
    expect(validateSuggestion(input({ title: ' ' })).title).toBe('titleRequired')
  })

  it('sorts by votes or by date', () => {
    const a = { id: 'a', votes: 1, createdAt: '2026-01-02' }
    const b = { id: 'b', votes: 5, createdAt: '2026-01-01' }
    const items = [a, b] as never[]
    expect(sortSuggestions(items, 'popular').map((s: { id: string }) => s.id)).toEqual(['b', 'a'])
    expect(sortSuggestions(items, 'newest').map((s: { id: string }) => s.id)).toEqual(['a', 'b'])
  })
})
