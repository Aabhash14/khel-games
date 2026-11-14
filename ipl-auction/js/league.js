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
    // Spread the games out: build match days where no team plays twice.
    const left = pairs.slice().sort(() => Math.random() - 0.5);
    const order = [];
    while (left.length) {
      const busy = new Set();
      for (let i = 0; i < left.length && busy.size < 4;) {
        const [a, b] = left[i];
        if (!busy.has(a) && !busy.has(b)) { order.push(left.splice(i, 1)[0]); busy.add(a); busy.add(b); } else i++;
      }
      if (!busy.size) order.push(left.shift());
    }
    s.league = {
      fixtures: order.map(([a, b], i) => ({ id: i + 1, a, b, venue: a, stage: 'league' })),
      results: {}, next: 0, myXI: null, champion: null,
    };
    return s.league;
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
  function teamXI(s, t) {
    if (t === s.user && validXI(s, s.league.myXI)) return s.league.myXI.slice();
    return bestXI(s.teams[t].squad.map((e) => e.pid)).map((p) => p.id);
  }

  function nextFixture(s) {
    const L = s.league;
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

  function aiToss(team) { return Math.random() < 0.68 ? 'bowl' : 'bat'; }

  function startMatch(s, fx, toss) {
    return M.createMatch({ a: fx.a, b: fx.b, xiA: teamXI(s, fx.a), xiB: teamXI(s, fx.b), venueKey: fx.venue, toss });
  }

  function record(s, fx, m) {
    const L = s.league;
    L.results[fx.id] = M.summarize(m);
    L.next = Math.max(L.next, L.fixtures.indexOf(fx) + 1);
    if (fx.stage === 'final') L.champion = m.result.w;
  }

  function simFixture(s, fx) {
    const tw = Math.random() < 0.5 ? fx.a : fx.b;
    const m = startMatch(s, fx, { w: tw, d: aiToss(tw) });
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

  IPLA.league = { newLeague, nextFixture, startMatch, record, simFixture, table, stats, teamXI, validXI, aiToss, ownerOf };
})();
