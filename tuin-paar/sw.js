// Offline support, network first: online players always get the newest version,
// and the last saved copy is used only when there is no connection.
const CACHE = 'tuin-paar-v4';
const ASSETS = ['./', './index.html', './style.css?v=4', './icon.svg', './manifest.webmanifest',
  './js/main.js?v=4', './js/engine.js', './js/cast.js', './js/i18n.js', './js/audio.js', './js/share.js',
  './fonts/anton-400-latin.woff2', './fonts/mukta-500-latin.woff2', './fonts/mukta-500-devanagari.woff2',
  './fonts/mukta-800-latin.woff2', './fonts/mukta-800-devanagari.woff2',
  './img/gorge.svg', './img/rock.svg', './img/water.svg', './img/weave.svg',
  ...['didi', 'bhai', 'bandar', 'bagh', 'bakhra', 'ghans', 'kukur', 'biralo', 'maachha', 'kukhura', 'makai', 'momo'].flatMap((id) => [`./img/${id}.webp`, `./sfx/${id}.mp3`]),
  './sfx/chomp.mp3', './sfx/splash.mp3'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tuin-paar-') && k !== CACHE).map((k) => caches.delete(k))))
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
