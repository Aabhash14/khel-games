/* Himal Climb: sound generated in code (wind, singing bowl, bansuri, effects). No audio files. */
(() => {
  'use strict';
  const HC = (window.HC = window.HC || {});
  const { store, clamp } = HC;

  // ---------- Audio (generated: wind, singing bowl, bansuri, effects) ----------
  const audio = {
    ac: null, master: null, noiseBuf: null, wind: null, windF: null,
    muted: !!store.get('hc_muted', false),
    init() {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ac = (this.ac = new AC());
        this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(ac.destination);
        const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        this.windF = ac.createBiquadFilter(); this.windF.type = 'lowpass'; this.windF.frequency.value = 400;
        this.wind = ac.createGain(); this.wind.gain.value = 0;
        src.connect(this.windF).connect(this.wind).connect(this.master); src.start();
      }
      if (this.ac.state === 'suspended') this.ac.resume();
    },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
    setWind(level, time) {
      if (!this.ac) return;
      const now = this.ac.currentTime;
      this.wind.gain.setTargetAtTime(level, now, 0.6);
      this.windF.frequency.setTargetAtTime(300 + 900 * level * 10 + Math.sin(time * 0.6) * 120, now, 0.6);
    },
    noise(tm, dur, type, f0, vol, f1 = 0, attack = 0) {
      const ac = this.ac, s = ac.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, tm);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, tm + dur);
      const g = ac.createGain();
      if (attack) { g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + attack); } else g.gain.setValueAtTime(vol, tm);
      g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      s.connect(f).connect(g).connect(this.master); s.start(tm, Math.random()); s.stop(tm + dur + 0.02);
    },
    tone(tm, freq, dur, type, vol, toFreq) {
      const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, tm);
      if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, tm + dur);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); o.stop(tm + dur + 0.02);
    },
    flute(tm, freq, dur, vol = 0.06) {
      const ac = this.ac, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, tm);
      lfo.frequency.value = 5; lg.gain.value = freq * 0.012; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.06);
      g.gain.setValueAtTime(vol, tm + Math.max(0.07, dur - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master);
      o.start(tm); lfo.start(tm); o.stop(tm + dur + 0.02); lfo.stop(tm + dur + 0.02);
    },
    bowl(tm, f = 196, vol = 0.12) { // singing bowl: inharmonic partials with slow beating
      [[1, 1, 3.2], [2.76, 0.45, 2.2], [5.4, 0.2, 1.3]].forEach(([p, a, dec]) => {
        for (const detune of [1, 1.004]) {
          const o = this.ac.createOscillator(), g = this.ac.createGain();
          o.type = 'sine'; o.frequency.value = f * p * detune;
          g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol * a * 0.5, tm + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, tm + dec);
          o.connect(g).connect(this.master); o.start(tm); o.stop(tm + dec + 0.05);
        }
      });
    },
    phrase(tm, slow = 0.32, rising = false) { // original folk-style line, D major pentatonic
      if (!this.ac) return;
      const SC = [440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66];
      let i = rising ? 2 : 3 + ((Math.random() * 2) | 0);
      const n = rising ? 6 : 4 + ((Math.random() * 3) | 0);
      for (let k = 0; k < n; k++) {
        if (!rising && k === n - 1) i = Math.random() < 0.5 ? 2 : 5;
        const d = (k === n - 1 ? 2.5 : Math.random() < 0.3 ? 1.5 : 1) * slow;
        this.flute(tm, SC[i], d * 0.95, 0.045);
        tm += d;
        i = rising ? Math.min(SC.length - 1, i + 1) : clamp(i + [-2, -1, 1, 1, 2][(Math.random() * 5) | 0], 0, SC.length - 1);
      }
    },
    now() { return this.ac ? this.ac.currentTime : 0; },
    step(alt) { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.04, 'highpass', 2600, 0.16); this.tone(tm, alt ? 820 : 700, 0.045, 'triangle', 0.05); },
    slip() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.32, 'bandpass', 1400, 0.22, 300); this.tone(tm, 300, 0.25, 'sine', 0.06, 160); },
    warn() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.7, 'lowpass', 220, 0.3, 0, 0.12); this.tone(tm, 70, 0.6, 'sine', 0.1, 50); },
    hit() { if (!this.ac) return; const tm = this.now(); this.tone(tm, 150, 0.35, 'sine', 0.3, 45); this.noise(tm, 0.3, 'lowpass', 800, 0.3); },
    tea() { if (!this.ac) return; const tm = this.now(); this.flute(tm, 880, 0.12, 0.06); this.flute(tm + 0.09, 1174.66, 0.18, 0.06); },
    o2() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.5, 'highpass', 3500, 0.12, 0, 0.03); this.tone(tm, 660, 0.12, 'triangle', 0.05); this.tone(tm + 0.1, 990, 0.18, 'triangle', 0.05); },
    breath(mask) { // slow inhale/exhale; through a mask it hisses
      if (!this.ac) return; const tm = this.now();
      this.noise(tm, 0.7, 'bandpass', 520, 0.07, 900, 0.3);
      this.noise(tm + 0.75, 0.8, 'bandpass', 700, 0.06, 380, 0.15);
      if (mask) this.noise(tm, 0.5, 'highpass', 4200, 0.025, 0, 0.2);
    },
    camp() { if (!this.ac) return; const tm = this.now(); this.bowl(tm, 196, 0.14); this.phrase(tm + 0.3, 0.2, true); },
    summit() { if (!this.ac) return; const tm = this.now(); this.bowl(tm, 147, 0.16); this.bowl(tm + 0.8, 196, 0.12); this.phrase(tm + 0.2, 0.22, true); this.phrase(tm + 1.7, 0.3); },
    fall() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 1.2, 'bandpass', 1800, 0.2, 200); [880, 739.99, 587.33, 493.88, 440].forEach((f, i) => this.flute(tm + 0.3 + i * 0.2, f, 0.24, 0.05)); },
  };

  HC.audio = audio;
})();
