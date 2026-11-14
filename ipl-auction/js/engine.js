// Auction state and the nine computer franchises. No DOM, no timers: main.js drives the clock.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { PLAYERS, TEAMS, teamById } = IPLA.data;
  const R = IPLA.rules;

  const P = PLAYERS;
  const ROLES = ['WK', 'BAT', 'AR', 'PACE', 'SPIN'];
  // What a computer team aims for in a 22-player squad.
  const TARGET = { WK: 2, BAT: 6, AR: 5, PACE: 6, SPIN: 3 };

  // ---------- seeded randomness (stable per game, per team, per player) ----------
  function h01(...keys) {
    let h = 2166136261;
    const s = keys.join('|');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return ((h >>> 0) + 0.5) / 4294967297;
  }
  function noise(seed, t, pid) {
    const u = h01(seed, t, pid, 'a'); const v = h01(seed, t, pid, 'b');
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.exp(0.26 * z);
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------- retention ----------
  function aiRetain(teamId) {
    const sq = P.filter((p) => p.team === teamId).sort((a, b) => b.r - a.r);
    const keep = [];
    const thr = [83, 84, 85, 87, 88];
    for (const p of sq.filter((x) => x.capped)) {
      const n = keep.length;
      if (n >= R.MAX_RETAIN_CAPPED) break;
      if (p.r >= thr[n]) keep.push(p);
    }
    let unc = 0;
    for (const p of sq.filter((x) => !x.capped)) {
      if (unc >= R.MAX_RETAIN_UNCAPPED || keep.length >= R.MAX_RETAIN) break;
      if (p.r >= 72) { keep.push(p); unc++; }
    }
    return keep;
  }

  // Price tag on each retained player (capped slabs go to the best player first).
  function retainedPrices(keep) {
    const capped = keep.filter((p) => p.capped).sort((a, b) => b.r - a.r);
    const out = capped.map((p, i) => ({ pid: p.id, price: R.RETAIN_COST_CAPPED[i], how: 'ret' }));
    for (const p of keep.filter((x) => !x.capped)) out.push({ pid: p.id, price: R.RETAIN_COST_UNCAPPED, how: 'ret' });
    return out;
  }

  // ---------- new game ----------
  // mode: 'rtm' (keep up to 6, the rest become RTM cards) or 'fresh' (every team starts empty, no RTM).
  function newGame(user, userKeepIds, seed = Math.floor(Math.random() * 1e9), mode = 'rtm') {
    const teams = {};
    const retained = new Set();
    for (const T of TEAMS) {
      const keep = mode === 'fresh' ? [] : T.id === user ? userKeepIds.map((id) => P[id]) : aiRetain(T.id);
      keep.forEach((p) => retained.add(p.id));
      const squad = retainedPrices(keep);
      teams[T.id] = { id: T.id, purse: R.PURSE - R.retentionCost(keep), squad, rtm: mode === 'fresh' ? 0 : R.MAX_RETAIN - keep.length };
    }
    const pool = P.filter((p) => !retained.has(p.id)).sort((a, b) => b.r - a.r);
    const sets = [];
    const lots = [];
    const pushSet = (key, capped, players) => {
      sets.push({ key, capped, n: players.length });
      players.forEach((p) => lots.push({ pid: p.id, set: sets.length - 1 }));
    };
    const marquee = pool.filter((p) => p.capped).slice(0, 12);
    const mSet = new Set(marquee.map((p) => p.id));
    pushSet('marquee', true, marquee.slice(0, 6));
    pushSet('marquee', true, marquee.slice(6));
    for (const capped of [true, false]) {
      const size = capped ? 8 : 10;
      const byRole = Object.fromEntries(ROLES.map((r) => [r, pool.filter((p) => p.capped === capped && p.role === r && !mSet.has(p.id))]));
      const order = ['BAT', 'AR', 'WK', 'PACE', 'SPIN'];
      while (order.some((r) => byRole[r].length)) {
        for (const r of order) if (byRole[r].length) pushSet(r, capped, byRole[r].splice(0, size));
      }
    }
    const s = { v: 1, mode, seed, user, teams, sets, lots, idx: 0, phase: 'main', results: {}, unsold: [], star: [], log: [], riv: {}, top: 0 };
    planTargets(s);
    return s;
  }

  // Each computer team walks in with 2–3 must-have names and keeps money aside for them.
  function planTargets(s) {
    s.ai = {};
    for (const T of TEAMS) {
      if (T.id === s.user) continue;
      const scored = s.lots.map((l) => ({ pid: l.pid, v: rawValue(s, T.id, l.pid) })).sort((a, b) => b.v - a.v);
      const k = s.teams[T.id].purse >= 7000 ? 3 : 2;
      s.ai[T.id] = { targets: scored.slice(0, k).map((x) => x.pid) };
    }
  }
  const isTarget = (s, t, pid) => !!(s.ai && s.ai[t] && s.ai[t].targets.includes(pid));

  // ---------- squad facts ----------
  function counts(s, t) {
    const c = { WK: 0, BAT: 0, AR: 0, PACE: 0, SPIN: 0, os: 0, n: 0 };
    for (const e of s.teams[t].squad) { const p = P[e.pid]; c[p.role]++; if (p.os) c.os++; c.n++; }
    return c;
  }

  function blockReason(s, t, pid, amt) {
    const c = counts(s, t);
    if (c.n >= R.MAX_SQUAD) return 'full';
    if (P[pid].os && c.os >= R.MAX_OVERSEAS) return 'overseas';
    if (amt > maxBid(s, t, pid)) return 'purse';
    return null;
  }

  // Highest a team may bid and still afford the 18-player minimum at ₹30 L each.
  function maxBid(s, t, pid) {
    const c = counts(s, t);
    if (c.n >= R.MAX_SQUAD) return 0;
    if (P[pid].os && c.os >= R.MAX_OVERSEAS) return 0;
    const reserve = Math.max(0, R.MIN_SQUAD - (c.n + 1)) * R.MIN_PRICE;
    return Math.max(0, s.teams[t].purse - reserve);
  }

  // ---------- computer valuation ----------
  const WORTH = [[50, 20], [55, 30], [60, 40], [65, 70], [70, 130], [75, 240], [80, 420], [85, 760], [90, 1150], [95, 1650], [100, 1900]];
  function worth(r) {
    for (let i = 1; i < WORTH.length; i++) {
      const [r1, w1] = WORTH[i]; const [r0, w0] = WORTH[i - 1];
      if (r <= r1) return w0 + ((r - r0) / (r1 - r0)) * (w1 - w0);
    }
    return WORTH[WORTH.length - 1][1];
  }
  const BUDGET_REF = 330;

  // What a franchise thinks a player is worth before squad needs and money come in.
  function rawValue(s, t, pid) {
    const p = P[pid];
    const st = teamById[t].style;
    let v = worth(p.r) * noise(s.seed, t, pid);
    v *= st[p.role] || 1;
    if (p.os) v *= st.overseas || 1;
    if (p.r >= 85) v *= st.star || 1;
    if (!p.capped) v *= st.young || 1;
    if (p.capped && !p.os) v *= st.old || 1;
    if (p.team === t) v *= 1.1;
    return v;
  }

  // Money a team is holding back for must-have names still to come.
  function reserved(s, t, exceptPid) {
    if (!s.ai || !s.ai[t] || s.phase !== 'main') return 0;
    let sum = 0;
    for (const pid of s.ai[t].targets) {
      if (pid === exceptPid || s.results[pid] !== undefined) continue;
      sum += worth(P[pid].r) * 0.75;
    }
    return sum;
  }

  // Few good players of a role left and many teams short of it: prices go up.
  function scarcity(s, t, role) {
    let supply = 0;
    for (let i = s.idx; i < s.lots.length; i++) { const p = P[s.lots[i].pid]; if (p.role === role && p.r >= 68) supply++; }
    let deficit = 0;
    for (const T of TEAMS) deficit += Math.max(0, TARGET[role] - counts(s, T.id)[role]);
    return clamp(Math.sqrt((deficit + 2) / (supply * 1.6 + 2)), 0.85, 1.3);
  }

  function aiValue(s, t, pid) {
    const cap = maxBid(s, t, pid);
    if (!cap) return 0;
    const p = P[pid];
    const c = counts(s, t);
    let v = rawValue(s, t, pid);
    const have = c[p.role]; const want = TARGET[p.role];
    let need = have < want ? 1.05 + 0.06 * (want - have) : have === want ? 0.7 : 0.4;
    if (c.n >= 22) need *= 0.6;
    if (p.os && c.os >= 6) need *= 0.75;
    v *= need;
    v *= scarcity(s, t, p.role);
    const target = isTarget(s, t, pid);
    const keep = target ? 0 : reserved(s, t, pid);
    const spendable = Math.max(s.teams[t].purse * 0.35, s.teams[t].purse - keep);
    const slots = Math.max(1, 22 - c.n);
    v *= clamp(Math.sqrt(spendable / slots / BUDGET_REF), 0.5, 1.7);
    if (target) v *= 1.3;
    const base = R.basePrice(p);
    if (s.phase !== 'main' && c.n < R.MIN_SQUAD) v = Math.max(v, base * 1.3);
    return Math.min(v, cap, target ? cap : Math.max(base, spendable));
  }

  // ---------- rivalries: teams that keep fighting each other bid harder against each other ----------
  const rivKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const rivalry = (s, a, b) => (s.riv && a && b ? s.riv[rivKey(a, b)] || 0 : 0);
  function noteRivalry(s, lot) {
    if (!s.riv) s.riv = {};
    const fighters = Object.entries(lot.cnt).filter(([, n]) => n >= 5).map(([t]) => t);
    for (let i = 0; i < fighters.length; i++) for (let j = i + 1; j < fighters.length; j++) {
      const k = rivKey(fighters[i], fighters[j]); s.riv[k] = (s.riv[k] || 0) + 1;
    }
    if (lot.bid && lot.bidder) s.top = Math.max(s.top || 0, lot.bid);
  }
  // The team you have fought most often.
  function nemesis(s) {
    let best = null; let n = 0;
    for (const T of TEAMS) { if (T.id === s.user) continue; const r = rivalry(s, s.user, T.id); if (r > n) { n = r; best = T.id; } }
    return n >= 2 ? { team: best, n } : null;
  }

  // Jump bids: up to the next round number.
  function jumpTo(amt) {
    return amt < 500 ? Math.ceil((amt + 50) / 50) * 50 : Math.ceil((amt + 100) / 100) * 100;
  }

  // ---------- a lot ----------
  function startLot(s, pid) {
    const p = P[pid];
    const vals = {};
    const push = {};
    for (const T of TEAMS) {
      if (T.id === s.user) continue;
      vals[T.id] = aiValue(s, T.id, pid);
      // A bluffer decides per player whether to push the price up on a name it doesn't really need.
      if (T.bid === 'bluffer' && Math.random() < 0.35) push[T.id] = Math.min(worth(p.r) * 0.8, maxBid(s, T.id, pid));
    }
    return { pid, base: R.basePrice(p), bid: null, bidder: null, in: new Set(), bids: 0, vals, push, cnt: {}, dropped: new Set() };
  }

  const lotNext = (lot) => R.nextBid(lot.bid, lot.base);

  function placeBid(lot, team, amt) {
    lot.bid = amt; lot.bidder = team; lot.in.add(team); lot.bids++;
    lot.cnt[team] = (lot.cnt[team] || 0) + 1;
  }

  // How far a team will go on this lot right now: its value, plus a grudge against the current leader,
  // or a bluffer's push limit while somebody else is clearly keen.
  function limitFor(s, lot, t) {
    let lim = lot.vals[t] * (1 + Math.min(0.12, 0.03 * rivalry(s, t, lot.bidder)));
    if (lot.push[t] && lot.bidder && lot.bidder !== t && lot.bids < 14) lim = Math.max(lim, lot.push[t]);
    return lim;
  }

  // Which computer team (if any) raises next.
  // stage: 0 before "going once", 1 after, 2 after "going twice"; null when resolving instantly.
  function aiNext(s, lot, rnd = Math.random, stage = null) {
    const amt = lotNext(lot);
    const cands = [];
    for (const t of Object.keys(lot.vals)) {
      if (t === lot.bidder || lot.dropped.has(t)) continue;
      const lim = limitFor(s, lot, t);
      if (lim < amt) continue;
      if (blockReason(s, t, lot.pid, amt)) continue;
      const style = teamById[t].bid;
      const fighting = lot.in.has(t);
      if (stage != null && !fighting) {
        if (style === 'patient' && lot.bids < 2 && stage < 1) continue;
        if (style === 'sniper' && stage < 1) continue;
      }
      if (!fighting && lot.in.size >= 2 && rnd() < 0.6) continue;
      cands.push({ t, lim, style, w: (lim - amt + 10) * (fighting ? 3 : 1), margin: (lim - amt) / lim });
    }
    if (!cands.length) return null;
    let x = rnd() * cands.reduce((a, c) => a + c.w, 0);
    let c = cands[cands.length - 1];
    for (const k of cands) { x -= k.w; if (x <= 0) { c = k; break; } }
    let bid = amt; let jump = false;
    if (c.style === 'aggressive' && c.margin > 0.35 && amt >= 150 && rnd() < 0.25) {
      const j = jumpTo(amt);
      if (j <= c.lim * 0.85 && !blockReason(s, c.t, lot.pid, j)) { bid = j; jump = true; }
    }
    const pushing = !!lot.push[c.t] && lot.vals[c.t] < bid;
    return { team: c.t, amt: bid, margin: c.margin, jump, pushing };
  }

  // A jump bid can scare off teams that were already close to their limit (aggressive teams don't scare).
  function applyFear(s, lot, rnd = Math.random) {
    const scared = [];
    const amt = lotNext(lot);
    for (const t of Object.keys(lot.vals)) {
      if (t === lot.bidder || lot.dropped.has(t) || teamById[t].bid === 'aggressive') continue;
      const lim = limitFor(s, lot, t);
      if (lim < amt) continue;
      if ((lim - amt) / lim < 0.22 && rnd() < 0.6) { lot.dropped.add(t); scared.push(t); }
    }
    return scared;
  }

  // Who is still able and willing to go higher (used for the "still in" lights).
  function stillIn(s, lot) {
    const amt = lotNext(lot);
    return Object.keys(lot.vals).filter((t) => t !== lot.bidder && !lot.dropped.has(t) && limitFor(s, lot, t) >= amt && !blockReason(s, t, lot.pid, amt));
  }

  // Finish a lot with only computer teams bidding (used for skips and fast-forward).
  function autoResolve(s, lot, rnd = Math.random) {
    for (let guard = 0; guard < 400; guard++) {
      const n = aiNext(s, lot, rnd);
      if (!n) break;
      placeBid(lot, n.team, n.amt);
      if (n.jump) applyFear(s, lot, rnd);
    }
    return lot;
  }

  // ---------- RTM (2025 rules: former team says it will match, top bidder gets one final raise, then the match) ----------
  function rtmHolder(s, pid, winner) {
    const f = P[pid].team;
    if (!f || f === winner || !s.teams[f] || s.teams[f].rtm <= 0) return null;
    return f;
  }
  function aiWantsRtm(s, f, pid, price) {
    return price <= maxBid(s, f, pid) && aiValue(s, f, pid) >= price * 0.95;
  }
  function aiFinalRaise(s, w, pid, price) {
    const v = Math.min(aiValue(s, w, pid), maxBid(s, w, pid));
    if (v <= price * 1.08) return price;
    let target = price + (v - price) * 0.55;
    target = Math.floor(target / 25) * 25;
    return Math.max(price, target);
  }
  function aiMatches(s, f, pid, price, rnd = Math.random) {
    return price <= maxBid(s, f, pid) && aiValue(s, f, pid) >= price * 0.92 && rnd() < 0.92;
  }

  // ---------- results ----------
  function assign(s, pid, team, price, how = 'buy') {
    s.teams[team].squad.push({ pid, price, how });
    s.teams[team].purse -= price;
    if (how === 'rtm') s.teams[team].rtm--;
    s.results[pid] = { pid, team, price, how };
    s.log.unshift({ pid, team, price, how });
    if (s.log.length > 40) s.log.pop();
  }
  function markUnsold(s, pid) {
    s.results[pid] = null;
    if (s.phase === 'main') s.unsold.push(pid);
    s.log.unshift({ pid, team: null, price: 0 });
    if (s.log.length > 40) s.log.pop();
  }

  const currentLot = (s) => s.lots[s.idx];

  // Move on. After the main sets comes the accelerated round (unsold players again), then squad filling.
  function advance(s) {
    s.idx++;
    if (s.idx < s.lots.length) return;
    if (s.phase === 'main') {
      // Like the real accelerated round, only a shortlist of unsold names comes back.
      const again = s.unsold.filter((pid) => P[pid].r >= 60).sort((a, b) => P[b].r - P[a].r).slice(0, 40);
      s.phase = 'accel';
      s.sets.push({ key: 'accel', capped: null, n: again.length });
      s.lots = again.map((pid) => ({ pid, set: s.sets.length - 1 }));
      s.idx = 0;
      if (s.lots.length) return;
    }
    s.phase = 'fill';
  }

  function leftovers(s) {
    const taken = new Set();
    for (const T of Object.values(s.teams)) T.squad.forEach((e) => taken.add(e.pid));
    return P.filter((p) => !taken.has(p.id)).sort((a, b) => b.r - a.r);
  }

  // Computer teams under 18 sign the best leftovers at base price.
  function fillAI(s) {
    for (const T of TEAMS) {
      if (T.id === s.user) continue;
      let guard = 0;
      while (counts(s, T.id).n < R.MIN_SQUAD && guard++ < 30) {
        const pick = leftovers(s)
          .filter((p) => !blockReason(s, T.id, p.id, R.basePrice(p)))
          .sort((a, b) => aiValue(s, T.id, b.id) - aiValue(s, T.id, a.id))[0];
        if (!pick) break;
        assign(s, pick.id, T.id, R.basePrice(pick), 'fill');
      }
    }
  }

  function setProgress(s) {
    const lot = currentLot(s);
    if (!lot) return null;
    const setIdx = lot.set;
    let first = s.idx;
    while (first > 0 && s.lots[first - 1].set === setIdx) first--;
    return { set: s.sets[setIdx], pos: s.idx - first + 1, n: s.sets[setIdx].n };
  }
  IPLA.engine = { P, ROLES, TARGET, isTarget, rivalry, noteRivalry, nemesis, jumpTo, applyFear, stillIn, limitFor, aiRetain, newGame, counts, blockReason, maxBid, BUDGET_REF, aiValue, startLot, lotNext, placeBid, aiNext, autoResolve, rtmHolder, aiWantsRtm, aiFinalRaise, aiMatches, assign, markUnsold, currentLot, advance, leftovers, fillAI, setProgress };
})();
