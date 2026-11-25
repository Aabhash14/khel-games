// Tihar Diyo: everything you see is painted here, in code. A Newari house on a moonless Tihar night:
// tiled eave with carved struts, a torana over a carved window (the puzzle), marigold swags, a sill of
// little diyos, rangoli in coloured powder on the doorstep. Used by the live stage and the story image.
(function (root) {
  'use strict';
  var TAU = Math.PI * 2;
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

  // One palette per night. Laxmi Puja's house gets the cleaned rato mato / kamero walls.
  var PAL = {
    kaag: { sky: ['#070a24', '#1d2050', '#3a2c5c'], hill: ['#14163a', '#1b1b44'], wall: 'brick', brick: '#7c3322', mortar: '#4a1b10',
      wood: '#2a150b', woodHi: '#5b3418', roof: '#6e2c18', garland: ['#ff9a1f', '#ffc928'], leaf: '#2f8a3c',
      rangoli: ['#e8336f', '#ffd23f', '#2fb36b', '#fff4e0', '#3f7be0'], motif: 'crow', accent: '#ffb02e' },
    kukur: { sky: ['#0d0920', '#2c1a44', '#4a2848'], hill: ['#1d1230', '#251838'], wall: 'brick', brick: '#8a4426', mortar: '#4f2412',
      wood: '#2c160a', woodHi: '#64391a', roof: '#74321a', garland: ['#ff8a00', '#ffcf33'], leaf: '#2f8a3c',
      rangoli: ['#d7261e', '#ffd23f', '#ff8a00', '#fff4e0', '#7b3fd0'], motif: 'dog', accent: '#ff8a00' },
    laxmi: { sky: ['#06061c', '#1b1748', '#3b2a66'], hill: ['#12103a', '#19154a'], wall: 'lime', lime: '#eadcc0', rato: '#9e2a1c', mortar: '#c9b994',
      wood: '#33170a', woodHi: '#6e3c18', roof: '#7a3016', garland: ['#ff9500', '#ffd000'], leaf: '#2f8a3c',
      rangoli: ['#e0237a', '#ffd000', '#1fa463', '#fff4e0', '#2a6fdb', '#ff5a1f'], motif: 'feet', accent: '#ffd000' },
    mha: { sky: ['#03121b', '#0f3240', '#1f4a52'], hill: ['#08222b', '#0c2a34'], wall: 'brick', brick: '#6e2c20', mortar: '#3c150d',
      wood: '#24130a', woodHi: '#563116', roof: '#5f2615', garland: ['#ff7a1a', '#ffd23f'], leaf: '#2f8a3c',
      rangoli: ['#ffd23f', '#1fa463', '#ff7a1a', '#fff4e0', '#d7261e'], motif: 'mandala', accent: '#3fd0a0' },
    bhai: { sky: ['#0c0620', '#2e1046', '#4b1a52'], hill: ['#1b0c2c', '#231034'], wall: 'brick', brick: '#7a2e2a', mortar: '#401512',
      wood: '#2a1309', woodHi: '#5e3218', roof: '#6c2a1c', garland: ['#a0247a', '#ff9a1f'], leaf: '#2f8a3c',
      rangoli: ['#e6332a', '#ff9800', '#ffd600', '#2e9e4f', '#1e88e5', '#8e24aa', '#fff4e0'], motif: 'tika', accent: '#e05cc0' }
  };
  var NIGHT_IDS = ['kaag', 'kukur', 'laxmi', 'mha', 'bhai'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function srand(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  }

  // ---------- layout ----------
  // Where everything goes for a stage of W x H (CSS px) holding a cols x rows grid.
  function layout(W, H, cols, rows, o) {
    o = o || {};
    var K = o.scale || 1;
    var side = clamp(W * 0.03, 6, 28);
    var s = Math.min((W - 2 * side) / (cols + 0.56), (H - 30) / (rows + 2.05), o.maxTile || 92);
    // short stages (a phone on its side): slim the roof, torana and sill so the tiles stay big enough to tap
    var compact = s < 44 && H < 560;
    if (compact) s = Math.min((W - 2 * side) / (cols + 0.56), (H - 66) / rows, o.maxTile || 92);
    s = Math.max(20, Math.floor(s));
    var F = compact ? 8 : clamp(Math.round(s * 0.26), 8, 24 * K);
    var roofT = compact ? 18 : clamp(Math.round(s * 0.62), 18, 64 * K);
    var tor = compact ? 10 : clamp(Math.round(s * 0.5), 10, 46 * K);
    var sill = compact ? 14 : clamp(Math.round(s * 0.46), 14, 34 * K);
    var gw = s * cols, gh = s * rows;
    var used = roofT + tor + F * 2 + gh + sill;
    var extra = Math.max(0, H - used);
    var sky = Math.max(4, Math.min(extra * (o.skyShare || 0.42), H * 0.2));
    var roofTop = Math.round(sky);
    var eaveY = roofTop + roofT;
    var frameTop = eaveY + tor;
    var gx = Math.round((W - gw) / 2), gy = frameTop + F;
    var sillY = gy + gh + F;
    var groundY = Math.min(H - 10, sillY + sill + Math.max(4, Math.round(s * 0.12)));
    var half = Math.min(W / 2 - 2, gw / 2 + F + Math.max(s * 1.25, 18));
    if (W > 700) half = Math.min(W / 2 - 2, gw / 2 + F + Math.max(s * 1.9, 60));
    return {
      W: W, H: H, cols: cols, rows: rows, s: s, F: F, gx: gx, gy: gy, gw: gw, gh: gh,
      roofTop: roofTop, eaveY: eaveY, frameTop: frameTop, sillY: sillY, sillH: sill, groundY: groundY,
      hx0: Math.round(W / 2 - half), hx1: Math.round(W / 2 + half), tor: tor, roofT: roofT
    };
  }

  // ---------- backdrop (static, cached by the stage) ----------
  function paintBackdrop(ctx, L, pal, seed) {
    var W = L.W, H = L.H, R = srand(seed || 7), i;
    // sky: Laxmi Puja falls on aunsi, so no moon, only stars and far-off lights
    var g = ctx.createLinearGradient(0, 0, 0, L.groundY);
    g.addColorStop(0, pal.sky[0]); g.addColorStop(0.65, pal.sky[1]); g.addColorStop(1, pal.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (i = 0; i < Math.round(W * H / 2600); i++) {
      var sx = R() * W, sy = R() * L.groundY * 0.8, sr = R() < 0.1 ? 1.4 : 0.4 + R() * 0.7;
      ctx.globalAlpha = 0.35 + R() * 0.6; ctx.fillStyle = R() < 0.15 ? '#ffe2b0' : '#e8ecff';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // valley rim hills
    hills(ctx, W, L.groundY - (L.groundY - L.eaveY) * 0.55, pal.hill[0], R, 0.5);
    hills(ctx, W, L.groundY - (L.groundY - L.eaveY) * 0.25, pal.hill[1], R, 0.3);
    // neighbours: dark houses dressed in strings of lights
    neighbours(ctx, L, pal, R);
    // the house
    wall(ctx, L, pal, R);
    ground(ctx, L, pal, R);
    roof(ctx, L, pal, R);
    torana(ctx, L, pal);
    frame(ctx, L, pal);
    // window opening: deep inside the room
    ctx.fillStyle = '#0a0503'; ctx.fillRect(L.gx, L.gy, L.gw, L.gh);
    motif(ctx, L, pal, R);
  }

  function hills(ctx, W, y, col, R, amp) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, y + 40);
    var n = 6, ph = R() * 10;
    for (var k = 0; k <= 40; k++) {
      var x = (k / 40) * W;
      var yy = y - Math.sin(k / 40 * Math.PI * 2 + ph) * 18 * amp * 2 - Math.sin(k / 40 * n * 1.7 + ph * 2) * 10 * amp;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(W, y + 400); ctx.lineTo(0, y + 400); ctx.closePath(); ctx.fill();
  }

  function neighbours(ctx, L, pal, R) {
    var bulbs = ['#ffd23f', '#ff5a3c', '#5ad1ff', '#7dff8a', '#ff8ad8', '#ffffff'];
    var spots = [];
    var left = L.hx0, right = L.W - L.hx1;
    var x;
    for (x = L.hx0 - 4; x > -80; ) { var w = 50 + R() * 70; spots.push([x - w, w]); x -= w + 4 + R() * 10; }
    for (x = L.hx1 + 4; x < L.W + 80; ) { var w2 = 50 + R() * 70; spots.push([x, w2]); x += w2 + 4 + R() * 10; }
    if (left < 10 && right < 10) spots = [];
    spots.forEach(function (sp) {
      var hx = sp[0], w = sp[1], top = L.eaveY - 10 + R() * (L.groundY - L.eaveY) * 0.35;
      ctx.fillStyle = '#120a10';
      ctx.fillRect(hx, top, w, L.groundY - top);
      ctx.fillStyle = '#1c0f12';
      ctx.beginPath(); ctx.moveTo(hx - 8, top + 2); ctx.lineTo(hx + w + 8, top + 2); ctx.lineTo(hx + w - 4, top - 12); ctx.lineTo(hx + 4, top - 12); ctx.closePath(); ctx.fill();
      // warm windows
      for (var r = 0; r < 3; r++) for (var c = 0; c < 2; c++) {
        if (R() < 0.45) continue;
        var wx = hx + 10 + c * (w - 30) * 0.9, wy = top + 14 + r * 26;
        if (wy > L.groundY - 20) continue;
        ctx.fillStyle = R() < 0.5 ? '#ffb347' : '#ff8f2e'; ctx.globalAlpha = 0.75;
        ctx.fillRect(wx, wy, 9, 12); ctx.globalAlpha = 1;
      }
      // strings of lights hanging off the eave
      for (var k = 0; k < 2; k++) {
        var yy = top + 3 + k * 4;
        for (var bx = hx; bx < hx + w; bx += 6) {
          var sag = Math.sin(((bx - hx) / w) * Math.PI) * 6;
          ctx.fillStyle = bulbs[Math.floor(R() * bulbs.length)];
          ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.arc(bx, yy + sag, 1.3, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    });
  }

  function wall(ctx, L, pal, R) {
    var x0 = L.hx0, x1 = L.hx1, y0 = L.eaveY - 2, y1 = L.groundY;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    if (pal.wall === 'lime') {
      // kamero (white clay) above, rato mato (red clay) below: freshly done for Laxmi Puja
      ctx.fillStyle = pal.lime; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      var band = L.sillY + L.sillH * 0.4;
      ctx.fillStyle = pal.rato; ctx.fillRect(x0, band, x1 - x0, y1 - band);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0, band, x1 - x0, 2);
      for (var k = 0; k < 160; k++) {
        ctx.fillStyle = 'rgba(120,90,50,' + (0.03 + R() * 0.05) + ')';
        ctx.fillRect(x0 + R() * (x1 - x0), y0 + R() * (band - y0), 2 + R() * 6, 1 + R() * 3);
      }
    } else {
      ctx.fillStyle = pal.mortar; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      var bh = clamp(L.s * 0.16, 5, 11), bw = bh * 2.6, row = 0;
      for (var y = y0; y < y1; y += bh, row++) {
        for (var x = x0 - (row % 2 ? bw / 2 : 0); x < x1; x += bw) {
          var v = R();
          ctx.fillStyle = shade(pal.brick, (v - 0.5) * 0.22);
          ctx.fillRect(x + 0.6, y + 0.6, bw - 1.2, bh - 1.2);
        }
      }
    }
    // night: the wall is lit from the window and falls into shadow at the edges
    var lg = ctx.createRadialGradient(L.W / 2, L.gy + L.gh / 2, L.gw * 0.3, L.W / 2, L.gy + L.gh / 2, Math.max(L.gw, L.gh) * 1.3);
    lg.addColorStop(0, 'rgba(255,170,60,0.10)'); lg.addColorStop(1, 'rgba(6,4,20,0.55)');
    ctx.fillStyle = lg; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
    // pilasters at the house corners
    ctx.fillStyle = pal.wood; ctx.fillRect(x0, y0, 4, y1 - y0); ctx.fillRect(x1 - 4, y0, 4, y1 - y0);
  }

  function ground(ctx, L, pal, R) {
    var y = L.groundY, H = L.H, W = L.W;
    var g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#2b1c1a'); g.addColorStop(1, '#120b0d');
    ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y, W, 3);
    // stone steps in front of the door
    ctx.fillStyle = '#3a2a26'; ctx.fillRect(L.hx0 + 6, y, L.hx1 - L.hx0 - 12, 4);
    // rangoli in coloured powder on the doorstep (or a Mha Puja mandala)
    var rad = Math.min((H - y) * 1.15, L.gw * 0.62, 260);
    if (rad > 14) rangoli(ctx, W / 2, H + rad * 0.12, rad, pal, R);
  }

  function rangoli(ctx, cx, cy, r, pal, R) {
    var cols = pal.rangoli, n = pal.motif === 'mandala' ? 12 : 8;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, cy - r * 1.2, cx * 2, r * 1.2); ctx.clip();
    // powder edges are soft: draw each ring as many little dots
    for (var ring = 0; ring < 5; ring++) {
      var rad = r * (1 - ring * 0.19), col = cols[ring % cols.length];
      ctx.fillStyle = col;
      if (ring % 2 === 0) {
        // petal ring
        for (var p = 0; p < n * 2; p++) {
          var a = Math.PI + (p + 0.5) / (n * 2) * Math.PI;
          ctx.save(); ctx.translate(cx + Math.cos(a) * rad * 0.82, cy + Math.sin(a) * rad * 0.82); ctx.rotate(a + Math.PI / 2);
          ctx.beginPath(); ctx.ellipse(0, 0, rad * 0.09, rad * 0.17, 0, 0, TAU); ctx.fill();
          ctx.restore();
        }
      } else {
        ctx.beginPath(); ctx.arc(cx, cy, rad * 0.86, Math.PI, TAU); ctx.lineWidth = Math.max(2, r * 0.05); ctx.strokeStyle = col; ctx.stroke();
      }
      // dotted border
      for (var d = 0; d < 40; d++) {
        var b = Math.PI + d / 40 * Math.PI;
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(cx + Math.cos(b) * rad, cy + Math.sin(b) * rad, Math.max(1, r * 0.016), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // speckle so it reads as powder
    for (var k = 0; k < r * 3; k++) {
      var aa = Math.PI + R() * Math.PI, dd = R() * r;
      ctx.fillStyle = cols[Math.floor(R() * cols.length)]; ctx.globalAlpha = 0.5;
      ctx.fillRect(cx + Math.cos(aa) * dd, cy + Math.sin(aa) * dd, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function roof(ctx, L, pal, R) {
    var over = Math.max(10, L.s * 0.5);
    var x0 = L.hx0 - over, x1 = L.hx1 + over, top = L.roofTop, y = L.eaveY;
    // struts (tunala) under the eave, carved
    var sx0 = L.hx0 + 6, sx1 = L.hx1 - 6, n = Math.max(2, Math.round((sx1 - sx0) / Math.max(L.s * 1.1, 34)));
    for (var k = 0; k <= n; k++) {
      var x = sx0 + (sx1 - sx0) * (k / n);
      var dir = x < L.W / 2 ? -1 : 1;
      ctx.save(); ctx.translate(x, y + L.tor * 0.85); ctx.rotate(dir * 0.35);
      ctx.fillStyle = pal.wood; ctx.fillRect(-3, -L.tor * 0.95, 6, L.tor * 0.95);
      ctx.fillStyle = pal.woodHi; ctx.fillRect(-1, -L.tor * 0.85, 1.5, L.tor * 0.7);
      ctx.restore();
    }
    // the tiled eave (jhingati): rows of little clay tiles
    ctx.fillStyle = '#1a0d08';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1 - over * 0.6, top); ctx.lineTo(x0 + over * 0.6, top); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    var th = Math.max(4, (y - top) / 4);
    for (var ry = top; ry < y; ry += th) {
      for (var rx = x0 + ((ry - top) / th % 2 ? th : 0); rx < x1; rx += th * 2) {
        ctx.fillStyle = shade(pal.roof, (R() - 0.5) * 0.25 - (y - ry) / (y - top) * 0.15);
        ctx.beginPath(); ctx.arc(rx, ry + th, th, Math.PI, TAU); ctx.fill();
      }
    }
    ctx.restore();
    // eave board
    ctx.fillStyle = pal.wood; ctx.fillRect(x0, y - 4, x1 - x0, 6);
    ctx.fillStyle = pal.woodHi; ctx.fillRect(x0, y - 4, x1 - x0, 1.5);
    // a ridge line at the top, just under the night
    ctx.fillStyle = 'rgba(255,190,120,0.18)'; ctx.fillRect(x0 + over * 0.6, top, x1 - x0 - over * 1.2, 1.5);
  }

  function torana(ctx, L, pal) {
    var cx = L.W / 2, base = L.frameTop, r = Math.min(L.tor * 0.95, L.gw * 0.32);
    if (r < 8) return;
    ctx.save();
    ctx.fillStyle = pal.wood;
    ctx.beginPath(); ctx.ellipse(cx, base, r * 1.6, r, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = pal.woodHi; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, base, r * 1.42, r * 0.84, 0, Math.PI, TAU); ctx.stroke();
    // carved rays
    for (var k = 1; k < 12; k++) {
      var a = Math.PI + (k / 12) * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.5, base + Math.sin(a) * r * 0.3); ctx.lineTo(cx + Math.cos(a) * r * 1.38, base + Math.sin(a) * r * 0.8); ctx.stroke();
    }
    // the gilded centre medallion
    var gg = ctx.createRadialGradient(cx - r * 0.1, base - r * 0.35, 1, cx, base - r * 0.3, r * 0.45);
    gg.addColorStop(0, '#ffe7a0'); gg.addColorStop(0.6, '#d29a2e'); gg.addColorStop(1, '#7a4a12');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, base - r * 0.32, r * 0.36, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // carved window: outer frame, lattice band, and the lintel/sill "ears" that make it Newari
  function frame(ctx, L, pal) {
    var F = L.F, x = L.gx - F, y = L.gy - F, w = L.gw + 2 * F, h = L.gh + 2 * F;
    var ear = Math.min(F * 1.6, (L.hx1 - L.hx0 - w) / 2 - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = pal.wood; ctx.fillRect(x, y, w, h);
    // lintel and sill beams with ears
    var bh = Math.max(4, F * 0.55);
    beam(ctx, x - ear, y - bh * 0.4, w + ear * 2, bh, pal);
    beam(ctx, x - ear, y + h - bh * 0.6, w + ear * 2, bh, pal);
    // lattice band: a running row of little carved diamonds and beads
    var inset = F * 0.28, band = F * 0.44;
    ctx.save();
    ctx.beginPath(); ctx.rect(x + inset, y + inset, w - inset * 2, h - inset * 2); ctx.rect(x + inset + band, y + inset + band, w - (inset + band) * 2, h - (inset + band) * 2);
    ctx.clip('evenodd');
    ctx.fillStyle = shade(pal.wood, 0.2); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = pal.woodHi;
    var step = Math.max(5, band * 1.1);
    for (var px = x; px < x + w; px += step) for (var py = y; py < y + h; py += step) {
      ctx.beginPath(); ctx.moveTo(px + step / 2, py + 1); ctx.lineTo(px + step - 1, py + step / 2); ctx.lineTo(px + step / 2, py + step - 1); ctx.lineTo(px + 1, py + step / 2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // inner lip
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(L.gx - 1, L.gy - 1, L.gw + 2, L.gh + 2);
    ctx.strokeStyle = shade(pal.woodHi, 0.15); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function beam(ctx, x, y, w, h, pal) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, pal.woodHi); g.addColorStop(1, pal.wood);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y + h * 0.3); ctx.lineTo(x + h, y); ctx.lineTo(x + w - h, y); ctx.lineTo(x + w, y + h * 0.3); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  }

  function motif(ctx, L, pal, R) {
    var m = pal.motif;
    if (m === 'crow') {
      crow(ctx, L.hx0 + (L.hx1 - L.hx0) * 0.16, L.roofTop + 1, clamp(L.s * 0.42, 12, 34), 1);
      if (L.W > 500) crow(ctx, L.hx1 - (L.hx1 - L.hx0) * 0.2, L.roofTop + 1, clamp(L.s * 0.36, 10, 30), -1);
    } else if (m === 'dog') {
      var ds = clamp(L.s * 0.9, 22, 70);
      dog(ctx, Math.max(L.hx0 + ds * 0.4, L.W / 2 - L.gw / 2 - ds * 0.2), L.groundY + Math.min(ds * 0.55, (L.H - L.groundY) * 0.7), ds, pal);
    } else if (m === 'feet') {
      // Laxmi's footprints painted from the street to the door
      var fs = clamp(L.s * 0.2, 6, 16), y0 = L.H - fs, n = 4;
      for (var k = 0; k < n; k++) {
        var fy = y0 - k * fs * 1.9, fx = L.W / 2 + (k % 2 ? fs * 0.7 : -fs * 0.7);
        if (fy < L.groundY + fs) break;
        foot(ctx, fx, fy, fs, k % 2 ? 1 : -1);
      }
    } else if (m === 'mandala') {
      var ms = clamp(L.s * 0.32, 8, 26);
      [-1, 1].forEach(function (sd) { mandalaSeat(ctx, L.W / 2 + sd * Math.min(L.gw * 0.62, L.W * 0.36), L.groundY + Math.min(ms * 1.3, (L.H - L.groundY) * 0.6), ms, pal); });
    } else if (m === 'tika') {
      // saptarangi: seven colours painted on the lintel
      var cols = pal.rangoli, bw = L.gw * 0.5 / 7, x = L.W / 2 - L.gw * 0.25, y = L.gy - L.F - Math.max(4, L.F * 0.55) * 0.4 + 1;
      for (var c = 0; c < 7; c++) { ctx.fillStyle = cols[c % cols.length]; ctx.fillRect(x + c * bw, y, bw - 1, Math.max(2, L.F * 0.25)); }
    }
  }
  function crow(ctx, x, y, s, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s / 30, s / 30);
    ctx.fillStyle = '#05040a';
    ctx.beginPath();
    ctx.moveTo(-14, -6); ctx.quadraticCurveTo(-6, -16, 4, -14); ctx.quadraticCurveTo(10, -22, 16, -18); ctx.lineTo(23, -16); ctx.lineTo(16, -13);
    ctx.quadraticCurveTo(14, -6, 6, -3); ctx.lineTo(-4, -2); ctx.lineTo(-18, 2); ctx.lineTo(-22, 0); ctx.closePath(); ctx.fill();
    ctx.fillRect(1, -3, 1.4, 4); ctx.fillRect(4, -3, 1.4, 4);
    ctx.fillStyle = '#d9d2c0'; ctx.beginPath(); ctx.arc(15, -17, 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function dog(ctx, x, y, s, pal) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 60, s / 60);
    ctx.fillStyle = '#0a0607';
    ctx.beginPath();
    ctx.moveTo(-18, 0); ctx.quadraticCurveTo(-22, -24, -8, -34); ctx.lineTo(-6, -48); ctx.quadraticCurveTo(-2, -58, 6, -56);
    ctx.lineTo(10, -64); ctx.lineTo(13, -54); ctx.quadraticCurveTo(22, -52, 24, -46); ctx.lineTo(16, -42); ctx.quadraticCurveTo(8, -38, 8, -28);
    ctx.quadraticCurveTo(14, -12, 12, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-18, -2); ctx.quadraticCurveTo(-34, -4, -30, -18); ctx.lineTo(-27, -16); ctx.quadraticCurveTo(-28, -8, -16, -8); ctx.fill();
    // marigold mala and red tika: Kukur Tihar
    for (var k = 0; k < 9; k++) {
      var a = 0.2 + k / 8 * 2.4;
      ctx.fillStyle = k % 2 ? pal.garland[1] : pal.garland[0];
      ctx.beginPath(); ctx.arc(2 + Math.cos(a) * 9, -38 + Math.sin(a) * 7, 2.6, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#e0241a'; ctx.beginPath(); ctx.arc(9, -54, 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function foot(ctx, x, y, s, side) {
    ctx.save(); ctx.translate(x, y); ctx.scale(side, 1);
    ctx.fillStyle = '#e8402a';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.32, s * 0.55, 0, 0, TAU); ctx.fill();
    for (var t = 0; t < 5; t++) { ctx.beginPath(); ctx.arc(-s * 0.26 + t * s * 0.13, -s * 0.66 - (t === 0 ? 0.06 * s : 0), s * (t === 0 ? 0.11 : 0.08), 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.12, s * 0.22, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function mandalaSeat(ctx, x, y, s, pal) {
    var cols = pal.rangoli;
    for (var k = 3; k >= 0; k--) {
      ctx.fillStyle = cols[k % cols.length];
      ctx.beginPath(); ctx.ellipse(x, y, s * (0.5 + k * 0.32), s * (0.2 + k * 0.13), 0, 0, TAU); ctx.fill();
    }
  }

  // ---------- pieces ----------
  function shade(col, amt) {
    var r, g, b, m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(col);
    if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    else { var n = parseInt(col.slice(1), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }

  // A clay diyo. lit 0..1, flare 0..1 for the finale.
  function diyo(ctx, x, y, d, lit, t, seed, flare) {
    ctx.save(); ctx.translate(x, y);
    var rx = d * 0.44, ry = d * 0.13;
    // bowl
    var g = ctx.createLinearGradient(0, -ry, 0, d * 0.3);
    g.addColorStop(0, '#c4642f'); g.addColorStop(1, '#5c2410');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.quadraticCurveTo(-rx * 0.9, d * 0.3, 0, d * 0.3); ctx.quadraticCurveTo(rx * 0.9, d * 0.3, rx * 1.12, -ry * 0.6); ctx.lineTo(rx * 1.32, -ry * 1.6); ctx.lineTo(rx * 0.7, -ry * 0.4); ctx.closePath(); ctx.fill();
    // rim and oil
    ctx.fillStyle = '#7a3418'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lit > 0 ? '#c98a1c' : '#2a120a'; ctx.beginPath(); ctx.ellipse(0, ry * 0.15, rx * 0.8, ry * 0.65, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e08a4a'; ctx.lineWidth = Math.max(0.8, d * 0.03); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    // wick at the spout
    var wx = rx * 1.05, wy = -ry * 1.1;
    ctx.fillStyle = '#f2e6cc'; ctx.fillRect(wx - 1, wy - d * 0.05, 2, d * 0.07);
    if (lit > 0.01) {
      var fl = 1 + 0.1 * Math.sin(t * 11 + seed) + 0.06 * Math.sin(t * 23.7 + seed * 3);
      var fh = d * 0.46 * lit * fl * (1 + (flare || 0) * 0.6), fw = d * 0.13 * (1 + (flare || 0) * 0.4);
      var sway = Math.sin(t * 3.1 + seed) * fw * 0.25;
      ctx.translate(wx, wy - d * 0.04);
      ctx.fillStyle = '#ff7a12';
      tear(ctx, sway, fh, fw);
      ctx.fillStyle = '#ffd04a'; tear(ctx, sway * 0.8, fh * 0.75, fw * 0.7);
      ctx.fillStyle = '#fffbe6'; tear(ctx, sway * 0.6, fh * 0.42, fw * 0.4);
    }
    ctx.restore();
  }
  function tear(ctx, sway, h, w) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w * 1.1, -h * 0.25, -w * 0.5, -h * 0.7, sway, -h);
    ctx.bezierCurveTo(w * 0.5, -h * 0.7, w * 1.1, -h * 0.25, 0, 0); ctx.fill();
  }
  function glow(ctx, x, y, r, a, col) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col || 'rgba(255,190,80,' + a + ')');
    g.addColorStop(0.35, 'rgba(255,140,40,' + (a * 0.45) + ')');
    g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // A brass kalash with mango leaves and a red thread.
  function kalash(ctx, x, y, k, t, flowing) {
    ctx.save(); ctx.translate(x, y + k * 0.06);
    var g = ctx.createRadialGradient(-k * 0.12, -k * 0.02, k * 0.02, 0, k * 0.08, k * 0.4);
    g.addColorStop(0, '#fff0b0'); g.addColorStop(0.35, '#e0aa3c'); g.addColorStop(1, '#6e4210');
    // leaves first, behind the mouth
    ctx.fillStyle = '#2f8a3c';
    [-0.9, -0.35, 0.35, 0.9].forEach(function (a) {
      ctx.save(); ctx.translate(0, -k * 0.3); ctx.rotate(a * 0.7);
      ctx.beginPath(); ctx.ellipse(0, -k * 0.16, k * 0.07, k * 0.18, 0, 0, TAU); ctx.fill(); ctx.restore();
    });
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, k * 0.08, k * 0.32, 0, TAU); ctx.fill();
    ctx.fillRect(-k * 0.12, -k * 0.3, k * 0.24, k * 0.2);
    ctx.beginPath(); ctx.ellipse(0, -k * 0.3, k * 0.22, k * 0.07, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = flowing ? '#ffc23a' : '#3a1e08'; ctx.beginPath(); ctx.ellipse(0, -k * 0.3, k * 0.15, k * 0.04, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d7261e'; ctx.lineWidth = Math.max(1, k * 0.045);
    ctx.beginPath(); ctx.ellipse(0, k * 0.0, k * 0.3, k * 0.06, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = '#d7261e'; ctx.beginPath(); ctx.arc(0, k * 0.17, k * 0.045, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-k * 0.13, k * 0.0, k * 0.05, k * 0.1, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // A tile: carved wood, channels cut in it, oil in the channels.
  // st: { ang, fill, from, on, leak (mask), lock, wind, windLeft, windEvery, focus, hint, bump }
  function tile(ctx, x, y, s, cell, st, t, pal) {
    var cx = x + s / 2, cy = y + s / 2, pad = Math.max(1.2, s * 0.03), r = s * 0.12;
    ctx.save();
    if (st.bump) ctx.translate(Math.sin(st.bump * 40) * st.bump * s * 0.12, 0);
    if (cell.empty) {
      // a carved panel: a lotus in relief, no channel
      ctx.fillStyle = shade(pal.wood, -0.25); rr(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, r); ctx.fill();
      ctx.strokeStyle = shade(pal.woodHi, -0.25); ctx.lineWidth = Math.max(1, s * 0.03);
      for (var p = 0; p < 8; p++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(p * Math.PI / 4);
        ctx.beginPath(); ctx.ellipse(0, -s * 0.18, s * 0.07, s * 0.14, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.06, 0, TAU); ctx.stroke();
      ctx.restore();
      return;
    }
    var base = cell.lock ? shade(pal.woodHi, -0.32) : cell.wind ? '#3b3550' : pal.woodHi;
    var g = ctx.createLinearGradient(x, y, x + s, y + s);
    g.addColorStop(0, shade(base, 0.12)); g.addColorStop(1, shade(base, -0.35));
    ctx.fillStyle = g; rr(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, r); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,170,0.16)'; ctx.lineWidth = 1; rr(ctx, x + pad + 1, y + pad + 1, s - pad * 2 - 2, s - pad * 2 - 2, r * 0.8); ctx.stroke();
    if (st.hint > 0) {
      ctx.fillStyle = 'rgba(232,64,42,' + (0.35 * st.hint) + ')'; rr(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, r); ctx.fill();
    }

    // channels (rotate with the tile while it animates)
    var m = cell.m, len = s / 2 - pad, gw = s * 0.3, ow = s * 0.16;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(st.ang || 0);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#120804'; ctx.lineWidth = gw;
    ctx.beginPath();
    for (var d = 0; d < 4; d++) if (m & (1 << d)) { ctx.moveTo(0, 0); ctx.lineTo(DX[d] * len, DY[d] * len); }
    ctx.stroke();
    ctx.fillStyle = '#120804'; ctx.beginPath(); ctx.arc(0, 0, gw / 2, 0, TAU); ctx.fill();
    // groove lip highlight
    ctx.strokeStyle = 'rgba(255,200,140,0.14)'; ctx.lineWidth = 1;
    for (d = 0; d < 4; d++) if (m & (1 << d)) {
      var px = -DY[d] * gw / 2, py = DX[d] * gw / 2;
      ctx.beginPath(); ctx.moveTo(px + DX[d] * gw / 2, py + DY[d] * gw / 2); ctx.lineTo(px + DX[d] * len, py + DY[d] * len); ctx.stroke();
    }
    // oil
    var f = st.fill || 0;
    if (f > 0) {
      ctx.strokeStyle = '#f2a51e'; ctx.lineWidth = ow; ctx.lineCap = 'round';
      ctx.beginPath();
      var inF = clamp(f * 2, 0, 1), outF = clamp(f * 2 - 1, 0, 1);
      for (d = 0; d < 4; d++) {
        if (!(m & (1 << d))) continue;
        if (d === st.from) { ctx.moveTo(DX[d] * len, DY[d] * len); ctx.lineTo(DX[d] * len * (1 - inF), DY[d] * len * (1 - inF)); }
        else if (st.from < 0) { ctx.moveTo(0, 0); ctx.lineTo(DX[d] * len * f, DY[d] * len * f); }
        else if (outF > 0) { ctx.moveTo(0, 0); ctx.lineTo(DX[d] * len * outF, DY[d] * len * outF); }
      }
      ctx.stroke();
      // the bright core of the oil
      ctx.strokeStyle = 'rgba(255,236,160,0.75)'; ctx.lineWidth = ow * 0.32; ctx.stroke();
      // glint running outward
      if (f >= 1 && st.on) {
        var ph = ((t * 0.9 + (st.dist || 0) * 0.18) % 1);
        ctx.fillStyle = 'rgba(255,255,230,' + (0.9 * Math.sin(ph * Math.PI)) + ')';
        for (d = 0; d < 4; d++) {
          if (!(m & (1 << d))) continue;
          var q = d === st.from ? 1 - ph : ph;
          ctx.beginPath(); ctx.arc(DX[d] * len * q, DY[d] * len * q, ow * 0.3, 0, TAU); ctx.fill();
        }
      }
    }
    // leaks: oil dripping out of an open end
    if (st.leak) {
      for (d = 0; d < 4; d++) {
        if (!(st.leak & (1 << d))) continue;
        var lx = DX[d] * (len - ow * 0.2), ly = DY[d] * (len - ow * 0.2), dr = (t * 1.6 + d * 0.3) % 1;
        ctx.fillStyle = '#ff6a2a';
        ctx.beginPath(); ctx.arc(lx, ly, ow * 0.55, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,170,60,' + (1 - dr) + ')';
        ctx.beginPath(); ctx.arc(lx + DX[d] * ow * 1.4 * dr, ly + DY[d] * ow * 1.4 * dr + dr * dr * ow * 1.2, ow * 0.32 * (1 - dr * 0.5), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();

    // nails on locked tiles
    if (cell.lock) {
      var nr = Math.max(1.6, s * 0.055), ni = s * 0.17;
      [[ni, ni], [s - ni, ni], [ni, s - ni], [s - ni, s - ni]].forEach(function (p) {
        var ng = ctx.createRadialGradient(x + p[0] - nr * 0.3, y + p[1] - nr * 0.3, 0.5, x + p[0], y + p[1], nr);
        ng.addColorStop(0, '#fff2b8'); ng.addColorStop(0.5, '#d2a03a'); ng.addColorStop(1, '#5d3a0e');
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(x + p[0], y + p[1], nr, 0, TAU); ctx.fill();
      });
    }
    // wind tile: a little prayer-flag cloth and pips counting moves to the next gust
    if (cell.wind) {
      var fx = x + s * 0.14, fy = y + s * 0.12, fw = s * 0.26, fh = s * 0.17, wv = Math.sin(t * 6) * fh * 0.15;
      ctx.strokeStyle = '#d8cfc0'; ctx.lineWidth = Math.max(1, s * 0.025);
      ctx.beginPath(); ctx.moveTo(fx, fy - s * 0.02); ctx.lineTo(fx, fy + fh * 1.5); ctx.stroke();
      ctx.fillStyle = '#4aa8ff';
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + fw * 0.5, fy + wv, fx + fw, fy + wv * 1.6); ctx.lineTo(fx + fw, fy + fh + wv * 1.6); ctx.quadraticCurveTo(fx + fw * 0.5, fy + fh + wv, fx, fy + fh); ctx.closePath(); ctx.fill();
      var N = st.windEvery || 3, left = st.windLeft || N, pr = Math.max(1.6, s * 0.045);
      for (var k = 0; k < N; k++) {
        ctx.fillStyle = k < left ? '#bfe3ff' : 'rgba(191,227,255,0.22)';
        ctx.beginPath(); ctx.arc(x + s - s * 0.13 - k * pr * 2.6, y + s - s * 0.13, pr, 0, TAU); ctx.fill();
      }
    }
    // keyboard focus
    if (st.focus) {
      ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = Math.max(2, s * 0.05);
      rr(ctx, x + pad + 1, y + pad + 1, s - pad * 2 - 2, s - pad * 2 - 2, r); ctx.stroke();
    }
    ctx.restore();
  }

  // Marigold swags hanging from the eave; sway is the live breeze.
  function garlands(ctx, L, pal, t) {
    var x0 = L.hx0 + 4, x1 = L.hx1 - 4, y = L.eaveY + 2;
    var n = Math.max(2, Math.round((x1 - x0) / Math.max(L.s * 1.6, 60)));
    var sag = clamp(L.tor * 0.6, 6, 30), bead = clamp(L.s * 0.075, 2.2, 6.5);
    for (var k = 0; k < n; k++) {
      var a = x0 + (x1 - x0) * k / n, b = x0 + (x1 - x0) * (k + 1) / n;
      var sw = Math.sin(t * 1.3 + k) * sag * 0.06;
      var cnt = Math.max(5, Math.round((b - a) / (bead * 1.7)));
      for (var i = 0; i <= cnt; i++) {
        var u = i / cnt, x = a + (b - a) * u, yy = y + Math.sin(u * Math.PI) * (sag + sw);
        ctx.fillStyle = i % 3 === 2 ? pal.garland[1] : pal.garland[0];
        ctx.beginPath(); ctx.arc(x, yy, bead, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.beginPath(); ctx.arc(x - bead * 0.3, yy - bead * 0.3, bead * 0.35, 0, TAU); ctx.fill();
      }
      // a leaf drop where swags meet
      ctx.fillStyle = pal.leaf; ctx.beginPath(); ctx.ellipse(b, y + bead * 2, bead * 0.6, bead * 1.6, 0, 0, TAU); ctx.fill();
    }
    // strands down both sides of the window
    var F = L.F, sx = [L.gx - F - bead * 1.6, L.gx + L.gw + F + bead * 1.6];
    if (sx[0] - bead > L.hx0 + 4) {
      sx.forEach(function (x, si) {
        var cnt = Math.floor((L.gh + F) / (bead * 1.9));
        for (var i = 0; i < cnt; i++) {
          var yy = L.gy - F * 0.3 + i * bead * 1.9;
          ctx.fillStyle = i % 3 === 1 ? pal.garland[1] : pal.garland[0];
          ctx.beginPath(); ctx.arc(x + Math.sin(t * 1.1 + i * 0.3 + si) * 0.6, yy, bead * 0.92, 0, TAU); ctx.fill();
        }
      });
    }
  }

  // Sill diyos: one per puzzle diyo, they light as the puzzle does.
  function sillSpots(L, n) {
    var y = L.sillY + L.sillH * 0.62, d = clamp(Math.min(L.sillH * 0.95, (L.gw + L.F * 2) / Math.max(n, 1) * 0.8), 8, Math.max(30, L.sillH));
    var span = Math.min(L.gw + L.F * 2, n * d * 1.25), x0 = L.W / 2 - span / 2 + span / n / 2, out = [];
    for (var k = 0; k < n; k++) out.push([x0 + k * span / n, y, d]);
    return out;
  }

  var API = { PAL: PAL, NIGHT_IDS: NIGHT_IDS, layout: layout, paintBackdrop: paintBackdrop, tile: tile, diyo: diyo, kalash: kalash, glow: glow, garlands: garlands, sillSpots: sillSpots, shade: shade, rr: rr, srand: srand, foot: foot, clamp: clamp };
  root.TDA = API;
})(this);
