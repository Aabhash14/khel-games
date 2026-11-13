// Duo shell: home board, player names, wins tally, game shell (HUDs, intro/result/pause overlays), effects.
import { t, num, getLang, setLang, applyStatic } from './i18n.js';
import { sfx, unlock, isMuted, setMuted } from './audio.js';
import { shareStory } from './share.js';
import { icon } from './icons.js';
import memory from './games/memory.js';
import pool from './games/pool.js';
import guess from './games/guess.js';
import reversi from './games/reversi.js';
import four from './games/four.js';
import dots from './games/dots.js';
import sea from './games/sea.js';
import mancala from './games/mancala.js';
import stack from './games/stack.js';

export const GAMES = [memory, pool, guess, reversi, four, dots, sea, mancala, stack];

const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('duo.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('duo.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

let names = store.get('names', ['', '']);
let tally = store.get('tally', {});
const starter = store.get('starter', {});
export const nameOf = (i) => (names[i] || '').trim() || t(i ? 'nameP1' : 'nameP0');
const totals = () => GAMES.reduce((a, g) => { const w = tally[g.id] || [0, 0]; return [a[0] + w[0], a[1] + w[1]]; }, [0, 0]);

const screens = { home: $('[data-screen="home"]'), game: $('[data-screen="game"]') };
const arena = $('#arena');
const huds = [$('.hud[data-p="0"]'), $('.hud[data-p="1"]')];
const split = $('#split');
const halves = { 0: $('.half[data-p="0"]', split), 1: $('.half[data-p="1"]', split) };

function show(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('on', k === name));
}

/* ---------- HOME ---------- */
function renderHome() {
  applyStatic();
  document.title = 'Duo · जोडी';
  [0, 1].forEach((i) => {
    const inp = $('#n' + i);
    inp.placeholder = t(i ? 'nameP1' : 'nameP0');
    if (document.activeElement !== inp) inp.value = names[i] || '';
    $(`#n${i}Label`).textContent = t('nameLabel', { n: i + 1 });
  });
  const [a, b] = totals();
  $('#w0').textContent = num(a); $('#w1').textContent = num(b);
  const ul = $('#tiles');
  ul.innerHTML = '';
  GAMES.forEach((g) => {
    const w = tally[g.id];
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="tile">${icon(g.id)}
      <b>${t(g.id + '.name')}</b><small>${t(g.id + '.tag')}</small>${w ? `<span class="tw">${num(w[0])}·${num(w[1])}</span>` : ''}</button>`;
    li.firstElementChild.addEventListener('click', () => { unlock(); sfx.tap(); openGame(g); });
    ul.append(li);
  });
  document.querySelectorAll('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === getLang())));
}

[0, 1].forEach((i) => {
  $('#n' + i).addEventListener('input', (e) => { names[i] = e.target.value.slice(0, 12); store.set('names', names); });
});
document.querySelectorAll('[data-set-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.setLang); renderHome(); }));
const muteBtn = $('#mute');
muteBtn.setAttribute('aria-pressed', String(isMuted()));
muteBtn.addEventListener('click', () => { setMuted(!isMuted()); muteBtn.setAttribute('aria-pressed', String(isMuted())); unlock(); sfx.tap(); });

let resetArmed = 0;
$('#reset').addEventListener('click', (e) => {
  if (Date.now() - resetArmed < 3000) {
    tally = {}; store.set('tally', tally); resetArmed = 0; e.currentTarget.textContent = t('reset'); renderHome(); sfx.bad();
  } else {
    resetArmed = Date.now(); e.currentTarget.textContent = t('resetAgain');
    setTimeout(() => { if (resetArmed && Date.now() - resetArmed >= 2900) { resetArmed = 0; e.currentTarget.textContent = t('reset'); } }, 3000);
  }
});
$('#share').addEventListener('click', async () => {
  sfx.tap();
  const ok = await shareStory({ names: [nameOf(0), nameOf(1)], totals: totals(), games: GAMES.map((g) => ({ name: t(g.id + '.name'), w: tally[g.id] || [0, 0] })) });
  if (ok === 'saved') toast(t('saved'));
});

/* ---------- SPLIT OVERLAY (both players read it) ---------- */
function showSplit(build) {
  [1, 0].forEach((p) => { halves[p].innerHTML = ''; build(halves[p], p); });
  split.hidden = false;
}
const hideSplit = () => { split.hidden = true; };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn) { const b = el('button', 'btn ' + cls, label); b.type = 'button'; b.addEventListener('click', () => { unlock(); sfx.tap(); fn(); }); return b; }

/* ---------- GAME SESSION ---------- */
let cur = null;
let paused = false;
let wake = null;

function setHuds() {
  huds.forEach((h, i) => {
    h.classList.remove('on');
    $('.nm', h).textContent = nameOf(i);
    $('.msg', h).textContent = '';
    $('.sc', h).textContent = '';
  });
}

function openGame(game) {
  show('game');
  setHuds();
  arena.innerHTML = ''; arena.className = 'arena';
  try { history.pushState({ duo: game.id }, ''); } catch { /* fine */ }
  try { wake?.release(); } catch { /* fine */ }
  try { navigator.wakeLock?.request('screen').then((w) => { wake = w; }).catch(() => {}); } catch { /* fine */ }
  const first = starter[game.id] ?? (Math.random() < 0.5 ? 0 : 1);
  showSplit((h, p) => {
    h.append(el('h3', '', t(game.id + '.name')));
    const ol = el('ol');
    ['r1', 'r2', 'r3'].forEach((k) => ol.append(el('li', '', t(`${game.id}.${k}`))));
    h.append(ol);
    const who = el('p', 'note who'); who.dataset.p = first;
    who.append(el('span', 'coin'), el('span', '', t('starts', { name: nameOf(first) })));
    h.append(who);
    const row = el('div', 'row');
    row.append(btn(t('start'), 'pc', () => launch(game)), btn(t('menu'), 'ghost', () => history.back()));
    h.append(row);
  });
}

function launch(game) {
  hideSplit(); paused = false;
  cur?.inst?.destroy?.();
  setHuds();
  arena.innerHTML = ''; arena.className = 'arena';
  const first = starter[game.id] ?? (Math.random() < 0.5 ? 0 : 1);
  starter[game.id] = 1 - first; store.set('starter', starter);
  const session = { game, done: false };
  cur = session;
  session.inst = game.mount(arena, makeApi(session, first));
  sfx.start();
}

function quit() {
  cur?.inst?.destroy?.(); cur = null; hideSplit(); paused = false;
  arena.innerHTML = '';
  try { wake?.release(); } catch { /* fine */ } wake = null;
  show('home'); renderHome();
}

window.addEventListener('popstate', () => { if (screens.game.classList.contains('on')) quit(); });

$('#pauseBtn').addEventListener('click', () => {
  if (!cur || cur.done) return;
  paused = true; cur.inst?.pause?.(); sfx.tap();
  showSplit((h) => {
    h.append(el('h2', '', t('paused')));
    const row = el('div', 'row');
    row.append(btn(t('resume'), 'solid', () => { hideSplit(); paused = false; cur?.inst?.resume?.(); }));
    row.append(btn(t('restart'), 'ghost', () => launch(cur.game)));
    row.append(btn(t('menu'), 'ghost', () => history.back()));
    h.append(row);
  });
});

function makeApi(session, first) {
  const api = {
    first,
    names: [nameOf(0), nameOf(1)],
    t, num, sfx,
    lang: getLang(),
    get live() { return cur === session && !session.done && !paused; },
    turn(i) { huds.forEach((h, k) => h.classList.toggle('on', k === i)); },
    score(i, v) { $('.sc', huds[i]).textContent = typeof v === 'number' ? num(v) : v; },
    msg(i, text) { (i == null ? [0, 1] : [i]).forEach((k) => { $('.msg', huds[k]).textContent = text || ''; }); },
    face(i) { arena.classList.toggle('face1', i === 1); },
    callout(text, p = null, color = null) {
      const make = (rot) => {
        const c = el('div', 'callout', text);
        if (color) c.style.color = color;
        if (rot) c.style.rotate = '180deg';
        if (p == null) c.style.top = rot ? '30%' : '70%';
        screens.game.append(c); setTimeout(() => c.remove(), 950);
      };
      if (p == null) { make(true); make(false); } else make(p === 1);
    },
    buzz(ms = 30) { try { navigator.vibrate?.(ms); } catch { /* fine */ } },
    shake(px = 8) {
      arena.animate([{ translate: '0 0' }, { translate: `${px}px ${-px / 2}px` }, { translate: `${-px}px ${px / 2}px` }, { translate: '0 0' }], { duration: 260 });
    },
    burst: (x, y, color, n) => burst(x, y, color, n),
    over(winner, note = '') {
      if (session.done || cur !== session) return;
      session.done = true;
      const id = session.game.id;
      const w = tally[id] || [0, 0];
      if (winner === 0 || winner === 1) w[winner]++;
      tally[id] = w; store.set('tally', tally);
      api.turn(null); api.msg(null, '');
      if (winner == null) sfx.draw(); else { sfx.win(); confetti(winner); }
      setTimeout(() => {
        if (cur !== session) return;
        showSplit((h, p) => {
          const res = winner == null ? t('draw') : winner === p ? t('youWin') : t('youLose');
          h.append(el('h2', winner == null ? '' : winner === p ? 'big-win' : 'big-lose', res));
          if (note) h.append(el('p', 'note', note));
          h.append(el('p', 'note', `${nameOf(0)} ${num(w[0])} – ${num(w[1])} ${nameOf(1)}`));
          const row = el('div', 'row');
          const b = btn(t('rematch'), 'pc', () => launch(session.game)); row.append(b);
          row.append(btn(t('menu'), 'ghost', () => history.back()));
          h.append(row);
        });
      }, 1100);
    },
  };
  return api;
}

/* ---------- FX ---------- */
const fx = $('#fx');
const fctx = fx.getContext('2d');
let parts = [];
let fxRun = false;
function sizeFx() { const d = Math.min(devicePixelRatio || 1, 2); fx.width = innerWidth * d; fx.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
sizeFx(); addEventListener('resize', sizeFx);
function burst(x, y, color = '#ffcb1f', n = 18) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2; const s = 2 + Math.random() * 5;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: color, r: 2 + Math.random() * 3, g: 0.12 });
  }
  runFx();
}
function confetti(winner) {
  const cols = ['#d41f16', '#ffcb1f', '#fffaf0', '#1f52d4', '#ff4f9a', '#17803a'];
  const y = winner === 1 ? 0 : innerHeight;
  for (let i = 0; i < 120; i++) {
    parts.push({ x: Math.random() * innerWidth, y, vx: (Math.random() - 0.5) * 4, vy: (winner === 1 ? 1 : -1) * (6 + Math.random() * 10),
      life: 1.6, c: cols[i % cols.length], r: 3 + Math.random() * 4, g: winner === 1 ? -0.12 : 0.18, sq: true });
  }
  runFx();
}
function runFx() {
  if (fxRun) return; fxRun = true;
  const step = () => {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.life -= 0.016;
      fctx.globalAlpha = Math.min(1, p.life); fctx.fillStyle = p.c;
      if (p.sq) fctx.fillRect(p.x, p.y, p.r * 1.6, p.r); else { fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 7); fctx.fill(); }
    }
    fctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(step); else { fxRun = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
  };
  requestAnimationFrame(step);
}

let toastT = 0;
function toast(text) { const tEl = $('#toast'); tEl.textContent = text; tEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => tEl.classList.remove('on'), 1800); }

document.addEventListener('visibilitychange', () => {
  if (document.hidden && cur && !cur.done && !paused) $('#pauseBtn').click();
});

setLang(getLang());
renderHome();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
