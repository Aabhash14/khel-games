// Eight drawn Nepali animals: smooth vector art (layered gradients, sheen, painted detail) plus a
// physics outline made of simple convex parts. Local frame: origin near the body centre, facing right, y down.

const g2 = (ctx, y0, y1, pal) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, pal.light); g.addColorStop(0.55, pal.base); g.addColorStop(1, pal.dark);
  return g;
};
function paint(ctx, pal, y0, y1, lw = 2) {
  ctx.fillStyle = g2(ctx, y0, y1, pal); ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = pal.line; ctx.lineJoin = 'round'; ctx.stroke();
}
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
function fill(ctx, c) { ctx.fillStyle = c; ctx.fill(); }
function sheen(ctx, x, y, rx, ry, a = 0.28) { ctx.save(); ctx.globalAlpha = a; ell(ctx, x, y, rx, ry, -0.25); fill(ctx, '#fff'); ctx.restore(); }
function eye(ctx, x, y, r = 3.2) {
  ell(ctx, x, y, r, r * 1.1); fill(ctx, '#1b130e');
  ell(ctx, x - r * 0.35, y - r * 0.4, r * 0.36, r * 0.36); fill(ctx, '#fff');
}
function poly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
function stroke(ctx, c, w, f) { ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); f(); ctx.stroke(); ctx.restore(); }
function legs(ctx, pal, xs, y, w, h, hoof) {
  xs.forEach((x) => {
    rr(ctx, x, y, w, h, w / 2); paint(ctx, pal, y, y + h);
    if (hoof) { rr(ctx, x, y + h - 5, w, 5, [0, 0, w / 2, w / 2]); fill(ctx, hoof); }
  });
}
const darker = (pal) => ({ light: pal.base, base: pal.dark, dark: pal.line, line: pal.line });

const P = {
  grey: { light: '#d3d9e6', base: '#9ba5ba', dark: '#6b7489', line: '#4e566a' },
  rhino: { light: '#d8cdbe', base: '#a89b8a', dark: '#7a6d5e', line: '#5a4f42' },
  yak: { light: '#86674f', base: '#5a4131', dark: '#36261b', line: '#21160e' },
  tiger: { light: '#ffc985', base: '#f28a22', dark: '#bd570b', line: '#8a3d06' },
  panda: { light: '#f39555', base: '#cc5424', dark: '#8f3413', line: '#66230b' },
  goat: { light: '#ffffff', base: '#efe6d5', dark: '#c4b395', line: '#8c7a5f' },
  cow: { light: '#fffaf2', base: '#eadfcd', dark: '#bba98e', line: '#8a785d' },
  shell: { light: '#8fdc98', base: '#3f9d59', dark: '#246a39', line: '#174a27' },
  skin: { light: '#d6e08f', base: '#a9b85a', dark: '#77843a', line: '#55602a' },
};

export const ANIMALS = [
  {
    id: 'elephant', en: 'Elephant', ne: 'हात्ती', box: [-54, -36, 66, 40],
    parts: [['rect', -6, -2, 78, 42, 18], ['circle', 34, -12, 21], ['rect', -6, 26, 68, 12, 4], ['rect', 57, 10, 10, 26, 5]],
    draw(ctx) {
      const pal = P.grey;
      legs(ctx, darker(pal), [-36, 10], 12, 12, 24);
      stroke(ctx, pal.line, 3, () => { ctx.moveTo(-44, -8); ctx.quadraticCurveTo(-54, 0, -50, 12); });
      rr(ctx, -45, -23, 78, 42, 20); paint(ctx, pal, -23, 19);
      legs(ctx, pal, [-28, 18], 10, 13, 28, '#e8e2d6');
      ctx.beginPath(); ctx.arc(34, -12, 21, 0, Math.PI * 2); paint(ctx, pal, -33, 9);
      stroke(ctx, pal.line, 12.5, () => { ctx.moveTo(50, -4); ctx.quadraticCurveTo(62, 6, 58, 30); });
      stroke(ctx, pal.base, 9, () => { ctx.moveTo(50, -4); ctx.quadraticCurveTo(62, 6, 58, 30); });
      stroke(ctx, '#ffffff55', 2.5, () => { ctx.moveTo(53, -2); ctx.quadraticCurveTo(61, 6, 59, 22); });
      stroke(ctx, '#fbf3e3', 4, () => { ctx.moveTo(44, 4); ctx.quadraticCurveTo(50, 10, 56, 8); });
      ell(ctx, 22, -10, 13, 17, 0.15); paint(ctx, pal, -27, 7);
      ell(ctx, 23, -8, 7.5, 11, 0.15); fill(ctx, '#e9bcc1');
      eye(ctx, 41, -18);
      ell(ctx, 44, -9, 4, 2.5); fill(ctx, '#f2b8bd88');
      sheen(ctx, -18, -14, 22, 6); sheen(ctx, 30, -26, 8, 4);
    },
  },
  {
    id: 'rhino', en: 'Rhino', ne: 'गैँडा', box: [-52, -36, 68, 38],
    parts: [['rect', -8, -2, 76, 40, 16], ['poly', [[28, -18], [56, -8], [60, 10], [30, 16]]], ['poly', [[50, -8], [60, -30], [63, -6]]], ['rect', -8, 24, 62, 12, 4]],
    draw(ctx) {
      const pal = P.rhino;
      legs(ctx, darker(pal), [-34, 8], 12, 12, 24);
      stroke(ctx, pal.line, 3, () => { ctx.moveTo(-45, -6); ctx.quadraticCurveTo(-52, 2, -49, 10); });
      rr(ctx, -46, -22, 76, 40, 18); paint(ctx, pal, -22, 18);
      stroke(ctx, '#5a4f4255', 2, () => { ctx.moveTo(-16, -21); ctx.quadraticCurveTo(-11, -2, -16, 16); ctx.moveTo(12, -21); ctx.quadraticCurveTo(17, -2, 12, 16); });
      legs(ctx, pal, [-26, 16], 10, 13, 26, '#5a4f42');
      ctx.lineJoin = 'round';
      poly(ctx, [[26, -18], [50, -12], [60, -2], [60, 10], [46, 16], [28, 16]]); paint(ctx, pal, -18, 16);
      poly(ctx, [[50, -8], [60, -31], [63, -6]]); ctx.fillStyle = (() => { const g = ctx.createLinearGradient(0, -31, 0, -6); g.addColorStop(0, '#fbf5e8'); g.addColorStop(1, '#cbbd9f'); return g; })(); ctx.fill(); ctx.strokeStyle = pal.line; ctx.lineWidth = 1.5; ctx.stroke();
      poly(ctx, [[41, -13], [45, -25], [48, -12]]); fill(ctx, '#e4d8bf');
      ell(ctx, 30, -19, 3.5, 7, -0.4); paint(ctx, pal, -26, -12, 1.5);
      eye(ctx, 40, -6, 2.8);
      ell(ctx, 57, 5, 1.5, 2.2); fill(ctx, '#3b3128');
      sheen(ctx, -20, -13, 20, 5);
    },
  },
  {
    id: 'yak', en: 'Yak', ne: 'चौँरी', box: [-48, -42, 56, 36],
    parts: [['rect', -4, -6, 74, 40, 14], ['circle', 36, -2, 16], ['rect', -8, 22, 58, 12, 4]],
    draw(ctx) {
      const pal = P.yak;
      legs(ctx, darker(pal), [-30, 8], 10, 11, 22);
      stroke(ctx, pal.line, 5, () => { ctx.moveTo(-40, -14); ctx.quadraticCurveTo(-50, -4, -46, 10); });
      ell(ctx, -8, -24, 22, 10); paint(ctx, pal, -34, -14);
      rr(ctx, -41, -26, 74, 40, 16); paint(ctx, pal, -26, 14);
      ctx.beginPath(); ctx.moveTo(-41, 4);
      for (let x = -41; x <= 33; x += 7.4) ctx.quadraticCurveTo(x + 3.7, 22, x + 7.4, 6);
      ctx.lineTo(33, 4); ctx.closePath(); fill(ctx, pal.dark);
      legs(ctx, pal, [-24, 14], 12, 12, 22, '#e9dcc0');
      ctx.beginPath(); ctx.arc(36, -2, 16, 0, Math.PI * 2); paint(ctx, pal, -18, 14);
      stroke(ctx, '#3d2b1e', 8, () => { ctx.moveTo(24, -12); ctx.quadraticCurveTo(36, -18, 48, -12); });
      stroke(ctx, '#efe2c2', 4.5, () => { ctx.moveTo(28, -14); ctx.quadraticCurveTo(18, -18, 20, -32); ctx.moveTo(44, -14); ctx.quadraticCurveTo(54, -18, 52, -32); });
      ell(ctx, 44, 7, 8, 6); fill(ctx, '#8d6c55');
      ell(ctx, 41, 6, 1.3, 1.6); fill(ctx, '#1b130e'); ell(ctx, 47, 6, 1.3, 1.6); fill(ctx, '#1b130e');
      eye(ctx, 31, -3, 2.8); eye(ctx, 42, -3, 2.8);
      sheen(ctx, -14, -18, 20, 5, 0.18);
    },
  },
  {
    id: 'tiger', en: 'Tiger', ne: 'बाघ', box: [-68, -32, 56, 20],
    parts: [['rect', -8, 0, 80, 30, 14], ['circle', 36, -6, 17]],
    draw(ctx) {
      const pal = P.tiger; const ink = '#24160c';
      stroke(ctx, pal.line, 8, () => { ctx.moveTo(-46, 4); ctx.bezierCurveTo(-60, 2, -66, -10, -60, -20); });
      stroke(ctx, pal.base, 5.5, () => { ctx.moveTo(-46, 4); ctx.bezierCurveTo(-60, 2, -66, -10, -60, -20); });
      stroke(ctx, ink, 2.5, () => { ctx.moveTo(-56, -2); ctx.lineTo(-60, 3); ctx.moveTo(-62, -9); ctx.lineTo(-67, -6); ctx.moveTo(-61, -17); ctx.lineTo(-56, -20); });
      rr(ctx, -48, -15, 80, 30, 15); paint(ctx, pal, -15, 15);
      ctx.save(); rr(ctx, -48, -15, 80, 30, 15); ctx.clip();
      ell(ctx, -8, 15, 34, 7); fill(ctx, '#fff3e2');
      [-36, -24, -12, 0, 12].forEach((x, i) => stroke(ctx, ink, 3.2, () => { ctx.moveTo(x, -16); ctx.quadraticCurveTo(x + 5, -8, x + (i % 2 ? 1 : 3), 0); }));
      ctx.restore();
      rr(ctx, 6, 9, 17, 9, 4.5); paint(ctx, pal, 9, 18, 1.5); rr(ctx, 22, 9, 17, 9, 4.5); paint(ctx, pal, 9, 18, 1.5);
      [[26, -20], [46, -21]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); paint(ctx, pal, y - 6, y + 6, 1.5); ctx.beginPath(); ctx.arc(x, y + 0.5, 3, 0, Math.PI * 2); fill(ctx, '#f6b9a0'); });
      ctx.beginPath(); ctx.arc(36, -6, 17, 0, Math.PI * 2); paint(ctx, pal, -23, 11);
      ell(ctx, 36, 3, 11, 7); fill(ctx, '#fff3e2');
      stroke(ctx, ink, 2.4, () => { ctx.moveTo(30, -21); ctx.lineTo(31, -15); ctx.moveTo(36, -23); ctx.lineTo(36, -16); ctx.moveTo(42, -21); ctx.lineTo(41, -15); ctx.moveTo(20, -8); ctx.lineTo(25, -7); ctx.moveTo(52, -8); ctx.lineTo(47, -7); });
      eye(ctx, 30.5, -7, 2.9); eye(ctx, 41.5, -7, 2.9);
      poly(ctx, [[33.5, -1], [38.5, -1], [36, 2]]); fill(ctx, '#e0677a');
      stroke(ctx, ink, 1.4, () => { ctx.moveTo(36, 2); ctx.quadraticCurveTo(33, 6, 31, 4); ctx.moveTo(36, 2); ctx.quadraticCurveTo(39, 6, 41, 4); });
      sheen(ctx, -22, -9, 20, 4.5);
    },
  },
  {
    id: 'panda', en: 'Red Panda', ne: 'हाब्रे', box: [-34, -36, 34, 34],
    parts: [['circle', 0, 0, 30]],
    draw(ctx) {
      const pal = P.panda;
      [[1, -23], [21, -21]].forEach(([x, y]) => { poly(ctx, [[x - 7, y + 6], [x, y - 8], [x + 7, y + 6]]); paint(ctx, pal, y - 8, y + 6, 1.5); poly(ctx, [[x - 3.5, y + 4], [x, y - 3], [x + 3.5, y + 4]]); fill(ctx, '#fff3e2'); });
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); paint(ctx, pal, -30, 30);
      ell(ctx, 11, -6, 15, 12); fill(ctx, '#fff3e2');
      ell(ctx, 11, -1, 9, 8); fill(ctx, pal.base);
      ell(ctx, 6, -8, 3.6, 3); fill(ctx, '#8f3413'); ell(ctx, 16, -8, 3.6, 3); fill(ctx, '#8f3413');
      eye(ctx, 6, -8, 2.4); eye(ctx, 16, -8, 2.4);
      ell(ctx, 11, -1, 2.6, 1.8); fill(ctx, '#1b130e');
      ell(ctx, -6, 26, 6, 4); fill(ctx, '#3a1d10'); ell(ctx, 10, 27, 6, 4); fill(ctx, '#3a1d10');
      stroke(ctx, pal.line, 15, () => { ctx.arc(0, 2, 24, Math.PI * 0.42, Math.PI * 1.05); });
      stroke(ctx, pal.base, 12, () => { ctx.arc(0, 2, 24, Math.PI * 0.42, Math.PI * 1.05); });
      ctx.save(); ctx.setLineDash([4, 7]); ctx.lineDashOffset = 2;
      stroke(ctx, '#7a2a0f', 12, () => { ctx.arc(0, 2, 24, Math.PI * 0.46, Math.PI * 1.02); });
      ctx.restore();
      stroke(ctx, '#ffffff40', 2.5, () => { ctx.arc(0, 2, 28, Math.PI * 0.5, Math.PI * 0.95); });
      sheen(ctx, -12, -16, 11, 6);
    },
  },
  {
    id: 'goat', en: 'Goat', ne: 'बाख्रा', box: [-36, -40, 42, 34],
    parts: [['rect', -4, -6, 50, 26, 11], ['circle', 27, -16, 11], ['rect', -2, 18, 44, 14, 3]],
    draw(ctx) {
      const pal = P.goat;
      legs(ctx, darker(pal), [-20, 12], 6, 7, 26);
      ell(ctx, -31, -16, 5, 3, -0.6); paint(ctx, pal, -19, -13, 1.5);
      rr(ctx, -29, -19, 50, 26, 13); paint(ctx, pal, -19, 7);
      legs(ctx, pal, [-14, 18], 4, 8, 28, '#4a3b2c');
      stroke(ctx, '#6e5235', 4.5, () => { ctx.moveTo(24, -24); ctx.quadraticCurveTo(16, -36, 8, -34); });
      stroke(ctx, '#a07a52', 2, () => { ctx.moveTo(23, -25); ctx.quadraticCurveTo(17, -33, 11, -33); });
      ell(ctx, 18, -16, 8, 3.5, 0.5); paint(ctx, pal, -20, -12, 1.5);
      ell(ctx, 28, -15, 12, 10, 0.25); paint(ctx, pal, -25, -5);
      poly(ctx, [[33, -7], [31, 3], [36, -5]]); fill(ctx, '#d6c7aa');
      ell(ctx, 31, -18, 3, 3); fill(ctx, '#e5c24f'); rr(ctx, 29.2, -18.8, 3.6, 1.6, 0.8); fill(ctx, '#1b130e');
      ell(ctx, 38, -12, 1.2, 1.5); fill(ctx, '#7a6247');
      sheen(ctx, -8, -12, 14, 4);
    },
  },
  {
    id: 'cow', en: 'Cow', ne: 'गाई', box: [-52, -40, 52, 38],
    parts: [['rect', -6, -4, 76, 40, 15], ['circle', 36, -14, 15], ['rect', -6, 22, 62, 14, 4]],
    draw(ctx) {
      const pal = P.cow;
      legs(ctx, darker(pal), [-34, 10], 12, 11, 24);
      stroke(ctx, pal.line, 2.5, () => { ctx.moveTo(-43, -10); ctx.quadraticCurveTo(-52, 0, -48, 14); });
      ell(ctx, -48, 15, 3, 4); fill(ctx, '#6b4a30');
      ell(ctx, 16, -24, 12, 8); paint(ctx, pal, -32, -16);
      rr(ctx, -44, -24, 76, 40, 16); paint(ctx, pal, -24, 16);
      ctx.save(); rr(ctx, -44, -24, 76, 40, 16); ctx.clip();
      ell(ctx, -22, -14, 13, 9, 0.4); fill(ctx, '#8b5a37'); ell(ctx, 8, 6, 11, 8, -0.3); fill(ctx, '#8b5a37'); ell(ctx, -40, 8, 8, 10); fill(ctx, '#8b5a37');
      ctx.restore();
      legs(ctx, pal, [-26, 16], 10, 12, 26, '#5a4636');
      stroke(ctx, '#d9c69e', 3.5, () => { ctx.moveTo(30, -26); ctx.quadraticCurveTo(26, -34, 30, -38); ctx.moveTo(44, -26); ctx.quadraticCurveTo(48, -34, 44, -38); });
      ell(ctx, 24, -20, 7, 3.5, -0.4); paint(ctx, pal, -24, -16, 1.5);
      rr(ctx, 25, -30, 23, 30, 11); paint(ctx, pal, -30, 0);
      ell(ctx, 36.5, -3, 10, 6.5); fill(ctx, '#efb5a4');
      ell(ctx, 33, -3, 1.4, 1.8); fill(ctx, '#7a3d30'); ell(ctx, 40, -3, 1.4, 1.8); fill(ctx, '#7a3d30');
      eye(ctx, 31, -17, 2.6); eye(ctx, 42, -17, 2.6);
      ell(ctx, 36.5, -25, 2.2, 2.6); fill(ctx, '#d41f16');
      sheen(ctx, -16, -16, 20, 5);
    },
  },
  {
    id: 'turtle', en: 'Turtle', ne: 'कछुवा', box: [-50, -32, 60, 22],
    parts: [['poly', Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i * Math.PI) / 8; return [Math.cos(a) * 40, Math.sin(a) * 27]; })], ['rect', 0, 6, 84, 12, 5], ['circle', 46, -2, 9]],
    draw(ctx) {
      const sh = P.shell; const sk = P.skin;
      poly(ctx, [[-42, 4], [-50, 8], [-42, 10]]); paint(ctx, sk, 4, 10, 1.2);
      rr(ctx, -32, 4, 14, 14, 7); paint(ctx, sk, 4, 18, 1.5); rr(ctx, 18, 4, 14, 14, 7); paint(ctx, sk, 4, 18, 1.5);
      ctx.beginPath(); ctx.arc(46, -2, 9, 0, Math.PI * 2); paint(ctx, sk, -11, 7, 1.5);
      eye(ctx, 49, -5, 2.4);
      stroke(ctx, sk.line, 1.3, () => { ctx.moveTo(49, 2); ctx.quadraticCurveTo(52, 3.5, 54, 1); });
      rr(ctx, -42, 0, 84, 12, 6); paint(ctx, { light: '#f1dc95', base: '#d9bd68', dark: '#a98d3c', line: '#7a6528' }, 0, 12, 1.5);
      ctx.beginPath(); ctx.ellipse(0, 1, 40, 28, 0, Math.PI, Math.PI * 2); ctx.closePath(); paint(ctx, sh, -27, 1);
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 1, 40, 28, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.strokeStyle = '#1a4f2a99'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      poly(ctx, [[-10, -22], [10, -22], [16, -11], [10, 0], [-10, 0], [-16, -11]]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(-20, -30); ctx.moveTo(10, -22); ctx.lineTo(20, -30); ctx.moveTo(-16, -11); ctx.lineTo(-40, -11); ctx.moveTo(16, -11); ctx.lineTo(40, -11); ctx.moveTo(-10, 0); ctx.lineTo(-26, -11); ctx.moveTo(10, 0); ctx.lineTo(26, -11); ctx.stroke();
      ctx.restore();
      sheen(ctx, -12, -19, 14, 5, 0.32);
    },
  },
];

export const byId = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

// Draw an animal at a given size into a data URL (used where the art appears as a picture, e.g. Quick Draw).
const cache = new Map();
export function animalURL(id, px = 160) {
  const key = id + px;
  if (cache.has(key)) return cache.get(key);
  const a = byId[id];
  const [x0, y0, x1, y1] = a.box;
  const d = Math.min(devicePixelRatio || 1, 2);
  const c = document.createElement('canvas'); c.width = c.height = px * d;
  const ctx = c.getContext('2d');
  const s = (px * d * 0.9) / Math.max(x1 - x0, y1 - y0);
  ctx.translate(c.width / 2, c.height / 2); ctx.scale(s, s); ctx.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  a.draw(ctx);
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
