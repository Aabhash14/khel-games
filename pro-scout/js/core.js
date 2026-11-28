/* Pro Scout — shared helpers: player lookup, DOM/format helpers, storage, seeded randomness, data helpers, icons. */
(() => {
  'use strict';

  window.PS = window.PS || {};
  const { SPORTS, COUNTRIES, PLAYERS } = window.PS_DATA;
  const BY = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-US');
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- Storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  // ---------- Seeded randomness (same seed = same questions for everyone) ----------
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const shuffle = (rng, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (rng, arr) => arr[(rng() * arr.length) | 0];

  // ---------- Data helpers ----------
  const sex = (p) => p.g || 'm';
  const cName = (c) => COUNTRIES[c][0];
  const flag = (c, cls = '') => `<img class="flag ${cls}" src="https://flagcdn.com/w80/${COUNTRIES[c][2]}.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;
  const sportTag = (s) => `<span class="sport-tag" style="--sc:${SPORTS[s].color}">${esc(SPORTS[s].name)}</span>`;
  const clubsOf = (p) => new Set([...(p.path || []), ...(p.first ? [p.first] : []), ...(p.also || [])]);
  const UK = new Set(['ENG', 'WLS', 'GB']);
  const sameNation = (a, b) => a === b || (UK.has(a) && UK.has(b));
  const POS = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
  const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');

  // ---------- Icons ----------
  const ICON = {
    face: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><rect x="6.5" y="8" width="11" height="4" rx="1.2"/><path d="M8.5 10h1M14.5 10h1"/>',
    footy: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4z"/><path d="M12 3.5v4M16 10.4l4.2-1.4M14.5 15l2.6 3.6M9.5 15l-2.6 3.6M8 10.4L3.8 9"/>',
    sport: '<circle cx="10" cy="9" r="5.5"/><path d="M14 13l6 6.5"/><circle cx="18.5" cy="5.5" r="2"/>',
    country: '<path d="M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12"/>',
    first: '<path d="M8.5 3.5L3.5 6.5l2 4 2.5-1V20.5h8V9.5l2.5 1 2-4-5-3c-.5 1.7-2 2.7-3.5 2.7s-3-1-3.5-2.7z"/>',
    path: '<circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="5.5" r="2"/><path d="M7.5 18.5h6a3 3 0 0 0 0-6h-3a3 3 0 0 1 0-6h6"/>',
    nick: '<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M9 9.5v2M15 9.5v2"/>',
    older: '<path d="M6.5 3.5h11M6.5 20.5h11M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5"/>',
    year: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M8 17h2"/>',
    odd: '<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    club: '<path d="M12 3l8 3v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    number: '<path d="M9.5 3.5L7.5 20.5M16.5 3.5l-2 17M4.5 9h16M3.5 15h16"/>',
    position: '<rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M12 4.5v15"/><circle cx="12" cy="12" r="2.8"/><path d="M3 9.5h2.5v5H3M21 9.5h-2.5v5H21"/>',
    who: '<circle cx="12" cy="8" r="4.5"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5"/><path d="M10.6 6.6a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.8.6-.8 1.1M12 11.2v.1"/>',
    mix: '<path d="M3 7h3.5l9 10H21M3 17h3.5l2.8-3.1M14.7 10.1L17.5 7H21M18.5 4L21 7l-2.5 3M18.5 14l2.5 3-2.5 3"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

  PS.Core = { BY, $, esc, fmt, reduceMotion, store, mulberry32, shuffle, pick, sex, cName, flag, sportTag, clubsOf, sameNation, POS, initials, svg };
})();
