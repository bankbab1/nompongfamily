import { beforeEach, describe, expect, it } from 'vitest'
import { localName, sortSuggestions, validateSuggestion, type StickerIdea, type SuggestionInput } from './model'
import { createLocalSuggestions, LEGACY_KEY, STORAGE_KEY } from './store'

const blankStickers = (n: number): StickerIdea[] => Array.from({ length: n }, () => ({ word: '', style: '' }))

const input = (over: Partial<SuggestionInput> = {}): SuggestionInput => {
  const stickers = blankStickers(40)
  stickers[0] = { word: 'ไปเที่ยวกัน', style: 'นมผงใส่แว่นกันแดด ถือห่วงยาง' }
  return {
    stickerCount: 8,
    mood: 'cute',
    nameTh: 'นมผงไปทะเล',
    nameEn: 'Nompong at the Beach',
    descTh: '',
    descEn: '',
    stickers,
    nickname: '',
    ...over,
  }
}

describe('local suggestions', () => {
  beforeEach(() => localStorage.clear())

  it('starts with example sets', async () => {
    const list = await createLocalSuggestions(localStorage).list()
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((s) => s.isExample && s.stickers.length === s.stickerCount)).toBe(true)
  })

  it('saves a set, keeps only the chosen number of stickers, and counts the sender as a supporter', async () => {
    const svc = createLocalSuggestions(localStorage)
    const created = await svc.create(input())
    expect(created.stickers).toHaveLength(8)
    expect(created.stickers[0].word).toBe('ไปเที่ยวกัน')
    expect(created.mine).toBe(true)
    expect(created.votes).toBe(1)
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Nompong at the Beach')
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

  it('converts ideas saved in the old format and keeps their votes', async () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        items: [
          { id: 'mine-1', title: 'นมผงไปตลาด', mood: 'daily', description: 'ซื้อของ', captions: ['ซื้ออะไรดี', 'แพงจัง'], nickname: 'บี', createdAt: '2026-10-28T00:00:00Z', baseVotes: 0 },
          { id: 'ex-1', title: 'old example', mood: 'work', captions: [], createdAt: '2026-10-01T00:00:00Z', baseVotes: 5, isExample: true },
        ],
        myVotes: ['mine-1', 'ex-1'],
        mine: ['mine-1'],
      }),
    )
    const list = await createLocalSuggestions(localStorage).list()
    const mine = list.find((s) => s.id === 'mine-1')!
    expect(mine.nameTh).toBe('นมผงไปตลาด')
    expect(mine.stickerCount).toBe(8)
    expect(mine.stickers.slice(0, 2).map((s) => s.word)).toEqual(['ซื้ออะไรดี', 'แพงจัง'])
    expect(mine.votedByMe).toBe(true)
    expect(list.some((s) => s.id === 'ex-1')).toBe(false)
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('survives corrupted storage', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const list = await createLocalSuggestions(localStorage).list()
    expect(list.length).toBeGreaterThan(0)
  })

  it('rejects a set with no name', async () => {
    await expect(createLocalSuggestions(localStorage).create(input({ nameTh: ' ', nameEn: '' }))).rejects.toThrow()
  })
})

describe('validation', () => {
  it('needs a name in at least one language', () => {
    expect(validateSuggestion(input({ nameTh: '', nameEn: 'Beach' })).fields.nameTh).toBeUndefined()
    expect(validateSuggestion(input({ nameTh: '', nameEn: '' })).fields.nameTh).toBe('nameRequired')
  })

  it('needs at least one sticker with a word or a style', () => {
    expect(validateSuggestion(input({ stickers: blankStickers(8) })).fields.stickers).toBe('stickerRequired')
  })

  it('reports which sticker is too long', () => {
    const stickers = blankStickers(8)
    stickers[3] = { word: 'ก'.repeat(21), style: '' }
    expect(validateSuggestion(input({ stickers })).stickers[3]?.word).toBe('wordTooLong')
  })

  it('counts Thai grapheme clusters, not code units', () => {
    const stickers = blankStickers(8)
    stickers[0] = { word: 'น้ำ'.repeat(10), style: '' }
    expect(validateSuggestion(input({ stickers })).stickers[0]).toBeUndefined()
  })

  it('uses LINE store limits for names and descriptions', () => {
    expect(validateSuggestion(input({ nameEn: 'x'.repeat(41) })).fields.nameEn).toBe('nameTooLong')
    expect(validateSuggestion(input({ descTh: 'ก'.repeat(161) })).fields.descTh).toBe('descTooLong')
  })
})

describe('display helpers', () => {
  it('shows the name in the visitor language, falling back to the other', () => {
    expect(localName({ nameTh: 'นมผง', nameEn: 'Nompong' }, 'en')).toEqual({ main: 'Nompong', alt: 'นมผง' })
    expect(localName({ nameTh: 'นมผง', nameEn: '' }, 'en')).toEqual({ main: 'นมผง', alt: '' })
  })

  it('sorts by votes or by date', () => {
    const a = { id: 'a', votes: 1, createdAt: '2026-01-02' }
    const b = { id: 'b', votes: 5, createdAt: '2026-01-01' }
    const items = [a, b] as never[]
    expect(sortSuggestions(items, 'popular').map((s: { id: string }) => s.id)).toEqual(['b', 'a'])
    expect(sortSuggestions(items, 'newest').map((s: { id: string }) => s.id)).toEqual(['a', 'b'])
  })
})
