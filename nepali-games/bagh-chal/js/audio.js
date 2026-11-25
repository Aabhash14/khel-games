// Synthesised sound, no audio files: wooden clacks, brass ticks, a goat bleat, tiger growl and roar,
// temple bells, and a low madal pulse that speeds up and gets busier as goats fall.
(function (root) {
  'use strict';
  var ctx = null, master = null, music = null, noiseBuf = null, shaper = null;
  var muted = false;
  try { muted = localStorage.getItem('bagh.muted') === '1'; } catch (e) { /* private mode */ }

  function ac() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      shaper = ctx.createWaveShaper();
      var curve = new Float32Array(1024);
      for (var k = 0; k < 1024; k++) { var x = k / 512 - 1; curve[k] = Math.tanh(x * 3.2); }
      shaper.curve = curve;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function env(g, at, a, peak, d) {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  }
  function tone(o) {
    var c = ac(); if (!c) return;
    var at = c.currentTime + (o.t || 0), a = o.a || 0.005, d = o.d || 0.2;
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, at);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, at + a + d);
    env(g, at, a, o.v || 0.3, d);
    osc.connect(g); g.connect(o.bus || master);
    osc.start(at); osc.stop(at + a + d + 0.05);
  }
  function noise(o) {
    var c = ac(); if (!c) return;
    var at = c.currentTime + (o.t || 0), a = o.a || 0.003, d = o.d || 0.1;
    var s = c.createBufferSource(); s.buffer = noiseBuf;
    var fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 2000, at); fl.Q.value = o.q || 1;
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, at + a + d);
    var g = c.createGain(); env(g, at, a, o.v || 0.3, d);
    s.connect(fl); fl.connect(g); g.connect(o.bus || master);
    s.start(at, Math.random()); s.stop(at + a + d + 0.05);
  }

  // wooden token on a wooden board
  function clack(pitch, v) {
    pitch = pitch || 1; v = v || 1;
    noise({ f: 2400 * pitch, q: 5, d: 0.04, v: 0.5 * v });
    tone({ f: 420 * pitch, f2: 230 * pitch, d: 0.07, v: 0.35 * v, type: 'triangle' });
    tone({ f: 1250 * pitch, d: 0.03, v: 0.12 * v });
  }
  function bell(f, t, v, len) {
    [1, 2.76, 5.4].forEach(function (m, i) { tone({ f: f * m, t: t || 0, a: 0.002, d: (len || 1.4) / (i + 1), v: (v || 0.18) / (i + 1.4) }); });
  }
  function growl(len, v, base) {
    var c = ac(); if (!c) return;
    var at = c.currentTime; len = len || 0.6; v = v || 0.35; base = base || 72;
    var o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(base, at); o.frequency.linearRampToValueAtTime(base * 1.25, at + len * 0.4); o.frequency.linearRampToValueAtTime(base * 0.8, at + len);
    var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 23; lg.gain.value = 0.5;
    var trem = c.createGain(); trem.gain.value = 0.5;
    lfo.connect(lg); lg.connect(trem.gain);
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 3;
    var g = c.createGain(); env(g, at, 0.06, v, len);
    o.connect(trem); trem.connect(lp); lp.connect(g); g.connect(master);
    o.start(at); lfo.start(at); o.stop(at + len + 0.1); lfo.stop(at + len + 0.1);
    noise({ type: 'bandpass', f: 380, q: 1.5, a: 0.05, d: len, v: v * 0.5 });
  }
  function roar() {
    var c = ac(); if (!c) return;
    var at = c.currentTime, len = 0.85;
    var o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, at); o.frequency.exponentialRampToValueAtTime(175, at + 0.18); o.frequency.exponentialRampToValueAtTime(62, at + len);
    var f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 2.5;
    f1.frequency.setValueAtTime(500, at); f1.frequency.exponentialRampToValueAtTime(900, at + 0.2); f1.frequency.exponentialRampToValueAtTime(300, at + len);
    var pre = c.createGain(); pre.gain.value = 1.6;
    var g = c.createGain(); env(g, at, 0.04, 0.5, len);
    o.connect(pre); pre.connect(shaper); shaper.connect(f1); f1.connect(g); g.connect(master);
    o.start(at); o.stop(at + len + 0.1);
    noise({ type: 'bandpass', f: 700, f2: 260, q: 1.2, a: 0.03, d: len, v: 0.3 });
  }
  // "meh-eh-eh": a reedy sawtooth with a fast wobble through two formants
  function bleat() {
    var c = ac(); if (!c) return;
    var at = c.currentTime + 0.02, len = 0.62;
    var o = c.createOscillator(); o.type = 'sawtooth';
    var base = 470 + Math.random() * 90;
    o.frequency.setValueAtTime(base, at); o.frequency.linearRampToValueAtTime(base * 1.08, at + 0.12); o.frequency.linearRampToValueAtTime(base * 0.86, at + len);
    var vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 11; vg.gain.value = base * 0.05;
    vib.connect(vg); vg.connect(o.frequency);
    var am = c.createGain(); am.gain.value = 0.6;
    var amo = c.createOscillator(), amg = c.createGain(); amo.frequency.value = 11; amg.gain.value = 0.4;
    amo.connect(amg); amg.connect(am.gain);
    var f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 850; f1.Q.value = 4;
    var f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2100; f2.Q.value = 6;
    var g = c.createGain(); env(g, at, 0.03, 0.55, len);
    o.connect(am); am.connect(f1); am.connect(f2); f1.connect(g); f2.connect(g); g.connect(master);
    [o, vib, amo].forEach(function (x) { x.start(at); x.stop(at + len + 0.1); });
  }

  // ---- madal pulse ----
  var timer = null, beat = 0, nextAt = 0, tension = 0, playing = false;
  function dhin(at, v) { // low head
    var c = ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(118, at); o.frequency.exponentialRampToValueAtTime(58, at + 0.22);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
    o.connect(g); g.connect(music); o.start(at); o.stop(at + 0.4);
  }
  function ta(at, v) { // high head slap
    var c = ctx, s = c.createBufferSource(); s.buffer = noiseBuf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 2.5;
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
    s.connect(f); f.connect(g); g.connect(music); s.start(at, Math.random()); s.stop(at + 0.1);
    var o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(330, at); o.frequency.exponentialRampToValueAtTime(260, at + 0.08);
    og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(v * 0.6, at + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
    o.connect(og); og.connect(music); o.start(at); o.stop(at + 0.12);
  }
  function schedule() {
    if (!ctx || !playing) return;
    var bpm = 64 + tension * 15, step = 60 / bpm / 2; // eighth notes
    while (nextAt < ctx.currentTime + 0.25) {
      var b = beat % 8, lvl = 0.12 + tension * 0.04;
      if (b === 0) dhin(nextAt, lvl * 1.6);
      if (b === 3 && tension >= 1) dhin(nextAt, lvl * 0.9);
      if (b === 4) ta(nextAt, lvl * 0.8);
      if (b === 6 && tension >= 2) ta(nextAt, lvl * 0.5);
      if ((b === 2 || b === 7) && tension >= 3) ta(nextAt, lvl * 0.4);
      if (b % 2 === 1 && tension >= 4) ta(nextAt, lvl * 0.3);
      nextAt += step; beat++;
    }
  }

  root.BCAudio = {
    unlock: function () { ac(); },
    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = m;
      try { localStorage.setItem('bagh.muted', m ? '1' : '0'); } catch (e) { /* fine */ }
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.03);
    },
    // tension 0..5: goats eaten (plus one when a goat is hanging)
    pulse: function (on, t) {
      if (t != null) tension = Math.max(0, Math.min(5, t));
      if (on && !playing) {
        if (!ac()) return;
        playing = true; beat = 0; nextAt = ctx.currentTime + 0.1;
        timer = setInterval(schedule, 60); schedule();
      } else if (!on && playing) {
        playing = false; clearInterval(timer); timer = null;
      }
    },
    sfx: function (name) {
      if (muted || !ac()) return;
      switch (name) {
        case 'pick': tone({ f: 1900, d: 0.05, v: 0.08 }); tone({ f: 2850, d: 0.04, v: 0.04 }); break;
        case 'hover': tone({ f: 1500, d: 0.03, v: 0.05 }); break;
        case 'place': clack(0.9, 1.1); tone({ f: 120, f2: 70, d: 0.12, v: 0.25 }); break;
        case 'gstep': clack(1.1, 0.9); break;
        case 'tstep': clack(0.8, 1); if (Math.random() < 0.35) growl(0.35, 0.16, 80); break;
        case 'leap': noise({ type: 'highpass', f: 900, f2: 3000, a: 0.08, d: 0.25, v: 0.15 }); break;
        case 'roar': roar(); clack(0.7, 1.3); break;
        case 'bleat': bleat(); break;
        case 'thud': clack(0.75, 0.8); break;
        case 'nope': tone({ f: 220, f2: 180, d: 0.12, v: 0.15, type: 'triangle' }); break;
        case 'trap': growl(0.7, 0.3, 60); bell(660, 0.15, 0.2, 1.6); break;
        case 'growl': growl(0.6, 0.28, 70); break;
        case 'win': [523, 659, 784, 1046].forEach(function (f, i) { bell(f, i * 0.16, 0.2, 1.8); }); break;
        case 'lose': growl(0.9, 0.35, 64); bell(330, 0.3, 0.14, 2); break;
        case 'draw': bell(440, 0, 0.16, 1.4); bell(440, 0.5, 0.12, 1.4); break;
        case 'tick': tone({ f: 2400, d: 0.03, v: 0.05 }); break;
        default: break;
      }
    },
  };
})(this);
