import { describe, expect, it } from 'vitest'
import { adminTransitions, canTransition, isBriefLocked, milestoneIndex, statusLabel } from './status'

describe('request status machine', () => {
  it('locks the brief once submitted (except clarification)', () => {
    expect(isBriefLocked('draft')).toBe(false)
    expect(isBriefLocked('clarification_requested')).toBe(false)
    expect(isBriefLocked('submitted')).toBe(true)
    expect(isBriefLocked('brief_approved')).toBe(true)
  })

  it('commission proofs are released, never hand-set to proof_ready', () => {
    expect(canTransition('commission', 'in_production', 'proof_ready')).toBe(false)
    expect(adminTransitions('commission', 'proof_ready')).toEqual([])
  })

  it('community sets skip customer proofing', () => {
    expect(canTransition('community', 'accepted', 'in_production')).toBe(true)
    expect(canTransition('community', 'in_production', 'line_submitted')).toBe(true)
  })

  it('requires a message to decline or ask for clarification, and a URL to publish', () => {
    const t = adminTransitions('community', 'under_review')
    expect(t.find((x) => x.to === 'declined')?.needsMessage).toBe(true)
    expect(t.find((x) => x.to === 'clarification_requested')?.needsMessage).toBe(true)
    expect(adminTransitions('commission', 'line_submitted')[0]).toMatchObject({ to: 'published', needsUrl: true })
  })

  it('labels accepted community requests as "selected"', () => {
    expect(statusLabel('accepted', 'community')).toBe('ได้รับเลือก')
    expect(statusLabel('accepted', 'commission')).toBe('รับงานแล้ว')
  })

  it('maps detours onto the right milestone', () => {
    expect(milestoneIndex('commission', 'revision_requested')).toBe(milestoneIndex('commission', 'proof_ready'))
    expect(milestoneIndex('community', 'clarification_requested')).toBe(1)
    expect(milestoneIndex('community', 'draft')).toBe(-1)
  })
})
