import {
  NOTE_LIMIT,
  STICKER_COUNTS,
  suggestionInputSchema,
  type MoodId,
  type StickerCount,
  type IdeaStatus,
  type IdeaStatusUpdate,
  type StickerIdea,
  type Suggestion,
  type SuggestionInput,
} from './model'

/**
 * Where suggestions are kept. Pages only talk to this interface, so moving to Supabase
 * later means writing one new adapter and swapping `suggestions` at the bottom of this file.
 */
export interface SuggestionsService {
  list(): Promise<Suggestion[]>
  create(input: SuggestionInput): Promise<Suggestion>
  /** Adds or removes this visitor's "me too" on a suggestion. */
  toggleVote(id: string): Promise<Suggestion>
  /** Admin: move an idea to a new status, with an optional note to the fan. */
  setStatus(id: string, update: IdeaStatusUpdate): Promise<Suggestion>
}

interface StoredSuggestion {
  id: string
  stickerCount: StickerCount
  mood: MoodId
  nameTh: string
  nameEn: string
  descTh: string
  descEn: string
  stickers: StickerIdea[]
  nickname: string
  createdAt: string
  baseVotes: number
  isExample?: boolean
  /** Missing on ideas saved before statuses existed: they read as pending. */
  status?: IdeaStatus
  statusNote?: string
  statusAt?: string
  lineSetId?: string
}

interface StoredState {
  items: StoredSuggestion[]
  myVotes: string[]
  mine: string[]
}

export const STORAGE_KEY = 'nompong.suggestions.v2'
/** The first, simpler format (name + a few phrases). Read once and converted. */
export const LEGACY_KEY = 'nompong.suggestions.v1'

const st = (word: string, style: string): StickerIdea => ({ word, style })

const EXAMPLES: StoredSuggestion[] = [
  {
    id: 'ex-work',
    stickerCount: 8,
    mood: 'work',
    nameTh: 'นมผงวัยทำงาน',
    nameEn: 'Nompong at Work',
    descTh: 'สติกเกอร์ตอบหัวหน้าและเพื่อนร่วมงานแบบสุภาพแต่น่ารัก',
    descEn: 'Polite but adorable replies for your boss and teammates.',
    stickers: [
      st('รับทราบครับ', 'นมผงตะเบ๊ะ ยิ้มตาปิด'),
      st('กำลังทำอยู่น้า', 'นมผงพิมพ์คอมรัวๆ มีเหงื่อหยดเล็กๆ'),
      st('ขอบคุณมากๆ', 'นมผงยกมือไหว้ มีหัวใจลอย'),
      st('ประชุมแป๊บ', 'นมผงถือแฟ้ม เดินรีบๆ'),
      st('เสร็จแล้ว!', 'นมผงชูสองแขน มีประกายรอบตัว'),
      st('ขอเวลาอีกนิด', 'นมผงทำหน้าอ้อน ยกนิ้วชี้หนึ่งนิ้ว'),
      st('เลิกงาน!', 'นมผงสะพายกระเป๋าวิ่งออกจากออฟฟิศ'),
      st('สู้ๆ นะ', 'นมผงกำหมัด ผูกผ้าคาดหัว'),
    ],
    nickname: 'มินท์',
    createdAt: '2026-10-20T09:00:00.000Z',
    baseVotes: 24,
    isExample: true,
    status: 'selected',
    statusNote: 'ทีมชอบชุดนี้มาก จะเริ่มร่างภาพเร็วๆ นี้นะคับ',
    statusAt: '2026-10-28T09:00:00.000Z',
  },
  {
    id: 'ex-sleepy',
    stickerCount: 8,
    mood: 'cute',
    nameTh: 'นมผงง่วงนอน',
    nameEn: 'Sleepy Nompong',
    descTh: 'นมผงนอนกลิ้งไปมา เหมาะกับคนชอบนอนแบบเรา',
    descEn: 'Nompong rolling around in bed — for everyone who loves a nap.',
    stickers: [
      st('ฝันดีนะ', 'นมผงนอนหลับ มีพระจันทร์และดาว'),
      st('ขออีก 5 นาที', 'นมผงซุกผ้าห่ม ยื่นอุ้งเท้าออกมา'),
      st('ง่วงงง', 'นมผงหาวปากกว้าง น้ำตาซึม'),
      st('ตื่นแล้วว', 'นมผงขนฟูกระเซิง บิดขี้เกียจ'),
      st('', 'นมผงนอนเอกเขนก มี Zzz ลอย'),
      st('งีบแป๊บ', 'นมผงกอดหมอนรูปกระดูก'),
      st('', ''),
      st('', ''),
    ],
    nickname: '',
    createdAt: '2026-10-22T13:30:00.000Z',
    baseVotes: 18,
    isExample: true,
  },
  {
    id: 'ex-festival',
    stickerCount: 16,
    mood: 'festival',
    nameTh: 'นมผงฉลองทั้งปี',
    nameEn: 'Nompong Holidays',
    descTh: 'อวยพรทุกเทศกาล ปีใหม่ สงกรานต์ ลอยกระทง วันเกิด',
    descEn: 'Greetings for every holiday: New Year, Songkran, Loy Krathong and birthdays.',
    stickers: [
      st('สวัสดีปีใหม่', 'นมผงใส่หมวกปาร์ตี้ เป่าแตร'),
      st('สุขสันต์วันเกิด', 'นมผงถือเค้กมีเทียน'),
      st('สงกรานต์นี้ฉ่ำๆ', 'นมผงถือปืนฉีดน้ำ ใส่เสื้อลายดอก'),
      st('ลอยกระทงกัน', 'นมผงนั่งข้างกระทงใบตอง'),
      ...Array.from({ length: 12 }, () => st('', '')),
    ],
    nickname: 'ปอนด์',
    createdAt: '2026-10-25T18:10:00.000Z',
    baseVotes: 11,
    isExample: true,
    status: 'drawing',
    statusAt: '2026-10-30T09:00:00.000Z',
  },
]

const emptyState = (): StoredState => ({ items: EXAMPLES, myVotes: [], mine: [] })

interface LegacySuggestion {
  id: string
  title: string
  mood: MoodId
  description?: string
  captions?: string[]
  nickname?: string
  createdAt: string
  baseVotes?: number
  isExample?: boolean
}

/** Converts ideas saved in the first format; their old examples are replaced by the new ones. */
function fromLegacy(raw: string): StoredState | undefined {
  try {
    const old = JSON.parse(raw) as { items?: LegacySuggestion[]; myVotes?: string[]; mine?: string[] }
    const own = (old.items ?? []).filter((s) => !s.isExample)
    const items: StoredSuggestion[] = own.map((s) => {
      const captions = s.captions ?? []
      const count = STICKER_COUNTS.find((n) => n >= captions.length) ?? 40
      return {
        id: s.id,
        stickerCount: count,
        mood: s.mood,
        nameTh: s.title,
        nameEn: '',
        descTh: s.description ?? '',
        descEn: '',
        stickers: Array.from({ length: count }, (_, i) => st(captions[i] ?? '', '')),
        nickname: s.nickname ?? '',
        createdAt: s.createdAt,
        baseVotes: s.baseVotes ?? 0,
      }
    })
    const ids = new Set(items.map((s) => s.id))
    return {
      items: [...items, ...EXAMPLES],
      myVotes: (old.myVotes ?? []).filter((v) => ids.has(v)),
      mine: (old.mine ?? []).filter((v) => ids.has(v)),
    }
  } catch {
    return undefined
  }
}

function readState(storage: Storage | undefined): StoredState {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>
      // Saved copies of the built-in examples are refreshed from code, so example changes reach everyone,
      // but a status the admin has set (it has a statusAt) is kept.
      const items = (parsed.items ?? EXAMPLES).map((it) => {
        const fresh = it.isExample ? EXAMPLES.find((e) => e.id === it.id) : undefined
        if (!fresh) return it
        const adminSet = it.statusAt && it.statusAt !== fresh.statusAt
        return adminSet ? { ...fresh, status: it.status, statusNote: it.statusNote, statusAt: it.statusAt, lineSetId: it.lineSetId } : fresh
      })
      return { items, myVotes: parsed.myVotes ?? [], mine: parsed.mine ?? [] }
    }
    const legacy = storage?.getItem(LEGACY_KEY)
    if (legacy) {
      const migrated = fromLegacy(legacy)
      if (migrated) {
        writeState(storage, migrated)
        storage?.removeItem(LEGACY_KEY)
        return migrated
      }
    }
  } catch {
    /* corrupted or blocked storage: fall through to the examples */
  }
  return emptyState()
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
  const { baseVotes, isExample, status, statusNote, ...rest } = s
  return {
    ...rest,
    status: status ?? 'pending',
    statusNote: statusNote ?? '',
    votes: baseVotes + (votedByMe ? 1 : 0),
    votedByMe,
    mine: state.mine.includes(s.id),
    isExample: !!isExample,
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
      const clean = suggestionInputSchema.parse({ ...input, stickers: input.stickers.slice(0, input.stickerCount) })
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
      if (!item) throw new Error('Suggestion not found')
      const myVotes = state.myVotes.includes(id) ? state.myVotes.filter((v) => v !== id) : [...state.myVotes, id]
      const next = { ...state, myVotes }
      writeState(storage, next)
      return toSuggestion(item, next)
    },
    async setStatus(id, update) {
      const state = readState(storage)
      const item = state.items.find((s) => s.id === id)
      if (!item) throw new Error('Suggestion not found')
      const changed: StoredSuggestion = {
        ...item,
        status: update.status,
        statusNote: update.note.trim().slice(0, NOTE_LIMIT),
        statusAt: now().toISOString(),
        // Only a published idea points at a LINE set.
        lineSetId: update.status === 'published' ? update.lineSetId || undefined : undefined,
      }
      const next = { ...state, items: state.items.map((s) => (s.id === id ? changed : s)) }
      writeState(storage, next)
      return toSuggestion(changed, next)
    },
  }
}

/** True while suggestions are only saved on the visitor's device. */
export const SUGGESTIONS_ON_DEVICE_ONLY = true

export const suggestions: SuggestionsService = createLocalSuggestions()
