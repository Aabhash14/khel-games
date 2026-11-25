/* Umbra: a shadow puzzle.
 * A lamp behind the viewer shines straight at the wall (along -z), so the wall shadow is the
 * exact orthographic projection of the sculpture onto the x/y plane. Each target is the
 * projection under one of the 24 axis-aligned rotations; the player turns the sculpture freely
 * and we snap once the shadow overlaps the outline closely enough.
 */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  if (!window.THREE || !window.UMBRA_LEVELS) { $("fail").hidden = false; return; }

  const LEVELS = window.UMBRA_LEVELS;
  const WALL_Z = -22;          // wall plane depth
  const S = 7;                 // half-extent of the shadow window in world units
  const MASK_N = 84;           // match-raster resolution
  // Snap ("magnet") once the sculpture is within this angle of an exact solution. Measured:
  // raw shadow overlap is only ~0.85 at 3 degrees off, so an overlap threshold is unplayable
  // with free rotation, while at 15 degrees the shadow already reads clearly as the letter.
  const SNAP_ANGLE = 15 * Math.PI / 180;
  // Meter: raw overlap rescaled so a scrambled pose reads low and the snap zone reads ~90-100%.
  const METER_FLOOR = 0.22, METER_CEIL = 0.66;
  const STORE_KEY = "umbra.v1";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- persistence ---------------- */
  const store = (() => {
    let data = { unlocked: 0, best: {}, sound: true, seenIntro: false };
    try { Object.assign(data, JSON.parse(localStorage.getItem(STORE_KEY)) || {}); } catch (e) {}
    return {
      data,
      save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {} }
    };
  })();

  /* ---------------- renderer & scene ---------------- */
  const canvas = $("stage");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (e) { $("fail").hidden = false; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const ROOM = new THREE.Color("#15120f");
  scene.background = ROOM;
  scene.fog = new THREE.Fog(ROOM, 40, 90);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

  // Lamp: exact parallel light along -z, the only shadow caster.
  const lamp = new THREE.DirectionalLight(0xfff0d8, 0.95);
  lamp.position.set(0, 0, 30);
  lamp.target.position.set(0, 0, WALL_Z);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  Object.assign(lamp.shadow.camera, { left: -S - 1, right: S + 1, top: S + 1, bottom: -S - 1, near: 1, far: 70 });
  lamp.shadow.bias = -0.0008;
  lamp.shadow.radius = 2;
  scene.add(lamp, lamp.target);

  // Warm ambient sets shadow darkness; a grazing fill models the sculpture without lifting the wall shadow.
  scene.add(new THREE.AmbientLight(0xd9c3a5, 0.32));
  const fill = new THREE.DirectionalLight(0xffe6c4, 0.55);
  fill.position.set(10, 14, 1.5);
  scene.add(fill);

  /* Wall: paper texture with a lamp pool baked in. */
  function makeWallTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(512, 512, 0, 512, 512, 512);
    grad.addColorStop(0, "#efe6d4");
    grad.addColorStop(0.16, "#e9dfcb");
    grad.addColorStop(0.34, "#9d927f");
    grad.addColorStop(0.62, "#2b251f");
    grad.addColorStop(1, "#15120f");
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 1024);
    // paper grain
    const img = g.getImageData(0, 0, 1024, 1024), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }
  const WALL_SIZE = 110;
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(WALL_SIZE, WALL_SIZE),
    new THREE.MeshLambertMaterial({ map: makeWallTexture() })
  );
  wall.position.set(0, 0, WALL_Z);
  wall.receiveShadow = true;
  scene.add(wall);

  /* Target outline drawn on a transparent sheet laid just in front of the wall. */
  const OUT_N = 1024;
  const outCanvas = document.createElement("canvas");
  outCanvas.width = outCanvas.height = OUT_N;
  const outCtx = outCanvas.getContext("2d");
  const outTex = new THREE.CanvasTexture(outCanvas);
  outTex.encoding = THREE.sRGBEncoding;
  outTex.anisotropy = 8;
  const outline = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * S, 2 * S),
    new THREE.MeshBasicMaterial({ map: outTex, transparent: true, depthWrite: false })
  );
  outline.position.set(0, 0, WALL_Z + 0.03);
  scene.add(outline);

  /* ---------------- rotation helpers ---------------- */
  const CUBE_ROTS = (() => {
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]], out = [];
    for (const p of perms) for (let s = 0; s < 8; s++) {
      const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let r = 0; r < 3; r++) m[r * 3 + p[r]] = (s >> r) & 1 ? -1 : 1;
      if (det3(m) === 1) out.push({ m, q: quatFromRows(m) });
    }
    return out;
  })();
  function det3(m) {
    return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  }
  function quatFromRows(m) {
    const M = new THREE.Matrix4().set(m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1);
    return new THREE.Quaternion().setFromRotationMatrix(M);
  }
  function randomQuat() {
    const u1 = Math.random(), u2 = Math.random() * Math.PI * 2, u3 = Math.random() * Math.PI * 2;
    const a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
    return new THREE.Quaternion(a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3));
  }
  const quatAngle = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a.dot(b))));

  /* ---------------- sculpture ---------------- */
  const pivot = new THREE.Group();
  scene.add(pivot);
  let sculpture = null;   // { voxels:[[x,y,z]], faces:[{n, c:[4 corners]}], mesh }

  const FACE_DEFS = [
    { n: [1, 0, 0], c: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
    { n: [-1, 0, 0], c: [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]] },
    { n: [0, 1, 0], c: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
    { n: [0, -1, 0], c: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
    { n: [0, 0, 1], c: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { n: [0, 0, -1], c: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
  ];

  function buildSculpture(level) {
    const [W, H, D] = level.dims;
    const voxels = level.vox.split(" ").map(s => [+s[0] - (W - 1) / 2, +s[1] - (H - 1) / 2, +s[2] - (D - 1) / 2]);
    const key = (x, y, z) => x + "," + y + "," + z;
    const occ = new Set(voxels.map(v => key(...v)));
    const faces = [];
    const pos = [], nor = [], idx = [], edges = [];
    for (const [x, y, z] of voxels) {
      for (const f of FACE_DEFS) {
        if (occ.has(key(x + f.n[0], y + f.n[1], z + f.n[2]))) continue;
        const c = f.c.map(o => [x + o[0] * 0.5, y + o[1] * 0.5, z + o[2] * 0.5]);
        faces.push({ n: f.n, c });
        const base = pos.length / 3;
        for (const p of c) { pos.push(...p); nor.push(...f.n); }
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        for (let i = 0; i < 4; i++) edges.push(...c[i], ...c[(i + 1) % 4]);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0xf2eadc, roughness: 0.9, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    }));
    mesh.castShadow = true;
    const egeo = new THREE.BufferGeometry();
    egeo.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
    const lines = new THREE.LineSegments(egeo, new THREE.LineBasicMaterial({ color: 0x7d7062, transparent: true, opacity: 0.45 }));
    const group = new THREE.Group();
    group.add(mesh, lines);
    return { voxels, faces, group };
  }

  /* ---------------- silhouettes ---------------- */
  function makeMask() {
    const c = document.createElement("canvas");
    c.width = c.height = MASK_N;
    return c.getContext("2d", { willReadFrequently: true });
  }
  const liveMask = makeMask();
  const m4 = new THREE.Matrix4();

  // Union of light-facing faces projected along z = the shadow.
  function rasterize(ctx, q) {
    const e = m4.makeRotationFromQuaternion(q).elements; // column-major
    const k = MASK_N / (2 * S);
    ctx.clearRect(0, 0, MASK_N, MASK_N);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    for (const f of sculpture.faces) {
      const nz = e[2] * f.n[0] + e[6] * f.n[1] + e[10] * f.n[2];
      if (nz <= 1e-4) continue;
      for (let i = 0; i < 4; i++) {
        const p = f.c[i];
        const x = e[0] * p[0] + e[4] * p[1] + e[8] * p[2];
        const y = e[1] * p[0] + e[5] * p[1] + e[9] * p[2];
        const px = (x + S) * k, py = (S - y) * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill();
    const d = ctx.getImageData(0, 0, MASK_N, MASK_N).data;
    const out = new Uint8Array(MASK_N * MASK_N);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] > 127 ? 1 : 0;
    return out;
  }
  function iou(a, b) {
    let inter = 0, uni = 0;
    for (let i = 0; i < a.length; i++) { inter += a[i] & b[i]; uni += a[i] | b[i]; }
    return uni ? inter / uni : 0;
  }
  // Integer cells of the shadow under an axis-aligned rotation (row-major matrix).
  function cellsFor(m) {
    const s = new Set();
    for (const [x, y, z] of sculpture.voxels)
      s.add(Math.round(m[0] * x + m[1] * y + m[2] * z) + "," + Math.round(m[3] * x + m[4] * y + m[5] * z));
    return s;
  }
  const sameSet = (a, b) => a.size === b.size && [...a].every(v => b.has(v));

  /* ---------------- outline drawing ---------------- */
  let outlineState = { cells: null, solved: false, fade: 1 };

  // Redraw (and re-upload the texture) only when the outline actually changes.
  let drawn = { ref: null, solved: null, fade: null };
  function drawOutlineIfChanged() {
    const s = outlineState;
    if (drawn.ref === s && drawn.solved === s.solved && drawn.fade === s.fade) return;
    drawn = { ref: s, solved: s.solved, fade: s.fade };
    drawOutline();
  }
  function drawOutline() {
    const { cells, solved } = outlineState;
    const g = outCtx, k = OUT_N / (2 * S);
    g.clearRect(0, 0, OUT_N, OUT_N);
    if (!cells) { outTex.needsUpdate = true; return; }
    g.globalAlpha = outlineState.fade;
    const toPx = (x, y) => [(x + S) * k, (S - y) * k];
    const list = [...cells].map(s => s.split(",").map(Number));
    // soft wash inside the target
    g.fillStyle = solved ? "rgba(224,80,46,0.30)" : "rgba(224,80,46,0.10)";
    for (const [x, y] of list) {
      const [px, py] = toPx(x - 0.5, y + 0.5);
      g.fillRect(px, py, k + 0.5, k + 0.5);
    }
    // perimeter edges
    g.beginPath();
    for (const [x, y] of list) {
      const has = (dx, dy) => cells.has((x + dx) + "," + (y + dy));
      const L = x - 0.5, R = x + 0.5, T = y + 0.5, B = y - 0.5;
      const seg = (x1, y1, x2, y2) => { const a = toPx(x1, y1), b = toPx(x2, y2); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); };
      if (!has(0, 1)) seg(L, T, R, T);
      if (!has(0, -1)) seg(L, B, R, B);
      if (!has(-1, 0)) seg(L, B, L, T);
      if (!has(1, 0)) seg(R, B, R, T);
    }
    g.strokeStyle = "#e0502e";
    g.lineCap = "round";
    g.lineWidth = solved ? 7 : 5;
    g.setLineDash(solved ? [] : [16, 12]);
    g.stroke();
    g.globalAlpha = 1;
    outTex.needsUpdate = true;
  }

  /* ---------------- game state ---------------- */
  const state = {
    level: 0,
    target: 0,
    targets: [],      // [{ cells, mask, valid:[cube rot indices], letter }]
    found: [],
    armed: true,
    busy: false,      // snapping / transitioning
    complete: false,  // every letter of this sculpture found
    gen: 0,           // bumps on every level load
    startTime: 0,
    hints: 0,
    playing: false,
  };

  function loadLevel(i) {
    state.gen++;          // invalidates callbacks still pending from the previous level
    state.complete = false;
    tween = null;
    state.level = i;
    const level = LEVELS[i];
    if (sculpture) pivot.remove(sculpture.group);
    sculpture = buildSculpture(level);
    pivot.add(sculpture.group);

    state.targets = level.targets.map((m, t) => {
      const cells = cellsFor(m);
      const tq = quatFromRows(m);
      const valid = CUBE_ROTS.map((r, ri) => sameSet(cellsFor(r.m), cells) ? ri : -1).filter(ri => ri >= 0);
      return { cells, mask: rasterize(makeMask(), tq), valid, letter: level.word[t] };
    });
    state.target = 0;
    state.found = [];
    state.hints = 0;
    state.busy = false;
    state.armed = true;
    state.startTime = performance.now();
    velocity.speed = 0;

    scramble(false);
    outlineState = { cells: state.targets[0].cells, solved: false, fade: 1 };
    $("levelNo").textContent = String(i + 1).padStart(2, "0");
    $("levelCount").textContent = String(LEVELS.length).padStart(2, "0");
    renderSlots();
    announce(`Sculpture ${i + 1}. Find ${level.word.length} letter${level.word.length > 1 ? "s" : ""}.`);
  }

  function scramble(animate = true) {
    let q, tries = 0;
    do {
      q = randomQuat();
      tries++;
    } while (tries < 60 && state.targets.some((t, i) => !state.found[i] && (
      t.valid.some(ri => quatAngle(q, CUBE_ROTS[ri].q) < SNAP_ANGLE * 3) ||
      iou(rasterize(liveMask, q), t.mask) > 0.45)));
    if (animate && !reduceMotion) tweenTo(q, 650, evaluate);
    else { pivot.quaternion.copy(q); evaluate(); }
  }

  /* ---------------- slots & glyphs ---------------- */
  function glyphEl(cells) {
    const pts = [...cells].map(s => s.split(",").map(Number));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const el = document.createElement("span");
    el.className = "glyph";
    el.style.gridTemplateColumns = `repeat(${w}, auto)`;
    let n = 0;
    for (let y = y1; y >= y0; y--) for (let x = x0; x <= x1; x++) {
      const i = document.createElement("i");
      if (cells.has(x + "," + y)) { i.className = "on"; i.style.animationDelay = (n++ * 18) + "ms"; }
      el.appendChild(i);
    }
    return el;
  }
  function renderSlots() {
    const ol = $("slots");
    ol.innerHTML = "";
    state.targets.forEach((t, i) => {
      const li = document.createElement("li");
      li.className = "slot" + (state.found[i] ? " found" : i === state.target ? " current" : "");
      if (state.found[i]) {
        li.appendChild(glyphEl(t.cells));
        li.setAttribute("aria-label", `Letter ${i + 1}: ${t.letter}`);
      } else {
        const q = document.createElement("span");
        q.className = "glyph-q";
        q.textContent = "?";
        li.appendChild(q);
        li.setAttribute("aria-label", `Letter ${i + 1}: not found yet`);
      }
      ol.appendChild(li);
    });
  }

  /* ---------------- matching ---------------- */
  let lastMatch = 0;
  function evaluate() {
    if (!state.playing || state.busy) return;
    const t = state.targets[state.target];
    const live = rasterize(liveMask, pivot.quaternion);
    const m = iou(live, t.mask);
    lastMatch = m;
    showMatch(m);
    const { q: best, angle } = nearestSolution(t);
    // After a snap, the player must leave the zone once before the next snap can fire.
    if (!state.armed) { if (angle > SNAP_ANGLE * 1.5) state.armed = true; return; }
    if (best && angle < SNAP_ANGLE) solveTarget(best);
  }

  function nearestSolution(t) {
    let q = null, angle = Infinity;
    for (const ri of t.valid) {
      const a = quatAngle(pivot.quaternion, CUBE_ROTS[ri].q);
      if (a < angle) { angle = a; q = CUBE_ROTS[ri].q; }
    }
    return { q, angle };
  }

  function showMatch(raw) {
    const m = raw >= 1 ? 1 : Math.min(0.99, Math.max(0, (raw - METER_FLOOR) / (METER_CEIL - METER_FLOOR)));
    const pct = Math.round(m * 100);
    $("matchNum").textContent = String(pct).padStart(3, "0");
    $("matchFill").style.width = pct + "%";
    document.querySelector(".meter").classList.toggle("hot", m > 0.72);
  }

  function solveTarget(q) {
    state.busy = true;
    velocity.speed = 0;
    endDrag();
    const gen = state.gen;
    tweenTo(q, reduceMotion ? 0 : 420, () => {
      if (gen !== state.gen) return; // level changed mid-snap
      const idx = state.target;
      state.found[idx] = true;
      outlineState.solved = true;
      showMatch(1);
      chime(idx);
      renderSlots();
      announce(`Found the letter ${state.targets[idx].letter}.`);
      const next = state.targets.findIndex((_, i) => !state.found[i]);
      setTimeout(() => {
        if (gen !== state.gen) return;
        if (next === -1) return levelComplete();
        state.target = next;
        state.armed = false;
        state.busy = false;
        fadeOutlineTo(state.targets[next].cells);
        renderSlots();
        evaluate(); // refresh the meter against the new outline
      }, reduceMotion ? 300 : 1200);
    });
  }

  function fadeOutlineTo(cells) {
    const t0 = performance.now(), dur = reduceMotion ? 1 : 500;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      if (p < 0.5) outlineState.fade = 1 - p * 2;
      else {
        if (outlineState.cells !== cells) outlineState = { cells, solved: false, fade: 0 };
        outlineState.fade = (p - 0.5) * 2;
      }
      if (p < 1) requestAnimationFrame(step);
      else outlineState.fade = 1;
    };
    requestAnimationFrame(step);
  }

  function levelComplete() {
    const secs = Math.round((performance.now() - state.startTime) / 1000);
    const i = state.level;
    const prev = store.data.best[i];
    if (prev == null || secs < prev) store.data.best[i] = secs;
    store.data.unlocked = Math.max(store.data.unlocked, Math.min(i + 1, LEVELS.length - 1));
    if (i === LEVELS.length - 1) store.data.allDone = true;
    store.save();

    const last = i === LEVELS.length - 1;
    $("winEyebrow").textContent = last ? "Every word found" : "Word found";
    const ww = $("winWord");
    ww.innerHTML = "";
    state.targets.forEach(t => ww.appendChild(glyphEl(t.cells)));
    ww.setAttribute("aria-label", LEVELS[i].word);
    const hintTxt = state.hints ? ` · ${state.hints} hint${state.hints > 1 ? "s" : ""}` : " · no hints";
    const bestTxt = prev != null && secs < prev ? " · new best" : "";
    $("winStats").textContent = `Sculpture ${String(i + 1).padStart(2, "0")} · ${fmtTime(secs)}${hintTxt}${bestTxt}`;
    $("nextBtn").textContent = last ? "Play again from the start" : "Next sculpture";
    state.playing = false;
    state.complete = true;
    const gen = state.gen;
    setTimeout(() => {
      if (gen !== state.gen || !$("levels").hidden) return;
      openOverlay("win");
      $("nextBtn").focus();
    }, reduceMotion ? 0 : 400);
    announce(`Word found: ${LEVELS[i].word}.`);
  }

  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* ---------------- hint ---------------- */
  function hint() {
    if (!canInteract()) return;
    const t = state.targets[state.target];
    let best = null, bestAng = Infinity;
    for (const ri of t.valid) {
      const a = quatAngle(pivot.quaternion, CUBE_ROTS[ri].q);
      if (a < bestAng) { bestAng = a; best = CUBE_ROTS[ri].q; }
    }
    if (!best) return;
    state.hints++;
    state.armed = true;
    const goal = pivot.quaternion.clone().slerp(best, bestAng > 1.2 ? 0.45 : 0.6);
    tweenTo(goal, reduceMotion ? 0 : 700, evaluate);
  }

  /* ---------------- tweening ---------------- */
  let tween = null;
  function tweenTo(q, dur, done) {
    const from = pivot.quaternion.clone();
    tween = { from, to: q.clone(), t0: performance.now(), dur: Math.max(1, dur), done };
  }
  function stepTween(now) {
    if (!tween) return false;
    const p = Math.min(1, (now - tween.t0) / tween.dur);
    const e = 1 - Math.pow(1 - p, 3);
    pivot.quaternion.copy(tween.from).slerp(tween.to, e);
    if (p >= 1) { const d = tween.done; tween = null; d && d(); }
    return true;
  }

  /* ---------------- input ---------------- */
  const pointers = new Map();
  const velocity = { axis: new THREE.Vector3(), speed: 0 };
  let dragging = false, lastMoveT = 0, twistAngle = null;
  const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3();
  const LIGHT_AXIS = new THREE.Vector3(0, 0, 1);

  function rotateBy(axisWorld, angle) {
    tmpQ.setFromAxisAngle(axisWorld, angle);
    pivot.quaternion.premultiply(tmpQ).normalize();
  }
  function dragRotate(dx, dy) {
    const len = Math.hypot(dx, dy);
    if (!len) return;
    const angle = len * 0.0085;
    tmpV.set(dy / len, dx / len, 0).applyQuaternion(camera.quaternion).normalize();
    rotateBy(tmpV, angle);
    const now = performance.now(), dt = Math.max(8, now - lastMoveT);
    lastMoveT = now;
    velocity.axis.copy(tmpV);
    velocity.speed = angle / dt * 16;
  }

  function canInteract() { return state.playing && !state.busy && !tween; }

  canvas.addEventListener("pointerdown", e => {
    if (!canInteract()) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragging = true;
    velocity.speed = 0;
    lastMoveT = performance.now();
    canvas.classList.add("dragging");
    hideGesture();
    if (pointers.size === 2) twistAngle = pairAngle();
  });
  canvas.addEventListener("pointermove", e => {
    const p = pointers.get(e.pointerId);
    if (!p || !dragging || !canInteract()) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size >= 2) {
      const a = pairAngle();
      if (twistAngle != null) rotateBy(LIGHT_AXIS, -(a - twistAngle));
      twistAngle = a;
      velocity.speed = 0;
    } else if (e.shiftKey) {
      rotateBy(LIGHT_AXIS, -dx * 0.01);
      velocity.speed = 0;
    } else {
      dragRotate(dx, dy);
    }
    evaluate();
  });
  function pairAngle() {
    const [a, b] = [...pointers.values()];
    return Math.atan2(b.y - a.y, b.x - a.x);
  }
  function endDrag(e) {
    if (e) pointers.delete(e.pointerId); else pointers.clear();
    if (pointers.size < 2) twistAngle = null;
    if (pointers.size === 0) {
      dragging = false;
      canvas.classList.remove("dragging");
      if (performance.now() - lastMoveT > 80 || reduceMotion) velocity.speed = 0;
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", e => {
    if (!canInteract()) return;
    e.preventDefault();
    rotateBy(LIGHT_AXIS, e.deltaY * 0.0025);
    evaluate();
  }, { passive: false });

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeOverlay("levels"); return; }
    if (e.target.closest && e.target.closest("button") && (e.key === " " || e.key === "Enter")) return;
    if (!canInteract()) return;
    const step = e.shiftKey ? 0.02 : 0.08;
    const right = tmpV.set(1, 0, 0).applyQuaternion(camera.quaternion).clone();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    let handled = true;
    switch (e.key) {
      case "ArrowLeft": rotateBy(up, -step); break;
      case "ArrowRight": rotateBy(up, step); break;
      case "ArrowUp": rotateBy(right, -step); break;
      case "ArrowDown": rotateBy(right, step); break;
      case "q": case "Q": rotateBy(LIGHT_AXIS, step); break;
      case "e": case "E": rotateBy(LIGHT_AXIS, -step); break;
      case "h": case "H": hint(); break;
      case "r": case "R": scramble(); break;
      default: handled = false;
    }
    if (handled) { e.preventDefault(); hideGesture(); evaluate(); }
  });

  function hideGesture() { $("gesture").classList.add("gone"); }

  /* ---------------- sound ---------------- */
  let audio = null;
  function ensureAudio() {
    if (audio || !store.data.sound) return;
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  }
  function chime(step) {
    if (!store.data.sound) return;
    ensureAudio();
    if (!audio) return;
    if (audio.state === "suspended") audio.resume();
    const base = [261.63, 329.63, 392.0, 523.25][step % 4];
    const now = audio.currentTime;
    [1, 1.5, 2].forEach((mult, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = i ? "sine" : "triangle";
      o.frequency.value = base * mult;
      g.gain.setValueAtTime(0, now + i * 0.06);
      g.gain.linearRampToValueAtTime(0.12 / (i + 1), now + i * 0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 1.6);
      o.connect(g).connect(audio.destination);
      o.start(now + i * 0.06);
      o.stop(now + i * 0.06 + 1.7);
    });
  }
  function syncSoundBtn() { $("soundBtn").setAttribute("aria-pressed", String(!!store.data.sound)); }

  /* ---------------- overlays ---------------- */
  function openOverlay(id) { $(id).hidden = false; }
  function closeOverlay(id) {
    if ($(id).hidden) return;
    $(id).hidden = true;
    if (id !== "levels" || !$("intro").hidden) return;
    // a finished sculpture has nothing left to play: return to its win card
    if (state.complete) { openOverlay("win"); $("nextBtn").focus(); }
    else if ($("win").hidden) state.playing = true;
  }

  function renderLevelGrid() {
    const ol = $("levelGrid");
    ol.innerHTML = "";
    LEVELS.forEach((lv, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      const solved = store.data.best[i] != null;
      const locked = i > store.data.unlocked && !solved;
      b.type = "button";
      b.disabled = locked;
      b.className = (solved ? "solved" : "") + (i === state.level ? " current" : "");
      const word = solved ? lv.word : lv.word.replace(/./g, "·");
      b.innerHTML = `<span class="num">${String(i + 1).padStart(2, "0")}</span><span class="w">${word}</span><span class="t">${solved ? fmtTime(store.data.best[i]) : locked ? "Locked" : lv.word.length + " letter" + (lv.word.length > 1 ? "s" : "")}</span>`;
      b.setAttribute("aria-label", `Sculpture ${i + 1}${solved ? ", solved: " + lv.word : locked ? ", locked" : ""}`);
      b.addEventListener("click", () => {
        closeOverlay("levels");
        closeOverlay("win");
        loadLevel(i);
        state.playing = true;
      });
      li.appendChild(b);
      ol.appendChild(li);
    });
  }

  $("startBtn").addEventListener("click", () => {
    store.data.seenIntro = true;
    store.save();
    ensureAudio();
    $("intro").hidden = true;
    state.playing = true;
  });
  $("nextBtn").addEventListener("click", () => {
    $("win").hidden = true;
    const n = state.level + 1 < LEVELS.length ? state.level + 1 : 0;
    loadLevel(n);
    state.playing = true;
  });
  const showLevels = () => { state.playing = false; renderLevelGrid(); openOverlay("levels"); };
  $("levelsBtn").addEventListener("click", showLevels);
  $("winLevelsBtn").addEventListener("click", () => { $("win").hidden = true; showLevels(); });
  $("closeLevels").addEventListener("click", () => closeOverlay("levels"));
  $("levels").addEventListener("click", e => { if (e.target.id === "levels") closeOverlay("levels"); });
  $("hintBtn").addEventListener("click", hint);
  $("shuffleBtn").addEventListener("click", () => { if (canInteract()) scramble(); });
  $("soundBtn").addEventListener("click", () => {
    store.data.sound = !store.data.sound;
    store.save();
    syncSoundBtn();
    if (store.data.sound) { ensureAudio(); chime(0); }
  });

  function announce(msg) { $("live").textContent = msg; }

  /* ---------------- framing ---------------- */
  // Camera sits off the lamp axis so the sculpture never hides its own shadow:
  // to the side on wide screens, above on tall ones.
  function frame() {
    const w = innerWidth, h = innerHeight, aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    if (aspect >= 1) {
      camera.fov = 40;
      camera.position.set(19, 4, 17);
      camera.lookAt(-1.5, -0.5, -9);
    } else {
      camera.fov = 50;
      camera.position.set(2.5, 17, 25);
      camera.lookAt(0, -1.2, -9);
    }
    // keep the scene in frame on narrow landscape / tall portrait
    const fit = aspect >= 1 ? Math.min(1, aspect / 1.45) : Math.min(1, aspect / 0.56);
    camera.zoom = 0.72 + 0.28 * fit;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", frame);

  /* ---------------- loop ---------------- */
  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const tweening = stepTween(now);
    if (!tweening && !dragging && velocity.speed > 0.0004 && canInteract()) {
      rotateBy(velocity.axis, velocity.speed * dt * 60); // speed is per 60Hz frame
      velocity.speed *= Math.pow(0.02, dt);
      evaluate();
    }
    drawOutlineIfChanged();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  /* ---------------- boot ---------------- */
  frame();
  syncSoundBtn();
  const startLevel = Math.min(store.data.unlocked, LEVELS.length - 1);
  loadLevel(store.data.allDone ? 0 : startLevel);
  showMatch(lastMatch = iou(rasterize(liveMask, pivot.quaternion), state.targets[0].mask));
  if (!store.data.seenIntro) openOverlay("intro");
  else state.playing = true;
  requestAnimationFrame(loop);

  // debug/testing hook (used by automated checks; harmless for players)
  window.__umbra = {
    state,
    solveNow() { if (!canInteract()) return false; solveTarget(CUBE_ROTS[state.targets[state.target].valid[0]].q); return true; },
    hint,
    renderer, scene, camera,
    // test helpers: shadow match of an arbitrary orientation against the current target
    probe(q) { return iou(rasterize(liveMask, q), state.targets[state.target].mask); },
    solutions() { return state.targets[state.target].valid.map(ri => CUBE_ROTS[ri].q.clone()); },
    pivot,
  };
})();
