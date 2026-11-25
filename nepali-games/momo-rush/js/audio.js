// Momo Rush sound: everything synthesised with WebAudio, no files.
// A street-evening loop (madal + bansuri over a soft drone and traffic hum) that speeds up in the rush,
// a steam hiss that follows how many tiers are cooking, a tawa sizzle, and small hits for every action.
(function () {
  const MR = (window.MR = window.MR || {});
  let ctx = null; let master = null; let sfxBus = null; let musBus = null; let noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem('momo.muted') === '1'; } catch (e) { /* private mode */ }
  let steamGain = null; let sizzleGain = null; let ambGain = null;
  let music = { on: false, step: 0, next: 0, bpm: 92, intensity: 0, timer: null, bar: 0 };

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.85;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp).connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      musBus = ctx.createGain(); musBus.gain.value = 0.42; musBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // continuous beds: steam, sizzle, street
      steamGain = bed('bandpass', 3200, 0.7, sfxBus);
      sizzleGain = bed('highpass', 4200, 0.5, sfxBus);
      ambGain = bed('lowpass', 320, 0.4, musBus);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function bed(type, f, q, out) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    s.connect(fl).connect(g).connect(out); s.start();
    return g;
  }

  function env(g, at, a, peak, d) {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  }
  function tone(o) {
    const c = ac(); if (!c) return;
    const at = (o.at || c.currentTime) + (o.t || 0);
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, at);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, at + (o.a || 0.005) + (o.d || 0.2));
    if (o.detune) osc.detune.value = o.detune;
    env(g, at, o.a || 0.005, o.v || 0.2, o.d || 0.2);
    osc.connect(g).connect(o.bus || sfxBus);
    osc.start(at); osc.stop(at + (o.a || 0.005) + (o.d || 0.2) + 0.05);
  }
  function noise(o) {
    const c = ac(); if (!c) return;
    const at = (o.at || c.currentTime) + (o.t || 0);
    const s = c.createBufferSource(); s.buffer = noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 2000, at); fl.Q.value = o.q || 1;
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, at + (o.a || 0.003) + (o.d || 0.1));
    const g = c.createGain(); env(g, at, o.a || 0.003, o.v || 0.2, o.d || 0.1);
    s.connect(fl).connect(g).connect(o.bus || sfxBus);
    s.start(at, Math.random() * 1.5); s.stop(at + (o.a || 0.003) + (o.d || 0.1) + 0.05);
  }
  function metal(f, v, d, t) { // aluminium lid: inharmonic partials
    [1, 2.32, 3.51, 5.1].forEach((m, i) => tone({ type: 'sine', f: f * m, d: d * (1 - i * 0.18), v: v / (1 + i * 0.7), t }));
  }

  MR.audio = {
    unlock() { ac(); },
    isMuted: () => muted,
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem('momo.muted', muted ? '1' : '0'); } catch (e) { /* fine */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.03);
    },
    // beds
    steam(n) { if (steamGain) steamGain.gain.setTargetAtTime(Math.min(0.09, n * 0.028), ctx.currentTime, 0.25); },
    sizzle(on) { if (sizzleGain) sizzleGain.gain.setTargetAtTime(on ? 0.07 : 0, ctx.currentTime, 0.1); },
    ambience(on) { if (ambGain) ambGain.gain.setTargetAtTime(on ? 0.35 : 0, ctx.currentTime, 0.8); },
    // music
    musicStart() {
      if (!ac() || music.on) return;
      music.on = true; music.step = 0; music.bar = 0; music.next = ctx.currentTime + 0.1;
      music.timer = setInterval(schedule, 40);
    },
    musicStop() { music.on = false; if (music.timer) clearInterval(music.timer); music.timer = null; },
    intensity(x) { music.intensity = Math.max(0, Math.min(1, x)); music.bpm = 90 + music.intensity * 36; },
    // hits
    tap() { tone({ type: 'triangle', f: 660, f2: 520, d: 0.05, v: 0.08 }); },
    select(i) { metal(880 + (i || 0) * 120, 0.12, 0.25); },
    pleat(n) { noise({ type: 'lowpass', f: 900, d: 0.07, v: 0.35 }); tone({ f: 180 + n * 40, f2: 120, d: 0.08, v: 0.18 }); },
    folded() { tone({ type: 'triangle', f: 523, d: 0.1, v: 0.15 }); tone({ type: 'triangle', f: 784, t: 0.08, d: 0.16, v: 0.15 }); },
    load() { metal(410, 0.22, 0.35); noise({ type: 'highpass', f: 5000, d: 0.3, v: 0.12, t: 0.04 }); },
    cooked() { tone({ f: 1046, d: 0.12, v: 0.06 }); },
    perfectOn() { tone({ f: 1318, d: 0.18, v: 0.08 }); tone({ f: 1975, t: 0.06, d: 0.2, v: 0.05 }); },
    pull(q) {
      metal(520, 0.2, 0.3);
      noise({ type: 'bandpass', f: 3000, f2: 6000, d: 0.35, v: 0.18 });
      if (q === 'perfect') [1046, 1318, 1568, 2093].forEach((f, i) => tone({ type: 'triangle', f, t: 0.05 + i * 0.055, d: 0.22, v: 0.13 }));
    },
    burnt() { noise({ type: 'lowpass', f: 600, f2: 150, d: 0.6, v: 0.45 }); tone({ type: 'sawtooth', f: 160, f2: 60, d: 0.5, v: 0.1 }); },
    nope() { tone({ type: 'square', f: 180, d: 0.07, v: 0.06 }); tone({ type: 'square', f: 140, t: 0.08, d: 0.09, v: 0.06 }); },
    achar() { noise({ type: 'bandpass', f: 700, f2: 300, q: 3, d: 0.12, v: 0.35 }); },
    jhol() { tone({ f: 300, f2: 700, d: 0.18, v: 0.12 }); noise({ type: 'lowpass', f: 1200, d: 0.25, v: 0.2 }); },
    fry() { noise({ type: 'highpass', f: 3500, d: 0.5, v: 0.25 }); },
    coin(n) {
      const k = Math.min(4, n || 1);
      for (let i = 0; i < k; i++) { tone({ f: 2637, t: i * 0.07, d: 0.18, v: 0.09 }); tone({ f: 3951, t: i * 0.07 + 0.01, d: 0.14, v: 0.05 }); }
    },
    serve() { tone({ type: 'triangle', f: 392, f2: 523, d: 0.12, v: 0.14 }); },
    wrong() { tone({ type: 'sawtooth', f: 200, f2: 150, d: 0.18, v: 0.08 }); },
    angry() { tone({ type: 'sawtooth', f: 220, f2: 110, d: 0.4, v: 0.1 }); noise({ type: 'lowpass', f: 400, d: 0.3, v: 0.2 }); },
    arrive() { tone({ type: 'sine', f: 740, d: 0.06, v: 0.05 }); },
    card() { tone({ type: 'triangle', f: 587, d: 0.08, v: 0.12 }); tone({ type: 'triangle', f: 880, t: 0.07, d: 0.12, v: 0.12 }); },
    swipe(yes) {
      noise({ type: 'bandpass', f: yes ? 900 : 2400, f2: yes ? 2800 : 600, q: 1.2, d: 0.22, v: 0.3 });
      tone({ type: 'triangle', f: yes ? 660 : 330, f2: yes ? 990 : 220, t: 0.06, d: 0.18, v: 0.12 });
    },
    bin() { noise({ type: 'lowpass', f: 500, d: 0.2, v: 0.4 }); metal(240, 0.12, 0.2, 0.05); },
    bell() { [1, 2.76, 5.4].forEach((m, i) => tone({ f: 523 * m, d: 1.6 - i * 0.4, v: 0.16 / (i + 1) })); },
    upgrade() { [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f, t: i * 0.08, d: 0.3, v: 0.15 })); },
    win() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone({ type: 'triangle', f, t: i * 0.09, d: 0.45, v: 0.15 })); },
    lose() { [392, 349, 311, 262].forEach((f, i) => tone({ type: 'triangle', f, t: i * 0.16, d: 0.4, v: 0.13 })); },
    horn() { [0, 0.22].forEach((t) => { tone({ type: 'square', f: 415, t, d: 0.16, v: 0.025, bus: musBus }); tone({ type: 'square', f: 523, t, d: 0.16, v: 0.02, bus: musBus }); }); },
  };

  // ---- music: 16 steps a bar, madal + bansuri, scheduled ahead ----
  // madal: D = dhin (low, open), t = ta (high, slap), k = ke (muted)
  const MADAL = ['D', '', 't', 'k', '', 't', 'D', '', 'D', '', 't', 'k', '', 't', 't', 'k'];
  const MADAL_RUSH = ['D', 'k', 't', 'k', 'D', 't', 'D', 'k', 'D', 'k', 't', 'k', 'D', 't', 't', 't'];
  // bansuri phrase over 4 bars, D major pentatonic: [step, midi, length in steps]
  const MEL = [
    [[0, 74, 3], [4, 76, 2], [6, 78, 2], [8, 81, 6], [14, 78, 2]],
    [[0, 76, 4], [4, 74, 2], [6, 71, 2], [8, 74, 8]],
    [[0, 78, 2], [2, 81, 2], [4, 83, 4], [8, 81, 2], [10, 78, 2], [12, 76, 4]],
    [[0, 74, 2], [2, 76, 2], [4, 74, 2], [6, 71, 2], [8, 69, 4], [12, 71, 2], [14, 74, 2]],
  ];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function dhin(at, v) {
    tone({ at, f: 140, f2: 62, d: 0.32, v: 0.5 * v, bus: musBus });
    noise({ at, type: 'lowpass', f: 300, d: 0.06, v: 0.25 * v, bus: musBus });
  }
  function ta(at, v) {
    noise({ at, type: 'bandpass', f: 2300, q: 2, d: 0.05, v: 0.35 * v, bus: musBus });
    tone({ at, f: 420, f2: 330, d: 0.06, v: 0.12 * v, bus: musBus });
  }
  function ke(at, v) { noise({ at, type: 'bandpass', f: 1200, q: 3, d: 0.03, v: 0.22 * v, bus: musBus }); }
  function jhyamta(at, v) { noise({ at, type: 'highpass', f: 7000, d: 0.09, v: 0.12 * v, bus: musBus }); }
  function flute(at, midi, dur, v) {
    const c = ctx; const f = mtof(midi);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.985, at); o.frequency.exponentialRampToValueAtTime(f, at + 0.06);
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.08;
    const lfo = c.createOscillator(); lfo.frequency.value = 5.4; const lg = c.createGain(); lg.gain.setValueAtTime(0, at); lg.gain.linearRampToValueAtTime(f * 0.012, at + dur * 0.8);
    lfo.connect(lg).connect(o.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.16 * v, at + 0.07);
    g.gain.setValueAtTime(0.14 * v, at + Math.max(0.08, dur - 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.12);
    o.connect(g); o2.connect(g2).connect(g); g.connect(musBus);
    [o, o2, lfo].forEach((x) => { x.start(at); x.stop(at + dur + 0.2); });
    noise({ at, type: 'bandpass', f: f * 2, q: 4, d: 0.12, v: 0.05 * v, bus: musBus }); // breath
  }
  function drone(at, dur) {
    [50, 57].forEach((m) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m);
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 380;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.035, at + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(fl).connect(g).connect(musBus); o.start(at); o.stop(at + dur + 0.05);
    });
  }

  function schedule() {
    if (!music.on || !ctx) return;
    while (music.next < ctx.currentTime + 0.15) {
      const at = music.next; const st = music.step; const I = music.intensity;
      const pat = I > 0.7 ? MADAL_RUSH : MADAL;
      const hit = pat[st];
      if (hit === 'D') dhin(at, 0.9); else if (hit === 't') ta(at, 0.8 + I * 0.3); else if (hit === 'k') ke(at, 0.7);
      if ((st === 4 || st === 12) && I > 0.3) jhyamta(at, 0.8);
      if (st === 0 && music.bar % 2 === 0) drone(at, (60 / music.bpm) * 8);
      if (I > 0.15) {
        const phrase = MEL[music.bar % 4];
        for (const n of phrase) if (n[0] === st) flute(at, n[1] + (I > 0.75 && music.bar % 8 >= 4 ? 2 : 0), (60 / music.bpm / 4) * n[2] * 0.95, 0.75 + I * 0.25);
      }
      if (st === 0 && music.bar % 6 === 5 && Math.random() < 0.5) MR.audio.horn();
      music.next += 60 / music.bpm / 4;
      music.step = (st + 1) % 16;
      if (music.step === 0) music.bar++;
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (music.on) ctx.resume();
  });
})();
