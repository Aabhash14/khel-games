// Ball-by-ball T20 match engine.
// A match is plain data. step(m, ctl) bowls one delivery and returns what happened, so the live screen can
// play it ball by ball (with your batting intent and bowler choice) and the computer can run whole matches in a loop.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { VENUES } = IPLA.data;
  const { P } = IPLA.engine;

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // Specialist bowlers bat like tail-enders whatever their bowling rating (Bumrah is not a No. 3).
  const batSkill = (p) => (p.role === 'BAT' || p.role === 'WK' ? p.r : p.role === 'AR' ? p.r * 0.9 : 30 + p.r * 0.2);
  const canBowl = (p) => p.role === 'PACE' || p.role === 'SPIN' || p.role === 'AR';
  function bowlSkill(p, venue) {
    let s = p.role === 'PACE' || p.role === 'SPIN' ? p.r : p.role === 'AR' ? p.r * 0.86 : 46;
    if (p.role === 'SPIN' && venue) s += venue.spin;
    return s;
  }

  // Openers and top order first, bowlers last.
  function battingOrder(xi) {
    return [...xi].sort((a, b) => batSkill(P[b]) - batSkill(P[a]));
  }

  // Bowling options: everyone who bowls, plus part-timers if there are fewer than six.
  function bowlingOptions(xi, venue) {
    const opts = xi.filter((id) => canBowl(P[id])).sort((a, b) => bowlSkill(P[b], venue) - bowlSkill(P[a], venue));
    const parts = xi.filter((id) => !canBowl(P[id])).sort((a, b) => P[a].r - P[b].r);
    while (opts.length < 6 && parts.length) opts.push(parts.shift());
    return opts;
  }

  function newInnings(m, bat, bowlT) {
    const order = battingOrder(m.xi[bat]);
    const card = order.map((pid, i) => ({ pid, r: 0, b: 0, f4: 0, f6: 0, out: null, batted: i < 2 }));
    return {
      bat, bowlT, card, bowl: {}, bowlers: bowlingOptions(m.xi[bowlT], m.venue),
      striker: 0, non: 1, next: 2, runs: 0, wkts: 0, balls: 0,
      ext: { wd: 0, nb: 0, b: 0, lb: 0 }, fow: [], overs: [], cur: null, last: null, part: { r: 0, b: 0 },
    };
  }

  // toss: { w: team that won the toss, d: 'bat' | 'bowl' }
  function createMatch({ a, b, xiA, xiB, venueKey, toss }) {
    const batFirst = toss.d === 'bat' ? toss.w : toss.w === a ? b : a;
    const other = batFirst === a ? b : a;
    const m = { a: batFirst, b: other, home: a, away: b, xi: { [a]: xiA, [b]: xiB }, venueKey, venue: VENUES[venueKey] || { runs: 1, spin: 0 }, toss, i: 0, target: null, done: false, result: null, freeHit: false };
    m.inns = [newInnings(m, batFirst, other)];
    return m;
  }

  const inn = (m) => m.inns[m.i];
  const oversLeftBalls = (I) => 120 - I.balls;

  // ---------- choosing the bowler ----------
  function bowlStat(I, pid) {
    if (!I.bowl[pid]) I.bowl[pid] = { balls: 0, r: 0, w: 0, m: 0, wd: 0, nb: 0, dots: 0 };
    return I.bowl[pid];
  }
  function eligibleBowlers(m) {
    const I = inn(m);
    return I.bowlers.filter((pid) => pid !== I.last && (!I.bowl[pid] || I.bowl[pid].balls < 24));
  }
  function aiBowler(m) {
    const I = inn(m);
    const over = I.overs.length;
    const left = 20 - over; // including this one
    const elig = eligibleBowlers(m);
    const quota = (pid) => 4 - Math.floor((I.bowl[pid] ? I.bowl[pid].balls : 0) / 6);
    const feasible = (c) => {
      const n = left - 1;
      const qs = I.bowlers.map((pid) => quota(pid) - (pid === c ? 1 : 0));
      return qs.reduce((x, y) => x + y, 0) >= n && Math.max(...qs) <= Math.ceil(n / 2);
    };
    let best = null; let bestScore = -1e9;
    for (const pid of elig) {
      const p = P[pid];
      let sc = bowlSkill(p, m.venue) + quota(pid) * (over >= 12 ? 5 : 1.5);
      if (p.role === 'PACE') sc += over < 6 ? 6 : over >= 16 ? 9 : 0;
      if (p.role === 'SPIN') sc += over >= 6 && over < 16 ? 7 : over >= 16 ? -8 : -2;
      if (!canBowl(p)) sc -= 25;
      if (!feasible(pid)) sc -= 1000;
      sc += Math.random() * 3;
      if (sc > bestScore) { bestScore = sc; best = pid; }
    }
    if (best == null) {
      // Everyone is out of overs or bowled the last over: any fielder who hasn't bowled four.
      best = m.xi[I.bowlT].find((pid) => pid !== I.last && (!I.bowl[pid] || I.bowl[pid].balls < 24)) || I.bowlers[0];
      if (!I.bowlers.includes(best)) I.bowlers.push(best);
    }
    return best;
  }

  // ---------- one delivery ----------
  const BASE = { dot: 0.33, one: 0.37, two: 0.07, three: 0.004, four: 0.128, six: 0.068, out: 0.038 };

  function autoIntent(m, I) {
    const over = Math.floor(I.balls / 6);
    let a = over < 6 ? 0.3 : over >= 16 ? 0.9 : 0.05;
    if (I.wkts >= 6 && over < 17) a -= 0.45;
    else if (I.wkts >= 4 && over < 12) a -= 0.2;
    if (m.target != null) {
      const need = m.target - I.runs; const left = oversLeftBalls(I);
      const rrr = (need / Math.max(1, left)) * 6;
      a = clamp((rrr - 8.5) / 3.5 + (over >= 16 ? 0.3 : 0), -0.8, 1.2);
      if (I.wkts >= 7 && rrr < 12) a -= 0.3;
    }
    return clamp(a, -1, 1.2);
  }

  function pickOutcome(bat, bowl, m, I, intent) {
    const over = Math.floor(I.balls / 6);
    const w = { ...BASE };
    const s = clamp((batSkill(bat) - bowlSkill(bowl, m.venue)) / 10, -3, 2.5);
    w.four *= Math.exp(0.18 * s); w.six *= Math.exp(0.26 * s); w.out *= Math.exp(-0.16 * s); w.dot *= Math.exp(-0.08 * s);
    if (over < 6) { w.four *= 1.25; w.six *= 0.9; w.one *= 0.95; }
    else if (over < 16) { w.four *= 0.9; w.six *= 0.95; w.one *= 1.1; w.out *= 0.92; }
    else { w.four *= 1.1; w.six *= 1.5; w.out *= 1.35; w.dot *= 0.85; }
    const a = intent;
    w.four *= 1 + 0.22 * a; w.six *= 1 + 0.4 * a; w.out *= a >= 0 ? 1 + 0.5 * a : 1 + 0.35 * a; w.dot *= 1 - 0.15 * a; w.one *= 1 - 0.04 * a;
    const sc = I.card[I.striker];
    if (sc.b < 5) { w.four *= 0.8; w.six *= 0.7; w.out *= 1.15; } else if (sc.b > 25) { w.four *= 1.08; w.six *= 1.15; }
    if (sc.r >= 80) { w.six *= 1.25; w.out *= 3.2; } else if (sc.r >= 50) { w.six *= 1.15; w.out *= 1.6; } // past fifty they start taking more risks
    const vr = m.venue.runs;
    w.four *= vr; w.six *= vr * vr; w.out /= Math.sqrt(vr);
    if (bowl.role === 'SPIN') { w.four *= 0.85; w.six *= 1.05; w.one *= 1.05; } else { w.four *= 1.05; }
    if (m.freeHit) w.out = 0;
    const keys = Object.keys(w);
    let x = Math.random() * keys.reduce((t, k) => t + w[k], 0);
    for (const k of keys) { x -= w[k]; if (x <= 0) return k; }
    return 'dot';
  }

  function dismissal(m, I, bowlerPid) {
    const spin = P[bowlerPid].role === 'SPIN';
    const x = Math.random();
    const fielders = m.xi[I.bowlT].filter((pid) => pid !== bowlerPid);
    const keeper = m.xi[I.bowlT].find((pid) => P[pid].role === 'WK') || fielders[0];
    const any = () => fielders[Math.floor(Math.random() * fielders.length)];
    if (spin) {
      if (x < 0.07) return ['st', bowlerPid, keeper];
      if (x < 0.22) return ['b', bowlerPid, null];
      if (x < 0.35) return ['lbw', bowlerPid, null];
      if (x < 0.93) return ['c', bowlerPid, Math.random() < 0.08 ? bowlerPid : any()];
      return ['ro', null, any()];
    }
    if (x < 0.18) return ['b', bowlerPid, null];
    if (x < 0.28) return ['lbw', bowlerPid, null];
    if (x < 0.92) return ['c', bowlerPid, Math.random() < 0.18 ? keeper : any()];
    return ['ro', null, any()];
  }

  // ctl: { intent: -1..1 | null (auto), bowler: pid | null (auto) } for the side you control.
  function step(m, ctl = {}) {
    if (m.done) return null;
    const I = inn(m);
    if (!I.cur) {
      let bw = ctl.bowler && eligibleBowlers(m).includes(ctl.bowler) ? ctl.bowler : aiBowler(m);
      I.cur = { bowler: bw, balls: [], runs: 0, bowlerRuns: 0 };
    }
    const bowler = I.cur.bowler;
    const bs = bowlStat(I, bowler);
    const sc = I.card[I.striker];
    const batP = P[sc.pid];
    const ev = { inn: m.i, over: I.overs.length, ballInOver: I.cur.balls.filter((b) => b.legal).length + 1, bowler, batter: sc.pid, runs: 0, extra: null, out: null, legal: true, freeHit: m.freeHit };
    const intent = ctl.intent != null ? clamp(ctl.intent + (ev.over >= 16 ? 0.25 : 0), -1, 1.3) : autoIntent(m, I);

    const xr = Math.random();
    const pace = P[bowler].role !== 'SPIN';
    if (xr < (pace ? 0.038 : 0.022)) {
      // wide
      ev.extra = 'wd'; ev.legal = false; ev.runs = 1;
      I.runs += 1; I.ext.wd += 1; bs.r += 1; bs.wd += 1; I.cur.runs += 1; I.cur.bowlerRuns += 1;
    } else if (xr < (pace ? 0.044 : 0.026)) {
      // no-ball: a free hit follows, and the batter can still score off it
      ev.extra = 'nb'; ev.legal = false;
      const k = pickOutcome(batP, P[bowler], m, I, intent);
      const off = { dot: 0, one: 1, two: 2, three: 3, four: 4, six: 6, out: 0 }[k];
      ev.runs = 1 + off; ev.bat = off;
      sc.r += off; sc.b += 1; if (off === 4) sc.f4++; if (off === 6) sc.f6++;
      I.runs += 1 + off; I.ext.nb += 1; bs.r += 1 + off; bs.nb += 1; I.cur.runs += 1 + off; I.cur.bowlerRuns += 1 + off;
      I.part.r += 1 + off; I.part.b += 1;
      if (off % 2 === 1) [I.striker, I.non] = [I.non, I.striker];
      m.freeHit = true;
    } else if (xr < (pace ? 0.064 : 0.044)) {
      // leg bye
      ev.extra = 'lb'; ev.runs = 1;
      sc.b += 1; I.runs += 1; I.ext.lb += 1; I.cur.runs += 1; bs.balls += 1; I.balls += 1;
      I.part.r += 1; I.part.b += 1;
      [I.striker, I.non] = [I.non, I.striker];
      m.freeHit = false;
    } else {
      const k = pickOutcome(batP, P[bowler], m, I, intent);
      sc.b += 1; bs.balls += 1; I.balls += 1; I.part.b += 1;
      m.freeHit = false;
      if (k === 'out') {
        const d = dismissal(m, I, bowler);
        let victim = I.striker;
        if (d[0] === 'ro' && Math.random() < 0.3) victim = I.non;
        const runs = d[0] === 'ro' && Math.random() < 0.5 ? 1 : 0;
        if (runs) { I.runs += runs; sc.r += runs; bs.r += runs; I.cur.runs += runs; I.cur.bowlerRuns += runs; I.part.r += runs; }
        ev.runs = runs;
        I.card[victim].out = d;
        if (d[0] !== 'ro') bs.w += 1;
        I.wkts += 1;
        ev.out = { pid: I.card[victim].pid, how: d };
        I.fow.push([I.runs, I.wkts, I.card[victim].pid, I.balls]);
        I.part = { r: 0, b: 0 };
        if (I.next < I.card.length && I.wkts < 10) {
          I.card[I.next].batted = true;
          if (victim === I.striker) I.striker = I.next; else I.non = I.next;
          I.next++;
        }
      } else {
        const runs = { dot: 0, one: 1, two: 2, three: 3, four: 4, six: 6 }[k];
        ev.runs = runs;
        sc.r += runs; if (runs === 4) sc.f4++; if (runs === 6) sc.f6++;
        I.runs += runs; bs.r += runs; I.cur.runs += runs; I.cur.bowlerRuns += runs; I.part.r += runs;
        if (runs === 0) bs.dots++;
        if (runs % 2 === 1) [I.striker, I.non] = [I.non, I.striker];
      }
    }
    I.cur.balls.push({ legal: ev.legal, runs: ev.runs, extra: ev.extra, out: !!ev.out });
    ev.score = I.runs; ev.wkts = I.wkts; ev.balls = I.balls;

    const chaseWon = m.target != null && I.runs >= m.target;
    const overDone = ev.legal && I.balls % 6 === 0 && I.balls > 0 && I.cur.balls.filter((b) => b.legal).length === 6;
    const innsDone = I.wkts >= 10 || I.balls >= 120 || chaseWon;
    if (overDone || innsDone) {
      if (I.cur.bowlerRuns === 0 && I.cur.balls.filter((b) => b.legal).length === 6) bs.m += 1;
      I.overs.push({ bowler, runs: I.cur.runs, wk: I.cur.balls.filter((b) => b.out).length });
      I.last = bowler; I.cur = null;
      if (overDone && !innsDone) [I.striker, I.non] = [I.non, I.striker];
      ev.overDone = true;
    }
    if (innsDone) {
      ev.innsDone = true;
      if (m.i === 0) {
        m.target = I.runs + 1;
        m.i = 1; m.freeHit = false;
        m.inns.push(newInnings(m, m.b, m.a));
      } else finish(m);
    }
    if (m.done) ev.matchDone = true;
    return ev;
  }

  function finish(m) {
    const [A, B] = m.inns;
    m.done = true;
    if (B.runs >= m.target) m.result = { w: m.b, wkts: 10 - B.wkts, balls: 120 - B.balls };
    else if (B.runs === m.target - 1) {
      // Tie: a super over, settled by the stronger side with some luck.
      const pow = (t) => m.xi[t].map((id) => batSkill(P[id])).sort((x, y) => y - x).slice(0, 3).reduce((x, y) => x + y, 0);
      const pa = 1 / (1 + Math.exp(-(pow(m.a) - pow(m.b)) / 20));
      m.result = { w: Math.random() < pa ? m.a : m.b, superOver: true };
    } else m.result = { w: m.a, runs: m.target - 1 - B.runs };
    m.result.potm = playerOfMatch(m);
  }

  function playerOfMatch(m) {
    const score = {};
    const add = (pid, v) => { score[pid] = (score[pid] || 0) + v; };
    for (const I of m.inns) {
      for (const c of I.card) {
        if (!c.batted) continue;
        let v = c.r;
        if (c.r >= 50) v += 12;
        if (c.r >= 15 && c.b) v += ((c.r / c.b) * 100 - 135) / 5;
        add(c.pid, v);
        if (c.out && c.out[2] != null) add(c.out[2], 5);
      }
      for (const [pid, b] of Object.entries(I.bowl)) {
        let v = b.w * 22;
        if (b.balls >= 18) v += ((7.5 - (b.r / b.balls) * 6) * 3);
        add(+pid, v);
      }
    }
    const winners = new Set(m.xi[m.result.w]);
    let best = null; let bs = -1e9;
    for (const [pid, v] of Object.entries(score)) { const x = winners.has(+pid) ? v * 1.2 : v; if (x > bs) { bs = x; best = +pid; } }
    return best;
  }

  function runToEnd(m) { let guard = 0; while (!m.done && guard++ < 400) step(m); return m; }

  // Compact record kept for every match: scorecards, fall of wickets, runs per over.
  function summarize(m) {
    return {
      a: m.a, b: m.b, home: m.home, away: m.away, venue: m.venueKey, toss: m.toss, target: m.target,
      inns: m.inns.map((I) => ({
        t: I.bat, runs: I.runs, wkts: I.wkts, balls: I.balls, ext: I.ext,
        bat: I.card.filter((c) => c.batted).map((c) => [c.pid, c.r, c.b, c.f4, c.f6, c.out]),
        dnb: I.card.filter((c) => !c.batted).map((c) => c.pid),
        bowl: Object.entries(I.bowl).filter(([, b]) => b.balls || b.wd || b.nb).map(([pid, b]) => [+pid, b.balls, b.m, b.r, b.w, b.wd, b.nb, b.dots]),
        fow: I.fow, overs: I.overs.map((o) => o.runs),
      })),
      res: m.result,
    };
  }

  IPLA.match = { createMatch, step, runToEnd, summarize, eligibleBowlers, aiBowler, battingOrder, batSkill, bowlSkill, canBowl, autoIntent };
})();
