// Kumari's chariot on the Kwaneya route, as a heavy vehicle in narrow lanes.
// Hold PULL to build speed (it builds slowly), BRAKE to drag it down, and work the wheel
// levers left and right. Fast through a bend and the chariot drifts to the outside and scrapes.
// Keep behind Bhairav's chariot: too close and your rope crews run into it, too far and the
// crowd floods the gap. Slow down where crowds spill onto the road. Stop for offerings.
import { clamp } from './rand.js';

// Waypoints in metres (x east, y south) with lane width and the place name, if any.
// The geometry is simplified; the order of places follows the Kwaneya route.
export const WAYPOINTS = [
  [0, 0, 16, 'hanuman'], [-30, 16, 13], [-68, 30, 12, 'maru'], [-96, 58, 9.5], [-106, 108, 8.5, 'chikan'],
  [-101, 160, 9], [-93, 214, 11, 'jaisi'], [-110, 266, 8.5], [-146, 300, 9], [-182, 320, 13, 'lagan'],
  [-218, 302, 8.5], [-240, 262, 9, 'hyumat'], [-262, 206, 8.5], [-268, 150, 11, 'bhim'], [-242, 104, 9],
  [-200, 78, 9.5], [-146, 64, 10.5], [-96, 74, 9.5, 'maru2'], [-48, 52, 11], [-14, 22, 13], [8, 6, 16, 'home'],
];

export const RATH = {
  vmax: 8.5, accel: 1.45, friction: 0.65, brake: 3.4,
  halfW: 2.3, drift: 0.95, lever: 2.6, damp: 2.2,
  gapMin: 24, gapMax: 74, gapOk: 54, startGap: 38,
  clockStart: 15 * 60 + 30, target: 210, // seconds of play = festival minutes; home by 7:00 pm
  surgeSpeed: 3.2,
  stars: [2, 7],
};

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

// Dense samples every ~1 m: position, heading, curvature, lane width, place markers.
export function buildRoute() {
  const P = WAYPOINTS, raw = [];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    const len = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const n = Math.max(2, Math.round(len));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      raw.push({ x: catmull(a[0], b[0], c[0], d[0], t), y: catmull(a[1], b[1], c[1], d[1], t), w: b[2] + (c[2] - b[2]) * t, name: k === 0 ? b[3] || null : null });
    }
  }
  const last = P[P.length - 1];
  raw.push({ x: last[0], y: last[1], w: last[2], name: last[3] });
  let s = 0;
  for (let i = 0; i < raw.length; i++) {
    if (i > 0) s += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
    raw[i].s = s;
    const j = Math.min(raw.length - 1, i + 1), h = Math.max(0, i - 1);
    raw[i].th = Math.atan2(raw[j].y - raw[h].y, raw[j].x - raw[h].x);
  }
  for (let i = 0; i < raw.length; i++) {
    const j = Math.min(raw.length - 1, i + 2), h = Math.max(0, i - 2);
    let d = raw[j].th - raw[h].th;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    raw[i].k = d / Math.max(0.5, raw[j].s - raw[h].s);
  }
  // smooth curvature
  const k2 = raw.map((r, i) => { let a = 0, n = 0; for (let q = -4; q <= 4; q++) { const o = raw[i + q]; if (o) { a += o.k; n++; } } return a / n; });
  raw.forEach((r, i) => { r.k = k2[i]; });
  return { pts: raw, length: s };
}

export function at(route, s) {
  const p = route.pts;
  const i = clamp(Math.floor(s), 0, p.length - 2);
  // samples are ~1 m apart; walk to the right one
  let j = i;
  while (j < p.length - 2 && p[j + 1].s < s) j++;
  while (j > 0 && p[j].s > s) j--;
  const a = p[j], b = p[j + 1], f = clamp((s - a.s) / Math.max(1e-6, b.s - a.s), 0, 1);
  let dth = b.th - a.th;
  while (dth > Math.PI) dth -= 2 * Math.PI;
  while (dth < -Math.PI) dth += 2 * Math.PI;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, th: a.th + dth * f, k: a.k + (b.k - a.k) * f, w: a.w + (b.w - a.w) * f, i: j };
}

export function placeMarks(route) {
  return route.pts.filter((p) => p.name).map((p) => ({ name: p.name, s: p.s }));
}

export function createRath(rand, route) {
  const L = route.length, m = placeMarks(route);
  const sOf = (n) => (m.find((q) => q.name === n) || { s: 0 }).s;
  const zones = [
    { kind: 'surge', s0: sOf('jaisi') - 18, s1: sOf('jaisi') + 10, place: 'jaisi' },
    { kind: 'surge', s0: sOf('lagan') - 14, s1: sOf('lagan') + 14, place: 'lagan' },
    { kind: 'surge', s0: sOf('bhim') - 16, s1: sOf('bhim') + 8, place: 'bhim' },
    { kind: 'offer', s0: sOf('chikan') + 26, s1: sOf('chikan') + 38, place: 'chikan' },
    { kind: 'offer', s0: sOf('hyumat') + 8, s1: sOf('hyumat') + 20, place: 'hyumat' },
  ];
  const stops = [0.28, 0.55, 0.8].map((f) => ({ s: L * f + (rand() - 0.5) * 40, dur: 2.4 + rand() * 1.6, done: false }));
  return {
    rand, route, L, marks: m, zones, stops,
    s: 0, v: 0, y: 0, yv: 0, t: 0,
    b: { s: RATH.startGap, v: 0, wait: 0 },
    scrapes: 0, bumps: 0, surges: 0, blessed: 0,
    scrapeCD: 0, bumpCD: 0, flooded: false, zoneState: zones.map(() => ({ in: false, hit: false, still: 0, warned: false, blessed: false })),
    nextMark: 1, done: false,
  };
}

// inp: { pull, brake, left, right }
export function stepRath(s, dt, inp) {
  const ev = [];
  if (s.done) return ev;
  s.t += dt;
  s.scrapeCD = Math.max(0, s.scrapeCD - dt);
  s.bumpCD = Math.max(0, s.bumpCD - dt);
  const here = at(s.route, s.s);
  const gap = s.b.s - s.s;
  let vcap = RATH.vmax;
  if (gap > RATH.gapMax && !s.flooded) { s.flooded = true; ev.push({ type: 'flood' }); }
  if (s.flooded && gap < RATH.gapOk) { s.flooded = false; ev.push({ type: 'unflood' }); }
  if (s.flooded) vcap = 3.2;

  // speed
  if (inp.brake) s.v -= RATH.brake * dt;
  else if (inp.pull) s.v += RATH.accel * dt * (1 - s.v / (RATH.vmax + 2));
  else s.v -= RATH.friction * dt;
  s.v = Math.max(0, s.v);
  if (s.v > vcap) s.v = Math.max(vcap, s.v - 2.5 * dt);

  // sideways: drift to the outside of bends, the levers push back
  const lever = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  s.yv += (-s.v * s.v * here.k * RATH.drift + lever * RATH.lever * (1 - s.v / 16) - s.yv * RATH.damp) * dt;
  s.y += s.yv * dt;
  const ymax = here.w / 2 - RATH.halfW;
  if (Math.abs(s.y) > ymax) {
    s.y = Math.sign(s.y) * ymax; s.yv = -s.yv * 0.2;
    if (s.scrapeCD <= 0 && s.v > 0.8) { s.scrapes++; s.scrapeCD = 0.9; s.v *= 0.7; ev.push({ type: 'scrape', side: Math.sign(s.y) }); }
  }
  s.s += s.v * dt;

  // Bhairav's chariot ahead: slows for bends, stops for offerings
  const B = s.b;
  if (B.wait > 0 || s.flooded) { B.wait -= dt; B.v = Math.max(0, B.v - 3 * dt); } // it stops for offerings, and waits when you fall behind
  else {
    const ahead = at(s.route, Math.min(s.L, B.s + 14));
    const target = clamp(6.6 - 62 * Math.abs(ahead.k), 2.6, 6.6);
    B.v += clamp(target - B.v, -2 * dt, 1.1 * dt);
    for (const st of s.stops) if (!st.done && B.s >= st.s) { st.done = true; B.wait = st.dur; ev.push({ type: 'bStop' }); }
  }
  if (B.s < s.L + 60) B.s += B.v * dt;
  if (gap < RATH.gapMin && s.bumpCD <= 0 && s.v > 0.6) {
    s.bumps++; s.bumpCD = 2.5; s.v = Math.min(s.v, 0.4); ev.push({ type: 'bump' });
  }

  // zones
  s.zones.forEach((z, i) => {
    const st = s.zoneState[i];
    if (!st.warned && s.s > z.s0 - 45 && s.s < z.s0) { st.warned = true; ev.push({ type: z.kind + 'Warn', place: z.place }); }
    const inside = s.s >= z.s0 && s.s <= z.s1;
    if (inside && !st.in) st.in = true;
    if (inside && z.kind === 'surge' && !st.hit && s.v > RATH.surgeSpeed) { st.hit = true; s.surges++; ev.push({ type: 'surgeHit', place: z.place }); }
    if (inside && z.kind === 'offer' && !st.blessed) {
      st.still = s.v < 0.5 ? st.still + dt : 0;
      if (st.still >= 1.2) { st.blessed = true; s.blessed++; ev.push({ type: 'blessed', place: z.place }); }
    }
    if (!inside && st.in) { st.in = false; if (z.kind === 'surge' && !st.hit) ev.push({ type: 'surgeSafe', place: z.place }); }
  });

  // places passed
  while (s.nextMark < s.marks.length && s.s >= s.marks[s.nextMark].s) { ev.push({ type: 'place', name: s.marks[s.nextMark].name }); s.nextMark++; }
  if (s.s >= s.L - 3) { s.done = true; s.v = 0; ev.push({ type: 'home' }); }
  s.gap = gap;
  return ev;
}

export function rathPenalty(s) {
  const late = Math.max(0, s.t - RATH.target);
  return Math.max(0, s.scrapes + s.bumps + 2 * s.surges + Math.ceil(late / 10) - s.blessed);
}
export function rathLamps(s) {
  const p = rathPenalty(s);
  return p <= RATH.stars[0] ? 3 : p <= RATH.stars[1] ? 2 : 1;
}
export const festivalClock = (s) => RATH.clockStart + s.t;
