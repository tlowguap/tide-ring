/* Tide Ring service worker.
   Bump CACHE when you change any file, otherwise returning devices keep the
   old copy. Everything is cache-first: once installed the app never needs
   the network, which is the point — retreat venues have bad wifi. */
const CACHE = 'tide-ring-v3';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'audio/deep-gong.mp3',
  'audio/temple-gong.mp3',
  'audio/bright-gong.mp3',
  'audio/wind-chimes.mp3',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        // opportunistically cache same-origin extras and the web fonts
        const url = new URL(e.request.url);
        const cacheable = url.origin === location.origin ||
                          url.hostname.endsWith('gstatic.com') ||
                          url.hostname.endsWith('googleapis.com');
        if (cacheable && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
    })
  );
});
