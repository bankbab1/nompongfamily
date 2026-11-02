import { act, renderHook, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useCollectionScroll } from './useCollectionScroll'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('tracks collections down and back up, and returns to All above the sections', () => {
  let callbacks: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callbacks.push(cb); return callbacks.length })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const root = document.createElement('div')
  const bar = document.createElement('div')
  bar.getBoundingClientRect = () => ({ bottom: 80 } as DOMRect)
  let positions = [500, 1500]
  for (const [i, id] of ['Daily', 'Festive'].entries()) {
    const section = document.createElement('section')
    section.dataset.collection = id
    section.getBoundingClientRect = () => ({ top: positions[i] } as DOMRect)
    root.append(section)
  }
  const rootRef = { current: root }, barRef = { current: bar }
  const { result, unmount } = renderHook(() => useCollectionScroll(rootRef, barRef, 'all'))
  const scroll = (tops: number[]) => act(() => {
    positions = tops
    window.dispatchEvent(new Event('scroll'))
    const pending = callbacks; callbacks = []
    pending.forEach(cb => cb(0))
  })
  expect(result.current).toBe('all')
  scroll([-800, 200])
  expect(result.current).toBe('Festive')
  scroll([100, 1100])
  expect(result.current).toBe('Daily')
  scroll([500, 1500])
  expect(result.current).toBe('all')
  unmount()
  callbacks = []
  window.dispatchEvent(new Event('scroll'))
  expect(callbacks).toHaveLength(0)
})
