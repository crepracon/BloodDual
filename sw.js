// Blood Dual — offline support
const CACHE = "blooddual-v17";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  // cache: "reload" forces a real network fetch for each core asset,
  // bypassing the browser's HTTP cache. Without this, a version bump
  // could still populate the new cache with a stale index.html that
  // was sitting in HTTP cache from a recent page load.
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(ASSETS.map((url) =>
        fetch(url, { cache: "reload" }).then((res) => c.put(url, res))
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first: serve from cache, fall back to network, and quietly cache
// anything new we fetch (like the Google Fonts files) for next time.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
