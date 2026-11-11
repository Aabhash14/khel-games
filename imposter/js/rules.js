// Pure game rules: no DOM, no audio. Everything takes an rng so it can be simulated in Node.
import { PACKS, packById } from './words.js';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const CLUE_ROUNDS = 2;
export const POINTS = { crewCatch: 1, imposterEscape: 2, imposterSteal: 3 };

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A shuffled deck of {pack, idx} across the chosen packs. No repeats until it runs out. */
export function buildDeck(packIds, rng) {
  const cards = [];
  for (const id of packIds) {
    const p = packById(id);
    if (p) p.words.forEach((_, idx) => cards.push({ pack: id, idx }));
  }
  return shuffle(cards, rng);
}

export function newGame(names, { mode = 'classic', packIds = PACKS.map((p) => p.id) } = {}, rng = Math.random) {
  if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) throw new Error('bad player count');
  return {
    players: names.map((name) => ({ name, score: 0 })),
    mode,
    packIds: packIds.length ? packIds : PACKS.map((p) => p.id),
    deck: [],
    history: [], // imposter index per finished round
    round: null,
  };
}

/** Weighted pick so the same person is rarely imposter twice in a row. */
function pickImposter(game, rng) {
  const n = game.players.length;
  const last = game.history[game.history.length - 1];
  const prev = game.history[game.history.length - 2];
  const w = game.players.map((_, i) => (i === last ? (i === prev ? 0.05 : 0.35) : 1));
  let r = rng() * w.reduce((s, x) => s + x, 0);
  for (let i = 0; i < n; i++) { r -= w[i]; if (r <= 0) return i; }
  return n - 1;
}

export function startRound(game, rng = Math.random) {
  if (!game.deck.length) game.deck = buildDeck(game.packIds, rng);
  const card = game.deck.pop();
  const [aEn, aNe, bEn, bNe] = packById(card.pack).words[card.idx];
  const flip = rng() < 0.5; // which half of the pair the crew gets
  const crew = flip ? { en: bEn, ne: bNe } : { en: aEn, ne: aNe };
  const twin = flip ? { en: aEn, ne: aNe } : { en: bEn, ne: bNe };
  const n = game.players.length;
  const imposter = pickImposter(game, rng);
  // The imposter never opens the clues: going first with no word is unfair, not tense.
  let starter;
  do { starter = Math.floor(rng() * n); } while (starter === imposter);
  const order = Array.from({ length: n }, (_, k) => (starter + k) % n);
  game.round = { card, crew, twin, imposter, starter, order, accused: null, guess: null, outcome: null };
  return game.round;
}

/** What player i sees on their chit. */
export function secretFor(game, i) {
  const r = game.round;
  const pack = packById(r.card.pack);
  if (i !== r.imposter) return { kind: 'word', word: r.crew, pack };
  if (game.mode === 'sneaky') return { kind: 'word', word: r.twin, pack };
  return { kind: 'imposter', pack };
}

/** Six choices for the imposter's last-chance guess: the answer, the twin, four from the same pack. */
export function guessOptions(game, rng = Math.random) {
  const r = game.round;
  const pack = packById(r.card.pack);
  const pool = [];
  pack.words.forEach(([aEn, aNe, bEn, bNe], idx) => {
    if (idx === r.card.idx) return;
    pool.push({ en: aEn, ne: aNe }, { en: bEn, ne: bNe });
  });
  const seen = new Set([r.crew.en, r.twin.en]);
  const extra = shuffle(pool, rng).filter((w) => !seen.has(w.en) && seen.add(w.en)).slice(0, 4);
  return shuffle([r.crew, r.twin, ...extra], rng);
}

/** accused: player index, or -1 for a tie / nobody. */
export function accuse(game, accused) {
  const r = game.round;
  r.accused = accused;
  r.outcome = accused === r.imposter ? 'caught' : 'escaped';
  return r.outcome;
}

/** guess: a word object or null (time ran out). Only valid after 'caught'. */
export function lastGuess(game, guess) {
  const r = game.round;
  r.guess = guess;
  r.outcome = guess && guess.en === r.crew.en ? 'stolen' : 'crew';
  return r.outcome;
}

/** Applies points once and returns per-player deltas. Outcome 'caught' with no guess counts as crew win. */
export function score(game) {
  const r = game.round;
  if (r.outcome === 'caught') r.outcome = 'crew';
  const delta = game.players.map(() => 0);
  if (r.outcome === 'crew') {
    game.players.forEach((_, i) => { if (i !== r.imposter) delta[i] = POINTS.crewCatch; });
  } else if (r.outcome === 'escaped') {
    delta[r.imposter] = POINTS.imposterEscape;
  } else if (r.outcome === 'stolen') {
    delta[r.imposter] = POINTS.imposterSteal;
  }
  delta.forEach((d, i) => { game.players[i].score += d; });
  game.history.push(r.imposter);
  return delta;
}

export const imposterWon = (outcome) => outcome === 'escaped' || outcome === 'stolen';
