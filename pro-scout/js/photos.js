/* Pro Scout — photo loading: pinned photos (faces.js) with a live Wikipedia fallback, throttled fetch queue. */
(() => {
  'use strict';

  window.PS = window.PS || {};
  const { BY, store } = PS.Core;

  // ---------- Photos (Wikipedia page images, loaded live) ----------
  const PHOTO_KEY = 'ps-photos-v1';
  const photoMeta = store.get(PHOTO_KEY, {});
  const imgPromises = new Map();
  const failedPhotos = new Set();
  const queue = []; let active = 0;
  function enqueue(job) {
    return new Promise((resolve) => { queue.push({ job, resolve }); pump(); });
  }
  function pump() {
    while (active < 3 && queue.length) {
      const { job, resolve } = queue.shift();
      active++;
      job().then(resolve, () => resolve(null)).finally(() => { active--; pump(); });
    }
  }
  // Pinned photos (faces.js): one fixed image per player, plus where its eyes and mouth are.
  // If a pinned image ever disappears, we fall back to the live Wikipedia page image.
  const FACES = window.PS_FACES || {};
  const pinFailed = new Set();
  function commonsPage(u) {
    const parts = u.split('?')[0].split('/');
    const file = u.includes('/thumb/') ? parts[parts.length - 2] : parts[parts.length - 1];
    return (u.includes('/wikipedia/commons/') ? 'https://commons.wikimedia.org/wiki/File:' : 'https://en.wikipedia.org/wiki/File:') + file;
  }
  async function apiInfo(id) {
    const m = photoMeta[id];
    if (m && Date.now() - m.t < 30 * 864e5) return m;
    const p = BY[id];
    return enqueue(async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(p.w));
        if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 1500)); continue; }
        if (!r.ok) return null;
        const j = await r.json();
        if (!j.thumbnail) return null;
        const info = { u: j.thumbnail.source, f: commonsPage((j.originalimage && j.originalimage.source) || j.thumbnail.source), t: Date.now() };
        photoMeta[id] = info;
        store.set(PHOTO_KEY, photoMeta);
        return info;
      }
      return null;
    });
  }
  async function photoInfo(id) {
    if (FACES[id] && !pinFailed.has(id)) return { u: FACES[id].u, f: commonsPage(FACES[id].u) };
    return apiInfo(id);
  }
  const fetchImg = (url) => new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(null), 12000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.decoding = 'async';
    img.alt = '';
    img.src = url;
  });
  function loadImage(id) {
    if (failedPhotos.has(id)) return Promise.resolve(null);
    if (imgPromises.has(id)) return imgPromises.get(id);
    const pr = (async () => {
      if (FACES[id] && !pinFailed.has(id)) {
        const img = await fetchImg(FACES[id].u);
        if (img) { img.pinned = true; return img; }
        pinFailed.add(id);
      }
      const info = await apiInfo(id).catch(() => null);
      return info ? fetchImg(info.u) : null;
    })().then((img) => { if (!img) { failedPhotos.add(id); imgPromises.delete(id); } return img; });
    imgPromises.set(id, pr);
    return pr;
  }

  PS.Photos = { FACES, failedPhotos, pinFailed, photoInfo, loadImage };
})();
