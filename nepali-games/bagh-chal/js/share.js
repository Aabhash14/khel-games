// 1080x1920 story image: the final board on lacquered wood, the result in brass, and a challenge.
(function (root) {
  'use strict';
  var A = root.BCArt, I = root.BCI18N;
  var W = 1080, H = 1920;

  function fontsReady() {
    try {
      return Promise.all(["120px 'Yatra One'", '700 50px Hind', '600 40px Hind'].map(function (f) { return document.fonts.load(f, 'बाघ Aa १'); })).catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }
  function fit(ctx, text, max, size, font) {
    var s = size;
    do { ctx.font = font.replace('{s}', s); s -= 4; } while (ctx.measureText(text).width > max && s > 18);
  }

  // d: { state, head, line, side, tag, cta, url }
  function draw(d) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#1b0c06'; x.fillRect(0, 0, W, H);
    A.grain(x, 0, 0, W, H, 99, 2.6);
    A.lamp(x, 0, 0, W, H, 1.2);

    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    // title in brass
    var brass = A.brassGrad(x, 300, 90, 780, 330);
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 18; x.shadowOffsetY = 8;
    x.fillStyle = brass; x.font = "150px 'Yatra One'";
    x.fillText('Bagh Chal', W / 2, 230);
    x.font = "92px 'Yatra One'";
    x.fillText('बाघ चाल', W / 2, 350);
    x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;

    // tag pill
    x.font = '700 40px Hind';
    var tw = x.measureText(d.tag).width + 70;
    A.rr(x, W / 2 - tw / 2, 392, tw, 66, 33); x.fillStyle = '#b3261e'; x.fill();
    x.strokeStyle = 'rgba(255,220,150,0.6)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#fff1d6'; x.fillText(d.tag, W / 2, 438);

    // captured tray above the board
    var cap = Math.min(5, d.state.cap || 0);
    A.panel(x, 250, 492, 580, 104, 40, 31, 2.2);
    for (var k = 0; k < 5; k++) {
      var sx = 250 + 58 + k * 116, sy = 544;
      A.socket(x, sx, sy, 38, 2);
      if (k < cap) { x.save(); x.translate(sx, sy); x.rotate(k % 2 ? -0.3 : 0.25); A.goat(x, 0, 0, 34); x.restore(); }
    }
    // the board
    var G = A.geom(90, 620, 900);
    root.BCView.drawPosition(x, G, d.state);

    // result
    x.fillStyle = '#fbe3a0';
    x.shadowColor = 'rgba(0,0,0,0.7)'; x.shadowBlur = 14; x.shadowOffsetY = 5;
    fit(x, d.head, W - 140, 96, "{s}px 'Yatra One'");
    x.fillText(d.head, W / 2, 1640);
    x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
    x.fillStyle = '#f3e2c0';
    fit(x, d.line, W - 140, 48, '600 {s}px Hind');
    x.fillText(d.line, W / 2, 1712);
    x.fillStyle = '#c9a77a';
    fit(x, d.side, W - 160, 38, '600 {s}px Hind');
    x.fillText(d.side, W / 2, 1766);

    // footer: brass plate with the challenge
    var pw = 780, px = (W - pw) / 2, py = 1784;
    A.rr(x, px, py, pw, 84, 42); x.fillStyle = A.brassGrad(x, px, py, px + pw, py + 84); x.fill();
    x.fillStyle = '#2a1405';
    fit(x, d.cta, pw - 80, 44, '700 {s}px Hind');
    x.fillText(d.cta, W / 2, py + 56);
    x.fillStyle = 'rgba(243,226,192,0.65)'; x.font = '600 26px Hind';
    x.fillText(d.url, W / 2, 1900);
    return c;
  }

  function story(d) {
    return fontsReady().then(function () { return draw(d); });
  }

  function share(d) {
    return story(d).then(function (canvas) {
      return new Promise(function (res) { canvas.toBlob(res, 'image/png'); });
    }).then(function (blob) {
      if (!blob) return null;
      var file = null;
      try { file = new File([blob], d.file, { type: 'image/png' }); } catch (e) { /* old Safari */ }
      var tryShare = (file && navigator.canShare && navigator.canShare({ files: [file] }))
        ? navigator.share({ files: [file], text: d.text }).then(function () { return null; })
        : Promise.reject(new Error('no share'));
      return tryShare.catch(function (e) {
        if (e && e.name === 'AbortError') return null;
        var copied = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(d.text).then(function () { return true; }, function () { return false; }) : Promise.resolve(false);
        return copied.then(function (ok) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = d.file;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          return ok ? I.t('saved') + ' · ' + I.t('copied') : I.t('saved');
        });
      });
    });
  }

  root.BCShare = { story: story, share: share, draw: draw };
})(this);
