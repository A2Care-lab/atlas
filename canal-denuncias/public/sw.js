const CACHE_NAME = 'atlas-cd-v3';
const PRECACHE_URLS = [
  '/manifest.json',
  '/atlas-icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)));
      } catch (_) {}
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
        await self.clients.claim();
      } catch (_) {}
    })()
  );
});

// Network-first for app shell and assets; fallback to cache when offline
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    (async () => {
      try {
        const networkResp = await fetch(req);
        try {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, networkResp.clone());
        } catch (_) {}
        return networkResp;
      } catch (_) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // fallback to root for navigation requests
        if (req.mode === 'navigate') {
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
        }
        throw _;
      }
    })()
  );
});
