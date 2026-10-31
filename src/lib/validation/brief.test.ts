import { describe, expect, it } from 'vitest'
import { newDraft, setCount, updateItem } from '@/features/studio/model/draft'
import { incompleteSlots, slotStatus, textLength, validateBrief } from './brief'

function filled(count: 8 | 16 = 8) {
  let d = setCount(newDraft('community', null).data, count)
  d = { ...d, setName: 'นมผงทดสอบ' }
  for (let i = 1; i <= count; i++) d = updateItem(d, i, { caption: `ข้อความ ${i}`, pose: `ท่า ${i}` })
  return d
}

describe('brief validation', () => {
  it('accepts a complete brief', () => {
    expect(validateBrief(filled())).toEqual([])
  })

  it('identifies incomplete slots by position (FE-05)', () => {
    let d = filled()
    d = updateItem(d, 3, { pose: '' })
    d = updateItem(d, 7, { caption: '   ' })
    expect(incompleteSlots(d.items, d.stickerCount)).toEqual([3, 7])
    const issues = validateBrief(d)
    expect(issues.filter((i) => typeof i.scope === 'number').map((i) => i.scope)).toEqual([3, 7])
  })

  it('requires a trimmed set name and the terms when checked', () => {
    const d = { ...filled(), setName: '   ' }
    const issues = validateBrief(d, { checkTerms: true, termsAccepted: false })
    expect(issues.find((i) => i.field === 'setName')).toBeTruthy()
    expect(issues.find((i) => i.scope === 'terms')).toBeTruthy()
  })

  it('only allows 8/16/24/32/40 stickers', () => {
    const d = { ...filled(), stickerCount: 12 }
    expect(validateBrief(d).some((i) => i.field === 'stickerCount')).toBe(true)
  })

  it('counts Thai graphemes, not code units, for length limits', () => {
    // "ที่" = 3 code points but one grapheme cluster with marks.
    expect(textLength('ที่')).toBe(1)
    expect(textLength('ง่วงงงงง')).toBe(7) // ง่ ว ง ง ง ง ง
    const d = updateItem(filled(), 1, { caption: 'ก่'.repeat(120) })
    expect(validateBrief(d)).toEqual([])
    const tooLong = updateItem(filled(), 1, { caption: 'ก'.repeat(121) })
    expect(validateBrief(tooLong)[0]).toMatchObject({ scope: 1, field: 'caption' })
  })

  it('classifies slot status', () => {
    expect(slotStatus({ caption: '', pose: '' })).toBe('empty')
    expect(slotStatus({ caption: 'x', pose: '' })).toBe('partial')
    expect(slotStatus({ caption: 'x', pose: 'y' })).toBe('complete')
  })
})
