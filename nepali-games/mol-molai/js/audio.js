// Sound: spoken voices (Web Speech API) and generated sound effects and ambience (Web Audio).
(() => {
  'use strict';
  window.MM = window.MM || {};
  const { store, rand, clamp } = MM.Util;
  const { KEEPERS } = MM.Data;
  const shared = MM.shared;

  // g: which voice to use (female / male). pitch and rate stay gentle: big pitch shifts make the words hard to follow.
  // 'me' and 'thought' use the player's chosen voice; each shopkeeper's voice comes from KEEPERS (gender, age).
  const VOICE = { me: { pitch: 1.04, rate: 0.95 }, thought: { pitch: 1.0, rate: 0.88, volume: 0.75 } };
  for (const [id, k] of Object.entries(KEEPERS)) VOICE[id] = { g: k.g, pitch: k.pitch, rate: k.rate };
  const FEMALE_VOICE = /hemkala|swara|kalpana|neerja|heera|aria|jenny|zira|sonia|libby|hazel|susan|samantha|veena|lekha|female|woman|google हिन्दी|google hindi/i;
  const MALE_VOICE = /sagar|madhur|hemant|prabhat|ravi|guy|david|mark|ryan|george|daniel|rishi|male|\bman\b/i;

  // ---------- Voices (Web Speech API: free, built into the browser) ----------
  const voice = {
    on: store.get('mm_voice', true) !== false,
    list: [],
    supported: 'speechSynthesis' in window,
    init() {
      if (!this.supported) return;
      const load = () => { this.list = speechSynthesis.getVoices(); };
      load();
      speechSynthesis.addEventListener('voiceschanged', load);
    },
    me: store.get('mm_mevoice', 'f') === 'm' ? 'm' : 'f',
    genderOf(x) { return FEMALE_VOICE.test(x.name) ? 'f' : MALE_VOICE.test(x.name) ? 'm' : null; },
    // Best voice for this language and gender: real Nepali first (Edge: Hemkala, Sagar), then Hindi; natural voices are clearest.
    pick(g) {
      const tiers = shared.lang === 'ne' ? [/^ne/i, /^hi/i] : [/^en-IN/i, /^en/i];
      for (const re of tiers) {
        const pool = this.list.filter((x) => re.test(x.lang));
        if (!pool.length) continue;
        const score = (x) => { const xg = this.genderOf(x); return (!g ? 0 : xg === g ? 10 : xg ? 0 : 4) + (/natural|online|neural/i.test(x.name) ? 3 : 0) + (x.localService ? 0 : 1); };
        return pool.sort((a, b) => score(b) - score(a))[0];
      }
      return null;
    },
    hasNepali() { return this.list.some((x) => /^ne/i.test(x.lang)); },
    speakable(text) {
      let s = text.replace(/["“”✔()]/g, ' ').replace(/\.\.\.|…/g, ', ');
      if (shared.lang === 'ne') s = s.replace(/रु\.\s*([०-९,]+)/g, (_, n) => `${n.replace(/,/g, '')} रुपैयाँ`);
      else s = s.replace(/Rs\s*([\d,]+)/g, (_, n) => `${n.replace(/,/g, '')} rupees`);
      return s.replace(/\s+/g, ' ').trim();
    },
    say(text, key) {
      if (!this.on || !this.supported || audio.muted) return;
      const prof = VOICE[key] || VOICE.me, g = prof.g || this.me;
      const v = this.pick(g);
      if (!v) return;
      const clean = this.speakable(text);
      if (!clean) return;
      // Only if the device has no voice of the right gender, fake it with pitch.
      const vg = this.genderOf(v), fix = vg === g ? 1 : g === 'f' ? 1.18 : 0.84;
      const u = new SpeechSynthesisUtterance(clean);
      u.voice = v; u.lang = v.lang; u.pitch = clamp(prof.pitch * fix, 0.6, 1.5); u.rate = prof.rate; u.volume = prof.volume ?? 1;
      speechSynthesis.speak(u);
    },
    stop() { if (this.supported) speechSynthesis.cancel(); },
  };

  // ---------- Audio (all generated) ----------
  const audio = {
    ac: null, master: null, noiseBuf: null, crowd: null, chatter: null, scene: 'menu',
    muted: !!store.get('mm_muted', false),
    timers: { cycle: 5, horn: 16, pigeon: 3, temple: 9, chat: 0 },
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
        this.crowd = loop('bandpass', 480, 0.6);
        this.chatter = loop('bandpass', 1400, 2.5);
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      this.setScene(this.scene);
    },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
    setScene(s) {
      this.scene = s;
      if (!this.ac) return;
      const now = this.ac.currentTime;
      this.crowd.gain.setTargetAtTime(s === 'lane' ? 0.07 : s === 'shop' ? 0.035 : 0.03, now, 0.6);
      this.chatter.gain.setTargetAtTime(s === 'lane' ? 0.012 : 0.006, now, 0.6);
    },
    now() { return this.ac.currentTime; },
    ok() { return this.ac && this.ac.state === 'running'; },
    tone(tm, f, dur, type, vol, f2) {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, tm); if (f2) o.frequency.exponentialRampToValueAtTime(f2, tm + dur);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + Math.min(0.03, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
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
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.05);
      g.gain.setValueAtTime(vol, tm + Math.max(0.06, dur - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); lfo.start(tm); o.stop(tm + dur + 0.02); lfo.stop(tm + dur + 0.02);
    },
    madal(tm, low) { this.tone(tm, low ? 95 : 190, 0.18, 'sine', 0.22, low ? 60 : 140); this.noise(tm, 0.05, 'bandpass', low ? 300 : 900, 0.12); },
    tick() { if (!this.ok()) return; this.tone(this.now(), 1800, 0.03, 'square', 0.015); },
    blip(who) {
      if (!this.ok() || (voice.on && voice.pick(null) && !this.muted)) return; // voices already speak
      const p = (VOICE[who] || VOICE.me).pitch, tm = this.now();
      for (let k = 0; k < 4; k++) this.tone(tm + k * 0.08, 260 * p * rand(0.85, 1.25), 0.06, 'triangle', 0.035);
    },
    coin() { if (!this.ok()) return; const tm = this.now(); [2637, 3136, 3951].forEach((f, k) => this.tone(tm + k * 0.06, f, 0.25, 'sine', 0.05)); },
    deal() { if (!this.ok()) return; this.coin(); const tm = this.now() + 0.2; [1, 0, 1, 1].forEach((l, k) => this.madal(tm + k * 0.14, !l)); },
    bleat() {
      if (!this.ok()) return;
      const tm = this.now() + 0.5, o = this.ac.createOscillator(), lfo = this.ac.createOscillator(), lg = this.ac.createGain(), g = this.ac.createGain(), f = this.ac.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = 430; lfo.frequency.value = 11; lg.gain.value = 40; lfo.connect(lg).connect(o.frequency);
      f.type = 'lowpass'; f.frequency.value = 1600;
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(0.06, tm + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, tm + 0.7);
      o.connect(f).connect(g).connect(this.master); o.start(tm); lfo.start(tm); o.stop(tm + 0.75); lfo.stop(tm + 0.75);
    },
    caught() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 140, 0.5, 'sawtooth', 0.06, 70); this.noise(tm, 0.3, 'lowpass', 400, 0.2); },
    grumble() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 120, 0.35, 'sawtooth', 0.05, 90); this.noise(tm + 0.1, 0.25, 'bandpass', 600, 0.1); },
    callback() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 1100, 0.14, 'sine', 0.05, 1600); this.tone(tm + 0.2, 1100, 0.2, 'sine', 0.05, 1700); },
    footsteps(dur) { if (!this.ok()) return; const tm = this.now(), n = Math.max(2, Math.round(dur / 0.22)); for (let k = 0; k < n; k++) this.noise(tm + k * 0.22, 0.07, 'lowpass', 600, 0.2); },
    moo() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 150, 1.1, 'sawtooth', 0.04, 120); },
    bell() { const tm = this.now(); [2100, 2800].forEach((f) => { this.tone(tm, f, 0.4, 'sine', 0.025); this.tone(tm + 0.16, f, 0.5, 'sine', 0.025); }); },
    horn() { const tm = this.now(); for (const d of [0, 0.3]) { this.tone(tm + d, 440, 0.2, 'square', 0.015); this.tone(tm + d, 554, 0.2, 'square', 0.012); } },
    pigeon() { const tm = this.now(); this.tone(tm, 360, 0.25, 'sine', 0.035, 300); this.tone(tm + 0.3, 330, 0.4, 'sine', 0.03, 280); },
    temple() { const tm = this.now(); [[880, 0.04, 2.2], [1320, 0.02, 1.6], [2210, 0.01, 1]].forEach(([f, v, d]) => this.tone(tm, f, d, 'sine', v)); },
    ending(kind) {
      if (!this.ok()) return;
      const tm = this.now(), SC = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];
      const seq = kind === 'happy' ? [0, 2, 3, 4, 5, 4, 5] : kind === 'ok' ? [0, 1, 2, 3, 2, 3] : [3, 2, 1, 0];
      seq.forEach((i, k) => this.flute(tm + 0.3 + k * 0.3, SC[i], 0.32, 0.05));
      if (kind === 'happy') for (let k = 0; k < 8; k++) this.madal(tm + 0.3 + k * 0.26, k % 4 === 0);
    },
    tickAmb(dt, state, view) {
      if (!this.ok()) return;
      const T = this.timers, lane = state !== 'play' || view === 'lane';
      for (const k in T) T[k] -= dt;
      if (T.cycle <= 0) { if (lane) this.bell(); T.cycle = rand(9, 20); }
      if (T.horn <= 0) { if (lane && state === 'play') this.horn(); T.horn = rand(18, 40); }
      if (T.pigeon <= 0) { this.pigeon(); T.pigeon = rand(8, 18); }
      if (T.temple <= 0) { this.temple(); T.temple = rand(16, 30); }
    },
  };

  MM.Audio = { voice, audio };
})();
