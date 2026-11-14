// Story-sized share image (1080×1920): your franchise, grade, best XI with prices, best steal and biggest buy.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const W = 1080;
  const H = 1920;

  function fit(ctx, text, max, font, start) {
    let size = start;
    ctx.font = font(size);
    while (ctx.measureText(text).width > max && size > 20) { size -= 2; ctx.font = font(size); }
    return size;
  }

  async function shareImage(d) {
    try { await Promise.all([document.fonts.load('80px Anton'), document.fonts.load('800 40px Mukta'), document.fonts.load('500 40px Mukta')]); } catch { /* fallback fonts */ }
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const anton = (s) => `${s}px Anton, Impact, sans-serif`;
    const mukta = (s, w = 800) => `${w} ${s}px Mukta, system-ui, sans-serif`;
    const T = d.team;
    const accent = T.id === 'GT' ? T.c2 : T.c1;

    // stage
    x.fillStyle = '#0b0e1c'; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W / 2, -100, 50, W / 2, -100, 1300);
    g.addColorStop(0, 'rgba(242,193,78,0.35)'); g.addColorStop(1, 'rgba(242,193,78,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    // team band
    x.fillStyle = T.c1; x.fillRect(0, 0, W, 470);
    x.fillStyle = T.c2; x.fillRect(0, 456, W, 14);
    x.fillStyle = T.ink;
    x.globalAlpha = 0.14; x.font = anton(420); x.textAlign = 'right'; x.fillText(T.id, W + 20, 440); x.globalAlpha = 1;
    x.textAlign = 'left';
    x.font = mukta(34); x.fillText(d.L.title.toUpperCase(), 70, 110);
    fit(x, T.name.toUpperCase(), W - 140, anton, 104); x.fillText(T.name.toUpperCase(), 70, 240);
    x.font = mukta(40, 500); x.fillText(d.verdict, 70, 320);
    if (d.champion) { x.globalAlpha = 0.8; x.font = mukta(30, 500); x.fillText(`${d.L.season} · 🏆 ${d.champion}`, 70, 380); x.globalAlpha = 1; }
    if (d.caps) {
      x.globalAlpha = 0.85; x.font = mukta(26, 500);
      fit(x, `${d.L.orange}: ${d.caps.orange} · ${d.L.purple}: ${d.caps.purple}`, W - 140, (sz) => mukta(sz, 500), 26);
      x.fillText(`${d.L.orange}: ${d.caps.orange} · ${d.L.purple}: ${d.caps.purple}`, 70, 428); x.globalAlpha = 1;
    }

    // grade badge
    x.fillStyle = '#f2c14e';
    x.beginPath(); x.roundRect(W - 270, 520, 200, 200, 36); x.fill();
    x.fillStyle = '#241a06'; x.textAlign = 'center';
    x.font = anton(120); x.fillText(d.grade, W - 170, 670);
    x.font = mukta(26); x.fillStyle = '#f4efe4'; x.fillText(d.L.grade, W - 170, 760);
    x.textAlign = 'left';

    // spent
    x.fillStyle = '#a3a8c0'; x.font = mukta(30); x.fillText(d.L.spent.toUpperCase(), 70, 560);
    x.fillStyle = '#f2c14e'; x.font = anton(92); x.fillText(d.spent, 70, 660);

    // XI
    x.fillStyle = '#a3a8c0'; x.font = mukta(30); x.fillText(d.L.xi.toUpperCase(), 70, 830);
    let y = 900;
    d.xi.forEach((p, i) => {
      x.fillStyle = 'rgba(244,239,228,0.08)';
      if (i % 2 === 0) x.fillRect(50, y - 50, W - 100, 70);
      x.fillStyle = '#a3a8c0'; x.font = anton(40); x.fillText(String(i + 1).padStart(2, ' '), 70, y);
      x.fillStyle = '#f4efe4';
      const name = p.name + (p.os ? ' ✈' : '');
      fit(x, name, 560, (s) => mukta(s), 42); x.fillText(name, 150, y);
      x.textAlign = 'right';
      x.fillStyle = p.how === 'ret' ? '#a3a8c0' : '#f2c14e'; x.font = mukta(40);
      x.fillText(p.price, W - 70, y);
      x.textAlign = 'left';
      y += 70;
    });

    // highlights
    const box = (bx, label, item) => {
      if (!item) return;
      x.fillStyle = '#141a30'; x.beginPath(); x.roundRect(bx, 1700 - 30, 450, 150, 22); x.fill();
      x.strokeStyle = accent; x.lineWidth = 4; x.stroke();
      x.fillStyle = '#a3a8c0'; x.font = mukta(26); x.fillText(label.toUpperCase(), bx + 28, 1716);
      x.fillStyle = '#f4efe4'; fit(x, item.name, 400, anton, 46); x.fillText(item.name, bx + 28, 1772);
      x.fillStyle = '#f2c14e'; x.font = mukta(32); x.fillText(item.price, bx + 28, 1812);
    };
    box(70, d.L.steal, d.steal);
    box(W - 520, d.L.dear, d.dear);

    x.fillStyle = '#a3a8c0'; x.font = mukta(28, 500); x.textAlign = 'center';
    x.fillText(`Khel · IPL Auction · ${location.host}${location.pathname.replace(/index\.html$/, '')}`, W / 2, 1880);

    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const file = new File([blob], `ipl-auction-${T.id.toLowerCase()}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: d.L.title }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return 'saved';
  }
  IPLA.share = { shareImage };
})();
