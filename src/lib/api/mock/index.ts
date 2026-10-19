import { adminTransitions, CUSTOMER_EDITABLE } from '@/lib/domain/status'
import { uid } from '@/lib/utils/id'
import { validateBrief } from '@/lib/validation/brief'
import { ApiError } from '../errors'
import type { AdminRequestRow, AdminService, Api, AuthService, CatalogService, PublicIdea, StickerRequestService } from '../services'
import {
  QA_CHECKS,
  type AdminRequestMeta,
  type ArtworkProof,
  type ProductionJob,
  type StickerRequest,
  type TimelineEvent,
  type User,
} from '../types'
import { clone, db, persist, roundTrip } from './db'
import type { MockIdea } from './seed'

/** MOCK ADAPTER — development only. Mirrors the authorization a real backend must enforce. */

const SESSION_KEY = 'nompong-mock-session'
const now = () => new Date().toISOString()

/* ------------------------------------------------------------------ helpers */

function currentUser(): User | null {
  const id = localStorage.getItem(SESSION_KEY)
  return (id && db().users.find((u) => u.id === id)) || null
}

function requireUser(): User {
  const u = currentUser()
  if (!u) throw new ApiError('unauthorized', 'Sign in required')
  return u
}

function requireAdmin(): User {
  const u = requireUser()
  if (u.role !== 'admin') throw new ApiError('forbidden', 'Admin only')
  return u
}

function findRequest(id: string): StickerRequest {
  const r = db().requests.find((x) => x.id === id)
  if (!r) throw new ApiError('not_found', 'Request not found')
  return r
}

function ownRequest(id: string): StickerRequest {
  const u = requireUser()
  const r = findRequest(id)
  // Not-found rather than forbidden so ids can't be probed.
  if (r.ownerId !== u.id) throw new ApiError('not_found', 'Request not found')
  return r
}

function pushEvent(r: StickerRequest, actor: TimelineEvent['actor'], actorName: string, status?: TimelineEvent['status'], message?: string) {
  r.timeline.push({ id: uid('ev'), at: now(), actor, actorName, status, message })
}

function touch(r: StickerRequest) {
  r.version += 1
  r.updatedAt = now()
}

function audit(actorName: string, action: string, target: string) {
  db().audit.unshift({ id: uid('a'), at: now(), actorName, action, target })
  db().audit.splice(200)
}

function nextId(): string {
  const d = db()
  d.seq += 1
  return `NP-${String(new Date().getFullYear()).slice(2)}-${String(d.seq).padStart(4, '0')}`
}

function ensureMeta(r: StickerRequest): AdminRequestMeta {
  const d = db()
  d.meta[r.id] ??= { requestId: r.id, priority: 'normal', notes: [], snapshots: [] }
  return d.meta[r.id]
}

function ensureJob(r: StickerRequest): ProductionJob {
  const d = db()
  d.production[r.id] ??= {
    requestId: r.id,
    qa: { thaiSpelling: false, characterConsistency: false, transparentBackground: false, lineSpecs: false },
    items: r.items.map((it) => ({ itemId: it.id, position: it.position, caption: it.caption, pose: it.pose, stage: 'pending', versions: [] })),
  }
  return d.production[r.id]
}

function row(r: StickerRequest): AdminRequestRow {
  const owner = db().users.find((u) => u.id === r.ownerId)
  return clone({ ...r, ownerName: owner?.displayName ?? r.ownerId, meta: ensureMeta(r) })
}

/** Fields a customer may write on a draft. Status, owner, timeline etc. are server-owned. */
const DRAFT_FIELDS = [
  'setName',
  'stickerCount',
  'language',
  'theme',
  'notes',
  'items',
  'references',
  'fastworkReference',
  'allowPublicIdea',
  'packageId',
] as const

function applyDraftPatch(r: StickerRequest, patch: Partial<StickerRequest>) {
  for (const k of DRAFT_FIELDS) if (k in patch) (r as unknown as Record<string, unknown>)[k] = clone(patch[k])
  // Request type is fixed once submitted (spec §6.1).
  if (patch.channel && r.status === 'draft') r.channel = patch.channel
  if (r.channel === 'commission') r.packageId = `pkg_${r.stickerCount}`
  else {
    r.packageId = undefined
    r.fastworkReference = undefined
  }
}

/* ------------------------------------------------------------------ auth */

const auth: AuthService = {
  async getSession() {
    return clone(currentUser())
  },
  async signInAs(personaId) {
    await roundTrip()
    const u = db().users.find((x) => x.id === personaId)
    if (!u) throw new ApiError('not_found', 'Unknown persona')
    localStorage.setItem(SESSION_KEY, u.id)
    return clone(u)
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY)
  },
  async updateProfile(patch) {
    await roundTrip()
    const u = requireUser()
    const stored = db().users.find((x) => x.id === u.id)!
    const name = patch.displayName.trim()
    if (!name || name.length > 60) throw new ApiError('validation', 'ชื่อที่แสดงต้องมี 1–60 ตัวอักษร')
    stored.displayName = name
    stored.locale = patch.locale
    persist()
    return clone(stored)
  },
  async listPersonas() {
    return clone(db().users.filter((u) => ['u_ploy', 'u_may', 'u_admin'].includes(u.id)))
  },
}

/* ------------------------------------------------------------------ customer requests */

const requests: StickerRequestService = {
  async createDraft(input) {
    await roundTrip()
    const u = requireUser()
    const d = db()
    const existing = d.requests.find((r) => r.clientDraftId === input.clientDraftId)
    if (existing) {
      if (existing.ownerId !== u.id) throw new ApiError('forbidden', 'Draft belongs to another account')
      return clone(existing)
    }
    const r: StickerRequest = {
      id: nextId(),
      clientDraftId: input.clientDraftId,
      ownerId: u.id,
      channel: input.channel,
      status: 'draft',
      setName: '',
      stickerCount: 8,
      language: 'th',
      items: [],
      references: [],
      timeline: [],
      version: 1,
      createdAt: now(),
      updatedAt: now(),
    }
    applyDraftPatch(r, input as Partial<StickerRequest>)
    d.requests.push(r)
    persist()
    return clone(r)
  },

  async updateDraft(id, patch, version) {
    await roundTrip()
    const r = ownRequest(id)
    if (!CUSTOMER_EDITABLE.includes(r.status)) throw new ApiError('invalid_state', 'คำขอนี้ล็อกแล้ว แก้ไขไม่ได้')
    if (r.version !== version) throw new ApiError('conflict', 'Stale version', clone(r))
    applyDraftPatch(r, patch)
    touch(r)
    persist()
    return clone(r)
  },

  async deleteDraft(id) {
    await roundTrip()
    const r = ownRequest(id)
    if (r.status !== 'draft') throw new ApiError('invalid_state', 'ลบได้เฉพาะฉบับร่าง')
    db().requests = db().requests.filter((x) => x.id !== id)
    persist()
  },

  async getMyRequests() {
    await roundTrip()
    const u = requireUser()
    return clone(db().requests.filter((r) => r.ownerId === u.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  },

  async getRequest(id) {
    await roundTrip()
    return clone(ownRequest(id))
  },

  async submitRequest(id, consent) {
    await roundTrip()
    const u = requireUser()
    const r = ownRequest(id)
    if (!CUSTOMER_EDITABLE.includes(r.status)) return clone(r) // idempotent retry
    // Server-side validation mirror — the real backend must re-validate everything.
    const issues = validateBrief(r)
    if (issues.length) throw new ApiError('validation', 'บรีฟยังไม่ครบ', issues)
    const resubmit = r.status === 'clarification_requested'
    r.setName = r.setName.trim()
    r.items = r.items.slice(0, r.stickerCount)
    r.status = 'submitted'
    r.termsVersion = consent.termsVersion
    r.termsAcceptedAt = now() // backend-stamped consent time (spec §6.6)
    r.submittedAt ??= now()
    pushEvent(r, 'customer', u.displayName, 'submitted', resubmit ? 'ส่งข้อมูลเพิ่มเติมแล้ว' : undefined)
    touch(r)
    ensureMeta(r).snapshots.push({ at: now(), version: r.version, setName: r.setName, items: clone(r.items) })
    persist()
    return clone(r)
  },

  async getProof(id) {
    await roundTrip()
    ownRequest(id)
    const p = db().proofs[id]
    return p ? clone(p) : null
  },

  async reviewArtwork(id, itemId, decision, comment) {
    await roundTrip()
    const u = requireUser()
    const r = ownRequest(id)
    const proof = db().proofs[id]
    if (!proof || r.status !== 'proof_ready') throw new ApiError('invalid_state', 'ยังไม่มีงานให้ตรวจ หรือปิดการตรวจแล้ว')
    const item = proof.items.find((i) => i.itemId === itemId)
    if (!item) throw new ApiError('not_found', 'Artwork not found')
    const latest = item.versions.at(-1)!.version
    const job = ensureJob(r)
    const jobItem = job.items.find((j) => j.itemId === itemId)
    if (decision === 'revise') {
      if (!comment?.trim()) throw new ApiError('validation', 'กรุณาระบุสิ่งที่ต้องการให้แก้')
      item.state = 'revision_requested'
      item.approvedVersion = undefined
      item.comments.push({ id: uid('c'), at: now(), actor: 'customer', actorName: u.displayName, artworkVersion: latest, body: comment.trim() })
      if (jobItem) jobItem.stage = 'revision'
    } else {
      item.state = 'approved'
      item.approvedVersion = latest
      if (comment?.trim()) {
        item.comments.push({ id: uid('c'), at: now(), actor: 'customer', actorName: u.displayName, artworkVersion: latest, body: comment.trim() })
      }
      if (jobItem) jobItem.stage = 'approved'
    }
    // Once nothing is left pending and something needs work, the round goes back to the studio.
    if (!proof.items.some((i) => i.state === 'pending') && proof.items.some((i) => i.state === 'revision_requested')) {
      r.status = 'revision_requested'
      const n = proof.items.filter((i) => i.state === 'revision_requested').length
      pushEvent(r, 'customer', u.displayName, 'revision_requested', `ขอแก้ไข ${n} ภาพ`)
    }
    touch(r)
    persist()
    return clone(proof)
  },

  async approveFinalSet(id, proofVersion) {
    await roundTrip()
    const u = requireUser()
    const r = ownRequest(id)
    const proof = db().proofs[id]
    if (!proof || r.status !== 'proof_ready') throw new ApiError('invalid_state', 'ไม่อยู่ในสถานะที่อนุมัติได้')
    if (proof.proofVersion !== proofVersion) throw new ApiError('conflict', 'มีรอบงานใหม่กว่า กรุณาโหลดใหม่', clone(proof))
    if (proof.items.some((i) => i.state !== 'approved')) throw new ApiError('invalid_state', 'ต้องอนุมัติครบทุกภาพก่อน')
    proof.finalApproval = { at: now(), proofVersion, actorName: u.displayName }
    r.status = 'artwork_approved'
    const versions = proof.items.map((i) => `${String(i.position).padStart(2, '0')}:v${i.approvedVersion}`).join(' ')
    pushEvent(r, 'customer', u.displayName, 'artwork_approved', `อนุมัติทั้งชุด (รอบ ${proofVersion}) — ${versions}`)
    touch(r)
    persist()
    return clone(proof)
  },

  async getPackages() {
    await roundTrip()
    return clone(db().packages.filter((p) => p.active))
  },
}

/* ------------------------------------------------------------------ catalog */

function toIdea(i: MockIdea): PublicIdea {
  const u = currentUser()
  const { voterIds, ...rest } = i
  return { ...clone(rest), votes: voterIds.length, votedByMe: !!u && voterIds.includes(u.id) }
}

const catalog: CatalogService = {
  async listSets(filter = {}) {
    await roundTrip()
    const q = filter.q?.trim().toLowerCase()
    return clone(
      db()
        .sets.filter((s) => s.status !== 'draft') // unreleased drafts are never public (spec §9.3)
        .filter((s) => !filter.series || filter.series === 'all' || s.series === filter.series)
        .filter((s) => !filter.liveOnly || s.status === 'live')
        .filter(
          (s) =>
            !q ||
            [s.titleTh, s.titleEn, s.code, s.description, ...s.tags, ...s.sampleCaptions].some((f) => f.toLowerCase().includes(q)),
        ),
    )
  },
  async getSet(slug) {
    await roundTrip()
    const s = db().sets.find((x) => x.slug === slug && x.status !== 'draft')
    if (!s) throw new ApiError('not_found', 'Set not found')
    return clone(s)
  },
  async listWallpapers() {
    await roundTrip()
    return clone(db().wallpapers)
  },
  async getWallpaper(slug) {
    await roundTrip()
    const w = db().wallpapers.find((x) => x.slug === slug)
    if (!w) throw new ApiError('not_found', 'Wallpaper not found')
    return clone(w)
  },
  async listPublicIdeas() {
    await roundTrip()
    return db().ideas.map(toIdea).sort((a, b) => b.votes - a.votes)
  },
  async toggleVote(ideaId) {
    await roundTrip()
    const u = requireUser()
    const idea = db().ideas.find((i) => i.id === ideaId)
    if (!idea) throw new ApiError('not_found', 'Idea not found')
    // One vote per member per idea, enforced here (spec §8).
    idea.voterIds = idea.voterIds.includes(u.id) ? idea.voterIds.filter((v) => v !== u.id) : [...idea.voterIds, u.id]
    persist()
    return toIdea(idea)
  },
}

/* ------------------------------------------------------------------ admin */

const VIEW_STATUSES: Record<string, StickerRequest['status'][]> = {
  new: ['submitted'],
  clarification: ['clarification_requested'],
  ready: ['accepted', 'brief_approved'],
  waiting: ['clarification_requested', 'proof_ready'],
  published: ['published'],
}

const admin: AdminService = {
  async metrics() {
    await roundTrip()
    requireAdmin()
    const rs = db().requests.filter((r) => r.status !== 'draft')
    const byStatus: Partial<Record<StickerRequest['status'], number>> = {}
    for (const r of rs) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
    const weekAgo = Date.now() - 7 * 86_400_000
    return {
      byStatus,
      newThisWeek: rs.filter((r) => r.submittedAt && new Date(r.submittedAt).getTime() > weekAgo).length,
      awaitingCustomer: rs.filter((r) => r.status === 'clarification_requested' || r.status === 'proof_ready').length,
      inProduction: rs.filter((r) => ['in_production', 'revision_requested'].includes(r.status)).length,
      published: rs.filter((r) => r.status === 'published').length,
    }
  },

  async listRequests(filter = {}) {
    await roundTrip()
    requireAdmin()
    const q = filter.q?.trim().toLowerCase()
    const users = db().users
    return db()
      .requests.filter((r) => r.status !== 'draft') // customers' unsubmitted drafts are private
      .filter((r) => !filter.channel || filter.channel === 'all' || r.channel === filter.channel)
      .filter((r) => !filter.status || filter.status === 'all' || r.status === filter.status)
      .filter((r) => !filter.view || filter.view === 'all' || VIEW_STATUSES[filter.view]?.includes(r.status))
      .filter((r) => !filter.assigneeId || ensureMeta(r).assigneeId === filter.assigneeId)
      .filter((r) => {
        if (!q) return true
        const owner = users.find((u) => u.id === r.ownerId)?.displayName ?? ''
        return [r.id, r.setName, owner, r.fastworkReference ?? ''].some((f) => f.toLowerCase().includes(q))
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(row)
  },

  async getRequest(id) {
    await roundTrip()
    requireAdmin()
    const r = findRequest(id)
    if (r.status === 'draft') throw new ApiError('not_found', 'Request not found')
    return row(r)
  },

  async listAdmins() {
    await roundTrip()
    requireAdmin()
    return clone(db().users.filter((u) => u.role === 'admin'))
  },

  async transition(id, to, opts) {
    await roundTrip()
    const a = requireAdmin()
    const r = findRequest(id)
    if (r.version !== opts.version) throw new ApiError('conflict', 'คำขอถูกแก้ไขระหว่างนี้ กรุณาโหลดใหม่', row(r))
    const tr = adminTransitions(r.channel, r.status).find((x) => x.to === to)
    if (!tr) throw new ApiError('invalid_state', `เปลี่ยนจาก ${r.status} เป็น ${to} ไม่ได้`)
    if (tr.needsMessage && !opts.message?.trim()) throw new ApiError('validation', 'กรุณาระบุข้อความถึงลูกค้า')
    if (tr.needsUrl) {
      const url = opts.storeUrl?.trim() ?? ''
      if (!/^https:\/\/store\.line\.me\//.test(url)) throw new ApiError('validation', 'ต้องเป็นลิงก์ทางการ https://store.line.me/…')
      r.lineStoreUrl = url
      ensureJob(r).lineSubmission = { ...ensureJob(r).lineSubmission, storeUrl: url }
      if (r.channel === 'community' && !r.catalogCode) {
        // Community sets get their own CR namespace, never V/M numbering (spec §8).
        const d = db()
        const n = d.sets.filter((s) => s.series === 'CR').length + 1
        r.catalogCode = `CR${n}`
        d.sets.push({
          id: `set_cr${n}`,
          slug: `cr${n}`,
          code: `CR${n}`,
          series: 'CR',
          titleTh: r.setName,
          titleEn: r.setName,
          description: r.theme || 'ชุดจากไอเดียของแฟนๆ',
          stickerCount: r.stickerCount,
          status: 'live',
          lineStoreUrl: url,
          coverHue: '#F7C99B',
          tags: ['community'],
          sampleCaptions: r.items.slice(0, 8).map((i) => i.caption),
          releasedAt: now(),
        })
      }
    }
    if (to === 'line_submitted') ensureJob(r).lineSubmission = { submittedAt: now() }
    if (to === 'in_production') ensureJob(r)
    r.status = to
    pushEvent(r, 'admin', a.displayName, to, opts.message?.trim() || undefined)
    touch(r)
    audit(a.displayName, `status → ${to}`, r.id)
    persist()
    return row(r)
  },

  async addNote(id, body) {
    await roundTrip()
    const a = requireAdmin()
    const r = findRequest(id)
    if (!body.trim()) throw new ApiError('validation', 'โน้ตว่างเปล่า')
    ensureMeta(r).notes.push({ id: uid('n'), at: now(), authorName: a.displayName, body: body.trim() })
    audit(a.displayName, 'internal note', r.id)
    persist()
    return row(r)
  },

  async updateMeta(id, patch) {
    await roundTrip()
    const a = requireAdmin()
    const r = findRequest(id)
    const m = ensureMeta(r)
    if (patch.assigneeId !== undefined) m.assigneeId = patch.assigneeId ?? undefined
    if (patch.priority) m.priority = patch.priority
    if (patch.deadline !== undefined) m.deadline = patch.deadline ?? undefined
    audit(a.displayName, 'update assignment', r.id)
    persist()
    return row(r)
  },

  async listProductionJobs() {
    await roundTrip()
    requireAdmin()
    const d = db()
    return Object.values(d.production)
      .map((job) => ({ ...clone(job), request: clone(findRequest(job.requestId)) }))
      .sort((a, b) => b.request.updatedAt.localeCompare(a.request.updatedAt))
  },

  async getProductionJob(requestId) {
    await roundTrip()
    requireAdmin()
    const r = findRequest(requestId)
    const job = db().production[requestId]
    if (!job) throw new ApiError('not_found', 'ยังไม่มีงานผลิตสำหรับคำขอนี้')
    return { ...clone(job), request: clone(r), proof: clone(db().proofs[requestId] ?? null) }
  },

  async setStage(requestId, itemId, stage) {
    await roundTrip()
    requireAdmin()
    const job = db().production[requestId]
    const it = job?.items.find((i) => i.itemId === itemId)
    if (!it) throw new ApiError('not_found', 'Item not found')
    it.stage = stage
    persist()
    return clone(job)
  },

  async uploadArtwork(requestId, itemId, file) {
    await roundTrip()
    const a = requireAdmin()
    const job = db().production[requestId]
    const it = job?.items.find((i) => i.itemId === itemId)
    if (!it) throw new ApiError('not_found', 'Item not found')
    const version = (it.versions.at(-1)?.version ?? 0) + 1
    it.versions.push({ version, imageUrl: file.dataUrl, uploadedAt: now(), note: file.note?.trim() || undefined })
    if (it.stage !== 'approved') it.stage = 'qa'
    audit(a.displayName, `upload artwork v${version}`, `${requestId} #${it.position}`)
    persist()
    return clone(job)
  },

  async setQa(requestId, check, value) {
    await roundTrip()
    requireAdmin()
    const job = db().production[requestId]
    if (!job) throw new ApiError('not_found', 'Job not found')
    job.qa[check] = value
    persist()
    return clone(job)
  },

  async releaseProof(requestId, adminNotes = {}) {
    await roundTrip()
    const a = requireAdmin()
    const d = db()
    const r = findRequest(requestId)
    const job = d.production[requestId]
    if (!job) throw new ApiError('not_found', 'Job not found')
    if (r.channel !== 'commission') throw new ApiError('invalid_state', 'ชุด Community ไม่มีรอบให้ลูกค้าตรวจ')
    if (!['in_production', 'revision_requested'].includes(r.status)) throw new ApiError('invalid_state', 'ปล่อยงานได้เฉพาะตอนกำลังผลิตหรือหลังลูกค้าขอแก้')
    const prev = d.proofs[requestId]
    const prevState = new Map(prev?.items.map((i) => [i.itemId, i]) ?? [])
    // Incomplete proof sets can never be released (spec §10).
    const missing = job.items.filter((it) => {
      if (prevState.get(it.itemId)?.state === 'approved') return false
      const latest = it.versions.at(-1)?.version ?? 0
      return latest === 0 || latest <= (it.releasedVersion ?? 0)
    })
    if (missing.length) {
      throw new ApiError('invalid_state', `ยังขาดไฟล์ใหม่ของภาพ ${missing.map((m) => String(m.position).padStart(2, '0')).join(', ')}`)
    }
    const qaMissing = QA_CHECKS.filter((c) => !job.qa[c])
    if (qaMissing.length) throw new ApiError('invalid_state', 'ต้องผ่าน QA checklist ครบทุกข้อก่อนปล่อยงาน')

    const proof: ArtworkProof = {
      requestId,
      proofVersion: (prev?.proofVersion ?? 0) + 1,
      releasedAt: now(),
      items: job.items.map((it) => {
        const before = prevState.get(it.itemId)
        if (before?.state === 'approved') return before
        const latest = it.versions.at(-1)!
        it.releasedVersion = latest.version
        it.stage = 'proof_uploaded'
        return {
          itemId: it.itemId,
          position: it.position,
          caption: it.caption,
          pose: it.pose,
          state: 'pending',
          versions: [...(before?.versions ?? []), latest],
          adminNote: adminNotes[it.itemId] || latest.note,
          comments: before?.comments ?? [],
        }
      }),
    }
    d.proofs[requestId] = proof
    r.status = 'proof_ready'
    pushEvent(r, 'admin', a.displayName, 'proof_ready', `ส่งงานรอบที่ ${proof.proofVersion} ให้ตรวจแล้ว`)
    touch(r)
    audit(a.displayName, `release proof round ${proof.proofVersion}`, requestId)
    persist()
    return clone(proof)
  },

  async listSets() {
    await roundTrip()
    requireAdmin()
    return clone(db().sets)
  },

  async saveSet(set) {
    await roundTrip()
    const a = requireAdmin()
    const d = db()
    const codeTaken = d.sets.some((s) => s.code === set.code && s.id !== set.id)
    if (codeTaken) throw new ApiError('validation', `รหัส ${set.code} ถูกใช้แล้ว`)
    const prefix = set.series === 'INTRO' ? /^INTRO\d{2}$/ : new RegExp(`^${set.series}\\d+$`)
    if (!prefix.test(set.code)) throw new ApiError('validation', `รหัสต้องอยู่ในรูปแบบซีรีส์ ${set.series} (เช่น ${set.series === 'INTRO' ? 'INTRO01' : `${set.series}1`})`)
    if (set.status === 'live' && set.lineStoreUrl && !/^https:\/\/store\.line\.me\//.test(set.lineStoreUrl)) {
      throw new ApiError('validation', 'ลิงก์ร้านต้องเป็น https://store.line.me/…')
    }
    const i = d.sets.findIndex((s) => s.id === set.id)
    if (i >= 0) d.sets[i] = clone(set)
    else d.sets.push(clone(set))
    audit(a.displayName, 'save sticker set', set.code)
    persist()
    return clone(set)
  },

  async listPackages() {
    await roundTrip()
    requireAdmin()
    return clone(db().packages)
  },

  async savePackage(pkg) {
    await roundTrip()
    const a = requireAdmin()
    const d = db()
    const i = d.packages.findIndex((p) => p.id === pkg.id)
    if (i < 0) throw new ApiError('not_found', 'Package not found')
    d.packages[i] = clone(pkg)
    audit(a.displayName, 'update package', `${pkg.stickerCount} stickers`)
    persist()
    return clone(pkg)
  },

  async audit() {
    await roundTrip()
    requireAdmin()
    return clone(db().audit)
  },
}

export const mockApi: Api = { auth, requests, catalog, admin }
