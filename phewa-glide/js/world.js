// Phewa Glide: the valley. Terrain (Sarangkot ridge, the Peace Pagoda hill, rice terraces), Phewa Lake
// with real reflections, the Annapurna range and Machhapuchhre, sky, Lakeside town, forests,
// Tal Barahi and the stupa, prayer flags, rowing boats, a crowd, circling vultures and cumulus.
(function () {
  const PG = window.PG;
  THREE.ColorManagement.legacyMode = false;
  const W = (PG.W = {});

  // ---------- maths ----------
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  function hash(ix, iz, s) {
    let h = (Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263) + Math.imul((s | 0) + 1, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, z, s) {
    const ix = Math.floor(x), iz = Math.floor(z);
    let fx = x - ix, fz = z - iz; fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz, s), b = hash(ix + 1, iz, s), c = hash(ix, iz + 1, s), d = hash(ix + 1, iz + 1, s);
    return (a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz) * 2 - 1;
  }
  function fbm(x, z, o, s) {
    let v = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < o; i++) { v += a * vnoise(x * f, z * f, (s | 0) + i * 17); n += a; f *= 2.03; a *= 0.5; }
    return v / n;
  }
  function ridged(x, z, s) {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < 4; i++) { const n = 1 - Math.abs(vnoise(x * f, z * f, (s | 0) + 50 + i * 13)); v += a * n * n; f *= 2.1; a *= 0.5; }
    return v / 0.9375 - 0.4;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  W.rng = rng; W.clamp = clamp; W.sstep = sstep; W.mix = mix; W.fbm = fbm;

  // ---------- geography (metres; x east, z south, lake surface at y = 0 = 742 m above sea level) ----------
  const LAKE = (W.LAKE = { x: -400, z: 250, rx: 1500, rz: 480 });
  const T0 = (W.T0 = { x: 150, z: -1060 });
  const LAND = (W.LAND = { x: 1380, z: 400, r: 140, y: 9 });
  const ISLE = (W.ISLE = { x: -700, z: 170 });
  W.MSL = 742;

  function lakeD(x, z) {
    const dx = (x - LAKE.x) / LAKE.rx, dz = (z - LAKE.z) / LAKE.rz;
    return Math.sqrt(dx * dx + dz * dz) + 0.11 * fbm(x * 0.0021 + 7, z * 0.0021 - 3, 3, 9);
  }
  W.lakeD = lakeD;
  function Hraw(x, z) {
    const n = fbm(x * 0.0011, z * 0.0011, 4, 1);
    let h = 20 + 13 * n;
    // Sarangkot: the long ridge north of the lake, highest above the launch, sinking east into town
    const zn = z + 1150 + 140 * Math.sin(x * 0.0011 + 0.6);
    let rn = 680 * Math.exp(-(zn * zn) / (560 * 560)) * (0.8 + 0.2 * Math.cos(x * 0.0007));
    rn *= 1 - 0.8 * sstep(1300, 3200, x);
    // the Raniban ridge south of the lake, the World Peace Pagoda on its crest
    const zs = z - 1250 - 90 * Math.sin(x * 0.0016 + 1.3);
    let rs = 390 * Math.exp(-(zs * zs) / (370 * 370));
    rs *= 1 - 0.85 * sstep(500, 2000, x);
    const west = 540 * sstep(-1700, -3600, x) * (0.8 + 0.25 * n);
    const r = Math.hypot(x, z * 1.08);
    const rim = 950 * sstep(3000, 4700, r) * (0.75 + 0.4 * fbm(x * 0.0008 + 3, z * 0.0008, 3, 4));
    let hill = rn + rs + west + rim;
    const dT = Math.hypot(x - T0.x, z - T0.z);
    hill += ridged(x * 0.0034, z * 0.0034, 2) * 85 * Math.min(1, hill / 260) * sstep(60, 260, dT);
    h += hill;
    // lake basin with a flat shore
    const d = lakeD(x, z);
    const shore = sstep(1.4, 1.0, d);
    const target = 2.5 + Math.max(0, d - 1) * 90;
    h = mix(h, Math.min(h, target), shore);
    h = mix(h, -9, sstep(1.0, 0.85, d));
    // Tal Barahi's island
    const di = Math.hypot(x - ISLE.x, z - ISLE.z);
    h = mix(h, 4, sstep(52, 26, di));
    // the landing field
    const dl = Math.hypot(x - LAND.x, z - LAND.z);
    h = mix(h, LAND.y, sstep(LAND.r + 150, LAND.r + 10, dl));
    return h;
  }
  // the launch: a smooth grassy ramp falling gently south toward the lake
  const T0H = Hraw(T0.x, T0.z);
  function H(x, z) {
    const h = Hraw(x, z);
    const dT = Math.hypot(x - T0.x, (z - T0.z) * 0.8);
    const ramp = T0H - (z - T0.z) * 0.36 - Math.abs(x - T0.x) * 0.04;
    return mix(h, ramp, sstep(150, 70, dT));
  }
  W.H = H;

  // ---------- terrain grid ----------
  const SIZE = 9600, N = 300, CELL = SIZE / N, HALF = SIZE / 2;
  const heights = new Float32Array((N + 1) * (N + 1));
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) heights[i * (N + 1) + j] = H(-HALF + j * CELL, -HALF + i * CELL);
  // exact height of the drawn triangles, so the glider touches what you see
  function ground(x, z) {
    let gx = (x + HALF) / CELL, gz = (z + HALF) / CELL;
    gx = clamp(gx, 0, N - 0.0001); gz = clamp(gz, 0, N - 0.0001);
    const j = Math.floor(gx), i = Math.floor(gz), u = gx - j, v = gz - i;
    const h00 = heights[i * (N + 1) + j], h10 = heights[i * (N + 1) + j + 1];
    const h01 = heights[(i + 1) * (N + 1) + j], h11 = heights[(i + 1) * (N + 1) + j + 1];
    return v >= u ? h00 + v * (h01 - h00) + u * (h11 - h01) : h00 + u * (h10 - h00) + v * (h11 - h10);
  }
  W.ground = ground;
  W.slopeY = (x, z) => {
    const e = 6, hx = ground(x + e, z) - ground(x - e, z), hz = ground(x, z + e) - ground(x, z - e);
    return 1 / Math.sqrt(1 + (hx * hx + hz * hz) / (4 * e * e));
  };
  W.forest = (x, z) => fbm(x * 0.0024 + 11, z * 0.0024 - 5, 3, 21) + 0.25 * sstep(60, 400, H(x, z)) - 0.1;

  // ---------- shared sky / light uniforms ----------
  const C = (hex) => new THREE.Color(hex);
  const U = (W.U = {
    uZenith: { value: C('#3f7fcf') }, uHorizon: { value: C('#cfe0ea') },
    uSunDir: { value: new THREE.Vector3(0.7, 0.35, 0.3).normalize() }, uSunCol: { value: C('#fff0d8') },
    uAmbSky: { value: C('#8fb3d9') }, uAmbGnd: { value: C('#5a5a40') }, uFogDen: { value: 1 / 7500 },
    uTime: { value: 0 },
  });
  const PRESETS = (W.PRESETS = {
    morning: { zen: '#3a7bd0', hor: '#cfe1ee', sun: '#fff0d6', si: 1.25, sky: '#93b6dc', gnd: '#5d5a42', ai: 0.5, dir: [0.78, 0.33, 0.22], fog: 1 / 7600, cloud: '#ffffff' },
    midday: { zen: '#2c6cc6', hor: '#bad5ec', sun: '#fffaf0', si: 1.35, sky: '#9cc0e6', gnd: '#6b6648', ai: 0.48, dir: [0.25, 0.86, 0.45], fog: 1 / 8200, cloud: '#ffffff' },
    golden: { zen: '#2a4a82', hor: '#f2b17e', sun: '#ffb06a', si: 1.45, sky: '#8090bc', gnd: '#5c4430', ai: 0.42, dir: [-0.83, 0.15, 0.3], fog: 1 / 7000, cloud: '#ffe2c4' },
  });
  const GLSL_SKY = `
    uniform vec3 uZenith, uHorizon, uSunDir, uSunCol, uAmbSky, uAmbGnd; uniform float uFogDen, uTime;
    vec3 skyCol(vec3 d){
      float h = d.y;
      vec3 c = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
      c = mix(c, uHorizon * 0.82, smoothstep(0.0, -0.3, h));
      float s = max(dot(d, uSunDir), 0.0);
      c += uSunCol * (pow(s, 5.0) * 0.18 + pow(s, 60.0) * 0.45);
      c += uSunCol * smoothstep(0.99925, 0.9997, s) * 8.0;
      return c;
    }
    vec3 hazeCol(vec3 d){
      float s = max(dot(d, uSunDir), 0.0);
      return mix(uHorizon, uHorizon * 0.6 + uSunCol * 0.5, pow(s, 6.0) * 0.6);
    }
    vec3 applyFog(vec3 col, vec3 wp){
      vec3 d = wp - cameraPosition; float dist = length(d);
      float f = 1.0 - exp(-dist * dist * uFogDen * uFogDen);
      return mix(col, hazeCol(d / dist), f);
    }
    float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hsh(i), hsh(i + vec2(1, 0)), f.x), mix(hsh(i + vec2(0, 1)), hsh(i + vec2(1, 1)), f.x), f.y); }
  `;
  const OUT = `
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  `;
  const L = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)})`; };

  // ---------- build everything ----------
  W.build = function (scene) {
    W.scene = scene;
    scene.fog = new THREE.FogExp2(0xcfe0ea, 1 / 7500);
    W.sun = new THREE.DirectionalLight(0xffffff, 1);
    W.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(W.sun, W.sun.target, W.hemi);
    buildSky(scene);
    buildFar(scene);
    buildTerrain(scene);
    buildWater(scene);
    buildTrees(scene);
    buildTown(scene);
    buildLandmarks(scene);
    buildFlags(scene);
    buildBoats(scene);
    buildCrowd(scene);
    buildBirds(scene);
    buildClouds(scene);
    W.setPreset('morning');
  };

  W.setPreset = function (name) {
    const p = PRESETS[name] || PRESETS.morning;
    W.preset = name;
    U.uZenith.value.set(p.zen); U.uHorizon.value.set(p.hor);
    U.uSunCol.value.set(p.sun).multiplyScalar(p.si);
    U.uAmbSky.value.set(p.sky).multiplyScalar(p.ai); U.uAmbGnd.value.set(p.gnd).multiplyScalar(p.ai);
    U.uSunDir.value.set(p.dir[0], p.dir[1], p.dir[2]).normalize();
    U.uFogDen.value = p.fog;
    W.scene.fog.color.copy(U.uHorizon.value); W.scene.fog.density = p.fog;
    W.sun.color.copy(U.uSunCol.value); W.sun.intensity = 1;
    W.sun.position.copy(U.uSunDir.value).multiplyScalar(1000);
    W.hemi.color.copy(U.uAmbSky.value); W.hemi.groundColor.copy(U.uAmbGnd.value); W.hemi.intensity = 1;
    if (W.cloudMat) W.cloudMat.uniforms.uTint.value.set(p.cloud);
  };

  // ---------- sky dome ----------
  function buildSky(scene) {
    const mat = new THREE.ShaderMaterial({
      uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: GLSL_SKY + `varying vec3 vD; void main(){ gl_FragColor = vec4(skyCol(normalize(vD)), 1.0);` + OUT + `}`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(30000, 48, 24), mat);
    sky.renderOrder = -10; sky.frustumCulled = false;
    sky.onBeforeRender = (r, s, cam) => { sky.position.copy(cam.position); sky.updateMatrixWorld(); };
    scene.add(sky);
    W.sky = sky;
  }

  // ---------- far land: rolling blue hills all round, the Annapurna range to the north ----------
  const PEAKS = [
    // x, z, height, half-width x, half-width z
    [-16500, -19000, 3600, 5200, 3800],
    [-10500, -18200, 4300, 4300, 3200],  // Annapurna South
    [-7300, -16800, 3600, 2800, 2300],   // Hiunchuli
    [-4200, -21500, 4900, 5200, 3600],   // Annapurna I massif behind
    [700, -15200, 4550, 1750, 1550],     // Machhapuchhre, the fishtail
    [1900, -15600, 4300, 1450, 1350],    // its second summit
    [6500, -19500, 4400, 4200, 3300],    // Annapurna III
    [11500, -19000, 4250, 4300, 3300],   // Annapurna IV and II
    [17500, -20500, 3900, 4800, 3600],   // Lamjung
  ];
  function FH(x, z) {
    const r = Math.hypot(x, z);
    let h = 250 + 1100 * sstep(5200, 11000, r) * (0.55 + 0.45 * fbm(x * 0.00022, z * 0.00022, 4, 31));
    h += ridged(x * 0.0009, z * 0.0009, 33) * 420 * sstep(5000, 9000, r);
    // the Himalayan wall to the north
    const north = sstep(-9500, -15500, z) * sstep(30000, 20000, Math.abs(x));
    h += north * (1500 + 500 * fbm(x * 0.0003, z * 0.0003, 3, 37));
    for (const [px, pz, ph, wx, wz] of PEAKS) {
      const v = 1 - (Math.abs(x - px) / wx + Math.abs(z - pz) / wz);
      if (v > 0) {
        const crag = 1 + 0.12 * ridged(x * 0.0016, z * 0.0016, 41);
        h = Math.max(h, ph * Math.pow(v, 1.25) * crag + 1200 * (1 - v));
      }
    }
    return h;
  }
  function buildFar(scene) {
    const NA = 600, NR = 72, R0 = 4400, R1 = 30000;
    const pos = [], idx = [];
    for (let k = 0; k <= NR; k++) {
      const r = R0 + (R1 - R0) * Math.pow(k / NR, 1.7);
      for (let a = 0; a <= NA; a++) {
        const th = (a / NA) * Math.PI * 2;
        const x = Math.cos(th) * r, z = Math.sin(th) * r;
        pos.push(x, FH(x, z) * sstep(4400, 5600, r) - 40 * (1 - sstep(4400, 5600, r)), z);
      }
    }
    for (let k = 0; k < NR; k++) for (let a = 0; a < NA; a++) {
      const i0 = k * (NA + 1) + a, i1 = i0 + 1, i2 = i0 + NA + 1, i3 = i2 + 1;
      idx.push(i0, i2, i1, i1, i2, i3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      uniforms: U, fog: false,
      vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_SKY + `
        uniform float uClip; varying vec3 vW; varying vec3 vN;
        void main(){
          vec3 N = normalize(vN);
          float slope = 1.0 - N.y;
          float n = vn(vW.xz * 0.004) * 0.6 + vn(vW.xz * 0.02) * 0.4;
          vec3 col = mix(${L('#3d5a3a')}, ${L('#5a6b45')}, n);
          col = mix(col, ${L('#6d6a66')}, smoothstep(1700.0, 2400.0, vW.y + n * 300.0));
          float snow = smoothstep(2350.0, 2700.0, vW.y + n * 500.0 - slope * 900.0);
          col = mix(col, ${L('#f4f6fa')}, snow);
          float dif = max(dot(N, uSunDir), 0.0);
          vec3 amb = mix(uAmbGnd, uAmbSky, N.y * 0.5 + 0.5);
          vec3 lit = col * (amb * 1.1 + uSunCol * dif);
          vec3 d = vW - cameraPosition; float dist = length(d);
          float haze = clamp(0.12 + dist / 26000.0, 0.0, 0.8) * mix(1.0, 0.55, smoothstep(1500.0, 4200.0, vW.y));
          lit = mix(lit, hazeCol(d / dist), haze);
          gl_FragColor = vec4(lit, 1.0);` + OUT + `}`,
    });
    mat.uniforms.uClip = { value: -1e9 };
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false; m.renderOrder = -5;
    scene.add(m);
    W.far = m;
  }

  // ---------- terrain ----------
  function buildTerrain(scene) {
    const n = (N + 1) * (N + 1);
    const pos = new Float32Array(n * 3), forest = new Float32Array(n);
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const k = i * (N + 1) + j, x = -HALF + j * CELL, z = -HALF + i * CELL;
      pos[k * 3] = x; pos[k * 3 + 1] = heights[k]; pos[k * 3 + 2] = z;
      forest[k] = W.forest(x, z);
    }
    const idx = new Uint32Array(N * N * 6);
    let p = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = i * (N + 1) + j, b = a + N + 1, c = b + 1, d = a + 1;
      idx[p++] = a; idx[p++] = b; idx[p++] = c; idx[p++] = a; idx[p++] = c; idx[p++] = d;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aForest', new THREE.BufferAttribute(forest, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, {
        uClip: { value: -1e9 }, uShadow: { value: new THREE.Vector3(0, 0, 0) }, uShadowDir: { value: new THREE.Vector2(1, 0) },
        uLand: { value: new THREE.Vector3(LAND.x, LAND.z, LAND.r) },
      }),
      fog: false,
      vertexShader: `attribute float aForest; varying vec3 vW; varying vec3 vN; varying float vF;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; vF = aForest; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_SKY + `
        uniform float uClip; uniform vec3 uShadow; uniform vec2 uShadowDir; uniform vec3 uLand;
        varying vec3 vW; varying vec3 vN; varying float vF;
        void main(){
          if (vW.y < uClip) discard;
          vec3 N = normalize(vN);
          float slope = 1.0 - N.y;
          float h = vW.y;
          float n1 = vn(vW.xz * 0.012), n2 = vn(vW.xz * 0.09), n3 = vn(vW.xz * 0.45);
          vec3 col = mix(${L('#6f9a3c')}, ${L('#4c7a2e')}, n1 * 0.7 + n2 * 0.3);
          // rice terraces: contour bands on the gentler slopes, alternating green and gold
          float tm = smoothstep(0.34, 0.12, slope) * smoothstep(12.0, 22.0, h) * smoothstep(560.0, 420.0, h) * smoothstep(0.44, 0.6, vn(vW.xz * 0.0042 + 3.0));
          float band = floor(h / 3.6), bt = fract(h / 3.6);
          vec3 paddy = mix(${L('#8fb543')}, ${L('#c9b05a')}, step(0.62, vn(vec2(band * 0.37, vW.x * 0.003 + vW.z * 0.002))));
          paddy = mix(paddy, ${L('#5f8f37')}, step(0.75, hsh(vec2(band, floor(vW.x / 140.0)))));
          vec3 terr = mix(paddy * (0.9 + 0.2 * n2), ${L('#8a6a3e')}, smoothstep(0.82, 0.96, bt) * 0.8);
          col = mix(col, terr, tm);
          col = mix(col, ${L('#2f5326')} * (0.75 + 0.5 * n2), smoothstep(0.08, 0.38, vF) * (1.0 - tm * 0.7));
          col = mix(col, ${L('#827866')} * (0.8 + 0.35 * n3), smoothstep(0.48, 0.66, slope + n3 * 0.12));
          col = mix(col, ${L('#cbb88d')}, smoothstep(4.5, 1.8, h));
          col = mix(col, ${L('#4a5a44')}, smoothstep(0.2, -2.5, h));
          // Lakeside town ground
          float town = smoothstep(1050.0, 1300.0, vW.x) * smoothstep(2800.0, 2500.0, vW.x) * smoothstep(-450.0, -250.0, vW.z) * smoothstep(1250.0, 1050.0, vW.z);
          col = mix(col, ${L('#9a9381')} * (0.85 + 0.3 * n3), town * 0.55 * smoothstep(0.35, 0.6, n2 + n1 * 0.3));
          // the mown landing field with stripes
          float dl = length(vW.xz - uLand.xy);
          float field = smoothstep(uLand.z + 8.0, uLand.z, dl);
          vec3 mown = mix(${L('#5d8f2f')}, ${L('#74a63c')}, step(0.5, fract(vW.x / 14.0)));
          col = mix(col, mown, field);
          float dif = max(dot(N, uSunDir), 0.0);
          vec3 amb = mix(uAmbGnd, uAmbSky, N.y * 0.5 + 0.5);
          // the glider's shadow, cast along the sun onto the ground
          vec2 sp = vW.xz - uShadow.xy;
          sp = vec2(sp.x * uShadowDir.x + sp.y * uShadowDir.y, -sp.x * uShadowDir.y + sp.y * uShadowDir.x);
          float wingS = 1.0 - smoothstep(0.75, 1.0, length(vec2(sp.x / 5.2, sp.y / 1.5)));
          float sh = wingS * uShadow.z;
          vec3 lit = col * (amb + uSunCol * dif * (1.0 - sh * 0.75));
          lit = applyFog(lit, vW);
          gl_FragColor = vec4(lit, 1.0);` + OUT + `}`,
    });
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false;
    scene.add(m);
    W.terrain = m;
  }

  // ---------- Phewa Lake ----------
  function buildWater(scene) {
    W.reflRT = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType });
    W.reflCam = new THREE.PerspectiveCamera();
    W.texMat = new THREE.Matrix4();
    const mat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, { tRefl: { value: W.reflRT.texture }, uTexMat: { value: W.texMat }, uReflOn: { value: 1 } }),
      fog: false,
      vertexShader: `uniform mat4 uTexMat; varying vec3 vW; varying vec4 vR;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vR = uTexMat * w; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_SKY + `
        uniform sampler2D tRefl; uniform float uReflOn; varying vec3 vW; varying vec4 vR;
        void main(){
          vec2 p = vW.xz; float t = uTime;
          vec2 g = vec2(0.0);
          g += vec2(cos(p.x * 0.06 + t * 0.9 + p.y * 0.02), cos(p.y * 0.05 - t * 0.7 + p.x * 0.015)) * 0.5;
          g += vec2(cos(p.x * 0.17 - t * 1.6 + p.y * 0.11), cos(p.y * 0.21 + t * 1.3 - p.x * 0.07)) * 0.3;
          g += (vec2(vn(p * 0.35 + t * 0.4), vn(p.yx * 0.35 - t * 0.35)) - 0.5) * 0.9;
          vec3 V = normalize(cameraPosition - vW);
          float dist = length(cameraPosition - vW);
          float rough = mix(0.05, 0.012, smoothstep(100.0, 2500.0, dist));
          vec3 N = normalize(vec3(-g.x * rough, 1.0, -g.y * rough));
          float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
          vec3 R = reflect(-V, N);
          vec3 refl = skyCol(R);
          if (uReflOn > 0.5) {
            vec4 rc = vR; rc.xy += N.xz * 14.0 * rc.w / max(dist, 30.0);
            refl = texture2DProj(tRefl, rc).rgb;
          }
          vec3 deep = ${L('#1c4b4f')} * (uAmbSky * 0.9 + uSunCol * 0.25);
          vec3 col = mix(deep, refl, clamp(fres + 0.38, 0.0, 0.92));
          float sd = max(dot(R, uSunDir), 0.0);
          col += uSunCol * (pow(sd, 400.0) * 5.0 + pow(sd, 45.0) * 0.18);
          col = applyFog(col, vW);
          gl_FragColor = vec4(col, 1.0);` + OUT + `}`,
    });
    const g = new THREE.PlaneGeometry(LAKE.rx * 2.6, LAKE.rz * 3.2, 1, 1);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.set(LAKE.x, 0, LAKE.z);
    scene.add(m);
    W.water = m;
  }
  W.reflectionOn = true;
  // render the scene mirrored in the lake into a small target (planar reflection)
  W.renderReflection = function (renderer, scene, cam, hide) {
    if (!W.reflectionOn) { W.water.material.uniforms.uReflOn.value = 0; return; }
    W.water.material.uniforms.uReflOn.value = 1;
    if (cam.position.y < 0.5) return;
    const rc = W.reflCam;
    rc.copy(cam);
    rc.position.set(cam.position.x, -cam.position.y, cam.position.z);
    const look = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).add(cam.position);
    look.y = -look.y;
    rc.up.set(0, 1, 0).applyQuaternion(cam.quaternion); rc.up.y = -rc.up.y;
    rc.lookAt(look);
    rc.updateMatrixWorld();
    rc.projectionMatrix.copy(cam.projectionMatrix);
    W.texMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    W.texMat.multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);
    W.water.visible = false;
    const clip = W.terrain.material.uniforms.uClip; clip.value = -0.3;
    const hidden = hide.filter((o) => o.visible); hidden.forEach((o) => (o.visible = false));
    const fogWas = scene.fog.density;
    renderer.setRenderTarget(W.reflRT);
    renderer.clear();
    renderer.render(scene, rc);
    renderer.setRenderTarget(null);
    scene.fog.density = fogWas;
    hidden.forEach((o) => (o.visible = true));
    clip.value = -1e9;
    W.water.visible = true;
  };

  // ---------- forests ----------
  const treeGrid = new Map();
  function tKey(x, z) { return Math.floor(x / 20) + ',' + Math.floor(z / 20); }
  W.treeNear = function (x, z, r) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const l = treeGrid.get(Math.floor(x / 20 + dx) + ',' + Math.floor(z / 20 + dz));
      if (l) for (const t of l) if ((t[0] - x) ** 2 + (t[1] - z) ** 2 < (r + t[2]) ** 2) return true;
    }
    return false;
  };
  const keepClear = []; // [x, z, r] spots with no trees or houses
  function clear(x, z) {
    for (const k of keepClear) if ((x - k[0]) ** 2 + (z - k[1]) ** 2 < k[2] * k[2]) return false;
    return true;
  }
  function buildTrees(scene) {
    keepClear.push([LAND.x, LAND.z, LAND.r + 45], [T0.x, T0.z + 40, 130], [ISLE.x, ISLE.z, 40]);
    const R = rng(77);
    const pine = new THREE.ConeGeometry(1, 1, 6); pine.translate(0, 0.5, 0);
    const broad = new THREE.IcosahedronGeometry(1, 0); broad.translate(0, 1, 0); broad.scale(1, 0.85, 1);
    const pineM = new THREE.InstancedMesh(pine, new THREE.MeshLambertMaterial({ color: 0xffffff }), 2600);
    const broadM = new THREE.InstancedMesh(broad, new THREE.MeshLambertMaterial({ color: 0xffffff }), 3600);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    let np = 0, nb = 0, tries = 0;
    while ((np < 2600 || nb < 3600) && tries++ < 90000) {
      const x = (R() * 2 - 1) * 4300, z = (R() * 2 - 1) * 4300;
      const f = W.forest(x, z);
      const h = ground(x, z);
      if (h < 6 || lakeD(x, z) < 1.07 || !clear(x, z)) continue;
      const town = x > 1050 && x < 2800 && z > -450 && z < 1250;
      if (f < (town ? 0.42 : 0.12) && R() > 0.04) continue;
      if (W.slopeY(x, z) < 0.62) continue;
      const high = h > 260 && R() < 0.7;
      const size = 6 + R() * 6;
      p.set(x, h - 1, z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6.28);
      if (high && np < 2600) {
        s.set(size * 0.42, size * 2.0, size * 0.42);
        m4.compose(p, q, s); pineM.setMatrixAt(np, m4);
        pineM.setColorAt(np, c.setHSL(0.3 + R() * 0.06, 0.45, 0.17 + R() * 0.08)); np++;
      } else if (nb < 3600) {
        s.set(size * 0.62, size * 0.75, size * 0.62);
        m4.compose(p, q, s); broadM.setMatrixAt(nb, m4);
        broadM.setColorAt(nb, c.setHSL(0.22 + R() * 0.1, 0.42 + R() * 0.15, 0.18 + R() * 0.1)); nb++;
      } else continue;
      const k = tKey(x, z);
      if (!treeGrid.has(k)) treeGrid.set(k, []);
      treeGrid.get(k).push([x, z, size * 0.45]);
    }
    pineM.count = np; broadM.count = nb;
    scene.add(pineM, broadM);
  }

  // ---------- Lakeside town and hill villages ----------
  function buildTown(scene) {
    const R = rng(1234);
    const MAX = 1500;
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    const walls = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0xffffff }), MAX);
    const roofs = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0xffffff }), MAX);
    const tankG = new THREE.CylinderGeometry(0.6, 0.6, 1.3, 8); tankG.translate(0, 0.65, 0);
    const tanks = new THREE.InstancedMesh(tankG, new THREE.MeshLambertMaterial({ color: 0x1d1f22 }), MAX);
    const wallC = ['#f6f1e6', '#f1e3c6', '#f3c9c1', '#bfe0ef', '#cfe8cf', '#f4d27a', '#e5a07a', '#ffffff', '#d9d4f0', '#f7b267'];
    const roofC = ['#8c8c88', '#a33a2b', '#3e7d5a', '#2f5d9a', '#9d9a92', '#7b4a32'];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    const up = new THREE.Vector3(0, 1, 0);
    let n = 0, nt = 0;
    function house(x, z, rot, big) {
      if (n >= MAX) return;
      const h0 = ground(x, z);
      const w = 6 + R() * 5 * big, d = 6 + R() * 5 * big, fl = 1 + Math.floor(R() * (big > 1 ? 4 : 2.2));
      const ht = fl * 3 + 0.6;
      q.setFromAxisAngle(up, rot);
      p.set(x, h0 - 1.5, z); s.set(w, ht + 1.5, d);
      m4.compose(p, q, s); walls.setMatrixAt(n, m4); walls.setColorAt(n, c.set(wallC[(R() * wallC.length) | 0]));
      p.set(x, h0 + ht, z); s.set(w + 0.6, 0.45, d + 0.6);
      m4.compose(p, q, s); roofs.setMatrixAt(n, m4); roofs.setColorAt(n, c.set(roofC[(R() * roofC.length) | 0]));
      if (R() < 0.6 && nt < MAX) {
        p.set(x + (R() - 0.5) * w * 0.5, h0 + ht + 0.4, z + (R() - 0.5) * d * 0.5); s.set(1, 1, 1);
        m4.compose(p, q, s); tanks.setMatrixAt(nt++, m4);
      }
      n++;
    }
    // Lakeside: a loose street grid, densest by the shore
    for (let gx = 1080; gx < 2750; gx += 19) for (let gz = -420; gz < 1220; gz += 19) {
      const x = gx + (R() - 0.5) * 6, z = gz + (R() - 0.5) * 6;
      if (lakeD(x, z) < 1.08 || !clear(x, z) || Math.hypot(x - LAND.x, z - LAND.z) < LAND.r + 60) continue;
      if ((gx - 1080) % 95 < 19 || (gz + 420) % 114 < 19) continue; // streets
      const dens = 0.85 - (x - 1100) / 2600 - Math.abs(z - 400) / 2400;
      if (R() > dens) continue;
      if (W.slopeY(x, z) < 0.9) continue;
      house(x, z, (R() - 0.5) * 0.12, 1.6);
    }
    // Sarangkot village along the ridge, and farmhouses on the slopes
    for (let i = 0; i < 2600 && n < MAX; i++) {
      const x = (R() * 2 - 1) * 3600, z = (R() * 2 - 1) * 3400;
      const h = ground(x, z);
      if (h < 8 || lakeD(x, z) < 1.1 || !clear(x, z)) continue;
      const ridgeV = Math.abs(z + 1130 + 140 * Math.sin(x * 0.0011 + 0.6)) < 160 && x > -1400 && x < 1500;
      if (!ridgeV && R() > 0.09) continue;
      if (W.slopeY(x, z) < 0.8 || W.treeNear(x, z, 4)) continue;
      house(x, z, R() * 6.28, 1);
    }
    walls.count = n; roofs.count = n; tanks.count = nt;
    scene.add(walls, roofs, tanks);
  }

  // ---------- small merged props ----------
  function merged(parts) {
    // parts: [geometry, colorHex, x, y, z, rx, ry, rz]
    const out = [];
    const m4 = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion();
    let total = 0;
    const gs = parts.map(([g, col, x, y, z, rx, ry, rz]) => {
      const ng = g.index ? g.toNonIndexed() : g.clone();
      m4.compose(new THREE.Vector3(x || 0, y || 0, z || 0), q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(1, 1, 1));
      ng.applyMatrix4(m4);
      total += ng.attributes.position.count;
      return [ng, new THREE.Color(col)];
    });
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), cols = new Float32Array(total * 3);
    let o = 0;
    for (const [g, c] of gs) {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < g.attributes.position.count; i++) { cols[(o + i) * 3] = c.r; cols[(o + i) * 3 + 1] = c.g; cols[(o + i) * 3 + 2] = c.b; }
      o += g.attributes.position.count;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
  }
  W.merged = merged;
  const roof4 = (r, h) => { const g = new THREE.ConeGeometry(r, h, 4, 1); g.rotateY(Math.PI / 4); return g; };

  function buildLandmarks(scene) {
    // Tal Barahi: a small two-tier pagoda on its island
    const ty = ground(ISLE.x, ISLE.z);
    const tal = merged([
      [new THREE.BoxGeometry(14, 1.2, 14), '#d9cfc0', 0, 0.6, 0],
      [new THREE.BoxGeometry(7, 5, 7), '#9b3b26', 0, 3.7, 0],
      [roof4(7.8, 3), '#7a1f17', 0, 7.4, 0],
      [new THREE.BoxGeometry(4.6, 3, 4.6), '#9b3b26', 0, 9.6, 0],
      [roof4(5.4, 3), '#7a1f17', 0, 12.3, 0],
      [new THREE.ConeGeometry(0.6, 3, 8), '#e2b23a', 0, 15, 0],
      [new THREE.BoxGeometry(1.4, 0.2, 3.6), '#e2b23a', 0, 5.0, -3.6],
    ]);
    tal.position.set(ISLE.x, ty, ISLE.z);
    scene.add(tal);
    // World Peace Pagoda: a white stupa on the southern ridge, big enough to see from the air
    let best = -1e9, bx = -450, bz = 1290;
    for (let dz = -120; dz <= 120; dz += 10) { const h = ground(-450, 1290 + dz); if (h > best) { best = h; bz = 1290 + dz; } }
    W.PAGODA = { x: bx, z: bz, y: best };
    const st = merged([
      [new THREE.CylinderGeometry(30, 32, 5, 40), '#f3efe6', 0, 2.5, 0],
      [new THREE.CylinderGeometry(24, 25, 5, 40), '#f7f4ee', 0, 7.5, 0],
      [new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), '#ffffff', 0, 10, 0],
      [new THREE.BoxGeometry(6, 5, 6), '#e8c35a', 0, 29, 0],
      [new THREE.ConeGeometry(3, 14, 16), '#e2b23a', 0, 38, 0],
      [new THREE.CylinderGeometry(2.4, 2.4, 1, 12), '#e2b23a', 0, 32, 0],
      [new THREE.BoxGeometry(5, 7, 1.4), '#e7b046', 0, 18, -17.5],
    ]);
    st.position.set(bx, best - 1, bz);
    scene.add(st);
    // Sarangkot launch: a tea stall with a blue tarp and a viewing tower on the crest
    const lx = T0.x, lz = T0.z, ly = ground(lx, lz);
    W.T0.y = ly;
    const stall = merged([
      [new THREE.BoxGeometry(5, 2.6, 4), '#c9a77a', 0, 1.3, 0],
      [new THREE.BoxGeometry(6.4, 0.25, 5.4), '#2f6fd1', 0, 2.75, 0, 0.12],
      [new THREE.BoxGeometry(2.4, 0.9, 1), '#7b4a32', 0, 0.45, -2.6],
    ]);
    stall.position.set(lx - 26, ground(lx - 26, lz - 18), lz - 18);
    scene.add(stall);
    let cx = 60, cz = -1150, ch = -1e9;
    for (let dz = -200; dz <= 200; dz += 10) { const h = ground(cx, -1150 + dz); if (h > ch) { ch = h; cz = -1150 + dz; } }
    const tower = merged([
      [new THREE.BoxGeometry(6, 12, 6), '#d7d2c6', 0, 6, 0],
      [new THREE.BoxGeometry(8, 0.6, 8), '#a33a2b', 0, 12.3, 0],
      [new THREE.BoxGeometry(0.4, 3, 8), '#d7d2c6', 3.8, 13.8, 0],
    ]);
    tower.position.set(cx, ch - 0.5, cz);
    scene.add(tower);
    // landing field: target, windsock, a light pillar you can find from anywhere in the valley
    const tc = document.createElement('canvas'); tc.width = tc.height = 256;
    const g = tc.getContext('2d');
    const rings = [[124, '#ffffff'], [112, '#ff7a1a'], [88, '#ffffff'], [64, '#ff7a1a'], [40, '#ffffff'], [24, '#d42020']];
    rings.forEach(([r, col]) => { g.fillStyle = col; g.beginPath(); g.arc(128, 128, r, 0, 7); g.fill(); });
    g.fillStyle = '#ffffff'; g.fillRect(124, 0, 8, 256); g.fillRect(0, 124, 256, 8);
    const tt = new THREE.CanvasTexture(tc); tt.encoding = THREE.sRGBEncoding;
    const target = new THREE.Mesh(new THREE.CircleGeometry(45, 48), new THREE.MeshLambertMaterial({ map: tt, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    target.rotation.x = -Math.PI / 2;
    target.position.set(LAND.x, LAND.y + 0.05, LAND.z);
    scene.add(target);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 900, 24, 1, true), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uT: U.uTime, uA: { value: 1 } },
      vertexShader: `varying float vY; void main(){ vY = position.y / 900.0 + 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uT, uA; varying float vY; void main(){ float a = (1.0 - vY) * (1.0 - vY) * (0.55 + 0.15 * sin(uT * 2.0 - vY * 20.0)); gl_FragColor = vec4(vec3(1.0, 0.55, 0.15) * a * uA, 1.0); }`,
    }));
    pillar.position.set(LAND.x, LAND.y + 450, LAND.z);
    scene.add(pillar);
    W.pillar = pillar;
    // windsock
    const sc = document.createElement('canvas'); sc.width = 64; sc.height = 8;
    const sg = sc.getContext('2d');
    for (let i = 0; i < 5; i++) { sg.fillStyle = i % 2 ? '#ffffff' : '#ff5a1a'; sg.fillRect(i * 12.8, 0, 12.8, 8); }
    const stx = new THREE.CanvasTexture(sc); stx.encoding = THREE.sRGBEncoding;
    const poleX = LAND.x + 70, poleZ = LAND.z - 70, poleY = ground(poleX, poleZ);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 8, 6), PG.lam('#dddddd'));
    pole.position.set(poleX, poleY + 4, poleZ);
    const sockG = new THREE.CylinderGeometry(0.45, 0.25, 3.2, 12, 6, true);
    sockG.rotateZ(Math.PI / 2); sockG.translate(1.6, 0, 0);
    const sock = new THREE.Mesh(sockG, new THREE.MeshLambertMaterial({ map: stx, side: THREE.DoubleSide }));
    const sockPivot = new THREE.Group(); sockPivot.position.set(poleX, poleY + 7.6, poleZ);
    sockPivot.add(sock);
    scene.add(pole, sockPivot);
    W.sock = sockPivot;
  }

  // ---------- prayer flags ----------
  const FLAG_C = ['#2457c5', '#f4f1ea', '#d42a20', '#2e9a4a', '#f2c230'];
  const flagStrings = [];
  function flagString(a, b, sag) { flagStrings.push([a, b, sag]); }
  W.flagString = flagString;
  function buildFlags(scene) {
    const V = THREE.Vector3;
    const tx = T0.x, tz = T0.z, ty = T0.y;
    // launch: strings across the top of the meadow
    for (let k = 0; k < 3; k++) {
      const z = tz - 30 - k * 6, x0 = tx - 45 + k * 4, x1 = tx + 40 - k * 3;
      flagString(new V(x0, ground(x0, z) + 6, z), new V(x1, ground(x1, z) + 6, z), 1.8);
    }
    // landing field edge
    flagString(new V(LAND.x - 120, LAND.y + 6, LAND.z - 110), new V(LAND.x + 40, LAND.y + 6, LAND.z - 150), 2);
    flagString(new V(LAND.x + 60, LAND.y + 6, LAND.z - 140), new V(LAND.x + 150, LAND.y + 6, LAND.z - 20), 2);
    // radiating from the stupa's spire and Tal Barahi
    const P = W.PAGODA;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.2;
      flagString(new V(P.x, P.y + 40, P.z), new V(P.x + Math.cos(a) * 48, P.y + 1.5, P.z + Math.sin(a) * 48), 3);
    }
    const iy = ground(ISLE.x, ISLE.z);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.6;
      flagString(new V(ISLE.x, iy + 15, ISLE.z), new V(ISLE.x + Math.cos(a) * 22, iy + 2, ISLE.z + Math.sin(a) * 22), 1.5);
    }
    let count = 0;
    const list = [];
    for (const [a, b, sag] of flagStrings) {
      const len = a.distanceTo(b), n = Math.max(2, Math.floor(len / 1.25));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const p = a.clone().lerp(b, t); p.y -= sag * 4 * t * (1 - t);
        list.push({ p, yaw: Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2, c: count % 5, ph: Math.random() * 6 });
        count++;
      }
    }
    const fg = new THREE.PlaneGeometry(0.9, 0.7); fg.translate(0, -0.35, 0);
    const fm = new THREE.InstancedMesh(fg, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), list.length);
    const c = new THREE.Color();
    list.forEach((f, i) => fm.setColorAt(i, c.set(FLAG_C[f.c])));
    scene.add(fm);
    // the strings themselves
    const lp = [];
    for (const [a, b, sag] of flagStrings) {
      for (let i = 0; i < 12; i++) {
        const t0 = i / 12, t1 = (i + 1) / 12;
        const p0 = a.clone().lerp(b, t0); p0.y -= sag * 4 * t0 * (1 - t0);
        const p1 = a.clone().lerp(b, t1); p1.y -= sag * 4 * t1 * (1 - t1);
        lp.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
      }
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x8a8070 })));
    W.flags = { mesh: fm, list };
  }
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
  function updateFlags(t, cam) {
    const F = W.flags; if (!F) return;
    for (let i = 0; i < F.list.length; i++) {
      const f = F.list[i];
      if (cam.position.distanceToSquared(f.p) > 900 * 900 && F.done) continue;
      _e.set(Math.sin(t * 5.3 + f.ph) * 0.35 + 0.5, f.yaw, Math.sin(t * 3.1 + f.ph) * 0.1);
      _m4.compose(f.p, _q.setFromEuler(_e), _s);
      F.mesh.setMatrixAt(i, _m4);
    }
    F.done = true;
    F.mesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- rowing boats on Phewa ----------
  function buildBoats(scene) {
    const hull = new THREE.BoxGeometry(1.5, 0.7, 7, 1, 1, 8);
    const hp = hull.attributes.position;
    for (let i = 0; i < hp.count; i++) {
      const z = hp.getZ(i), k = z / 3.5;
      let x = hp.getX(i) * Math.pow(Math.max(0, 1 - k * k), 0.55);
      let y = hp.getY(i);
      if (y < 0) x *= 0.45;
      y += Math.pow(Math.abs(k), 4) * 0.45;
      hp.setXYZ(i, x, y, z);
    }
    hull.computeVertexNormals();
    const cols = ['#2f6fd1', '#d42a20', '#f2c230', '#2e9a4a', '#f07a2a', '#7a3fb8'];
    W.boats = [];
    const R = rng(55);
    for (let i = 0; i < 12; i++) {
      let cx, cz;
      for (let k = 0; k < 50; k++) {
        cx = LAKE.x + (R() * 2 - 1) * LAKE.rx * 0.7; cz = LAKE.z + (R() * 2 - 1) * LAKE.rz * 0.5;
        if (lakeD(cx, cz) < 0.62 && Math.hypot(cx - ISLE.x, cz - ISLE.z) > 160) break;
      }
      const g = new THREE.Group();
      const h = new THREE.Mesh(hull, PG.lam(cols[i % cols.length]));
      h.position.y = 0.15; g.add(h);
      const rower = merged([
        [new THREE.CapsuleGeometry(0.22, 0.45, 3, 6), ['#f4f1ea', '#c2312a', '#2457c5', '#e2b23a'][i % 4], 0, 0.75, 0],
        [new THREE.SphereGeometry(0.16, 8, 6), '#8a5a3a', 0, 1.25, 0],
      ]);
      rower.position.set(0, 0.1, 1.6); g.add(rower);
      const oar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 3), PG.lam('#7b4a32'));
      const oarP = new THREE.Group(); oarP.position.set(0.6, 0.9, 1.3); oarP.add(oar); oar.position.z = 0.6; oar.rotation.x = 0.5;
      g.add(oarP);
      if (R() < 0.6) {
        const tourist = merged([
          [new THREE.CapsuleGeometry(0.22, 0.4, 3, 6), ['#ff7a1a', '#2e9a4a', '#ffffff'][i % 3], 0, 0.7, 0],
          [new THREE.SphereGeometry(0.16, 8, 6), '#e0b090', 0, 1.18, 0],
        ]);
        tourist.position.set(0, 0.1, -1.2); g.add(tourist);
      }
      scene.add(g);
      W.boats.push({ g, oarP, cx, cz, r: 40 + R() * 90, w: (0.012 + R() * 0.02) * (R() < 0.5 ? 1 : -1), a: R() * 6.28, ph: R() * 6 });
    }
  }
  function updateBoats(t, dt) {
    for (const b of W.boats) {
      b.a += b.w * dt;
      const x = b.cx + Math.cos(b.a) * b.r, z = b.cz + Math.sin(b.a) * b.r;
      b.g.position.set(x, Math.sin(t * 1.3 + b.ph) * 0.06, z);
      b.g.rotation.set(Math.sin(t * 1.1 + b.ph) * 0.03, -b.a + (b.w > 0 ? Math.PI : 0), Math.sin(t * 0.9 + b.ph) * 0.04);
      b.oarP.rotation.set(Math.sin(t * 2.2 + b.ph) * 0.5, Math.cos(t * 2.2 + b.ph) * 0.5, 0);
    }
  }

  // ---------- a crowd (instanced: bodies, heads, arms) ----------
  const people = [];
  function buildCrowd(scene) {
    const R = rng(99);
    function add(x, z, yaw) { people.push({ x, z, y: ground(x, z), yaw, ph: R() * 6, cheer: 0, c: R() }); }
    for (let i = 0; i < 26; i++) {
      const a = -2.4 + (i / 26) * 2.2 + (R() - 0.5) * 0.08, r = LAND.r - 10 + R() * 18;
      const x = LAND.x + Math.cos(a) * r, z = LAND.z + Math.sin(a) * r;
      add(x, z, Math.atan2(LAND.x - x, LAND.z - z));
    }
    for (let i = 0; i < 9; i++) {
      const x = T0.x - 30 + R() * 60, z = T0.z - 38 + R() * 10;
      add(x, z, Math.PI + (R() - 0.5));
    }
    const n = people.length;
    const bodyG = new THREE.CapsuleGeometry(0.24, 0.9, 3, 8); bodyG.translate(0, 0.72, 0);
    const headG = new THREE.SphereGeometry(0.16, 10, 8); headG.translate(0, 1.55, 0);
    const armG = new THREE.CapsuleGeometry(0.055, 0.5, 2, 5); armG.translate(0, -0.3, 0);
    const body = new THREE.InstancedMesh(bodyG, new THREE.MeshLambertMaterial(), n);
    const head = new THREE.InstancedMesh(headG, new THREE.MeshLambertMaterial(), n);
    const arms = new THREE.InstancedMesh(armG, new THREE.MeshLambertMaterial(), n * 2);
    const shirt = ['#c2312a', '#2457c5', '#f2c230', '#2e9a4a', '#f4f1ea', '#7a3fb8', '#ff7a1a', '#1d2f55', '#e0558a'];
    const skins = ['#8a5a3a', '#a8714b', '#6e452b', '#c48f6a', '#e0b090'];
    const c = new THREE.Color();
    people.forEach((p, i) => {
      const sc = shirt[(p.c * shirt.length) | 0];
      body.setColorAt(i, c.set(sc)); head.setColorAt(i, c.set(skins[i % skins.length]));
      arms.setColorAt(i * 2, c.set(sc)); arms.setColorAt(i * 2 + 1, c.set(sc));
    });
    scene.add(body, head, arms);
    W.crowd = { body, head, arms };
  }
  W.cheer = function (x, z, r) { for (const p of people) if (Math.hypot(p.x - x, p.z - z) < r) p.cheer = 4 + Math.random() * 2; };
  W.calm = function () { for (const p of people) p.cheer = 0; };
  function updateCrowd(t, dt) {
    const Cw = W.crowd;
    people.forEach((p, i) => {
      if (p.cheer > 0) p.cheer -= dt;
      const ch = p.cheer > 0 ? 1 : 0;
      const jump = ch * Math.abs(Math.sin(t * 6 + p.ph)) * 0.45;
      _p.set(p.x, p.y + jump, p.z);
      _e.set(0, p.yaw + Math.sin(t * 0.7 + p.ph) * 0.2, Math.sin(t * 1.3 + p.ph) * 0.03);
      _q.setFromEuler(_e);
      _m4.compose(_p, _q, _s);
      Cw.body.setMatrixAt(i, _m4); Cw.head.setMatrixAt(i, _m4);
      for (let k = 0; k < 2; k++) {
        const side = k ? 1 : -1;
        const wave = ch ? 2.6 + Math.sin(t * 9 + p.ph + k) * 0.4 : 0.12 + Math.sin(t * 1.5 + p.ph) * 0.05;
        const sh = new THREE.Vector3(side * 0.3, 1.28, 0).applyQuaternion(_q).add(_p);
        const q2 = _q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, side * wave)));
        _m4.compose(sh, q2, _s);
        Cw.arms.setMatrixAt(i * 2 + k, _m4);
      }
    });
    Cw.body.instanceMatrix.needsUpdate = true; Cw.head.instanceMatrix.needsUpdate = true; Cw.arms.instanceMatrix.needsUpdate = true;
  }

  // ---------- vultures circling the thermals ----------
  const BIRDS = 24;
  const birds = [];
  function buildBirds(scene) {
    const bodyG = new THREE.ConeGeometry(0.35, 2.2, 5); bodyG.rotateX(-Math.PI / 2);
    const wingG = new THREE.BufferGeometry();
    // one wing: a broad, fingered vulture wing along +x
    wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.5, 3.4, 0, -0.2, 0, 0, 0.6, 3.4, 0, -0.2, 3.6, 0, 0.4, 0, 0, 0.6], 3));
    wingG.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ color: 0x3a2e26, side: THREE.DoubleSide });
    W.birdMesh = {
      body: new THREE.InstancedMesh(bodyG, mat, BIRDS),
      wl: new THREE.InstancedMesh(wingG, mat, BIRDS),
      wr: new THREE.InstancedMesh(wingG, mat, BIRDS),
    };
    Object.values(W.birdMesh).forEach((m) => { m.count = 0; m.frustumCulled = false; scene.add(m); });
  }
  // thermals: [{x, z, r, top}]
  W.setBirds = function (thermals) {
    birds.length = 0;
    const R = rng(thermals.length * 31 + 7);
    thermals.forEach((th) => {
      for (let k = 0; k < 3 && birds.length < BIRDS; k++) {
        birds.push({ th, r: th.r * (0.45 + R() * 0.4), a: R() * 6.28, y: 260 + R() * Math.max(60, th.top - 380), w: 0.35 + R() * 0.15, ph: R() * 10, dir: R() < 0.8 ? 1 : -1, vy: 0.6 + R() * 0.6 });
      }
    });
    Object.values(W.birdMesh).forEach((m) => (m.count = birds.length));
  };
  W.thermalCenter = null; // set by game: (th, y) => {x, z}
  function updateBirds(t, dt) {
    const B = W.birdMesh;
    birds.forEach((b, i) => {
      b.a += b.w * b.dir * dt;
      b.y += b.vy * dt;
      if (b.y > b.th.top - 40) b.y = 250 + Math.random() * 120;
      const c = W.thermalCenter ? W.thermalCenter(b.th, b.y) : b.th;
      const x = c.x + Math.cos(b.a) * b.r, z = c.z + Math.sin(b.a) * b.r;
      const yaw = -b.a - (b.dir > 0 ? 0 : Math.PI);
      _p.set(x, b.y, z);
      _e.set(0, yaw, -0.35 * b.dir, 'YXZ');
      _q.setFromEuler(_e);
      _s.set(2.4, 2.4, 2.4);
      _m4.compose(_p, _q, _s); B.body.setMatrixAt(i, _m4);
      const flap = Math.max(0, Math.sin(t * 1.3 + b.ph)) > 0.92 ? Math.sin(t * 14 + b.ph) * 0.5 : 0.12;
      const ql = _q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, flap)));
      _m4.compose(_p, ql, _s); B.wr.setMatrixAt(i, _m4);
      const qr = _q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, 'XYZ'))).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -flap)));
      _m4.compose(_p, qr, _s); B.wl.setMatrixAt(i, _m4);
    });
    _s.set(1, 1, 1);
    B.body.instanceMatrix.needsUpdate = true; B.wl.instanceMatrix.needsUpdate = true; B.wr.instanceMatrix.needsUpdate = true;
  }

  // ---------- cumulus: soft billboards in one draw call, sorted back to front ----------
  const MAXP = 420;
  function buildClouds(scene) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const x = 64 + (Math.random() - 0.5) * 40, y = 64 + (Math.random() - 0.5) * 30, r = 26 + Math.random() * 22;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(cv);
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index; geo.attributes.position = base.attributes.position; geo.attributes.uv = base.attributes.uv;
    const iPos = new Float32Array(MAXP * 3), iSize = new Float32Array(MAXP), iShade = new Float32Array(MAXP), iRot = new Float32Array(MAXP);
    geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
    geo.setAttribute('iSize', new THREE.InstancedBufferAttribute(iSize, 1));
    geo.setAttribute('iShade', new THREE.InstancedBufferAttribute(iShade, 1));
    geo.setAttribute('iRot', new THREE.InstancedBufferAttribute(iRot, 1));
    geo.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, { tMap: { value: tex }, uTint: { value: new THREE.Color('#ffffff') } }),
      transparent: true, depthWrite: false, fog: false,
      vertexShader: `attribute vec3 iPos; attribute float iSize, iShade, iRot; varying vec2 vUv; varying float vShade, vFade; varying vec3 vW;
        void main(){
          vUv = uv; vShade = iShade; vW = iPos;
          vec4 mv = viewMatrix * vec4(iPos, 1.0);
          float c = cos(iRot), s = sin(iRot);
          mv.xy += vec2(position.x * c - position.y * s, position.x * s + position.y * c) * iSize;
          vFade = smoothstep(40.0, 260.0, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: GLSL_SKY + `uniform sampler2D tMap; uniform vec3 uTint; varying vec2 vUv; varying float vShade, vFade; varying vec3 vW;
        void main(){
          float a = texture2D(tMap, vUv).a;
          vec3 lit = uTint * (uAmbSky * 1.3 + uSunCol * (0.35 + 0.65 * vShade));
          vec3 col = applyFog(lit, vW);
          gl_FragColor = vec4(col, a * vFade * 0.95);` + OUT + `}`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false; m.renderOrder = 5;
    scene.add(m);
    W.cloudMat = mat;
    W.clouds = { m, geo, puffs: [], order: [] };
  }
  // clusters: [{x, y, z, s}] ; each becomes a heap of puffs, brighter on top
  W.setClouds = function (clusters, seed) {
    const R = rng(seed || 5);
    const P = W.clouds.puffs; P.length = 0;
    for (const c of clusters) {
      const n = Math.round(7 + c.s * 0.05);
      for (let i = 0; i < n && P.length < MAXP; i++) {
        const a = R() * 6.28, rr = R() * c.s * 0.55;
        const up = R();
        P.push({ x: c.x + Math.cos(a) * rr, y: c.y + up * c.s * 0.45 - c.s * 0.05, z: c.z + Math.sin(a) * rr * 0.8, size: c.s * (0.5 + R() * 0.45) * (1 - up * 0.3), shade: 0.35 + up * 0.65, rot: R() * 6.28 });
      }
    }
    W.clouds.geo.instanceCount = P.length;
    sortClouds(null);
  };
  function sortClouds(cam) {
    const Cl = W.clouds, P = Cl.puffs;
    if (cam) P.forEach((p) => (p.d = (p.x - cam.position.x) ** 2 + (p.y - cam.position.y) ** 2 + (p.z - cam.position.z) ** 2));
    if (cam) P.sort((a, b) => b.d - a.d);
    const g = Cl.geo;
    const ip = g.attributes.iPos.array, is = g.attributes.iSize.array, ish = g.attributes.iShade.array, ir = g.attributes.iRot.array;
    P.forEach((p, i) => { ip[i * 3] = p.x; ip[i * 3 + 1] = p.y; ip[i * 3 + 2] = p.z; is[i] = p.size; ish[i] = p.shade; ir[i] = p.rot; });
    ['iPos', 'iSize', 'iShade', 'iRot'].forEach((k) => (g.attributes[k].needsUpdate = true));
  }

  // ---------- per frame ----------
  let sortT = 0;
  W.update = function (t, dt, cam) {
    U.uTime.value = t;
    updateFlags(t, cam);
    updateBoats(t, dt);
    updateCrowd(t, dt);
    updateBirds(t, dt);
    if (W.sock) W.sock.rotation.set(0, Math.PI / 2 + Math.sin(t * 0.7) * 0.25, -0.15 + Math.sin(t * 2.3) * 0.08);
    sortT -= dt;
    if (sortT < 0) { sortT = 0.25; sortClouds(cam); }
  };
  // the glider's shadow on the ground, cast along the sun
  W.setShadow = function (pos, heading, k) {
    const u = W.terrain.material.uniforms;
    const sd = U.uSunDir.value;
    let x = pos.x, z = pos.z, y = pos.y;
    // march toward the ground along -sun
    for (let i = 0; i < 40; i++) {
      const h = ground(x, z);
      const d = y - Math.max(h, 0);
      if (d < 1) break;
      const step = d / Math.max(0.15, sd.y);
      x -= sd.x * step * 0.9; z -= sd.z * step * 0.9; y -= sd.y * step * 0.9;
    }
    const agl = pos.y - ground(pos.x, pos.z);
    u.uShadow.value.set(x, z, clamp(1 - agl / 500, 0, 1) * 0.7 * (k == null ? 1 : k));
    u.uShadowDir.value.set(Math.cos(heading), -Math.sin(heading));
  };
})();
