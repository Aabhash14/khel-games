// Offline support.
// Pages: network first, so online players always get the newest version.
// Scripts, styles, fonts and icons: cache first. They are versioned (?v=N), so a
// new release has new URLs and is fetched fresh. Bump V here and in index.html together.
const V = 6;
const CACHE = 'ipl-auction-v7';
const ASSETS = ['./', './index.html', `./style.css?v=${V}`, './icon.svg', './manifest.webmanifest',
  ...['data', 'rules', 'engine', 'season', 'i18n', 'audio', 'match', 'league', 'share', 'main', 'tour'].map((m) => `./js/${m}.js?v=${V}`),
  './fonts/anton-400-latin.woff2', './fonts/mukta-500-latin.woff2', './fonts/mukta-500-devanagari.woff2',
  './fonts/mukta-800-latin.woff2', './fonts/mukta-800-devanagari.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ipl-auction-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromNetwork(req) {
  return fetch(req.url, { cache: 'no-cache' }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate' || req.destination === 'document' || req.url.endsWith('.webmanifest')) {
    e.respondWith(fromNetwork(req).catch(() => caches.match(req).then((hit) => hit || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fromNetwork(req)));
});
