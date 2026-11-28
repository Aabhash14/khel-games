/* Pro Scout — face geometry, face windows and sticker cover (canvas), and framed portrait photos. */
(() => {
  'use strict';

  window.PS = window.PS || {};
  const { BY, esc, reduceMotion, initials } = PS.Core;
  const { FACES, loadImage } = PS.Photos;

  // ---------- Face geometry: where to cut the eyes / hair / smile windows ----------
  const geoCache = {};
  function GEO(id) {
    if (id in geoCache) return geoCache[id];
    const F = FACES[id];
    if (!F || !F.e) return (geoCache[id] = null);
    const W = F.W, H = F.H, e = F.e.map((v, i) => v * (i % 2 ? H : W));
    const [rx, ry, lx, ly, , , mrx, mry, mlx, mly] = e;
    const d = Math.hypot(lx - rx, ly - ry);
    const cx = (rx + lx) / 2, ey = (ry + ly) / 2, mx = (mrx + mlx) / 2, my = (mry + mly) / 2;
    const clip = (x, y, w, h) => { const x0 = Math.max(0, x), y0 = Math.max(0, y); return { x: x0, y: y0, w: Math.min(W, x + w) - x0, h: Math.min(H, y + h) - y0 }; };
    const parts = { eyes: clip(cx - 1.25 * d, ey - 0.6 * d, 2.5 * d, 1.0 * d), mouth: clip(mx - 1.0 * d, my - 0.5 * d, 2.0 * d, 1.0 * d) };
    const hair = clip(cx - 1.5 * d, ey - 2.45 * d, 3.0 * d, 1.8 * d);
    if (hair.h > 0.75 * d) parts.hair = hair;
    // 4:5 viewport around the head, kept inside the photo.
    let vw = 3.3 * d, vh = vw * 1.25;
    if (vw > W) { vw = W; vh = vw * 1.25; }
    if (vh > H) { vh = H; vw = vh * 0.8; }
    const vx = Math.min(Math.max(0, cx - vw / 2), W - vw), vy = Math.min(Math.max(0, ey - vh * 0.46), H - vh);
    return (geoCache[id] = { W, H, d, cx, ey, my, parts, view: { x: vx, y: vy, w: vw, h: vh } });
  }
  const PART_NAME = { eyes: 'Eyes', hair: 'Hair', mouth: 'Smile' };

  function sizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    return { ctx: canvas.getContext('2d'), W, H, dpr };
  }
  function rrPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // Peephole card: a dark card with only some windows of the face showing.
  // show = array of part names, or 'all'. Parts in show but not in prev fade in with alpha a.
  function drawPeep(canvas, img, g, show, prev, a = 1) {
    const c = sizeCanvas(canvas);
    if (!c) return;
    const { ctx, W, H, dpr } = c;
    const k = img.naturalWidth / g.W, V = g.view;
    const view = () => ctx.drawImage(img, V.x * k, V.y * k, V.w * k, V.h * k, 0, 0, W, H);
    const toC = (r) => ({ x: (r.x - V.x) / V.w * W, y: (r.y - V.y) / V.h * H, w: r.w / V.w * W, h: r.h / V.h * H });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#26231d';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(243,236,219,.08)';
    const step = 14 * dpr;
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) ctx.fillRect(x, y, 2 * dpr, 2 * dpr);
    const prevList = prev === 'all' ? [] : prev || [];
    const list = show === 'all' ? prevList : show;
    for (const name of list) {
      const r = toC(g.parts[name]);
      const alpha = show !== 'all' && !prevList.includes(name) ? a : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      rrPath(ctx, r.x, r.y, r.w, r.h, 10 * dpr);
      ctx.save(); ctx.clip(); view(); ctx.restore();
      ctx.lineWidth = 3 * dpr; ctx.strokeStyle = '#f3ecdb'; ctx.stroke();
      const label = PART_NAME[name].toUpperCase();
      ctx.font = `800 ${11 * dpr}px Archivo, system-ui, sans-serif`;
      const tw = ctx.measureText(label).width + 12 * dpr, th = 18 * dpr;
      const ly = r.y + r.h + 6 * dpr + th < H ? r.y + r.h + 6 * dpr : r.y - th - 6 * dpr;
      ctx.fillStyle = '#f3ecdb'; rrPath(ctx, r.x, ly, tw, th, 5 * dpr); ctx.fill();
      ctx.fillStyle = '#1c1a16'; ctx.textBaseline = 'middle'; ctx.fillText(label, r.x + 6 * dpr, ly + th / 2 + dpr);
      ctx.restore();
    }
    if (show === 'all') { ctx.globalAlpha = a; view(); ctx.globalAlpha = 1; }
  }
  // Whole photo with a "?" sticker over the head (cover = 0..1 sticker opacity).
  function drawCover(canvas, img, g, cover) {
    const c = sizeCanvas(canvas);
    if (!c) return;
    const { ctx, W, H, dpr } = c;
    const iw = img.naturalWidth, ih = img.naturalHeight, ar = W / H, k = iw / g.W;
    let sw, sh, sx, sy;
    if (iw / ih > ar) { sh = ih; sw = sh * ar; sx = Math.min(Math.max(0, g.cx * k - sw / 2), iw - sw); sy = 0; } else { sw = iw; sh = sw / ar; sx = 0; sy = Math.min(Math.max(0, g.ey * k - sh * 0.3), ih - sh); }
    ctx.globalAlpha = 1;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    if (cover <= 0) return;
    const X = (g.cx * k - sx) / sw * W, Y = ((g.ey + 0.2 * g.d) * k - sy) / sh * H, R = 1.7 * g.d * k / sw * W;
    ctx.globalAlpha = cover;
    ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2);
    ctx.fillStyle = '#e9a91f'; ctx.fill();
    ctx.lineWidth = 4 * dpr; ctx.strokeStyle = '#1c1a16'; ctx.stroke();
    ctx.fillStyle = '#1c1a16'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(R * 1.1)}px Archivo, system-ui, sans-serif`;
    ctx.fillText('?', X, Y + R * 0.05);
    ctx.globalAlpha = 1; ctx.textAlign = 'start';
  }
  // Runs draw(t) for t from 0 to 1 (or once at 1 with reduced motion).
  function tween(canvas, draw, dur = 380) {
    if (reduceMotion) { draw(1); return; }
    const t0 = performance.now();
    const step = (now) => {
      if (!canvas.isConnected) return;
      const k = Math.min(1, (now - t0) / dur);
      draw(1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  // A framed <img> (or initials while it loads / if it fails).
  function photoFrame(id, cls = '') {
    const el = document.createElement('div');
    el.className = 'photo-frame ' + cls;
    el.innerHTML = `<span class="ph-fallback">${esc(initials(BY[id].n))}</span>`;
    loadImage(id).then((img) => {
      if (!img) return;
      const im = document.createElement('img');
      im.src = img.src; im.alt = ''; im.loading = 'lazy';
      const g = img.pinned && GEO(id);
      if (g) {
        // Head-and-shoulders crop: keeps the face big and shirt numbers / team names mostly out of view.
        let vw = Math.min(g.W, g.view.w * 1.2), vh = vw * 1.25;
        if (vh > g.H) { vh = g.H; vw = vh * 0.8; }
        const x = Math.min(Math.max(0, g.view.x + g.view.w / 2 - vw / 2), g.W - vw);
        const y = Math.min(Math.max(0, g.view.y + g.view.h / 2 - vh / 2), g.H - vh);
        im.style.cssText = `position:absolute;max-width:none;height:auto;width:${(g.W / vw * 100).toFixed(2)}%;left:${(-x / vw * 100).toFixed(2)}%;top:${(-y / vh * 100).toFixed(2)}%`;
      } else {
        im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%';
      }
      el.appendChild(im);
    });
    return el;
  }

  PS.Draw = { GEO, PART_NAME, drawPeep, drawCover, tween, photoFrame };
})();
