// Puzzle rules, solver and generator. Pure functions, no DOM, so it also runs in Node for testing.
// A state is { mask, side }: bit i of mask set = cast member i is on the far bank (pari);
// side is where the basket is (0 = this side / wari, 1 = pari).
import { CAST, IDS } from './cast.js';

const bits = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };
export const popcount = bits;

/** Turn { cast: [ids], cap } into bitmasks the solver can use. */
export function compile(p, { free = false } = {}) {
  const cast = p.cast;
  const n = cast.length;
  const ents = cast.map((id) => ({ id, ...CAST[id] }));
  const eats = ents.map((e) => (free ? 0 : (e.eats || []).reduce((m, b) => {
    const j = cast.indexOf(b); return j >= 0 ? m | (1 << j) : m;
  }, 0)));
  let human = 0; let pull = 0; let lonely = 0;
  ents.forEach((e, i) => {
    if (e.human) human |= 1 << i;
    if (e.pull) pull |= 1 << i;
    if (e.lonely) lonely |= 1 << i;
  });
  return { cast, cap: p.cap, n, ents, eats, human, pull, lonely, all: (1 << n) - 1 };
}

/** [eater, eaten] on this bank, or null when the bank is safe. */
export function conflict(P, bank) {
  if (bank & P.human) return null;
  for (let i = 0; i < P.n; i++) {
    if (!((bank >> i) & 1)) continue;
    const prey = P.eats[i] & bank;
    if (prey) return [i, Math.log2(prey & -prey)];
  }
  return null;
}

/** Why this basket load can't leave, or null when it can. */
export function loadProblem(P, load) {
  if (!load) return 'empty';
  if (bits(load) > P.cap) return 'full';
  if (!(load & P.pull)) return 'needDriver';
  if (bits(load) === 1 && (load & P.lonely)) return 'alone';
  return null;
}

export const step = (s, load) => ({ mask: s.mask ^ load, side: s.side ^ 1 });
export const stateConflict = (P, s) => conflict(P, P.all & ~s.mask) || conflict(P, s.mask);
export const isGoal = (P, s) => s.mask === P.all;

/** Shortest list of basket loads from `start` to everyone across, or null if impossible. */
export function solve(P, start = { mask: 0, side: 0 }) {
  if (stateConflict(P, start)) return null;
  const key = (s) => s.mask | (s.side << P.n);
  const prev = new Map([[key(start), null]]);
  let frontier = [start];
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      if (isGoal(P, s)) {
        const path = [];
        for (let k = key(s); prev.get(k); k = prev.get(k).from) path.unshift(prev.get(k).load);
        return path;
      }
      const here = s.side ? s.mask : P.all & ~s.mask;
      for (let load = here; load; load = (load - 1) & here) {
        if (loadProblem(P, load)) continue;
        const t = step(s, load);
        const k = key(t);
        if (prev.has(k) || stateConflict(P, t)) continue;
        prev.set(k, { from: key(s), load });
        next.push(t);
      }
    }
    frontier = next;
  }
  return null;
}

/** Everything the builder and generator need to judge a puzzle. */
export function judge(p) {
  if (!p.cast.length) return { ok: false, why: 'empty' };
  const P = compile(p);
  if (!P.pull) return { ok: false, why: 'noDriver' };
  const path = solve(P);
  if (!path) return { ok: false, why: 'impossible' };
  const freePath = solve(compile(p, { free: true }));
  return { ok: true, par: path.length, free: freePath ? freePath.length : path.length, path };
}

/** The "X eats Y" pairs that actually matter in this cast. */
export function eatPairs(cast) {
  const out = [];
  cast.forEach((a) => (CAST[a].eats || []).forEach((b) => { if (cast.includes(b)) out.push([a, b]); }));
  return out;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DRIVERS = [['didi'], ['didi'], ['didi'], ['bhai'], ['didi', 'bhai'], ['bandar'], ['didi', 'bandar'], ['bhai', 'bandar']];
const OTHERS = IDS.filter((id) => !CAST[id].human);

/**
 * Seeded puzzle. Same seed and options give the same puzzle on every device.
 * Rejects puzzles where the rules barely matter (par must beat the no-rules par by `twist`).
 */
export function generate(seed, { minN = 4, maxN = 6, minPar = 7, maxPar = 11, caps = [2], twist = 2, minPairs = 2 } = {}) {
  const r = rng(seed);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  let best = null;
  for (let tries = 0; tries < 4000; tries++) {
    const drivers = pick(DRIVERS);
    const n = minN + Math.floor(r() * (maxN - minN + 1));
    const pool = OTHERS.filter((id) => !drivers.includes(id));
    const cast = [...drivers];
    while (cast.length < n && pool.length) cast.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    cast.sort((a, b) => IDS.indexOf(a) - IDS.indexOf(b));
    if (eatPairs(cast).length < minPairs) continue;
    const cap = pick(caps);
    const j = judge({ cast, cap });
    if (!j.ok) continue;
    const puzzle = { cast, cap, par: j.par };
    if (j.par >= minPar && j.par <= maxPar && j.par - j.free >= twist) return puzzle;
    if (!best || Math.abs(j.par - minPar) < Math.abs(best.par - minPar)) best = puzzle;
  }
  return best;
}

/* ---- campaign and daily ---- */

// Hand-picked from an offline search, ranked by how much the rules add over a no-rules crossing.
// Each level brings in one new idea. A 3-seat basket is almost always trivial, so only one level uses it.
const LEVELS = [
  { cast: ['didi', 'bagh', 'bakhra', 'ghans'], cap: 2 },                                  // the classic
  { cast: ['didi', 'bagh', 'kukur', 'biralo'], cap: 2 },                                  // a different chain
  { cast: ['didi', 'bandar', 'makai', 'momo'], cap: 2 },                                  // the monkey pulls (and steals)
  { cast: ['bhai', 'bandar', 'biralo', 'makai'], cap: 2 },                                // Bhai can't pull alone
  { cast: ['didi', 'bagh', 'bakhra', 'maachha', 'kukhura'], cap: 2 },
  { cast: ['didi', 'bagh', 'bakhra', 'kukur', 'biralo', 'maachha'], cap: 3 },             // big basket, big crowd
  { cast: ['didi', 'bandar', 'kukhura', 'makai', 'momo'], cap: 2 },
  { cast: ['bhai', 'bandar', 'bagh', 'biralo', 'makai'], cap: 2 },
  { cast: ['bhai', 'bandar', 'kukur', 'maachha', 'makai', 'momo'], cap: 2 },
  { cast: ['bhai', 'bandar', 'bagh', 'biralo', 'makai', 'momo'], cap: 2 },
  { cast: ['didi', 'bandar', 'bagh', 'kukur', 'kukhura', 'makai', 'momo'], cap: 2 },
  { cast: ['bhai', 'bandar', 'bakhra', 'kukur', 'maachha', 'makai', 'momo'], cap: 2 },
];

let levelCache = null;
export function levels() {
  if (!levelCache) levelCache = LEVELS.map((p) => ({ ...p, par: judge(p).par }));
  return levelCache;
}

export const DAY_ONE = Date.UTC(2026, 10, 11); // Tuin #1 = 11 Nov 2026

export function dayNumber(now = new Date()) {
  const local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((local - DAY_ONE) / 86400000) + 1;
}

export function daily(n) {
  return generate(n * 7919 + 17, { minN: 5, maxN: 6, minPar: 9, maxPar: 13 });
}

/* ---- share codes: "2-0345b" = basket holds 2, cast IDS indexes in base 36 ---- */

export function encode(p) {
  return `${p.cap}-${p.cast.map((id) => IDS.indexOf(id).toString(36)).join('')}`;
}

export function decode(code) {
  const m = /^([23])-([0-9a-z]{2,8})$/.exec(code || '');
  if (!m) return null;
  const cast = [...m[2]].map((c) => IDS[parseInt(c, 36)]);
  if (cast.some((id) => !id) || new Set(cast).size !== cast.length) return null;
  cast.sort((a, b) => IDS.indexOf(a) - IDS.indexOf(b));
  const j = judge({ cast, cap: Number(m[1]) });
  return j.ok ? { cast, cap: Number(m[1]), par: j.par } : null;
}
