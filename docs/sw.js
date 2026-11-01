/* Minimal service worker (spec §12): installability + static asset caching.
   Navigation requests are network-first so new deploys win; hashed assets are cache-first.
   Never caches API responses or protected artwork (spec §7 "protected URLs"). */
const CACHE = 'nompong-static-v3'
// The folder this worker lives in: '/' on a custom domain, '/nompongfamily/' on github.io.
const BASE = new URL('./', self.location).pathname
const SHELL = [BASE, `${BASE}manifest.webmanifest`, `${BASE}icons/favicon.svg`, `${BASE}icons/icon.svg`]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(BASE, copy))
          }
          return res
        })
        .catch(() => caches.match(BASE)),
    )
    return
  }

  if (url.pathname.startsWith(`${BASE}assets/`) || url.pathname.startsWith(`${BASE}icons/`)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            // Never pin a missing chunk's 404 response in the offline cache.
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
