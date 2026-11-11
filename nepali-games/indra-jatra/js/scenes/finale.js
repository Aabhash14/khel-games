// Chapter 5: the last nights. Catch the lucky fish in Swet Bhairav's jaand, watch Dagin pass,
// see the Yosin come down, then make your card.
import { E } from '../core/engine.js';
import { ART as A } from '../art/side.js';
import { Particles, camUpdate, camApply, camOverlay, flash, vignette } from '../core/fx.js';
import { tapped } from '../core/input.js';
import { UI } from '../core/ui.js';
import { AU, SFX } from '../core/audio.js';
import { t, num } from '../core/i18n.js';
import { save, persist } from '../core/store.js';
import { intro, pause, goMenu, totalLamps } from './common.js';
import { CH_NOTES } from '../data/strings.js';
import { showCard, CARD_PHOTO } from './card.js';
import { Photo } from '../core/photo.js';


let st, P, lay = {}, crowd;
function layout() {
  const { W, H } = E;
  lay.GY = Math.round(H * (H > W ? 0.6 : 0.68));
  lay.S = Math.max(0.6, Math.min(1.8, Math.min(W / 420, lay.GY / 420)));
  crowd = A.makeCrowd(18, -20, E.W + 20, 51);
}
// the jaand pipe starts at Swet Bhairav's real mouth in the photo
const mouth = () => Photo.toScreen(0.5, 0.735);
const spout = () => { const m = mouth(); return { x: Math.min(E.W - 40, m.x + 84 * lay.S), y: m.y + 30 * lay.S }; };
const cup = () => { const s = spout(); return { x: s.x + 6 * lay.S, y: Math.min(E.H - 270, s.y + 96 * lay.S) }; };

export const finaleScene = {
  enter() {
    layout();
    st = { beat: 'intro', fish: -1, fishT: 1.2, tries: 3, caught: false, wait: 0, bt: 0 };
    P = new Particles(500);
    UI.hideHud();
    AU.song('finale', 0.35); AU.amb(0.45, 0);
    Photo.preload([CARD_PHOTO, 'basantapur', 'raising']);
    intro('finale', [['catch', t('h_finale1')]]).then(begin);
  },
  resize: layout,
  exit() { AU.amb(0, 0); },
  update,
  draw,
};

function begin() {
  st.beat = 'fish';
  Photo.show('swet', { grade: 'cine', zoom: [1.06, 1.1], dur: 60 });
  UI.hud(t('c_finale'), t('d_finale'), () => pause(() => finaleScene.enter()));
  UI.stats([{ id: 'tries', label: t('fish'), value: t('f_tries', { n: st.tries }), wide: true }]);
  UI.controls([{ action: 'action', pos: 'bc', size: 'xl', icon: 'catch', label: t('catch') }]);
  UI.say(t('f0'), 'story', 6000);
}
function nextButton(fn) {
  UI.controls([{ action: 'action', pos: 'bc', size: 'lg', icon: 'fwd', label: t('next') }]);
  st.onNext = fn;
}

function update(dt) {
  camUpdate(dt);
  P.update(dt);
  st.bt += dt;
  if (st.beat === 'fish') {
    const sp = spout(), c = cup();
    if (Math.random() < 0.8) P.emit('drop', sp.x, sp.y, 1, { speed: 20, angle: 0.3, spread: 0.3, vx: 18, life: 0.9, size: 2 });
    if (st.fish < 0) { st.fishT -= dt; if (st.fishT <= 0) st.fish = 0; }
    else {
      st.fish += dt / 1.15;
      const inCup = st.fish > 0.78 && st.fish < 0.95;
      UI.setControl('action', { hot: inCup });
      if (tapped('action')) {
        if (inCup) { st.caught = true; save.lucky = true; persist(); SFX.win(); flash(0.4); UI.say(t('f_fish'), 'good big', 2600); P.emit('spark', c.x, c.y, 30, { speed: 90, life: 1, size: 2 }); return endFish(); }
        st.tries--; SFX.drip(); UI.say(t('f_miss'), 'bad', 1000); st.fish = -1; st.fishT = 1.3;
      } else if (st.fish >= 1.02) { st.tries--; SFX.drip(); UI.say(t('f_miss'), 'bad', 1000); st.fish = -1; st.fishT = 1.3; }
      UI.stat('tries', t('f_tries', { n: Math.max(0, st.tries) }));
      if (st.tries <= 0) endFish();
    }
  } else if (st.onNext && tapped('action')) { const f = st.onNext; st.onNext = null; SFX.ui(); f(); }
}
function endFish() {
  st.beat = 'fishDone'; st.fish = -1;
  nextButton(() => { st.beat = 'dagin'; st.bt = 0; Photo.show('basantapur', { grade: 'nightdrop', zoom: [1.1, 1.25], dur: 20 }); UI.stats([]); AU.song('upaku', 0.4); UI.say(t('f1') + (save.done.upaku ? ' ' + t('f1b') : ''), 'story', 7000); nextButton(lower); });
}
function lower() {
  st.beat = 'lower'; st.bt = 0; AU.song('finale', 0.5); SFX.bell(360);
  Photo.show('raising', { grade: 'cine', zoom: [1.25, 1.02], dur: 9 });
  UI.say(t('f2'), 'story', 6000);
  nextButton(card);
}
function card() {
  UI.hideControls(); UI.hush();
  save.done.finale = true;
  for (const n of CH_NOTES.finale) if (!save.notes.includes(n)) save.notes.push(n);
  persist();
  SFX.cheer(1);
  showCard(totalLamps(), goMenu);
}

function draw(g) {
  const { W, H } = E, { GY, S: sc } = lay, tm = E.t;
  A.use(g);
  g.save(); camApply(g);
  if (st.beat === 'dagin') {
    g.clearRect(0, 0, W, H);
    A.stage(W, GY, H, '8,5,18', 0.85);
    for (let k = 0; k < 16; k++) {
      const x = ((k / 16) * (W + 140 * sc) + st.bt * 26 * sc) % (W + 140 * sc) - 70 * sc;
      A.person(x, GY + 34 * sc + Math.sin(k) * 6 * sc, 66 * sc, { seed: 500 + k, dir: 1, walk: true, arms: 'tray', tray: true, t: tm, kind: k % 3 ? 'w' : 'm' });
    }
    vignette(g, 0.6, '6,4,20');
  } else if (st.beat === 'lower') {
    g.clearRect(0, 0, W, H);
    A.crowd(crowd, H + 20 * sc, 90 * sc, tm, { dark: true });
  } else {
    g.clearRect(0, 0, W, H);
    const sp = spout(), c = cup(), m = mouth();
    A.line(m.x, m.y, sp.x, sp.y, '#8a6a3a', 10 * sc); // the bamboo pipe
    A.line(m.x, m.y - 2 * sc, sp.x, sp.y - 2 * sc, '#d8b878', 4 * sc);
    for (let k = 1; k < 4; k++) { const f = k / 4; A.circle(m.x + (sp.x - m.x) * f, m.y + (sp.y - m.y) * f - 1, 3.5 * sc, '#6a4a22'); }
    // the stream of jaand from the pipe to your cup
    g.beginPath(); g.moveTo(sp.x, sp.y);
    for (let k = 1; k <= 12; k++) { const f = k / 12; g.lineTo(sp.x + (c.x - sp.x) * f + Math.sin(tm * 18 + k) * 1.5 * sc, sp.y + (c.y - sp.y) * f * f + (c.y - sp.y) * (f - f * f) * 0.6); }
    g.strokeStyle = 'rgba(245,238,215,.75)'; g.lineWidth = 4 * sc; g.lineCap = 'round'; g.stroke();
    // the cup you hold up, glowing when the fish is in reach
    const hot = st.fish > 0.78 && st.fish < 0.95;
    A.glow(c.x, c.y, 40 * sc, hot ? 'rgba(120,255,170,' : 'rgba(255,220,140,', hot ? 0.55 : 0.25);
    A.ell(c.x, c.y + 8 * sc, 26 * sc, 14 * sc, '#6a3a1a'); A.ell(c.x, c.y, 26 * sc, 8 * sc, '#a0602a'); A.ell(c.x, c.y - 1 * sc, 21 * sc, 5.5 * sc, '#f2ead2');
    if (st.fish >= 0) {
      const f = Math.min(1, st.fish), x = sp.x + (c.x - sp.x) * f + Math.sin(tm * 20) * 2, y = sp.y + (c.y - sp.y) * f * f;
      A.ell(x, y, 11 * sc, 4.5 * sc, '#e4ecf2', 1.2 + Math.sin(tm * 15) * 0.3); A.poly([x - 4 * sc, y - 9 * sc, x - 9 * sc, y - 15 * sc, x + 1 * sc, y - 14 * sc], '#b8c2cc'); A.circle(x + 3 * sc, y + 6 * sc, 1.4 * sc, '#111');
    }
    A.crowd(crowd, H + 30 * sc, 96 * sc, tm, { arms: 'up', dark: true });
  }
  P.draw(g);
  g.restore();
  camOverlay(g);
}
