import { CAST, IDS } from './cast.js';
import * as E from './engine.js';
import { t, num, getLang, setLang, nameOf } from './i18n.js';
import { sfx, unlock, isMuted, setMuted, riverOn, riverOff, voice, effect, preload } from './audio.js';
import { shareStory } from './share.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GAME_URL = new URL('./', location.href).href.split('#')[0];
const LIMIT_EXTRA = 6; // the river floods after par + this many trips
/** A cast member's 3D picture (Fluent Emoji 3D, MIT, self-hosted in img/). */
const pic = (id, cls = 'pic') => `<img class="${cls}" src="img/${id}.webp" alt="" width="80" height="80" decoding="async" draggable="false">`;
IDS.forEach((id) => { const i = new Image(); i.src = `img/${id}.webp`; });
const STAR = (on) => `<svg class="star${on ? '' : ' off'}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.2 6.5L12 17.3l-5.8 3.15 1.2-6.5L2.6 9.4l6.55-.85z"/></svg>`;
const stars3 = (n) => [1, 2, 3].map((k) => STAR(k <= n)).join('');
const ICON = {
  win: '<img class="sheet-icon" src="icon.svg" alt="" width="72" height="72">',
  flood: '<svg class="sheet-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M4 30c7 0 7-6 14-6s7 6 14 6 7-6 14-6 7 6 14 6v30H4z" fill="#27b8ae"/><path d="M4 42c7 0 7-6 14-6s7 6 14 6 7-6 14-6 7 6 14 6" fill="none" stroke="#e6fffb" stroke-width="3" stroke-linecap="round"/><path d="M32 4v18M25 15l7 7 7-7" fill="none" stroke="#d7261e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 32 13)"/></svg>',
  bite: '<svg class="bite" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l4 10 10-6-4 11 10 3-10 4 6 10-11-3-1 9-5-9-8 6 1-10-10-1 8-6-7-8 10 1z" fill="#d7261e"/><path d="M20 11l2 6 6-2-3 5 5 3-6 1 1 6-5-4-4 4 0-6-6-1 5-3-3-5 6 2z" fill="#ffcc33"/></svg>',
  lock: '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
};

/* ---------- screens + text ---------- */

let screen = 'home';
function go(name) {
  screen = name;
  $$('.screen').forEach((s) => s.classList.toggle('on', s.dataset.screen === name));
  if (name !== 'play') { riverOff(); if (location.hash) history.replaceState(null, '', location.pathname + location.search); }
  if (name === 'home') homeStats();
  if (name === 'levels') renderLevels();
  if (name === 'make') renderMake();
  window.scrollTo(0, 0);
}

function applyText() {
  document.documentElement.lang = getLang();
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  $('#makerName').placeholder = t('namePh');
  $$('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === getLang())));
  homeStats();
  if (screen === 'levels') renderLevels();
  if (screen === 'make') renderMake();
  if (G) { renderSigns($('#signs'), G.puzzle); $('#playLabel').textContent = label(); buildTokens(); place(false); render(); }
}

$$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.setLang); applyText(); }));
$('#mute').setAttribute('aria-pressed', String(isMuted()));
$('#mute').addEventListener('click', () => {
  setMuted(!isMuted()); unlock();
  $('#mute').setAttribute('aria-pressed', String(isMuted()));
});
$$('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));

/* ---------- home + levels ---------- */

const today = () => Math.max(1, E.dayNumber());

function homeStats() {
  const n = today();
  const d = store.get('tuin.daily', {})[n];
  $('#dailySub').textContent = d ? t('dailyDone', { n, t: num(d.trips), stars: '★'.repeat(d.stars) }) : t('dailySub', { n });
  const stars = store.get('tuin.levels', []);
  $('#levelsSub').textContent = t('levelsSub', { done: stars.filter((s) => s > 0).length, total: E.levels().length });
}

$('#goDaily').addEventListener('click', () => { unlock(); const n = today(); startGame('daily', E.daily(n), { n }); });
$('#goLevels').addEventListener('click', () => go('levels'));
$('#goMake').addEventListener('click', () => go('make'));

function renderLevels() {
  const stars = store.get('tuin.levels', []);
  const grid = $('#levelGrid');
  grid.replaceChildren(...E.levels().map((lv, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    const open = i === 0 || stars[i - 1] > 0;
    b.disabled = !open;
    if (stars[i]) b.classList.add('done');
    b.innerHTML = `<span class="lv-n">${num(i + 1)}</span><span class="lv-cast" aria-hidden="true">${open ? lv.cast.map((id) => pic(id, 'lv-pic')).join('') : ICON.lock}</span><span class="lv-stars">${stars[i] ? stars3(stars[i]) : ''}</span>`;
    b.setAttribute('aria-label', `${t('levelN', { n: i + 1 })}${open ? '' : `, ${t('locked')}`}${stars[i] ? `, ${stars[i]}/3` : ''}`);
    b.addEventListener('click', () => { unlock(); startGame('level', lv, { n: i + 1 }); });
    li.append(b);
    return li;
  }));
}

/* ---------- rule signs ---------- */

function renderSigns(ul, p) {
  const out = [];
  const pairs = E.eatPairs(p.cast);
  const nm = (id) => `<span class="sr-only">${nameOf(CAST[id])}</span>`;
  pairs.forEach(([a, b]) => out.push(`<li data-k="eat-${a}-${b}">${pic(a, 'si')}${nm(a)}<small>${t('eats')}</small>${pic(b, 'si')}${nm(b)}</li>`));
  if (pairs.length) out.push(`<li data-k="guard"><small>…${t('noHuman')}</small></li>`);
  const pullers = p.cast.filter((id) => CAST[id].pull);
  if (pullers.length) out.push(`<li data-k="pull">${pullers.map((id) => pic(id, 'si') + nm(id)).join('')}<small>${t('canPull')}</small></li>`);
  p.cast.filter((id) => CAST[id].lonely).forEach((id) => out.push(`<li data-k="alone">${pic(id, 'si')}${nm(id)}<small>${t('notAlone')}</small></li>`));
  out.push(`<li class="cap" data-k="cap">${t('holds', { n: p.cap })}</li>`);
  ul.innerHTML = out.join('');
}

function flashSign(k) {
  const li = $(`#signs [data-k="${k}"]`);
  if (!li) return;
  li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash');
}

/* ---------- the game ---------- */

let G = null;
let tokens = [];
const seats = $('#seats');
const banks = [$('#bank0'), $('#bank1')];
const basket = $('#basket');
const lane = $('#lane');

function label() {
  if (G.kind === 'daily') return t('dailyN', { n: G.n });
  if (G.kind === 'level') return t('levelN', { n: G.n });
  if (G.kind === 'challenge') return G.by ? t('challenge', { name: G.by }) : t('challengeAnon');
  return t('makeTitle');
}

function startGame(kind, puzzle, extra = {}) {
  const P = E.compile(puzzle);
  G = { kind, puzzle, P, par: puzzle.par, limit: puzzle.par + LIMIT_EXTRA, s: { mask: 0, side: 0 }, load: 0, hist: [], oops: 0, hinted: false, busy: false, over: false, ...extra };
  closeSheet();
  go('play');
  lane.style.setProperty('--cap', P.cap);
  $('#playLabel').textContent = label();
  renderSigns($('#signs'), puzzle);
  buildTokens();
  place(false);
  render();
  setBasket(0);
  say(t('tapToLoad'));
  riverOn(0);
  preload([...puzzle.cast, 'chomp', 'splash']);
}

function buildTokens() {
  tokens = G.P.ents.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `tok has-nm${c.pull ? ' pull' : ''}`;
    b.style.setProperty('--tint', c.tint);
    b.dataset.i = i;
    // the figure, plus its own silhouette laid on the ground as the shadow cast by the low sun on the right
    b.style.setProperty('--s', c.size);
    b.style.setProperty('--d', `${(-Math.random() * 3.2).toFixed(2)}s`);
    b.innerHTML = `<span class="fig">${pic(c.id, 'cast')}<span class="lit">${pic(c.id)}</span></span><span class="nm" aria-hidden="true">${nameOf(c)}</span>`;
    b.setAttribute('aria-label', nameOf(c));
    b.addEventListener('click', () => tapToken(i));
    return b;
  });
}

/** Put every token where the state says, animating the hop (FLIP). */
function place(animate = true) {
  const active = document.activeElement;
  const first = animate && !reduced ? new Map(tokens.map((b) => [b, b.isConnected ? b.getBoundingClientRect() : null])) : null;
  const where = (i) => ((G.load >> i) & 1 ? 2 : (G.s.mask >> i) & 1);
  const groups = [[], [], []];
  tokens.forEach((b, i) => groups[where(i)].push(b));
  banks[0].replaceChildren(...groups[0]);
  banks[1].replaceChildren(...groups[1]);
  const empty = Array.from({ length: G.P.cap - groups[2].length }, () => Object.assign(document.createElement('span'), { className: 'seat-slot' }));
  seats.replaceChildren(...groups[2], ...empty);
  // everyone turns toward where they are going: across the river from the bank, or the way the basket will travel
  tokens.forEach((b, i) => {
    const w = where(i);
    const wantRight = w === 2 ? G.s.side === 0 : w === 0;
    const faces = G.P.ents[i].faces;
    b.style.setProperty('--flip', faces === 'front' || (faces === 'right') === wantRight ? 1 : -1);
  });
  if (tokens.includes(active)) active.focus({ preventScroll: true });
  if (!first) return;
  tokens.forEach((b) => {
    const a = first.get(b); if (!a) return;
    const z = b.getBoundingClientRect();
    const dx = a.left - z.left; const dy = a.top - z.top;
    if (Math.abs(dx) + Math.abs(dy) < 1) return;
    b.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, -10px)', offset: 0.6 }, { transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(.3,.7,.4,1)' });
  });
}

function render() {
  const side = G.s.side;
  tokens.forEach((b, i) => {
    const inLoad = (G.load >> i) & 1;
    const onSide = ((G.s.mask >> i) & 1) === side;
    b.setAttribute('aria-disabled', String(!(inLoad || onSide) || G.busy || G.over));
  });
  const trips = G.hist.length;
  $('#tripsN').textContent = num(trips);
  $('#parN').textContent = num(G.par);
  $('#tripsN').parentElement.classList.toggle('over', trips > G.par);
  const lvl = Math.min(1, trips / G.limit);
  $('#water').style.setProperty('--lvl', `${26 + lvl * 60}%`);
  $('#water').classList.toggle('high', lvl > 0.7);
  $$('.bank').forEach((el, k) => el.classList.toggle('here', k === side));
  const ok = !E.loadProblem(G.P, G.load);
  basket.classList.toggle('ready', ok && !G.busy);
  $('#pullBtn').setAttribute('aria-disabled', String(!ok || G.busy || G.over));
  $('#pullBtn').classList.toggle('left', side === 1);
  $('#undoBtn').disabled = !G.hist.length && !G.load;
  $('#hintBtn').disabled = G.over;
}

function say(text, bad = false) {
  const m = $('#msg');
  m.textContent = text;
  m.classList.toggle('bad', bad);
}

function tapToken(i) {
  if (!G || G.busy || G.over) return;
  unlock();
  const bit = 1 << i;
  if (G.load & bit) {
    G.load &= ~bit; sfx.hop(false);
  } else {
    if (((G.s.mask >> i) & 1) !== G.s.side) { say(t('otherSide'), true); sfx.nope(); bump(); return; }
    if (E.popcount(G.load) >= G.P.cap) { say(t('full', { n: G.P.cap }), true); sfx.nope(); bump(); flashSign('cap'); return; }
    G.load |= bit; sfx.hop(true);
    voice(G.P.ents[i].id);
  }
  say('');
  place(); render();
}

function bump() { basket.classList.remove('shake'); void basket.offsetWidth; basket.classList.add('shake'); }

function explain(problem) {
  const lonelyId = G.P.ents.find((c) => c.lonely);
  const text = { empty: t('empty'), full: t('full', { n: G.P.cap }), needDriver: t('needDriver'), alone: t('alone', { a: lonelyId ? nameOf(lonelyId) : '' }) }[problem];
  say(text, true); sfx.nope(); bump();
  flashSign(problem === 'needDriver' ? 'pull' : problem);
}

/* basket position along the sagging cable: p = 0 docked this side, 1 docked other side */
let basketP = 0;
function dockX() {
  const W = lane.clientWidth; const bw = basket.offsetWidth;
  return [12, W - bw - 12, W, bw];
}
function setBasket(p, tilt = 0) {
  basketP = p;
  const [x0, x1, W, bw] = dockX();
  const x = x0 + p * (x1 - x0);
  const u = (x + bw / 2) / W;
  const y = 8 + 64 * u * (1 - u) - 4; // matches the cable curve M0 8 Q50 40 100 8
  basket.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
}
new ResizeObserver(() => { if (G && !G.busy) setBasket(G.s.side); }).observe(lane);

function ride(from, to, done) {
  G.busy = true; render();
  const dur = reduced ? 1 : 300 + 900 * Math.abs(to - from);
  const t0 = performance.now();
  let lastCreak = from;
  const frame = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    const p = from + (to - from) * e;
    setBasket(p, (to - from) * Math.sin(k * Math.PI) * -6);
    if (Math.abs(p - lastCreak) > 0.09) { sfx.creak(p); lastCreak = p; }
    if (k < 1) requestAnimationFrame(frame); else done();
  };
  requestAnimationFrame(frame);
}

function pull() {
  if (!G || G.busy || G.over) return;
  unlock();
  const problem = E.loadProblem(G.P, G.load);
  if (problem) { explain(problem); return; }
  ride(basketP, G.s.side ? 0 : 1, arrive);
}
$('#pullBtn').addEventListener('click', pull);

/* dragging the basket: capture only once the finger really moves, so taps on seated tokens still work */
let drag = null;
basket.addEventListener('pointerdown', (e) => {
  if (!G || G.busy || G.over) return;
  drag = { x: e.clientX, id: e.pointerId, live: false, prob: E.loadProblem(G.P, G.load), last: basketP };
});
basket.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x;
  if (!drag.live) {
    if (Math.abs(dx) < 8) return;
    drag.live = true; basket.classList.add('dragging'); unlock();
    try { basket.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
  }
  const [x0, x1] = dockX();
  const dir = G.s.side ? -1 : 1;
  let prog = (dx * dir) / (x1 - x0);
  prog = Math.max(0, Math.min(drag.prob ? 0.06 : 1, prog));
  const p = G.s.side ? 1 - prog : prog;
  setBasket(p, -dir * Math.min(8, Math.abs(p - drag.last) * 300));
  if (Math.abs(p - drag.last) > 0.06) { sfx.creak(p); drag.last = p; }
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  basket.classList.remove('dragging');
  if (!d.live) return;
  const prog = G.s.side ? 1 - basketP : basketP;
  if (d.prob) { explain(d.prob); ride(basketP, G.s.side, () => { G.busy = false; render(); }); return; }
  if (prog > 0.35) ride(basketP, G.s.side ? 0 : 1, arrive);
  else ride(basketP, G.s.side, () => { G.busy = false; render(); });
}
basket.addEventListener('pointerup', endDrag);
basket.addEventListener('pointercancel', endDrag);

function arrive() {
  const load = G.load;
  G.s = E.step(G.s, load);
  G.hist.push(load);
  G.load = 0;
  setBasket(G.s.side);
  sfx.dock();
  if (!reduced) { basket.classList.remove('arrive'); void basket.offsetWidth; basket.classList.add('arrive'); }
  place();
  G.busy = false;
  render();
  riverOn(Math.min(1, G.hist.length / G.limit));
  say('');
  const c = E.stateConflict(G.P, G.s);
  if (c) { eaten(c); return; }
  if (E.isGoal(G.P, G.s)) { win(); return; }
  if (G.hist.length >= G.limit) flood();
}

function eaten([a, b]) {
  G.over = true; G.oops++; render();
  const A = G.P.ents[a]; const B = G.P.ents[b];
  flashSign(`eat-${A.id}-${B.id}`);
  tokens[a].classList.add('lunge'); voice(A.id);
  setTimeout(() => { effect('chomp', sfx.chomp); tokens[b].classList.add('gone'); }, reduced ? 0 : 450);
  setTimeout(() => {
    openSheet(`<div class="pics" aria-hidden="true">${pic(A.id, 'big')}${ICON.bite}${pic(B.id, 'big')}</div>
      <h3 id="sheetH">${t('eaten', { a: nameOf(A, true), b: nameOf(B, true) }).replace(/^the /, 'The ')}</h3>
      <p class="sub">${t('eatenSub')}</p>
      <div class="acts">
        <button type="button" class="big-btn gold" data-act="undo">${t('undoTrip')}</button>
        <button type="button" class="big-btn ghost" data-act="restart">${t('startOver')}</button>
      </div>`);
  }, reduced ? 200 : 1300);
}

function flood() {
  G.over = true; G.oops++; render();
  effect('splash', sfx.flood);
  openSheet(`<div class="pics">${ICON.flood}</div>
    <h3 id="sheetH">${t('flooded')}</h3>
    <p class="sub">${t('floodedSub', { n: G.limit })}</p>
    <div class="acts">
      <button type="button" class="big-btn gold" data-act="undo">${t('undoTrip')}</button>
      <button type="button" class="big-btn ghost" data-act="restart">${t('startOver')}</button>
    </div>`);
}

function undo() {
  if (!G || G.busy) return;
  closeSheet();
  tokens.forEach((b) => b.classList.remove('lunge', 'gone'));
  G.over = false;
  if (G.load && !G.hist.length) { G.load = 0; place(); render(); return; }
  if (!G.hist.length) return;
  G.load = 0;
  const last = G.hist.pop();
  G.s = E.step(G.s, last);
  G.load = last; // passengers back in the basket, on the side they left from
  sfx.hop(false);
  place(false);
  ride(basketP, G.s.side, () => { G.busy = false; place(); render(); });
  riverOn(Math.min(1, G.hist.length / G.limit));
  say('');
}
$('#undoBtn').addEventListener('click', undo);

function restart() {
  closeSheet();
  tokens.forEach((b) => b.classList.remove('lunge', 'gone'));
  Object.assign(G, { s: { mask: 0, side: 0 }, load: 0, hist: [], over: false, busy: false });
  place(false); render(); setBasket(0);
  riverOn(0);
  say(t('tapToLoad'));
}
$('#restartBtn').addEventListener('click', () => { if (G && !G.busy) restart(); });

$('#hintBtn').addEventListener('click', () => {
  if (!G || G.busy || G.over) return;
  unlock();
  const path = E.solve(G.P, G.s);
  if (!path) { say(t('hintNone'), true); sfx.nope(); return; }
  G.hinted = true;
  G.load = path[0];
  place(); render();
  sfx.hint();
  const who = G.P.ents.filter((_, i) => (path[0] >> i) & 1);
  say(t('hintText', { list: who.map((c) => nameOf(c)).join(' + ') }));
  tokens.forEach((b, i) => { b.classList.remove('hinted'); if ((path[0] >> i) & 1) { void b.offsetWidth; b.classList.add('hinted'); } });
});

$('#playBack').addEventListener('click', () => {
  if (G && G.kind === 'level') go('levels');
  else if (G && G.kind === 'test') go('make');
  else go('home');
});

/* ---------- winning ---------- */

function win() {
  G.over = true; render();
  const trips = G.hist.length;
  let stars = trips <= G.par ? 3 : trips <= G.par + 2 ? 2 : 1;
  if (G.hinted) stars = Math.min(stars, 2);
  G.stars = stars;
  if (G.kind === 'level') {
    const s = store.get('tuin.levels', []);
    s[G.n - 1] = Math.max(s[G.n - 1] || 0, stars);
    store.set('tuin.levels', s);
  }
  if (G.kind === 'daily') {
    const d = store.get('tuin.daily', {});
    if (!d[G.n] || trips < d[G.n].trips) d[G.n] = { trips, stars };
    store.set('tuin.daily', d);
  }
  sfx.win();
  confetti();
  const tags = [];
  if (stars === 3) tags.push(t('perfect'));
  tags.push(G.oops ? t('oops', { n: G.oops }) : t('firstTry'));
  if (G.hinted) tags.push(t('hinted'));
  const hasNext = G.kind === 'level' && G.n < E.levels().length;
  setTimeout(() => openSheet(`<div class="pics crowd" aria-hidden="true">${G.puzzle.cast.map((id) => pic(id, 'mid')).join('')}</div>
    <h3 id="sheetH">${t('won')}</h3>
    <p class="sub">${t('wonSub', { t: trips, p: G.par })}</p>
    <div class="stars" role="img" aria-label="${stars}/3">${stars3(stars)}</div>
    <ul class="tags">${tags.map((x) => `<li>${x}</li>`).join('')}</ul>
    <div class="acts">
      <button type="button" class="big-btn gold" data-act="share">${t('share')}</button>
      ${hasNext ? `<button type="button" class="big-btn" data-act="next">${t('next')}</button>` : `<button type="button" class="big-btn" data-act="again">${t('again')}</button>`}
      <button type="button" class="big-btn ghost" data-act="home">${t('home')}</button>
    </div>`), reduced ? 100 : 700);
}

function shareLine() {
  const d = { t: G.hist.length, p: G.par, stars: '⭐'.repeat(G.stars) };
  if (G.kind === 'daily') return `${t('shareDaily', { ...d, n: G.n })}\n${GAME_URL}`;
  if (G.kind === 'level') return `${t('shareLevel', { ...d, n: G.n })}\n${GAME_URL}`;
  const link = `${GAME_URL}#c=${E.encode(G.puzzle)}${G.by ? `&by=${encodeURIComponent(G.by)}` : ''}`;
  if (G.kind === 'challenge') return `${t('shareChallenge', { ...d, name: G.by || '🙂' })}\n${link}`;
  return `${t('shareMake', { p: G.par })}\n${link}`;
}

function confetti() {
  if (reduced) return;
  const box = $('#confetti');
  const cols = ['--f-blue', '--f-white', '--f-red', '--f-green', '--f-yellow'];
  box.replaceChildren(...Array.from({ length: 60 }, (_, k) => {
    const i = document.createElement('i');
    i.style.cssText = `left:${Math.random() * 100}%;background:var(${cols[k % 5]});animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.5}s;--rot:${Math.random() * 720 - 360}deg`;
    return i;
  }));
  setTimeout(() => box.replaceChildren(), 4200);
}

/* ---------- sheet ---------- */

let lastFocus = null;
function openSheet(html) {
  lastFocus = document.activeElement;
  $('#sheet').innerHTML = html;
  $('#sheetWrap').hidden = false;
  ($('#sheet [data-act]') || $('#sheet')).focus();
}
function closeSheet() {
  if ($('#sheetWrap').hidden) return;
  $('#sheetWrap').hidden = true;
  if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
}

$('#sheet').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'undo') undo();
  else if (act === 'restart') restart();
  else if (act === 'home') { closeSheet(); go('home'); }
  else if (act === 'again') startGame(G.kind, G.puzzle, { n: G.n, by: G.by });
  else if (act === 'next') startGame('level', E.levels()[G.n], { n: G.n + 1 });
  else if (act === 'go') closeSheet();
  else if (act === 'share') {
    b.disabled = true;
    const msg = await shareStory({
      title: label(), trips: G.hist.length, par: G.par, stars: G.stars, oops: G.oops, hinted: G.hinted,
      cast: G.puzzle.cast, text: shareLine(), file: `tuin-paar-${G.kind}-${G.n || 'x'}.png`,
    });
    b.disabled = false;
    if (msg) toast(msg);
  }
});
$('#sheetWrap').addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const f = $$('#sheet button'); if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
});

let toastT = 0;
function toast(text) {
  const el = $('#toast');
  el.textContent = text; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
}

/* ---------- make one for a friend ---------- */

const make = { cast: new Set(['didi', 'bagh', 'bakhra', 'ghans']), cap: 2, judged: null };
$('#makerName').value = store.get('tuin.name', '');

function renderMake() {
  const grid = $('#pickGrid');
  grid.replaceChildren(...IDS.map((id) => {
    const c = CAST[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = c.pull ? 'pull' : '';
    b.style.setProperty('--tint', c.tint);
    b.setAttribute('aria-pressed', String(make.cast.has(id)));
    b.innerHTML = `${pic(id, 'pk')}${nameOf(c)}`;
    b.addEventListener('click', () => {
      unlock();
      if (make.cast.has(id)) make.cast.delete(id);
      else if (make.cast.size < 7) make.cast.add(id);
      else { sfx.nope(); toast(t('pickHint')); return; }
      sfx.hop(make.cast.has(id));
      renderMake();
    });
    return b;
  }));
  $$('#capSeg button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.cap) === make.cap)));
  const p = makePuzzle();
  renderSigns($('#makeSigns'), p);
  const st = $('#makeStatus');
  let ok = false; let text;
  if (p.cast.length < 3) text = t('stFew');
  else {
    const j = E.judge(p);
    make.judged = j;
    if (!j.ok) text = j.why === 'noDriver' ? t('stNoDriver') : t('stImpossible');
    else { ok = true; text = j.par <= 5 || j.par === j.free ? t('stEasy', { p: j.par }) : t('stOk', { p: j.par }); }
  }
  st.textContent = text;
  st.className = `status ${ok ? 'ok' : 'bad'}`;
  $('#makePlay').disabled = !ok;
  $('#makeSend').disabled = !ok;
}

function makePuzzle() {
  const cast = IDS.filter((id) => make.cast.has(id));
  return { cast, cap: make.cap, par: make.judged && make.judged.ok ? make.judged.par : 0 };
}

$$('#capSeg button').forEach((b) => b.addEventListener('click', () => { make.cap = Number(b.dataset.cap); renderMake(); }));
$('#makerName').addEventListener('input', (e) => store.set('tuin.name', e.target.value.trim()));
$('#makePlay').addEventListener('click', () => {
  const p = makePuzzle(); const j = E.judge(p); if (!j.ok) return;
  startGame('test', { ...p, par: j.par }, { by: $('#makerName').value.trim() });
});
$('#makeSend').addEventListener('click', async () => {
  const p = makePuzzle(); const j = E.judge(p); if (!j.ok) return;
  const by = $('#makerName').value.trim();
  const url = `${GAME_URL}#c=${E.encode(p)}${by ? `&by=${encodeURIComponent(by)}` : ''}`;
  const text = t('shareMake', { p: j.par });
  try {
    if (navigator.share) { await navigator.share({ text, url }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast(t('linkCopied')); } catch { prompt('', url); }
});

/* ---------- boot ---------- */

function openFromHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const p = E.decode(h.get('c'));
  if (!p) return false;
  const by = (h.get('by') || '').slice(0, 16);
  startGame('challenge', p, { by });
  openSheet(`<div class="pics crowd" aria-hidden="true">${p.cast.map((id) => pic(id, 'mid')).join('')}</div>
    <h3 id="sheetH">${by ? t('challenge', { name: escapeHtml(by) }) : t('challengeAnon')}</h3>
    <p class="sub">${t('challengeSub', { p: p.par })}</p>
    <div class="acts"><button type="button" class="big-btn gold" data-act="go">${t('letsGo')}</button></div>`);
  return true;
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`); }

applyText();
if (!openFromHash()) go('home');
window.addEventListener('hashchange', openFromHash);
