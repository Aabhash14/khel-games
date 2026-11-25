// The IPL season: 70 league matches (each team plays 14), then Qualifier 1, Eliminator, Qualifier 2 and the Final.
// Every match is a full ball-by-ball game; results keep compact scorecards for the stats pages.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { TEAMS } = IPLA.data;
  const { P } = IPLA.engine;
  const { bestXI } = IPLA.season;
  const M = IPLA.match;

  function newLeague(s) {
    const ids = TEAMS.map((T) => T.id);
    const pairs = [];
    for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) pairs.push(Math.random() < 0.5 ? [ids[i], ids[j]] : [ids[j], ids[i]]);
    // Five rivals each team meets twice (home and away): 9 + 5 = 14 games each.
    for (let i = 0; i < 10; i++) {
      const j = (i + 1) % 10; const k = (i + 2) % 10;
      const fix = (x, y) => { const f = pairs.find((p) => (p[0] === x && p[1] === y) || (p[0] === y && p[1] === x)); pairs.push([f[1], f[0]]); };
      fix(ids[i], ids[j]); fix(ids[i], ids[k]);
    }
    for (let i = 0; i < 5; i++) { const f = pairs.find((p) => (p[0] === ids[i] && p[1] === ids[i + 5]) || (p[1] === ids[i] && p[0] === ids[i + 5])); pairs.push([f[1], f[0]]); }
    const order = roundsOf(pairs, ids);
    s.league = {
      fixtures: order.map(([a, b], i) => ({ id: i + 1, a, b, venue: a, stage: 'league' })),
      results: {}, next: 0, myXI: null, champion: null, inj: {}, news: [], hold: {},
    };
    return s.league;
  }

  // Order the 70 games as 14 rounds of 5, where every team plays exactly once per round.
  // So at any moment no team is more than one game ahead of another (like the real schedule's balance).
  // Each round is a perfect matching found by a small randomised search; if a later round gets stuck,
  // start again with a new shuffle. A fallback always picks the teams with the fewest games so far.
  function roundsOf(pairs, ids) {
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    for (let attempt = 0; attempt < 300; attempt++) {
      const left = shuffle(pairs.slice());
      const order = [];
      let ok = true;
      while (left.length) {
        const round = matching(left, ids);
        if (!round) { ok = false; break; }
        for (const p of shuffle(round)) { order.push(p); left.splice(left.indexOf(p), 1); }
      }
      if (ok) return order;
    }
    // Fallback: always schedule the pair whose teams have played least.
    const left = shuffle(pairs.slice()); const played = Object.fromEntries(ids.map((t) => [t, 0])); const order = [];
    while (left.length) {
      left.sort((x, y) => (played[x[0]] + played[x[1]]) - (played[y[0]] + played[y[1]]));
      const p = left.shift(); played[p[0]]++; played[p[1]]++; order.push(p);
    }
    return order;
  }
  // One game for every team: depth-first search over the remaining pairs.
  function matching(left, ids) {
    const used = new Set(); const chosen = [];
    let steps = 0;
    const go = () => {
      if (++steps > 4000) return false;
      const t = ids.find((x) => !used.has(x));
      if (!t) return true;
      for (const p of left) {
        if (chosen.includes(p) || (p[0] !== t && p[1] !== t)) continue;
        const o = p[0] === t ? p[1] : p[0];
        if (used.has(o)) continue;
        used.add(t); used.add(o); chosen.push(p);
        if (go()) return true;
        used.delete(t); used.delete(o); chosen.pop();
      }
      return false;
    };
    return go() ? chosen.slice() : null;
  }

  const ownerOf = (s) => {
    const map = {};
    for (const T of Object.values(s.teams)) for (const e of T.squad) map[e.pid] = T.id;
    return map;
  };

  // Max 4 overseas, a keeper, five bowling options.
  function validXI(s, ids) {
    if (!ids || ids.length !== 11) return false;
    const sq = new Set(s.teams[s.user].squad.map((e) => e.pid));
    if (ids.some((id) => !sq.has(id))) return false;
    return ids.filter((id) => P[id].os).length <= 4;
  }
  // Today's XI: computer captains pick on rating, form and the pitch; injured players sit out.
  function teamXI(s, t, fx) {
    const W = IPLA.world;
    if (t === s.user && s.league.myXI) {
      const xi = repairXI(s, s.league.myXI, fx);
      if (validXI(s, xi)) return xi;
    }
    return bestXI(squadOf(s, t), W.matchValue(s, fx)).map((p) => p.id);
  }
  // Your saved XI with injured players swapped for the best fit player (same role first).
  function repairXI(s, ids, fx) {
    const W = IPLA.world;
    const fit = squadOf(s, s.user);
    const xi = ids.filter((id) => fit.includes(id));
    const val = W.matchValue(s, fx);
    const missing = ids.filter((id) => !xi.includes(id));
    while (xi.length + missing.length < 11) missing.push(null);
    for (const was of missing) {
      if (xi.length >= 11) break;
      const os = xi.filter((id) => P[id].os).length;
      const same = (id) => (was != null && P[id].role === P[was].role ? 1 : 0);
      const c = fit.filter((id) => !xi.includes(id) && (!P[id].os || os < 4)).sort((a, b) => same(b) - same(a) || val(P[b]) - val(P[a]))[0];
      if (c != null) xi.push(c);
    }
    return xi;
  }

  // Seasons saved before balanced rounds: reorder the unplayed league games once so the
  // team with the fewest games always plays next, and renumber them in order.
  function rebalance(L) {
    if (L.bal) return;
    L.bal = 1;
    const ids = Object.keys(L.fixtures.reduce((o, f) => { o[f.a] = 1; o[f.b] = 1; return o; }, {}));
    const played = Object.fromEntries(ids.map((t) => [t, 0]));
    const done = L.fixtures.slice(0, L.next);
    done.forEach((f) => { if (f.stage === 'league') { played[f.a]++; played[f.b]++; } });
    const left = L.fixtures.slice(L.next).filter((f) => f.stage === 'league' && !L.results[f.id]);
    if (left.length !== L.fixtures.length - L.next) return; // playoffs already drawn: leave it alone
    const order = [];
    while (left.length) {
      left.sort((x, y) => Math.max(played[x.a], played[x.b]) - Math.max(played[y.a], played[y.b]) || (played[x.a] + played[x.b]) - (played[y.a] + played[y.b]));
      const f = left.shift(); played[f.a]++; played[f.b]++; order.push(f);
    }
    order.forEach((f, i) => { f.id = L.next + i + 1; });
    L.fixtures = [...done, ...order];
  }

  function nextFixture(s) {
    const L = s.league;
    rebalance(L);
    if (L.next < L.fixtures.length) return L.fixtures[L.next];
    if (L.champion) return null;
    // Playoffs are added as the bracket fills in.
    const tbl = table(s);
    const have = (stage) => L.fixtures.find((f) => f.stage === stage);
    const winner = (f) => L.results[f.id].res.w;
    const loser = (f) => (winner(f) === f.a ? f.b : f.a);
    const add = (a, b, stage, venue) => { L.fixtures.push({ id: L.fixtures.length + 1, a, b, venue, stage }); return L.fixtures[L.fixtures.length - 1]; };
    if (!have('q1')) { add(tbl[0].t, tbl[1].t, 'q1', 'SRH'); return add(tbl[2].t, tbl[3].t, 'elim', 'SRH') && L.fixtures[L.next]; }
    if (!have('q2')) return add(loser(have('q1')), winner(have('elim')), 'q2', 'GT');
    if (!have('final')) return add(winner(have('q1')), winner(have('q2')), 'final', 'GT');
    return null;
  }

  // Captains read the pitch: dew means chase, a dry or slow surface means bat first.
  function aiToss(team, fx) {
    const pi = fx ? IPLA.world.pitchFor(fx) : null;
    const bowl = !pi ? 0.68 : pi.dew ? 0.88 : pi.k === 'dry' || pi.k === 'slow' ? 0.38 : pi.k === 'green' ? 0.78 : 0.66;
    return Math.random() < bowl ? 'bowl' : 'bat';
  }

  function startMatch(s, fx, toss) {
    const W = IPLA.world;
    const xiA = teamXI(s, fx.a, fx); const xiB = teamXI(s, fx.b, fx);
    const { adj, leaders } = W.matchAdj(s, fx, [fx.a, fx.b], { [fx.a]: xiA, [fx.b]: xiB });
    return M.createMatch({ a: fx.a, b: fx.b, xiA, xiB, venueKey: fx.venue, toss, cond: W.conditions(fx), adj, leaders });
  }

  function record(s, fx, m) {
    const L = s.league;
    L.results[fx.id] = M.summarize(m);
    IPLA.world.afterMatch(s, fx, m, L.results[fx.id]);
    L.next = Math.max(L.next, L.fixtures.indexOf(fx) + 1);
    if (fx.stage === 'final') L.champion = m.result.w;
  }

  // Players fit to play (not injured, not retired).
  const squadOf = (s, t) => IPLA.world.fit(s, s.teams[t].squad.map((e) => e.pid));
  // Computer captains (and "sim my match") use their Impact Player at the innings break.
  function aiImpact(s, m, teams) {
    const done = [];
    for (const t of teams) {
      const sg = M.suggestSub(m, t, squadOf(s, t));
      if (sg && M.impactSub(m, t, sg.out, sg.in)) done.push({ t, ...sg });
    }
    return done;
  }

  function simFixture(s, fx) {
    const tw = Math.random() < 0.5 ? fx.a : fx.b;
    const m = startMatch(s, fx, { w: tw, d: aiToss(tw, fx) });
    let guard = 0;
    while (!m.done && m.i === 0 && guard++ < 400) M.step(m);
    aiImpact(s, m, [m.a, m.b]);
    M.runToEnd(m);
    record(s, fx, m);
    return L_res(s, fx);
  }
  const L_res = (s, fx) => s.league.results[fx.id];

  // ---------- points table ----------
  function table(s) {
    const L = s.league;
    const rows = Object.fromEntries(TEAMS.map((T) => [T.id, { t: T.id, p: 0, w: 0, l: 0, pts: 0, rf: 0, bf: 0, ra: 0, bb: 0, form: [] }]));
    for (const fx of L.fixtures) {
      if (fx.stage !== 'league') continue;
      const r = L.results[fx.id]; if (!r) continue;
      for (const I of r.inns) {
        const balls = I.wkts >= 10 ? 120 : I.balls;
        const bat = rows[I.t]; const bowl = rows[I.t === r.a ? r.b : r.a];
        bat.rf += I.runs; bat.bf += balls; bowl.ra += I.runs; bowl.bb += balls;
      }
      for (const t of [fx.a, fx.b]) {
        const row = rows[t]; row.p++;
        if (r.res.w === t) { row.w++; row.pts += 2; row.form.push('W'); } else { row.l++; row.form.push('L'); }
      }
    }
    const out = Object.values(rows).map((r) => ({ ...r, nrr: r.bf && r.bb ? (r.rf / (r.bf / 6)) - (r.ra / (r.bb / 6)) : 0, form: r.form.slice(-5) }));
    return out.sort((x, y) => y.pts - x.pts || y.nrr - x.nrr);
  }

  // ---------- stats ----------
  function stats(s) {
    const L = s.league; const own = ownerOf(s);
    const bat = {}; const bowl = {}; const innsList = []; const figs = [];
    const B = (pid) => (bat[pid] ||= { pid, t: own[pid], m: new Set(), inn: 0, no: 0, r: 0, b: 0, f4: 0, f6: 0, hs: 0, hsNo: false, f50: 0, f100: 0 });
    const W = (pid) => (bowl[pid] ||= { pid, t: own[pid], m: new Set(), balls: 0, r: 0, w: 0, best: [0, 999], dots: 0, m0: 0 });
    for (const fx of L.fixtures) {
      const r = L.results[fx.id]; if (!r) continue;
      r.inns.forEach((I, ii) => {
        for (const [pid, runs, balls, f4, f6, out] of I.bat) {
          const x = B(pid); x.m.add(fx.id); x.inn++; x.r += runs; x.b += balls; x.f4 += f4; x.f6 += f6;
          if (!out) x.no++;
          if (runs > x.hs || (runs === x.hs && !out)) { x.hs = runs; x.hsNo = !out; }
          if (runs >= 100) x.f100++; else if (runs >= 50) x.f50++;
          innsList.push({ pid, t: own[pid], r: runs, b: balls, no: !out, fx: fx.id, vs: ii === 0 ? r.b : r.a });
        }
        for (const [pid, balls, mdn, runs, wk, , , dots] of I.bowl) {
          const x = W(pid); x.m.add(fx.id); x.balls += balls; x.r += runs; x.w += wk; x.dots += dots || 0; x.m0 += mdn;
          if (wk > x.best[0] || (wk === x.best[0] && runs < x.best[1])) x.best = [wk, runs];
          figs.push({ pid, t: own[pid], w: wk, r: runs, balls, fx: fx.id });
        }
      });
    }
    const bats = Object.values(bat).map((x) => ({ ...x, m: x.m.size, avg: x.inn - x.no ? x.r / (x.inn - x.no) : x.r, sr: x.b ? (x.r / x.b) * 100 : 0 }));
    const bowls = Object.values(bowl).map((x) => ({ ...x, m: x.m.size, econ: x.balls ? x.r / (x.balls / 6) : 0, avg: x.w ? x.r / x.w : null }));
    return {
      orange: [...bats].sort((a, b) => b.r - a.r || b.sr - a.sr),
      purple: [...bowls].sort((a, b) => b.w - a.w || a.econ - b.econ),
      sixes: [...bats].sort((a, b) => b.f6 - a.f6 || b.r - a.r),
      fours: [...bats].sort((a, b) => b.f4 - a.f4 || b.r - a.r),
      hs: innsList.sort((a, b) => b.r - a.r || a.b - b.b),
      best: figs.sort((a, b) => b.w - a.w || a.r - b.r),
      sr: bats.filter((x) => x.b >= 60).sort((a, b) => b.sr - a.sr),
      econ: bowls.filter((x) => x.balls >= 60).sort((a, b) => a.econ - b.econ),
      bat, bowl,
    };
  }

  IPLA.league = { repairXI, aiImpact, squadOf, newLeague, nextFixture, startMatch, record, simFixture, table, stats, teamXI, validXI, aiToss, ownerOf };
})();
