/* Temporary emergency fix: unregister old worker, clear stale site caches. */
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(x => x.startsWith('nogoom-shell-')).map(x => caches.delete(x)));
  await self.clients.claim();
  await self.registration.unregister();
})()); });
self.addEventListener('fetch', event => { /* network only */ });
