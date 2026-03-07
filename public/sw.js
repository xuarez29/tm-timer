// ─────────────────────────────────────────────────────────────────────────────
// sw.js — Service Worker for PWA offline support
// Strategy: Stale-While-Revalidate — serve from cache instantly, update async.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE = 'tm-timer-v1';

// Pre-cache the app shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add('/'))
  );
  // Take control immediately (no need to wait for old tabs to close)
  self.skipWaiting();
});

// Clean up old cache versions on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for all GET requests
self.addEventListener('fetch', (event) => {
  // Only handle GET — pass everything else through
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);

      // Fetch fresh copy in the background
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null); // offline — ignore network error

      // Return cached immediately if available; otherwise wait for network
      return cached ?? fetchPromise;
    })
  );
});
