import type {
  AdminRequestMeta,
  ArtworkProof,
  AuditEntry,
  CommissionPackage,
  Priority,
  ProductionJob,
  ProductionStage,
  QaCheck,
  RequestChannel,
  RequestStatus,
  SeriesKind,
  StickerRequest,
  StickerSet,
  User,
  Wallpaper,
} from './types'

/**
 * Frontend service contract (spec §11) — NOT committed API routes. The mock adapter in
 * ./mock implements these; a real adapter (fetch + httpOnly session cookie) replaces it
 * without component changes. Every method rejects with ApiError.
 */

export interface AuthService {
  getSession(): Promise<User | null>
  /** Mock only: pick a demo persona. A real adapter redirects to the identity provider. */
  signInAs(personaId: string): Promise<User>
  signOut(): Promise<void>
  updateProfile(patch: Pick<User, 'displayName' | 'locale'>): Promise<User>
  listPersonas(): Promise<User[]>
}

export type DraftInput = Partial<Omit<StickerRequest, 'id' | 'ownerId' | 'status' | 'timeline' | 'version'>> & {
  clientDraftId: string
  channel: RequestChannel
}

export interface StickerRequestService {
  /** Idempotent per clientDraftId: a retry returns the existing draft. */
  createDraft(input: DraftInput): Promise<StickerRequest>
  /** Rejects with `conflict` (detail = current server copy) if `version` is stale. */
  updateDraft(id: string, patch: Partial<StickerRequest>, version: number): Promise<StickerRequest>
  deleteDraft(id: string): Promise<void>
  getMyRequests(): Promise<StickerRequest[]>
  getRequest(id: string): Promise<StickerRequest>
  /** Idempotent: submitting an already-submitted request returns it unchanged. */
  submitRequest(id: string, consent: { termsVersion: string }): Promise<StickerRequest>
  getProof(id: string): Promise<ArtworkProof | null>
  reviewArtwork(id: string, itemId: string, decision: 'approve' | 'revise', comment?: string): Promise<ArtworkProof>
  approveFinalSet(id: string, proofVersion: number): Promise<ArtworkProof>
  getPackages(): Promise<CommissionPackage[]>
}

export interface CatalogFilter {
  series?: SeriesKind | 'all'
  q?: string
  liveOnly?: boolean
}

export interface PublicIdea {
  id: string
  setName: string
  theme?: string
  stickerCount: number
  sampleCaptions: string[]
  votes: number
  votedByMe: boolean
}

export interface CatalogService {
  listSets(filter?: CatalogFilter): Promise<StickerSet[]>
  getSet(slug: string): Promise<StickerSet>
  listWallpapers(): Promise<Wallpaper[]>
  getWallpaper(slug: string): Promise<Wallpaper>
  listPublicIdeas(): Promise<PublicIdea[]>
  toggleVote(ideaId: string): Promise<PublicIdea>
}

export interface AdminRequestFilter {
  q?: string
  channel?: RequestChannel | 'all'
  status?: RequestStatus | 'all'
  view?: 'new' | 'clarification' | 'ready' | 'waiting' | 'published' | 'all'
  assigneeId?: string
}

export interface AdminRequestRow extends StickerRequest {
  ownerName: string
  meta: AdminRequestMeta
}

export interface AdminMetrics {
  byStatus: Partial<Record<RequestStatus, number>>
  newThisWeek: number
  awaitingCustomer: number
  inProduction: number
  published: number
}

export interface AdminService {
  metrics(): Promise<AdminMetrics>
  listRequests(filter?: AdminRequestFilter): Promise<AdminRequestRow[]>
  getRequest(id: string): Promise<AdminRequestRow>
  listAdmins(): Promise<User[]>
  transition(id: string, to: RequestStatus, opts: { message?: string; storeUrl?: string; version: number }): Promise<AdminRequestRow>
  addNote(id: string, body: string): Promise<AdminRequestRow>
  updateMeta(id: string, patch: { assigneeId?: string | null; priority?: Priority; deadline?: string | null }): Promise<AdminRequestRow>

  listProductionJobs(): Promise<(ProductionJob & { request: StickerRequest })[]>
  getProductionJob(requestId: string): Promise<ProductionJob & { request: StickerRequest; proof: ArtworkProof | null }>
  setStage(requestId: string, itemId: string, stage: ProductionStage): Promise<ProductionJob>
  uploadArtwork(requestId: string, itemId: string, file: { dataUrl: string; note?: string }): Promise<ProductionJob>
  setQa(requestId: string, check: QaCheck, value: boolean): Promise<ProductionJob>
  /** Rejects with `invalid_state` unless every non-approved item has a new uploaded version. */
  releaseProof(requestId: string, adminNote?: Record<string, string>): Promise<ArtworkProof>

  listSets(): Promise<StickerSet[]>
  saveSet(set: StickerSet): Promise<StickerSet>
  listPackages(): Promise<CommissionPackage[]>
  savePackage(pkg: CommissionPackage): Promise<CommissionPackage>
  audit(): Promise<AuditEntry[]>
}

export interface Api {
  auth: AuthService
  requests: StickerRequestService
  catalog: CatalogService
  admin: AdminService
}
