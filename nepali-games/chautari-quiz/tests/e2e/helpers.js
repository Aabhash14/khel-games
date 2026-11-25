'use strict';
/* Shared helpers for the end-to-end tests: a tiny static server and ways to play the game. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

/** Serve the game folder on a free port. Resolves to { url, close }. */
function startServer() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    resolve({ url: `http://127.0.0.1:${server.address().port}/index.html`, close: () => new Promise((r) => server.close(r)) });
  }));
}

/** Open the game in a fresh browser context; collects page errors into page.errors. */
async function openGame(browser, url, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    reducedMotion: opts.fullMotion ? 'no-preference' : 'reduce' // reduced motion shortens the pauses
  });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(url);
  return page;
}

const text = (page, sel) => page.textContent(sel);
const isEnd = (page) => page.evaluate(() => !document.getElementById('screen-end').hidden);

/** The on-screen slot (0-3) of the right answer, looked up in the question bank. */
function rightSlot(page) {
  return page.evaluate(() => {
    const t = document.getElementById('question').textContent;
    const shown = [...document.querySelectorAll('.answer .txt')].map((s) => s.textContent);
    for (const q of QUESTION_BANK.flat()) {
      const k = q.en === t ? 0 : q.np === t ? 1 : -1;
      if (k < 0) continue;
      const i = shown.indexOf(q.a[q.c][k]);
      if (i >= 0 && q.a.every((x) => shown.includes(x[k]))) return i;
    }
    throw new Error('question not found in bank: ' + t);
  });
}

/** Difficulty level (1-15) of the question on screen. */
function levelOnScreen(page) {
  return page.evaluate(() => {
    const t = document.getElementById('question').textContent;
    const shown = [...document.querySelectorAll('.answer .txt')].map((s) => s.textContent);
    return QUESTION_BANK.findIndex((lvl) => lvl.some((q) => (q.en === t || q.np === t) && q.a.every((x) => shown.includes(x[0]) || shown.includes(x[1])))) + 1;
  });
}

/** Tap an answer and wait until the game has moved on (next question or end screen). */
async function answer(page, { correct = true } = {}) {
  const before = await text(page, '#stake');
  const right = await rightSlot(page);
  const slot = correct ? right : await page.evaluate((r) => [0, 1, 2, 3].find((s) => s !== r && !document.querySelector(`.answer[data-i="${s}"]`).disabled), right);
  await page.click(`.answer[data-i="${slot}"]`);
  await page.waitForFunction((prev) => document.getElementById('stake').textContent !== prev || !document.getElementById('screen-end').hidden
    || document.getElementById('note').classList.contains('bad'), before, { timeout: 15000 });
}

module.exports = { startServer, openGame, rightSlot, levelOnScreen, answer, text, isEnd };
