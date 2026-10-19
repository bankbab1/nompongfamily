/* Minimal service worker (spec §12): installability + static asset caching.
   Navigation requests are network-first so new deploys win; hashed assets are cache-first.
   Never caches API responses or protected artwork (spec §7 "protected URLs"). */
const CACHE = 'nompong-static-v2'
const SHELL = ['/nompongfamily/', '/nompongfamily/manifest.webmanifest', '/nompongfamily/icons/favicon.svg', '/nompongfamily/icons/icon.svg']

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
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/nompongfamily/', copy))
          return res
        })
        .catch(() => caches.match('/nompongfamily/')),
    )
    return
  }

  if (url.pathname.startsWith('/nompongfamily/assets/') || url.pathname.startsWith('/nompongfamily/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          }),
      ),
    )
  }
})
