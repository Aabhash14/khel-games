// Offline support, network first: online players always get the newest version,
// and the last saved copy is used only when there is no connection.
const CACHE = 'indra-jatra-v5';
const ASSETS = ['./', './index.html', './style.css', './icon.svg', './manifest.webmanifest',
  './js/main.js', './js/core/engine.js', './js/core/input.js', './js/core/audio.js', './js/core/fx.js', './js/core/ui.js', './js/core/i18n.js', './js/core/store.js',
  './js/data/strings.js', './js/data/credits.js', './js/core/photo.js',
  './photos/night.webp', './photos/raising.webp', './photos/start.webp', './photos/crowd.webp', './photos/offering.webp', './photos/basantapur.webp', './photos/lakhey.webp', './photos/ropes.webp', './photos/procession.webp', './photos/swet.webp', './photos/indra.webp',
  './sounds/indra-jatra-courtyard-2010.mp3', './sounds/kathmandu-durbar-evening.mp3', './sounds/patan-durbar-evening-bells.mp3', './sounds/newar-bansuri-ensemble.mp3',
  './photos/sh-ganesh.webp', './photos/sh-jaisi.webp', './photos/sh-lagan.webp', './photos/sh-akash.webp', './photos/sh-jana.webp', './photos/sh-annapurna.webp', './js/rules/rand.js', './js/rules/yosin.js', './js/rules/lakhey.js', './js/rules/rath.js', './js/art/side.js', './js/art/top.js',
  './js/scenes/common.js', './js/scenes/menu.js', './js/scenes/yosin.js', './js/scenes/upaku.js', './js/scenes/lakhey.js', './js/scenes/rath.js', './js/scenes/finale.js', './js/scenes/card.js',
  './fonts/mukta-500-devanagari.woff2', './fonts/mukta-500-latin.woff2', './fonts/mukta-700-devanagari.woff2', './fonts/mukta-700-latin.woff2', './fonts/mukta-800-devanagari.woff2', './fonts/mukta-800-latin.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('indra-jatra-') && k !== CACHE).map((k) => caches.delete(k))))
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
