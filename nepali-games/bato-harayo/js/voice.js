/* Bato Harayo: character voices through the browser's speech engine. */
(() => {
  'use strict';
  const BH = (window.BH = window.BH || {});
  const { store } = BH.Util;
  const { getLang } = BH.I18n;
  const { VOICE } = BH.Story;
  const audio = BH.Audio;

  // ---------- Voices (Web Speech API: free, built into the browser) ----------
  const voice = {
    on: store.get('bh_voice', true) !== false,
    list: [],
    supported: 'speechSynthesis' in window,
    init() {
      if (!this.supported) return;
      const load = () => { this.list = speechSynthesis.getVoices(); };
      load();
      speechSynthesis.addEventListener('voiceschanged', load);
    },
    pick() { // a Nepali voice if the device has one, otherwise Hindi (reads Devanagari well)
      const v = this.list;
      if (getLang() === 'ne') return v.find((x) => /^ne/i.test(x.lang)) || v.find((x) => /^hi/i.test(x.lang)) || null;
      return v.find((x) => /^en-IN/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang) && x.localService) || v.find((x) => /^en/i.test(x.lang)) || null;
    },
    available() { return this.supported && !!this.pick(); },
    say(text, key) {
      if (!this.on || !this.supported || audio.muted) return;
      const v = this.pick();
      if (!v) return;
      const clean = text.replace(/["“”]/g, '').replace(/\.\.\./g, ', ').replace(/→/g, '').trim();
      if (!clean) return;
      const prof = VOICE[key] || VOICE.me;
      const u = new SpeechSynthesisUtterance(clean);
      u.voice = v; u.lang = v.lang; u.pitch = prof.pitch; u.rate = prof.rate; u.volume = prof.volume ?? 1;
      speechSynthesis.speak(u);
    },
    stop() { if (this.supported) speechSynthesis.cancel(); },
  };
  voice.init();

  BH.Voice = voice;
})();
