// Lakhey Run: every sound is synthesised with Web Audio. Dhime drums and bhusya cymbals drive the music;
// tempo follows running speed and layers (cymbals, bansuri) come in as intensity rises.
(function () {
  const LR = window.LR;
  const A = (LR.audio = { muted: !!(LR.D && LR.D.muted) });
  let ctx = null, master, music, sfx, rev, noise, timer = null;
  let playing = false, nextT = 0, step = 0, bar = 0;
  let bpm = 100, intensity = 0, menuMode = false;

  function mkNoise() {
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function mkIR(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = A.muted ? 0 : 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master.connect(comp); comp.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.6; music.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.85; sfx.connect(master);
    rev = ctx.createConvolver(); rev.buffer = mkIR(1.8);
    const rg = ctx.createGain(); rg.gain.value = 0.22; rev.connect(rg); rg.connect(master);
    noise = mkNoise();
    // street ambience: a soft crowd murmur
    const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.7;
    const ag = ctx.createGain(); ag.gain.value = 0.018;
    src.connect(bp); bp.connect(ag); ag.connect(master); src.start();
  };
  A.setMuted = function (m) {
    A.muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.05);
  };

  // ---------- building blocks ----------
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, f0, f1, t, dur, peak, dest, a) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a || 0.004, peak, dur);
    o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function burst(t, dur, peak, type, f0, f1, q, dest) {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, 0.003, peak, dur);
    s.connect(f); f.connect(g); g.connect(dest || sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  // ---------- instruments ----------
  function dhin(t, v) { // dhime bass head
    osc('sine', 110, 48, t, 0.38, 0.95 * v, music);
    burst(t, 0.05, 0.25 * v, 'lowpass', 900, 300, 0.7, music);
  }
  function ta(t, v) { // dhime treble head slap
    osc('triangle', 240, 180, t, 0.12, 0.38 * v, music);
    burst(t, 0.07, 0.35 * v, 'bandpass', 2200, 1400, 1.4, music);
  }
  function bhusya(t, v, open) {
    const d = open ? 0.6 : 0.11;
    burst(t, d, 0.22 * v, 'highpass', 6000, 0, 0.6, music);
    [587, 845, 1293, 1771].forEach((f) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), hp = ctx.createBiquadFilter();
      o.type = 'square'; o.frequency.value = f * (1 + Math.random() * 0.01);
      hp.type = 'highpass'; hp.frequency.value = 3200;
      env(g, t, 0.002, 0.035 * v, d);
      o.connect(hp); hp.connect(g); g.connect(music); g.connect(rev); o.start(t); o.stop(t + d + 0.05);
    });
  }
  function bansuri(t, f, dur, v) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f;
    lfo.frequency.value = 5.4; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.06);
    g.gain.setValueAtTime(0.16 * v, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(music); g.connect(rev);
    [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + dur + 0.05); });
    burst(t, Math.min(0.2, dur), 0.03 * v, 'bandpass', f * 2, 0, 3, music);
  }

  // Dhime pattern, one bar of sixteenth notes. 2 = accented.
  const DHIN = [2, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0];
  const TA = [0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 1, 0, 2, 0, 1, 1];
  const BH_OPEN = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
  const BH_SHUT = [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0];
  // A tune in a raga-like scale (Sa Re Ga Pa Dha), semitones from base; null = rest
  const TUNES = [
    [0, null, 2, null, 4, null, 7, null, 9, null, 7, 4, 2, null, 0, null],
    [7, null, 9, 7, 4, null, 2, null, 4, null, 2, 0, -3, null, 0, null],
    [12, null, 9, null, 7, 9, 7, 4, 2, null, 4, null, 0, null, null, null],
    [4, 7, 9, null, 12, null, 9, 7, 4, null, 2, null, 4, null, null, null],
  ];

  function tick() {
    if (!ctx || !playing) return;
    const spb = 60 / bpm / 4;
    while (nextT < ctx.currentTime + 0.14) {
      const i = step % 16, t = nextT;
      const it = menuMode ? 2 : intensity;
      if (DHIN[i]) dhin(t, DHIN[i] === 2 ? 1 : 0.7);
      if (TA[i]) ta(t, TA[i] === 2 ? 1 : 0.6);
      if (it >= 1 && BH_OPEN[i]) bhusya(t, 1, true);
      if (it >= 2 && BH_SHUT[i]) bhusya(t, 0.6, false);
      if (it >= 2) {
        const tune = TUNES[bar % TUNES.length], n = tune[i];
        if (n !== null && n !== undefined) {
          let len = 1; while (i + len < 16 && tune[i + len] === null) len++;
          bansuri(t, 392 * Math.pow(2, n / 12), spb * len * 0.95, menuMode ? 0.7 : 0.85);
        }
      }
      nextT += spb; step++;
      if (step % 16 === 0) bar++;
    }
  }
  A.music = function (on, menu) {
    if (!ctx) return;
    menuMode = !!menu;
    if (on && !playing) { playing = true; nextT = ctx.currentTime + 0.08; step = 0; timer = setInterval(tick, 25); }
    if (!on && playing) { playing = false; clearInterval(timer); timer = null; }
  };
  A.drive = function (speedFrac, lvl) { // speedFrac 0..1
    bpm = menuMode ? 96 : 104 + speedFrac * 52;
    intensity = lvl;
  };

  // ---------- sound effects ----------
  const now = () => ctx.currentTime;
  A.coin = function (n) {
    if (!ctx) return; const t = now(), f = 1320 * Math.pow(2, ((n || 0) % 8) / 12);
    osc('sine', f, f, t, 0.22, 0.16); osc('sine', f * 1.5, f * 1.5, t + 0.04, 0.2, 0.08);
  };
  A.jump = function () { if (!ctx) return; const t = now(); burst(t, 0.22, 0.22, 'bandpass', 500, 1800, 1.2); osc('sine', 260, 520, t, 0.16, 0.12); };
  A.slide = function () { if (!ctx) return; burst(now(), 0.32, 0.22, 'bandpass', 1500, 320, 1); };
  A.lane = function () { if (!ctx) return; burst(now(), 0.1, 0.1, 'bandpass', 900, 1700, 2); };
  A.turn = function () { if (!ctx) return; const t = now(); burst(t, 0.28, 0.2, 'bandpass', 700, 2200, 1.4); ta(t, 0.6); };
  A.land = function () { if (!ctx) return; burst(now(), 0.08, 0.12, 'lowpass', 500, 200, 1); };
  A.stumble = function () {
    if (!ctx) return; const t = now();
    osc('sine', 130, 40, t, 0.35, 0.9); burst(t, 0.25, 0.4, 'lowpass', 1200, 200, 1);
    for (let k = 0; k < 5; k++) burst(t + 0.03 + k * 0.045, 0.06, 0.18, 'bandpass', 900 + Math.random() * 1800, 0, 4);
  };
  A.crash = function () {
    if (!ctx) return; const t = now();
    osc('sine', 90, 30, t, 0.7, 1); burst(t, 0.6, 0.6, 'lowpass', 2000, 120, 0.8); bhusya(t + 0.02, 1.4, true);
  };
  A.roar = function (v) { // the Lakhey's roar
    if (!ctx) return; const t = now(), vol = v || 1;
    const o = ctx.createOscillator(), ws = ctx.createWaveShaper(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 6); }
    ws.curve = c; o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(110, t + 0.3); o.frequency.exponentialRampToValueAtTime(55, t + 0.9);
    f.type = 'lowpass'; f.frequency.value = 900;
    env(g, t, 0.05, 0.3 * vol, 0.85);
    o.connect(ws); ws.connect(f); f.connect(g); g.connect(sfx); g.connect(rev); o.start(t); o.stop(t + 1);
    burst(t, 0.9, 0.35 * vol, 'bandpass', 400, 900, 0.8);
    dhin(t, vol); bhusya(t + 0.05, 1.2 * vol, true);
  };
  A.rush = function () { // Jatra rush: drum roll into a cymbal crash
    if (!ctx) return; const t = now();
    for (let k = 0; k < 10; k++) ta(t + k * 0.045, 0.5 + k * 0.05);
    dhin(t + 0.45, 1.2); bhusya(t + 0.45, 1.4, true);
    [0, 4, 7, 12].forEach((n, k) => osc('triangle', 523 * Math.pow(2, n / 12), 0, t + 0.45 + 0.05 * k, 0.4, 0.1));
  };
  A.power = function () { // gong + chime
    if (!ctx) return; const t = now();
    [[196, 0.4, 2.2], [541, 0.12, 1.6], [1058, 0.06, 1.1]].forEach(([f, p, d]) => { osc('sine', f, f, t, d, p, sfx); });
    [0, 4, 7, 12].forEach((n, k) => osc('triangle', 784 * Math.pow(2, n / 12), 0, t + 0.06 * k, 0.3, 0.08));
  };
  A.yomari = function () { if (!ctx) return; const t = now(); [0, 4, 7, 11, 14].forEach((n, k) => osc('sine', 660 * Math.pow(2, n / 12), 0, t + k * 0.07, 0.35, 0.13)); };
  A.click = function () { if (!ctx) return; osc('triangle', 880, 660, now(), 0.06, 0.08); };
  A.close = function () { if (!ctx) return; const t = now(); dhin(t, 1); dhin(t + 0.18, 1); };
})();
