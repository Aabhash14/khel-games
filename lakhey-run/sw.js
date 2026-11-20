// Offline support, network first: online players always get the newest version,
// and the last saved copy is used only when there is no connection.
const CACHE = 'lakhey-run-v3';
const ASSETS = ['./', './index.html', './style.css?v=3', './icon.svg', './manifest.webmanifest',
  './js/vendor/three.min.js', './js/i18n.js?v=3', './js/audio.js?v=3', './js/tex.js?v=3', './js/chars.js?v=3',
  './js/world.js?v=3', './js/game.js?v=3', './js/main.js?v=3',
  './fonts/yatra-one-400-latin.woff2', './fonts/yatra-one-400-devanagari.woff2',
  './fonts/mukta-500-latin.woff2', './fonts/mukta-500-devanagari.woff2', './fonts/mukta-800-latin.woff2', './fonts/mukta-800-devanagari.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lakhey-run-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./')))
  );
});
