import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { watchDeployment } from './resumeDeployment'

const shell = (hash: string) => `<script type="module" src="/nompongfamily/assets/index-${hash}.js"></script>`
let stop: (() => void) | undefined
const resume = async () => {
  document.dispatchEvent(new Event('visibilitychange'))
  await new Promise((resolve) => setTimeout(resolve, 0))
}
beforeEach(() => {
  document.head.innerHTML = shell('old')
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  sessionStorage.clear()
})
afterEach(() => { stop?.(); vi.unstubAllGlobals() })
describe('background tab recovery', () => {
  it('reloads once when the deployed entry changed and keeps saved drafts', async () => {
    localStorage.setItem('draft', 'my work')
    const fetcher = vi.fn().mockResolvedValue({ ok: true, text: async () => shell('new') })
    vi.stubGlobal('fetch', fetcher)
    const reload = vi.fn()
    stop = watchDeployment('/nompongfamily/', reload)
    await resume()
    await resume()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][0].pathname).toBe('/nompongfamily/')
    expect(localStorage.getItem('draft')).toBe('my work')
  })
  it.each(['same', 'offline', 'bad-response'])('keeps the tab for %s', async (scenario) => {
    vi.stubGlobal('fetch', scenario === 'offline' ? vi.fn().mockRejectedValue(new Error('offline')) :
      vi.fn().mockResolvedValue({ ok: scenario !== 'bad-response', text: async () => shell('old') }))
    const reload = vi.fn()
    stop = watchDeployment('/nompongfamily/', reload)
    await resume()
    expect(reload).not.toHaveBeenCalled()
  })
})
