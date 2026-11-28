/* Himal Climb: the game canvas and small drawing helpers that need no game state. */
(() => {
  'use strict';
  const HC = (window.HC = window.HC || {});
  const { TAU } = HC;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const FONT = '"Nirmala UI", "Noto Sans Devanagari", "Kohinoor Devanagari", Mangal, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const FLAG = ['#1f6fd1', '#f4f4f4', '#e23b3b', '#2e9e5b', '#f5c518']; // prayer flag order

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function oval(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }

  function drawNepalFlag(x, y, s) { // pole base at (x, y), the double-pennant flag of Nepal
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(2, s * 0.06);
    line(x, y, x, y - s * 2.1);
    const fx = x + 1, fy = y - s * 2.1;
    const P = [[0, 0], [1.0, 0.82], [0.4, 0.82], [1.0, 1.72], [0, 1.72]];
    ctx.beginPath(); P.forEach(([px, py], k) => (k ? ctx.lineTo : ctx.moveTo).call(ctx, fx + px * s, fy + py * s)); ctx.closePath();
    ctx.fillStyle = '#dc143c'; ctx.fill();
    ctx.strokeStyle = '#003893'; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.lineJoin = 'miter'; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(fx + s * 0.3, fy + s * 0.5, s * 0.13, 0, Math.PI); ctx.fill(); // moon
    ctx.fillStyle = '#dc143c'; ctx.beginPath(); ctx.arc(fx + s * 0.3, fy + s * 0.46, s * 0.11, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#ffffff'; dot(fx + s * 0.3, fy + s * 1.3, s * 0.11); // sun
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, s * 0.04);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; line(fx + s * 0.3 + Math.cos(a) * s * 0.12, fy + s * 1.3 + Math.sin(a) * s * 0.12, fx + s * 0.3 + Math.cos(a) * s * 0.19, fy + s * 1.3 + Math.sin(a) * s * 0.19); }
  }

  function drawText(text, x, y, size, color, weight = 800) {
    ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.16); ctx.strokeStyle = 'rgba(20,15,30,0.75)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }

  Object.assign(HC, { canvas, ctx, FONT, FLAG, rr, line, dot, oval, drawText, drawNepalFlag });
})();
