// A fresh bazaar for one attempt at a level: prices, each shop's stock, the shopping list and the budget.
(() => {
  'use strict';
  window.MM = window.MM || {};
  const { mulberry32, stepFor, niceUp } = MM.Util;
  const { ALL_TOLES, LEVELS, ITEMS, KEEPERS } = MM.Data;

  // ---------- Bazaar generation ----------
  function genWorld(seed, lv) {
    const LV = LEVELS[lv], open = ALL_TOLES.slice(0, LV.toles);
    const R = mulberry32(seed);
    const rr = (a, b) => a + R() * (b - a);
    const rsh = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const items = {};
    for (const [id, it] of Object.entries(ITEMS)) {
      const step = stepFor(it.fair), fair = niceUp(it.fair * rr(0.92, 1.08), step);
      items[id] = { fair, step, hint: niceUp(fair * rr(0.93, 1.07), step) };
    }
    const slots = {};
    const shops = Object.keys(KEEPERS).filter((id) => open.includes(KEEPERS[id].tole)).map((id) => {
      const K = KEEPERS[id], pos = (slots[K.tole] = (slots[K.tole] ?? -1) + 1);
      let sells = [...K.sells];
      if (sells.length > 2) sells = rsh(sells).slice(0, Math.max(2, Math.round(sells.length * rr(0.55, 1))));
      const listings = {};
      for (const it of sells) {
        listings[it] = { item: it, openK: rr(K.open[0], K.open[1]), floorK: rr(K.floor[0], K.floor[1]) + (LV.hard || 0), open: 0, ask: 0, patience: 0, pmax: 0, rounds: 0, lastOffer: 0, calledBack: false, seen: false, hist: [] };
      }
      const shop = { id, pos, tole: K.tole, sells, listings, bohaniAt: R() < 0.3 ? 0 : rr(25, 230), chatted: false, mood: false, regular: 0, kickedUntil: -1, bossCalled: false, bluffs: 0, met: false, stock: K.stock || 0, sales: [] };
      if (K.stock) shop.sales = Array.from({ length: K.stock }, () => rr(K.sales[0], K.sales[1])).sort((a, b) => a - b);
      return shop;
    });
    const sellers = (it) => shops.filter((s) => s.sells.includes(it));
    let cand = Object.keys(ITEMS).filter((it) => sellers(it).length >= 2);
    if (cand.length < LV.items) cand = Object.keys(ITEMS).filter((it) => sellers(it).length >= 1);
    const bigs = rsh(cand.filter((it) => ITEMS[it].big && it !== 'goat')), smalls = rsh(cand.filter((it) => !ITEMS[it].big));
    const list = [];
    if (LV.goat && cand.includes('goat')) list.push('goat');
    else if (LV.big && bigs.length) list.push(bigs.shift());
    for (const it of [...smalls, ...bigs]) { if (list.length >= LV.items) break; if (!list.includes(it)) list.push(it); }
    const budget = niceUp(list.reduce((s, it) => s + items[it].fair, 0) * 1.12, 500);
    return {
      seed, level: lv, items, shops, list, budget, money: budget, target: niceUp(budget * LV.stars[0], 50), minutes: 0, rep: LV.rep || 0, tole: 'asan', pos: -1, route: [], coached: false,
      bought: {}, notes: [], news: [], used: new Set(), earned: new Set(), closingWarned: false, lateWarned: false, kindDone: false,
      stats: { lies: 0, caught: 0, offers: 0 },
    };
  }

  MM.World = { genWorld };
})();
