// Offline support, network first: online players always get the newest version,
// and the last saved copy is used only when there is no connection.
const CACHE = 'imposter-v2';
const ASSETS = ['./', './index.html', './style.css?v=2', './icon.svg', './manifest.webmanifest',
  './js/main.js?v=1', './js/rules.js', './js/words.js', './js/i18n.js', './js/audio.js', './js/share.js',
  './fonts/anton-400-latin.woff2', './fonts/kalam-400-latin.woff2', './fonts/kalam-400-devanagari.woff2',
  './fonts/kalam-700-latin.woff2', './fonts/kalam-700-devanagari.woff2',
  './fonts/mukta-500-latin.woff2', './fonts/mukta-500-devanagari.woff2', './fonts/mukta-800-latin.woff2', './fonts/mukta-800-devanagari.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('imposter-') && k !== CACHE).map((k) => caches.delete(k))))
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
