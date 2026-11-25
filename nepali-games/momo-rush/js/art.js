// Momo Rush art: a Kathmandu street stall at dusk, drawn in canvas. No image files.
// Coordinates are "column units": the playfield is 400 wide; backgrounds bleed past it on wide screens.
(function () {
  const MR = (window.MR = window.MR || {});
  const A = (MR.art = {});

  const C = A.C = {
    sky0: '#121638', sky1: '#2c2a5c', sky2: '#7d4569', sky3: '#e48a4b',
    bldg: '#1d1c35', bldg2: '#27243f', win: '#ffcf7a',
    tarpB: '#1f6fd1', tarpB2: '#1857a8', tarpO: '#f07a1a', tarpO2: '#c45d0e',
    bulb: '#ffd27a', sign: '#f6c343', signInk: '#c8261b', signEdge: '#7a2a12',
    street: '#191a2b', steel: '#c3cbd2', steel2: '#8d97a1', steelHi: '#eef2f5',
    wood: '#4a2c1d', wood2: '#5b3825', board: '#c58d52', dough: '#f6ead6', momo: '#f3e3c6',
    achar: '#d8321e', clay: '#8a4a2a', jhol: '#e0782a', tawa: '#262428',
    buff: '#8a3a26', chicken: '#e3a548', veg: '#4f9a3e', ink: '#1b1430', paper: '#fff4e2',
    raw: '#9aa3ad', done: '#5fb85a', gold: '#ffc83a', soggy: '#e88a3a', burnt: '#2a1a14',
  };
  const FILL_COL = { buff: C.buff, chicken: C.chicken, veg: C.veg, any: '#7a6ab8' };

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  A.rr = rr;
  // per-frame gradients are cached by shape and position: fewer canvas objects for the GC to sweep mid-rush
  const GRAD = new Map();
  function cg(key, make) {
    let g = GRAD.get(key);
    if (!g) { if (GRAD.size > 240) GRAD.clear(); g = make(); GRAD.set(key, g); }
    return g;
  }
  const q2 = (v) => Math.round(v * 2) / 2;
  const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); };
  function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------- layout ----------
  A.layout = function (cw, ch, nTiers, opts) {
    opts = opts || {};
    let s = cw / 400; let H = ch / s; let W = 400; let ox = 0;
    if (H < 660) { s = ch / 660; H = 660; W = cw / s; ox = (W - 400) / 2; }
    if (H > 900) H = 900;
    const cTop = H - 392; const wTop = cTop + 92;
    const L = { s, W, H, ox, cTop, wTop, roof: 64, street: cTop - (H >= 760 ? 74 : 48) };
    L.slots = [72, 200, 328].map((x) => ({ x, y: cTop }));
    L.achar = { x: 36, y: cTop + 46, r: 27 };
    L.pass = [106, 168, 230, 292].map((x) => ({ x, y: cTop + 46, r: 27 }));
    L.jhol = { x: 362, y: cTop + 46, r: 28, on: !!opts.jhol };
    const fills = opts.fills || ['buff', 'chicken', 'veg'];
    L.bowls = {};
    const ys = fills.length === 2 ? [wTop + 72, wTop + 196] : [wTop + 52, wTop + 148, wTop + 244];
    fills.forEach((f, i) => { L.bowls[f] = { x: 50, y: ys[i], r: 34 }; });
    L.board = { x: 180, y: wTop + 98, r: 66 };
    L.tawa = { x: 150, y: wTop + 238, r: 40, on: !!opts.kothey };
    L.bin = { x: opts.kothey ? 230 : 196, y: wTop + 256, r: 22 };
    const n = nTiers || 3; const th = n === 4 ? 50 : 60;
    const potTop = H - 58;
    L.tiers = [];
    for (let i = 0; i < n; i++) L.tiers.push({ x: 270, y: potTop - (i + 1) * th, w: 122, h: th });
    L.lid = { x: 270, y: potTop - n * th - 26, w: 122, h: 26 };
    L.pot = { x: 262, y: potTop, w: 138, h: 40 };
    L.flame = { x: 331, y: H - 10 };
    L.queue = { x: 392, y: cTop - 30 };
    return L;
  };

  // ---------- glyphs ----------
  A.glyph = function (ctx, fill, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10);
    ctx.strokeStyle = col || '#fff'; ctx.fillStyle = col || '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (fill === 'buff') { // horns
      ctx.beginPath(); ctx.moveTo(-7, -5); ctx.quadraticCurveTo(-7, 4, 0, 4); ctx.quadraticCurveTo(7, 4, 7, -5); ctx.stroke();
      circ(ctx, 0, 4, 2.6); ctx.fill();
    } else if (fill === 'chicken') { // drumstick
      ctx.beginPath(); ctx.ellipse(-2, -2, 5.2, 4.2, -0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1, 1); ctx.lineTo(6, 6); ctx.stroke();
      circ(ctx, 6.5, 5, 1.6); ctx.fill(); circ(ctx, 5, 6.8, 1.6); ctx.fill();
    } else if (fill === 'veg') { // leaf
      ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-7, -6, 6, -6); ctx.quadraticCurveTo(6, 6, -6, 6); ctx.fill();
      ctx.strokeStyle = FILL_COL.veg; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(3, -3); ctx.stroke();
    } else { // any: star
      ctx.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5; const r = k % 2 ? 2.8 : 6.5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  A.badge = function (ctx, fill, x, y, r) {
    circ(ctx, x, y, r + 1.5); ctx.fillStyle = '#fff8'; ctx.fill();
    circ(ctx, x, y, r); ctx.fillStyle = FILL_COL[fill] || '#888'; ctx.fill();
    A.glyph(ctx, fill, x, y, r * 1.05);
  };
  A.styleIcon = function (ctx, style, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10);
    if (style === 'jhol') {
      ctx.fillStyle = '#e9eef2'; ctx.beginPath(); ctx.moveTo(-9, -2); ctx.quadraticCurveTo(0, 12, 9, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.jhol; ctx.beginPath(); ctx.ellipse(0, -2, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff9'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.quadraticCurveTo(-1, -9, -3, -12); ctx.moveTo(3, -6); ctx.quadraticCurveTo(5, -9, 3, -12); ctx.stroke();
    } else if (style === 'kothey') {
      ctx.fillStyle = C.tawa; ctx.beginPath(); ctx.ellipse(-1, 2, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(6, 0, 7, 2.4);
      ctx.fillStyle = '#c8862f'; ctx.beginPath(); ctx.ellipse(-1, 1, 4.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff9a3a'; [-5, 0, 4].forEach((dx) => { ctx.beginPath(); ctx.moveTo(dx - 1.5, 9); ctx.lineTo(dx, 5.5); ctx.lineTo(dx + 1.5, 9); ctx.fill(); });
    }
    ctx.restore();
  };

  // a momo seen from the side (orders, story) or from the top (plates, board)
  A.momoSide = function (ctx, x, y, s, col, burnt) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 20, s / 20);
    ctx.fillStyle = burnt ? '#4a2a1a' : col || C.momo;
    ctx.beginPath(); ctx.moveTo(-14, 8); ctx.quadraticCurveTo(-16, -4, -4, -10); ctx.quadraticCurveTo(0, -16, 4, -10);
    ctx.quadraticCurveTo(16, -4, 14, 8); ctx.quadraticCurveTo(0, 13, -14, 8); ctx.fill();
    ctx.strokeStyle = burnt ? '#1a0e08' : '#c9b08a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = -2; k <= 2; k++) { ctx.moveTo(k * 2.2, -11); ctx.quadraticCurveTo(k * 5, -3, k * 6.5, 4); }
    ctx.stroke();
    ctx.fillStyle = '#fff7'; ctx.beginPath(); ctx.ellipse(-6, -2, 3, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  A.momoTop = function (ctx, x, y, r, look) {
    // look: 'raw' | 'ok' | 'perfect' | 'soggy' | 'burnt' | 'kothey'
    const body = look === 'burnt' ? '#4b2b1b' : look === 'soggy' ? '#e6dccb' : look === 'raw' ? C.dough : C.momo;
    if (look === 'kothey') { circ(ctx, x, y + r * 0.18, r * 1.05); ctx.fillStyle = '#b8701f'; ctx.fill(); }
    circ(ctx, x, y, r); ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = look === 'burnt' ? '#1d0f08' : '#cdb58f'; ctx.lineWidth = Math.max(0.8, r * 0.14);
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = k * Math.PI * 2 / 5 + 0.3;
      ctx.moveTo(x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15);
      ctx.quadraticCurveTo(x + Math.cos(a + 0.5) * r * 0.6, y + Math.sin(a + 0.5) * r * 0.6, x + Math.cos(a + 0.9) * r * 0.92, y + Math.sin(a + 0.9) * r * 0.92);
    }
    ctx.stroke();
    if (look === 'perfect' || look === 'ok') { circ(ctx, x - r * 0.35, y - r * 0.35, r * 0.25); ctx.fillStyle = look === 'perfect' ? '#fff' : '#fff8'; ctx.fill(); }
    if (look === 'burnt') { ctx.fillStyle = '#120806'; circ(ctx, x + r * 0.3, y + r * 0.2, r * 0.25); ctx.fill(); }
  };

  // ---------- backgrounds (cached) ----------
  // the sky sits behind everything on its own small canvas, so the moon can rise between it and the city
  A.makeSky = function (L) {
    const c = document.createElement('canvas');
    const q = Math.min(1, L.s);
    c.width = Math.ceil(L.W * L.s * q); c.height = Math.ceil(L.street * L.s * q) + 4;
    const ctx = c.getContext('2d');
    ctx.setTransform(L.s * q, 0, 0, L.s * q, L.ox * L.s * q, 0);
    const x0 = -L.ox; const w = 400 + 2 * L.ox;
    const tall = L.street < L.cTop - 60;
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, L.street);
    g.addColorStop(0, C.sky0); g.addColorStop(0.42, C.sky1); g.addColorStop(0.78, C.sky2); g.addColorStop(1, C.sky3);
    ctx.fillStyle = g; ctx.fillRect(x0, 0, w, L.street + 4);
    // a few early stars
    const r = prng(7);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 34; i++) { ctx.globalAlpha = 0.2 + r() * 0.5; ctx.fillRect(x0 + r() * w, 66 + r() * (L.street - 66) * 0.4, 1.3, 1.3); }
    ctx.globalAlpha = 1;
    // thin cloud streaks lit from below by the sunset
    ctx.fillStyle = '#f0a06a30';
    [[70, L.street - (tall ? 210 : 150), 130], [270, L.street - (tall ? 250 : 175), 160], [380, L.street - (tall ? 190 : 140), 90]].forEach(([cx, cy, cw]) => { ctx.beginPath(); ctx.ellipse(cx, cy, cw / 2, 4, 0, 0, Math.PI * 2); ctx.fill(); });
    return c;
  };

  A.makeBack = function (L, dpr) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(L.W * L.s * dpr); c.height = Math.ceil(L.H * L.s * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(L.s * dpr, 0, 0, L.s * dpr, L.ox * L.s * dpr, 0);
    const x0 = -L.ox; const x1 = 400 + L.ox; const w = x1 - x0;
    const tall = L.street < L.cTop - 60;
    // far hills (the valley rim)
    const hy = L.street - (tall ? 150 : 110);
    ctx.fillStyle = '#4a3560';
    ctx.beginPath(); ctx.moveTo(x0, hy + 20);
    for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, hy + 10 - Math.sin(x * 0.02) * 12 - Math.sin(x * 0.051) * 6);
    ctx.lineTo(x1, L.street); ctx.lineTo(x0, L.street); ctx.fill();
    // pagoda in the middle distance, behind the houses
    const px = 300; const pb = L.street - (tall ? 122 : 96);
    ctx.fillStyle = '#231d3a';
    [[0, 76, 15], [14, 56, 13], [26, 38, 11]].forEach(([dy, ww, hh]) => {
      ctx.beginPath(); ctx.moveTo(px - ww / 2 - 4, pb - dy); ctx.lineTo(px + ww / 2 + 4, pb - dy); ctx.lineTo(px + ww / 2 - 12, pb - dy - hh); ctx.lineTo(px - ww / 2 + 12, pb - dy - hh); ctx.fill();
      ctx.fillRect(px - ww / 2 + 12, pb - dy, ww - 24, 14);
    });
    ctx.fillRect(px - 2, pb - 50, 4, 12); ctx.fillStyle = '#d9a83a'; circ(ctx, px, pb - 52, 3.4); ctx.fill();
    ctx.fillStyle = '#231d3a'; ctx.fillRect(px - 26, pb + 12, 52, 90);
    // houses: tall, thin, brick and paint, lit windows, black water tanks on the roofs
    const SIGNS = [['चिया', '#1f8f8a'], ['किराना', '#c8261b'], ['सैलुन', '#2f6fb0'], ['मोबाइल', '#d08a1a'], ['सेकुवा', '#8a2a12'], ['फार्मेसी', '#3e8e5a'], ['कपडा', '#6a4ea8'], ['रिचार्ज', '#c23a6a']];
    const BODY = ['#2a2140', '#36233a', '#232641', '#3d2634', '#2b2a48'];
    let x = x0 - 10; let k = 0;
    const rb = prng(11);
    L.shops = [];
    while (x < x1) {
      const bw = 38 + rb() * 40; const bh = (tall ? 96 : 62) + rb() * (tall ? 110 : 70); const by = L.street - bh;
      ctx.fillStyle = BODY[Math.floor(rb() * BODY.length)]; ctx.fillRect(x, by, bw, bh + 2);
      ctx.fillStyle = '#ffffff0a'; ctx.fillRect(x, by, 3, bh);
      ctx.fillStyle = '#15142a'; ctx.fillRect(x - 3, by - 4, bw + 6, 5);
      const rt = rb();
      if (rt < 0.45) { ctx.fillStyle = '#0e0d1c'; rr(ctx, x + bw * 0.55, by - 16, 13, 13, 3); ctx.fill(); ctx.fillRect(x + bw * 0.55 + 3, by - 19, 7, 3); }
      else if (rt < 0.75) { ctx.strokeStyle = '#0e0d1c'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.moveTo(x + 6 + j * 8, by - 4); ctx.lineTo(x + 6 + j * 8 + (j % 2), by - 13); } ctx.stroke(); }
      for (let wy = by + 10; wy < L.street - 50; wy += 19) for (let wx = x + 6; wx < x + bw - 10; wx += 14) {
        const lit = rb();
        ctx.fillStyle = '#120f22'; ctx.fillRect(wx - 1, wy - 1, 9, 11);
        ctx.fillStyle = lit < 0.32 ? C.win : lit < 0.4 ? '#9ad0ff' : '#2b2846';
        ctx.globalAlpha = lit < 0.4 ? 0.85 : 1; ctx.fillRect(wx, wy, 7, 9); ctx.globalAlpha = 1;
        if (lit < 0.32) { ctx.fillStyle = '#c4782a'; ctx.fillRect(wx, wy + 4, 7, 1); }
      }
      // ground floor: a shop under a painted board, shutter half up or pulled down
      const sw = Math.min(bw - 8, 46); const sx = x + (bw - sw) / 2; const sy = L.street - 26;
      const open = rb() < 0.6;
      if (open) {
        const sg = ctx.createLinearGradient(0, sy, 0, L.street);
        sg.addColorStop(0, '#ffcf7a'); sg.addColorStop(1, '#b8692a');
        ctx.fillStyle = sg; ctx.fillRect(sx, sy + 8, sw, 18);
        ctx.fillStyle = '#5a3a2a'; for (let j = 0; j < 3; j++) ctx.fillRect(sx + 4 + j * (sw / 3), sy + 14, sw / 3 - 7, 3);
        ctx.fillStyle = '#8d97a1'; ctx.fillRect(sx, sy, sw, 9);
        ctx.fillStyle = '#6e7781'; for (let j = 2; j < 9; j += 3) ctx.fillRect(sx, sy + j, sw, 1);
      } else {
        ctx.fillStyle = '#4a4f5c'; ctx.fillRect(sx, sy, sw, 26);
        ctx.fillStyle = '#383c48'; for (let j = 2; j < 26; j += 3) ctx.fillRect(sx, sy + j, sw, 1);
      }
      let col = null;
      if (k % 2 === 0 || open) {
        const pick = SIGNS[Math.floor(rb() * SIGNS.length)]; col = pick[1];
        const bwid = Math.min(bw - 4, 52); const bx = x + (bw - bwid) / 2; const byy = sy - 14;
        ctx.fillStyle = col; ctx.fillRect(bx, byy, bwid, 12);
        ctx.fillStyle = '#ffffff26'; ctx.fillRect(bx, byy, bwid, 2);
        ctx.fillStyle = '#fff4e2'; ctx.font = '800 9px Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pick[0], bx + bwid / 2, byy + 6.5);
      }
      L.shops.push({ x: sx + sw / 2, w: sw, col, open });
      x += bw + 2; k++;
    }
    // tangled wires and a pole with a transformer
    ctx.strokeStyle = '#0b0b18'; ctx.lineWidth = 1.2;
    ctx.fillStyle = '#0d0d1b'; ctx.fillRect(18, 70, 5, L.street - 70);
    rr(ctx, 11, 118, 19, 22, 3); ctx.fill();
    for (let j = 0; j < 6; j++) {
      ctx.beginPath(); ctx.moveTo(x0, 92 + j * 9);
      ctx.quadraticCurveTo(140, 118 + j * 14 + (j % 2) * 10, 20, 84 + j * 6);
      ctx.quadraticCurveTo(220, 128 + j * 11, x1, 96 + j * 12);
      ctx.stroke();
    }
    // prayer flags strung from the stall post across the street
    const FLAG = ['#2a62c9', '#f4f1ea', '#d0342c', '#3e9a4a', '#f2c230'];
    const fl = tall ? [[x0 - 10, 76, x1 + 10, 136, 50, 0], [x0 - 10, 168, x1 + 10, 120, 40, 3]] : [[x0 - 10, 76, x1 + 10, 120, 34, 0]];
    fl.forEach(([ax, ay, bx2, by2, sag, off]) => {
      const mx = (ax + bx2) / 2; const my = (ay + by2) / 2 + sag;
      ctx.strokeStyle = '#0b0b18'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx2, by2); ctx.stroke();
      const n = Math.floor((bx2 - ax) / 13);
      for (let j = 1; j < n; j++) {
        const u = j / n; const fx = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx2; const fy = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by2;
        const slope = 2 * (1 - u) * (my - ay) + 2 * u * (by2 - my);
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.atan2(slope, bx2 - ax) * 0.6);
        ctx.fillStyle = FLAG[(j + off) % 5]; ctx.globalAlpha = 0.85; ctx.fillRect(-4.5, 0, 9, 11); ctx.globalAlpha = 1;
        ctx.restore();
      }
    });
    // wet street: tarmac, puddle sheen, painted shop boards smeared in the wet
    const sg = ctx.createLinearGradient(0, L.street, 0, L.cTop);
    sg.addColorStop(0, '#2a2440'); sg.addColorStop(1, C.street);
    ctx.fillStyle = sg; ctx.fillRect(x0, L.street, w, L.cTop - L.street + 2);
    for (const sh of L.shops) {
      if (!sh.open && !sh.col) continue;
      const rg = ctx.createLinearGradient(0, L.street, 0, L.cTop);
      const cc = sh.open ? '#ffcf7a' : sh.col;
      rg.addColorStop(0, cc + (sh.open ? '66' : '40')); rg.addColorStop(1, cc + '00');
      ctx.fillStyle = rg; ctx.fillRect(sh.x - sh.w * 0.4, L.street + 3, sh.w * 0.8, L.cTop - L.street - 3);
    }
    ctx.fillStyle = '#ffffff0c';
    const rp = prng(19);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x0 + rp() * w, L.street + 10 + rp() * (L.cTop - L.street - 16), 16 + rp() * 26, 2.5 + rp() * 2, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#3b3550'; ctx.fillRect(x0, L.street, w, 3);
    // stall posts
    ctx.fillStyle = '#6d5a45'; ctx.fillRect(2, 40, 7, L.cTop - 40); ctx.fillRect(391, 40, 7, L.cTop - 40);
    ctx.fillStyle = '#8f7a60'; ctx.fillRect(3, 40, 2, L.cTop - 40); ctx.fillRect(392, 40, 2, L.cTop - 40);
    drawTarp(ctx, x0, x1);
    return c;
  };

  // night falls over service: the sky darkens and the moon climbs from behind the valley rim
  A.nightSky = function (ctx, L, k, noMoon) {
    const x0 = -L.ox; const w = 400 + 2 * L.ox;
    if (k > 0.01) { ctx.fillStyle = 'rgba(6,8,30,' + (0.45 * k).toFixed(3) + ')'; ctx.fillRect(x0, 0, w, L.street); }
    if (noMoon) return;
    const tall = L.street < L.cTop - 60;
    const low = L.street - (tall ? 138 : 100); const top = tall ? 150 : 128;
    const e = 1 - (1 - k) * (1 - k);
    const mx = 96 + k * 40; const my = low - e * Math.max(0, low - top);
    ctx.globalAlpha = 0.5 + 0.3 * k; ctx.drawImage(glowSprite(), mx - 58, my - 58, 116, 116); ctx.globalAlpha = 1;
    circ(ctx, mx, my, 19); ctx.fillStyle = '#fbe6b0'; ctx.fill();
    ctx.fillStyle = '#e9cf92'; circ(ctx, mx - 6, my - 5, 4); ctx.fill(); circ(ctx, mx + 6, my + 6, 3); ctx.fill(); circ(ctx, mx + 8, my - 8, 2); ctx.fill();
  };
  // the city dims a little too, and the open shopfronts spill more light on the street
  A.nightCity = function (ctx, L, k, t, calm) {
    const x0 = -L.ox; const w = 400 + 2 * L.ox;
    if (k > 0.01) { ctx.fillStyle = 'rgba(6,8,30,' + (0.2 * k).toFixed(3) + ')'; ctx.fillRect(x0, 64, w, L.street - 64); }
    if (!L.shops) return;
    const gs = glowSprite();
    for (const sh of L.shops) {
      if (!sh.open) continue;
      ctx.globalAlpha = 0.22 + 0.3 * k + (calm ? 0 : 0.05 * Math.sin(t * 3 + sh.x));
      ctx.drawImage(gs, sh.x - sh.w * 0.8, L.street - 30, sh.w * 1.6, 44);
    }
    ctx.globalAlpha = 1;
  };

  // traffic on the wet street behind the customers: bikes, a safa tempo, a microbus
  const RIDES = [
    { kind: 'bike', sp: 74, dir: 1, off: 0, gap: 1.6, col: '#c8261b' },
    { kind: 'tempo', sp: 36, dir: -1, off: 300, gap: 1.3, col: '#3e9a4a' },
    { kind: 'bus', sp: 50, dir: 1, off: 760, gap: 2.6, col: '#e9eef2' },
    { kind: 'bike', sp: 64, dir: -1, off: 1220, gap: 2.1, col: '#2f6fb0' },
  ];
  A.traffic = function (ctx, L, t) {
    const x0 = -L.ox - 90; const span = 400 + 2 * L.ox + 180;
    const lane = L.street + (L.cTop - L.street) * 0.5;
    const gs = glowSprite();
    for (const v of RIDES) {
      const cyc = span * (1 + v.gap);
      const u = ((t * v.sp + v.off) % cyc + cyc) % cyc;
      if (u > span) continue;
      const x = v.dir > 0 ? x0 + u : x0 + span - u; const y = lane + (v.dir > 0 ? 8 : -2);
      ctx.save(); ctx.translate(x, y); ctx.scale(v.dir, 1);
      ctx.globalAlpha = 0.45; ctx.drawImage(gs, 6, -30, 70, 34); ctx.globalAlpha = 0.2; ctx.fillStyle = '#ffe9b8'; ctx.fillRect(18, 4, 54, 3); ctx.globalAlpha = 1;
      ctx.fillStyle = '#0c0b18';
      if (v.kind === 'bike') {
        circ(ctx, -12, 0, 6); ctx.fill(); circ(ctx, 12, 0, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(10, -6); ctx.lineTo(14, -14); ctx.lineTo(4, -12); ctx.lineTo(-10, -10); ctx.fill();
        ctx.fillStyle = v.col; rr(ctx, -7, -30, 12, 17, 4); ctx.fill();
        ctx.fillStyle = '#0c0b18'; circ(ctx, 0, -36, 6); ctx.fill();
        ctx.fillStyle = '#ffe9b8'; circ(ctx, 15, -11, 2.2); ctx.fill();
        ctx.fillStyle = '#ff3a3a'; ctx.fillRect(-16, -9, 3, 2);
      } else if (v.kind === 'tempo') {
        ctx.fillStyle = v.col; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-26, -26); ctx.lineTo(10, -26); ctx.quadraticCurveTo(22, -24, 24, -8); ctx.lineTo(24, 0); ctx.fill();
        ctx.fillStyle = '#9ad0ff55'; ctx.fillRect(-22, -22, 26, 9); ctx.fillStyle = '#ffffff30'; ctx.fillRect(-26, -12, 50, 2);
        ctx.fillStyle = '#0c0b18'; circ(ctx, -16, 1, 5); ctx.fill(); circ(ctx, 16, 1, 5); ctx.fill();
        ctx.fillStyle = '#ffe9b8'; circ(ctx, 22, -10, 2.4); ctx.fill(); ctx.fillStyle = '#ff3a3a'; ctx.fillRect(-27, -10, 2, 4);
      } else {
        ctx.fillStyle = v.col; rr(ctx, -40, -30, 80, 28, 5); ctx.fill();
        ctx.fillStyle = '#2f6fb0'; ctx.fillRect(-40, -12, 80, 4);
        ctx.fillStyle = '#ffcf7a88'; for (let j = 0; j < 5; j++) ctx.fillRect(-35 + j * 14, -26, 11, 9);
        ctx.fillStyle = '#0c0b18'; circ(ctx, -24, 0, 6); ctx.fill(); circ(ctx, 24, 0, 6); ctx.fill();
        ctx.fillStyle = '#ffe9b8'; circ(ctx, 38, -8, 2.6); ctx.fill(); ctx.fillStyle = '#ff3a3a'; ctx.fillRect(-41, -10, 2, 5);
      }
      ctx.restore();
    }
  };

  function drawTarp(ctx, x0, x1) {
    const sw = 40;
    for (let x = Math.floor(x0 / sw) * sw, k = 0; x < x1; x += sw, k++) {
      const blue = Math.floor(x / sw) % 2 === 0;
      const g = ctx.createLinearGradient(0, 0, 0, 58);
      g.addColorStop(0, blue ? C.tarpB2 : C.tarpO2); g.addColorStop(1, blue ? C.tarpB : C.tarpO);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + sw, 0); ctx.lineTo(x + sw, 48);
      ctx.quadraticCurveTo(x + sw / 2, 64, x, 48); ctx.closePath(); ctx.fill();
      // creases
      ctx.strokeStyle = '#0002'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + sw * 0.5, 4); ctx.lineTo(x + sw * 0.45, 52); ctx.stroke();
    }
    // seam rope
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, 47);
    for (let x = Math.floor(x0 / sw) * sw; x < x1; x += sw) ctx.quadraticCurveTo(x + sw / 2, 57, x + sw, 47);
    ctx.stroke();
  }

  A.makeFront = function (L, dpr) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(L.W * L.s * dpr); c.height = Math.ceil(L.H * L.s * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(L.s * dpr, 0, 0, L.s * dpr, L.ox * L.s * dpr, 0);
    const x0 = -L.ox; const w = 400 + 2 * L.ox;
    // counter: brushed steel
    const g = ctx.createLinearGradient(0, L.cTop, 0, L.wTop);
    g.addColorStop(0, '#d9dfe4'); g.addColorStop(0.5, C.steel); g.addColorStop(1, '#9aa4ae');
    ctx.fillStyle = g; ctx.fillRect(x0, L.cTop, w, 92);
    ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1;
    for (let y = L.cTop + 5; y < L.wTop - 6; y += 4) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y + 1); ctx.stroke(); }
    ctx.fillStyle = C.steelHi; ctx.fillRect(x0, L.cTop - 2, w, 4);
    ctx.fillStyle = '#5f6872'; ctx.fillRect(x0, L.wTop - 7, w, 7);
    // warm bounce light from the bulbs on the counter
    const bl = ctx.createRadialGradient(200, L.cTop, 10, 200, L.cTop, 260);
    bl.addColorStop(0, '#ffcf7a30'); bl.addColorStop(1, '#ffcf7a00');
    ctx.fillStyle = bl; ctx.fillRect(x0, L.cTop, w, 92);
    // work table: dark wood
    const tg = ctx.createLinearGradient(0, L.wTop, 0, L.H);
    tg.addColorStop(0, C.wood2); tg.addColorStop(1, '#2e1a10');
    ctx.fillStyle = tg; ctx.fillRect(x0, L.wTop, w, L.H - L.wTop);
    const r = prng(5);
    ctx.strokeStyle = '#00000030'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      const y = L.wTop + r() * (L.H - L.wTop);
      ctx.beginPath(); ctx.moveTo(x0, y);
      ctx.bezierCurveTo(x0 + w * 0.3, y + (r() - 0.5) * 14, x0 + w * 0.6, y + (r() - 0.5) * 14, x0 + w, y + (r() - 0.5) * 8); ctx.stroke();
    }
    ctx.fillStyle = '#ffffff10'; ctx.fillRect(x0, L.wTop, w, 2);
    // bin
    const b = L.bin;
    ctx.fillStyle = '#3d6b4a'; ctx.beginPath(); ctx.moveTo(b.x - b.r, b.y - b.r * 0.7); ctx.lineTo(b.x + b.r, b.y - b.r * 0.7); ctx.lineTo(b.x + b.r * 0.78, b.y + b.r); ctx.lineTo(b.x - b.r * 0.78, b.y + b.r); ctx.fill();
    ctx.fillStyle = '#2a4a33'; ctx.beginPath(); ctx.ellipse(b.x, b.y - b.r * 0.7, b.r, b.r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.x - 6, b.y - 2); ctx.lineTo(b.x - 4, b.y + 12); ctx.moveTo(b.x + 6, b.y - 2); ctx.lineTo(b.x + 4, b.y + 12); ctx.stroke();
    // gas burner + pot under the steamer
    const p = L.pot;
    ctx.fillStyle = '#1c1b20'; rr(ctx, p.x + 18, L.H - 14, p.w - 36, 12, 4); ctx.fill();
    return c;
  };

  // ---------- dynamic layers ----------
  let glow = null;
  function glowSprite() {
    if (glow) return glow;
    glow = document.createElement('canvas'); glow.width = glow.height = 64;
    const g = glow.getContext('2d'); const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, '#ffe2a0ff'); rg.addColorStop(0.2, '#ffcf7aa0'); rg.addColorStop(1, '#ffcf7a00');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return glow;
  }
  A.glowSprite = glowSprite;

  A.bulbs = function (ctx, L, t, calm) {
    const x0 = -L.ox - 20; const x1 = 420 + L.ox;
    const sy = 58; const span = 100;
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x0, sy);
    for (let x = x0; x < x1; x += span) ctx.quadraticCurveTo(x + span / 2, sy + 16, x + span, sy);
    ctx.stroke();
    const gs = glowSprite();
    for (let x = x0 + 17; x < x1; x += 33) {
      const local = ((x - x0) % span) / span; const y = sy + 16 * 2 * local * (1 - local) * 0.98 + 6;
      const fl = calm ? 1 : 0.85 + 0.15 * Math.sin(t * 7 + x * 1.7) * Math.sin(t * 3.1 + x);
      ctx.globalAlpha = 0.55 * fl; ctx.drawImage(gs, x - 24, y - 22, 48, 48); ctx.globalAlpha = 1;
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 1.5, y - 7, 3, 4);
      circ(ctx, x, y, 3.6); ctx.fillStyle = '#fff1c4'; ctx.fill();
    }
  };

  A.reflections = function (ctx, L, t) {
    // the string bulbs shimmer on the wet street
    const sy = L.street + 4; const h = Math.min(36, L.cTop - sy);
    ctx.fillStyle = '#ffcf7a';
    for (let x = -L.ox; x < 400 + L.ox; x += 33) {
      const wob = Math.sin(t * 3 + x * 0.3) * 1.5;
      ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 2 + x);
      ctx.fillRect(x + wob - 2, sy, 4, h * 0.5); ctx.globalAlpha *= 0.5; ctx.fillRect(x - wob - 1.5, sy + h * 0.5, 3, h * 0.5);
    }
    ctx.globalAlpha = 1;
  };

  A.sign = function (ctx, x, y, w, sway) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway || 0);
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-w * 0.35, -14); ctx.lineTo(-w * 0.32, 0); ctx.moveTo(w * 0.35, -14); ctx.lineTo(w * 0.32, 0); ctx.stroke();
    const h = w * 0.27;
    rr(ctx, -w / 2, 0, w, h, 5); ctx.fillStyle = C.signEdge; ctx.fill();
    rr(ctx, -w / 2 + 3, 3, w - 6, h - 6, 3); ctx.fillStyle = C.sign; ctx.fill();
    ctx.fillStyle = C.signInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(h * 0.62)}px "Yatra One", Mukta, sans-serif`;
    ctx.fillText('मःम पसल', 0, h * 0.54);
    ctx.restore();
  };

  // ---------- customers ----------
  const SKIN = ['#e8b48a', '#c98d62', '#a86b45', '#7d4a2e', '#d9a077'];
  const HAIR = ['#141012', '#1e1612', '#2b1d14', '#141012', '#4a2a1c', '#141012', '#6b2f2a'];
  const SHIRT = ['#2f6fb0', '#d24a3a', '#3e8e5a', '#e0a83a', '#6a4ea8', '#2d2d38', '#e86f9a', '#1f8f8a', '#8a5a3a', '#f2f0ea'];
  A.look = function (seed, special) {
    const r = prng(seed + 17);
    const lk = {
      skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * HAIR.length)],
      shirt: SHIRT[Math.floor(r() * SHIRT.length)], style: Math.floor(r() * 6), acc: Math.floor(r() * 7),
      h: 0.94 + r() * 0.12, w: 0.9 + r() * 0.2, phase: r() * 6,
    };
    if (special) {
      const sp = special;
      if (sp.type === 'student') { lk.shirt = '#f2f0ea'; lk.acc = 'tie'; lk.style = 0; }
      if (sp.type === 'credit') {
        if (sp.who === 'hari') { lk.shirt = '#7a6a52'; lk.acc = 'topi'; lk.style = 0; lk.skin = SKIN[1]; lk.hair = '#5a5a5a'; }
        if (sp.who === 'kanchha') { lk.shirt = '#3a4a6a'; lk.acc = 'cap'; lk.style = 0; }
        if (sp.who === 'bunty') { lk.shirt = '#1a1a1a'; lk.acc = 'chain'; lk.style = 4; lk.hair = '#5a2a14'; }
      }
      if (sp.type === 'inspector') { lk.shirt = '#9a8a5a'; lk.acc = sp.tell === 'badge' ? 'badge' : 'shades'; lk.style = 0; }
      if (sp.type === 'vlogger') { lk.shirt = '#e86f9a'; lk.acc = sp.big ? 'ring' : 'crack'; lk.style = 2; }
    }
    return lk;
  };

  // c: customer object; mood: happy|foot|frown|phone|ask; slide: 0..1 walk-in offset; face override
  A.customer = function (ctx, x, base, lk, mood, t, face) {
    const bob = mood === 'foot' ? Math.abs(Math.sin(t * 9 + lk.phase)) * 3 : Math.sin(t * 2 + lk.phase) * 1.2;
    const k = lk.h;
    ctx.save(); ctx.translate(x, base - bob);
    // torso
    const sw = 40 * lk.w;
    ctx.fillStyle = lk.shirt;
    ctx.beginPath(); ctx.moveTo(-sw, 12); ctx.lineTo(-sw + 2, -44 * k); ctx.quadraticCurveTo(-sw + 6, -60 * k, -12, -62 * k);
    ctx.lineTo(12, -62 * k); ctx.quadraticCurveTo(sw - 6, -60 * k, sw - 2, -44 * k); ctx.lineTo(sw, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0002'; ctx.fillRect(-sw, -10, sw * 2, 22);
    if (lk.acc === 'tie') {
      ctx.fillStyle = '#2b3a7a'; ctx.beginPath(); ctx.moveTo(-4, -60 * k); ctx.lineTo(4, -60 * k); ctx.lineTo(6, -18 * k); ctx.lineTo(0, -10 * k); ctx.lineTo(-6, -18 * k); ctx.fill();
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-sw + 8, -50 * k); ctx.lineTo(-sw + 14, 10); ctx.stroke();
    }
    if (lk.acc === 'chain') { ctx.strokeStyle = '#e8c04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -58 * k, 12, 0.3, Math.PI - 0.3); ctx.stroke(); }
    if (lk.acc === 'badge') {
      ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-sw + 10, -44 * k, 14, 10); ctx.fillStyle = '#2a6fdb'; ctx.fillRect(-sw + 10, -44 * k, 14, 3);
      ctx.fillStyle = '#e9e2cf'; ctx.save(); ctx.translate(sw - 12, -26 * k); ctx.rotate(0.15); ctx.fillRect(-10, -14, 20, 26); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-10, -16, 20, 4); ctx.restore();
    }
    if (lk.acc === 'shades' || lk.acc === 'badge') { ctx.fillStyle = '#6d6040'; ctx.fillRect(-sw + 4, -46 * k, 2, 30); ctx.fillRect(sw - 6, -46 * k, 2, 30); }
    // neck + head
    ctx.fillStyle = lk.skin; ctx.fillRect(-7, -72 * k, 14, 14);
    ctx.fillStyle = '#0002'; ctx.fillRect(-7, -64 * k, 14, 5);
    const hy = -92 * k; const tilt = mood === 'phone' ? 0.12 : 0;
    ctx.save(); ctx.translate(0, hy); ctx.rotate(tilt);
    if (lk.style === 1 || lk.style === 5) { ctx.fillStyle = lk.hair; rr(ctx, -23, -14, 46, 46, 14); ctx.fill(); } // long hair behind
    circ(ctx, -21, 2, 5); ctx.fillStyle = lk.skin; ctx.fill(); circ(ctx, 21, 2, 5); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 20, 23, 0, 0, Math.PI * 2); ctx.fillStyle = lk.skin; ctx.fill();
    // hair
    ctx.fillStyle = lk.hair;
    ctx.beginPath();
    if (lk.style === 0) { ctx.ellipse(0, -10, 21, 15, 0, Math.PI, 0); ctx.lineTo(20, -6); ctx.quadraticCurveTo(4, -14, -20, -4); }
    else if (lk.style === 1) { ctx.ellipse(0, -9, 22, 16, 0, Math.PI, 0); ctx.lineTo(21, 10); ctx.lineTo(16, -6); ctx.quadraticCurveTo(0, -12, -16, -6); ctx.lineTo(-21, 10); }
    else if (lk.style === 2) { ctx.ellipse(0, -12, 21, 14, 0, Math.PI, 0); ctx.quadraticCurveTo(10, -24, -4, -30); ctx.quadraticCurveTo(-14, -26, -20, -10); }
    else if (lk.style === 3) { ctx.ellipse(0, -10, 21, 15, 0, Math.PI, 0); ctx.lineTo(20, -2); ctx.quadraticCurveTo(-2, -16, -20, -2); ctx.moveTo(10, -26); ctx.arc(4, -28, 9, 0, Math.PI * 2); }
    else if (lk.style === 4) { ctx.moveTo(-20, -4); ctx.quadraticCurveTo(-22, -26, 0, -26); ctx.quadraticCurveTo(24, -28, 22, -6); ctx.quadraticCurveTo(14, -18, 4, -16); ctx.quadraticCurveTo(-8, -10, -20, -4); }
    else { ctx.ellipse(0, -9, 22, 16, 0, Math.PI, 0); ctx.lineTo(20, 2); ctx.quadraticCurveTo(0, -14, -20, 2); }
    ctx.fill();
    if (lk.acc === 'topi') { // dhaka topi
      ctx.fillStyle = '#2b2a3a'; ctx.beginPath(); ctx.moveTo(-17, -14); ctx.lineTo(-14, -30); ctx.lineTo(16, -32); ctx.lineTo(18, -14); ctx.fill();
      ctx.fillStyle = '#d24a3a'; for (let i = -12; i < 14; i += 6) ctx.fillRect(i, -26, 3, 3);
      ctx.fillStyle = '#e0a83a'; for (let i = -9; i < 14; i += 6) ctx.fillRect(i, -21, 3, 3);
    }
    if (lk.acc === 'cap') { ctx.fillStyle = '#c84a2a'; ctx.beginPath(); ctx.ellipse(0, -14, 21, 12, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -16, 28, 5); }
    // face
    const eyeY = -2;
    const brow = mood === 'frown' || mood === 'phone' ? 0.35 : mood === 'foot' ? 0.15 : face === 'yuck' ? 0.4 : -0.08;
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, eyeY - 7 - brow * 3); ctx.lineTo(-4, eyeY - 7 + brow * 4); ctx.moveTo(12, eyeY - 7 - brow * 3); ctx.lineTo(4, eyeY - 7 + brow * 4); ctx.stroke();
    if (lk.acc === 'shades') { ctx.fillStyle = '#0c0c10'; rr(ctx, -15, eyeY - 5, 12, 8, 3); ctx.fill(); rr(ctx, 3, eyeY - 5, 12, 8, 3); ctx.fill(); ctx.fillRect(-3, eyeY - 3, 6, 2); }
    else if (mood === 'phone') { ctx.beginPath(); ctx.moveTo(-11, eyeY + 2); ctx.lineTo(-5, eyeY + 2); ctx.moveTo(5, eyeY + 2); ctx.lineTo(11, eyeY + 2); ctx.stroke(); }
    else if (face === 'yum' || face === 'happyBig') { ctx.beginPath(); ctx.arc(-8, eyeY + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(4.5, eyeY); ctx.arc(8, eyeY + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    else { ctx.fillStyle = '#1a1210'; circ(ctx, -8, eyeY, 2.4); ctx.fill(); circ(ctx, 8, eyeY, 2.4); ctx.fill(); }
    // mouth
    ctx.beginPath();
    if (face === 'yum') { ctx.arc(0, 8, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); ctx.fillStyle = '#b8322a'; ctx.beginPath(); ctx.arc(0, 9, 5, 0, Math.PI); ctx.fill(); }
    else if (face === 'yuck' || face === 'angry') { ctx.moveTo(-6, 13); ctx.quadraticCurveTo(0, 6, 6, 13); ctx.stroke(); }
    else if (face === 'meh' || mood === 'frown' || mood === 'phone') { ctx.moveTo(-6, 12); ctx.quadraticCurveTo(0, 8, 6, 12); ctx.stroke(); }
    else if (mood === 'foot' || face === 'ok') { ctx.moveTo(-5, 10); ctx.lineTo(5, 10); ctx.stroke(); }
    else if (mood === 'ask') { circ(ctx, 0, 10, 3.2); ctx.fillStyle = '#5a1a14'; ctx.fill(); }
    else { ctx.arc(0, 6, 6, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    if (face === 'yum' || mood === 'happy') { ctx.fillStyle = '#ff7a7a40'; circ(ctx, -13, 6, 4); ctx.fill(); circ(ctx, 13, 6, 4); ctx.fill(); }
    if (face === 'angry' || mood === 'phone') { ctx.fillStyle = '#ff3a3a30'; circ(ctx, -13, 6, 5); ctx.fill(); circ(ctx, 13, 6, 5); ctx.fill(); }
    if (lk.acc === 'glasses' || lk.acc === 3) { ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; circ(ctx, -8, eyeY, 6); ctx.stroke(); circ(ctx, 8, eyeY, 6); ctx.stroke(); }
    if (lk.acc === 4) { ctx.fillStyle = '#e8c04a'; circ(ctx, -21, 9, 2); ctx.fill(); circ(ctx, 21, 9, 2); ctx.fill(); }
    ctx.restore();
    // phone / props in hand
    if (mood === 'phone' || lk.acc === 'ring' || lk.acc === 'crack') {
      const px = lk.acc === 'ring' || lk.acc === 'crack' ? 30 : 14; const py = lk.acc === 'ring' || lk.acc === 'crack' ? -110 * k : -46 * k;
      ctx.strokeStyle = lk.skin; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sw - 10, -20); ctx.lineTo(px + 2, py + 16); ctx.stroke();
      if (lk.acc === 'ring' || lk.acc === 'crack') { ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 2, py + 16); ctx.lineTo(px, py + 4); ctx.stroke(); }
      if (lk.acc === 'ring') {
        ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 4); ctx.drawImage(glowSprite(), px - 30, py - 34, 60, 60); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 3; circ(ctx, px, py - 4, 13); ctx.stroke();
      }
      ctx.fillStyle = '#111'; rr(ctx, px - 7, py - 10, 14, 22, 3); ctx.fill();
      ctx.fillStyle = lk.acc === 'crack' ? '#6a8aa8' : '#8fd0ff'; rr(ctx, px - 5.5, py - 8, 11, 18, 2); ctx.fill();
      if (lk.acc === 'crack') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(px - 5, py - 6); ctx.lineTo(px + 1, py); ctx.lineTo(px - 2, py + 4); ctx.lineTo(px + 5, py + 9); ctx.stroke(); }
      if (mood === 'phone' && lk.acc !== 'ring' && lk.acc !== 'crack') { ctx.globalAlpha = 0.25; ctx.drawImage(glowSprite(), -26, hy - 22, 52, 52); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  };

  // forearms resting on the counter, drawn over the counter edge; impatient fingers drum
  A.hands = function (ctx, x, base, lk, mood, t) {
    const sw = 40 * lk.w;
    const busyR = mood === 'phone' || lk.acc === 'ring' || lk.acc === 'crack';
    const sides = busyR ? [-1] : [-1, 1];
    for (const sd of sides) {
      const hx = x + sd * (sw - 9);
      const drum = mood === 'foot' && sd === 1 ? Math.abs(Math.sin(t * 14 + lk.phase)) * 2.5 : 0;
      ctx.fillStyle = lk.shirt; rr(ctx, hx - 9, base - 7, 18, 9, 3); ctx.fill();
      ctx.fillStyle = '#0003'; ctx.fillRect(hx - 9, base - 1, 18, 3);
      ctx.fillStyle = lk.skin; ctx.beginPath(); ctx.ellipse(hx - sd * 2, base + 3 - drum, 8, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0002'; ctx.beginPath(); ctx.ellipse(hx - sd * 2, base + 7, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  };

  // order bubble above the head
  A.bubble = function (ctx, x, y, c, f, t, pulse) {
    const w = c.qty > 1 ? 92 : 74; const h = 42;
    ctx.save(); ctx.translate(x, y + (pulse ? Math.sin(t * 8) * 1.5 : 0));
    const urgent = f < 0.25;
    ctx.fillStyle = urgent ? '#ffe2d8' : C.paper;
    rr(ctx, -w / 2, -h / 2, w, h, 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-7, h / 2 - 1); ctx.lineTo(0, h / 2 + 9); ctx.lineTo(7, h / 2 - 1); ctx.fill();
    if (c.special && c.special.decided === null) {
      ctx.fillStyle = '#d24a3a'; ctx.font = '700 26px Anton, Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, -1);
    } else {
      const sx = c.style !== 'steam' && c.fill !== 'any' ? -14 : 0;
      const ox = c.qty > 1 ? -10 : 0;
      A.momoSide(ctx, sx + ox, -4, 22, c.fill === 'any' ? C.momo : null);
      A.badge(ctx, c.fill, sx + ox + 9, 6, 7);
      if (c.style !== 'steam' && c.fill !== 'any') A.styleIcon(ctx, c.style, 18 + ox, -1, 13);
      if (c.qty > 1) {
        ctx.fillStyle = C.ink; ctx.font = '22px Anton, Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('×' + (MR.num ? MR.num(c.qty - (c.served || 0)) : c.qty - (c.served || 0)), w / 2 - 15, -2);
      }
      // patience bar
      const bw = w - 18;
      rr(ctx, -bw / 2, h / 2 - 8, bw, 5, 2.5); ctx.fillStyle = '#0002'; ctx.fill();
      const col = f > 0.6 ? '#4caf50' : f > 0.36 ? '#f2b51d' : f > 0.16 ? '#f07a1a' : '#e53935';
      rr(ctx, -bw / 2, h / 2 - 8, Math.max(5, bw * f), 5, 2.5); ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  };

  // ---------- stations ----------
  A.bowl = function (ctx, b, fill, n, sel, t, locked) {
    const { x, y, r } = b;
    ctx.save();
    if (sel) { ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 5); ctx.drawImage(glowSprite(), x - r * 1.9, y - r * 1.9, r * 3.8, r * 3.8); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(x + 3, y + 5, r, r * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    const g = cg('bw' + q2(x) + ',' + y + ',' + r, () => { const gg = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 2, x, y, r);
      gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.5, C.steel); gg.addColorStop(1, C.steel2); return gg; });
    circ(ctx, x, y, r); ctx.fillStyle = g; ctx.fill();
    const inner = r * 0.76;
    circ(ctx, x, y, inner); ctx.fillStyle = n > 0 ? FILL_COL[fill] : '#5a5f66'; ctx.fill();
    if (n > 0) { // minced texture, a mound that shrinks with stock
      const mr = prng(fill.length * 31);
      ctx.fillStyle = '#ffffff30';
      for (let i = 0; i < 16; i++) { const a = mr() * 6.28; const d = mr() * inner * 0.8; circ(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 1.6); ctx.fill(); }
      ctx.fillStyle = '#00000025';
      for (let i = 0; i < 10; i++) { const a = mr() * 6.28; const d = mr() * inner * 0.8; circ(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 1.8); ctx.fill(); }
      if (fill === 'veg') { ctx.fillStyle = '#e8792a'; for (let i = 0; i < 6; i++) { const a = mr() * 6.28; const d = mr() * inner * 0.7; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 2.5, 2.5); } }
    }
    ctx.strokeStyle = sel ? '#ffd27a' : '#ffffff60'; ctx.lineWidth = sel ? 3 : 1.5; circ(ctx, x, y, r - 1); ctx.stroke();
    A.badge(ctx, fill, x - r * 0.72, y - r * 0.72, 10);
    // stock count chip
    ctx.fillStyle = n > 0 ? C.ink : '#c62828'; rr(ctx, x + r * 0.2, y + r * 0.45, 34, 22, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '17px Anton, Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(MR.num ? MR.num(n) : String(n), x + r * 0.2 + 17, y + r * 0.45 + 11.5);
    if (locked) { circ(ctx, x, y, r); ctx.fillStyle = '#000a'; ctx.fill(); }
    ctx.restore();
  };

  A.board = function (ctx, b, board, t, dragging) {
    const { x, y, r } = b;
    ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(x + 4, y + 6, r, r * 0.96, 0, 0, Math.PI * 2); ctx.fill();
    const g = cg('bd' + q2(x) + ',' + y + ',' + r, () => { const gg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 4, x, y, r);
      gg.addColorStop(0, '#e2aa6a'); gg.addColorStop(1, '#a8703c'); return gg; });
    circ(ctx, x, y, r); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) { circ(ctx, x, y, r * k / 4); ctx.stroke(); }
    // flour dust
    ctx.fillStyle = '#ffffff40'; circ(ctx, x + 10, y - 8, r * 0.55); ctx.fill();
    const n = board.pleats;
    if (board.ready && !dragging) {
      A.tray(ctx, x, y + Math.sin(t * 5) * 2, board.fill, t, true);
      return;
    }
    if (board.ready) return;
    // five wrappers
    const pos = [[-26, -16], [0, -26], [26, -16], [-15, 14], [15, 14]];
    pos.forEach(([dx, dy]) => {
      const px = x + dx; const py = y + dy + 4;
      if (n === 0) {
        circ(ctx, px, py, 13); ctx.fillStyle = C.dough; ctx.fill(); ctx.strokeStyle = '#d9c7a8'; ctx.lineWidth = 1; ctx.stroke();
      } else if (n === 1) {
        circ(ctx, px, py, 13); ctx.fillStyle = C.dough; ctx.fill();
        circ(ctx, px, py, 6); ctx.fillStyle = FILL_COL[board.fill]; ctx.fill();
      } else if (n === 2) {
        ctx.fillStyle = C.dough; ctx.beginPath(); ctx.arc(px, py, 12, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#cdb58f'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let k = -2; k <= 2; k++) { ctx.moveTo(px + k * 4, py - 9); ctx.lineTo(px + k * 4.5, py - 2); }
        ctx.stroke();
        circ(ctx, px, py + 3, 4); ctx.fillStyle = FILL_COL[board.fill]; ctx.fill();
      } else {
        A.momoTop(ctx, px, py, 11, 'raw');
      }
    });
  };

  A.tray = function (ctx, x, y, fill, t, glowing) {
    if (glowing) { ctx.globalAlpha = 0.45 + 0.2 * Math.sin(t * 6); ctx.drawImage(glowSprite(), x - 70, y - 60, 140, 120); ctx.globalAlpha = 1; }
    rr(ctx, x - 44, y - 30, 88, 60, 12); ctx.fillStyle = '#9aa4ae'; ctx.fill();
    rr(ctx, x - 40, y - 26, 80, 52, 10); ctx.fillStyle = '#d5dbe0'; ctx.fill();
    const pos = [[-24, -10], [0, -12], [24, -10], [-12, 10], [12, 10]];
    pos.forEach(([dx, dy]) => A.momoTop(ctx, x + dx, y + dy, 10, 'raw'));
    A.badge(ctx, fill, x + 34, y - 22, 9);
  };

  // plate (top view) for the pass and dragging
  A.plate = function (ctx, x, y, r, p, t, sel) {
    if (sel) { ctx.globalAlpha = 0.7; ctx.drawImage(glowSprite(), x - r * 2, y - r * 2, r * 4, r * 4); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(x + 2, y + 4, r, r * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    if (p.jhol) {
      const g = cg('pj' + q2(x) + ',' + q2(y) + ',' + q2(r), () => { const gg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
        gg.addColorStop(0, '#ffffff'); gg.addColorStop(1, '#9aa4ae'); return gg; });
      circ(ctx, x, y, r); ctx.fillStyle = g; ctx.fill();
      circ(ctx, x, y, r * 0.82); ctx.fillStyle = C.jhol; ctx.fill();
      ctx.fillStyle = '#ffffff30'; circ(ctx, x - r * 0.3, y - r * 0.3, r * 0.2); ctx.fill();
    } else {
      const g = cg('pl' + q2(x) + ',' + q2(y) + ',' + q2(r), () => { const gg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
        gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.7, '#d7dde2'); gg.addColorStop(1, '#a3adb6'); return gg; });
      circ(ctx, x, y, r); ctx.fillStyle = g; ctx.fill();
      circ(ctx, x, y, r * 0.8); ctx.strokeStyle = '#9aa4ae'; ctx.lineWidth = 1; ctx.stroke();
    }
    const look = p.q === 'burnt' || p.fq === 'burnt' ? 'burnt' : p.kothey ? 'kothey' : p.q;
    const mr = r * 0.26;
    const pts = [[0, -0.42], [0.4, -0.13], [0.25, 0.36], [-0.25, 0.36], [-0.4, -0.13]];
    pts.forEach(([dx, dy]) => A.momoTop(ctx, x + dx * r, y + dy * r, mr, look));
    if (p.achar) {
      ctx.fillStyle = C.achar; ctx.beginPath(); ctx.ellipse(x, y + 1, r * 0.2, r * 0.16, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd9a0'; for (let k = 0; k < 4; k++) { ctx.fillRect(x - 3 + k * 2, y - 1 + (k % 2) * 2, 1.4, 1.4); }
    }
    A.badge(ctx, p.fill, x + r * 0.72, y - r * 0.72, 8);
    if (p.q === 'perfect' && p.fq !== 'burnt') {
      const a = (t * 2) % 1;
      ctx.fillStyle = `rgba(255,236,160,${1 - a})`; star(ctx, x - r * 0.6, y - r * 0.5 - a * 6, 3 + a * 2);
    }
  };
  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const rr2 = k % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
    ctx.closePath(); ctx.fill();
  }
  A.star = star;

  A.passSlot = function (ctx, s) {
    ctx.strokeStyle = '#7f8a95'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    circ(ctx, s.x, s.y, s.r - 2); ctx.stroke(); ctx.setLineDash([]);
  };

  A.acharBowl = function (ctx, a, t, hot) {
    if (hot) { ctx.globalAlpha = 0.7; ctx.drawImage(glowSprite(), a.x - 50, a.y - 50, 100, 100); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(a.x + 2, a.y + 4, a.r, a.r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    circ(ctx, a.x, a.y, a.r); ctx.fillStyle = C.clay; ctx.fill();
    circ(ctx, a.x, a.y, a.r * 0.78); ctx.fillStyle = C.achar; ctx.fill();
    ctx.fillStyle = '#ff6a4a'; circ(ctx, a.x - 6, a.y - 6, a.r * 0.25); ctx.fill();
    ctx.fillStyle = '#ffe0a0'; const mr = prng(3); for (let k = 0; k < 9; k++) ctx.fillRect(a.x - 12 + mr() * 24, a.y - 12 + mr() * 24, 1.6, 1.6);
    ctx.strokeStyle = '#c3cbd2'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x + 6, a.y + 2); ctx.lineTo(a.x + a.r + 8, a.y - a.r + 2); ctx.stroke();
  };

  A.jholPot = function (ctx, j, t, hot) {
    if (hot) { ctx.globalAlpha = 0.7; ctx.drawImage(glowSprite(), j.x - 52, j.y - 52, 104, 104); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(j.x + 2, j.y + 4, j.r, j.r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    circ(ctx, j.x, j.y, j.r); ctx.fillStyle = '#6b737c'; ctx.fill();
    circ(ctx, j.x, j.y, j.r * 0.82); ctx.fillStyle = C.jhol; ctx.fill();
    ctx.fillStyle = '#ffb06a'; circ(ctx, j.x - 7 + Math.sin(t * 2) * 2, j.y - 5, 4); ctx.fill(); circ(ctx, j.x + 6, j.y + 6 + Math.cos(t * 2) * 2, 3); ctx.fill();
    ctx.strokeStyle = '#3d444b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(j.x - 4, j.y); ctx.lineTo(j.x - j.r - 6, j.y - j.r - 2); ctx.stroke();
  };

  A.tawaPan = function (ctx, tw, fr, t, FRY) {
    const { x, y, r } = tw;
    ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(x + 3, y + 5, r, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3036'; ctx.fillRect(x + r - 4, y - 5, 30, 10);
    ctx.fillStyle = '#7a4a2a'; rr(ctx, x + r + 14, y - 6, 22, 12, 5); ctx.fill();
    const g = cg('tw' + x + ',' + y + ',' + r, () => { const gg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
      gg.addColorStop(0, '#4a4650'); gg.addColorStop(1, C.tawa); return gg; });
    circ(ctx, x, y, r); ctx.fillStyle = g; ctx.fill();
    if (fr) {
      const p = fr.plate; const q = MR.Rules.cookQ(fr.t, FRY);
      const look = q === 'burnt' ? 'burnt' : fr.t >= FRY.raw ? 'kothey' : p.q;
      [[-14, -10], [12, -12], [0, 4], [-14, 16], [14, 14]].forEach(([dx, dy]) => A.momoTop(ctx, x + dx, y + dy, 9, look));
      A.meterArc(ctx, x, y, r + 7, fr.t, FRY, t);
    } else {
      ctx.strokeStyle = '#ffffff18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.6, -2.4, -1.2); ctx.stroke();
    }
  };

  A.meterArc = function (ctx, x, y, r, v, M, t) {
    const a0 = -Math.PI * 0.5; const span = Math.PI * 2;
    const max = M.burn * 1.08;
    const seg = (from, to, col) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, a0 + span * from / max, a0 + span * to / max); ctx.stroke(); };
    ctx.lineWidth = 5; ctx.lineCap = 'butt';
    seg(0, M.raw, '#555c64'); seg(M.raw, M.perfect, C.done); seg(M.perfect, M.perfectEnd, C.gold); seg(M.perfectEnd, M.burn, C.soggy); seg(M.burn, max, '#111');
    const a = a0 + span * Math.min(v, max) / max;
    ctx.fillStyle = '#fff'; circ(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 4.5); ctx.fill();
  };

  A.steamer = function (ctx, L, tiers, t, COOK, fx) {
    // pot and flame
    const p = L.pot; const f = L.flame;
    for (let k = -3; k <= 3; k++) {
      const h = 8 + Math.sin(t * 20 + k * 2) * 2;
      ctx.fillStyle = k % 2 ? '#3a7aff' : '#7ab0ff';
      ctx.beginPath(); ctx.moveTo(f.x + k * 10 - 4, f.y); ctx.quadraticCurveTo(f.x + k * 10, f.y - h * 2, f.x + k * 10 + 4, f.y); ctx.fill();
    }
    const pg = cg('pot' + p.x + ',' + p.w, () => { const gg = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      gg.addColorStop(0, '#7c858f'); gg.addColorStop(0.35, '#e3e8ec'); gg.addColorStop(1, '#6e7781'); return gg; });
    rr(ctx, p.x, p.y, p.w, p.h, 8); ctx.fillStyle = pg; ctx.fill();
    ctx.fillStyle = '#00000030'; ctx.fillRect(p.x, p.y + p.h - 8, p.w, 8);
    // tiers bottom to top
    tiers.forEach((tr, i) => {
      const b = L.tiers[i];
      const q = tr ? MR.Rules.cookQ(tr.t, COOK) : null;
      const cooked = tr && tr.t >= COOK.raw;
      if (q === 'perfect') { ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 9); ctx.drawImage(glowSprite(), b.x - 40, b.y - 40, b.w + 80, b.h + 80); ctx.globalAlpha = 1; }
      const g = cg('tier' + b.x + ',' + b.w, () => { const gg = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
        gg.addColorStop(0, '#8a939d'); gg.addColorStop(0.3, '#f1f4f6'); gg.addColorStop(0.55, '#cfd6dc'); gg.addColorStop(1, '#7a838d'); return gg; });
      rr(ctx, b.x, b.y + 2, b.w, b.h - 2, 6); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = q === 'burnt' ? '#3a2a24' : '#ffffff70'; ctx.fillRect(b.x + 3, b.y + 2, b.w - 6, 2);
      ctx.fillStyle = '#00000035'; ctx.fillRect(b.x, b.y + b.h - 4, b.w, 3);
      // handles
      ctx.strokeStyle = '#6e7781'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x - 2, b.y + b.h / 2, 6, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x + b.w + 2, b.y + b.h / 2, 6, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      if (tr) {
        A.badge(ctx, tr.fill, b.x + 16, b.y + b.h / 2 - 4, 10);
        // meter bar
        const mx = b.x + 32; const mw = b.w - 42; const my = b.y + b.h / 2 - 5; const max = COOK.burn * 1.08;
        const zone = (from, to, col) => { ctx.fillStyle = col; ctx.fillRect(mx + mw * from / max, my, mw * (to - from) / max, 10); };
        rr(ctx, mx - 2, my - 2, mw + 4, 14, 5); ctx.fillStyle = '#2a2d33'; ctx.fill();
        zone(0, COOK.raw, '#555c64'); zone(COOK.raw, COOK.perfect, C.done); zone(COOK.perfect, COOK.perfectEnd, C.gold); zone(COOK.perfectEnd, COOK.burn, C.soggy); zone(COOK.burn, max, '#111');
        const nx = mx + mw * Math.min(tr.t, max) / max;
        ctx.fillStyle = '#fff'; ctx.fillRect(nx - 1.5, my - 4, 3, 18);
        if (q === 'perfect') { ctx.fillStyle = '#fff6c0'; A.star(ctx, nx, my - 6, 5); }
        if (!cooked) { ctx.fillStyle = '#ffffff'; ctx.font = '12px Anton, Mukta, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; }
      } else {
        ctx.strokeStyle = '#00000025'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.5;
        rr(ctx, b.x + 10, b.y + 12, b.w - 20, b.h - 22, 6); ctx.stroke(); ctx.setLineDash([]);
      }
      if (fx && fx.shake && fx.shake[i] > 0) { /* handled by caller transform */ }
    });
    // lid
    const l = L.lid;
    const lg = cg('lid' + l.x + ',' + l.w, () => { const gg = ctx.createLinearGradient(l.x, 0, l.x + l.w, 0);
      gg.addColorStop(0, '#8a939d'); gg.addColorStop(0.3, '#f4f7f9'); gg.addColorStop(1, '#7a838d'); return gg; });
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(l.x - 2, l.y + l.h); ctx.quadraticCurveTo(l.x + l.w / 2, l.y - 8, l.x + l.w + 2, l.y + l.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3a40'; rr(ctx, l.x + l.w / 2 - 10, l.y - 4, 20, 9, 4); ctx.fill();
  };

  // little painted tiles for the evening upgrades (52 css px, drawn in a 60-unit box)
  A.icon = function (ctx, id) {
    const g = ctx.createLinearGradient(0, 0, 0, 60);
    g.addColorStop(0, '#2c2a5c'); g.addColorStop(1, '#7d4569');
    rr(ctx, 0, 0, 60, 60, 14); ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(ctx, 0, 0, 60, 60, 14); ctx.clip();
    ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite(), 2, 4, 56, 56); ctx.globalAlpha = 1;
    if (id === 'steamer') {
      for (let i = 0; i < 4; i++) {
        const y = 44 - i * 9; const gg = ctx.createLinearGradient(14, 0, 46, 0);
        gg.addColorStop(0, '#8a939d'); gg.addColorStop(0.35, '#f1f4f6'); gg.addColorStop(1, '#7a838d');
        rr(ctx, 14, y, 32, 8, 2); ctx.fillStyle = gg; ctx.fill();
      }
      ctx.fillStyle = '#e9eef2'; ctx.beginPath(); ctx.moveTo(13, 17); ctx.quadraticCurveTo(30, 6, 47, 17); ctx.fill();
      ctx.fillStyle = '#3a7aff'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(30 + k * 6 - 2, 56); ctx.quadraticCurveTo(30 + k * 6, 50, 30 + k * 6 + 2, 56); ctx.fill(); }
      ctx.fillStyle = C.gold; circ(ctx, 48, 14, 8); ctx.fill(); ctx.fillStyle = C.ink; ctx.font = '12px Anton, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+1', 48, 14.5);
    } else if (id === 'bhai') {
      ctx.fillStyle = '#2f6fb0'; rr(ctx, 14, 40, 32, 24, 10); ctx.fill();
      ctx.fillStyle = '#c98d62'; circ(ctx, 30, 30, 13); ctx.fill();
      ctx.fillStyle = '#c84a2a'; ctx.beginPath(); ctx.ellipse(30, 24, 14, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(30, 22, 16, 3);
      ctx.fillStyle = '#1a1210'; circ(ctx, 25, 31, 1.9); ctx.fill(); circ(ctx, 35, 31, 1.9); ctx.fill();
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(30, 34, 4, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      A.momoTop(ctx, 12, 50, 6, 'raw'); A.momoTop(ctx, 48, 50, 6, 'raw');
    } else if (id === 'achar') {
      A.acharBowl(ctx, { x: 28, y: 33, r: 17 }, 0);
      ctx.fillStyle = '#2e5a1e'; [[22, 30], [31, 27], [27, 37], [34, 35]].forEach(([x, y]) => { circ(ctx, x, y, 1.8); ctx.fill(); });
    } else if (id === 'sign') {
      A.sign(ctx, 30, 24, 50, -0.05);
      ctx.fillStyle = '#ffe2a0'; [[10, 14], [50, 14], [6, 46], [54, 46]].forEach(([x, y]) => { circ(ctx, x, y, 2.4); ctx.fill(); });
    } else if (id === 'gas') {
      ctx.fillStyle = '#1c1b20'; rr(ctx, 12, 44, 36, 8, 3); ctx.fill();
      for (let k = -2; k <= 2; k++) { ctx.fillStyle = k % 2 ? '#3a7aff' : '#7ab0ff'; ctx.beginPath(); ctx.moveTo(30 + k * 7 - 3, 44); ctx.quadraticCurveTo(30 + k * 7, 22 + Math.abs(k) * 5, 30 + k * 7 + 3, 44); ctx.fill(); }
      ctx.fillStyle = '#e0a83a'; circ(ctx, 48, 16, 7); ctx.fill(); ctx.fillStyle = '#7a4a12'; ctx.fillRect(47, 10, 2, 7);
    }
    ctx.restore();
  };

  // tutorial hand
  A.hand = function (ctx, x, y, press) {
    ctx.save(); ctx.translate(x, y); ctx.scale(press ? 0.9 : 1, press ? 0.9 : 1);
    ctx.fillStyle = '#ffffffdd'; ctx.strokeStyle = '#1b1430'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -4); ctx.quadraticCurveTo(0, -10, 5, -10); ctx.quadraticCurveTo(10, -10, 10, -4);
    ctx.lineTo(10, 12); ctx.lineTo(14, 10); ctx.quadraticCurveTo(20, 10, 20, 16); ctx.lineTo(22, 15); ctx.quadraticCurveTo(28, 15, 28, 21);
    ctx.lineTo(30, 20); ctx.quadraticCurveTo(36, 20, 36, 27); ctx.lineTo(36, 40); ctx.quadraticCurveTo(36, 54, 22, 56); ctx.lineTo(10, 56);
    ctx.quadraticCurveTo(0, 56, -4, 46); ctx.lineTo(-12, 28); ctx.quadraticCurveTo(-14, 20, -6, 20); ctx.lineTo(0, 26); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    if (press) { ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; circ(ctx, x + 5, y - 8, 14); ctx.stroke(); }
  };
})();
