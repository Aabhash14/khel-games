// Living photos: real Indra Jatra photographs (Wikimedia Commons, credited in js/data/credits.js)
// given depth and life with WebGL. Each photo has a hand-marked depth layout: a horizon gradient
// plus a few subject blobs (the Lakhey's mask, the pole, the crowd). The camera drifts slowly,
// and tilting the phone or moving the mouse shifts near layers more than far ones.
import { E } from './engine.js';

// focus: what must stay in frame on narrow screens. blobs: [u, v, radiusU, radiusV, depth 0 far..1 near]
export const PHOTOS = {
  night: { file: 'night.webp', focus: [0.5, 0.55], horizon: 0.58, blobs: [[0.5, 0.84, 0.65, 0.16, 0.8], [0.68, 0.4, 0.3, 0.35, 0.4]] },
  raising: { file: 'raising.webp', focus: [0.42, 0.45], horizon: 0.62, blobs: [[0.38, 0.28, 0.1, 0.3, 0.55], [0.5, 0.9, 0.65, 0.12, 0.85]] },
  start: { file: 'start.webp', focus: [0.5, 0.5], horizon: 0.66, blobs: [[0.5, 0.42, 0.05, 0.42, 0.6], [0.87, 0.5, 0.18, 0.28, 0.5], [0.5, 0.94, 0.65, 0.08, 0.85]] },
  crowd: { file: 'crowd.webp', focus: [0.45, 0.45], horizon: 0.42, blobs: [[0.5, 0.88, 0.7, 0.2, 0.95]] },
  offering: { file: 'offering.webp', focus: [0.5, 0.45], horizon: 0.5, blobs: [[0.5, 0.25, 0.42, 0.24, 0.3], [0.53, 0.9, 0.16, 0.16, 0.95], [0.5, 0.62, 0.4, 0.08, 0.55]] },
  basantapur: { file: 'basantapur.webp', focus: [0.35, 0.55], horizon: 0.6, blobs: [[0.85, 0.5, 0.2, 0.3, 0.55], [0.17, 0.42, 0.05, 0.42, 0.85]] },
  lakhey: { file: 'lakhey.webp', focus: [0.47, 0.42], horizon: 0.9, blobs: [[0.47, 0.42, 0.13, 0.2, 0.8], [0.45, 0.68, 0.32, 0.34, 0.6], [0.1, 0.5, 0.12, 0.4, 0.7]] },
  ropes: { file: 'ropes.webp', focus: [0.5, 0.45], horizon: 0.4, blobs: [[0.5, 0.48, 0.42, 0.34, 0.6], [0.8, 0.7, 0.16, 0.26, 0.9]] },
  procession: { file: 'procession.webp', focus: [0.5, 0.5], horizon: 0.35, blobs: [[0.6, 0.3, 0.2, 0.2, 0.35]] },
  swet: { file: 'swet.webp', focus: [0.5, 0.6], horizon: 0.82, blobs: [[0.5, 0.6, 0.15, 0.21, 0.5], [0.5, 0.93, 0.55, 0.1, 0.9]] },
  // the six Upaku shrines
  'sh-ganesh': { file: 'sh-ganesh.webp', focus: [0.55, 0.55], horizon: 0.72, blobs: [[0.55, 0.5, 0.25, 0.4, 0.55], [0.3, 0.6, 0.1, 0.25, 0.75], [0.85, 0.5, 0.08, 0.45, 0.8]] },
  'sh-jaisi': { file: 'sh-jaisi.webp', focus: [0.52, 0.5], horizon: 0.75, blobs: [[0.52, 0.35, 0.18, 0.35, 0.3], [0.52, 0.82, 0.12, 0.14, 0.8], [0.05, 0.3, 0.1, 0.35, 0.6]] },
  'sh-lagan': { file: 'sh-lagan.webp', focus: [0.4, 0.6], horizon: 0.75, blobs: [[0.27, 0.55, 0.1, 0.25, 0.45], [0.55, 0.45, 0.12, 0.2, 0.35], [0.55, 0.9, 0.5, 0.1, 0.8]] },
  'sh-akash': { file: 'sh-akash.webp', focus: [0.55, 0.55], horizon: 0.85, blobs: [[0.55, 0.5, 0.45, 0.25, 0.35], [0.5, 0.92, 0.5, 0.1, 0.85]] },
  'sh-jana': { file: 'sh-jana.webp', focus: [0.5, 0.55], horizon: 0.8, blobs: [[0.48, 0.5, 0.25, 0.35, 0.35], [0.08, 0.5, 0.08, 0.5, 0.9], [0.85, 0.4, 0.15, 0.4, 0.5]] },
  'sh-annapurna': { file: 'sh-annapurna.webp', focus: [0.45, 0.55], horizon: 0.7, blobs: [[0.33, 0.65, 0.15, 0.35, 0.85], [0.6, 0.6, 0.15, 0.08, 0.65], [0.6, 0.3, 0.4, 0.2, 0.25]] },
  indra: { file: 'indra.webp', focus: [0.5, 0.55], horizon: 0.7, blobs: [[0.5, 0.58, 0.15, 0.22, 0.6], [0.15, 0.5, 0.05, 0.5, 0.85], [0.88, 0.45, 0.05, 0.5, 0.85]] },
};
// colour grades: exposure, contrast, saturation, tint, vignette, blur (uv), flicker
const GRADES = {
  cine: { exp: 1.0, con: 1.08, sat: 1.05, tint: [1.04, 1.0, 0.94], vig: 0.55, blur: 0, flick: 0.02 },
  dusk: { exp: 0.74, con: 1.08, sat: 0.9, tint: [1.06, 0.92, 0.9], vig: 0.62, blur: 0, flick: 0.03 },
  night: { exp: 0.82, con: 1.1, sat: 0.95, tint: [1.08, 0.96, 0.86], vig: 0.7, blur: 0, flick: 0.05 },
  backdrop: { exp: 0.7, con: 1.02, sat: 0.9, tint: [1.05, 0.97, 0.9], vig: 0.6, blur: 0.0016, flick: 0.03 },
  nightdrop: { exp: 0.55, con: 1.05, sat: 0.85, tint: [1.0, 0.92, 1.05], vig: 0.72, blur: 0.0016, flick: 0.06 },
};

const VS = 'attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; v.y = 1.0 - v.y; gl_Position = vec4(p, 0.0, 1.0); }';
const FS = `precision mediump float;
varying vec2 v;
uniform sampler2D tex; uniform vec2 scale, offset, par; uniform float horizon, alpha, expo, con, sat, vig, blur, time, flick, darken;
uniform vec4 b0, b1, b2; uniform vec3 bd, tint;
float blob(vec2 uv, vec4 b, float d){ float e = length((uv - b.xy) / max(b.zw, vec2(0.001))); return d * (1.0 - smoothstep(0.55, 1.05, e)); }
float depth(vec2 uv){ float d = smoothstep(horizon - 0.3, 1.05, uv.y) * 0.85; d = max(d, blob(uv, b0, bd.x)); d = max(d, blob(uv, b1, bd.y)); d = max(d, blob(uv, b2, bd.z)); return d; }
float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = v * scale + offset;
  vec2 q = uv - par * (depth(uv) - 0.4);
  q = uv - par * (depth(q) - 0.4);
  q = clamp(q, vec2(0.001), vec2(0.999));
  vec3 c;
  if (blur > 0.0) {
    c = vec3(0.0);
    for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) c += texture2D(tex, q + vec2(float(i), float(j)) * blur).rgb;
    c /= 25.0;
  } else c = texture2D(tex, q).rgb;
  float f = 1.0 + flick * (sin(time * 7.3) * 0.5 + sin(time * 13.1 + 1.7) * 0.3);
  c *= expo * f * (1.0 - darken);
  c = (c - 0.5) * con + 0.5;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, sat) * tint;
  vec2 cv = v - 0.5; c *= 1.0 - vig * smoothstep(0.25, 0.85, length(cv * vec2(1.1, 1.0)));
  c += (hash(v * 800.0 + time) - 0.5) * 0.035;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), alpha);
}`;

let cv, gl, prog, U = {}, fallback = null;
const tex = {}, imgs = {}, loading = {};
const st = { cur: null, prev: null, fade: 1, pointer: [0, 0], par: [0, 0], tilt: null, darken: 0, darkenT: 0, push: 0, pushT: 0, pan: 0, panT: 0, t: 0, visible: false, slides: null, slideT: 0 };

export const Photo = {
  init(canvas) {
    cv = canvas;
    try {
      gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
    } catch (e) { gl = null; }
    if (gl) {
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      try {
        prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog); gl.useProgram(prog);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        for (const n of ['tex', 'scale', 'offset', 'par', 'horizon', 'alpha', 'expo', 'con', 'sat', 'vig', 'blur', 'time', 'flick', 'darken', 'b0', 'b1', 'b2', 'bd', 'tint']) U[n] = gl.getUniformLocation(prog, n);
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      } catch (e) { console.warn('photo shader', e); gl = null; }
    }
    if (!gl) fallback = cv.getContext('2d');
    addEventListener('pointermove', (e) => { st.pointer = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]; }, { passive: true });
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      st.tilt = [Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25))];
    });
    resize(); addEventListener('resize', resize);
    requestAnimationFrame(loop);
  },
  // iOS asks for motion permission; call from a tap
  askMotion() { try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) { /* not supported */ } },
  preload(keys) { for (const k of keys) load(k); },
  // show a photo. o: grade, zoom [from, to], dur, panX (drift direction), slides (array of keys to cycle)
  show(key, o = {}) {
    st.slides = o.slides || null; st.slideT = o.slideEvery || 7;
    set(key, o);
  },
  hide() { st.slides = null; if (st.cur) { st.prev = st.cur; st.cur = null; st.fade = 0; } },
  darken(v) { st.darkenT = v; },
  push(v) { st.pushT = v; },
  pan(v) { st.panT = v; },
  get key() { return st.cur && st.cur.key; },
  image(key) { return imgs[key] && imgs[key].complete ? imgs[key] : null; },
  // where a point of the photo (u, v in 0..1) is on screen right now, ignoring parallax
  toScreen(u, v) {
    const c = st.cur; if (!c || !c.fit) return { x: E.W * u, y: E.H * v };
    const f = c.fit;
    return { x: (u - f.ox) / f.sx * E.W, y: (v - f.oy) / f.sy * E.H };
  },
};

function load(key) {
  if (imgs[key] || !PHOTOS[key]) return loading[key];
  const im = new Image(); im.decoding = 'async'; im.src = 'photos/' + PHOTOS[key].file; imgs[key] = im;
  loading[key] = im.decode().then(() => { if (gl) { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); tex[key] = t; } }).catch(() => {});
  return loading[key];
}
function set(key, o) {
  if (st.cur && st.cur.key === key && !o.restart) { Object.assign(st.cur, { grade: GRADES[o.grade || st.cur.gradeName] || st.cur.grade, gradeName: o.grade || st.cur.gradeName }); return; }
  load(key);
  st.prev = st.cur; st.fade = st.prev ? 0 : 1;
  const z = o.zoom || [1.06, 1.16];
  st.cur = { key, spec: PHOTOS[key], grade: GRADES[o.grade || 'cine'], gradeName: o.grade || 'cine', z0: z[0], z1: z[1], dur: o.dur || 14, t: 0, drift: o.panX ?? (Math.random() < 0.5 ? -1 : 1), fit: null };
  st.darkenT = 0; st.pushT = 0; st.panT = 0;
}
function resize() {
  const dpr = Math.min(1.25, devicePixelRatio || 1);
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  if (gl) gl.viewport(0, 0, cv.width, cv.height);
}
// cover-fit with zoom, focus and drift: returns uv = v * scale + offset
function fit(layer) {
  const im = imgs[layer.key]; if (!im || !im.naturalWidth) return null;
  const ia = im.naturalWidth / im.naturalHeight, sa = innerWidth / innerHeight;
  let sx = 1, sy = 1;
  if (ia > sa) sx = sa / ia; else sy = ia / sa;
  const k = Math.min(1, layer.t / layer.dur), ease = k * k * (3 - 2 * k);
  const zoom = (layer.z0 + (layer.z1 - layer.z0) * ease) * (1 + st.push);
  sx /= zoom; sy /= zoom;
  const [fx, fy] = layer.spec.focus;
  const drift = (ease - 0.5) * 0.04 * layer.drift + st.pan;
  let ox = fx - sx / 2 + drift, oy = fy - sy / 2;
  ox = Math.max(0.01, Math.min(0.99 - sx, ox)); oy = Math.max(0.01, Math.min(0.99 - sy, oy));
  return { sx, sy, ox, oy };
}

let last = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
  requestAnimationFrame(loop);
  st.t += dt;
  const ease = (a, b, k) => a + (b - a) * Math.min(1, dt * k);
  const target = st.tilt || st.pointer;
  st.par[0] = ease(st.par[0], target[0], 3); st.par[1] = ease(st.par[1], target[1], 3);
  st.darken = ease(st.darken, st.darkenT, 6); st.push = ease(st.push, st.pushT, 4); st.pan = ease(st.pan, st.panT, 1.5);
  st.fade = Math.min(1, st.fade + dt / 0.9);
  if (st.slides && st.cur) {
    st.slideT -= dt;
    if (st.slideT <= 0) { const i = st.slides.indexOf(st.cur.key); set(st.slides[(i + 1) % st.slides.length], { grade: st.cur.gradeName, zoom: [1.05, 1.18] }); st.slideT = 7; load(st.slides[(i + 2) % st.slides.length]); }
  }
  const layers = [];
  if (st.prev && st.fade < 1) layers.push([st.prev, 1]);
  if (st.cur) layers.push([st.cur, st.prev ? st.fade : 1]);
  for (const [L] of layers) L.t += dt;
  if (gl) {
    gl.clearColor(0.07, 0.04, 0.07, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    for (const [L, a] of layers) drawGL(L, a);
  } else if (fallback) {
    fallback.fillStyle = '#120a12'; fallback.fillRect(0, 0, cv.width, cv.height);
    for (const [L, a] of layers) draw2D(L, a);
  }
}
function drawGL(L, alpha) {
  const t = tex[L.key], f = fit(L); if (!t || !f) return;
  L.fit = f;
  const s = L.spec, g = L.grade, b = s.blobs, P = (i) => b[i] || [0, 0, 0.001, 0.001, 0];
  gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U.tex, 0);
  gl.uniform2f(U.scale, f.sx, f.sy); gl.uniform2f(U.offset, f.ox, f.oy);
  const amt = E.reduced ? 0 : 0.018;
  gl.uniform2f(U.par, st.par[0] * amt, st.par[1] * amt * 0.6);
  gl.uniform1f(U.horizon, s.horizon); gl.uniform1f(U.alpha, alpha);
  gl.uniform1f(U.expo, g.exp); gl.uniform1f(U.con, g.con); gl.uniform1f(U.sat, g.sat); gl.uniform1f(U.vig, g.vig);
  gl.uniform1f(U.blur, g.blur); gl.uniform1f(U.time, st.t); gl.uniform1f(U.flick, E.reduced ? 0 : g.flick); gl.uniform1f(U.darken, st.darken);
  gl.uniform3f(U.tint, ...g.tint);
  for (let i = 0; i < 3; i++) gl.uniform4f(U['b' + i], P(i)[0], P(i)[1], P(i)[2], P(i)[3]);
  gl.uniform3f(U.bd, P(0)[4], P(1)[4], P(2)[4]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function draw2D(L, alpha) {
  const im = imgs[L.key], f = fit(L); if (!im || !f) return;
  L.fit = f;
  const g = fallback; g.globalAlpha = alpha;
  const iw = im.naturalWidth, ih = im.naturalHeight;
  g.drawImage(im, f.ox * iw, f.oy * ih, f.sx * iw, f.sy * ih, 0, 0, cv.width, cv.height);
  g.globalAlpha = 1;
  g.fillStyle = `rgba(10,5,8,${1 - L.grade.exp * (1 - st.darken)})`; g.fillRect(0, 0, cv.width, cv.height);
}
