// Tihar Diyo: 1080x1920 story image and share text. The house is drawn lit, but the window shows a glowing
// carved lattice instead of the solved grid, so posting today's result never spoils today's puzzle.
// The card carries a move map instead: ● a tile turned in the fewest moves, ○ one turned more than needed.
(function (root) {
  'use strict';
  var A = root.TDA, I = root.TDI;
  var W = 1080, H = 1920;
  // The page's own address when served over http(s); nothing when opened from a file.
  function url() {
    try { if (/^https?:$/.test(location.protocol)) return location.origin + location.pathname; } catch (e) { /* fine */ }
    return '';
  }
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(['120px "Yatra One"', '800 60px Mukta', '700 40px Mukta', '500 40px Mukta'].map(function (f) { return document.fonts.load(f, 'तिहार Diyo'); })).catch(function () {});
  }
  function starsText(n) { var s = ''; for (var k = 0; k < 3; k++) s += k < n ? '★' : '☆'; return s; }
  function mapRows(r) {
    var rows = [];
    for (var y = 0; y < r.h; y++) {
      var row = '';
      for (var x = 0; x < r.w; x++) { var c = r.map[y * r.w + x]; row += c === 'p' ? '●' : c === 'o' ? '○' : '·'; }
      rows.push(row);
    }
    return rows;
  }
  // r: { daily, n, levelLabel, night, moves, par, stars, hints, tries, streak, w, h, map, palKey, diyos }
  function text(r) {
    var extra = [];
    extra.push(r.tries <= 1 ? I.t('firstTry') : I.t('tries', { n: r.tries }));
    extra.push(r.hints ? (r.hints === 1 ? I.t('hint1') : I.t('hintsN', { n: r.hints })) : I.t('noHints'));
    if (r.streak > 1) extra.push(I.t('streak', { n: r.streak }));
    var head = r.daily
      ? I.t('shareDaily', { n: r.n, m: r.moves, p: r.par, stars: starsText(r.stars), extra: extra.join(' · ') })
      : I.t('shareLevel', { night: r.night, lv: r.levelLabel, m: r.moves, p: r.par, stars: starsText(r.stars) });
    var u = url();
    return head + '\n' + mapRows(r).join('\n') + (u ? '\n' + u : '');
  }

  function draw(r) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var ctx = c.getContext('2d'), pal = A.PAL[r.palKey] || A.PAL.laxmi, ne = I.getLang() === 'ne';
    ctx.fillStyle = pal.sky[0]; ctx.fillRect(0, 0, W, H);
    // the house scene in the middle band
    var top = 320, sceneH = 1010;
    var L = A.layout(W, sceneH, r.w, r.h, { maxTile: 150, scale: 2.2, skyShare: 0.3 });
    ctx.save(); ctx.translate(0, top);
    A.paintBackdrop(ctx, L, pal, 11 + (r.n || 0));
    lattice(ctx, L, pal);
    var spots = A.sillSpots(L, r.diyos || 6);
    ctx.globalCompositeOperation = 'lighter';
    spots.forEach(function (p) { A.glow(ctx, p[0], p[1] - p[2] * 0.3, p[2] * 1.9, 0.4); });
    ctx.globalCompositeOperation = 'source-over';
    spots.forEach(function (p, i) { A.diyo(ctx, p[0], p[1], p[2], 1, 0.4 + i, i * 2.3, 0.4); });
    A.garlands(ctx, L, pal, 0.3);
    // petals in the air
    var R = A.srand(99 + (r.n || 0));
    for (var k = 0; k < 70; k++) {
      ctx.save(); ctx.translate(R() * W, R() * sceneH * 0.9); ctx.rotate(R() * 6.3);
      ctx.fillStyle = R() < 0.6 ? pal.garland[0] : pal.garland[1];
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, 6.3); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = '#120b0d'; ctx.fillRect(0, top + sceneH, W, H - top - sceneH);
    // sky over the title blends into the scene
    var fade = ctx.createLinearGradient(0, top, 0, top + 120);
    fade.addColorStop(0, pal.sky[0]); fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, top, W, 120);

    // title
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(255,150,40,0.55)'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#ffd36b'; ctx.font = '150px "Yatra One", Mukta, sans-serif';
    ctx.fillText('तिहार दियो', W / 2, 190);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff3dc'; ctx.font = '64px "Yatra One", Mukta, sans-serif';
    ctx.fillText('TIHAR DIYO', W / 2, 272);

    // result card: carved wood with a brass edge
    var cx = 70, cy = 1352, cw = W - 140, ch = 412;
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
    ctx.fillStyle = '#2a150b'; A.rr(ctx, cx, cy, cw, ch, 34); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 6; A.rr(ctx, cx + 12, cy + 12, cw - 24, ch - 24, 26); ctx.stroke();
    // the text column stops short of the move map on the right
    var mapCell = Math.min(44, 300 / Math.max(r.w, r.h)), textW = cw - 56 - r.w * mapCell - 56 - 36;
    ctx.fillStyle = '#ffcf5a'; ctx.textAlign = 'left';
    var label = r.daily ? I.t('dailyLabel', { n: r.n }) : r.night + ' · ' + r.levelLabel;
    fitText(ctx, label, cx + 56, cy + 92, textW, 700, 46);
    ctx.fillStyle = '#fff3dc';
    fitText(ctx, I.t('resMoves', { m: r.moves, p: r.par }).split(' · ')[0], cx + 56, cy + 200, textW, 800, 92);
    ctx.fillStyle = '#f2c98a'; ctx.font = '500 44px Mukta, sans-serif';
    ctx.fillText(I.t('par') + ' ' + I.num(r.par), cx + 56, cy + 258);
    // stars as three lamps
    for (var s = 0; s < 3; s++) {
      var lx = cx + 80 + s * 96, ly = cy + 318;
      if (s < r.stars) { ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, lx, ly - 20, 70, 0.45); ctx.globalCompositeOperation = 'source-over'; }
      A.diyo(ctx, lx, ly, 70, s < r.stars ? 1 : 0, 1 + s, s * 3, 0.2);
    }
    var bits = [];
    bits.push(r.tries <= 1 ? I.t('firstTry') : I.t('tries', { n: r.tries }));
    bits.push(r.hints ? (r.hints === 1 ? I.t('hint1') : I.t('hintsN', { n: r.hints })) : I.t('noHints'));
    if (r.streak > 1) bits.push(I.t('streak', { n: r.streak }));
    ctx.fillStyle = '#f2c98a';
    fitText(ctx, bits.join(' · '), cx + 56, cy + 376, textW, 500, 34);
    // move map on the right
    var rows = r.h, cols = r.w, cell = mapCell, mx = cx + cw - 56 - cols * cell, my = cy + 70;
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var m = r.map[y * cols + x], px = mx + x * cell + cell / 2, py = my + y * cell + cell / 2;
      if (m === ' ') continue;
      ctx.beginPath(); ctx.arc(px, py, cell * 0.32, 0, 6.3);
      if (m === 'p') { ctx.fillStyle = '#ffb02e'; ctx.fill(); }
      else if (m === 'o') { ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 4; ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(255,243,220,0.25)'; ctx.beginPath(); ctx.arc(px, py, cell * 0.12, 0, 6.3); ctx.fill(); }
    }
    // footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3dc'; ctx.font = (ne ? '700 44px Mukta' : '700 44px Mukta') + ', sans-serif';
    ctx.fillText(I.t('storyCta'), W / 2, 1830);
    ctx.fillStyle = 'rgba(255,243,220,0.6)'; ctx.font = '500 30px Mukta, sans-serif';
    var u = url().replace(/^https?:\/\//, '').replace(/\/$/, '');
    ctx.fillText(u ? 'Khel · ' + u : 'Khel · खेल', W / 2, 1882);
    return c;
  }

  // draw one line, shrinking the font until it fits maxW
  function fitText(ctx, s, x, y, maxW, weight, size) {
    var px = size;
    do { ctx.font = weight + ' ' + px + 'px Mukta, sans-serif'; px -= 2; } while (px > size * 0.55 && ctx.measureText(s).width > maxW);
    ctx.fillText(s, x, y);
  }

  // the window as a glowing tikijhya lattice
  function lattice(ctx, L, pal) {
    var g = ctx.createRadialGradient(L.W / 2, L.gy + L.gh / 2, 10, L.W / 2, L.gy + L.gh / 2, Math.max(L.gw, L.gh) * 0.75);
    g.addColorStop(0, '#fff1b8'); g.addColorStop(0.45, '#ffb238'); g.addColorStop(1, '#a8420e');
    ctx.fillStyle = g; ctx.fillRect(L.gx, L.gy, L.gw, L.gh);
    ctx.save(); ctx.beginPath(); ctx.rect(L.gx, L.gy, L.gw, L.gh); ctx.clip();
    ctx.strokeStyle = pal.wood; ctx.lineWidth = Math.max(6, L.s * 0.12);
    var step = Math.max(28, L.s * 0.6);
    for (var k = -L.gh; k < L.gw + L.gh; k += step) {
      ctx.beginPath(); ctx.moveTo(L.gx + k, L.gy); ctx.lineTo(L.gx + k + L.gh, L.gy + L.gh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L.gx + k, L.gy + L.gh); ctx.lineTo(L.gx + k + L.gh, L.gy); ctx.stroke();
    }
    ctx.fillStyle = pal.woodHi;
    for (var x = L.gx; x <= L.gx + L.gw + step; x += step) for (var y = L.gy; y <= L.gy + L.gh + step; y += step) {
      ctx.beginPath(); ctx.arc(x, y, ctx.lineWidth * 0.55, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }

  function toBlob(c) { return new Promise(function (res) { c.toBlob(res, 'image/png'); }); }
  function copyText(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(function () { return true; }, function () { return fallbackCopy(s); });
    return Promise.resolve(fallbackCopy(s));
  }
  function fallbackCopy(s) {
    try {
      var ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
    } catch (e) { return false; }
  }
  // returns 'shared' | 'saved' | 'cancel'
  function share(r) {
    return fontsReady().then(function () {
      var c = draw(r), txt = text(r);
      return toBlob(c).then(function (blob) {
        if (!blob) return 'cancel';
        var name = r.daily ? 'tihar-diyo-' + r.n + '.png' : 'tihar-diyo.png';
        var file = null;
        try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          return navigator.share({ files: [file], text: txt, title: I.t('shareTitle') }).then(function () { return 'shared'; }, function (e) {
            return e && e.name === 'AbortError' ? 'cancel' : download(blob, name, txt);
          });
        }
        return download(blob, name, txt);
      });
    });
  }
  function download(blob, name, txt) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    copyText(txt);
    return 'saved';
  }

  root.TDShare = { draw: draw, text: text, share: share, copyText: copyText, fontsReady: fontsReady, url: url };
})(this);
