// Synthesised sound: no audio files. Everything is built from oscillators and noise.
let ctx = null;
let master = null;
let noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem('imposter.muted') === '1'; } catch { /* private mode */ }

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
  try { localStorage.setItem('imposter.muted', m ? '1' : '0'); } catch { /* fine */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.02);
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone({ type = 'sine', f = 440, f2 = null, t = 0, a = 0.005, d = 0.2, v = 0.3, out = null }) {
  const c = ac(); if (!c) return;
  const at = c.currentTime + t;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  env(g, at, a, v, d);
  o.connect(g).connect(out || master);
  o.start(at); o.stop(at + a + d + 0.05);
}

function noise({ t = 0, a = 0.003, d = 0.12, v = 0.3, type = 'bandpass', f = 2500, q = 1, f2 = null }) {
  const c = ac(); if (!c) return;
  const at = c.currentTime + t;
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, at); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + a + d);
  const g = c.createGain(); env(g, at, a, v, d);
  s.connect(fl).connect(g).connect(master);
  s.start(at, Math.random() * 0.5); s.stop(at + a + d + 0.05);
}

export const sfx = {
  tap() { tone({ type: 'triangle', f: 720, f2: 520, d: 0.06, v: 0.18 }); noise({ d: 0.03, v: 0.06, f: 4000 }); },
  paper() { noise({ d: 0.18, v: 0.22, f: 1800, f2: 4200, q: 0.7 }); noise({ t: 0.07, d: 0.12, v: 0.15, f: 3000, q: 0.8 }); },
  heart(strength = 0.5) {
    const v = 0.25 + strength * 0.35;
    tone({ f: 70, f2: 38, d: 0.16, v });
    tone({ t: 0.16, f: 60, f2: 34, d: 0.2, v: v * 0.7 });
  },
  tick(hi = false) { tone({ type: 'square', f: hi ? 1600 : 1100, d: 0.025, v: hi ? 0.09 : 0.05 }); },
  drum(big = false) {
    tone({ f: big ? 140 : 180, f2: 50, d: big ? 0.45 : 0.25, v: big ? 0.7 : 0.5 });
    noise({ d: big ? 0.25 : 0.12, v: 0.25, type: 'lowpass', f: 1200 });
  },
  snare(v = 0.15) { noise({ d: 0.07, v, f: 2200, q: 0.6 }); tone({ type: 'triangle', f: 220, d: 0.04, v: v * 0.5 }); },
  stamp() {
    tone({ f: 110, f2: 32, d: 0.5, v: 0.9 });
    noise({ d: 0.3, v: 0.5, type: 'lowpass', f: 900 });
    noise({ t: 0.01, d: 0.06, v: 0.3, f: 3000 });
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      tone({ t: i * 0.09, f, d: 0.5, v: 0.22 });
      tone({ t: i * 0.09, f: f * 4, d: 0.08, v: 0.05 });
    });
  },
  sneer() { // imposter wins: a slinky minor slide
    [392, 370, 311, 294].forEach((f, i) => tone({ type: 'sawtooth', t: i * 0.16, f, f2: f * 0.97, d: 0.22, v: 0.08 }));
    tone({ type: 'sine', t: 0.64, f: 147, f2: 110, d: 0.7, v: 0.3 });
  },
  buzz() { tone({ type: 'sawtooth', f: 120, d: 0.35, v: 0.15 }); tone({ type: 'square', f: 123, d: 0.35, v: 0.08 }); },
  right() { tone({ f: 880, d: 0.12, v: 0.2 }); tone({ t: 0.1, f: 1320, d: 0.3, v: 0.2 }); },
  wrong() { tone({ type: 'square', f: 200, f2: 140, d: 0.3, v: 0.12 }); },
};

/* ---- adaptive tension bed for the discussion timer ----
   tension 0..1: tempo rises, a high pulse joins past .5, ticking joins past .85 */
let bed = null;
export const music = {
  start() {
    const c = ac(); if (!c || bed) return;
    const out = c.createGain(); out.gain.value = 0.0001; out.connect(master);
    out.gain.exponentialRampToValueAtTime(1, c.currentTime + 0.6);
    bed = { out, tension: 0, next: c.currentTime + 0.05, step: 0, timer: 0 };
    const bass = [55, 55, 65.4, 55, 51.9, 55, 65.4, 73.4];
    bed.timer = setInterval(() => {
      const b = bed; if (!b) return;
      const spb = 0.42 - b.tension * 0.22; // seconds per beat
      while (b.next < c.currentTime + 0.12) {
        const at = b.next - c.currentTime;
        const s = b.step;
        tone({ type: 'triangle', t: at, f: bass[s % 8], d: spb * 0.8, v: 0.22, out: b.out });
        if (s % 2 === 1) noise({ t: at, d: 0.03, v: 0.04 + b.tension * 0.05, f: 6000, q: 0.5 });
        if (b.tension > 0.5 && s % 4 === 2) tone({ type: 'sine', t: at, f: bass[s % 8] * 8, d: 0.12, v: 0.05 + (b.tension - 0.5) * 0.1, out: b.out });
        if (b.tension > 0.85) tone({ type: 'square', t: at + spb / 2, f: 1500, d: 0.02, v: 0.04, out: b.out });
        b.next += spb / 2; b.step++;
      }
    }, 30);
  },
  tension(x) { if (bed) bed.tension = Math.max(0, Math.min(1, x)); },
  stop() {
    if (!bed) return;
    const b = bed; bed = null;
    clearInterval(b.timer);
    b.out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
    setTimeout(() => b.out.disconnect(), 800);
  },
};

export function buzzHaptic(pattern) { try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* fine */ } }
