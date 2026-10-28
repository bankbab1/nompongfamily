import { suggestionInputSchema, type MoodId, type Suggestion, type SuggestionInput } from './model'

/**
 * Where suggestions are kept. Pages only talk to this interface, so moving to Supabase
 * later means writing one new adapter and swapping `suggestions` at the bottom of this file.
 */
export interface SuggestionsService {
  list(): Promise<Suggestion[]>
  create(input: SuggestionInput): Promise<Suggestion>
  /** Adds or removes this visitor's "me too" on a suggestion. */
  toggleVote(id: string): Promise<Suggestion>
}

interface StoredSuggestion {
  id: string
  title: string
  mood: MoodId
  description: string
  captions: string[]
  nickname: string
  createdAt: string
  baseVotes: number
  isExample?: boolean
}

interface StoredState {
  items: StoredSuggestion[]
  myVotes: string[]
  mine: string[]
}

export const STORAGE_KEY = 'nompong.suggestions.v1'

const EXAMPLES: StoredSuggestion[] = [
  {
    id: 'ex-1',
    title: 'นมผงวัยทำงาน',
    mood: 'work',
    description: 'สติกเกอร์ไว้ตอบหัวหน้าและเพื่อนร่วมงานแบบสุภาพแต่น่ารัก',
    captions: ['รับทราบครับ', 'กำลังทำอยู่น้า', 'ขอบคุณมากๆ', 'ประชุมแป๊บ'],
    nickname: 'มินท์',
    createdAt: '2026-10-20T09:00:00.000Z',
    baseVotes: 24,
    isExample: true,
  },
  {
    id: 'ex-2',
    title: 'นมผงง่วงนอน',
    mood: 'cute',
    description: 'นมผงนอนกลิ้งไปมา เหมาะกับคนชอบนอนแบบเรา',
    captions: ['ฝันดีนะ', 'ขออีก 5 นาที', 'ง่วงงง', 'ตื่นแล้วว'],
    nickname: '',
    createdAt: '2026-10-22T13:30:00.000Z',
    baseVotes: 18,
    isExample: true,
  },
  {
    id: 'ex-3',
    title: 'นมผงฉลองปีใหม่',
    mood: 'festival',
    description: 'ใส่หมวกปาร์ตี้ อวยพรปีใหม่ สงกรานต์ ลอยกระทง',
    captions: ['สวัสดีปีใหม่', 'สุขสันต์วันเกิด', 'โชคดีมีชัย'],
    nickname: 'ปอนด์',
    createdAt: '2026-10-25T18:10:00.000Z',
    baseVotes: 11,
    isExample: true,
  },
]

const emptyState = (): StoredState => ({ items: EXAMPLES, myVotes: [], mine: [] })

function readState(storage: Storage | undefined): StoredState {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<StoredState>
    return { items: parsed.items ?? EXAMPLES, myVotes: parsed.myVotes ?? [], mine: parsed.mine ?? [] }
  } catch {
    return emptyState()
  }
}

function writeState(storage: Storage | undefined, state: StoredState) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* Private mode or full storage: keep working for this visit. */
  }
}

function toSuggestion(s: StoredSuggestion, state: StoredState): Suggestion {
  const votedByMe = state.myVotes.includes(s.id)
  return {
    id: s.id,
    title: s.title,
    mood: s.mood,
    description: s.description,
    captions: s.captions,
    nickname: s.nickname,
    createdAt: s.createdAt,
    votes: s.baseVotes + (votedByMe ? 1 : 0),
    votedByMe,
    mine: state.mine.includes(s.id),
    isExample: !!s.isExample,
  }
}

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** Keeps suggestions in this browser only. A stand-in until the shared database is chosen. */
export function createLocalSuggestions(storage: Storage | undefined = globalThis.localStorage, now = () => new Date()): SuggestionsService {
  return {
    async list() {
      const state = readState(storage)
      return state.items.map((s) => toSuggestion(s, state))
    },
    async create(input) {
      const clean = suggestionInputSchema.parse({
        ...input,
        captions: input.captions.filter((c) => c.trim().length > 0),
      })
      const state = readState(storage)
      const item: StoredSuggestion = { ...clean, id: newId(), createdAt: now().toISOString(), baseVotes: 0 }
      // A visitor automatically supports their own idea.
      const next: StoredState = { items: [item, ...state.items], myVotes: [...state.myVotes, item.id], mine: [...state.mine, item.id] }
      writeState(storage, next)
      return toSuggestion(item, next)
    },
    async toggleVote(id) {
      const state = readState(storage)
      const item = state.items.find((s) => s.id === id)
      if (!item) throw new Error('ไม่พบไอเดียนี้แล้ว')
      const myVotes = state.myVotes.includes(id) ? state.myVotes.filter((v) => v !== id) : [...state.myVotes, id]
      const next = { ...state, myVotes }
      writeState(storage, next)
      return toSuggestion(item, next)
    },
  }
}

/** True while suggestions are only saved on the visitor's device. */
export const SUGGESTIONS_ON_DEVICE_ONLY = true

export const suggestions: SuggestionsService = createLocalSuggestions()
