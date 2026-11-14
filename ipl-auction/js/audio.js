// Synthesised sound, no files.
// Base layer: wooden paddle knocks, bells for going once/twice, the gavel, a crowd murmur.
// Tension layer that climbs with the price:
//   ₹5 Cr  heartbeat          ₹10 Cr + low drone that rises with the price
//   ₹15 Cr + snare roll       ₹20 Cr + high riser and faster everything
//   ₹25 Cr + full roar        past the IPL record: air horn
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});

  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let crowd = null;
  let muted = false;
  try { muted = localStorage.getItem('ipla.muted') === '1'; } catch { /* private mode */ }

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.8;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp).connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const unlock = () => ac();
  const isMuted = () => muted;
  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('ipla.muted', m ? '1' : '0'); } catch { /* fine */ }
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.02);
  }

  function env(g, at, a, peak, d) {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  }
  function tone({ type = 'sine', f = 440, f2 = null, t = 0, at = null, a = 0.004, d = 0.2, v = 0.3, lp = null }) {
    const c = ac(); if (!c) return;
    const when = at != null ? at : c.currentTime + t;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, when);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, when + a + d);
    env(g, when, a, v, d);
    if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl).connect(g); } else o.connect(g);
    g.connect(master);
    o.start(when); o.stop(when + a + d + 0.05);
  }
  function hiss({ t = 0, at = null, a = 0.005, d = 0.1, v = 0.3, f = 1200, q = 1, type = 'bandpass' }) {
    const c = ac(); if (!c) return;
    const when = at != null ? at : c.currentTime + t;
    const src = c.createBufferSource(); src.buffer = noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain(); env(g, when, a, v, d);
    src.connect(fl).connect(g).connect(master);
    src.start(when, Math.random()); src.stop(when + a + d + 0.05);
  }

  // ---------- one-shots ----------
  // Paddle knock. Mine is brighter; both climb in pitch as the price climbs.
  function paddle(mine = false, price = 0) {
    const lift = Math.min(1.8, 1 + price / 3000);
    tone({ type: 'triangle', f: (mine ? 520 : 330) * lift, f2: (mine ? 260 : 180) * lift, d: 0.09, v: mine ? 0.5 : 0.28 });
    hiss({ f: mine ? 2600 : 1800, q: 3, d: 0.04, v: mine ? 0.35 : 0.18 });
  }
  // Going once / twice. At big prices it becomes a deep bong.
  function bell(n = 1, price = 0) {
    if (price >= 1000) {
      const f = n === 1 ? 196 : 174.6;
      tone({ type: 'sine', f, d: 1.4, v: 0.4 });
      tone({ type: 'sine', f: f * 2.76, d: 0.8, v: 0.12 });
      tone({ type: 'sine', f: f / 2, f2: f / 2.2, d: 1.2, v: 0.3 });
      return;
    }
    const f = n === 1 ? 880 : 988;
    tone({ type: 'sine', f, d: 0.6, v: 0.18 });
    tone({ type: 'sine', f: f * 2.01, d: 0.35, v: 0.06 });
  }
  function gavel(big = false) {
    tone({ type: 'sine', f: big ? 110 : 140, f2: big ? 40 : 60, d: big ? 0.35 : 0.18, v: 0.95 });
    hiss({ f: 900, q: 0.8, d: 0.07, v: 0.6, type: 'lowpass' });
  }
  // Brass stab: a short chord of filtered saws.
  function brass(root, t = 0, d = 0.35, v = 0.09) {
    [1, 1.26, 1.5, 2].forEach((m) => tone({ type: 'sawtooth', f: root * m, t, a: 0.02, d, v, lp: 2400 }));
  }
  function sold(price = 0, mine = false) {
    const big = price >= 1000 || mine;
    gavel(price >= 1500);
    hiss({ t: 0.05, a: 0.12, d: big ? 1.8 : 0.9, v: big ? 0.55 : 0.28, f: 1100, q: 0.4 });
    hiss({ t: 0.1, a: 0.2, d: big ? 1.5 : 0.7, v: big ? 0.32 : 0.15, f: 2600, q: 0.6 });
    if (price >= 1500) { brass(196, 0.08, 0.5, 0.1); brass(261.6, 0.36, 0.9, 0.11); }
    else if (big) [523, 659, 784].forEach((f, i) => tone({ type: 'triangle', f, t: 0.08 + i * 0.07, d: 0.4, v: 0.12 }));
  }
  function unsold() {
    tone({ type: 'sine', f: 180, f2: 110, d: 0.4, v: 0.35 });
    tone({ type: 'sine', f: 150, f2: 90, t: 0.12, d: 0.45, v: 0.25 });
  }
  function sting() {
    [392, 494, 587, 784].forEach((f, i) => tone({ type: 'square', f, t: i * 0.06, d: 0.18, v: 0.07 }));
  }
  function tap() { tone({ type: 'triangle', f: 700, f2: 500, d: 0.05, v: 0.2 }); }
  function cheer() {
    hiss({ a: 0.3, d: 2.4, v: 0.45, f: 1200, q: 0.4 });
    [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f, t: 0.1 + i * 0.12, d: 0.5, v: 0.14 }));
  }
  // Crossing ₹5 / 10 / 15 / 20 / 25 Cr: timpani hit, a brass stab that rises each tier, and the crowd going "ooh".
  function milestone(tier) {
    tone({ type: 'sine', f: 80, f2: 42, d: 0.6, v: 0.8 });
    brass(130.8 * Math.pow(2, (tier - 1) * 2 / 12), 0.02, 0.45 + tier * 0.05, 0.08 + tier * 0.01);
    hiss({ t: 0.05, a: 0.25, d: 0.9 + tier * 0.15, v: 0.18 + tier * 0.05, f: 700 + tier * 120, q: 0.9 });
  }
  // Jump bid: a whoosh up into a hit.
  function jump() {
    hiss({ a: 0.18, d: 0.08, v: 0.35, f: 3000, q: 0.7 });
    tone({ type: 'sawtooth', f: 220, f2: 660, d: 0.22, v: 0.08, lp: 3000 });
    tone({ type: 'sine', f: 90, f2: 50, t: 0.2, d: 0.3, v: 0.6 });
  }
  // A team drops out: a falling blip.
  function drop() { tone({ type: 'triangle', f: 600, f2: 300, d: 0.18, v: 0.12 }); }
  // New IPL record: air horn, timpani rolls and a roar.
  function record() {
    [440, 554, 659].forEach((f) => {
      const c = ac(); if (!c) return;
      const at = c.currentTime;
      const o = c.createOscillator(); const g = c.createGain(); const lfo = c.createOscillator(); const lg = c.createGain();
      o.type = 'square'; o.frequency.value = f; lfo.frequency.value = 6; lg.gain.value = 8;
      lfo.connect(lg).connect(o.frequency);
      env(g, at, 0.03, 0.07, 1.1);
      o.connect(g).connect(master); o.start(at); lfo.start(at); o.stop(at + 1.3); lfo.stop(at + 1.3);
    });
    for (let i = 0; i < 6; i++) tone({ type: 'sine', f: 70, f2: 45, t: i * 0.09, d: 0.25, v: 0.7 });
    hiss({ t: 0.1, a: 0.3, d: 2.6, v: 0.6, f: 1300, q: 0.4 });
  }

  // ---------- tension layer ----------
  const TIERS = [500, 1000, 1500, 2000, 2500];
  const tierOf = (price) => TIERS.filter((x) => price >= x).length;
  let tens = null;

  function tensionStart() {
    const c = ac(); if (!c || tens) return;
    // drone: two detuned saws through a lowpass that opens with the price
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 180; fl.Q.value = 6;
    const g = c.createGain(); g.gain.value = 0.0001;
    const o1 = c.createOscillator(); const o2 = c.createOscillator(); const o3 = c.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth'; o3.type = 'sine';
    o1.frequency.value = 55; o2.frequency.value = 55.6; o3.frequency.value = 880;
    const g3 = c.createGain(); g3.gain.value = 0.0001;
    o1.connect(fl); o2.connect(fl); fl.connect(g).connect(master);
    o3.connect(g3).connect(master);
    o1.start(); o2.start(); o3.start();
    tens = { price: 0, bids: 0, level: 0, fl, g, o1, o2, o3, g3, nextBeat: c.currentTime + 0.1, nextRoll: c.currentTime + 0.1, timer: null };
    tens.timer = setInterval(scheduler, 40);
  }

  function scheduler() {
    if (!tens || !ctx) return;
    const now = ctx.currentTime;
    const L = tens.level;
    const bpm = 64 + L * 16 + Math.min(24, tens.bids);
    // heartbeat (lub-dub)
    if (L >= 1) {
      while (tens.nextBeat < now + 0.12) {
        const at = tens.nextBeat;
        tone({ type: 'sine', f: 62, f2: 40, at, a: 0.006, d: 0.16, v: 0.35 + L * 0.08 });
        tone({ type: 'sine', f: 55, f2: 38, at: at + 0.17, a: 0.006, d: 0.14, v: 0.22 + L * 0.06 });
        tens.nextBeat += 60 / bpm;
      }
    } else tens.nextBeat = now + 0.1;
    // snare roll from ₹15 Cr, getting faster and louder
    if (L >= 3) {
      const rate = 10 + (L - 3) * 6;
      while (tens.nextRoll < now + 0.12) {
        hiss({ at: tens.nextRoll, a: 0.002, d: 0.045, v: 0.05 + (L - 3) * 0.04 + Math.random() * 0.02, f: 2400, q: 0.8 });
        tens.nextRoll += 1 / rate;
      }
    } else tens.nextRoll = now + 0.1;
  }

  // Call on every bid with the current price (lakh) and the number of bids so far.
  function tension(price, bids = 0) {
    tensionStart();
    if (!tens) return;
    const before = tens.level;
    tens.price = price; tens.bids = bids;
    tens.level = tierOf(price);
    const t = ctx.currentTime;
    const L = tens.level;
    const f = 55 * Math.pow(2, Math.min(price, 3500) / 2500);
    tens.o1.frequency.setTargetAtTime(f, t, 0.3);
    tens.o2.frequency.setTargetAtTime(f * 1.012, t, 0.3);
    tens.g.gain.setTargetAtTime(L >= 2 ? 0.04 + (L - 2) * 0.025 : 0.0001, t, 0.4);
    tens.fl.frequency.setTargetAtTime(180 + L * 260 + Math.min(bids, 30) * 10, t, 0.4);
    tens.o3.frequency.setTargetAtTime(700 + Math.min(price, 3500) / 3, t, 0.5);
    tens.g3.gain.setTargetAtTime(L >= 4 ? 0.012 + (L - 4) * 0.01 : 0.0001, t, 0.5);
    heat(Math.min(1, 0.1 + L * 0.18 + Math.min(bids, 20) / 60));
    return L > before ? L : 0; // a tier crossed (caller plays the milestone)
  }

  function tensionOff() {
    if (!tens) return;
    const T = tens; tens = null;
    clearInterval(T.timer);
    const t = ctx.currentTime;
    T.g.gain.setTargetAtTime(0.0001, t, 0.15); T.g3.gain.setTargetAtTime(0.0001, t, 0.15);
    setTimeout(() => { [T.o1, T.o2, T.o3].forEach((o) => { try { o.stop(); } catch { /* stopped */ } }); }, 700);
  }

  // ---------- crowd bed ----------
  function crowdOn() {
    const c = ac(); if (!c || crowd) return;
    const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 500; fl.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = 0.0001;
    src.connect(fl).connect(g).connect(master);
    src.start();
    crowd = { src, fl, g };
    heat(0);
  }
  function heat(h) {
    if (!crowd) return;
    crowd.g.gain.setTargetAtTime(0.025 + h * 0.14, ctx.currentTime, 0.25);
    crowd.fl.frequency.setTargetAtTime(420 + h * 1000, ctx.currentTime, 0.3);
  }
  function crowdOff() {
    tensionOff();
    if (!crowd) return;
    const { src, g } = crowd; crowd = null;
    g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
    setTimeout(() => { try { src.stop(); } catch { /* already stopped */ } }, 800);
  }

  // ---------- match sounds ----------
  function crack(v = 0.5) {
    hiss({ f: 3200, q: 2, d: 0.03, v });
    tone({ type: 'triangle', f: 900, f2: 400, d: 0.05, v: v * 0.5 });
  }
  function roar(size = 1) {
    hiss({ t: 0.06, a: 0.15, d: 0.8 + size * 0.7, v: 0.2 + size * 0.2, f: 1000 + size * 300, q: 0.5 });
    hiss({ t: 0.1, a: 0.2, d: 0.6 + size * 0.6, v: 0.1 + size * 0.12, f: 2600, q: 0.7 });
  }
  function dot() { tone({ type: 'sine', f: 240, f2: 200, d: 0.06, v: 0.08 }); }
  function single() { crack(0.18); }
  function four() { crack(0.55); roar(1); }
  function six() { crack(0.7); roar(2); brass(261.6, 0.15, 0.5, 0.08); }
  // Stumps rattle. good = the crowd is with you (you took the wicket).
  function wicket(good = true) {
    hiss({ f: 1800, q: 1.5, d: 0.12, v: 0.5 });
    tone({ type: 'square', f: 300, f2: 120, d: 0.2, v: 0.1, lp: 1500 });
    if (good) roar(1.6);
    else { tone({ type: 'sine', f: 220, f2: 140, t: 0.15, d: 0.9, v: 0.18 }); hiss({ t: 0.1, a: 0.3, d: 1, v: 0.18, f: 500, q: 0.6 }); }
  }
  function applause() {
    for (let i = 0; i < 14; i++) hiss({ t: i * 0.07 + Math.random() * 0.05, a: 0.003, d: 0.05, v: 0.12 + Math.random() * 0.1, f: 1500 + Math.random() * 1500, q: 1.2 });
  }

  IPLA.audio = { unlock, isMuted, setMuted, paddle, bell, gavel, sold, unsold, sting, tap, cheer, milestone, jump, drop, record, tension, tensionOff, crowdOn, heat, crowdOff, tierOf, dot, single, four, six, wicket, applause };
})();
