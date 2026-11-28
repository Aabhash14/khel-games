// Shared constants, palettes and small helpers (storage, maths, colour). Loaded first.
(() => {
  'use strict';
  const CC = (window.CC = window.CC || {});

  const TAU = Math.PI * 2;
  const FONT = '"Nirmala UI", "Noto Sans Devanagari", "Kohinoor Devanagari", Mangal, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const FLAG = ['#1f6fd1', '#f4f4f4', '#e23b3b', '#2e9e5b', '#f5c518']; // prayer flag order
  const PLAYER_PAL = ['#dc143c', '#003893', '#ffffff'];                  // Nepal flag colours
  const RIVAL_PALS = [
    ['#1f6fd1', '#ffffff', '#f5c518'],
    ['#2e9e5b', '#f5c518', '#e23b3b'],
    ['#f5c518', '#2e9e5b', '#1f6fd1'],
    ['#7b3fa0', '#ffffff', '#f5c518'],
    ['#ff7a00', '#1f6fd1', '#ffffff'],
    ['#00a6a6', '#f5c518', '#7b3fa0'],
  ];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  function mulberry32(s) {
    return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})`; };
  const vibrate = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch { /* ignore */ } };

  CC.Util = { TAU, FONT, reduceMotion, FLAG, PLAYER_PAL, RIVAL_PALS, store, rand, clamp, lerp, pick, mulberry32, hex, mix, vibrate };
})();
