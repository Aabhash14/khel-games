'use strict';
/* End-to-end: plays the real game in Chromium, the way a player would. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { startServer, openGame, rightSlot, levelOnScreen, answer, text, isEnd } = require('./helpers');

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser.close(); await server.close(); });

const noErrors = (page) => assert.deepEqual(page.errors, [], 'page should have no errors');
const endAmount = (page) => text(page, '#end-amount');

describe('start screen', () => {
  test('shows the bank size and switches to Nepali', async () => {
    const page = await openGame(browser, server.url);
    assert.equal(await text(page, '#start-title'), 'Chautari Quiz');
    assert.match(await text(page, '#bank-info'), /^1000 questions in the bank · 1000 you haven’t seen yet$/);
    await page.click('.lang button[data-lang="np"]');
    assert.equal(await text(page, '#start-title'), 'चौतारी क्विज');
    assert.match(await text(page, '#bank-info'), /१०००/);
    assert.equal(await page.getAttribute('html', 'lang'), 'ne');
    // every translated label is filled in
    const empty = await page.$$eval('[data-i18n]', (els) => els.filter((e) => !e.textContent.trim()).map((e) => e.dataset.i18n));
    assert.deepEqual(empty, []);
    noErrors(page);
  });
});

describe('answering', () => {
  test('one tap answers, shows the result and moves on by itself (normal motion)', async () => {
    const page = await openGame(browser, server.url, { fullMotion: true });
    await page.click('#start');
    assert.equal(await page.locator('#lock').count(), 0, 'no Lock button');
    assert.equal(await page.locator('#next').count(), 0, 'no Next button');
    const first = await text(page, '#question');
    await page.click(`.answer[data-i="${await rightSlot(page)}"]`);
    assert.equal(await page.locator('.answer:disabled').count(), 4, 'answers lock as soon as one is tapped');
    await page.waitForSelector('.answer.right');
    assert.match(await text(page, '#note'), /^Correct! Rs\. 1,000 is yours\.$/);
    await page.waitForFunction((q) => document.getElementById('question').textContent !== q, first, { timeout: 6000 });
    assert.equal(await text(page, '#stake'), 'Question 2 · for Rs. 2,000');
    assert.equal(await page.locator('.answer:disabled').count(), 0, 'new question is ready to answer');
    noErrors(page);
  });

  test('keys 1-4 and A-D answer straight away', async () => {
    const page = await openGame(browser, server.url);
    await page.click('#start');
    await page.keyboard.press(String((await rightSlot(page)) + 1));
    await page.waitForFunction(() => document.getElementById('stake').textContent.startsWith('Question 2'));
    await page.keyboard.press('ABCD'[await rightSlot(page)].toLowerCase());
    await page.waitForFunction(() => document.getElementById('stake').textContent.startsWith('Question 3'));
    noErrors(page);
  });
});

describe('a full game', () => {
  test('climbs to one crore with every lifeline, each question harder than the last', async () => {
    const page = await openGame(browser, server.url);
    await page.click('#start');
    const levels = [];
    for (let n = 1; n <= 15; n++) {
      levels.push(await levelOnScreen(page));
      if (n === 2) {
        await page.click('.life[data-life="cut"]');
        assert.equal(await page.locator('.answer.gone').count(), 2, 'cut two removes two');
        assert.equal(await page.locator(`.answer[data-i="${await rightSlot(page)}"].gone`).count(), 0, 'never the right one');
      }
      if (n === 3) {
        await page.click('.life[data-life="poll"]');
        const pcts = await page.$$eval('.answer .pct', (els) => els.map((e) => parseInt(e.textContent, 10)));
        assert.equal(pcts.reduce((a, b) => a + b, 0), 100, `poll ${pcts}`);
        assert.equal(await page.locator('.life[data-life="poll"]:disabled').count(), 1, 'lifeline is used up');
      }
      if (n === 6) {
        const before = await text(page, '#question');
        await page.click('.life[data-life="swap"]');
        assert.notEqual(await text(page, '#question'), before, 'swap gives a new question');
        assert.equal(await levelOnScreen(page), 6, 'at the same difficulty');
      }
      if (n === 8) {
        await page.click('.life[data-life="double"]');
        await answer(page, { correct: false });
        assert.match(await text(page, '#note'), /one more try/);
        assert.equal(await text(page, '#stake'), 'Question 8 · for Rs. 80,000', 'still on question 8');
        assert.equal(await page.locator('.answer.wrong:disabled').count(), 1, 'the wrong guess is ruled out');
      }
      await answer(page);
    }
    assert.deepEqual(levels, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    await page.waitForSelector('#screen-end:not([hidden])');
    assert.equal(await text(page, '#end-title'), 'Ek crore! You climbed the whole ladder.');
    assert.equal(await endAmount(page), 'Rs. 1,00,00,000');
    assert.equal(await text(page, '#best-end'), 'Your best so far: Rs. 1,00,00,000');
    noErrors(page);
  });

  for (const [wrongAt, pays] of [[3, 'Rs. 0'], [7, 'Rs. 10,000'], [12, 'Rs. 3,20,000']]) {
    test(`a wrong answer on question ${wrongAt} pays ${pays}`, async () => {
      const page = await openGame(browser, server.url);
      await page.click('#start');
      for (let n = 1; n < wrongAt; n++) await answer(page);
      await answer(page, { correct: false });
      await page.waitForSelector('#screen-end:not([hidden])', { timeout: 6000 });
      assert.equal(await text(page, '#end-title'), 'Not this time. You take home');
      assert.equal(await endAmount(page), pays);
      assert.match(await text(page, '#end-detail'), /^The right answer was “.+”\.$/);
      noErrors(page);
    });
  }

  test('a wrong answer after double guess has been spent ends the game', async () => {
    const page = await openGame(browser, server.url);
    await page.click('#start');
    await page.click('.life[data-life="double"]');
    await answer(page, { correct: false }); // first miss is forgiven
    await answer(page, { correct: false }); // second miss is not
    await page.waitForSelector('#screen-end:not([hidden])', { timeout: 6000 });
    assert.equal(await endAmount(page), 'Rs. 0');
    noErrors(page);
  });

  test('walking away needs a second press and pays what was banked', async () => {
    const page = await openGame(browser, server.url);
    await page.click('#start');
    await answer(page); await answer(page); await answer(page);
    assert.equal(await text(page, '#walk'), 'Walk away with Rs. 3,000');
    await page.click('#walk');
    assert.equal(await isEnd(page), false, 'first press only asks');
    assert.equal(await text(page, '#walk'), 'Sure? Take Rs. 3,000 home');
    await page.click('#walk');
    assert.equal(await text(page, '#end-title'), 'You walked away with');
    assert.equal(await endAmount(page), 'Rs. 3,000');
    assert.equal(await text(page, '#end-detail'), 'You answered 3 questions correctly.');
    noErrors(page);
  });
});

describe('Nepali', () => {
  test('plays fully in Nepali with Devanagari numbers and labels', async () => {
    const page = await openGame(browser, server.url);
    await page.click('.lang button[data-lang="np"]');
    await page.click('#start');
    assert.equal(await text(page, '#stake'), 'प्रश्न १ · रु. १,००० का लागि');
    assert.deepEqual(await page.$$eval('.answer .key', (els) => els.map((e) => e.textContent)), ['क:', 'ख:', 'ग:', 'घ:']);
    assert.match(await text(page, '#question'), /[ऀ-ॿ]/);
    await answer(page);
    assert.equal(await text(page, '#stake'), 'प्रश्न २ · रु. २,००० का लागि');
    // switching language mid-question keeps the same question
    const lvl = await levelOnScreen(page);
    await page.click('.lang button[data-lang="en"]');
    assert.equal(await levelOnScreen(page), lvl);
    assert.match(await text(page, '#stake'), /^Question 2/);
    noErrors(page);
  });
});

describe('memory', () => {
  test('no question repeats across games until its level runs out', async () => {
    const page = await openGame(browser, server.url);
    const perLevel = await page.evaluate(() => QUESTION_BANK[0].length);
    await page.click('#start');
    const firstQuestions = [];
    for (let i = 0; i < perLevel; i++) {
      firstQuestions.push(await text(page, '#question'));
      await page.click('#walk'); await page.click('#walk'); // walk away at once
      await page.click('#again');
    }
    assert.equal(new Set(firstQuestions).size, perLevel, `all ${perLevel} level-1 questions before any repeat`);
    assert.ok(firstQuestions.includes(await text(page, '#question')), 'then they come round again');
    noErrors(page);
  });

  test('best score, language, sound and seen questions survive a reload', async () => {
    const page = await openGame(browser, server.url);
    await page.click('#sound');
    assert.equal(await page.getAttribute('#sound', 'aria-pressed'), 'false');
    await page.click('.lang button[data-lang="np"]');
    await page.click('#start');
    await answer(page); await answer(page);
    await page.click('#walk'); await page.click('#walk');
    await page.reload();
    assert.equal(await page.getAttribute('#sound', 'aria-pressed'), 'false');
    assert.equal(await text(page, '#start-title'), 'चौतारी क्विज');
    assert.equal(await text(page, '#best'), 'अहिलेसम्मको उत्तम: रु. २,०००');
    assert.match(await text(page, '#bank-info'), /तीमध्ये ९९७ /); // 3 questions were asked
    noErrors(page);
  });
});

describe('phone', () => {
  test('no sideways scrolling on start, game and end screens', async () => {
    const page = await openGame(browser, server.url, { viewport: { width: 390, height: 844 } });
    const width = () => page.evaluate(() => document.documentElement.scrollWidth);
    assert.equal(await width(), 390, 'start');
    await page.click('.lang button[data-lang="np"]'); // longer Devanagari labels
    await page.click('#start');
    await page.click('.life[data-life="poll"]');
    assert.equal(await width(), 390, 'game');
    assert.ok(await page.isVisible('.ladder'), 'ladder strip is shown');
    const box = await page.locator('.answer').first().boundingBox();
    assert.ok(box.height >= 44, 'answers are big enough to tap');
    await answer(page, { correct: false });
    await page.waitForSelector('#screen-end:not([hidden])', { timeout: 6000 });
    assert.equal(await width(), 390, 'end');
    noErrors(page);
  });
});
