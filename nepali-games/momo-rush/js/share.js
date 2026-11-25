// 1080x1920 story image: the stall at dusk with happy customers, a steaming stack, and the week's hisab
// written on a receipt from the cash box.
(function () {
  const MR = (window.MR = window.MR || {});
  const W = 1080; const H = 1920;

  async function fontsReady() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all(['64px Pacifico', '64px "Yatra One"', '64px Anton', '800 60px Mukta', '500 40px Mukta']
        .map((f) => document.fonts.load(f, 'मःम Momo 0')));
    } catch (e) { /* draw anyway */ }
  }
  function fit(ctx, text, max, size, font) {
    let s = size;
    do { ctx.font = font.replace('{s}', s); s -= 3; } while (ctx.measureText(text).width > max && s > 18);
  }

  MR.drawStory = async function (d) {
    await fontsReady();
    const A = MR.art; const R = MR.Rules;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const L = A.layout(W, H, 3, { fills: ['buff', 'chicken', 'veg'], jhol: true });
    // scene
    const sky = A.makeSky(L);
    ctx.drawImage(sky, 0, 0, sky.width / Math.min(1, L.s), sky.height / Math.min(1, L.s));
    ctx.save(); ctx.scale(L.s, L.s); A.nightSky(ctx, L, 0.4, true); ctx.restore();
    ctx.drawImage(A.makeBack(L, 1), 0, 0);
    ctx.save(); ctx.scale(L.s, L.s);
    A.nightCity(ctx, L, 0.55, 1.3, true);
    A.traffic(ctx, L, 9.5);
    A.reflections(ctx, L, 1.3);
    const happy = [{ seed: 11 }, { seed: 4242 }, { seed: 777 }];
    happy.forEach((h, i) => A.customer(ctx, L.slots[i].x, L.cTop, A.look(h.seed), 'happy', 0.4 + i, 'yum'));
    A.bulbs(ctx, L, 0.7, true);
    ctx.restore();
    ctx.drawImage(A.makeFront(L, 1), 0, 0);
    ctx.save(); ctx.scale(L.s, L.s);
    happy.forEach((h, i) => A.hands(ctx, L.slots[i].x, L.cTop, A.look(h.seed), 'happy', 0));
    A.acharBowl(ctx, L.achar, 0);
    const looks = ['perfect', 'perfect', 'ok', 'perfect'];
    L.pass.forEach((p, i) => A.plate(ctx, p.x, p.y, p.r, { fill: R.FILLS[i % 3], q: looks[i], achar: i !== 2, jhol: i === 2 }, 0.2));
    A.jholPot(ctx, L.jhol, 0);
    A.steamer(ctx, L, [{ fill: 'buff', t: 7.2 }, { fill: 'veg', t: 5.2 }, { fill: 'chicken', t: 2 }], 0.3, R.COOK);
    // steam plume
    const l = L.lid;
    for (let k = 0; k < 14; k++) {
      const y = l.y - 10 - k * 9; const x = l.x + l.w / 2 + Math.sin(k * 0.9) * (6 + k * 1.6);
      ctx.fillStyle = `rgba(255,255,255,${0.32 - k * 0.02})`;
      ctx.beginPath(); ctx.arc(x, y, 8 + k * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    A.sign(ctx, 200, 70, 150, -0.03);
    ctx.restore();

    // title over the dusk sky
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = '#ffb04a'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#ffe2a0'; ctx.font = '150px Pacifico, cursive';
    ctx.fillText('Momo Rush', W / 2, 470);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

    // receipt
    const calls = d.calls || [];
    const rx = 70; const ry = 1130; const rw = 640; const rh = 584 + calls.length * 40;
    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2); ctx.rotate(-0.025); ctx.translate(-(rx + rw / 2), -(ry + rh / 2));
    ctx.shadowColor = '#000a'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath(); ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rw, ry);
    for (let x = rx + rw; x >= rx; x -= 32) { ctx.lineTo(x, ry + rh); ctx.lineTo(x - 16, ry + rh - 18); }
    ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#c8261b'; ctx.fillRect(rx, ry, rw, 16);
    ctx.fillStyle = '#5a4a3a'; ctx.textAlign = 'center';
    fit(ctx, d.mode, rw - 80, 38, '500 {s}px Mukta, sans-serif');
    ctx.fillText(d.mode, rx + rw / 2, ry + 76);
    ctx.fillStyle = '#1b1430';
    fit(ctx, d.title, rw - 70, 66, '800 {s}px Mukta, sans-serif');
    ctx.fillText(d.title, rx + rw / 2, ry + 160);
    ctx.strokeStyle = '#1b143040'; ctx.setLineDash([10, 8]); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(rx + 40, ry + 196); ctx.lineTo(rx + rw - 40, ry + 196); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = d.profit >= 0 ? '#1f7a3a' : '#c62828';
    const big = (d.profit >= 0 ? '+' : '−') + MR.rs() + ' ' + d.money;
    // Anton has no Devanagari: in Nepali the big figure uses heavy Mukta instead of a thin fallback
    fit(ctx, big, rw - 70, 150, /[ऀ-ॿ]/.test(big) ? '800 {s}px Mukta, sans-serif' : '{s}px Anton, sans-serif');
    ctx.fillText(big, rx + rw / 2, ry + 350);
    ctx.fillStyle = '#5a4a3a';
    fit(ctx, d.sub, rw - 70, 40, '500 {s}px Mukta, sans-serif');
    ctx.fillText(d.sub, rx + rw / 2, ry + 410);
    for (let k = 0; k < 5; k++) {
      const x = rx + rw / 2 + (k - 2) * 78; const y = ry + 478; const full = d.stars >= k + 1; const half = !full && d.stars >= k + 0.5;
      ctx.beginPath();
      for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5; const r = j % 2 ? 14 : 32; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.closePath();
      ctx.fillStyle = full ? '#f2b51d' : half ? '#f6d58a' : '#e2d8c6'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = full || half ? '#9a6a00' : '#c9bca5'; ctx.stroke();
    }
    ctx.fillStyle = '#7a6a5a';
    fit(ctx, d.stats, rw - 70, 34, '500 {s}px Mukta, sans-serif');
    ctx.fillText(d.stats, rx + rw / 2, ry + 552);
    calls.forEach((line, i) => {
      ctx.fillStyle = '#3a2a4a';
      fit(ctx, line, rw - 80, 32, '800 {s}px Mukta, sans-serif');
      ctx.fillText(line, rx + rw / 2, ry + 600 + i * 40);
    });
    ctx.restore();

    // footer
    ctx.fillStyle = '#f07a1a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(170, 1812, 740, 80, 40) : ctx.rect(170, 1812, 740, 80); ctx.fill();
    ctx.fillStyle = '#1b1430'; ctx.textAlign = 'center';
    fit(ctx, d.cta, 680, 44, '800 {s}px Mukta, sans-serif');
    ctx.fillText(d.cta, W / 2, 1866);
    return c;
  };

  MR.shareStory = async function (d) {
    const canvas = await MR.drawStory(d);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return null;
    const file = new File([blob], d.file, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: d.text });
        return null;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return null;
    }
    let copied = false;
    try { await navigator.clipboard.writeText(d.text); copied = true; } catch (e) { /* no clipboard */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return copied ? MR.t('saved') + ' · ' + MR.t('copied') : MR.t('saved');
  };
})();
