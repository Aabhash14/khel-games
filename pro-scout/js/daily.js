/* Pro Scout — daily seed and number, challenge links, sharing. */
(() => {
  'use strict';

  window.PS = window.PS || {};
  const { $, fmt, store } = PS.Core;
  const { CAT, MODE_NAME } = PS.Questions;

  // ---------- Dates / daily ----------
  function todaySeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function dailyNumber(seed) {
    const y = Math.floor(seed / 10000), m = Math.floor(seed / 100) % 100, d = seed % 100;
    return Math.max(1, Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 10, 10)) / 864e5) + 1);
  }

  // ---------- Challenge links ----------
  function readChallenge() {
    const q = new URLSearchParams(location.search);
    const cat = q.get('cat'), seed = parseInt(q.get('seed'), 10);
    if (!cat || !(cat === 'daily' || cat === 'mix' || CAT[cat]) || !Number.isFinite(seed)) return null;
    const score = parseInt(q.get('score'), 10);
    return { cat, seed: seed >>> 0, score: Number.isFinite(score) ? score : null, by: (q.get('by') || '').slice(0, 20) };
  }

  // ---------- Sharing ----------
  function shareURL(mode, seed, score) {
    const u = new URL(location.href.split('?')[0].split('#')[0]);
    u.searchParams.set('cat', mode);
    u.searchParams.set('seed', String(seed));
    u.searchParams.set('score', String(score));
    const by = store.get('ps-name', '');
    if (by) u.searchParams.set('by', by);
    return u.toString();
  }
  function shareText(mode, seed, score, grid) {
    const title = mode === 'daily' ? `Daily Scout #${dailyNumber(seed)}` : MODE_NAME(mode);
    return { text: `Pro Scout · ${title} · ${fmt(score)} pts\n${grid}\nSame 10 questions, can you beat me?`, url: shareURL(mode, seed, score) };
  }
  async function share({ text, url }, btn) {
    const toast = $('rToast');
    try {
      if (navigator.share) { await navigator.share({ title: 'Pro Scout', text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      if (btn && btn.closest('#result')) toast.textContent = 'Copied! Paste it to a friend.';
      else if (btn) { const old = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = old; }, 1600); }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      if (btn && btn.closest('#result')) toast.textContent = url;
    }
  }

  PS.Daily = { todaySeed, dailyNumber, readChallenge, shareText, share };
})();
