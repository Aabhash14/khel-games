/* Pure game rules for Chautari Quiz: no DOM, no storage, so they can be unit-tested.
   Loaded in the browser as window.ChautariLogic and in Node via require(). Every
   function that uses chance takes an optional `rand` (defaults to Math.random). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChautariLogic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* prize ladder in rupees; safe steps are indexes into it */
  const LADDER = [1000, 2000, 3000, 5000, 10000, 20000, 40000, 80000, 160000, 320000, 640000, 1250000, 2500000, 5000000, 10000000];
  const SAFE = [4, 9, 14]; // Rs. 10,000, Rs. 3,20,000 and the top

  const NP_DIGITS = '०१२३४५६७८९';
  /** Western digits to Devanagari when lang is 'np'. */
  function digits(s, lang) {
    const str = String(s);
    return lang === 'np' ? str.replace(/[0-9]/g, (d) => NP_DIGITS[d]) : str;
  }

  /** Indian/Nepali grouping: 1,00,00,000 */
  function groupIndian(n) {
    const s = String(n);
    const last3 = s.slice(-3), rest = s.slice(0, -3);
    return rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  }

  /** "Rs. 1,00,00,000" or "रु. १,००,००,०००" */
  function money(n, lang) {
    return (lang === 'np' ? 'रु. ' : 'Rs. ') + digits(groupIndian(n), lang);
  }

  function shuffle(arr, rand) {
    const r = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /** Money already won before answering question index `level` (0-based). */
  function banked(level) { return level > 0 ? LADDER[level - 1] : 0; }

  /** What a wrong answer at question index `level` still pays: the last safe step passed. */
  function safeFloor(level) {
    let s = 0;
    for (const i of SAFE) if (i < level) s = LADDER[i];
    return s;
  }

  /** Cut two: pick two wrong answers to remove from the still-live slots. */
  function cutTwo(live, right, rand) {
    return shuffle(live.filter((s) => s !== right), rand).slice(0, 2);
  }

  /** Ask the chautari: percentages per slot (null for removed slots), always summing to 100.
      Reliable early (~78% on the right answer), shaky near the top (~29%), and on hard
      questions the crowd sometimes backs a wrong answer. */
  function makePoll(level, live, right, rand) {
    const r = rand || Math.random;
    const sure = 0.78 - level * 0.035;
    const weights = {};
    const correctW = Math.max(0.2, sure + (r() - 0.5) * 0.16);
    const others = live.filter((s) => s !== right);
    const raw = others.map(() => r() + 0.2);
    const sum = raw.reduce((a, b) => a + b, 0);
    others.forEach((s, i) => { weights[s] = (1 - correctW) * (raw[i] / sum); });
    weights[right] = correctW;
    if (others.length && r() < level / 40) {
      const decoy = others[Math.floor(r() * others.length)];
      const hi = Math.max(weights[decoy], weights[right]), lo = Math.min(weights[decoy], weights[right]);
      weights[decoy] = hi; weights[right] = lo;
    }
    if (!others.length) weights[right] = 1;
    const out = [null, null, null, null];
    let total = 0;
    live.forEach((s) => { out[s] = Math.round(weights[s] * 100); total += out[s]; });
    out[right] += 100 - total;
    return out;
  }

  /** Draw a question from one difficulty level that is not in `seen` (asked on this device)
      or `avoid` (asked this game). When the level is used up, only that level's ids are
      released from `seen`. Mutates both sets. Returns the question, or null if nothing is left. */
  function drawQuestion(levelQuestions, seen, avoid, rand) {
    const r = rand || Math.random;
    let options = levelQuestions.filter((q) => !seen.has(q.id) && !avoid.has(q.id));
    if (!options.length) {
      levelQuestions.forEach((q) => seen.delete(q.id));
      options = levelQuestions.filter((q) => !avoid.has(q.id));
    }
    if (!options.length) return null;
    const q = options[Math.floor(r() * options.length)];
    seen.add(q.id);
    avoid.add(q.id);
    return q;
  }

  return { LADDER, SAFE, digits, groupIndian, money, shuffle, banked, safeFloor, cutTwo, makePoll, drawQuestion };
});
