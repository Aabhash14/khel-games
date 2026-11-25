'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
/* Build the bank exactly as the browser does: run the three scripts against a fake window. */
function buildBank() {
  const window = {};
  const ctx = vm.createContext({ window });
  for (const f of ['questions.js', 'questions-extra.js', 'bank.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  // copy out of the sandbox so deepStrictEqual compares plain local arrays
  return { QUESTION_BANK: JSON.parse(JSON.stringify(window.QUESTION_BANK)), QUESTION_BANK_SIZE: window.QUESTION_BANK_SIZE };
}
const W = buildBank();
const BANK = W.QUESTION_BANK;
const ALL = BANK.flat();
const DEVANAGARI = /[ऀ-ॿ]/;
const byId = (id) => ALL.find((q) => q.id === id);
const right = (q) => q.a[q.c];

test('the bank holds exactly 1000 questions over 15 levels', () => {
  assert.equal(BANK.length, 15);
  assert.equal(ALL.length, 1000);
  assert.equal(W.QUESTION_BANK_SIZE, 1000);
});

test('every level has plenty of questions for no-repeat play and swaps', () => {
  BANK.forEach((level, i) => assert.ok(level.length >= 40, `level ${i + 1} has only ${level.length}`));
});

test('every question has a unique, stable id', () => {
  const ids = ALL.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  const again = buildBank().QUESTION_BANK.flat();
  assert.deepEqual(again.map((q) => q.id), ids, 'ids must not change between page loads, or the "seen" memory breaks');
  assert.deepEqual(again.map((q) => q.a), ALL.map((q) => q.a), 'answers must be the same on every load');
});

test('every question is complete in English and Nepali', () => {
  for (const q of ALL) {
    assert.ok(q.en && q.en.trim(), `${q.id}: English question missing`);
    assert.ok(q.np && DEVANAGARI.test(q.np), `${q.id}: Nepali question missing or not in Devanagari`);
    assert.equal(q.a.length, 4, `${q.id}: needs 4 answers`);
    assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < 4, `${q.id}: bad correct index`);
    for (const [en, np] of q.a) assert.ok(String(en).trim() && String(np).trim(), `${q.id}: empty answer`);
  }
});

test('no question offers the same answer twice (in either language)', () => {
  for (const q of ALL) {
    assert.equal(new Set(q.a.map((x) => x[0])).size, 4, `${q.id}: ${q.a.map((x) => x[0]).join(' | ')}`);
    assert.equal(new Set(q.a.map((x) => x[1])).size, 4, `${q.id}: ${q.a.map((x) => x[1]).join(' | ')}`);
  }
});

test('the same question text is never asked twice with the same right answer', () => {
  const keys = ALL.map((q) => q.en + ' => ' + right(q)[0]);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  assert.deepEqual(dupes, []);
});

test('hand-written questions keep the level they were written for', () => {
  const vmWin = {};
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'questions.js'), 'utf8'), vm.createContext({ window: vmWin }));
  vmWin.QUESTIONS.forEach((level, i) => level.forEach((q) => assert.ok(BANK[i].some((b) => b.en === q.en), `"${q.en}" should be on level ${i + 1}`)));
});

/* ---- every maths answer is recomputed from the question text ---- */
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const num = (s) => Number(String(s).replace(/,/g, ''));
const MATH = [
  [/^What is (\d+) \+ (\d+)\?$/, (a, b) => a + b],
  [/^What is (\d+) − (\d+)\?$/, (a, b) => a - b],
  [/^What is (\d+) × (\d+)\?$/, (a, b) => a * b],
  [/^What is (\d+) ÷ (\d+)\?$/, (a, b) => a / b],
  [/^What is (\d+)% of (\d+)\?$/, (p, n) => (p * n) / 100],
  [/^What is (\d+) squared/, (n) => n * n],
  [/^What is the square root of (\d+)\?$/, (n) => Math.sqrt(n)],
  [/^What is (\d+) cubed/, (n) => n ** 3],
  [/^What is the cube root of ([\d,]+)\?$/, (n) => Math.round(Math.cbrt(n))],
  [/^What is the LCM .* of (\d+) and (\d+)\?$/, (a, b) => (a * b) / gcd(a, b)],
  [/^What is the HCF .* of (\d+) and (\d+)\?$/, (a, b) => gcd(a, b)],
  [/^What is 2 to the power (\d+)/, (n) => 2 ** n],
  [/^What is the sum of all whole numbers from 1 to (\d+)\?$/, (n) => (n * (n + 1)) / 2]
];
test('every maths answer is correct and every wrong option is wrong', () => {
  const maths = ALL.filter((q) => q.id.startsWith('m:'));
  assert.ok(maths.length >= 100, 'expected the bank to contain maths questions');
  for (const q of maths) {
    if (q.en === 'Which of these is a prime number?') {
      assert.ok(isPrime(num(right(q)[0])), `${q.id}: ${right(q)[0]} is not prime`);
      q.a.filter((_, i) => i !== q.c).forEach(([w]) => assert.ok(!isPrime(num(w)), `${q.id}: ${w} is prime too`));
      continue;
    }
    const rule = MATH.find(([re]) => re.test(q.en));
    assert.ok(rule, `${q.id}: no checker for "${q.en}"`);
    const args = q.en.match(rule[0]).slice(1).map(num);
    const expected = rule[1](...args);
    assert.equal(num(right(q)[0]), expected, `${q.id}: "${q.en}"`);
    q.a.filter((_, i) => i !== q.c).forEach(([w]) => assert.notEqual(num(w), expected, `${q.id}: wrong option equals the answer`));
  }
});

test('every Roman numeral answer converts back to the asked number', () => {
  const val = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const parse = (s) => [...s].reduce((sum, ch, i) => (val[ch] < (val[s[i + 1]] || 0) ? sum - val[ch] : sum + val[ch]), 0);
  const roman = ALL.filter((q) => q.id.startsWith('rom:'));
  assert.ok(roman.length >= 30);
  for (const q of roman) {
    const n = num(q.en.match(/How is ([\d,]+) written/)[1]);
    assert.equal(parse(right(q)[0]), n, q.id);
    q.a.filter((_, i) => i !== q.c).forEach(([w]) => assert.notEqual(w, right(q)[0]));
  }
});

test('Nepali numbers in generated maths match the English ones', () => {
  const toWestern = (s) => s.replace(/[०-९]/g, (d) => '०१२३४५६७८९'.indexOf(d));
  for (const q of ALL.filter((x) => x.id.startsWith('m:'))) {
    q.a.forEach(([en, np]) => assert.equal(toWestern(np).replace(/,/g, ''), en.replace(/,/g, ''), `${q.id}: ${en} vs ${np}`));
  }
});

test('districts: all 77, grouped into the 7 provinces correctly', () => {
  const d = ALL.filter((q) => q.id.startsWith('dist:'));
  assert.equal(d.length, 77);
  const counts = {};
  d.forEach((q) => { const p = right(q)[0]; counts[p] = (counts[p] || 0) + 1; });
  assert.deepEqual(counts, { Koshi: 14, Madhesh: 8, Bagmati: 13, Gandaki: 11, Lumbini: 12, Karnali: 10, Sudurpashchim: 9 });
  const spot = { Kathmandu: 'Bagmati', Chitwan: 'Bagmati', Kaski: 'Gandaki', Jhapa: 'Koshi', Dang: 'Lumbini', 'Rukum East': 'Lumbini', 'Rukum West': 'Karnali', Surkhet: 'Karnali', Kailali: 'Sudurpashchim', Parsa: 'Madhesh', Solukhumbu: 'Koshi', 'Nawalparasi East (Nawalpur)': 'Gandaki', 'Nawalparasi West (Parasi)': 'Lumbini' };
  for (const [district, province] of Object.entries(spot)) assert.equal(right(byId('dist:' + district))[0], province, district);
});

test('spot-check generated facts', () => {
  const expect = {
    'cap:Australia': 'Canberra', 'cap:Canada': 'Ottawa', 'cap:Switzerland': 'Bern', 'cap:Nigeria': 'Abuja', 'cap:Bhutan': 'Thimphu',
    'capr:Japan': 'Japan', 'cont:Egypt': 'Africa', 'cont:Brazil': 'South America', 'cur:Ecuador': 'US dollar', 'cur:Japan': 'Yen',
    'elsym:Fe': 'Fe', 'elname:Hg': 'Mercury', 'elz:O': '8', 'elz:Fe': '26', 'mon:0': 'Baisakh', 'mon:11': 'Chaitra', 'monnext:11': 'Baisakh', 'pl:4': 'Jupiter'
  };
  for (const [id, want] of Object.entries(expect)) {
    const q = byId(id);
    assert.ok(q, `missing ${id}`);
    assert.equal(right(q)[0], want, id);
  }
  // trap cities appear as wrong options on the famous "wrong capital" questions
  assert.ok(byId('cap:Australia').a.some(([en]) => en === 'Sydney'));
  assert.ok(byId('cap:United Arab Emirates').a.some(([en]) => en === 'Dubai'));
});

test('no generated capital question offers another real answer by mistake', () => {
  for (const q of ALL.filter((x) => x.id.startsWith('cap:'))) {
    const country = q.id.slice(4);
    const owners = ALL.filter((x) => x.id.startsWith('cap:') && x.id !== q.id);
    // a wrong option may be another country's capital, but never this country's
    q.a.filter((_, i) => i !== q.c).forEach(([w]) => assert.notEqual(w, right(q)[0], country));
    assert.ok(owners.length > 0);
  }
});
