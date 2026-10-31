import { z } from 'zod'
import { STICKER_COUNTS, type StickerBriefItem, type StickerCount } from '@/lib/api/types'
import { getLocale } from '@/lib/i18n'

/**
 * Brief field rules (spec §6.3). Limits are product defaults, NOT claims about LINE's
 * current technical limits — final export must validate current LINE requirements.
 *
 * Thai orthography (FE-03): captions are validated but never transformed. No trim, no
 * Unicode normalisation, no collapsing of intentionally repeated characters. Only the
 * set name is trimmed (spec: "trim whitespace").
 */
export const LIMITS = {
  setName: 100,
  theme: 500,
  caption: 120,
  pose: 1000,
  clothingProps: 500,
  colorNotes: 300,
  notes: 2000,
  referenceFiles: 10,
  referenceFileBytes: 5 * 1024 * 1024,
} as const

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const TERMS_VERSION = '2026-10-01'

/** Grapheme-aware length so Thai combining marks (่ ้ ๊ ๋ ั ิ ี …) don't count as extra characters. */
export function textLength(value: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    let n = 0
    for (const _ of new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(value)) n++
    return n
  }
  return [...value].length
}

const blank = (s: string | undefined) => !s || s.trim().length === 0

/** 13–19 digits, optionally grouped — looks like a payment card. Never accepted (spec §7). */

const maxLen = (max: number, label: string) => z.string().refine((v) => textLength(v) <= max, { message: `${label}ยาวเกิน ${max} ตัวอักษร` })

export const itemSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1),
  caption: maxLen(LIMITS.caption, 'ข้อความ').refine((v) => !blank(v), { message: 'กรุณาใส่ข้อความบนสติกเกอร์' }),
  pose: maxLen(LIMITS.pose, 'ท่าทาง').refine((v) => !blank(v), { message: 'กรุณาอธิบายท่าทาง/อารมณ์' }),
  clothingProps: maxLen(LIMITS.clothingProps, 'เครื่องแต่งกาย').optional(),
  colorNotes: maxLen(LIMITS.colorNotes, 'โน้ตสี').optional(),
  referenceAssetIds: z.array(z.string()).optional(),
})

export const setInfoSchema = z.object({
  channel: z.enum(['community', 'commission'], { message: 'กรุณาเลือกประเภทคำขอ' }),
  setName: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, 'กรุณาตั้งชื่อชุดสติกเกอร์')
        .refine((v) => textLength(v) <= LIMITS.setName, `ชื่อชุดยาวเกิน ${LIMITS.setName} ตัวอักษร`),
    ),
  stickerCount: z.union(STICKER_COUNTS.map((n) => z.literal(n)) as [z.ZodLiteral<8>, ...z.ZodLiteral<StickerCount>[]], {
    message: 'จำนวนต้องเป็น 8, 16, 24, 32 หรือ 40',
  }),
  language: z.literal('th'),
  theme: maxLen(LIMITS.theme, 'ธีม').optional(),
  notes: maxLen(LIMITS.notes, 'โน้ต').optional(),
})

export type SlotStatus = 'empty' | 'partial' | 'complete'

export function slotStatus(item: Pick<StickerBriefItem, 'caption' | 'pose'>): SlotStatus {
  const c = !blank(item.caption)
  const p = !blank(item.pose)
  if (c && p) return 'complete'
  if (c || p) return 'partial'
  return 'empty'
}

export interface BriefIssue {
  /** 'set' issues belong to step 2; numbers are slot positions (1-based). */
  scope: 'set' | 'terms' | number
  field: string
  message: string
}

export interface BriefInput {
  channel?: string
  setName: string
  stickerCount: number
  language: string
  theme?: string
  notes?: string
  items: StickerBriefItem[]
}

/* Messages are written in Thai (the source language) and translated when English is chosen. */
const MESSAGE_EN: Record<string, string> = {
  กรุณาใส่ข้อความบนสติกเกอร์: 'Please add the word on the sticker',
  'กรุณาอธิบายท่าทาง/อารมณ์': 'Please describe the pose / mood',
  กรุณาเลือกประเภทคำขอ: 'Please choose a request type',
  กรุณาตั้งชื่อชุดสติกเกอร์: 'Please name the sticker set',
  'จำนวนต้องเป็น 8, 16, 24, 32 หรือ 40': 'The count must be 8, 16, 24, 32 or 40',
  จำนวนช่องสติกเกอร์ไม่ครบ: 'Some sticker slots are missing',
  กรุณายอมรับข้อกำหนดก่อนส่ง: 'Please accept the terms before sending',
}
const LABEL_EN: Record<string, string> = {
  ข้อความ: 'The word',
  ท่าทาง: 'The pose',
  เครื่องแต่งกาย: 'The outfit',
  โน้ตสี: 'The colour notes',
  ธีม: 'The theme',
  โน้ต: 'The notes',
  ชื่อชุด: 'The set name',
}
function localize(message: string): string {
  if (getLocale() !== 'en') return message
  if (MESSAGE_EN[message]) return MESSAGE_EN[message]
  const m = message.match(/^(.+?)ยาวเกิน (\d+) ตัวอักษร$/)
  if (m) return `${LABEL_EN[m[1]] ?? m[1]} is longer than ${m[2]} characters`
  return message
}

/** Every problem preventing submission, in display order and the chosen language. */
export function validateBrief(input: BriefInput, opts: { termsAccepted?: boolean; checkTerms?: boolean } = {}): BriefIssue[] {
  const issues: BriefIssue[] = []
  const set = setInfoSchema.safeParse(input)
  if (!set.success) {
    for (const i of set.error.issues) issues.push({ scope: 'set', field: String(i.path[0] ?? ''), message: i.message })
  }
  const visible = input.items.slice(0, input.stickerCount)
  if (visible.length < input.stickerCount) {
    issues.push({ scope: 'set', field: 'items', message: 'จำนวนช่องสติกเกอร์ไม่ครบ' })
  }
  for (const item of visible) {
    const r = itemSchema.safeParse(item)
    if (!r.success) {
      for (const i of r.error.issues) issues.push({ scope: item.position, field: String(i.path[0] ?? ''), message: i.message })
    }
  }
  if (opts.checkTerms && !opts.termsAccepted) {
    issues.push({ scope: 'terms', field: 'terms', message: 'กรุณายอมรับข้อกำหนดก่อนส่ง' })
  }
  return issues.map((i) => ({ ...i, message: localize(i.message) }))
}

/** Positions of visible slots that block submission. */
export function incompleteSlots(items: StickerBriefItem[], count: number): number[] {
  return items
    .slice(0, count)
    .filter((i) => slotStatus(i) !== 'complete' || !itemSchema.safeParse(i).success)
    .map((i) => i.position)
}

export function fieldError(issues: BriefIssue[], scope: BriefIssue['scope'], field: string): string | undefined {
  return issues.find((i) => i.scope === scope && i.field === field)?.message
}
