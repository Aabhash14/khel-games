// Memory card pictures, painted on canvas at the card's real pixel size so they stay sharp on any screen.
// Eighteen pictures: the nine Animal Stack animals plus nine Nepali things in the same painted style
// (gradient body, ink outline, white sheen).
import { ANIMALS, drawAnimal } from './animals.js';

const INK = '#1b130e';
const grad = (ctx, y0, y1, light, base, dark) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, light); g.addColorStop(0.55, base); g.addColorStop(1, dark); return g;
};
function paint(ctx, fill, lw = 2.6, line = INK) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
function sheen(ctx, x, y, rx, ry, rot = -0.4, a = 0.5) { ctx.save(); ctx.globalAlpha = a; ell(ctx, x, y, rx, ry, rot); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); }
function line(ctx, c, w, f) { ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); f(); ctx.stroke(); ctx.restore(); }
function badge(ctx, c0, c1) { const g = ctx.createRadialGradient(50, 42, 4, 50, 50, 46); g.addColorStop(0, c0); g.addColorStop(1, c1); ell(ctx, 50, 50, 44, 44); ctx.fillStyle = g; ctx.fill(); }

// Each draws into a 100 × 100 box.
const THINGS = {
  momo(ctx) {
    badge(ctx, '#fff3c9', '#ffe08a');
    ell(ctx, 50, 72, 40, 12); paint(ctx, grad(ctx, 60, 84, '#ffffff', '#eef3fb', '#b9c6dc'));
    ell(ctx, 50, 70, 32, 8); ctx.strokeStyle = '#1f52d4'; ctx.lineWidth = 2; ctx.stroke();
    const one = (x, y, k) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.beginPath(); ctx.moveTo(-17, 8); ctx.bezierCurveTo(-20, -6, -8, -14, 0, -19); ctx.bezierCurveTo(8, -14, 20, -6, 17, 8); ctx.quadraticCurveTo(0, 13, -17, 8); ctx.closePath();
      paint(ctx, grad(ctx, -19, 10, '#fffdf6', '#f5e6c8', '#d4b88a'), 2.6 / k);
      line(ctx, '#b3925f', 1.6 / k, () => { for (const dx of [-8, -3, 3, 8]) { ctx.moveTo(dx * 0.35, -16); ctx.quadraticCurveTo(dx * 0.8, -6, dx, 4); } });
      ell(ctx, 0, -19, 2.4, 2); ctx.fillStyle = '#d4b88a'; ctx.fill();
      sheen(ctx, -7, -4, 4, 6, 0.3, 0.6);
      ctx.restore();
    };
    one(31, 60, 0.9); one(69, 60, 0.9); one(50, 54, 1.08);
    // achar dot
    ell(ctx, 82, 72, 6, 3.5); paint(ctx, '#d41f16', 1.8);
  },
  mango(ctx) {
    badge(ctx, '#e9f7d6', '#bfe39a');
    ctx.save(); ctx.translate(50, 55); ctx.rotate(-0.35);
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(26, -30, 30, 6, 18, 22); ctx.bezierCurveTo(8, 34, -20, 32, -24, 12); ctx.bezierCurveTo(-28, -10, -18, -30, 0, -30); ctx.closePath();
    const g = ctx.createLinearGradient(-24, -30, 24, 30); g.addColorStop(0, '#d8e04a'); g.addColorStop(0.45, '#ffb21f'); g.addColorStop(1, '#f0571d');
    paint(ctx, g);
    sheen(ctx, -10, -12, 6, 11, 0.2, 0.55);
    ctx.restore();
    line(ctx, '#5a3a1a', 3.2, () => { ctx.moveTo(44, 26); ctx.quadraticCurveTo(46, 20, 50, 16); });
    ctx.beginPath(); ctx.moveTo(49, 18); ctx.bezierCurveTo(60, 6, 76, 8, 82, 14); ctx.bezierCurveTo(72, 24, 58, 24, 49, 18); ctx.closePath();
    paint(ctx, grad(ctx, 8, 24, '#7fd36b', '#2f9a45', '#17663a'), 2.2);
    line(ctx, '#bfe9a8', 1.3, () => { ctx.moveTo(52, 18); ctx.quadraticCurveTo(66, 13, 79, 14); });
  },
  chili(ctx) {
    badge(ctx, '#fff0ea', '#ffd0c2');
    ctx.beginPath(); ctx.moveTo(28, 30); ctx.bezierCurveTo(48, 22, 68, 30, 76, 50); ctx.bezierCurveTo(82, 66, 80, 80, 70, 88);
    ctx.bezierCurveTo(70, 74, 62, 60, 50, 50); ctx.bezierCurveTo(42, 44, 32, 44, 24, 42); ctx.closePath();
    paint(ctx, grad(ctx, 22, 88, '#ff6a4f', '#d41f16', '#8f0f09'));
    sheen(ctx, 54, 37, 12, 3.5, 0.5, 0.6);
    ctx.beginPath(); ctx.moveTo(30, 28); ctx.bezierCurveTo(22, 26, 18, 34, 22, 42); ctx.bezierCurveTo(26, 40, 30, 36, 30, 28); ctx.closePath();
    paint(ctx, grad(ctx, 26, 42, '#7fd36b', '#2f9a45', '#17663a'), 2.2);
    line(ctx, INK, 3.4, () => { ctx.moveTo(22, 34); ctx.quadraticCurveTo(14, 26, 18, 14); });
    line(ctx, '#2f9a45', 2, () => { ctx.moveTo(22, 34); ctx.quadraticCurveTo(14, 26, 18, 14); });
  },
  kite(ctx) {
    badge(ctx, '#e3f3fb', '#a9dcf3');
    // tail first
    line(ctx, INK, 1.6, () => { ctx.moveTo(50, 78); ctx.bezierCurveTo(40, 86, 62, 90, 54, 98); });
    [[46, 84, '#d41f16'], [57, 92, '#ffcb1f']].forEach(([x, y, c]) => { ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x + 6, y + 4); ctx.lineTo(x + 6, y - 4); ctx.lineTo(x - 6, y + 4); ctx.closePath(); paint(ctx, c, 1.6); });
    const P = [[50, 8], [84, 42], [50, 78], [16, 42]];
    const quads = [['#ffcb1f', 0, 1], ['#d41f16', 1, 2], ['#1f52d4', 2, 3], ['#ff4f9a', 3, 0]];
    quads.forEach(([c, a, b]) => { ctx.beginPath(); ctx.moveTo(50, 44); ctx.lineTo(...P[a]); ctx.lineTo(...P[b]); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); });
    ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.lineWidth = 2.8; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    line(ctx, '#fffaf0', 2.2, () => { ctx.moveTo(50, 10); ctx.lineTo(50, 76); ctx.moveTo(18, 42); ctx.quadraticCurveTo(50, 30, 82, 42); });
    ell(ctx, 50, 44, 5, 5); paint(ctx, '#fffaf0', 2);
    sheen(ctx, 40, 26, 7, 3, -0.8, 0.45);
  },
  diyo(ctx) {
    const glow = ctx.createRadialGradient(50, 38, 2, 50, 44, 46); glow.addColorStop(0, '#fff6c8'); glow.addColorStop(0.5, '#ffd76a'); glow.addColorStop(1, '#ffb43a');
    ell(ctx, 50, 50, 44, 44); ctx.fillStyle = glow; ctx.fill();
    // flame
    ctx.beginPath(); ctx.moveTo(50, 14); ctx.bezierCurveTo(60, 30, 62, 42, 50, 50); ctx.bezierCurveTo(38, 42, 40, 30, 50, 14); ctx.closePath();
    const f = ctx.createLinearGradient(0, 14, 0, 50); f.addColorStop(0, '#ff7a1a'); f.addColorStop(0.5, '#ffcb1f'); f.addColorStop(1, '#fff6c8');
    paint(ctx, f, 2.2, '#b34a00');
    ell(ctx, 50, 42, 3.5, 6); ctx.fillStyle = '#fffaf0'; ctx.fill();
    line(ctx, INK, 2.4, () => { ctx.moveTo(50, 50); ctx.lineTo(50, 55); });
    // clay bowl with a spout
    ctx.beginPath(); ctx.moveTo(16, 56); ctx.lineTo(84, 56); ctx.quadraticCurveTo(80, 84, 50, 84); ctx.quadraticCurveTo(20, 84, 16, 56); ctx.closePath();
    paint(ctx, grad(ctx, 56, 84, '#e58a52', '#c0562a', '#7e3214'));
    ell(ctx, 50, 56, 34, 6); paint(ctx, grad(ctx, 50, 62, '#a7441b', '#7e3214', '#5a220c'), 2.4);
    line(ctx, '#ffcb1f', 2.2, () => { ctx.moveTo(24, 68); ctx.quadraticCurveTo(50, 76, 76, 68); });
    [30, 40, 50, 60, 70].forEach((x) => { ell(ctx, x, 71 + (Math.abs(x - 50) < 12 ? 2 : 0), 1.8, 1.8); ctx.fillStyle = '#fffaf0'; ctx.fill(); });
    sheen(ctx, 30, 63, 5, 2.5, 0.3, 0.35);
  },
  chiya(ctx) {
    badge(ctx, '#f3ece2', '#dcc9ad');
    line(ctx, '#fffaf0', 3, () => { ctx.moveTo(40, 30); ctx.bezierCurveTo(32, 22, 46, 18, 40, 8); ctx.moveTo(56, 30); ctx.bezierCurveTo(48, 22, 62, 18, 56, 8); });
    ell(ctx, 50, 84, 34, 7); paint(ctx, grad(ctx, 77, 91, '#ffffff', '#eef3fb', '#b9c6dc'));
    // handle
    ctx.beginPath(); ctx.ellipse(73, 56, 11, 12, 0, -1.4, 1.4); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4.5; ctx.strokeStyle = '#1f52d4'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24, 36); ctx.lineTo(76, 36); ctx.lineTo(70, 76); ctx.quadraticCurveTo(50, 84, 30, 76); ctx.closePath();
    paint(ctx, grad(ctx, 36, 82, '#5d8bff', '#1f52d4', '#14378f'));
    ell(ctx, 50, 36, 26, 6); paint(ctx, grad(ctx, 30, 42, '#e0a86a', '#b46a2c', '#7d4416'), 2.4);
    sheen(ctx, 44, 35, 9, 1.8, 0, 0.5);
    line(ctx, '#ffcb1f', 2.4, () => { ctx.moveTo(29, 52); ctx.quadraticCurveTo(50, 58, 72, 52); });
    [36, 50, 64].forEach((x) => { ell(ctx, x, 64, 3.2, 3.2); paint(ctx, '#ff4f9a', 1.4); });
    sheen(ctx, 32, 58, 3, 10, 0.1, 0.4);
  },
  madal(ctx) {
    badge(ctx, '#fde7d6', '#f6c29a');
    ctx.save(); ctx.translate(50, 52); ctx.rotate(-0.18);
    // barrel
    ctx.beginPath(); ctx.moveTo(-34, -15); ctx.quadraticCurveTo(0, -27, 34, -15); ctx.lineTo(34, 15); ctx.quadraticCurveTo(0, 27, -34, 15); ctx.closePath();
    paint(ctx, grad(ctx, -27, 27, '#ff6a4f', '#d41f16', '#8f0f09'));
    // lacing
    line(ctx, '#fffaf0', 1.6, () => { for (let i = 0; i < 7; i++) { const x = -30 + i * 10; ctx.moveTo(x, -18 + Math.abs(x) * 0.12); ctx.lineTo(x + 10, 18 - Math.abs(x + 10) * 0.12); ctx.moveTo(x + 10, -18 + Math.abs(x + 10) * 0.12); ctx.lineTo(x, 18 - Math.abs(x) * 0.12); } });
    ctx.fillStyle = '#ffcb1f'; ctx.fillRect(-6, -24, 12, 48); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.strokeRect(-6, -24, 12, 48);
    // heads
    [[-34, 1], [34, -1]].forEach(([x, d]) => {
      ell(ctx, x, 0, 7, 16); paint(ctx, grad(ctx, -16, 16, '#efe6d5', '#d9c8a8', '#a99573'), 2.4);
      ell(ctx, x - d, 0, 3.6, 8); ctx.fillStyle = '#1b130e'; ctx.fill();
    });
    sheen(ctx, -10, -15, 14, 2.6, 0, 0.45);
    ctx.restore();
    line(ctx, INK, 2.2, () => { ctx.moveTo(18, 40); ctx.quadraticCurveTo(50, 14, 82, 30); });
  },
  himal(ctx) {
    ctx.save(); ell(ctx, 50, 50, 44, 44); ctx.clip();
    const sky = ctx.createLinearGradient(0, 6, 0, 94); sky.addColorStop(0, '#2c7fd1'); sky.addColorStop(1, '#bfe6f6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 100, 100);
    ell(ctx, 74, 28, 9, 9); ctx.fillStyle = '#ffcb1f'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, 84); ctx.lineTo(22, 50); ctx.lineTo(34, 60); ctx.lineTo(52, 24); ctx.lineTo(70, 54); ctx.lineTo(80, 46); ctx.lineTo(104, 84); ctx.closePath();
    paint(ctx, grad(ctx, 24, 84, '#8aa7c8', '#5b7aa3', '#3a557c'), 2.6);
    ctx.beginPath(); ctx.moveTo(52, 24); ctx.lineTo(61, 39); ctx.lineTo(56, 36); ctx.lineTo(52, 42); ctx.lineTo(47, 36); ctx.lineTo(43, 41); ctx.closePath(); paint(ctx, '#ffffff', 2);
    ctx.beginPath(); ctx.moveTo(22, 50); ctx.lineTo(28, 57); ctx.lineTo(24, 56); ctx.lineTo(20, 59); ctx.lineTo(17, 56); ctx.closePath(); paint(ctx, '#ffffff', 1.8);
    ctx.beginPath(); ctx.moveTo(-4, 94); ctx.quadraticCurveTo(30, 70, 60, 80); ctx.quadraticCurveTo(84, 86, 104, 76); ctx.lineTo(104, 104); ctx.lineTo(-4, 104); ctx.closePath();
    paint(ctx, grad(ctx, 70, 100, '#5cc27a', '#2f9a45', '#17663a'), 2.6);
    ctx.restore();
    ell(ctx, 50, 50, 44, 44); ctx.lineWidth = 2.8; ctx.strokeStyle = INK; ctx.stroke();
    // prayer flags
    line(ctx, INK, 1.2, () => { ctx.moveTo(12, 40); ctx.quadraticCurveTo(30, 50, 46, 44); });
    ['#1f52d4', '#fffaf0', '#d41f16', '#2f9a45', '#ffcb1f'].forEach((c, i) => { const x = 16 + i * 6.5; const y = 42.5 + Math.sin((i + 0.5) / 5 * Math.PI) * 4.2; ctx.fillStyle = c; ctx.fillRect(x, y, 5, 6); });
  },
  mandir(ctx) {
    badge(ctx, '#fff3c9', '#ffd76a');
    const roof = (y, w, h) => {
      ctx.beginPath(); ctx.moveTo(50 - w, y + h); ctx.quadraticCurveTo(50 - w * 0.55, y + h * 0.55, 50 - w * 0.2, y); ctx.lineTo(50 + w * 0.2, y); ctx.quadraticCurveTo(50 + w * 0.55, y + h * 0.55, 50 + w, y + h); ctx.closePath();
      paint(ctx, grad(ctx, y, y + h, '#b0573a', '#7e3214', '#4f1d0a'), 2.4);
    };
    const wall = (y, w, h) => { ctx.beginPath(); ctx.rect(50 - w, y, w * 2, h); paint(ctx, grad(ctx, y, y + h, '#e36a4f', '#c0402a', '#8f2614'), 2.2); };
    ctx.beginPath(); ctx.rect(20, 82, 60, 6); paint(ctx, '#d9c8a8', 2.2);
    wall(64, 22, 18); ctx.beginPath(); ctx.roundRect(44, 68, 12, 14, [6, 6, 0, 0]); paint(ctx, '#3a1a0c', 1.8);
    roof(54, 36, 11);
    wall(43, 15, 11);
    roof(34, 27, 10);
    wall(26, 9, 9);
    roof(18, 19, 9);
    // gajur
    ctx.beginPath(); ctx.moveTo(50, 4); ctx.quadraticCurveTo(56, 12, 54, 18); ctx.lineTo(46, 18); ctx.quadraticCurveTo(44, 12, 50, 4); ctx.closePath();
    paint(ctx, grad(ctx, 4, 18, '#fff3a0', '#ffcb1f', '#c99a08'), 2);
    [[34, 64], [66, 64]].forEach(([x, y]) => { ell(ctx, x, y, 1.6, 2.6); ctx.fillStyle = '#ffcb1f'; ctx.fill(); });
    line(ctx, '#ffcb1f', 1.8, () => { ctx.moveTo(18, 64); ctx.lineTo(82, 64); ctx.moveTo(27, 44); ctx.lineTo(73, 44); });
  },
};

export const PICS = [
  ...ANIMALS.map((a) => ({ id: a.id, animal: a })),
  ...Object.keys(THINGS).map((id) => ({ id, draw: THINGS[id] })),
];

// Painted bounds of each animal (measured once) so it can be fitted to the card.
const bounds = new Map();
function animalBounds(a) {
  if (bounds.has(a.id)) return bounds.get(a.id);
  const S = 320; const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d', { willReadFrequently: true }); x.translate(S / 2, S / 2); drawAnimal(x, a);
  const d = x.getImageData(0, 0, S, S).data;
  let x0 = S; let y0 = S; let x1 = 0; let y1 = 0;
  for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) if (d[(y * S + xx) * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const b = { x: x0 - S / 2, y: y0 - S / 2, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  bounds.set(a.id, b); return b;
}

const BADGES = ['#e3f3fb', '#fde7d6', '#e9f7d6', '#fff3c9', '#f6e3f0', '#e6e8fb'];
// Paint a picture onto a canvas `px` device pixels square.
export function paintPic(cv, pic, px) {
  cv.width = cv.height = px;
  const ctx = cv.getContext('2d');
  ctx.setTransform(px / 100, 0, 0, px / 100, 0, 0);
  ctx.clearRect(0, 0, 100, 100);
  if (pic.draw) { pic.draw(ctx); return; }
  const i = ANIMALS.indexOf(pic.animal);
  ell(ctx, 50, 50, 44, 44); ctx.fillStyle = BADGES[i % BADGES.length]; ctx.fill();
  ell(ctx, 50, 50, 44, 44); ctx.lineWidth = 2; ctx.strokeStyle = '#1b130e22'; ctx.stroke();
  const b = animalBounds(pic.animal);
  const k = Math.min(84 / b.w, 74 / b.h);
  ctx.translate(50, 52); ctx.scale(k, k); ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
  drawAnimal(ctx, pic.animal);
}
