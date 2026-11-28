/* Pro Scout — sticker album: saved cards and the album screen. */
(() => {
  'use strict';

  window.PS = window.PS || {};
  const { SPORTS, PLAYERS } = window.PS_DATA;
  const { BY, $, esc, store, flag } = PS.Core;
  const { photoFrame } = PS.Draw;

  // ---------- Album ----------
  const ALBUM_KEY = 'ps-album';
  let album = store.get(ALBUM_KEY, {}); // id -> 1 (card) | 2 (gold)
  function collect(id, gold) {
    const before = album[id] || 0, now = Math.max(before, gold ? 2 : 1);
    album[id] = now; store.set(ALBUM_KEY, album);
    return { isNew: !before, upgraded: before === 1 && now === 2 };
  }
  const albumCount = () => Object.keys(album).filter((k) => BY[k]).length;

  // ---------- Album screen ----------
  let albumFilter = 'all';
  let albumIO = null; // photo lazy-loader from the last render, disconnected on re-render
  function renderAlbum() {
    const n = albumCount(), golds = Object.values(album).filter((v) => v === 2).length;
    $('albumSummary').textContent = `${n} of ${PLAYERS.length} cards · ${golds} gold`;
    const sports = Object.keys(SPORTS).filter((s) => PLAYERS.some((p) => p.s === s));
    const filters = [['all', 'All'], ...sports.map((s) => [s, SPORTS[s].name])];
    $('albumFilters').innerHTML = filters.map(([k, label]) => {
      const total = k === 'all' ? PLAYERS.length : PLAYERS.filter((p) => p.s === k).length;
      const have = k === 'all' ? n : PLAYERS.filter((p) => p.s === k && album[p.id]).length;
      return `<button type="button" data-f="${k}" aria-pressed="${albumFilter === k}">${esc(label)} ${have}/${total}</button>`;
    }).join('');
    $('albumFilters').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { albumFilter = b.dataset.f; renderAlbum(); }));

    const grid = $('albumGrid');
    grid.innerHTML = '';
    const order = PLAYERS.map((p, idx) => ({ p, idx })).sort((a, b) => (album[b.p.id] || 0) - (album[a.p.id] || 0) || a.idx - b.idx);
    order.forEach(({ p, idx }) => {
      if (albumFilter !== 'all' && p.s !== albumFilter) return;
      const have = album[p.id];
      const el = document.createElement('div');
      el.className = 'sticker' + (have === 2 ? ' gold' : '') + (have ? '' : ' empty');
      if (have) {
        el.innerHTML = `<div data-photo="${p.id}"></div><div class="cap"><div class="nm">${esc(p.n)}</div><div class="meta">${flag(p.c)} ${esc(SPORTS[p.s].name)}</div></div>`;
      } else {
        el.innerHTML = `<div class="photo-frame"></div><span class="num">#${String(idx + 1).padStart(3, '0')}</span><div class="cap"><div class="nm">???</div><div class="meta">${esc(SPORTS[p.s].name)}</div></div>`;
      }
      grid.appendChild(el);
    });
    // Load collected photos only when they scroll into view.
    if (albumIO) albumIO.disconnect();
    const io = albumIO = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); e.target.replaceWith(photoFrame(e.target.dataset.photo)); }
    }, { rootMargin: '200px' }) : null;
    grid.querySelectorAll('[data-photo]').forEach((ph) => { if (io) io.observe(ph); else ph.replaceWith(photoFrame(ph.dataset.photo)); });
  }

  PS.Album = { collect, albumCount, renderAlbum };
})();
