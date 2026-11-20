// Lakhey Run: every texture is painted on a canvas at load time (no image files).
(function () {
  const LR = window.LR;
  const T = (LR.tex = {});

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0; let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  LR.rng = rng;
  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function mk(c, rep) {
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = LR.aniso || 4;
    return t;
  }
  T.cv = cv; T.mk = mk;
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  T.shade = shade;

  function bricks(g, x0, y0, w, h, bw, bh, R, base, mortar) {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    g.fillStyle = mortar; g.fillRect(x0, y0, w, h);
    for (let y = y0, row = 0; y < y0 + h; y += bh, row++) {
      const off = (row % 2) * bw / 2;
      for (let x = x0 - off; x < x0 + w; x += bw) {
        g.fillStyle = shade(base, (R() - 0.5) * 0.3);
        g.fillRect(x + 1, y + 1, bw - 2, bh - 1.5);
      }
    }
    g.restore();
  }
  function grain(g, w, h, R, n, a) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,240,220,' + a * 0.6 + ')';
      g.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2);
    }
  }

  // ---------- building materials ----------
  T.brick = function () {
    const c = cv(256, 256), g = c.getContext('2d'), R = rng(7);
    bricks(g, 0, 0, 256, 256, 32, 8, R, '#a4482b', '#4d2417');
    grain(g, 256, 256, R, 900, 0.08);
    return mk(c, true);
  };
  T.paving = function () { // herringbone brick, the paving of Kathmandu's old squares
    const S = 512, a = 32, c = cv(S, S), g = c.getContext('2d'), R = rng(11);
    g.fillStyle = '#3b1e14'; g.fillRect(0, 0, S, S);
    const base = ['#9b4a2f', '#8a3f28', '#a8553a', '#7f3a25', '#93503a'];
    function br(x, y, w, h) {
      for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
        const X = x + dx, Y = y + dy;
        if (X > S || Y > S || X + w < 0 || Y + h < 0) continue;
        g.fillStyle = shade(base[(R() * 5) | 0], (R() - 0.5) * 0.25);
        g.fillRect(X + 1.5, Y + 1.5, w - 3, h - 3);
      }
    }
    for (let k = -2; k < 6; k++) {
      for (let i = -2; i < S / a + 2; i++) {
        const ox = i * a, oy = i * a + k * 4 * a;
        br(((ox % S) + S) % S, ((oy % S) + S) % S, 2 * a, a);
        br(((ox % S) + S) % S, (((oy + a) % S) + S) % S, a, 2 * a);
      }
    }
    grain(g, S, S, R, 4000, 0.07);
    // worn, darker centre and dust
    for (let i = 0; i < 40; i++) {
      const x = R() * S, y = R() * S, r = 20 + R() * 60, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(40,20,10,0.18)'); gr.addColorStop(1, 'rgba(40,20,10,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return mk(c, true);
  };
  T.roof = function () {
    const c = cv(128, 128), g = c.getContext('2d'), R = rng(5);
    g.fillStyle = '#4a2015'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 10) {
      for (let x = (y / 10) % 2 ? 0 : 8; x < 136; x += 16) {
        g.fillStyle = shade('#7a3420', (R() - 0.5) * 0.35);
        g.beginPath(); g.ellipse(x, y + 5, 7.5, 6, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 7, y + 8, 14, 2);
      }
    }
    grain(g, 128, 128, R, 300, 0.1);
    return mk(c, true);
  };
  T.wood = function () {
    const c = cv(64, 256), g = c.getContext('2d'), R = rng(3);
    g.fillStyle = '#4a2814'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 40; i++) { g.strokeStyle = shade('#4a2814', (R() - 0.5) * 0.5); g.lineWidth = 1 + R() * 2; const x = R() * 64; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 80, x - 6, 170, x + 3, 256); g.stroke(); }
    return mk(c, true);
  };

  // lattice ("tiki jhya") panel; returns map + emissive glow
  function lattice(g, ge, x, y, w, h, lit, step) {
    step = step || 9;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = lit ? '#6a2f0c' : '#140a06'; g.fillRect(x, y, w, h);
    g.strokeStyle = '#a5743c'; g.lineWidth = 2.2;
    for (let k = -h; k < w + h; k += step) {
      g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k + h, y + h); g.stroke();
      g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + h, y); g.stroke();
    }
    g.restore();
    if (lit && ge) {
      ge.save(); ge.beginPath(); ge.rect(x, y, w, h); ge.clip();
      ge.fillStyle = lit === 2 ? '#ffd27a' : '#ff9d3c'; ge.fillRect(x, y, w, h);
      ge.strokeStyle = '#000'; ge.lineWidth = 3;
      for (let k = -h; k < w + h; k += step) {
        ge.beginPath(); ge.moveTo(x + k, y); ge.lineTo(x + k + h, y + h); ge.stroke();
        ge.beginPath(); ge.moveTo(x + k, y + h); ge.lineTo(x + k + h, y); ge.stroke();
      }
      ge.restore();
    }
  }
  function carvedFrame(g, x, y, w, h, P) {
    const b = 0.13 * P;
    g.fillStyle = '#26130a'; g.fillRect(x - b * 2, y - b * 2, w + b * 4, h + b * 4);
    g.fillStyle = '#5e3418'; g.fillRect(x - b * 1.4, y - b * 1.4, w + b * 2.8, h + b * 2.8);
    g.fillStyle = '#8a5a2c';
    for (let i = x - b; i < x + w + b; i += 6) { g.fillRect(i, y - b * 1.2, 3, 3); g.fillRect(i, y + h + b * 0.5, 3, 3); }
    for (let j = y - b; j < y + h + b; j += 6) { g.fillRect(x - b * 1.2, j, 3, 3); g.fillRect(x + w + b * 0.5, j, 3, 3); }
    // lintel with extended ends ("ears" of a Newari window frame)
    g.fillStyle = '#3a1d0d'; g.fillRect(x - b * 4, y - b * 3, w + b * 8, b * 1.4); g.fillRect(x - b * 4, y + h + b * 1.6, w + b * 8, b * 1.4);
  }
  function tympanum(g, x, y, w, P) { // fan-carved arch above a window
    const cx = x + w / 2, r = w * 0.55;
    g.fillStyle = '#4a2611'; g.beginPath(); g.arc(cx, y - 0.25 * P, r, Math.PI, 0); g.fill();
    g.strokeStyle = '#a8763e'; g.lineWidth = 2;
    for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(cx, y - 0.25 * P, r * k / 3.4, Math.PI, 0); g.stroke(); }
    for (let a = 0; a <= 8; a++) { const an = Math.PI + a * Math.PI / 8; g.beginPath(); g.moveTo(cx, y - 0.25 * P); g.lineTo(cx + Math.cos(an) * r, y - 0.25 * P + Math.sin(an) * r); g.stroke(); }
  }

  // Newari house front, 6 m wide. storeys: 3 or 4. Returns { map, emissive, units }
  T.facade = function (seed, storeys) {
    const R = rng(seed), P = 80, W = 6 * P;
    const units = 3.2 + 2.6 * (storeys - 1) + 0.8;
    const H = Math.round(units * P);
    const c = cv(W, H), g = c.getContext('2d');
    const e = cv(W, H), ge = e.getContext('2d');
    ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
    const base = ['#a8452a', '#983c24', '#b5542f', '#8c3a22', '#a04a30'][(R() * 5) | 0];
    bricks(g, 0, 0, W, H, 26, 8, R, base, '#4b2216');
    grain(g, W, H, R, 2500, 0.06);
    const gTop = H - 3.2 * P;
    // ground floor: sometimes plastered, then shopfront or door
    if (R() < 0.45) {
      g.fillStyle = ['#e6d6b6', '#d9b98a', '#c7d1bf', '#e2c49c', '#b9c9cf'][(R() * 5) | 0];
      g.fillRect(0, gTop, W, 3.2 * P);
      grain(g, W, 3.2 * P, R, 600, 0.08);
      g.fillStyle = 'rgba(80,40,20,0.25)'; g.fillRect(0, H - 0.9 * P, W, 0.6 * P);
    }
    g.fillStyle = '#6f6a63'; g.fillRect(0, H - 0.3 * P, W, 0.3 * P);
    const shop = R() < 0.6;
    if (shop) {
      const x0 = 0.5 * P, w = 5 * P, y0 = gTop + 0.55 * P, h = 2.35 * P;
      const lit = R() < 0.8;
      g.fillStyle = lit ? '#5b2a10' : '#170c07'; g.fillRect(x0, y0, w, h);
      if (lit) {
        const gr = ge.createLinearGradient(0, y0, 0, y0 + h);
        gr.addColorStop(0, '#ffb45a'); gr.addColorStop(1, '#7a3a10');
        ge.fillStyle = gr; ge.fillRect(x0, y0, w, h);
        // shelves and goods silhouettes
        for (let k = 0; k < 3; k++) {
          const yy = y0 + h * (0.3 + k * 0.25);
          g.fillStyle = '#2a1408'; g.fillRect(x0, yy, w, 4); ge.fillStyle = '#000'; ge.fillRect(x0, yy, w, 4);
          for (let i = 0; i < 14; i++) {
            const gx = x0 + R() * w, gw = 6 + R() * 14, gh = 8 + R() * 18;
            const col = ['#c43d25', '#e8b23a', '#2f7d4a', '#3b5ea8', '#e07a2a'][(R() * 5) | 0];
            g.fillStyle = col; g.fillRect(gx, yy - gh, gw, gh);
            ge.fillStyle = 'rgba(0,0,0,0.6)'; ge.fillRect(gx, yy - gh, gw, gh);
          }
        }
      }
      // shutters half up
      g.fillStyle = '#3a1f10';
      for (let i = 0; i < 4; i++) if (R() < 0.35) { g.fillRect(x0 + i * w / 4, y0, w / 4 - 2, h * 0.7); ge.fillStyle = '#000'; ge.fillRect(x0 + i * w / 4, y0, w / 4 - 2, h * 0.7); }
      // carved pillars
      for (let i = 0; i <= 4; i++) {
        const px = x0 + i * w / 4 - 0.11 * P;
        g.fillStyle = '#3d200f'; g.fillRect(px, y0, 0.22 * P, h);
        g.fillStyle = '#7b4a22'; g.fillRect(px + 3, y0 + 4, 4, h - 8);
        g.fillStyle = '#5a3216'; g.beginPath(); g.moveTo(px - 0.25 * P, y0); g.lineTo(px + 0.47 * P, y0); g.lineTo(px + 0.11 * P, y0 + 0.4 * P); g.fill();
        ge.fillStyle = '#000'; ge.fillRect(px, y0, 0.22 * P, h);
      }
      g.fillStyle = '#2e170a'; g.fillRect(0.3 * P, gTop + 0.25 * P, W - 0.6 * P, 0.3 * P);
      g.fillStyle = '#8a5a2c'; for (let i = 0.4 * P; i < W - 0.4 * P; i += 10) g.fillRect(i, gTop + 0.33 * P, 5, 8);
    } else {
      // central door + two small windows
      const dw = 1.3 * P, dh = 2.2 * P, dx = W / 2 - dw / 2, dy = H - 0.3 * P - dh;
      carvedFrame(g, dx, dy, dw, dh, P);
      g.fillStyle = '#2a160a'; g.fillRect(dx, dy, dw, dh);
      g.fillStyle = '#4b2a14'; g.fillRect(dx + 4, dy + 4, dw / 2 - 6, dh - 8); g.fillRect(dx + dw / 2 + 2, dy + 4, dw / 2 - 6, dh - 8);
      g.fillStyle = '#d4a23e'; g.beginPath(); g.arc(dx + dw / 2 - 8, dy + dh / 2, 4, 0, 7); g.arc(dx + dw / 2 + 8, dy + dh / 2, 4, 0, 7); g.fill();
      for (const sx of [0.9 * P, W - 1.9 * P]) { carvedFrame(g, sx, gTop + 0.9 * P, P, 1.1 * P, P); lattice(g, ge, sx, gTop + 0.9 * P, P, 1.1 * P, R() < 0.5 ? 1 : 0); }
    }
    // upper storeys
    for (let f = 1; f < storeys; f++) {
      const fb = gTop - (f - 1) * 2.6 * P; // floor line (bottom of this storey)
      const ft = fb - 2.6 * P;
      // dentil cornice band ("dachi apa")
      g.fillStyle = '#5a2617'; g.fillRect(0, fb - 0.22 * P, W, 0.22 * P);
      g.fillStyle = '#c0613c'; for (let i = 0; i < W; i += 12) g.fillRect(i, fb - 0.18 * P, 7, 0.12 * P);
      g.fillStyle = '#3a170d'; g.fillRect(0, fb - 0.04 * P, W, 0.06 * P);
      const kind = f === 1 ? (R() < 0.5 ? 'tiki' : 'sanjhya') : (f === storeys - 1 && storeys === 4 ? 'small' : (R() < 0.5 ? 'sanjhya' : 'tiki'));
      if (kind === 'sanjhya') { // long multi-bay window
        const bays = 3 + ((R() * 3) | 0), x0 = 0.6 * P, w = W - 1.2 * P, y0 = ft + 0.6 * P, h = 1.45 * P;
        carvedFrame(g, x0, y0, w, h, P);
        const lit = R() < 0.6 ? (R() < 0.3 ? 2 : 1) : 0;
        for (let b = 0; b < bays; b++) {
          const bx = x0 + b * w / bays;
          lattice(g, ge, bx + 4, y0, w / bays - 8, h, lit, 8);
          g.fillStyle = '#3a1d0d'; g.fillRect(bx - 4, y0 - 6, 8, h + 12);
          g.fillStyle = '#9b6a35'; g.fillRect(bx - 1, y0, 2, h);
        }
        g.fillStyle = '#2a1408'; g.fillRect(x0 - 10, y0 + h + 0.18 * P, w + 20, 0.16 * P); // sill
      } else if (kind === 'tiki') { // three tall lattice windows with fan arches
        const n = 3, ww = 0.95 * P, hh = 1.35 * P, gap = (W - n * ww) / (n + 1);
        for (let k = 0; k < n; k++) {
          const x = gap + k * (ww + gap), y = ft + 0.85 * P;
          tympanum(g, x, y, ww, P);
          carvedFrame(g, x, y, ww, hh, P);
          lattice(g, ge, x, y, ww, hh, R() < 0.45 ? 1 : 0, 7);
        }
      } else { // small windows under the eaves
        const n = 4, ww = 0.6 * P, hh = 0.8 * P, gap = (W - n * ww) / (n + 1);
        for (let k = 0; k < n; k++) { const x = gap + k * (ww + gap), y = ft + 1.2 * P; carvedFrame(g, x, y, ww, hh, P); lattice(g, ge, x, y, ww, hh, R() < 0.35 ? 1 : 0, 7); }
      }
    }
    // eave shadow + struts at the top
    const et = 0, eb = 0.8 * P;
    const gr = g.createLinearGradient(0, et, 0, eb); gr.addColorStop(0, '#120804'); gr.addColorStop(1, 'rgba(18,8,4,0.2)');
    g.fillStyle = gr; g.fillRect(0, et, W, eb);
    // prayer stain / weathering streaks
    for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(30,15,8,0.12)'; g.fillRect(R() * W, eb, 2 + R() * 4, R() * H * 0.5); }
    return { map: mk(c), emissive: mk(e), units: units };
  };
  T.latticeTex = function () {
    const c = cv(256, 256), g = c.getContext('2d'), e = cv(256, 256), ge = e.getContext('2d');
    ge.fillStyle = '#000'; ge.fillRect(0, 0, 256, 256);
    g.fillStyle = '#3a1d0d'; g.fillRect(0, 0, 256, 256);
    lattice(g, ge, 16, 30, 224, 200, 1, 12);
    g.fillStyle = '#26130a'; for (let i = 0; i < 4; i++) g.fillRect(16 + i * 74, 26, 10, 208);
    g.fillStyle = '#8a5a2c'; for (let i = 16; i < 240; i += 8) { g.fillRect(i, 10, 4, 10); g.fillRect(i, 236, 4, 10); }
    return { map: mk(c), emissive: mk(e) };
  };

  // ---------- costume ----------
  T.mask = function () { // Majipa Lakhey: glossy red face, flame brows, gold nose, fangs, green earrings
    const S = 1024, c = cv(S, S), g = c.getContext('2d');
    const bg = g.createRadialGradient(470, 380, 60, 512, 520, 640);
    bg.addColorStop(0, '#f2361f'); bg.addColorStop(0.55, '#d1170f'); bg.addColorStop(1, '#7c0805');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // fine white scrollwork framing the face
    g.strokeStyle = '#fff3e0'; g.lineWidth = 7;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(512 + s * 120, 95); g.bezierCurveTo(512 + s * 260, 110, 512 + s * 330, 200, 512 + s * 330, 300); g.stroke();
      g.beginPath(); g.moveTo(512 + s * 345, 330); g.bezierCurveTo(512 + s * 360, 430, 512 + s * 350, 560, 512 + s * 330, 640); g.stroke();
      for (let k = 0; k < 5; k++) { const y = 360 + k * 55; g.beginPath(); g.arc(512 + s * 330, y, 14, s > 0 ? -1.6 : 1.6, s > 0 ? 1.6 : 4.7); g.stroke(); }
    }
    // forehead boss with concentric rings
    g.fillStyle = '#c4160e'; g.beginPath(); g.arc(512, 175, 82, 0, 7); g.fill();
    g.strokeStyle = '#fff3e0'; g.lineWidth = 8; g.beginPath(); g.arc(512, 175, 82, 0, 7); g.stroke();
    g.strokeStyle = '#f2c14e'; g.lineWidth = 7; g.beginPath(); g.arc(512, 175, 56, 0, 7); g.stroke();
    g.fillStyle = '#a80f09'; g.beginPath(); g.arc(512, 175, 34, 0, 7); g.fill();
    g.strokeStyle = '#fff3e0'; g.lineWidth = 5; g.beginPath(); g.arc(512, 175, 34, 0, 7); g.stroke();
    g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(512, 175, 10, 0, 7); g.fill();
    // white "U" mark between brows down to the nose
    g.strokeStyle = '#fff3e0'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(470, 268); g.quadraticCurveTo(512, 340, 554, 268); g.stroke();
    // flame eyebrows
    function flame(cx, cy, dir) {
      g.save(); g.translate(cx, cy); g.scale(dir, 1);
      g.fillStyle = '#f0821f';
      g.beginPath(); g.moveTo(-120, 30);
      const tips = [[-110, -40], [-70, -10], [-50, -75], [-15, -20], [10, -85], [35, -15], [70, -70], [80, -5], [128, -30], [120, 30]];
      for (let i = 0; i < tips.length; i++) { const p = tips[i]; g.quadraticCurveTo(p[0] - 10, p[1] + 25, p[0], p[1]); }
      g.closePath(); g.fill();
      g.fillStyle = '#ffd23f';
      g.beginPath(); g.moveTo(-90, 26); g.quadraticCurveTo(-60, -20, -30, 10); g.quadraticCurveTo(0, -40, 20, 6); g.quadraticCurveTo(55, -30, 70, 8); g.quadraticCurveTo(95, -8, 100, 26); g.closePath(); g.fill();
      g.strokeStyle = '#2462c9'; g.lineWidth = 12; g.beginPath(); g.moveTo(-125, 40); g.quadraticCurveTo(0, 2, 125, 38); g.stroke();
      g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.beginPath(); g.moveTo(-122, 52); g.quadraticCurveTo(0, 16, 122, 50); g.stroke();
      g.restore();
    }
    flame(372, 318, 1); flame(652, 318, -1);
    // almond eyes
    function eye(cx, cy, dir) {
      const w = 92, h = 46;
      g.save(); g.translate(cx, cy); g.scale(dir, 1);
      const path = () => { g.beginPath(); g.moveTo(-w, 8); g.quadraticCurveTo(-10, -h * 1.5, w, -2); g.quadraticCurveTo(10, h * 1.45, -w, 8); g.closePath(); };
      path(); g.fillStyle = '#ffd23f'; g.lineWidth = 26; g.strokeStyle = '#ffd23f'; g.stroke();
      path(); g.lineWidth = 15; g.strokeStyle = '#2462c9'; g.stroke();
      path(); g.fillStyle = '#fcf7ec'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#140504'; g.stroke();
      g.save(); path(); g.clip();
      g.fillStyle = '#6b1d0a'; g.beginPath(); g.arc(6, 2, 33, 0, 7); g.fill();
      g.fillStyle = '#0d0302'; g.beginPath(); g.arc(6, 2, 24, 0, 7); g.fill();
      g.restore();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-4, -8, 7, 0, 7); g.fill();
      g.restore();
    }
    eye(382, 418, 1); eye(642, 418, -1);
    // cheek flames curling out from the nose (moustache)
    function cheek(dir) {
      g.save(); g.translate(512, 600); g.scale(dir, 1);
      for (let k = 0; k < 5; k++) {
        const a = -0.5 + k * 0.32, len = 150 + k * 12;
        g.fillStyle = k % 2 ? '#ffb02e' : '#f0821f';
        g.beginPath(); g.moveTo(-50, -10 + k * 6);
        g.quadraticCurveTo(-len * 0.6, -40 + k * 30 - 30, -len * Math.cos(a) - 40, -len * Math.sin(a) * 0.6 - 20);
        g.quadraticCurveTo(-len * 0.55, 10 + k * 22, -50, 20 + k * 6);
        g.closePath(); g.fill();
      }
      g.strokeStyle = '#ffd23f'; g.lineWidth = 6;
      g.beginPath(); g.arc(-210, -50, 26, 0.3, 5.4); g.stroke();
      g.restore();
    }
    cheek(1); cheek(-1);
    // golden nose
    const ng = g.createRadialGradient(498, 520, 8, 512, 535, 80);
    ng.addColorStop(0, '#fff2a8'); ng.addColorStop(0.45, '#f2be3a'); ng.addColorStop(1, '#a8680f');
    g.fillStyle = ng;
    g.beginPath(); g.moveTo(492, 360); g.quadraticCurveTo(512, 345, 532, 360); g.lineTo(552, 500);
    g.bezierCurveTo(600, 520, 590, 590, 540, 588); g.quadraticCurveTo(512, 600, 484, 588);
    g.bezierCurveTo(434, 590, 424, 520, 472, 500); g.closePath(); g.fill();
    g.strokeStyle = '#6b3d06'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#4a1503'; g.beginPath(); g.ellipse(486, 572, 13, 8, 0.3, 0, 7); g.ellipse(538, 572, 13, 8, -0.3, 0, 7); g.fill();
    // mouth: pink lips, dark inside, teeth row, two fangs
    g.save(); g.translate(512, 690);
    g.fillStyle = '#f39ab4';
    g.beginPath(); g.moveTo(-170, -6); g.bezierCurveTo(-110, -78, -40, -58, 0, -50); g.bezierCurveTo(40, -58, 110, -78, 170, -6);
    g.bezierCurveTo(120, 92, -120, 92, -170, -6); g.closePath(); g.fill();
    g.strokeStyle = '#7a1630'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#3a0405';
    g.beginPath(); g.moveTo(-138, -4); g.bezierCurveTo(-90, -42, 90, -42, 138, -4); g.bezierCurveTo(90, 56, -90, 56, -138, -4); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.strokeStyle = '#7a6a60'; g.lineWidth = 2;
    for (let i = -4; i < 4; i++) { const x = i * 26 + 3, y = -28 + Math.abs(i + 0.5) * 3; g.beginPath(); g.rect(x, y, 22, 24); g.fill(); g.stroke(); }
    g.fillStyle = '#e04460'; g.beginPath(); g.ellipse(0, 26, 50, 16, 0, 0, 7); g.fill(); // tongue
    for (const s of [-1, 1]) { // painted fangs
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(s * 128, -18); g.quadraticCurveTo(s * 150, 40, s * 116, 90); g.quadraticCurveTo(s * 120, 30, s * 100, -10); g.closePath(); g.fill();
      g.strokeStyle = '#6b5a50'; g.lineWidth = 3; g.stroke();
    }
    g.restore();
    // flame beard on the chin
    for (let k = -3; k <= 3; k++) {
      g.fillStyle = k % 2 ? '#f0821f' : '#ffb02e';
      g.beginPath(); g.moveTo(512 + k * 34 - 20, 790); g.quadraticCurveTo(512 + k * 40, 900, 512 + k * 52, 935); g.quadraticCurveTo(512 + k * 36 + 6, 860, 512 + k * 34 + 20, 790); g.closePath(); g.fill();
    }
    g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(512, 815, 12, 0, 7); g.fill();
    // green ear rings painted at the sides
    for (const x of [176, 848]) {
      g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(x, 640, 46, 0, 7); g.fill();
      g.fillStyle = '#2f9e4a'; g.beginPath(); g.arc(x, 640, 36, 0, 7); g.fill();
      g.fillStyle = '#7fd08f'; g.beginPath(); g.arc(x - 9, 630, 9, 0, 7); g.fill();
    }
    return mk(c);
  };
  T.tieDye = function (seed) { // the long tie-dyed scarves the dancer swings
    const W = 256, H = 768, c = cv(W, H), g = c.getContext('2d'), R = rng(seed || 4);
    const cols = ['#e3262f', '#1fb3c4', '#ff8f1f', '#2f9e4a', '#ffd23f', '#d6336c', '#1f6fc4'];
    g.fillStyle = '#ff8f1f'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = cols[(R() * cols.length) | 0];
      g.save(); g.translate(R() * W, i * H / 16); g.rotate(-0.6 + R() * 0.3);
      g.fillRect(-W, -30 - R() * 30, W * 3, 50 + R() * 40); g.restore();
    }
    for (let i = 0; i < 9; i++) {
      const x = R() * W, y = R() * H, r = 40 + R() * 70, col = cols[(R() * cols.length) | 0];
      for (let k = 4; k > 0; k--) { g.fillStyle = k % 2 ? col : '#fff1c9'; g.beginPath(); g.arc(x, y, r * k / 4, 0, 7); g.fill(); }
    }
    const c2 = cv(W, H), g2 = c2.getContext('2d');
    g2.filter = 'blur(9px)'; g2.drawImage(c, 0, 0); g2.filter = 'none';
    g2.strokeStyle = 'rgba(255,255,240,0.22)'; g2.lineWidth = 1.5;
    for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H; g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x + (R() - 0.5) * 30, y + 20 + R() * 30); g2.stroke(); }
    // fringe at the end
    g2.fillStyle = '#ffd23f'; g2.fillRect(0, H - 14, W, 14);
    return mk(c2);
  };
  T.brocade = function () { // gold lamé tunic
    const S = 256, c = cv(S, S), g = c.getContext('2d'), R = rng(9);
    g.fillStyle = '#b8862a'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2500; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,236,150,0.35)' : 'rgba(90,50,5,0.3)'; g.fillRect(R() * S, R() * S, 2, 2); }
    for (let y = 0; y < S; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < S + 16; x += 32) {
      g.fillStyle = 'rgba(255,240,170,0.75)';
      g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 10, y); g.lineTo(x, y + 12); g.lineTo(x - 10, y); g.closePath(); g.fill();
      g.fillStyle = 'rgba(120,70,5,0.6)'; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
    }
    return mk(c, true);
  };
  T.hair = function () {
    const c = cv(64, 256), g = c.getContext('2d'), R = rng(21);
    g.fillStyle = '#c4170f'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 120; i++) {
      g.strokeStyle = ['#e8321c', '#8f0c08', '#ff4a26', '#a8110b'][(R() * 4) | 0]; g.lineWidth = 1 + R() * 2;
      const x = R() * 64; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, 90, x - 8, 170, x + 4, 256); g.stroke();
    }
    return mk(c, true);
  };
  T.skirt = function () {
    const c = cv(256, 128), g = c.getContext('2d');
    for (let x = 0; x < 256; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#8e0d09'); gr.addColorStop(0.5, '#d01d12'); gr.addColorStop(1, '#8e0d09'); g.fillStyle = gr; g.fillRect(x, 0, 16, 128); }
    g.fillStyle = '#e8b23a'; g.fillRect(0, 104, 256, 16);
    g.fillStyle = '#2f9e4a'; for (let x = 4; x < 256; x += 16) { g.beginPath(); g.arc(x, 112, 4, 0, 7); g.fill(); }
    g.fillStyle = '#1a6fd0'; g.fillRect(0, 120, 256, 8);
    return mk(c, true);
  };
  T.patasi = function () { // haku patasi: black handloom sari, red border at the hem
    const c = cv(256, 128), g = c.getContext('2d'), R = rng(41);
    g.fillStyle = '#141010'; g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 600; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)'; g.fillRect(R() * 256, R() * 128, 2, 1); }
    for (let x = 0; x < 256; x += 22) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, 0, 6, 128); } // folds
    g.fillStyle = '#b3160f'; g.fillRect(0, 100, 256, 28);
    g.fillStyle = '#e8b23a'; g.fillRect(0, 103, 256, 2); g.fillRect(0, 122, 256, 2);
    g.fillStyle = '#7a0b07'; for (let x = 4; x < 256; x += 14) { g.beginPath(); g.moveTo(x, 108); g.lineTo(x + 5, 113); g.lineTo(x, 118); g.lineTo(x - 5, 113); g.fill(); }
    const t = mk(c, true); t.repeat.set(3, 1); return t;
  };
  T.shawl = function () { // patterned shawl (ga) worn over the blouse
    const c = cv(64, 256), g = c.getContext('2d');
    g.fillStyle = '#8e1020'; g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 32) { g.fillStyle = '#e8b23a'; g.fillRect(0, y, 64, 4); g.fillStyle = '#16110e'; g.fillRect(0, y + 8, 64, 6); }
    for (let y = 18; y < 256; y += 32) for (let x = 8; x < 64; x += 16) { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    g.fillStyle = '#e8b23a'; g.fillRect(0, 0, 4, 256); g.fillRect(60, 0, 4, 256);
    return mk(c);
  };
  T.coin = function () { // gold mohar face
    const c = cv(128, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(50, 45, 5, 64, 64, 64); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.6, '#f1bf3a'); gr.addColorStop(1, '#a8700f');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#8a5a08'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke();
    for (let a = 0; a < 24; a++) { g.fillStyle = '#a8700f'; g.beginPath(); g.arc(64 + Math.cos(a / 24 * 6.283) * 46, 64 + Math.sin(a / 24 * 6.283) * 46, 2.5, 0, 7); g.fill(); }
    g.strokeStyle = '#8a5a08'; g.lineWidth = 4; g.strokeRect(40, 40, 48, 48);
    g.save(); g.translate(64, 64); g.rotate(Math.PI / 4); g.strokeRect(-24, -24, 48, 48); g.restore();
    g.fillStyle = '#8a5a08'; g.beginPath(); g.arc(64, 64, 8, 0, 7); g.fill();
    return mk(c);
  };
  T.sign = function (title, sub, dir, gold) { // wooden fork sign
    const c = cv(512, 256), g = c.getContext('2d');
    g.fillStyle = '#3a1d0d'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = gold ? '#7a4a12' : '#5a3216'; g.fillRect(10, 10, 492, 236);
    g.strokeStyle = gold ? '#ffd23f' : '#e8b23a'; g.lineWidth = 6; g.strokeRect(22, 22, 468, 212);
    g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '64px "Yatra One", serif'; g.fillText(title, 256, 104);
    g.font = '30px "Mukta", sans-serif'; g.fillStyle = gold ? '#ffd23f' : '#f6d9a8'; g.fillText(sub, 256, 168);
    g.fillStyle = gold ? '#ffd23f' : '#fff3d6';
    g.beginPath();
    if (dir < 0) { g.moveTo(34, 128); g.lineTo(74, 92); g.lineTo(74, 164); } else { g.moveTo(478, 128); g.lineTo(438, 92); g.lineTo(438, 164); }
    g.fill();
    const t = mk(c); return t;
  };
  T.mountains = function () {
    const W = 2048, H = 256, c = cv(W, H), g = c.getContext('2d'), R = rng(31);
    function ridge(base, amp, col, rough, snow) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      let y = base; const pts = [];
      for (let x = 0; x <= W; x += 8) { y += (R() - 0.5) * rough; y = Math.max(base - amp, Math.min(base + amp * 0.3, y)); pts.push([x, y]); g.lineTo(x, y); }
      g.lineTo(W, H); g.closePath(); g.fill();
      if (snow) { g.fillStyle = snow; for (const p of pts) if (p[1] < base - amp * 0.55) g.fillRect(p[0], p[1], 8, (base - amp * 0.55 - p[1]) * 0.8 + 2); }
    }
    ridge(130, 110, '#b9a6c9', 26, 'rgba(255,214,200,0.9)');
    ridge(190, 50, '#6d4f78', 12);
    ridge(225, 30, '#45304f', 8);
    // Swayambhu on its hill
    const sx = 620; g.fillStyle = '#45304f'; g.beginPath(); g.ellipse(sx, 222, 120, 34, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#efe6dc'; g.beginPath(); g.arc(sx, 192, 18, Math.PI, 0); g.fill();
    g.fillStyle = '#e8b23a'; g.fillRect(sx - 7, 160, 14, 32); g.beginPath(); g.moveTo(sx - 10, 162); g.lineTo(sx, 140); g.lineTo(sx + 10, 162); g.fill();
    const t = mk(c); t.wrapS = THREE.RepeatWrapping; return t;
  };
  T.glow = function () {
    const c = cv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  };
  T.petal = function () {
    const c = cv(32, 32), g = c.getContext('2d');
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 16, 13, 8, 0.5, 0, 7); g.fill();
    return new THREE.CanvasTexture(c);
  };
  T.env = function () { // small equirect sky for reflections on gold and the glossy mask
    const c = cv(256, 128), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#3b3f7a'); gr.addColorStop(0.42, '#d77a6a'); gr.addColorStop(0.5, '#ffcf8a'); gr.addColorStop(0.56, '#7a3b26'); gr.addColorStop(1, '#2a140c');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    const s = g.createRadialGradient(64, 60, 0, 64, 60, 30); s.addColorStop(0, 'rgba(255,250,220,1)'); s.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = s; g.fillRect(0, 20, 140, 80);
    g.fillStyle = 'rgba(255,190,110,0.8)'; for (let i = 0; i < 30; i++) g.fillRect(Math.random() * 256, 70 + Math.random() * 10, 3, 2);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    return t;
  };
})();
