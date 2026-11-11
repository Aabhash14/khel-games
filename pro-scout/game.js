/* Pro Scout — guess the athlete. No dependencies, no build step. */
(() => {
  'use strict';

  const { SPORTS, COUNTRIES, CONTINENTS, PLAYERS } = window.PS_DATA;
  const BY = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-US');
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- Storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  // ---------- Seeded randomness (same seed = same questions for everyone) ----------
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const shuffle = (rng, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (rng, arr) => arr[(rng() * arr.length) | 0];

  // ---------- Data helpers ----------
  const sex = (p) => p.g || 'm';
  const cName = (c) => COUNTRIES[c][0];
  const flag = (c, cls = '') => `<img class="flag ${cls}" src="https://flagcdn.com/w80/${COUNTRIES[c][2]}.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;
  const sportTag = (s) => `<span class="sport-tag" style="--sc:${SPORTS[s].color}">${esc(SPORTS[s].name)}</span>`;
  const clubsOf = (p) => new Set([...(p.path || []), ...(p.first ? [p.first] : []), ...(p.also || [])]);
  const UK = new Set(['ENG', 'WLS', 'GB']);
  const sameNation = (a, b) => a === b || (UK.has(a) && UK.has(b));
  const POS = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
  const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');

  // Extra real teams used only as wrong answers, so small sports still get 4 options.
  const EXTRA_TEAMS = {
    football: ['Benfica', 'Porto', 'Valencia', 'Lazio', 'Aston Villa', 'Olympique Lyonnais', 'Feyenoord', 'Boca Juniors', 'River Plate', 'Everton', 'Sporting CP', 'Anderlecht', 'Lille'],
    basketball: ['Boston Celtics', 'Chicago Bulls', 'New York Knicks', 'Toronto Raptors', 'Utah Jazz', 'Detroit Pistons', 'Sacramento Kings', 'Atlanta Hawks', 'Panathinaikos', 'Olympiacos'],
    f1: ['Williams', 'Haas', 'Force India', 'Jaguar', 'Brabham', 'Tyrrell', 'Arrows', 'Benetton', 'Renault'],
    nfl: ['Dallas Cowboys', 'Green Bay Packers', 'Pittsburgh Steelers', 'San Francisco 49ers', 'Denver Broncos', 'Buffalo Bills'],
    hockey: ['Montreal Canadiens', 'Toronto Maple Leafs', 'Detroit Red Wings', 'Chicago Blackhawks', 'SKA Saint Petersburg', 'CSKA Moscow'],
    baseball: ['Chicago Cubs', 'San Francisco Giants', 'St. Louis Cardinals', 'Yomiuri Giants', 'Seattle Mariners', 'Hanshin Tigers'],
  };
  const teamsBySport = {};
  for (const p of PLAYERS) for (const c of clubsOf(p)) (teamsBySport[p.s] ||= new Set()).add(c);
  for (const [s, list] of Object.entries(EXTRA_TEAMS)) for (const c of list) (teamsBySport[s] ||= new Set()).add(c);

  // ---------- Icons ----------
  const ICON = {
    face: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><rect x="6.5" y="8" width="11" height="4" rx="1.2"/><path d="M8.5 10h1M14.5 10h1"/>',
    footy: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4z"/><path d="M12 3.5v4M16 10.4l4.2-1.4M14.5 15l2.6 3.6M9.5 15l-2.6 3.6M8 10.4L3.8 9"/>',
    sport: '<circle cx="10" cy="9" r="5.5"/><path d="M14 13l6 6.5"/><circle cx="18.5" cy="5.5" r="2"/>',
    country: '<path d="M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12"/>',
    first: '<path d="M8.5 3.5L3.5 6.5l2 4 2.5-1V20.5h8V9.5l2.5 1 2-4-5-3c-.5 1.7-2 2.7-3.5 2.7s-3-1-3.5-2.7z"/>',
    path: '<circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="5.5" r="2"/><path d="M7.5 18.5h6a3 3 0 0 0 0-6h-3a3 3 0 0 1 0-6h6"/>',
    nick: '<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M9 9.5v2M15 9.5v2"/>',
    older: '<path d="M6.5 3.5h11M6.5 20.5h11M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5"/>',
    year: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M8 17h2"/>',
    odd: '<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    club: '<path d="M12 3l8 3v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    number: '<path d="M9.5 3.5L7.5 20.5M16.5 3.5l-2 17M4.5 9h16M3.5 15h16"/>',
    position: '<rect x="3" y="4.5" width="18" height="15" rx="1.5"/><path d="M12 4.5v15"/><circle cx="12" cy="12" r="2.8"/><path d="M3 9.5h2.5v5H3M21 9.5h-2.5v5H21"/>',
    who: '<circle cx="12" cy="8" r="4.5"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5"/><path d="M10.6 6.6a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.8.6-.8 1.1M12 11.2v.1"/>',
    mix: '<path d="M3 7h3.5l9 10H21M3 17h3.5l2.8-3.1M14.7 10.1L17.5 7H21M18.5 4L21 7l-2.5 3M18.5 14l2.5 3-2.5 3"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

  // ---------- Photos (Wikipedia page images, loaded live) ----------
  const PHOTO_KEY = 'ps-photos-v1';
  const photoMeta = store.get(PHOTO_KEY, {});
  const imgPromises = new Map();
  const failedPhotos = new Set();
  const queue = []; let active = 0;
  function enqueue(job) {
    return new Promise((resolve) => { queue.push({ job, resolve }); pump(); });
  }
  function pump() {
    while (active < 3 && queue.length) {
      const { job, resolve } = queue.shift();
      active++;
      job().then(resolve, () => resolve(null)).finally(() => { active--; pump(); });
    }
  }
  // Pinned photos (faces.js): one fixed image per player, plus where its eyes and mouth are.
  // If a pinned image ever disappears, we fall back to the live Wikipedia page image.
  const FACES = window.PS_FACES || {};
  const pinFailed = new Set();
  function commonsPage(u) {
    const parts = u.split('?')[0].split('/');
    const file = u.includes('/thumb/') ? parts[parts.length - 2] : parts[parts.length - 1];
    return (u.includes('/wikipedia/commons/') ? 'https://commons.wikimedia.org/wiki/File:' : 'https://en.wikipedia.org/wiki/File:') + file;
  }
  async function apiInfo(id) {
    const m = photoMeta[id];
    if (m && Date.now() - m.t < 30 * 864e5) return m;
    const p = BY[id];
    return enqueue(async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(p.w));
        if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 1500)); continue; }
        if (!r.ok) return null;
        const j = await r.json();
        if (!j.thumbnail) return null;
        const info = { u: j.thumbnail.source, f: commonsPage((j.originalimage && j.originalimage.source) || j.thumbnail.source), t: Date.now() };
        photoMeta[id] = info;
        store.set(PHOTO_KEY, photoMeta);
        return info;
      }
      return null;
    });
  }
  async function photoInfo(id) {
    if (FACES[id] && !pinFailed.has(id)) return { u: FACES[id].u, f: commonsPage(FACES[id].u) };
    return apiInfo(id);
  }
  const fetchImg = (url) => new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(null), 12000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.decoding = 'async';
    img.alt = '';
    img.src = url;
  });
  function loadImage(id) {
    if (failedPhotos.has(id)) return Promise.resolve(null);
    if (imgPromises.has(id)) return imgPromises.get(id);
    const pr = (async () => {
      if (FACES[id] && !pinFailed.has(id)) {
        const img = await fetchImg(FACES[id].u);
        if (img) { img.pinned = true; return img; }
        pinFailed.add(id);
      }
      const info = await apiInfo(id).catch(() => null);
      return info ? fetchImg(info.u) : null;
    })().then((img) => { if (!img) { failedPhotos.add(id); imgPromises.delete(id); } return img; });
    imgPromises.set(id, pr);
    return pr;
  }

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

  // ---------- Sound (generated, no files) ----------
  let actx = null;
  let muted = store.get('ps-muted', false);
  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    if (muted) return;
    try {
      actx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch { /* audio unavailable */ }
  }
  const sfx = {
    ok() { tone(660, 0.12, 'triangle', 0.14); tone(990, 0.22, 'triangle', 0.14, 0.09); },
    no() { tone(196, 0.18, 'sawtooth', 0.06); tone(147, 0.3, 'sawtooth', 0.06, 0.12); },
    reveal() { tone(520, 0.07, 'square', 0.04); tone(780, 0.09, 'square', 0.04, 0.05); },
    tick() { tone(880, 0.05, 'triangle', 0.06); },
    gold() { [784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, i * 0.07)); },
  };
  const SPEAKER_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>';
  const SPEAKER_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  function paintMute() {
    document.querySelectorAll('.mute').forEach((b) => {
      b.innerHTML = muted ? SPEAKER_OFF : SPEAKER_ON;
      b.setAttribute('aria-pressed', String(muted));
      b.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
    });
  }
  document.querySelectorAll('.mute').forEach((b) => b.addEventListener('click', () => { muted = !muted; store.set('ps-muted', muted); paintMute(); if (!muted) sfx.tick(); }));

  // ---------- Question builders ----------
  // Every question has a clue ladder: stage 0 is free, each later stage costs points.
  // Stage fields: parts (face windows shown, or 'all'), cover (sticker over the face), add (clue chips), remove (wrong answers struck out), shown (career path clubs visible), label (button text).
  const avail = (used, f) => PLAYERS.filter((p) => !used.has(p.id) && f(p));

  function clueCountry(p) { return { k: 'Country', html: `${flag(p.c)} ${esc(cName(p.c))}` }; }
  function clueSport(p) { return { k: 'Sport', html: esc(SPORTS[p.s].name) }; }
  function clueBorn(p) { return { k: 'Born', html: String(p.b) }; }

  function nameOpts(rng, ans, opts = {}) {
    const ok = (p) => p.id !== ans.id && sex(p) === sex(ans) && (!opts.filter || opts.filter(p));
    const same = shuffle(rng, PLAYERS.filter((p) => ok(p) && p.s === ans.s));
    const other = shuffle(rng, PLAYERS.filter((p) => ok(p) && p.s !== ans.s));
    const nSame = opts.sameSport ?? 3;
    const picks = same.slice(0, nSame);
    while (picks.length < 3 && other.length) picks.push(other.shift());
    while (picks.length < 3 && same.length > picks.length) picks.push(same[picks.length]);
    if (picks.length < 3) return null;
    return shuffle(rng, [ans, ...picks]).map((p) => ({ label: p.n, sub: opts.sub ? opts.sub(p) : '', pid: p.id, correct: p.id === ans.id }));
  }
  const textOpts = (rng, right, wrongs, extra = {}) =>
    shuffle(rng, [{ label: right, correct: true, ...extra.right }, ...wrongs.map((w) => ({ label: w, correct: false, ...(extra.wrong ? extra.wrong(w) : {}) }))]);

  // A face question needs the pinned photo (so the face position is known) and at least n face windows.
  const hasFace = (id, n = 2) => !failedPhotos.has(id) && !pinFailed.has(id) && !!GEO(id) && Object.keys(GEO(id).parts).length >= n;
  function faceQ(rng, used, footballOnly) {
    const c = avail(used, (p) => (!footballOnly || p.s === 'football') && hasFace(p.id));
    if (!c.length) return null;
    const ans = pick(rng, c);
    const opts = nameOpts(rng, ans);
    if (!opts) return null;
    const [a, b] = shuffle(rng, Object.keys(GEO(ans.id).parts));
    const extra = footballOnly ? (ans.pos ? { k: 'Position', html: POS[ans.pos] } : clueBorn(ans)) : clueCountry(ans);
    return {
      subject: ans.id, view: 'parts', photo: ans.id, prompt: footballOnly ? 'Name the footballer' : 'Who is this?', opts,
      stages: [{ parts: [a] }, { parts: [a, b], label: 'Add the ' + PART_NAME[b].toLowerCase() }, { parts: 'all', add: [extra], label: 'Whole face + ' + extra.k.toLowerCase() }],
    };
  }
  // "Who am I?" clues, from hardest to easiest.
  function whoPools(p) {
    const hard = [{ k: 'Born', html: String(p.b) }];
    if (p.pos) hard.push({ k: 'Position', html: POS[p.pos] });
    const mid = (p.path || []).slice(1, -1).filter((c) => c !== p.first);
    if (mid.length) hard.push({ k: 'Once played for', html: esc(mid[0]) });
    const medium = [];
    if (p.first) medium.push({ k: 'Started at', html: esc(p.first) });
    if (p.num) medium.push({ k: 'Famous number', html: '#' + p.num });
    if (p.path && p.path.length > 1) medium.push({ k: 'Latest club', html: esc(p.path[p.path.length - 1]) });
    const easy = [clueCountry(p)];
    if (p.nick) easy.push({ k: 'Nickname', html: '“' + esc(p.nick) + '”' });
    return { hard, medium, easy };
  }

  const MAKERS = {
    face(rng, used) { return faceQ(rng, used, false); },
    footy(rng, used) { return faceQ(rng, used, true); },
    sport(rng, used) {
      const ok = (p) => hasFace(p.id, 1);
      const sports = Object.keys(SPORTS).filter((s) => avail(used, (p) => p.s === s && ok(p)).length);
      if (!sports.length) return null;
      const s = pick(rng, sports);
      const ans = pick(rng, avail(used, (p) => p.s === s && ok(p)));
      const wrong = shuffle(rng, Object.keys(SPORTS).filter((k) => k !== s)).slice(0, 3);
      return {
        subject: ans.id, view: 'cover', photo: ans.id, prompt: 'What sport do they play?',
        opts: textOpts(rng, SPORTS[s].name, wrong.map((k) => SPORTS[k].name)),
        stages: [{ cover: true }, { cover: false, label: 'Peel off the sticker' }, { cover: false, add: [clueCountry(ans)], label: 'Their country' }],
      };
    },
    who(rng, used) {
      const c = avail(used, (p) => { const P = whoPools(p); return P.hard.length + P.medium.length >= 3; });
      if (!c.length) return null;
      const ans = pick(rng, c);
      const P = whoPools(ans);
      const h = shuffle(rng, P.hard), m = shuffle(rng, P.medium);
      const cl = h.slice(0, 2);
      while (cl.length < 2) cl.push(m.shift());
      cl.push(m.length ? m.shift() : h[2]);
      cl.push(pick(rng, P.easy));
      const opts = nameOpts(rng, ans);
      if (!opts) return null;
      return {
        subject: ans.id, view: 'who', sport: ans.s, prompt: 'Who am I?', opts,
        stages: [{ add: cl.slice(0, 2) }, { add: [cl[2]], label: 'Another clue' }, { add: [cl[3]], label: 'The giveaway' }],
      };
    },
    country(rng, used) {
      const ans = pick(rng, avail(used, () => true));
      const cont = COUNTRIES[ans.c][1];
      const others = Object.keys(COUNTRIES).filter((c) => !sameNation(c, ans.c));
      const near = shuffle(rng, others.filter((c) => COUNTRIES[c][1] === cont));
      const far = shuffle(rng, others.filter((c) => COUNTRIES[c][1] !== cont));
      const wrong = [...near.slice(0, 2), ...far].slice(0, 3);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true }, prompt: 'Which country do they represent?',
        opts: shuffle(rng, [ans.c, ...wrong]).map((c) => ({ label: cName(c), flagC: c, correct: c === ans.c })),
        stages: [{}, { add: [{ k: 'Continent', html: esc(CONTINENTS[cont]) }], label: 'Continent' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    first(rng, used) {
      const c = avail(used, (p) => p.first);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const mine = clubsOf(ans);
      const pool = shuffle(rng, [...teamsBySport[ans.s]].filter((t) => !mine.has(t)));
      if (pool.length < 3) return null;
      const next = ans.path && ans.path.find((t) => t !== ans.first);
      const what = ans.s === 'football' ? 'club' : 'team';
      const prompt = ans.s === 'f1' ? 'Their first F1 team?' : ans.s === 'football' ? 'Their first senior club?' : 'Their first pro team?';
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true, country: true }, prompt,
        opts: textOpts(rng, ans.first, pool.slice(0, 3)),
        stages: [{}, next ? { add: [{ k: 'Next ' + what, html: esc(next) }], label: `Their next ${what}` } : { remove: 1, label: 'Strike out a wrong answer' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    path(rng, used) {
      const c = avail(used, (p) => p.path && p.path.length >= 3);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const key = ans.path.join('|');
      const opts = nameOpts(rng, ans, { filter: (p) => !p.path || p.path.join('|') !== key });
      if (!opts) return null;
      const half = Math.ceil(ans.path.length / 2);
      return {
        subject: ans.id, view: 'path', path: ans.path, prompt: 'Whose career is this?', opts,
        stages: [{ shown: half }, { shown: ans.path.length, label: 'Full career' }, { shown: ans.path.length, add: [clueCountry(ans), clueBorn(ans)], label: 'Country + birth year' }],
      };
    },
    nick(rng, used) {
      const c = avail(used, (p) => p.nick);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const opts = nameOpts(rng, ans, { sameSport: 1 });
      if (!opts) return null;
      return {
        subject: ans.id, view: 'quote', quote: ans.nick, prompt: 'Who is known as this?', opts,
        stages: [{}, { add: [clueSport(ans)], label: 'Their sport' }, { add: [clueCountry(ans)], label: 'Their country' }],
      };
    },
    older(rng, used) {
      const a = pick(rng, avail(used, () => true));
      const c = avail(used, (p) => p.id !== a.id && p.b !== a.b && Math.abs(p.b - a.b) <= 6);
      if (!c.length) return null;
      const b = pick(rng, c);
      const pair = shuffle(rng, [a, b]);
      const old = a.b < b.b ? a : b;
      return {
        subject: old.id, pids: [a.id, b.id], view: 'duo', duo: pair.map((p) => p.id), prompt: 'Who is older?', values: [200, 100],
        opts: pair.map((p) => ({ label: p.n, sub: SPORTS[p.s].name, pid: p.id, correct: p.id === old.id })),
        stages: [{}, { add: [{ k: pair[0].n, html: 'born ' + pair[0].b }], label: `${pair[0].n.split(' ').pop()}'s birth year` }],
      };
    },
    year(rng, used) {
      const ans = pick(rng, avail(used, () => true));
      const offs = shuffle(rng, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]).slice(0, 3);
      const years = [ans.b, ...offs.map((o) => ans.b + o)].sort((x, y) => x - y);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true, country: true }, prompt: 'What year were they born?', bigNum: true,
        opts: years.map((y) => ({ label: String(y), correct: y === ans.b })),
        stages: [{}, { remove: 1, label: 'Strike out a wrong answer' }, { remove: 1, label: 'Strike out another' }],
      };
    },
    odd(rng, used) {
      const variant = pick(rng, ['country', 'club', 'decade']);
      const pool = avail(used, () => true);
      let three, odd, rule, why;
      const groups = (keyOf) => { const m = {}; for (const p of pool) for (const k of keyOf(p)) (m[k] ||= []).push(p); return Object.entries(m).filter(([, v]) => v.length >= 3); };
      if (variant === 'country') {
        const g = groups((p) => [p.c]);
        if (!g.length) return null;
        const [c, members] = pick(rng, g);
        three = shuffle(rng, members).slice(0, 3);
        const sports = new Set(three.map((p) => p.s));
        const cand = pool.filter((p) => !sameNation(p.c, c) && sports.has(p.s));
        if (!cand.length) return null;
        odd = pick(rng, cand);
        rule = `represent ${cName(c)}`;
        why = `${odd.n} represents ${cName(odd.c)}.`;
      } else if (variant === 'club') {
        const g = groups((p) => (p.s === 'football' && p.path ? [...clubsOf(p)] : []));
        if (!g.length) return null;
        const [club, members] = pick(rng, g);
        three = shuffle(rng, members).slice(0, 3);
        const cand = pool.filter((p) => p.s === 'football' && p.path && !clubsOf(p).has(club));
        if (!cand.length) return null;
        odd = pick(rng, cand);
        rule = `played for ${club}`;
        why = `${odd.n} never did.`;
      } else {
        const dec = (p) => Math.floor(p.b / 10) * 10;
        const g = groups((p) => [dec(p)]);
        if (!g.length) return null;
        const [d, members] = pick(rng, g);
        three = shuffle(rng, members).slice(0, 3);
        const cand = pool.filter((p) => Math.abs(dec(p) - +d) === 10);
        if (!cand.length) return null;
        odd = pick(rng, cand);
        rule = `were born in the ${d}s`;
        why = `${odd.n} was born in ${odd.b}.`;
      }
      const showSport = variant !== 'club';
      return {
        subject: odd.id, pids: [...three, odd].map((p) => p.id), view: 'odd', prompt: "Who's the odd one out?",
        opts: shuffle(rng, [...three, odd]).map((p) => ({ label: p.n, sub: showSport ? SPORTS[p.s].name : '', pid: p.id, correct: p.id === odd.id })),
        stages: [{}, { add: [{ k: 'The link', html: 'Three of them ' + esc(rule) }], label: 'Reveal the link' }, { remove: 1, label: 'Strike out a wrong answer' }],
        why: `The other three ${rule}. ${why}`,
      };
    },
    club(rng, used) {
      const c = avail(used, (p) => p.path && ['football', 'basketball', 'f1'].includes(p.s));
      if (!c.length) return null;
      const ans = pick(rng, c);
      const club = pick(rng, ans.path);
      const pool = shuffle(rng, avail(used, (p) => p.id !== ans.id && p.s === ans.s && p.path && !clubsOf(p).has(club)));
      if (pool.length < 3) return null;
      const verb = ans.s === 'f1' ? 'drove for' : 'played for';
      return {
        subject: ans.id, pids: [ans.id, ...pool.slice(0, 3).map((p) => p.id)], view: 'club', club, verb, prompt: `Who ${verb} this ${ans.s === 'f1' ? 'team' : 'club'}?`,
        opts: shuffle(rng, [ans, ...pool.slice(0, 3)]).map((p) => ({ label: p.n, pid: p.id, correct: p.id === ans.id })),
        stages: [{}, { add: [clueBorn(ans)], label: 'Birth year of the right one' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    number(rng, used) {
      const c = avail(used, (p) => p.num);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const banned = new Set([ans.num, ...(ans.alt || [])]);
      const COMMON = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 30, 32, 33, 34, 44, 77, 99].filter((n) => !banned.has(n));
      const pool = shuffle(rng, COMMON);
      const same = pool.find((n) => n % 2 === ans.num % 2);
      const wrong = [same, ...pool.filter((n) => n !== same)].slice(0, 3);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true, country: true }, bigNum: true,
        prompt: ans.s === 'f1' ? 'Their race number?' : 'Their iconic shirt number?',
        opts: textOpts(rng, String(ans.num), wrong.map(String)),
        stages: [{}, { add: [{ k: 'Hint', html: ans.num % 2 ? 'It’s an odd number' : 'It’s an even number' }], label: 'Odd or even?' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    position(rng, used) {
      const c = avail(used, (p) => p.pos);
      if (!c.length) return null;
      const ans = pick(rng, c);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { country: true }, prompt: 'What position?', values: [200, 100],
        opts: ['GK', 'DF', 'MF', 'FW'].map((k) => ({ label: POS[k], correct: k === ans.pos })),
        stages: [{}, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
  };

  const CATS = [
    { key: 'face', name: 'Face Reveal', desc: 'Eyes only, then the hair or smile, then the face. Any sport.', color: '#2858a6' },
    { key: 'footy', name: 'Footballer Photo', desc: 'Footballers only. Name them from their eyes.', color: '#1f8a4c' },
    { key: 'sport', name: 'Which Sport?', desc: 'Their face is hidden. Spot the sport from the rest.', color: '#e0702a' },
    { key: 'who', name: 'Who Am I?', desc: 'Read the clues. Fewer clues, more points.', color: '#c2410c' },
    { key: 'path', name: 'Career Path', desc: 'Follow the transfers. Whose career is it?', color: '#1c1a16' },
    { key: 'first', name: 'First Club', desc: 'Where did their pro career start?', color: '#7a4bb0' },
    { key: 'country', name: 'Flag Them', desc: 'Which country does this athlete play for?', color: '#d6402b' },
    { key: 'nick', name: 'Nickname', desc: 'Who answers to this name?', color: '#b0306a' },
    { key: 'odd', name: 'Odd One Out', desc: 'Three share a link. Find the one who doesn’t.', color: '#3949ab' },
    { key: 'club', name: 'Club Connection', desc: 'Only one of them played there. Which one?', color: '#2e7d32' },
    { key: 'older', name: 'Who’s Older?', desc: 'Two athletes. Pick the one born first.', color: '#00897b' },
    { key: 'year', name: 'Birth Year', desc: 'Name the year they were born.', color: '#6d4c41' },
    { key: 'number', name: 'Shirt Number', desc: 'The number they made famous.', color: '#ef6c00' },
    { key: 'position', name: 'Position', desc: 'Keeper, defender, midfielder or forward?', color: '#00838f' },
  ];
  const CAT = Object.fromEntries(CATS.map((c) => [c.key, c]));
  const MODE_NAME = (k) => (k === 'daily' ? 'Daily Scout' : k === 'mix' ? 'Quick Mix' : CAT[k].name);
  const ROUND = 10;
  const VALUES = [300, 200, 100];

  function makeQ(cat, rng, used) {
    for (let t = 0; t < 25; t++) {
      const q = MAKERS[cat](rng, used);
      if (q) {
        q.cat = cat;
        q.values ||= VALUES.slice(0, q.stages.length);
        const wrong = q.opts.map((o, i) => (o.correct ? -1 : i)).filter((i) => i >= 0);
        q.removeOrder = shuffle(rng, wrong);
        for (const id of q.pids || [q.subject]) used.add(id);
        return q;
      }
    }
    return cat === 'year' ? null : makeQ('year', rng, used);
  }

  async function buildRound(mode, seed, onProgress) {
    const rng = mulberry32(seed);
    const plan = mode === 'daily' || mode === 'mix' ? shuffle(rng, CATS.map((c) => c.key)).slice(0, ROUND) : Array(ROUND).fill(mode);
    const used = new Set();
    const qs = plan.map((c) => makeQ(c, rng, used));
    // Photo questions need their photo before the round starts; swap in another player if one fails.
    // Face questions also need the pinned photo, because the eye/hair windows are measured on it.
    const isFace = (q) => q.view === 'parts' || q.view === 'cover';
    const need = qs.map((q, i) => i).filter((i) => isFace(qs[i]));
    let done = 0;
    onProgress(0, need.length);
    await Promise.all(need.map(async (i) => {
      const alt = mulberry32((seed ^ Math.imul(i + 1, 2654435761)) >>> 0);
      let q = qs[i];
      for (let t = 0; t < 4 && q; t++) {
        const img = await loadImage(q.photo);
        if (img && img.pinned) { qs[i] = q; onProgress(++done, need.length); return; }
        pinFailed.add(q.photo);
        q = makeQ(q.cat, alt, used);
        if (q && !isFace(q)) { qs[i] = q; onProgress(++done, need.length); return; }
      }
      qs[i] = null;
      onProgress(++done, need.length);
    }));
    if (qs.some((q) => !q)) throw new Error('photos');
    // Warm up the other photos in the background.
    for (const q of qs) for (const id of q.pids || [q.subject]) loadImage(id);
    return qs;
  }

  // ---------- Album ----------
  const ALBUM_KEY = 'ps-album';
  let album = store.get(ALBUM_KEY, {}); // id -> 1 (card) | 2 (gold)
  function collect(id, gold) {
    const before = album[id] || 0, now = Math.max(before, gold ? 2 : 1);
    album[id] = now; store.set(ALBUM_KEY, album);
    return { isNew: !before, upgraded: before === 1 && now === 2 };
  }
  const albumCount = () => Object.keys(album).filter((k) => BY[k]).length;

  // ---------- Dates / daily ----------
  function todaySeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function dailyNumber(seed) {
    const y = Math.floor(seed / 10000), m = Math.floor(seed / 100) % 100, d = seed % 100;
    return Math.max(1, Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 10, 10)) / 864e5) + 1);
  }

  // ---------- Screens ----------
  const screens = ['home', 'loading', 'play', 'result', 'album'];
  function show(id) {
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    window.scrollTo(0, 0);
  }

  // ---------- Home ----------
  let challenge = null;
  function readChallenge() {
    const q = new URLSearchParams(location.search);
    const cat = q.get('cat'), seed = parseInt(q.get('seed'), 10);
    if (!cat || !(cat === 'daily' || cat === 'mix' || CAT[cat]) || !Number.isFinite(seed)) return null;
    const score = parseInt(q.get('score'), 10);
    return { cat, seed: seed >>> 0, score: Number.isFinite(score) ? score : null, by: (q.get('by') || '').slice(0, 20) };
  }

  function renderHome() {
    $('albumCount').textContent = albumCount();
    const seed = todaySeed();
    const d = new Date();
    $('dailyDate').textContent = `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · #${dailyNumber(seed)}`;
    const done = store.get('ps-daily-' + seed, null);
    const right = $('dailyRight');
    if (done) {
      right.innerHTML = `<div class="daily-done"><p class="eyebrow">Today's score</p><p class="big">${fmt(done.score)}</p><p class="grid">${done.grid}</p></div>
        <button class="btn gold" type="button" id="dailyShare">Share result</button>
        <button class="link" type="button" id="dailyAgain" style="color:var(--paper)">Practise today's again</button>`;
      $('dailyShare').onclick = () => share(shareText('daily', seed, done.score, done.grid), $('dailyShare'));
      $('dailyAgain').onclick = () => start('daily', seed, { practice: true });
    } else {
      right.innerHTML = '<button class="btn gold" type="button" id="dailyPlay">Play today</button>';
      $('dailyPlay').onclick = () => start('daily', seed);
    }

    const best = store.get('ps-best', {});
    const tiles = CATS.map((c) => `
      <button class="cat" type="button" data-cat="${c.key}">
        <span class="cat-ico" style="--c:${c.color}">${svg(c.key)}</span>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-desc">${esc(c.desc)}</span>
        ${best[c.key] ? `<span class="cat-best">Best ${fmt(best[c.key])}</span>` : ''}
      </button>`).join('');
    $('cats').innerHTML = tiles + `
      <button class="cat mix" type="button" data-cat="mix">
        <span class="cat-ico" style="--c:var(--ink)">${svg('mix')}</span>
        <span class="cat-name">Quick Mix</span>
        <span class="cat-desc">10 random categories, new every time.</span>
        ${best.mix ? `<span class="cat-best">Best ${fmt(best.mix)}</span>` : ''}
      </button>`;
    $('cats').querySelectorAll('.cat').forEach((b) => b.addEventListener('click', () => start(b.dataset.cat, (Math.random() * 2 ** 32) >>> 0)));

    const ch = $('challenge');
    if (challenge) {
      const who = challenge.by ? esc(challenge.by) : 'A friend';
      const name = challenge.cat === 'daily' ? `Daily Scout #${dailyNumber(challenge.seed)}` : MODE_NAME(challenge.cat);
      ch.innerHTML = `<p><b>${who}</b> ${challenge.score !== null ? `scored <b>${fmt(challenge.score)}</b>` : 'challenged you'} in <b>${esc(name)}</b>. Same 10 questions. Can you beat it?</p>
        <button class="btn" type="button" id="acceptCh">Accept challenge</button>`;
      ch.classList.remove('hidden');
      $('acceptCh').onclick = () => start(challenge.cat, challenge.seed, { challenge });
    } else ch.classList.add('hidden');
    show('home');
  }

  // ---------- Round ----------
  let S = null;

  async function start(mode, seed, extra = {}) {
    show('loading');
    $('loadingText').textContent = 'Scouting players…';
    let qs;
    try {
      qs = await buildRound(mode, seed, (n, total) => { if (total) $('loadingText').textContent = `Scouting players… ${n}/${total} photos`; });
    } catch {
      $('loadingText').innerHTML = 'Couldn’t load the photos. Photo categories need an internet connection.<br><br><button class="btn" type="button" id="loadBack">Back</button>';
      $('loadBack').onclick = renderHome;
      return;
    }
    const isDaily = mode === 'daily' && seed === todaySeed() && !extra.practice && !store.get('ps-daily-' + seed, null);
    S = { mode, seed, qs, i: 0, score: 0, doubles: 2, fifty: 1, streak: 0, results: [], cards: [], isDaily, challenge: extra.challenge || null };
    show('play');
    renderQ();
  }

  const cur = () => S.qs[S.i];
  const isFinal = () => S.i === S.qs.length - 1;
  const ROLE = { football: 'a footballer', basketball: 'a basketball player', tennis: 'a tennis player', cricket: 'a cricketer', f1: 'a Formula 1 driver', athletics: 'a track & field athlete', swimming: 'a swimmer', gymnastics: 'a gymnast', golf: 'a golfer', boxing: 'a boxer', mma: 'an MMA fighter', nfl: 'an American football player', hockey: 'an ice hockey player', baseball: 'a baseball player', cycling: 'a cyclist', rugby: 'a rugby player' };

  function paintStreak() {
    const el = $('streak');
    el.classList.toggle('hidden', S.streak < 2);
    el.textContent = `🔥 ${S.streak}`;
    el.title = `${S.streak} correct in a row`;
  }

  function renderQ() {
    const q = cur();
    Object.assign(S, { stage: 0, doubled: false, fiftyNow: false, answered: false });
    $('qCat').textContent = S.mode === 'daily' ? `Daily Scout · ${CAT[q.cat].name}` : S.mode === 'mix' ? `Quick Mix · ${CAT[q.cat].name}` : CAT[q.cat].name;
    $('qNum').textContent = isFinal() ? 'Final question' : `Question ${S.i + 1} of ${S.qs.length}`;
    $('score').textContent = fmt(S.score);
    renderProgress();
    paintStreak();
    if (isFinal() && q.stake === undefined) { showBet(q); return; }
    $('bet').classList.add('hidden');
    $('playGrid').classList.remove('hidden');

    $('prompt').textContent = q.prompt;
    $('feedback').classList.add('hidden');
    $('feedback').innerHTML = '';
    $('tools').classList.remove('hidden');
    $('doubleBtn').classList.toggle('hidden', q.stake !== undefined);
    $('fiftyBtn').classList.toggle('hidden', q.stake !== undefined);

    const box = $('options');
    box.className = 'options' + (q.opts.length === 2 ? ' two' : '');
    box.innerHTML = q.opts.map((o, i) => `
      <button class="opt${q.bigNum ? ' big-num' : ''}" type="button" data-i="${i}">
        <span class="key" aria-hidden="true">${i + 1}</span>
        ${o.flagC ? flag(o.flagC, 'lg') : ''}
        <span class="lbl"><span>${esc(o.label)}</span>${o.sub ? `<span class="sub">${esc(o.sub)}</span>` : ''}</span>
      </button>`).join('');
    box.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.i)));

    buildStage(q);
    applyStage(true);
  }

  // Final question: stake any part of your score before you see it.
  function showBet(q) {
    $('playGrid').classList.add('hidden');
    const bet = $('bet');
    bet.classList.remove('hidden');
    const max = Math.max(300, Math.floor(S.score / 50) * 50);
    $('betCat').innerHTML = `<span class="cat-ico" style="--c:${CAT[q.cat].color}">${svg(q.cat)}</span>${esc(CAT[q.cat].name)}`;
    $('betHave').textContent = fmt(S.score);
    $('betMax').textContent = S.score < 300 ? ' (you can stake up to 300 even if you have less)' : '';
    const r = $('betRange');
    r.max = String(max);
    r.value = String(Math.round(max / 2 / 50) * 50);
    const paint = () => { $('betOut').textContent = fmt(+r.value); };
    r.oninput = paint;
    paint();
    bet.querySelectorAll('[data-f]').forEach((b) => { b.onclick = () => { r.value = String(Math.round(max * +b.dataset.f / 50) * 50); paint(); sfx.tick(); }; });
    $('betGo').onclick = () => {
      const stake = +r.value;
      q.stake = stake;
      q.values = q.stages.map((_, i) => Math.round(stake / 2 ** i / 10) * 10);
      sfx.reveal();
      renderQ();
    };
    $('betGo').focus({ preventScroll: true });
  }

  function renderProgress() {
    $('progress').innerHTML = S.qs.map((_, i) => {
      const r = S.results[i];
      const cls = r ? (r.ok ? 'r' + r.stage : 'rx') : i === S.i ? 'now' : '';
      return `<li class="${cls}${i === S.qs.length - 1 ? ' fin' : ''}"></li>`;
    }).join('');
  }

  function plateHTML(p, opt = {}) {
    const bits = [];
    if (opt.country) bits.push(`${flag(p.c)} ${esc(cName(p.c))}`);
    if (opt.sport) bits.push(sportTag(p.s));
    return `<div class="name-plate"><div class="nm">${esc(p.n)}</div>${bits.length ? `<div class="meta">${bits.join(' ')}</div>` : ''}</div>`;
  }

  // Builds the static part of the clue card for a question. applyStage() updates it as clues are bought.
  function buildStage(q) {
    const st = $('stage');
    st.innerHTML = '';
    S.view = {};
    if (q.view === 'parts' || q.view === 'cover') {
      const fr = document.createElement('div');
      fr.className = 'photo-frame' + (q.view === 'parts' ? ' peep' : '');
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', q.view === 'parts' ? 'Part of the mystery athlete’s face' : 'Photo of the mystery athlete with their face covered');
      fr.appendChild(cv);
      st.appendChild(fr);
      S.view.canvas = cv;
      loadImage(q.photo).then((img) => {
        if (!S || cur() !== q || !img) return;
        S.view.img = img;
        paintFace(q, S.answered ? { parts: 'all', cover: false } : stageState(q, S.stage), true);
      });
    } else if (q.view === 'portrait') {
      const p = BY[q.photo];
      st.appendChild(photoFrame(p.id));
      st.insertAdjacentHTML('beforeend', plateHTML(p, q.plate));
    } else if (q.view === 'path') {
      st.innerHTML = '<p class="eyebrow">Career path · main clubs</p><ol class="path" id="pathList"></ol>';
    } else if (q.view === 'quote') {
      st.innerHTML = `<p class="eyebrow">Nickname</p><p class="headline quote">${esc(q.quote)}</p>`;
    } else if (q.view === 'who') {
      st.innerHTML = `<p class="eyebrow">Mystery athlete</p><p class="who-intro">I’m ${esc(ROLE[q.sport] || 'an athlete')}…</p><ol class="who-list" id="whoList"></ol>`;
    } else if (q.view === 'duo') {
      const wrap = document.createElement('div');
      wrap.className = 'duo';
      for (const id of q.duo) {
        const col = document.createElement('div');
        col.appendChild(photoFrame(id));
        col.insertAdjacentHTML('beforeend', `<div class="name-plate" style="margin-top:8px"><div class="nm">${esc(BY[id].n)}</div><div class="meta">${sportTag(BY[id].s)}</div></div>`);
        wrap.appendChild(col);
      }
      st.appendChild(wrap);
    } else if (q.view === 'odd') {
      st.innerHTML = `<p class="eyebrow">Odd one out</p><p class="headline">Three of these four have something in common</p><p class="odd-hint">Pick the one who doesn’t fit.</p>`;
    } else if (q.view === 'club') {
      st.innerHTML = `<p class="eyebrow">Who ${esc(q.verb)}</p><span class="club-badge">${svg('club')}${esc(q.club)}</span><p class="odd-hint">Only one of the four did.</p>`;
      st.querySelector('.club-badge svg').setAttribute('style', 'width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linejoin:round');
    }
  }

  function paintFace(q, s, instant) {
    const { canvas, img } = S.view;
    const g = GEO(q.photo);
    if (!canvas || !img || !g) return;
    if (q.view === 'parts') {
      const prev = S.view.shownParts, now = s.parts;
      S.view.shownParts = now;
      if (instant || !prev) drawPeep(canvas, img, g, now, null, 1);
      else tween(canvas, (t) => drawPeep(canvas, img, g, now, prev, t));
    } else {
      const was = S.view.cover, now = s.cover ? 1 : 0;
      S.view.cover = now;
      if (instant || was === undefined || was === now) drawCover(canvas, img, g, now);
      else tween(canvas, (t) => drawCover(canvas, img, g, was + (now - was) * t));
    }
  }

  function stageState(q, upto) {
    const s = { parts: null, cover: null, clues: [], remove: 0, shown: 0 };
    for (let i = 0; i <= upto; i++) {
      const g = q.stages[i];
      if (g.parts !== undefined) s.parts = g.parts;
      if (g.cover !== undefined) s.cover = g.cover;
      if (g.shown !== undefined) s.shown = g.shown;
      if (g.add) s.clues.push(...g.add);
      if (g.remove) s.remove += g.remove;
    }
    return s;
  }
  const removedSet = (q, s) => {
    const wrongs = q.removeOrder.length;
    const n = Math.min(Math.max(0, wrongs - 1), s.remove + (S.fiftyNow ? 2 : 0));
    return new Set(q.removeOrder.slice(0, n));
  };
  // The next stage only helps if it shows something new, or there are still wrong answers to strike out.
  function nextStageUseful(q) {
    const nx = q.stages[S.stage + 1];
    if (!nx) return false;
    if (nx.add || nx.parts !== undefined || nx.cover !== undefined || nx.shown !== undefined) return true;
    return removedSet(q, stageState(q, S.stage)).size < q.removeOrder.length - 1;
  }

  function whoListHTML(clues, prevCount) {
    return clues.map((c, i) => `<li class="${i >= prevCount ? 'new' : ''}"><span class="k">${esc(c.k)}</span><span class="v">${c.html}</span></li>`).join('');
  }

  function applyStage(first) {
    const q = cur();
    const s = stageState(q, S.stage);

    if ((q.view === 'parts' || q.view === 'cover') && S.view.img) paintFace(q, s, first);
    if (q.view === 'path') {
      const list = $('pathList');
      const prev = S.view.shown || 0;
      list.innerHTML = q.path.map((club, i) => i < s.shown
        ? `<li class="${!first && i >= prev ? 'new' : ''}"><span class="yr">${i + 1}</span><span>${esc(club)}</span></li>`
        : `<li class="hid"><span class="yr">${i + 1}</span><span class="club" aria-label="hidden club"></span></li>`).join('');
      S.view.shown = s.shown;
    }
    if (q.view === 'who') {
      $('whoList').innerHTML = whoListHTML(s.clues, first ? 99 : S.view.whoCount || 0);
      S.view.whoCount = s.clues.length;
    }

    // Clue chips + locked ones still to come (Who Am I? shows its clues on the card instead)
    const chips = q.view === 'who' ? [] : s.clues.map((c) => `<li><span class="k">${esc(c.k)}</span> ${c.html}</li>`);
    for (let i = S.stage + 1; i < q.stages.length; i++) chips.push(`<li class="locked"><span class="k">Clue ${i + 1}</span> ${esc(q.stages[i].label)}</li>`);
    $('clues').innerHTML = chips.join('');

    const gone = removedSet(q, s);
    $('options').querySelectorAll('.opt').forEach((b, i) => {
      const off = gone.has(i);
      b.classList.toggle('gone', off);
      b.disabled = off || S.answered;
      b.setAttribute('aria-disabled', String(off));
    });

    paintTools();
  }

  function worth() { return cur().values[S.stage]; }
  function paintTools() {
    const q = cur();
    const v = worth();
    const w = $('worth');
    if (q.stake !== undefined) w.textContent = q.stake ? `Win ${fmt(v)} · risk ${fmt(-q.stake)}` : 'No bet';
    else w.textContent = S.doubled ? `Worth ${fmt(v * 2)} · risk ${fmt(-v)}` : `Worth ${fmt(v)}`;
    w.classList.toggle('doubled', S.doubled || (q.stake !== undefined && q.stake > 0));

    const rb = $('revealBtn');
    if (nextStageUseful(q)) {
      const cost = v - q.values[S.stage + 1];
      rb.innerHTML = `Next clue <span class="cost">${cost ? '−' + fmt(cost) : 'free'}</span>`;
      rb.title = q.stages[S.stage + 1].label;
      rb.disabled = S.answered;
    } else { rb.innerHTML = 'No more clues'; rb.disabled = true; }

    const pips = (n, total) => `<span class="pips" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? '' : 'used'}"></i>`).join('')}</span>`;
    const db = $('doubleBtn');
    db.innerHTML = `Double down ${pips(S.doubles, 2)}`;
    db.setAttribute('aria-pressed', String(S.doubled));
    db.setAttribute('aria-label', `Double down, ${S.doubles} left`);
    db.disabled = S.answered || q.stake !== undefined || (!S.doubled && S.doubles <= 0);

    const fb = $('fiftyBtn');
    const remaining = q.opts.length - removedSet(q, stageState(q, S.stage)).size;
    fb.innerHTML = `50:50 ${pips(S.fifty, 1)}`;
    fb.setAttribute('aria-label', `Fifty fifty, ${S.fifty} left`);
    fb.disabled = S.answered || q.stake !== undefined || S.fifty <= 0 || remaining <= 2;
  }

  $('revealBtn').addEventListener('click', () => {
    if (!S || S.answered || !nextStageUseful(cur())) return;
    S.stage++;
    sfx.reveal();
    applyStage(false);
  });
  $('doubleBtn').addEventListener('click', () => {
    if (!S || S.answered || cur().stake !== undefined) return;
    if (!S.doubled && S.doubles <= 0) return;
    S.doubled = !S.doubled;
    sfx.tick();
    paintTools();
  });
  $('fiftyBtn').addEventListener('click', () => {
    if (!S || S.answered || S.fifty <= 0 || cur().stake !== undefined) return;
    S.fifty--; S.fiftyNow = true;
    sfx.reveal();
    applyStage(false);
  });

  const streakBonus = (n) => (n >= 3 ? 50 * Math.min(n - 2, 3) : 0); // 3 in a row +50, 4 +100, 5+ +150

  function answer(i) {
    if (!S || S.answered) return;
    const q = cur();
    const o = q.opts[i];
    if (!o || removedSet(q, stageState(q, S.stage)).has(i)) return;
    S.answered = true;
    const v = worth(), ok = o.correct;
    const final = q.stake !== undefined;
    const pts = final ? (ok ? v : -q.stake) : ok ? v * (S.doubled ? 2 : 1) : S.doubled ? -v : 0;
    if (S.doubled) S.doubles--;
    S.streak = ok ? S.streak + 1 : 0;
    const bonus = ok ? streakBonus(S.streak) : 0;
    S.score += pts + bonus;
    S.results[S.i] = { ok, stage: S.stage, doubled: S.doubled, final: final && q.stake > 0, pts, bonus };

    $('options').querySelectorAll('.opt').forEach((b, j) => {
      b.disabled = true;
      if (q.opts[j].correct) b.classList.add('right');
      else if (j === i) b.classList.add('wrong', 'shake');
      else b.classList.add('dim');
    });
    $('tools').classList.add('hidden');
    $('score').textContent = fmt(S.score);
    if (pts || bonus) { const sb = $('score').parentElement; sb.classList.remove('bump'); void sb.offsetWidth; sb.classList.add('bump'); }
    paintStreak();

    // Reveal everything on the clue card
    if (q.view === 'parts' || q.view === 'cover') paintFace(q, { parts: 'all', cover: false }, false);
    if (q.view === 'path') { const list = $('pathList'); const prev = S.view.shown; S.view.shown = q.path.length; list.innerHTML = q.path.map((c, k) => `<li class="${k >= prev ? 'new' : ''}"><span class="yr">${k + 1}</span><span>${esc(c)}</span></li>`).join(''); }
    if (q.view === 'who') $('whoList').innerHTML = whoListHTML(stageState(q, q.stages.length - 1).clues, S.view.whoCount);
    if (q.view === 'duo') {
      $('stage').querySelectorAll('.name-plate .meta').forEach((m, k) => { m.insertAdjacentHTML('beforeend', ` <b>${BY[q.duo[k]].b}</b>`); });
    }
    $('clues').querySelectorAll('.locked').forEach((li) => li.remove());

    let card = null;
    if (ok) {
      const gold = S.stage === 0 && !S.fiftyNow;
      card = collect(q.subject, gold);
      S.cards.push({ id: q.subject, gold, isNew: card.isNew || card.upgraded });
      if (gold || bonus) sfx.gold(); else sfx.ok();
    } else sfx.no();
    renderProgress();
    showFeedback(q, ok, pts, card);
  }

  function factLine(q) {
    const p = BY[q.subject];
    switch (q.cat) {
      case 'path': return `Career: ${q.path.map(esc).join(' → ')}`;
      case 'first': return `Started at <b>${esc(p.first)}</b>${p.path && p.path.length > 1 ? `, then ${p.path.slice(p.path.indexOf(p.first) + 1).map(esc).join(' → ')}` : ''}.`;
      case 'nick': return `Known as <b>“${esc(p.nick)}”</b>.`;
      case 'number': return `Famous for <b>#${p.num}</b>${p.alt && p.alt.length ? ` (also wore ${p.alt.map((n) => '#' + n).join(', ')})` : ''}.`;
      case 'older': return q.duo.map((id) => `${esc(BY[id].n)}: <b>${BY[id].b}</b>`).join(' · ');
      case 'odd': return esc(q.why);
      case 'club': return `${esc(p.n)} ${esc(q.verb)} <b>${esc(q.club)}</b>. Career: ${p.path.map(esc).join(' → ')}`;
      case 'position': return `Plays as a <b>${POS[p.pos].toLowerCase()}</b>.`;
      case 'year': return `Born in <b>${p.b}</b>.`;
      case 'country': return `Represents <b>${esc(cName(p.c))}</b>.`;
      case 'sport': return `Sport: <b>${esc(SPORTS[p.s].name)}</b>.`;
      default: return p.path ? `Career: ${p.path.map(esc).join(' → ')}` : p.nick ? `Known as <b>“${esc(p.nick)}”</b>.` : `Born in ${p.b}.`;
    }
  }

  function showFeedback(q, ok, pts, card) {
    const p = BY[q.subject];
    const r = S.results[S.i];
    const titleOk = r.final ? 'Bet won!' : ['Spot on!', 'Got it!', 'Got there!'][Math.min(S.stage, 2)];
    const titleNo = r.final ? 'Bet lost' : 'Not this time';
    const fb = $('feedback');
    const ptsHtml = pts > 0 ? `+${fmt(pts)}` : pts < 0 ? fmt(pts) : '+0';
    const tag = r.doubled ? ' <small>(doubled)</small>' : r.final ? ' <small>(final bet)</small>' : '';
    const last = S.cards[S.cards.length - 1];
    const collectHtml = card
      ? `<p class="fb-collect${last.gold ? ' gold' : ''}">${last.gold ? '★ Gold card' : 'Card'} ${card.isNew ? 'added to your album' : card.upgraded ? 'upgraded to gold' : 'already in your album'}</p>`
      : '';
    const streakHtml = r.bonus ? `<p class="fb-streak">🔥 ${S.streak} in a row: +${r.bonus} streak bonus</p>` : '';
    fb.innerHTML = `
      <div class="fb-head"><p class="fb-title ${ok ? 'ok' : 'no'}">${ok ? titleOk : titleNo}</p><span class="fb-pts${pts < 0 ? ' neg' : ''}">${ptsHtml}${tag}</span></div>
      <div class="fb-card"><div id="fbPhoto"></div><div class="fb-who"><div class="nm">${esc(p.n)}</div><div class="meta">${flag(p.c)} ${esc(cName(p.c))} ${sportTag(p.s)} <span>b. ${p.b}</span></div></div></div>
      <p class="fb-fact">${factLine(q)}</p>
      ${streakHtml}${collectHtml}
      <div class="fb-foot"><span class="credit" id="fbCredit"></span><button class="btn" type="button" id="nextBtn">${S.i + 1 < S.qs.length ? (S.i + 2 === S.qs.length ? 'Final question' : 'Next') : 'See results'} →</button></div>`;
    $('fbPhoto').replaceWith(photoFrame(p.id));
    photoInfo(p.id).then((m) => { if (m && $('fbCredit')) $('fbCredit').innerHTML = `Photo: <a href="${m.f}" target="_blank" rel="noopener">Wikimedia Commons (author &amp; licence)</a>`; }).catch(() => {});
    fb.classList.remove('hidden');
    $('nextBtn').addEventListener('click', next);
    $('nextBtn').focus({ preventScroll: true });
    if (window.innerWidth <= 820) fb.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  function next() {
    if (!S || !S.answered) return;
    if (S.i + 1 < S.qs.length) { S.i++; renderQ(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); } else finish();
  }

  // ---------- Results ----------
  const gridOf = (results) => results.map((r) => (r.final ? (r.ok ? '💰' : '💸') : r.doubled ? (r.ok ? '🌟' : '💀') : r.ok ? ['🟩', '🟨', '🟧'][r.stage] : '🟥')).join('');
  function verdict(score) {
    if (score >= 5000) return 'Legendary. That final bet paid off.';
    if (score >= 3200) return 'Elite scout. Clubs should be calling you.';
    if (score >= 2200) return 'Sharp eye. Very little gets past you.';
    if (score >= 1300) return 'Solid scouting. A few more highlights to watch.';
    if (score >= 500) return 'Rookie scout. The album will help.';
    return 'Back to the stands for some research!';
  }

  function finish() {
    const grid = gridOf(S.results);
    const key = S.mode;
    const best = store.get('ps-best', {});
    const isBest = S.mode !== 'daily' && S.score > (best[key] || 0);
    if (isBest) { best[key] = S.score; store.set('ps-best', best); }
    if (S.isDaily) store.set('ps-daily-' + S.seed, { score: S.score, grid });

    $('rCat').textContent = S.mode === 'daily' ? `Daily Scout #${dailyNumber(S.seed)}` : MODE_NAME(S.mode);
    $('rScore').textContent = fmt(S.score);
    $('rVerdict').textContent = (isBest ? 'New personal best! ' : '') + verdict(S.score);
    $('rGrid').textContent = grid;
    const vs = $('rVs');
    if (S.challenge && S.challenge.score !== null) {
      const who = S.challenge.by || 'your friend';
      const d = S.score - S.challenge.score;
      vs.textContent = d > 0 ? `You beat ${who} by ${fmt(d)} points!` : d < 0 ? `${who} wins by ${fmt(-d)}. Rematch?` : `Dead heat with ${who}!`;
      vs.classList.remove('hidden');
    } else vs.classList.add('hidden');
    $('rCards').innerHTML = S.cards.length
      ? S.cards.map((c) => `<span class="${c.gold ? 'gold' : ''}${c.isNew ? ' new' : ''}">${esc(BY[c.id].n)}</span>`).join('')
      : '<span>No cards this round</span>';
    $('rName').value = store.get('ps-name', '');
    $('rToast').textContent = '';
    show('result');
  }

  function shareURL(mode, seed, score) {
    const u = new URL(location.href.split('?')[0].split('#')[0]);
    u.searchParams.set('cat', mode);
    u.searchParams.set('seed', String(seed));
    u.searchParams.set('score', String(score));
    const by = store.get('ps-name', '');
    if (by) u.searchParams.set('by', by);
    return u.toString();
  }
  function shareText(mode, seed, score, grid) {
    const title = mode === 'daily' ? `Daily Scout #${dailyNumber(seed)}` : MODE_NAME(mode);
    return { text: `Pro Scout · ${title} · ${fmt(score)} pts\n${grid}\nSame 10 questions, can you beat me?`, url: shareURL(mode, seed, score) };
  }
  async function share({ text, url }, btn) {
    const toast = $('rToast');
    try {
      if (navigator.share) { await navigator.share({ title: 'Pro Scout', text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      if (btn && btn.closest('#result')) toast.textContent = 'Copied! Paste it to a friend.';
      else if (btn) { const old = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = old; }, 1600); }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      if (btn && btn.closest('#result')) toast.textContent = url;
    }
  }
  $('rName').addEventListener('input', (e) => store.set('ps-name', e.target.value.trim().slice(0, 20)));
  $('rShare').addEventListener('click', (e) => share(shareText(S.mode, S.seed, S.score, gridOf(S.results)), e.currentTarget));
  $('rAgain').addEventListener('click', () => {
    if (S.mode === 'daily') start('mix', (Math.random() * 2 ** 32) >>> 0);
    else start(S.mode, (Math.random() * 2 ** 32) >>> 0);
  });
  $('rHome').addEventListener('click', () => { S = null; renderHome(); });
  $('quit').addEventListener('click', () => { if (!S || confirm('Quit this round? Your score won’t be saved.')) { S = null; renderHome(); } });

  // ---------- Album screen ----------
  let albumFilter = 'all';
  function renderAlbum() {
    const n = albumCount(), golds = Object.values(album).filter((v) => v === 2).length;
    $('albumSummary').textContent = `${n} of ${PLAYERS.length} cards · ${golds} gold`;
    const sports = Object.keys(SPORTS).filter((s) => PLAYERS.some((p) => p.s === s));
    const filters = [['all', 'All'], ...sports.map((s) => [s, SPORTS[s].name])];
    $('albumFilters').innerHTML = filters.map(([k, label]) => {
      const total = k === 'all' ? PLAYERS.length : PLAYERS.filter((p) => p.s === k).length;
      const have = k === 'all' ? n : PLAYERS.filter((p) => p.s === k && album[p.id]).length;
      return `<button type="button" data-f="${k}" aria-pressed="${albumFilter === k}">${esc(label)} ${have}/${total}</button>`;
    }).join('');
    $('albumFilters').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { albumFilter = b.dataset.f; renderAlbum(); }));

    const grid = $('albumGrid');
    grid.innerHTML = '';
    const order = PLAYERS.map((p, idx) => ({ p, idx })).sort((a, b) => (album[b.p.id] || 0) - (album[a.p.id] || 0) || a.idx - b.idx);
    order.forEach(({ p, idx }) => {
      if (albumFilter !== 'all' && p.s !== albumFilter) return;
      const have = album[p.id];
      const el = document.createElement('div');
      el.className = 'sticker' + (have === 2 ? ' gold' : '') + (have ? '' : ' empty');
      if (have) {
        el.innerHTML = `<div data-photo="${p.id}"></div><div class="cap"><div class="nm">${esc(p.n)}</div><div class="meta">${flag(p.c)} ${esc(SPORTS[p.s].name)}</div></div>`;
      } else {
        el.innerHTML = `<div class="photo-frame"></div><span class="num">#${String(idx + 1).padStart(3, '0')}</span><div class="cap"><div class="nm">???</div><div class="meta">${esc(SPORTS[p.s].name)}</div></div>`;
      }
      grid.appendChild(el);
    });
    // Load collected photos only when they scroll into view.
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); e.target.replaceWith(photoFrame(e.target.dataset.photo)); }
    }, { rootMargin: '200px' }) : null;
    grid.querySelectorAll('[data-photo]').forEach((ph) => { if (io) io.observe(ph); else ph.replaceWith(photoFrame(ph.dataset.photo)); });
  }
  $('openAlbum').addEventListener('click', () => { renderAlbum(); show('album'); });
  $('albumBack').addEventListener('click', renderHome);

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (!S || $('play').classList.contains('hidden') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (!S.answered && /^[1-4]$/.test(k)) { answer(+k - 1); e.preventDefault(); }
    else if (!S.answered && k === 'r') $('revealBtn').click();
    else if (!S.answered && k === 'd') $('doubleBtn').click();
    else if (!S.answered && k === 'f') $('fiftyBtn').click();
    else if (S.answered && (k === 'enter' || k === ' ' || k === 'n') && document.activeElement?.id !== 'nextBtn') { next(); e.preventDefault(); }
  });

  // Keep the face card crisp when the window is resized.
  window.addEventListener('resize', () => {
    if (S && S.view && S.view.canvas && S.view.img) { const q = cur(); paintFace(q, S.answered ? { parts: 'all', cover: false } : stageState(q, S.stage), true); }
  });

  // ---------- Boot ----------
  paintMute();
  challenge = readChallenge();
  renderHome();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
