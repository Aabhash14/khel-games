/* Sound Garden
 * Click the soil to plant a seed. Each seed grows into a plant that plays its
 * own note on its own slow loop, so the garden becomes an ambient, phasing song.
 *
 *  x position  -> pitch (15 slots of a pentatonic scale, low on the left)
 *  y position  -> depth (further back = smaller, quieter, more reverb)
 *  register    -> species: Moonbulb (low), Bellflower (mid), Starbloom (high)
 *
 * The garden is saved in the URL hash, so a link recreates the same garden.
 * Plain script (no modules) so it also runs when opened straight from disk.
 */
(() => {
  'use strict';

  // ---------------------------------------------------------------- World --

  const MOODS = {
    dawn: { scale: [0, 2, 4, 7, 9],  root: 48, sky: ['#1b2350', '#5d4b80', '#e3a48c'], ground: ['#2b3b2e', '#0f1913'], stars: 0.3,  fog: 0.12 },
    dusk: { scale: [0, 3, 5, 7, 10], root: 45, sky: ['#060a20', '#1d1e4b', '#5c3e70'], ground: ['#1a2620', '#070c09'], stars: 1,    fog: 0.05 },
    mist: { scale: [0, 2, 4, 7, 11], root: 50, sky: ['#18262f', '#3a5560', '#93b4b0'], ground: ['#23352f', '#0b1411'], stars: 0.12, fog: 0.42 },
    deep: { scale: [0, 2, 3, 7, 9],  root: 43, sky: ['#02040c', '#0a1532', '#113a4b'], ground: ['#0e1e1e', '#030807'], stars: 1,    fog: 0.1 },
  };

  const SLOTS = 15;            // 3 octaves x 5 pentatonic degrees
  const MAX_PLANTS = 40;
  const WILT = 1.3;            // seconds to wilt away
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

  const SPECIES = {
    bulb: { name: 'Moonbulb',   height: [55, 80],   stem: 3.2, leaves: [3, 4], periods: [16, 20, 24, 32], grow: [5, 7],     gain: 0.30, delay: 0 },
    bell: { name: 'Bellflower', height: [95, 130],  stem: 2.2, leaves: [2, 3], periods: [8, 10, 12, 16],  grow: [5.5, 7.5], gain: 0.20, delay: 0.16 },
    star: { name: 'Starbloom',  height: [130, 175], stem: 1.5, leaves: [1, 2], periods: [6, 7, 8, 10, 12], grow: [6, 8],    gain: 0.13, delay: 0.3 },
  };
  const SPECIES_BY_OCTAVE = ['bulb', 'bell', 'star'];

  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionScale = reduceMotion ? 0.25 : 1;

  const state = {
    mood: 'dusk',
    tempo: 66,
    volume: 0.8,
    paused: false,
    awaitingWake: false,
    plants: [],
    motes: [],
  };

  // ------------------------------------------------------------ Utilities --

  const now = () => performance.now() / 1000;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function hash32(n) {
    n |= 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  }

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const range = (r, [a, b]) => a + (b - a) * r();
  const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? clamp(((px - ax) * dx + (py - ay) * dy) / len2) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  // --------------------------------------------------------------- Canvas --

  const canvas = document.getElementById('garden');
  const ctx = canvas.getContext('2d');
  const controlsEl = document.getElementById('controls');
  const hintEl = document.getElementById('hint');
  let W = 0, H = 0, DPR = 1, bottomPad = 100;

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bottomPad = (controlsEl.getBoundingClientRect().height || 60) + 40;
  }

  const horizonY = () => H * 0.42;
  const groundTop = () => horizonY() + H * 0.035;
  const groundNear = () => Math.max(groundTop() + 40, H - bottomPad);
  const groundY = (ny) => lerp(groundTop(), groundNear(), ny);
  const nyFromY = (y) => (y - groundTop()) / (groundNear() - groundTop());
  const unit = () => clamp(Math.min(W, H * 1.25) / 800, 0.7, 1.5);
  const scaleAt = (ny) => unit() * (0.42 + 0.78 * ny);

  // Static scenery, seeded so it looks the same every visit.
  const scenery = (() => {
    const r = rng(7);
    const stars = Array.from({ length: 150 }, () => ({
      x: r(), y: Math.pow(r(), 1.4), size: r() < 0.9 ? 1 : 1.8,
      b: 0.3 + r() * 0.7, sp: 0.4 + r() * 1.6, ph: r() * 6.28,
    }));
    const hill = (f1, f2, f3) => {
      const p = [r() * 6.28, r() * 6.28, r() * 6.28];
      return Array.from({ length: 90 }, (_, i) => {
        const x = i / 89;
        return clamp(0.5 + 0.3 * Math.sin(x * 6.28 * f1 + p[0]) + 0.17 * Math.sin(x * 6.28 * f2 + p[1]) + 0.07 * Math.sin(x * 6.28 * f3 + p[2]));
      });
    };
    const tufts = Array.from({ length: 150 }, () => ({
      nx: r(), ny: Math.pow(r(), 0.8) * 1.12, blades: 3 + Math.floor(r() * 3),
      h: 6 + r() * 9, ph: r() * 6.28, lean: r() * 0.6 - 0.3,
    })).sort((a, b) => a.ny - b.ny);
    return { stars, far: hill(1.3, 3.1, 7.2), near: hill(0.9, 2.4, 5.6), tufts };
  })();

  // Mood colours ease toward their target so mood changes feel like weather.
  const colors = (() => {
    const m = MOODS[state.mood];
    return { sky: m.sky.map(hexToRgb), ground: m.ground.map(hexToRgb), stars: m.stars, fog: m.fog };
  })();

  function updateColors(dt) {
    const m = MOODS[state.mood];
    const k = 1 - Math.exp(-dt * 1.8);
    for (let i = 0; i < 3; i++) colors.sky[i] = mix(colors.sky[i], hexToRgb(m.sky[i]), k);
    for (let i = 0; i < 2; i++) colors.ground[i] = mix(colors.ground[i], hexToRgb(m.ground[i]), k);
    colors.stars = lerp(colors.stars, m.stars, k);
    colors.fog = lerp(colors.fog, m.fog, k);
  }

  // --------------------------------------------------------------- Plants --

  let plantCounter = 0;

  function degreeOf(nx) { return Math.min(SLOTS - 1, Math.floor(nx * SLOTS)); }
  function hueOf(deg) { return (250 + deg * 14) % 360; }  // violet lows -> golden highs
  function midiOf(deg) {
    const m = MOODS[state.mood];
    return m.root + m.scale[deg % 5] + 12 * Math.floor(deg / 5);
  }
  function noteName(deg) {
    const midi = midiOf(deg);
    return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  }

  /* Everything about a plant derives from its quantised position, so a shared
     link regrows an identical garden. */
  function makePlant(nx, ny, opts = {}) {
    const qx = Math.round(clamp(nx, 0.01, 0.99) * 999);
    const qy = Math.round(clamp(ny) * 999);
    nx = qx / 999; ny = qy / 999;
    const seed = hash32(qx * 1009 + qy * 7919 + 17);
    const r = rng(seed);
    const deg = degreeOf(nx);
    const species = SPECIES_BY_OCTAVE[Math.floor(deg / 5)];
    const sp = SPECIES[species];

    const leafCount = Math.round(range(r, sp.leaves));
    const firstSide = r() < 0.5 ? -1 : 1;
    const leaves = [];
    for (let i = 0; i < leafCount; i++) {
      const base = species === 'bulb' ? 0.06 : 0.18;
      const spread = species === 'bulb' ? 0.28 : 0.45;
      leaves.push({
        u: base + (i / leafCount) * spread + r() * 0.06,
        side: i % 2 ? -firstSide : firstSide,
        len: range(r, [13, 21]) * (species === 'bulb' ? 1.35 : 1),
        w: 0.34 + r() * 0.14,
      });
    }

    const period = pick(r, sp.periods);
    const groundFrac = groundY(ny) / H;
    const dropY = opts.dropY != null ? opts.dropY : groundFrac - 0.07;

    return {
      id: ++plantCounter,
      nx, ny, deg, species, seed,
      height: range(r, sp.height),
      stemW: sp.stem,
      leaves,
      period,
      offset: Math.floor(r() * period),
      hue: (hueOf(deg) + r() * 16 - 8 + 360) % 360,
      leafHue: 100 + Math.floor(r() * 45),
      phase: r() * Math.PI * 2,
      lean: r() * 0.6 - 0.3,
      petals: r() < 0.5 ? 5 : 6,
      detune: r() * 12 - 6,
      growDur: range(r, sp.grow),
      born: now() + (opts.delay || 0),
      dropY,
      fall: 0.32 + 0.55 * clamp(groundFrac - dropY),
      silentLand: !!opts.silentLand,
      landed: false,
      lastHit: -1,
      pending: [],
      dying: 0,
      fx: 0, fy: 0,
    };
  }

  const growth = (p, t) => clamp((t - p.born - p.fall) / p.growDur);
  const alive = () => state.plants.filter((p) => !p.dying);

  function addPlant(p) {
    const living = alive();
    if (living.length >= MAX_PLANTS) {
      uproot(living.reduce((a, b) => (a.born < b.born ? a : b)));
    }
    state.plants.push(p);
    updateHint();
    saveHash();
  }

  function uproot(p) {
    if (!p || p.dying) return;
    p.dying = now();
    updateHint();
    saveHash();
  }

  function plantAt(x, y) {
    let ny, dropY;
    if (y < groundTop()) {
      // Seeds dropped in the sky drift down to the back of the garden.
      ny = 0.04 + Math.random() * 0.22;
      dropY = y / H;
    } else {
      ny = clamp(nyFromY(y));
      dropY = (groundY(ny) - 60 * scaleAt(ny)) / H;
    }
    addPlant(makePlant(x / W, ny, { dropY }));
  }

  function plantNear(x, y) {
    let best = null, bestD = Infinity;
    for (const p of state.plants) {
      if (p.dying || now() < p.born + p.fall) continue;
      const d = distToSeg(x, y, p.nx * W, groundY(p.ny), p.fx, p.fy);
      const threshold = 20 * scaleAt(p.ny) + 8;
      if (d < threshold && d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function scatter() {
    for (let i = 0; i < 5; i++) {
      addPlant(makePlant(0.04 + Math.random() * 0.92, 0.08 + Math.random() * 0.88, {
        delay: i * 0.3,
        dropY: 0.04 + Math.random() * 0.25,
      }));
    }
  }

  function undo() {
    const living = alive();
    if (living.length) uproot(living.reduce((a, b) => (a.id > b.id ? a : b)));
  }

  function clearGarden() {
    const t = now();
    alive().forEach((p, i) => { p.dying = t + i * 0.035; });
    updateHint();
    saveHash();
  }

  // ---------------------------------------------------------------- Audio --

  let actx = null, bus = null, nextStepTime = 0, step = 0;

  function makeImpulse(ac, seconds, decay) {
    const rate = ac.sampleRate, len = Math.floor(rate * seconds);
    const buf = ac.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const fadeIn = Math.min(1, i / (rate * 0.012));
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * fadeIn;
      }
    }
    return buf;
  }

  function ensureAudio() {
    if (actx) {
      if (actx.state === 'suspended' && !state.paused) actx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();

    const master = actx.createGain();
    master.gain.value = state.volume;
    const comp = actx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 18; comp.ratio.value = 3;
    comp.attack.value = 0.01; comp.release.value = 0.4;
    master.connect(comp).connect(actx.destination);

    const dry = actx.createGain();
    dry.gain.value = 0.9;
    dry.connect(master);

    const reverb = actx.createConvolver();
    reverb.buffer = makeImpulse(actx, 4.5, 2.6);
    const reverbOut = actx.createGain();
    reverbOut.gain.value = 0.85;
    reverb.connect(reverbOut).connect(master);

    // Dotted-eighth echo with a darkening feedback loop.
    const delay = actx.createDelay(4);
    const feedback = actx.createGain();
    feedback.gain.value = 0.38;
    const tone = actx.createBiquadFilter();
    tone.type = 'lowpass'; tone.frequency.value = 2200;
    delay.connect(tone).connect(feedback).connect(delay);
    const delayOut = actx.createGain();
    delayOut.gain.value = 0.45;
    tone.connect(delayOut);
    delayOut.connect(master);
    delayOut.connect(reverb);

    bus = { master, dry, reverb, delay };
    setDelayTime();
    nextStepTime = actx.currentTime + 0.1;
    step = 0;
    setInterval(scheduler, 25);
    if (state.paused) actx.suspend();
  }

  function setDelayTime() {
    if (!bus) return;
    bus.delay.delayTime.setTargetAtTime((60 / state.tempo) * 0.75, actx.currentTime, 0.3);
  }

  function playVoice(p, time, vel) {
    if (!actx || !bus) return;
    const sp = SPECIES[p.species];
    const f = mtof(midiOf(p.deg)) * Math.pow(2, p.detune / 1200);
    const far = 1 - p.ny;
    const amp = Math.max(0.001, vel * sp.gain * (0.5 + 0.5 * p.ny));
    const nodes = [];
    const node = (n) => { nodes.push(n); return n; };

    const env = node(actx.createGain());
    env.gain.setValueAtTime(0.0001, time);
    let out = env;
    if (actx.createStereoPanner) {
      const pan = node(actx.createStereoPanner());
      pan.pan.value = (p.nx * 2 - 1) * 0.75;
      env.connect(pan);
      out = pan;
    }
    const dryG = node(actx.createGain());
    dryG.gain.value = 1 - far * 0.55;
    out.connect(dryG).connect(bus.dry);
    const wetG = node(actx.createGain());
    wetG.gain.value = 0.35 + far * 0.6;
    out.connect(wetG).connect(bus.reverb);
    if (sp.delay > 0) {
      const dl = node(actx.createGain());
      dl.gain.value = sp.delay;
      out.connect(dl).connect(bus.delay);
    }

    const oscs = [];
    const osc = (type, freq, gain, dest = env) => {
      const o = node(actx.createOscillator());
      o.type = type; o.frequency.value = freq;
      const g = node(actx.createGain());
      g.gain.value = gain;
      o.connect(g).connect(dest);
      oscs.push(o);
      return { o, g };
    };

    let attack, dur;
    if (p.species === 'bulb') {
      // Warm, round and slow: sine + sub, through a closing low-pass.
      attack = 0.08; dur = 4.2;
      const lp = node(actx.createBiquadFilter());
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1400, time);
      lp.frequency.exponentialRampToValueAtTime(380, time + dur);
      lp.connect(env);
      osc('sine', f, 1, lp);
      osc('sine', f / 2, 0.45, lp);
      osc('triangle', f * 2, 0.07, lp);
    } else if (p.species === 'bell') {
      // Simple FM bell: the modulation index decays, so it starts bright and mellows.
      attack = 0.006; dur = 3.2;
      const carrier = osc('sine', f, 1);
      const mod = node(actx.createOscillator());
      mod.frequency.value = f * 2;
      const index = node(actx.createGain());
      index.gain.setValueAtTime(f * 1.4, time);
      index.gain.exponentialRampToValueAtTime(f * 0.04, time + 1.6);
      mod.connect(index).connect(carrier.o.frequency);
      oscs.push(mod);
      osc('sine', f * 3.01, 0.05);
    } else {
      // Glassy pluck with a quickly fading octave shimmer.
      attack = 0.004; dur = 1.8;
      osc('sine', f, 1);
      const shimmer = osc('sine', f * 2.005, 0.22);
      shimmer.g.gain.setValueAtTime(0.22, time);
      shimmer.g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      osc('triangle', f * 4.01, 0.03);
    }

    env.gain.exponentialRampToValueAtTime(amp, time + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    const end = time + dur + 0.05;
    oscs.forEach((o) => { o.start(time); o.stop(end); });
    oscs[0].onended = () => nodes.forEach((n) => n.disconnect());
  }

  /* Look-ahead scheduler on an eighth-note grid. Each plant fires every
     `period` steps from its own offset; differing periods make the patterns
     drift in and out of phase with each other. */
  function scheduler() {
    if (!actx || state.paused || actx.state !== 'running') return;
    const stepDur = 60 / state.tempo / 2;
    if (nextStepTime < actx.currentTime - 0.2) nextStepTime = actx.currentTime + 0.05;  // after tab throttling
    while (nextStepTime < actx.currentTime + 0.15) {
      const t = now() + (nextStepTime - actx.currentTime);
      for (const p of state.plants) {
        if (p.dying) continue;
        const g = growth(p, t);
        if (g < 0.35) continue;
        if (((step - p.offset) % p.period + p.period) % p.period !== 0) continue;
        const r = hash32(p.seed ^ Math.imul(step, 2654435761)) / 4294967296;
        if (r > 0.86) continue;  // occasional rests keep it breathing
        const vel = (0.55 + 0.45 * clamp((g - 0.35) / 0.65)) * (0.8 + 0.2 * ((r * 7) % 1));
        playVoice(p, nextStepTime, vel);
        p.pending.push(nextStepTime);
      }
      nextStepTime += stepDur;
      step++;
    }
  }

  // ------------------------------------------------------------- Drawing --

  function drawBackdrop(t) {
    const hz = horizonY();
    const [s0, s1, s2] = colors.sky;
    const [g0, g1] = colors.ground;

    let grad = ctx.createLinearGradient(0, 0, 0, hz);
    grad.addColorStop(0, rgba(s0));
    grad.addColorStop(0.6, rgba(s1));
    grad.addColorStop(1, rgba(s2));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, hz + 2);

    if (colors.stars > 0.02) {
      for (const s of scenery.stars) {
        const tw = reduceMotion ? 0.8 : 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
        const a = colors.stars * s.b * tw * (1 - s.y * 0.6);
        if (a < 0.03) continue;
        ctx.fillStyle = `rgba(255,248,230,${a})`;
        ctx.fillRect(s.x * W, s.y * hz * 0.92, s.size, s.size);
      }
    }

    const glow = ctx.createRadialGradient(W * 0.5, hz, 0, W * 0.5, hz, Math.max(W, H) * 0.6);
    glow.addColorStop(0, rgba(mix(s2, [255, 220, 190], 0.25), 0.35));
    glow.addColorStop(1, rgba(s2, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, hz + 2);

    drawHills(scenery.far, hz + 1, H * 0.075, mix(s2, g0, 0.55));
    drawHills(scenery.near, hz + 2, H * 0.04, mix(s2, g0, 0.82));

    grad = ctx.createLinearGradient(0, hz, 0, H);
    grad.addColorStop(0, rgba(g0));
    grad.addColorStop(1, rgba(g1));
    ctx.fillStyle = grad;
    ctx.fillRect(0, hz, W, H - hz);

    if (colors.fog > 0.01) {
      grad = ctx.createLinearGradient(0, hz - H * 0.06, 0, hz + H * 0.3);
      grad.addColorStop(0, rgba(s2, 0));
      grad.addColorStop(0.3, rgba(s2, colors.fog));
      grad.addColorStop(1, rgba(s2, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, hz - H * 0.06, W, H * 0.36);
    }
  }

  function drawHills(heights, base, amp, col) {
    ctx.fillStyle = rgba(col);
    ctx.beginPath();
    ctx.moveTo(0, base);
    const n = heights.length - 1;
    for (let i = 0; i <= n; i++) ctx.lineTo((i / n) * W, base - heights[i] * amp);
    ctx.lineTo(W, base);
    ctx.closePath();
    ctx.fill();
  }

  function drawTufts(t) {
    const base = mix(colors.ground[0], [120, 170, 125], 0.22);
    ctx.lineCap = 'round';
    for (const tf of scenery.tufts) {
      const x = tf.nx * W, y = groundY(tf.ny), s = scaleAt(Math.min(1, tf.ny));
      const sway = Math.sin(t * 0.9 + tf.ph) * 0.15 * motionScale;
      ctx.strokeStyle = rgba(mix(base, colors.ground[1], 0.3 - tf.ny * 0.25), 0.55 + tf.ny * 0.3);
      ctx.lineWidth = Math.max(0.8, 1.2 * s);
      ctx.beginPath();
      for (let b = 0; b < tf.blades; b++) {
        const off = (b - tf.blades / 2) * 2.2 * s;
        const h = tf.h * s * (0.7 + ((b * 37) % 10) / 25);
        const lean = tf.lean + (b - tf.blades / 2) * 0.25 + sway;
        ctx.moveTo(x + off, y);
        ctx.quadraticCurveTo(x + off + lean * h * 0.3, y - h * 0.6, x + off + lean * h, y - h);
      }
      ctx.stroke();
    }
  }

  function drawSeed(x, y, s, hue, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 12 * s);
    halo.addColorStop(0, `hsla(${hue},90%,70%,0.4)`);
    halo.addColorStop(1, `hsla(${hue},90%,70%,0)`);
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, 12 * s, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#d8b88a';
    ctx.beginPath(); ctx.ellipse(x, y, 2.8 * s, 4 * s, 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6e6c6';
    ctx.beginPath(); ctx.ellipse(x - 0.8 * s, y - 1.3 * s, 0.9 * s, 1.5 * s, 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawLeaf(x, y, angle, len, width, fill) {
    if (len < 0.5) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * width, len, 0);
    ctx.quadraticCurveTo(len * 0.5, len * width, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(len * 0.85, 0); ctx.stroke();
    ctx.restore();
  }

  const bez = (a, c, b, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;
  const bezD = (a, c, b, u) => 2 * (1 - u) * (c - a) + 2 * u * (b - c);

  function drawPlant(p, t, at) {
    if (t < p.born) return;
    const x = p.nx * W, y = groundY(p.ny), s = scaleAt(p.ny);

    // Falling seed.
    if (t < p.born + p.fall) {
      const k = (t - p.born) / p.fall;
      drawSeed(x, lerp(p.dropY * H, y - 2 * s, k * k), s, p.hue, 1);
      p.fx = x; p.fy = y;
      return;
    }

    const wilt = p.dying ? clamp((t - p.dying) / WILT) : 0;
    const g = growth(p, t);
    const glow = p.lastHit >= 0 && at >= p.lastHit ? Math.exp(-(at - p.lastHit) * 2.4) : 0;

    ctx.save();
    ctx.globalAlpha = 1 - wilt * wilt;

    // Soil mound.
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(x, y + 1, 11 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();

    if (g < 0.12) drawSeed(x, y - 2 * s, s, p.hue, 1 - g / 0.12);

    const sg = easeOutCubic(clamp((g - 0.04) / 0.7));
    const h = p.height * s * sg;
    if (h < 0.5) { p.fx = x; p.fy = y; ctx.restore(); return; }

    const breeze = 0.035 + (state.tempo - 44) / 56 * 0.05;
    const sway = (Math.sin(t * 0.8 + p.phase) * 0.7 + Math.sin(t * 1.9 + p.phase * 2) * 0.3) * breeze * motionScale;
    const droop = wilt * (p.lean >= 0 ? 1 : -1);
    const tx = x + (p.lean * 0.22 + sway) * h + droop * h * 0.55;
    const ty = y - h * (1 - wilt * 0.55);
    const cx = x + p.lean * 0.12 * h + sway * h * 0.3;
    const cy = y - h * 0.55;
    const sat = 1 - wilt * 0.7;

    // Leaves.
    p.leaves.forEach((lf, i) => {
      const lg = clamp((g - 0.1 - i * 0.07) / 0.35);
      if (lg <= 0) return;
      const lx = bez(x, cx, tx, lf.u), ly = bez(y, cy, ty, lf.u);
      const ang = Math.atan2(bezD(y, cy, ty, lf.u), bezD(x, cx, tx, lf.u));
      const leafAng = ang + lf.side * (0.95 + wilt * 0.8) + sway * 1.5;
      const light = 26 + lf.u * 14 + glow * 6;
      drawLeaf(lx, ly, leafAng, lf.len * s * easeOutCubic(lg), lf.w, `hsl(${p.leafHue},${38 * sat}%,${light}%)`);
    });

    // Stem.
    ctx.strokeStyle = `hsl(${p.leafHue + 10},${32 * sat}%,${30 + glow * 12}%)`;
    ctx.lineWidth = p.stemW * s * (0.55 + 0.45 * sg);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();

    p.fx = tx; p.fy = ty;
    const bloom = clamp((g - 0.6) / 0.4);
    if (bloom > 0) drawFlower(p, tx, ty, s, easeOutBack(bloom), glow, t, at, wilt, sat);
    ctx.restore();
  }

  function drawFlower(p, x, y, s, b, glow, t, at, wilt, sat) {
    const hue = p.hue;

    // Halo and ripple when the plant sings.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const R = (18 + 48 * glow) * s * b;
    if (R > 0.5) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, R);
      halo.addColorStop(0, `hsla(${hue},95%,70%,${(0.16 + 0.55 * glow) * sat})`);
      halo.addColorStop(1, `hsla(${hue},95%,60%,0)`);
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    }
    if (glow > 0.03 && !reduceMotion) {
      ctx.strokeStyle = `hsla(${hue},90%,75%,${glow * 0.45})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, (12 + (1 - glow) * 70) * s, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    if (p.species === 'bulb') {
      const r = 8.5 * s * b * (1 + glow * 0.15);
      ctx.fillStyle = `hsl(${p.leafHue},${35 * sat}%,30%)`;
      for (const side of [-1, 1]) drawLeaf(x, y + r * 0.6, Math.PI / 2 + side * 1.1, r * 0.9, 0.4, ctx.fillStyle);
      const body = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      body.addColorStop(0, `hsl(${hue},${90 * sat}%,${84 + glow * 10}%)`);
      body.addColorStop(0.55, `hsl(${hue},${72 * sat}%,${58 + glow * 12}%)`);
      body.addColorStop(1, `hsl(${hue},${60 * sat}%,${34 + glow * 10}%)`);
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.2, r * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
    } else if (p.species === 'bell') {
      const dir = p.lean >= 0 ? 1 : -1;
      const bx = x + dir * 6 * s * b, by = y + 2 * s * b;
      ctx.strokeStyle = `hsl(${p.leafHue + 10},${32 * sat}%,32%)`;
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dir * 5 * s * b, y - 3 * s * b, bx, by); ctx.stroke();

      const swing = Math.sin(at * 9) * glow * 0.35 * motionScale + dir * 0.12 + wilt * dir * 0.6;
      const w = 13 * s * b, h = 15 * s * b;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(swing);
      const body = ctx.createLinearGradient(0, 0, 0, h);
      body.addColorStop(0, `hsl(${hue},${65 * sat}%,${40 + glow * 10}%)`);
      body.addColorStop(1, `hsl(${hue},${82 * sat}%,${66 + glow * 16}%)`);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(-w * 0.18, 0);
      ctx.bezierCurveTo(-w * 0.46, h * 0.2, -w * 0.38, h * 0.7, -w * 0.6, h);
      ctx.quadraticCurveTo(-w * 0.3, h * 0.86, 0, h);
      ctx.quadraticCurveTo(w * 0.3, h * 0.86, w * 0.6, h);
      ctx.bezierCurveTo(w * 0.38, h * 0.7, w * 0.46, h * 0.2, w * 0.18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `hsla(50,100%,82%,${0.35 + glow * 0.65})`;
      ctx.beginPath(); ctx.arc(0, h * 1.04, 1.8 * s * b, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      const r = 10 * s * b * (1 + glow * 0.12);
      const rot = (reduceMotion ? 0 : t * 0.25) + p.phase;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = `hsl(${hue},${85 * sat}%,${64 + glow * 16}%)`;
      for (let i = 0; i < p.petals; i++) {
        ctx.save();
        ctx.rotate(rot + (i * Math.PI * 2) / p.petals);
        ctx.beginPath(); ctx.ellipse(0, -r * 0.55, Math.max(0, r * 0.2), Math.max(0, r * 0.55), 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = `hsl(48,${100 * sat}%,${82 + glow * 12}%)`;
      ctx.beginPath(); ctx.arc(0, 0, Math.max(0, r * 0.24), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function spawnMotes(p) {
    if (reduceMotion) return;
    const n = p.species === 'star' ? 1 : 2;
    const s = scaleAt(p.ny);
    for (let i = 0; i < n; i++) {
      state.motes.push({
        x: p.fx + (Math.random() - 0.5) * 10 * s,
        y: p.fy + (Math.random() - 0.5) * 10 * s,
        vx: (Math.random() - 0.5) * 14,
        vy: -8 - Math.random() * 16,
        life: 0,
        max: 2 + Math.random() * 2.5,
        hue: p.hue,
        r: (0.9 + Math.random() * 1.3) * s,
        ph: Math.random() * 6.28,
      });
    }
    if (state.motes.length > 240) state.motes.splice(0, state.motes.length - 240);
  }

  function drawMotes(dt, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.motes = state.motes.filter((m) => {
      m.life += dt;
      if (m.life >= m.max) return false;
      m.x += (m.vx + Math.sin(t * 1.7 + m.ph) * 6) * dt;
      m.y += m.vy * dt;
      m.vy *= 0.995;
      const a = Math.sin((Math.PI * m.life) / m.max) * (0.6 + 0.4 * Math.sin(t * 7 + m.ph));
      ctx.fillStyle = `hsla(${m.hue},95%,75%,${a * 0.18})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `hsla(${m.hue},100%,88%,${a})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      return true;
    });
    ctx.restore();
  }

  // Hover preview: shows which note a seed planted here would sing.
  let hover = null;

  function drawGhost() {
    if (!hover || hover.touch || press) return;
    const top = groundTop();
    const target = plantNear(hover.x, hover.y);
    ctx.save();
    ctx.font = '500 12px "Hanken Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';

    if (target) {
      ctx.fillStyle = 'rgba(241,236,255,0.75)';
      ctx.fillText(`${noteName(target.deg)} · right-click to uproot`, target.fx, target.fy - 26 * scaleAt(target.ny));
      canvas.style.cursor = 'pointer';
      ctx.restore();
      return;
    }
    canvas.style.cursor = 'crosshair';

    const deg = degreeOf(clamp(hover.x / W, 0.01, 0.99));
    const hue = hueOf(deg);
    const bx = (deg / SLOTS) * W, bw = W / SLOTS;
    const band = ctx.createLinearGradient(0, top, 0, H);
    band.addColorStop(0, `hsla(${hue},80%,70%,0)`);
    band.addColorStop(0.5, `hsla(${hue},80%,70%,0.045)`);
    band.addColorStop(1, `hsla(${hue},80%,70%,0.08)`);
    ctx.fillStyle = band;
    ctx.fillRect(bx, top, bw, H - top);

    const inSky = hover.y < top;
    const ny = inSky ? 0.15 : clamp(nyFromY(hover.y));
    const s = scaleAt(ny);
    const gy = inSky ? hover.y : groundY(ny);
    ctx.globalAlpha = 0.6;
    drawSeed(hover.x, gy - 2 * s, s, hue, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(241,236,255,0.7)';
    ctx.fillText(`${noteName(deg)} · ${SPECIES[SPECIES_BY_OCTAVE[Math.floor(deg / 5)]].name}`, hover.x, gy - 16 * s - 6);
    ctx.restore();
  }

  // ----------------------------------------------------------- Main loop --

  let lastFrame = now();

  function frame() {
    const t = now();
    const dt = Math.min(0.05, t - lastFrame);
    lastFrame = t;
    const at = actx ? actx.currentTime : 0;

    updateColors(dt);
    drawBackdrop(t);
    drawTufts(t);
    drawGhost();

    for (const p of state.plants) {
      if (!p.landed && t >= p.born + p.fall) {
        p.landed = true;
        // A soft "plip" when the seed lands, so planting answers immediately.
        if (actx && !state.paused && !p.silentLand) playVoice(p, actx.currentTime + 0.01, 0.35);
      }
      while (p.pending.length && p.pending[0] <= at) {
        p.lastHit = p.pending.shift();
        spawnMotes(p);
      }
    }

    const ordered = state.plants.slice().sort((a, b) => a.ny - b.ny);
    for (const p of ordered) drawPlant(p, t, at);
    state.plants = state.plants.filter((p) => !p.dying || t - p.dying < WILT);

    drawMotes(dt, t);
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------- Persistence --

  function encodeHash() {
    const g = alive().map((p) => Math.round(p.nx * 999) + '.' + Math.round(p.ny * 999)).join(',');
    return `#mood=${state.mood}&tempo=${state.tempo}` + (g ? `&g=${g}` : '');
  }

  let hashTimer = 0;
  function writeHash() {
    const h = encodeHash();
    try { history.replaceState(null, '', h); } catch (e) { try { location.hash = h; } catch (_) { /* ignore */ } }
  }
  function saveHash() {
    clearTimeout(hashTimer);
    hashTimer = setTimeout(writeHash, 300);
  }

  function loadHash() {
    const raw = location.hash.slice(1);
    if (!raw) return 0;
    const params = {};
    raw.split('&').forEach((kv) => {
      const [k, v] = kv.split('=');
      params[k] = decodeURIComponent(v || '');
    });
    if (MOODS[params.mood]) state.mood = params.mood;
    const tempo = Number(params.tempo);
    if (tempo >= 44 && tempo <= 100) state.tempo = Math.round(tempo);
    let n = 0;
    if (params.g) {
      params.g.split(',').slice(0, MAX_PLANTS).forEach((pair) => {
        const [a, b] = pair.split('.').map(Number);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        state.plants.push(makePlant(a / 999, b / 999, { delay: 0.3 + n * 0.15, silentLand: true }));
        n++;
      });
    }
    return n;
  }

  // ----------------------------------------------------------- Controls --

  const moodButtons = Array.from(document.querySelectorAll('[data-mood]'));
  const tempoInput = document.getElementById('tempo');
  const volumeInput = document.getElementById('volume');
  const pauseBtn = document.getElementById('pause');
  const shareBtn = document.getElementById('share');

  function updateMoodUI() {
    moodButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mood === state.mood)));
  }

  function updateHint() {
    if (state.awaitingWake) {
      hintEl.textContent = 'Tap anywhere to wake this garden';
      hintEl.classList.remove('is-hidden');
      return;
    }
    hintEl.textContent = 'Click the soil to plant your first seed';
    hintEl.classList.toggle('is-hidden', alive().length > 0);
  }

  function wake() {
    if (!state.awaitingWake) return;
    state.awaitingWake = false;
    updateHint();
  }

  function togglePause() {
    state.paused = !state.paused;
    if (actx) state.paused ? actx.suspend() : actx.resume();
    pauseBtn.textContent = state.paused ? 'Play' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', String(state.paused));
  }

  function flash(btn, text) {
    const original = btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.textContent = text;
    clearTimeout(btn._flash);
    btn._flash = setTimeout(() => { btn.textContent = original; }, 1600);
  }

  async function shareLink() {
    clearTimeout(hashTimer);
    writeHash();
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      flash(shareBtn, 'Link copied');
    } catch (e) {
      window.prompt('Copy this link to share your garden:', url);
    }
  }

  moodButtons.forEach((b) => b.addEventListener('click', () => {
    state.mood = b.dataset.mood;
    updateMoodUI();
    saveHash();
  }));

  tempoInput.addEventListener('input', () => {
    state.tempo = Number(tempoInput.value);
    setDelayTime();
    saveHash();
  });

  volumeInput.addEventListener('input', () => {
    state.volume = Number(volumeInput.value);
    if (bus) bus.master.gain.setTargetAtTime(state.volume, actx.currentTime, 0.05);
  });

  pauseBtn.addEventListener('click', togglePause);
  document.getElementById('scatter').addEventListener('click', scatter);
  document.getElementById('clear').addEventListener('click', clearGarden);
  shareBtn.addEventListener('click', shareLink);

  // Browsers only allow audio after a user gesture; touch needs pointerup.
  ['pointerdown', 'pointerup', 'keydown'].forEach((type) => {
    document.addEventListener(type, (e) => {
      ensureAudio();
      if (e.target !== canvas) wake();
    }, { capture: true });
  });

  // ------------------------------------------------------ Canvas input --

  let press = null;
  const LONG_PRESS = 550;

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button === 2) {
      uproot(plantNear(e.clientX, e.clientY));
      return;
    }
    if (e.button !== 0) return;
    const wasAsleep = state.awaitingWake;
    wake();
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, wake: wasAsleep, uprooted: false, timer: 0 };
    press.timer = setTimeout(() => {
      if (!press) return;
      const p = plantNear(press.x, press.y);
      if (p) { uproot(p); press.uprooted = true; }
    }, LONG_PRESS);
  });

  canvas.addEventListener('pointermove', (e) => {
    hover = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' };
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 12) {
      clearTimeout(press.timer);
      press.moved = true;
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.id) return;
    clearTimeout(press.timer);
    if (!press.uprooted && !press.moved && !press.wake) plantAt(press.x, press.y);
    press = null;
  });

  canvas.addEventListener('pointercancel', () => {
    if (press) clearTimeout(press.timer);
    press = null;
  });

  canvas.addEventListener('pointerleave', () => { hover = null; });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.altKey) return;
    const inControl = e.target.closest && e.target.closest('button, input');
    if (e.key === ' ') {
      if (inControl) return;
      e.preventDefault();
      togglePause();
    } else if (!e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      scatter();
    } else if (e.key === 'z' || e.key === 'Z') {
      undo();
    }
  });

  window.addEventListener('resize', resize);

  // ---------------------------------------------------------------- Boot --

  resize();
  const loaded = loadHash();
  state.awaitingWake = loaded > 0;
  Object.assign(colors, {
    sky: MOODS[state.mood].sky.map(hexToRgb),
    ground: MOODS[state.mood].ground.map(hexToRgb),
    stars: MOODS[state.mood].stars,
    fog: MOODS[state.mood].fog,
  });
  tempoInput.value = state.tempo;
  volumeInput.value = state.volume;
  updateMoodUI();
  updateHint();
  requestAnimationFrame(frame);
})();
