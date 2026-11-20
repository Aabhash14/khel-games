// Lakhey Run: track generation, running physics, camera, collisions and the render loop.
// You are a Newar kid who teased Majipa Lakhey at Indra Jatra; now he is chasing you through old Kathmandu.
// The road is a chain of straight segments joined by square chowks where the road turns (L, R) or forks (T).
// Segment-local coordinates: s = distance along the road, l = lateral offset (right is +).
// Performance: no shadow maps (blob shadows instead), Lambert scenery, merged meshes, streets built a few
// pieces per frame (no hitches), and resolution that adapts to keep the frame rate up.
(function () {
  const LR = window.LR;
  const W = LR.W, A = LR.audio;
  const LANE = (LR.LANE = 2.2), HALF = 5.5, JW = 11, DEPTH = 9;
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const yawOf = (h) => Math.atan2(DIRS[h][0], DIRS[h][1]);
  const GRAV = 30, JUMP_V = 10.2, SLIDE_T = 0.78, METER = 45;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (t) => t * t * (3 - 2 * t);
  function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

  const G = (LR.G = { on: {} });
  let renderer, scene, camera, sun, sky, mtn, ground, runner = null, lakhey, sunSprite;
  let clock = 0, last = 0, state = 'menu', stateT = 0;
  let R = Math.random, segs = [], cur = null, genDist = 0, segId = 0, lastTurns = [], jobs = [];
  let p = null, trail = [], trailDist = 0, camYaw = 0, shake = 0, camLift = 0;
  let fx = null, deathReason = '', revives = 0, dailyRun = false, menuAng = 0;
  let prMax = 1.5, pr = 1.25, frameAvg = 1 / 60, prTimer = 0;
  const tmpV = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3();

  // ---------- setup ----------
  G.init = function (canvas) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    THREE.ColorManagement.legacyMode = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = false;
    LR.aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const weak = (navigator.hardwareConcurrency || 4) <= 4;
    prMax = Math.min(window.devicePixelRatio || 1, mobile ? (weak ? 1.1 : 1.4) : 1.5);
    pr = prMax; renderer.setPixelRatio(pr);

    scene = new THREE.Scene();
    const fogC = new THREE.Color('#e7a27a');
    scene.background = fogC; scene.fog = new THREE.Fog(fogC, 40, 140);
    camera = new THREE.PerspectiveCamera(62, 1, 0.3, 560);

    W.init();
    scene.add(new THREE.HemisphereLight('#ffe0bc', '#6a2e1c', 1.0));
    sun = new THREE.DirectionalLight('#ffc490', 1.9);
    scene.add(sun); scene.add(sun.target);
    scene.add(new THREE.AmbientLight('#7a5a8a', 0.3));

    // sky dome: dusk gradient
    const sg = new THREE.SphereGeometry(500, 24, 12), cols = [], pa = sg.attributes.position;
    const top = new THREE.Color('#2c2f6e'), mid = new THREE.Color('#c96f78'), hor = new THREE.Color('#ffc07a'), low = new THREE.Color('#e7a27a');
    for (let i = 0; i < pa.count; i++) {
      const y = pa.getY(i) / 500, c = new THREE.Color();
      if (y > 0.35) c.copy(mid).lerp(top, clamp((y - 0.35) / 0.65, 0, 1));
      else if (y > 0.04) c.copy(hor).lerp(mid, (y - 0.04) / 0.31);
      else c.copy(low).lerp(hor, clamp((y + 0.1) / 0.14, 0, 1));
      cols.push(c.r, c.g, c.b);
    }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    sky = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -2; scene.add(sky);
    const mt = LR.tex.mountains(); mt.repeat.set(2, 1);
    mtn = new THREE.Mesh(new THREE.CylinderGeometry(420, 420, 90, 48, 1, true), new THREE.MeshBasicMaterial({ map: mt, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    mtn.position.y = 22; mtn.renderOrder = -1; scene.add(mtn);
    sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.M.glowSprite, color: '#fff0c0', transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    sunSprite.scale.set(120, 120, 1); scene.add(sunSprite);
    ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshLambertMaterial({ color: '#5a2a1c' }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; scene.add(ground);

    lakhey = LR.makeLakhey(); lakhey.root.scale.setScalar(0.92); scene.add(lakhey.root);
    G.setRunner(LR.D.who === 'f' ? 'f' : 'm');
    fx = makeFx(); scene.add(fx.add.points); scene.add(fx.norm.points);

    G._dbg = {
      get camera() { return camera; }, scene, renderer, lakhey, get runner() { return runner; }, get p() { return p; },
      get state() { return state; }, set state(v) { state = v; }, get reason() { return deathReason; }, get segs() { return segs; },
      get jobs() { return jobs.length; }, get pr() { return pr; },
    };
    window.addEventListener('resize', resize); resize();
    bindInput(canvas);
    G.prepare(false);
    requestAnimationFrame(loop);
    return true;
  };
  G.setRunner = function (who) {
    if (runner) { scene.remove(runner.root); runner.root.traverse((o) => { if (o.geometry && o.geometry.attributes.color) o.geometry.dispose(); }); }
    runner = LR.makeRunner(who);
    scene.add(runner.root);
    if (p) placeRunner();
  };
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < 0.7 ? 66 : 58; camera.updateProjectionMatrix();
  }
  // adaptive resolution: keep frame time near 60 fps by trading pixels
  function adaptRes(realDt) {
    frameAvg = lerp(frameAvg, Math.min(realDt, 0.1), 0.05);
    prTimer += realDt;
    if (prTimer < 1) return;
    prTimer = 0;
    let n = pr;
    if (frameAvg > 1 / 50) n = Math.max(0.6, pr - 0.15);
    else if (frameAvg < 1 / 58 && pr < prMax) n = Math.min(prMax, pr + 0.1);
    if (Math.abs(n - pr) > 0.01) { pr = n; renderer.setPixelRatio(pr); resize(); }
  }

  // ---------- particles ----------
  function makeSys(n, map, additive, size) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size, map, vertexColors: true, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, alphaTest: additive ? 0 : 0.3 });
    const points = new THREE.Points(geo, mat); points.frustumCulled = false;
    const P = []; for (let i = 0; i < n; i++) P.push({ life: 0, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, r: 1, g: 1, b: 1, grav: 0, max: 1 });
    let next = 0, alive = 0;
    return {
      points,
      emit(x, y, z, vx, vy, vz, color, life, grav) {
        const q = P[next]; next = (next + 1) % n;
        q.x = x; q.y = y; q.z = z; q.vx = vx; q.vy = vy; q.vz = vz; q.life = q.max = life; q.grav = grav || 0;
        q.r = color.r; q.g = color.g; q.b = color.b; alive = 2;
      },
      update(dt) {
        if (!alive) return;
        let any = false;
        for (let i = 0; i < n; i++) {
          const q = P[i];
          if (q.life > 0) {
            any = true;
            q.life -= dt; q.vy -= q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
            const f = Math.max(0, q.life / q.max);
            pos[i * 3] = q.x; pos[i * 3 + 1] = q.life > 0 ? q.y : -99; pos[i * 3 + 2] = q.z;
            col[i * 3] = q.r * f; col[i * 3 + 1] = q.g * f; col[i * 3 + 2] = q.b * f;
          }
        }
        if (!any) alive--;
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      },
    };
  }
  function makeFx() { return { add: makeSys(220, W.M.glowSprite, true, 0.45), norm: makeSys(220, LR.tex.petal(), false, 0.3) }; }
  const C_GOLD = new THREE.Color('#ffcf5a'), C_WHITE = new THREE.Color('#fff6e0'), C_DUST = new THREE.Color('#b98a6a'), C_MARI = new THREE.Color('#ff9a1a'), C_MARI2 = new THREE.Color('#ffc21a');

  // ---------- segments ----------
  function wpos(seg, s, l, y, out) {
    const d = DIRS[seg.h], r = DIRS[(seg.h + 1) & 3];
    return out.set(seg.sx + d[0] * s + r[0] * l, y, seg.sz + d[1] * s + r[1] * l);
  }
  function junctionCenter(seg) { const d = DIRS[seg.h]; const c = seg.L + JW / 2; return [seg.sx + d[0] * c, seg.sz + d[1] * c]; }

  function newSeg(h, sx, sz, opt) {
    opt = opt || {};
    const seg = { id: segId++, h, sx, sz, kind: opt.kind || 'normal', first: !!opt.first, tutorial: !!opt.tutorial, seed: (R() * 1e9) | 0, flocks: [] };
    seg.start = seg.first ? -14 : JW / 2;
    if (seg.tutorial) seg.L = 150;
    else if (seg.first) seg.L = 110;
    else seg.L = Math.round(52 + R() * 50 + Math.min(40, genDist / 120)) + (seg.kind === 'gali' ? 6 : 0);
    // junction type at the end; never three turns the same way in a row (keeps the road from looping into itself)
    if (seg.first) seg.end = 'L';
    else {
      const r = R();
      let e = r < 0.36 ? 'L' : r < 0.72 ? 'R' : 'T';
      if (e !== 'T' && lastTurns.length >= 2 && lastTurns[lastTurns.length - 1] === e && lastTurns[lastTurns.length - 2] === e) e = e === 'L' ? 'R' : 'L';
      seg.end = e;
    }
    if (seg.end === 'T') seg.goldLeft = R() < 0.5;
    genDist += seg.L;
    generate(seg);
    seg.job = buildSteps(seg); jobs.push(seg);
    return seg;
  }

  function generate(seg) {
    const RR = LR.rng(seg.seed);
    const obs = (seg.obs = []), coins = (seg.coins = []), items = (seg.items = []);
    const diff = clamp((genDist - seg.L) / 3500, 0, 1);
    const gali = seg.kind === 'gali';
    function add(kind, s, lanes, hint) {
      if (s > seg.L - 19) return; // keep the corner zone clear: swipes there mean "turn", not "change lane"
      const d = W.OB[kind];
      let l0, l1;
      if (kind === 'bamboo' || kind === 'toran') { l0 = -3.7; l1 = 3.7; } else { l0 = Math.min(...lanes) * LANE - 0.95; l1 = Math.max(...lanes) * LANE + 0.95; }
      if (kind === 'pots' && lanes.length > 1 && Math.abs(lanes[0] - lanes[1]) > 1) { lanes.forEach((ln) => add('pots', s, [ln], hint)); return; }
      obs.push({ kind, s, lanes, l0, l1, type: d.type, h: d.h, bottom: d.bottom, ds: d.ds, hint, hit: false });
    }
    function line(s0, n, lane, yf) { for (let i = 0; i < n; i++) coins.push({ s: s0 + i * 2.1, l: lane * LANE, y: yf ? yf(i, n) : 1.0, taken: false }); }
    const otherLane = (ex) => { const c = [-1, 0, 1].filter((x) => ex.indexOf(x) < 0); return c[(RR() * c.length) | 0]; };
    const anyLane = () => ((RR() * 3) | 0) - 1;

    let s = seg.first ? 36 : seg.start + 26;
    const end = seg.L - 16;
    if (seg.tutorial) {
      add('bamboo', 40, [-1, 0, 1], 'hJump'); line(32, 8, 0, (i, n) => 1 + Math.sin((i / (n - 1)) * Math.PI) * 1.4);
      add('toran', 70, [-1, 0, 1], 'hSlide'); line(64, 7, 0, () => 0.6);
      add('cart', 100, [0], 'hLane'); add('cow', 100, [1]); line(92, 8, -1);
      add('pots', 124, [-1]); add('pots', 124, [1]); line(116, 8, 0);
      return;
    }
    while (s < end) {
      const r = RR();
      let used = 8;
      if (r < 0.2) {
        const ln = anyLane(); add(['cart', 'cow', 'lion'][(RR() * 3) | 0], s, [ln]); line(s - 6, 6, otherLane([ln]));
      } else if (r < 0.4) {
        const free = anyLane(), bl = [-1, 0, 1].filter((x) => x !== free);
        add(RR() < 0.5 ? 'cart' : 'lion', s, [bl[0]]); add(RR() < 0.5 ? 'cow' : 'cart', s, [bl[1]]); line(s - 8, 8, free);
      } else if (r < 0.55) {
        add('bamboo', s, [-1, 0, 1]); line(s - 7, 8, anyLane(), (i, n) => 1 + Math.sin((i / (n - 1)) * Math.PI) * 1.5);
      } else if (r < 0.7) {
        add('toran', s, [-1, 0, 1]); line(s - 6, 6, anyLane(), () => 0.6);
      } else if (r < 0.82) {
        const a = anyLane(), b = otherLane([a]);
        add('pots', s, [a]); add(['cart', 'lion'][(RR() * 2) | 0], s, [b]);
        line(s - 7, 8, a, (i, n) => 1 + Math.sin((i / (n - 1)) * Math.PI) * 1.4);
      } else if ((diff > 0.25 || gali) && s + 26 < end) { // zig-zag: one side open, then the centre open
        const free1 = RR() < 0.5 ? -1 : 1, gap2 = Math.max(14, 14 + diff * 4);
        add('cart', s, [0]); add(RR() < 0.5 ? 'cow' : 'lion', s, [-free1]);
        add('lion', s + gap2, [free1]); add('cart', s + gap2, [-free1]);
        line(s - 6, 4, free1); line(s + 4, 5, 0);
        used = gap2 + 8;
      } else {
        add('pots', s, [-1, 0, 1].filter(() => RR() < 0.7).concat([anyLane()]).filter((v, i, a) => a.indexOf(v) === i));
        line(s - 6, 6, anyLane(), (i, n) => 1 + Math.sin((i / (n - 1)) * Math.PI) * 1.4);
      }
      const gap = lerp(25, 13.5, diff) * (gali ? 0.82 : 1) + RR() * 6;
      if (gali && s + used + gap - 4 < end) line(s + used + 1, Math.floor((gap - 6) / 2.1), anyLane(), () => 1.0);
      s += used + gap;
    }
    function freeSpot() {
      for (let k = 0; k < 12; k++) { const ss = seg.start + 20 + RR() * (seg.L - 40); if (obs.every((o) => Math.abs(o.s - ss) > 5)) return ss; }
      return -1;
    }
    const pw = seg.kind === 'chowk' ? 1 : seg.kind === 'gali' ? 0.25 : 0.38;
    if (RR() < pw && seg.L > 60) { const ss = freeSpot(); if (ss > 0) items.push({ kind: ['dhime', 'bhusya', 'chamar'][(RR() * 3) | 0], s: ss, l: anyLane() * LANE, taken: false }); }
    const yp = seg.kind === 'chowk' ? 0.16 : seg.kind === 'gali' ? 0.22 : 0.07;
    if (RR() < yp && seg.L > 60) { const ss = freeSpot(); if (ss > 0) items.push({ kind: 'yomari', s: ss, l: anyLane() * LANE, taken: false }); }
  }

  function at(s, l, y, ry) { return W.T4(l, y || 0, -s, 1, 1, 1, 0, ry || 0, 0); }

  // Builds a segment in small steps (a generator) so the frame never stalls.
  function* buildSteps(seg) {
    const grp = (seg.group = new THREE.Group());
    grp.position.set(seg.sx, 0, seg.sz); grp.rotation.y = -seg.h * Math.PI / 2;
    scene.add(grp);
    const RR = LR.rng(seg.seed ^ 0x5bd1e995), M = W.M, P = W.P;
    const s0 = seg.start, sEnd = seg.L + JW;
    const openL = seg.end === 'L' || seg.end === 'T', openR = seg.end === 'R' || seg.end === 'T';
    let B = new W.Batcher();
    const len = sEnd - s0, pg = new THREE.PlaneGeometry(2 * HALF, len);
    { const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * HALF / 3.6, uv.getY(i) * len / 3.6); }
    pg.rotateX(-Math.PI / 2);
    B.add(pg, M.pave, at((s0 + sEnd) / 2, 0, 0), seg.kind === 'gali' ? new THREE.Color('#ffe2b0') : undefined);
    for (const side of [-1, 1]) {
      const closed = side < 0 ? !openL : !openR, e = closed ? sEnd : seg.L;
      B.put(at((s0 + e) / 2, side * (HALF - 0.15), 0.06), W.G.box, M.stone, P.stoneDark, 0, 0, 0, 0.3, 0.12, e - s0);
      B.put(at((s0 + seg.L) / 2, side * 3.45, 0.005), W.G.box, M.stone, P.stone, 0, 0, 0, 0.12, 0.02, seg.L - s0);
    }
    // flags and lanterns across the street
    for (let s = s0 + 8; s < seg.L - 4; s += 16 + RR() * 12) {
      if (RR() < 0.6 || seg.kind === 'gali') W.lanterns(B, at(s, 0, 0), 2 * HALF, 7.6 + RR());
      else W.bunting(B, at(s, 0, 0), 2 * HALF, 8.0 + RR(), RR);
    }
    if (seg.kind === 'gali') for (let s = s0 + 4; s < seg.L; s += 7) W.lanterns(B, at(s, 0, 0), 2 * HALF, 7.2);
    B.build(grp, false); yield;

    // house rows, built in chunks of a few houses
    const people = [];
    function* row(side, a, b) {
      let s = a, n = 0;
      B = new W.Batcher();
      while (s < b - 0.5) {
        let w = 4.6 + RR() * 3;
        if (b - s - w < 3.6) w = b - s;
        const mid = s + w / 2, ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        if (w > 7 && RR() < 0.18 && !seg.first) W.pagoda(B, at(mid, side * (HALF + 0.3), 0, ry), 4, 2, RR);
        else {
          W.house(B, at(mid, side * HALF, 0, ry), w, RR);
          if (RR() < 0.45) people.push([mid + (RR() - 0.5) * w * 0.6, side * (HALF - 0.55), ry]);
          if (RR() < 0.06) W.chaitya(B, at(mid, side * (HALF - 1.0), 0, ry));
        }
        s += w;
        if (++n % 4 === 0) { B.build(grp, false); B = new W.Batcher(); yield; }
      }
      B.build(grp, false); yield;
    }
    yield* row(-1, s0, openL ? seg.L - 0.15 : sEnd);
    yield* row(1, s0, openR ? seg.L - 0.15 : sEnd);
    // far wall of the chowk: a big temple with houses behind and beside it
    B = new W.Batcher();
    W.pagoda(B, at(sEnd + 0.4, 0, 0, 0), 5.4, 3, RR);
    B.build(grp, false); yield;
    B = new W.Batcher();
    fillAcross(B, sEnd + 12, -HALF - 3, HALF + 3, 0, RR);
    if (!openL) fillAcross(B, sEnd, -(HALF + DEPTH), -HALF, 0, RR);
    if (!openR) fillAcross(B, sEnd, HALF, HALF + DEPTH, 0, RR);
    B.build(grp, false); yield;
    if (seg.first) { // start square seen on the menu
      B = new W.Batcher();
      W.pagoda(B, at(s0 - 0.4, 0, 0, Math.PI), 5.4, 3, RR);
      fillAcross(B, s0 - 12, -HALF - 3, HALF + 3, Math.PI, RR);
      fillAcross(B, s0, -HALF - DEPTH, -HALF, Math.PI, RR);
      fillAcross(B, s0, HALF, HALF + DEPTH, Math.PI, RR);
      W.lion(B, at(s0 + 3, -HALF + 1.2, 0, Math.PI / 2), false);
      W.lion(B, at(s0 + 3, HALF - 1.2, 0, -Math.PI / 2), false);
      B.build(grp, false); yield;
    }
    B = new W.Batcher();
    for (const pp of people) W.person(B, at(pp[0], pp[1], 0, pp[2]), RR);
    B.build(grp, false); yield;

    let k = 0;
    for (const o of seg.obs) {
      o.g = W.obstacle(o.kind, o.lanes, RR);
      o.g.applyMatrix4(at(o.s, 0, 0));
      grp.add(o.g);
      if (++k % 3 === 0) yield;
    }
    if (seg.coins.length) {
      const im = new THREE.InstancedMesh(W.G.coin, M.coin, seg.coins.length);
      im.frustumCulled = false; seg.coinMesh = im; grp.add(im); setCoins(seg, 0);
    }
    for (const it of seg.items) { it.g = W.item(it.kind); it.g.position.set(it.l, 1.2, -it.s); grp.add(it.g); }
    for (let s = s0 + 25; s < seg.L - 10; s += 30 + RR() * 30) {
      if (RR() < 0.55) continue;
      const fg = new THREE.Group(), fb = new W.Batcher();
      W.pigeons(fb, new THREE.Matrix4(), RR, 9 + ((RR() * 8) | 0)); fb.build(fg, false);
      const l = (RR() - 0.5) * 6;
      fg.position.set(l, 0, -s); grp.add(fg);
      seg.flocks.push({ g: fg, s, l, fly: 0, dir: l < 0 ? -1 : 1 });
    }
    if (seg.end === 'T') {
      for (const side of [-1, 1]) {
        const gold = (side < 0) === seg.goldLeft;
        const tex = LR.tex.sign(LR.t(gold ? 'gali' : 'mandir'), LR.t(gold ? 'galiSub' : 'mandirSub'), side, gold);
        const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
        board.userData.ownTex = tex;
        board.position.set(side * (HALF - 2.0), 3.6, -(seg.L - 1.5)); board.rotation.y = -side * 0.2;
        grp.add(board);
        const post = new THREE.Mesh(W.G.box, M.wood); post.scale.set(0.18, 2.6, 0.18); post.position.set(side * (HALF - 2.0), 1.3, -(seg.L - 1.4)); grp.add(post);
      }
    }
  }
  function fillAcross(B, s, l0, l1, ry, RR) {
    let l = l0;
    while (l < l1 - 0.5) {
      let w = 4.6 + RR() * 2.5; if (l1 - l - w < 3.6) w = l1 - l;
      W.house(B, at(s, l + w / 2, 0, ry), w, RR);
      l += w;
    }
  }
  function finishSeg(seg) {
    if (!seg || !seg.job) return;
    while (!seg.job.next().done) { /* run to completion */ }
    seg.job = null; jobs = jobs.filter((j) => j !== seg);
  }
  function pump(budgetMs) { // build queued streets until the time budget is used
    const t0 = performance.now();
    while (jobs.length && performance.now() - t0 < budgetMs) {
      const seg = jobs[0];
      if (seg.job.next().done) { seg.job = null; jobs.shift(); }
    }
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _sc = new THREE.Vector3(), _ps = new THREE.Vector3(), _eu = new THREE.Euler();
  function setCoins(seg, t) {
    const im = seg && seg.coinMesh; if (!im) return;
    for (let i = 0; i < seg.coins.length; i++) {
      const c = seg.coins[i];
      if (c.taken) _sc.set(0, 0, 0); else _sc.set(1, 1, 1);
      _ps.set(c.l, c.y + Math.sin(t * 3 + i * 0.5) * 0.06, -c.s);
      _eu.set(0, t * 3 + i * 0.4, 0); _q.setFromEuler(_eu);
      _m.compose(_ps, _q, _sc); im.setMatrixAt(i, _m);
    }
    im.instanceMatrix.needsUpdate = true;
  }
  const SHARED = new Set();
  function disposeSeg(seg) {
    if (!seg) return;
    if (seg.job) { seg.job = null; jobs = jobs.filter((j) => j !== seg); }
    if (!seg.group) return;
    if (!SHARED.size) Object.values(W.G).forEach((g) => SHARED.add(g));
    scene.remove(seg.group);
    seg.group.traverse((o) => {
      if (o.userData.ownTex) { o.userData.ownTex.dispose(); o.material.dispose(); o.geometry.dispose(); return; }
      if (o.geometry && !SHARED.has(o.geometry) && o.geometry.attributes.color) o.geometry.dispose();
    });
    if (seg.coinMesh) seg.coinMesh.dispose();
    seg.group = null;
  }

  function nextFrom(seg, dir) {
    const [cx, cz] = junctionCenter(seg);
    const h = dir === 'L' ? (seg.h + 3) & 3 : (seg.h + 1) & 3;
    let kind = 'normal';
    if (seg.end === 'T') kind = (dir === 'L') === seg.goldLeft ? 'gali' : 'chowk';
    return newSeg(h, cx, cz, { kind });
  }
  function ensureAhead() {
    let i = segs.indexOf(cur), ahead = cur.L + JW / 2 - p.s;
    for (let k = i + 1; k < segs.length; k++) ahead += segs[k].L;
    let tail = segs[segs.length - 1];
    while (ahead < 190 && tail.end !== 'T') {
      const n = nextFrom(tail, tail.end);
      lastTurns.push(tail.end);
      segs.push(n); ahead += n.L; tail = n;
    }
    if (tail.end === 'T' && !tail.branches) tail.branches = { L: nextFrom(tail, 'L'), R: nextFrom(tail, 'R') };
  }

  // ---------- run state ----------
  function dateSeed() { const s = G.today(); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  G.today = function () { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

  G.prepare = function (daily) {
    segs.forEach((sg) => { if (sg.branches) { disposeSeg(sg.branches.L); disposeSeg(sg.branches.R); } disposeSeg(sg); });
    jobs = []; segs = []; genDist = 0; lastTurns = []; revives = 0; dailyRun = !!daily;
    R = LR.rng(daily ? dateSeed() : (Math.random() * 4294967295) >>> 0);
    const tut = !LR.D.tut && !daily;
    cur = newSeg(0, 0, 0, { first: true, tutorial: tut });
    segs.push(cur);
    p = {
      seg: cur, s: 0, l: 0, lane: 0, y: 0, vy: 0, air: false, slideT: 0, speed: 0, dist: 0, score: 0, coins: 0, meter: 0,
      naach: 0, magnet: 0, mult: 0, shield: 0, invul: 0, chase: 1, slow: 0, turnQ: null, phase: 0, streak: 0, streakT: 0, glance: 0,
      hinted: {}, alive: true, yomariGot: 0,
    };
    trail = []; trailDist = 0; camYaw = yawOf(0);
    ensureAhead();
    finishSeg(cur); // the start square must be complete for the menu; the rest builds in the background
    state = 'menu'; stateT = 0;
    placeRunner(); placeLakheyMenu();
  };

  G.start = function () {
    if (state !== 'menu') return;
    state = 'intro'; stateT = 0;
    A.init(); A.music(true, false); A.drive(0, 0);
    setTimeout(() => A.roar(0.9), 350);
  };
  G.state = () => state;
  G.player = () => p;
  G.isDaily = () => dailyRun;

  function speedFor(d) { return 13 + 15 * (1 - Math.exp(-d / 2600)); }

  // ---------- input ----------
  let touch = null;
  function bindInput(el) {
    el.addEventListener('pointerdown', (e) => { touch = { x: e.clientX, y: e.clientY, fired: false }; });
    el.addEventListener('pointermove', (e) => {
      if (!touch || touch.fired) return;
      const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
      if (dx * dx + dy * dy > 26 * 26) { touch.fired = true; swipe(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'L' : 'R') : (dy < 0 ? 'U' : 'D')); }
    });
    el.addEventListener('pointerup', () => { touch = null; });
    el.addEventListener('pointercancel', () => { touch = null; });
    window.addEventListener('keydown', (e) => {
      const k = e.key;
      if (state === 'menu' && (k === 'Enter' || k === ' ')) { if (G.on.startKey) G.on.startKey(); return; }
      const map = { ArrowLeft: 'L', a: 'L', A: 'L', ArrowRight: 'R', d: 'R', D: 'R', ArrowUp: 'U', w: 'U', W: 'U', ' ': 'U', ArrowDown: 'D', s: 'D', S: 'D' };
      const dir = map[k];
      if (dir) { e.preventDefault(); swipe(dir); }
      if (k === 'n' || k === 'N' || k === 'Shift') G.naach();
      if ((k === 'p' || k === 'P' || k === 'Escape') && G.on.pauseKey) G.on.pauseKey();
    });
  }
  function swipe(dir) {
    if (state !== 'run' || !p.alive) return;
    const seg = p.seg;
    if (dir === 'L' || dir === 'R') {
      const inWin = p.s > seg.L - 17 && p.s < seg.L + JW - 1.2;
      const ok = seg.end === 'T' || seg.end === dir;
      if (inWin && ok) { p.turnQ = dir; return; }
      const nl = clamp(p.lane + (dir === 'L' ? -1 : 1), -1, 1);
      if (nl !== p.lane) { p.prevLane = p.lane; p.lane = nl; A.lane(); }
    } else if (dir === 'U') {
      if (!p.air) { p.air = true; p.vy = JUMP_V; p.slideT = 0; A.jump(); }
    } else if (dir === 'D') {
      if (p.air) { p.vy = -22; p.queuedSlide = true; } else { p.slideT = SLIDE_T; A.slide(); }
    }
  }
  // Jatra rush: a few seconds of unstoppable sprint
  G.naach = function () {
    if (state !== 'run' || !p.alive || p.meter < METER || p.naach > 0) return false;
    p.naach = 6.5; p.meter = 0; p.invul = Math.max(p.invul, 6.5); A.rush();
    toast('tNaach'); shake = 0.4;
    return true;
  };
  function toast(k) { if (G.on.toast) G.on.toast(k); }
  function hint(k) { if (G.on.hint) G.on.hint(k); }

  // ---------- turning ----------
  function doTurn(dir) {
    const seg = p.seg;
    let next;
    if (seg.end === 'T') {
      next = seg.branches[dir];
      const other = seg.branches[dir === 'L' ? 'R' : 'L'];
      setTimeout(() => disposeSeg(other), 700);
      segs.push(next);
      toast((dir === 'L') === seg.goldLeft ? 'gali' : 'mandir');
      lastTurns.push(dir);
    } else next = segs[segs.indexOf(seg) + 1];
    finishSeg(next);
    wpos(seg, p.s, p.l, 0, tmpV);
    const d = DIRS[next.h], r = DIRS[(next.h + 1) & 3];
    const dx = tmpV.x - next.sx, dz = tmpV.z - next.sz;
    p.s = dx * d[0] + dz * d[1]; p.l = dx * r[0] + dz * r[1];
    p.seg = cur = next; p.turnQ = null;
    A.turn();
    ensureAhead();
    if (LR.D.tut === false && seg.tutorial) { LR.D.tut = true; LR.save(); }
  }

  // ---------- death and revive ----------
  function die(reason) {
    if (!p.alive) return;
    p.alive = false; deathReason = reason; state = 'dying'; stateT = 0;
    if (reason === 'caught') { A.roar(1.2); A.stumble(); } else { A.crash(); setTimeout(() => A.roar(1), 700); }
    shake = 0.8;
    A.drive(0, 0);
    setTimeout(() => A.music(false), 400);
  }
  G.canRevive = function () { return revives < 3 && LR.D.yomari >= G.reviveCost(); };
  G.reviveCost = function () { return 1 << revives; };
  G.revive = function () {
    const cost = G.reviveCost();
    if (LR.D.yomari < cost) return;
    LR.D.yomari -= cost; LR.save(); revives++;
    const seg = p.seg;
    for (const o of seg.obs) if (o.s > p.s - 3 && o.s < p.s + 34) { o.hit = true; if (o.g) o.g.visible = false; }
    if (deathReason === 'walled') { p.s = seg.L + JW / 2 - 0.5; doTurn(seg.end === 'R' ? 'R' : 'L'); }
    p.alive = true; p.invul = 2.5; p.chase = 0; p.y = 0; p.vy = 0; p.air = false; p.slideT = 0; p.speed *= 0.8; p.deathShown = false;
    state = 'run'; A.music(true, false); A.yomari();
  };
  G.finish = function () {
    state = 'over';
    const st = { dist: Math.floor(p.dist), score: Math.floor(p.score), coins: p.coins, reason: deathReason, daily: dailyRun, best: false };
    LR.D.bank += p.coins; LR.D.runs++;
    if (dailyRun) { const t = G.today(); if (LR.D.daily.d !== t) LR.D.daily = { d: t, best: 0 }; if (st.score > LR.D.daily.best) { LR.D.daily.best = st.score; st.best = true; } }
    if (st.score > LR.D.best) { LR.D.best = st.score; st.best = st.best || !dailyRun; }
    LR.save();
    return st;
  };
  G.pause = function (on) {
    if (on && state === 'run') { state = 'paused'; A.music(false); }
    else if (!on && state === 'paused') { state = 'run'; A.music(true, false); last = performance.now(); }
  };

  // ---------- per-frame run update ----------
  function runStep(dt) {
    const seg = p.seg;
    const base = speedFor(p.dist) * (p.naach > 0 ? 1.35 : 1);
    const tgt = p.slow > 0 ? base * 0.62 : base;
    p.speed += (tgt - p.speed) * Math.min(1, dt * (p.slow > 0 ? 8 : 1.6));
    const ds = p.speed * dt;
    p.s += ds; p.dist += ds;
    p.score += ds * (p.mult > 0 ? 2 : 1);
    p.phase += dt * (5.5 + p.speed * 0.32);
    const prevL = p.l;
    p.l += (p.lane * LANE - p.l) * Math.min(1, dt * 14);
    if (p.air) {
      p.vy -= GRAV * dt; p.y += p.vy * dt;
      if (p.y <= 0) { p.y = 0; p.vy = 0; p.air = false; A.land(); dust(); if (p.queuedSlide) { p.queuedSlide = false; p.slideT = SLIDE_T; A.slide(); } }
    }
    if (p.slideT > 0) p.slideT -= dt;
    p.naach = Math.max(0, p.naach - dt); p.magnet = Math.max(0, p.magnet - dt); p.mult = Math.max(0, p.mult - dt);
    p.invul = Math.max(0, p.invul - dt); p.slow = Math.max(0, p.slow - dt); p.shield = Math.max(0, p.shield - dt);
    p.chase = Math.max(0, p.chase - dt / (p.chaseDecay || 4));
    p.streakT -= dt; if (p.streakT < 0) p.streak = 0;
    // junction
    const center = seg.L + JW / 2;
    if (p.turnQ && p.s >= center - 0.8) doTurn(p.turnQ);
    else if (p.s > seg.L + JW - 1.6) { if (p.naach > 0) doTurn(seg.end === 'R' ? 'R' : 'L'); else { die('walled'); return; } }
    if (p.s > seg.L - 22 && !p.hinted['j' + seg.id]) {
      p.hinted['j' + seg.id] = 1;
      if (seg.end === 'T') hint('hChoose');
      else if (seg.tutorial || LR.D.runs < 2) hint(seg.end === 'L' ? 'hTurnL' : 'hTurnR');
    }
    // collisions
    const sg = p.seg, sliding = p.slideT > 0;
    for (const o of sg.obs) {
      if (o.hit) continue;
      const dsx = o.s - p.s;
      if (o.hint && !p.hinted[o.s] && dsx < 20 && dsx > 0) { p.hinted[o.s] = 1; hint(o.hint); }
      if (Math.abs(dsx) > o.ds + 0.35) continue;
      if (p.l + 0.35 < o.l0 || p.l - 0.35 > o.l1) continue;
      let hit = false;
      if (o.type === 'low') hit = p.y < o.h - 0.1;
      else if (o.type === 'high') hit = !sliding;
      else hit = p.y < o.h - 0.15;
      if (!hit) continue;
      const side = Math.abs(p.l - p.lane * LANE) > 0.3 || (Math.abs(prevL - p.l) > 0.02 && Math.abs(dsx) < o.ds - 0.2);
      const tx = p.lane * LANE, intoIt = tx + 0.35 >= o.l0 && tx - 0.35 <= o.l1;
      o.hit = true;
      if (p.invul > 0) { smash(o, true); continue; }
      if (p.shield > 0) { p.shield = 0; smash(o, true); toast('tSaved'); A.power(); p.invul = 1; continue; }
      if (o.type === 'block' && !side) { smash(o, false); die('crashed'); return; }
      smash(o, true);
      if (side && intoIt && p.prevLane !== undefined) p.lane = p.prevLane;
      if (p.chase > 0.3) { die('caught'); return; }
      p.chase = 1; p.chaseDecay = 9; p.slow = 0.6; p.invul = 0.9; shake = 0.45;
      A.stumble(); setTimeout(() => A.roar(0.7), 150); toast('tClose');
    }
    // mohar
    const reach = p.magnet > 0 || p.naach > 0 ? 9 : 0;
    for (let i = 0; i < sg.coins.length; i++) {
      const c = sg.coins[i];
      if (c.taken) continue;
      const d = c.s - p.s;
      if (d > 12) break; // coins are generated in order along the road
      if (reach && d < reach && d > -1) { const k = Math.min(1, dt * 10); c.s = lerp(c.s, p.s + 0.5, k); c.l = lerp(c.l, p.l, k); c.y = lerp(c.y, p.y + 1, k); }
      if (Math.abs(d) < 0.9 && Math.abs(c.l - p.l) < 1.0 && Math.abs(c.y - (p.y + 1.0)) < 1.25) {
        c.taken = true; p.coins++; p.score += 10 * (p.mult > 0 ? 2 : 1);
        const wasFull = p.meter >= METER;
        p.meter = Math.min(METER, p.meter + 1); p.streak++; p.streakT = 0.6;
        A.coin(p.streak);
        wpos(sg, c.s, c.l, c.y, tmpV);
        for (let k = 0; k < 4; k++) fx.add.emit(tmpV.x, tmpV.y, tmpV.z, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, C_GOLD, 0.5, 4);
        if (!wasFull && p.meter >= METER) hint('hNaach');
      }
    }
    for (const it of sg.items) {
      if (it.taken || !it.g) continue;
      if (Math.abs(it.s - p.s) < 1.0 && Math.abs(it.l - p.l) < 1.1 && p.y < 2.2) {
        it.taken = true; it.g.visible = false;
        if (it.kind === 'dhime') { p.magnet = 9; toast('tDhime'); A.power(); }
        else if (it.kind === 'bhusya') { p.mult = 10; toast('tBhusya'); A.power(); }
        else if (it.kind === 'chamar') { p.shield = 25; toast('tShield'); A.power(); }
        else if (it.kind === 'yomari') { LR.D.yomari++; p.yomariGot++; LR.save(); toast('tYomari'); A.yomari(); }
        wpos(sg, it.s, it.l, 1.2, tmpV);
        for (let k = 0; k < 14; k++) fx.add.emit(tmpV.x, tmpV.y, tmpV.z, (Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 6, C_WHITE, 0.8, 3);
      }
    }
    for (const f of sg.flocks || []) {
      if (!f.fly && f.s - p.s < 16) f.fly = 0.001;
      if (f.fly && f.g.visible) { f.fly += dt; f.g.position.y = f.fly * f.fly * 6; f.g.position.x = f.l + f.dir * f.fly * 5; f.g.scale.setScalar(Math.max(0.01, 1 - f.fly * 0.25)); if (f.fly > 3) f.g.visible = false; }
    }
    if (p.naach > 0) {
      wpos(sg, p.s - 0.5, p.l, 1.2, tmpV);
      fx.norm.emit(tmpV.x + (Math.random() - 0.5), tmpV.y + Math.random(), tmpV.z + (Math.random() - 0.5), (Math.random() - 0.5) * 3, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 3, Math.random() < 0.5 ? C_MARI : C_MARI2, 1.2, 4);
    }
    while (segs.length && segs[0] !== cur && (segs[1] !== cur || p.s > 30)) disposeSeg(segs.shift());
    const sf = clamp((p.speed - 13) / 15, 0, 1);
    A.drive(sf, p.naach > 0 || p.mult > 0 ? 2 : sf > 0.35 || p.chase > 0.3 ? 1 + (sf > 0.7 ? 1 : 0) : (p.dist > 150 ? 1 : 0));
    // look back over the shoulder when the Lakhey is close
    p.glance = p.chase > 0.45 ? Math.max(0, Math.sin(clock * 2.2)) * 0.9 : 0;
  }
  function smash(o, knock) {
    if (!o.g) return;
    o.fly = { t: 0, vy: knock ? 6 : 2, vx: (Math.random() - 0.5) * 6, rz: (Math.random() - 0.5) * 6 };
    wpos(p.seg, o.s, p.l, 0.8, tmpV);
    for (let k = 0; k < 12; k++) fx.norm.emit(tmpV.x, tmpV.y, tmpV.z, (Math.random() - 0.5) * 7, Math.random() * 6, (Math.random() - 0.5) * 7, k % 2 ? C_MARI : C_DUST, 0.9, 12);
  }
  function dust() {
    wpos(p.seg, p.s, p.l, 0.1, tmpV);
    for (let k = 0; k < 6; k++) fx.norm.emit(tmpV.x, 0.1, tmpV.z, (Math.random() - 0.5) * 3, Math.random() * 1.2, (Math.random() - 0.5) * 3, C_DUST, 0.5, 2);
  }

  // ---------- placing characters and camera ----------
  function placeRunner() {
    wpos(p.seg, p.s, p.l, p.y, tmpV);
    runner.root.position.copy(tmpV);
    runner.root.rotation.y = yawOf(p.seg.h);
  }
  function placeLakheyMenu() { // looming just behind the kid in the start square
    wpos(p.seg, p.s - 3.4, p.l + 1.2, 0, tmpV);
    lakhey.root.position.copy(tmpV); lakhey.root.rotation.y = yawOf(p.seg.h); lakhey.root.visible = true;
  }
  function pushTrail() {
    const pos = runner.root.position, lt = trail[trail.length - 1];
    if (lt) { const d = Math.hypot(pos.x - lt.x, pos.z - lt.z); if (d < 0.25) return; trailDist += d; }
    trail.push({ x: pos.x, z: pos.z, yaw: runner.root.rotation.y, d: trailDist });
    if (trail.length > 300) trail.shift();
  }
  function trailAt(back, out) {
    const target = trailDist - back;
    if (!trail.length) return null;
    if (target <= trail[0].d) { const f = trail[0], ex = trail[0].d - target; out.x = f.x - Math.sin(f.yaw) * ex; out.z = f.z - Math.cos(f.yaw) * ex; out.yaw = f.yaw; return out; }
    for (let i = trail.length - 1; i > 0; i--) {
      const a = trail[i - 1], b = trail[i];
      if (a.d <= target) { const k = (target - a.d) / Math.max(1e-4, b.d - a.d); out.x = lerp(a.x, b.x, k); out.z = lerp(a.z, b.z, k); out.yaw = b.yaw; return out; }
    }
    return null;
  }
  const tp = { x: 0, z: 0, yaw: 0 };
  function placeChaser(dt, back, side) {
    if (!trailAt(back, tp)) return;
    const r = lakhey.root, off = side === undefined ? 0.95 : side;
    r.position.set(tp.x - Math.cos(tp.yaw) * off, 0, tp.z + Math.sin(tp.yaw) * off);
    r.rotation.y += angDiff(r.rotation.y, tp.yaw) * Math.min(1, dt * 8);
    r.visible = back < 15;
  }
  function orbitCam(angle, radius, height, lookH, backShift) {
    const pos = runner.root.position, yaw = runner.root.rotation.y, a = yaw + angle;
    const bx = -Math.sin(yaw) * (backShift || 0), bz = -Math.cos(yaw) * (backShift || 0);
    camPos.set(pos.x + bx + Math.sin(a) * radius, height, pos.z + bz + Math.cos(a) * radius);
    camLook.set(pos.x + bx, lookH, pos.z + bz);
  }

  // ---------- main loop ----------
  function loop(now) {
    requestAnimationFrame(loop);
    const raw = (now - last) / 1000; last = now;
    let dt = raw; if (!(dt > 0)) dt = 0.016; dt = Math.min(dt, 1 / 30);
    if (G.manual) return;
    frame(dt, true);
    if (raw > 0 && raw < 0.5 && (state === 'run' || state === 'menu')) adaptRes(raw);
  }
  const rk = { mode: 'run', phase: 0, glance: 0 }, lk = { mode: 'run', phase: 0, speed: 0 };
  function frame(dt, draw) {
    clock += dt; stateT += dt;
    rk.glance = 0;
    if (state === 'menu') {
      menuAng = Math.sin(clock * 0.35) * 0.35;
      const ph = clock * Math.PI * (96 / 60);
      rk.mode = 'idle'; rk.phase = ph; lk.mode = 'dance'; lk.phase = ph;
      placeRunner(); placeLakheyMenu();
      orbitCam(menuAng - 0.06, camera.aspect < 0.8 ? 6.6 : 5.4, 1.8, 1.4, 1.7);
      camera.position.copy(camPos); camera.lookAt(camLook);
      if (camera.aspect > 1.2) camera.translateX(-Math.min(1.7, (camera.aspect - 1) * 1.7)); // wide screens: characters on the right, menu on the left
    } else if (state === 'intro') {
      const t = Math.min(1, stateT / 1.4), e = ease(t);
      rk.mode = t < 0.3 ? 'idle' : 'run'; p.phase += dt * 9; rk.phase = p.phase;
      lk.mode = t < 0.35 ? 'grab' : 'run'; lk.phase = p.phase * 0.9;
      placeRunner(); pushTrail();
      orbitCam(lerp(menuAng - 0.06, Math.PI, e), lerp(camera.aspect < 0.8 ? 6.6 : 5.4, 7.6, e), lerp(1.8, 4.6, e), lerp(1.4, 0.7, e), lerp(1.7, 0, e));
      if (t > 0.5) { const fw = runner.root.rotation.y; camLook.x += Math.sin(fw) * 9 * (t - 0.5) * 2; camLook.z += Math.cos(fw) * 9 * (t - 0.5) * 2; }
      camera.position.copy(camPos); camera.lookAt(camLook);
      placeChaser(dt, lerp(3.4, 2.1, e), lerp(-1.2, 0.95, e));
      if (t >= 1) { state = 'run'; p.speed = 9; p.chase = 1; p.chaseDecay = 4; if (G.on.runStart) G.on.runStart(); }
    } else if (state === 'run') {
      runStep(dt);
      rk.mode = p.slideT > 0 ? 'slide' : p.air ? 'jump' : 'run'; rk.phase = p.phase; rk.glance = p.glance;
      if (state === 'run') {
        placeRunner(); pushTrail(); runCamera(dt);
        lk.mode = 'run'; lk.phase = p.phase * 0.85; lk.speed = p.speed;
        placeChaser(dt, 2.1 + (1 - p.chase) * 17);
        setCoins(p.seg, clock);
        const ni = segs.indexOf(p.seg) + 1; if (segs[ni]) setCoins(segs[ni], clock);
        if (p.seg.branches) { setCoins(p.seg.branches.L, clock); setCoins(p.seg.branches.R, clock); }
      }
      if (G.on.hud) G.on.hud(p);
    } else if (state === 'dying') {
      const t = Math.min(1, stateT / 1.6), e = ease(t);
      rk.mode = deathReason === 'caught' ? 'caught' : 'fall';
      if (deathReason !== 'caught') { const fw = runner.root.rotation.y; runner.root.position.x -= Math.sin(fw) * dt * 2 * (1 - t); runner.root.position.z -= Math.cos(fw) * dt * 2 * (1 - t); }
      if (deathReason === 'walled') orbitCam(lerp(Math.PI, 2.3, e), lerp(8.2, 4.8, e), lerp(5.0, 2.6, e), 1.0);
      else orbitCam(lerp(Math.PI, 0.6, e), lerp(8.2, 5.0, e), lerp(5.0, 2.2, e), 1.2, 1.0);
      camera.position.copy(camPos); camera.lookAt(camLook);
      const from = 2.1 + (1 - p.chase) * 17;
      placeChaser(dt, lerp(from, 1.25, Math.min(1, t * 1.5)), lerp(0.95, 0, Math.min(1, t * 1.5)));
      lk.mode = t > 0.45 ? (deathReason === 'caught' ? 'grab' : 'dance') : 'run'; lk.phase = clock * 6;
      if (stateT > 1.7 && !p.deathShown) { p.deathShown = true; if (G.on.death) G.on.death(deathReason); }
    } else if (state === 'paused' || state === 'over') {
      rk.mode = state === 'over' ? (deathReason === 'caught' ? 'caught' : 'fall') : rk.mode;
      if (state === 'over') { lk.mode = deathReason === 'caught' ? 'grab' : 'dance'; lk.phase = clock * 6; }
    }
    if (state !== 'paused') { runner.update(dt, clock, rk); lakhey.update(dt, clock, lk); }

    for (const sg of segs) for (const o of sg.obs) if (o.fly && o.g && o.g.visible) {
      o.fly.t += dt; o.fly.vy -= 20 * dt; o.g.position.y += o.fly.vy * dt; o.g.position.x += o.fly.vx * dt; o.g.rotation.z += o.fly.rz * dt;
      if (o.fly.t > 1.5) o.g.visible = false;
    }
    for (const it of p.seg.items) if (it.g && !it.taken) { it.g.rotation.y = clock * 2; it.g.position.y = 1.2 + Math.sin(clock * 3) * 0.15; }
    fx.add.update(dt); fx.norm.update(dt);
    if (shake > 0) { shake = Math.max(0, shake - dt * 1.6); camera.position.x += (Math.random() - 0.5) * shake * 0.5; camera.position.y += (Math.random() - 0.5) * shake * 0.5; }
    const fovT = (camera.aspect < 0.7 ? 66 : 58) + (state === 'run' ? clamp((p.speed - 13) * 0.35, 0, 6) + (p.naach > 0 ? 6 : 0) : 0);
    if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
    const lp = runner.root.position;
    sky.position.set(camera.position.x, 0, camera.position.z); mtn.position.x = camera.position.x; mtn.position.z = camera.position.z;
    sun.position.set(lp.x - 22, 30, lp.z - 14); sun.target.position.copy(lp);
    sunSprite.position.set(camera.position.x - 300, 40, camera.position.z - 190);
    ground.position.x = Math.round(lp.x / 10) * 10; ground.position.z = Math.round(lp.z / 10) * 10;
    // streets ahead are built a little at a time
    if (jobs.length) pump(state === 'run' ? 3 : 8);
    if (draw) renderer.render(scene, camera);
  }
  G.step = function (dt, n, draw) { for (let i = 0; i < (n || 1); i++) frame(dt, draw && i === n - 1); };
  G.swipe = function (d) { swipe(d); };
  function runCamera(dt) {
    camYaw += angDiff(camYaw, yawOf(p.seg.h)) * Math.min(1, dt * 7);
    const pos = runner.root.position, fx_ = Math.sin(camYaw), fz = Math.cos(camYaw);
    camLift = lerp(camLift, p.chase > 0.25 ? 1.3 : 0, Math.min(1, dt * 3)); // look over the Lakhey's head while he is close
    const h = 4.6 + camLift + p.y * 0.35, back = 7.6 + camLift * 0.6 + clamp((p.speed - 13) * 0.05, 0, 0.8);
    camera.position.set(pos.x - fx_ * back, h, pos.z - fz * back);
    camera.lookAt(pos.x + fx_ * 9, 0.7 + p.y * 0.5, pos.z + fz * 9);
  }

  // ---------- story image ----------
  G.snapshot = function (w, h) {
    const oldSize = renderer.getSize(new THREE.Vector2()), oldPR = renderer.getPixelRatio(), oldAsp = camera.aspect, oldFov = camera.fov;
    const rPos = runner.root.position.clone(), lPos = lakhey.root.position.clone(), lRot = lakhey.root.rotation.y, lVis = lakhey.root.visible;
    renderer.setPixelRatio(1); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = 50; camera.updateProjectionMatrix();
    // pose: the kid teasing in front, the Lakhey lunging behind
    const yaw = runner.root.rotation.y;
    lakhey.root.position.set(rPos.x - Math.sin(yaw) * 2.4 - Math.cos(yaw) * 1.5, 0, rPos.z - Math.cos(yaw) * 2.4 + Math.sin(yaw) * 1.5);
    lakhey.root.rotation.y = yaw; lakhey.root.visible = true;
    runner.root.position.y = 0;
    runner.update(1, 1.3, { mode: 'idle', phase: 1.3 }); runner.update(0.016, 1.32, { mode: 'idle', phase: 1.32 });
    lakhey.update(1, 1.3, { mode: 'grab', phase: 1.3 }); lakhey.update(0.016, 1.32, { mode: 'grab', phase: 1.32 });
    orbitCam(-0.15, 5.4, 1.9, 1.45, 1.2);
    camera.position.copy(camPos); camera.lookAt(camLook);
    renderer.render(scene, camera);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(renderer.domElement, 0, 0, w, h);
    renderer.setPixelRatio(oldPR); renderer.setSize(oldSize.x, oldSize.y, false);
    camera.aspect = oldAsp; camera.fov = oldFov; camera.updateProjectionMatrix();
    runner.root.position.copy(rPos); lakhey.root.position.copy(lPos); lakhey.root.rotation.y = lRot; lakhey.root.visible = lVis;
    return c;
  };
})();
