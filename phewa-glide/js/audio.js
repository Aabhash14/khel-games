// Phewa Glide: every sound is synthesised (no audio files). Wind rush, a vario that beeps
// faster as you climb, prayer-bell chimes for rings, a soft ambient pad and a landing crowd.
(function () {
  const PG = window.PG;
  let ctx = null, master = null, muted = PG.D.muted;
  let windSrc = null, windGain = null, windFilt = null;
  let padGain = null, padOn = false;
  let nextBeep = 0, varioOn = false;
  let birdT = 3;

  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.035 * w) / 1.035; d[i] = last * 3.2; }
    return b;
  }
  function whiteBuffer(sec) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  let white = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    white = whiteBuffer(1.5);
    // wind bed: brown-ish noise through a moving low-pass
    windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuffer(4); windSrc.loop = true;
    windFilt = ctx.createBiquadFilter(); windFilt.type = 'lowpass'; windFilt.frequency.value = 400; windFilt.Q.value = 0.7;
    windGain = ctx.createGain(); windGain.gain.value = 0;
    windSrc.connect(windFilt); windFilt.connect(windGain); windGain.connect(master);
    windSrc.start();
    // ambient pad: three slow sines (D, A, F#) with a gentle swell
    padGain = ctx.createGain(); padGain.gain.value = 0;
    const padFilt = ctx.createBiquadFilter(); padFilt.type = 'lowpass'; padFilt.frequency.value = 900;
    padGain.connect(padFilt); padFilt.connect(master);
    [146.83, 220, 293.66, 369.99].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain(); g.gain.value = [0.16, 0.07, 0.09, 0.04][i];
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.031;
      const lg = ctx.createGain(); lg.gain.value = 0.05;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      o.connect(g); g.connect(padGain); o.start();
    });
  }

  function env(node, t, a, peak, d) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(f, type, peak, a, d, when, dest) {
    if (!ctx) return;
    const t = (when || 0) + ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain(); env(g, t, a, peak, d);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + a + d + 0.05);
    return o;
  }
  function noise(peak, a, d, type, freq, q, when, sweepTo) {
    if (!ctx) return;
    const t = (when || 0) + ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = white;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + a + d);
    const g = ctx.createGain(); env(g, t, a, peak, d);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + a + d + 0.05);
  }

  const A = (PG.audio = {
    init,
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.05);
    },
    click() { tone(1400, 'sine', 0.05, 0.002, 0.05); },
    pad(on) {
      padOn = on;
      if (padGain) padGain.gain.setTargetAtTime(on ? 0.22 : 0.07, ctx.currentTime, 1.5);
    },
    // per-frame: airspeed in m/s, climb in m/s, flying = in the air
    update(dt, speed, climb, flying, vario) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const s = Math.max(0, Math.min(1, (speed - 4) / 14));
      windGain.gain.setTargetAtTime(flying ? 0.05 + s * 0.2 : 0.015, now, 0.25);
      windFilt.frequency.setTargetAtTime(250 + s * 1300, now, 0.3);
      // vario: beeps above +0.3 m/s; pitch and rate rise with climb
      varioOn = vario && flying;
      if (varioOn && climb > 0.3) {
        if (nextBeep < now) nextBeep = now;
        if (nextBeep < now + 0.05) {
          const c = Math.min(climb, 5);
          const f = 620 + c * 140;
          const len = Math.max(0.05, 0.14 - c * 0.015);
          tone(f, 'square', 0.022, 0.004, len, nextBeep - now);
          tone(f * 2, 'sine', 0.012, 0.004, len, nextBeep - now);
          nextBeep += Math.max(0.11, 0.42 - c * 0.065);
        }
      } else nextBeep = 0;
      // the odd bird in the valley
      birdT -= dt;
      if (birdT < 0) { birdT = 5 + Math.random() * 9; A.bird(); }
    },
    bird() {
      if (!ctx) return;
      const base = 2200 + Math.random() * 1400;
      const n = 2 + (Math.random() * 3) | 0;
      for (let i = 0; i < n; i++) {
        const t = ctx.currentTime + i * 0.13;
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.07);
        const g = ctx.createGain(); env(g, t, 0.01, 0.012, 0.08);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.12);
      }
    },
    ring(chain) {
      // prayer-bell chime, a pentatonic step higher for each ring in a chain
      const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      const root = 523.25 * Math.pow(2, scale[Math.min(chain, scale.length - 1)] / 12);
      tone(root, 'sine', 0.13, 0.005, 1.4);
      tone(root * 2.76, 'sine', 0.04, 0.003, 0.6);
      tone(root * 1.5, 'triangle', 0.05, 0.01, 0.9, 0.09);
      noise(0.08, 0.01, 0.35, 'bandpass', 1800, 0.8, 0, 600);
    },
    launch() {
      for (let i = 0; i < 7; i++) noise(0.06, 0.005, 0.07, 'lowpass', 500, 1, i * 0.21);
      noise(0.12, 0.25, 0.9, 'bandpass', 700, 0.6, 1.0, 2400);
    },
    flap() { noise(0.05, 0.02, 0.25, 'bandpass', 900, 1, 0, 400); },
    land(good) {
      noise(0.18, 0.004, 0.18, 'lowpass', 300, 1);
      if (!good) return;
      // a little crowd: claps and a cheer
      for (let i = 0; i < 18; i++) noise(0.04 + Math.random() * 0.03, 0.002, 0.04, 'bandpass', 1500 + Math.random() * 1500, 1.5, 0.25 + Math.random() * 1.6);
      noise(0.05, 0.3, 1.2, 'bandpass', 900, 0.7, 0.2, 1300);
      [0, 4, 7, 12].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 'triangle', 0.07, 0.01, 0.5, 0.15 + i * 0.12));
    },
    splash() {
      noise(0.25, 0.005, 0.8, 'lowpass', 3000, 0.8, 0, 200);
      noise(0.1, 0.05, 1.4, 'bandpass', 600, 0.6, 0.2, 200);
    },
    thud() { noise(0.2, 0.003, 0.3, 'lowpass', 200, 1); tone(70, 'sine', 0.2, 0.003, 0.3); },
    stars(n) {
      for (let i = 0; i < n; i++) tone(784 * Math.pow(2, (i * 4) / 12), 'sine', 0.09, 0.005, 0.7, 0.35 + i * 0.28);
    },
  });
})();
