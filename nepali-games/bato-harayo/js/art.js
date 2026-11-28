/* Bato Harayo: night scenes drawn on the canvas (sky, places, people, road decisions, torch, vignette). */
(() => {
  'use strict';
  const BH = (window.BH = window.BH || {});
  const { DAWN, rand, clamp, lerp, mix, mulberry32 } = BH.Util;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  const FLAG = ['#1f6fd1', '#f4f4f4', '#e23b3b', '#2e9e5b', '#f5c518'];
  const demoNode = { id: 7, scene: 'forest', person: null };

  // ---------- Rendering ----------
  let W = 0, H = 0, DPR = 1, gy = 0, u = 10, px = 0, portrait = false;
  let stars = [], hills = [], fireflies = [];
  function resize(state) {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const vw = window.innerWidth, vh = window.innerHeight;
    // Wide screens: the story sits in a right-hand column (same rule as the CSS media query); the scene fills the rest.
    const sidebar = state === 'play' && vw >= 900 && vw / vh >= 1.25;
    W = sidebar ? vw - Math.min(440, vw * 0.36) : vw; H = vh;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    glows.clear(); vignette = null;
    portrait = H > W * 1.1;
    gy = H * (sidebar ? 0.6 : portrait ? 0.4 : 0.46);
    u = sidebar ? Math.min(H * 0.03, W * 0.05) : Math.min(H * 0.024, W * 0.045);
    px = W * (portrait ? 0.64 : 0.62);
    stars = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * gy, s: rand(0.6, 1.8), p: rand(0, TAU) }));
    const rnd = mulberry32(3);
    hills = [0, 1].map((k) => { const pts = []; for (let i = 0; i <= 40; i++) pts.push(gy - (k ? 0.05 : 0.12) * H - (rnd() * 0.06 + Math.sin(i * 0.4 + k * 2) * 0.03) * H); return pts; });
    fireflies = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: gy + rand(-H * 0.2, H * 0.1), p: rand(0, TAU), s: rand(0.5, 1.2) }));
  }

  // Big gradient fills are very slow on phones that draw the canvas in software, so gradients
  // are painted once into small offscreen canvases and copied (whole device pixels, so a copy
  // is never resampled), with globalAlpha supplying any flicker. Same pixels, much less work.
  const snap = (v) => Math.round(v * DPR) / DPR;
  const glows = new Map(); // a few soft glow sprites, by size and colour
  function glow(x, y, r, rgb, a) {
    const key = `${r}|${rgb}`;
    let s = glows.get(key);
    if (!s) {
      if (glows.size > 8) glows.delete(glows.keys().next().value); // keep memory small
      const n = Math.ceil(r * 2 * DPR), c = (s = document.createElement('canvas')).getContext('2d');
      s.width = s.height = n;
      const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, r * DPR);
      g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g; c.fillRect(0, 0, n, n);
      glows.set(key, s);
    }
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * a; ctx.drawImage(s, snap(x - r), snap(y - r), s.width / DPR, s.height / DPR); ctx.globalAlpha = ga;
  }
  // A vertical gradient is painted into a 1px-wide column (again only when its colours or size
  // change) and stretched across the rect.
  function vGrad(slot, x, y, w, h, y0, y1, stops) {
    const rows = Math.max(1, Math.ceil(h * DPR)), key = `${DPR}|${rows}|${y0 - y}|${y1 - y}|${stops.join()}`;
    const c = slot.c || (slot.c = document.createElement('canvas'));
    if (slot.key !== key) {
      slot.key = key; c.width = 1; c.height = rows;
      const cx = c.getContext('2d'), g = cx.createLinearGradient(0, (y0 - y) * DPR, 0, (y1 - y) * DPR);
      for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
      cx.fillStyle = g; cx.fillRect(0, 0, 1, rows);
    }
    ctx.drawImage(c, 0, 0, 1, h * DPR, x, y, w, h);
  }
  const skyCol = {}, groundCol = {}, riverCol = {}, beamCol = {};
  let vignette = null; // the dark edges: drawn once at full strength, then faded with globalAlpha
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function poly(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); }

  function pine(x, base, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x - h * 0.03, base - h * 0.25, h * 0.06, h * 0.25);
    for (let k = 0; k < 3; k++) { const w = h * (0.42 - k * 0.1), y0 = base - h * (0.2 + k * 0.25); poly([[x - w, y0], [x, y0 - h * 0.38], [x + w, y0]]); }
  }
  function broad(x, base, h, col, rnd) {
    ctx.fillStyle = col;
    ctx.fillRect(x - h * 0.04, base - h * 0.55, h * 0.08, h * 0.55);
    for (let k = 0; k < 5; k++) dot(x + (rnd() - 0.5) * h * 0.5, base - h * (0.6 + rnd() * 0.3), h * (0.18 + rnd() * 0.08));
  }

  function drawSky(dawnK, time, minutes) {
    vGrad(skyCol, 0, 0, W, gy + 2, 0, gy, [0, mix('#03050f', '#2b3a6b', dawnK), 0.7, mix('#0a1130', '#c86b4a', dawnK), 1, mix('#141c44', '#f2b36b', dawnK)]);
    ctx.fillStyle = '#ffffff';
    for (const s of stars) { ctx.globalAlpha = (1 - dawnK) * (0.3 + 0.7 * Math.sin(time * 1.3 + s.p) ** 2); ctx.fillRect(s.x, s.y, s.s, s.s); }
    ctx.globalAlpha = 1;
    const mk = clamp(minutes / DAWN, 0, 1), mx = lerp(W * 0.3, W * 0.9, mk), my = Math.max(gy * 0.36, 150) - Math.sin(mk * Math.PI) * gy * 0.08; // clear of the HUD
    glow(mx, my, u * 6, '220,230,255', 0.25 * (1 - dawnK));
    ctx.fillStyle = `rgba(240,240,225,${1 - dawnK * 0.7})`; dot(mx, my, u * 1.3);
    ctx.fillStyle = mix('#03050f', '#2b3a6b', dawnK); dot(mx + u * 0.5, my - u * 0.25, u * 1.1); // crescent
    if (dawnK > 0) glow(W * 0.85, gy, H * 0.4, '255,170,90', 0.35 * dawnK);
    hills.forEach((pts, k) => {
      ctx.fillStyle = mix(k ? '#070b1c' : '#0b1230', k ? '#3a3048' : '#5a4a6a', dawnK);
      ctx.beginPath(); ctx.moveTo(0, gy + 2);
      pts.forEach((y, i) => ctx.lineTo((i / (pts.length - 1)) * W, y));
      ctx.lineTo(W, gy + 2); ctx.closePath(); ctx.fill();
    });
    vGrad(groundCol, 0, gy, W, H - gy, gy, H, [0, mix('#0b1022', '#3a3a3a', dawnK * 0.6), 1, '#03040a']);
  }

  function drawScene(n, dawnK, time) {
    const rnd = mulberry32(n.id * 977 + 13);
    const back = mix('#0f1736', '#3b3550', dawnK), front = mix('#060912', '#1c1a26', dawnK);
    switch (n.scene) {
      case 'forest': {
        for (let i = 0; i < 16; i++) pine(rnd() * W, gy + rnd() * u * 2, u * (6 + rnd() * 5), back);
        ctx.fillStyle = '#1a1a26'; poly([[W * 0.42, gy], [W * 0.5, gy], [W * 0.75, H], [W * 0.2, H]]);
        for (let i = 0; i < 6; i++) { const left = i % 2 === 0; pine(left ? rnd() * W * 0.22 : W - rnd() * W * 0.22, gy + u * (3 + rnd() * 4), u * (14 + rnd() * 6), front); }
        break;
      }
      case 'river': {
        for (let i = 0; i < 10; i++) broad(rnd() * W, gy, u * (5 + rnd() * 3), back, rnd);
        vGrad(riverCol, 0, gy + u, W, H, gy + u, H, [0, mix('#14244a', '#7a6a8a', dawnK), 1, '#050a18']);
        ctx.strokeStyle = 'rgba(200,215,255,0.25)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 18; i++) { const y = gy + u * 2 + rnd() * (H - gy), x = ((rnd() * W + time * 30 * (0.5 + rnd())) % (W + 80)) - 40; line(x, y, x + u * (2 + rnd() * 3), y); }
        ctx.fillStyle = front; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(rnd() * W, gy + u * (2 + rnd() * 6), u * (1.5 + rnd() * 2), u * 0.8, 0, 0, TAU); ctx.fill(); }
        break;
      }
      case 'bridge': {
        ctx.fillStyle = '#04060c'; ctx.fillRect(0, gy, W, H);
        ctx.fillStyle = front; poly([[0, gy - u * 2], [W * 0.18, gy - u * 1], [W * 0.12, H], [0, H]]); poly([[W, gy - u * 2], [W * 0.82, gy - u], [W * 0.88, H], [W, H]]);
        const sag = (x0, x1, y, s) => { ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + s, x1, y); ctx.stroke(); };
        const sway = Math.sin(time * 0.8) * u * 0.4;
        ctx.strokeStyle = '#3b3f55'; ctx.lineWidth = Math.max(2, u * 0.25);
        sag(W * 0.15, W * 0.85, gy - u * 1.2, u * 3 + sway);
        ctx.strokeStyle = '#555a72'; ctx.lineWidth = Math.max(1.5, u * 0.12);
        sag(W * 0.15, W * 0.85, gy - u * 4.5, u * 2.5 + sway); sag(W * 0.15, W * 0.85, gy - u * 4.8, u * 2.5 + sway);
        for (let i = 1; i < 14; i++) { const s = i / 14, x = lerp(W * 0.15, W * 0.85, s), b = 4 * s * (1 - s); line(x, gy - u * 4.5 + (u * 2.5 + sway) * b, x, gy - u * 1.2 + (u * 3 + sway) * b); }
        for (let i = 0; i < 22; i++) { const s = (i + 0.5) / 22, x = lerp(W * 0.15, W * 0.85, s), y = gy - u * 4.8 + (u * 2.5 + sway) * 4 * s * (1 - s); ctx.fillStyle = FLAG[i % 5]; ctx.globalAlpha = 0.55; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(time * 4 + i) * 0.3); ctx.fillRect(-u * 0.3, 0, u * 0.6, u * 0.8); ctx.restore(); }
        ctx.globalAlpha = 1;
        break;
      }
      case 'chautari': {
        for (let i = 0; i < 6; i++) broad(rnd() * W, gy, u * (5 + rnd() * 3), back, rnd);
        const cx = W * (portrait ? 0.3 : 0.35);
        ctx.fillStyle = mix('#1d1f2e', '#4a4552', dawnK);
        ctx.fillRect(cx - u * 6, gy - u * 1.6, u * 12, u * 1.6); ctx.fillRect(cx - u * 4.5, gy - u * 3, u * 9, u * 1.4);
        ctx.fillStyle = front; ctx.fillRect(cx - u * 0.6, gy - u * 12, u * 1.2, u * 9);
        const sway = Math.sin(time * 0.9) * u * 0.3;
        for (let k = 0; k < 9; k++) dot(cx + (rnd() - 0.5) * u * 14 + sway, gy - u * (12 + rnd() * 5), u * (3 + rnd() * 2));
        break;
      }
      case 'temple': {
        for (let i = 0; i < 8; i++) pine(rnd() * W, gy, u * (5 + rnd() * 4), back);
        const cx = W * (portrait ? 0.3 : 0.36), base = gy;
        ctx.fillStyle = '#1f1a22'; ctx.fillRect(cx - u * 4, base - u * 1, u * 8, u); ctx.fillRect(cx - u * 2.6, base - u * 5, u * 5.2, u * 4);
        ctx.fillStyle = '#120c10'; poly([[cx - u * 4.4, base - u * 4.6], [cx, base - u * 7.2], [cx + u * 4.4, base - u * 4.6]]); poly([[cx - u * 3, base - u * 6.6], [cx, base - u * 8.8], [cx + u * 3, base - u * 6.6]]);
        ctx.fillStyle = '#c99a2e'; poly([[cx - u * 0.4, base - u * 8.7], [cx, base - u * 10], [cx + u * 0.4, base - u * 8.7]]);
        const fl = 0.45 + 0.08 * Math.sin(time * 11) + 0.05 * Math.sin(time * 17);
        glow(cx, base - u * 2.2, u * 9, '255,180,80', fl);
        ctx.fillStyle = '#ffd27a'; dot(cx, base - u * 2.2, u * 0.35);
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 1.5; line(cx + u * 3.4, base - u * 5, cx + u * 3.4, base - u * 3.8);
        ctx.fillStyle = '#9c7a3a'; dot(cx + u * 3.4, base - u * 3.6, u * 0.4);
        break;
      }
      case 'teashop': {
        for (let i = 0; i < 6; i++) broad(rnd() * W, gy, u * (5 + rnd() * 3), back, rnd);
        const cx = n.anchorX = W * (portrait ? 0.55 : 0.55), top = gy - u * 9;
        ctx.fillStyle = '#1b1612'; ctx.fillRect(cx - u * 7, top, u * 14, u * 9);
        ctx.fillStyle = '#2b2f3a'; poly([[cx - u * 8, top + u * 0.5], [cx + u * 8, top - u * 0.8], [cx + u * 8, top + u * 0.2], [cx - u * 8, top + u * 1.4]]);
        const fl = 0.55 + 0.08 * Math.sin(time * 9);
        glow(cx - u * 3, top + u * 2, u * 14, '255,170,70', fl);
        ctx.fillStyle = '#3a2516'; ctx.fillRect(cx - u * 6, gy - u * 3.4, u * 12, u * 3.4);
        ctx.fillStyle = '#ffcf7a'; ctx.fillRect(cx - u * 3.3, top + u * 1.6, u * 0.6, u * 0.9);
        ctx.strokeStyle = '#ffcf7a'; ctx.lineWidth = 1; line(cx - u * 3, top + u * 1.2, cx - u * 3, top + u * 1.6);
        ctx.fillStyle = '#7a7f8a'; ctx.fillRect(cx + u * 2.4, gy - u * 4.4, u * 1.6, u * 1.0);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
        for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let j = 0; j <= 6; j++) ctx.lineTo(cx + u * (3 + k * 0.5) + Math.sin(time * 3 + j + k * 2) * u * 0.25, gy - u * 4.6 - j * u * 0.35); ctx.stroke(); }
        ctx.fillStyle = '#3a2516'; ctx.fillRect(cx - u * 3.6, top - u * 2.6, u * 7.2, u * 1.9); // signboard on the roof
        ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1, u * 0.15); line(cx - u * 2.8, top - u * 0.7, cx - u * 2.8, top + u * 0.2); line(cx + u * 2.8, top - u * 0.7, cx + u * 2.8, top - u * 0.4);
        ctx.fillStyle = '#e8d6b0'; ctx.font = `700 ${Math.round(u * 1.1)}px "Nirmala UI", "Noto Sans Devanagari", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('चिया पसल', cx, top - u * 1.65);
        n.anchorY = gy - u * 3.2;
        break;
      }
      case 'fields': {
        for (let i = 0; i < 5; i++) broad(rnd() * W, gy - u * 0.5, u * (4 + rnd() * 2), back, rnd);
        for (let k = 0; k < 7; k++) {
          const y = gy + (H - gy) * (k / 7) ** 1.3;
          ctx.fillStyle = mix(k % 2 ? '#0b1a14' : '#0e2018', '#3a4a3a', dawnK * 0.6);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + u * (1 + k * 0.6) * (k % 2 ? 1 : -1), W, y); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(160,190,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + u * (1 + k * 0.6) * (k % 2 ? 1 : -1), W, y); ctx.stroke();
        }
        break;
      }
      case 'crossroads':
      case 'road': {
        for (let i = 0; i < 7; i++) broad(rnd() * W, gy, u * (4 + rnd() * 3), back, rnd);
        ctx.strokeStyle = back; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const x = W * (0.15 + i * 0.35); line(x, gy - u * 9, x, gy + u * 2); line(x - u * 1.2, gy - u * 8.5, x + u * 1.2, gy - u * 8.5); }
        ctx.strokeStyle = 'rgba(15,23,54,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, gy - u * 8); ctx.quadraticCurveTo(W * 0.32, gy - u * 6.5, W * 0.5, gy - u * 8.5); ctx.quadraticCurveTo(W * 0.68, gy - u * 6.5, W, gy - u * 8); ctx.stroke();
        ctx.fillStyle = mix('#1e1c22', '#5a5048', dawnK);
        if (n.scene === 'road') poly([[W * 0.46, gy], [W * 0.54, gy], [W * 0.85, H], [W * 0.15, H]]);
        else { poly([[W * 0.45, gy], [W * 0.55, gy], [W * 0.7, H], [W * 0.3, H]]); poly([[W * 0.5, gy + u * 3], [W * 0.52, gy + u * 5], [-W * 0.1, gy + u * 10], [0, gy + u * 4]]); poly([[W * 0.5, gy + u * 3], [W * 0.5, gy + u * 5], [W * 1.1, gy + u * 10], [W, gy + u * 4]]); }
        if (n.scene === 'crossroads') {
          const sx = W * (portrait ? 0.3 : 0.36);
          ctx.save(); ctx.translate(sx, gy + u * 2); ctx.rotate(-0.12);
          ctx.fillStyle = '#2a2420'; ctx.fillRect(-u * 0.25, -u * 8, u * 0.5, u * 8);
          ctx.fillStyle = '#3d4a5c'; ctx.fillRect(-u * 3.5, -u * 8.2, u * 7, u * 2.2);
          ctx.strokeStyle = 'rgba(220,220,200,0.35)'; ctx.lineWidth = 2; line(-u * 2.6, -u * 7.1, u * 1.6, -u * 7.1); line(u * 1.6, -u * 7.1, u * 0.9, -u * 7.6);
          ctx.restore();
        } else { ctx.fillStyle = '#d8d2c4'; ctx.fillRect(W * 0.2, gy + u * 1.5, u * 1.2, u * 1.6); ctx.fillStyle = '#c23a2e'; ctx.fillRect(W * 0.2, gy + u * 1.5, u * 1.2, u * 0.5); }
        break;
      }
      case 'village': {
        for (let i = 0; i < 6; i++) broad(rnd() * W, gy, u * (4 + rnd() * 3), back, rnd);
        for (let i = 0; i < 6; i++) {
          const x = W * (0.08 + i * 0.16) + (rnd() - 0.5) * u * 2, w = u * (4 + rnd() * 2), h = u * (3 + rnd() * 2), y = gy + u * (1 + rnd() * 3);
          ctx.fillStyle = mix('#2a1c18', '#7a4a36', dawnK); ctx.fillRect(x - w / 2, y - h, w, h);
          ctx.fillStyle = mix('#14100e', '#4a3a30', dawnK); poly([[x - w * 0.62, y - h], [x, y - h - u * 2], [x + w * 0.62, y - h]]);
          glow(x, y - h * 0.5, u * 4, '255,190,90', 0.35);
          ctx.fillStyle = '#ffcf7a'; ctx.fillRect(x - u * 0.5, y - h * 0.7, u, u * 0.9);
        }
        break;
      }
      default: break;
    }
  }

  function drawPerson(n, p, time) {
    const anchorX = n.scene === 'teashop' ? (n.anchorX || W * 0.55) : px;
    const x = anchorX, base = n.scene === 'teashop' ? (n.anchorY || gy) : n.scene === 'river' ? gy + u * 0.6 : gy + u * 1.5; // on the bank, not in the water
    const skin = '#7a5440';
    ctx.lineCap = 'round';
    switch (p.type) {
      case 'hajurama': {
        glow(x + u * 2.6, base - u * 3.6, u * 10, '255,190,90', 0.38 + 0.05 * Math.sin(time * 9));
        ctx.strokeStyle = '#2a1c14'; ctx.lineWidth = u * 0.25; line(x - u * 2, base, x - u * 1.3, base - u * 5);
        ctx.fillStyle = '#4a1e26';
        ctx.beginPath(); ctx.moveTo(x - u * 1.7, base); ctx.lineTo(x - u * 1.4, base - u * 4.6); ctx.quadraticCurveTo(x - u * 0.5, base - u * 6.6, x + u * 0.9, base - u * 5.4); ctx.lineTo(x + u * 1.5, base); ctx.closePath(); ctx.fill();
        ctx.fillStyle = skin; dot(x + u * 0.55, base - u * 5.6, u * 0.72);
        ctx.fillStyle = '#5e2a32'; ctx.beginPath(); ctx.arc(x + u * 0.45, base - u * 5.7, u * 0.9, Math.PI * 0.9, Math.PI * 2.05); ctx.fill();
        ctx.strokeStyle = '#4a1e26'; ctx.lineWidth = u * 0.5; line(x + u * 0.7, base - u * 4.3, x + u * 2.3, base - u * 3.7);
        ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + u * 2.6, base - u * 3.5, u * 0.5, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = '#ffd27a'; ctx.fillRect(x + u * 2.2, base - u * 3.5, u * 0.8, u * 1.1);
        break;
      }
      case 'gothalo': {
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = u * 0.2; line(x - u * 1.6, base - u * 6.5, x + u * 1.2, base - u * 1.5);
        ctx.strokeStyle = '#1c2236'; ctx.lineWidth = u * 0.5; line(x - u * 0.4, base - u * 2, x - u * 0.6, base); line(x + u * 0.4, base - u * 2, x + u * 0.6, base);
        ctx.fillStyle = '#2c3a5a'; ctx.fillRect(x - u * 0.9, base - u * 4.4, u * 1.8, u * 2.5);
        ctx.fillStyle = skin; dot(x, base - u * 5.1, u * 0.65);
        ctx.fillStyle = '#7a2a2a'; poly([[x - u * 0.7, base - u * 5.4], [x + u * 0.7, base - u * 5.4], [x + u * 0.5, base - u * 6.1], [x - u * 0.6, base - u * 6]]);
        ctx.fillStyle = '#f5c518'; ctx.fillRect(x - u * 0.15, base - u * 5.9, u * 0.25, u * 0.25);
        break;
      }
      case 'drunk': {
        ctx.save(); ctx.translate(x, base); ctx.rotate(Math.sin(time * 1.4) * 0.09);
        ctx.strokeStyle = '#1a1c28'; ctx.lineWidth = u * 0.55; line(-u * 0.5, -u * 2.6, -u * 0.8, 0); line(u * 0.5, -u * 2.6, u * 0.9, 0);
        ctx.fillStyle = '#3a3226'; ctx.fillRect(-u * 1.1, -u * 5.6, u * 2.2, u * 3.1);
        ctx.fillStyle = skin; dot(0, -u * 6.3, u * 0.75);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-u * 0.8, -u * 7.1, u * 1.6, u * 0.45);
        ctx.strokeStyle = '#3a3226'; ctx.lineWidth = u * 0.45; line(u * 0.9, -u * 5.2, u * 1.9, -u * 4);
        ctx.fillStyle = '#6aa0a0'; ctx.globalAlpha = 0.7; ctx.fillRect(u * 1.7, -u * 4.4, u * 0.45, u * 1.2); ctx.globalAlpha = 1;
        ctx.restore();
        break;
      }
      case 'didi': {
        ctx.fillStyle = '#7a1f3a'; ctx.fillRect(x - u * 1.2, base - u * 3.2, u * 2.4, u * 3.2);
        ctx.fillStyle = skin; dot(x, base - u * 3.9, u * 0.75);
        ctx.fillStyle = '#120c0a'; ctx.beginPath(); ctx.arc(x, base - u * 4.05, u * 0.8, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#f5c518'; dot(x + u * 0.1, base - u * 3.2, u * 0.12);
        break;
      }
      case 'jhankri': {
        const fl = 0.5 + 0.1 * Math.sin(time * 13);
        glow(x - u * 2.6, base - u * 0.5, u * 8, '255,140,50', fl);
        ctx.fillStyle = '#ff8a2a'; for (let k = 0; k < 3; k++) poly([[x - u * (3.2 - k * 0.5), base], [x - u * (2.9 - k * 0.5) + Math.sin(time * 15 + k) * u * 0.2, base - u * (1.4 + Math.sin(time * 9 + k) * 0.3)], [x - u * (2.5 - k * 0.5), base]]);
        ctx.fillStyle = '#d8d2c4'; poly([[x - u * 1.8, base], [x - u * 0.8, base - u * 5], [x + u * 0.8, base - u * 5], [x + u * 1.8, base]]);
        ctx.strokeStyle = '#c23a2e'; ctx.lineWidth = u * 0.2; line(x - u * 0.8, base - u * 4.6, x + u * 0.8, base - u * 3.6);
        ctx.fillStyle = skin; dot(x, base - u * 5.7, u * 0.7);
        ctx.strokeStyle = '#2e7d6b'; ctx.lineWidth = u * 0.2;
        for (let k = -3; k <= 3; k++) line(x, base - u * 6.2, x + k * u * 0.35, base - u * 7.8 - Math.abs(k) * -u * 0.15);
        ctx.fillStyle = '#d4a017'; for (let k = -3; k <= 3; k++) dot(x + k * u * 0.35, base - u * 7.8 + Math.abs(k) * u * 0.15, u * 0.16);
        ctx.fillStyle = '#c8b48a'; dot(x + u * 2, base - u * 3.6, u * 1.1);
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = u * 0.15; line(x + u * 2, base - u * 2.5, x + u * 2, base - u * 1.2);
        break;
      }
      case 'kichkandi': {
        const bob = Math.sin(time * 1.6) * u * 0.3;
        glow(x, base - u * 3.5 + bob, u * 7, '200,210,255', 0.18);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#d9dde8'; poly([[x - u * 1.6, base - u * 0.3 + bob], [x - u * 0.8, base - u * 5.2 + bob], [x + u * 0.8, base - u * 5.2 + bob], [x + u * 1.6, base - u * 0.3 + bob]]);
        ctx.fillStyle = '#05060a'; poly([[x - u * 0.9, base - u * 6.7 + bob], [x + u * 0.9, base - u * 6.7 + bob], [x + u * 1.1, base - u * 3.4 + bob], [x - u * 1.1, base - u * 3.4 + bob]]);
        dot(x, base - u * 6.3 + bob, u * 0.85);
        ctx.fillStyle = '#c9c2b6'; // feet pointing backwards
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * u * 0.5, base + bob, u * 0.45, u * 0.2, 0, 0, TAU); ctx.fill(); for (let k = 0; k < 3; k++) dot(x + s * u * 0.5 + (k - 1) * u * 0.18, base - u * 0.2 + bob, u * 0.08); }
        ctx.globalAlpha = 1;
        break;
      }
      case 'kukur': {
        const b = base, wag = Math.sin(time * 12) * 0.5;
        ctx.fillStyle = '#5a4630';
        ctx.beginPath(); ctx.ellipse(x, b - u * 1.6, u * 1.6, u * 0.8, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#5a4630'; ctx.lineWidth = u * 0.35;
        for (const s of [-1.1, -0.6, 0.6, 1.1]) line(x + s * u, b - u * 1.2, x + s * u, b);
        dot(x + u * 1.7, b - u * 2.4, u * 0.7);
        poly([[x + u * 1.4, b - u * 3], [x + u * 1.6, b - u * 3.7], [x + u * 1.9, b - u * 2.9]]);
        ctx.save(); ctx.translate(x - u * 1.5, b - u * 1.9); ctx.rotate(-0.8 + wag); ctx.fillRect(0, -u * 0.15, u * 1.3, u * 0.3); ctx.restore();
        ctx.fillStyle = '#ffe9a0'; dot(x + u * 2, b - u * 2.5, u * 0.1);
        break;
      }
      case 'bhariya': {
        ctx.fillStyle = '#3a2f22'; poly([[x - u * 2.6, base - u * 7], [x + u * 0.2, base - u * 7.6], [x - u * 0.6, base - u * 3], [x - u * 1.8, base - u * 3]]);
        ctx.strokeStyle = 'rgba(120,100,70,0.6)'; ctx.lineWidth = 1; for (let k = 1; k < 5; k++) line(x - u * (2.5 - k * 0.12), base - u * (7 - k * 0.9), x + u * (0.1 - k * 0.15), base - u * (7.5 - k * 0.9));
        ctx.strokeStyle = '#1a1c28'; ctx.lineWidth = u * 0.5; line(x - u * 0.2, base - u * 2.6, x - u * 0.6, base); line(x + u * 0.4, base - u * 2.6, x + u * 0.6, base);
        ctx.fillStyle = '#2e3b4e'; poly([[x - u * 0.9, base - u * 2.4], [x - u * 0.4, base - u * 5], [x + u * 0.9, base - u * 4.6], [x + u * 0.9, base - u * 2.4]]);
        ctx.fillStyle = skin; dot(x + u * 0.7, base - u * 5.4, u * 0.65);
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = u * 0.15; line(x + u * 0.4, base - u * 5.9, x - u * 0.5, base - u * 6.8);
        ctx.lineWidth = u * 0.2; line(x + u * 1.6, base, x + u * 1.6, base - u * 3.5); line(x + u * 1.1, base - u * 3.5, x + u * 2.1, base - u * 3.5);
        break;
      }
      case 'sadhu': {
        const fl = 0.5 + 0.1 * Math.sin(time * 12);
        glow(x - u * 2.4, base - u * 0.6, u * 8, '255,140,50', fl);
        ctx.fillStyle = '#ff8a2a'; for (let k = 0; k < 3; k++) poly([[x - u * (3 - k * 0.5), base], [x - u * (2.7 - k * 0.5), base - u * (1.3 + Math.sin(time * 9 + k) * 0.3)], [x - u * (2.3 - k * 0.5), base]]);
        ctx.fillStyle = '#b8541a'; ctx.beginPath(); ctx.ellipse(x, base - u * 0.6, u * 2, u * 0.8, 0, 0, TAU); ctx.fill();
        poly([[x - u * 1.2, base - u * 0.6], [x - u * 0.8, base - u * 3.8], [x + u * 0.8, base - u * 3.8], [x + u * 1.2, base - u * 0.6]]);
        ctx.fillStyle = skin; dot(x, base - u * 4.5, u * 0.7);
        ctx.fillStyle = '#c8c4bc'; poly([[x - u * 0.5, base - u * 4.3], [x + u * 0.5, base - u * 4.3], [x, base - u * 3]]);
        ctx.fillStyle = '#2a2018'; dot(x, base - u * 5.3, u * 0.45);
        break;
      }
      case 'driver': {
        ctx.fillStyle = '#20232e'; ctx.fillRect(x - u * 9, base - u * 6.5, u * 6.5, u * 5.2); ctx.fillRect(x - u * 2.8, base - u * 4.6, u * 2.4, u * 3.3);
        ctx.fillStyle = '#0c0d12'; dot(x - u * 7.5, base - u * 1.2, u * 1.1); dot(x - u * 1.6, base - u * 1.2, u * 1.1);
        ctx.fillStyle = 'rgba(255,240,180,0.12)'; poly([[x - u * 0.4, base - u * 3.2], [W, base - u * 6], [W, base + u * 2]]);
        ctx.fillStyle = '#ffe9a0'; dot(x - u * 0.5, base - u * 3.2, u * 0.35);
        ctx.strokeStyle = '#1a1c28'; ctx.lineWidth = u * 0.5; line(x + u * 1.2, base - u * 2.4, x + u * 0.9, base); line(x + u * 1.9, base - u * 2.4, x + u * 2.2, base);
        ctx.fillStyle = '#4a5a3a'; ctx.fillRect(x + u * 0.6, base - u * 5, u * 2, u * 2.7);
        ctx.fillStyle = skin; dot(x + u * 1.6, base - u * 5.7, u * 0.7);
        ctx.fillStyle = '#c23a2e'; ctx.fillRect(x + u * 0.9, base - u * 6.5, u * 1.4, u * 0.4);
        break;
      }
      case 'hajurbuba': {
        ctx.fillStyle = '#e8e2d2'; poly([[x - u * 1.4, base], [x - u * 0.9, base - u * 3.4], [x + u * 0.9, base - u * 3.4], [x + u * 1.4, base]]);
        ctx.fillStyle = '#2d2f45'; ctx.fillRect(x - u * 1.6, base - u * 0.6, u * 3.2, u * 0.6);
        ctx.fillStyle = skin; dot(x, base - u * 4.1, u * 0.7);
        ctx.fillStyle = '#d8d2c4'; poly([[x - u * 0.45, base - u * 3.9], [x + u * 0.45, base - u * 3.9], [x, base - u * 3.1]]);
        ctx.fillStyle = '#7a2a2a'; poly([[x - u * 0.7, base - u * 4.4], [x + u * 0.7, base - u * 4.4], [x + u * 0.5, base - u * 5.1], [x - u * 0.6, base - u * 5]]);
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = u * 0.2; line(x + u * 1.6, base, x + u * 1.2, base - u * 4.5);
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - u * 1.05, base - u * 3.7, u * 0.4, u * 0.9);
        ctx.fillStyle = 'rgba(220,220,230,0.22)';
        for (let k = 0; k < 3; k++) dot(x - u * 0.9 - k * u * 0.3 + Math.sin(time + k) * u * 0.2, base - u * (4.3 + k * 0.7), u * (0.25 + k * 0.12));
        break;
      }
      default: break;
    }
  }

  function drawDilemma(n, time) {
    if (!n.dilemma) return;
    const x = px, base = gy + u * 1.5, open = !n.dilemmaDone;
    if (n.dilemma === 'child' && !n.childGone) { // she is still there if you walked past
      ctx.fillStyle = '#8a2a4a'; poly([[x - u * 1.1, base], [x - u * 0.6, base - u * 2.6], [x + u * 0.6, base - u * 2.6], [x + u * 1.1, base]]);
      ctx.fillStyle = '#7a5440'; dot(x, base - u * 3.2, u * 0.6);
      ctx.fillStyle = '#120c0a'; dot(x - u * 0.62, base - u * 3.1, u * 0.24); dot(x + u * 0.62, base - u * 3.1, u * 0.24);
      ctx.beginPath(); ctx.arc(x, base - u * 3.3, u * 0.63, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(170,210,255,0.85)'; dot(x - u * 0.25, base - u * (3.1 - ((time * 1.5) % 1) * 0.6), u * 0.08);
    }
    if (n.dilemma === 'snake' && open) {
      const sx = W * 0.5, sy = gy + u * 3.5;
      ctx.strokeStyle = '#4a5a30'; ctx.lineWidth = u * 0.45; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) { const a = (k / 30) * TAU * 1.6, r = u * (1.8 - (k / 30) * 1.2); ctx.lineTo(sx + Math.cos(a) * r * 1.6, sy + Math.sin(a) * r * 0.6); }
      ctx.stroke();
      const hx = sx + u * 0.4, hy = sy - u * 1.6 + Math.sin(time * 3) * u * 0.15;
      ctx.beginPath(); ctx.moveTo(sx + u * 0.6, sy - u * 0.3); ctx.quadraticCurveTo(sx + u * 0.9, sy - u, hx, hy); ctx.stroke();
      ctx.fillStyle = '#4a5a30'; ctx.beginPath(); ctx.ellipse(hx, hy, u * 0.45, u * 0.3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8d24a'; dot(hx + u * 0.15, hy - u * 0.05, u * 0.07);
      if (Math.sin(time * 6) > 0.5) { ctx.strokeStyle = '#c23a2e'; ctx.lineWidth = 1.5; line(hx + u * 0.45, hy, hx + u * 0.85, hy + u * 0.1); }
    }
    if (n.dilemma === 'eyes' && open) {
      const r = mulberry32(n.id + 5);
      for (let k = 0; k < 6; k++) {
        const ex = W * (0.1 + r() * 0.8), ey = gy + u * (r() * 4 - 1);
        if (Math.sin(time * 1.3 + k * 2) > -0.85) { glow(ex, ey, u * 1.2, '255,220,80', 0.45); ctx.fillStyle = '#ffe680'; dot(ex - u * 0.3, ey, u * 0.12); dot(ex + u * 0.3, ey, u * 0.12); }
      }
    }
    if (n.dilemma === 'rain' && open) {
      const r = mulberry32(99);
      ctx.strokeStyle = 'rgba(170,190,230,0.35)'; ctx.lineWidth = 1;
      for (let k = 0; k < 140; k++) { const rx = (r() * W + time * 60) % W, ry = (r() * H + time * 700 * (0.7 + r() * 0.3)) % H; line(rx, ry, rx - 3, ry + 14); }
    }
  }

  function render(g) { // g: a read-only snapshot of the game state for this frame, from main.js
    const { state, world, endKind, minutes, time, torchOn, hasTorch, fear, node, personHere } = g;
    const n = state === 'menu' || !world ? demoNode : (state === 'over' && endKind === 'home' ? { id: 999, scene: 'village' } : node());
    const dawnK = state === 'over' ? 1 : clamp((minutes - 450) / 60, 0, 1);
    drawSky(dawnK, time, minutes);
    drawScene(n, dawnK, time);
    if (state === 'play') { const p = personHere(n); if (p) drawPerson(n, p, time); else drawDilemma(n, time); }
    const ffScene = ['forest', 'fields', 'river', 'chautari'].includes(n.scene) && dawnK < 0.8;
    if (ffScene) {
      for (const f of fireflies) {
        const x = f.x + Math.sin(time * 0.5 * f.s + f.p) * 30, y = f.y + Math.cos(time * 0.7 * f.s + f.p) * 18;
        const a = Math.max(0, Math.sin(time * 2 * f.s + f.p));
        glow(x, y, 6, '210,255,120', 0.6 * a);
      }
    }
    ctx.fillStyle = `rgba(160,170,210,${0.05 * (1 - dawnK)})`;
    for (let k = 0; k < 2; k++) { const y = gy - u * (1 + k * 2), x = ((time * (8 + k * 6)) % (W * 2)) - W; ctx.fillRect(x, y, W * 1.4, u * 1.2); }
    ctx.fillStyle = `rgba(0,0,8,${0.22 * (1 - dawnK)})`; ctx.fillRect(0, 0, W, H);
    const lit = state === 'play' && torchOn;
    if (lit) { // torch beam from where you stand
      const top = gy - u * 4;
      ctx.save(); ctx.beginPath(); ctx.moveTo(W * 0.42, H); ctx.lineTo(W * 0.58, H); ctx.lineTo(W * 0.88, top); ctx.lineTo(W * 0.12, top); ctx.closePath(); ctx.clip();
      vGrad(beamCol, 0, top, W, H - top, H, top, [0, hasTorch ? 'rgba(255,225,160,0.3)' : 'rgba(235,245,255,0.28)', 1, 'rgba(255,240,210,0)']);
      ctx.restore();
    }
    const f = state === 'play' ? fear / 100 * (lit ? 0.7 : 1) : 0.1;
    const pulse = f > 0.6 ? Math.max(0, Math.sin(time * lerp(6, 11, (f - 0.6) / 0.4))) * 0.08 : 0;
    if (!vignette) {
      const c = (vignette = document.createElement('canvas')).getContext('2d');
      vignette.width = canvas.width; vignette.height = canvas.height; c.setTransform(DPR, 0, 0, DPR, 0, 0);
      const v = c.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.2, W / 2, H * 0.4, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = v; c.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = clamp(0.35 + 0.5 * f + pulse, 0, 0.95); ctx.drawImage(vignette, 0, 0, W, H); ctx.globalAlpha = 1;
  }

  BH.Art = { resize, render };
})();
