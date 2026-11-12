// Synthesised sound: no audio files. Oscillators + noise only.
let ctx = null;
let master = null;
let noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem('duo.muted') === '1'; } catch { /* private mode */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
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
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.02);
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone({ type = 'sine', f = 440, f2 = null, t = 0, a = 0.005, d = 0.2, v = 0.3 }) {
  const c = ac(); if (!c || muted) return;
  const at = c.currentTime + t;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  env(g, at, a, v, d);
  o.connect(g).connect(master);
  o.start(at); o.stop(at + a + d + 0.05);
}

function noise({ t = 0, a = 0.003, d = 0.12, v = 0.3, type = 'bandpass', f = 2500, q = 1, f2 = null }) {
  const c = ac(); if (!c || muted) return;
  const at = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, at); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  const g = c.createGain(); env(g, at, a, v, d);
  s.connect(fl).connect(g).connect(master);
  s.start(at, Math.random() * 0.5); s.stop(at + a + d + 0.05);
}

const notes = (list, type = 'triangle', v = 0.22, step = 0.11) =>
  list.forEach((f, i) => tone({ type, f, t: i * step, d: step * 1.6, v }));

export const sfx = {
  tap() { tone({ type: 'triangle', f: 760, f2: 540, d: 0.05, v: 0.16 }); noise({ d: 0.025, v: 0.05, f: 4200 }); },
  flip() { noise({ d: 0.09, v: 0.16, f: 2400, f2: 5200, q: 0.8 }); tone({ type: 'triangle', f: 500, f2: 900, d: 0.06, v: 0.06 }); },
  good() { notes([660, 880, 1320], 'triangle', 0.18, 0.07); },
  bad() { tone({ type: 'square', f: 220, f2: 140, d: 0.22, v: 0.08 }); },
  coin() { tone({ type: 'triangle', f: 300, f2: 180, d: 0.08, v: 0.3 }); noise({ d: 0.05, v: 0.15, type: 'lowpass', f: 1500 }); },
  clack(v = 0.5) { tone({ type: 'sine', f: 2400 + Math.random() * 400, f2: 1600, d: 0.04, v: 0.12 + v * 0.35 }); noise({ d: 0.02, v: v * 0.25, f: 5000, q: 2 }); },
  rail(v = 0.4) { tone({ f: 120, f2: 70, d: 0.09, v: v * 0.45 }); noise({ d: 0.05, v: v * 0.12, type: 'lowpass', f: 800 }); },
  pocket() { tone({ f: 180, f2: 60, d: 0.25, v: 0.45 }); noise({ t: 0.04, d: 0.15, v: 0.2, type: 'lowpass', f: 700 }); tone({ t: 0.12, f: 140, f2: 90, d: 0.1, v: 0.2 }); },
  cue() { noise({ d: 0.04, v: 0.3, f: 1800, q: 1.5 }); tone({ f: 900, f2: 400, d: 0.04, v: 0.15 }); },
  puck(v = 0.5) { tone({ type: 'square', f: 600 + v * 500, f2: 300, d: 0.05, v: 0.06 + v * 0.12 }); noise({ d: 0.03, v: 0.1 + v * 0.2, f: 3000 }); },
  wall(v = 0.4) { noise({ d: 0.06, v: v * 0.3, type: 'lowpass', f: 1400 }); tone({ f: 200, f2: 120, d: 0.05, v: v * 0.2 }); },
  goal() { notes([523, 659, 784, 1047], 'sawtooth', 0.12, 0.09); noise({ d: 0.6, v: 0.18, f: 900, q: 0.4 }); },
  splash() { noise({ d: 0.5, v: 0.35, f: 900, f2: 300, q: 0.6 }); noise({ t: 0.05, d: 0.3, v: 0.18, f: 3500, q: 0.8 }); },
  boom() { tone({ f: 120, f2: 30, d: 0.6, v: 0.85 }); noise({ d: 0.55, v: 0.55, type: 'lowpass', f: 1200, f2: 200 }); },
  whoosh() { noise({ d: 0.35, v: 0.2, f: 400, f2: 3000, q: 0.7 }); },
  tick(hi = false) { tone({ type: 'square', f: hi ? 1500 : 1000, d: 0.02, v: hi ? 0.08 : 0.04 }); },
  go() { tone({ type: 'square', f: 1320, d: 0.12, v: 0.2 }); tone({ type: 'triangle', f: 1980, d: 0.14, v: 0.15 }); },
  blip() { tone({ type: 'sine', f: 520 + Math.random() * 300, d: 0.08, v: 0.12 }); },
  slap() { noise({ d: 0.08, v: 0.6, f: 1800, q: 0.5 }); tone({ f: 160, f2: 60, d: 0.1, v: 0.4 }); },
  thump(v = 0.5) { tone({ f: 150 + Math.random() * 40, f2: 70, d: 0.12, v: 0.15 + v * 0.4 }); noise({ d: 0.06, v: 0.05 + v * 0.12, type: 'lowpass', f: 900 }); },
  crash() { noise({ d: 0.5, v: 0.5, type: 'lowpass', f: 2500, f2: 150 }); tone({ type: 'sawtooth', f: 200, f2: 40, d: 0.45, v: 0.25 }); },
  turn() { tone({ type: 'triangle', f: 880, d: 0.03, v: 0.08 }); },
  yes() { notes([523, 784], 'triangle', 0.22, 0.1); },
  no() { notes([392, 262], 'square', 0.1, 0.12); },
  win() { notes([523, 659, 784, 1047, 784, 1047, 1319], 'triangle', 0.2, 0.1); },
  draw() { notes([440, 440, 392], 'triangle', 0.16, 0.14); },
};
