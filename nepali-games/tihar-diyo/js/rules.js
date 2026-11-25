// Tihar Diyo: the pure puzzle rules. No DOM, no canvas, no timers.
// Runs in the browser (window.TDR) and under Node (module.exports) so levels, the daily puzzle,
// the solver and par can all be tested from the command line.
//
// A tile is a 4-bit mask of oil channels: N=1, E=2, S=4, W=8. Rotating clockwise moves each bit one place.
// Oil flows from every kalash (source) along channels that meet a matching channel on the next tile.
// A level is solved when every diyo has oil and no tile that has oil spills it (a channel end that points
// into the wall, an empty panel, or a neighbour without a matching channel).
(function (root) {
  'use strict';

  var DX = [0, 1, 0, -1];
  var DY = [-1, 0, 1, 0];

  function rot(m, k) {
    k = ((k % 4) + 4) % 4;
    while (k-- > 0) m = ((m << 1) | (m >> 3)) & 15;
    return m;
  }
  function period(m) {
    if (rot(m, 1) === m) return 1;
    if (rot(m, 2) === m) return 2;
    return 4;
  }
  function bits(m) { var n = 0; while (m) { n += m & 1; m >>= 1; } return n; }
  function shapeOf(m) {
    var b = bits(m);
    if (b === 0) return 'none';
    if (b === 1) return 'end';
    if (b === 2) return (m === 5 || m === 10) ? 'straight' : 'bend';
    if (b === 3) return 'tee';
    return 'cross';
  }
  // clockwise quarter turns that take mask `from` to mask `to`, or -1
  function turnsTo(from, to) {
    for (var k = 0; k < 4; k++) if (rot(from, k) === to) return k;
    return -1;
  }
  // fewest taps (clockwise tap or counter-clockwise hold, one move each) to take `from` to `to`
  function cost(from, to) {
    var k = turnsTo(from, to);
    if (k < 0) return -1;
    var p = period(from);
    k %= p;
    return Math.min(k, (p - k) % p);
  }
  function rots(m) {
    var p = period(m), out = [];
    for (var k = 0; k < p; k++) out.push(rot(m, k));
    return out;
  }

  // ---------- seeded random ----------
  function hash(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    var f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = function (n) { return Math.floor(f() * n); };
    f.pick = function (arr) { return arr[Math.floor(f() * arr.length)]; };
    f.shuffle = function (arr) {
      for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      return arr;
    };
    return f;
  }

  // ---------- boards ----------
  // Level data: { w, h, sol, rot, it, mod, wind }
  //   sol: one hex digit per cell, the solved channel mask (0 = carved panel, no tile)
  //   rot: one digit per cell, clockwise turns from the solved mask to the starting mask
  //   it:  '.' plain, 'd' diyo, 's' kalash (oil source)
  //   mod: '.' normal, 'x' locked (nailed down), 'w' wind tile (turns itself every `wind` taps)
  function parse(L) {
    var n = L.w * L.h, cells = [];
    for (var i = 0; i < n; i++) {
      var s = parseInt(L.sol[i], 16), r = +L.rot[i];
      cells.push({
        sol: s, m: rot(s, r), empty: s === 0,
        diyo: L.it[i] === 'd', src: L.it[i] === 's',
        lock: L.mod[i] === 'x', wind: L.mod[i] === 'w'
      });
    }
    return { w: L.w, h: L.h, cells: cells, windEvery: L.wind || 0, taps: 0 };
  }
  function encode(b) {
    var sol = '', r = '', it = '', mod = '';
    b.cells.forEach(function (c) {
      sol += c.sol.toString(16);
      r += c.empty ? '0' : String(turnsTo(c.sol, c.m));
      it += c.src ? 's' : c.diyo ? 'd' : '.';
      mod += c.lock ? 'x' : c.wind ? 'w' : '.';
    });
    var L = { w: b.w, h: b.h, sol: sol, rot: r, it: it, mod: mod };
    if (b.windEvery) L.wind = b.windEvery;
    return L;
  }
  function clone(b) {
    return { w: b.w, h: b.h, windEvery: b.windEvery, taps: b.taps, cells: b.cells.map(function (c) { return Object.assign({}, c); }) };
  }
  function tappable(c) { return !c.empty && !c.lock && !c.wind; }
  function nb(b, i, d) {
    var x = (i % b.w) + DX[d], y = Math.floor(i / b.w) + DY[d];
    if (x < 0 || y < 0 || x >= b.w || y >= b.h) return -1;
    return y * b.w + x;
  }

  // Oil flow from every kalash. Breadth first, so `dist` is how many tiles the oil travelled.
  function flow(b) {
    var n = b.cells.length;
    var on = new Uint8Array(n), dist = new Int16Array(n).fill(-1), from = new Int8Array(n).fill(-1);
    var order = [], leaks = [], q = [], lit = 0, diyos = 0, k;
    for (k = 0; k < n; k++) {
      if (b.cells[k].diyo) diyos++;
      if (b.cells[k].src && !b.cells[k].empty) { on[k] = 1; dist[k] = 0; q.push(k); }
    }
    for (var h = 0; h < q.length; h++) {
      var i = q[h], c = b.cells[i];
      order.push(i);
      if (c.diyo) lit++;
      for (var d = 0; d < 4; d++) {
        if (!(c.m & (1 << d))) continue;
        var j = nb(b, i, d), back = 1 << ((d + 2) % 4);
        if (j < 0 || b.cells[j].empty || !(b.cells[j].m & back)) { leaks.push([i, d]); continue; }
        if (!on[j]) { on[j] = 1; dist[j] = dist[i] + 1; from[j] = (d + 2) % 4; q.push(j); }
      }
    }
    return { on: on, dist: dist, from: from, order: order, leaks: leaks, lit: lit, diyos: diyos, won: diyos > 0 && lit === diyos && leaks.length === 0 };
  }
  function isWon(b) { return flow(b).won; }

  // One move. dir = 1 clockwise (tap), -1 counter-clockwise (hold / right-click).
  // Returns null when the tile can't turn, else the list of wind tiles that turned after this move.
  function tap(b, i, dir) {
    var c = b.cells[i];
    if (!c || !tappable(c)) return null;
    c.m = rot(c.m, dir < 0 ? 3 : 1);
    b.taps++;
    var wind = [];
    if (b.windEvery && b.taps % b.windEvery === 0) {
      b.cells.forEach(function (w, j) { if (w.wind) { w.m = rot(w.m, 1); wind.push(j); } });
    }
    return { wind: wind };
  }
  function tapsToWind(b) { return b.windEvery ? b.windEvery - (b.taps % b.windEvery) : 0; }

  // ---------- solver ----------
  // Every arrangement that wins, ignoring wind timing (a wind tile may end in any of its turns).
  // A solution is an Int8Array of masks; -1 marks a tile the oil never reaches (its turn doesn't matter).
  function solve(b, limit) {
    limit = limit || 2;
    var n = b.cells.length, cells = b.cells, i, d;
    var opts = cells.map(function (c) { return c.empty ? [] : c.lock ? [c.m] : rots(c.m); });
    var canBit = opts.map(function (os) { var m = 0; os.forEach(function (o) { m |= o; }); return m; });
    var nbr = [];
    for (i = 0; i < n; i++) { nbr.push([nb(b, i, 0), nb(b, i, 1), nb(b, i, 2), nb(b, i, 3)]); }
    var as = new Int8Array(n).fill(-1), sols = [], nodes = 0;
    var diyoIdx = [], srcIdx = [];
    for (i = 0; i < n; i++) { if (cells[i].diyo) diyoIdx.push(i); if (cells[i].src) srcIdx.push(i); }

    function fits(i, o) {
      for (var d = 0; d < 4; d++) {
        var j = nbr[i][d], back = 1 << ((d + 2) % 4);
        if (o & (1 << d)) {
          if (j < 0 || cells[j].empty) return false;
          if (as[j] >= 0) { if (!(as[j] & back)) return false; } else if (!(canBit[j] & back)) return false;
        } else if (j >= 0 && as[j] >= 0 && (as[j] & back)) return false;
      }
      return true;
    }
    function required(i) {
      if (cells[i].src) return true;
      for (var d = 0; d < 4; d++) {
        var j = nbr[i][d];
        if (j >= 0 && as[j] >= 0 && (as[j] & (1 << ((d + 2) % 4)))) return true;
      }
      return false;
    }
    function rec() {
      if (sols.length >= limit || nodes > 2e6) return;
      nodes++;
      var best = -1, bestOpts = null;
      for (var i = 0; i < n; i++) {
        if (as[i] !== -1 || cells[i].empty || !required(i)) continue;
        var ok = [];
        for (var k = 0; k < opts[i].length; k++) if (fits(i, opts[i][k])) ok.push(opts[i][k]);
        if (!ok.length) return;
        if (!bestOpts || ok.length < bestOpts.length) { best = i; bestOpts = ok; if (ok.length === 1) break; }
      }
      if (best < 0) {
        for (var q = 0; q < diyoIdx.length; q++) if (as[diyoIdx[q]] < 0) return;
        sols.push(Int8Array.from(as));
        return;
      }
      for (var t = 0; t < bestOpts.length; t++) {
        as[best] = bestOpts[t];
        rec();
        as[best] = -1;
      }
    }
    if (srcIdx.length && diyoIdx.length) rec();
    sols.nodes = nodes;
    return sols;
  }

  // ---------- par ----------
  // Fewest moves from the board as it stands to `sol` (masks, -1 = free). Each tile takes its cheaper way
  // round (clockwise taps or counter-clockwise holds). With wind tiles, the total must also land on a move
  // count where the wind has turned them right. Extra moves come in pairs (a turn and its undo), or singly
  // when there is a tappable tile whose turn doesn't matter (a cross, or a tile the oil doesn't use).
  function parTo(b, sol) {
    var M = 0, flex = false, wind = [];
    for (var i = 0; i < b.cells.length; i++) {
      var c = b.cells[i];
      if (c.empty) continue;
      if (tappable(c)) {
        if (sol[i] < 0) { flex = true; continue; }
        var k = cost(c.m, sol[i]);
        if (k < 0) return Infinity;
        M += k;
        if (period(c.m) === 1) flex = true;
      } else if (sol[i] >= 0) {
        if (c.wind) wind.push(i);
        else if (c.m !== sol[i]) return Infinity;
      }
    }
    if (!wind.length || !b.windEvery) return M;
    var N = b.windEvery, t0 = b.taps;
    for (var T = M; T <= M + 16 * N + 8; T += flex ? 1 : 2) {
      var steps = Math.floor((t0 + T) / N) - Math.floor(t0 / N);
      var ok = true;
      for (var w = 0; w < wind.length; w++) if (rot(b.cells[wind[w]].m, steps) !== sol[wind[w]]) { ok = false; break; }
      if (ok) return T;
    }
    return Infinity;
  }
  function intended(b) { return Int8Array.from(b.cells.map(function (c) { return c.empty ? -1 : c.sol; })); }
  function par(b) { return parTo(b, intended(b)); }

  // Stars: 3 at par, 2 within a small margin, 1 otherwise. A hint caps the level at 2.
  function margin(p) { return Math.max(2, Math.ceil(p * 0.3)); }
  function stars(moves, p, hinted) {
    var s = moves <= p ? 3 : moves <= p + margin(p) ? 2 : 1;
    return hinted ? Math.min(2, s) : s;
  }

  // Laxmi's hint: the next tile to set right, preferring one touching the oil.
  // Returns { i, dir, n } (n moves in direction dir), { wait: true } when only the wind is off, or null.
  function hint(b) {
    var f = flow(b), best = null, bestScore = -1;
    b.cells.forEach(function (c, i) {
      if (!tappable(c) || c.m === c.sol) return;
      var score = 1;
      if (f.on[i]) score = 3;
      else for (var d = 0; d < 4; d++) { var j = nb(b, i, d); if (j >= 0 && f.on[j]) score = 2; }
      if (c.diyo) score += 0.5;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    if (best === null) {
      return f.won ? null : { wait: true, taps: tapsToWind(b) };
    }
    var c = b.cells[best], p = period(c.m), k = turnsTo(c.m, c.sol) % p;
    return k <= p - k ? { i: best, dir: 1, n: k } : { i: best, dir: -1, n: p - k };
  }

  // ---------- generator ----------
  // opt: { w, h, empty, src (1|2), cross, wind (N, 0 = none), locks (extra nailed tiles),
  //        allowLock, maxLocks, minPar, maxPar, minDiyo, maxDiyo, maxStraight }
  function generate(opt, seed) {
    var R = rng(seed);
    for (var attempt = 0; attempt < 400; attempt++) {
      var b = tryGenerate(opt, R);
      if (b) { b.attempts = attempt + 1; return b; }
    }
    return null;
  }

  function tryGenerate(opt, R) {
    var w = opt.w, h = opt.h, n = w * h, i, d, j;
    var empty = new Uint8Array(n);
    // carved panels (no tile): keep the rest connected
    var tries = 0;
    for (var e = 0; e < (opt.empty || 0) && tries < 50; tries++) {
      i = R.int(n);
      if (empty[i]) continue;
      empty[i] = 1;
      if (!allConnected(w, h, empty)) { empty[i] = 0; continue; }
      e++;
    }
    var shell = { w: w, h: h, cells: [] };
    // Kruskal with random order, seeded with plus shapes for crosses
    var parent = []; for (i = 0; i < n; i++) parent.push(i);
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    function union(a, c) { a = find(a); c = find(c); if (a === c) return false; parent[a] = c; return true; }
    var mask = new Uint8Array(n);
    function link(a, dd) {
      var bb = nbIdx(w, h, a, dd);
      mask[a] |= 1 << dd; mask[bb] |= 1 << ((dd + 2) % 4);
    }
    var crosses = [];
    var want = opt.cross || 0;
    var cand = [];
    for (i = 0; i < n; i++) {
      if (empty[i]) continue;
      var full = true;
      for (d = 0; d < 4; d++) { j = nbIdx(w, h, i, d); if (j < 0 || empty[j]) full = false; }
      if (full) cand.push(i);
    }
    R.shuffle(cand);
    for (var ci = 0; ci < cand.length && crosses.length < want; ci++) {
      var x = cand[ci], ok = true;
      for (d = 0; d < 4; d++) { j = nbIdx(w, h, x, d); if (find(j) === find(x) || mask[j]) ok = false; }
      // the plus must not touch an earlier plus at all (keeps the tree a tree)
      for (var cc = 0; cc < crosses.length; cc++) {
        var y = crosses[cc];
        if (Math.abs(y % w - x % w) + Math.abs(Math.floor(y / w) - Math.floor(x / w)) < 3) ok = false;
      }
      if (!ok) continue;
      for (d = 0; d < 4; d++) { j = nbIdx(w, h, x, d); union(x, j); link(x, d); }
      crosses.push(x);
    }
    if (crosses.length < want) return null;
    var edges = [];
    for (i = 0; i < n; i++) {
      if (empty[i]) continue;
      for (d = 1; d <= 2; d++) { j = nbIdx(w, h, i, d); if (j >= 0 && !empty[j]) edges.push([i, d, j]); }
    }
    R.shuffle(edges);
    edges.forEach(function (ed) {
      if (crosses.indexOf(ed[0]) >= 0 || crosses.indexOf(ed[2]) >= 0) return; // crosses already have all four
      if (union(ed[0], ed[2])) link(ed[0], ed[1]);
    });
    // one tree? (crosses can block it; then give up this attempt)
    var root = -1;
    for (i = 0; i < n; i++) if (!empty[i]) { if (root < 0) root = find(i); else if (find(i) !== root) return null; }

    var cells = [];
    for (i = 0; i < n; i++) cells.push({ sol: empty[i] ? 0 : mask[i], m: 0, empty: !!empty[i], diyo: false, src: false, lock: false, wind: false });

    // kalash placement
    var srcN = opt.src || 1;
    var okSrc = function (k) { return !cells[k].empty && bits(cells[k].sol) <= 2; };
    var pool = []; for (i = 0; i < n; i++) if (okSrc(i)) pool.push(i);
    if (!pool.length) return null;
    var s1 = R.pick(pool), s2 = -1;
    if (srcN === 2) {
      var far = pool.filter(function (k) { return manhattan(w, k, s1) >= Math.floor((w + h) / 2); });
      if (!far.length) return null;
      s2 = R.pick(far);
      // cut the tree path between them, as near the middle as possible
      var path = treePath(w, h, cells, s1, s2);
      if (!path || path.length < 3) return null;
      var mid = Math.floor(path.length / 2) - 1 + R.int(2);
      mid = Math.max(0, Math.min(path.length - 2, mid));
      var a = path[mid], c2 = path[mid + 1];
      for (d = 0; d < 4; d++) if (nbIdx(w, h, a, d) === c2) { cells[a].sol &= ~(1 << d); cells[c2].sol &= ~(1 << ((d + 2) % 4)); }
      if (!cells[a].sol || !cells[c2].sol) return null;
      cells[s2].src = true;
      var big = treeSizes(w, h, cells, s1, s2);
      if (Math.min(big[0], big[1]) < Math.floor((n - countEmpty(empty)) / 4)) return null;
    }
    cells[s1].src = true;
    var diyo = 0, straight = 0, live = 0;
    cells.forEach(function (c) {
      if (c.empty) return;
      live++;
      if (bits(c.sol) === 1 && !c.src) { c.diyo = true; diyo++; }
      if (shapeOf(c.sol) === 'straight') straight++;
    });
    if (diyo < (opt.minDiyo || 2)) return null;
    if (opt.maxDiyo && diyo > opt.maxDiyo) return null;
    if (opt.maxStraight != null && straight > opt.maxStraight * live) return null;
    var crossCount = cells.filter(function (c) { return shapeOf(c.sol) === 'cross'; }).length;
    if (crossCount > want) return null;

    var b = { w: w, h: h, cells: cells, windEvery: opt.wind || 0, taps: 0 };
    // wind tile: a bend or tee away from the kalash
    if (opt.wind) {
      var wc = [];
      cells.forEach(function (c, k) {
        if (c.empty || c.src || c.diyo || period(c.sol) !== 4) return;
        var near = false;
        for (d = 0; d < 4; d++) { j = nbIdx(w, h, k, d); if (j >= 0 && cells[j].src) near = true; }
        if (!near) wc.push(k);
      });
      if (!wc.length) return null;
      cells[R.pick(wc)].wind = true;
    }
    // scramble
    cells.forEach(function (c) {
      if (c.empty) return;
      var p = period(c.sol);
      c.m = rot(c.sol, c.wind ? 1 + R.int(3) : R.int(4));
      if (p === 1) c.m = c.sol;
    });
    // decorative nails
    var lockable = [];
    cells.forEach(function (c, k) { if (!c.empty && !c.wind && period(c.sol) > 1) lockable.push(k); });
    R.shuffle(lockable);
    for (var L = 0; L < (opt.locks || 0) && L < lockable.length; L++) { var lc = cells[lockable[L]]; lc.lock = true; lc.m = lc.sol; }

    // make the intended answer the only answer, nailing tiles if this night allows it
    var locks = cells.filter(function (c) { return c.lock; }).length;
    for (var guard = 0; guard < 30; guard++) {
      var sols = solve(b, 2);
      if (!sols.length) return null;
      var other = null;
      for (var q = 0; q < sols.length; q++) if (!sameAsIntended(b, sols[q])) { other = sols[q]; break; }
      if (!other) break;
      if (!opt.allowLock || locks >= (opt.maxLocks || 6)) return null;
      var diff = [];
      cells.forEach(function (c, k) { if (!c.lock && !c.wind && !c.empty && other[k] >= 0 && other[k] !== c.sol) diff.push(k); });
      if (!diff.length) return null;
      var pickK = R.pick(diff);
      cells[pickK].lock = true; cells[pickK].m = cells[pickK].sol; locks++;
    }
    if (solve(b, 2).length !== 1) return null;
    if (flow(b).won) return null;
    var p0 = par(b);
    if (!isFinite(p0)) return null;
    if (opt.minPar && p0 < opt.minPar) return null;
    if (opt.maxPar && p0 > opt.maxPar) return null;
    b.par = p0;
    return b;
  }
  function sameAsIntended(b, s) {
    for (var i = 0; i < b.cells.length; i++) {
      var c = b.cells[i];
      if (c.empty) continue;
      if (s[i] !== c.sol) return false;
    }
    return true;
  }
  function nbIdx(w, h, i, d) {
    var x = (i % w) + DX[d], y = Math.floor(i / w) + DY[d];
    if (x < 0 || y < 0 || x >= w || y >= h) return -1;
    return y * w + x;
  }
  function manhattan(w, a, b) { return Math.abs(a % w - b % w) + Math.abs(Math.floor(a / w) - Math.floor(b / w)); }
  function countEmpty(e) { var k = 0; for (var i = 0; i < e.length; i++) k += e[i]; return k; }
  function allConnected(w, h, empty) {
    var n = w * h, start = -1, seen = new Uint8Array(n), q = [], total = 0;
    for (var i = 0; i < n; i++) if (!empty[i]) { total++; if (start < 0) start = i; }
    if (start < 0) return false;
    q.push(start); seen[start] = 1;
    for (var k = 0; k < q.length; k++) {
      for (var d = 0; d < 4; d++) { var j = nbIdx(w, h, q[k], d); if (j >= 0 && !empty[j] && !seen[j]) { seen[j] = 1; q.push(j); } }
    }
    return q.length === total;
  }
  function treePath(w, h, cells, a, z) {
    var prev = {}, q = [a]; prev[a] = -1;
    for (var k = 0; k < q.length; k++) {
      var i = q[k];
      if (i === z) break;
      for (var d = 0; d < 4; d++) {
        if (!(cells[i].sol & (1 << d))) continue;
        var j = nbIdx(w, h, i, d);
        if (j >= 0 && !(j in prev)) { prev[j] = i; q.push(j); }
      }
    }
    if (!(z in prev)) return null;
    var path = [];
    for (var x = z; x !== -1; x = prev[x]) path.unshift(x);
    return path;
  }
  function treeSizes(w, h, cells, a, z) {
    return [a, z].map(function (s) {
      var seen = {}, q = [s]; seen[s] = 1;
      for (var k = 0; k < q.length; k++) {
        for (var d = 0; d < 4; d++) {
          if (!(cells[q[k]].sol & (1 << d))) continue;
          var j = nbIdx(w, h, q[k], d);
          if (j >= 0 && !seen[j]) { seen[j] = 1; q.push(j); }
        }
      }
      return q.length;
    });
  }

  // ---------- Aajako Diyo (daily) ----------
  // Same 6x6 puzzle for everyone on a given local date. The weekday picks the twist.
  var EPOCH = Date.UTC(2026, 9, 1); // 1 Oct 2026 = #1
  function dateKey(dt) {
    dt = dt || new Date();
    var m = dt.getMonth() + 1, d = dt.getDate();
    return dt.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }
  function dayNumber(key) {
    var p = key.split('-');
    return Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - EPOCH) / 86400000) + 1;
  }
  var TWISTS = [
    { tw: 'plain', o: { cross: 0 } },
    { tw: 'nails', o: { locks: 3 } },
    { tw: 'two', o: { src: 2 } },
    { tw: 'cross', o: { cross: 1 } },
    { tw: 'wind', o: { wind: 3 } },
    { tw: 'twocross', o: { src: 2, cross: 1 } },
    { tw: 'windnails', o: { wind: 4, locks: 2 } }
  ];
  function dailyOptions(key) {
    var p = key.split('-');
    var wd = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
    var tw = TWISTS[wd];
    var R = rng(hash('diyo-daily-shape:' + key));
    var o = { w: 6, h: 6, empty: R.int(3), src: 1, cross: 0, wind: 0, locks: 0, allowLock: true, maxLocks: 7, minPar: 14, maxPar: 40, minDiyo: 5, maxDiyo: 11, maxStraight: 0.34 };
    for (var k in tw.o) o[k] = tw.o[k];
    return { opt: o, twist: tw.tw };
  }
  function daily(key) {
    key = key || dateKey();
    var d = dailyOptions(key);
    var b = generate(d.opt, hash('tihar-diyo:' + key));
    if (!b) return null;
    var L = encode(b);
    L.id = 'daily-' + key; L.par = b.par; L.twist = d.twist; L.n = dayNumber(key); L.key = key;
    return L;
  }

  var API = {
    rot: rot, period: period, bits: bits, shapeOf: shapeOf, turnsTo: turnsTo, cost: cost, rots: rots,
    hash: hash, rng: rng,
    parse: parse, encode: encode, clone: clone, tappable: tappable, nb: nb, flow: flow, isWon: isWon,
    tap: tap, tapsToWind: tapsToWind, solve: solve, parTo: parTo, par: par, intended: intended,
    margin: margin, stars: stars, hint: hint, generate: generate,
    dateKey: dateKey, dayNumber: dayNumber, dailyOptions: dailyOptions, daily: daily
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.TDR = API;
})(this);
