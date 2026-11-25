// Bagh-Chal rules. Pure: no DOM, runs in the browser, in a Web Worker and under Node.
// Board: 5x5 points, index i = row * 5 + col. Orthogonal lines everywhere, diagonals
// through points where (row + col) is even. 0 = empty, 1 = goat, 2 = tiger.
(function (root) {
  'use strict';
  var N = 25, EMPTY = 0, GOAT = 1, TIGER = 2;
  var G = 0, T = 1; // side to move
  var GOATS = 20, WIN_CAPS = 5;

  var ADJ = [], JUMPS = [], SEGS = [];
  (function build() {
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (var i = 0; i < N; i++) {
      var r = (i / 5) | 0, c = i % 5, adj = [], jumps = [];
      for (var d = 0; d < 8; d++) {
        var dr = dirs[d][0], dc = dirs[d][1];
        if (dr && dc && (r + c) % 2) continue; // no diagonal through odd points
        var r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
        if (r1 < 0 || r1 > 4 || c1 < 0 || c1 > 4) continue;
        adj.push(r1 * 5 + c1);
        if (r2 >= 0 && r2 <= 4 && c2 >= 0 && c2 <= 4) jumps.push([r1 * 5 + c1, r2 * 5 + c2]);
        var j = r1 * 5 + c1;
        if (j > i) SEGS.push([i, j]);
      }
      ADJ.push(adj); JUMPS.push(jumps);
    }
  })();

  // Zobrist keys from a fixed seed, so the same position hashes the same everywhere.
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var Z1 = [], Z2 = [];
  (function () {
    var r = rng(0xBA6C4A1);
    var u = function () { return (r() * 4294967296) >>> 0; };
    for (var k = 0; k < N * 3 + 2 + 21; k++) { Z1.push(u()); Z2.push(u()); }
  })();
  var ZT = N * 3, ZH = N * 3 + 2; // side key, hand keys

  function rehash(s) {
    var h1 = 0, h2 = 0;
    for (var i = 0; i < N; i++) if (s.b[i]) { h1 ^= Z1[i * 3 + s.b[i]]; h2 ^= Z2[i * 3 + s.b[i]]; }
    h1 ^= Z1[ZT + s.turn]; h2 ^= Z2[ZT + s.turn];
    h1 ^= Z1[ZH + s.hand]; h2 ^= Z2[ZH + s.hand];
    s.h1 = h1 >>> 0; s.h2 = h2 >>> 0;
    return s;
  }
  // 52-bit number usable as a Map key.
  function hkey(s) { return s.h1 * 1048576 + (s.h2 & 0xFFFFF); }

  function initial() {
    var b = new Array(N).fill(EMPTY);
    b[0] = b[4] = b[20] = b[24] = TIGER;
    return rehash({ b: b, hand: GOATS, cap: 0, turn: G });
  }
  function clone(s) { return { b: s.b.slice(), hand: s.hand, cap: s.cap, turn: s.turn, h1: s.h1, h2: s.h2 }; }
  function fromPlain(o) { return rehash({ b: Array.prototype.slice.call(o.b), hand: o.hand, cap: o.cap, turn: o.turn }); }

  // Moves are small ints: (from + 1) | to << 5 | (cap + 1) << 10. from = -1 means placing a goat.
  function enc(from, to, cap) { return (from + 1) | (to << 5) | ((cap + 1) << 10); }
  function mFrom(m) { return (m & 31) - 1; }
  function mTo(m) { return (m >> 5) & 31; }
  function mCap(m) { return ((m >> 10) & 31) - 1; }
  function dec(m) { return { from: mFrom(m), to: mTo(m), cap: mCap(m) }; }

  function goatMoves(s, out) {
    var b = s.b, i, k;
    if (s.hand > 0) { for (i = 0; i < N; i++) if (!b[i]) out.push(enc(-1, i, -1)); return out; }
    for (i = 0; i < N; i++) if (b[i] === GOAT) {
      var a = ADJ[i];
      for (k = 0; k < a.length; k++) if (!b[a[k]]) out.push(enc(i, a[k], -1));
    }
    return out;
  }
  function tigerMovesFrom(s, i, out) {
    var b = s.b, a = ADJ[i], j = JUMPS[i], k;
    for (k = 0; k < j.length; k++) if (b[j[k][0]] === GOAT && !b[j[k][1]]) out.push(enc(i, j[k][1], j[k][0]));
    for (k = 0; k < a.length; k++) if (!b[a[k]]) out.push(enc(i, a[k], -1));
    return out;
  }
  function tigerMoves(s, out) {
    for (var i = 0; i < N; i++) if (s.b[i] === TIGER) tigerMovesFrom(s, i, out);
    return out;
  }
  function moves(s) { return s.turn === G ? goatMoves(s, []) : tigerMoves(s, []); }
  function movesFrom(s, i) {
    if (s.turn === T) return s.b[i] === TIGER ? tigerMovesFrom(s, i, []) : [];
    if (s.hand > 0 || s.b[i] !== GOAT) return [];
    var out = [], a = ADJ[i];
    for (var k = 0; k < a.length; k++) if (!s.b[a[k]]) out.push(enc(i, a[k], -1));
    return out;
  }

  // In place, with incremental hash. unmake must get the same move back.
  function make(s, m) {
    var f = mFrom(m), t = mTo(m), c = mCap(m), b = s.b, h1 = s.h1, h2 = s.h2;
    h1 ^= Z1[ZT + s.turn]; h2 ^= Z2[ZT + s.turn];
    if (s.turn === G) {
      if (f < 0) { h1 ^= Z1[ZH + s.hand]; h2 ^= Z2[ZH + s.hand]; s.hand--; h1 ^= Z1[ZH + s.hand]; h2 ^= Z2[ZH + s.hand]; }
      else { b[f] = EMPTY; h1 ^= Z1[f * 3 + GOAT]; h2 ^= Z2[f * 3 + GOAT]; }
      b[t] = GOAT; h1 ^= Z1[t * 3 + GOAT]; h2 ^= Z2[t * 3 + GOAT];
      s.turn = T;
    } else {
      b[f] = EMPTY; h1 ^= Z1[f * 3 + TIGER]; h2 ^= Z2[f * 3 + TIGER];
      b[t] = TIGER; h1 ^= Z1[t * 3 + TIGER]; h2 ^= Z2[t * 3 + TIGER];
      if (c >= 0) { b[c] = EMPTY; h1 ^= Z1[c * 3 + GOAT]; h2 ^= Z2[c * 3 + GOAT]; s.cap++; }
      s.turn = G;
    }
    h1 ^= Z1[ZT + s.turn]; h2 ^= Z2[ZT + s.turn];
    s.h1 = h1 >>> 0; s.h2 = h2 >>> 0;
  }
  function unmake(s, m) {
    var f = mFrom(m), t = mTo(m), c = mCap(m), b = s.b, h1 = s.h1, h2 = s.h2;
    h1 ^= Z1[ZT + s.turn]; h2 ^= Z2[ZT + s.turn];
    if (s.turn === T) { // goat moved last
      b[t] = EMPTY; h1 ^= Z1[t * 3 + GOAT]; h2 ^= Z2[t * 3 + GOAT];
      if (f < 0) { h1 ^= Z1[ZH + s.hand]; h2 ^= Z2[ZH + s.hand]; s.hand++; h1 ^= Z1[ZH + s.hand]; h2 ^= Z2[ZH + s.hand]; }
      else { b[f] = GOAT; h1 ^= Z1[f * 3 + GOAT]; h2 ^= Z2[f * 3 + GOAT]; }
      s.turn = G;
    } else {
      b[t] = EMPTY; h1 ^= Z1[t * 3 + TIGER]; h2 ^= Z2[t * 3 + TIGER];
      b[f] = TIGER; h1 ^= Z1[f * 3 + TIGER]; h2 ^= Z2[f * 3 + TIGER];
      if (c >= 0) { b[c] = GOAT; h1 ^= Z1[c * 3 + GOAT]; h2 ^= Z2[c * 3 + GOAT]; s.cap--; }
      s.turn = T;
    }
    h1 ^= Z1[ZT + s.turn]; h2 ^= Z2[ZT + s.turn];
    s.h1 = h1 >>> 0; s.h2 = h2 >>> 0;
  }
  function apply(s, m) { var n = clone(s); make(n, m); return n; }
  function isLegal(s, m) { return moves(s).indexOf(m) >= 0; }

  // Game result ignoring repetition: 'T' (5 goats taken, or goats cannot move),
  // 'G' (tigers to move and every tiger is stuck), or null.
  function winner(s) {
    if (s.cap >= WIN_CAPS) return 'T';
    if (s.turn === T) return tigerMoves(s, []).length ? null : 'G';
    return goatMoves(s, []).length ? null : 'T';
  }

  // Repetition key: board + side to move. Only counted once every goat is placed.
  function key(s) { return s.b.join('') + s.turn; }

  function tigers(s) { var o = []; for (var i = 0; i < N; i++) if (s.b[i] === TIGER) o.push(i); return o; }
  function goatsOnBoard(s) { var n = 0; for (var i = 0; i < N; i++) if (s.b[i] === GOAT) n++; return n; }
  function tigerMobility(s, i) { return tigerMovesFrom(s, i, []).length; }
  function trapped(s) { return tigers(s).filter(function (i) { return tigerMobility(s, i) === 0; }); }
  // Goats a tiger could jump right now (whoever is to move).
  function inDanger(s) {
    var set = {}, out = [];
    for (var i = 0; i < N; i++) if (s.b[i] === TIGER) {
      var j = JUMPS[i];
      for (var k = 0; k < j.length; k++) if (s.b[j[k][0]] === GOAT && !s.b[j[k][1]] && !set[j[k][0]]) { set[j[k][0]] = 1; out.push(j[k][0]); }
    }
    return out;
  }
  // Empty points where a goat placed now could be jumped straight away.
  function unsafeDrops(s) {
    var out = [];
    for (var i = 0; i < N; i++) if (!s.b[i]) {
      var risky = false, j;
      for (var t = 0; t < N && !risky; t++) if (s.b[t] === TIGER) {
        j = JUMPS[t];
        for (var k = 0; k < j.length; k++) {
          var mid = j[k][0], land = j[k][1];
          if (mid === i && !s.b[land]) { risky = true; break; }
        }
      }
      if (risky) out.push(i);
    }
    return out;
  }

  // A whole game: start position, move list, repetition counts and result.
  // result = { w: 'G' | 'T' | 'D', why: 'caps' | 'trapped' | 'stuck' | 'repeat' } or null.
  function Game(start) {
    this.start = clone(start || initial());
    this.reset();
  }
  Game.prototype.reset = function () {
    this.s = clone(this.start); this.list = []; this.rep = {}; this.seen = []; this.result = null;
    this._count();
  };
  Game.prototype._count = function () {
    var s = this.s;
    if (s.hand === 0) {
      var k = key(s);
      this.rep[k] = (this.rep[k] || 0) + 1;
      this.seen.push(hkey(s));
      if (this.rep[k] >= 3) { this.result = { w: 'D', why: 'repeat' }; return; }
    }
    var w = winner(s);
    if (w) this.result = { w: w, why: w === 'G' ? 'trapped' : (s.cap >= WIN_CAPS ? 'caps' : 'stuck') };
  };
  Game.prototype.play = function (m) {
    if (this.result || !isLegal(this.s, m)) return false;
    make(this.s, m); this.list.push(m); this._count();
    return true;
  };
  Game.prototype.undo = function (n) {
    var keep = this.list.slice(0, Math.max(0, this.list.length - (n || 1)));
    this.reset();
    for (var i = 0; i < keep.length; i++) { make(this.s, keep[i]); this.list.push(keep[i]); this._count(); }
  };
  Game.prototype.repCount = function (s) { return this.rep[key(s || this.s)] || 0; };

  var API = {
    N: N, EMPTY: EMPTY, GOAT: GOAT, TIGER: TIGER, G: G, T: T, GOATS: GOATS, WIN_CAPS: WIN_CAPS,
    ADJ: ADJ, JUMPS: JUMPS, SEGS: SEGS, Z1: Z1, Z2: Z2,
    rng: rng, initial: initial, clone: clone, fromPlain: fromPlain, rehash: rehash, hkey: hkey,
    enc: enc, dec: dec, mFrom: mFrom, mTo: mTo, mCap: mCap,
    moves: moves, movesFrom: movesFrom, goatMoves: goatMoves, tigerMoves: tigerMoves, tigerMovesFrom: tigerMovesFrom,
    make: make, unmake: unmake, apply: apply, isLegal: isLegal, winner: winner, key: key,
    tigers: tigers, goatsOnBoard: goatsOnBoard, tigerMobility: tigerMobility, trapped: trapped,
    inDanger: inDanger, unsafeDrops: unsafeDrops, Game: Game,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.BCRules = API;
})(this);
