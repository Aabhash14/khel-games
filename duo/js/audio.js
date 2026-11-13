// Synthesised sound: no audio files. A small kit built from oscillators and noise:
// woodblock clicks, FM bells, a madal (Nepali hand drum), a bansuri-like flute, plucks,
// and a voice for every animal. Everything runs through a light reverb for warmth.
let ctx = null;
let out = null;
let master = null;
let noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem('duo.muted') === '1'; } catch { /* private mode */ }

function impulse(c, sec, decay) {
  const len = Math.floor(c.sampleRate * sec);
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    out = ctx.createGain();
    out.connect(master);
    const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, 1.6, 2.6);
    const send = ctx.createGain(); send.gain.value = 0.2;
    out.connect(send).connect(verb).connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
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
  try { localStorage.setItem('duo.muted', m ? '1' : '0'); } catch { /* fine */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02);
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

// Generic voice: oscillator with optional pitch glide/peak, vibrato, tremolo and a sweeping filter.
function osc({ type = 'sine', f = 440, f2 = null, peak = null, peakAt = 0.3, t = 0, a = 0.005, d = 0.2, v = 0.3, vib = 0, vibRate = 5, trem = 0, filter = null }) {
  const c = ac(); if (!c || muted) return;
  const at = c.currentTime + t; const end = at + a + d;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f, at);
  if (peak) { o.frequency.linearRampToValueAtTime(peak, at + (a + d) * peakAt); o.frequency.exponentialRampToValueAtTime(f2 || f, end); } else if (f2) o.frequency.exponentialRampToValueAtTime(f2, end);
  const g = c.createGain(); env(g, at, a, v, d);
  let node = o;
  if (filter) {
    const fl = c.createBiquadFilter(); fl.type = filter.type || 'lowpass'; fl.Q.value = filter.q ?? 1;
    fl.frequency.setValueAtTime(filter.f, at);
    if (filter.f2) fl.frequency.exponentialRampToValueAtTime(filter.f2, end);
    node.connect(fl); node = fl;
  }
  if (vib) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = vibRate; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(at); l.stop(end + 0.05); }
  if (trem) {
    const tg = c.createGain(); tg.gain.value = 0.55;
    const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = trem; lg.gain.value = 0.45;
    l.connect(lg).connect(tg.gain); l.start(at); l.stop(end + 0.05);
    node.connect(tg); node = tg;
  }
  node.connect(g).connect(out);
  o.start(at); o.stop(end + 0.05);
}

function noise({ t = 0, a = 0.003, d = 0.12, v = 0.3, type = 'bandpass', f = 2500, q = 1, f2 = null }) {
  const c = ac(); if (!c || muted) return;
  const at = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, at); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  const g = c.createGain(); env(g, at, a, v, d);
  s.connect(fl).connect(g).connect(out);
  s.start(at, Math.random() * 0.5); s.stop(at + a + d + 0.05);
}

// FM bell / chime
function bell(f, t = 0, v = 0.12, d = 0.9, ratio = 3.5) {
  const c = ac(); if (!c || muted) return;
  const at = c.currentTime + t;
  const car = c.createOscillator(); car.frequency.value = f;
  const mod = c.createOscillator(); mod.frequency.value = f * ratio;
  const mg = c.createGain(); mg.gain.setValueAtTime(f * 2.2, at); mg.gain.exponentialRampToValueAtTime(1, at + d);
  mod.connect(mg).connect(car.frequency);
  const g = c.createGain(); env(g, at, 0.003, v, d);
  car.connect(g).connect(out);
  car.start(at); mod.start(at); car.stop(at + d + 0.1); mod.stop(at + d + 0.1);
}

// woodblock / pebble click
function wood(f, t = 0, v = 0.15) {
  osc({ type: 'sine', f, f2: f * 0.62, t, a: 0.002, d: 0.06, v });
  osc({ type: 'triangle', f: f * 2.7, f2: f * 2.1, t, a: 0.001, d: 0.025, v: v * 0.35 });
  noise({ t, d: 0.018, v: v * 0.4, f: Math.min(8000, f * 3), q: 3 });
}

// madal: 'dhum' (low open), 'ta' (high slap), 'tin' (ringing rim)
function madal(kind, t = 0, v = 0.4) {
  if (kind === 'dhum') { osc({ f: 105, f2: 58, t, a: 0.003, d: 0.38, v }); noise({ t, d: 0.04, v: v * 0.3, type: 'lowpass', f: 400 }); }
  if (kind === 'ta') { osc({ f: 340, f2: 250, t, a: 0.002, d: 0.11, v: v * 0.7 }); noise({ t, d: 0.05, v: v * 0.45, f: 2600, q: 1.2 }); }
  if (kind === 'tin') { osc({ f: 560, f2: 540, t, a: 0.002, d: 0.3, v: v * 0.45 }); osc({ f: 1130, t, a: 0.002, d: 0.15, v: v * 0.15 }); }
}

// bansuri-like flute note: breathy attack, gentle vibrato
function flute(f, t = 0, d = 0.3, v = 0.12) {
  osc({ type: 'sine', f, t, a: 0.05, d, v, vib: f * 0.008, vibRate: 5.5 });
  osc({ type: 'triangle', f: f * 2, t, a: 0.06, d: d * 0.8, v: v * 0.12 });
  noise({ t, a: 0.02, d: 0.12, v: v * 0.25, f: f * 2.2, q: 6 });
}

function pluck(f, t = 0, v = 0.12) {
  osc({ type: 'sawtooth', f, t, a: 0.002, d: 0.45, v, filter: { type: 'lowpass', f: f * 8, f2: f * 1.2, q: 2 } });
}

// D major pentatonic, the house scale
const N = { D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440, B4: 493.88, D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880, B5: 987.77, D6: 1174.66 };

const VOICES = {
  cow() {
    osc({ type: 'sawtooth', f: 150, f2: 112, a: 0.1, d: 0.85, v: 0.22, vib: 3, vibRate: 5, filter: { type: 'lowpass', f: 950, f2: 380, q: 5 } });
    osc({ type: 'sawtooth', f: 151.5, f2: 113, a: 0.1, d: 0.85, v: 0.1, filter: { type: 'lowpass', f: 700, f2: 300, q: 2 } });
  },
  goat() { osc({ type: 'sawtooth', f: 430, f2: 395, a: 0.02, d: 0.55, v: 0.16, trem: 23, filter: { type: 'bandpass', f: 1300, q: 2 } }); },
  elephant() {
    osc({ type: 'sawtooth', f: 430, peak: 780, peakAt: 0.4, f2: 520, a: 0.04, d: 0.6, v: 0.15, vib: 14, vibRate: 9, filter: { type: 'bandpass', f: 1500, q: 3 } });
    noise({ a: 0.03, d: 0.4, v: 0.06, f: 1800, q: 2 });
  },
  tiger() {
    osc({ type: 'sawtooth', f: 88, f2: 68, a: 0.06, d: 0.6, v: 0.3, trem: 31, filter: { type: 'lowpass', f: 600, f2: 320, q: 3 } });
    noise({ a: 0.05, d: 0.5, v: 0.12, type: 'lowpass', f: 450 });
  },
  lion() {
    osc({ type: 'sawtooth', f: 90, peak: 160, peakAt: 0.3, f2: 70, a: 0.08, d: 1.05, v: 0.34, trem: 24, filter: { type: 'lowpass', f: 400, f2: 300, q: 4 } });
    osc({ type: 'sawtooth', f: 92, peak: 165, peakAt: 0.3, f2: 72, a: 0.08, d: 1.05, v: 0.18, filter: { type: 'bandpass', f: 900, q: 2 } });
    noise({ a: 0.1, d: 0.9, v: 0.16, type: 'lowpass', f: 700, f2: 250 });
  },
  yak() {
    osc({ type: 'sawtooth', f: 98, f2: 80, a: 0.02, d: 0.28, v: 0.26, filter: { type: 'lowpass', f: 650, q: 3 } });
    osc({ type: 'sawtooth', f: 92, f2: 76, t: 0.32, a: 0.02, d: 0.3, v: 0.22, filter: { type: 'lowpass', f: 600, q: 3 } });
  },
  rhino() { noise({ d: 0.16, v: 0.32, f: 950, f2: 420, q: 2 }); noise({ t: 0.22, d: 0.2, v: 0.28, f: 850, f2: 360, q: 2 }); osc({ type: 'sawtooth', f: 70, t: 0.22, d: 0.18, v: 0.1, filter: { f: 300 } }); },
  panda() { osc({ f: 1150, f2: 1750, d: 0.09, v: 0.12 }); osc({ f: 1250, f2: 1900, t: 0.14, d: 0.1, v: 0.12 }); },
  turtle() { [0, 0.09, 0.18].forEach((t, i) => osc({ f: 480 + i * 160, f2: 1000 + i * 220, t, d: 0.07, v: 0.1 })); },
};

export const sfx = {
  tap() { wood(1450, 0, 0.11); },
  flip() { noise({ d: 0.07, v: 0.14, f: 3200, f2: 6500, q: 0.9 }); wood(950, 0.02, 0.05); },
  good() { bell(N.D5, 0, 0.1); bell(N.Fs5, 0.07, 0.1); bell(N.A5, 0.14, 0.12, 1.2); },
  bad() { osc({ type: 'sawtooth', f: 220, f2: 105, a: 0.01, d: 0.34, v: 0.09, filter: { f: 900, f2: 280, q: 4 } }); osc({ type: 'sawtooth', f: 226, f2: 108, a: 0.01, d: 0.34, v: 0.07, filter: { f: 900, f2: 280 } }); },
  coin() { wood(520, 0, 0.26); bell(1250, 0.01, 0.03, 0.25); },
  clack(v = 0.5) { osc({ f: 2400 + Math.random() * 400, f2: 1600, d: 0.04, v: 0.12 + v * 0.35 }); noise({ d: 0.02, v: v * 0.25, f: 5000, q: 2 }); },
  rail(v = 0.4) { osc({ f: 120, f2: 70, d: 0.09, v: v * 0.45 }); noise({ d: 0.05, v: v * 0.12, type: 'lowpass', f: 800 }); },
  pocket() { osc({ f: 180, f2: 60, d: 0.25, v: 0.45 }); noise({ t: 0.04, d: 0.15, v: 0.2, type: 'lowpass', f: 700 }); [0.12, 0.2, 0.27].forEach((t, i) => wood(260 - i * 30, t, 0.12)); },
  cue() { noise({ d: 0.04, v: 0.3, f: 1800, q: 1.5 }); osc({ f: 900, f2: 400, d: 0.04, v: 0.15 }); },
  splash() {
    noise({ d: 0.5, v: 0.35, f: 900, f2: 300, q: 0.6 }); noise({ t: 0.05, d: 0.3, v: 0.18, f: 3500, q: 0.8 });
    for (let i = 0; i < 5; i++) bell(1500 + Math.random() * 1600, 0.06 + Math.random() * 0.28, 0.025, 0.15, 1.5);
  },
  boom() { osc({ f: 120, f2: 30, d: 0.7, v: 0.85 }); noise({ d: 0.6, v: 0.55, type: 'lowpass', f: 1200, f2: 160 }); madal('dhum', 0.02, 0.4); },
  whoosh() { noise({ d: 0.35, v: 0.2, f: 400, f2: 3000, q: 0.7 }); },
  turn() { wood(1800, 0, 0.07); wood(1250, 0.07, 0.05); },
  blip() { pluck(N.A5, 0, 0.08); },
  thump(v = 0.5) { osc({ f: 150 + Math.random() * 50, f2: 70, d: 0.12, v: 0.15 + v * 0.4 }); noise({ d: 0.06, v: 0.05 + v * 0.12, type: 'lowpass', f: 900 }); if (v > 0.5) wood(300 + Math.random() * 120, 0.01, 0.08); },
  crash() {
    noise({ d: 0.6, v: 0.45, type: 'lowpass', f: 2500, f2: 150 }); madal('dhum', 0, 0.5);
    for (let i = 0; i < 7; i++) wood(220 + Math.random() * 500, 0.05 + i * 0.07 + Math.random() * 0.04, 0.14);
  },
  yes() { madal('ta', 0, 0.25); bell(N.A5, 0, 0.13); bell(N.D6, 0.11, 0.14, 1.1); },
  no() { [[311, 0], [233, 0.24]].forEach(([f, t]) => osc({ type: 'sawtooth', f, f2: f * 0.94, t, a: 0.02, d: 0.24, v: 0.11, vib: 6, vibRate: 7, filter: { f: 1400, f2: 450, q: 6 } })); },
  win() {
    [['dhum', 0], ['ta', 0.13], ['ta', 0.26], ['dhum', 0.39], ['ta', 0.52], ['tin', 0.65], ['dhum', 0.9]].forEach(([k, t]) => madal(k, t, 0.38));
    [[N.A4, 0.1, 0.16], [N.B4, 0.27, 0.16], [N.D5, 0.44, 0.16], [N.E5, 0.61, 0.16], [N.Fs5, 0.78, 0.2], [N.E5, 0.99, 0.14], [N.D5, 1.14, 0.55]].forEach(([f, t, d]) => flute(f, t, d, 0.12));
    bell(N.D6, 1.2, 0.08, 1.4);
  },
  draw() { flute(N.A4, 0, 0.3, 0.12); flute(N.Fs4, 0.32, 0.5, 0.11); madal('dhum', 0, 0.25); },
  start() { madal('dhum', 0, 0.35); madal('ta', 0.12, 0.3); flute(N.D5, 0.14, 0.14, 0.1); flute(N.A5, 0.3, 0.3, 0.1); },
  again() { [N.D5, N.Fs5, N.A5].forEach((f, i) => pluck(f, i * 0.06, 0.09)); },
  pass() { pluck(N.A4, 0, 0.09); pluck(N.Fs4, 0.12, 0.09); },
  // Mancala: one pebble per pit, climbing in pitch as the hand moves on
  seed(i = 0) { wood(1300 + Math.min(i, 14) * 70 + Math.random() * 60, 0, 0.11); bell(2600 + Math.random() * 300, 0.005, 0.012, 0.12, 1.4); },
  store() { wood(420, 0, 0.25); madal('tin', 0.01, 0.25); },
  capture() { for (let i = 0; i < 6; i++) wood(700 + Math.random() * 900, i * 0.045, 0.1); sfx.good(); },
  // Reversi: each flip in a chain a little higher
  disc(i = 0) { wood(650 + i * 70, 0, 0.16); noise({ d: 0.05, v: 0.06, f: 3000 + i * 200, q: 2 }); },
  voice(id) { VOICES[id]?.(); },
};
