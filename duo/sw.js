// Offline support, network first: online players always get the newest version,
// and the last saved copy is used only when there is no connection.
const CACHE = 'duo-v3';
const ASSETS = ['./', './index.html', './style.css?v=3', './icon.svg', './manifest.webmanifest',
  './js/main.js?v=3', './js/icons.js', './js/animals.js', './js/vendor/matter.min.js', './js/i18n.js', './js/audio.js', './js/share.js', './js/faces.js',
  './js/games/memory.js', './js/games/pool.js', './js/games/guess.js', './js/games/hockey.js', './js/games/four.js',
  './js/games/dots.js', './js/games/sea.js', './js/games/draw.js', './js/games/stack.js',
  './fonts/bungee-400-latin.woff2', './fonts/bungee-shade-400-latin.woff2', './fonts/yatra-one-400-latin.woff2', './fonts/yatra-one-400-devanagari.woff2',
  './fonts/hind-600-latin.woff2', './fonts/hind-600-devanagari.woff2', './fonts/hind-700-latin.woff2', './fonts/hind-700-devanagari.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('duo-') && k !== CACHE).map((k) => caches.delete(k))))
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
