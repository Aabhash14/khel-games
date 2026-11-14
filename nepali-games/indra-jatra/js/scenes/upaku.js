// Chapter 2: the Upaku walk. No score. A first-person walk through real Kathmandu at dusk:
// your hands carry a brass thali with Aji's lamp; Aama and Bhai walk beside you.
// Hold Walk to move down the street (the photo dollies forward), cover the flame when the wind
// comes, and at each real shrine hold to light a lamp. Music: a Newar bansuri ensemble.
import { E } from '../core/engine.js';
import { ART as A } from '../art/side.js';
import { Particles, camUpdate, camApply, camOverlay, vignette, flash } from '../core/fx.js';
import { isHeld } from '../core/input.js';
import { UI } from '../core/ui.js';
import { AU, SFX } from '../core/audio.js';
import { t } from '../core/i18n.js';
import { save, persist } from '../core/store.js';
import { intro, pause, finish } from './common.js';
import { Photo } from '../core/photo.js';

const SHRINES = ['ganesh', 'jaisi', 'lagan', 'akash', 'jana', 'annapurna'];
const WALK_SECS = 5;       // holding Walk for this long brings you to the next shrine
const WARN = 1.5, GUST = 1.2;
let st, P, lay = {};

function layout() {
  const { W, H } = E;
  lay.S = Math.max(0.7, Math.min(1.6, Math.min(W / 420, H / 760)));
  lay.tx = W / 2; lay.ty = Math.min(H * 0.8, H - 150 * lay.S); // the thali
  figures.clear();
}

export const upakuScene = {
  enter() {
    layout();
    st = { state: 'intro', stop: 0, p: 0.55, lit: true, lamps: [0, 0, 0, 0, 0, 0], light: 0, gust: null, nextGust: 2.5, kept: 0, outT: 0, memT: 0, endT: 0, walkT: 0, cover: 0, bob: 0 };
    P = new Particles(400);
    UI.hideHud();
    document.body.classList.add('say-high'); // subtitles above the thali
    AU.song('upaku', 0.45); AU.amb(0.15, 0.1);
    Photo.preload(['basantapur', 'sh-ganesh', 'sh-jaisi']);
    intro('upaku', [['walk', t('h_upaku1')], ['shield', t('h_upaku2')], ['lamp', t('h_upaku3')]]).then(begin);
  },
  resize: layout,
  exit() { AU.amb(0, 0); Photo.push(0); Photo.pan(0); document.body.classList.remove('say-high'); },
  update,
  draw,
};

function begin() {
  st.state = 'walk';
  streetPhoto();
  UI.hud(t('c_upaku'), t('d_upaku'), () => pause(() => upakuScene.enter()));
  stopChip();
  walkControls();
  UI.say(t('u_go'), 'story', 3600);
}
function streetPhoto() { Photo.show('basantapur', { grade: 'night', zoom: [1.02, 1.02], dur: 60, restart: true }); Photo.push(0); }
function stopChip() { UI.stats([{ id: 'stop', label: t('stopOf', { n: st.stop + 1 }), value: t('sh' + st.stop), wide: true }]); }
function walkControls() {
  UI.controls([
    { action: 'left', pos: 'bl', size: 'xl', icon: 'shield', label: t('shield') },
    { action: 'right', pos: 'br', size: 'xl', icon: 'walk', label: t('walk') },
  ]);
}

function update(dt) {
  camUpdate(dt);
  const wind = st.gust && st.gust.on ? 60 : 3;
  P.update(dt, wind);
  const { tx, ty } = lay, s = lay.S;
  // incense smoke from the thali, always
  if (Math.random() < 0.45) P.emit('smoke', tx + 58 * s, ty - 46 * s, 1, { speed: 14, angle: -Math.PI / 2, spread: 0.3, life: 2.6, size: 2.5 });
  if (st.state === 'intro') return;
  const covering = isHeld('left'), walking = st.state === 'walk' && isHeld('right') && !covering && st.lit;
  st.cover += ((covering ? 1 : 0) - st.cover) * Math.min(1, dt * 10);
  if (walking) { st.p += dt / WALK_SECS; st.bob += dt; st.walkT += dt; }
  if (st.state === 'walk') {
    Photo.push(Math.min(0.32, st.p * 0.32));
    Photo.pan(Math.sin(st.bob * 1.7) * 0.006);
    if (st.p >= 1) arrive();
    st.nextGust -= dt;
    if (!st.gust && st.nextGust <= 0 && st.lit) { st.gust = { warn: WARN, dur: GUST, on: false, saved: true }; UI.say(t('u_gust'), 'warn', 1600); SFX.whoosh(1, WARN + GUST); }
  }
  if (st.gust) {
    const g = st.gust;
    if (g.warn > 0) {
      g.warn -= dt;
      if (Math.random() < 0.6) P.emit('dust', -20, E.H * (0.45 + Math.random() * 0.4), 1, { speed: 8, vx: E.W * 0.7, life: 1.6, size: 4, col: '#8a7a6a' });
    } else {
      g.on = true; g.dur -= dt;
      AU.amb(0.15, 0.9);
      if (st.lit && st.cover < 0.6) { st.lit = false; g.saved = false; st.outT = 2.6; SFX.flameOut(); UI.say(t('u_out'), 'bad', 2600); P.emit('smoke', tx, ty - 40 * s, 10, { speed: 24, life: 1.6, size: 4 }); }
      if (g.dur <= 0) { if (g.saved) { st.kept++; UI.say(t('u_kept'), 'good', 1400); } st.gust = null; st.nextGust = 3 + Math.random() * 3; AU.amb(0.15, 0.1); }
    }
  }
  if (!st.lit) { st.outT -= dt; if (st.outT <= 0) { st.lit = true; SFX.light(); } }
  if (st.state === 'shrine') {
    const holding = isHeld('action');
    if (st.lit && holding) { st.light += dt / 1.1; if (Math.random() < 0.5) P.emit('spark', tx, ty - 44 * s, 1, { speed: 26, life: 0.5, size: 1.5 }); }
    else st.light = Math.max(0, st.light - dt);
    UI.setControl('action', { progress: st.light, disabled: !st.lit });
    if (st.light >= 1) lit();
  }
  if (st.state === 'memory') { st.memT -= dt; if (st.memT <= 0) leave(); }
  if (st.state === 'ending') { st.endT -= dt; if (st.endT <= 0) { st.state = 'asking'; ask(); } }
  AU.intensity(0.45 + (walking ? 0.25 : 0));
}

function arrive() {
  st.state = 'shrine'; st.light = 0; st.p = 1;
  Photo.show('sh-' + SHRINES[st.stop], { grade: 'dusk', zoom: [1.03, 1.12], dur: 14 });
  Photo.push(0); Photo.pan(0);
  if (SHRINES[st.stop + 1]) Photo.preload(['sh-' + SHRINES[st.stop + 1]]);
  UI.say(t('u_arrive', { name: t('sh' + st.stop) }), 'place', 2000);
  SFX.bell(440);
  UI.controls([{ action: 'action', pos: 'bc', size: 'xl', icon: 'lamp', label: t('light') }]);
}
function lit() {
  st.lamps[st.stop]++; st.state = 'memory'; st.memT = 5.4;
  SFX.light(); SFX.bell(560); flash(0.25, '255,210,140');
  P.emit('spark', lay.tx, lay.ty - 44 * lay.S, 18, { speed: 60, life: 0.9, size: 1.6 });
  UI.hideControls();
  UI.say(t('mem' + st.stop), 'story', 5200);
}
function leave() {
  if (st.stop >= SHRINES.length - 1) { st.state = 'ending'; st.endT = 6.5; UI.say(t('u_end'), 'story', 6500); Photo.show('indra', { grade: 'dusk', zoom: [1.05, 1.15], dur: 10 }); return; }
  st.stop++; st.state = 'walk'; st.p = 0; st.nextGust = 1.5 + Math.random() * 2;
  stopChip(); streetPhoto(); walkControls();
}
function ask() {
  UI.hideControls();
  UI.sheet((b, mk) => {
    b.append(mk('p', 'lede', t('u_ask')));
    const row = mk('div', 'row col');
    for (const m of ['laugh', 'story', 'laddu']) row.append(UI.button(t('m_' + m), 'main', () => {
      save.memory = m; persist(); UI.closeSheet();
      finish('upaku', 0, t('u_res') + ' ' + t('u_flames', { n: st.kept }) + ' ' + t('cardAji', { m: t('m_' + m) }));
    }));
    b.appendChild(row);
  }, 'small');
}

/* ---------- drawing: silhouettes, hands, the thali ---------- */
// a person seen from behind, dark, with warm rim light on the lamp side
function silhouette(g, x, top, h, kind, sway, rim, tm) {
  // a person seen from behind, slightly out of focus like a foreground figure in a film
  const sw = Math.sin(sway) * h * 0.012, X = x + sw;
  const r = h * 0.075, hy = top + r, nk = hy + r * 0.95, sh = nk + h * 0.07;
  // the blurred figure only moves, so it is painted once into a sprite (a canvas blur every frame is very slow)
  const f = figure(kind, h, rim);
  g.drawImage(f.c, X - f.ox, top - f.oy, f.c.width / E.dpr, f.c.height / E.dpr);
  if (kind === 'aama') { // her own lamp, held in front of her: we see its glow around her
    const lx = X + rim * h * 0.16, ly = sh + h * 0.12, fl = 1 + Math.sin(tm * 11) * 0.08;
    const gl = g.createRadialGradient(lx, ly, 0, lx, ly, h * 0.45 * fl);
    gl.addColorStop(0, 'rgba(255,190,100,.42)'); gl.addColorStop(1, 'rgba(255,150,60,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(lx - h * 0.5, ly - h * 0.5, h, h); g.globalCompositeOperation = 'source-over';
  }
}
const figures = new Map();
function figure(kind, h, rim) {
  const key = kind + ':' + h + ':' + rim + ':' + E.dpr;
  let f = figures.get(key);
  if (f) return f;
  const blur = Math.max(1.5, h * 0.012), pad = Math.ceil(blur * 4) + 4;
  const ox = Math.ceil(h * 0.21 + 2.2) + pad, oy = pad;
  const c = document.createElement('canvas');
  c.width = Math.ceil(ox * 2 * E.dpr); c.height = Math.ceil((h * 1.6 + pad * 2) * E.dpr);
  const g = c.getContext('2d');
  g.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
  const X = ox, top = oy;
  const r = h * 0.075, hy = top + r, nk = hy + r * 0.95, sh = nk + h * 0.07;
  const path = (dx) => {
    const Q = X + dx;
    g.beginPath();
    g.ellipse(Q, hy, r * 0.86, r, 0, 0, Math.PI * 2);
    if (kind === 'aama') { g.moveTo(Q + r * 0.4, hy - r * 0.35); g.ellipse(Q - r * 0.05, hy - r * 0.35, r * 0.48, r * 0.42, 0, 0, Math.PI * 2); }
    g.moveTo(Q - r * 0.42, nk - r * 0.2);
    g.lineTo(Q - r * 0.5, nk + h * 0.02);
    g.bezierCurveTo(Q - h * 0.1, sh - h * 0.02, Q - h * 0.17, sh, Q - h * 0.19, sh + h * 0.06);   // left shoulder
    g.bezierCurveTo(Q - h * 0.21, sh + h * 0.25, Q - h * 0.2, sh + h * 0.55, Q - h * 0.21, top + h * 1.6); // arm and side
    g.lineTo(Q + h * 0.21, top + h * 1.6);
    g.bezierCurveTo(Q + h * 0.2, sh + h * 0.55, Q + h * 0.21, sh + h * 0.25, Q + h * 0.19, sh + h * 0.06);
    g.bezierCurveTo(Q + h * 0.17, sh, Q + h * 0.1, sh - h * 0.02, Q + r * 0.5, nk + h * 0.02);
    g.lineTo(Q + r * 0.42, nk - r * 0.2);
    g.closePath();
  };
  if ('filter' in g) g.filter = `blur(${blur.toFixed(1)}px)`;
  path(rim * 2.2); g.fillStyle = 'rgba(255,178,100,.55)'; g.fill();
  path(0);
  const body = g.createLinearGradient(0, top, 0, top + h * 1.4);
  body.addColorStop(0, '#140b08'); body.addColorStop(1, '#070406');
  g.fillStyle = body; g.fill();
  if (kind === 'aama') {
    g.beginPath(); g.moveTo(X - h * 0.19, sh + h * 0.2); g.quadraticCurveTo(X, sh + h * 0.27, X + h * 0.19, sh + h * 0.17);
    g.strokeStyle = 'rgba(165,34,26,.85)'; g.lineWidth = h * 0.02; g.stroke(); // red border of her haku patasi
  }
  f = { c, ox, oy };
  figures.set(key, f);
  return f;
}
function thali(g, x, y, s, tm, bob) {
  const yy = y + Math.sin(bob * 7) * 3 * s;
  // forearms and hands from below
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(x + side * 150 * s, E.H + 20); g.quadraticCurveTo(x + side * 140 * s, yy + 40 * s, x + side * 98 * s, yy + 6 * s);
    g.lineTo(x + side * 82 * s, yy + 18 * s); g.quadraticCurveTo(x + side * 100 * s, yy + 60 * s, x + side * 104 * s, E.H + 20); g.closePath();
    const sk = g.createLinearGradient(x + side * 150 * s, 0, x + side * 85 * s, 0); sk.addColorStop(0, '#5a3522'); sk.addColorStop(1, '#a0694a');
    g.fillStyle = sk; g.fill();
  }
  // the brass plate
  const pg = g.createLinearGradient(0, yy - 20 * s, 0, yy + 24 * s);
  pg.addColorStop(0, '#f2cf7a'); pg.addColorStop(0.45, '#c9963a'); pg.addColorStop(1, '#6a4512');
  g.beginPath(); g.ellipse(x, yy + 6 * s, 110 * s, 30 * s, 0, 0, Math.PI * 2); g.fillStyle = '#5a3a10'; g.fill();
  g.beginPath(); g.ellipse(x, yy, 110 * s, 28 * s, 0, 0, Math.PI * 2); g.fillStyle = pg; g.fill();
  g.beginPath(); g.ellipse(x, yy - 2 * s, 96 * s, 22 * s, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(120,80,20,.45)'; g.fill();
  g.beginPath(); g.ellipse(x - 30 * s, yy - 8 * s, 40 * s, 6 * s, -0.1, 0, Math.PI * 2); g.fillStyle = 'rgba(255,240,190,.35)'; g.fill();
  // rice, marigolds, a little vermilion
  for (let k = 0; k < 40; k++) { const a = k * 2.4, r = (k % 9) * 2.6 * s; A.circle(x - 52 * s + Math.cos(a) * r, yy - 2 * s + Math.sin(a) * r * 0.35, 1.6 * s, '#f6efe0'); }
  for (let k = 0; k < 9; k++) { const fx = x + 18 * s + (k % 3) * 13 * s, fy = yy - 6 * s + Math.floor(k / 3) * 7 * s; A.circle(fx, fy, 6.5 * s, k % 2 ? '#f39a1c' : '#ffb52e'); A.circle(fx, fy, 2.4 * s, '#c96a0e'); }
  A.ell(x - 10 * s, yy + 6 * s, 9 * s, 4 * s, '#b3201a');
  // incense sticks with glowing tips
  for (const dx of [54, 60, 66]) { A.line(x + dx * s, yy - 2 * s, x + (dx + 2) * s, yy - 46 * s, '#6a3a1a', 1.6 * s); A.circle(x + (dx + 2) * s, yy - 46 * s, 2 * s, '#ff7a2a'); }
}
function lamp(g, x, y, s, lit, tm, cover) {
  // the clay diyo, its flame, and a bloom of light
  if (lit) {
    const fl = 1 + Math.sin(tm * 13) * 0.06 + Math.sin(tm * 21) * 0.04;
    const r = 120 * s * fl * (1 - cover * 0.4);
    const gl = g.createRadialGradient(x, y - 16 * s, 0, x, y - 16 * s, r);
    gl.addColorStop(0, 'rgba(255,200,110,.55)'); gl.addColorStop(0.35, 'rgba(255,150,60,.18)'); gl.addColorStop(1, 'rgba(255,140,60,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(x - r, y - 16 * s - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
    const lean = st.gust && st.gust.on ? 6 * s * (1 - cover) : Math.sin(tm * 3) * 1.2 * s;
    g.beginPath(); g.moveTo(x, y - 6 * s);
    g.quadraticCurveTo(x - 7 * s, y - 16 * s, x + lean, y - 34 * s * fl);
    g.quadraticCurveTo(x + 7 * s, y - 16 * s, x, y - 6 * s);
    const fg = g.createLinearGradient(0, y - 34 * s, 0, y - 6 * s); fg.addColorStop(0, 'rgba(255,170,60,.9)'); fg.addColorStop(0.6, '#ffd36a'); fg.addColorStop(1, '#fff6d0');
    g.fillStyle = fg; g.fill();
  }
  g.beginPath(); g.moveTo(x - 18 * s, y - 6 * s); g.quadraticCurveTo(x, y + 12 * s, x + 18 * s, y - 6 * s); g.closePath();
  g.fillStyle = '#8a4220'; g.fill();
  g.beginPath(); g.ellipse(x, y - 6 * s, 18 * s, 4 * s, 0, 0, Math.PI * 2); g.fillStyle = '#b5652e'; g.fill();
  // your cupped hand over the flame: palm curved over it, fingers together, lit from below
  if (cover > 0.05) {
    g.save(); g.globalAlpha = cover;
    const hx = x + 6 * s, hy = y - 30 * s;
    g.beginPath();
    g.moveTo(hx + 40 * s, y + 30 * s);                                  // wrist (from the right)
    g.bezierCurveTo(hx + 34 * s, hy + 14 * s, hx + 26 * s, hy - 22 * s, hx - 2 * s, hy - 24 * s);   // back of the hand
    g.bezierCurveTo(hx - 24 * s, hy - 25 * s, hx - 36 * s, hy - 10 * s, hx - 34 * s, hy + 6 * s);   // fingertips curling down
    g.bezierCurveTo(hx - 28 * s, hy + 2 * s, hx - 16 * s, hy - 8 * s, hx - 2 * s, hy - 8 * s);     // inside of the fingers
    g.bezierCurveTo(hx + 12 * s, hy - 6 * s, hx + 18 * s, hy + 12 * s, hx + 22 * s, y + 30 * s);   // palm down to the wrist
    g.closePath();
    const sk = g.createLinearGradient(0, hy - 26 * s, 0, y + 10 * s);
    sk.addColorStop(0, '#6a4030'); sk.addColorStop(0.55, '#a46a4a'); sk.addColorStop(1, '#e0a070');
    g.fillStyle = sk; g.fill();
    g.strokeStyle = 'rgba(70,35,20,.5)'; g.lineWidth = 1.1 * s;
    for (let k = 0; k < 3; k++) { const o = (k - 1) * 7 * s; g.beginPath(); g.moveTo(hx - 6 * s + o, hy - 22 * s + Math.abs(o) * 0.2); g.quadraticCurveTo(hx - 22 * s + o * 0.6, hy - 18 * s, hx - 28 * s + o * 0.3, hy + 2 * s); g.stroke(); }
    g.restore();
  }
}

function draw(g) {
  const { W, H } = E, tm = E.t, s = lay.S, { tx, ty } = lay;
  A.use(g);
  g.save(); camApply(g);
  g.clearRect(0, 0, W, H);
  // dusk settles on the lower part of the frame, where you and your family are
  const dk = g.createLinearGradient(0, H * 0.45, 0, H);
  dk.addColorStop(0, 'rgba(10,6,14,0)'); dk.addColorStop(1, 'rgba(10,6,14,.82)');
  g.fillStyle = dk; g.fillRect(0, H * 0.45, W, H * 0.55);
  // lamps already left at this shrine, glowing on its step
  if (st.state !== 'walk') for (let k = 0; k < st.lamps[st.stop]; k++) lamp(g, W / 2 - 40 * s + k * 40 * s, H * 0.62, s * 0.7, true, tm + k, 0);
  const bob = st.bob;
  const fh = Math.min(W * 0.3, H * 0.42);
  silhouette(g, W * 0.14, H * 0.5 + Math.abs(Math.sin(bob * 3.4)) * 6, fh, 'aama', bob * 3.4, 1, tm);
  silhouette(g, W * 0.88, H * 0.6 + Math.abs(Math.sin(bob * 3.4 + 1)) * 5, fh * 0.72, 'bhai', bob * 3.4 + 1, -1, tm);
  thali(g, tx, ty, s, tm, bob);
  lamp(g, tx, ty - 6 * s, s, st.lit, tm, st.cover);
  P.draw(g);
  vignette(g, 0.4, '8,4,14');
  g.restore();
  camOverlay(g);
}
