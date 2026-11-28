// Small helpers used everywhere: storage, random numbers, rounding prices.
(() => {
  'use strict';
  window.MM = window.MM || {};

  const TAU = Math.PI * 2;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = (arr) => (Array.isArray(arr) ? arr[(Math.random() * arr.length) | 0] : arr);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function mulberry32(s) {
    return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hash = (n) => { const r = mulberry32(n * 9973 + 17); r(); return r(); };
  const vibrate = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch { /* ignore */ } };
  const stepFor = (fair) => (fair < 300 ? 5 : fair < 1000 ? 10 : fair < 5000 ? 50 : fair < 15000 ? 100 : 500);
  const niceUp = (x, st) => Math.ceil(x / st - 1e-9) * st;
  const niceDown = (x, st) => Math.floor(x / st + 1e-9) * st;

  MM.Util = { TAU, store, rand, clamp, lerp, pick, sleep, mulberry32, hash, vibrate, stepFor, niceUp, niceDown };
})();
