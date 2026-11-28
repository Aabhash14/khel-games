// Phewa Glide: the paraglider. A canopy built cell by cell (it flexes, its brake side drops, it
// inflates on launch and collapses on landing), lines that follow the swinging pilot, and a pilot
// with jointed arms and legs who runs, sits, dangles, pulls brakes and stands up to land.
(function () {
  const PG = window.PG;
  THREE.ColorManagement.legacyMode = false;
  const V3 = THREE.Vector3;

  // ---------- wing art, painted on a canvas ----------
  const WINGS = [
    { key: 'wRed', jacket: '#1d2f55', helmet: '#f4f1ea', sw: ['#d7263d', '#fff3e6'] },
    { key: 'wSky', jacket: '#c2312a', helmet: '#2b7bd6', sw: ['#f4f7fb', '#2b7bd6'] },
    { key: 'wDhaka', jacket: '#2b2620', helmet: '#c0262d', sw: ['#b52a2a', '#f08a24'] },
    { key: 'wGold', jacket: '#3a2a5c', helmet: '#ffcf4a', sw: ['#ff8a2a', '#c62d7a'] },
  ];
  PG.WINGS = WINGS;
  const texCache = {};
  PG.wingTexture = function (d) {
    if (texCache[d]) return texCache[d];
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const Wd = 512, Hd = 256;
    if (d === 0) {
      g.fillStyle = '#d7263d'; g.fillRect(0, 0, Wd, Hd);
      const gr = g.createLinearGradient(0, 0, Wd, 0);
      gr.addColorStop(0, 'rgba(110,8,30,.85)'); gr.addColorStop(0.18, 'rgba(110,8,30,0)'); gr.addColorStop(0.82, 'rgba(110,8,30,0)'); gr.addColorStop(1, 'rgba(110,8,30,.85)');
      g.fillStyle = gr; g.fillRect(0, 0, Wd, Hd);
      g.fillStyle = '#fff3e6';
      g.beginPath(); g.moveTo(0, Hd * 0.62); g.lineTo(Wd / 2, Hd * 0.18); g.lineTo(Wd, Hd * 0.62); g.lineTo(Wd, Hd * 0.82); g.lineTo(Wd / 2, Hd * 0.4); g.lineTo(0, Hd * 0.82); g.fill();
      g.fillStyle = '#ffc23d';
      g.beginPath(); g.moveTo(0, Hd * 0.86); g.lineTo(Wd / 2, Hd * 0.46); g.lineTo(Wd, Hd * 0.86); g.lineTo(Wd, Hd * 0.9); g.lineTo(Wd / 2, Hd * 0.52); g.lineTo(0, Hd * 0.9); g.fill();
    } else if (d === 1) {
      g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, Wd, Hd);
      g.fillStyle = '#2b7bd6';
      g.beginPath(); g.moveTo(0, Hd);
      const pk = [0, .6, .1, .35, .2, .55, .3, .2, .42, .45, .5, .08, .58, .45, .7, .2, .8, .55, .9, .35, 1, .6];
      for (let i = 0; i < pk.length; i += 2) g.lineTo(pk[i] * Wd, Hd * (0.25 + pk[i + 1] * 0.5));
      g.lineTo(Wd, Hd); g.fill();
      g.fillStyle = '#123a75'; g.fillRect(0, 0, Wd * 0.07, Hd); g.fillRect(Wd * 0.93, 0, Wd * 0.07, Hd);
    } else if (d === 2) {
      // dhaka weave: rows of lozenges in the colours of a Palpali dhaka topi
      g.fillStyle = '#9e2227'; g.fillRect(0, 0, Wd, Hd);
      const cols = ['#1b1b1b', '#f08a24', '#f6efe0', '#2e8b57', '#c0262d', '#f6c343'];
      const s = 32;
      for (let y = 0; y < Hd / s + 1; y++) for (let x = 0; x < Wd / s + 1; x++) {
        const cx = x * s + (y % 2) * s / 2, cy = y * s;
        g.fillStyle = cols[(x * 2 + y * 3) % cols.length];
        g.beginPath(); g.moveTo(cx, cy - s * 0.42); g.lineTo(cx + s * 0.42, cy); g.lineTo(cx, cy + s * 0.42); g.lineTo(cx - s * 0.42, cy); g.fill();
        g.fillStyle = cols[(x + y * 2 + 3) % cols.length];
        g.beginPath(); g.moveTo(cx, cy - s * 0.18); g.lineTo(cx + s * 0.18, cy); g.lineTo(cx, cy + s * 0.18); g.lineTo(cx - s * 0.18, cy); g.fill();
      }
      g.fillStyle = '#1b1b1b'; g.fillRect(0, 0, Wd * 0.05, Hd); g.fillRect(Wd * 0.95, 0, Wd * 0.05, Hd);
    } else {
      const gr = g.createLinearGradient(0, 0, Wd, 0);
      gr.addColorStop(0, '#c62d7a'); gr.addColorStop(0.3, '#ff6a2a'); gr.addColorStop(0.5, '#ffb43a'); gr.addColorStop(0.7, '#ff6a2a'); gr.addColorStop(1, '#c62d7a');
      g.fillStyle = gr; g.fillRect(0, 0, Wd, Hd);
      g.fillStyle = '#fff0b8'; g.fillRect(0, Hd * 0.34, Wd, Hd * 0.05);
      g.fillStyle = 'rgba(70,10,50,.35)'; g.fillRect(0, Hd * 0.42, Wd, Hd * 0.02);
    }
    // cell ribs, leading edge and trailing edge
    const cells = 36;
    g.fillStyle = 'rgba(0,0,0,.16)';
    for (let i = 0; i <= cells; i++) g.fillRect(i * Wd / cells - 1, 0, 2, Hd);
    const le = g.createLinearGradient(0, 0, 0, Hd * 0.12);
    le.addColorStop(0, 'rgba(0,0,0,.35)'); le.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = le; g.fillRect(0, 0, Wd, Hd * 0.12);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, Hd - 5, Wd, 5);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    texCache[d] = t;
    return t;
  };

  // ---------- canopy geometry ----------
  // span stations NS (s from -1 to 1), chord stations NC (t from 0 = leading edge to 1 = trailing edge).
  // Wing-local: forward is -z, up is +y, the pilot's carabiners are at the origin.
  const SPAN_A = 1.08, R = 5.4, TOPY = 7.6, C0 = 2.75;
  function wingPoint(s, t, top, out) {
    const a = s * SPAN_A;
    const chord = C0 * Math.sqrt(Math.max(0.05, 1 - 0.78 * s * s));
    const sweep = 0.75 * s * s;
    const z = -chord * 0.32 + sweep + t * chord;
    const th = 0.15 * chord * 2.2 * Math.sqrt(t) * (1 - t);
    const off = top ? th : -th * 0.22;
    const rr = R + off;
    out.set(Math.sin(a) * rr, TOPY - R + Math.cos(a) * rr - (t - 0.25) * chord * 0.08 - 0.35 * s * s, z);
    return out;
  }
  PG.wingPoint = wingPoint;
  function wingGeometry(NS, NC) {
    const verts = [], uvs = [], cols = [], idx = [], sArr = [], tArr = [];
    const p = new V3();
    for (let surf = 0; surf < 2; surf++) {
      const base = verts.length / 3;
      for (let i = 0; i <= NS; i++) {
        const s = (i / NS) * 2 - 1;
        for (let j = 0; j <= NC; j++) {
          const t = j / NC;
          const tt = surf ? t : t * t * (3 - 2 * t) * 0.5 + t * 0.5;
          wingPoint(s, tt, surf === 0, p);
          verts.push(p.x, p.y, p.z);
          uvs.push(i / NS, 1 - tt);
          const dark = surf ? (tt < 0.08 ? 0.35 : 0.72) : 1;
          cols.push(dark, dark, dark);
          sArr.push(s); tArr.push(tt);
        }
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) {
        const a = base + i * (NC + 1) + j, b = a + NC + 1;
        if (surf === 0) idx.push(a, a + 1, b, b, a + 1, b + 1);
        else idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    g.userData = { base: new Float32Array(verts), s: new Float32Array(sArr), t: new Float32Array(tArr) };
    return g;
  }
  PG.wingGeometry = wingGeometry;

  const mats = {};
  function lam(hex) {
    if (!mats[hex]) mats[hex] = new THREE.MeshLambertMaterial({ color: hex });
    return mats[hex];
  }
  PG.lam = lam;
  function wingMaterial(d) {
    return new THREE.MeshLambertMaterial({ map: PG.wingTexture(d), vertexColors: true, side: THREE.DoubleSide });
  }

  // line attachment points (s, t) on the underside
  const ATT = [];
  for (let k = 0; k <= 8; k++) {
    const s = -1 + k * 0.25;
    if (Math.abs(s) > 0.99) continue;
    [0.08, 0.32, 0.6].forEach((t) => ATT.push([s, t]));
  }
  [-1, -0.82, -0.6, 0.6, 0.82, 1].forEach((s) => ATT.push([s * 0.97, 0.98, 'brake']));

  // ---------- pilot body ----------
  function part(geo, mat, x, y, z, parent) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function buildPilot(d, simple) {
    const w = WINGS[d];
    const jacket = lam(w.jacket), pants = lam('#2a2d33'), skin = lam('#a8714b'), boot = lam('#3b2a1e');
    const harness = lam('#1e1f24'), helmet = lam(w.helmet), visor = lam('#1a1a20'), strap = lam('#ffb020');
    const body = new THREE.Group();
    const P = { body };
    const torso = part(new THREE.CapsuleGeometry(0.21, 0.42, 4, 10), jacket, 0, -0.12, 0, body);
    torso.scale.set(1, 1, 0.78);
    part(new THREE.BoxGeometry(0.46, 0.62, 0.3), harness, 0, -0.18, 0.12, body);           // back protector
    part(new THREE.BoxGeometry(0.5, 0.12, 0.5), harness, 0, -0.52, -0.08, body);           // seat
    part(new THREE.BoxGeometry(0.3, 0.16, 0.2), strap, 0, -0.18, -0.2, body);              // reserve on the chest
    const head = new THREE.Group(); head.position.set(0, 0.34, 0); body.add(head);
    part(new THREE.SphereGeometry(0.13, 12, 10), skin, 0, 0, -0.01, head);
    const hm = part(new THREE.SphereGeometry(0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), helmet, 0, 0.02, 0.01, head);
    hm.scale.set(1, 1.02, 1.08);
    if (!simple) part(new THREE.BoxGeometry(0.2, 0.06, 0.04), visor, 0, 0.0, -0.13, head);
    P.head = head;
    function arm(side) {
      const sh = new THREE.Group(); sh.position.set(side * 0.25, 0.14, 0); body.add(sh);
      part(new THREE.CapsuleGeometry(0.06, 0.22, 3, 6), jacket, 0, -0.15, 0, sh);
      const el = new THREE.Group(); el.position.set(0, -0.3, 0); sh.add(el);
      part(new THREE.CapsuleGeometry(0.05, 0.2, 3, 6), jacket, 0, -0.13, 0, el);
      const hand = new THREE.Group(); hand.position.set(0, -0.3, 0); el.add(hand);
      part(new THREE.SphereGeometry(0.055, 8, 6), lam('#222'), 0, 0, 0, hand);
      return { sh, el, hand };
    }
    function leg(side) {
      const hip = new THREE.Group(); hip.position.set(side * 0.11, -0.5, 0); body.add(hip);
      part(new THREE.CapsuleGeometry(0.085, 0.32, 3, 6), pants, 0, -0.21, 0, hip);
      const kn = new THREE.Group(); kn.position.set(0, -0.44, 0); hip.add(kn);
      part(new THREE.CapsuleGeometry(0.07, 0.32, 3, 6), pants, 0, -0.2, 0, kn);
      part(new THREE.BoxGeometry(0.12, 0.1, 0.24), boot, 0, -0.42, -0.05, kn);
      return { hip, kn };
    }
    P.armL = arm(-1); P.armR = arm(1);
    P.legL = leg(-1); P.legR = leg(1);
    body.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    return P;
  }

  // ---------- the glider ----------
  class Glider {
    constructor(design, hero) {
      this.hero = hero;
      this.design = design;
      this.root = new THREE.Group();
      this.wingPivot = new THREE.Group();
      this.root.add(this.wingPivot);
      this.geo = wingGeometry(hero ? 36 : 18, hero ? 9 : 5);
      this.wing = new THREE.Mesh(this.geo, wingMaterial(design));
      this.wingPivot.add(this.wing);
      this.pilotPivot = new THREE.Group();
      this.root.add(this.pilotPivot);
      this.P = buildPilot(design, !hero);
      this.pilotPivot.add(this.P.body);
      // lines (root space, rebuilt every frame for the hero)
      const n = ATT.length;
      this.lineGeo = new THREE.BufferGeometry();
      this.linePos = new Float32Array(n * 6);
      this.lineGeo.setAttribute('position', new THREE.BufferAttribute(this.linePos, 3));
      this.lines = new THREE.LineSegments(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xe9e2d4, transparent: true, opacity: hero ? 0.75 : 0.45 }));
      this.lines.frustumCulled = false;
      this.root.add(this.lines);
      this.attIdx = ATT.map(([s, t]) => this.nearestVertex(s, t));
      // pose state
      this.t = 0;
      this.inflate = 1;      // 0 = laid on the ground behind, 1 = flying overhead
      this.deflate = 0;      // 0 = full, 1 = collapsed
      this.brakeL = 0; this.brakeR = 0; this.bar = 0;
      this.bank = 0; this.swing = 0; this.pitch = 0;
      this.mode = 'fly';     // fly | run | stand | ground | legs
      this.slope = 0;        // ground rise per metre behind the pilot, for laying the wing out on a hill
      this.runPhase = 0;
      this.setWing(design);
      this.tmp = new V3(); this.tmp2 = new V3(); this.m4 = new THREE.Matrix4();
    }
    setWing(d) {
      this.design = d;
      this.wing.material.map = PG.wingTexture(d);
      this.wing.material.needsUpdate = true;
      const w = WINGS[d];
      this.P.body.traverse((o) => {
        if (!o.isMesh) return;
        if (o.material.userData.role === 'jacket' || WINGS.some((x) => o.material === mats[x.jacket])) o.material = lam(w.jacket);
        else if (WINGS.some((x) => o.material === mats[x.helmet])) o.material = lam(w.helmet);
      });
    }
    nearestVertex(s, t) {
      const ud = this.geo.userData; let best = 0, bd = 1e9;
      const half = ud.s.length / 2;
      for (let i = half; i < ud.s.length; i++) {
        const d = (ud.s[i] - s) ** 2 + (ud.t[i] - t) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    // canopy flex: a slow breathing wobble, the braked side's trailing edge pulled down,
    // inflation from a crumpled heap and deflation after landing
    flex() {
      const pos = this.geo.attributes.position.array, ud = this.geo.userData, b = ud.base;
      const t = this.t, k1 = this.inflate * (1 - this.deflate);
      // while rising, the canopy swings up from behind on an arc around the carabiners
      const rise = (1 - k1) * 1.5, cr = Math.cos(rise), sr = Math.sin(rise);
      const lay = Math.pow(1 - k1, 1.6);
      const n = ud.s.length;
      for (let i = 0; i < n; i++) {
        const s = ud.s[i], tt = ud.t[i], k = i * 3;
        let x = b[k], y = b[k + 1], z = b[k + 2];
        const wob = Math.sin(t * 2.3 + s * 3.1) * 0.05 + Math.sin(t * 5.7 + s * 7.0 + tt * 3) * 0.018;
        y += wob * (0.6 + Math.abs(s)) * k1;
        const br = s < 0 ? this.brakeL : this.brakeR;
        if (tt > 0.45) { const e = (tt - 0.45) / 0.55; y -= br * e * e * (0.55 + Math.abs(s) * 0.5); z -= br * e * e * 0.2; }
        if (k1 < 0.999) {
          const ry = y * cr - z * sr, rz = y * sr + z * cr;
          y = ry; z = rz;
          if (lay > 0.001) {
            // laid out on the grass behind the pilot in a crescent, with a few folds
            const a = s * SPAN_A, fold = Math.sin(s * 19 + tt * 5) * 0.12 + Math.sin(s * 7.3 + 1) * 0.08;
            const lx = Math.sin(a) * 6.0, lz = 2.2 + Math.cos(a) * 3.2 + tt * 2.4 * Math.sqrt(1 - 0.7 * s * s);
            const ly = -1.45 + 0.08 + Math.abs(fold) * (1 - tt * 0.5) + lz * this.slope;
            x += (lx - x) * lay; y += (ly - y) * lay; z += (lz - z) * lay;
          }
        }
        pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.computeVertexNormals();
    }
    pose(dt) {
      const P = this.P, t = this.t;
      const body = P.body;
      // arms: hands up at the brake handles, pulled down with brake
      const armPose = (A, brake, side) => {
        let up = 2.55 - brake * 1.75, bend = 0.35 + brake * 0.4, out = side * (0.28 - brake * 0.12);
        if (this.mode === 'run') { up = 1.9 + Math.sin(this.runPhase + (side > 0 ? 0 : Math.PI)) * 0.2; bend = 0.5; out = side * 0.5; }
        if (this.mode === 'stand') { up = 0.35 + (this.cheer ? Math.abs(Math.sin(t * 7)) * 2.4 : 0); bend = 0.3; out = side * (this.cheer ? 0.5 : 0.1); }
        A.sh.rotation.set(up, 0, out);
        A.el.rotation.set(bend, 0, 0);
      };
      armPose(P.armL, this.brakeL, -1); armPose(P.armR, this.brakeR, 1);
      const legPose = (L, side) => {
        if (this.mode === 'run') {
          const ph = this.runPhase + (side > 0 ? Math.PI : 0);
          L.hip.rotation.set(Math.sin(ph) * 0.9, 0, 0);
          L.kn.rotation.set(-Math.max(0, Math.sin(ph + 1.4)) * 1.3, 0, 0);
        } else if (this.mode === 'stand' || this.mode === 'ground' || this.mode === 'legs') {
          L.hip.rotation.set(0.05, 0, side * 0.04);
          L.kn.rotation.set(-0.05, 0, 0);
        } else {
          // seated: thighs forward, shins hanging and swinging; speed bar pushes them out
          const sw = Math.sin(t * 1.6 + side) * 0.12 + this.swing * 0.4;
          L.hip.rotation.set(1.35 - this.bar * 0.2, 0, side * 0.08);
          L.kn.rotation.set(-1.35 + this.bar * 1.1 + sw, 0, 0);
        }
      };
      legPose(P.legL, -1); legPose(P.legR, 1);
      const seated = this.mode === 'fly';
      body.rotation.x = seated ? 0.32 - this.bar * 0.15 : this.mode === 'run' ? -0.22 : this.mode === 'legs' ? 0.12 : 0;
      body.position.y = seated ? 0 : -0.15 + (this.mode === 'run' ? Math.abs(Math.sin(this.runPhase)) * 0.08 : 0) + (this.cheer ? Math.abs(Math.sin(t * 7)) * 0.25 : 0);
      P.head.rotation.y = -this.bank * 0.6;
      P.head.rotation.x = seated ? -0.25 : 0;
    }
    updateLines() {
      this.root.updateMatrixWorld(true);
      const pos = this.geo.attributes.position.array, lp = this.linePos;
      const inv = this.m4.copy(this.root.matrixWorld).invert();
      const cL = this.tmp, cR = this.tmp2;
      // carabiners on the pilot's shoulders, hands for brake lines
      cL.set(-0.2, 0.05, 0.02).applyMatrix4(this.P.body.matrixWorld).applyMatrix4(inv);
      cR.set(0.2, 0.05, 0.02).applyMatrix4(this.P.body.matrixWorld).applyMatrix4(inv);
      const hL = new V3(), hR = new V3();
      this.P.armL.hand.getWorldPosition(hL).applyMatrix4(inv);
      this.P.armR.hand.getWorldPosition(hR).applyMatrix4(inv);
      const wm = this.wingPivot.matrix;
      const p = new V3();
      for (let i = 0; i < ATT.length; i++) {
        const k = this.attIdx[i] * 3;
        p.set(pos[k], pos[k + 1], pos[k + 2]).applyMatrix4(wm);
        const brake = ATT[i][2] === 'brake';
        const left = ATT[i][0] < 0;
        const a = brake ? (left ? hL : hR) : (left ? cL : cR);
        lp.set([a.x, a.y, a.z, p.x, p.y, p.z], i * 6);
      }
      this.lineGeo.attributes.position.needsUpdate = true;
      this.lines.visible = this.deflate < 0.9;
    }
    update(dt) {
      this.t += dt;
      // wing: roll with bank, surge in pitch, lie on the ground before launch / after landing
      this.wingPivot.rotation.set(this.pitch, 0, -this.bank);
      // pilot swings under the wing, lagging the bank a little
      this.pilotPivot.rotation.set(this.pitch * 0.4, 0, -this.bank * 0.75 - this.swing * 0.12);
      this.pose(dt);
      this.wingPivot.updateMatrix();
      if (this.hero) { this.flex(); this.updateLines(); }
      else if (!this.linesBuilt) { this.flex(); this.buildStaticLines(); }
    }
    buildStaticLines() {
      // AI gliders: canopy shape and lines baked once into the wing's own space
      this.linesBuilt = true;
      this.root.remove(this.lines);
      this.wingPivot.add(this.lines);
      const b = this.geo.attributes.position.array, lp = this.linePos;
      for (let i = 0; i < ATT.length; i++) {
        const k = this.attIdx[i] * 3;
        const left = ATT[i][0] < 0;
        lp.set([left ? -0.2 : 0.2, 0.05, 0, b[k], b[k + 1], b[k + 2]], i * 6);
      }
      this.lineGeo.attributes.position.needsUpdate = true;
    }
  }
  PG.Glider = Glider;

  // a person for the crowd / takeoff, as plain meshes (used sparingly)
  PG.buildPilotBody = buildPilot;
})();
