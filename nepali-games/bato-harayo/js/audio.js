/* Bato Harayo: generated sound (ambience, footsteps, animals, bells, ending tunes). */
(() => {
  'use strict';
  const BH = (window.BH = window.BH || {});
  const { store, rand, clamp, lerp } = BH.Util;

  // ---------- Audio (all generated) ----------
  const audio = {
    ac: null, master: null, noiseBuf: null, river: null, wind: null, eerie: null, fire: null, scene: 'forest', who: null,
    muted: !!store.get('bh_muted', false),
    timers: { cricket: 0, owl: 8, heart: 0, bell: 4, bark: 6, bird: 0, fire: 0 },
    init() {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ac = (this.ac = new AC());
        this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(ac.destination);
        const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        const loop = (type, freq, q) => {
          const s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
          const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
          const g = ac.createGain(); g.gain.value = 0;
          s.connect(f).connect(g).connect(this.master); s.start();
          return g;
        };
        this.river = loop('bandpass', 700, 0.4);
        this.wind = loop('lowpass', 280, 0.7);
        this.eerie = ac.createGain(); this.eerie.gain.value = 0;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        this.eerie.connect(lp).connect(this.master);
        for (const f of [220, 223.4, 331]) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(this.eerie); o.start(); }
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      this.setScene(this.scene, this.who);
    },
    rain: false,
    setRain(on) { this.rain = on; this.setScene(this.scene, this.who); },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
    setScene(scene, who) {
      this.scene = scene; this.who = who;
      if (!this.ac) return;
      const now = this.ac.currentTime;
      this.river.gain.setTargetAtTime(this.rain ? 0.11 : scene === 'river' || scene === 'bridge' ? 0.07 : 0, now, 0.8);
      this.wind.gain.setTargetAtTime(scene === 'bridge' ? 0.07 : 0.035, now, 0.8);
      this.eerie.gain.setTargetAtTime(who === 'kichkandi' ? 0.03 : 0, now, 1.2);
    },
    now() { return this.ac.currentTime; },
    tone(tm, f, dur, type, vol, f2) {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, tm); if (f2) o.frequency.exponentialRampToValueAtTime(f2, tm + dur);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + Math.min(0.05, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); o.stop(tm + dur + 0.02);
    },
    noise(tm, dur, type, f, vol, f2) {
      const s = this.ac.createBufferSource(); s.buffer = this.noiseBuf;
      const fl = this.ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, tm); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, tm + dur);
      const g = this.ac.createGain(); g.gain.setValueAtTime(vol, tm); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      s.connect(fl).connect(g).connect(this.master); s.start(tm, Math.random()); s.stop(tm + dur + 0.02);
    },
    flute(tm, f, dur, vol = 0.05) {
      const o = this.ac.createOscillator(), lfo = this.ac.createOscillator(), lg = this.ac.createGain(), g = this.ac.createGain();
      o.frequency.value = f; lfo.frequency.value = 5; lg.gain.value = f * 0.012; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.06);
      g.gain.setValueAtTime(vol, tm + Math.max(0.07, dur - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); lfo.start(tm); o.stop(tm + dur + 0.02); lfo.stop(tm + dur + 0.02);
    },
    chirp(tm) { for (let k = 0; k < 3; k++) this.tone(tm + k * 0.045, 4300 + Math.random() * 300, 0.03, 'sine', 0.02); },
    owl() { if (!this.ac) return; const tm = this.now(); this.tone(tm, 420, 0.35, 'sine', 0.05, 380); this.tone(tm + 0.55, 400, 0.5, 'sine', 0.045, 360); },
    heart() { const tm = this.now(); this.tone(tm, 60, 0.12, 'sine', 0.22, 45); this.tone(tm + 0.22, 55, 0.12, 'sine', 0.16, 42); },
    bell() { if (!this.ac) return; const tm = this.now(); [[880, 0.05, 2.2], [1320, 0.025, 1.6], [2210, 0.012, 1]].forEach(([f, v, d]) => this.tone(tm, f, d, 'sine', v)); },
    bark() { if (!this.ac) return; const tm = this.now(); for (const o of [0, 0.32]) { this.noise(tm + o, 0.12, 'bandpass', 900, 0.15); this.tone(tm + o, 420, 0.12, 'sawtooth', 0.03, 300); } },
    jackal() { if (!this.ac) return; const tm = this.now(); for (const d of [0, 0.25]) { const o = this.ac.createOscillator(), g = this.ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(500 + d * 200, tm + d); o.frequency.linearRampToValueAtTime(950, tm + d + 0.5); o.frequency.linearRampToValueAtTime(620, tm + d + 1.3); g.gain.setValueAtTime(0.0001, tm + d); g.gain.exponentialRampToValueAtTime(0.03, tm + d + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, tm + d + 1.4); o.connect(g).connect(this.master); o.start(tm + d); o.stop(tm + d + 1.5); } },
    rustle() { if (!this.ac) return; const tm = this.now(); for (let k = 0; k < 5; k++) this.noise(tm + k * 0.07, 0.08, 'highpass', 2500, 0.08); },
    slip() { if (!this.ac) return; this.noise(this.now(), 0.25, 'bandpass', 1500, 0.15, 400); },
    whisper() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 1.6, 'bandpass', 3000, 0.05, 1200); this.tone(tm, 1480, 1.4, 'sine', 0.012, 1400); },
    pour() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.8, 'bandpass', 1800, 0.06, 900); this.tone(tm + 0.8, 1320, 0.4, 'sine', 0.03); },
    footsteps() { if (!this.ac) return; const tm = this.now(); for (let k = 0; k < 4; k++) this.noise(tm + k * 0.22, 0.08, 'lowpass', 500, 0.25); },
    crackle() { const tm = this.now(); for (let k = 0; k < 3; k++) this.noise(tm + Math.random() * 0.3, 0.03, 'highpass', 1800, 0.05); },
    ending(kind) {
      if (!this.ac) return;
      const tm = this.now(), SC = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];
      const seq = kind === 'home' ? [0, 1, 2, 3, 4, 5, 3, 5] : kind === 'morning' ? [3, 2, 3, 4, 3, 2, 0] : [3, 2, 1, 0];
      seq.forEach((i, k) => this.flute(tm + 0.4 + k * 0.32, SC[i], 0.34, 0.05));
    },
    tick(dt, minutes, state, fear) { // game clock, screen state and fear are passed in by the main loop
      if (!this.ac || this.ac.state !== 'running') return;
      const T = this.timers, dawnK = clamp((minutes - 450) / 60, 0, 1), playing = state === 'play';
      T.cricket -= dt;
      if (T.cricket <= 0 && dawnK < 0.8 && state !== 'over') { this.chirp(this.now()); T.cricket = rand(0.15, 0.9) * (this.scene === 'forest' || this.scene === 'fields' ? 0.6 : 1.3); }
      T.owl -= dt; if (T.owl <= 0) { if (dawnK < 0.5 && state !== 'over') this.owl(); T.owl = rand(14, 28); }
      if (playing && fear > 60) { T.heart -= dt; if (T.heart <= 0) { this.heart(); T.heart = lerp(1.0, 0.5, (fear - 60) / 40); } }
      if (this.scene === 'temple') { T.bell -= dt; if (T.bell <= 0) { this.bell(); T.bell = rand(7, 12); } }
      if (this.who === 'kukur') { T.bark -= dt; if (T.bark <= 0) { this.bark(); T.bark = rand(10, 18); } }
      if (this.who === 'jhankri' || this.who === 'sadhu') { T.fire -= dt; if (T.fire <= 0) { this.crackle(); T.fire = rand(0.4, 1.2); } }
      if (dawnK > 0.3 || state === 'over') { T.bird -= dt; if (T.bird <= 0) { const tm = this.now(); for (let k = 0; k < 4; k++) this.tone(tm + k * 0.09, rand(2600, 3800), 0.07, 'sine', 0.02, rand(2200, 4200)); T.bird = rand(0.6, 2); } }
    },
  };

  BH.Audio = audio;
})();
