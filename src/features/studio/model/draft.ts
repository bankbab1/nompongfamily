import {
  MAX_STICKERS,
  type ReferenceAsset,
  type RequestChannel,
  type StickerBriefItem,
  type StickerCount,
  type StickerRequest,
} from '@/lib/api/types'
import { uid } from '@/lib/utils/id'
import { slotStatus } from '@/lib/validation/brief'

/**
 * The editable brief and its pure transformations. Every function returns a new object,
 * so the editor can update in-memory state immediately (spec §6.5) and persist later.
 */

export type DraftData = Pick<
  StickerRequest,
  | 'channel'
  | 'setName'
  | 'stickerCount'
  | 'language'
  | 'theme'
  | 'notes'
  | 'items'
  | 'references'
  | 'fastworkReference'
  | 'allowPublicIdea'
>

export type WizardStep = 1 | 2 | 3 | 4 | 5

/** What lives in IndexedDB for each draft on this device. */
export interface LocalDraft {
  clientDraftId: string
  /** null = guest draft; adopted by the next user who signs in on this device. */
  ownerId: string | null
  serverId?: string
  /** Server version this local copy was last synced against (optimistic concurrency). */
  serverVersion?: number
  /** Local changes not yet accepted by the server. */
  dirty: boolean
  data: DraftData
  step: WizardStep
  activeSlot: number
  createdAt: string
  updatedAt: string
}

export function emptyItems(): StickerBriefItem[] {
  return Array.from({ length: MAX_STICKERS }, (_, i) => ({
    id: uid('slot'),
    position: i + 1,
    caption: '',
    pose: '',
    clothingProps: '',
    colorNotes: '',
    referenceAssetIds: [],
  }))
}

/** Pad a server item list back to MAX_STICKERS slots. */
export function normaliseItems(items: StickerBriefItem[]): StickerBriefItem[] {
  const out = items.map((it, i) => ({ ...it, position: i + 1 }))
  const fill = emptyItems()
  while (out.length < MAX_STICKERS) out.push({ ...fill[out.length], position: out.length + 1 })
  return out
}

export function newDraft(channel: RequestChannel, ownerId: string | null): LocalDraft {
  const now = new Date().toISOString()
  return {
    clientDraftId: uid('cd'),
    ownerId,
    dirty: true,
    step: 2,
    activeSlot: 1,
    createdAt: now,
    updatedAt: now,
    data: {
      channel,
      setName: '',
      stickerCount: 8,
      language: 'th',
      theme: '',
      notes: '',
      items: emptyItems(),
      references: [],
      fastworkReference: '',
      allowPublicIdea: false,
    },
  }
}

export function fromServer(req: StickerRequest, ownerId: string): LocalDraft {
  return {
    clientDraftId: req.clientDraftId,
    ownerId,
    serverId: req.id,
    serverVersion: req.version,
    dirty: false,
    step: 2,
    activeSlot: 1,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    data: {
      channel: req.channel,
      setName: req.setName,
      stickerCount: req.stickerCount,
      language: req.language,
      theme: req.theme ?? '',
      notes: req.notes ?? '',
      items: normaliseItems(req.items),
      references: req.references,
      fastworkReference: req.fastworkReference ?? '',
      allowPublicIdea: req.allowPublicIdea ?? false,
    },
  }
}

export function updateItem(data: DraftData, position: number, patch: Partial<Omit<StickerBriefItem, 'id' | 'position'>>): DraftData {
  return { ...data, items: data.items.map((it) => (it.position === position ? { ...it, ...patch } : it)) }
}

const hasContent = (it: StickerBriefItem) =>
  slotStatus(it) !== 'empty' || !!it.clothingProps?.trim() || !!it.colorNotes?.trim() || !!it.referenceAssetIds?.length

/** Slots beyond `count` that still hold content — warn before hiding them (spec §6.4). */
export function hiddenFilledSlots(data: DraftData, count: StickerCount): number[] {
  return data.items.filter((it) => it.position > count && hasContent(it)).map((it) => it.position)
}

/** Changing the count only hides slots; their data stays in the draft until submission. */
export function setCount(data: DraftData, count: StickerCount): DraftData {
  return { ...data, stickerCount: count }
}

/** Move a slot's content to another position, shifting the ones between (accessible reorder). */
export function moveItem(data: DraftData, from: number, to: number): DraftData {
  if (from === to || to < 1 || to > data.stickerCount) return data
  const items = [...data.items]
  const [moved] = items.splice(from - 1, 1)
  items.splice(to - 1, 0, moved)
  return { ...data, items: items.map((it, i) => ({ ...it, position: i + 1 })) }
}

export type CopyField = 'caption' | 'pose' | 'clothingProps' | 'colorNotes'

export function copyItem(data: DraftData, from: number, to: number, fields: CopyField[]): DraftData {
  const src = data.items[from - 1]
  if (!src || from === to) return data
  const patch: Partial<StickerBriefItem> = {}
  for (const f of fields) patch[f] = src[f] ?? ''
  return updateItem(data, to, patch)
}

export interface BulkMapping {
  position: number
  caption: string
  previous: string
}

/** One caption per line, starting at `start`. Lines are kept byte-for-byte (FE-03);
 *  only fully blank lines are skipped. Lines past the last visible slot are reported. */
export function planBulkCaptions(data: DraftData, text: string, start = 1): { mapping: BulkMapping[]; overflow: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const room = Math.max(0, data.stickerCount - start + 1)
  const mapping = lines.slice(0, room).map((caption, i) => {
    const position = start + i
    return { position, caption, previous: data.items[position - 1]?.caption ?? '' }
  })
  return { mapping, overflow: lines.slice(room) }
}

export function applyBulkCaptions(data: DraftData, mapping: BulkMapping[]): DraftData {
  const byPos = new Map(mapping.map((m) => [m.position, m.caption]))
  return { ...data, items: data.items.map((it) => (byPos.has(it.position) ? { ...it, caption: byPos.get(it.position)! } : it)) }
}

export function addReferences(data: DraftData, refs: ReferenceAsset[]): DraftData {
  return { ...data, references: [...data.references, ...refs] }
}

export function removeReference(data: DraftData, id: string): DraftData {
  return {
    ...data,
    references: data.references.filter((r) => r.id !== id),
    items: data.items.map((it) => ({ ...it, referenceAssetIds: it.referenceAssetIds?.filter((r) => r !== id) })),
  }
}

export function toggleItemReference(data: DraftData, position: number, refId: string): DraftData {
  const it = data.items[position - 1]
  const ids = it.referenceAssetIds ?? []
  return updateItem(data, position, { referenceAssetIds: ids.includes(refId) ? ids.filter((r) => r !== refId) : [...ids, refId] })
}

/** Payload actually sent on submit: only the visible slots. */
export function submittedItems(data: DraftData): StickerBriefItem[] {
  return data.items.slice(0, data.stickerCount)
}

export function completedCount(data: DraftData): number {
  return data.items.slice(0, data.stickerCount).filter((it) => slotStatus(it) === 'complete').length
}
