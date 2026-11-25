// Momo Rush rules. Pure: no DOM, no timers, no Math.random. The browser drives it with step(dt) and the
// action functions; a Node bot drives the exact same code for balance checks.
// Browser: window.MRRules. Node: module.exports.
(function (root) {
  'use strict';

  // ---------- seeded randomness ----------
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const sub = (seed, tag) => rng(hashStr(seed + '|' + tag));
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function weighted(r, w) {
    let sum = 0; for (const k in w) sum += w[k];
    let x = r() * sum;
    for (const k in w) { x -= w[k]; if (x <= 0) return k; }
    return Object.keys(w)[0];
  }
  function shuffle(r, a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------- numbers ----------
  const DAYS = 5;
  const START_CASH = 1000;
  const RENT = 1500;             // stall rent, due when the week ends
  const OVERHEAD = 120;          // gas + dough, every day
  const FILLS = ['buff', 'chicken', 'veg'];
  const COST = { buff: 65, chicken: 85, veg: 40 };      // one plate worth of filling at the bazaar
  const PRICE = { buff: 160, chicken: 190, veg: 130 };  // one plate at the stall
  const EXTRA = { steam: 0, jhol: 40, kothey: 40 };
  const MAX_STOCK = 14;
  const PLEATS = 3;
  const PASS = 4;
  const SLOTS = 3;
  const QUEUE_MAX = 3;
  const DECIDE_T = 10;
  const FEE = 400;    // the inspector's 'fee'
  const FINE = 1200;  // what a real inspector's office fines you if you wave him off
  const COOK = { raw: 4.5, perfect: 6.5, perfectEnd: 8.5, burn: 11 };
  const COOK_BIG = { raw: 4.5, perfect: 6.3, perfectEnd: 9.8, burn: 12.5 }; // the big steamer holds heat: wider gold window
  const FRY = { raw: 2.2, perfect: 3.2, perfectEnd: 4.8, burn: 7 };
  const DAY = [
    { len: 80, n: 6, fills: ['buff', 'veg'], styles: ['steam'], pat: 42, two: 0 },
    { len: 90, n: 9, fills: FILLS, styles: ['steam'], pat: 33, two: 0.1 },
    { len: 90, n: 11, fills: FILLS, styles: ['steam', 'jhol'], pat: 31, two: 0.12 },
    { len: 95, n: 12, fills: FILLS, styles: ['steam', 'jhol', 'kothey'], pat: 29, two: 0.15 },
    { len: 100, n: 14, fills: FILLS, styles: ['steam', 'jhol', 'kothey'], pat: 28, two: 0.18 },
  ];
  const STYLE_W = { steam: 1, jhol: 0.42, kothey: 0.38 };
  const BASE_MIX = { buff: 0.45, chicken: 0.3, veg: 0.25 };

  const RUMOURS = {
    futsal: { mix: { buff: 2.3 }, n: 1.1 },
    ekadashi: { mix: { veg: 2.8, buff: 0.4, chicken: 0.4 }, n: 1 },
    wedding: { mix: { chicken: 2.4 }, n: 1.1 },
    rain: { n: 0.78, style: { jhol: 2.6 }, minDay: 2 },
    results: { mix: { veg: 1.7 }, n: 1.3 },
    bandh: { n: 0.62 },
    tourists: { mix: { chicken: 2 }, n: 1.05 },
    payday: { n: 1.35 },
  };
  const SOURCES = { ward: 0.9, chiya: 0.6, tiktok: 0.4 };
  const REGULARS = { hari: 0.92, kanchha: 0.55, bunty: 0.12 };

  const UPGRADES = {
    steamer: { cost: 100 },  // a 4th steamer tier and a wider gold window
    bhai: { cost: 200 },     // helper folds slowly when the board is empty
    achar: { cost: 170 },    // timur achar: patience +20 %, bigger tips
    sign: { cost: 140 },     // painted signboard: +20 % customers
    gas: { cost: 100 },      // new regulator: steams 30 % faster
  };

  // ---------- week ----------
  function newWeek(seed, opts) {
    opts = opts || {};
    const r = sub(seed, 'week');
    // special customers: day 1 always the student (teaches the swipe), then two a day
    let bag;
    for (let tries = 0; tries < 50; tries++) {
      bag = shuffle(r, ['credit', 'credit', 'inspector', 'inspector', 'student', 'vlogger', 'vlogger', 'credit']);
      let ok = true;
      for (let d = 0; d < 4; d++) if (bag[d * 2] === bag[d * 2 + 1]) ok = false;
      if (ok) break;
    }
    // the vlogger's crowd boost lands tomorrow, so keep them off the last day
    for (const k of [6, 7]) {
      if (bag[k] !== 'vlogger') continue;
      for (let j = 0; j < 6; j++) {
        if (bag[j] === 'vlogger' || bag[j ^ 1] === 'vlogger' || bag[k ^ 1] === bag[j]) continue;
        bag[k] = bag[j]; bag[j] = 'vlogger'; break;
      }
    }
    const specials = [[{ type: 'student' }]];
    for (let d = 0; d < 4; d++) specials.push([{ type: bag[d * 2] }, { type: bag[d * 2 + 1] }]);
    specials.forEach((list, d) => list.forEach((s, i) => {
      s.id = 'sp' + d + i;
      s.at = (list.length === 1 ? 0.5 : i === 0 ? 0.22 + r() * 0.16 : 0.52 + r() * 0.18);
      if (s.type === 'credit') {
        s.who = pick(r, ['hari', 'hari', 'kanchha', 'bunty', 'bunty']);
        s.pays = r() < REGULARS[s.who];
        s.delay = 1 + Math.floor(r() * 2);
      } else if (s.type === 'inspector') {
        s.real = r() < 0.5;
        const honestTell = r() < 0.8;
        s.tell = s.real === honestTell ? 'badge' : 'shades';
      } else if (s.type === 'student') {
        s.gang = r() < 0.75;
      } else if (s.type === 'vlogger') {
        s.big = r() < 0.5;
      }
    }));
    return {
      v: 1, seed: String(seed), daily: !!opts.daily, tutorial: opts.tutorial !== false,
      day: 0, cash: START_CASH, tips: 0, rep: 3,
      upg: {}, credit: [], boost: 1, gang: 0, specials, reports: [],
      stats: { sold: { buff: 0, chicken: 0, veg: 0 }, style: { steam: 0, jhol: 0, kothey: 0 }, perfect: 0, burnt: 0,
        angry: 0, turned: 0, spoiled: 0, free: 0, udharoGiven: 0, udharoBack: 0, fees: 0, fines: 0, revenue: 0, tipsEarned: 0 },
      done: false,
    };
  }

  function repMult(rep) { return 0.75 + 0.08 * rep; }

  // what the day will look like; the rumour is what the player sees, `actual` is what really happens
  function dayPlan(week, d) {
    const r = sub(week.seed, 'plan' + d);
    const cfg = DAY[d];
    let rumour = null; let source = null; let truth = true;
    if (d > 0) {
      const ids = Object.keys(RUMOURS).filter((k) => (RUMOURS[k].minDay || 0) <= d);
      rumour = pick(r, ids);
      source = pick(r, Object.keys(SOURCES));
      truth = r() < SOURCES[source];
    } else { r(); r(); r(); }
    const eff = truth && rumour ? RUMOURS[rumour] : {};
    const mix = {};
    cfg.fills.forEach((f) => { mix[f] = BASE_MIX[f] * ((eff.mix && eff.mix[f]) || 1); });
    const styles = {};
    cfg.styles.forEach((s) => { styles[s] = STYLE_W[s] * ((eff.style && eff.style[s]) || 1); });
    // a fixed pool; how many of them come depends on reputation, boosts and upgrades
    const pool = [];
    for (let i = 0; i < 34; i++) {
      // arrivals: spread out, with a rush bump around 55-80 % of the day
      const u = r() < 0.55 ? r() : clamp(0.67 + (r() + r() + r() - 1.5) * 0.18, 0, 1);
      pool.push({
        u, fill: weighted(r, mix), style: weighted(r, styles), qty: r() < cfg.two ? 2 : 1,
        look: Math.floor(r() * 1e6), jit: 0.85 + r() * 0.3,
      });
    }
    const count = Math.round(cfg.n * (eff.n || 1) * repMult(week.rep) * (week.upg.sign ? 1.2 : 1) * week.boost) + week.gang;
    return { d, cfg, rumour, source, truth, mix, styles, pool, count: clamp(count, 3, pool.length) };
  }

  function stockCost(stock) { return FILLS.reduce((s, f) => s + (stock[f] || 0) * COST[f], 0); }
  function suggestStock(week, plan) {
    // what a careful shopkeeper buys if they believe the rumour; used for day 1 and the bot
    const out = { buff: 0, chicken: 0, veg: 0 };
    let sum = 0; for (const f in plan.mix) sum += plan.mix[f];
    const plates = Math.round(plan.count * (1 + plan.cfg.two * 0.6) * 1.05);
    for (const f in plan.mix) out[f] = Math.min(MAX_STOCK, Math.round((plates * plan.mix[f]) / sum));
    return out;
  }

  // ---------- service ----------
  function startDay(week, stock) {
    const d = week.day;
    const plan = dayPlan(week, d);
    const cfg = plan.cfg;
    const cost = stockCost(stock);
    week.cash -= cost;
    // the tutorial order is buff, or veg if the player bought no buff; with nothing bought there is no tutorial
    const tutFill = d === 0 && week.tutorial ? (stock.buff > 0 ? 'buff' : cfg.fills.find((f) => stock[f] > 0) || null) : null;
    const tut = !!tutFill;
    const patMul = (week.upg.achar ? 1.2 : 1);
    const custs = plan.pool.slice(0, plan.count).map((p, i) => ({
      id: 'c' + d + '-' + i, at: 2 + p.u * (cfg.len - 16), fill: p.fill, style: p.style, qty: p.qty, look: p.look,
      patMax: cfg.pat * p.jit * patMul * (p.qty === 2 ? 1.25 : 1), special: null,
    }));
    if (tut) { // first customer: a buff plate, waiting right at the counter
      custs.sort((a, b) => a.at - b.at);
      custs[0].at = 0.5; custs[0].fill = tutFill; custs[0].style = 'steam'; custs[0].qty = 1;
      for (let i = 1; i < custs.length; i++) custs[i].at = Math.max(custs[i].at, 6 + i * 2);
    }
    week.specials[d].forEach((s, i) => {
      const r = sub(week.seed, 'sp' + d + i);
      const fill = pick(r, cfg.fills);
      custs.push({
        id: s.id, at: s.at * cfg.len, fill: s.type === 'student' ? 'any' : fill, style: s.type === 'vlogger' ? pick(r, cfg.styles) : 'steam',
        qty: s.type === 'credit' ? 2 : 1, look: Math.floor(r() * 1e6), patMax: cfg.pat * 1.1 * patMul * (s.type === 'credit' ? 1.3 : 1),
        special: Object.assign({}, s, { decided: null }),
      });
    });
    custs.sort((a, b) => a.at - b.at);
    // nobody likes an empty street: on a normal day the first plain customer turns up within a few seconds
    if (!tut) { const first = custs.find((c) => !c.special); if (first && first.at > 3.5) first.at = 3.5; custs.sort((a, b) => a.at - b.at); }
    const tiers = week.upg.steamer ? 4 : 3;
    return {
      d, len: cfg.len, t: 0, over: false, closing: false, fills: cfg.fills.slice(), styles: cfg.styles.slice(),
      tut: tut ? 'pick' : null, tutFill,
      stock: { buff: stock.buff || 0, chicken: stock.chicken || 0, veg: stock.veg || 0 },
      bought: { buff: stock.buff || 0, chicken: stock.chicken || 0, veg: stock.veg || 0 }, cost,
      sel: cfg.fills[0], board: { fill: null, pleats: 0, ready: false }, helperT: 0, picked: false,
      tiers: Array.from({ length: tiers }, () => null),
      pass: Array.from({ length: PASS }, () => null), tawa: null,
      slots: Array.from({ length: SLOTS }, () => null), queue: [], pending: custs,
      speed: week.upg.gas ? 1.3 : 1, cook: week.upg.steamer ? COOK_BIG : COOK, bhai: !!week.upg.bhai, acharUp: !!week.upg.achar,
      rep: week.rep, repStart: week.rep,
      take: 0, tips: 0, plateId: 0,
      today: { served: 0, plates: 0, perfect: 0, burnt: 0, angry: 0, turned: 0, soldout: 0, walkby: 0, wrong: 0, binned: 0, noAchar: 0,
        sold: { buff: 0, chicken: 0, veg: 0 }, style: { steam: 0, jhol: 0, kothey: 0 } },
      specials: [], ev: [],
    };
  }

  const emit = (s, type, o) => { const e = Object.assign({ type }, o || {}); s.ev.push(e); return e; };
  const plateStyle = (p) => (p.jhol ? 'jhol' : p.kothey ? 'kothey' : 'steam');
  function cookQ(t, C) {
    if (t >= C.burn) return 'burnt';
    if (t >= C.perfect && t < C.perfectEnd) return 'perfect';
    if (t >= C.perfectEnd) return 'soggy';
    return 'ok';
  }
  function frac(c) { return clamp(c.pat / c.patMax, 0, 1); }
  function mood(c) {
    if (c.special && c.special.decided === null && c.state === 'slot') return 'ask';
    const f = frac(c);
    return f > 0.6 ? 'happy' : f > 0.36 ? 'foot' : f > 0.16 ? 'frown' : 'phone';
  }

  function pipelineHas(s, fill) {
    if (s.board.fill === fill) return true;
    if (s.tiers.some((t) => t && t.fill === fill)) return true;
    if (s.pass.some((p) => p && p.fill === fill && p.q !== 'burnt')) return true;
    return !!(s.tawa && s.tawa.plate.fill === fill);
  }

  function seat(s, c, i) {
    c.state = 'slot'; c.slot = i; s.slots[i] = c; c.seatT = s.t;
    emit(s, 'arrive', { slot: i, id: c.id, special: c.special && c.special.type });
    if (c.special) { c.dec = DECIDE_T; emit(s, 'special', { slot: i, id: c.id, kind: c.special.type }); }
  }

  function leave(s, c, why) {
    if (c.state === 'gone') return;
    const i = s.slots.indexOf(c);
    if (i >= 0) s.slots[i] = null;
    const q = s.queue.indexOf(c);
    if (q >= 0) s.queue.splice(q, 1);
    c.state = 'gone';
    if (why === 'angry') {
      s.today.angry++; s.rep -= 0.2;
      const sp = c.special;
      if (sp && sp.yes && sp.type === 'student') s.rep -= 0.1;
      if (sp && sp.type === 'vlogger') sp.result = 'bad';
    }
    if (why === 'soldout') { s.today.turned++; s.today.soldout++; s.rep -= 0.04; }
    emit(s, 'leave', { slot: i, id: c.id, why, fill: c.fill });
  }

  function step(s, dt) {
    if (s.over) return s;
    const tutPaused = s.tut && s.tut !== 'done';
    // cooking always runs
    s.tiers.forEach((tr, i) => {
      if (!tr) return;
      const K = s.cook;
      const before = cookQ(tr.t, K);
      tr.t += dt * s.speed;
      const now = cookQ(tr.t, K);
      if (tr.t >= K.raw && tr.t - dt * s.speed < K.raw) emit(s, 'cooked', { tier: i });
      if (now !== before) emit(s, 'tier-' + now, { tier: i });
    });
    if (s.tawa) {
      const tw = s.tawa; const before = cookQ(tw.t, FRY);
      tw.t += dt;
      const now = cookQ(tw.t, FRY);
      if (tw.t >= FRY.raw && tw.t - dt < FRY.raw) emit(s, 'fried', {});
      if (now !== before) emit(s, 'tawa-' + now, {});
    }
    if (s.bhai && !s.board.ready) {
      // bhai folds for the longest-waiting order nobody is cooking yet
      // a filling the player tapped wins over bhai's own guess
      const f = s.board.pleats > 0 ? s.board.fill : s.picked && s.stock[s.sel] > 0 ? s.sel : bhaiPick(s);
      if (f) {
        s.helperT += dt;
        if (s.helperT >= 2.4) { s.helperT = 0; if (s.board.pleats === 0 && !s.picked) s.sel = f; pleat(s, true); }
      } else s.helperT = 0;
    }
    if (tutPaused && s.stock[s.tutFill] <= 0 && !tutPlateLeft(s)) {
      // the tutorial order can no longer be made (plate binned, filling gone): let the day run normally
      s.tut = 'done'; emit(s, 'tut-skip', {});
    }
    if (tutPaused && s.tut !== 'done') {
      // only the first customer, frozen, until the tutorial order is served
      while (s.pending.length && s.pending[0].at <= 0.5 && !s.slots[1]) { const c = s.pending.shift(); c.pat = c.patMax; seat(s, c, 1); }
      return s;
    }
    s.t += dt;
    if (!s.closing && s.t >= s.len - 0.0001) {
      s.closing = true; s.over = true;
      s.slots.forEach((c) => c && leave(s, c, 'closed'));
      s.queue.slice().forEach((c) => leave(s, c, 'closed'));
      s.pending.length = 0;
      emit(s, 'close', {});
      return s;
    }
    // arrivals
    while (s.pending.length && s.pending[0].at <= s.t) {
      const c = s.pending.shift();
      c.pat = c.patMax;
      const free = s.slots.indexOf(null);
      if (free >= 0 && !s.queue.length) seat(s, c, pickSlot(s));
      else if (s.queue.length < QUEUE_MAX) { c.state = 'queue'; s.queue.push(c); emit(s, 'queue', { id: c.id }); }
      else { s.today.turned++; s.today.walkby++; emit(s, 'walkby', { id: c.id }); }
    }
    while (s.queue.length && s.slots.indexOf(null) >= 0) seat(s, s.queue.shift(), pickSlot(s));
    // patience
    const ask = asking(s);
    for (const c of s.queue) { c.pat -= dt * 0.5; if (c.pat <= 0) { leave(s, c, 'angry'); break; } }
    s.slots.forEach((c) => {
      if (!c) return;
      if (c.special && c.special.decided === null) {
        if (c !== ask) return; // waits for the card in front to be answered
        c.dec -= dt;
        if (c.dec <= 0) decide(s, c.slot, false, true);
        return;
      }
      if (c.fill !== 'any' && s.stock[c.fill] <= 0 && !pipelineHas(s, c.fill) && s.t - c.seatT > 1.2) { leave(s, c, 'soldout'); return; }
      const m0 = mood(c);
      c.pat -= dt;
      if (c.pat <= 0) { leave(s, c, 'angry'); return; }
      const m1 = mood(c);
      if (m1 !== m0) emit(s, 'mood', { slot: c.slot, mood: m1 });
    });
    return s;
  }
  function tutPlateLeft(s) {
    const f = s.tutFill;
    if (s.board.fill === f) return true;
    if (s.tiers.some((t) => t && t.fill === f)) return true;
    if (s.pass.some((p) => p && p.fill === f)) return true;
    return !!(s.tawa && s.tawa.plate.fill === f);
  }
  // the special customer whose card is on screen: one at a time, first seated first
  function asking(s) {
    let a = null;
    for (const c of s.slots) if (c && c.special && c.special.decided === null && (!a || c.seatT < a.seatT)) a = c;
    return a;
  }
  function bhaiPick(s) {
    const have = {};
    const add = (f) => { have[f] = (have[f] || 0) + 1; };
    s.tiers.forEach((t) => t && add(t.fill));
    s.pass.forEach((p) => p && p.q !== 'burnt' && add(p.fill));
    if (s.tawa) add(s.tawa.plate.fill);
    const waiting = s.slots.filter((c) => c && !(c.special && c.special.decided === null)).sort((a, b) => a.pat - b.pat).concat(s.queue);
    for (const c of waiting) {
      if (c.fill === 'any') continue;
      const n = c.qty - (c.served || 0);
      if ((have[c.fill] || 0) >= n) { have[c.fill] -= n; continue; }
      if (s.stock[c.fill] > 0) return c.fill;
    }
    return null;
  }
  function pickSlot(s) {
    // middle first, then the sides, so the counter fills naturally
    for (const i of [1, 0, 2]) if (!s.slots[i]) return i;
    return s.slots.indexOf(null);
  }

  // ---------- actions (each returns true if it did something) ----------
  function select(s, f) {
    if (s.fills.indexOf(f) < 0) return false;
    if (s.board.pleats > 0 && s.board.fill !== f) { emit(s, 'nope', { why: 'boardBusy' }); return false; }
    // the tutorial order needs its own filling; anything else would leave the first customer stuck
    if (s.tut && s.tut !== 'done' && s.tutFill && f !== s.tutFill && s.board.pleats === 0) { emit(s, 'nope', { why: 'tutWrong', fill: s.tutFill }); return false; }
    s.sel = f; s.picked = true; if (s.board.pleats === 0) s.helperT = 0; emit(s, 'select', { fill: f });
    if (s.tut === 'pick' && f === s.tutFill) s.tut = 'fold';
    return true;
  }
  function pleat(s, byBhai) {
    const b = s.board;
    if (b.ready) { if (!byBhai) emit(s, 'nope', { why: 'boardFull' }); return false; }
    if (s.tut === 'pick' && !byBhai) { emit(s, 'nope', { why: 'pickFirst' }); return false; }
    if (b.pleats === 0) {
      if (s.stock[s.sel] <= 0) { if (!byBhai) emit(s, 'nope', { why: 'noStock', fill: s.sel }); return false; }
      s.stock[s.sel]--; b.fill = s.sel;
    }
    b.pleats++;
    emit(s, 'pleat', { n: b.pleats, bhai: !!byBhai });
    if (b.pleats >= PLEATS) { b.ready = true; emit(s, 'folded', { fill: b.fill }); if (s.tut === 'fold') s.tut = 'steam'; }
    return true;
  }
  function load(s, i) {
    if (i < 0 || i >= s.tiers.length || s.tiers[i]) return false;
    if (!s.board.ready) { emit(s, 'nope', { why: 'nothingFolded' }); return false; }
    s.tiers[i] = { fill: s.board.fill, t: 0 };
    s.board = { fill: null, pleats: 0, ready: false }; s.picked = false;
    emit(s, 'load', { tier: i });
    if (s.tut === 'steam') s.tut = 'wait';
    return true;
  }
  function pull(s, i) {
    const tr = s.tiers[i];
    if (!tr) return false;
    if (tr.t < s.cook.raw) { emit(s, 'nope', { why: 'raw', tier: i }); return false; }
    const slot = s.pass.indexOf(null);
    if (slot < 0) { emit(s, 'nope', { why: 'passFull', tier: i }); return false; }
    const q = cookQ(tr.t, s.cook);
    const p = { id: ++s.plateId, fill: tr.fill, q, fq: null, achar: false, jhol: false, kothey: false };
    s.pass[slot] = p; s.tiers[i] = null;
    if (q === 'burnt') s.today.burnt++;
    emit(s, 'pull', { tier: i, slot, q });
    if (s.tut === 'wait' || s.tut === 'pull') s.tut = 'achar';
    return true;
  }
  function tierTap(s, i) {
    if (!s.tiers[i]) return load(s, i);
    return pull(s, i);
  }
  function achar(s, slot) {
    const p = s.pass[slot];
    if (!p || p.achar || p.jhol) return false;
    p.achar = true; emit(s, 'achar', { slot });
    if (s.tut === 'achar') s.tut = 'serve';
    return true;
  }
  function jhol(s, slot) {
    const p = s.pass[slot];
    if (!p || p.jhol || p.kothey || s.styles.indexOf('jhol') < 0) return false;
    p.jhol = true; emit(s, 'jhol', { slot });
    return true;
  }
  function fry(s, slot) {
    const p = s.pass[slot];
    if (!p || s.tawa || p.jhol || p.kothey || s.styles.indexOf('kothey') < 0) return false;
    s.tawa = { plate: p, t: 0 }; s.pass[slot] = null;
    emit(s, 'fry', { slot });
    return true;
  }
  function unfry(s) {
    if (!s.tawa) return false;
    if (s.tawa.t < FRY.raw) { emit(s, 'nope', { why: 'rawFry' }); return false; }
    const slot = s.pass.indexOf(null);
    if (slot < 0) { emit(s, 'nope', { why: 'passFull' }); return false; }
    const p = s.tawa.plate; p.kothey = true; p.fq = cookQ(s.tawa.t, FRY);
    s.pass[slot] = p; s.tawa = null;
    emit(s, 'unfry', { slot, q: p.fq });
    return true;
  }
  function bin(s, slot) {
    if (!s.pass[slot]) return false;
    s.pass[slot] = null; s.today.binned++; emit(s, 'bin', { slot });
    return true;
  }

  function matches(c, p) {
    if (c.fill !== 'any' && c.fill !== p.fill) return false;
    if (c.fill === 'any') return true;
    return plateStyle(p) === c.style;
  }

  function serve(s, slot, ci) {
    const p = s.pass[slot]; const c = s.slots[ci];
    if (!p || !c) return false;
    if (c.special && c.special.decided === null) { emit(s, 'nope', { why: 'decideFirst', slot: ci }); return false; }
    if (c.special && !c.special.yes && c.special.type !== 'vlogger') return false;
    if (!matches(c, p)) { s.today.wrong++; emit(s, 'wrong', { slot: ci, plate: slot }); return false; }
    s.pass[slot] = null;
    const style = plateStyle(p);
    const base = PRICE[p.fill] + EXTRA[style];
    const f = frac(c);
    const sauce = style === 'jhol' || p.achar;
    const worst = p.q === 'burnt' || p.fq === 'burnt' ? 'burnt' : p.q;
    const perfect = p.q === 'perfect' && (!p.kothey || p.fq === 'perfect');
    const sp = c.special;
    const free = !!(sp && sp.yes);
    let pay = base; let tip = 0; let rep = 0; let face = 'yum';
    if (worst === 'burnt') { pay = Math.round(base * 0.5); rep = -0.25; face = 'yuck'; }
    else {
      tip = Math.round(f * 25) + (perfect ? 20 : 0) + (sauce ? (s.acharUp ? 15 : 5) : 0);
      rep = perfect ? 0.05 : 0.025;
      if (!sauce) { tip = 0; rep = -0.04; face = 'meh'; s.today.noAchar++; }
      if (worst === 'soggy' || p.fq === 'soggy') { tip = Math.round(tip / 2); face = face === 'yum' ? 'ok' : face; }
    }
    if (free) {
      if (sp.type === 'credit') { sp.owed = (sp.owed || 0) + base; }
      pay = 0; tip = 0;
    }
    s.take += pay; s.tips += tip; s.rep += rep;
    s.today.plates++; s.today.sold[p.fill]++; s.today.style[style]++;
    if (perfect) s.today.perfect++;
    c.served = (c.served || 0) + 1;
    if (sp && sp.type === 'vlogger') sp.result = worst === 'burnt' ? 'bad' : perfect && sauce && f > 0.3 ? 'perfect' : 'ok';
    if (sp && sp.type === 'student') { sp.result = 'fed'; s.rep += 0.12; }
    emit(s, 'serve', { slot: ci, plate: slot, pay, tip, face, perfect, free: !!free, fill: p.fill });
    if (s.tut === 'serve' || s.tut === 'achar') s.tut = 'done';
    if (c.served >= c.qty) {
      s.today.served++;
      const i = s.slots.indexOf(c); if (i >= 0) s.slots[i] = null;
      c.state = 'gone';
      emit(s, 'leave', { slot: ci, id: c.id, why: 'happy', face });
    } else {
      c.pat = Math.min(c.patMax, c.pat + c.patMax * 0.3);
    }
    return true;
  }

  // swipe right = accept, left = refuse
  function decide(s, ci, yes, timeout) {
    const c = s.slots[ci];
    if (!c || !c.special || c.special.decided !== null) return false;
    const sp = c.special; sp.decided = true; sp.yes = !!yes; sp.timeout = !!timeout;
    s.specials.push(sp);
    emit(s, 'decide', { slot: ci, kind: sp.type, yes: !!yes, timeout: !!timeout });
    c.pat = c.patMax;
    if (sp.type === 'inspector') {
      if (yes) { s.take -= FEE; sp.paid = FEE; }
      leave(s, c, 'done');
      return true;
    }
    if (!yes) {
      if (sp.type === 'credit') s.rep -= 0.15;
      if (sp.type === 'student') s.rep -= 0.05;
      if (sp.type === 'vlogger') return true; // he still orders, and pays
      leave(s, c, 'done');
    }
    return true;
  }

  // ---------- end of day ----------
  function endDay(week, s) {
    const d = s.d;
    const rep0 = week.rep;
    const lines = [];
    const spoiledPlates = FILLS.reduce((n, f) => n + s.stock[f], 0) + (s.board.fill ? 1 : 0);
    const spoiled = FILLS.reduce((n, f) => n + s.stock[f] * COST[f], 0) + (s.board.fill ? COST[s.board.fill] : 0);
    let cash = s.take - OVERHEAD;
    // specials
    let boost = 1; let gang = 0;
    const notes = [];
    for (const sp of s.specials) {
      if (sp.type === 'credit') {
        if (sp.yes && sp.owed) {
          week.credit.push({ who: sp.who, amount: sp.owed, day: d, pays: sp.pays, payDay: Math.min(d + sp.delay, DAYS - 1) });
          week.stats.udharoGiven += sp.owed;
          notes.push({ k: 'creditGiven', who: sp.who, amount: sp.owed });
        } else if (!sp.yes) notes.push({ k: 'creditNo', who: sp.who });
        else notes.push({ k: 'creditLeft', who: sp.who });
      } else if (sp.type === 'inspector') {
        if (sp.yes) {
          week.stats.fees += FEE;
          notes.push({ k: sp.real ? 'inspRealPaid' : 'inspFakePaid', amount: FEE });
        } else if (sp.real) { cash -= FINE; week.stats.fines += FINE; notes.push({ k: 'inspRealNo', amount: FINE }); }
        else notes.push({ k: 'inspFakeNo' });
      } else if (sp.type === 'student') {
        if (sp.yes && sp.result === 'fed') {
          week.stats.free++;
          if (sp.gang && d < DAYS - 1) gang += 3;
          notes.push({ k: sp.gang && d < DAYS - 1 ? 'studentGang' : 'studentFed' });
        } else if (sp.yes) notes.push({ k: 'studentLeft' });
        else notes.push({ k: 'studentNo' });
      } else if (sp.type === 'vlogger') {
        const free = sp.yes;
        const res = sp.result || 'bad';
        const big = sp.big ? 1 : 0.5;
        let b = res === 'perfect' ? (free ? 0.5 : 0.22) : res === 'ok' ? (free ? 0.15 : 0.06) : -0.2;
        if (b > 0) b *= big;
        boost *= 1 + b;
        if (res === 'bad') week.rep -= 0.2;
        if (free) week.stats.free++;
        notes.push({ k: 'vlog_' + res, big: sp.big, free, pct: Math.round(b * 100) });
      }
    }
    // paybacks that fall due today
    week.credit.forEach((cr) => {
      if (cr.settled || cr.payDay !== d) return;
      if (cr.pays) {
        const extra = Math.round(cr.amount * 0.2);
        cash += cr.amount + extra; cr.settled = true; week.stats.udharoBack += cr.amount;
        notes.push({ k: 'paidBack', who: cr.who, amount: cr.amount + extra });
      } else { cr.ghost = true; notes.push({ k: 'noShow', who: cr.who, amount: cr.amount }); }
    });

    week.cash += cash;
    week.tips += s.tips;
    week.rep = clamp(rep0 + (s.rep - s.repStart) + (week.rep - rep0), 0, 5);
    week.boost = boost; week.gang = gang;
    const st = week.stats;
    FILLS.forEach((f) => { st.sold[f] += s.today.sold[f]; });
    for (const k in s.today.style) st.style[k] += s.today.style[k];
    st.perfect += s.today.perfect; st.burnt += s.today.burnt; st.angry += s.today.angry; st.turned += s.today.turned;
    st.spoiled += spoiled; st.revenue += s.take; st.tipsEarned += s.tips;
    const report = {
      d, take: s.take, tips: s.tips, overhead: OVERHEAD, cost: s.cost, spoiled, spoiledPlates, net: cash - s.cost,
      repFrom: rep0, repTo: week.rep, today: s.today, notes, boost, gang, cash: week.cash, bought: s.bought, left: Object.assign({}, s.stock),
    };
    week.reports.push(report);
    week.day = d + 1;
    if (week.day >= DAYS) finishWeek(week);
    return report;
  }

  function offerUpgrades(week) {
    const r = sub(week.seed, 'upg' + week.day);
    const left = Object.keys(UPGRADES).filter((k) => !week.upg[k]);
    return shuffle(r, left).slice(0, 3).map((id) => ({ id, cost: UPGRADES[id].cost, afford: week.tips >= UPGRADES[id].cost }));
  }
  function buyUpgrade(week, id) {
    const u = UPGRADES[id];
    if (!u || week.upg[id] || week.tips < u.cost) return false;
    week.tips -= u.cost; week.upg[id] = true;
    return true;
  }

  function finishWeek(week) {
    const unpaid = week.credit.filter((c) => !c.settled).reduce((n, c) => n + c.amount, 0);
    const final = week.cash + week.tips - RENT;
    const profit = final - START_CASH;
    week.done = true;
    week.result = {
      final, profit, rent: RENT, unpaid, stars: Math.round(week.rep * 2) / 2, rentOk: final >= 0,
      title: titleFor(week, profit, unpaid),
    };
    return week.result;
  }

  function titleFor(week, profit, unpaid) {
    const st = week.stats;
    if (week.cash + week.tips - RENT < 0) return 'rentDue';
    if (unpaid >= 600) return 'udharo';
    if (st.burnt >= 6 && st.burnt * 2 >= st.perfect) return 'burnt';
    if (profit >= 2500) {
      if (st.style.jhol >= 8 && st.style.jhol >= st.sold.buff * 0.5) return 'jhol';
      const top = FILLS.slice().sort((a, b) => st.sold[b] - st.sold[a])[0];
      return 'king_' + top;
    }
    if (profit >= 900) return st.perfect >= 20 ? 'perfect' : 'steady';
    if (st.free >= 3) return 'daani'; // gave plates away and it showed in the till
    if (profit >= 0) return 'survivor';
    return 'loss';
  }

  // ---------- daily seed ----------
  const EPOCH = Date.UTC(2026, 10, 1);
  function dailyKey(date) {
    const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const dd = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }
  function dailyNumber(date) {
    const t = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((t - EPOCH) / 86400000) + 1;
  }

  const API = {
    hashStr, rng, sub, clamp,
    DAYS, START_CASH, RENT, FEE, FINE, OVERHEAD, FILLS, COST, PRICE, EXTRA, MAX_STOCK, PLEATS, PASS, SLOTS, QUEUE_MAX, DECIDE_T,
    COOK, COOK_BIG, FRY, DAY, RUMOURS, SOURCES, REGULARS, UPGRADES,
    newWeek, dayPlan, stockCost, suggestStock, startDay, step, endDay, offerUpgrades, buyUpgrade, finishWeek,
    select, pleat, load, pull, tierTap, achar, jhol, fry, unfry, bin, serve, decide,
    cookQ, frac, mood, matches, plateStyle, asking, dailyKey, dailyNumber,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.MRRules = API;
})(this);
