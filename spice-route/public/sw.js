// Spice Route service worker — basic offline support.
// Network-first for navigations (so content stays fresh), cache-first for static assets.

const CACHE = 'spice-route-v1'
const OFFLINE_ASSETS = ['/', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE_ASSETS)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only handle same-origin requests; let everything else (Supabase, Stripe, OFF) pass through.
  if (url.origin !== self.location.origin) return
  // Never cache API/auth routes.
  if (url.pathname.startsWith('/api')) return

  if (request.mode === 'navigate') {
    // Network-first for pages.
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    )
    return
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && (request.destination === 'image' || url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons'))) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          }
          return res
        })
    )
  )
})
