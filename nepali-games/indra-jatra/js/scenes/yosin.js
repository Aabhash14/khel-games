// Chapter 1: raise the Yosin. Two thumbs, two ropes, one very tall pole.
import { E } from '../core/engine.js';
import { ART as A } from '../art/side.js';
import { Particles, camUpdate, camApply, camOverlay, shake, flash, vignette } from '../core/fx.js';
import { isHeld } from '../core/input.js';
import { UI } from '../core/ui.js';
import { AU, SFX } from '../core/audio.js';
import { t, num } from '../core/i18n.js';
import { rng, newSeed } from '../rules/rand.js';
import { YOSIN, createYosin, stepYosin, yosinLamps } from '../rules/yosin.js';
import { intro, pause, finish } from './common.js';
import { Photo } from '../core/photo.js';


let s = null, state = 'intro', P, crowdL, crowdR, crowdF, chantT = 0, doneT = 0, topSaid = false, lateSaid = false, warnArrow = 0, warnDir = 0;
const lay = {};

function layout() {
  const { W, H } = E;
  lay.GY = Math.round(H * (H > W ? 0.6 : 0.68));
  lay.S = Math.max(0.6, Math.min(1.8, Math.min(W / 420, lay.GY / 420)));
  crowdL = A.makeCrowd(16, -20, W * 0.3, 11);
  crowdR = A.makeCrowd(16, W * 0.7, W + 20, 12);
  crowdF = A.makeCrowd(22, -30, W + 30, 13);
}

export const yosinScene = {
  enter() {
    s = createYosin(rng(newSeed()));
    state = 'intro'; P = new Particles(); chantT = 0; doneT = 0; topSaid = false; lateSaid = false; warnArrow = 0;
    layout();
    UI.hideHud();
    AU.song('yosin', 0.2); AU.amb(0.5, 0.15);
    intro('yosin', [['ropeL', t('h_yosin1')], ['ropeR', t('h_yosin2')], ['wind', t('h_yosin3')]]).then(begin);
  },
  resize: layout,
  exit() { AU.amb(0, 0); },
  update(dt) {
    camUpdate(dt);
    P.update(dt, s.wind * 3);
    if (state === 'play') play(dt);
    else if (state === 'done') { doneT -= dt; if (doneT <= 0) { state = 'over'; end(); } }
    if (state === 'done' && Math.random() < 0.5) P.emit('petal', E.W * (0.2 + Math.random() * 0.6), -10, 1, { speed: 30, angle: Math.PI / 2, spread: 1, life: 4, size: 5 });
  },
  draw,
};

function begin() {
  state = 'play';
  Photo.show('crowd', { grade: 'backdrop', zoom: [1.12, 1.2], dur: 40 });
  UI.hud(t('c_yosin'), t('d_yosin'), () => pause(() => yosinScene.enter()));
  UI.stats([{ id: 'sait', label: t('sait'), meter: true, wide: true }, { id: 'raised', label: t('raised') }]);
  UI.controls([
    { action: 'left', pos: 'bl', size: 'xl', icon: 'ropeL', label: t('ropeL') },
    { action: 'right', pos: 'br', size: 'xl', icon: 'ropeR', label: t('ropeR') },
  ]);
  UI.say(t('y_go'), 'big', 2400);
  AU.intensity(0.35);
}

function play(dt) {
  const L = isHeld('left'), R = isHeld('right');
  const ev = stepYosin(s, dt, { left: L, right: R });
  for (const e of ev) {
    if (e.type === 'gustWarn') {
      warnDir = e.dir; warnArrow = YOSIN.warnAhead;
      UI.say(t('y_gust', { dir: t(e.dir > 0 ? 'y_left' : 'y_right') }), 'warn', 1800);
      SFX.whoosh(e.dir, YOSIN.warnAhead + 0.8);
      // a wall of dust rolls in from the windward side and arrives with the gust
      const x0 = e.dir > 0 ? -30 : E.W + 30, vx = e.dir * (E.W * 0.55) / YOSIN.warnAhead;
      for (let k = 0; k < 26; k++) P.emit('dust', x0, lay.GY + Math.random() * (E.H - lay.GY) * 0.6, 1, { speed: 4, vx, life: 2.6, size: 6 + Math.random() * 8 });
    } else if (e.type === 'fumble') {
      shake(0.6); SFX.thud(1.2); SFX.gasp(); UI.say(t('y_fumble'), 'bad', 2200); AU.intensity(0.2);
      if (navigator.vibrate) navigator.vibrate([40, 40, 80]);
    } else if (e.type === 'resume') UI.say(t('y_resume'), '', 1400);
    else if (e.type === 'seated' || e.type === 'elders') {
      state = 'done'; doneT = 3.2; UI.hideControls();
      UI.say(t(e.type === 'seated' ? 'y_seated' : 'y_elders'), 'good big', 3000);
      SFX.bell(520); SFX.cheer(1.2); flash(0.7); AU.intensity(1);
      const top = poleTop();
      P.emit('spark', top.x, top.y, 40, { speed: 160, life: 1.4, size: 2.5 });
      P.emit('petal', top.x, top.y, 60, { speed: 140, life: 3.5, size: 5 });
    }
  }
  if (state !== 'play') return;
  // the crew chants on every heave
  chantT -= dt;
  if (L && R && chantT <= 0) { SFX.chant(); SFX.creak(0.8); chantT = 0.62; }
  if ((L !== R) && chantT <= 0) { SFX.creak(0.6); chantT = 0.8; }
  AU.intensity(0.3 + (L && R ? 0.35 : 0) + s.rise / 90 * 0.35);
  AU.amb(0.5 + s.rise / 180, Math.min(1, Math.abs(s.wind) / 14));
  if (s.rise >= 89 && !topSaid) { topSaid = true; UI.say(t('y_top'), 'big', 2600); }
  if (s.t > YOSIN.sait && !lateSaid) { lateSaid = true; UI.say(t('y_late'), 'warn', 2000); SFX.bell(300); }
  warnArrow = Math.max(0, warnArrow - dt);
  const left = Math.max(0, YOSIN.sait - s.t);
  UI.stat('sait', num(Math.ceil(left)) + 's', left <= 6 ? 'warn' : '', left / YOSIN.sait);
  UI.stat('raised', num(Math.round(s.rise / 90 * 100)) + '%');
  UI.setControl('left', { hot: L }); UI.setControl('right', { hot: R });
}

function end() {
  const lamps = yosinLamps(s);
  finish('yosin', lamps, t('y_res', { t: Math.round(s.t), f: s.fumbles }));
}

function poleBase() { return { x: E.W * 0.5, y: lay.GY + 18 * lay.S }; }
function poleTop() {
  const b = poleBase(), L = lay.GY - 80 * lay.S, ang = s.lean / 24 * 0.42, vis = L * (0.18 + 0.82 * Math.sin(s.rise * Math.PI / 180));
  return { x: b.x + Math.sin(ang) * vis, y: b.y - Math.cos(ang) * vis };
}

function draw(g) {
  const { W, H } = E, { GY, S: sc } = lay, tm = E.t;
  A.use(g);
  g.save(); camApply(g);
  g.clearRect(0, 0, W, H);
  A.stage(W, GY, H);
  const L = state === 'play' && isHeld('left'), R = state === 'play' && isHeld('right');
  const wind = s.wind || (warnArrow > 0 ? warnDir * 3 : 0);
  A.pennant(W * 0.06, GY - 2 * sc, 90 * sc, wind, tm);
  A.pennant(W * 0.94, GY - 2 * sc, 90 * sc, wind, tm + 1);
  const b = poleBase();
  // stone socket and a shadow under the pole
  A.ell(b.x, b.y + 4 * sc, 46 * sc, 9 * sc, 'rgba(0,0,0,.3)');
  A.rect(b.x - 34 * sc, b.y - 6 * sc, 68 * sc, 14 * sc, '#7c766c');
  A.rect(b.x - 34 * sc, b.y - 6 * sc, 68 * sc, 3 * sc, '#9c968a');
  const p = A.pole(b.x, b.y, GY - 80 * sc, s.rise, s.lean / 24 * 100, tm, s.wind);
  const ry = GY + 50 * sc;
  A.rope(p.mx, p.my, W * 0.16, ry - 26 * sc, L ? 3 : 26 * sc);
  A.rope(p.mx, p.my, W * 0.84, ry - 26 * sc, R ? 3 : 26 * sc);
  A.crowd(crowdL, ry, 64 * sc, tm * (L ? 2 : 1), { arms: L ? 'pull' : 'down', dir: -1, dx: L ? -6 * sc : 0 });
  A.crowd(crowdR, ry, 64 * sc, tm * (R ? 2 : 1), { arms: R ? 'pull' : 'down', dir: 1, dx: R ? 6 * sc : 0 });
  // two elders at the socket
  A.person(b.x - 52 * sc, b.y + 22 * sc, 70 * sc, { kind: 'm', seed: 71, dir: 1, arms: 'point', t: tm });
  A.person(b.x + 54 * sc, b.y + 22 * sc, 68 * sc, { kind: 'm', seed: 72, dir: -1, t: tm });
  P.draw(g);
  A.crowd(crowdF, H + 20 * sc, 96 * sc, tm, { dark: true, arms: state === 'done' ? 'up' : 'down' });
  vignette(g, 0.45);
  if (state === 'play' || state === 'done') gauge(g);
  if (warnArrow > 0) windArrow(g);
  g.restore();
  camOverlay(g);
}

// a plumb gauge: green when straight enough to seat, red near the stopping point
function gauge(g) {
  const { W } = E, cx = W / 2, cy = Math.max(132, E.H * 0.16) + 40, r = 58;
  const span = 0.95, toA = (deg) => -Math.PI / 2 + (deg / YOSIN.failLean) * span;
  g.lineCap = 'butt';
  const zone = (a, b, col) => { g.beginPath(); g.arc(cx, cy, r, toA(a), toA(b)); g.strokeStyle = col; g.lineWidth = 9; g.stroke(); };
  zone(-YOSIN.failLean, -14, 'rgba(200,40,30,.85)'); zone(-14, -YOSIN.seatLean, 'rgba(230,170,50,.85)');
  zone(-YOSIN.seatLean, YOSIN.seatLean, 'rgba(60,170,110,.95)');
  zone(YOSIN.seatLean, 14, 'rgba(230,170,50,.85)'); zone(14, YOSIN.failLean, 'rgba(200,40,30,.85)');
  const a = toA(Math.max(-YOSIN.failLean, Math.min(YOSIN.failLean, s.lean)));
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8));
  g.strokeStyle = '#fff6dc'; g.lineWidth = 3.5; g.lineCap = 'round'; g.stroke();
  g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fillStyle = '#e3b23c'; g.fill();
  if (s.rise >= 89 && s.seat > 0) { g.beginPath(); g.arc(cx, cy, r + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (s.seat / YOSIN.seatHold)); g.strokeStyle = '#7ee0a6'; g.lineWidth = 4; g.stroke(); }
}

function windArrow(g) {
  const { W } = E, y = lay.GY * 0.62, dir = warnDir, a = 0.5 + 0.5 * Math.sin(E.t * 14);
  const x0 = dir > 0 ? 24 : W - 24;
  g.save(); g.globalAlpha = a; g.fillStyle = '#ffe08a';
  for (let k = 0; k < 3; k++) {
    const x = x0 + dir * k * 18;
    g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + dir * 14, y); g.lineTo(x, y + 16); g.lineTo(x + dir * 5, y); g.closePath(); g.fill();
  }
  g.restore();
}
