// Bagh-Chal computer player and the Daily Bagh generator. Pure: no DOM.
// Negamax alpha-beta with iterative deepening, a transposition table, capture quiescence,
// killer + history move ordering, and a time / node budget so it never runs away.
(function (root) {
  'use strict';
  var R = (typeof module !== 'undefined' && module.exports) ? require('./rules.js') : root.BCRules;
  var N = R.N, GOAT = R.GOAT, TIGER = R.TIGER, T = R.T, ADJ = R.ADJ, JUMPS = R.JUMPS;
  var WIN = 100000, INF = 1e9;

  var LEVELS = {
    easy: { depth: 2, time: 250, blunder: 0.34, temp: 260 },
    medium: { depth: 4, time: 450, blunder: 0.07, temp: 70 },
    hard: { depth: 40, time: 1200, blunder: 0, temp: 0 },
  };

  function popcount(x) { var n = 0; while (x) { x &= x - 1; n++; } return n; }

  // Static score from the tigers' point of view.
  function evalTiger(s) {
    var b = s.b, mob = 0, trapped = 0, near = 0, threat = 0, tig = 0, i, k;
    for (i = 0; i < N; i++) if (b[i] === TIGER) {
      tig++;
      var a = ADJ[i], j = JUMPS[i], m = 0, c = 0;
      for (k = 0; k < a.length; k++) if (!b[a[k]]) m++;
      for (k = 0; k < j.length; k++) if (b[j[k][0]] === GOAT && !b[j[k][1]]) { c++; threat |= 1 << j[k][0]; }
      mob += m;
      if (m + c === 0) trapped++; else if (m + c === 1) near++;
      // a tiger on a diagonal point (8 lines) is worth more than one on a 4-line point
      if ((((i / 5) | 0) + i % 5) % 2 === 0) mob += 1;
    }
    var th = popcount(threat);
    var e = 1000 * s.cap + 12 * mob - 240 * trapped - 55 * near;
    if (s.turn === T) { if (th) e += 520 + 70 * (th - 1); }
    else e += 150 * th + (th >= 2 ? 420 : 0);
    // goats still in hand are a resource for the goats, but only a small one
    e -= 4 * s.hand;
    return e;
  }
  function evalSide(s) { var e = evalTiger(s); return s.turn === T ? e : -e; }

  function Searcher(opts) {
    this.tt = new Map();
    this.hist = [new Int32Array(26 * 25), new Int32Array(26 * 25)];
    this.killers = [];
    this.seen = new Set(opts && opts.seen ? opts.seen : []);
    this.path = [];
    this.nodes = 0;
    this.deadline = Infinity;
    this.nodeLimit = Infinity;
    this.abort = false;
  }

  Searcher.prototype.tick = function () {
    if ((++this.nodes & 1023) === 0) {
      if (this.nodes >= this.nodeLimit || Date.now() > this.deadline) this.abort = true;
    }
  };

  Searcher.prototype.order = function (s, ms, ply, ttMove) {
    var side = s.turn, h = this.hist[side], kl = this.killers[ply] || [0, 0], sc = new Array(ms.length), i;
    for (i = 0; i < ms.length; i++) {
      var m = ms[i], v;
      if (m === ttMove) v = 1e9;
      else if (R.mCap(m) >= 0) v = 1e8;
      else if (m === kl[0]) v = 9e7;
      else if (m === kl[1]) v = 8e7;
      else v = h[(R.mFrom(m) + 1) * 25 + R.mTo(m)];
      sc[i] = v;
    }
    // insertion sort, lists are short
    for (i = 1; i < ms.length; i++) {
      var x = ms[i], y = sc[i], j = i - 1;
      while (j >= 0 && sc[j] < y) { ms[j + 1] = ms[j]; sc[j + 1] = sc[j]; j--; }
      ms[j + 1] = x; sc[j + 1] = y;
    }
    return ms;
  };

  Searcher.prototype.qs = function (s, alpha, beta, ply) {
    this.tick();
    if (s.cap >= R.WIN_CAPS) return -(WIN - ply);
    var stand = evalSide(s);
    if (s.turn !== T || ply > 60) return stand;
    var caps = [], i, k;
    var any = false;
    for (i = 0; i < N; i++) if (s.b[i] === TIGER) {
      var a = ADJ[i], j = JUMPS[i];
      for (k = 0; k < a.length; k++) if (!s.b[a[k]]) any = true;
      for (k = 0; k < j.length; k++) if (s.b[j[k][0]] === GOAT && !s.b[j[k][1]]) caps.push(R.enc(i, j[k][1], j[k][0]));
    }
    if (!any && !caps.length) return -(WIN - ply); // every tiger stuck
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    var best = stand;
    for (i = 0; i < caps.length; i++) {
      R.make(s, caps[i]);
      var v = -this.qs(s, -beta, -alpha, ply + 1);
      R.unmake(s, caps[i]);
      if (v > best) { best = v; if (v > alpha) { alpha = v; if (v >= beta) break; } }
    }
    return best;
  };

  Searcher.prototype.repeated = function (s, ply) {
    if (s.hand !== 0) return false;
    var hk = R.hkey(s);
    if (this.seen.has(hk)) return true;
    for (var p = ply - 2; p >= 0; p -= 2) if (this.path[p] === hk) return true;
    return false;
  };

  Searcher.prototype.negamax = function (s, depth, alpha, beta, ply) {
    this.tick();
    if (this.abort) return 0;
    if (s.cap >= R.WIN_CAPS) return -(WIN - ply);
    if (ply > 0 && this.repeated(s, ply)) return 0;
    if (depth <= 0) return this.qs(s, alpha, beta, ply);
    this.path[ply] = R.hkey(s);

    var hk = this.path[ply], e = this.tt.get(hk), ttMove = 0, a0 = alpha;
    if (e) {
      ttMove = e.m;
      if (e.d >= depth && ply > 0) {
        if (e.f === 0) return e.v;
        if (e.f === 1 && e.v >= beta) return e.v;
        if (e.f === 2 && e.v <= alpha) return e.v;
      }
    }
    var ms = R.moves(s);
    if (!ms.length) return -(WIN - ply);
    this.order(s, ms, ply, ttMove);

    var best = -INF, bestM = ms[0];
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      R.make(s, m);
      var v = -this.negamax(s, depth - 1, -beta, -alpha, ply + 1);
      R.unmake(s, m);
      if (this.abort) return 0;
      if (v > best) { best = v; bestM = m; }
      if (v > alpha) alpha = v;
      if (alpha >= beta) {
        if (R.mCap(m) < 0) {
          var kl = this.killers[ply] || (this.killers[ply] = [0, 0]);
          if (kl[0] !== m) { kl[1] = kl[0]; kl[0] = m; }
          this.hist[s.turn][(R.mFrom(m) + 1) * 25 + R.mTo(m)] += depth * depth;
        }
        break;
      }
    }
    if (this.tt.size > 400000) this.tt.clear();
    this.tt.set(hk, { d: depth, v: best, f: best <= a0 ? 2 : best >= beta ? 1 : 0, m: bestM });
    return best;
  };

  // Root search. Returns { move, score (side to move), depth, nodes, scores? }.
  // opts: level, seen (hkeys of earlier positions), rnd, time, depth, nodes, exact (score every root move).
  function search(s0, opts) {
    opts = opts || {};
    var lv = LEVELS[opts.level || 'hard'];
    var maxD = opts.depth || lv.depth;
    var time = opts.time != null ? opts.time : lv.time;
    var s = R.clone(s0);
    var S = new Searcher(opts);
    var start = Date.now();
    S.deadline = time ? start + time : Infinity;
    if (opts.nodes) S.nodeLimit = opts.nodes;

    var ms = R.moves(s);
    if (!ms.length) return { move: 0, score: -WIN, depth: 0, nodes: 0 };
    if (ms.length === 1 && !opts.exact) return { move: ms[0], score: 0, depth: 0, nodes: 0 };

    var bestM = ms[0], bestV = -INF, done = 0, scores = null;
    for (var d = 1; d <= maxD; d++) {
      S.path[0] = R.hkey(s);
      var ttE = S.tt.get(S.path[0]);
      S.order(s, ms, 0, ttE ? ttE.m : bestM);
      var alpha = -INF, curM = ms[0], curV = -INF, sc = opts.exact ? [] : null;
      for (var i = 0; i < ms.length; i++) {
        R.make(s, ms[i]);
        var v = opts.exact ? -S.negamax(s, d - 1, -INF, INF, 1) : -S.negamax(s, d - 1, -INF, -alpha, 1);
        R.unmake(s, ms[i]);
        if (S.abort) break;
        if (sc) sc.push({ m: ms[i], v: v });
        if (v > curV) { curV = v; curM = ms[i]; }
        if (v > alpha) alpha = v;
      }
      if (S.abort) {
        // keep a partial iteration only if it already found something better than the last full one
        if (curV > bestV && d > 1 && curM === ms[0]) { bestM = curM; }
        break;
      }
      bestM = curM; bestV = curV; done = d; scores = sc;
      S.tt.set(S.path[0], { d: d, v: curV, f: 0, m: curM });
      if (Math.abs(curV) > WIN - 1000) break; // forced result found
    }
    return { move: bestM, score: bestV, depth: done, nodes: S.nodes, scores: scores, ms: Date.now() - start };
  }

  // Pick a move for a level. Easy and Medium make human-sized mistakes on purpose.
  function choose(s, opts) {
    opts = opts || {};
    var level = opts.level || 'hard', lv = LEVELS[level], rnd = opts.rnd || Math.random;
    var ms = R.moves(s);
    if (!ms.length) return { move: 0 };
    if (level === 'hard') return search(s, opts);
    if (rnd() < lv.blunder) return { move: ms[Math.floor(rnd() * ms.length)], blunder: true };
    var r = search(s, { level: level, seen: opts.seen, exact: true, time: opts.time, depth: opts.depth });
    var list = r.scores && r.scores.length ? r.scores : [{ m: r.move, v: r.score }];
    var top = -INF;
    list.forEach(function (x) { if (x.v > top) top = x.v; });
    if (top > WIN - 1000) return { move: r.move, score: top };
    var w = list.map(function (x) { return Math.exp((Math.max(x.v, top - 2000) - top) / lv.temp); });
    var sum = w.reduce(function (a, b) { return a + b; }, 0), pick = rnd() * sum;
    for (var i = 0; i < list.length; i++) { pick -= w[i]; if (pick <= 0) return { move: list[i].m, score: list[i].v }; }
    return { move: list[0].m, score: list[0].v };
  }

  // ---------- Daily Bagh ----------
  // Day 1 is 20 Nov 2026 (local date).
  var EPOCH = Date.UTC(2026, 10, 20);
  function dayNumber(date) {
    var d = date || new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000) + 1;
  }
  function mix(a, b) { var h = Math.imul(a ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(b + 0x632BE5AB, 0xC2B2AE35); h ^= h >>> 15; return h >>> 0; }

  // Two seeded engines play a seeded game until every goat is down and the hunt is on.
  // We keep a position where it is the goats' move, at most one goat is gone, and the goats
  // are a little ahead: a sharp middle game that good play can win against Hard in a few
  // minutes. Fixed depth, no clock, so every phone gets the same board.
  // (Tiger days were dropped: in engine tests Hard goats held every tiger start we tried,
  // even with 4 goats already eaten, so a tiger Daily was a guaranteed loss or a long draw.)
  function daily(n) {
    var side = 'G', want = R.G, TARGET = 450;
    var spare = null, sv = -INF;
    for (var attempt = 0; attempt < 40; attempt++) {
      var rnd = R.rng(mix(n, attempt + 1000));
      var g = new R.Game(R.initial());
      var plies = 46 + Math.floor(rnd() * 18);
      var opening = 3 + Math.floor(rnd() * 4);
      var cands = [];
      for (var p = 0; p < plies && !g.result; p++) {
        var ms = R.moves(g.s), m;
        if (p < opening) {
          // seeded opening: random, but never hand the tigers a free goat
          var safe = ms.filter(function (x) { var t = R.apply(g.s, x); return R.inDanger(t).length === 0; });
          var pool = safe.length ? safe : ms;
          m = pool[Math.floor(rnd() * pool.length)];
        } else {
          var r = search(g.s, { depth: 3, time: 0, exact: true, seen: g.seen });
          var best = -INF;
          r.scores.forEach(function (x) { if (x.v > best) best = x.v; });
          // the goat engine plays its best, the tiger engine a little loose, so the herd reaches the hunt mostly whole
          var slack = g.s.turn === R.G ? 0 : 90;
          var near = r.scores.filter(function (x) { return x.v >= best - slack; });
          m = near[Math.floor(rnd() * near.length)].m;
        }
        g.play(m);
        if (!g.result && g.s.turn === want && g.s.hand === 0 && g.s.cap <= 1 && plies - p <= 12 &&
          g.repCount() < 2 && R.moves(g.s).length >= 3 && R.trapped(g.s).length < 3) cands.push(R.clone(g.s));
      }
      var pick = null, pv = INF;
      for (var c = 0; c < cands.length; c++) {
        var v = search(cands[c], { depth: 4, time: 0 }).score; // goats' point of view
        if (Math.abs(v) > WIN - 1000) continue; // already decided
        var dist = Math.abs(v - TARGET);
        if (v > 150 && v < 1200 && dist < pv) { pv = dist; pick = cands[c]; }
        if (v > sv) { sv = v; spare = cands[c]; }
      }
      if (pick) return pack(n, side, pick, attempt);
    }
    if (spare) return pack(n, side, spare, 99);
    return dailyEarly(n);
  }
  function pack(n, side, s, attempt) {
    return { n: n, side: side, state: { b: s.b.slice(), hand: s.hand, cap: s.cap, turn: s.turn }, attempt: attempt };
  }
  // Fallback: a late placement-phase board (the first Daily design), then the opening.
  function dailyEarly(n) {
    var want = R.G;
    for (var attempt = 0; attempt < 40; attempt++) {
      var rnd = R.rng(mix(n, attempt));
      var g = new R.Game(R.initial());
      var plies = 20 + Math.floor(rnd() * 26);
      var cands = [];
      for (var p = 0; p < plies && !g.result; p++) {
        var r = search(g.s, { depth: 3, time: 0, exact: true, seen: g.seen });
        var best = -INF;
        r.scores.forEach(function (x) { if (x.v > best) best = x.v; });
        var near = r.scores.filter(function (x) { return x.v >= best - 35; });
        g.play(near[Math.floor(rnd() * near.length)].m);
        if (!g.result && g.s.turn === want && p >= 14 && g.s.cap <= 1 && plies - p <= 10) cands.push(R.clone(g.s));
      }
      if (cands.length) return pack(n, 'G', cands[cands.length - 1], -2);
    }
    return pack(n, 'G', R.initial(), -1);
  }

  var API = { LEVELS: LEVELS, WIN: WIN, evalTiger: evalTiger, search: search, choose: choose, daily: daily, dayNumber: dayNumber, EPOCH: EPOCH };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.BCAI = API;
})(this);
