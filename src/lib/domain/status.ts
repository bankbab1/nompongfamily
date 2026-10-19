import { t } from '@/lib/i18n'
import type { RequestChannel, RequestStatus } from '@/lib/api/types'

/**
 * Request lifecycle (spec §7 timeline, §8 community states). The backend owns the real
 * state machine; this mirror lets the UI offer only sensible actions. Exact statuses may
 * be refined by the backend.
 */

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent'

export const STATUS_TONE: Record<RequestStatus, Tone> = {
  draft: 'neutral',
  submitted: 'info',
  under_review: 'info',
  clarification_requested: 'warning',
  accepted: 'accent',
  declined: 'danger',
  brief_approved: 'accent',
  in_production: 'accent',
  proof_ready: 'warning',
  revision_requested: 'warning',
  artwork_approved: 'success',
  line_submitted: 'success',
  published: 'success',
  closed: 'neutral',
}

export function statusLabel(status: RequestStatus, channel?: RequestChannel): string {
  if (status === 'accepted' && channel === 'community') return t('status.accepted_community')
  return t(`status.${status}`)
}

/** The customer may edit the brief only in these states (spec §6.1, §8). */
export const CUSTOMER_EDITABLE: readonly RequestStatus[] = ['draft', 'clarification_requested']

/** Brief is read-only and locked from here on; changes go through revision workflow (spec §7). */
export function isBriefLocked(status: RequestStatus): boolean {
  return !CUSTOMER_EDITABLE.includes(status)
}

export interface Transition {
  to: RequestStatus
  /** Customer-visible message required (e.g. what needs clarifying, why declined). */
  needsMessage?: boolean
  /** Official LINE Store URL required. */
  needsUrl?: boolean
  danger?: boolean
}

const COMMON: Partial<Record<RequestStatus, Transition[]>> = {
  submitted: [{ to: 'under_review' }, { to: 'declined', needsMessage: true, danger: true }],
  under_review: [
    { to: 'clarification_requested', needsMessage: true },
    { to: 'accepted' },
    { to: 'declined', needsMessage: true, danger: true },
  ],
  clarification_requested: [{ to: 'under_review' }, { to: 'declined', needsMessage: true, danger: true }],
  line_submitted: [{ to: 'published', needsUrl: true }],
  published: [{ to: 'closed' }],
  declined: [{ to: 'closed' }],
}

const BY_CHANNEL: Record<RequestChannel, Partial<Record<RequestStatus, Transition[]>>> = {
  commission: {
    accepted: [{ to: 'brief_approved' }],
    brief_approved: [{ to: 'in_production' }],
    // in_production → proof_ready happens only by releasing a proof (production workspace).
    // proof_ready / revision_requested are driven by the customer's review.
    artwork_approved: [{ to: 'line_submitted' }],
  },
  community: {
    // Community sets are produced in-house; no customer proof round.
    accepted: [{ to: 'in_production' }],
    in_production: [{ to: 'line_submitted' }],
  },
}

export function adminTransitions(channel: RequestChannel, status: RequestStatus): Transition[] {
  return [...(BY_CHANNEL[channel][status] ?? []), ...(COMMON[status] ?? [])]
}

export function canTransition(channel: RequestChannel, from: RequestStatus, to: RequestStatus): boolean {
  return adminTransitions(channel, from).some((tr) => tr.to === to)
}

/** Customer-facing milestones, in order. */
export const MILESTONES: Record<RequestChannel, RequestStatus[]> = {
  commission: [
    'submitted',
    'under_review',
    'brief_approved',
    'in_production',
    'proof_ready',
    'artwork_approved',
    'line_submitted',
    'published',
  ],
  community: ['submitted', 'under_review', 'accepted', 'in_production', 'line_submitted', 'published'],
}

/** Index of the milestone a status belongs to (-1 for draft). */
export function milestoneIndex(channel: RequestChannel, status: RequestStatus): number {
  const list = MILESTONES[channel]
  const alias: Partial<Record<RequestStatus, RequestStatus>> = {
    clarification_requested: 'under_review',
    accepted: channel === 'commission' ? 'under_review' : 'accepted',
    revision_requested: 'proof_ready',
    declined: 'under_review',
    closed: 'published',
  }
  if (status === 'draft') return -1
  return list.indexOf(alias[status] ?? status)
}

/** Status needs the customer to do something. */
export function awaitingCustomer(status: RequestStatus): boolean {
  return status === 'clarification_requested' || status === 'proof_ready' || status === 'draft'
}

export type RequestGroup = 'drafts' | 'active' | 'done'
export function requestGroup(status: RequestStatus): RequestGroup {
  if (status === 'draft') return 'drafts'
  if (status === 'published' || status === 'closed' || status === 'declined') return 'done'
  return 'active'
}
