// Synthesised sound, no audio files. A river bed that gets louder as the water rises,
// a rope creak that follows the basket, and small hits for every action.
let ctx = null;
let master = null;
let noiseBuf = null;
let river = null;
let muted = false;
try { muted = localStorage.getItem('tuin.muted') === '1'; } catch { /* private mode */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const unlock = () => ac();
export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('tuin.muted', m ? '1' : '0'); } catch { /* fine */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.02);
}

function env(g, at, a, peak, d) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
}

function tone({ type = 'sine', f = 440, f2 = null, t = 0, a = 0.005, d = 0.2, v = 0.3 }) {
  const c = ac(); if (!c) return;
  const at = c.currentTime + t;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  env(g, at, a, v, d);
  o.connect(g).connect(master);
  o.start(at); o.stop(at + a + d + 0.05);
}

function noise({ t = 0, a = 0.003, d = 0.12, v = 0.3, type = 'bandpass', f = 2500, q = 1, f2 = null }) {
  const c = ac(); if (!c) return;
  const at = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, at); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  const g = c.createGain(); env(g, at, a, v, d);
  s.connect(fl).connect(g).connect(master);
  s.start(at, Math.random()); s.stop(at + a + d + 0.05);
}

export const sfx = {
  hop(up = true) { tone({ type: 'triangle', f: up ? 420 : 520, f2: up ? 760 : 300, d: 0.09, v: 0.22 }); },
  nope() { tone({ type: 'square', f: 150, d: 0.09, v: 0.1 }); tone({ type: 'square', f: 120, t: 0.1, d: 0.12, v: 0.1 }); },
  /** p = 0..1 along the cable */
  creak(p) {
    tone({ type: 'sawtooth', f: 180 + p * 120, f2: 140 + p * 90, d: 0.06, v: 0.035 });
    noise({ f: 900 + p * 500, q: 6, d: 0.05, v: 0.05 });
  },
  dock() { noise({ type: 'lowpass', f: 500, d: 0.18, v: 0.35 }); tone({ type: 'sine', f: 110, f2: 70, d: 0.18, v: 0.3 }); },
  splash() { noise({ type: 'bandpass', f: 1800, f2: 400, q: 0.8, d: 0.5, v: 0.25 }); },
  chomp() {
    noise({ type: 'lowpass', f: 1200, d: 0.08, v: 0.5 });
    noise({ type: 'lowpass', f: 900, t: 0.14, d: 0.1, v: 0.5 });
    tone({ type: 'sawtooth', f: 220, f2: 60, t: 0.02, d: 0.35, v: 0.2 });
  },
  hint() { [880, 1320].forEach((f, i) => tone({ f, t: i * 0.09, d: 0.25, v: 0.14 })); },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ type: 'triangle', f, t: i * 0.09, d: 0.4, v: 0.2 }));
    noise({ type: 'highpass', f: 5000, t: 0.45, d: 0.6, v: 0.08 });
  },
  flood() { noise({ type: 'lowpass', f: 300, f2: 1200, a: 0.3, d: 1.2, v: 0.5 }); tone({ f: 80, f2: 40, d: 1, v: 0.3 }); },
};

/* ---- recorded sounds (sfx/*.mp3, see sfx/CREDITS.md) ---- */

const buffers = new Map();
function load(name) {
  if (!buffers.has(name)) {
    const c = ac();
    buffers.set(name, !c ? Promise.resolve(null) : fetch(`sfx/${name}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b ? new Promise((res) => c.decodeAudioData(b, res, () => res(null))) : null))
      .catch(() => null));
  }
  return buffers.get(name);
}

/** Warm the cache so the first tap on a character is instant. */
export function preload(names) { names.forEach((n) => load(n)); }

let lastVoice = null;
/** Play a recording; if it is missing, run `fallback` (a synthesised stand-in) instead. */
export async function sample(name, fallback = null, { rate = 1, gain = 0.9, cut = false } = {}) {
  const c = ac(); if (!c) return;
  const buf = await load(name);
  if (!buf) { if (fallback) fallback(); return; }
  if (cut && lastVoice) { try { lastVoice.stop(); } catch { /* done */ } }
  const s = c.createBufferSource(); s.buffer = buf;
  s.playbackRate.value = rate;
  const g = c.createGain(); g.gain.value = gain;
  s.connect(g).connect(master); s.start();
  if (cut) lastVoice = s;
}

// Short, sharp recordings measure quieter after normalising; lift them so every character sounds equally present.
const LIFT = { chomp: 1.7, ghans: 1.3, splash: 1.3, maachha: 1.12, momo: 1.1, bakhra: 1.15 };

/** A character's own sound, slightly varied each time so repeats don't sound copy-pasted. */
export function voice(id) {
  return sample(id, null, { rate: 0.94 + Math.random() * 0.12, gain: 0.75 * (LIFT[id] || 1), cut: true });
}
export const effect = (name, fallback) => sample(name, fallback, { gain: 0.9 * (LIFT[name] || 1) });

/** Looping river bed. level = 0..1, louder and brighter as the water rises. */
export function riverOn(level = 0) {
  const c = ac(); if (!c) return;
  if (!river) {
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 0.4;
    const g = c.createGain(); g.gain.value = 0.0001;
    s.connect(fl).connect(g).connect(master); s.start();
    river = { s, fl, g };
  }
  river.fl.frequency.setTargetAtTime(380 + level * 900, c.currentTime, 0.4);
  river.g.gain.setTargetAtTime(0.05 + level * 0.14, c.currentTime, 0.4);
}

export function riverOff() {
  if (!river || !ctx) return;
  const r = river; river = null;
  r.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
  setTimeout(() => { try { r.s.stop(); } catch { /* already stopped */ } }, 900);
}
