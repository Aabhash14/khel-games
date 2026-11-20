// Lakhey Run: builders for old-Kathmandu streets. Static pieces are merged per material by a Batcher,
// so a whole street segment draws in a handful of calls.
(function () {
  const LR = window.LR;
  const W = (LR.W = {});
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const C = (h) => new THREE.Color(h);
  const WHITE = new THREE.Color(1, 1, 1);
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();

  // ---------- matrices ----------
  function T4(x, y, z, sx, sy, sz, rx, ry, rz) {
    _p.set(x || 0, y || 0, z || 0); _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e);
    _s.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
    return new THREE.Matrix4().compose(_p, _q, _s);
  }
  W.T4 = T4;
  function mul(a, b) { return new THREE.Matrix4().multiplyMatrices(a, b); }
  W.mul = mul;

  // ---------- batcher ----------
  function ni(g) { if (!g.index) return g; if (!g.userData.ni) g.userData.ni = g.toNonIndexed(); return g.userData.ni; }
  class Batcher {
    constructor() { this.map = new Map(); }
    add(geo, mat, m, color) {
      let a = this.map.get(mat); if (!a) this.map.set(mat, (a = []));
      a.push({ geo, m, c: color || WHITE });
    }
    put(base, geo, mat, color, x, y, z, sx, sy, sz, rx, ry, rz) { this.add(geo, mat, mul(base, T4(x, y, z, sx, sy, sz, rx, ry, rz)), color); }
    build(parent, shadow) {
      const out = [], v = new THREE.Vector3(), nm = new THREE.Matrix3();
      for (const [mat, arr] of this.map) {
        let n = 0; for (const it of arr) n += ni(it.geo).attributes.position.count;
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
        let o = 0;
        for (const it of arr) {
          const g = ni(it.geo), p = g.attributes.position, q = g.attributes.normal, u = g.attributes.uv;
          nm.getNormalMatrix(it.m);
          for (let i = 0; i < p.count; i++, o++) {
            v.fromBufferAttribute(p, i).applyMatrix4(it.m); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
            v.fromBufferAttribute(q, i).applyMatrix3(nm).normalize(); nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z;
            if (u) { uv[o * 2] = u.getX(i); uv[o * 2 + 1] = u.getY(i); }
            col[o * 3] = it.c.r; col[o * 3 + 1] = it.c.g; col[o * 3 + 2] = it.c.b;
          }
        }
        const bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
        bg.computeBoundingSphere();
        const mesh = new THREE.Mesh(bg, mat);
        mesh.castShadow = !!shadow; mesh.receiveShadow = !shadow;
        parent.add(mesh); out.push(mesh);
      }
      this.map.clear();
      return out;
    }
  }
  W.Batcher = Batcher;

  // ---------- geometry helpers ----------
  function box(w, h, d, tile) { // box with world-scaled UVs so textures tile evenly
    const g = new THREE.BoxGeometry(w, h, d);
    if (tile) {
      const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile); }
    }
    return g;
  }
  W.box = box;
  function prism() { // triangle (z -0.5..0.5 at y 0, apex y 1) extruded along x -0.5..0.5
    const a = [-0.5, 0, 0.5], b = [0.5, 0, 0.5], c = [0, 1, 0], P = [];
    const tri = (p, q, r) => P.push(...p, ...q, ...r);
    const L = (pt) => [-0.5, pt[1], pt[2] === undefined ? pt[0] : pt[2]];
    // vertices given as [y,z] pairs
    const v = [[0, -0.5], [0, 0.5], [1, 0]];
    const at = (x, i) => [x, v[i][0], v[i][1]];
    tri(at(-0.5, 0), at(-0.5, 1), at(-0.5, 2)); tri(at(0.5, 0), at(0.5, 2), at(0.5, 1));
    tri(at(-0.5, 1), at(0.5, 1), at(0.5, 2)); tri(at(-0.5, 1), at(0.5, 2), at(-0.5, 2));
    tri(at(-0.5, 0), at(-0.5, 2), at(0.5, 2)); tri(at(-0.5, 0), at(0.5, 2), at(0.5, 0));
    void a; void b; void c; void L;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const uv = []; for (let i = 0; i < P.length / 3; i++) uv.push(P[i * 3 + 2] + 0.5, P[i * 3 + 1]);
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }

  // ---------- init: materials, textures, shared geometry ----------
  W.init = function () {
    const T = LR.tex;
    const M = (W.M = {});
    const brickT = T.brick();
    // scenery uses cheap Lambert lighting; only gold gets Phong highlights
    M.brick = lam({ map: brickT, vertexColors: true });
    M.vc = lam({ vertexColors: true });
    M.gloss = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 50, specular: '#444444' });
    M.metal = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 80, specular: '#ffe2a0', color: '#d9a640' });
    M.roof = lam({ map: T.roof(), vertexColors: true });
    M.wood = lam({ map: T.wood(), vertexColors: true });
    const lt = T.latticeTex();
    M.lattice = lam({ map: lt.map, emissiveMap: lt.emissive, emissive: '#ffffff', emissiveIntensity: 1.3, vertexColors: true });
    const pt = T.paving(); M.pave = lam({ map: pt, vertexColors: true });
    M.glow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    M.flag = lam({ vertexColors: true, side: THREE.DoubleSide });
    M.stone = lam({ vertexColors: true });
    M.coin = new THREE.MeshPhongMaterial({ map: T.coin(), color: '#ffe08a', shininess: 90, specular: '#fff0c0', emissive: '#6a4400', emissiveIntensity: 0.6 });
    M.glowSprite = T.glow();
    // facades: 4 variants each for 3 and 4 storeys
    W.facades = { 3: [], 4: [] };
    for (const s of [3, 4]) for (let k = 0; k < 4; k++) {
      const f = T.facade(101 + s * 17 + k * 31, s);
      f.mat = lam({ map: f.map, emissiveMap: f.emissive, emissive: '#ffffff', emissiveIntensity: 1.25, vertexColors: true });
      W.facades[s].push(f);
    }
    // shared unit geometry
    const G = (W.G = {});
    G.box = new THREE.BoxGeometry(1, 1, 1);
    G.plane = new THREE.PlaneGeometry(1, 1);
    G.prism = prism();
    G.cone4 = new THREE.ConeGeometry(1, 1, 4, 1); G.cone4.rotateY(Math.PI / 4);
    G.sphere = new THREE.SphereGeometry(1, 10, 7);
    G.sphereLo = new THREE.SphereGeometry(1, 6, 4);
    G.cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
    G.cylLo = new THREE.CylinderGeometry(1, 1, 1, 7);
    G.cone = new THREE.ConeGeometry(1, 1, 12);
    G.capsule = new THREE.CapsuleGeometry(1, 1, 3, 8);
    G.torus = new THREE.TorusGeometry(1, 0.25, 6, 16);
    const fl = new THREE.BufferGeometry();
    fl.setAttribute('position', new THREE.Float32BufferAttribute([-0.2, 0, 0, 0.2, 0, 0, 0, -0.45, 0], 3));
    fl.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0.5, 0], 2));
    fl.computeVertexNormals(); G.flag = fl;
    G.pot = new THREE.LatheGeometry([[0.0, 0], [0.16, 0.02], [0.26, 0.14], [0.28, 0.26], [0.22, 0.4], [0.12, 0.47], [0.13, 0.53], [0.0, 0.53]].map((p) => new THREE.Vector2(p[0], p[1])), 14);
    G.coin = new THREE.CylinderGeometry(0.34, 0.34, 0.07, 22); G.coin.rotateX(Math.PI / 2);
    // vertex colour palette
    W.P = {
      cornice: C('#6b2a19'), woodDark: C('#3a1f10'), wood: C('#6b3d1d'), stone: C('#8d8a82'), stoneDark: C('#5f5c56'),
      gold: C('#ffcf5a'), white: C('#f4efe4'), red: C('#c4160e'), black: C('#1a1412'), skin: C('#9a6040'), skin2: C('#7a4a30'),
      terracotta: C('#b4552e'), green: C('#3f8f3a'), bamboo: C('#c9b46a'), marigold: C('#ff8a00'), marigold2: C('#ffb300'),
      lamp: C('#ffcf6a'), cow: C('#ece6da'), pigeon: C('#7b8090'),
    };
  };

  // ---------- houses ----------
  // House-local frame: facade at z = 0 facing +z, x across the front, depth to -z.
  W.house = function (B, base, w, R) {
    const P = W.P, M = W.M, G = W.G;
    const storeys = R() < 0.5 ? 3 : 4, F = W.facades[storeys][(R() * 4) | 0], h = F.units, D = 9;
    const t = new THREE.Color().setHSL(0.03 + R() * 0.04, 0.2 + R() * 0.3, 0.82 + R() * 0.15);
    B.add(box(w - 0.02, h, D, 1.6), M.brick, mul(base, T4(0, h / 2, -D / 2)), t);
    B.put(base, G.plane, F.mat, t, 0, h / 2, 0.04, w, h, 1);
    let y = 3.2; for (let f = 1; f < storeys; f++) { B.put(base, G.box, M.vc, P.cornice, 0, y - 0.12, 0.13, w + 0.06, 0.16, 0.24); y += 2.6; }
    // pitched tiled roof with deep overhang
    const ov = 1.3, a = 0.46, run = D / 2 + ov, rise = (D / 2) * Math.tan(a), sl = run / Math.cos(a);
    const rt = new THREE.Color().setHSL(0.03, 0.35, 0.55 + R() * 0.25);
    const yEdge = h - ov * Math.tan(a);
    B.add(box(w + 0.5, 0.2, sl, 1.2), M.roof, mul(base, T4(0, yEdge + (run * Math.tan(a)) / 2 + 0.1, ov - run / 2, 1, 1, 1, a)), rt);
    B.add(box(w + 0.5, 0.2, sl, 1.2), M.roof, mul(base, T4(0, yEdge + (run * Math.tan(a)) / 2 + 0.1, -D - ov + run / 2, 1, 1, 1, -a)), rt);
    B.put(base, G.prism, M.brick, t, 0, h, -D / 2, w - 0.02, rise, D);
    B.put(base, G.box, M.vc, P.woodDark, 0, h + rise + 0.18, -D / 2, w + 0.5, 0.18, 0.3);
    // carved struts (tunala) under the eave
    const n = Math.max(3, Math.round(w / 1.6));
    for (let k = 0; k < n; k++) {
      const x = -w / 2 + (k + 0.5) * w / n, dy = 1.5, dz = ov * 0.8, L = Math.hypot(dy, dz);
      B.put(base, G.box, M.wood, P.wood, x, h - 1.25 + dy / 2, 0.08 + dz / 2, 0.14, L, 0.12, Math.atan2(dz, dy));
    }
    // projecting carved bay window on some houses
    if (R() < 0.45) {
      const yy = 3.2 + 2.6 * (storeys === 4 ? 1 : 0) + 1.25;
      B.put(base, G.box, M.lattice, WHITE, 0, yy, 0.4, w * 0.55, 1.4, 0.75);
      B.put(base, G.box, M.vc, P.woodDark, 0, yy + 0.78, 0.45, w * 0.6, 0.16, 0.95);
      B.put(base, G.box, M.vc, P.woodDark, 0, yy - 0.78, 0.45, w * 0.6, 0.16, 0.95);
    }
    return h;
  };

  // ---------- temples ----------
  // Multi-tiered pagoda, front facing +z, total footprint about 1.7 * s.
  W.pagoda = function (B, base, s, tiers, R) {
    const P = W.P, M = W.M, G = W.G;
    const cz = -s * 0.85;
    let y = 0;
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const pw = s * (1.7 - i * 0.17), ph = 0.45;
      B.add(box(pw, ph, pw, 1.6), M.brick, mul(base, T4(0, y + ph / 2, cz)), new THREE.Color().setHSL(0.03, 0.3, 0.75));
      B.put(base, G.box, M.stone, P.stone, 0, y + ph - 0.03, cz, pw + 0.04, 0.08, pw + 0.04);
      y += ph;
    }
    // stone lions guarding the steps
    for (const sx of [-1, 1]) W.lion(B, mul(base, T4(sx * s * 0.45, 0, cz + s * 0.85 + 0.2, 0.75, 0.75, 0.75)), false);
    const cw = s * 0.9, ch = 2.9;
    B.add(box(cw, ch, cw, 1.6), M.brick, mul(base, T4(0, y + ch / 2, cz)), WHITE);
    // carved doors and pillars on the front
    B.put(base, G.box, M.lattice, WHITE, 0, y + 1.15, cz + cw / 2 + 0.06, cw * 0.55, 2.1, 0.12);
    for (let k = -2; k <= 2; k++) B.put(base, G.box, M.wood, P.woodDark, k * cw / 4.2, y + ch / 2, cz + cw / 2 + 0.18, 0.18, ch, 0.18);
    B.put(base, G.box, M.vc, P.gold, 0, y + 2.35, cz + cw / 2 + 0.2, cw * 0.6, 0.35, 0.1);
    let ry = y + ch, rw = cw;
    const goldTop = R() < 0.4;
    const strutCols = [C('#c4160e'), C('#1b5fb8'), C('#2f9e4a'), C('#ffcf5a')];
    for (let t = 0; t < tiers; t++) {
      const r = (rw / 2 + 1.25) * Math.SQRT2, rh = r * 0.42;
      const top = t === tiers - 1;
      const mat = top && goldTop ? M.metal : M.roof;
      const col = top && goldTop ? P.gold : new THREE.Color().setHSL(0.03, 0.4, 0.5);
      B.put(base, G.cone4, mat, col, 0, ry + rh / 2, cz, r, rh, r);
      // painted struts under the roof
      for (let side = 0; side < 4; side++) {
        const ang = side * Math.PI / 2;
        for (let k = -1; k <= 1; k++) {
          const along = k * rw / 3, out = rw / 2 + 0.45;
          const x = Math.cos(ang) * along + Math.sin(ang) * out, z = -Math.sin(ang) * along + Math.cos(ang) * out;
          B.put(base, G.box, M.wood, k ? P.woodDark : strutCols[side % 4], x, ry - 0.45, cz + z, 0.12, 1.1, 0.12, Math.cos(ang) * 0.6, 0, -Math.sin(ang) * 0.6);
        }
        // hanging bell at each corner
        const cx = Math.cos(ang + Math.PI / 4) * (rw / 2 + 1.1), cz2 = Math.sin(ang + Math.PI / 4) * (rw / 2 + 1.1);
        B.put(base, G.sphereLo, M.metal, P.gold, cx, ry - 0.05, cz + cz2, 0.1, 0.13, 0.1);
      }
      // brass fringe along the roof edge (kinkinimala)
      for (let side = 0; side < 4; side++) {
        const ang = side * Math.PI / 2, half = rw / 2 + 1.15;
        for (let k = -4; k <= 4; k++) {
          const along = k * half / 4.5;
          const x = Math.cos(ang) * along + Math.sin(ang) * half, z = -Math.sin(ang) * along + Math.cos(ang) * half;
          B.put(base, G.box, M.metal, P.gold, x, ry - 0.12, cz + z, 0.08, 0.22, 0.03, 0, -ang, 0);
        }
      }
      if (!top) {
        rw *= 0.68;
        const by = ry + rh * 0.45;
        B.add(box(rw, 1.3, rw, 1.6), M.brick, mul(base, T4(0, by + 0.65, cz)), WHITE);
        B.put(base, G.box, M.lattice, WHITE, 0, by + 0.65, cz + rw / 2 + 0.03, rw * 0.6, 0.8, 0.06);
        ry = by + 1.3;
      } else ry += rh;
    }
    // gajur: gilded finial
    B.put(base, G.sphere, M.metal, P.gold, 0, ry + 0.05, cz, 0.28, 0.2, 0.28);
    B.put(base, G.cyl, M.metal, P.gold, 0, ry + 0.35, cz, 0.12, 0.4, 0.12);
    B.put(base, G.sphere, M.metal, P.gold, 0, ry + 0.7, cz, 0.18, 0.22, 0.18);
    B.put(base, G.cone, M.metal, P.gold, 0, ry + 1.15, cz, 0.12, 0.6, 0.12);
    // long gold banner (pataka) hanging from the top roof
    return ry + 1.5;
  };
  // small white chaitya / stupa
  W.chaitya = function (B, base) {
    const P = W.P, M = W.M, G = W.G;
    B.put(base, G.box, M.stone, P.stone, 0, 0.25, 0, 1.6, 0.5, 1.6);
    B.put(base, G.box, M.stone, P.stone, 0, 0.65, 0, 1.2, 0.3, 1.2);
    B.put(base, G.sphere, M.vc, P.white, 0, 0.8, 0, 0.6, 0.6, 0.6);
    B.put(base, G.box, M.metal, P.gold, 0, 1.45, 0, 0.35, 0.3, 0.35);
    B.put(base, G.cone, M.metal, P.gold, 0, 1.95, 0, 0.18, 0.8, 0.18);
  };
  // stone lion (simha), facing +z. Optional red tika smear.
  W.lion = function (B, base, big) {
    const P = W.P, M = W.M, G = W.G, st = P.stone, sd = P.stoneDark;
    const k = big ? 1.25 : 1;
    B.put(base, G.box, M.stone, sd, 0, 0.35 * k, 0, 0.9 * k, 0.7 * k, 1.3 * k);
    B.put(base, G.box, M.stone, st, 0, 0.72 * k + 0.02, 0, 0.98 * k, 0.06, 1.38 * k);
    B.put(base, G.sphere, M.stone, st, 0, 1.2 * k, -0.15 * k, 0.36 * k, 0.5 * k, 0.45 * k);
    B.put(base, G.sphere, M.stone, st, 0, 1.75 * k, 0.15 * k, 0.32 * k, 0.32 * k, 0.32 * k);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; B.put(base, G.sphereLo, M.stone, sd, Math.cos(a) * 0.3 * k, 1.75 * k + Math.sin(a) * 0.3 * k, 0.05 * k, 0.12 * k, 0.12 * k, 0.12 * k); }
    B.put(base, G.box, M.stone, st, 0, 1.68 * k, 0.42 * k, 0.24 * k, 0.16 * k, 0.16 * k);
    for (const sx of [-1, 1]) B.put(base, G.box, M.stone, st, sx * 0.16 * k, 0.98 * k, 0.28 * k, 0.12 * k, 0.5 * k, 0.14 * k);
    B.put(base, G.sphereLo, M.vc, P.red, 0, 1.92 * k, 0.4 * k, 0.07 * k, 0.07 * k, 0.03 * k);
  };

  // ---------- street dressing ----------
  W.bunting = function (B, base, span, y, R) { // pataka flags strung across the street
    const P = W.P, M = W.M, G = W.G;
    const cols = ['#e3262f', '#ffd23f', '#2f9e4a', '#1f6fc4', '#ffffff', '#ff8f1f'].map(C);
    const n = Math.round(span / 0.55), sag = 0.9;
    let px = -span / 2, py = y;
    for (let i = 1; i <= n; i++) {
      const t = i / n, x = -span / 2 + span * t, yy = y - sag * Math.sin(Math.PI * t);
      const dx = x - px, dy = yy - py, L = Math.hypot(dx, dy);
      B.put(base, G.box, M.vc, P.black, (x + px) / 2, (yy + py) / 2, 0, L, 0.025, 0.025, 0, 0, Math.atan2(dy, dx));
      B.put(base, G.flag, M.flag, cols[(i + ((R() * 2) | 0)) % cols.length], x, yy, 0, 1, 1, 1, 0, (R() - 0.5) * 0.4, 0);
      px = x; py = yy;
    }
  };
  W.lanterns = function (B, base, span, y) {
    const P = W.P, M = W.M, G = W.G;
    const n = Math.round(span / 0.9), sag = 0.6;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = -span / 2 + span * t, yy = y - sag * Math.sin(Math.PI * t);
      B.put(base, G.sphereLo, M.glow, P.lamp, x, yy - 0.15, 0, 0.13, 0.17, 0.13);
      if (i) B.put(base, G.box, M.vc, P.black, x - span / n / 2, yy + 0.02, 0, span / n, 0.02, 0.02);
    }
  };
  W.person = function (B, base, R) {
    const P = W.P, M = W.M, G = W.G;
    const kind = R(), kid = R() < 0.35, k = kid ? 0.62 : 0.9 + R() * 0.12;
    let bodyC, topC = null, hairC = P.black;
    if (kind < 0.33) { bodyC = C('#1a1412'); topC = C('#b3160f'); } // haku patasi: black sari, red border
    else if (kind < 0.66) { bodyC = C('#ece4d2'); } // daura suruwal
    else bodyC = new THREE.Color().setHSL(R(), 0.6, 0.5); // bright kid clothes
    const skin = R() < 0.5 ? P.skin : P.skin2;
    B.put(base, G.capsule, M.vc, bodyC, 0, 0.72 * k, 0, 0.21 * k, 0.75 * k, 0.17 * k);
    if (topC) B.put(base, G.cyl, M.vc, topC, 0, 0.3 * k, 0, 0.23 * k, 0.12 * k, 0.19 * k);
    B.put(base, G.sphere, M.vc, skin, 0, 1.42 * k, 0, 0.15 * k, 0.17 * k, 0.15 * k);
    if (kind >= 0.33 && kind < 0.66) B.put(base, G.box, M.vc, new THREE.Color().setHSL(R(), 0.6, 0.45), 0, 1.6 * k, -0.01, 0.27 * k, 0.12 * k, 0.24 * k, 0.15); // dhaka topi
    else B.put(base, G.sphere, M.vc, hairC, 0, 1.47 * k, -0.04 * k, 0.16 * k, 0.15 * k, 0.15 * k);
    const cheer = R() < 0.5;
    for (const sx of [-1, 1]) B.put(base, G.capsule, M.vc, bodyC, sx * 0.25 * k, (cheer ? 1.35 : 0.85) * k, 0, 0.06 * k, 0.4 * k, 0.06 * k, 0, 0, sx * (cheer ? -2.6 : 0.2));
  };
  W.pigeons = function (B, base, R, n) {
    const P = W.P, M = W.M, G = W.G;
    for (let i = 0; i < n; i++) {
      const x = (R() - 0.5) * 3, z = (R() - 0.5) * 3, ry = R() * 6.28;
      const c = new THREE.Color().setHSL(0.62, 0.08, 0.38 + R() * 0.2);
      B.put(base, G.sphereLo, M.vc, c, x, 0.13, z, 0.11, 0.1, 0.18, 0, ry);
      B.put(base, G.sphereLo, M.vc, c, x + Math.sin(ry) * 0.15, 0.25, z + Math.cos(ry) * 0.15, 0.07, 0.07, 0.07);
    }
  };

  // ---------- obstacles (each returns its own Group) ----------
  // kinds: pots (low, per lane), bamboo (low, full), toran (high, full), cart (block), cow (block, jumpable), lion (block)
  W.obstacle = function (kind, lanes, R) {
    const g = new THREE.Group(), B = new Batcher(), P = W.P, M = W.M, G = W.G, I = new THREE.Matrix4();
    const LANE = LR.LANE;
    if (kind === 'pots') {
      for (const ln of lanes) {
        const x = ln * LANE;
        B.put(I, G.box, M.wood, P.wood, x, 0.1, 0, 1.9, 0.2, 0.7);
        for (let k = -1; k <= 1; k++) {
          const s = 1 + R() * 0.25;
          B.put(I, G.pot, M.gloss, new THREE.Color().setHSL(0.05, 0.6, 0.38 + R() * 0.1), x + k * 0.6, 0.2, (R() - 0.5) * 0.15, s * 1.05, s * 1.05, s * 1.05);
          B.put(I, G.torus, M.vc, P.white, x + k * 0.6, 0.2 + 0.36 * s, 0, 0.24 * s, 0.24 * s, 0.24 * s, Math.PI / 2);
        }
      }
    } else if (kind === 'bamboo') {
      const span = 3 * LANE + 1.2;
      for (const sx of [-1, 1]) for (const lean of [-0.35, 0.35]) B.put(I, G.cylLo, M.vc, P.bamboo, sx * span / 2, 0.45, 0, 0.05, 1.05, 0.05, lean, 0, 0);
      B.put(I, G.cylLo, M.vc, P.bamboo, 0, 0.72, 0, 0.08, span, 0.08, 0, 0, Math.PI / 2);
      for (let i = 0; i <= 22; i++) { const t = i / 22, x = -span / 2 + span * t; B.put(I, G.sphereLo, M.vc, i % 2 ? P.marigold : P.marigold2, x, 0.62 - Math.sin(t * Math.PI * 4) ** 2 * 0.12, 0.05, 0.07, 0.07, 0.07); }
    } else if (kind === 'toran') {
      const span = 3 * LANE + 1.6;
      for (const sx of [-1, 1]) {
        B.put(I, G.box, M.wood, P.woodDark, sx * span / 2, 1.6, 0, 0.22, 3.2, 0.22);
        B.put(I, G.box, M.metal, P.gold, sx * span / 2, 3.25, 0, 0.32, 0.12, 0.32);
      }
      B.put(I, G.box, M.wood, P.wood, 0, 2.65, 0, span + 0.4, 0.3, 0.22);
      B.put(I, G.box, M.vc, P.red, 0, 2.45, 0.02, span, 0.12, 0.2);
      for (let x = -span / 2 + 0.3; x < span / 2 - 0.1; x += 0.32) {
        const len = 1.15 + Math.sin(x * 3) * 0.08;
        B.put(I, G.cylLo, M.vc, (x * 7 | 0) % 2 ? P.marigold : P.marigold2, x, 2.4 - len / 2, 0, 0.07, len, 0.07);
        B.put(I, G.sphereLo, M.vc, P.marigold2, x, 2.4 - len, 0, 0.09, 0.09, 0.09);
        B.put(I, G.sphereLo, M.metal, P.gold, x, 2.4 - len - 0.12, 0, 0.06, 0.08, 0.06);
      }
    } else if (kind === 'cart') {
      const x = lanes[0] * LANE;
      B.put(I, G.box, M.wood, P.wood, x, 0.85, 0, 1.7, 0.12, 1.5);
      B.put(I, G.box, M.wood, P.woodDark, x, 1.05, 0.73, 1.7, 0.3, 0.06); B.put(I, G.box, M.wood, P.woodDark, x, 1.05, -0.73, 1.7, 0.3, 0.06);
      for (const sx of [-1, 1]) {
        B.put(I, G.cyl, M.wood, P.woodDark, x + sx * 0.9, 0.45, 0, 0.45, 0.08, 0.45, 0, 0, Math.PI / 2);
        B.put(I, G.box, M.wood, P.wood, x + sx * 0.4, 0.75, 1.2, 0.07, 0.07, 1.2);
      }
      // heap of goods: vegetables or clay pots
      const veg = R() < 0.5;
      for (let i = 0; i < 16; i++) {
        const px = x + (R() - 0.5) * 1.3, pz = (R() - 0.5) * 1.1, py = 1.05 + R() * 0.35;
        if (veg) B.put(I, G.sphereLo, M.vc, [C('#3f8f3a'), C('#e8572a'), C('#c4160e'), C('#f2c14e')][(R() * 4) | 0], px, py, pz, 0.17, 0.15, 0.17);
        else B.put(I, G.pot, M.gloss, new THREE.Color().setHSL(0.05, 0.55, 0.4), px, py - 0.12, pz, 0.7, 0.7, 0.7);
      }
      B.put(I, G.box, M.vc, C('#e3262f'), x, 1.9, 0, 1.9, 0.05, 1.6);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.put(I, G.cylLo, M.wood, P.woodDark, x + sx * 0.85, 1.4, sz * 0.7, 0.03, 1.0, 0.03);
    } else if (kind === 'cow') {
      const x = lanes[0] * LANE, c = P.cow, flip = R() < 0.5 ? 1 : -1;
      const o = mul(new THREE.Matrix4(), T4(x, 0, 0, 1, 1, 1, 0, Math.PI / 2 * flip + (R() - 0.5) * 0.4, 0));
      B.put(o, G.sphere, M.vc, c, 0, 0.95, 0, 0.42, 0.42, 0.85);
      B.put(o, G.sphere, M.vc, c, 0, 1.28, 0.4, 0.22, 0.25, 0.25); // hump
      B.put(o, G.sphere, M.vc, c, 0, 1.15, 0.95, 0.2, 0.24, 0.32);
      B.put(o, G.sphereLo, M.vc, C('#3a2a22'), 0, 1.08, 1.24, 0.1, 0.09, 0.06);
      for (const sx of [-1, 1]) {
        B.put(o, G.cone, M.vc, C('#d8c9a8'), sx * 0.13, 1.42, 0.92, 0.04, 0.26, 0.04, 0, 0, -sx * 0.5);
        B.put(o, G.sphereLo, M.vc, c, sx * 0.22, 1.2, 0.86, 0.1, 0.05, 0.08);
        for (const sz of [-1, 1]) B.put(o, G.cylLo, M.vc, c, sx * 0.22, 0.4, sz * 0.5, 0.07, 0.8, 0.07);
      }
      B.put(o, G.sphereLo, M.vc, P.marigold, 0, 0.98, 0.78, 0.25, 0.25, 0.08); // garland
      B.put(o, G.sphereLo, M.vc, P.red, 0, 1.25, 1.2, 0.05, 0.05, 0.02); // tika
    } else if (kind === 'lion') {
      W.lion(B, T4(lanes[0] * LANE, 0, 0, 1, 1, 1, 0, 0, 0), true);
    }
    B.build(g, true);
    return g;
  };
  // dimensions for collision: h = top height, bottom for 'high', ds = half depth along the road
  W.OB = {
    pots: { type: 'low', h: 0.85, ds: 0.4 },
    bamboo: { type: 'low', h: 0.85, ds: 0.2 },
    toran: { type: 'high', bottom: 1.15, ds: 0.2 },
    cart: { type: 'block', h: 2.0, ds: 0.85 },
    cow: { type: 'block', h: 1.3, ds: 0.95 },
    lion: { type: 'block', h: 2.4, ds: 0.75 },
  };

  // ---------- pickups ----------
  W.item = function (kind) {
    const g = new THREE.Group(), B = new Batcher(), P = W.P, M = W.M, G = W.G, I = new THREE.Matrix4();
    if (kind === 'dhime') { // drum on its side
      B.put(I, G.cyl, M.gloss, C('#b3160f'), 0, 0, 0, 0.36, 0.55, 0.36, 0, 0, Math.PI / 2);
      for (const sx of [-1, 1]) {
        B.put(I, G.cyl, M.vc, C('#efe3c8'), sx * 0.28, 0, 0, 0.33, 0.02, 0.33, 0, 0, Math.PI / 2);
        B.put(I, G.torus, M.metal, P.gold, sx * 0.26, 0, 0, 0.36, 0.36, 0.36, 0, Math.PI / 2, 0);
      }
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; B.put(I, G.box, M.vc, P.black, 0, Math.cos(a) * 0.37, Math.sin(a) * 0.37, 0.5, 0.015, 0.015, a + Math.PI / 2, 0, 0); }
    } else if (kind === 'bhusya') { // pair of brass cymbals
      for (const sx of [-1, 1]) {
        B.put(I, G.cyl, M.metal, P.gold, sx * 0.12, 0, 0, 0.42, 0.04, 0.42, 0, 0, Math.PI / 2 + sx * 0.25);
        B.put(I, G.sphere, M.metal, P.gold, sx * 0.15, 0, 0, 0.1, 0.12, 0.12);
      }
      B.put(I, G.box, M.vc, P.red, 0, 0.3, 0, 0.3, 0.04, 0.04);
    } else if (kind === 'chamar') { // yak-tail whisk
      B.put(I, G.cyl, M.metal, P.gold, 0, -0.35, 0, 0.05, 0.5, 0.05);
      B.put(I, G.sphere, M.metal, P.gold, 0, -0.08, 0, 0.09, 0.09, 0.09);
      B.put(I, G.cone, M.vc, C('#fbf7ef'), 0, 0.3, 0, 0.28, 0.75, 0.28, Math.PI, 0, 0);
    } else if (kind === 'yomari') { // steamed rice-flour dumpling with a pointed tail
      B.put(I, G.sphere, M.gloss, C('#f6efe0'), 0, 0, 0, 0.3, 0.26, 0.26);
      B.put(I, G.cone, M.gloss, C('#f6efe0'), 0.4, 0.06, 0, 0.16, 0.5, 0.16, 0, 0, -Math.PI / 2 + 0.25);
      B.put(I, G.sphereLo, M.vc, C('#6b3a16'), -0.22, 0.08, 0, 0.07, 0.07, 0.12);
    }
    B.build(g, true);
    const key = kind === 'yomari' ? 'spY' : 'spP';
    if (!W.M[key]) W.M[key] = new THREE.SpriteMaterial({ map: W.M.glowSprite, color: kind === 'yomari' ? '#fff3c4' : '#ffc860', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sp = new THREE.Sprite(W.M[key]);
    sp.scale.set(1.8, 1.8, 1); g.add(sp);
    return g;
  };
})();
