'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../logic.js');

/* deterministic random numbers so failures are reproducible */
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

test('prize ladder: 15 strictly rising steps from Rs. 1,000 to one crore', () => {
  assert.equal(L.LADDER.length, 15);
  assert.equal(L.LADDER[0], 1000);
  assert.equal(L.LADDER[14], 10000000);
  for (let i = 1; i < 15; i++) assert.ok(L.LADDER[i] > L.LADDER[i - 1], `step ${i + 1} must pay more than step ${i}`);
});

test('safe steps are Rs. 10,000, Rs. 3,20,000 and the top', () => {
  assert.deepEqual(L.SAFE.map((i) => L.LADDER[i]), [10000, 320000, 10000000]);
});

test('digits: Devanagari only in Nepali', () => {
  assert.equal(L.digits('1234567890', 'en'), '1234567890');
  assert.equal(L.digits('1234567890', 'np'), '१२३४५६७८९०');
  assert.equal(L.digits(42, 'np'), '४२');
  assert.equal(L.digits('Rs. 5', 'np'), 'Rs. ५');
});

test('money uses lakh/crore grouping in both languages', () => {
  const cases = [
    [0, 'Rs. 0', 'रु. ०'],
    [1000, 'Rs. 1,000', 'रु. १,०००'],
    [10000, 'Rs. 10,000', 'रु. १०,०००'],
    [160000, 'Rs. 1,60,000', 'रु. १,६०,०००'],
    [1250000, 'Rs. 12,50,000', 'रु. १२,५०,०००'],
    [10000000, 'Rs. 1,00,00,000', 'रु. १,००,००,०००']
  ];
  for (const [n, en, np] of cases) {
    assert.equal(L.money(n, 'en'), en);
    assert.equal(L.money(n, 'np'), np);
  }
});

test('banked: what you walk away with before answering each question', () => {
  assert.equal(L.banked(0), 0);
  assert.equal(L.banked(1), 1000);
  assert.equal(L.banked(5), 10000);
  assert.equal(L.banked(14), 5000000);
});

test('safeFloor: a wrong answer drops to the last safe step passed', () => {
  for (let lvl = 0; lvl <= 4; lvl++) assert.equal(L.safeFloor(lvl), 0, `wrong on question ${lvl + 1}`);
  for (let lvl = 5; lvl <= 9; lvl++) assert.equal(L.safeFloor(lvl), 10000, `wrong on question ${lvl + 1}`);
  for (let lvl = 10; lvl <= 14; lvl++) assert.equal(L.safeFloor(lvl), 320000, `wrong on question ${lvl + 1}`);
});

test('shuffle keeps every item and does not change the input', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = L.shuffle(input, seeded(1));
  assert.deepEqual([...out].sort(), [...input].sort());
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('cut two never removes the right answer', () => {
  for (let seed = 0; seed < 500; seed++) {
    const right = seed % 4;
    const cut = L.cutTwo([0, 1, 2, 3], right, seeded(seed));
    assert.equal(cut.length, 2);
    assert.equal(new Set(cut).size, 2);
    assert.ok(!cut.includes(right));
  }
});

test('cut two only removes answers that are still on the board', () => {
  // slot 1 was already ruled out by a double guess
  for (let seed = 0; seed < 200; seed++) {
    const cut = L.cutTwo([0, 2, 3], 0, seeded(seed));
    assert.ok(!cut.includes(1) && !cut.includes(0));
  }
});

test('chautari poll: adds up to 100, never negative, blank for removed answers', () => {
  const r = seeded(7);
  const boards = [[0, 1, 2, 3], [0, 2], [1, 3], [0, 1, 3]];
  for (let n = 0; n < 2000; n++) {
    const live = boards[n % boards.length];
    const right = live[n % live.length];
    const level = n % 15;
    const poll = L.makePoll(level, live, right, r);
    assert.equal(poll.length, 4);
    const shown = poll.filter((v) => v !== null);
    assert.equal(shown.length, live.length);
    assert.equal(shown.reduce((a, b) => a + b, 0), 100, `poll ${JSON.stringify(poll)}`);
    assert.ok(shown.every((v) => v >= 0 && Number.isInteger(v)));
    [0, 1, 2, 3].filter((s) => !live.includes(s)).forEach((s) => assert.equal(poll[s], null));
  }
});

test('chautari poll: reliable early, shaky near the top', () => {
  const avgRight = (level) => {
    const r = seeded(level + 100);
    let sum = 0;
    for (let n = 0; n < 3000; n++) sum += L.makePoll(level, [0, 1, 2, 3], 2, r)[2];
    return sum / 3000;
  };
  const early = avgRight(0), late = avgRight(14);
  assert.ok(early > 65, `question 1 crowd should mostly be right (got ${early.toFixed(1)}%)`);
  assert.ok(late < 40, `question 15 crowd should be unsure (got ${late.toFixed(1)}%)`);
  assert.ok(early - late > 30);
});

test('chautari poll with only the right answer left gives it 100%', () => {
  assert.deepEqual(L.makePoll(10, [3], 3, seeded(1)), [null, null, null, 100]);
});

test('drawQuestion: no repeats until the level is used up, then only that level resets', () => {
  const level = Array.from({ length: 10 }, (_, i) => ({ id: 'q' + i }));
  const other = { id: 'other-level' };
  const seen = new Set([other.id]);
  const r = seeded(3);
  const firstRound = [];
  for (let i = 0; i < 10; i++) firstRound.push(L.drawQuestion(level, seen, new Set(), r).id);
  assert.equal(new Set(firstRound).size, 10, 'all ten different before any repeat');
  const eleventh = L.drawQuestion(level, seen, new Set(), r);
  assert.ok(firstRound.includes(eleventh.id), 'after running out, questions come back');
  assert.ok(seen.has(other.id), 'other levels stay remembered');
  assert.equal([...seen].filter((id) => id.startsWith('q')).length, 1, 'only the new draw is remembered for this level');
});

test('drawQuestion: never repeats inside one game, returns null when nothing is left', () => {
  const level = [{ id: 'a' }, { id: 'b' }];
  const seen = new Set(), avoid = new Set();
  const one = L.drawQuestion(level, seen, avoid, seeded(1));
  const two = L.drawQuestion(level, seen, avoid, seeded(2));
  assert.notEqual(one.id, two.id);
  assert.equal(L.drawQuestion(level, seen, avoid, seeded(3)), null);
});
