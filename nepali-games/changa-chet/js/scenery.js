// Static scenery, pre-rendered once per screen size: Himalaya ridges, houses, pagoda, stupa,
// plus the moving decor (clouds, far-off kites, prayer-flag lines).
(() => {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { TAU, FLAG, RIVAL_PALS, rand, lerp, pick, mulberry32 } = CC.Util;

  const BACK_HOUSES = ['#a8604a', '#c98f6a', '#b9a58a', '#9c5b4b', '#d7b98e', '#a77d6b'];
  const FRONT_HOUSES = ['#9b3f2c', '#b5523b', '#d79a6a', '#e2c48f', '#c9cfa0', '#a24a36', '#e6d7c0', '#cf7b5a'];

  // Called from resize() with the current layout; returns the baked layers and fresh decor.
  function build(W, H, DPR, U, K, roofY, PX) {
    let bgLayer = null, cityLayer = null;
    let clouds = [], farKites = [], flagLines = [];

    // ---------- Static scenery (pre-rendered) ----------
    function makeLayer() {
      const c = document.createElement('canvas');
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      const x = c.getContext('2d');
      x.setTransform(DPR, 0, 0, DPR, 0, 0);
      return { c, x };
    }

    function ridge(c, rnd, baseY, amp, stops) {
      let ys = [baseY - rnd() * amp, baseY - rnd() * amp];
      let disp = amp * 0.7;
      for (let it = 0; it < 7; it++) {
        const next = [];
        for (let i = 0; i < ys.length - 1; i++) next.push(ys[i], (ys[i] + ys[i + 1]) / 2 + (rnd() - 0.5) * disp * 2);
        next.push(ys[ys.length - 1]);
        ys = next; disp *= 0.56;
      }
      c.beginPath(); c.moveTo(0, H);
      ys.forEach((y, i) => c.lineTo((i / (ys.length - 1)) * W, y));
      c.lineTo(W, H); c.closePath();
      const top = Math.min(...ys);
      const gr = c.createLinearGradient(0, top, 0, baseY + amp * 0.4);
      stops.forEach(([o, col]) => gr.addColorStop(o, col));
      c.fillStyle = gr; c.fill();
    }

    function drawHouse(c, rnd, x, top, w, color, tank, rail) {
      c.fillStyle = color; c.fillRect(x, top, w, H - top + 2);
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, top, w, U * 0.8);
      const ww = U * 2.2, wh = U * 2.8, gx = U * 3.6, gy = U * 5;
      const cols = Math.max(1, Math.floor((w - U * 2) / gx));
      const ox = x + (w - (cols - 1) * gx - ww) / 2;
      c.lineWidth = Math.max(1, U * 0.2);
      for (let y = top + U * 2.5; y < H; y += gy) {
        for (let i = 0; i < cols; i++) {
          const wx = ox + i * gx;
          c.fillStyle = '#3a2216'; c.fillRect(wx, y, ww, wh);
          c.fillStyle = rnd() < 0.22 ? 'rgba(255,214,120,0.85)' : 'rgba(120,80,50,0.9)';
          c.fillRect(wx + U * 0.35, y + U * 0.35, ww - U * 0.7, wh - U * 0.7);
          c.strokeStyle = '#3a2216';
          c.beginPath(); c.moveTo(wx + ww / 2, y); c.lineTo(wx + ww / 2, y + wh); c.moveTo(wx, y + wh / 2); c.lineTo(wx + ww, y + wh / 2); c.stroke();
        }
      }
      if (tank) { // the classic black rooftop water tank
        const tw = U * 2.6, th = U * 3, tx = x + w * (0.2 + rnd() * 0.5);
        c.fillStyle = '#1d1d1f'; c.fillRect(tx, top - th, tw, th);
        c.beginPath(); c.ellipse(tx + tw / 2, top - th, tw / 2, U * 0.6, 0, 0, TAU); c.fill();
      }
      if (rail) {
        c.strokeStyle = 'rgba(40,25,20,0.7)'; c.lineWidth = Math.max(1, U * 0.25);
        c.beginPath(); c.moveTo(x, top - U * 1.6); c.lineTo(x + w, top - U * 1.6);
        for (let i = 0; i <= w; i += U * 2) { c.moveTo(x + i, top); c.lineTo(x + i, top - U * 1.6); }
        c.stroke();
      }
    }

    function drawPagoda(c, cx, baseY, s) {
      c.fillStyle = '#9a6b4f';
      for (let i = 0; i < 4; i++) { const w = s * (30 - i * 4), h = s * 1.6; c.fillRect(cx - w / 2, baseY - (i + 1) * h, w, h); }
      let y = baseY - 4 * s * 1.6;
      const tiers = [{ bw: 16, bh: 7, rw: 27, rh: 4 }, { bw: 12, bh: 5, rw: 21, rh: 3.5 }, { bw: 8, bh: 4, rw: 15, rh: 3 }];
      for (const tr of tiers) {
        c.fillStyle = '#8c3b26'; c.fillRect(cx - (tr.bw * s) / 2, y - tr.bh * s, tr.bw * s, tr.bh * s);
        y -= tr.bh * s;
        c.fillStyle = '#4a2a1a';
        c.beginPath();
        c.moveTo(cx - (tr.rw * s) / 2, y + s * 0.8);
        c.quadraticCurveTo(cx - tr.rw * s * 0.3, y - s * 0.2, cx - tr.bw * s * 0.35, y - tr.rh * s);
        c.lineTo(cx + tr.bw * s * 0.35, y - tr.rh * s);
        c.quadraticCurveTo(cx + tr.rw * s * 0.3, y - s * 0.2, cx + (tr.rw * s) / 2, y + s * 0.8);
        c.closePath(); c.fill();
        y -= tr.rh * s;
      }
      c.fillStyle = '#e0b13a'; // gajur
      c.beginPath(); c.moveTo(cx - s * 1.4, y); c.lineTo(cx + s * 1.4, y); c.lineTo(cx, y - s * 5); c.closePath(); c.fill();
      c.beginPath(); c.arc(cx, y - s * 1.2, s * 1.1, 0, TAU); c.fill();
    }

    function drawStupa(c, cx, baseY, s) {
      c.fillStyle = '#e9e4da';
      for (let i = 0; i < 3; i++) { const w = s * (36 - i * 7), h = s * 2.2; c.fillRect(cx - w / 2, baseY - (i + 1) * h, w, h); }
      const domeY = baseY - 3 * s * 2.2, r = s * 11, hy = domeY - r - s * 4.5, tipY = domeY - r - s * 15;
      // prayer flags from the spire
      for (const side of [-1, 1]) {
        const ex = cx + side * s * 19, ey = baseY - s * 6.6;
        c.strokeStyle = 'rgba(80,60,50,0.6)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(cx, tipY); c.lineTo(ex, ey); c.stroke();
        for (let i = 1; i < 12; i++) {
          const k = i / 12, fx = lerp(cx, ex, k), fy = lerp(tipY, ey, k);
          c.fillStyle = FLAG[i % 5]; c.fillRect(fx - s * 0.5, fy, s * 1, s * 1.4);
        }
      }
      c.fillStyle = '#f7f4ee'; c.beginPath(); c.arc(cx, domeY, r, Math.PI, 0); c.fill();
      c.fillStyle = '#e8c35a'; c.fillRect(cx - s * 3.2, hy, s * 6.4, s * 4.5);
      c.fillStyle = '#2a1a14'; // the watchful eyes
      for (const side of [-1, 1]) { c.beginPath(); c.ellipse(cx + side * s * 1.5, hy + s * 2.1, s * 0.9, s * 0.42, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#d9a521';
      c.beginPath(); c.moveTo(cx - s * 2.8, hy); c.lineTo(cx + s * 2.8, hy); c.lineTo(cx, tipY); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,80,10,0.55)'; c.lineWidth = Math.max(1, s * 0.3);
      for (let i = 1; i < 7; i++) { const yy = lerp(hy, tipY, i / 8), hw = lerp(s * 2.8, 0, i / 8); c.beginPath(); c.moveTo(cx - hw, yy); c.lineTo(cx + hw, yy); c.stroke(); }
    }

    function buildLayers() {
      const rnd = mulberry32(7);
      const bg = makeLayer();
      const amp = Math.min(H * 0.2, W * 0.22);
      ridge(bg.x, rnd, roofY - H * 0.22, amp, [[0, '#ffffff'], [0.3, '#e3edf7'], [0.55, '#a9bfd6'], [1, '#8099b5']]);
      ridge(bg.x, rnd, roofY - H * 0.08, amp * 0.35, [[0, '#6f9a86'], [1, '#456b5c']]);
      ridge(bg.x, rnd, roofY - U * 2, amp * 0.18, [[0, '#7d8f86'], [1, '#5d6e66']]);
      bgLayer = bg.c;

      const city = makeLayer(), c = city.x;
      drawPagoda(c, W * 0.6, roofY + U * 1.5, U * 0.75);
      drawStupa(c, W * 0.86, roofY + U * 0.5, U * 0.55);
      let x = -U * 3;
      while (x < W + U * 3) {
        const w = U * (8 + rnd() * 8);
        drawHouse(c, rnd, x, roofY - U * (1 + rnd() * 7), w, BACK_HOUSES[(rnd() * BACK_HOUSES.length) | 0], rnd() < 0.35, false);
        x += w - U * 0.5;
      }
      c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(200,215,232,0.4)'; c.fillRect(0, 0, W, H); c.restore();
      x = -U * 2;
      while (x < W + U * 2) {
        const w = U * (9 + rnd() * 9);
        drawHouse(c, rnd, x, roofY + U * (1.5 + rnd() * 6), w, FRONT_HOUSES[(rnd() * FRONT_HOUSES.length) | 0], rnd() < 0.4, rnd() < 0.3);
        x += w + U * rnd() * 1.5;
      }
      drawHouse(c, rnd, PX - U * 8, roofY, U * 16, '#b4533a', false, false); // your rooftop
      cityLayer = city.c;
    }

    function buildDecor() {
      clouds = Array.from({ length: 5 }, () => ({ x: rand(0, W), y: rand(H * 0.06, H * 0.35), s: rand(U * 5, U * 10), sp: rand(0.5, 1.3) }));
      farKites = Array.from({ length: W > H ? 7 : 5 }, () => ({
        x: rand(W * 0.05, W * 0.95), y: rand(H * 0.12, roofY - H * 0.25), s: K * rand(0.22, 0.34),
        pal: pick(RIVAL_PALS), ph: rand(0, TAU), ax: rand(-W * 0.1, W * 1.1),
      }));
      const top = roofY - U * 10;
      flagLines = [
        { x1: PX - U * 7.5, y1: top, x2: PX - U * 32, y2: roofY + U * 2, n: 9 },
        { x1: PX + U * 7.5, y1: top, x2: PX + U * 36, y2: roofY + U * 3, n: 10 },
      ];
    }

    buildLayers();
    buildDecor();
    return { bgLayer, cityLayer, clouds, farKites, flagLines };
  }

  CC.Scenery = { build };
})();
