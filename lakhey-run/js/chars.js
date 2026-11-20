// Lakhey Run: characters, built from primitives.
// Majipa Lakhey (the chaser): glossy red mask with flame brows, gold nose, fangs and green earrings; huge shaggy
// red mane; gold brocade top, marigold garland, red sash, belt of brass bells, red skirt with a gold hem,
// bare arms swinging two long tie-dyed scarves.
// The runner: a Newar boy in tapālan, waistcoat, patuka and Bhaktapur topi, or a Newar girl in haku patasi
// (black sari with a red border), red blouse, shawl, white patuka, hair in a bun with flowers.
// Static parts are merged per bone group, so each character draws in a handful of calls.
(function () {
  const LR = window.LR;
  const V3 = THREE.Vector3;
  const lerp = (a, b, k) => a + (b - a) * k;
  const C = (h) => new THREE.Color(h);

  // ---------- shared materials ----------
  let M = null;
  function mats() {
    if (M) return M;
    const T = LR.tex;
    const skirtT = T.skirt(); skirtT.repeat.set(3, 1);
    const hairT = T.hair();
    M = {
      cloth: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
      gloss: new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: '#555555' }),
      metal: new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 90, specular: '#ffe2a0' }),
      mask: new THREE.MeshPhongMaterial({ map: T.mask(), shininess: 70, specular: '#ffd0c0' }),
      brocade: new THREE.MeshPhongMaterial({ map: T.brocade(), shininess: 60, specular: '#ffd88a', color: '#ffe9b0' }),
      skirt: new THREE.MeshLambertMaterial({ map: skirtT, side: THREE.DoubleSide }),
      hair: new THREE.MeshLambertMaterial({ map: hairT, color: '#c41a10' }),
      locks: new THREE.MeshLambertMaterial({ map: hairT }),
      patasi: new THREE.MeshLambertMaterial({ map: T.patasi(), side: THREE.DoubleSide }),
      shawl: new THREE.MeshLambertMaterial({ map: T.shawl() }),
      scarf: [0, 1].map((i) => new THREE.MeshLambertMaterial({ map: T.tieDye(4 + i * 9), side: THREE.DoubleSide })),
    };
    return M;
  }

  // Kit: collects parts per bone group, then merges them into one mesh per material per group.
  function Kit() {
    const map = new Map(), I = new THREE.Matrix4();
    return {
      add(group, geo, mat, color, x, y, z, sx, sy, sz, rx, ry, rz) {
        let b = map.get(group); if (!b) map.set(group, (b = new LR.W.Batcher()));
        b.put(I, geo, mat, color, x, y, z, sx, sy, sz, rx, ry, rz);
      },
      flush() { for (const [g, b] of map) b.build(g, false); map.clear(); },
    };
  }
  // unit geometries
  let U = null;
  function geos() {
    if (U) return U;
    U = {
      sph: new THREE.SphereGeometry(1, 14, 10), sphLo: new THREE.SphereGeometry(1, 8, 6),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 14), box: new THREE.BoxGeometry(1, 1, 1),
      cone: new THREE.ConeGeometry(1, 1, 10), torus: new THREE.TorusGeometry(1, 0.28, 6, 16),
    };
    return U;
  }
  const taper = (rt, rb, h, seg, open, ts, tl) => new THREE.CylinderGeometry(rt, rb, h, seg || 16, 1, !!open, ts || 0, tl || Math.PI * 2);

  // ---------- pose helpers ----------
  function makeRig() {
    return { by: 0.9, bx: 0, bz: 0, bry: 0, hip: [0, 0], knee: [0, 0], shz: [0.2, 0.2], shx: [0, 0], el: [0, 0], head: 0, headX: 0 };
  }
  function blendRig(cur, tg, k) {
    for (const key of ['by', 'bx', 'bz', 'bry', 'head', 'headX']) cur[key] = lerp(cur[key], tg[key], k);
    for (const key of ['hip', 'knee', 'shz', 'shx', 'el']) for (let i = 0; i < 2; i++) cur[key][i] = lerp(cur[key][i], tg[key][i], k);
  }
  function applyRig(cur, R) {
    R.body.position.y = cur.by; R.body.rotation.set(cur.bx, cur.bry, cur.bz);
    for (let i = 0; i < 2; i++) {
      R.legs[i].hip.rotation.x = cur.hip[i]; R.legs[i].knee.rotation.x = cur.knee[i];
      const a = R.arms[i]; a.sh.rotation.set(cur.shx[i], 0, a.sx * cur.shz[i]); a.el.rotation.x = cur.el[i];
    }
    R.head.rotation.set(cur.headX, cur.head, 0);
  }
  function blobShadow(size) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(20,8,4,0.55)'); gr.addColorStop(0.6, 'rgba(20,8,4,0.25)'); gr.addColorStop(1, 'rgba(20,8,4,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.renderOrder = 1;
    return m;
  }
  LR.blobShadow = blobShadow;

  // ===================================================================================
  // Majipa Lakhey
  // ===================================================================================
  LR.makeLakhey = function () {
    const M = mats(), U = geos(), K = Kit();
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const RED = C('#b5160f'), SKIN = C('#86513a'), GOLD = C('#e7b54a'), BRASS = C('#c99632');
    const W1 = C('#ffffff');

    // legs
    const legs = [];
    for (const sx of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(sx * 0.13, 0, 0); body.add(hip);
      K.add(hip, taper(0.09, 0.075, 0.46, 10), M.cloth, RED, 0, -0.23, 0);
      const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
      K.add(knee, taper(0.07, 0.058, 0.44, 10), M.cloth, RED, 0, -0.22, 0);
      K.add(knee, U.torus, M.metal, GOLD, 0, -0.4, 0, 0.065, 0.065, 0.065, Math.PI / 2);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; K.add(knee, U.sphLo, M.metal, GOLD, Math.cos(a) * 0.075, -0.43, Math.sin(a) * 0.075, 0.025, 0.025, 0.025); }
      K.add(knee, U.box, M.cloth, SKIN, 0, -0.47, 0.05, 0.11, 0.06, 0.24);
      legs.push({ hip, knee });
    }
    // skirt, sash, bells
    const skirtG = new THREE.Group(); body.add(skirtG);
    K.add(skirtG, taper(0.3, 0.52, 0.52, 28, true), M.skirt, W1, 0, -0.13, 0);
    K.add(skirtG, taper(0.31, 0.4, 0.26, 28, true), M.skirt, W1, 0, 0.0, 0);
    K.add(body, taper(0.315, 0.32, 0.12, 20), M.cloth, RED, 0, 0.15, 0, 1, 1, 0.8);
    K.add(body, U.torus, M.metal, BRASS, 0, 0.09, 0, 0.33, 0.33 * 0.8, 0.11, Math.PI / 2);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; K.add(body, U.sphLo, M.metal, BRASS, Math.cos(a) * 0.35, 0.03, Math.sin(a) * 0.35 * 0.8, 0.052, 0.052, 0.052); }
    // torso and garland
    K.add(body, taper(0.34, 0.29, 0.58, 24), M.brocade, W1, 0, 0.46, 0, 1, 1, 0.74);
    for (const sx of [-1, 1]) K.add(body, U.sph, M.brocade, W1, sx * 0.3, 0.7, 0, 0.13, 0.104, 0.117);
    const MARI = [C('#ff8a00'), C('#ffb000')];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, sy = Math.pow(Math.sin(Math.PI * t), 0.85);
      K.add(body, U.sphLo, M.cloth, MARI[i % 2], -0.22 + 0.44 * t, 0.72 - 0.52 * sy, 0.2 + 0.07 * sy, 0.038, 0.038, 0.038);
    }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; K.add(body, U.sphLo, M.cloth, C('#d94b98'), Math.cos(a) * 0.05, 0.19 + Math.sin(a) * 0.05, 0.29, 0.036, 0.036, 0.036); }
    K.add(body, U.sphLo, M.cloth, MARI[1], 0, 0.19, 0.31, 0.036, 0.036, 0.036);
    // arms
    const arms = [];
    for (const sx of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(sx * 0.36, 0.68, 0); body.add(sh);
      K.add(sh, taper(0.068, 0.058, 0.33, 10), M.cloth, SKIN, 0, -0.165, 0);
      const el = new THREE.Group(); el.position.y = -0.33; sh.add(el);
      K.add(el, taper(0.056, 0.046, 0.3, 10), M.cloth, SKIN, 0, -0.15, 0);
      K.add(el, U.torus, M.metal, GOLD, 0, -0.26, 0, 0.052, 0.052, 0.052, Math.PI / 2);
      K.add(el, U.sph, M.cloth, SKIN, 0, -0.33, 0, 0.062, 0.062, 0.062);
      const hand = new THREE.Object3D(); hand.position.y = -0.33; el.add(hand);
      arms.push({ sh, el, hand, sx });
    }
    // head: mask + mane
    const head = new THREE.Group(); head.position.set(0, 1.08, 0.05); head.scale.setScalar(1.3); body.add(head);
    const shell = new THREE.SphereGeometry(1, 40, 32, Math.PI / 2 - 1.25, 2.5, 0.22, 2.6);
    { const p = shell.attributes.position, uv = shell.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (1.9 * 1.1), 0.5 + (p.getY(i) + 0.015) / (1.92 * 1.1)); }
    const mask = new THREE.Mesh(shell, M.mask); mask.position.z = 0.04; mask.scale.set(0.32, 0.38, 0.22); head.add(mask);
    K.add(head, U.sph, M.cloth, C('#7a0b07'), 0, 0, -0.02, 0.29, 0.36, 0.18);
    K.add(head, U.sph, M.metal, C('#f2be3a'), 0, -0.02, 0.265, 0.055, 0.045, 0.04);
    for (const sx of [-1, 1]) {
      K.add(head, U.cone, M.gloss, C('#fffaf0'), sx * 0.075, -0.15, 0.235, 0.022, 0.12, 0.022, 0.35, 0, Math.PI + sx * 0.28);
      K.add(head, U.torus, M.metal, GOLD, sx * 0.2, -0.09, 0.19, 0.04, 0.04, 0.04, 0, sx * 0.9, 0);
      K.add(head, U.sphLo, M.gloss, C('#2f9e4a'), sx * 0.2, -0.09, 0.19, 0.03, 0.03, 0.03);
    }
    const hairG = new THREE.Group(); head.add(hairG);
    const hairBall = new THREE.Mesh(U.sph, M.hair); hairBall.position.set(0, 0.1, -0.36); hairBall.scale.set(0.7, 0.61, 0.45); hairG.add(hairBall);
    // locks: tapered teardrops, fat at the root
    const lockGeo = new THREE.SphereGeometry(1, 7, 5);
    {
      lockGeo.translate(0, -1, 0);
      const lp = lockGeo.attributes.position;
      for (let i = 0; i < lp.count; i++) { const t = -lp.getY(i) / 2, k = 1 - 0.78 * Math.pow(Math.max(0, t - 0.25) / 0.75, 1.3); lp.setX(i, lp.getX(i) * k); lp.setZ(i, lp.getZ(i) * k); }
      lockGeo.scale(1, 0.5, 1); lockGeo.computeVertexNormals();
    }
    const N = 300, locks = new THREE.InstancedMesh(lockGeo, M.locks, N);
    const R = LR.rng(77), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), dn = new V3(0, -1, 0), col = new THREE.Color();
    const hairCols = ['#d01a10', '#e8301a', '#a50f0a', '#ff4122', '#bf140d', '#f0441f'];
    let n = 0;
    while (n < N) {
      let pos, dir, len, rad;
      if (n < 225) {
        dir = new V3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (dir.lengthSq() > 1 || dir.lengthSq() < 0.05) continue; dir.normalize();
        if (dir.z > -0.05 && dir.y < 0.62 && Math.abs(dir.x) < 0.7) continue; // keep the face clear
        pos = new V3(dir.x * 0.66, 0.1 + dir.y * 0.56, -0.36 + dir.z * 0.42);
        len = 0.32 + R() * 0.3 + (dir.y < 0.2 ? 0.25 : 0); rad = 0.12 + R() * 0.08;
        dir = new V3(dir.x * 0.9, Math.min(dir.y, 0.4) * 0.4 - 1, dir.z * 0.6 - 0.15).normalize();
      } else {
        const a = (R() - 0.5) * 3.6;
        pos = new V3(Math.sin(a) * 0.6, -0.1 + R() * 0.25, -0.36 - Math.cos(a) * 0.3);
        dir = new V3(Math.sin(a) * 0.3, -1, -0.15 - Math.cos(a) * 0.12).normalize();
        len = 0.7 + R() * 0.55; rad = 0.11 + R() * 0.06;
      }
      q.setFromUnitVectors(dn, dir); m4.compose(pos, q, new V3(rad, len, rad)); locks.setMatrixAt(n, m4);
      col.set(hairCols[(R() * hairCols.length) | 0]); locks.setColorAt(n, col); n++;
    }
    hairG.add(locks);
    K.flush();

    // scarves
    const scarves = arms.map((a, i) => {
      const geo = new THREE.PlaneGeometry(1, 1, 1, 12);
      const mesh = new THREE.Mesh(geo, M.scarf[i]); mesh.frustumCulled = false; root.add(mesh);
      return { mesh, geo, arm: a };
    });
    const shadow = blobShadow(1.6); root.add(shadow);

    const R_ = { body, legs, arms, head };
    const cur = makeRig(), tg = makeRig();
    const hp = new V3(), tmp = new V3(), D = new V3(), Wv = new V3(), Nv = new V3(), UP = new V3(0, 1, 0);
    let normalsTick = 0;
    function update(dt, time, st) {
      const ph = st.phase || 0, mode = st.mode;
      let sDir = 'run';
      if (mode === 'run') {
        const s = Math.sin(ph);
        tg.by = 0.95 + 0.07 * Math.abs(Math.cos(ph)); tg.bx = 0.22; tg.bz = s * 0.05; tg.bry = s * 0.12;
        tg.hip[0] = -s * 0.95; tg.hip[1] = s * 0.95;
        tg.knee[0] = 0.25 + 1.3 * Math.max(0, Math.sin(ph + 0.9)); tg.knee[1] = 0.25 + 1.3 * Math.max(0, -Math.sin(ph + 0.9));
        tg.shz[0] = 1.2 + 0.35 * s; tg.shz[1] = 1.2 - 0.35 * s; tg.shx[0] = -0.2; tg.shx[1] = -0.2; tg.el[0] = -0.6; tg.el[1] = -0.6;
        tg.head = Math.sin(ph * 0.5) * 0.15; tg.headX = 0.05;
      } else if (mode === 'dance') {
        const b = ph, up0 = Math.max(0, Math.sin(b)), up1 = Math.max(0, -Math.sin(b));
        tg.by = 0.95 + 0.06 * Math.abs(Math.sin(b)); tg.bx = 0.05; tg.bz = Math.sin(b * 0.5) * 0.12; tg.bry = Math.sin(b * 0.5) * 0.35;
        tg.hip[0] = -0.9 * up0; tg.hip[1] = -0.9 * up1; tg.knee[0] = 1.3 * up0; tg.knee[1] = 1.3 * up1;
        tg.shz[0] = 1.7 + 0.6 * Math.sin(b + 1); tg.shz[1] = 1.7 + 0.6 * Math.sin(b + 1 + Math.PI);
        tg.shx[0] = -0.55; tg.shx[1] = -0.55; tg.el[0] = -0.6; tg.el[1] = -0.6;
        tg.head = Math.sin(b * 0.5) * 0.3; tg.headX = Math.sin(b) * 0.08;
        sDir = 'dance';
      } else if (mode === 'grab') { // lunging, arms reaching forward
        tg.by = 0.88; tg.bx = 0.35; tg.bz = 0; tg.bry = 0;
        tg.hip[0] = -0.7; tg.hip[1] = 0.4; tg.knee[0] = 0.5; tg.knee[1] = 0.6;
        tg.shz[0] = 0.5; tg.shz[1] = 0.5; tg.shx[0] = -1.5 + Math.sin(time * 9) * 0.15; tg.shx[1] = -1.5 - Math.sin(time * 9) * 0.15; tg.el[0] = -0.2; tg.el[1] = -0.2;
        tg.head = 0; tg.headX = -0.25;
        sDir = 'grab';
      }
      blendRig(cur, tg, Math.min(1, dt * (mode === 'run' ? 18 : 10)));
      applyRig(cur, R_);
      hairG.rotation.x = Math.sin(time * 9 + 1) * 0.04 * (mode === 'run' ? 1 : 0.4);
      hairG.rotation.z = Math.sin(time * 4.5) * 0.04;
      skirtG.scale.set(1 + Math.sin(time * 9) * 0.03, 1, 1 + Math.cos(time * 9) * 0.03);
      if (!root.visible) return;
      root.updateMatrixWorld(true);
      const sp = st.speed || 0;
      normalsTick = (normalsTick + 1) % 3;
      for (let i = 0; i < 2; i++) {
        const sc = scarves[i], sx = sc.arm.sx;
        sc.arm.hand.getWorldPosition(hp); root.worldToLocal(hp);
        if (sDir === 'run') D.set(sx * 0.4, -0.45, -1);
        else if (sDir === 'grab') D.set(sx * 0.5, -0.8, -0.6);
        else D.set(sx * (0.5 + Math.sin(time * 3 + i) * 0.4), -1, 0.35 + Math.cos(time * 2.4 + i) * 0.3);
        D.normalize();
        Wv.crossVectors(UP, D); if (Wv.lengthSq() < 0.01) Wv.set(1, 0, 0); Wv.normalize();
        Nv.crossVectors(D, Wv).normalize();
        const p = sc.geo.attributes.position, rows = 13, len = 1.7;
        const fr = sDir === 'dance' ? 6 : 10 + sp * 0.5, amp = sDir === 'dance' ? 0.3 : 0.22;
        for (let r = 0; r < rows; r++) {
          const t = r / (rows - 1);
          const wave = Math.sin(time * fr - t * 7 + i * 2) * amp * t + Math.sin(time * fr * 1.7 - t * 11) * 0.05 * t;
          const twist = Math.sin(time * fr * 0.6 - t * 4 + i) * 0.7 * t;
          const sag = sDir === 'run' ? t * t * 0.35 : 0, width = 0.42 * (1 + t * 0.25);
          for (let s = 0; s < 2; s++) {
            const side = (s - 0.5) * width;
            tmp.copy(hp).addScaledVector(D, t * len).addScaledVector(Nv, wave).addScaledVector(Wv, side * Math.cos(twist)).addScaledVector(Nv, side * Math.sin(twist));
            tmp.y -= sag; if (tmp.y < 0.03) tmp.y = 0.03;
            p.setXYZ(r * 2 + s, tmp.x, tmp.y, tmp.z);
          }
        }
        p.needsUpdate = true;
        if (normalsTick === 0) sc.geo.computeVertexNormals();
      }
    }
    return { root, body, head, update, mask };
  };

  // ===================================================================================
  // Runner: Newar boy (tapālan) or girl (haku patasi)
  // ===================================================================================
  LR.makeRunner = function (who) {
    const M = mats(), U = geos(), K = Kit();
    const girl = who === 'f';
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const SKIN = C('#a8704a'), BLACK = C('#16110e'), CREAM = C('#f3eee2'), CREAM2 = C('#ddd5c4'), RED = C('#b3160f'), GOLD = C('#e7b54a');
    const W1 = C('#ffffff');
    // legs
    const legs = [];
    for (const sx of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(sx * 0.1, 0, 0); body.add(hip);
      K.add(hip, taper(0.085, 0.07, 0.44, 10), M.cloth, girl ? BLACK : CREAM, 0, -0.22, 0);
      const knee = new THREE.Group(); knee.position.y = -0.44; hip.add(knee);
      K.add(knee, taper(0.066, 0.052, 0.42, 10), M.cloth, girl ? SKIN : CREAM, 0, -0.21, 0);
      if (girl) K.add(knee, U.torus, M.metal, GOLD, 0, -0.39, 0, 0.058, 0.058, 0.058, Math.PI / 2); // anklet
      K.add(knee, U.box, M.cloth, girl ? C('#7a2a14') : BLACK, 0, -0.45, 0.04, 0.1, 0.07, 0.23);
      legs.push({ hip, knee });
    }
    const skirtG = new THREE.Group(); body.add(skirtG);
    if (girl) {
      // haku patasi: black sari wrapped to the ankles, red border at the hem
      K.add(skirtG, taper(0.21, 0.46, 0.82, 24, true), M.patasi, W1, 0, -0.33, 0);
      // white patuka (waist cloth) with a hanging end
      K.add(body, taper(0.215, 0.215, 0.15, 18), M.cloth, CREAM, 0, 0.07, 0, 1, 1, 0.85);
      K.add(body, U.box, M.cloth, CREAM2, 0.1, -0.08, 0.19, 0.09, 0.26, 0.02);
      // red blouse
      K.add(body, taper(0.2, 0.18, 0.46, 16), M.cloth, RED, 0, 0.36, 0, 1, 1, 0.72);
      // shawl draped across from the shoulder
      K.add(body, U.box, M.shawl, W1, 0.02, 0.38, 0.14, 0.15, 0.6, 0.03, 0, 0, -0.55);
      K.add(body, U.box, M.shawl, W1, 0.02, 0.38, -0.14, 0.15, 0.6, 0.03, 0, 0, 0.55);
      K.add(body, U.sph, M.shawl, W1, -0.18, 0.56, 0, 0.1, 0.07, 0.12);
    } else {
      // tapālan: long white robe over suruwal, black waistcoat, patuka
      K.add(skirtG, taper(0.215, 0.31, 0.4, 18, true), M.cloth, CREAM, 0, -0.13, 0);
      K.add(body, taper(0.21, 0.205, 0.15, 18), M.cloth, CREAM2, 0, 0.07, 0, 1, 1, 0.85);
      K.add(body, U.box, M.cloth, CREAM2, -0.12, -0.08, 0.18, 0.08, 0.24, 0.02);
      K.add(body, taper(0.21, 0.19, 0.48, 16), M.cloth, CREAM, 0, 0.36, 0, 1, 1, 0.72);
      K.add(body, taper(0.226, 0.206, 0.42, 16, true, 0.5, Math.PI * 2 - 1.0), M.cloth, C('#2a2622'), 0, 0.38, 0, 1, 1, 0.74);
      K.add(body, U.box, M.cloth, CREAM2, 0.04, 0.36, 0.152, 0.02, 0.4, 0.01, 0, 0, 0.35);
    }
    for (const sx of [-1, 1]) K.add(body, U.sph, M.cloth, girl ? RED : CREAM, sx * 0.2, 0.56, 0, 0.085, 0.075, 0.08);
    K.add(body, taper(0.05, 0.055, 0.12, 10), M.cloth, SKIN, 0, 0.64, 0);
    if (girl) { // gold necklace with a red pendant
      K.add(body, U.torus, M.metal, GOLD, 0, 0.6, 0.01, 0.085, 0.07, 0.085, Math.PI / 2 + 0.25);
      K.add(body, U.sphLo, M.gloss, RED, 0, 0.53, 0.09, 0.025, 0.03, 0.02);
    }
    // arms
    const arms = [];
    for (const sx of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(sx * 0.24, 0.55, 0); body.add(sh);
      K.add(sh, taper(0.055, 0.05, 0.3, 10), M.cloth, girl ? RED : CREAM, 0, -0.15, 0);
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      K.add(el, taper(0.047, 0.042, 0.26, 10), M.cloth, girl ? SKIN : CREAM, 0, -0.13, 0);
      if (girl) K.add(el, U.torus, M.metal, GOLD, 0, -0.24, 0, 0.048, 0.048, 0.048, Math.PI / 2);
      K.add(el, U.sph, M.cloth, SKIN, 0, -0.29, 0, 0.05, 0.055, 0.045);
      arms.push({ sh, el, sx });
    }
    // head
    const head = new THREE.Group(); head.position.set(0, 0.8, 0); body.add(head);
    K.add(head, U.sph, M.cloth, SKIN, 0, 0, 0, 0.125, 0.14, 0.13);
    for (const sx of [-1, 1]) {
      K.add(head, U.sphLo, M.cloth, SKIN, sx * 0.125, -0.01, -0.01, 0.022, 0.034, 0.02);
      K.add(head, U.sphLo, M.gloss, BLACK, sx * 0.045, 0.01, 0.115, 0.019, 0.022, 0.012);
      K.add(head, U.box, M.cloth, BLACK, sx * 0.046, 0.05, 0.118, 0.045, 0.01, 0.01, 0, 0, sx * -0.12);
    }
    K.add(head, U.sphLo, M.cloth, C('#96603e'), 0, -0.02, 0.128, 0.02, 0.022, 0.02);
    K.add(head, U.box, M.cloth, C('#7a2a24'), 0, -0.065, 0.118, 0.045, 0.01, 0.01);
    if (girl) {
      K.add(head, U.sph, M.cloth, BLACK, 0, 0.03, -0.03, 0.135, 0.14, 0.13);
      K.add(head, U.sph, M.cloth, BLACK, 0, 0.0, -0.16, 0.085, 0.08, 0.075); // bun
      const fl = [C('#ff8a00'), C('#e3262f'), C('#fff3d6'), C('#ffb000'), C('#e3262f')];
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; K.add(head, U.sphLo, M.cloth, fl[k], Math.cos(a) * 0.08, Math.sin(a) * 0.07 + 0.01, -0.18, 0.028, 0.028, 0.028); }
      for (const sx of [-1, 1]) K.add(head, U.torus, M.metal, GOLD, sx * 0.13, -0.06, 0.0, 0.03, 0.03, 0.03, 0, Math.PI / 2, 0);
      K.add(head, U.sphLo, M.gloss, RED, 0, 0.085, 0.124, 0.014, 0.016, 0.008); // tika
    } else {
      K.add(head, U.sph, M.cloth, BLACK, 0, 0.0, -0.035, 0.13, 0.13, 0.12);
      // black Bhaktapur topi, slightly tilted
      K.add(head, taper(0.118, 0.132, 0.14, 18), M.cloth, BLACK, 0, 0.12, -0.01, 1, 1, 1, -0.16, 0, 0.05);
      K.add(head, taper(0.133, 0.133, 0.02, 18), M.cloth, C('#2a2420'), 0, 0.065, 0.0, 1, 1, 1, -0.16, 0, 0.05);
    }
    K.flush();
    const shadow = blobShadow(1.1); root.add(shadow);

    const R_ = { body, legs, arms, head };
    const cur = makeRig(), tg = makeRig();
    const stride = girl ? 0.72 : 0.95;
    function update(dt, time, st) {
      const ph = st.phase || 0, mode = st.mode;
      if (mode === 'run') {
        const s = Math.sin(ph);
        tg.by = 0.9 + 0.06 * Math.abs(Math.cos(ph)); tg.bx = 0.16; tg.bz = s * 0.04; tg.bry = s * 0.12;
        tg.hip[0] = -s * stride; tg.hip[1] = s * stride;
        tg.knee[0] = 0.25 + 1.4 * Math.max(0, Math.sin(ph + 0.9)); tg.knee[1] = 0.25 + 1.4 * Math.max(0, -Math.sin(ph + 0.9));
        tg.shz[0] = 0.18; tg.shz[1] = 0.18; tg.shx[0] = s * 0.9; tg.shx[1] = -s * 0.9; tg.el[0] = -1.2; tg.el[1] = -1.2;
        tg.head = (st.glance || 0) * 1.35; tg.headX = 0.05;
        if (st.glance) tg.bry += st.glance * 0.35;
      } else if (mode === 'jump') {
        tg.by = 0.9; tg.bx = 0.1; tg.bz = 0; tg.bry = 0;
        tg.hip[0] = -1.2; tg.hip[1] = -0.3; tg.knee[0] = 1.8; tg.knee[1] = 1.0;
        tg.shz[0] = 1.9; tg.shz[1] = 1.9; tg.shx[0] = -0.3; tg.shx[1] = -0.3; tg.el[0] = -0.4; tg.el[1] = -0.4; tg.head = 0; tg.headX = -0.15;
      } else if (mode === 'slide') {
        tg.by = 0.36; tg.bx = -1.2; tg.bz = 0; tg.bry = 0;
        tg.hip[0] = -0.15; tg.hip[1] = 0.1; tg.knee[0] = 0.5; tg.knee[1] = 0.25;
        tg.shz[0] = 1.2; tg.shz[1] = 1.2; tg.shx[0] = 0.4; tg.shx[1] = 0.4; tg.el[0] = -0.2; tg.el[1] = -0.2; tg.head = 0; tg.headX = 0.7;
      } else if (mode === 'idle') { // teasing the Lakhey behind: bounce, wave, look back
        const b = ph;
        tg.by = 0.9 + 0.04 * Math.abs(Math.sin(b)); tg.bx = -0.05; tg.bz = Math.sin(b * 0.5) * 0.06; tg.bry = Math.sin(b * 0.25) * 0.4;
        tg.hip[0] = -0.25 * Math.max(0, Math.sin(b)); tg.hip[1] = -0.25 * Math.max(0, -Math.sin(b)); tg.knee[0] = 0.5 * Math.max(0, Math.sin(b)); tg.knee[1] = 0.5 * Math.max(0, -Math.sin(b));
        tg.shz[0] = 0.5; tg.shx[0] = 0; tg.el[0] = -1.9; // hand on hip
        tg.shz[1] = 2.7 + Math.sin(time * 9) * 0.25; tg.shx[1] = 0; tg.el[1] = -0.3; // waving
        tg.head = Math.sin(b * 0.25) * 0.5; tg.headX = -0.05;
      } else if (mode === 'fall') {
        tg.by = 0.28; tg.bx = -1.45; tg.bz = 0.1; tg.bry = 0;
        tg.hip[0] = -0.6; tg.hip[1] = -0.2; tg.knee[0] = 0.4; tg.knee[1] = 0.8;
        tg.shz[0] = 1.9; tg.shz[1] = 1.4; tg.shx[0] = 0; tg.shx[1] = 0; tg.el[0] = 0; tg.el[1] = 0; tg.head = 0.3; tg.headX = 0.4;
      } else if (mode === 'caught') { // grabbed: arms up, struggling
        tg.by = 0.9 + Math.abs(Math.sin(time * 10)) * 0.04; tg.bx = 0.1; tg.bz = Math.sin(time * 12) * 0.1; tg.bry = 0;
        tg.hip[0] = Math.sin(time * 14) * 0.5; tg.hip[1] = -Math.sin(time * 14) * 0.5; tg.knee[0] = 0.6; tg.knee[1] = 0.6;
        tg.shz[0] = 2.6; tg.shz[1] = 2.6; tg.shx[0] = 0; tg.shx[1] = 0; tg.el[0] = -0.3; tg.el[1] = -0.3; tg.head = Math.sin(time * 6) * 0.3; tg.headX = -0.3;
      }
      blendRig(cur, tg, Math.min(1, dt * (mode === 'run' ? 18 : 10)));
      applyRig(cur, R_);
      if (girl) skirtG.rotation.x = mode === 'run' ? -0.08 + Math.sin(ph * 2) * 0.04 : mode === 'slide' ? 0.6 : 0;
      else skirtG.rotation.x = mode === 'run' ? -0.12 : 0;
    }
    return { root, body, head, update };
  };
})();
