// Temporary network-only recovery SW: prevents outdated cached UI from hiding the app.
const VERSION='nogoom-recovery-20261112-3';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys()){if(name.startsWith('nogoom-'))await caches.delete(name)}await self.clients.claim()})()));
// Intentionally no fetch handler; website and Firebase are loaded directly from network.
