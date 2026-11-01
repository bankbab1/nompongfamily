import { z } from 'zod'
import type { Locale } from '@/lib/i18n'
import { textLength } from '@/lib/validation/brief'

/** A visitor's LINE sticker set idea for Nompong. */

/** LINE sticker sets come in these sizes. */
export const STICKER_COUNTS = [8, 16, 24, 32, 40] as const
export type StickerCount = (typeof STICKER_COUNTS)[number]
export const MAX_STICKERS = 40

export const MOODS = [
  { id: 'cute', emoji: '🥰' },
  { id: 'funny', emoji: '😆' },
  { id: 'daily', emoji: '☀️' },
  { id: 'work', emoji: '💼' },
  { id: 'love', emoji: '💕' },
  { id: 'family', emoji: '🏡' },
  { id: 'festival', emoji: '🎉' },
  { id: 'other', emoji: '✨' },
] as const

export type MoodId = (typeof MOODS)[number]['id']
export const moodEmoji = (id: MoodId) => MOODS.find((m) => m.id === id)?.emoji ?? '✨'

/**
 * Name and description limits follow the LINE Creators Market store listing
 * (title up to 40, description up to 160 characters per language). Re-check before release.
 */
export const LIMITS = { name: 40, desc: 160, word: 20, style: 200, nickname: 30 } as const

export interface StickerIdea {
  /** Text drawn on the sticker. */
  word: string
  /** Nompong's pose, expression and style for this sticker. */
  style: string
  /** "No idea for this one": the creator picks the word and pose. Word and style are ignored. */
  creatorPicks?: boolean
}

export const emptySticker = (): StickerIdea => ({ word: '', style: '' })
/** Something to send for this sticker: the visitor's own idea, or a hand-off to the creator. */
export const isFilled = (s: StickerIdea) => !!s.creatorPicks || s.word.trim().length > 0 || s.style.trim().length > 0
/** The visitor wrote this one themselves. */
export const isOwnIdea = (s: StickerIdea) => !s.creatorPicks && (s.word.trim().length > 0 || s.style.trim().length > 0)

/** Validation messages are codes; pages turn them into Thai or English text. */
export type SuggestionErrorCode = 'nameRequired' | 'nameTooLong' | 'descTooLong' | 'wordTooLong' | 'styleTooLong' | 'stickerRequired' | 'nicknameTooLong'

/** The number each error message mentions. */
export const ERROR_LIMIT: Record<SuggestionErrorCode, number> = {
  nameRequired: LIMITS.name,
  nameTooLong: LIMITS.name,
  descTooLong: LIMITS.desc,
  wordTooLong: LIMITS.word,
  styleTooLong: LIMITS.style,
  stickerRequired: 1,
  nicknameTooLong: LIMITS.nickname,
}

const maxText = (max: number, code: SuggestionErrorCode) => z.string().refine((v) => textLength(v) <= max, code)
const blank = (v: string) => v.trim().length === 0

export const suggestionInputSchema = z
  .object({
    stickerCount: z.union(STICKER_COUNTS.map((n) => z.literal(n)) as [z.ZodLiteral<8>, ...z.ZodLiteral<StickerCount>[]]),
    mood: z.enum(MOODS.map((m) => m.id) as [MoodId, ...MoodId[]]),
    nameTh: maxText(LIMITS.name, 'nameTooLong'),
    nameEn: maxText(LIMITS.name, 'nameTooLong'),
    descTh: maxText(LIMITS.desc, 'descTooLong'),
    descEn: maxText(LIMITS.desc, 'descTooLong'),
    stickers: z
      .array(
        z.object({
          word: maxText(LIMITS.word, 'wordTooLong'),
          style: maxText(LIMITS.style, 'styleTooLong'),
          creatorPicks: z.boolean().optional(),
        }),
      )
      .max(MAX_STICKERS),
    nickname: maxText(LIMITS.nickname, 'nicknameTooLong'),
  })
  .refine((v) => !blank(v.nameTh) || !blank(v.nameEn), { message: 'nameRequired', path: ['nameTh'] })
  // A sticker counts once it has an idea or is handed to the creator.
  .refine((v) => v.stickers.some(isFilled), { message: 'stickerRequired', path: ['stickers'] })

export type SuggestionInput = z.infer<typeof suggestionInputSchema>

export interface Suggestion extends Omit<SuggestionInput, 'nickname'> {
  id: string
  /** Empty when the visitor stayed anonymous. */
  nickname: string
  createdAt: string
  votes: number
  votedByMe: boolean
  /** Sent from this device. */
  mine: boolean
  /** Starter ideas shown so the wall is never empty. */
  isExample: boolean
}

/** Name / description in the visitor's language, falling back to the other one. */
export function localName(s: Pick<Suggestion, 'nameTh' | 'nameEn'>, locale: Locale) {
  const [first, second] = locale === 'en' ? [s.nameEn, s.nameTh] : [s.nameTh, s.nameEn]
  return { main: first.trim() || second.trim(), alt: first.trim() && second.trim() ? second.trim() : '' }
}

export function localDesc(s: Pick<Suggestion, 'descTh' | 'descEn'>, locale: Locale) {
  const [first, second] = locale === 'en' ? [s.descEn, s.descTh] : [s.descTh, s.descEn]
  return first.trim() || second.trim()
}

export type SuggestionSort = 'popular' | 'newest'

export function sortSuggestions(items: Suggestion[], sort: SuggestionSort): Suggestion[] {
  return [...items].sort((a, b) => (sort === 'popular' ? b.votes - a.votes || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt)))
}

type FieldKey = 'nameTh' | 'nameEn' | 'descTh' | 'descEn' | 'nickname' | 'stickers'

export interface SuggestionErrors {
  fields: Partial<Record<FieldKey, SuggestionErrorCode>>
  /** Per-sticker problems, by index (0-based). */
  stickers: Record<number, { word?: SuggestionErrorCode; style?: SuggestionErrorCode }>
}

export const hasErrors = (e: SuggestionErrors) => Object.keys(e.fields).length > 0 || Object.keys(e.stickers).length > 0

export function validateSuggestion(input: SuggestionInput): SuggestionErrors {
  const out: SuggestionErrors = { fields: {}, stickers: {} }
  const r = suggestionInputSchema.safeParse(input)
  if (r.success) return out
  for (const issue of r.error.issues) {
    const code = issue.message as SuggestionErrorCode
    const [key, index, part] = issue.path as [string, number?, string?]
    if (key === 'stickers' && typeof index === 'number' && (part === 'word' || part === 'style')) {
      out.stickers[index] = { ...out.stickers[index], [part]: code }
    } else {
      out.fields[key as FieldKey] ??= code
    }
  }
  return out
}
