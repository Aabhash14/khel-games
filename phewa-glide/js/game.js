// Phewa Glide: flight model, thermals, ridge lift, rings, AI gliders, camera, launch and landing.
(function () {
  const PG = window.PG, W = PG.W, A = PG.audio;
  const { clamp, sstep, mix } = W;
  const G = (PG.G = { on: {} });
  const V3 = THREE.Vector3;
  const FEET = 1.5;          // carabiners to feet when standing
  const TS = 2.7;            // sim time runs faster than real time so a flight fits in a few minutes
  const GRAV = 9.8;
  const RING_R = 12;

  // ---------- flights ----------
  // rings: [x, z, kind] kind: undefined = glide, number = climb this much in a thermal first, 'ridge' = ridge-soar height, 'P' = over the Peace Pagoda
  const FLIGHTS = [
    { name: 'f1', sub: 'f1s', preset: 'morning', wind: 1.4,
      thermals: [{ x: 620, z: -420, r: 100, s: 4.8, top: 1100 }, { x: -1150, z: -350, r: 90, s: 4.2, top: 950 }],
      rings: [[150, -900], [420, -640], [620, -420, 160], [250, -100], [-300, 120], [-600, 480], [300, 620], [1130, 560]] },
    { name: 'f2', sub: 'f2s', preset: 'midday', wind: 2.2,
      thermals: [{ x: 620, z: -420, r: 95, s: 4.6, top: 1150 }, { x: -250, z: 950, r: 95, s: 4.8, top: 1200 }, { x: 1700, z: -150, r: 90, s: 4.0, top: 1000 }],
      rings: [[100, -880], [620, -420, 190], [100, 0], [-350, 560], [-250, 950, 250], [0, 0, 'P'], [-650, 700], [300, 760], [1130, 560]] },
    { name: 'f3', sub: 'f3s', preset: 'golden', wind: 3.4,
      thermals: [{ x: 620, z: -420, r: 90, s: 3.9, top: 1000 }, { x: -1150, z: -350, r: 85, s: 3.7, top: 900 }],
      rings: [[50, -850, 'ridge'], [-650, -860, 'ridge'], [-100, -850, 'ridge'], [650, -860, 'ridge'], [620, -420, 190], [-200, -120], [-700, 170], [300, 480], [1130, 560]] },
  ];
  G.FLIGHTS = FLIGHTS;
  const GR_PLAN = 6.6;
  const RIDGE_C = 470;
  // turn ring plans into 3D positions a player can actually reach
  function planRings(F) {
    let x = W.T0.x, z = W.T0.z + 60, y = W.T0.y + 1;
    const out = [];
    let ok = true;
    F.rings.forEach((r, i) => {
      let rx = r[0], rz = r[1];
      if (r[2] === 'P') { rx = W.PAGODA.x; rz = W.PAGODA.z; }
      // a climb ring sits just downwind of its thermal on the way out, so you climb, then glide through it
      const nx = F.rings[i + 1];
      if (typeof r[2] === 'number' && nx) {
        const ax = (nx[2] === 'P' ? W.PAGODA.x : nx[0]) - rx, az = (nx[2] === 'P' ? W.PAGODA.z : nx[1]) - rz, al = Math.hypot(ax, az) || 1;
        rx += (ax / al) * 220; rz += (az / al) * 220;
      }
      let d = Math.hypot(rx - x, rz - z);
      let g = W.ground(rx, rz);
      let ry = y - d / GR_PLAN - 6;
      if (typeof r[2] === 'number') ry += r[2];
      if (r[2] === 'ridge') {
        // ridge rings sit on one contour of Sarangkot's south face, just out from the slope
        let zc = -500;
        while (zc > -1400 && W.ground(rx, zc) < RIDGE_C) zc -= 5;
        rz = zc + 45; ry = RIDGE_C + 80;
        d = Math.hypot(rx - x, rz - z); g = W.ground(rx, rz);
      }
      if (r[2] === 'P') ry = Math.max(ry, W.PAGODA.y + 80);
      const floor = Math.max(g, 0) + 55;
      if (ry < floor) { if (floor - ry > 45) ok = false; ry = floor; }
      out.push(new V3(rx, ry, rz));
      x = rx; z = rz; y = ry;
    });
    return { pts: out, ok };
  }
  G.planRings = planRings;

  // the daily flight: a seeded course through the valley
  const POOL = [
    [420, -640], [-150, -860, 'ridge'], [-650, -860, 'ridge'], [650, -860, 'ridge'], [620, -420, 'T'], [-1150, -350, 'T'], [-250, 950, 'T'],
    [250, -100], [-300, 120], [-850, 330], [-450, 560], [250, 600], [-700, 170], [0, 430], [-1050, 700], [-600, 380], [300, 760], [1000, -200], [1600, -250, 'T'], [0, 0, 'P'],
  ];
  G.today = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  function dailyFlight() {
    const day = G.today();
    for (let attempt = 0; attempt < 60; attempt++) {
      const R = W.rng(day * 7 + attempt * 131);
      const presets = ['morning', 'midday', 'golden'];
      const F = { name: 'daily', sub: 'dailySub', preset: presets[(R() * 3) | 0], wind: 1.2 + R() * 2.4, thermals: [], rings: [[150, -900]] };
      const used = new Set();
      let cx = 150, cz = -900;
      const n = 7 + ((R() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const opts = POOL.map((p, k) => [p, k]).filter(([p, k]) => {
          if (used.has(k)) return false;
          const px = p[2] === 'P' ? W.PAGODA.x : p[0], pz = p[2] === 'P' ? W.PAGODA.z : p[1];
          const d = Math.hypot(px - cx, pz - cz);
          return d > 380 && d < 950;
        });
        if (!opts.length) break;
        const [p, k] = opts[(R() * opts.length) | 0];
        used.add(k);
        let kind = p[2];
        if (kind === 'T') {
          kind = 120 + Math.round(R() * 120);
          F.thermals.push({ x: p[0], z: p[1], r: 90, s: 4.2 + R() * 0.8, top: 1000 + R() * 200 });
        }
        F.rings.push([p[0], p[1], kind]);
        cx = p[2] === 'P' ? W.PAGODA.x : p[0]; cz = p[2] === 'P' ? W.PAGODA.z : p[1];
      }
      F.rings.push([1130, 560]);
      if (F.rings.some((r) => r[2] === 'ridge')) F.wind = Math.max(F.wind, 3.2);
      if (!F.thermals.length) F.thermals.push({ x: 620, z: -420, r: 95, s: 4.4, top: 1050 });
      const plan = planRings(F);
      const last = plan.pts[plan.pts.length - 1];
      if (plan.ok && last.y > 70 && F.rings.length >= 7) { F.seed = day; return F; }
    }
    return Object.assign({}, FLIGHTS[0], { name: 'daily', sub: 'dailySub' });
  }
  G._daily = () => dailyFlight();
  G.maxScore = (n) => n * 100 + 15 * (n * (n - 1)) / 2 + 500 + 200 + 200;

  // ---------- three.js setup ----------
  let renderer, scene, camera;
  let hero = null;
  const ai = [];
  let ringObjs = [];
  let arrow, stick;
  let state = 'boot', pausedFrom = null;
  let F = null, thermals = [], wind = new V3();
  const S = {};                      // flight sim state
  const input = { steer: 0, pitch: 0, kL: 0, kR: 0, kU: 0, kD: 0, touch: null };
  let tReal = 0;
  let quality = { pr: 1, refl: true, frame: 0, acc: 0, n: 0 };

  G.init = function (canvas) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    if (!renderer.getContext()) return false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    quality.pr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(quality.pr);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(62, 1, 1, 60000);
    W.build(scene);
    hero = new PG.Glider(PG.D.wing | 0, true);
    scene.add(hero.root);
    buildArrow();
    // AI pilots
    for (let i = 0; i < 7; i++) {
      const g = new PG.Glider((i + 1) % 4, false);
      g.root.scale.setScalar(1);
      scene.add(g.root);
      ai.push({ g, mode: 'circle', th: 0, a: Math.random() * 6.28, r: 45 + Math.random() * 30, y: 500 + Math.random() * 400, dir: Math.random() < 0.5 ? 1 : -1, x: 0, z: 0, head: 0, bank: 0, tx: 0, tz: 0, ridge: i >= 5 });
    }
    // laid-out wings waiting at launch
    for (let i = 0; i < 3; i++) {
      const g = new PG.Glider((i + 2) % 4, false);
      g.inflate = 0; g.mode = 'stand';
      const x = W.T0.x - 40 + i * 32, z = W.T0.z - 8 + (i % 2) * 6;
      g.root.position.set(x, W.ground(x, z) + FEET, z);
      g.root.rotation.y = Math.PI;
      g.slope = (W.ground(x, z - 6) - W.ground(x, z)) / 6;
      g.update(0);
      scene.add(g.root);
    }
    W.thermalCenter = (th, y) => ({ x: th.x + wind.x * y * 0.05, z: th.z + wind.z * y * 0.05 });
    resize();
    window.addEventListener('resize', resize);
    bindInput();
    G.menu();
    requestAnimationFrame(loop);
    return true;
  };
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : 62;
    camera.updateProjectionMatrix();
  }

  function buildArrow() {
    const s = new THREE.Shape();
    s.moveTo(0, 1.4); s.lineTo(1.1, -0.4); s.lineTo(0.45, -0.4); s.lineTo(0.45, -1.2); s.lineTo(-0.45, -1.2); s.lineTo(-0.45, -0.4); s.lineTo(-1.1, -0.4); s.lineTo(0, 1.4);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false });
    g.translate(0, 0, -0.125);
    g.rotateX(-Math.PI / 2);   // point along -z
    arrow = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc23d, transparent: true, opacity: 0.85, depthWrite: false }));
    arrow.renderOrder = 8;
    arrow.scale.setScalar(0.6);
    scene.add(arrow);
  }

  // ---------- rings ----------
  const FLAG_C = ['#2457c5', '#f4f1ea', '#d42a20', '#2e9a4a', '#f2c230'];
  let ringGeo = null;
  function ringGeometry() {
    if (ringGeo) return ringGeo;
    const t = new THREE.TorusGeometry(RING_R, 1.0, 10, 80);
    const pos = t.attributes.position, cols = [];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const a = Math.atan2(pos.getY(i), pos.getX(i)) + Math.PI;
      c.set(FLAG_C[Math.floor((a / (Math.PI * 2)) * 20) % 5]);
      cols.push(c.r, c.g, c.b);
    }
    t.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    ringGeo = t;
    return t;
  }
  function makeRing(p, dir, i) {
    const g = new THREE.Group();
    const torus = new THREE.Mesh(ringGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x222222 }));
    g.add(torus);
    // little flags hanging from the hoop
    const flags = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      const fg = new THREE.PlaneGeometry(1.5, 1.9); fg.translate(0, -0.95, 0);
      flags.push([fg, FLAG_C[k % 5], Math.cos(a) * RING_R, Math.sin(a) * RING_R, 0, 0, 0, a + Math.PI / 2]);
    }
    const fm = W.merged(flags);
    fm.material.side = THREE.DoubleSide;
    g.add(fm);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 2.2, 8, 60), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(glow);
    g.position.copy(p);
    g.lookAt(p.clone().add(dir));
    scene.add(g);
    return { g, glow, fm, p: p.clone(), n: dir.clone().normalize(), i, got: false, fade: 0 };
  }
  function clearRings() { ringObjs.forEach((r) => { scene.remove(r.g); r.g.traverse((o) => { if (o.isMesh && o.geometry !== ringGeo) o.geometry.dispose(); }); }); ringObjs = []; }

  // ---------- air: thermals, ridge lift, sink ----------
  function thermalLift(x, y, z) {
    let lift = 0, inTh = false, sink = false;
    for (const th of thermals) {
      const c = W.thermalCenter(th, y);
      const d = Math.hypot(x - c.x, z - c.z);
      const fade = sstep(th.top, th.top - 160, y) * sstep(5, 60, y - Math.max(0, W.ground(x, z)));
      if (d < th.r) {
        const k = 1 - (d / th.r) ** 2;
        lift += th.s * Math.pow(k, 0.6) * fade;
        if (fade > 0.3) inTh = true;
      } else if (d < th.r * 1.9) {
        lift -= th.s * 0.22 * Math.sin(((d - th.r) / (th.r * 0.9)) * Math.PI) * fade;
        if (fade > 0.3) sink = true;
      }
    }
    return { lift, inTh, sink };
  }
  function ridgeLift(x, y, z) {
    const ws = wind.length();
    if (ws < 0.1) return 0;
    const wx = wind.x / ws, wz = wind.z / ws;
    // slope just downwind of us: air hitting a rising slope goes up
    const sx = x + wx * 40, sz = z + wz * 40;
    const e = 15;
    const gx = (W.ground(sx + e, sz) - W.ground(sx - e, sz)) / (2 * e);
    const gz = (W.ground(sx, sz + e) - W.ground(sx, sz - e)) / (2 * e);
    const along = gx * wx + gz * wz;
    const agl = y - Math.max(0, W.ground(x, z));
    const fall = Math.exp(-Math.max(0, agl) / 170);
    let l = ws * along * 1.35 * fall;
    if (l < 0) l *= 0.6;
    return clamp(l, -2.5, 3.8);
  }
  function airNoise(t) { return Math.sin(t * 0.7) * 0.12 + Math.sin(t * 1.9 + 1) * 0.08; }

  // ---------- flight start / menu ----------
  G.menu = function () {
    state = 'menu';
    W.setPreset('morning');
    F = FLIGHTS[0]; setAir(F);
    clearRings();
    arrow.visible = false;
    hero.inflate = 1; hero.deflate = 0; hero.mode = 'fly'; hero.cheer = false;
    W.calm();
    menuT = 0;
  };
  let menuT = 0;
  function setAir(fl) {
    thermals = fl.thermals.map((t) => Object.assign({}, t));
    wind.set(0, 0, -(fl.wind || 1.5));
    W.setBirds(thermals);
    // a cumulus on top of every thermal, plus scattered fair-weather cloud
    const R = W.rng((fl.seed || 3) + fl.preset.length * 13);
    const cl = thermals.map((t) => { const c = W.thermalCenter(t, t.top); return { x: c.x, y: t.top + 90, z: c.z, s: 150 }; });
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2, r = 1800 + R() * 5000;
      cl.push({ x: Math.cos(a) * r, y: 1150 + R() * 700, z: Math.sin(a) * r - 800, s: 160 + R() * 220 });
    }
    // clouds hugging the far mountains
    for (let i = 0; i < 10; i++) cl.push({ x: -16000 + i * 3600 + R() * 1200, y: 2300 + R() * 900, z: -12500 - R() * 3000, s: 700 + R() * 600 });
    W.setClouds(cl, fl.preset.length * 7 + (fl.seed || 0));
    seedAI();
  }

  G.start = function (which) {
    F = which === 'daily' ? dailyFlight() : FLIGHTS[which];
    G.current = which;
    W.setPreset(F.preset);
    setAir(F);
    clearRings();
    const plan = planRings(F);
    let prev = new V3(W.T0.x, W.T0.y, W.T0.z);
    plan.pts.forEach((p, i) => {
      const nxt = plan.pts[i + 1] || new V3(W.LAND.x, p.y, W.LAND.z);
      const dir = nxt.clone().sub(prev); dir.y = 0;
      if (dir.lengthSq() < 1) dir.set(0, 0, 1);
      ringObjs.push(makeRing(p, dir.normalize(), i));
      prev = p;
    });
    for (const k in S) delete S[k];
    Object.assign(S, {
      pos: new V3(W.T0.x, W.T0.y + FEET, W.T0.z), prev: new V3(), head: Math.PI, V: 0, bank: 0, vy: 0, vario: 0, dV: 0,
      t: 0, air: 0, next: 0, chain: 0, got: 0, ringPts: 0, chainPts: 0, flare: 0, launchT: 0, hintCd: 0, lowWarn: false,
      result: null, landT: 0, camPos: null, lastHint: '', score: 0, maxH: 0,
    });
    S.pos.y = W.ground(S.pos.x, S.pos.z) + FEET;
    hero.slope = (W.ground(S.pos.x, S.pos.z - 6) - W.ground(S.pos.x, S.pos.z)) / 6;
    hero.inflate = 0; hero.deflate = 0; hero.mode = 'stand'; hero.cheer = false; hero.bank = 0; hero.brakeL = hero.brakeR = 0; hero.bar = 0;
    W.calm();
    arrow.visible = false;
    input.steer = input.pitch = 0; input.touch = null;
    state = 'launch';
    A.launch();
    hud(true);
  };
  G.state = () => state;
  G.pause = function (on) {
    if (on && (state === 'fly' || state === 'launch')) { pausedFrom = state; state = 'paused'; }
    else if (!on && state === 'paused') { state = pausedFrom; }
  };
  G.setWing = (d) => { hero.setWing(d); };
  G.flight = () => F;

  // ---------- input ----------
  function bindInput() {
    const keys = { ArrowLeft: 'kL', KeyA: 'kL', ArrowRight: 'kR', KeyD: 'kR', ArrowUp: 'kU', KeyW: 'kU', ArrowDown: 'kD', KeyS: 'kD' };
    window.addEventListener('keydown', (e) => {
      if (keys[e.code]) { input[keys[e.code]] = 1; e.preventDefault(); }
      if (e.code === 'KeyP' || e.code === 'Escape') G.on.pauseKey && G.on.pauseKey();
      if ((e.code === 'Space' || e.code === 'Enter') && state === 'menu') G.on.startKey && G.on.startKey();
    });
    window.addEventListener('keyup', (e) => { if (keys[e.code]) input[keys[e.code]] = 0; });
    const pad = document.getElementById('pad');
    stick = document.getElementById('stick');
    const R = () => Math.min(90, Math.max(55, window.innerWidth * 0.14));
    pad.addEventListener('pointerdown', (e) => {
      if (input.touch) return;
      input.touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
      pad.setPointerCapture(e.pointerId);
      stick.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      stick.classList.add('on');
      A.init();
    });
    pad.addEventListener('pointermove', (e) => {
      const t = input.touch; if (!t || t.id !== e.pointerId) return;
      const r = R();
      t.dx = clamp((e.clientX - t.x0) / r, -1, 1); t.dy = clamp((e.clientY - t.y0) / r, -1, 1);
      stick.style.setProperty('--kx', t.dx * 34 + 'px'); stick.style.setProperty('--ky', t.dy * 34 + 'px');
    });
    const end = (e) => {
      const t = input.touch; if (!t || t.id !== e.pointerId) return;
      input.touch = null; stick.classList.remove('on');
      stick.style.setProperty('--kx', '0px'); stick.style.setProperty('--ky', '0px');
    };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    window.addEventListener('blur', () => { input.kL = input.kR = input.kU = input.kD = 0; G.on.pauseKey && state === 'fly' && G.on.pauseKey(); });
  }
  function readInput(dt) {
    let st = input.kR - input.kL, pt = input.kU - input.kD;
    if (input.touch) { st = input.touch.dx; pt = -input.touch.dy; }
    // a soft dead zone and a gentle curve so small drags make small turns
    const curve = (v) => Math.sign(v) * Math.pow(Math.max(0, Math.abs(v) - 0.06) / 0.94, 1.35);
    const k = 1 - Math.exp(-dt / 0.12);
    input.steer += (curve(st) - input.steer) * k;
    input.pitch += (curve(pt) - input.pitch) * k;
  }

  // ---------- main loop ----------
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.1) dt = 0.1;
    if (G.manual) return;
    step(dt, true);
    adapt(dt);
  }
  function step(dt, draw) {
    tReal += dt;
    if (state === 'launch') stepLaunch(dt);
    else if (state === 'fly') { readInput(dt); const n = 3; for (let i = 0; i < n; i++) stepFly(dt / n); }
    else if (state === 'landed') stepLanded(dt);
    if (state !== 'paused') {
      stepAI(dt);
      hero.update(dt);
      W.update(tReal, dt, camera);
    }
    stepCamera(dt);
    if (state === 'fly' || state === 'launch' || state === 'landed') {
      W.setShadow(hero.root.position, S.head || 0, hero.inflate * (1 - hero.deflate));
      updateRings(dt);
      if (state !== 'landed') hud(false);
    } else W.setShadow(new V3(0, -1e4, 0), 0);
    W.pillar.visible = state !== 'menu';
    if (W.pillar.visible) W.pillar.material.uniforms.uA.value = clamp((camera.position.distanceTo(W.pillar.position) - 300) / 600, 0.15, 1);
    A.update(dt, state === 'fly' ? S.V * TS : 0, S.vario || 0, state === 'fly', state === 'fly');
    if (draw) render();
  }
  G.step = (dt, n, draw) => { for (let i = 0; i < (n || 1); i++) step(dt, draw && i === n - 1); };

  function render() {
    quality.frame++;
    if (quality.refl && (quality.frame % 2 === 0 || quality.pr > 1.4)) W.renderReflection(renderer, scene, camera, [arrow, W.pillar]);
    W.reflectionOn = quality.refl;
    renderer.render(scene, camera);
  }
  // keep 60 fps: drop resolution, then lake reflections, if frames run long
  function adapt(dt) {
    quality.acc += dt; quality.n++;
    if (quality.acc < 2) return;
    const avg = quality.acc / quality.n;
    quality.acc = 0; quality.n = 0;
    if (avg > 0.024) {
      if (quality.pr > 1.01) { quality.pr = Math.max(1, quality.pr - 0.25); renderer.setPixelRatio(quality.pr); resize(); }
      else if (quality.refl) quality.refl = false;
      else if (quality.pr > 0.75) { quality.pr -= 0.125; renderer.setPixelRatio(quality.pr); resize(); }
    }
  }

  // ---------- launch: stand, run, the wing climbs overhead, airborne ----------
  function stepLaunch(dt) {
    S.launchT += dt;
    const t = S.launchT;
    const f = new V3(-Math.sin(S.head), 0, -Math.cos(S.head));
    if (t < 0.7) { hero.mode = 'stand'; hero.inflate = 0; }
    else {
      hero.mode = 'run';
      S.V = Math.min(7.5, S.V + dt * 5.5);
      hero.runPhase += dt * (6 + S.V * 1.2);
      const k = clamp((t - 0.8) / 1.5, 0, 1);
      hero.inflate = k < 1 ? 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.05 : 1;
      S.pos.addScaledVector(f, S.V * dt);
      const gy = W.ground(S.pos.x, S.pos.z) + FEET;
      // once the wing is overhead it starts to carry the pilot
      const lift = sstep(2.0, 2.8, t) * (t - 2.0) * 1.2;
      S.pos.y = Math.max(gy, S.pos.y - 0.2 * dt + lift * dt);
      if (Math.random() < dt * 6) A.flap();
    }
    hero.pitch = hero.inflate < 1 ? -0.3 * Math.sin(hero.inflate * Math.PI) : 0;
    hero.root.position.copy(S.pos);
    hero.root.rotation.y = S.head;
    if (t > 2.6) {
      state = 'fly';
      S.V = 10; S.vy = 0; S.prev.copy(S.pos);
      arrow.visible = true;
      hint('hStart', 4);
    }
  }

  // ---------- flying ----------
  function stepFly(rdt) {
    const dt = rdt * TS;
    S.t += dt; S.air += rdt;
    const steerAuto = boundarySteer();
    // control comes in gently over the first moments after leaving the hill
    const auth = sstep(0, 1.4, S.air);
    const steer = clamp(input.steer * auth + steerAuto, -1, 1), pitch = input.pitch * auth;
    const bar = Math.max(0, pitch), brake = Math.max(0, -pitch);
    // airspeed follows bar and brake
    const targetV = 11 + bar * 4 - brake * 4 - Math.abs(steer) * 0.6;
    const V0 = S.V;
    S.V += (targetV - S.V) * (1 - Math.exp(-dt / (targetV < S.V ? 1.0 : 0.7)));
    // the wing's sink lags its airspeed (it carries momentum), which is what makes a flare work
    S.Vs = S.Vs == null ? S.V : S.Vs + (S.V - S.Vs) * (1 - Math.exp(-dt / 1.6));
    const dVdt = (S.V - V0) / dt;
    // the bank follows the steering; the turn rate follows the bank
    S.bank += (steer * 0.68 - S.bank) * (1 - Math.exp(-dt / 0.45));
    S.head -= (GRAV * Math.tan(S.bank) / S.V) * dt;
    // sink polar, more sink in a turn, a spiral dive with bar + full steer
    let sink = 1.45 + 0.04 * (S.Vs - 9.5) ** 2 + (S.Vs < 8.5 ? (8.5 - S.Vs) * 0.3 : 0);
    sink /= Math.pow(Math.cos(S.bank), 1.5);
    sink += Math.abs(steer) ** 2 * bar * 3.2;
    // flare: bleeding off speed turns into a moment of lift
    // flare: speed bled off with the brakes is banked as height and paid back gently over a second or two
    S.fE = (S.fE || 0) * Math.exp(-dt / 2.5) + 1.9 * Math.max(0, V0 - S.V) * S.V / GRAV;
    // ...in ground effect, the last few metres above the grass
    const fAgl = S.pos.y - FEET - Math.max(0, W.ground(S.pos.x, S.pos.z));
    let flare = 0;
    S.fE = Math.max(0, S.fE);
    // (computed below, once the rest of the air is known: it only cushions, never balloons)
    const th = thermalLift(S.pos.x, S.pos.y, S.pos.z);
    const rl = ridgeLift(S.pos.x, S.pos.y, S.pos.z);
    const lift = th.lift + rl + airNoise(S.t);
    if (fAgl < 3 && S.fE > 0) {
      flare = clamp(-0.8 - (-sink + lift), 0, Math.min(3, S.fE * 3));
      S.fE = Math.max(0, S.fE - flare * dt);
    }
    S.vy = -sink + lift + flare;
    S.vario += (S.vy - S.vario) * (1 - Math.exp(-rdt / 0.5));
    S.dV = dVdt;
    const f = new V3(-Math.sin(S.head), 0, -Math.cos(S.head));
    S.prev.copy(S.pos);
    S.pos.addScaledVector(f, S.V * dt).addScaledVector(wind, dt);
    S.pos.y += S.vy * dt;
    S.maxH = Math.max(S.maxH, S.pos.y);
    // rings
    checkRings();
    // hints
    S.hintCd -= rdt;
    const gh = W.ground(S.pos.x, S.pos.z);
    const agl = S.pos.y - Math.max(0, gh);
    S.agl = agl;
    if (S.hintCd < 0) {
      if (th.inTh && S.vario > 0.8) hint('hThermal', 6);
      else if (rl > 1.2) hint('hRidge', 8);
      else if (th.sink && S.vario < -2.6) hint('hSink', 5);
      else if (agl < 6.5 && agl > 3.2 && S.V > 9 && Math.hypot(S.pos.x - W.LAND.x, S.pos.z - W.LAND.z) < 200) hint('hFlare', 3);
      else if (agl < 140 && S.next < ringObjs.length && ringObjs[S.next].p.y > S.pos.y + 40) hint('hLow', 9);
    }
    // the pilot's pose
    hero.bank = S.bank;
    const turnBrake = Math.abs(steer) * 0.65;
    hero.brakeL = clamp(brake + (steer < 0 ? turnBrake : 0), 0, 1);
    hero.brakeR = clamp(brake + (steer > 0 ? turnBrake : 0), 0, 1);
    hero.bar = bar;
    hero.pitch = clamp(-dVdt * 0.05, -0.25, 0.25) * 0.6 + hero.pitch * 0.4;
    hero.swing = Math.sin(S.t * 0.9) * 0.08 + (S.bank - hero.bank) * 0.5;
    const feetAgl = S.pos.y - FEET - Math.max(gh, 0);
    hero.mode = feetAgl < 14 ? 'legs' : 'fly';
    hero.root.position.copy(S.pos);
    hero.root.rotation.y = S.head;
    // touchdown / tree / water
    if (feetAgl < 10 && gh > 0 && W.treeNear(S.pos.x, S.pos.z, 1.5)) return land('tree');
    if (feetAgl <= 0 && S.air < 2.5 && gh > 0) {
      // still on the launch slope: keep running until the wing carries you
      S.pos.y = gh + FEET; S.vy = Math.max(S.vy, 0); hero.mode = 'run'; hero.runPhase += rdt * 14;
      hero.root.position.copy(S.pos);
      return;
    }
    if (feetAgl <= 0) {
      if (gh < 0.2) return land('water');
      return land('ground');
    }
  }
  function boundarySteer() {
    const r = Math.hypot(S.pos.x, S.pos.z);
    if (r < 3900) return 0;
    hint('hBack', 4);
    const want = Math.atan2(S.pos.x, S.pos.z); // heading toward the centre (forward = -sin, -cos)
    let d = want - S.head;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return clamp(-d, -1, 1) * sstep(3900, 4300, r);
  }
  function checkRings() {
    const p0 = S.prev, p1 = S.pos;
    for (const r of ringObjs) {
      if (r.got) continue;
      const d0 = p0.clone().sub(r.p).dot(r.n), d1 = p1.clone().sub(r.p).dot(r.n);
      if ((d0 < 0) === (d1 < 0)) continue;
      const t = d0 / (d0 - d1);
      const hit = p0.clone().lerp(p1, t);
      // the pilot hangs below the wing: count anything from feet to canopy
      const off = hit.sub(r.p);
      const dist = Math.min(off.length(), off.clone().add(new V3(0, 4, 0)).length());
      if (dist > RING_R + 1.5) continue;
      r.got = true; r.fade = 1;
      S.got++;
      if (r.i === S.next) S.chain++; else S.chain = 1;
      S.ringPts += 100;
      const cb = 15 * (S.chain - 1);
      S.chainPts += cb;
      while (S.next < ringObjs.length && ringObjs[S.next].got) S.next++;
      A.ring(S.chain - 1);
      G.on.toast && G.on.toast(S.chain > 1 ? PG.t('combo', { n: S.chain }) : PG.t('ring'), cb ? '+' + (100 + cb) : '+100');
      if (S.got === ringObjs.length) { G.on.toast && G.on.toast(PG.t('allRings'), ''); hint('hLand', 6); }
    }
    // skipped rings: once you're past the next one, guide to the one after
    const nx = ringObjs[S.next];
    if (nx && !nx.got) {
      const rel = S.pos.clone().sub(nx.p);
      if (rel.dot(nx.n) > 220 && S.next + 1 < ringObjs.length) { S.next++; S.chain = 0; }
    }
  }
  function hint(k, cd) {
    if (S.lastHint === k && S.hintCd > -3) return;
    S.lastHint = k; S.hintCd = cd;
    G.on.hint && G.on.hint(k);
  }

  // ---------- landing ----------
  function land(kind) {
    const p = S.pos;
    const dl = Math.hypot(p.x - W.LAND.x, p.z - W.LAND.z);
    const vy = S.vy, gs = S.V; // real-scale m/s, independent of the time scale
    let landPts = 0, key = 'rOff', flarePts = 0, good = false;
    if (kind === 'water') { key = 'rWater'; A.splash(); }
    else if (kind === 'tree') { key = 'rTree'; A.thud(); }
    else {
      if (dl < 9) { landPts = 500; key = 'rBull'; }
      else if (dl < 25) { landPts = 350; key = 'rTarget'; }
      else if (dl < 45) { landPts = 250; key = 'rTarget'; }
      else if (dl < W.LAND.r) { landPts = 150 - Math.round((dl - 45) * 0.6); key = 'rField'; }
      else { landPts = 25; key = 'rOff'; }
      good = dl < W.LAND.r;
      if (vy > -1.25 && gs < 10) { flarePts = 200; }
      else if (vy < -2.7) { landPts = Math.max(0, landPts - 100); key = 'rHard'; }
      A.land(good);
      if (good) W.cheer(p.x, p.z, 400);
    }
    const n = ringObjs.length;
    const airPts = Math.min(200, Math.round(S.air));
    const total = S.ringPts + S.chainPts + landPts + flarePts + airPts;
    const max = G.maxScore(n);
    const stars = total >= max * 0.85 ? 3 : total >= max * 0.58 ? 2 : total >= max * 0.33 ? 1 : 0;
    S.result = { kind, key, soft: flarePts > 0, rings: S.got, n, ringPts: S.ringPts, chainPts: S.chainPts, landPts, flarePts, airPts, total, stars, dist: Math.round(dl), flight: G.current };
    state = 'landed'; S.landT = 0;
    arrow.visible = false;
    if (kind === 'water') S.pos.y = 0.2;
    else if (kind === 'tree') S.pos.y = W.ground(p.x, p.z) + 7;
    else S.pos.y = W.ground(p.x, p.z) + FEET;
    hero.cheer = false;
    G.on.landed && G.on.landed(S.result);
  }
  function stepLanded(dt) {
    S.landT += dt;
    const t = S.landT, R = S.result;
    const f = new V3(-Math.sin(S.head), 0, -Math.cos(S.head));
    if (R.kind === 'ground') {
      const runV = Math.max(0, (R.soft ? 5 : 3) * (1 - t / 0.9));
      if (runV > 0.1) { hero.mode = 'run'; hero.runPhase += dt * 12; S.pos.addScaledVector(f, runV * dt); S.pos.y = W.ground(S.pos.x, S.pos.z) + FEET; }
      else { hero.mode = 'stand'; hero.cheer = R.key !== 'rOff' && R.key !== 'rHard' && t > 1.2 && t < 4; }
    } else if (R.kind === 'water') { hero.mode = 'legs'; S.pos.y = Math.max(-0.7, S.pos.y - dt * 0.6); }
    else hero.mode = 'legs';
    hero.deflate = clamp((t - 0.25) / 1.4, 0, 1);
    hero.brakeL = hero.brakeR = Math.max(0, 1 - t);
    hero.bank *= 0.9; hero.bar = 0;
    hero.root.position.copy(S.pos);
    if (t > 2.8 && !S.ended) { S.ended = true; G.on.end && G.on.end(S.result); }
  }
  G.result = () => S.result;
  G.leave = function () { S.ended = true; G.menu(); };

  // ---------- AI pilots: circle up in thermals, glide to the next, or beat along the ridge ----------
  function stepAI(dt) {
    const sdt = dt * TS;
    ai.forEach((a, i) => {
      if (a.ridge) {
        // ridge soaring: beat back and forth along Sarangkot's south face
        // an oval: one leg close in along the face, the other a little out from it
        a.u = (a.u || i * 1.7) + sdt * 0.0105;
        const x = Math.sin(a.u) * 900 - 100;
        const z = -860 - 140 * Math.sin(x * 0.0011 + 0.6) + 70 + Math.cos(a.u) * 70;
        const y = W.ground(x, z - 40) + 95 + Math.sin(a.u * 3) * 15;
        const dx = Math.cos(a.u) * 900, dz = -Math.sin(a.u) * 70 - 140 * Math.cos(x * 0.0011 + 0.6) * 0.0011 * dx;
        const h = Math.atan2(-dx, -dz);
        let dh = h - a.head; while (dh > Math.PI) dh -= 6.283; while (dh < -Math.PI) dh += 6.283;
        a.head = h;
        a.bank = mix(a.bank, clamp(-dh / Math.max(sdt, 1e-4) * 1.6, -0.6, 0.6), 0.06);
        a.x = x; a.z = z; a.y = y;
      } else {
        const th = thermals[a.th % thermals.length];
        if (!th) return;
        if (a.mode === 'circle') {
          a.a += (11 / a.r) * a.dir * sdt;
          a.y += (th.s * 0.55 - 1.4) * sdt;
          const c = W.thermalCenter(th, a.y);
          a.x = c.x + Math.cos(a.a) * a.r; a.z = c.z + Math.sin(a.a) * a.r;
          a.head = a.dir > 0 ? Math.PI - a.a : -a.a;
          a.bank = mix(a.bank, a.dir > 0 ? 0.45 : -0.45, 0.05);
          if (a.y > th.top - 70) { a.mode = 'glide'; a.th = (a.th + 1 + i) % thermals.length; }
        } else {
          const nt = thermals[a.th % thermals.length];
          const c = W.thermalCenter(nt, a.y);
          const dx = c.x - a.x, dz = c.z - a.z, d = Math.hypot(dx, dz);
          const want = Math.atan2(-dx, -dz);
          let dd = want - a.head; while (dd > Math.PI) dd -= 6.283; while (dd < -Math.PI) dd += 6.283;
          a.head += clamp(dd, -0.4 * sdt, 0.4 * sdt);
          a.bank = mix(a.bank, clamp(-dd, -0.5, 0.5), 0.05);
          a.x += -Math.sin(a.head) * 11 * sdt; a.z += -Math.cos(a.head) * 11 * sdt;
          a.y -= 1.6 * sdt;
          const floor = Math.max(0, W.ground(a.x, a.z)) + 120;
          if (a.y < floor) a.y = floor;
          if (d < nt.r * 0.6 || thermals.length === 1) { a.mode = 'circle'; a.a = Math.atan2(a.z - c.z, a.x - c.x); }
        }
      }
      const g = a.g;
      g.root.position.set(a.x, a.y, a.z);
      g.root.rotation.y = a.head;
      g.bank = a.bank;
      g.brakeL = a.bank < 0 ? 0.5 : 0.1; g.brakeR = a.bank > 0 ? 0.5 : 0.1;
      g.update(dt);
    });
  }
  // place AI pilots in this flight's thermals
  function seedAI() {
    ai.forEach((a, i) => {
      a.th = i % Math.max(1, thermals.length);
      a.mode = 'circle';
      a.y = 380 + ((i * 97) % 500);
      a.dir = i % 2 ? 1 : -1;
    });
  }

  // ---------- rings: highlight the next one, burst the ones you get ----------
  function updateRings(dt) {
    const pulse = 0.5 + 0.5 * Math.sin(tReal * 4);
    ringObjs.forEach((r) => {
      if (r.got) {
        if (r.fade > 0) {
          r.fade = Math.max(0, r.fade - dt * 1.4);
          const s = 1 + (1 - r.fade) * 0.8;
          r.g.scale.setScalar(s);
          r.g.visible = r.fade > 0.02;
          r.glow.material.opacity = r.fade * 0.8;
        }
        return;
      }
      const isNext = r.i === S.next;
      r.glow.material.opacity = isNext ? 0.25 + pulse * 0.35 : 0;
      r.g.rotation.z += dt * (isNext ? 0.6 : 0.2);
      r.g.visible = true;
    });
    // the guide arrow: in front of the pilot, pointing at the next ring or the landing target
    if (arrow.visible) {
      const tgt = S.next < ringObjs.length && !ringObjs[S.next].got ? ringObjs[S.next].p : new V3(W.LAND.x, W.LAND.y + 10, W.LAND.z);
      S.target = tgt;
      const f = new V3(-Math.sin(S.head), 0, -Math.cos(S.head));
      const ap = S.pos.clone().addScaledVector(f, 9).add(new V3(0, 2.6, 0));
      arrow.position.lerp(ap, 1 - Math.exp(-dt * 10));
      const to = tgt.clone().sub(arrow.position);
      const yaw = Math.atan2(-to.x, -to.z), pitch = Math.atan2(to.y, Math.hypot(to.x, to.z));
      arrow.rotation.set(clamp(pitch, -0.8, 0.8), yaw, 0, 'YXZ');
      arrow.material.opacity = 0.55 + pulse * 0.3;
      const isLand = !(S.next < ringObjs.length && !ringObjs[S.next].got);
      arrow.material.color.set(isLand ? 0xff7a1a : 0xffc23d);
    }
  }

  // ---------- camera ----------
  const camPos = new V3(), camLook = new V3();
  let camInit = false;
  function stepCamera(dt) {
    let want, look;
    if (state === 'menu') {
      // attract mode: drift over the lake with the Himalaya ahead, a glider flying alongside
      menuT += dt;
      const t = menuT;
      const cx = 380 * Math.sin(t * 0.035) + 150, cz = 980 + 120 * Math.sin(t * 0.05), cy = 640 + 40 * Math.sin(t * 0.06);
      want = new V3(cx, cy, cz);
      look = new V3(500 + 300 * Math.sin(t * 0.03), 1350, -14000);
      camPos.lerp(want, camInit ? 1 - Math.exp(-dt * 2) : 1); camLook.lerp(look, camInit ? 1 - Math.exp(-dt * 2) : 1);
      camInit = true;
      camera.position.copy(camPos); camera.up.set(0, 1, 0); camera.lookAt(camLook);
      // the player's glider, in front of the camera, so the wing you pick is on show
      const fwd = camLook.clone().sub(camPos).normalize();
      const right = new V3().crossVectors(fwd, new V3(0, 1, 0)).normalize();
      const hp = camPos.clone().addScaledVector(fwd, 30).addScaledVector(right, Math.sin(t * 0.4) * 2).add(new V3(0, -4.5 + Math.sin(t * 0.5) * 0.8, 0));
      hero.root.position.copy(hp);
      hero.root.rotation.y = Math.atan2(-fwd.x, -fwd.z) + 0.35 + Math.sin(t * 0.3) * 0.15;
      hero.bank = Math.sin(t * 0.4) * 0.25;
      hero.brakeL = Math.max(0, -hero.bank) * 0.9; hero.brakeR = Math.max(0, hero.bank) * 0.9;
      hero.mode = 'fly'; hero.inflate = 1; hero.deflate = 0;
      return;
    }
    const f = new V3(-Math.sin(S.head), 0, -Math.cos(S.head));
    const r = new V3(Math.cos(S.head), 0, -Math.sin(S.head));
    const P = hero.root.position;
    if (state === 'launch') {
      const t = S.launchT;
      const side = mix(9, 4, sstep(0, 2.6, t));
      want = P.clone().addScaledVector(f, mix(10, -12, sstep(0.3, 2.6, t))).addScaledVector(r, side).add(new V3(0, mix(1.2, 4.5, sstep(0, 2.6, t)), 0));
      look = P.clone().add(new V3(0, mix(1.5, 4, sstep(0.5, 2.4, t)), 0)).addScaledVector(f, mix(0, 10, sstep(1, 2.6, t)));
    } else if (state === 'landed') {
      const t = S.landT;
      const a = S.head + Math.PI * 0.8 + t * 0.25;
      want = P.clone().add(new V3(-Math.sin(a) * 12, 3.2, -Math.cos(a) * 12));
      look = P.clone().add(new V3(0, 1.2, 0));
    } else {
      const spd = S.V || 11;
      want = P.clone().addScaledVector(f, -14 - (spd - 11) * 0.4).add(new V3(0, 10.5, 0)).addScaledVector(r, S.bank * 4);
      look = P.clone().addScaledVector(f, 14).add(new V3(0, 1.5, 0));
    }
    const k = state === 'launch' ? 1 - Math.exp(-dt * 6) : 1 - Math.exp(-dt * 4.5);
    if (!camInit || state === 'launch' && S.launchT < dt * 1.5) { camPos.copy(want); camLook.copy(look); camInit = true; }
    camPos.lerp(want, k); camLook.lerp(look, 1 - Math.exp(-dt * 8));
    // never below the ground or the lake
    const gmin = Math.max(W.ground(camPos.x, camPos.z), 0) + 1.6;
    if (camPos.y < gmin) camPos.y = gmin;
    camera.position.copy(camPos);
    // lean the horizon a little with the bank
    const roll = state === 'fly' ? -S.bank * 0.22 : 0;
    camera.up.set(Math.sin(roll) * r.x, Math.cos(roll), Math.sin(roll) * r.z);
    camera.lookAt(camLook);
    const fov = (camera.aspect < 0.8 ? 72 : 62) + (state === 'fly' ? (S.V - 11) * 1.1 : 0);
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * (1 - Math.exp(-dt * 3)); camera.updateProjectionMatrix(); }
  }

  // ---------- HUD feed ----------
  let hudT = 0;
  function hud(force) {
    hudT -= 1 / 60;
    if (!force && hudT > 0) return;
    hudT = 0.1;
    if (!G.on.hud) return;
    const nr = ringObjs[S.next];
    const tgt = nr && !nr.got ? nr.p : new V3(W.LAND.x, 0, W.LAND.z);
    const agl = S.pos.y - Math.max(0, W.ground(S.pos.x, S.pos.z));
    G.on.hud({
      alt: S.pos.y + W.MSL, agl: agl - FEET, vario: (S.vario || 0) * TS, speed: (S.V || 0) * TS * 3.6,
      got: S.got || 0, n: ringObjs.length, score: (S.ringPts || 0) + (S.chainPts || 0),
      dist: tgt ? Math.hypot(tgt.x - S.pos.x, tgt.z - S.pos.z) : 0, toLand: !(S.next < ringObjs.length && ringObjs[S.next] && !ringObjs[S.next].got),
    });
  }
  // minimap data
  G.mapData = () => ({ pos: S.pos, head: S.head, rings: ringObjs, next: S.next, thermals, wind });
  G._dbg = { S, input, get state() { return state; }, ai, quality };
})();
