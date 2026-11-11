// Sound, synthesised live with Web Audio. No audio files.
// A small Newar processional ensemble: dhime (two-headed drum), bhusya (cymbals), ghungru (ankle bells),
// a pwanga-style horn drone and a muhali-style reed melody (original tunes). Layers come in as
// the intensity rises. Plus crowd and wind beds, a reverb for the old stone squares, and effects.
import { save, persist } from './store.js';

let C = null, master, comp, rev, music, sfxBus, amb, noise, crowdG, windG, seqTimer = null;
const st = { song: null, songName: null, step: 0, next: 0, I: 0.4, quiet: false, tempo: 1, ghungru: false };

/* ---------- real recordings (see sounds/CREDITS.md) ----------
   Each chapter gets a recorded music bed and a recorded ambience bed. While a recording plays,
   the synthesised drums and melody step aside; they come back only if a file fails to load. */
// gain evens out the recordings' levels (measured: about -8, -30 and -40 dB)
const FILES = {
  celebration: { url: 'sounds/indra-jatra-courtyard-2010.mp3', gain: 0.45 },
  durbar: { url: 'sounds/kathmandu-durbar-evening.mp3', gain: 3 },
  patan: { url: 'sounds/patan-durbar-evening-bells.mp3', gain: 8 },
  newar: { url: 'sounds/newar-bansuri-ensemble.mp3', gain: 0.5 },
};
const REAL_MIX = {
  menu: { music: 'celebration', mv: 0.5, amb: 'patan', av: 0.35 },
  yosin: { music: 'celebration', mv: 0.42, amb: 'durbar', av: 0.75 },
  upaku: { music: 'newar', mv: 0.8, amb: 'patan', av: 0.45 },
  lakhey: { music: 'celebration', mv: 0.85, amb: 'durbar', av: 0.3 },
  rath: { music: 'celebration', mv: 0.72, amb: 'durbar', av: 0.6 },
  finale: { music: 'celebration', mv: 0.32, amb: 'patan', av: 0.6 },
};
const buffers = {}, loading = {};
const beds = { music: null, amb: null };

function loopable(buf, fadeSec = 1.2) {
  // equal-power crossfade of the tail into the head, so the loop has no seam
  const F = Math.min(Math.floor(fadeSec * buf.sampleRate), Math.floor(buf.length / 4));
  const L = buf.length - F, out = C.createBuffer(buf.numberOfChannels, L, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const a = buf.getChannelData(ch), o = out.getChannelData(ch);
    o.set(a.subarray(0, L));
    for (let i = 0; i < F; i++) { const k = i / F; o[i] = a[i] * Math.sin(k * Math.PI / 2) + a[L + i] * Math.cos(k * Math.PI / 2); }
  }
  return out;
}
function load(name) {
  if (buffers[name] || loading[name]) return loading[name];
  loading[name] = fetch(FILES[name].url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
    .then((ab) => new Promise((res, rej) => C.decodeAudioData(ab, res, rej)))
    .then((b) => { buffers[name] = loopable(b); applyMix(); })
    .catch(() => { buffers[name] = null; });
  return loading[name];
}
function startBed(kind, name, vol) {
  const cur = beds[kind];
  if (cur && cur.name === name) { cur.vol = vol * FILES[name].gain; return; }
  if (cur) { cur.g.gain.setTargetAtTime(0, C.currentTime, 0.5); const old = cur; setTimeout(() => { try { old.src.stop(); } catch (e) { /* already stopped */ } }, 3000); }
  beds[kind] = null;
  if (!name || !buffers[name]) return;
  const src = C.createBufferSource(); src.buffer = buffers[name]; src.loop = true;
  const f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 4000; f.Q.value = 0.5;
  const g = C.createGain(); g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(kind === 'music' ? music : amb);
  src.start(0, Math.random() * Math.max(0, src.buffer.duration - 5));
  beds[kind] = { name, src, f, g, vol: vol * FILES[name].gain };
}
function applyMix() {
  if (!C) return;
  const m = REAL_MIX[st.songName] || {};
  startBed('music', m.music, m.mv || 0);
  startBed('amb', m.amb, m.av || 0);
  shapeBeds();
}
function shapeBeds() {
  if (!C) return;
  const t0 = C.currentTime, I = st.I, mb = beds.music, ab = beds.amb;
  if (mb) {
    mb.g.gain.setTargetAtTime(mb.vol * (st.quiet ? 0.12 : 0.45 + 0.55 * I), t0, st.quiet ? 0.06 : 0.35);
    mb.f.frequency.setTargetAtTime(700 + 11000 * Math.pow(I, 1.6), t0, 0.3);
    mb.src.playbackRate.setTargetAtTime(Math.min(1.3, st.tempo), t0, 0.15);
  }
  if (ab) { ab.g.gain.setTargetAtTime(ab.vol, t0, 0.6); ab.f.frequency.setTargetAtTime(9000, t0, 0.3); }
}
const realMusic = () => !!beds.music;

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function hz(n) { const m = /^([A-G]#?)(\d)$/.exec(n); return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12); }

// 32 sixteenth-notes = two bars. Drums: D dhin (low head), t ta (high), g ghe (muted), . rest.
// Cymbals: O open, x closed. Melodies: [step, note, length in steps].
const SONGS = {
  menu: {
    bpm: 76, drums: 'D...t...D.t.....D...t...D.tt....', cym: 'O.......x.......O.......x...x...',
    horn: [[0, 'D2', 30]], reed: [[0, 'A4', 6], [6, 'B4', 2], [8, 'A4', 4], [12, 'F#4', 4], [16, 'E4', 6], [22, 'F#4', 2], [24, 'D4', 8]],
    reed2: [[0, 'F#4', 4], [4, 'A4', 4], [8, 'B4', 6], [14, 'A4', 2], [16, 'F#4', 4], [20, 'E4', 4], [24, 'D4', 8]], reedAt: 0.2,
  },
  yosin: {
    bpm: 100, drums: 'D..tD.t.D..tD.ttD..tD.t.D.tDt.tt', cym: 'x.x.O.x.x.x.O.x.x.x.O.x.x.x.O.xx',
    horn: [[0, 'D2', 14], [16, 'A1', 14]], reed: [[0, 'D5', 3], [4, 'B4', 3], [8, 'A4', 6], [16, 'B4', 3], [20, 'A4', 3], [24, 'F#4', 6]], reedAt: 0.6,
  },
  lakhey: {
    bpm: 118, drums: 'D.tDt.tDD.tDtDttD.tDt.tDD.gDtDtt', cym: 'x...O...x...O.x.x...O...x...O.xx', bells: 'x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.',
    horn: [[0, 'D2', 6], [16, 'D2', 6]], reed: [[0, 'A4', 2], [2, 'B4', 2], [4, 'D5', 4], [8, 'B4', 2], [10, 'A4', 2], [12, 'F#4', 4], [16, 'A4', 2], [18, 'F#4', 2], [20, 'E4', 4], [24, 'D4', 6]], reedAt: 0.65,
  },
  rath: {
    bpm: 92, drums: 'D...t.t.D.t.t...D...t.t.D.t.tDt.', cym: 'O...x...O...x.x.O...x...O...x.xx',
    horn: [[0, 'D2', 8], [8, 'E2', 8], [16, 'D2', 8], [24, 'A1', 8]],
    reed: [[0, 'D4', 4], [4, 'E4', 2], [6, 'F#4', 2], [8, 'A4', 6], [14, 'F#4', 2], [16, 'E4', 4], [20, 'D4', 2], [22, 'E4', 2], [24, 'F#4', 8]],
    reed2: [[0, 'A4', 4], [4, 'B4', 2], [6, 'A4', 2], [8, 'F#4', 6], [14, 'E4', 2], [16, 'F#4', 4], [20, 'E4', 2], [22, 'D4', 2], [24, 'D4', 8]], reedAt: 0.45,
  },
  upaku: {
    bpm: 56, drums: '................................', cym: '................................', toll: [0, 16],
    horn: [[0, 'D2', 32]], reed: [[0, 'A4', 8], [8, 'F#4', 8], [16, 'E4', 8], [24, 'D4', 8]], reedAt: 0.3, soft: true,
  },
  finale: {
    bpm: 66, drums: 'D.......t.......D.......t...t...', cym: 'O...............O...............', toll: [16],
    horn: [[0, 'D2', 30]], reed: [[0, 'F#4', 6], [6, 'E4', 2], [8, 'D4', 8], [16, 'E4', 4], [20, 'F#4', 4], [24, 'A4', 8]], reedAt: 0.3,
  },
};

function impulse(sec, decay) {
  const len = Math.floor(C.sampleRate * sec), b = C.createBuffer(2, len, C.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  return b;
}
function bus(level, wet) {
  const g = C.createGain(); g.gain.value = level; g.connect(master);
  if (wet) { const s = C.createGain(); s.gain.value = wet; g.connect(s); s.connect(rev); }
  return g;
}

export function initAudio() {
  if (C) { if (C.state === 'suspended') C.resume(); return true; }
  try {
    C = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { C = null; return false; }
  comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
  master = C.createGain(); master.gain.value = save.mute ? 0 : 0.85;
  master.connect(comp); comp.connect(C.destination);
  rev = C.createConvolver(); rev.buffer = impulse(2.6, 2.8);
  const rg = C.createGain(); rg.gain.value = 0.32; rev.connect(rg); rg.connect(master);
  music = bus(0.62, 0.3); sfxBus = bus(0.9, 0.18); amb = bus(0.5, 0.25);
  const len = C.sampleRate * 2; noise = C.createBuffer(1, len, C.sampleRate);
  const d = noise.getChannelData(0); let b0 = 0, b1 = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99 * b0 + w * 0.1; b1 = 0.6 * b1 + w * 0.4; d[i] = (b0 + b1 + w * 0.25) * 0.6; }
  crowdG = bed(650, 0.6, 1500); windG = bed(380, 0.8, 0, 'lowpass');
  st.next = C.currentTime + 0.1;
  seqTimer = setInterval(tick, 25);
  for (const n in FILES) load(n);
  applyMix();
  return true;
}
function bed(f, q, f2, type) {
  const src = C.createBufferSource(); src.buffer = noise; src.loop = true;
  const g = C.createGain(); g.gain.value = 0;
  const a = C.createBiquadFilter(); a.type = type || 'bandpass'; a.frequency.value = f; a.Q.value = q;
  src.connect(a); a.connect(g);
  if (f2) { const b = C.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f2; b.Q.value = 0.8; const bg = C.createGain(); bg.gain.value = 0.4; src.connect(b); b.connect(bg); bg.connect(g); }
  g.connect(amb); src.start();
  return g;
}

function env(node, t0, peak, dec, att = 0.003, dest = sfxBus) {
  const g = C.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + att + dec);
  node.connect(g); g.connect(dest);
  return g;
}
function nz(t0, peak, dec, type, f, q = 1, att, dest) {
  const s = C.createBufferSource(); s.buffer = noise;
  const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  s.connect(fl); env(fl, t0, peak, dec, att, dest);
  s.start(t0, Math.random() * 1.5); s.stop(t0 + (att || 0) + dec + 0.05);
  return fl;
}
function osc(t0, type, f, peak, dec, f2, att, dest) {
  const o = C.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dec * 0.8);
  env(o, t0, peak, dec, att, dest); o.start(t0); o.stop(t0 + (att || 0) + dec + 0.05);
  return o;
}

/* ---------- instruments ---------- */
function dhin(t0, v) { osc(t0, 'sine', 105, 0.9 * v, 0.42, 46, 0.002, music); nz(t0, 0.35 * v, 0.06, 'lowpass', 500, 1, 0.001, music); nz(t0, 0.25 * v, 0.14, 'bandpass', 190, 5, 0.002, music); }
function ta(t0, v) { nz(t0, 0.55 * v, 0.07, 'bandpass', 2300, 2, 0.001, music); osc(t0, 'triangle', 420, 0.3 * v, 0.1, 360, 0.001, music); }
function ghe(t0, v) { nz(t0, 0.45 * v, 0.04, 'bandpass', 900, 2, 0.001, music); }
function bhusya(t0, v, open) {
  const dec = open ? 0.9 : 0.09, hp = C.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200;
  const g = env(hp, t0, 0.12 * v, dec, 0.002, music);
  for (const r of [1, 1.342, 1.709, 2.08, 2.53, 3.07]) { const o = C.createOscillator(); o.type = 'square'; o.frequency.value = 520 * r; o.connect(hp); o.start(t0); o.stop(t0 + dec + 0.1); }
  nz(t0, 0.22 * v, dec * 0.8, 'highpass', 7000, 0.7, 0.002, music);
  return g;
}
function ghungru(t0, v) { for (let i = 0; i < 4; i++) osc(t0 + Math.random() * 0.025, 'sine', 4200 + Math.random() * 2600, 0.05 * v, 0.12, 0, 0.001, music); }
function horn(t0, f, dur, v) {
  const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(380, t0); lp.frequency.linearRampToValueAtTime(900, t0 + 0.4); lp.Q.value = 1.5;
  const g = C.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.11 * v, t0 + 0.35);
  g.gain.setValueAtTime(0.11 * v, t0 + Math.max(0.4, dur - 0.4)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.3);
  lp.connect(g); g.connect(music);
  const vib = C.createOscillator(), vg = C.createGain(); vib.frequency.value = 4.6; vg.gain.value = f * 0.006; vib.connect(vg);
  for (const det of [0, 4, -5]) { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; vg.connect(o.frequency); o.connect(lp); o.start(t0); o.stop(t0 + dur + 0.4); }
  vib.start(t0); vib.stop(t0 + dur + 0.4);
}
function reed(t0, f, dur, v) {
  // a double-reed voice: bright saw through a nasal formant, with vibrato that grows into the note
  const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.1;
  const bp2 = C.createBiquadFilter(); bp2.type = 'peaking'; bp2.frequency.value = 2900; bp2.gain.value = 6;
  const g = C.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09 * v, t0 + 0.04);
  g.gain.setValueAtTime(0.085 * v, t0 + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.08);
  bp.connect(bp2); bp2.connect(g); g.connect(music);
  const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.985, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.05);
  const o2 = C.createOscillator(); o2.type = 'square'; o2.frequency.value = f * 2; const o2g = C.createGain(); o2g.gain.value = 0.25;
  const vib = C.createOscillator(), vg = C.createGain(); vib.frequency.value = 5.8; vg.gain.setValueAtTime(0, t0); vg.gain.linearRampToValueAtTime(f * 0.012, t0 + Math.min(0.5, dur));
  vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
  o.connect(bp); o2.connect(o2g); o2g.connect(bp);
  for (const n of [o, o2, vib]) { n.start(t0); n.stop(t0 + dur + 0.12); }
}
function templeBell(t0, f, v) { [[1, 1, 2.6], [2.0, 0.5, 1.8], [2.76, 0.4, 1.4], [4.1, 0.2, 0.9], [5.4, 0.12, 0.6]].forEach(([r, a, d]) => osc(t0, 'sine', f * r, a * 0.22 * v, d, 0, 0.002)); }

/* ---------- the sequencer ---------- */
function tick() {
  if (!C) return;
  const S = st.song;
  while (st.next < C.currentTime + 0.14) {
    const stepDur = 60 / ((S ? S.bpm : 80) * st.tempo) / 4;
    if (S) play(S, st.step % 32, st.next, stepDur);
    st.step++;
    st.next += stepDur;
  }
}
function play(S, i, t0, sd) {
  const I = st.I, bar = Math.floor(st.step / 32) % 2, real = realMusic();
  if (!real && !st.quiet && I > 0.05) {
    const v = (S.soft ? 0.4 : 0.55) + 0.45 * I, c = S.drums[i];
    if (c === 'D') dhin(t0, v);
    else if (c === 't') ta(t0, v);
    else if (c === 'g') ghe(t0, v);
    else if (I > 0.78 && i % 2 === 1 && Math.random() < 0.35) ta(t0, v * 0.6); // fills when it gets hot
    if (I >= 0.3 && S.cym[i] !== '.') bhusya(t0, 0.6 + 0.4 * I, S.cym[i] === 'O');
  }
  if ((S.bells || st.ghungru) && I >= 0.35 && (S.bells ? S.bells[i] === 'x' : i % 2 === 0)) ghungru(t0, 0.5 + I * 0.5);
  if (S.toll && S.toll.includes(i)) templeBell(t0, 392, 0.7);
  if (real) return; // the recording carries the music
  if (I >= 0.12) for (const [s, n, l] of S.horn) if (s === i) horn(t0, hz(n), l * sd, 0.55 + I * 0.45);
  const mel = bar === 1 && S.reed2 ? S.reed2 : S.reed;
  if (I >= S.reedAt) for (const [s, n, l] of mel) if (s === i) reed(t0, hz(n), l * sd * 0.95, 0.6 + 0.4 * I);
}

/* ---------- public ---------- */
export const AU = {
  init: initAudio,
  get on() { return !!C; },
  song(name, I) { st.song = SONGS[name] || null; st.songName = name; st.quiet = false; st.tempo = 1; st.ghungru = false; if (I !== undefined) st.I = I; applyMix(); },
  intensity(v) { const n = Math.max(0, Math.min(1, v)); if (Math.abs(n - st.I) > 0.02) { st.I = n; shapeBeds(); } },
  quiet(on) { if (st.quiet !== on) { st.quiet = on; shapeBeds(); } },
  tempo(m) { if (st.tempo !== m) { st.tempo = m; shapeBeds(); } },
  ghungru(on) { st.ghungru = on; },
  amb(crowd = 0, wind = 0) {
    if (!C) return;
    crowdG.gain.setTargetAtTime(crowd * (beds.amb ? 0.15 : 0.5), C.currentTime, 0.4); // the recording already has a crowd
    windG.gain.setTargetAtTime(wind * 0.6, C.currentTime, 0.25);
  },
  setMuted(m) { save.mute = m; persist(); if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, C.currentTime, 0.05); },
  get muted() { return !!save.mute; },
  get status() { return { ctx: C && C.state, loaded: Object.keys(buffers).filter((k) => buffers[k]), music: beds.music && beds.music.name, amb: beds.amb && beds.amb.name, synth: !realMusic() }; },
};

const now = () => (C ? C.currentTime : 0);
const ok = () => !!C && !save.mute;
export const SFX = {
  ui() { if (ok()) osc(now(), 'sine', 1500, 0.08, 0.08, 1200); },
  tick() { if (ok()) osc(now(), 'triangle', 900, 0.06, 0.05); },
  bell(f = 420) { if (ok()) templeBell(now(), f, 1); },
  chant() { // the rope crew's "ho!"
    if (!ok()) return; const t0 = now();
    for (const f of [128, 146, 171, 196]) {
      const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.1, t0); o.frequency.exponentialRampToValueAtTime(f * 0.85, t0 + 0.22);
      for (const [ff, q] of [[620, 6], [1050, 7]]) { const b = C.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; o.connect(b); env(b, t0 + Math.random() * 0.03, 0.18, 0.24, 0.03); }
      o.start(t0); o.stop(t0 + 0.32);
    }
  },
  creak(v = 1) { if (!ok()) return; const t0 = now(); const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(62, t0); o.frequency.linearRampToValueAtTime(84 + Math.random() * 20, t0 + 0.3); const b = C.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 380 + Math.random() * 120; b.Q.value = 9; o.connect(b); env(b, t0, 0.25 * v, 0.34, 0.06); o.start(t0); o.stop(t0 + 0.45); },
  thud(v = 1) { if (!ok()) return; const t0 = now(); osc(t0, 'sine', 80, 0.8 * v, 0.4, 38); nz(t0, 0.5 * v, 0.22, 'lowpass', 260); },
  scrape() { if (!ok()) return; const t0 = now(); const f = nz(t0, 0.5, 0.55, 'bandpass', 1700, 1.2, 0.02); const lfo = C.createOscillator(), lg = C.createGain(); lfo.frequency.value = 26; lg.gain.value = 600; lfo.connect(lg); lg.connect(f.frequency); lfo.start(t0); lfo.stop(t0 + 0.6); nz(t0, 0.3, 0.3, 'lowpass', 300); },
  whoosh(pan = 0, dur = 1.4) {
    if (!ok()) return; const t0 = now(); const s = C.createBufferSource(); s.buffer = noise;
    const f = C.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.setValueAtTime(260, t0); f.frequency.exponentialRampToValueAtTime(1500, t0 + dur * 0.7); f.frequency.exponentialRampToValueAtTime(500, t0 + dur);
    const p = C.createStereoPanner ? C.createStereoPanner() : null;
    s.connect(f); if (p) { p.pan.setValueAtTime(-pan, t0); p.pan.linearRampToValueAtTime(pan, t0 + dur); f.connect(p); env(p, t0, 0.55, dur * 0.6, dur * 0.4); } else env(f, t0, 0.55, dur * 0.6, dur * 0.4);
    s.start(t0); s.stop(t0 + dur + 0.1);
  },
  cheer(v = 1) { if (!ok()) return; const t0 = now(); nz(t0, 0.45 * v, 2.2, 'bandpass', 900, 0.5, 0.25); nz(t0 + 0.05, 0.3 * v, 1.8, 'bandpass', 1800, 0.7, 0.3); for (let i = 0; i < 5; i++) osc(t0 + Math.random() * 0.4, 'sine', 480 + Math.random() * 200, 0.04 * v, 0.6, 900 + Math.random() * 300, 0.1); },
  gasp() { if (ok()) nz(now(), 0.4, 0.5, 'bandpass', 1300, 1, 0.05); },
  laugh() { if (!ok()) return; const t0 = now(); for (let i = 0; i < 6; i++) { const tt = t0 + i * 0.13; nz(tt, 0.22, 0.09, 'bandpass', 900 + Math.random() * 500, 3, 0.01); } },
  shout() { if (!ok()) return; const t0 = now(); const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(260, t0); o.frequency.exponentialRampToValueAtTime(420, t0 + 0.12); o.frequency.exponentialRampToValueAtTime(300, t0 + 0.35); for (const [ff, q] of [[800, 5], [1300, 6], [2600, 8]]) { const b = C.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; o.connect(b); env(b, t0, 0.3, 0.38, 0.02); } o.start(t0); o.stop(t0 + 0.45); },
  heartbeat(v = 1) { if (!ok()) return; const t0 = now(); osc(t0, 'sine', 58, 0.7 * v, 0.14, 42); osc(t0 + 0.2, 'sine', 54, 0.5 * v, 0.16, 40); },
  stamp() { if (!ok()) return; const t0 = now(); osc(t0, 'sine', 90, 0.5, 0.2, 50); ghungru(t0, 1.4); },
  trumpet() { if (!ok()) return; const t0 = now(); const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(330, t0); o.frequency.linearRampToValueAtTime(560, t0 + 0.25); o.frequency.linearRampToValueAtTime(420, t0 + 0.8); const b = C.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 1100; b.Q.value = 2; o.connect(b); env(b, t0, 0.35, 0.8, 0.05); o.start(t0); o.stop(t0 + 0.9); },
  flameOut() { if (ok()) nz(now(), 0.35, 0.35, 'lowpass', 700, 0.7, 0.01); },
  light() { if (!ok()) return; const t0 = now(); nz(t0, 0.2, 0.25, 'highpass', 3000); osc(t0 + 0.05, 'sine', 1800, 0.06, 0.4, 2400); },
  drip() { if (ok()) osc(now(), 'sine', 1100, 0.2, 0.12, 380); },
  win() { if (!ok()) return; const t0 = now(); ['D5', 'F#5', 'A5', 'D6'].forEach((n, i) => osc(t0 + i * 0.09, 'triangle', hz(n), 0.12, 0.5)); templeBell(t0 + 0.3, 520, 0.8); },
  lose() { if (!ok()) return; const t0 = now(); osc(t0, 'triangle', 330, 0.15, 0.5, 200); },
};
