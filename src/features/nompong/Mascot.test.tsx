import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { NompongMascot } from './Mascot'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('pauses motion offscreen and disconnects the observer on unmount', () => {
  let notify: IntersectionObserverCallback = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { notify = callback }
    observe = vi.fn()
    disconnect = disconnect
  })
  const { container, unmount } = render(<NompongMascot pose="studio" />)
  const image = container.querySelector('img')!
  expect(image.src).toContain('/nompong/mascot-studio.webp')
  act(() => notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver))
  expect(image.style.animationPlayState).toBe('paused')
  act(() => notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
  expect(image.style.animationPlayState).toBe('running')
  unmount()
  expect(disconnect).toHaveBeenCalledOnce()
})

it('restarts the greeting reaction on repeated taps', () => {
  const { getByRole, container } = render(<NompongMascot interactive />)
  fireEvent.click(getByRole('button'))
  const first = container.querySelector('.mascot-reaction')
  expect(first).toBeTruthy()
  fireEvent.click(getByRole('button'))
  expect(container.querySelector('.mascot-reaction')).not.toBe(first)
})

it.each([['curious', 'mascot-curious-reaction'], ['studio', 'mascot-studio-reaction']] as const)('gives %s its own tap reaction', (pose, className) => {
  const { getByRole, container } = render(<NompongMascot pose={pose} interactive />)
  fireEvent.click(getByRole('button'))
  expect(container.querySelector(`.${className}`)).toBeTruthy()
})

it('pauses both idle motion and a tap reaction in background tabs', () => {
  const { getByRole, container } = render(<NompongMascot interactive />)
  fireEvent.click(getByRole('button'))
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  fireEvent(document, new Event('visibilitychange'))
  expect(container.querySelector('img')!.style.animationPlayState).toBe('paused')
  expect((container.querySelector('.mascot-reaction') as HTMLElement).style.animationPlayState).toBe('paused')
  vi.restoreAllMocks()
})
