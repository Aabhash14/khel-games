// Drawing that needs no game state: the SVG icon set, colours, canvas shape helpers, and the pieces of the
// bazaar drawn the same way every time (houses, the temple, the map paper, people, kites, pigeons, goats).
(() => {
  'use strict';
  window.MM = window.MM || {};
  const { TAU, rand, clamp, lerp, pick, mulberry32, hash } = MM.Util;
  const { L, digits } = MM.I18n;
  const { KEEPERS } = MM.Data;
  const { MAP, mpt } = MM.AsanMap;
  const shared = MM.shared;
  // The canvas pen. getContext returns the same context object main.js draws with; withCtx points this one
  // at a spare canvas while a cached house, temple or map is built, so everything withCtx runs lives in this file.
  let ctx = document.getElementById('game').getContext('2d');

  // ---------- Icons: one drawn set, square strokes ----------
  const ICON = {
    offer: '<path d="M4 12h13M12 6l6 6-6 6"/>',
    bluff: '<path d="M3 20V10l4-4 4 4v10z"/><path d="M13 20V10l4-4 4 4v10z"/><path d="M7 14v2M17 14v2"/>',
    accept: '<path d="M4 12.5l5 5L20 6.5"/>',
    chat: '<path d="M4 5h16v11H11l-5 4v-4H4z"/>',
    walk: '<path d="M14 4h6v16h-6"/><path d="M3 12h11M8 7l-5 5 5 5"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h2M4 12h2M4 18h2"/>',
    back: '<path d="M20 12H7M12 6l-6 6 6 6"/>',
    home: '<path d="M3 11.5l9-7.5 9 7.5"/><path d="M5.5 10v10h13V10"/>',
    star: '<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    lock: '<path d="M5 11h14v10H5z"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    route: '<path d="M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    soundOff: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
    voice: '<path d="M4 4h16v11H10l-5 4v-4H4z"/><path d="M8 8.5h8M8 11.5h5"/>',
    voiceOff: '<path d="M4 4h16v11H10l-5 4v-4H4z"/><path d="M3 3l18 18"/>',
    play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
    retry: '<path d="M5 12a7 7 0 1 0 2.2-5.1"/><path d="M5 3.5v5h5"/>',
    share: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 13v8h16v-8"/>',
    grid: '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>',
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

  // ---------- Canvas drawing ----------
  const FONT = '"Mukta", "Nirmala UI", "Noto Sans Devanagari", "Kohinoor Devanagari", Mangal, system-ui, sans-serif';

  const FLAG = ['#1f6fd1', '#f4f4f4', '#e23b3b', '#2e9e5b', '#f5c518'];

  const PLASTER = ['#e8d6a8', '#efc7b2', '#c8dbc4', '#d9d0e6', '#f1e3c2', '#cfd9dd', '#f3d9a4', '#e6e0d0'];
  const BOARDS = {
    ne: ['दन्त क्लिनिक', 'टेलर्स', 'ट्युसन सेन्टर', 'गहना पसल', 'होलसेल', 'फोटो स्टुडियो', 'मनी ट्रान्सफर', 'मोबाइल पसल', 'कस्मेटिक', 'चस्मा घर'],
    en: ['DENTAL CLINIC', 'TAILORS', 'TUITION CENTRE', 'JEWELLERS', 'WHOLESALE', 'PHOTO STUDIO', 'MONEY TRANSFER', 'MOBILE SHOP', 'COSMETICS', 'OPTICIANS'],
  };
  const BOARD_COLS = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#ef6c00', '#00838f'];
  const SACHETS = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#fb8c00', '#8e24aa', '#ffffff', '#00acc1'];
  const SKINS = ['#b07a52', '#a86d45', '#c08458', '#9a6644', '#c68a5c', '#8d5a3a'];
  const CLOTH = ['#c62828', '#1565c0', '#2e7d32', '#6a1b9a', '#ef6c00', '#00838f', '#4e342e', '#ad1457', '#f9a825', '#37474f', '#e0e0e0', '#283593'];

  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
  const circle = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); };
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  function shadeHex(hex, amt) {
    const n = parseInt(hex.slice(1), 16), f = (c) => clamp(Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt), 0, 255);
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function withCtx(o, fn) { const m = ctx; ctx = o; try { fn(); } finally { ctx = m; } }

  function makePerson(x) {
    const r = Math.random();
    const type = r < 0.3 ? 'man' : r < 0.52 ? 'woman' : r < 0.66 ? 'sari' : r < 0.78 ? 'porter' : r < 0.9 ? 'kid' : 'old';
    return {
      type, x, dir: Math.random() < 0.5 ? -1 : 1, sp: type === 'porter' || type === 'old' ? rand(0.06, 0.11) : rand(0.12, 0.28),
      row: (Math.random() * 3) | 0, ph: rand(0, TAU), skin: pick(SKINS), top: pick(CLOTH), shawl: pick(CLOTH),
      bottom: pick(['#263238', '#3e2723', '#455a64', '#1b1b1b', '#5d4037', '#efebe0']),
      topi: (type === 'man' || type === 'old') && Math.random() < 0.55, h: rand(0.94, 1.06),
    };
  }

  // ----- Houses: built once each into a spare canvas by facade() in main.js -----
  function buildFacade(i, w, gq, shop) {
    const R = mulberry32(i * 7919 + 31);
    const K = shop ? KEEPERS[shop.id] : null;
    const style = K ? K.style || 'newari' : R() < 0.5 ? 'newari' : 'concrete';
    const gf = gq * 0.26, fl = gq * (0.145 + R() * 0.025);
    const floors = style === 'newari' ? 3 + (R() < 0.45 ? 1 : 0) : 3 + Math.floor(R() * 3);
    const top = -(gf + fl * floors);
    let col = null;
    if (style === 'newari') newariUpper(R, w, gf, fl, floors, top);
    else col = concreteUpper(R, w, gf, fl, floors, top);
    if (K && K.sign) shopFront(R, w, gf, K, i, K.cat);
    else shutterFront(R, w, gf, style);
    // afternoon sun from the left: the right side of each house falls into shade
    const sg = ctx.createLinearGradient(0, 0, w, 0);
    sg.addColorStop(0, 'rgba(255,236,200,0.10)'); sg.addColorStop(0.65, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(20,8,0,0.28)');
    ctx.fillStyle = sg; ctx.fillRect(0, top, w, -top);
    return { top, side: col ? shadeHex(col, -0.4) : '#6a2e1d' };
  }

  function woodBand(x, y, w, h) {
    ctx.fillStyle = '#3b2416'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(x, y, w, Math.max(1, h * 0.25));
    ctx.fillStyle = '#6b4528';
    const st = Math.max(4, h * 1.3);
    for (let k = x + st * 0.3; k < x + w; k += st) ctx.fillRect(k, y + h * 0.4, st * 0.45, h * 0.45);
  }

  function carvedWindow(x, y, ww, wh, panels, R) {
    const ext = ww * 0.14;
    ctx.fillStyle = '#2a170e';
    ctx.fillRect(x - ext, y - wh * 0.12, ww + ext * 2, wh * 0.11);
    ctx.fillRect(x - ext * 0.7, y + wh, ww + ext * 1.4, wh * 0.09);
    ctx.fillStyle = '#4a2c1a';
    ctx.beginPath(); ctx.ellipse(x + ww / 2, y - wh * 0.12, ww * 0.3, wh * 0.15, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#3b2416'; ctx.fillRect(x - ww * 0.04, y - wh * 0.02, ww * 1.08, wh * 1.04);
    const pw = ww / panels;
    for (let k = 0; k < panels; k++) {
      const px = x + k * pw + pw * 0.08, pww = pw * 0.84, py = y + wh * 0.06, ph = wh * 0.88;
      const open = R() < 0.22;
      ctx.fillStyle = open ? '#140b06' : '#5b3a24'; ctx.fillRect(px, py, pww, ph);
      if (!open) {
        ctx.save(); ctx.beginPath(); ctx.rect(px, py, pww, ph); ctx.clip();
        ctx.strokeStyle = '#22130a'; ctx.lineWidth = Math.max(1, pww * 0.06);
        const st = Math.max(4, pww / 4);
        for (let d = -ph; d < pww + ph; d += st) {
          ctx.beginPath(); ctx.moveTo(px + d, py); ctx.lineTo(px + d + ph, py + ph); ctx.moveTo(px + d, py + ph); ctx.lineTo(px + d + ph, py); ctx.stroke();
        }
        ctx.restore();
      } else if (R() < 0.6) { ctx.fillStyle = 'rgba(255,196,120,0.22)'; ctx.fillRect(px + pww * 0.2, py + ph * 0.25, pww * 0.6, ph * 0.55); }
      ctx.strokeStyle = '#7a5232'; ctx.lineWidth = 1; ctx.strokeRect(px, py, pww, ph);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px, py, pww, Math.max(2, ph * 0.08)); ctx.fillRect(px, py, Math.max(2, pww * 0.1), ph);
    }
  }

  function newariUpper(R, w, gf, fl, floors, top) {
    ctx.fillStyle = '#6a321f'; ctx.fillRect(0, top, w, -top);
    const bh = Math.max(3, fl * 0.07), bw = bh * 2.4;
    let row = 0;
    for (let y = top; y < 0; y += bh, row++) {
      for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
        const v = R();
        ctx.fillStyle = v < 0.3 ? '#a3502f' : v < 0.6 ? '#94442a' : v < 0.92 ? '#9b4a2c' : '#7d3a22';
        ctx.fillRect(x + 0.6, y + 0.6, bw - 1.2, bh - 1.2);
      }
    }
    for (let f = 0; f < floors; f++) {
      const yb = -gf - f * fl, yt = yb - fl;
      woodBand(-w * 0.02, yb - fl * 0.08, w * 1.04, fl * 0.08);
      if (f === 0) carvedWindow(w * 0.14, yt + fl * 0.2, w * 0.72, fl * 0.6, 3, R);
      else if (f === floors - 1) { const n = w > 150 ? 3 : 2; for (let k = 0; k < n; k++) carvedWindow(w * ((k + 0.5) / n) - w * 0.08, yt + fl * 0.3, w * 0.16, fl * 0.42, 1, R); }
      else for (let k = 0; k < 2; k++) carvedWindow(w * (k ? 0.6 : 0.14), yt + fl * 0.18, w * 0.26, fl * 0.58, 1, R);
    }
    // tiled roof with carved struts
    const eh = fl * 0.34;
    ctx.fillStyle = '#3a1f14';
    poly([[-w * 0.09, top], [w * 1.09, top], [w * 1.0, top - eh], [0, top - eh]]);
    ctx.fillStyle = '#5c2d1b';
    for (let r2 = 1; r2 < 5; r2++) { const y = top - eh + (r2 * eh) / 5, k = r2 / 5; ctx.fillRect(-w * 0.09 * k, y, w + w * 0.18 * k, Math.max(1, eh * 0.06)); }
    ctx.strokeStyle = '#2a170e'; ctx.lineWidth = Math.max(2, w * 0.016);
    for (let k = 0; k <= 5; k++) { const x = w * (k / 5); ctx.beginPath(); ctx.moveTo(x * 0.9 + w * 0.05, top + fl * 0.34); ctx.lineTo(x * 1.14 - w * 0.07, top + 1); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, top, 0, top + fl * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, top, w, fl * 0.5);
  }

  function glassWindow(x, y, ww, wh, grill, R) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - ww * 0.12, y - wh * 0.02, ww * 1.24, wh * 0.14); // shadow under the sunshade
    ctx.fillStyle = '#cfcfcf'; ctx.fillRect(x - 2, y - 2, ww + 4, wh + 4);
    const g = ctx.createLinearGradient(x, y, x + ww, y + wh);
    g.addColorStop(0, '#86a9bd'); g.addColorStop(1, '#2c4656');
    ctx.fillStyle = g; ctx.fillRect(x, y, ww, wh);
    if (R() < 0.5) { ctx.fillStyle = pick(['#c2185b', '#f9a825', '#7cb342', '#8e24aa']); ctx.globalAlpha = 0.7; ctx.fillRect(x, y, ww * 0.3, wh); ctx.globalAlpha = 1; }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; poly([[x + ww * 0.55, y], [x + ww * 0.75, y], [x + ww * 0.35, y + wh], [x + ww * 0.15, y + wh]]);
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x + ww / 2 - 1, y, 2, wh);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y, ww, Math.max(2, wh * 0.1)); ctx.fillRect(x, y, Math.max(2, ww * 0.06), wh);
    if (grill) { ctx.fillStyle = '#263238'; for (let k = x + 3; k < x + ww; k += Math.max(4, ww / 7)) ctx.fillRect(k, y, 1.5, wh); }
    ctx.fillStyle = '#bdbdbd'; ctx.fillRect(x - ww * 0.12, y - wh * 0.14, ww * 1.24, wh * 0.1); // concrete sunshade
  }

  function concreteUpper(R, w, gf, fl, floors, top) {
    const col = PLASTER[Math.floor(R() * PLASTER.length)];
    ctx.fillStyle = col; ctx.fillRect(0, top, w, -top);
    for (let k = 0; k < 5; k++) { // rain streaks and grime
      const sx = R() * w, sw = w * (0.04 + R() * 0.12), len = (-top - gf) * (0.3 + R() * 0.6);
      const g = ctx.createLinearGradient(0, top, 0, top + len);
      g.addColorStop(0, 'rgba(60,50,40,0.22)'); g.addColorStop(1, 'rgba(60,50,40,0)');
      ctx.fillStyle = g; ctx.fillRect(sx, top, sw, len);
    }
    if (R() < 0.5) { // plaster fallen off, bricks showing
      const px = R() * w * 0.6, py = top + (-top - gf) * R() * 0.7, pw = w * 0.2, ph = fl * 0.3;
      ctx.fillStyle = '#9b4a2c'; ctx.beginPath(); ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0.2, 0, TAU); ctx.fill();
    }
    const boardFloor = R() < 0.65 ? Math.floor(R() * Math.min(2, floors)) : -1;
    for (let f = 0; f < floors; f++) {
      const yb = -gf - f * fl, yt = yb - fl;
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(0, yb - 2, w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, yb - fl * 0.06, w, 1.5);
      const n = w > 150 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const ww = w * (n === 2 ? 0.3 : 0.5), x = n === 2 ? w * (k ? 0.6 : 0.1) : w * 0.25;
        glassWindow(x, yt + fl * 0.26, ww, fl * 0.5, f < 2, R);
      }
      if (f === boardFloor) {
        const bc = BOARD_COLS[Math.floor(R() * BOARD_COLS.length)], bh = fl * 0.24, by = yb - fl * 0.3;
        ctx.fillStyle = bc; ctx.fillRect(w * 0.06, by, w * 0.88, bh);
        ctx.fillStyle = bc === '#f9a825' ? '#1b1b1b' : '#ffffff';
        ctx.font = `800 ${Math.round(bh * 0.55)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(BOARDS[shared.lang][Math.floor(R() * BOARDS[shared.lang].length)], w / 2, by + bh * 0.52, w * 0.82);
      }
      if (f === 1 && R() < 0.65) { // balcony with railing and laundry
        const by = yb - fl * 0.05;
        const bsh = ctx.createLinearGradient(0, by + fl * 0.07, 0, by + fl * 0.3); bsh.addColorStop(0, 'rgba(0,0,0,0.3)'); bsh.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bsh; ctx.fillRect(0, by + fl * 0.07, w, fl * 0.23);
        ctx.fillStyle = shadeHex(col, -0.2); ctx.fillRect(-w * 0.03, by, w * 1.06, fl * 0.07);
        ctx.fillStyle = shadeHex(col, -0.45); ctx.fillRect(-w * 0.03, by + fl * 0.05, w * 1.06, fl * 0.025);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(-w * 0.03, by - fl * 0.32, w * 1.06, 2);
        for (let k = -w * 0.03; k < w * 1.03; k += Math.max(5, w / 16)) ctx.fillRect(k, by - fl * 0.32, 1.5, fl * 0.32);
        ctx.strokeStyle = 'rgba(40,40,40,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, by - fl * 0.55); ctx.quadraticCurveTo(w / 2, by - fl * 0.48, w, by - fl * 0.55); ctx.stroke();
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = pick(CLOTH); const cx = w * (0.12 + k * 0.18);
          ctx.fillRect(cx, by - fl * 0.53, w * 0.1, fl * (0.14 + R() * 0.12));
        }
      }
    }
    // flat roof: parapet, black water tank, rebar waiting for the next floor
    ctx.fillStyle = shadeHex(col, -0.15); ctx.fillRect(-2, top - fl * 0.07, w + 4, fl * 0.07);
    const tx = w * (0.15 + R() * 0.5), tw = w * 0.2, th = fl * 0.42;
    ctx.fillStyle = '#1c1c1c'; rr(tx, top - fl * 0.07 - th, tw, th, tw * 0.15); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let k = 1; k < 4; k++) ctx.fillRect(tx, top - fl * 0.07 - th + (k * th) / 4, tw, 1.5);
    ctx.fillRect(tx + tw * 0.15, top - fl * 0.07 - th, tw * 0.08, th);
    ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 1.2;
    for (const rx of [w * 0.03, w * 0.06, w * 0.94, w * 0.97]) { ctx.beginPath(); ctx.moveTo(rx, top - fl * 0.07); ctx.lineTo(rx + (R() - 0.5) * 3, top - fl * 0.07 - fl * (0.25 + R() * 0.2)); ctx.stroke(); }
    if (R() < 0.4) { ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.ellipse(w * 0.82, top - fl * 0.2, fl * 0.12, fl * 0.09, -0.5, 0, TAU); ctx.fill(); }
    return col;
  }

  function hangingGoods(id, x, y, w, h, R) {
    ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x + w * 0.04, y + h * 0.05); ctx.lineTo(x + w * 0.96, y + h * 0.05); ctx.stroke();
    if (id === 'cloth' || id === 'readymade') { // clothes on hangers
      for (let k = 0; k < 7; k++) {
        const cx = x + w * (0.1 + k * 0.13), c = pick(CLOTH), cw = w * 0.1, ch = h * 0.3;
        ctx.strokeStyle = '#9e9e9e'; ctx.beginPath(); ctx.moveTo(cx, y + h * 0.05); ctx.lineTo(cx, y + h * 0.09); ctx.stroke();
        ctx.fillStyle = c; poly([[cx - cw * 0.5, y + h * 0.1], [cx + cw * 0.5, y + h * 0.1], [cx + cw * 0.4, y + h * 0.1 + ch], [cx - cw * 0.4, y + h * 0.1 + ch]]);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - 0.5, y + h * 0.1, 1, ch);
      }
    } else if (id === 'kite') {
      for (let k = 0; k < 6; k++) drawKite(x + w * (0.12 + k * 0.15), y + h * (0.2 + (k % 2) * 0.08), h * 0.09, pick(FLAG), pick(['#e23b3b', '#1f6fd1', '#f5c518']), 0, true);
    } else if (id === 'brass') {
      for (let k = 0; k < 7; k++) {
        const cx = x + w * (0.1 + k * 0.13), r = h * (0.06 + R() * 0.04);
        ctx.strokeStyle = '#9e9e9e'; ctx.beginPath(); ctx.moveTo(cx, y + h * 0.05); ctx.lineTo(cx, y + h * 0.12); ctx.stroke();
        ctx.fillStyle = k % 3 === 2 ? '#b0643a' : '#d4a017'; circle(cx, y + h * 0.12 + r, r);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; circle(cx - r * 0.35, y + h * 0.12 + r * 0.7, r * 0.25);
      }
    } else if (id === 'goat') {
      ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) { const cx = x + w * (0.2 + k * 0.2); ctx.beginPath(); ctx.ellipse(cx, y + h * 0.18, w * 0.04, h * 0.1, 0, 0, TAU); ctx.stroke(); }
    } else { // sachet strips and chilli garlands, the look of every Kathmandu grocery
      for (let k = 0; k < 9; k++) {
        const cx = x + w * (0.07 + k * 0.1), n = 4 + Math.floor(R() * 4);
        if (k % 3 === 1 && R() < 0.6) { ctx.fillStyle = '#c62828'; for (let j = 0; j < n + 2; j++) { ctx.beginPath(); ctx.ellipse(cx, y + h * (0.1 + j * 0.045), w * 0.012, h * 0.025, 0, 0, TAU); ctx.fill(); } continue; }
        const c = SACHETS[Math.floor(R() * SACHETS.length)];
        for (let j = 0; j < n; j++) { ctx.fillStyle = j % 2 ? c : shadeHex(c, -0.15); ctx.fillRect(cx - w * 0.025, y + h * (0.08 + j * 0.055), w * 0.05, h * 0.05); }
      }
    }
  }

  function shopFront(R, w, gf, K, i, id) {
    const sx = w * 0.04, sw = w * 0.92, oh = gf * 0.72, oy = -oh;
    // wall around the opening
    ctx.fillStyle = '#6f6a62'; ctx.fillRect(0, -gf, w, gf);
    const g = ctx.createLinearGradient(0, oy, 0, 0);
    g.addColorStop(0, '#120a05'); g.addColorStop(1, '#33200f');
    ctx.fillStyle = g; ctx.fillRect(sx, oy, sw, oh);
    for (let r = 0; r < 3; r++) { // shelves at the back
      const y = oy + oh * (0.3 + r * 0.2);
      ctx.fillStyle = '#4a2f1c'; ctx.fillRect(sx + 3, y, sw - 6, Math.max(2, oh * 0.015));
      ctx.globalAlpha = 0.5;
      for (let x = sx + 5; x < sx + sw - 8; x += oh * (0.05 + R() * 0.03)) {
        const bh = oh * (0.05 + R() * 0.07);
        ctx.fillStyle = SACHETS[Math.floor(R() * SACHETS.length)]; ctx.fillRect(x, y - bh, oh * 0.04, bh);
      }
      ctx.globalAlpha = 1;
    }
    const lg = ctx.createRadialGradient(sx + sw / 2, oy + 4, 1, sx + sw / 2, oy + 4, sw * 0.5);
    lg.addColorStop(0, 'rgba(230,245,255,0.35)'); lg.addColorStop(1, 'rgba(230,245,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(sx, oy, sw, oh);
    ctx.fillStyle = '#eef6ff'; ctx.fillRect(sx + sw * 0.38, oy + 3, sw * 0.24, 2.5);
    hangingGoods(id, sx, oy, sw, oh, R);
    // shutter tracks and the rolled-up shutter
    ctx.fillStyle = '#5f6469'; ctx.fillRect(sx - 2, oy, 3, oh); ctx.fillRect(sx + sw - 1, oy, 3, oh);
    ctx.fillStyle = '#7d8288'; rr(sx - 3, oy - oh * 0.1, sw + 6, oh * 0.11, oh * 0.05); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 1; k < 4; k++) ctx.fillRect(sx - 3, oy - oh * 0.1 + (k * oh * 0.11) / 4, sw + 6, 1);
    // signboard
    const bh = gf * 0.22, by = -gf * 0.985;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(w * 0.03, by + bh, w * 0.96, bh * 0.16);
    ctx.fillStyle = K.color; ctx.fillRect(w * 0.02, by, w * 0.96, bh);
    ctx.fillStyle = shadeHex(K.color, -0.45); ctx.fillRect(w * 0.02, by + bh * 0.9, w * 0.96, bh * 0.1);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(w * 0.035, by + 2, w * 0.93, bh - 4);
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(bh * 0.5)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(L(K.sign), w / 2, by + bh * 0.42, w * 0.86);
    ctx.fillStyle = '#ffe082'; ctx.font = `600 ${Math.round(bh * 0.2)}px ${FONT}`;
    const phone = `01-42${String(10000 + Math.floor(hash(i + 3) * 89999))}`;
    ctx.fillText(shared.lang === 'ne' ? `फोन: ${digits(phone)}` : `Ph: ${phone}`, w / 2, by + bh * 0.82, w * 0.8);
    // blue plastic tarp sheltering the front
    const tarp = R() < 0.65 ? '#1e66b0' : '#2f7d4a';
    const tsh = ctx.createLinearGradient(0, oy + oh * 0.13, 0, oy + oh * 0.45); tsh.addColorStop(0, 'rgba(0,0,0,0.4)'); tsh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tsh; ctx.fillRect(sx, oy + oh * 0.13, sw, oh * 0.32);
    ctx.fillStyle = shadeHex(tarp, -0.4); ctx.fillRect(-w * 0.08, oy + oh * 0.13, w * 1.16, Math.max(2, oh * 0.025));
    ctx.fillStyle = tarp;
    poly([[sx - w * 0.02, oy - oh * 0.06], [sx + sw + w * 0.02, oy - oh * 0.06], [w * 1.08, oy + oh * 0.13], [-w * 0.08, oy + oh * 0.13]]);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let k = 0; k < 4; k++) { const x0 = -w * 0.06 + (w * 1.12 * (k + 0.3)) / 4; poly([[x0, oy + oh * 0.13], [x0 + w * 0.05, oy + oh * 0.13], [x0 + w * 0.04, oy - oh * 0.05], [x0 + w * 0.02, oy - oh * 0.05]]); }
  }

  function shutterFront(R, w, gf, style) {
    ctx.fillStyle = style === 'newari' ? '#5a2a1a' : '#6f6a62'; ctx.fillRect(0, -gf, w, gf);
    const sx = w * 0.05, sw = w * 0.9, oh = gf * 0.82;
    const col = ['#7b8087', '#6b7f73', '#7a6f8a', '#8a7f6a', '#5d7a8c'][Math.floor(R() * 5)];
    ctx.fillStyle = col; ctx.fillRect(sx, -oh, sw, oh);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = -oh + 3; y < 0; y += 4) ctx.fillRect(sx, y, sw, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(sx, -oh, sw * 0.4, oh);
    ctx.fillStyle = '#4a4f55'; ctx.fillRect(sx, -oh * 0.06, sw, oh * 0.06);
    if (R() < 0.7) { // posters glued on the shutter
      for (let k = 0; k < 2; k++) {
        const px = sx + sw * (0.15 + R() * 0.55), py = -oh * (0.75 - R() * 0.2), pw = sw * 0.16, ph = oh * 0.22;
        ctx.fillStyle = pick(['#f5f0e6', '#ffe082', '#ffccbc']); ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = pick(['#c62828', '#1565c0', '#2e7d32']); ctx.fillRect(px + pw * 0.1, py + ph * 0.12, pw * 0.8, ph * 0.22);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let j = 0; j < 3; j++) ctx.fillRect(px + pw * 0.1, py + ph * (0.48 + j * 0.15), pw * 0.8, 1);
      }
    }
    ctx.fillStyle = '#c9a227'; ctx.fillRect(sx + sw / 2 - 3, -oh * 0.1, 6, 7);
  }

  // ----- The Annapurna temple at Asan chowk, built once into a spare canvas by temple() in main.js -----
  function buildTemple(T) {
    const gold = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#fbe08a'); g.addColorStop(0.45, '#d9a51e'); g.addColorStop(1, '#8a6508'); return g; };
    let y = 0;
    // the big bell on its frame, beside the temple
    const bx = -T * 0.92;
    ctx.fillStyle = '#4a2f1c'; ctx.fillRect(bx - T * 0.14, -T * 0.42, T * 0.025, T * 0.42); ctx.fillRect(bx + T * 0.12, -T * 0.42, T * 0.025, T * 0.42);
    ctx.fillRect(bx - T * 0.16, -T * 0.44, T * 0.32, T * 0.03);
    ctx.fillStyle = '#8d6e3f'; ctx.beginPath(); ctx.moveTo(bx - T * 0.07, -T * 0.2); ctx.quadraticCurveTo(bx - T * 0.07, -T * 0.38, bx, -T * 0.38); ctx.quadraticCurveTo(bx + T * 0.07, -T * 0.38, bx + T * 0.07, -T * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,160,0.35)'; ctx.fillRect(bx - T * 0.04, -T * 0.36, T * 0.015, T * 0.14);
    // stone plinth
    for (const [sw, sh] of [[1.5, 0.035], [1.32, 0.035], [1.14, 0.035]]) {
      ctx.fillStyle = '#8f8a80'; ctx.fillRect((-sw * T) / 2, y - sh * T, sw * T, sh * T);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect((-sw * T) / 2, y - sh * T, sw * T, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect((-sw * T) / 2, y - 2, sw * T, 2);
      y -= sh * T;
    }
    // ground shrine: brick walls, gilded doorway, torana, garland
    const b1w = 0.8 * T, b1h = 0.3 * T;
    ctx.fillStyle = '#93452b'; ctx.fillRect(-b1w / 2, y - b1h, b1w, b1h);
    ctx.fillStyle = 'rgba(60,20,10,0.35)'; for (let k = y - b1h + 4; k < y; k += 5) ctx.fillRect(-b1w / 2, k, b1w, 1);
    for (const px of [-0.36, -0.2, 0.2, 0.36]) { ctx.fillStyle = '#3b2416'; ctx.fillRect(px * T - T * 0.025, y - b1h, T * 0.05, b1h); }
    ctx.fillStyle = gold(y - b1h * 0.8, y); ctx.fillRect(-T * 0.14, y - b1h * 0.78, T * 0.28, b1h * 0.78);
    ctx.fillStyle = '#1a0f09'; ctx.fillRect(-T * 0.1, y - b1h * 0.68, T * 0.2, b1h * 0.68);
    const glow = ctx.createRadialGradient(0, y - b1h * 0.35, 1, 0, y - b1h * 0.35, T * 0.1);
    glow.addColorStop(0, 'rgba(255,170,60,0.9)'); glow.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = glow; ctx.fillRect(-T * 0.1, y - b1h * 0.68, T * 0.2, b1h * 0.68);
    ctx.fillStyle = gold(y - b1h, y - b1h * 0.7); ctx.beginPath(); ctx.ellipse(0, y - b1h * 0.78, T * 0.17, T * 0.1, 0, Math.PI, TAU); ctx.fill();
    for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? '#ffb300' : '#ef6c00'; circle(-T * 0.16 + (k * T * 0.32) / 8, y - b1h * 0.75 + Math.sin((k / 8) * Math.PI) * T * 0.04, T * 0.018); }
    y -= b1h;
    // three gilded roofs
    const tiers = [[1.3, 0.15, 0.56, 0.13], [1.0, 0.13, 0.4, 0.11], [0.74, 0.12, 0, 0]];
    let ti = 0;
    for (const [rw, rh, bw, bh] of tiers) {
      const topW = (bw || 0.22) * T;
      ctx.strokeStyle = '#2a170e'; ctx.lineWidth = Math.max(2, T * 0.012);
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * topW * 0.22, y + T * 0.07); ctx.lineTo(k * rw * T * 0.2, y + 2); ctx.stroke(); }
      ctx.fillStyle = gold(y - rh * T, y);
      poly([[(-rw * T) / 2, y], [(rw * T) / 2, y], [topW / 2, y - rh * T], [-topW / 2, y - rh * T]]);
      ctx.strokeStyle = 'rgba(110,70,0,0.45)'; ctx.lineWidth = 1;
      for (let k = 0; k <= 14; k++) { const tt = k / 14; ctx.beginPath(); ctx.moveTo(lerp(-rw * T / 2, rw * T / 2, tt), y); ctx.lineTo(lerp(-topW / 2, topW / 2, tt), y - rh * T); ctx.stroke(); }
      ctx.fillStyle = '#5a3a0a'; ctx.fillRect((-rw * T) / 2, y - 1.5, rw * T, 3);
      ctx.fillStyle = '#e8b923';
      for (let k = 0; k <= 16; k++) { const bx2 = lerp(-rw * T / 2, rw * T / 2, k / 16); ctx.fillRect(bx2 - 0.75, y, 1.5, T * 0.025); circle(bx2, y + T * 0.03, T * 0.008); }
      y -= rh * T;
      if (bw) {
        ctx.fillStyle = '#93452b'; ctx.fillRect((-bw * T) / 2, y - bh * T, bw * T, bh * T);
        ctx.fillStyle = gold(y - bh * T, y);
        for (const wx of ti === 0 ? [-0.15, 0, 0.15] : [-0.08, 0.08]) ctx.fillRect(wx * T - T * 0.035, y - bh * T * 0.8, T * 0.07, bh * T * 0.6);
        y -= bh * T;
      }
      ti++;
    }
    // gajur: the golden pinnacle
    ctx.fillStyle = gold(y - T * 0.28, y);
    circle(0, y - T * 0.04, T * 0.05);
    poly([[-T * 0.07, y - T * 0.08], [T * 0.07, y - T * 0.08], [0, y - T * 0.18]]);
    circle(0, y - T * 0.19, T * 0.025);
    poly([[-T * 0.012, y - T * 0.2], [T * 0.012, y - T * 0.2], [0, y - T * 0.28]]);
    // the long gilded banner (pataka) hanging from the top down the front
    const by0 = y - T * 0.02, by1 = -T * 0.105 - b1h * 0.98;
    ctx.fillStyle = gold(by0, by1);
    ctx.fillRect(-T * 0.022, by0, T * 0.044, by1 - by0);
    ctx.fillStyle = 'rgba(90,58,10,0.6)';
    for (let k = by0 + T * 0.04; k < by1; k += T * 0.05) ctx.fillRect(-T * 0.022, k, T * 0.044, 1.2);
    // pigeons resting on the roofs
    ctx.fillStyle = '#7d838c';
    for (let k = 0; k < 7; k++) { const px = (k / 6 - 0.5) * T * 0.9, py = -T * 0.405 - (k % 3) * T * 0.002; ctx.beginPath(); ctx.ellipse(px, py - T * 0.012, T * 0.016, T * 0.01, 0, 0, TAU); ctx.fill(); }
  }

  // ----- The map: labels, and the paper, ponds, parks and streets that drawMap() in main.js caches -----
  function mapLabel(text, x, y, size, col, weight, noHalo) {
    ctx.font = `${weight || 700} ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (!noHalo) { ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,250,240,0.92)'; ctx.strokeText(text, x, y); }
    ctx.fillStyle = col; ctx.fillText(text, x, y);
  }

  function drawMapBase(rect, full, f, X, Y) {
    const INK = '#141414', PAPER = '#fdfcf8';
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.fillStyle = '#f1efe8'; ctx.fill(); ctx.clip();
    for (const a of MAP.a) {
      ctx.beginPath();
      for (let i = 0; i < a.p.length; i += 2) { if (i) ctx.lineTo(X(a.p[i]), Y(a.p[i + 1])); else ctx.moveTo(X(a.p[i]), Y(a.p[i + 1])); }
      ctx.closePath();
      ctx.fillStyle = PAPER; ctx.fill();
      ctx.save(); ctx.clip();
      const bx = Math.min(...a.p.filter((_, i) => i % 2 === 0).map(X)), by = Math.min(...a.p.filter((_, i) => i % 2 === 1).map(Y));
      const ex = Math.max(...a.p.filter((_, i) => i % 2 === 0).map(X)), ey = Math.max(...a.p.filter((_, i) => i % 2 === 1).map(Y));
      ctx.strokeStyle = 'rgba(20,20,20,0.35)'; ctx.lineWidth = 1;
      if (a.k === 'water') { for (let y = by; y < ey; y += 4) { ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(ex, y); ctx.stroke(); } }
      else { ctx.fillStyle = 'rgba(20,20,20,0.3)'; for (let y = by; y < ey; y += 7) for (let x = bx + ((y / 7) % 2) * 3.5; x < ex; x += 7) ctx.fillRect(x, y, 1.2, 1.2); }
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    }
    const wd = (c) => Math.max(full ? 2.5 : 1.1, (c === 3 ? 10 : c === 2 ? 7 : 5) * f.sc);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (const r of MAP.r) {
        ctx.strokeStyle = pass ? PAPER : INK;
        ctx.lineWidth = wd(r[0]) + (pass ? 0 : full ? 2 : 1);
        ctx.beginPath();
        for (let k = 1; k < r.length; k++) { const [x, y] = mpt(r[k]); if (k > 1) ctx.lineTo(X(x), Y(y)); else ctx.moveTo(X(x), Y(y)); }
        ctx.stroke();
      }
    }
  }

  // ----- Figures: the Dharahara, kites, pigeons, dhaka cloth, goats -----
  function drawDharahara(x, base, h) {
    const bw = h * 0.15, tw = h * 0.09, sh = h * 0.78;
    ctx.fillStyle = '#efece6'; poly([[x - bw / 2, base], [x + bw / 2, base], [x + tw / 2, base - sh], [x - tw / 2, base - sh]]);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; poly([[x + bw * 0.1, base], [x + bw / 2, base], [x + tw / 2, base - sh], [x + tw * 0.05, base - sh]]);
    ctx.fillStyle = 'rgba(120,110,100,0.35)';
    for (let k = 1; k < 8; k++) { const y = base - (sh * k) / 8, w2 = lerp(bw, tw, k / 8); ctx.fillRect(x - w2 / 2, y, w2, 1.5); }
    ctx.fillStyle = '#d8d3ca'; ctx.fillRect(x - tw * 0.85, base - sh * 0.86, tw * 1.7, h * 0.025);
    ctx.fillStyle = '#c9961a'; poly([[x - tw * 0.45, base - sh], [x + tw * 0.45, base - sh], [x, base - h]]);
    circle(x, base - sh - h * 0.02, tw * 0.3);
  }

  function drawKite(x, y, s, c, c2, ph, noString) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(ph * 1.3) * 0.15);
    ctx.fillStyle = c; poly([[0, -s], [s * 0.8, 0], [0, s * 1.1], [-s * 0.8, 0]]);
    ctx.fillStyle = c2; poly([[0, -s], [s * 0.8, 0], [0, 0]]);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, s * 1.1);
    for (let k = 1; k < 6; k++) ctx.lineTo(Math.sin(ph * 3 + k) * s * 0.3, s * 1.1 + k * s * 0.35);
    ctx.stroke();
    ctx.restore();
    if (!noString) { ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x, y + s); ctx.lineTo(x - s * 6, y + s * 14); ctx.stroke(); }
  }

  function drawPigeon(x, y, s, ph) {
    const peck = Math.max(0, Math.sin(ph * 2)) * s * 0.5;
    ctx.fillStyle = '#8a8f99'; ctx.beginPath(); ctx.ellipse(x, y - s, s * 1.3, s * 0.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5f6670'; ctx.beginPath(); ctx.ellipse(x - s * 0.9, y - s * 1.1, s * 0.6, s * 0.3, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6d7480'; circle(x + s * 1.1, y - s * 1.4 + peck, s * 0.55);
    ctx.fillStyle = '#4f7f6a'; circle(x + s * 0.8, y - s * 1.2 + peck * 0.5, s * 0.3);
    ctx.fillStyle = '#e0a020'; ctx.fillRect(x + s * 1.6, y - s * 1.4 + peck, s * 0.4, s * 0.15);
  }

  function drawDhaka(x, y, w, h) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(x, y, w, h);
    const c = Math.max(3, w / 4);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#1b1b1b' : '#f5f0e6';
      const cx = x + i * c, cy = y + j * c;
      poly([[cx, cy - c * 0.3], [cx + c * 0.3, cy], [cx, cy + c * 0.3], [cx - c * 0.3, cy]]);
    }
    ctx.restore();
  }

  function drawGoat(x, y, s, flip, col, ph) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    const step = ph ? Math.sin(ph) * s * 0.08 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(s * 0.05, 0, s * 0.6, s * 0.08, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [lx, d] of [[-0.35, 1], [-0.2, -1], [0.22, 1], [0.36, -1]]) { ctx.moveTo(lx * s, -s * 0.4); ctx.lineTo(lx * s + d * step, 0); }
    ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -s * 0.55, s * 0.5, s * 0.25, 0, 0, TAU); ctx.fill();
    if (col !== '#3e2723') { ctx.fillStyle = 'rgba(93,64,55,0.45)'; ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.6, s * 0.15, s * 0.1, 0.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * 0.35, -s * 0.65); ctx.lineTo(s * 0.55, -s * 0.95); ctx.lineTo(s * 0.68, -s * 0.85); ctx.lineTo(s * 0.5, -s * 0.5); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.66, -s * 0.9, s * 0.17, s * 0.11, 0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8d7b6a'; ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.beginPath(); ctx.moveTo(s * 0.58, -s * 1.0); ctx.quadraticCurveTo(s * 0.5, -s * 1.2, s * 0.38, -s * 1.12); ctx.stroke();
    ctx.fillStyle = '#1b1b1b'; circle(s * 0.68, -s * 0.94, Math.max(1, s * 0.03));
    ctx.fillStyle = col === '#3e2723' ? '#5d4037' : '#d7ccc8'; poly([[s * 0.74, -s * 0.82], [s * 0.8, -s * 0.66], [s * 0.7, -s * 0.8]]);
    ctx.fillStyle = col; poly([[-s * 0.48, -s * 0.62], [-s * 0.62, -s * 0.78], [-s * 0.5, -s * 0.55]]);
    ctx.restore();
  }

  MM.Art = {
    icon, FONT, FLAG, SACHETS, CLOTH, rr, circle, poly, ease, shadeHex, withCtx, makePerson,
    buildFacade, hangingGoods, buildTemple, mapLabel, drawMapBase, drawDharahara, drawKite, drawPigeon, drawDhaka, drawGoat,
  };
})();
