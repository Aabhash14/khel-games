// Indra Jatra · painted side-view scenery. Everything is drawn in code: Newar brick houses with carved
// windows, tiered pagodas, the Yosin pole, Majipa Lakhey, the three chariots and Kumari.
let g = null;
  const TAU = Math.PI * 2;

  function use(ctx) { g = ctx; }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function pick(arr, s) { return arr[Math.floor(s * arr.length) % arr.length]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(lerp(a >> 16, b >> 16, t)), gg = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return '#' + ((1 << 24) | (r << 16) | (gg << 8) | bl).toString(16).slice(1);
  }
  function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function poly(pts, c) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fillStyle = c; g.fill(); }
  function circle(x, y, r, c) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); }
  function line(x1, y1, x2, y2, c, w) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
  function ell(x, y, rx, ry, c, rot) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, TAU); g.fillStyle = c; g.fill(); }

  /* ---------- sky & light ---------- */
  const SKIES = [
    ['#7fb6e0', '#cfe3ee', '#f6e6c4'], // day
    ['#33417f', '#c0647a', '#f2a65a'], // dusk
    ['#1a1d48', '#4a2a5a', '#9a4a4a'], // evening
    ['#05060f', '#0f0c22', '#2a1a2e'], // night
  ];
  function sky(W, H, phase) {
    const i = Math.min(2, Math.floor(phase)), f = Math.min(1, phase - i);
    const A = SKIES[i], B = SKIES[Math.min(3, i + 1)];
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, mix(A[0], B[0], f));
    gr.addColorStop(.55, mix(A[1], B[1], f));
    gr.addColorStop(1, mix(A[2], B[2], f));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (phase > 2.2) { // stars
      g.globalAlpha = Math.min(1, (phase - 2.2) * 1.2) * .8;
      for (let k = 0; k < 70; k++) { const x = hash(k * 7 + 1) * W, y = hash(k * 13 + 5) * H * .45; circle(x, y, hash(k) < .15 ? 1.4 : .8, '#fff6dd'); }
      g.globalAlpha = 1;
    }
  }
  function moon(x, y, r) {
    glow(x, y, r * 4, 'rgba(255,240,200,', .25);
    circle(x, y, r, '#fff4d6');
    circle(x - r * .3, y - r * .2, r * .18, 'rgba(200,190,160,.35)');
    circle(x + r * .25, y + r * .3, r * .12, 'rgba(200,190,160,.3)');
  }
  function glow(x, y, r, rgbaPrefix, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgbaPrefix + a + ')');
    gr.addColorStop(1, rgbaPrefix + '0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function stage(W, GY, H, col = '22,12,10', a = 0.88) {
    const top = GY - 80, gr = g.createLinearGradient(0, top, 0, H);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.28, `rgba(${col},${a * 0.55})`); gr.addColorStop(1, `rgba(${col},${a})`);
    g.fillStyle = gr; g.fillRect(0, top, W, H - top);
  }
  function shade(W, H, a, col) { g.fillStyle = col || 'rgba(8,6,20,' + a + ')'; g.fillRect(0, 0, W, H); }

  /* ---------- ground: brick-and-stone paving in perspective ---------- */
  function ground(W, by, H, phase, scroll) {
    const gr = g.createLinearGradient(0, by, 0, H);
    const dark = Math.min(1, phase / 3);
    gr.addColorStop(0, mix('#8c6a52', '#2c2028', dark));
    gr.addColorStop(1, mix('#b48c68', '#3a2a2c', dark));
    g.fillStyle = gr; g.fillRect(0, by, W, H - by);
    g.strokeStyle = 'rgba(40,20,10,.18)'; g.lineWidth = 1;
    g.beginPath();
    let y = by + 3, step = 4;
    while (y < H) { g.moveTo(0, y); g.lineTo(W, y); step *= 1.22; y += step; }
    const off = (scroll || 0) % 40;
    for (let k = -2; k < W / 40 + 3; k++) {
      const x = k * 40 - off;
      g.moveTo(x, by); g.lineTo(W / 2 + (x - W / 2) * 3.2, H);
    }
    g.stroke();
  }

  /* ---------- people ---------- */
  const SKIN = ['#a8704a', '#8e5a3a', '#b98059', '#9c6644', '#7d4c31'];
  const SHIRT = ['#e9e0cc', '#d9cdb2', '#2c4a7a', '#7a2a24', '#3c6b4f', '#c58a2e', '#5b3a6b', '#ececec', '#1f1f2a'];
  const KID = ['#e04a3a', '#2f7fd0', '#f0b72f', '#3aa66a', '#d0569a', '#ffffff'];
  const TOPI = ['#7a1f2a', '#2a2a3a', '#8a5a1a', '#1a4a5a'];

  function person(x, by, h, p) {
    p = p || {};
    const s = p.seed || 1, dir = p.dir || 1, t = p.t || 0;
    const kind = p.kind || pick(['m', 'm', 'w', 'w', 'y', 'k'], hash(s * 3 + 1));
    if (kind === 'k') h *= .66;
    const r = h * .088;
    const hy = by - h + r;
    const neck = hy + r * 1.05;
    const hip = by - h * .47;
    const skin = pick(SKIN, hash(s * 5));
    const bob = p.walk ? Math.abs(Math.sin(t * 6 + s)) * h * .02 : 0;
    const dk = p.shade || 0;
    const C = dk ? (c) => mix(c, '#120a14', dk) : (c) => c;
    g.save(); g.translate(x, -bob);
    g.lineCap = 'round';
    const legW = h * .075;
    const swing = p.walk ? Math.sin(t * 6 + s) * h * .07 : 0;
    // legs
    let legC = kind === 'w' ? '#1b1416' : kind === 'm' ? '#e6dcc4' : pick(['#2a3a5a', '#3a3a3a', '#5a4a3a'], hash(s * 7));
    line(-h * .045, hip, -h * .045 - swing, by - legW * .3, C(legC), legW);
    line(h * .045, hip, h * .045 + swing, by - legW * .3, C(legC), legW);
    // body
    let body;
    if (kind === 'w') {
      // haku patasi: black sari with a red border, worn by Newar women at festivals
      poly([-h * .11, neck + r * .2, h * .11, neck + r * .2, h * .15, by - h * .08, -h * .15, by - h * .08], C('#18110f'));
      rect(-h * .15, by - h * .13, h * .3, h * .05, C('#b3201a'));
      body = '#18110f';
    } else {
      body = kind === 'k' ? pick(KID, hash(s * 11)) : kind === 'm' ? pick(['#e9e0cc', '#d9cdb2', '#efe7d2'], hash(s * 11)) : pick(SHIRT, hash(s * 11));
      poly([-h * .1, neck + r * .2, h * .1, neck + r * .2, h * .12, hip + h * .03, -h * .12, hip + h * .03], C(body));
      if (kind === 'm') { // daura with a coat (istakot)
        poly([-h * .11, neck + r * .3, -h * .02, neck + r * .3, -h * .03, hip, -h * .12, hip], pick([C('#2a2a33'), C('#3a2f24'), C('#22303a')], hash(s * 13)));
        poly([h * .11, neck + r * .3, h * .02, neck + r * .3, h * .03, hip, h * .12, hip], pick([C('#2a2a33'), C('#3a2f24'), C('#22303a')], hash(s * 13)));
      }
    }
    // arms
    const armW = h * .06, sh = neck + r * .5;
    const arm = p.arms || 'down';
    const sleeve = kind === 'w' ? '#18110f' : body;
    function limb(ax, ex, ey) { line(ax, sh, ex, ey, C(sleeve), armW); circle(ex, ey, armW * .55, C(skin)); }
    if (arm === 'up') { const w = Math.sin(t * 8 + s) * h * .04; limb(-h * .09, -h * .2 + w, hy - r * 1.4); limb(h * .09, h * .2 - w, hy - r * 1.4); }
    else if (arm === 'pull') { const q = Math.sin(t * 5 + s) * h * .025; limb(-h * .08, dir * h * .26 + q, sh + h * .09); limb(h * .08, dir * h * .3 + q, sh + h * .06); }
    else if (arm === 'tray') { limb(-h * .08, dir * h * .17, sh + h * .14); limb(h * .08, dir * h * .21, sh + h * .14); }
    else if (arm === 'point') { limb(-h * .09, -h * .12, hip); limb(h * .09, dir * h * .3, sh - h * .05); }
    else { limb(-h * .1, -h * .13, hip - h * .02); limb(h * .1, h * .13, hip - h * .02); }
    // head
    circle(0, hy, r, C(skin));
    const hair = '#1a120e';
    if (kind === 'w') { g.beginPath(); g.arc(0, hy - r * .1, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); g.fillStyle = C(hair); g.fill(); circle(-dir * r * .9, hy - r * .1, r * .45, C(hair)); }
    else if (kind === 'm') {
      // dhaka topi: leaning cap woven in red-black-white patterns
      poly([-r * 1.02, hy - r * .45, r * 1.02, hy - r * .45, r * .9, hy - r * 1.55, -r * .8, hy - r * 1.35], C(pick(TOPI, hash(s * 17))));
      g.fillStyle = 'rgba(255,255,255,.35)';
      for (let k = 0; k < 3; k++) g.fillRect(-r * .7 + k * r * .55, hy - r * 1.05, r * .2, r * .2);
    } else { g.beginPath(); g.arc(0, hy - r * .15, r * 1.02, Math.PI, TAU); g.fillStyle = C(hair); g.fill(); }
    if (p.tika) circle(dir * r * .2, hy - r * .35, r * .16, C('#d0201a'));
    if (p.tray) { // offering tray with lamp
      const tx = dir * h * .2, ty = sh + h * .12;
      ell(tx, ty, h * .1, h * .025, C('#c99a3a'));
      diyo(tx, ty - h * .012, h * .05, true, t);
    }
    g.restore();
  }

  function makeCrowd(n, x0, x1, seed, opts) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const s = seed * 1000 + i;
      out.push({ x: lerp(x0, x1, hash(s * 2 + 1)), z: hash(s * 3 + 7), seed: s, kind: opts && opts.kind });
    }
    return out.sort((a, b) => a.z - b.z);
  }
  function crowd(list, by, h, t, o) {
    o = o || {};
    for (const c of list) {
      const depth = 1 - c.z;
      const y = by - depth * h * .35;
      const hh = h * (1 - depth * .35);
      const shade = o.dark ? Math.min(.8, .3 + depth * .45) : depth * .25;
      person(c.x + (o.dx || 0), y, hh, { seed: c.seed, t, arms: typeof o.arms === 'function' ? o.arms(c) : o.arms, dir: o.dir || (hash(c.seed) < .5 ? -1 : 1), walk: o.walk, kind: c.kind, shade });
    }
  }

  /* ---------- the clay lamp ---------- */
  function diyo(x, y, s, lit, t) {
    if (lit) {
      glow(x, y - s * .9, s * 3.2, 'rgba(255,190,90,', .45);
      const fl = 1 + Math.sin((t || 0) * 13 + x) * .08;
      g.beginPath();
      g.moveTo(x, y - s * 1.6 * fl);
      g.quadraticCurveTo(x + s * .38, y - s * .55, x, y - s * .25);
      g.quadraticCurveTo(x - s * .38, y - s * .55, x, y - s * 1.6 * fl);
      g.fillStyle = '#ffd36a'; g.fill();
      ell(x, y - s * .55, s * .12, s * .25, '#fff6d0');
    }
    g.beginPath(); g.moveTo(x - s * .7, y - s * .3); g.quadraticCurveTo(x, y + s * .55, x + s * .7, y - s * .3); g.closePath();
    g.fillStyle = '#a0522d'; g.fill();
  }

  /* ---------- Newar architecture ---------- */
  const BRICK = ['#8a3a22', '#94452a', '#7d3320', '#9b4b2e', '#86402a'];
  function lattice(x, y, w, h, wood, night, lit) {
    rect(x - w * .08, y - h * .08, w * 1.16, h * 1.16, wood);
    rect(x, y, w, h, lit && night ? 'rgba(255,170,70,.85)' : '#1a0d08');
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.strokeStyle = mix(wood, '#e0b070', .25); g.lineWidth = Math.max(1, w * .07);
    g.beginPath();
    const step = Math.max(4, w / 4);
    for (let k = -h; k < w + h; k += step) { g.moveTo(x + k, y); g.lineTo(x + k + h, y + h); g.moveTo(x + k + h, y); g.lineTo(x + k, y + h); }
    g.stroke(); g.restore();
  }
  function eave(x, y, w, d, col) {
    poly([x - d, y, x + w + d, y, x + w + d * .55, y - d * .9, x - d * .55, y - d * .9], col || '#3b2a22');
    line(x - d, y, x + w + d, y, '#5a3a2a', 2);
  }

  function house(x, by, w, h, seed, phase) {
    const night = phase > 1.6;
    const brick = pick(BRICK, hash(seed));
    const wood = pick(['#3d1f0e', '#4a2612', '#33190b'], hash(seed * 3));
    const dim = Math.min(.7, Math.max(0, (phase - 1) * .32));
    rect(x, by - h, w, h, brick);
    // brick courses
    g.strokeStyle = 'rgba(40,10,0,.22)'; g.lineWidth = 1; g.beginPath();
    for (let y = by - h + 3; y < by; y += 4) { g.moveTo(x, y); g.lineTo(x + w, y); }
    g.stroke();
    const f = [0, .27, .52, .76, 1].map((k) => by - h * k);
    // ground floor: shop shutters or a doorway
    const shop = hash(seed * 5) < .6;
    if (shop) {
      const n = w > 70 ? 3 : 2, pw = w * .8 / n;
      for (let i = 0; i < n; i++) {
        const sx = x + w * .1 + i * pw;
        const open = night && hash(seed * 7 + i) < .5;
        rect(sx + 2, f[1] + h * .04, pw - 4, f[0] - f[1] - h * .04, open ? '#ffb04a' : wood);
        if (!open) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); for (let k = 1; k < 4; k++) { g.moveTo(sx + 2 + (pw - 4) * k / 4, f[1] + h * .04); g.lineTo(sx + 2 + (pw - 4) * k / 4, f[0]); } g.stroke(); }
      }
    } else {
      const dw = w * .26;
      rect(x + w / 2 - dw / 2, f[1] + h * .06, dw, f[0] - f[1] - h * .06, wood);
      rect(x + w / 2 - dw * .35, f[1] + h * .09, dw * .7, f[0] - f[1] - h * .09, '#150a06');
      g.beginPath(); g.arc(x + w / 2, f[1] + h * .07, dw * .6, Math.PI, TAU); g.fillStyle = '#c99a3a'; g.fill(); // torana over the door
    }
    // first floor: a row of small sanjhyal windows
    const n1 = w > 70 ? 3 : 2;
    for (let i = 0; i < n1; i++) {
      const ww = w * .16, wx = x + w * (i + .5) / n1 - ww / 2;
      lattice(wx, f[2] + h * .05, ww, h * .13, wood, night, hash(seed * 11 + i) < .55);
    }
    // second floor: the big carved window (ankhijhyal) or a balcony window
    if (hash(seed * 13) < .5) {
      const ww = w * .5;
      lattice(x + w / 2 - ww / 2, f[3] + h * .04, ww, h * .16, wood, night, hash(seed * 17) < .6);
      rect(x + w / 2 - ww * .62, f[2] - h * .015, ww * 1.24, h * .03, wood);
    } else {
      for (let i = 0; i < 3; i++) {
        const ww = w * .14, wx = x + w * (i + .5) / 3 - ww / 2;
        lattice(wx, f[3] + h * .05, ww, h * .15, wood, night, hash(seed * 19 + i) < .5);
      }
    }
    // top floor
    lattice(x + w / 2 - w * .1, f[4] + h * .07, w * .2, h * .1, wood, night, hash(seed * 23) < .4);
    eave(x, f[4] + h * .02, w, w * .1, '#3a2a24');
    // struts under the eave
    g.strokeStyle = wood; g.lineWidth = Math.max(1.5, w * .025); g.beginPath();
    for (let k = 0; k < 5; k++) { const sx = x + w * k / 4; g.moveTo(sx, f[3] - h * .01); g.lineTo(sx + (k < 2 ? -1 : k > 2 ? 1 : 0) * w * .06, f[4] + h * .02); }
    g.stroke();
    if (dim) { rect(x, by - h - w * .1, w, h + w * .1, 'rgba(10,6,24,' + dim + ')'); }
    if (night) { // glowing windows punch back through the shade
      g.globalCompositeOperation = 'lighter';
      glow(x + w / 2, f[3] + h * .1, w * .5, 'rgba(255,150,60,', .16);
      g.globalCompositeOperation = 'source-over';
    }
  }

  function street(W, by, seed, phase, scroll, scale) {
    const base = 92 * scale;
    let x = -(scroll || 0);
    let i = 0;
    while (x < W + base) {
      const s = seed * 100 + i;
      const w = base * (.8 + hash(s) * .55);
      const h = base * (1.9 + hash(s * 3) * .9);
      if (x + w > -base) house(x, by, w, h, s, phase);
      x += w; i++;
    }
  }

  function roof(cx, y, wBot, wTop, h, col, edge) {
    poly([cx - wBot / 2, y, cx + wBot / 2, y, cx + wTop / 2, y - h, cx - wTop / 2, y - h], col);
    line(cx - wBot / 2, y, cx + wBot / 2, y, edge || '#f2cf72', Math.max(1.5, h * .08));
  }
  function gajur(cx, y, s) {
    circle(cx, y - s * .4, s * .5, '#e3b23c');
    poly([cx - s * .35, y - s * .7, cx + s * .35, y - s * .7, cx, y - s * 2.2], '#e3b23c');
    circle(cx, y - s * 2.2, s * .18, '#fff0a8');
  }
  // A tiered Newar pagoda: stepped brick plinth, brick sanctum, tiled or gilded roofs, gilded finial.
  function pagoda(cx, by, w, tiers, o) {
    o = o || {};
    const steps = o.steps || 3;
    let y = by;
    for (let i = 0; i < steps; i++) {
      const sw = w * (1.7 - i * (.5 / steps)), sh = w * .07;
      rect(cx - sw / 2, y - sh, sw, sh, i % 2 ? '#8a3f26' : '#9c4c2f');
      line(cx - sw / 2, y - sh, cx + sw / 2, y - sh, 'rgba(255,220,180,.25)', 1);
      y -= sh;
    }
    const gold = o.gold;
    for (let k = 0; k < tiers; k++) {
      const bw = w * (1 - k * .24), bh = w * (k === 0 ? .44 : .2);
      rect(cx - bw / 2, y - bh, bw, bh, k === 0 ? (o.white ? '#efe9dc' : '#8f3d24') : '#5a2a18');
      if (k === 0) {
        const dw = bw * .22;
        rect(cx - dw / 2, y - bh * .82, dw, bh * .82, '#3d1f0e');
        rect(cx - dw * .3, y - bh * .7, dw * .6, bh * .7, '#120804');
        rect(cx - bw * .36, y - bh * .7, bw * .08, bh * .55, '#3d1f0e');
        rect(cx + bw * .28, y - bh * .7, bw * .08, bh * .55, '#3d1f0e');
      }
      y -= bh;
      const rh = w * .2 * (1 - k * .1);
      roof(cx, y, bw * 1.62, bw * .6, rh, (gold && (gold === 'all' || k === tiers - 1)) ? '#c99a2e' : '#3e2b22', gold ? '#ffe08a' : '#c99a5a');
      // struts
      g.strokeStyle = '#2b1408'; g.lineWidth = Math.max(1, w * .02); g.beginPath();
      for (let s = 0; s < 4; s++) { const sx = cx - bw / 2 + bw * s / 3; g.moveTo(sx, y + bh * .1); g.lineTo(sx + (sx < cx ? -1 : 1) * bw * .12, y - rh * .15); }
      g.stroke();
      y -= rh * .55;
    }
    gajur(cx, y, w * .09);
    return y;
  }

  // Hanuman Dhoka: the palace's white Gaddi Baithak wing and pagodas behind.
  function durbar(W, by, scale, phase) {
    const s = scale;
    pagoda(W * .14, by - 40 * s, 120 * s, 3, { gold: 'top' });
    pagoda(W * .86, by - 30 * s, 110 * s, 3, { gold: 'top', steps: 5 });
    pagoda(W * .5, by - 70 * s, 90 * s, 3, { gold: 'all', steps: 4 }); // Taleju rising behind
    // Gaddi Baithak: white, colonnaded
    const gw = Math.min(W * .62, 330 * s), gx = W * .5 - gw / 2, gh = 92 * s;
    rect(gx, by - gh, gw, gh, '#ece6d8');
    rect(gx - 6 * s, by - gh - 8 * s, gw + 12 * s, 9 * s, '#d8d0bf');
    poly([gx + gw * .3, by - gh - 8 * s, gx + gw * .7, by - gh - 8 * s, gx + gw * .5, by - gh - 30 * s], '#e4ddcc');
    for (let i = 0; i <= 8; i++) { const px = gx + gw * (i / 8); rect(px - 3 * s, by - gh + 10 * s, 6 * s, gh - 10 * s, '#fbf8f0'); }
    for (let i = 0; i < 8; i++) rect(gx + gw * ((i + .3) / 8), by - gh + 18 * s, gw / 8 * .4, gh * .5, '#38302a');
    if (phase > 1.5) shade(W, by, Math.min(.55, (phase - 1.5) * .35));
  }

  /* ---------- the Yosin pole and Indra's flag ---------- */
  function pole(bx, by, L, rise, lean, t, wind) {
    // True 3D: the pole lies across the ground and swings up to vertical.
    // L is the on-screen height of the standing pole. lean tips it sideways.
    const PL = 14, Zb = 22, camH = 1.6, f = L * Zb / PL, R = rise * Math.PI / 180, a = lean / 100 * .42;
    const hy = by - camH * f / Zb;
    const phi = .5; // lies across the square, angled slightly toward the viewer
    const dx = Math.cos(phi) * Math.cos(R) + Math.sin(a) * Math.sin(R), dy = Math.cos(a) * Math.sin(R), dz = -Math.sin(phi) * Math.cos(R);
    function P(k) { const s = k * PL, Z = Zb + dz * s; return { x: bx + dx * s * f / Z, y: hy + (camH - dy * s) * f / Z, sc: f / Z }; }
    const N = 14, pts = [];
    for (let i = 0; i <= N; i++) pts.push(P(i / N));
    const rad = (k) => lerp(.22, .1, k);
    // body as a strip of quads, perpendicular to the screen direction
    const left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(N, i + 1)];
      let ex = p1.x - p0.x, ey = p1.y - p0.y; const el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el;
      const w = rad(i / N) * pts[i].sc;
      left.push(pts[i].x - ey * w, pts[i].y + ex * w); right.push(pts[i].x + ey * w, pts[i].y - ex * w);
    }
    const body = []; for (let i = 0; i <= N; i++) body.push(left[i * 2], left[i * 2 + 1]);
    for (let i = N; i >= 0; i--) body.push(right[i * 2], right[i * 2 + 1]);
    poly(body, '#7a4a26');
    g.save(); g.globalAlpha = .4;
    const hi = []; for (let i = 0; i <= N; i++) hi.push(lerp(pts[i].x, left[i * 2], .55), lerp(pts[i].y, left[i * 2 + 1], .55));
    for (let i = N; i >= 0; i--) hi.push(pts[i].x, pts[i].y);
    poly(hi, '#c08a54'); g.restore();
    g.strokeStyle = 'rgba(40,20,8,.45)'; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < N; i++) { g.moveTo(left[i * 2], left[i * 2 + 1]); g.lineTo(right[i * 2], right[i * 2 + 1]); }
    g.stroke();
    // crossbar and the two long Indradhwaja banners hanging along the pole
    const top = P(1), cb = P(.95), below = P(.5);
    let ux = top.x - below.x, uy = top.y - below.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const px = -uy, py = ux, cw = .9 * cb.sc;
    line(cb.x - px * cw, cb.y - py * cw, cb.x + px * cw, cb.y + py * cw, '#5a3416', Math.max(2, .12 * cb.sc));
    const open = Math.sin(R), flap = (wind || 0) * .02 * open;
    for (let side = -1; side <= 1; side += 2) {
      const segs = 12, A1 = [], A2 = [];
      for (let k = 0; k <= segs; k++) {
        const fk = k / segs, q = P(.95 - fk * .42);
        const wv = (Math.sin(t * 4 - fk * 5 + side) * .25 * fk + flap * fk * fk * 6) * q.sc;
        const ox = q.x + side * px * cw * .8 + px * wv, oy = q.y + side * py * cw * .8 + py * wv;
        const bw = .16 * q.sc;
        A1.push(ox - px * bw, oy - py * bw); A2.push(ox + px * bw, oy + py * bw);
      }
      const shape = A1.slice(); for (let k = segs; k >= 0; k--) shape.push(A2[k * 2], A2[k * 2 + 1]);
      poly(shape, side < 0 ? '#f4d24a' : '#f8f3e2');
      g.strokeStyle = '#b3201a'; g.lineWidth = Math.max(1, .04 * cb.sc); g.stroke();
    }
    circle(top.x, top.y, .2 * top.sc, '#e3b23c');
    poly([top.x - px * .15 * top.sc, top.y - py * .15 * top.sc, top.x + px * .15 * top.sc, top.y + py * .15 * top.sc, top.x + ux * .6 * top.sc, top.y + uy * .6 * top.sc], '#e3b23c');
    const mid = P(.62);
    return { tx: top.x, ty: top.y, mx: mid.x, my: mid.y };
  }

  function rope(x1, y1, x2, y2, slack) {
    g.beginPath(); g.moveTo(x1, y1);
    g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + slack, x2, y2);
    g.strokeStyle = '#c9a26a'; g.lineWidth = 2.2; g.stroke();
    g.strokeStyle = 'rgba(80,50,20,.5)'; g.lineWidth = .8; g.stroke();
  }

  function pennant(x, by, h, wind, t) {
    line(x, by, x, by - h, '#8a6a3a', Math.max(2, h * .03));
    const dir = Math.sign(wind) || 1, len = h * (.2 + Math.min(1, Math.abs(wind) / 22) * .5);
    const droop = h * (.22 - Math.min(1, Math.abs(wind) / 22) * .18);
    g.beginPath(); g.moveTo(x, by - h);
    for (let k = 0; k <= 8; k++) { const f = k / 8; g.lineTo(x + dir * len * f, by - h + droop * f + Math.sin(t * (4 + Math.abs(wind) * .3) - f * 4) * h * .025 * f); }
    g.lineTo(x, by - h + h * .14);
    g.closePath(); g.fillStyle = '#b3201a'; g.fill();
  }

  /* ---------- Majipa Lakhey ---------- */
  function lakhey(x, by, h, t, mode, lookDir) {
    let sway = Math.sin(t * 2.4) * .12, bounce = 0, fwd = 0;
    if (mode === 'eye') { sway = Math.sin(t * .8) * .02; fwd = .06; }
    if (mode === 'stamp') { sway = Math.sin(t * 9) * .04; bounce = Math.abs(Math.sin(t * 10)) * h * .025; }
    if (mode === 'lunge') { sway = 0; fwd = .32; }
    if (mode === 'spin') { sway = 0; }
    const spin = mode === 'spin' ? Math.cos(t * 9) : 1;
    g.save();
    g.translate(x, by - bounce);
    g.rotate(sway - lookDir * fwd);
    g.scale(spin, 1);
    const legW = h * .055;
    // legs with ankle bells
    for (const sx of [-1, 1]) {
      const kick = mode === 'stamp' && sx === (Math.sin(t * 10) > 0 ? 1 : -1) ? -h * .04 : 0;
      line(sx * h * .05, -h * .42, sx * h * .07, -legW * .4 + kick, '#b3201a', legW);
      for (let k = 0; k < 4; k++) circle(sx * h * .07 + (k - 1.5) * legW * .4, -legW * .9 + kick, legW * .22, '#e8c24a');
    }
    // layered skirt
    const skirt = [['#c62d1f', .5], ['#e9b52f', .42], ['#2d6e3e', .34], ['#c62d1f', .28]];
    skirt.forEach(([c, lvl], i) => {
      const yb = -h * (lvl - .1), wb = h * (.24 - i * .025) + Math.sin(t * 2.4 + i) * h * .01;
      poly([-h * .11, -h * (lvl + .09), h * .11, -h * (lvl + .09), wb, yb, -wb, yb], c);
      g.strokeStyle = 'rgba(255,240,200,.35)'; g.lineWidth = 1; g.beginPath();
      for (let k = -4; k <= 4; k++) { g.moveTo(k * wb / 4.5, yb); g.lineTo(k * wb / 4.5, yb - h * .03); }
      g.stroke();
    });
    // torso
    poly([-h * .1, -h * .72, h * .1, -h * .72, h * .12, -h * .55, -h * .12, -h * .55], '#7d1610');
    rect(-h * .12, -h * .58, h * .24, h * .035, '#f1e8d0'); // sash
    line(0, -h * .72, 0, -h * .58, '#e8c24a', 2);
    // arms: out wide, hands turning with the dance
    const aw = h * .05, armWave = mode === 'eye' ? 0 : Math.sin(t * 2.4 + 1) * h * .06;
    for (const sx of [-1, 1]) {
      const reach = mode === 'lunge' && sx === lookDir ? h * .36 : h * .27;
      const ex = sx * reach, ey = -h * .7 + (sx > 0 ? armWave : -armWave) - (mode === 'lunge' ? h * .03 : 0);
      line(sx * h * .09, -h * .7, sx * h * .2, -h * .62 + (sx > 0 ? armWave : -armWave) * .5, '#7d1610', aw);
      line(sx * h * .2, -h * .62 + (sx > 0 ? armWave : -armWave) * .5, ex, ey, '#7d1610', aw * .9);
      circle(ex, ey, aw * .6, '#c4231b');
      for (let k = 0; k < 3; k++) circle(sx * h * .2 + (ex - sx * h * .2) * .55, ey + h * .03 + k * 2, aw * .2, '#e8c24a');
    }
    // mane: long hair falling from the crown to the waist
    const mane = ['#2b0d07', '#4a1208', '#1a0704', '#5e1a0c'];
    g.lineCap = 'round';
    for (let k = 0; k < 34; k++) {
      const f = k / 33, side = f < .5 ? -1 : 1;
      const ox = (f - .5) * h * .34, oy = -h * .94;
      const len = h * (.34 + hash(k * 7) * .16);
      const sw = Math.sin(t * 2.4 + k * .3) * h * .05 + sway * h * .4;
      g.beginPath(); g.moveTo(ox * .6, oy);
      g.quadraticCurveTo(ox * 1.5 + side * h * .06, oy + len * .45, ox * 1.25 + side * h * .05 + sw, oy + len);
      g.strokeStyle = mane[k % 4]; g.lineWidth = h * .018; g.stroke();
    }
    // mask
    const mw = h * .26, mh = h * .27, my = -h * .86;
    // crown
    poly([-mw * .55, my - mh * .38, mw * .55, my - mh * .38, mw * .5, my - mh * .62, -mw * .5, my - mh * .62], '#e3b23c');
    for (let k = -2; k <= 2; k++) {
      const px = k * mw * .22;
      poly([px - mw * .1, my - mh * .6, px + mw * .1, my - mh * .6, px, my - mh * (.92 - Math.abs(k) * .06)], '#e3b23c');
      circle(px, my - mh * .68, mw * .045, k % 2 ? '#2f7fd0' : '#c62d1f');
    }
    // ears
    for (const sx of [-1, 1]) { ell(sx * mw * .55, my, mw * .12, mh * .2, '#b81f15'); circle(sx * mw * .6, my + mh * .18, mw * .07, '#e3b23c'); }
    // face
    g.beginPath();
    g.moveTo(-mw * .5, my - mh * .4);
    g.quadraticCurveTo(0, my - mh * .5, mw * .5, my - mh * .4);
    g.quadraticCurveTo(mw * .62, my + mh * .1, mw * .38, my + mh * .45);
    g.quadraticCurveTo(0, my + mh * .6, -mw * .38, my + mh * .45);
    g.quadraticCurveTo(-mw * .62, my + mh * .1, -mw * .5, my - mh * .4);
    g.fillStyle = '#d12b1d'; g.fill();
    g.strokeStyle = '#7d1610'; g.lineWidth = 1.5; g.stroke();
    ell(-mw * .28, my + mh * .16, mw * .13, mh * .09, 'rgba(255,120,90,.35)');
    ell(mw * .28, my + mh * .16, mw * .13, mh * .09, 'rgba(255,120,90,.35)');
    // brows like flames
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(sx * mw * .06, my - mh * .12);
      g.quadraticCurveTo(sx * mw * .25, my - mh * .38, sx * mw * .48, my - mh * .22);
      g.quadraticCurveTo(sx * mw * .3, my - mh * .22, sx * mw * .06, my - mh * .12);
      g.fillStyle = '#140805'; g.fill();
    }
    // bulging eyes
    const look = (mode === 'eye' || mode === 'lunge') ? lookDir * mw * .05 : Math.sin(t * 1.3) * mw * .03;
    for (const sx of [-1, 1]) {
      circle(sx * mw * .22, my - mh * .04, mw * .13, '#e3b23c');
      circle(sx * mw * .22, my - mh * .04, mw * .105, '#fffbea');
      circle(sx * mw * .22 + look, my - mh * .03, mw * (mode === 'eye' ? .045 : .06), '#120804');
    }
    circle(0, my - mh * .3, mw * .05, '#e3b23c'); // third-eye jewel
    // nose
    ell(0, my + mh * .1, mw * .12, mh * .08, '#a81c12');
    circle(-mw * .07, my + mh * .13, mw * .03, '#3a0a05'); circle(mw * .07, my + mh * .13, mw * .03, '#3a0a05');
    // mustache
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(0, my + mh * .2); g.quadraticCurveTo(sx * mw * .3, my + mh * .16, sx * mw * .38, my + mh * .04);
      g.strokeStyle = '#140805'; g.lineWidth = mw * .05; g.stroke();
    }
    // the grin: teeth and four fangs
    const open = mode === 'lunge' || mode === 'stamp' ? 1.3 : 1;
    g.beginPath(); g.moveTo(-mw * .3, my + mh * .25);
    g.quadraticCurveTo(0, my + mh * (.25 + .3 * open), mw * .3, my + mh * .25);
    g.quadraticCurveTo(0, my + mh * .3, -mw * .3, my + mh * .25);
    g.fillStyle = '#3a0805'; g.fill();
    rect(-mw * .22, my + mh * .25, mw * .44, mh * .05, '#fffbea');
    for (const sx of [-1, 1]) {
      poly([sx * mw * .2, my + mh * .25, sx * mw * .13, my + mh * .25, sx * mw * .17, my + mh * (.42 + .05 * open)], '#fffbea');
      poly([sx * mw * .08, my + mh * (.35 + .12 * open), sx * mw * .02, my + mh * (.35 + .12 * open), sx * mw * .05, my + mh * .25], '#fffbea');
    }
    g.restore();
  }

  /* ---------- chariots ---------- */
  function wheel(x, y, r, t, roll) {
    circle(x, y, r, '#3a1c0c');
    circle(x, y, r * .86, '#6a3a1c');
    g.strokeStyle = '#2a1408'; g.lineWidth = Math.max(2, r * .09); g.beginPath();
    const a0 = roll || 0;
    for (let k = 0; k < 8; k++) { const a = a0 + k * TAU / 8; g.moveTo(x + Math.cos(a) * r * .2, y + Math.sin(a) * r * .2); g.lineTo(x + Math.cos(a) * r * .84, y + Math.sin(a) * r * .84); }
    g.stroke();
    g.beginPath(); g.arc(x, y, r * .94, 0, TAU); g.strokeStyle = '#b3201a'; g.lineWidth = r * .08; g.stroke();
    circle(x, y, r * .2, '#e3b23c');
  }
  function kumari(x, y, s, t) {
    // seated Kumari: red dress, gold ornaments, hair in a topknot, kohl-winged eyes and the fire eye on her forehead
    poly([x - s * .5, y, x + s * .5, y, x + s * .32, y - s * .85, x - s * .32, y - s * .85], '#c4231b');
    rect(x - s * .5, y - s * .1, s, s * .1, '#e3b23c');
    ell(x, y - s * .75, s * .28, s * .08, '#e3b23c'); // necklace
    circle(x, y - s * 1.08, s * .26, '#b37a55');
    g.beginPath(); g.arc(x, y - s * 1.12, s * .27, Math.PI, TAU); g.fillStyle = '#140a06'; g.fill();
    circle(x, y - s * 1.42, s * .13, '#140a06'); // topknot
    poly([x - s * .3, y - s * 1.26, x + s * .3, y - s * 1.26, x + s * .2, y - s * 1.55, x - s * .2, y - s * 1.55], '#e3b23c'); // crown
    circle(x, y - s * 1.52, s * .06, '#c4231b');
    for (const sx of [-1, 1]) { line(x + sx * s * .05, y - s * 1.08, x + sx * s * .2, y - s * 1.1, '#120804', s * .05); }
    poly([x - s * .045, y - s * 1.17, x + s * .045, y - s * 1.17, x, y - s * 1.3], '#e3b23c'); // agni chakshu, the fire eye
    circle(x, y - s * 1.2, s * .03, '#c4231b');
    circle(x, y - s * .94, s * .03, '#a81c12');
  }
  function rath(x, by, h, t, kind, roll) {
    const big = kind === 'kumari';
    const w = h * (big ? .62 : .5), r = h * .12;
    const deckY = by - r * 1.9;
    // front beam, reaching forward where the rope crews take hold
    g.beginPath(); g.moveTo(x + w * .3, deckY - h * .015);
    g.quadraticCurveTo(x + w * .3 + h * .42, deckY - h * .01, x + w * .3 + h * .52, deckY - h * .12);
    g.strokeStyle = '#3d1f0e'; g.lineWidth = h * .035; g.stroke();
    circle(x + w * .3 + h * .52, deckY - h * .12, h * .025, '#e3b23c');
    // wheels and deck
    wheel(x - w * .3, by - r, r, t, roll);
    wheel(x + w * .3, by - r, r, t, roll);
    rect(x - w * .55, deckY - h * .06, w * 1.1, h * .07, '#4a2612');
    rect(x - w * .55, deckY - h * .06, w * 1.1, h * .015, '#e3b23c');
    // shrine body: carved posts, red curtains, a gilded torana over the opening
    const bodyTop = deckY - h * .06 - h * .25;
    rect(x - w * .42, bodyTop, w * .84, h * .25, '#5a2f15');
    rect(x - w * .3, bodyTop + h * .04, w * .6, h * .21, '#22100a');
    for (const sx of [-1, 1]) {
      rect(x + sx * w * .36 - h * .012, bodyTop, h * .024, h * .25, '#e3b23c');
      poly([x + sx * w * .3, bodyTop + h * .04, x + sx * w * .19, bodyTop + h * .04, x + sx * w * .27, bodyTop + h * .25, x + sx * w * .3, bodyTop + h * .25], '#b3201a');
    }
    g.beginPath(); g.arc(x, bodyTop + h * .06, w * .28, Math.PI, TAU); g.fillStyle = '#e3b23c'; g.fill();
    g.beginPath(); g.arc(x, bodyTop + h * .06, w * .2, Math.PI, TAU); g.fillStyle = '#22100a'; g.fill();
    // who rides
    if (big) kumari(x, deckY - h * .07, h * .11, t);
    else if (kind === 'bhairav') {
      circle(x, deckY - h * .16, h * .07, '#24346e');
      poly([x - h * .07, deckY - h * .2, x + h * .07, deckY - h * .2, x, deckY - h * .3], '#e3b23c');
      circle(x - h * .025, deckY - h * .17, h * .012, '#fff'); circle(x + h * .025, deckY - h * .17, h * .012, '#fff');
    } else {
      circle(x, deckY - h * .16, h * .07, '#e07a2e');
      line(x, deckY - h * .14, x + h * .03, deckY - h * .08, '#e07a2e', h * .03);
    }
    // tiered gilded roofs
    let y = bodyTop;
    const tiers = big ? 3 : 2;
    for (let k = 0; k < tiers; k++) {
      const rw = w * (1.3 - k * .32), rh = h * (.1 - k * .012);
      roof(x, y, rw, rw * .42, rh, '#c99a2e', '#ffe08a');
      // bells along the eave
      for (let b = 0; b < 7; b++) circle(x - rw / 2 + rw * b / 6, y + h * .012, h * .007, '#ffe08a');
      y -= rh;
      if (k < tiers - 1) { rect(x - w * .16 * (1 - k * .3), y - h * .05, w * .32 * (1 - k * .3), h * .05, '#5a2f15'); y -= h * .05; }
    }
    gajur(x, y, h * .035);
    const topY = y - h * .08;
    // long pataka banners hanging from the top
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(x + sx * w * .08, y);
      for (let k = 1; k <= 8; k++) g.lineTo(x + sx * (w * .08 + k * w * .02) + Math.sin(t * 3 + k * .6) * h * .01, y + k * h * .05);
      g.strokeStyle = sx < 0 ? '#f4d24a' : '#b3201a'; g.lineWidth = h * .02; g.stroke();
    }
    return { front: x + w * .3 + h * .52, ropeY: deckY - h * .12, topY, w };
  }

  /* ---------- shrines for the Upaku walk ---------- */
  function chaitya(cx, by, s) {
    rect(cx - s * .6, by - s * .2, s * 1.2, s * .2, '#9a9286');
    rect(cx - s * .45, by - s * .45, s * .9, s * .25, '#b0a898');
    g.beginPath(); g.arc(cx, by - s * .45, s * .4, Math.PI, TAU); g.fillStyle = '#c8c0b0'; g.fill();
    rect(cx - s * .15, by - s * 1.05, s * .3, s * .2, '#b0a898');
    poly([cx - s * .14, by - s * 1.05, cx + s * .14, by - s * 1.05, cx, by - s * 1.5], '#a89e8e');
  }
  function bhairavMask(cx, cy, s, kind) {
    const face = kind === 'akash' ? '#2a4aa8' : '#e8c460';
    const dark = kind === 'akash' ? '#16286a' : '#a6801e';
    // crown of five points
    for (let k = -2; k <= 2; k++) poly([cx + k * s * .2 - s * .1, cy - s * .45, cx + k * s * .2 + s * .1, cy - s * .45, cx + k * s * .2, cy - s * (.8 - Math.abs(k) * .06)], '#e3b23c');
    rect(cx - s * .5, cy - s * .5, s, s * .1, '#e3b23c');
    ell(cx, cy, s * .46, s * .48, face);
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(cx + sx * s * .05, cy - s * .16); g.quadraticCurveTo(cx + sx * s * .25, cy - s * .38, cx + sx * s * .42, cy - s * .2); g.strokeStyle = '#120804'; g.lineWidth = s * .06; g.stroke();
      circle(cx + sx * s * .19, cy - s * .08, s * .1, '#fffbea');
      circle(cx + sx * s * .19, cy - s * .07, s * .05, '#120804');
    }
    poly([cx - s * .04, cy - s * .32, cx + s * .04, cy - s * .32, cx, cy - s * .22], '#c4231b');
    ell(cx, cy + s * .08, s * .1, s * .06, dark);
    g.beginPath(); g.moveTo(cx - s * .26, cy + s * .2); g.quadraticCurveTo(cx, cy + s * .48, cx + s * .26, cy + s * .2); g.quadraticCurveTo(cx, cy + s * .26, cx - s * .26, cy + s * .2); g.fillStyle = '#5a0a05'; g.fill();
    for (const sx of [-1, 1]) poly([cx + sx * s * .18, cy + s * .22, cx + sx * s * .12, cy + s * .22, cx + sx * s * .15, cy + s * .36], '#fffbea');
  }
  function shrine(type, cx, by, s, t) {
    if (type === 'ganesh') { pagoda(cx, by, s * .8, 2, { gold: 'all', steps: 2 }); }
    else if (type === 'jaisi') { pagoda(cx, by, s, 3, { steps: 6 }); }
    else if (type === 'lagan') { chaitya(cx - s * .5, by, s * .7); chaitya(cx + s * .5, by, s * .55); }
    else if (type === 'akash') {
      rect(cx - s * .9, by - s * 1.5, s * 1.8, s * 1.5, '#8f3d24');
      lattice(cx - s * .6, by - s * 1.25, s * 1.2, s * .3, '#3d1f0e', true, true);
      eave(cx - s * .9, by - s * 1.5, s * 1.8, s * .2);
      rect(cx - s * .5, by - s * .55, s, s * .55, '#3d1f0e');
      bhairavMask(cx, by - s * .9, s * .7, 'akash');
    } else if (type === 'jana') {
      pagoda(cx, by, s * .85, 2, { gold: 'all', white: true, steps: 3 });
      for (let k = 0; k < 9; k++) { const px = cx - s + hash(k * 5) * s * 2, py = by - hash(k * 9) * s * .1; ell(px, py - 3, 4, 3, '#8a8a96'); circle(px + 3, py - 5, 2, '#6a6a76'); }
    } else if (type === 'annapurna') { pagoda(cx, by, s * .9, 3, { gold: 'all', steps: 3 }); }
  }

export const ART = { use, stage, hash, mix, lerp, rect, poly, circle, line, ell, sky, moon, glow, shade, ground, person, makeCrowd, crowd, diyo, house, street, pagoda, durbar, pole, rope, pennant, lakhey, rath, wheel, kumari, shrine, bhairavMask, chaitya, lattice };
