// Raising the Yosin: an inverted pendulum on two ropes.
// Hold both ropes to lift. A single rope lifts a little and tips the pole toward that side.
// The higher it stands, the less stable it is. Gusts are announced before they arrive.
import { clamp } from './rand.js';

export const YOSIN = {
  sait: 34,        // seconds until the astrologer's auspicious moment
  giveUp: 80,      // the elders take over
  failLean: 22,    // degrees: the pull is stopped
  seatLean: 6,     // degrees: straight enough to drop into the socket
  seatHold: 0.6,   // seconds held straight at the top
  warnAhead: 1.7,  // seconds of warning before a gust
};

export function createYosin(rand) {
  return {
    rand, t: 0, rise: 0, lean: 0, vel: 0, drift: 0, driftT: 0,
    wind: 0, gust: null, nextGust: 4 + rand() * 2, fumbles: 0, fumbleT: 0,
    seat: 0, done: false, gaveUp: false, pulling: 0,
  };
}

function scheduleGust(s) {
  const r = s.rand;
  const power = 7 + r() * 9 + Math.min(6, s.t * 0.12);
  s.gust = { at: s.t + YOSIN.warnAhead, dur: 1.1 + r() * 0.9, dir: r() < 0.5 ? -1 : 1, power, announced: false };
  s.nextGust = s.gust.at + s.gust.dur + 1.6 + r() * 2.8;
}

// inp: { left, right } booleans. Returns a list of events for sound and pictures.
export function stepYosin(s, dt, inp) {
  const ev = [];
  if (s.done) return ev;
  s.t += dt;
  if (s.t >= s.nextGust && !s.gust) scheduleGust(s);
  s.wind = 0;
  if (s.gust) {
    const g = s.gust, k = (s.t - g.at) / g.dur;
    if (!g.announced) { g.announced = true; ev.push({ type: 'gustWarn', dir: g.dir, power: g.power }); }
    if (k >= 0 && k <= 1) s.wind = g.dir * g.power * Math.sin(Math.PI * k);
    if (k > 1) s.gust = null;
  }
  if (s.fumbleT > 0) { // the elders steady and lower it a little
    s.fumbleT -= dt;
    s.lean *= Math.pow(0.15, dt); s.vel *= Math.pow(0.05, dt);
    s.rise = Math.max(0, s.rise - 16 * dt);
    if (s.fumbleT <= 0) ev.push({ type: 'resume' });
    return ev;
  }
  const L = !!inp.left, R = !!inp.right, h = s.rise / 90;
  const lift = L && R ? 13 : (L || R) ? 3.5 : (s.rise > 2 ? -4 : 0);
  s.rise = clamp(s.rise + lift * dt, 0, 90);
  s.pulling = L && R ? 2 : (L || R) ? 1 : 0;
  s.driftT -= dt;
  if (s.driftT <= 0) { s.drift = (s.rand() * 2 - 1) * 4.5; s.driftT = 0.9 + s.rand() * 1.4; }
  const torque = (L && !R ? -10 : R && !L ? 10 : 0) + (L && R ? s.drift : 0);
  const acc = 1.6 * s.lean * (0.25 + h) + s.wind * (0.4 + h) + torque - 2.2 * s.vel;
  s.vel += acc * dt;
  s.lean += s.vel * dt;
  if (Math.abs(s.lean) > YOSIN.failLean) {
    s.fumbles++; s.fumbleT = 2.2;
    ev.push({ type: 'fumble', side: Math.sign(s.lean) });
    return ev;
  }
  if (s.rise >= 90) {
    if (Math.abs(s.lean) < YOSIN.seatLean && Math.abs(s.vel) < 6) s.seat += dt;
    else s.seat = Math.max(0, s.seat - dt * 2);
    if (s.seat >= YOSIN.seatHold) { s.done = true; ev.push({ type: 'seated' }); }
  } else s.seat = 0;
  if (!s.done && s.t >= YOSIN.giveUp) { s.done = true; s.gaveUp = true; s.rise = 90; s.lean = 0; ev.push({ type: 'elders' }); }
  return ev;
}

export function yosinLamps(s) {
  if (s.gaveUp) return 1;
  if (s.t <= YOSIN.sait && s.fumbles === 0) return 3;
  if (s.t <= YOSIN.sait + 12 && s.fumbles <= 1) return 2;
  return 1;
}
