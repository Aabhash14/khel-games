// Sound, all generated in code: madal beat, bansuri-style tune and effects.
(() => {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { store, clamp } = CC.Util;

  // ---------- Audio (all generated: madal, bansuri, effects) ----------
  const audio = {
    ac: null, master: null, music: null, noiseBuf: null, pechGain: null, timer: null, next: 0, step: 0,
    muted: !!store.get('cc_muted', false),
    isPlaying: () => false, // main.js replaces this with a check of its game state (tune plays only mid-game)
    init() {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ac = (this.ac = new AC());
        this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(ac.destination);
        this.music = ac.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
        const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.9;
        this.pechGain = ac.createGain(); this.pechGain.gain.value = 0;
        src.connect(bp).connect(this.pechGain).connect(this.master); src.start();
      }
      if (this.ac.state === 'suspended') this.ac.resume();
    },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
    setPech(v) { if (this.pechGain) this.pechGain.gain.setTargetAtTime(v * 0.07, this.ac.currentTime, 0.05); },
    noise(tm, dur, type, freq, vol, q = 1, attack = 0) {
      const ac = this.ac, s = ac.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ac.createGain();
      if (attack) { g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + attack); } else g.gain.setValueAtTime(vol, tm);
      g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      s.connect(f).connect(g).connect(this.master); s.start(tm, Math.random() * 0.5); s.stop(tm + dur + 0.02);
    },
    tone(tm, freq, dur, type, vol, toFreq, dest) {
      const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, tm);
      if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, tm + dur);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(dest || this.master); o.start(tm); o.stop(tm + dur + 0.02);
    },
    flute(tm, freq, dur, vol = 0.07, dest) { // bansuri-like: sine with gentle vibrato
      const ac = this.ac, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, tm);
      lfo.frequency.value = 5.2; lg.gain.value = freq * 0.012; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.04);
      g.gain.setValueAtTime(vol, tm + Math.max(0.05, dur - 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(dest || this.master);
      o.start(tm); lfo.start(tm); o.stop(tm + dur + 0.02); lfo.stop(tm + dur + 0.02);
    },
    dhin(tm, v) { this.tone(tm, 150, 0.3, 'sine', 0.3 * v, 55, this.music); },
    ta(tm, v) {
      const ac = this.ac, s = ac.createBufferSource(); s.buffer = this.noiseBuf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 2;
      const g = ac.createGain(); g.gain.setValueAtTime(0.16 * v, tm); g.gain.exponentialRampToValueAtTime(0.0001, tm + 0.07);
      s.connect(f).connect(g).connect(this.music); s.start(tm, Math.random() * 0.5); s.stop(tm + 0.09);
      this.tone(tm, 520, 0.05, 'triangle', 0.06 * v, 0, this.music);
    },
    startMusic() {
      if (!this.ac || this.timer) return;
      this.next = this.ac.currentTime + 0.1; this.step = 0;
      this.timer = setInterval(() => this.schedule(), 30);
    },
    schedule() {
      const STEP = 0.165, now = this.ac.currentTime;
      if (this.next < now - 0.1) this.next = now + 0.05; // skip ahead after the tab was asleep
      while (this.next < now + 0.15) {
        const s = this.step % 12, tm = this.next;
        if (s === 0 || s === 3 || s === 6 || s === 9) this.dhin(tm, s === 0 ? 1 : 0.75);
        if (s === 2 || s === 4 || s === 8 || s === 10 || s === 11) this.ta(tm, s === 4 || s === 10 ? 1 : 0.6);
        if (this.step % 48 === 0 && this.isPlaying() && Math.random() < 0.6) this.phrase(tm, STEP);
        this.next += STEP; this.step++;
      }
    },
    phrase(tm, STEP) { // short original folk-style tune in D major pentatonic
      const SC = [440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66];
      let i = 2 + ((Math.random() * 3) | 0);
      const n = 5 + ((Math.random() * 3) | 0);
      for (let k = 0; k < n; k++) {
        if (k === n - 1) i = Math.random() < 0.5 ? 2 : 5;
        const d = (k === n - 1 ? 3 : Math.random() < 0.3 ? 2 : 1) * STEP;
        this.flute(tm, SC[i], d * 0.95, 0.05, this.music);
        tm += d;
        i = clamp(i + [-2, -1, 1, 1, 2][(Math.random() * 5) | 0], 0, SC.length - 1);
      }
    },
    chet() {
      if (!this.ac) return; const tm = this.ac.currentTime;
      this.noise(tm, 0.12, 'highpass', 1800, 0.35);
      this.tone(tm, 1500, 0.18, 'sine', 0.12, 250);
      this.noise(tm + 0.05, 1.1, 'lowpass', 900, 0.07, 1, 0.25); // crowd cheer
      [880, 987.77, 1174.66].forEach((f, i) => this.flute(tm + 0.1 + i * 0.09, f, 0.12, 0.07));
    },
    lose() {
      if (!this.ac) return; const tm = this.ac.currentTime;
      this.noise(tm, 0.15, 'highpass', 1500, 0.35);
      [1174.66, 987.77, 880, 739.99, 659.25, 587.33].forEach((f, i) => this.flute(tm + 0.2 + i * 0.16, f, 0.2, 0.07));
    },
    pech() { if (this.ac) this.noise(this.ac.currentTime, 0.18, 'bandpass', 3200, 0.15, 2); },
    bird() {
      if (!this.ac) return; const tm = this.ac.currentTime;
      this.tone(tm, 900, 0.12, 'sawtooth', 0.05, 520); this.tone(tm + 0.15, 850, 0.12, 'sawtooth', 0.05, 480);
    },
    manja() {
      if (!this.ac) return; const tm = this.ac.currentTime;
      [587.33, 739.99, 880, 1174.66].forEach((f, i) => this.flute(tm + i * 0.07, f, 0.1, 0.07));
    },
  };

  CC.Audio = audio;
})();
