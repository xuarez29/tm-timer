// ─────────────────────────────────────────────────────────────────────────────
// sw.js — Service Worker for PWA offline support
//
// Strategy is per request type, because one policy for everything was what
// stranded installed apps on old builds:
//
//   navigations   → network-first (with a timeout, falling back to cache)
//   /assets/*     → cache-first — Vite fingerprints these, so they're immutable
//   /fonts/*      → cache-first — self-hosted and versionless, but never change
//   everything else → stale-while-revalidate
//
// The navigation rule is the important one. Serving a cached index.html meant
// serving the old build's hashed script URLs, which were themselves cached, so
// a deploy took two launches to appear — and an installed PWA, which is rarely
// relaunched cold, could sit on a stale version indefinitely.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE = 'tm-timer-v3';

// How long to wait for the network on a navigation before falling back to the
// cached shell. Long enough for a slow venue Wi-Fi, short enough that a dead
// connection doesn't leave the timekeeper staring at a blank screen.
const NAVIGATION_TIMEOUT_MS = 3000;

// The shell and its versionless assets. Hashed build output is not listed —
// its filenames aren't known here — so it lands in the cache on first fetch.
const PRECACHE = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icon.svg',
  '/icon-maskable.svg',
  '/apple-touch-icon.png',
  '/fonts/manrope-latin.woff2',
  '/fonts/zillaslab-500-latin.woff2',
  '/fonts/zillaslab-600-latin.woff2',
  '/fonts/archivo-latin.woff2',
];

// Responses can carry `Vary` (Vite's preview sends `Vary: Origin`, and hosts
// differ), which makes a cache hit depend on the lookup request's headers
// matching the stored one. Ignoring Vary keeps lookups predictable across
// hosts — these URLs identify their content on their own.
const MATCH_OPTS = { ignoreVary: true };

/**
 * Cache the hashed build output the shell points at.
 *
 * Their filenames can't be listed in PRECACHE because Vite fingerprints them,
 * and on a first-ever visit the page requests them before this worker takes
 * control — so they'd miss the cache entirely and only land there on a second
 * load. Someone who opens the app once at home and arrives at the venue
 * offline would get the shell with no JavaScript behind it. Reading the URLs
 * straight out of the cached HTML closes that window on the first visit.
 */
async function precacheShellAssets(cache) {
  const shell = await cache.match('/', MATCH_OPTS);
  if (!shell) return;

  const html = await shell.clone().text();
  const urls = [
    ...new Set(
      [...html.matchAll(/["'](\/assets\/[\w.-]+)["']/g)].map((m) => m[1])
    ),
  ];
  await Promise.allSettled(urls.map((url) => cache.add(url)));
}

// Pre-cache the app shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Added individually: one missing file must not fail the whole install
      // and leave the app with no service worker at all.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await precacheShellAssets(cache);
      // Take control immediately (no need to wait for old tabs to close)
      await self.skipWaiting();
    })()
  );
});

// Clean up old cache versions on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/** Reject if `promise` hasn't settled within `ms`. */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err)   => { clearTimeout(timer); reject(err); }
    );
  });
}

/**
 * Navigations: always try the network first so a new deploy is picked up on
 * the next launch. The response is stored under '/' because this is a
 * single-page app — every navigation resolves to the same shell.
 */
async function navigationStrategy(request) {
  const cache = await caches.open(CACHE);

  try {
    const response = await withTimeout(fetch(request), NAVIGATION_TIMEOUT_MS);
    if (response && response.ok) {
      cache.put('/', response.clone());
    }
    return response;
  } catch {
    // Offline, or the network is too slow to be useful
    const cached =
      (await cache.match('/', MATCH_OPTS)) ||
      (await cache.match(request, MATCH_OPTS));
    if (cached) return cached;
    return Response.error();
  }
}

/** Immutable assets: cache wins, network only fills a miss. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, MATCH_OPTS);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/** Everything else: serve instantly, refresh in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, MATCH_OPTS);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null); // offline — ignore network error

  return cached ?? fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET — pass everything else through
  if (request.method !== 'GET') return;

  // Leave cross-origin requests alone; caching opaque responses buys nothing
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
