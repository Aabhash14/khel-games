// Everything drawn in code: the carved sal-wood board with inlaid brass lines and studs,
// embossed brass bagh-face tokens and cream clay goat tokens. Shared by the game,
// the home screen and the story image. Canvas 2D only.
(function (root) {
  'use strict';
  var R = root.BCRules;
  var C = {
    lacquer: '#1b0c06', wood: '#3c1d10', woodHi: '#5c321b', woodLo: '#1f0d06',
    brassHi: '#fbe3a0', brass: '#d9a948', brassMid: '#b7862f', brassLo: '#6e4512',
    groove: '#0e0503', clay: '#f3e6c8', clayLo: '#d2b98c', terracotta: '#b0582e', terracottaLo: '#7c361a',
    horn: '#5d3f25', sindoor: '#b3261e', ink: '#2e1a05',
  };

  function rng(seed) { return R.rng(seed); }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // Wood grain: long wavy fibres, a knot or two, then lamp light and vignette.
  function grain(ctx, x, y, w, h, seed, k) {
    var r = rng(seed), n = Math.max(40, Math.round(h / 2.6)), i, xx;
    var step = Math.max(4, w / 90);
    for (i = 0; i < n; i++) {
      var yy = y + r() * h, amp = (1 + r() * 4) * k, f = (0.6 + r() * 2.2) / w * 6.28, ph = r() * 6.28;
      ctx.beginPath();
      for (xx = x - 10; xx <= x + w + 10; xx += step) ctx.lineTo(xx, yy + Math.sin(xx * f + ph) * amp + Math.sin(xx * f * 3.3 + ph * 1.7) * amp * 0.35);
      var dark = r() < 0.62;
      ctx.strokeStyle = dark ? 'rgba(10,3,0,' + (0.10 + r() * 0.16).toFixed(3) + ')' : 'rgba(255,196,130,' + (0.04 + r() * 0.07).toFixed(3) + ')';
      ctx.lineWidth = (0.4 + r() * 1.6) * k;
      ctx.stroke();
    }
    for (i = 0; i < 2; i++) {
      var kx = x + w * (0.15 + r() * 0.7), ky = y + h * (0.15 + r() * 0.7);
      for (var q = 1; q < 6; q++) {
        ctx.beginPath(); ctx.ellipse(kx, ky, q * 5 * k, q * 1.8 * k, 0, 0, 6.2832);
        ctx.strokeStyle = 'rgba(10,3,0,' + (0.22 - q * 0.03).toFixed(3) + ')'; ctx.lineWidth = 0.9 * k; ctx.stroke();
      }
    }
  }

  function lamp(ctx, x, y, w, h, strength) {
    var g = ctx.createRadialGradient(x + w * 0.32, y + h * 0.12, 0, x + w * 0.32, y + h * 0.12, Math.max(w, h) * 1.05);
    g.addColorStop(0, 'rgba(255,186,96,' + (0.30 * strength).toFixed(3) + ')');
    g.addColorStop(0.45, 'rgba(255,150,60,' + (0.08 * strength).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(0,0,0,' + (0.38 * strength).toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }

  function brassGrad(ctx, x0, y0, x1, y1) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C.brassHi); g.addColorStop(0.22, C.brass); g.addColorStop(0.5, C.brassMid);
    g.addColorStop(0.7, '#e8c066'); g.addColorStop(1, C.brassLo);
    return g;
  }

  // Raised carving: shadow down-right, catch-light up-left, body on top.
  function carve(ctx, pathFn, d, body) {
    ctx.save(); ctx.translate(d, d); pathFn(); ctx.fillStyle = 'rgba(6,2,0,0.75)'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(-d * 0.7, -d * 0.7); pathFn(); ctx.fillStyle = 'rgba(255,190,120,0.22)'; ctx.fill(); ctx.restore();
    pathFn(); ctx.fillStyle = body; ctx.fill();
  }

  function geom(x, y, S) {
    var P = S * 0.125, g = (S - 2 * P) / 4, pts = [];
    for (var i = 0; i < 25; i++) pts.push({ x: x + P + (i % 5) * g, y: y + P + ((i / 5) | 0) * g });
    return { x: x, y: y, S: S, F: S * 0.072, P: P, g: g, pts: pts, rt: g * 0.37, rg: g * 0.33 };
  }

  // A carved lacquered panel: used for the board frame and the two trays.
  function panel(ctx, x, y, w, h, rad, seed, k) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24 * k; ctx.shadowOffsetY = 10 * k;
    rr(ctx, x, y, w, h, rad);
    var base = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
    base.addColorStop(0, C.woodHi); base.addColorStop(0.5, C.wood); base.addColorStop(1, C.woodLo);
    ctx.fillStyle = base; ctx.fill();
    ctx.restore();
    ctx.save(); rr(ctx, x, y, w, h, rad); ctx.clip();
    grain(ctx, x, y, w, h, seed, k);
    ctx.restore();
    // lacquer sheen + edge bevel
    ctx.save(); rr(ctx, x, y, w, h, rad); ctx.clip();
    var sh = ctx.createLinearGradient(x, y, x, y + h);
    sh.addColorStop(0, 'rgba(255,220,170,0.10)'); sh.addColorStop(0.08, 'rgba(255,220,170,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
    ctx.restore();
    rr(ctx, x + 0.75 * k, y + 0.75 * k, w - 1.5 * k, h - 1.5 * k, rad);
    ctx.strokeStyle = 'rgba(255,200,140,0.18)'; ctx.lineWidth = 1.5 * k; ctx.stroke();
  }

  // Recessed carved well (captured-goat sockets, the goat trough).
  function well(ctx, x, y, w, h, rad, k) {
    ctx.save();
    rr(ctx, x, y, w, h, rad); ctx.clip();
    ctx.fillStyle = 'rgba(8,3,1,0.55)'; ctx.fillRect(x, y, w, h);
    var g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,190,120,0.10)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.restore();
    rr(ctx, x, y, w, h, rad); ctx.strokeStyle = 'rgba(255,200,140,0.16)'; ctx.lineWidth = 1 * k; ctx.stroke();
  }

  function socket(ctx, cx, cy, r, k) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.clip();
    var g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#120602'); g.addColorStop(1, '#2a140a');
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0.2, 3.3); ctx.strokeStyle = 'rgba(255,200,140,0.22)'; ctx.lineWidth = 1.4 * k; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r + 2 * k, 0, 6.2832); ctx.strokeStyle = brassGrad(ctx, cx - r, cy - r, cx + r, cy + r); ctx.lineWidth = 1.6 * k; ctx.stroke();
  }

  function stud(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x + r * 0.2, y + r * 0.25, r * 1.08, 0, 6.2832); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill();
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, '#fff6cf'); g.addColorStop(0.35, C.brass); g.addColorStop(1, C.brassLo);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
  }

  // The whole board, drawn once per size and cached by the caller.
  function board(ctx, G, seed) {
    var x = G.x, y = G.y, S = G.S, F = G.F, k = S / 400;
    panel(ctx, x, y, S, S, S * 0.035, seed || 7, k);
    // inner field, slightly sunk, with its own grain direction
    var ix = x + F, iy = y + F, iw = S - 2 * F;
    ctx.save();
    rr(ctx, ix, iy, iw, iw, S * 0.012); ctx.clip();
    var base = ctx.createLinearGradient(ix, iy, ix + iw, iy + iw);
    base.addColorStop(0, '#4d2614'); base.addColorStop(1, '#2a1209');
    ctx.fillStyle = base; ctx.fillRect(ix, iy, iw, iw);
    ctx.translate(ix + iw / 2, iy + iw / 2); ctx.rotate(Math.PI / 2); ctx.translate(-(ix + iw / 2), -(iy + iw / 2));
    grain(ctx, ix, iy, iw, iw, (seed || 7) + 11, k);
    ctx.restore();
    ctx.save(); rr(ctx, ix, iy, iw, iw, S * 0.012); ctx.clip();
    // carved recess shadow along the top-left inner edge
    var e = ctx.createLinearGradient(ix, iy, ix + F * 0.6, iy + F * 0.6);
    e.addColorStop(0, 'rgba(0,0,0,0.55)'); e.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = e; ctx.fillRect(ix, iy, iw, F * 0.6); ctx.fillRect(ix, iy, F * 0.6, iw);
    ctx.restore();
    // brass inlay frame around the field
    rr(ctx, ix + F * 0.32, iy + F * 0.32, iw - F * 0.64, iw - F * 0.64, S * 0.008);
    ctx.strokeStyle = brassGrad(ctx, ix, iy, ix + iw, iy + iw); ctx.lineWidth = 1.6 * k; ctx.stroke();

    // carved bead-and-petal border on the frame
    var band = F, mid = band / 2, step = band * 0.95;
    var sides = [[x + mid, y + mid, 1, 0], [x + S - mid, y + mid, 0, 1], [x + S - mid, y + S - mid, -1, 0], [x + mid, y + S - mid, 0, -1]];
    sides.forEach(function (sd) {
      var len = S - band, cnt = Math.floor(len / step), sp = len / cnt;
      for (var q = 1; q < cnt; q++) {
        var px = sd[0] + sd[2] * q * sp, py = sd[1] + sd[3] * q * sp;
        var petal = q % 2 === 1;
        var ang = Math.atan2(sd[3], sd[2]) + Math.PI / 2;
        carve(ctx, petal ? function () {
          ctx.beginPath(); ctx.ellipse(px, py, band * 0.16, band * 0.33, ang, 0, 6.2832);
        } : function () {
          ctx.beginPath(); ctx.arc(px, py, band * 0.13, 0, 6.2832);
        }, 1.1 * k, petal ? '#4a2513' : '#5a2f18');
      }
    });
    // brass corner plates with a rosette
    [[x, y, 0], [x + S, y, 1], [x + S, y + S, 2], [x, y + S, 3]].forEach(function (c) {
      ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(c[2] * Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(S * 0.012, S * 0.012); ctx.lineTo(F * 1.55, S * 0.012); ctx.quadraticCurveTo(F * 1.05, F * 0.55, F, F);
      ctx.quadraticCurveTo(F * 0.55, F * 1.05, S * 0.012, F * 1.55); ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4 * k; ctx.shadowOffsetY = 2 * k;
      ctx.fillStyle = brassGrad(ctx, 0, 0, F * 1.5, F * 1.5); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(60,30,0,0.6)'; ctx.lineWidth = 0.8 * k; ctx.stroke();
      for (var p = 0; p < 8; p++) {
        var a = p * Math.PI / 4;
        ctx.beginPath(); ctx.ellipse(F * 0.52 + Math.cos(a) * F * 0.14, F * 0.52 + Math.sin(a) * F * 0.14, F * 0.1, F * 0.05, a, 0, 6.2832);
        ctx.fillStyle = 'rgba(90,50,5,0.55)'; ctx.fill();
      }
      stud(ctx, F * 0.52, F * 0.52, F * 0.09);
      ctx.restore();
    });

    lamp(ctx, x, y, S, S, 1);

    // inlaid lines: dark groove, brass, a thin catch-light
    var pts = G.pts, segs = R.SEGS, gw = G.g;
    ctx.lineCap = 'round';
    function lines(w, style, dx, dy) {
      ctx.beginPath();
      for (var i = 0; i < segs.length; i++) {
        var a = pts[segs[i][0]], b = pts[segs[i][1]];
        ctx.moveTo(a.x + dx, a.y + dy); ctx.lineTo(b.x + dx, b.y + dy);
      }
      ctx.strokeStyle = style; ctx.lineWidth = w; ctx.stroke();
    }
    lines(gw * 0.085, C.groove, 0.6 * k, 0.8 * k);
    lines(gw * 0.05, brassGrad(ctx, x, y, x + S, y + S), 0, 0);
    lines(gw * 0.012, 'rgba(255,245,200,0.55)', -gw * 0.01, -gw * 0.012);
    for (var i = 0; i < 25; i++) stud(ctx, pts[i].x, pts[i].y, gw * 0.085);
  }

  // ---- tokens (unit radius r, centred on cx, cy) ----
  function tiger(ctx, cx, cy, r, o) {
    o = o || {};
    ctx.save(); ctx.translate(cx, cy); ctx.scale(r, r);
    // rim
    var rim = ctx.createLinearGradient(-1, -1, 1, 1);
    rim.addColorStop(0, '#fff0b6'); rim.addColorStop(0.3, '#deac4a'); rim.addColorStop(0.65, '#9a6a22'); rim.addColorStop(1, '#4a2c08');
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.2832); ctx.fillStyle = rim; ctx.fill();
    // red lacquer ring
    ctx.beginPath(); ctx.arc(0, 0, 0.87, 0, 6.2832); ctx.fillStyle = '#5e0f0a'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 0.84, 0, 6.2832);
    var lac = ctx.createLinearGradient(0, -0.84, 0, 0.84); lac.addColorStop(0, '#c4352a'); lac.addColorStop(1, '#6d120c');
    ctx.fillStyle = lac; ctx.fill();
    // sunk bronze disc
    ctx.beginPath(); ctx.arc(0, 0, 0.76, 0, 6.2832);
    var disc = ctx.createRadialGradient(0.25, 0.3, 0.05, 0, 0, 0.8); disc.addColorStop(0, '#9b6a22'); disc.addColorStop(1, '#4f310b');
    ctx.fillStyle = disc; ctx.fill();
    // embossed face
    var face = ctx.createLinearGradient(-0.6, -0.6, 0.6, 0.6);
    face.addColorStop(0, '#fff1bf'); face.addColorStop(0.45, '#e2b456'); face.addColorStop(1, '#9c6b20');
    // head with ears on top and a spiky cheek ruff on both sides
    var ruff = [[0.66, -0.14], [0.6, -0.05], [0.73, 0.08], [0.6, 0.14], [0.68, 0.3], [0.5, 0.33]];
    function head() {
      var q;
      ctx.beginPath();
      ctx.moveTo(-0.3, -0.56);
      ctx.quadraticCurveTo(0, -0.64, 0.3, -0.56);
      ctx.quadraticCurveTo(0.6, -0.7, 0.5, -0.3); // right ear
      for (q = 0; q < ruff.length; q++) ctx.lineTo(ruff[q][0], ruff[q][1]);
      ctx.quadraticCurveTo(0.38, 0.6, 0, 0.6);
      ctx.quadraticCurveTo(-0.38, 0.6, -0.5, 0.33);
      for (q = ruff.length - 2; q >= 0; q--) ctx.lineTo(-ruff[q][0], ruff[q][1]);
      ctx.lineTo(-0.5, -0.3);
      ctx.quadraticCurveTo(-0.6, -0.7, -0.3, -0.56); // left ear
      ctx.closePath();
    }
    ctx.save(); ctx.translate(0.045, 0.06); head(); ctx.fillStyle = 'rgba(20,8,0,0.6)'; ctx.fill(); ctx.restore();
    head(); ctx.fillStyle = face; ctx.fill();
    ctx.lineWidth = 0.035; ctx.strokeStyle = '#5a3507'; ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var ink = '#3e2204';
    // inner ears
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.moveTo(-0.44, -0.38); ctx.quadraticCurveTo(-0.46, -0.56, -0.3, -0.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.44, -0.38); ctx.quadraticCurveTo(0.46, -0.56, 0.3, -0.5); ctx.closePath(); ctx.fill();
    // forehead stripes
    ctx.strokeStyle = ink; ctx.lineWidth = 0.06;
    ctx.beginPath(); ctx.moveTo(0, -0.5); ctx.lineTo(0, -0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.16, -0.5); ctx.quadraticCurveTo(-0.1, -0.38, -0.14, -0.26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.16, -0.5); ctx.quadraticCurveTo(0.1, -0.38, 0.14, -0.26); ctx.stroke();
    // cheek stripes
    ctx.lineWidth = 0.05;
    [[-1], [1]].forEach(function (sg) {
      var s = sg[0];
      ctx.beginPath(); ctx.moveTo(s * 0.62, -0.02); ctx.quadraticCurveTo(s * 0.5, 0.0, s * 0.42, 0.06); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.6, 0.18); ctx.quadraticCurveTo(s * 0.5, 0.17, s * 0.42, 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.5, 0.36); ctx.quadraticCurveTo(s * 0.42, 0.32, s * 0.34, 0.33); ctx.stroke();
    });
    // eyes
    var eye = o.eye || '#2a1402';
    [[-1], [1]].forEach(function (sg) {
      var s = sg[0];
      ctx.beginPath();
      ctx.moveTo(s * 0.36, -0.1); ctx.quadraticCurveTo(s * 0.24, -0.24, s * 0.1, -0.1); ctx.quadraticCurveTo(s * 0.24, -0.02, s * 0.36, -0.1);
      ctx.closePath(); ctx.fillStyle = eye; ctx.fill(); ctx.lineWidth = 0.03; ctx.strokeStyle = ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 0.23, -0.115, 0.022, 0.05, 0, 0, 6.2832); ctx.fillStyle = o.eye ? '#3a1200' : '#c98a1c'; ctx.fill();
      // fierce brow
      ctx.beginPath(); ctx.moveTo(s * 0.42, -0.2); ctx.quadraticCurveTo(s * 0.28, -0.28, s * 0.1, -0.17);
      ctx.lineWidth = 0.05; ctx.strokeStyle = ink; ctx.stroke();
    });
    // nose and mouth
    ctx.beginPath(); ctx.moveTo(-0.11, 0.08); ctx.quadraticCurveTo(0, 0.04, 0.11, 0.08); ctx.quadraticCurveTo(0.04, 0.2, 0, 0.2); ctx.quadraticCurveTo(-0.04, 0.2, -0.11, 0.08);
    ctx.fillStyle = ink; ctx.fill();
    ctx.lineWidth = 0.04; ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.moveTo(0, 0.2); ctx.lineTo(0, 0.27); ctx.quadraticCurveTo(-0.08, 0.34, -0.17, 0.29); ctx.moveTo(0, 0.27); ctx.quadraticCurveTo(0.08, 0.34, 0.17, 0.29); ctx.stroke();
    // fangs
    ctx.fillStyle = '#fff6dc';
    ctx.beginPath(); ctx.moveTo(-0.09, 0.3); ctx.lineTo(-0.05, 0.42); ctx.lineTo(-0.03, 0.31); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.09, 0.3); ctx.lineTo(0.05, 0.42); ctx.lineTo(0.03, 0.31); ctx.fill();
    // whisker dots
    ctx.fillStyle = ink;
    [[-0.22, 0.22], [-0.27, 0.27], [-0.19, 0.29], [0.22, 0.22], [0.27, 0.27], [0.19, 0.29]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 0.022, 0, 6.2832); ctx.fill(); });
    // rim catch-light
    ctx.beginPath(); ctx.arc(0, 0, 0.94, 3.6, 5.2); ctx.strokeStyle = 'rgba(255,255,230,0.7)'; ctx.lineWidth = 0.05; ctx.stroke();
    ctx.restore();
  }

  function goat(ctx, cx, cy, r) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(r, r);
    var rim = ctx.createLinearGradient(-1, -1, 1, 1);
    rim.addColorStop(0, '#e08a58'); rim.addColorStop(0.5, C.terracotta); rim.addColorStop(1, C.terracottaLo);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.2832); ctx.fillStyle = rim; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 0.84, 0, 6.2832);
    var body = ctx.createRadialGradient(-0.3, -0.35, 0.05, 0, 0, 0.9);
    body.addColorStop(0, '#fffaf0'); body.addColorStop(0.6, C.clay); body.addColorStop(1, C.clayLo);
    ctx.fillStyle = body; ctx.fill();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var line = '#7a5534';
    // horns
    ctx.strokeStyle = C.horn; ctx.lineWidth = 0.11;
    ctx.beginPath(); ctx.moveTo(-0.12, -0.3); ctx.quadraticCurveTo(-0.22, -0.66, -0.46, -0.56); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.12, -0.3); ctx.quadraticCurveTo(0.22, -0.66, 0.46, -0.56); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,200,0.35)'; ctx.lineWidth = 0.03;
    ctx.beginPath(); ctx.moveTo(-0.13, -0.36); ctx.quadraticCurveTo(-0.2, -0.6, -0.4, -0.56); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.13, -0.36); ctx.quadraticCurveTo(0.2, -0.6, 0.4, -0.56); ctx.stroke();
    // ears
    [[-1], [1]].forEach(function (sg) {
      var s = sg[0];
      ctx.beginPath(); ctx.ellipse(s * 0.42, -0.14, 0.21, 0.085, s * 0.45, 0, 6.2832);
      ctx.fillStyle = '#ecd7b0'; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 0.035; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 0.44, -0.13, 0.12, 0.035, s * 0.45, 0, 6.2832); ctx.fillStyle = '#d9a083'; ctx.fill();
    });
    // head
    ctx.beginPath();
    ctx.moveTo(0, -0.4); ctx.bezierCurveTo(0.28, -0.4, 0.3, -0.1, 0.24, 0.16); ctx.bezierCurveTo(0.2, 0.42, 0.12, 0.48, 0, 0.48);
    ctx.bezierCurveTo(-0.12, 0.48, -0.2, 0.42, -0.24, 0.16); ctx.bezierCurveTo(-0.3, -0.1, -0.28, -0.4, 0, -0.4); ctx.closePath();
    ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 0.04; ctx.stroke();
    // muzzle
    ctx.beginPath(); ctx.ellipse(0, 0.33, 0.17, 0.12, 0, 0, 6.2832); ctx.fillStyle = '#ecc8a6'; ctx.fill();
    ctx.fillStyle = '#5a3420';
    ctx.beginPath(); ctx.ellipse(-0.06, 0.31, 0.025, 0.035, 0.3, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.06, 0.31, 0.025, 0.035, -0.3, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = '#7a4a30'; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.moveTo(-0.06, 0.4); ctx.quadraticCurveTo(0, 0.43, 0.06, 0.4); ctx.stroke();
    // eyes
    [[-1], [1]].forEach(function (sg) {
      var s = sg[0];
      ctx.beginPath(); ctx.ellipse(s * 0.14, -0.02, 0.05, 0.06, 0, 0, 6.2832); ctx.fillStyle = '#2b1a0e'; ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.14 - 0.015, -0.04, 0.017, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
    });
    // red tika
    ctx.beginPath(); ctx.ellipse(0, -0.22, 0.045, 0.06, 0, 0, 6.2832); ctx.fillStyle = C.sindoor; ctx.fill();
    // rim catch-light
    ctx.beginPath(); ctx.arc(0, 0, 0.93, 3.6, 5.2); ctx.strokeStyle = 'rgba(255,240,220,0.6)'; ctx.lineWidth = 0.05; ctx.stroke();
    ctx.restore();
  }

  // Soft contact shadow under a token.
  function shadow(ctx, cx, cy, r, a) {
    var g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.15);
    g.addColorStop(0, 'rgba(0,0,0,' + (0.65 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.15, r * 0.95, 0, 0, 6.2832); ctx.fill();
  }

  // Offscreen sprite of a token at a pixel radius (includes some padding).
  function sprite(kind, rpx, opts) {
    var pad = Math.ceil(rpx * 0.15) + 2, size = Math.ceil(rpx * 2 + pad * 2);
    var c = document.createElement('canvas'); c.width = c.height = size;
    var x = c.getContext('2d');
    if (kind === 'tiger') tiger(x, size / 2, size / 2, rpx, opts); else goat(x, size / 2, size / 2, rpx);
    return { c: c, size: size, r: rpx };
  }

  root.BCArt = { C: C, rr: rr, geom: geom, board: board, panel: panel, well: well, socket: socket, stud: stud, tiger: tiger, goat: goat, shadow: shadow, sprite: sprite, grain: grain, lamp: lamp, brassGrad: brassGrad };
})(this);
