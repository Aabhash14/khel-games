// The game canvas, its 2D context, and drawing primitives (rounded rect, kite, string, lines, outlined text).
(() => {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { TAU, FONT } = CC.Util;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawKite(x, y, s, rot, pal, glow, alpha = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
    if (glow) { ctx.shadowColor = '#f5c518'; ctx.shadowBlur = 18; }
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.85, 0); ctx.lineTo(0, s * 1.05); ctx.lineTo(-s * 0.85, 0); ctx.closePath();
    ctx.fillStyle = pal[0]; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.save(); ctx.clip();
    ctx.fillStyle = pal[1]; ctx.fillRect(-s, -s, s * 2, s * 0.95);
    ctx.fillStyle = pal[2]; ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.28, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,25,15,0.85)'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 1.05); ctx.moveTo(-s * 0.85, 0); ctx.quadraticCurveTo(0, -s * 0.55, s * 0.85, 0); ctx.stroke();
    ctx.fillStyle = pal[1]; // small tail tassel
    ctx.beginPath(); ctx.moveTo(0, s * 1.0); ctx.lineTo(-s * 0.22, s * 1.42); ctx.lineTo(s * 0.22, s * 1.42); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function strokePts(pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }

  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

  function drawText(text, x, y, size, color, weight = 800) {
    ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.16); ctx.strokeStyle = 'rgba(30,15,10,0.75)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }

  CC.Draw = { canvas, ctx, rr, drawKite, strokePts, line, dot, drawText };
})();
