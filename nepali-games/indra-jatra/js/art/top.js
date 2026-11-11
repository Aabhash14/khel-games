// Top-down painting for the chariot chapter. World units are metres.
// "up" is the camera's forward direction in world space: tall things are lifted toward it,
// which reads as looking down from behind and above.
const TAU = Math.PI * 2;
const ROOF = ['#4a2f26', '#55342a', '#3f2a22', '#5b3a2c', '#47302a'];
const WALL = ['#8a3a22', '#7d3320', '#94452a', '#86402a'];

export function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }

function quad(g, c, ax, ay, bx, by, col) {
  // rectangle centred on c, half-extents a (along) and b (across)
  g.beginPath();
  g.moveTo(c.x + ax + bx, c.y + ay + by); g.lineTo(c.x + ax - bx, c.y + ay - by);
  g.lineTo(c.x - ax - bx, c.y - ay - by); g.lineTo(c.x - ax + bx, c.y - ay + by); g.closePath();
  g.fillStyle = col; g.fill();
}

// A Newar house seen from above: brick walls lifted into a tiled, hipped roof with a ridge.
export function building(g, b, up, lit) {
  const ca = Math.cos(b.th), sa = Math.sin(b.th);
  const ax = ca * b.len / 2, ay = sa * b.len / 2, bx = -sa * b.dep / 2, by = ca * b.dep / 2;
  const lift = b.h * 0.42, ox = up.x * lift, oy = up.y * lift;
  quad(g, { x: b.x + up.x * 0.6, y: b.y + up.y * 0.6 }, ax, ay, bx, by, 'rgba(0,0,0,.35)'); // shadow
  const wall = WALL[b.seed % WALL.length];
  // walls: the base footprint and the lifted roof joined into one shape
  for (let k = 1; k <= 3; k++) quad(g, { x: b.x + ox * k / 4, y: b.y + oy * k / 4 }, ax, ay, bx, by, wall);
  if (lit) { // warm windows on the walls
    g.fillStyle = 'rgba(255,170,70,.85)';
    for (let k = -1; k <= 1; k++) { const wx = b.x + ox * 0.5 + ax * k * 0.6 + bx, wy = b.y + oy * 0.5 + ay * k * 0.6 + by; g.fillRect(wx - 0.35, wy - 0.35, 0.7, 0.7); }
  }
  const top = { x: b.x + ox, y: b.y + oy };
  quad(g, top, ax * 1.08, ay * 1.08, bx * 1.12, by * 1.12, ROOF[b.seed % ROOF.length]);
  // hipped roof: ridge along the long side, hips to the corners
  g.strokeStyle = 'rgba(255,220,180,.18)'; g.lineWidth = 0.18; g.beginPath();
  const r1x = top.x + ax * 0.45, r1y = top.y + ay * 0.45, r2x = top.x - ax * 0.45, r2y = top.y - ay * 0.45;
  g.moveTo(r1x, r1y); g.lineTo(r2x, r2y);
  for (const [px, py, sx, sy] of [[r1x, r1y, 1, 1], [r1x, r1y, 1, -1], [r2x, r2y, -1, 1], [r2x, r2y, -1, -1]]) { g.moveTo(px, py); g.lineTo(top.x + ax * 1.08 * sx + bx * 1.12 * sy, top.y + ay * 1.08 * sx + by * 1.12 * sy); }
  g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.08; g.beginPath(); // tile courses
  for (let k = -3; k <= 3; k++) { const f = k / 3.5; g.moveTo(top.x + bx * f * 1.12 - ax, top.y + by * f * 1.12 - ay); g.lineTo(top.x + bx * f * 1.12 + ax, top.y + by * f * 1.12 + ay); }
  g.stroke();
}

// A tiered pagoda from above: stepped brick plinth, nested roofs lifted higher each tier, gilded top.
export function temple(g, tp, up) {
  const { x, y, size, tiers, gold } = tp;
  g.beginPath(); g.arc(x + up.x * 0.8, y + up.y * 0.8, size * 0.85, 0, TAU); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
  const sq = (cx, cy, h, col, line) => {
    g.beginPath(); g.rect(cx - h, cy - h, h * 2, h * 2); g.fillStyle = col; g.fill();
    if (line) { g.strokeStyle = line; g.lineWidth = 0.2; g.stroke(); }
  };
  for (let k = 0; k < 3; k++) sq(x + up.x * k * 0.35, y + up.y * k * 0.35, size * (0.95 - k * 0.08), k % 2 ? '#8a3f26' : '#9c4c2f');
  for (let k = 0; k < tiers; k++) {
    const z = 2 + k * 2.2, h = size * (0.78 - k * 0.2);
    const cx = x + up.x * z * 0.42, cy = y + up.y * z * 0.42;
    sq(cx, cy, h * 0.55, '#5a2a18');
    const col = gold === 'all' || (gold && k === tiers - 1) ? '#c99a2e' : '#3e2b22';
    sq(cx + up.x * 0.5, cy + up.y * 0.5, h, col, gold ? '#ffe08a' : '#7a5a44');
    g.strokeStyle = 'rgba(255,230,180,.25)'; g.lineWidth = 0.15; g.beginPath();
    g.moveTo(cx - h, cy - h); g.lineTo(cx + h, cy + h); g.moveTo(cx + h, cy - h); g.lineTo(cx - h, cy + h); g.stroke();
  }
  const z = 2 + tiers * 2.2;
  g.beginPath(); g.arc(x + up.x * z * 0.42, y + up.y * z * 0.42, size * 0.12, 0, TAU); g.fillStyle = '#ffd86a'; g.fill();
}

export function person(g, x, y, r, seed, t, bob) {
  const shirt = ['#e9e0cc', '#18110f', '#2c4a7a', '#7a2a24', '#3c6b4f', '#c58a2e', '#d9cdb2', '#5b3a6b'][seed % 8];
  const dy = bob ? Math.sin(t * 9 + seed) * 0.08 : 0;
  g.beginPath(); g.ellipse(x, y + dy, r * 1.25, r * 0.85, 0, 0, TAU); g.fillStyle = shirt; g.fill();
  g.beginPath(); g.arc(x, y + dy, r * 0.62, 0, TAU); g.fillStyle = seed % 3 ? '#1a120e' : '#7a1f2a'; g.fill();
}

// A chariot from above. kind: 'kumari' (three gilded roofs) or 'bhairav' (two).
export function chariot(g, x, y, th, up, t, roll, kind) {
  const big = kind === 'kumari', k = big ? 1 : 0.8;
  g.save(); g.translate(x, y); g.rotate(th); g.scale(k, k);
  const ux = (up.x * Math.cos(th) + up.y * Math.sin(th)) / k, uy = (-up.x * Math.sin(th) + up.y * Math.cos(th)) / k;
  g.beginPath(); g.ellipse(ux * 1.2, uy * 1.2, 4.6, 3.6, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
  // wheels with turning spokes
  for (const [wx, wy] of [[2.5, 2.55], [-2.5, 2.55], [2.5, -2.55], [-2.5, -2.55]]) {
    g.fillStyle = '#2a1408'; g.fillRect(wx - 1.15, wy - 0.38, 2.3, 0.76);
    g.fillStyle = '#b3201a';
    for (let s = 0; s < 3; s++) { const p = ((roll * 0.6 + s / 3) % 1) * 2.3 - 1.15; g.fillRect(wx + p - 0.08, wy - 0.38, 0.16, 0.76); }
  }
  // the long front beam
  g.fillStyle = '#3d1f0e'; g.fillRect(3.2, -0.22, 7, 0.44);
  g.beginPath(); g.arc(10.2, 0, 0.42, 0, TAU); g.fillStyle = '#e3b23c'; g.fill();
  g.fillStyle = '#4a2612'; g.fillRect(-3.4, -2.25, 6.8, 4.5);
  g.strokeStyle = '#e3b23c'; g.lineWidth = 0.22; g.strokeRect(-3.4, -2.25, 6.8, 4.5);
  const tiers = big ? 3 : 2;
  for (let i = 0; i < tiers; i++) {
    const z = 1.6 + i * 1.5, h = 2.8 - i * 0.75, cx = ux * z * 0.45, cy = uy * z * 0.45;
    g.fillStyle = '#5a2f15'; g.fillRect(cx - h * 0.55, cy - h * 0.55, h * 1.1, h * 1.1);
    const gr = g.createLinearGradient(cx - h, cy - h, cx + h, cy + h);
    gr.addColorStop(0, '#f2cf6a'); gr.addColorStop(0.5, '#c99a2e'); gr.addColorStop(1, '#8a6418');
    g.fillStyle = gr; g.fillRect(cx - h + ux * 0.4, cy - h + uy * 0.4, h * 2, h * 2);
    g.strokeStyle = '#5a3a0e'; g.lineWidth = 0.2; g.strokeRect(cx - h + ux * 0.4, cy - h + uy * 0.4, h * 2, h * 2);
    g.strokeStyle = 'rgba(255,240,180,.7)'; g.lineWidth = 0.1; g.strokeRect(cx - h + ux * 0.4 + 0.2, cy - h + uy * 0.4 + 0.2, h * 2 - 0.4, h * 2 - 0.4);
    g.strokeStyle = 'rgba(90,50,10,.6)'; g.lineWidth = 0.12; g.beginPath();
    g.moveTo(cx - h + ux * 0.4, cy - h + uy * 0.4); g.lineTo(cx + h + ux * 0.4, cy + h + uy * 0.4);
    g.moveTo(cx + h + ux * 0.4, cy - h + uy * 0.4); g.lineTo(cx - h + ux * 0.4, cy + h + uy * 0.4); g.stroke();
    g.fillStyle = '#ffe08a';
    for (let b = 0; b < 6; b++) { const f = b / 5 * 2 - 1; g.fillRect(cx + f * h + ux * 0.4 - 0.06, cy + h + uy * 0.4, 0.12, 0.25); }
  }
  const z = 1.6 + tiers * 1.5;
  g.beginPath(); g.arc(ux * z * 0.45, uy * z * 0.45, 0.5, 0, TAU); g.fillStyle = '#ffe9a0'; g.fill();
  // pataka streamers trailing behind
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(ux * z * 0.45, uy * z * 0.45 + side * 0.3);
    for (let s = 1; s <= 6; s++) g.lineTo(ux * z * 0.45 - s * 0.7, uy * z * 0.45 + side * (0.3 + s * 0.12) + Math.sin(t * 4 + s) * 0.15);
    g.strokeStyle = side < 0 ? '#f4d24a' : '#b3201a'; g.lineWidth = 0.32; g.stroke();
  }
  g.restore();
}

// Two ropes from the beam with the pullers walking along them.
export function ropes(g, x, y, th, t, moving, scale = 1) {
  const c = Math.cos(th), s = Math.sin(th), P = (a, b) => ({ x: x + c * a - s * b, y: y + s * a + c * b });
  for (const side of [-1, 1]) {
    const a = P(10 * scale, side * 0.3), b = P(29 * scale, side * 1.3);
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.strokeStyle = '#d2ad72'; g.lineWidth = 0.14; g.stroke();
    for (let k = 0; k < 13; k++) {
      const f = k / 12, along = (11 + f * 17.5) * scale, off = side * (0.3 + f * 1.0);
      for (const o of [-0.55, 0.55]) { const p = P(along + (moving ? Math.sin(t * 7 + k) * 0.15 : 0), off + o); person(g, p.x, p.y, 0.34, (k * 7 + (o > 0 ? 3 : 0) + (side > 0 ? 11 : 0)) & 1023, t, moving); }
    }
  }
}
