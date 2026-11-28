/* Pro Scout — generated sound effects and the mute buttons. */
(() => {
  'use strict';

  window.PS = window.PS || {};
  const { store } = PS.Core;

  // ---------- Sound (generated, no files) ----------
  let actx = null;
  let muted = store.get('ps-muted', false);
  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    if (muted) return;
    try {
      actx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch { /* audio unavailable */ }
  }
  const sfx = {
    ok() { tone(660, 0.12, 'triangle', 0.14); tone(990, 0.22, 'triangle', 0.14, 0.09); },
    no() { tone(196, 0.18, 'sawtooth', 0.06); tone(147, 0.3, 'sawtooth', 0.06, 0.12); },
    reveal() { tone(520, 0.07, 'square', 0.04); tone(780, 0.09, 'square', 0.04, 0.05); },
    tick() { tone(880, 0.05, 'triangle', 0.06); },
    gold() { [784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, i * 0.07)); },
  };
  const SPEAKER_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>';
  const SPEAKER_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  function paintMute() {
    document.querySelectorAll('.mute').forEach((b) => {
      b.innerHTML = muted ? SPEAKER_OFF : SPEAKER_ON;
      b.setAttribute('aria-pressed', String(muted));
      b.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
    });
  }
  document.querySelectorAll('.mute').forEach((b) => b.addEventListener('click', () => { muted = !muted; store.set('ps-muted', muted); paintMute(); if (!muted) sfx.tick(); }));

  PS.Sound = { sfx, paintMute };
})();
