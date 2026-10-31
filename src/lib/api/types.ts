/**
 * Frontend domain contract (spec §11). Backend/database contracts are provisional:
 * components depend only on these types and the service interfaces in ./services.ts,
 * so the mock adapter can be swapped for real APIs without touching UI code.
 */

export type RequestChannel = 'community' | 'commission'
export const STICKER_COUNTS = [8, 16, 24, 32, 40] as const
export type StickerCount = (typeof STICKER_COUNTS)[number]
export const MAX_STICKERS = 40

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'clarification_requested'
  | 'accepted'
  | 'declined'
  | 'brief_approved'
  | 'in_production'
  | 'proof_ready'
  | 'revision_requested'
  | 'artwork_approved'
  | 'line_submitted'
  | 'published'
  | 'closed'

export type Language = 'th'

export type Role = 'member' | 'customer' | 'admin'

export interface User {
  id: string
  displayName: string
  email: string
  role: Role
  /** Preferred UI language; Thai first, English-ready. */
  locale: 'th' | 'en'
}

/** Reference image metadata. In the mock layer the bytes travel as a data URL;
 *  a real backend returns a protected, short-lived URL instead. */
export interface ReferenceAsset {
  id: string
  name: string
  mime: 'image/jpeg' | 'image/png' | 'image/webp'
  size: number
  url: string
  note?: string
}

export interface StickerBriefItem {
  id: string
  position: number
  caption: string
  pose: string
  clothingProps?: string
  colorNotes?: string
  referenceAssetIds?: string[]
}

export type ActorKind = 'customer' | 'admin' | 'system'

export interface TimelineEvent {
  id: string
  at: string
  actor: ActorKind
  actorName: string
  status?: RequestStatus
  message?: string
}

export interface StickerRequest {
  id: string
  /** Stable id minted on the device; makes create/submit idempotent (spec §6.5). */
  clientDraftId: string
  ownerId: string
  channel: RequestChannel
  status: RequestStatus
  setName: string
  stickerCount: StickerCount
  language: Language
  theme?: string
  notes?: string
  /** Always MAX_STICKERS long on drafts so hidden slots survive a count change;
   *  trimmed to stickerCount on submission. */
  items: StickerBriefItem[]
  references: ReferenceAsset[]
  packageId?: string
  /** Opt-in to appear (moderated) on the public Ideas board — community only. */
  allowPublicIdea?: boolean
  termsVersion?: string
  termsAcceptedAt?: string
  catalogCode?: string
  lineStoreUrl?: string
  timeline: TimelineEvent[]
  version: number
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

/* ---------------------------------------------------------------- proofs */

export type ProofItemState = 'pending' | 'approved' | 'revision_requested'

export interface ArtworkVersion {
  version: number
  imageUrl: string
  uploadedAt: string
  note?: string
}

export interface RevisionComment {
  id: string
  at: string
  actor: ActorKind
  actorName: string
  artworkVersion: number
  body: string
}

export interface ProofItem {
  itemId: string
  position: number
  caption: string
  pose: string
  state: ProofItemState
  /** Released versions only, oldest first. Latest = last. */
  versions: ArtworkVersion[]
  /** Version the customer approved, recorded exactly (spec §7). */
  approvedVersion?: number
  adminNote?: string
  comments: RevisionComment[]
}

export interface ArtworkProof {
  requestId: string
  /** Increments every time admin releases a proof round. */
  proofVersion: number
  releasedAt: string
  items: ProofItem[]
  finalApproval?: { at: string; proofVersion: number; actorName: string }
}

/* ---------------------------------------------------------------- catalog */

export type SeriesKind = 'V' | 'M' | 'CR' | 'INTRO'
export type CatalogStatus = 'live' | 'coming_soon' | 'draft'

export interface StickerSet {
  id: string
  slug: string
  /** Namespaced identifier: V1..V60, M1.., CR1.., INTRO01 — never mixed (spec §8, §9.3). */
  code: string
  series: SeriesKind
  titleTh: string
  titleEn: string
  description: string
  /** English description; falls back to the Thai one. */
  descriptionEn?: string
  stickerCount: number
  status: CatalogStatus
  /** Only set after actual publication. */
  lineStoreUrl?: string
  coverHue: string
  tags: string[]
  sampleCaptions: string[]
  releasedAt?: string
  featured?: boolean
}

export interface WallpaperVariant {
  id: string
  label: string
  labelEn?: string
  device: 'mobile' | 'tablet' | 'desktop'
  width: number
  height: number
  format: 'PNG' | 'JPG'
  sizeKb: number
}

export interface Wallpaper {
  id: string
  slug: string
  titleTh: string
  titleEn: string
  theme: string
  themeEn?: string
  palette: [string, string, string]
  variants: WallpaperVariant[]
  free: boolean
}

export interface CommissionPackage {
  id: string
  stickerCount: StickerCount
  /** Display text (admin-defined, never hardcoded in UI). */
  priceLabel: string
  revisionRounds: number
  turnaroundDays: number
  active: boolean
}

/* ---------------------------------------------------------------- admin */

export type Priority = 'low' | 'normal' | 'high'

export interface InternalNote {
  id: string
  at: string
  authorName: string
  body: string
}

/** Internal-only data. Never returned by the customer service. */
export interface AdminRequestMeta {
  requestId: string
  assigneeId?: string
  priority: Priority
  deadline?: string
  notes: InternalNote[]
  /** Brief snapshots captured at each (re)submission. */
  snapshots: { at: string; version: number; setName: string; items: StickerBriefItem[] }[]
}

export type ProductionStage = 'pending' | 'designing' | 'qa' | 'proof_uploaded' | 'revision' | 'approved'

export interface ProductionItem {
  itemId: string
  position: number
  caption: string
  pose: string
  stage: ProductionStage
  /** All uploaded versions, including ones not yet released to the customer. */
  versions: ArtworkVersion[]
  releasedVersion?: number
}

export const QA_CHECKS = ['thaiSpelling', 'characterConsistency', 'transparentBackground', 'lineSpecs'] as const
export type QaCheck = (typeof QA_CHECKS)[number]

export interface ProductionJob {
  requestId: string
  items: ProductionItem[]
  qa: Record<QaCheck, boolean>
  lineSubmission?: { submittedAt?: string; storeUrl?: string }
}

export interface AuditEntry {
  id: string
  at: string
  actorName: string
  action: string
  target: string
}

export interface Paged<T> {
  items: T[]
  total: number
}
