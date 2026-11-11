// Imposter: screen flow, hold-to-act controls, timers and juice. Rules live in rules.js.
import { PACKS } from './words.js';
import * as R from './rules.js';
import { t, L, num, getLang, setLang } from './i18n.js';
import { sfx, music, unlock, isMuted, setMuted, buzzHaptic } from './audio.js';
import { shareStory } from './share.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const rand = (a, b) => a + Math.random() * (b - a);
const tilt = () => `${rand(-1.6, 1.6).toFixed(2)}deg`;

/* ---------------- settings ---------------- */
const settings = {
  names: store.get('imposter.names', ['', '', '', '']),
  packs: store.get('imposter.packs', PACKS.map((p) => p.id)),
  mode: store.get('imposter.mode', 'classic'),
};
const saveSettings = () => {
  store.set('imposter.names', settings.names);
  store.set('imposter.packs', settings.packs);
  store.set('imposter.mode', settings.mode);
};

let game = null;
let screen = 'home';
const nameOf = (i) => (game ? game.players[i].name : settings.names[i]) || t('playerN', { n: i + 1 });

/* ---------------- screens ---------------- */
const renderers = {};
const leavers = {};
function show(id) {
  if (leavers[screen]) leavers[screen]();
  $$('.screen').forEach((s) => s.classList.toggle('on', s.dataset.screen === id));
  screen = id;
  window.scrollTo(0, 0);
  if (renderers[id]) renderers[id]();
}

function applyStatic() {
  const lang = getLang();
  document.documentElement.lang = lang;
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  $$('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
}
$$('[data-set-lang]').forEach((b) => b.addEventListener('click', () => {
  setLang(b.dataset.setLang);
  applyStatic();
  if (renderers[screen]) renderers[screen](true);
  sfx.tap();
}));

const muteBtn = $('#mute');
muteBtn.setAttribute('aria-pressed', String(isMuted()));
muteBtn.addEventListener('click', () => { setMuted(!isMuted()); muteBtn.setAttribute('aria-pressed', String(isMuted())); sfx.tap(); });

if (location.protocol === 'file:') $('#homeLink').href = '../index.html';
document.addEventListener('pointerdown', unlock, { once: true });

/* ---------------- juice ---------------- */
function shake(el = $('#app')) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
let toastTimer = 0;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 1800);
}

const fx = $('#fx');
const fctx = fx.getContext('2d');
let bits = [];
let fxRun = false;
function confetti(colors, count = 90) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < count; i++) {
    bits.push({
      x: innerWidth / 2 + rand(-40, 40), y: innerHeight * 0.35, vx: rand(-7, 7), vy: rand(-13, -4),
      w: rand(6, 14), h: rand(4, 9), r: rand(0, 6), vr: rand(-0.3, 0.3), c: colors[i % colors.length], life: rand(90, 150),
    });
  }
  if (!fxRun) { fxRun = true; requestAnimationFrame(stepFx); }
}
function stepFx() {
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  bits = bits.filter((b) => b.life-- > 0 && b.y < innerHeight + 30);
  for (const b of bits) {
    b.vy += 0.32; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
    fctx.save(); fctx.translate(b.x, b.y); fctx.rotate(b.r);
    fctx.scale(1, Math.cos(b.r * 2));
    fctx.fillStyle = b.c; fctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    fctx.restore();
  }
  if (bits.length) requestAnimationFrame(stepFx); else { fxRun = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
}

/** Ring helper: p in 0..1 = how much is LEFT. */
const setRing = (el, p) => { el.style.strokeDashoffset = String(283 * (1 - Math.max(0, Math.min(1, p)))); };

/**
 * Hold-to-act thumb button. Pointer and keyboard (Space/Enter).
 * opts: ms, onDown, onUp(done), onProgress(p), onDone
 */
function holdButton(btn, opts) {
  let start = 0; let raf = 0; let active = false; let done = false;
  const frame = (now) => {
    if (!active) return;
    const p = Math.min(1, (now - start) / opts.ms);
    btn.style.setProperty('--p', p);
    opts.onProgress && opts.onProgress(p);
    if (p >= 1 && !done) { done = true; opts.onDone && opts.onDone(); }
    raf = requestAnimationFrame(frame);
  };
  const down = (e) => {
    if (btn.disabled || active) return;
    if (e && e.pointerId != null) { try { btn.setPointerCapture(e.pointerId); } catch { /* fine */ } }
    e && e.preventDefault();
    unlock();
    active = true; done = false; start = performance.now();
    btn.classList.add('down');
    opts.onDown && opts.onDown();
    raf = requestAnimationFrame(frame);
  };
  const up = () => {
    if (!active) return;
    active = false; cancelAnimationFrame(raf);
    btn.classList.remove('down');
    btn.style.setProperty('--p', 0);
    opts.onUp && opts.onUp(done);
  };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('lostpointercapture', up);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(); if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
  btn.addEventListener('blur', up);
  return { cancel: up };
}

/* Keep the screen awake while a game is on. */
let wakeLock = null;
async function keepAwake() {
  try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch { /* fine */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && game) keepAwake(); });

/* ================= HOME ================= */
renderers.home = () => {
  const ol = $('#names');
  ol.innerHTML = '';
  settings.names.forEach((nm, i) => {
    const li = document.createElement('li');
    li.style.setProperty('--r', tilt());
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 14; inp.value = nm; inp.autocomplete = 'off'; inp.enterKeyHint = 'next';
    inp.placeholder = t('playerN', { n: i + 1 });
    inp.setAttribute('aria-label', t('playerN', { n: i + 1 }));
    inp.addEventListener('input', () => { settings.names[i] = inp.value.trim(); saveSettings(); });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); const nx = ol.querySelectorAll('input')[i + 1]; nx ? nx.focus() : inp.blur(); }
    });
    li.append(inp);
    if (settings.names.length > R.MIN_PLAYERS) {
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'x'; x.textContent = '×';
      x.setAttribute('aria-label', t('remove', { name: nm || t('playerN', { n: i + 1 }) }));
      x.addEventListener('click', () => { settings.names.splice(i, 1); saveSettings(); sfx.paper(); renderers.home(); });
      li.append(x);
    }
    ol.append(li);
  });
  $('#pCount').textContent = num(settings.names.length);
  $('#addPlayer').disabled = settings.names.length >= R.MAX_PLAYERS;

  const packs = $('#packs');
  packs.innerHTML = '';
  PACKS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip';
    b.setAttribute('aria-pressed', String(settings.packs.includes(p.id)));
    b.innerHTML = `<span aria-hidden="true">${p.icon}</span><span></span>`;
    b.lastChild.textContent = L(p);
    b.addEventListener('click', () => {
      const on = settings.packs.includes(p.id);
      settings.packs = on ? settings.packs.filter((x) => x !== p.id) : [...settings.packs, p.id];
      b.setAttribute('aria-pressed', String(!on));
      saveSettings(); sfx.tap(); $('#homeWarn').textContent = '';
    });
    packs.append(b);
  });

  $$('.seg button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === settings.mode)));
};

$('#addPlayer').addEventListener('click', () => {
  if (settings.names.length >= R.MAX_PLAYERS) return;
  settings.names.push(''); saveSettings(); sfx.paper(); renderers.home();
  const inputs = $$('#names input'); inputs[inputs.length - 1].focus();
});
$$('.seg button').forEach((b) => b.addEventListener('click', () => {
  settings.mode = b.dataset.mode; saveSettings(); sfx.tap(); renderers.home();
}));

$('#start').addEventListener('click', () => {
  unlock();
  const warn = $('#homeWarn');
  if (settings.names.length < R.MIN_PLAYERS) { warn.textContent = t('needPlayers'); sfx.wrong(); return; }
  if (!settings.packs.length) { warn.textContent = t('needPack'); sfx.wrong(); shake($('#packs')); return; }
  warn.textContent = '';
  const keep = game && game.players.length === settings.names.length && game.mode === settings.mode
    && game.packIds.join() === settings.packs.join();
  if (keep) {
    game.players.forEach((p, i) => { p.name = settings.names[i]; });
  } else {
    game = R.newGame(settings.names, { mode: settings.mode, packIds: settings.packs });
  }
  keepAwake();
  newRound();
});

function newRound() {
  R.startRound(game);
  game.roundNo = (game.roundNo || 0) + 1;
  pass.i = 0; pass.single = false;
  sfx.paper();
  show('pass');
}

/* ================= PASS + PEEK ================= */
const pass = { i: 0, single: false, seen: false, beat: 0 };
const chit = $('#chit');

function closeChit() {
  if (chit.classList.contains('open')) sfx.paper();
  chit.classList.remove('open');
  clearInterval(pass.beat);
}

renderers.pass = () => {
  const n = game.players.length;
  $('#passStep').textContent = pass.single ? t('forgot') : t('chitOf', { i: pass.i + 1, n });
  $('#passName').textContent = nameOf(pass.i);
  $('#flapName').textContent = nameOf(pass.i);
  const last = pass.single || pass.i === n - 1;
  $('#passNextLabel').textContent = pass.single ? t('backToClues') : last ? t('startClues') : t('next');
  $('#passNext').disabled = !pass.seen;
  $('#peek').classList.toggle('pulse', !pass.seen);
  fillChit();
};
function fillChit() {
  const s = R.secretFor(game, pass.i);
  const box = $('#chitIn');
  box.innerHTML = '';
  const el = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; e.textContent = text; box.append(e); return e; };
  if (s.kind === 'imposter') {
    el('div', 'tag', t('youAre'));
    el('div', 'imp-stamp', t('stampImp'));
    el('div', 'pack', t('hintIs', { h: L(s.hint) }));
    el('div', 'blend', t('blend'));
  } else {
    el('div', 'tag', t('yourWord'));
    el('div', 'word', L(s.word));
  }
}
leavers.pass = closeChit;

holdButton($('#peek'), {
  ms: 700,
  onDown() {
    chit.classList.add('open'); sfx.paper(); buzzHaptic(15);
    // Sound and vibration must be identical for everyone: the others can hear them.
    const imp = pass.i === game.round.imposter && game.mode === 'classic';
    let k = 0;
    const beat = () => { sfx.heart(Math.min(1, 0.3 + k * 0.15)); k++; };
    beat();
    pass.beat = setInterval(beat, 700);
    if (imp) { chit.classList.remove('shake'); void chit.offsetWidth; chit.classList.add('shake'); }
  },
  onDone() {
    if (!pass.seen) { pass.seen = true; $('#passNext').disabled = false; $('#peek').classList.remove('pulse'); }
  },
  onUp() { closeChit(); },
});

$('#passNext').addEventListener('click', () => {
  closeChit();
  sfx.tap();
  pass.seen = false;
  if (pass.single) { pass.single = false; show('clues'); return; }
  if (pass.i < game.players.length - 1) {
    pass.i++;
    show('pass');
  } else {
    clue.k = 0;
    show('clues');
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) closeChit(); });

/* ================= CLUES ================= */
const CLUE_MS = 15000;
const clue = { k: 0, t0: 0, raf: 0, lastSec: -1, buzzed: false };

renderers.clues = (langOnly) => {
  const order = game.round.order;
  const n = order.length;
  const r = Math.floor(clue.k / n);
  const who = order[clue.k % n];
  $('#clueStep').textContent = t('roundOf', { r: r + 1, n: R.CLUE_ROUNDS });
  $('#clueName').textContent = nameOf(who);
  $('#clueInitial').textContent = [...nameOf(who)][0].toUpperCase();
  const q = $('#queue');
  q.innerHTML = '';
  for (let k = clue.k + 1; k < Math.min(n * R.CLUE_ROUNDS, clue.k + 1 + n - 1); k++) {
    const li = document.createElement('li');
    li.textContent = nameOf(order[k % n]);
    if (Math.floor(k / n) > r) li.className = 'r2';
    q.append(li);
  }
  $('.mini-h', $('[data-screen="clues"]')).hidden = !q.children.length;
  if (langOnly === true) return;
  const spot = $('.spot'); spot.classList.remove('bump'); void spot.offsetWidth; spot.classList.add('bump');
  startClueTimer();
};
function startClueTimer() {
  cancelAnimationFrame(clue.raf);
  clue.t0 = performance.now(); clue.lastSec = -1; clue.buzzed = false;
  const ring = $('#clueRing');
  const tick = (now) => {
    if (screen !== 'clues') return;
    const left = Math.max(0, CLUE_MS - (now - clue.t0));
    setRing(ring, left / CLUE_MS);
    ring.classList.toggle('late', left < 5000);
    const sec = Math.ceil(left / 1000);
    if (sec !== clue.lastSec && sec <= 5 && sec > 0) sfx.tick(sec <= 2);
    clue.lastSec = sec;
    if (left === 0 && !clue.buzzed) { clue.buzzed = true; sfx.buzz(); shake($('.spot')); buzzHaptic(80); }
    if (left > 0) clue.raf = requestAnimationFrame(tick);
  };
  clue.raf = requestAnimationFrame(tick);
}
leavers.clues = () => cancelAnimationFrame(clue.raf);

$('#clueNext').addEventListener('click', () => {
  sfx.tap();
  clue.k++;
  if (clue.k >= game.players.length * R.CLUE_ROUNDS) show('talk');
  else renderers.clues();
});

const forgotDlg = $('#forgotDlg');
$('#forgot').addEventListener('click', () => {
  const g = $('#forgotGrid'); g.innerHTML = '';
  game.players.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick'; b.style.setProperty('--r', tilt());
    b.textContent = nameOf(i);
    b.addEventListener('click', () => {
      forgotDlg.close();
      pass.i = i; pass.single = true; pass.seen = false;
      show('pass');
    });
    g.append(b);
  });
  forgotDlg.showModal();
});

/* ================= TALK ================= */
const talk = { total: 90000, end: 0, raf: 0, lastSec: -1, over: false };
renderers.talk = (langOnly) => {
  if (langOnly === true) return;
  talk.total = 60000 + Math.min(6, game.players.length) * 10000; // 90s for 3 players, up to 2 min
  talk.end = performance.now() + talk.total;
  talk.over = false; talk.lastSec = -1;
  music.start();
  const ring = $('#talkRing'); const timeEl = $('#talkTime'); const wrap = $('#talkTimer');
  const tick = (now) => {
    const left = Math.max(0, talk.end - now);
    const span = Math.max(talk.total, left);
    setRing(ring, left / span);
    const sec = Math.ceil(left / 1000);
    if (sec !== talk.lastSec) {
      timeEl.textContent = num(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`);
      if (sec <= 10 && sec > 0) sfx.tick(sec <= 3);
      talk.lastSec = sec;
    }
    music.tension(1 - left / talk.total);
    ring.classList.toggle('late', left < 15000);
    wrap.classList.toggle('late', left < 10000);
    if (left === 0 && !talk.over) {
      talk.over = true; music.stop(); sfx.buzz(); shake(); buzzHaptic([100, 50, 100]);
      timeEl.textContent = t('timeUp');
      setTimeout(() => { if (screen === 'talk') show('vote'); }, 1300);
    }
    if (left > 0) talk.raf = requestAnimationFrame(tick);
  };
  talk.raf = requestAnimationFrame(tick);
};
leavers.talk = () => { cancelAnimationFrame(talk.raf); music.stop(); };
$('#moreTime').addEventListener('click', () => {
  if (talk.over) return;
  talk.end += 30000; talk.total = Math.max(talk.total, talk.end - performance.now()); sfx.tap();
});
$('#toVote').addEventListener('click', () => { sfx.tap(); show('vote'); });

/* ================= VOTE ================= */
const vote = { pick: null, timers: [], hold: null, rollT: 0 };
renderers.vote = (langOnly) => {
  if (langOnly === true) { renderVoteGrid(); return; }
  vote.pick = null;
  $('#voteA').hidden = false; $('#voteB').hidden = true;
  $('#countdown').innerHTML = '';
  $('#countBtn').disabled = false;
};
function clearVoteTimers() { vote.timers.forEach(clearTimeout); vote.timers = []; clearInterval(vote.rollT); }
leavers.vote = () => { clearVoteTimers(); $('#voteB').classList.remove('charging'); };

$('#countBtn').addEventListener('click', () => {
  $('#countBtn').disabled = true;
  const cd = $('#countdown');
  const beats = [num(3), num(2), num(1), t('point')];
  beats.forEach((txt, k) => vote.timers.push(setTimeout(() => {
    cd.innerHTML = `<span class="${k === 3 ? 'go' : ''}"></span>`;
    cd.firstChild.textContent = txt;
    sfx.drum(k === 3);
    if (k === 3) { shake(); buzzHaptic(120); }
    else buzzHaptic(25);
  }, k * 800)));
  vote.timers.push(setTimeout(() => {
    $('#voteA').hidden = true; $('#voteB').hidden = false;
    renderVoteGrid();
  }, 3 * 800 + 1300));
});
$('#recount').addEventListener('click', () => { sfx.tap(); renderers.vote(); });

function renderVoteGrid() {
  const g = $('#voteGrid'); g.innerHTML = '';
  const mk = (label, val, cls = '') => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `pick ${cls}`; b.setAttribute('role', 'radio');
    b.style.setProperty('--r', tilt());
    b.textContent = label;
    b.setAttribute('aria-checked', String(vote.pick === val));
    b.addEventListener('click', () => {
      vote.pick = val; sfx.tap();
      $$('.pick', g).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      $('#revealHold').disabled = false;
      $('#revealHold').classList.add('pulse');
    });
    g.append(b);
  };
  game.players.forEach((_, i) => mk(nameOf(i), i));
  mk(t('tie'), -1, 'tie');
  $('#revealHold').disabled = vote.pick === null;
}

vote.hold = holdButton($('#revealHold'), {
  ms: 1600,
  onDown() {
    $('#voteB').classList.add('charging');
    let k = 0;
    const roll = () => {
      sfx.snare(0.08 + Math.min(0.2, k * 0.01)); k++;
      clearInterval(vote.rollT);
      vote.rollT = setInterval(roll, Math.max(35, 140 - k * 7));
    };
    roll();
  },
  onDone() {
    clearInterval(vote.rollT);
    $('#voteB').classList.remove('charging');
    R.accuse(game, vote.pick);
    vote.hold.cancel();
    show('verdict');
  },
  onUp(done) {
    clearInterval(vote.rollT);
    $('#voteB').classList.remove('charging');
    if (!done) sfx.tap();
  },
});

/* ================= VERDICT ================= */
const verdict = { timers: [], stage: 0 };
renderers.verdict = (langOnly) => {
  const r = game.round;
  const accused = r.accused;
  $('#verdictName').textContent = accused === -1 ? t('nobody') : nameOf(accused);
  const stamp = $('#verdictStamp');
  const text = $('#verdictText');
  const btn = $('#verdictNext');
  const imp = nameOf(r.imposter);
  const setText = () => {
    const key = r.outcome === 'caught' ? 'caughtText' : accused === -1 ? 'tieText' : 'innocentText';
    text.innerHTML = '';
    const [a, b] = t(key, { name: '\u0000' }).split('\u0000');
    const strong = document.createElement('b'); strong.textContent = imp;
    text.append(a, strong, b || '');
    btn.textContent = r.outcome === 'caught' ? t('handTo', { name: imp }) : t('seeResult');
  };
  const setStamp = () => {
    stamp.textContent = r.outcome === 'caught' ? t('stampCaught') : accused === -1 ? t('stampEscaped') : t('stampInnocent');
    stamp.classList.toggle('blue', r.outcome !== 'caught' && accused !== -1);
  };
  if (langOnly === true) { if (verdict.stage >= 1) setStamp(); if (verdict.stage >= 2) setText(); return; }

  verdict.stage = 0;
  stamp.classList.remove('hit'); stamp.textContent = ''; text.textContent = ''; btn.hidden = true;
  verdict.timers.push(setTimeout(() => {
    verdict.stage = 1; setStamp(); void stamp.offsetWidth; stamp.classList.add('hit');
    verdict.timers.push(setTimeout(() => { sfx.stamp(); shake(); buzzHaptic(r.outcome === 'caught' ? [60, 40, 160] : 90); }, 330));
  }, 700));
  verdict.timers.push(setTimeout(() => {
    verdict.stage = 2; setText(); btn.hidden = false; btn.focus({ preventScroll: true });
    if (r.outcome !== 'caught') sfx.sneer();
  }, 1900));
};
leavers.verdict = () => { verdict.timers.forEach(clearTimeout); verdict.timers = []; };
$('#verdictNext').addEventListener('click', () => {
  sfx.tap();
  if (game.round.outcome === 'caught') show('guess'); else show('result');
});

/* ================= GUESS ================= */
const GUESS_MS = 15000;
const guess = { opts: [], raf: 0, locked: false, lastSec: -1 };
renderers.guess = (langOnly) => {
  $('#guessName').textContent = nameOf(game.round.imposter);
  if (langOnly !== true) { guess.opts = R.guessOptions(game); guess.locked = false; }
  const g = $('#guessGrid'); g.innerHTML = '';
  guess.opts.forEach((w) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick'; b.style.setProperty('--r', tilt());
    b.textContent = L(w);
    b.addEventListener('click', () => pickGuess(w, b));
    g.append(b);
  });
  if (langOnly === true) return;
  const t0 = performance.now(); guess.lastSec = -1;
  const ring = $('#guessRing'); const timeEl = $('#guessTime');
  const tick = (now) => {
    if (guess.locked) return;
    const left = Math.max(0, GUESS_MS - (now - t0));
    setRing(ring, left / GUESS_MS);
    ring.classList.toggle('late', left < 5000);
    const sec = Math.ceil(left / 1000);
    if (sec !== guess.lastSec) { timeEl.textContent = num(sec); if (sec <= 5 && sec > 0) sfx.tick(sec <= 2); guess.lastSec = sec; }
    if (left === 0) { pickGuess(null, null); return; }
    guess.raf = requestAnimationFrame(tick);
  };
  guess.raf = requestAnimationFrame(tick);
};
leavers.guess = () => cancelAnimationFrame(guess.raf);
function pickGuess(w, btn) {
  if (guess.locked) return;
  guess.locked = true;
  cancelAnimationFrame(guess.raf);
  const outcome = R.lastGuess(game, w);
  const crew = game.round.crew.en;
  $$('#guessGrid .pick').forEach((b, k) => {
    b.disabled = true;
    if (guess.opts[k].en === crew) b.classList.add('right');
  });
  if (btn && outcome !== 'stolen') btn.classList.add('wrong');
  if (!w) { $('#guessTime').textContent = t('timeUp'); sfx.buzz(); }
  else if (outcome === 'stolen') { sfx.right(); } else { sfx.wrong(); shake(); }
  setTimeout(() => { if (screen === 'guess') show('result'); }, 1500);
}

/* ================= RESULT ================= */
const result = { delta: null };
renderers.result = (langOnly) => {
  const r = game.round;
  if (langOnly !== true) result.delta = R.score(game);
  const out = r.outcome;
  const impName = nameOf(r.imposter);
  $('#resRound').textContent = t('roundN', { n: game.roundNo });
  const head = $('#resHead');
  head.textContent = out === 'crew' ? t('headCrew') : out === 'stolen' ? t('headStolen') : t('headEscaped');
  head.classList.toggle('imp', out !== 'crew');
  $('#resSub').textContent = t(out === 'crew' ? 'subCrew' : out === 'stolen' ? 'subStolen' : 'subEscaped', { name: impName });
  $('#resWord').textContent = L(r.crew);
  $('#resImpLabel').textContent = t('impHad', { name: impName });
  $('#resImpWord').textContent = game.mode === 'sneaky' ? L(r.twin) : t('onlyHint', { h: L(r.hint) });

  const ranked = game.players.map((p, i) => ({ i, s: p.score, d: result.delta[i] })).sort((a, b) => b.s - a.s || a.i - b.i);
  const top = ranked[0].s;
  const board = $('#board'); board.innerHTML = '';
  ranked.forEach((row, k) => {
    const li = document.createElement('li');
    if (row.s === top && top > 0) li.classList.add('top');
    if (row.i === r.imposter) li.classList.add('imp');
    li.innerHTML = '<span class="rank"></span><span class="nm"></span><span class="plus"></span><span class="pts"></span>';
    li.children[0].textContent = num(k + 1);
    li.children[1].textContent = nameOf(row.i);
    li.children[2].textContent = row.d ? `+${num(row.d)}` : '';
    li.children[3].textContent = num(row.s);
    board.append(li);
  });
  if (langOnly === true) return;
  if (out === 'crew') { sfx.win(); confetti(['#ffe94d', '#1f3a9e', '#8ef0a8', '#ff8ac1']); }
  else { (out === 'stolen' ? sfx.sneer : sfx.win)(); confetti(['#d62828', '#ff8ac1', '#24283a'], 60); }
  buzzHaptic(40);
};

$('#again').addEventListener('click', () => { sfx.tap(); newRound(); });
$('#toHome').addEventListener('click', () => { sfx.tap(); show('home'); });
$('#share').addEventListener('click', async () => {
  sfx.tap();
  const r = game.round;
  const msg = await shareStory({
    round: game.roundNo,
    outcome: r.outcome,
    imposter: nameOf(r.imposter),
    word: L(r.crew),
    impWord: game.mode === 'sneaky' ? L(r.twin) : t('onlyHint', { h: L(r.hint) }),
    impName: nameOf(r.imposter),
    board: game.players.map((p, i) => ({ name: nameOf(i), score: p.score, imp: i === r.imposter })).sort((a, b) => b.score - a.score),
  });
  if (msg) toast(msg);
});

/* ================= boot ================= */
applyStatic();
renderers.home();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
