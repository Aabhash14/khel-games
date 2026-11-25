// Tihar Diyo: every sound is synthesised with Web Audio. No files.
// Layers: night ambience (breeze, crickets, far temple bells) is always there; a tanpura-like drone swells
// as more diyos light; a soft madal comes in for the last stretch; the finish rings a ghanti chord and plays
// a short deusi-bhailo style tune.
(function (root) {
  'use strict';
  var ctx = null, master, sfx, amb, music, rev, noiseBuf, droneG, madalG, timers = [];
  var muted = false, scene = 'none', intensity = 0, madalOn = false, nextBeat = 0, beat = 0;
  var STORE = 'tihar-diyo-v1';
  try { muted = !!(JSON.parse(localStorage.getItem(STORE) || '{}').muted); } catch (e) { /* storage blocked */ }

  function mkNoise() {
    var b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function mkIR(sec) {
    var n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.4); }
    return b;
  }
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, f0, f1, t, dur, peak, dest, a) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a || 0.004, peak, dur);
    o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + (a || 0.004) + dur + 0.05);
    return o;
  }
  function noise(t, dur, peak, type, f0, f1, q, dest, a) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = q || 1;
    env(g, t, a || 0.003, peak, dur);
    s.connect(f); f.connect(g); g.connect(dest || sfx);
    s.start(t, Math.random()); s.stop(t + (a || 0.003) + dur + 0.05);
  }
  function send(node, amt) { var g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(rev); }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    rev = ctx.createConvolver(); rev.buffer = mkIR(2.8);
    var rg = ctx.createGain(); rg.gain.value = 0.5; rev.connect(rg); rg.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(master); send(sfx, 0.18);
    amb = ctx.createGain(); amb.gain.value = 0.7; amb.connect(master);
    music = ctx.createGain(); music.gain.value = 0.7; music.connect(master); send(music, 0.25);
    noiseBuf = mkNoise();
    // breeze
    var src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340;
    var bg = ctx.createGain(); bg.gain.value = 0.035;
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 160;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    src.connect(lp); lp.connect(bg); bg.connect(amb); src.start();
    // tanpura-like drone: Sa and Pa, gently beating
    droneG = ctx.createGain(); droneG.gain.value = 0;
    var dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 820; dlp.Q.value = 0.6;
    [73.42, 110, 146.83, 147.3].forEach(function (f) {
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      var g = ctx.createGain(); g.gain.value = f < 100 ? 0.5 : 0.28;
      o.connect(g); g.connect(dlp); o.start();
    });
    dlp.connect(droneG); droneG.connect(music);
    madalG = ctx.createGain(); madalG.gain.value = 0; madalG.connect(music);
    timers.push(setInterval(ambientTick, 250));
    // the night ambience and drone stop while the game is in the background
    document.addEventListener('visibilitychange', function () {
      if (!ctx) return;
      if (document.hidden) { if (ctx.state === 'running') ctx.suspend(); }
      else if (ctx.state === 'suspended') ctx.resume();
    });
  }

  // crickets, far bells, and the madal scheduler
  var nextBell = 4, nextCricket = 1, last = 0;
  function ambientTick() {
    if (!ctx || ctx.state !== 'running') return;
    var now = ctx.currentTime, dt = last ? now - last : 0.25; last = now;
    nextCricket -= dt; nextBell -= dt;
    if (nextCricket <= 0) {
      var f = 4200 + Math.random() * 600;
      for (var k = 0; k < 3 + Math.floor(Math.random() * 3); k++) osc('sine', f, f * 0.98, now + k * 0.07, 0.035, 0.006, amb, 0.004);
      nextCricket = 0.8 + Math.random() * 2.2;
    }
    if (nextBell <= 0) {
      bell(now, [660, 880, 990][Math.floor(Math.random() * 3)], 0.035, amb, 2.6);
      nextBell = 8 + Math.random() * 10;
    }
    // madal for the final stretch of a puzzle
    if (madalOn) {
      var spb = 60 / 96 / 2;
      if (nextBeat < now) nextBeat = now + 0.05;
      while (nextBeat < now + 0.4) {
        var st = beat % 8;
        if (st === 0 || st === 3 || st === 6) dhin(nextBeat, madalG);
        if (st === 2 || st === 5 || st === 7) ta(nextBeat, madalG, st === 7 ? 0.5 : 0.8);
        nextBeat += spb; beat++;
      }
    }
  }
  function dhin(t, dest, v) { osc('sine', 110, 62, t, 0.28, 0.5 * (v || 1), dest, 0.004); noise(t, 0.04, 0.12 * (v || 1), 'lowpass', 900, 0, 1, dest); }
  function ta(t, dest, v) { noise(t, 0.06, 0.28 * (v || 1), 'bandpass', 2400, 1800, 1.4, dest); osc('triangle', 340, 300, t, 0.07, 0.12 * (v || 1), dest); }

  // ghanti: inharmonic partials with long tails
  function bell(t, f, peak, dest, len) {
    var parts = [[1, 1, 1], [2.0, 0.35, 0.7], [2.76, 0.5, 0.55], [4.07, 0.2, 0.35], [5.4, 0.15, 0.25]];
    parts.forEach(function (p) { osc('sine', f * p[0], 0, t, (len || 3) * p[2], peak * p[1], dest || sfx, 0.002); });
    noise(t, 0.02, peak * 0.6, 'highpass', 3000, 0, 1, dest || sfx);
  }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function lead(t, m, dur, peak) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), v = ctx.createOscillator(), vg = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'triangle';
    o.frequency.value = mtof(m); o2.frequency.value = mtof(m) * 1.003;
    v.frequency.value = 5.5; vg.gain.value = mtof(m) * 0.008; v.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    f.type = 'lowpass'; f.frequency.value = 2400; f.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
    g.gain.setValueAtTime(peak * 0.8, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(music);
    [o, o2, v].forEach(function (x) { x.start(t); x.stop(t + dur + 0.12); });
  }

  // ---------- public ----------
  var API = {
    init: init,
    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      try { var d = JSON.parse(localStorage.getItem(STORE) || '{}'); d.muted = muted; localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) { /* fine */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
    },
    setScene: function (s) {
      scene = s;
      if (!ctx) return;
      if (s !== 'play') API.setIntensity(0);
    },
    // fraction of diyos lit, 0..1
    setIntensity: function (x) {
      intensity = x;
      if (!ctx) return;
      var now = ctx.currentTime;
      droneG.gain.setTargetAtTime(scene === 'play' ? 0.012 + 0.05 * x : 0.012, now, 0.6);
      var want = scene === 'play' && x >= 0.5;
      madalG.gain.setTargetAtTime(want ? 0.12 + 0.25 * (x - 0.5) : 0, now, 0.4);
      madalOn = want || madalG.gain.value > 0.01;
    },
    click: function (dir) {
      if (!ctx) return; var t = ctx.currentTime;
      noise(t, 0.03, 0.35, 'bandpass', dir < 0 ? 1400 : 1900, 0, 2.2);
      osc('triangle', dir < 0 ? 380 : 520, dir < 0 ? 300 : 410, t, 0.05, 0.22);
      noise(t + 0.06, 0.02, 0.15, 'bandpass', 2600, 0, 3);
    },
    glint: function (k) {
      if (!ctx) return; var t = ctx.currentTime + 0.04, f = 1300 * Math.pow(1.06, Math.min(k || 0, 12));
      osc('sine', f, f * 1.08, t, 0.12, 0.08); osc('sine', f * 2.01, 0, t, 0.08, 0.03);
    },
    light: function (k) {
      if (!ctx) return; var t = ctx.currentTime;
      noise(t, 0.28, 0.16, 'lowpass', 300, 1500, 0.8, sfx, 0.04);
      var scale = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88, 90, 93];
      var m = scale[Math.min(k - 1, scale.length - 1)] || 74;
      osc('sine', mtof(m), 0, t + 0.05, 0.9, 0.12, sfx, 0.006); osc('triangle', mtof(m) * 2, 0, t + 0.05, 0.4, 0.03, sfx, 0.006);
    },
    dark: function () { if (!ctx) return; var t = ctx.currentTime; noise(t, 0.18, 0.08, 'lowpass', 1200, 200, 0.7); },
    wind: function () { if (!ctx) return; var t = ctx.currentTime; noise(t, 0.7, 0.3, 'bandpass', 300, 1300, 1.6, sfx, 0.12); noise(t + 0.25, 0.5, 0.15, 'bandpass', 900, 400, 1.2, sfx, 0.1); },
    thunk: function () { if (!ctx) return; var t = ctx.currentTime; osc('sine', 150, 90, t, 0.1, 0.35); noise(t, 0.05, 0.2, 'lowpass', 700, 0, 1); },
    drip: function () { if (!ctx) return; var t = ctx.currentTime; osc('sine', 700, 1500, t, 0.08, 0.15); osc('sine', 600, 1300, t + 0.22, 0.07, 0.08); },
    ui: function () { if (!ctx) return; var t = ctx.currentTime; osc('triangle', 880, 760, t, 0.05, 0.08); },
    hint: function () {
      if (!ctx) return; var t = ctx.currentTime;
      [74, 78, 81, 86].forEach(function (m, i) { osc('sine', mtof(m), 0, t + i * 0.07, 0.6, 0.07, sfx, 0.005); });
    },
    star: function (k) { if (!ctx) return; var t = ctx.currentTime; bell(t, [880, 1047, 1319][k] || 880, 0.06, sfx, 1.2); },
    win: function () {
      if (!ctx) return; var t = ctx.currentTime + 0.05;
      // ghanti chord
      bell(t, 587.3, 0.14); bell(t + 0.07, 740, 0.1); bell(t + 0.14, 880, 0.1);
      // a deusi-bhailo style call and refrain, with madal
      var e = 60 / 160 / 2, tune = [[81, 1], [81, 1], [83, 1], [81, 1], [78, 1], [76, 1], [74, 2], [76, 1], [78, 1], [81, 1], [83, 1], [81, 3]];
      var tt = t + 0.6;
      tune.forEach(function (n) { lead(tt, n[0], n[1] * e * 0.95, 0.09); tt += n[1] * e; });
      for (var b = 0; b < 16; b++) { var bt = t + 0.6 + b * e; if (b % 4 === 0 || b % 4 === 3) dhin(bt, music, 0.9); else if (b % 2) ta(bt, music, 0.7); }
      bell(tt, 587.3, 0.08); dhin(tt, music, 1.1);
    }
  };
  root.TDS = API;
})(this);
