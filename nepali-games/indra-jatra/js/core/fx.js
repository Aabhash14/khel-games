// Particles, camera shake and screen flashes. Each scene owns its own Particles.
import { E } from './engine.js';

const TAU = Math.PI * 2;
const PETALS = ['#ff9d1c', '#ffc02e', '#f07a12', '#ffd85a'];

export class Particles {
  constructor(max = 600) { this.list = []; this.max = max; }
  emit(kind, x, y, n, o = {}) {
    for (let i = 0; i < n && this.list.length < this.max; i++) {
      const a = (o.angle ?? -Math.PI / 2) + (Math.random() - 0.5) * (o.spread ?? TAU);
      const sp = (o.speed ?? 60) * (0.4 + Math.random() * 0.8);
      this.list.push({
        kind, x: x + (Math.random() - 0.5) * (o.w || 0), y: y + (Math.random() - 0.5) * (o.h || 0),
        vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0),
        life: 0, max: (o.life ?? 1.2) * (0.6 + Math.random() * 0.8), size: (o.size ?? 3) * (0.6 + Math.random() * 0.8),
        rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 8, col: o.col || (kind === 'petal' ? PETALS[(Math.random() * 4) | 0] : null),
      });
    }
  }
  update(dt, wind = 0) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life += dt;
      if (p.life >= p.max) { L[i] = L[L.length - 1]; L.pop(); continue; }
      if (p.kind === 'petal') { p.vy += 40 * dt; p.vx += wind * dt * 4; p.vx *= 0.985; p.vy *= 0.97; p.rot += p.spin * dt; }
      else if (p.kind === 'smoke') { p.vy -= 8 * dt; p.vx += wind * dt * 2; p.size += 4 * dt; }
      else if (p.kind === 'dust') { p.vx += wind * dt * 6; p.vy -= 4 * dt; p.size += 6 * dt; }
      else if (p.kind === 'spark' || p.kind === 'ember') { p.vy += (p.kind === 'ember' ? -14 : 120) * dt; p.vx *= 0.98; }
      else if (p.kind === 'drop') { p.vy += 380 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }
  draw(g) {
    for (const p of this.list) {
      const f = p.life / p.max, a = 1 - f;
      if (p.kind === 'petal') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, a * 2);
        g.fillStyle = p.col; g.beginPath(); g.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, TAU); g.fill(); g.restore();
      } else if (p.kind === 'smoke' || p.kind === 'dust') {
        g.globalAlpha = a * (p.kind === 'smoke' ? 0.18 : 0.35);
        g.fillStyle = p.kind === 'smoke' ? '#d9d6e6' : (p.col || '#c9a77c');
        g.beginPath(); g.arc(p.x, p.y, p.size, 0, TAU); g.fill();
      } else {
        g.globalAlpha = a;
        g.fillStyle = p.col || (p.kind === 'drop' ? '#f2ead2' : p.kind === 'ember' ? '#ffb347' : '#ffe08a');
        g.beginPath(); g.arc(p.x, p.y, p.size * (p.kind === 'ember' ? a : 1), 0, TAU); g.fill();
      }
    }
    g.globalAlpha = 1;
  }
}

// Camera shake and colour flash, applied by each scene around its drawing.
export const Cam = { shake: 0, flash: 0, flashCol: '255,236,190' };
export function shake(a) { if (!E.reduced) Cam.shake = Math.max(Cam.shake, a); }
export function flash(a, col) { Cam.flash = Math.max(Cam.flash, a); if (col) Cam.flashCol = col; }
export function camUpdate(dt) { Cam.shake = Math.max(0, Cam.shake - dt * 2.2); Cam.flash = Math.max(0, Cam.flash - dt * 2.5); }
export function camApply(g) {
  if (Cam.shake > 0) { const s = Cam.shake * 12; g.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s); }
}
export function camOverlay(g) {
  if (Cam.flash > 0) { g.fillStyle = `rgba(${Cam.flashCol},${Cam.flash * 0.6})`; g.fillRect(-50, -50, E.W + 100, E.H + 100); }
}
// Vignette: darkens the edges so the eye goes to the middle. A full-screen radial gradient is one of the
// slowest things to paint, so it is painted once per size and colour at full strength, then drawn every
// frame with the strength as its alpha (same pixels).
const vig = { c: null, key: '' };
export function vignette(g, strength = 0.55, col = '10,4,8') {
  const { W, H, dpr } = E, key = col + '|' + W + '|' + H + '|' + dpr;
  if (vig.key !== key) {
    const c = vig.c || (vig.c = document.createElement('canvas'));
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const v = c.getContext('2d'); v.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = v.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.8);
    r.addColorStop(0, `rgba(${col},0)`); r.addColorStop(1, `rgba(${col},1)`);
    v.fillStyle = r; v.fillRect(0, 0, W, H);
    vig.key = key;
  }
  const a = g.globalAlpha; g.globalAlpha = a * strength;
  g.drawImage(vig.c, 0, 0, vig.c.width / dpr, vig.c.height / dpr);
  g.globalAlpha = a;
}
