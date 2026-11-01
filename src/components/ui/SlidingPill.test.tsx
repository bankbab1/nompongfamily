import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSlidingPill } from './SlidingPill'

describe('sliding pill layout', () => {
  it('aligns on first render without using scaled viewport coordinates', () => {
    const track = document.createElement('div')
    const selected = document.createElement('button')
    selected.setAttribute('aria-checked', 'true')
    track.append(selected)
    document.body.append(track)
    Object.defineProperties(selected, {
      offsetLeft: { value: 184 }, offsetTop: { value: 4 },
      offsetWidth: { value: 56 }, offsetHeight: { value: 48 },
    })
    // During entry this rectangle can be scaled and translated by an ancestor.
    selected.getBoundingClientRect = () => ({ left: 210, top: 110, width: 54.32, height: 46.56 }) as DOMRect
    const { result, unmount } = renderHook(() => useSlidingPill({ current: track }, '[aria-checked="true"]', []))
    expect(result.current.pill).toEqual({ left: 184, top: 4, width: 56, height: 48, on: true })
    unmount()
    track.remove()
  })
})
