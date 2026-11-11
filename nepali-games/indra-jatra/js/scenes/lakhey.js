// Chapter 3: dare Majipa Lakhey. Creep in, read his signs, get out in time.
import { E, slowmo } from '../core/engine.js';
import { ART as A } from '../art/side.js';
import { Particles, camUpdate, camApply, camOverlay, shake, flash, vignette } from '../core/fx.js';
import { isHeld, tapped } from '../core/input.js';
import { UI } from '../core/ui.js';
import { AU, SFX } from '../core/audio.js';
import { t, num } from '../core/i18n.js';
import { rng, newSeed } from '../rules/rand.js';
import { LAKHEY, createLakhey, stepLakhey, lakheyLamps } from '../rules/lakhey.js';
import { intro, pause, finish } from './common.js';
import { Photo } from '../core/photo.js';


let s, state, P, lay = {}, crowdBack, crowdFront, view, beatT = 0, stampT = 0;

function layout() {
  const { W, H } = E;
  lay.GY = Math.round(H * (H > W ? 0.6 : 0.7));
  lay.S = Math.max(0.6, Math.min(1.8, Math.min(W / 420, lay.GY / 420)));
  lay.x0 = W * 0.1; lay.x1 = W * 0.6; lay.home = W * 0.75;
  crowdBack = A.makeCrowd(24, -20, W + 20, 31);
  crowdFront = A.makeCrowd(16, -30, W + 30, 32);
}
const px = (x) => lay.x0 + (lay.x1 - lay.x0) * x;

export const lakheyScene = {
  enter() {
    layout();
    s = createLakhey(rng(newSeed()));
    state = 'intro'; P = new Particles();
    view = { px: px(0), lx: lay.home, zoom: 1, spin: 0, puluk: -1, caughtT: 0, shout: 0 };
    UI.hideHud();
    AU.song('lakhey', 0.3); AU.amb(0.6, 0);
    intro('lakhey', [['fwd', t('h_lakhey1')], ['back', t('h_lakhey2')], ['shout', t('h_lakhey3')]]).then(begin);
  },
  resize: layout,
  exit() { AU.amb(0, 0); AU.quiet(false); AU.tempo(1); },
  update,
  draw,
};

function begin() {
  state = 'play';
  Photo.show('night', { grade: 'nightdrop', zoom: [1.15, 1.25], dur: 90 });
  UI.hud(t('c_lakhey'), t('tole0'), () => pause(() => lakheyScene.enter()));
  UI.stats([{ id: 'time', label: t('time'), meter: true }, { id: 'nerve', label: t('nerve') }, { id: 'total', label: t('total') }]);
  UI.controls([
    { action: 'left', pos: 'bl', size: 'xl', icon: 'back', label: t('back') },
    { action: 'action', pos: 'bc', size: 'md', icon: 'shout', label: t('taunt') },
    { action: 'right', pos: 'br', size: 'xl', icon: 'fwd', label: t('fwd') },
  ]);
  UI.banner(t('k_round', { n: 1 }), t('tole0'), 1300);
  UI.say(t('k_go'), '', 1800);
}

function update(dt, real) {
  camUpdate(dt);
  P.update(dt);
  if (state !== 'play') return;
  const ev = stepLakhey(s, dt, { fwd: isHeld('right'), back: isHeld('left'), taunt: tapped('action') || tapped('up') });
  for (const e of ev) handle(e);
  if (s.over) return;
  // sound follows the danger
  const inReach = s.x > LAKHEY.reach;
  AU.intensity(0.35 + s.x * 0.6);
  AU.quiet(s.mode === 'tell' && s.tell === 'eye');
  AU.tempo(s.mode === 'tell' && s.tell === 'stamp' ? 1.5 : 1 + s.x * 0.12);
  beatT -= real;
  if (inReach && beatT <= 0) { SFX.heartbeat(0.6 + s.x * 0.5); beatT = s.mode === 'tell' ? 0.42 : 0.75; }
  if (s.mode === 'tell' && s.tell === 'stamp') { stampT -= real; if (stampT <= 0) { SFX.stamp(); stampT = 0.2; shake(0.08); } }
  // camera leans in while he threatens
  const wantZoom = s.mode === 'tell' ? 1.1 : s.mode === 'lunge' ? 1.16 : 1;
  Photo.push(wantZoom - 1); Photo.darken(s.mode === 'tell' ? 0.35 : s.mode === 'lunge' ? 0.2 : 0);
  view.zoom += (wantZoom - view.zoom) * Math.min(1, dt * 6);
  view.px += (px(s.x) - view.px) * Math.min(1, dt * 14);
  const lungeF = s.mode === 'lunge' ? Math.sin(Math.min(1, 1 - s.modeT / LAKHEY.lungeDur) * Math.PI) : 0;
  view.lx = lay.home - (lay.home - px(LAKHEY.reach) + 26 * lay.S) * lungeF;
  view.shout = Math.max(0, view.shout - dt);
  if (view.puluk >= 0) { view.puluk += dt; if (view.puluk > 1.8) view.puluk = -1; }
  const left = Math.max(0, s.roundT);
  UI.stat('time', num(Math.ceil(left)) + 's', left < 6 ? 'warn' : '', left / LAKHEY.roundTime);
  UI.stat('nerve', num(Math.round(s.pot)), s.pot > 0 ? 'good' : '');
  UI.stat('total', num(s.total));
  UI.setControl('action', { disabled: s.x < LAKHEY.tauntMin || s.tauntCD > 0 || !!s.end });
  UI.setControl('right', { hot: inReach });
}

function handle(e) {
  const y = lay.GY * 0.62;
  switch (e.type) {
    case 'tell': UI.say(t(e.tell === 'eye' ? 'k_eye' : 'k_stamp'), 'warn', 900); SFX.gasp(); break;
    case 'bluff': UI.say(t('k_bluff'), '', 1100); SFX.laugh(); break;
    case 'lunge': SFX.shout(); shake(0.25); break;
    case 'miss': if (e.close) { slowmo(0.35, 0.35); UI.say(t('k_miss'), 'good', 1200); SFX.cheer(0.4); } break;
    case 'caught':
      slowmo(0.3, 0.5); shake(0.7); flash(0.5, '200,30,20'); SFX.thud(1.3); SFX.laugh();
      view.caughtT = 1.4; UI.say(t('k_caught'), 'bad', 2400);
      if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
      break;
    case 'taunt': view.shout = 0.8; SFX.shout(); SFX.cheer(0.35); UI.floatText(view.px, y, t('taunt'), 'shout'); break;
    case 'puluk': view.puluk = 0; SFX.trumpet(); SFX.gasp(); UI.say(t('k_puluk'), 'warn', 2200); break;
    case 'bank':
      UI.say(e.timeUp ? t('k_time') : t('k_bank', { n: e.n }), 'good big', 1800);
      if (e.n) { SFX.cheer(0.9); UI.floatText(px(0) + 30, y, '+' + num(e.n), 'gain'); P.emit('petal', px(0), lay.GY - 60 * lay.S, 26, { speed: 120, life: 2.5, size: 4 }); }
      break;
    case 'round':
      UI.sub(t('tole' + e.round));
      UI.banner(t('k_round', { n: e.round + 1 }), t('tole' + e.round), 1300);
      view.px = px(0);
      break;
    case 'over':
      state = 'over'; AU.quiet(false); AU.tempo(1);
      setTimeout(() => finish('lakhey', lakheyLamps(s), t('k_res', { n: s.total, c: s.caught })), 600);
      break;
  }
}

function draw(g) {
  const { W, H } = E, { GY, S: sc } = lay, tm = E.t;
  A.use(g);
  g.save(); camApply(g);
  // zoom toward the gap between you and him
  const fx = (view.px + view.lx) / 2, fyy = GY;
  g.translate(fx, fyy); g.scale(view.zoom, view.zoom); g.translate(-fx, -fyy);
  g.clearRect(0, 0, W, H);
  A.stage(W, GY, H, '12,6,12', 0.9);
  for (let i = 0; i < 6; i++) A.glow(W * (i / 5), GY - 40 * sc, 130 * sc, 'rgba(255,170,80,', 0.2);
  // his reach, scorched into the lamplight on the stones
  const rx = px(LAKHEY.reach);
  const danger = s.mode === 'tell' ? 0.35 + 0.2 * Math.sin(tm * 18) : 0.12;
  const gr = g.createLinearGradient(rx, 0, lay.home, 0);
  gr.addColorStop(0, 'rgba(200,40,20,0)'); gr.addColorStop(0.15, `rgba(200,40,20,${danger})`); gr.addColorStop(1, `rgba(200,40,20,${danger * 0.6})`);
  g.fillStyle = gr; g.fillRect(rx, GY + 30 * sc, lay.home - rx + 60 * sc, 70 * sc);
  const fy = GY + 88 * sc;
  A.ell(view.lx, fy + 4 * sc, 70 * sc, 10 * sc, 'rgba(0,0,0,.4)');
  A.glow(view.lx, fy - 110 * sc, 160 * sc, 'rgba(255,120,60,', 0.18);
  const mode = s.mode === 'lunge' ? 'lunge' : s.mode === 'tell' ? s.tell : 'calm';
  A.lakhey(view.lx, fy, 210 * sc, tm, mode, -1);
  const caught = view.caughtT > 0;
  if (caught) view.caughtT -= 1 / 60;
  const moving = isHeld('right') || isHeld('left');
  A.ell(view.px, fy + 6 * sc, 22 * sc, 5 * sc, 'rgba(0,0,0,.4)');
  A.person(view.px, fy + 4 * sc, 88 * sc, { kind: 'y', seed: 8, dir: isHeld('left') ? -1 : 1, arms: view.shout > 0 ? 'point' : caught ? 'up' : 'down', walk: moving && state === 'play', t: caught ? tm * 4 : tm });
  if (view.puluk >= 0) pulukisi(g, W + 160 * sc - view.puluk * (W + 340 * sc) / 1.8, fy + 10 * sc, 130 * sc, tm);
  P.draw(g);
  A.crowd(crowdFront, H + 34 * sc, 96 * sc, tm, { dark: true, arms: s.mode === 'lunge' ? 'up' : 'down' });
  g.restore();
  vignette(g, s.mode === 'tell' ? 0.75 : 0.5);
  camOverlay(g);
}

// Pulukisi: dancers under a white cloth elephant, their feet showing
function pulukisi(g, x, by, h, tm) {
  const bob = Math.abs(Math.sin(tm * 10)) * h * 0.04;
  for (let k = 0; k < 4; k++) A.line(x - h * 0.35 + k * h * 0.23, by - h * 0.25, x - h * 0.35 + k * h * 0.23 + Math.sin(tm * 12 + k * 2) * h * 0.06, by, '#3a2a1a', h * 0.06);
  A.ell(x, by - h * 0.55 - bob, h * 0.62, h * 0.36, '#f4f1ea');
  A.rect(x - h * 0.62, by - h * 0.5 - bob, h * 1.24, h * 0.26, '#b3201a');
  A.rect(x - h * 0.62, by - h * 0.5 - bob, h * 1.24, h * 0.04, '#e3b23c');
  A.ell(x - h * 0.62, by - h * 0.75 - bob, h * 0.26, h * 0.24, '#f4f1ea');
  A.ell(x - h * 0.5, by - h * 0.78 - bob, h * 0.12, h * 0.18, '#e7e2d6');
  g.beginPath(); g.moveTo(x - h * 0.8, by - h * 0.7 - bob); g.quadraticCurveTo(x - h * 1.05, by - h * 0.5 - bob, x - h * 0.95, by - h * 0.3 - bob);
  g.strokeStyle = '#f4f1ea'; g.lineWidth = h * 0.1; g.lineCap = 'round'; g.stroke();
  A.circle(x - h * 0.7, by - h * 0.82 - bob, h * 0.035, '#120804');
}
