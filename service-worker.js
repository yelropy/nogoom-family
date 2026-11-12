/* نجوم البيت — Service Worker. Static UI only; NEVER cache Firebase or sensitive API responses. */
const VERSION = 'nogoom-shell-2026-11-loadingfix-02';
const CACHE = VERSION;
const SHELL = [
  './', './index.html', './style.css', './theme.css', './i18n.js', './app.js',
  './firebase-config.js', './metallic.css', './metallic-theme.js', './manifest.webmanifest', './offline.html',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-192.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('nogoom-shell-') && key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Firebase SDK, authentication, Firestore and all third party requests always use network.
  if(url.origin!==self.location.origin)return;
  // Restrict cache to app scope and explicitly allowlisted static filenames.
  const scope=new URL(self.registration.scope);
  if(!url.pathname.startsWith(scope.pathname))return;
  const relative=url.pathname.slice(scope.pathname.length);
  const allowed=new Set(['','index.html','style.css','theme.css','i18n.js','app.js','firebase-config.js',
    'metallic.css','metallic-theme.js','manifest.webmanifest','offline.html','icons/icon-192.png','icons/icon-512.png',
    'icons/icon-maskable-192.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png']);
  if(!allowed.has(relative) && req.mode!=='navigate')return;
  if(req.mode==='navigate'){
    // Online-first ensures deployed UI updates are visible; offline shows an explanatory page.
    event.respondWith(fetch(req).catch(()=>caches.match('./offline.html')));
    return;
  }
  event.respondWith((async()=>{
    try{
      const response=await fetch(req);
      if(response.ok && response.type==='basic'){
        const cache=await caches.open(CACHE);
        await cache.put(req,response.clone());
      }
      return response;
    }catch(err){
      const cached=await caches.match(req);
      if(cached)return cached;
      throw err;
    }
  })());
});
