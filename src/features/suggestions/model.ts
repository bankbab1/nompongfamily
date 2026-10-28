import { z } from 'zod'
import { textLength } from '@/lib/validation/brief'

/** Sticker collection suggestions from visitors. */

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

export const LIMITS = { title: 40, description: 300, caption: 20, captions: 8, nickname: 30 } as const

/** Validation messages are codes; pages turn them into Thai or English text. */
export type SuggestionErrorCode =
  | 'titleRequired'
  | 'titleTooLong'
  | 'descriptionTooLong'
  | 'captionTooLong'
  | 'tooManyCaptions'
  | 'duplicateCaption'
  | 'nicknameTooLong'

/** The number each error message mentions. */
export const ERROR_LIMIT: Record<SuggestionErrorCode, number> = {
  titleRequired: LIMITS.title,
  titleTooLong: LIMITS.title,
  descriptionTooLong: LIMITS.description,
  captionTooLong: LIMITS.caption,
  tooManyCaptions: LIMITS.captions,
  duplicateCaption: LIMITS.captions,
  nicknameTooLong: LIMITS.nickname,
}

const maxText = (max: number, code: SuggestionErrorCode) => z.string().refine((v) => textLength(v) <= max, code)

export const suggestionInputSchema = z.object({
  title: maxText(LIMITS.title, 'titleTooLong').refine((v) => v.trim().length > 0, 'titleRequired'),
  mood: z.enum(MOODS.map((m) => m.id) as [MoodId, ...MoodId[]]),
  description: maxText(LIMITS.description, 'descriptionTooLong'),
  captions: z.array(maxText(LIMITS.caption, 'captionTooLong')).max(LIMITS.captions, 'tooManyCaptions'),
  nickname: maxText(LIMITS.nickname, 'nicknameTooLong'),
})

export type SuggestionInput = z.infer<typeof suggestionInputSchema>

export interface Suggestion {
  id: string
  title: string
  mood: MoodId
  description: string
  captions: string[]
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

export type SuggestionSort = 'popular' | 'newest'

export function sortSuggestions(items: Suggestion[], sort: SuggestionSort): Suggestion[] {
  return [...items].sort((a, b) =>
    sort === 'popular' ? b.votes - a.votes || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt),
  )
}

export type SuggestionErrors = Partial<Record<keyof SuggestionInput, SuggestionErrorCode>>

/** Field errors keyed by field name. */
export function validateSuggestion(input: SuggestionInput): SuggestionErrors {
  const r = suggestionInputSchema.safeParse(input)
  if (r.success) return {}
  const out: SuggestionErrors = {}
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof SuggestionInput
    out[key] ??= issue.message as SuggestionErrorCode
  }
  return out
}
