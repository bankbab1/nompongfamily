import { describe, expect, it } from 'vitest'
import { MAX_STICKERS } from '@/lib/api/types'
import {
  applyBulkCaptions,
  completedCount,
  copyItem,
  hiddenFilledSlots,
  moveItem,
  newDraft,
  normaliseItems,
  planBulkCaptions,
  removeReference,
  setCount,
  submittedItems,
  toggleItemReference,
  updateItem,
} from './draft'

const THAI = ['ง่วงงงงง', 'สวัสดีค่าาา', 'เลิกงานแล้ววว', 'กำลังไป๊', 'ขอบคุณน้าาา ♡']

describe('draft model', () => {
  it('always keeps MAX_STICKERS slots so hidden data survives count changes (FE-02)', () => {
    const d = newDraft('community', null)
    expect(d.data.items).toHaveLength(MAX_STICKERS)
    expect(d.data.items.map((i) => i.position)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
  })

  it('reducing the count hides but preserves slot content; submit sends only visible slots', () => {
    let data = setCount(newDraft('community', null).data, 24)
    data = updateItem(data, 20, { caption: 'ยังอยู่นะ', pose: 'โบกมือ' })
    expect(hiddenFilledSlots(data, 16)).toEqual([20])
    data = setCount(data, 16)
    expect(data.items[19].caption).toBe('ยังอยู่นะ')
    expect(submittedItems(data)).toHaveLength(16)
    data = setCount(data, 24)
    expect(submittedItems(data)[19].caption).toBe('ยังอยู่นะ')
  })

  it('preserves exact Thai captions byte-for-byte through edits and bulk paste (FE-03)', () => {
    let data = setCount(newDraft('community', null).data, 8)
    const text = THAI.join('\n')
    const { mapping } = planBulkCaptions(data, text)
    data = applyBulkCaptions(data, mapping)
    THAI.forEach((c, i) => expect(data.items[i].caption).toBe(c))
    // No normalisation: a decomposed sequence stays decomposed.
    const decomposed = 'กำ'
    data = updateItem(data, 6, { caption: decomposed })
    expect(data.items[5].caption).toBe(decomposed)
    expect([...data.items[5].caption]).toHaveLength(2)
  })

  it('bulk paste skips blank lines, reports overflow and the replaced captions', () => {
    let data = setCount(newDraft('community', null).data, 8)
    data = updateItem(data, 7, { caption: 'เดิม' })
    const lines = Array.from({ length: 4 }, (_, i) => `บรรทัด ${i + 1}`).join('\n\n')
    const plan = planBulkCaptions(data, lines, 6)
    expect(plan.mapping.map((m) => m.position)).toEqual([6, 7, 8])
    expect(plan.mapping[1].previous).toBe('เดิม')
    expect(plan.overflow).toEqual(['บรรทัด 4'])
  })

  it('moves slots with accessible reorder and renumbers positions', () => {
    let data = setCount(newDraft('community', null).data, 8)
    data = updateItem(data, 1, { caption: 'A', pose: 'a' })
    data = updateItem(data, 2, { caption: 'B', pose: 'b' })
    data = moveItem(data, 1, 2)
    expect(data.items[0].caption).toBe('B')
    expect(data.items[1].caption).toBe('A')
    expect(data.items.map((i) => i.position).slice(0, 3)).toEqual([1, 2, 3])
    // Cannot move outside visible range
    expect(moveItem(data, 8, 9)).toBe(data)
  })

  it('copies selected fields only', () => {
    let data = setCount(newDraft('community', null).data, 8)
    data = updateItem(data, 1, { caption: 'A', pose: 'ท่า A', clothingProps: 'หมวก' })
    data = updateItem(data, 3, { caption: 'C' })
    data = copyItem(data, 1, 3, ['pose', 'clothingProps'])
    expect(data.items[2]).toMatchObject({ caption: 'C', pose: 'ท่า A', clothingProps: 'หมวก' })
  })

  it('removing a reference detaches it from every slot', () => {
    let data = newDraft('commission', 'u').data
    data = { ...data, references: [{ id: 'r1', name: 'a.png', mime: 'image/png', size: 1, url: 'data:' }] }
    data = toggleItemReference(data, 2, 'r1')
    expect(data.items[1].referenceAssetIds).toEqual(['r1'])
    data = removeReference(data, 'r1')
    expect(data.references).toHaveLength(0)
    expect(data.items[1].referenceAssetIds).toEqual([])
  })

  it('counts completion over visible slots only', () => {
    let data = setCount(newDraft('community', null).data, 8)
    data = updateItem(data, 1, { caption: 'x', pose: 'y' })
    data = updateItem(data, 9, { caption: 'x', pose: 'y' })
    expect(completedCount(data)).toBe(1)
  })

  it('pads server items back to 40 slots', () => {
    const items = normaliseItems([{ id: 'a', position: 1, caption: 'x', pose: 'y' }])
    expect(items).toHaveLength(40)
    expect(items[0].caption).toBe('x')
  })
})
