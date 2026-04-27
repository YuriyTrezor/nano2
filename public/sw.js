// Hard kill-switch service worker.
// Anyone who still has the old SW installed will hit this stub on next
// fetch. It immediately unregisters itself, wipes every cache, and reloads
// open tabs so the user gets the fresh build with working auth.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
    try { await self.registration.unregister(); } catch {}
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => { try { client.navigate(client.url); } catch {} });
    } catch {}
  })());
});

// Never serve anything from cache. Always go to network so login / auth
// flows always hit the latest backend.
self.addEventListener('fetch', () => {});