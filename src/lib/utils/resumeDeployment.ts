/** A backgrounded phone tab can outlive the hashed JS files from its deployment. */
export function watchDeployment(base: string, reload = () => window.location.reload()) {
  const entry = (doc: Document) => doc.querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src')
  const current = entry(document)
  if (!current) return () => undefined
  let pending = false
  let stopped = false
  let reloading = false
  const check = async () => {
    if (stopped || pending || reloading || document.visibilityState === 'hidden') return
    pending = true
    try {
      // Fetch the app root, not a deep link (GitHub Pages serves deep links via 404.html).
      const url = new URL(base, window.location.origin)
      url.searchParams.set('_resume', String(Date.now()))
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (!response.ok) return
      const latest = entry(new DOMParser().parseFromString(await response.text(), 'text/html'))
      if (!latest || latest === current || stopped) return
      // Bound retries if a browser/CDN keeps serving the previous document after reload.
      const key = 'nompong.resume-reload'
      const attempt = `${current}|${latest}`
      try {
        const previous = JSON.parse(sessionStorage.getItem(key) ?? 'null')
        if (previous?.attempt === attempt && Date.now() - previous.at < 60000) return
        sessionStorage.setItem(key, JSON.stringify({ attempt, at: Date.now() }))
      } catch { /* Storage restrictions must not stop recovery. */ }
      reloading = true
      reload()
    } catch { /* Offline or suspended networking: keep the existing screen and saved drafts. */ }
    finally { pending = false }
  }
  const visible = () => { if (document.visibilityState === 'visible') void check() }
  const restored = (event: PageTransitionEvent) => { if (event.persisted) void check() }
  const preloadFailed = () => { void check() }
  document.addEventListener('visibilitychange', visible)
  window.addEventListener('pageshow', restored)
  window.addEventListener('online', visible)
  window.addEventListener('vite:preloadError', preloadFailed)
  return () => {
    stopped = true
    document.removeEventListener('visibilitychange', visible)
    window.removeEventListener('pageshow', restored)
    window.removeEventListener('online', visible)
    window.removeEventListener('vite:preloadError', preloadFailed)
  }
}
