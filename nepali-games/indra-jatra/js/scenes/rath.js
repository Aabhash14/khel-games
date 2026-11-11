// Chapter 4: Kumari Jatra. Drive Kumari's chariot through the lower town, top-down.
import { E } from '../core/engine.js';
import { Particles, camUpdate, camApply, camOverlay, shake, flash } from '../core/fx.js';
import { isHeld } from '../core/input.js';
import { UI } from '../core/ui.js';
import { AU, SFX } from '../core/audio.js';
import { t, num, clock } from '../core/i18n.js';
import { rng, newSeed } from '../rules/rand.js';
import { RATH, buildRoute, at, createRath, stepRath, rathLamps, festivalClock } from '../rules/rath.js';
import { building, temple, person, chariot, ropes, hash } from '../art/top.js';
import { intro, pause, finish } from './common.js';
import { Photo } from '../core/photo.js';


let s, state, P, W0, cam, light, lctx, sayCD = {}, creakT = 0, roll = 0, bRoll = 0;
const route = buildRoute();
const world = makeWorld(route);

// Houses, temples, spectators and lamps along the route. Built once.
function makeWorld(r) {
  const pts = r.pts, out = { houses: [], temples: [], people: [], lamps: [] };
  const nrm = (p) => ({ x: -Math.sin(p.th), y: Math.cos(p.th) });
  const clear = (x, y, pad) => { for (let i = 0; i < pts.length; i += 2) { const p = pts[i]; if (Math.hypot(p.x - x, p.y - y) < p.w / 2 + pad) return false; } return true; };
  const free = (x, y, rad) => { for (const o of out.houses) if (Math.hypot(o.x - x, o.y - y) < (o.rad + rad) * 0.82) return false; for (const o of out.temples) if (Math.hypot(o.x - x, o.y - y) < o.size * 1.3 + rad) return false; return true; };
  const TEMPLES = { hanuman: [7, 3, 'top'], maru: [7.5, 3, false], jaisi: [6, 3, false], lagan: [4.5, 2, 'top'], bhim: [5.5, 3, 'all'], hyumat: [4, 2, false] };
  for (const p of pts) if (p.name && TEMPLES[p.name]) {
    const [size, tiers, gold] = TEMPLES[p.name], n = nrm(p);
    for (const side of [1, -1]) { const x = p.x + n.x * side * (p.w / 2 + size + 1.5), y = p.y + n.y * side * (p.w / 2 + size + 1.5); if (clear(x, y, size)) { out.temples.push({ x, y, size, tiers, gold, s: p.s }); break; } }
  }
  let seed = 7;
  for (let i = 0; i < pts.length; i += 3) {
    const p = pts[i], n = nrm(p);
    for (const side of [-1, 1]) {
      seed++;
      const len = 6 + hash(seed) * 5, dep = 7 + hash(seed * 3) * 6, off = p.w / 2 + 1.4 + dep / 2;
      const x = p.x + n.x * side * off, y = p.y + n.y * side * off, rad = Math.max(len, dep) / 2;
      if (clear(x, y, dep / 2 + 1) && free(x, y, rad)) out.houses.push({ x, y, th: p.th, len, dep, h: 8 + hash(seed * 5) * 6, seed, s: p.s, rad, lit: hash(seed * 7) < 0.55 });
      for (let k = 0; k < 3; k++) {
        const o = p.w / 2 + 0.25 + hash(seed * 11 + k) * 0.9, a = (k - 1) * 0.9;
        out.people.push({ x: p.x + n.x * side * o + Math.cos(p.th) * a, y: p.y + n.y * side * o + Math.sin(p.th) * a, seed: (seed * 3 + k) & 1023, s: p.s });
      }
    }
    if (i % 15 === 0) { const side = (i / 15) % 2 ? 1 : -1; out.lamps.push({ x: p.x + n.x * side * (p.w / 2 + 0.7), y: p.y + n.y * side * (p.w / 2 + 0.7), s: p.s }); }
  }
  return out;
}

export const rathScene = {
  enter() {
    s = createRath(rng(newSeed()), route);
    state = 'intro'; P = new Particles(500); sayCD = {}; roll = 0; bRoll = 0;
    const p = at(route, 0);
    cam = { x: p.x, y: p.y, th: p.th };
    makeLight();
    UI.hideHud();
    AU.song('rath', 0.3); AU.amb(0.7, 0);
    intro('rath', [['pull', t('h_rath1')], ['left', t('h_rath2')], ['brake', t('h_rath3')]]).then(begin);
  },
  resize: makeLight,
  exit() { AU.amb(0, 0); },
  update,
  draw,
};

function makeLight() {
  light = document.createElement('canvas');
  light.width = Math.round(E.W * E.dpr); light.height = Math.round(E.H * E.dpr);
  lctx = light.getContext('2d');
}

function begin() {
  state = 'play';
  Photo.hide();
  UI.hud(t('c_rath'), t('p_hanuman'), () => pause(() => rathScene.enter()));
  UI.stats([
    { id: 'clock', label: t('clock') }, { id: 'gap', label: t('bhairavGap') },
    { id: 'scrapes', label: t('scrapes') }, { id: 'route', label: t('p_home'), meter: true, wide: true },
  ]);
  UI.controls([
    { action: 'left', pos: 'bl', size: 'lg', icon: 'left', label: t('left') },
    { action: 'right', pos: 'bl2', size: 'lg', icon: 'right', label: t('right') },
    { action: 'down', pos: 'br2', size: 'md', icon: 'brake', label: t('brake') },
    { action: 'up', pos: 'br', size: 'xl', icon: 'pull', label: t('pull') },
  ]);
  UI.say(t('r_go'), 'big', 2400);
  SFX.cheer(0.8);
}

function say(key, tone, ms, v, cd = 3) {
  if ((sayCD[key] || 0) > E.t) return;
  sayCD[key] = E.t + cd;
  UI.say(t(key, v), tone, ms);
}

function update(dt) {
  camUpdate(dt);
  P.update(dt);
  if (state === 'play') {
    const inp = { pull: isHeld('up') || isHeld('action'), brake: isHeld('down'), left: isHeld('left'), right: isHeld('right') };
    const ev = stepRath(s, dt, inp);
    for (const e of ev) handle(e);
    // warn before a sharp bend taken too fast
    let k = 0;
    for (let d = 14; d <= 34; d += 4) k = Math.max(k, Math.abs(at(route, Math.min(s.L, s.s + d)).k));
    if (k > 0.05 && s.v > 5) say('r_bend', 'warn', 1500, null, 5);
    const f = s.v / RATH.vmax;
    AU.intensity(0.3 + f * 0.6);
    AU.amb(0.75, 0);
    creakT -= dt * (0.4 + f * 1.4);
    if (creakT <= 0 && s.v > 0.3) { SFX.creak(0.5 + f * 0.6); creakT = 1; }
    UI.setControl('up', { progress: f, hot: inp.pull });
    UI.setControl('down', { hot: inp.brake });
    const late = s.t > RATH.target;
    UI.stat('clock', clock(festivalClock(s)), late ? 'warn' : '');
    const gap = Math.round(s.gap - RATH.gapMin);
    UI.stat('gap', num(Math.max(0, gap)) + 'm', gap < 6 || s.flooded ? 'warn' : '');
    UI.stat('scrapes', num(s.scrapes + s.bumps), s.scrapes + s.bumps ? 'warn' : '');
    UI.stat('route', num(Math.round(s.s / s.L * 100)) + '%', '', s.s / s.L);
  } else if (state === 'home') {
    s.v = Math.max(0, s.v - dt * 3);
    if (Math.random() < 0.6) P.emit('petal', cam.x + (Math.random() - 0.5) * 20, cam.y + (Math.random() - 0.5) * 20, 1, { speed: 2, life: 3, size: 0.35 });
  }
  roll += s.v * dt * 0.35;
  bRoll += s.b.v * dt * 0.35;
  // camera: follow the chariot, look a little ahead, turn smoothly
  const me = pose();
  const ahead = at(route, Math.min(s.L, s.s + 8));
  let d = ahead.th - cam.th; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  cam.th += d * Math.min(1, dt * 2.2);
  cam.x += (me.x - cam.x) * Math.min(1, dt * 6); cam.y += (me.y - cam.y) * Math.min(1, dt * 6);
}

function handle(e) {
  const me = pose();
  switch (e.type) {
    case 'place': UI.sub(t('p_' + e.name)); UI.say(t('p_' + e.name), 'place', 1800); SFX.bell(e.name === 'jaisi' ? 360 : 440); break;
    case 'scrape': {
      shake(0.35); SFX.scrape(); say('r_scrape', 'bad', 1400, null, 2);
      const n = { x: -Math.sin(me.th) * e.side, y: Math.cos(me.th) * e.side };
      P.emit('dust', me.x + n.x * 2.6, me.y + n.y * 2.6, 10, { speed: 3, life: 1, size: 0.6, col: '#b07a52' });
      P.emit('spark', me.x + n.x * 2.6, me.y + n.y * 2.6, 8, { speed: 6, life: 0.4, size: 0.12 });
      if (navigator.vibrate) navigator.vibrate(40);
      break;
    }
    case 'bump': shake(0.5); SFX.thud(1.2); SFX.gasp(); say('r_bump', 'bad', 1800, null, 2); break;
    case 'bStop': say('r_bStop', 'warn', 1800, null, 2); break;
    case 'flood': say('r_flood', 'warn', 2400, null, 4); SFX.gasp(); break;
    case 'unflood': say('r_unflood', 'good', 1200, null, 4); break;
    case 'surgeWarn': UI.say(t('r_surgeWarn', { place: t('p_' + e.place) }), 'warn', 2400); break;
    case 'surgeHit': UI.say(t('r_surgeHit'), 'bad', 2000); SFX.gasp(); shake(0.3); break;
    case 'surgeSafe': UI.say(t('r_surgeSafe'), 'good', 1400); break;
    case 'offerWarn': UI.say(t('r_offerWarn', { place: t('p_' + e.place) }), '', 2600); break;
    case 'blessed': UI.say(t('r_blessed'), 'good big', 2200); SFX.cheer(1); SFX.bell(620); flash(0.3, '255,200,90'); P.emit('petal', me.x, me.y, 50, { speed: 6, life: 2.5, size: 0.35 }); break;
    case 'home':
      state = 'home'; UI.hideControls(); UI.say(t('r_home'), 'good big', 3000); SFX.cheer(1.4); SFX.win(); AU.intensity(1);
      P.emit('petal', me.x, me.y, 120, { speed: 8, life: 3.5, size: 0.4 });
      setTimeout(() => finish('rath', rathLamps(s), t('r_res', { time: clock(festivalClock(s)), s: s.scrapes, b: s.bumps, c: s.surges, o: s.blessed })), 2600);
      break;
  }
}

function pose(sv = s.s, y = s.y) {
  const p = at(route, sv), n = { x: -Math.sin(p.th), y: Math.cos(p.th) };
  return { x: p.x + n.x * y, y: p.y + n.y * y, th: p.th, w: p.w };
}

function draw(g) {
  const { W, H } = E, tm = E.t;
  const phase = Math.min(3, 0.7 + s.t / RATH.target * 2.1);
  const ppm = Math.min(W / 34, H * 0.64 / 46);
  const dark = Math.max(0, Math.min(0.66, (phase - 1.3) * 0.42));
  const groundCol = phase < 1.5 ? '#6b4a36' : '#3a2820';
  g.fillStyle = groundCol; g.fillRect(0, 0, W, H);
  g.save(); camApply(g);
  g.translate(W / 2, H * 0.64);
  g.rotate(-cam.th - Math.PI / 2);
  g.scale(ppm, ppm);
  g.translate(-cam.x, -cam.y);
  const M = g.getTransform();
  const up = { x: Math.cos(cam.th), y: Math.sin(cam.th) };
  const s0 = s.s - 40, s1 = s.s + 75;
  // the road
  const pts = route.pts, i0 = Math.max(0, Math.floor(s0)), i1 = Math.min(pts.length - 1, Math.ceil(s1));
  const edge = (p, side) => ({ x: p.x - Math.sin(p.th) * side * p.w / 2, y: p.y + Math.cos(p.th) * side * p.w / 2 });
  g.beginPath();
  for (let i = i0; i <= i1; i++) { const e = edge(pts[i], -1); i === i0 ? g.moveTo(e.x, e.y) : g.lineTo(e.x, e.y); }
  for (let i = i1; i >= i0; i--) { const e = edge(pts[i], 1); g.lineTo(e.x, e.y); }
  g.closePath(); g.fillStyle = phase < 1.5 ? '#9c7a5c' : '#5e4636'; g.fill();
  g.strokeStyle = 'rgba(40,20,10,.35)'; g.lineWidth = 0.06; g.beginPath();
  for (let i = i0; i <= i1; i += 1) { const a = edge(pts[i], -1), b = edge(pts[i], 1); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
  g.stroke();
  g.strokeStyle = 'rgba(30,15,8,.55)'; g.lineWidth = 0.35;
  for (const side of [-1, 1]) { g.beginPath(); for (let i = i0; i <= i1; i++) { const e = edge(pts[i], side); i === i0 ? g.moveTo(e.x, e.y) : g.lineTo(e.x, e.y); } g.stroke(); }
  // zones painted on the road
  s.zones.forEach((z, zi) => {
    if (z.s1 < s0 || z.s0 > s1) return;
    const zs = s.zoneState[zi];
    if (z.kind === 'offer') {
      const p = pose((z.s0 + z.s1) / 2, 0);
      g.beginPath(); g.arc(p.x, p.y, 2.6, 0, Math.PI * 2); g.strokeStyle = zs.blessed ? 'rgba(255,200,80,.4)' : '#ff9d1c'; g.lineWidth = 0.5; g.setLineDash([0.6, 0.4]); g.stroke(); g.setLineDash([]);
      const n = { x: -Math.sin(p.th), y: Math.cos(p.th) };
      person(g, p.x + n.x * (p.w / 2 - 0.6), p.y + n.y * (p.w / 2 - 0.6), 0.4, 1, tm, false);
      g.beginPath(); g.arc(p.x + n.x * (p.w / 2 - 1.4), p.y + n.y * (p.w / 2 - 1.4), 0.35, 0, Math.PI * 2); g.fillStyle = '#e3b23c'; g.fill();
    } else {
      for (let q = z.s0; q < z.s1; q += 1.3) {
        const p = at(route, q), n = { x: -Math.sin(p.th), y: Math.cos(p.th) };
        for (const side of [-1, 1]) {
          const shy = zs.in && !zs.hit ? 0.6 : 0, jit = zs.hit ? Math.sin(tm * 20 + q) * 0.3 : 0;
          const o = side * (p.w / 2 - 1.0 - hash(q * 7 + side) * 0.9 + shy) + jit;
          person(g, p.x + n.x * o, p.y + n.y * o, 0.34, (q * 13 + side) & 1023, tm, true);
        }
      }
    }
  });
  // spectators
  for (const p of world.people) if (p.s > s0 && p.s < s1) person(g, p.x, p.y, 0.33, p.seed, tm, false);
  // the chariots
  const B = at(route, Math.min(route.length, s.b.s));
  if (s.b.s - s.s < 90) { ropes(g, B.x, B.y, B.th, tm, s.b.v > 0.3, 0.8); chariot(g, B.x, B.y, B.th, up, tm, bRoll, 'bhairav'); }
  const me = pose();
  ropes(g, me.x, me.y, me.th, tm, s.v > 0.3);
  chariot(g, me.x, me.y, me.th, up, tm, roll, 'kumari');
  P.draw(g);
  // buildings and temples, far ones first so near roofs overlap them
  const vis = [];
  for (const h of world.houses) if (h.s > s0 - 10 && h.s < s1 + 10) vis.push(h);
  for (const tp of world.temples) if (tp.s > s0 - 20 && tp.s < s1 + 20) vis.push(tp);
  const fwd = (o) => (o.x - cam.x) * up.x + (o.y - cam.y) * up.y;
  vis.sort((a, b) => fwd(b) - fwd(a));
  for (const o of vis) o.tiers ? temple(g, o, up) : building(g, o, up, dark > 0.15 && o.lit);
  g.restore();
  // night: darkness with pools of light from lamps and the torches around the chariot
  if (dark > 0.02) {
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, light.width, light.height);
    lctx.fillStyle = `rgba(8,6,26,${dark})`; lctx.fillRect(0, 0, light.width, light.height);
    lctx.setTransform(M.a * 1, M.b, M.c, M.d, M.e, M.f);
    lctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => { const gr = lctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lctx.fillStyle = gr; lctx.fillRect(x - r, y - r, r * 2, r * 2); };
    for (const l of world.lamps) if (l.s > s0 && l.s < s1) hole(l.x, l.y, 7, 0.85);
    hole(me.x, me.y, 13, 0.95);
    if (s.b.s - s.s < 90) hole(B.x, B.y, 10, 0.8);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(light, 0, 0);
    g.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    // warm glow on top
    g.save(); g.setTransform(M); g.globalCompositeOperation = 'lighter';
    for (const l of world.lamps) if (l.s > s0 && l.s < s1) { const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, 3); gr.addColorStop(0, `rgba(255,170,70,${0.5 * dark})`); gr.addColorStop(1, 'rgba(255,170,70,0)'); g.fillStyle = gr; g.fillRect(l.x - 3, l.y - 3, 6, 6); }
    g.restore();
  }
  camOverlay(g);
}
