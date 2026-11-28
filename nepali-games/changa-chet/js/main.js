/* Changa Chet (चङ्गा चेट) — a Dashain kite fight. No dependencies. */
// Game state, screens, input, physics, rivals, rendering and the main loop.
// Reads the helpers that util.js, i18n.js, audio.js, draw.js and scenery.js put on window.CC.
(() => {
  'use strict';
  const CC = window.CC;
  const { TAU, FONT, reduceMotion, FLAG, PLAYER_PAL, RIVAL_PALS, store, rand, clamp, lerp, pick, mix, vibrate } = CC.Util;
  const { canvas, ctx, rr, drawKite, strokePts, line, dot, drawText } = CC.Draw;
  const I18n = CC.I18n;
  const { t, num, fmtTime } = I18n;
  const audio = CC.Audio;

  // ---------- Setup ----------
  const $ = (id) => document.getElementById(id);
  const ui = {
    menu: $('menu'), over: $('over'), play: $('play'), retry: $('retry'), share: $('share'),
    mute: $('mute'), lang: $('lang'), menuBest: $('menuBest'), overBest: $('overBest'),
    finalCuts: $('finalCuts'), finalTime: $('finalTime'), newBest: $('newBest'),
  };

  // ---------- Language ----------
  function applyLang() {
    document.documentElement.lang = I18n.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    ui.menuBest.textContent = num(best);
  }

  // ---------- Layout ----------
  let W = 0, H = 0, DPR = 1, U = 1, K = 30, VMAX = 400, FIG = 5, roofY = 0, PX = 0;
  const anchor = { x: 0, y: 0 };
  const sky = { x0: 0, x1: 0, y0: 0, y1: 0 };
  let bgLayer = null, cityLayer = null, sunGlow = null;
  let clouds = [], farKites = [], flagLines = [];

  // ---------- State ----------
  let state = 'menu';
  let best = store.get('cc_best', 0) | 0;
  let time = 0, wind = 0, tod = 0, shake = 0;
  let player = null, rivals = [], fallers = [], birds = [], particles = [], popups = [], pickup = null;
  let cuts = 0, runTime = 0, manjaT = 0, fray = 0, stunT = 0, spawnT = 0, birdT = 0, manjaSpawnT = 0, overT = 0;
  let lastCutT = -10, combo = 0, paused = false, demo = true, retryLock = 0, newBest = false;
  const keys = new Set();

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const landscape = W > H;
    U = Math.min(W, H) / 100;
    K = clamp(U * 5.2, 20, 44);
    VMAX = clamp(U * 75, 280, 640);
    FIG = clamp(U * 0.85, 3, 7);
    roofY = Math.round(H * (landscape ? 0.8 : 0.83));
    PX = W * (landscape ? 0.2 : 0.24);
    anchor.x = PX + FIG * 2.4; anchor.y = roofY - FIG * 7.4;
    sky.x0 = K * 1.2; sky.x1 = W - K * 1.2;
    sky.y0 = Math.max(K * 1.6, H * 0.08);
    sky.y1 = roofY - K * 3;
    ({ bgLayer, cityLayer, clouds, farKites, flagLines } = CC.Scenery.build(W, H, DPR, U, K, roofY, PX));
    sunGlow = null;
    if (player) {
      player.x = clamp(player.x, sky.x0, sky.x1); player.y = clamp(player.y, sky.y0, sky.y1);
      player.tx = player.x; player.ty = player.y;
    }
  }

  // ---------- Audio (audio.js) ----------
  audio.isPlaying = () => state === 'play';

  function setMuteUI() { ui.mute.classList.toggle('muted', audio.muted); ui.mute.setAttribute('aria-pressed', String(audio.muted)); }
  function toggleMute() { audio.setMuted(!audio.muted); store.set('cc_muted', audio.muted); setMuteUI(); }

  // ---------- World ----------
  const difficulty = () => Math.min(1, cuts / 15);
  const maxRivals = () => Math.min(4, 1 + Math.floor(cuts / 3));

  function resetWorld(isDemo) {
    demo = isDemo;
    player = { x: PX + U * 14, y: lerp(sky.y0, sky.y1, 0.45), vx: 0, vy: 0, tx: 0, ty: 0, saw: 0, dead: false, deadT: 0, seed: 0, pts: null, cutAt: null };
    player.tx = player.x; player.ty = player.y;
    rivals = []; fallers = []; birds = []; particles = []; popups = []; pickup = null;
    cuts = 0; runTime = 0; manjaT = 0; fray = 0; stunT = 0; spawnT = isDemo ? 0.3 : 1.6; birdT = rand(4, 7);
    manjaSpawnT = rand(9, 13); overT = 0; lastCutT = -10; combo = 0; paused = false; newBest = false;
  }

  function stringPts(ax, ay, kx, ky, n = 12) {
    const d = Math.hypot(kx - ax, ky - ay);
    const cx = (ax + kx) / 2 + wind * U * 4, cy = (ay + ky) / 2 + d * 0.1;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
      pts.push([a * ax + b * cx + c * kx, a * ay + b * cy + c * ky]);
    }
    return pts;
  }

  function crossPoint(A, B) {
    if (!A || !B) return null;
    for (let i = 0; i < A.length - 1; i++) {
      const [ax, ay] = A[i], [bx, by] = A[i + 1], rx = bx - ax, ry = by - ay;
      for (let j = 0; j < B.length - 1; j++) {
        const [cx, cy] = B[j], [dx, dy] = B[j + 1], sx = dx - cx, sy = dy - cy;
        const den = rx * sy - ry * sx;
        if (Math.abs(den) < 1e-9) continue;
        const u = ((cx - ax) * sy - (cy - ay) * sx) / den, v = ((cx - ax) * ry - (cy - ay) * rx) / den;
        if (u >= 0 && u <= 1 && v >= 0 && v <= 1) return [ax + u * rx, ay + u * ry];
      }
    }
    return null;
  }

  function steer(o, k, damp, vmax, dt) {
    o.vx += ((o.tx - o.x) * k - o.vx * damp + wind * U * 120) * dt;
    o.vy += ((o.ty - o.y) * k - o.vy * damp) * dt;
    const sp = Math.hypot(o.vx, o.vy);
    if (sp > vmax) { o.vx *= vmax / sp; o.vy *= vmax / sp; }
    o.x += o.vx * dt; o.y += o.vy * dt;
  }

  function keepInSky(o, allowLow) {
    if (o.x < sky.x0) { o.x = sky.x0; o.vx = Math.max(0, o.vx); }
    if (o.x > sky.x1) { o.x = sky.x1; o.vx = Math.min(0, o.vx); }
    if (o.y < sky.y0) { o.y = sky.y0; o.vy = Math.max(0, o.vy); }
    if (!allowLow && o.y > sky.y1) { o.y = sky.y1; o.vy = Math.min(0, o.vy); }
  }

  function updatePlayer(dt) {
    const p = player;
    if (p.dead) { p.deadT += dt; return; }
    if (demo) {
      p.tx = lerp(sky.x0, sky.x1, 0.38) + Math.sin(time * 0.6) * (sky.x1 - sky.x0) * 0.22;
      p.ty = lerp(sky.y0, sky.y1, 0.4) + Math.sin(time * 1.1) * (sky.y1 - sky.y0) * 0.25;
    } else {
      let kx = 0, ky = 0;
      if (keys.has('left')) kx -= 1;
      if (keys.has('right')) kx += 1;
      if (keys.has('up')) ky -= 1;
      if (keys.has('down')) ky += 1;
      if (kx || ky) { const m = Math.hypot(kx, ky); p.tx += (kx / m) * VMAX * 0.9 * dt; p.ty += (ky / m) * VMAX * 0.9 * dt; }
    }
    p.tx = clamp(p.tx, sky.x0, sky.x1); p.ty = clamp(p.ty, sky.y0, sky.y1);
    if (stunT > 0) { // knocked by a bird: drift for a moment
      stunT -= dt;
      p.vy += U * 60 * dt; p.vx += wind * U * 40 * dt;
      const damp = 1 - Math.min(1, dt * 2);
      p.vx *= damp; p.vy *= damp;
      p.x += p.vx * dt; p.y += p.vy * dt;
    } else {
      steer(p, 60, 13, VMAX * 1.05, dt);
    }
    keepInSky(p, false);
    p.saw += (Math.hypot(p.vx, p.vy) / VMAX - p.saw) * Math.min(1, dt / 0.18);
  }

  function spawnRival() {
    const left = !demo && Math.random() < 0.25 && PX - U * 12 > 0;
    const ax = left ? rand(-W * 0.15, PX - U * 12) : rand(W * 0.55, W * 1.15);
    const skill = demo ? 0.4 : clamp(0.25 + 0.65 * difficulty() + rand(-0.05, 0.1), 0.2, 1);
    const side = left ? [sky.x0, W * 0.5] : [W * 0.4, sky.x1];
    const r = {
      ax, ay: H + U * 4, side, skill, vmax: VMAX * (0.5 + 0.45 * skill),
      x: clamp(ax, sky.x0, sky.x1), y: sky.y1 + K * 2, vx: 0, vy: -VMAX * 0.4, tx: 0, ty: 0,
      pal: pick(RIVAL_PALS), size: K * rand(0.85, 1), seed: rand(0, 10), t: 0,
      state: 'enter', stateT: rand(1.4, 2.2), saw: 0, p: 0, q: 0,
      crossing: false, cross: null, uncrossT: 9, pts: null, aimOff: 0, aimY: 0, base: null, gone: false,
    };
    pickSpot(r);
    rivals.push(r);
  }

  function pickSpot(r) { r.tx = rand(r.side[0], r.side[1]); r.ty = rand(sky.y0, sky.y1 - K); }
  function setWander(r, dur) { r.state = 'wander'; r.stateT = dur; pickSpot(r); }

  function updateRival(r, dt, canAttack) {
    r.t += dt; r.stateT -= dt;
    if (r.state === 'enter') {
      if (r.stateT <= 0) setWander(r, rand(1, 2.5));
    } else if (r.state === 'wander') {
      if (Math.hypot(r.tx - r.x, r.ty - r.y) < K) pickSpot(r);
      if (r.stateT <= 0) {
        if (canAttack && Math.random() < 0.45 + 0.45 * difficulty()) {
          r.state = 'attack'; r.stateT = rand(3, 5); r.aimOff = rand(0.6, 1.6) * K; r.aimY = rand(-1.5, 1.5) * K;
        } else setWander(r, rand(1.5, 3));
      }
    } else if (!canAttack) {
      setWander(r, rand(2, 4));
    } else {
      // aim to end up on the far side of your kite, so the strings cross
      const side = r.ax > anchor.x ? -1 : 1;
      const ax = player.x + side * r.aimOff, ay = player.y + r.aimY;
      if (r.state === 'attack') {
        r.tx = ax; r.ty = ay;
        if (r.crossing) { r.state = 'saw'; r.stateT = rand(2.5, 4.5); r.sawLeft = 9; r.base = { x: r.x, y: r.y }; }
        else if (r.stateT <= 0) setWander(r, rand(2, 3));
      } else { // saw: slide back and forth along your string
        r.base.x = lerp(r.base.x, ax, Math.min(1, dt * 1.2)); r.base.y = lerp(r.base.y, ay, Math.min(1, dt * 1.2));
        let dx = player.x - anchor.x, dy = player.y - anchor.y;
        const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
        const s = Math.sin(r.t * (6 + 6 * r.skill)) * K * (1.5 + 0.8 * r.skill);
        r.tx = r.base.x + dx * s; r.ty = r.base.y + dy * s;
        r.sawLeft -= dt;
        // keep sawing while the strings stay crossed (up to 9s); give up once you slip away
        if (r.uncrossT > 0.8 || r.sawLeft <= 0 || (r.stateT <= 0 && !r.crossing)) setWander(r, rand(2, 3.5));
      }
    }
    r.tx = clamp(r.tx, sky.x0, sky.x1); r.ty = clamp(r.ty, sky.y0, sky.y1);
    const k = r.state === 'saw' ? 40 + 30 * r.skill : 14 + 12 * r.skill; // tighter control while sawing
    steer(r, k, 2 * Math.sqrt(k) * 0.85, r.vmax, dt);
    keepInSky(r, r.state === 'enter');
    r.saw += (Math.hypot(r.vx, r.vy) / VMAX - r.saw) * Math.min(1, dt / 0.18);
  }

  function addFaller(x, y, vx, vy, pal, size, tail) {
    fallers.push({ x, y, vx: vx * 0.3, vy: vy * 0.3, pal, size, tail: clamp(tail, K, H * 0.4), t: 0, rot: 0, spin: rand(-1, 1) });
  }

  function cutRival(r) {
    r.gone = true; cuts++;
    const [hx, hy] = r.cross;
    addFaller(r.x, r.y, r.vx, r.vy, r.pal, r.size, Math.hypot(r.x - hx, r.y - hy));
    burst(hx, hy, ['#fff3b0', '#f5c518', r.pal[0]], 26, U * 45);
    combo = time - lastCutT < 3 ? combo + 1 : 1;
    lastCutT = time;
    const word = combo >= 3 ? 'ट्रिपल चेट!' : combo === 2 ? 'डबल चेट!' : 'चेट!';
    popup(hx, hy - K, word, '#ffffff', combo >= 2 ? 1.5 : 1.3);
    shake = reduceMotion ? 0 : 6;
    audio.chet(); vibrate(35);
    spawnT = Math.max(spawnT, rand(1, 2));
  }

  function cutPlayer(r) {
    const p = player;
    p.dead = true; p.deadT = 0;
    const [hx, hy] = r.cross;
    p.cutAt = { x: hx, y: hy };
    addFaller(p.x, p.y, p.vx, p.vy, PLAYER_PAL, K, Math.hypot(p.x - hx, p.y - hy));
    burst(hx, hy, ['#ffffff', '#dc143c', '#003893'], 30, U * 45);
    popup(hx, hy - K, 'काटियो!', '#ffd6d6', 1.4);
    shake = reduceMotion ? 0 : 12;
    audio.lose(); vibrate([60, 40, 120]);
    setWander(r, 99);
    pickup = null; overT = 1.6;
    if (cuts > best) { best = cuts; store.set('cc_best', best); newBest = true; }
  }

  // Your string wears down (fray) in every duel and barely recovers, so pick your fights.
  function engage(dt) {
    let intensity = 0, anyCross = false;
    for (const r of rivals) {
      const hit = crossPoint(player.pts, r.pts);
      if (hit) {
        if (!r.crossing && time - (r.pechT || -9) > 1.5) { popup(hit[0], hit[1] - K * 1.6, 'पेच!', '#fff3b0', 0.9); audio.pech(); r.pechT = time; }
        r.crossing = true; r.cross = hit; r.uncrossT = 0;
        // standing still barely cuts; you have to saw. Late-game rivals can out-saw you without manja.
        const mine = (0.03 + 0.8 * clamp(player.saw, 0, 1)) * (manjaT > 0 ? 1.6 : 1);
        // catch them off guard: a rival that isn't actively sawing does half the damage
        const theirs = r.skill * (0.35 + 0.65 * clamp(r.saw, 0, 1)) * (r.state === 'saw' ? 1 : 0.5);
        r.p += mine * dt; fray += theirs * dt; anyCross = true;
        intensity = Math.max(intensity, clamp((player.saw + r.saw) / 1.5, 0.2, 1));
        if (Math.random() < dt * 40 * (0.3 + player.saw)) spark(hit[0], hit[1]);
        if (r.p >= 1) cutRival(r);
        else if (fray >= 1) { cutPlayer(r); return 0; }
      } else {
        r.crossing = false; r.uncrossT += dt;
        r.p = Math.max(0, r.p - 0.25 * dt);
      }
    }
    if (!anyCross) fray = Math.max(0, fray - 0.1 * dt);
    return intensity;
  }

  function updateBirds(dt) {
    birdT -= dt;
    if (birdT <= 0) {
      birdT = rand(5, 10) * (1 - 0.4 * difficulty());
      const dir = Math.random() < 0.5 ? 1 : -1;
      birds.push({ x: dir > 0 ? -30 : W + 30, y: rand(sky.y0, sky.y1), vx: dir * rand(U * 16, U * 26), flap: rand(0, TAU), ph: rand(0, TAU), hit: false });
    }
    const canHit = state === 'play' && !player.dead && !demo;
    for (const b of birds) {
      b.x += b.vx * dt; b.y += Math.sin(time * 2 + b.ph) * U * 5 * dt; b.flap += dt * (b.hit ? 18 : 11);
      if (b.hit) b.y -= U * 20 * dt;
      if (canHit && !b.hit && Math.hypot(b.x - player.x, b.y - player.y) < K * 0.9) {
        b.hit = true; b.vx *= 1.6; stunT = 0.6;
        player.vx += Math.sign(b.vx) * VMAX * 0.5; player.vy += VMAX * 0.7;
        burst(b.x, b.y, ['#2a2420', '#5a4a40', '#ffffff'], 10, U * 20);
        audio.bird(); vibrate(25);
      }
    }
    birds = birds.filter((b) => b.x > -60 && b.x < W + 60 && b.y > -60);
  }

  function updatePickup(dt) {
    manjaSpawnT -= dt;
    if (!pickup && manjaSpawnT <= 0) {
      pickup = { x: rand(sky.x0 + K, sky.x1 - K), y: rand(sky.y0 + K, sky.y1 - K), life: 9 };
      manjaSpawnT = rand(14, 22);
    }
    if (!pickup) return;
    pickup.life -= dt;
    if (pickup.life <= 0) { pickup = null; return; }
    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) < K * 1.3) {
      manjaT = 8; fray = 0; // fresh, glass-coated string
      popup(pickup.x, pickup.y - K, 'मान्जा!', '#f5c518', 1);
      burst(pickup.x, pickup.y, ['#f5c518', '#fff3b0'], 16, U * 30);
      audio.manja();
      pickup = null;
    }
  }

  function updateFallers(dt) {
    for (const f of fallers) {
      f.t += dt;
      f.vx += (wind * U * 14 - f.vx) * Math.min(1, dt * 0.8);
      f.vy += (U * 16 - f.vy) * Math.min(1, dt * 1.2);
      f.x += (f.vx + Math.sin(f.t * 2.4) * U * 10) * dt;
      f.y += f.vy * dt;
      f.rot = Math.sin(f.t * 2.4) * 0.7 + f.spin * f.t * 0.3;
    }
    fallers = fallers.filter((f) => f.y < H + K * 3 && f.x > -K * 4 && f.x < W + K * 4 && f.t < 25);
  }

  // ---------- Effects ----------
  function burst(x, y, colors, n, power) {
    if (reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = power * (0.3 + Math.random() * 0.7);
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + Math.random() * 0.6, color: pick(colors), size: 2 + Math.random() * 3 });
    }
  }
  function spark(x, y) {
    const a = Math.random() * TAU, v = U * rand(8, 25);
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.25 + Math.random() * 0.2, color: Math.random() < 0.5 ? '#fff3b0' : '#ffffff', size: 1.5 + Math.random() * 2 });
  }
  function popup(x, y, text, color, scale) { popups.push({ x, y, text, color, scale, life: 0, max: 1.1 }); }

  function updateEffects(dt) {
    for (const p of particles) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy = p.vy * 0.95 + U * 20 * dt; }
    particles = particles.filter((p) => p.life < p.max);
    for (const p of popups) { p.life += dt; p.y -= U * 6 * dt; }
    popups = popups.filter((p) => p.life < p.max);
    for (const c of clouds) {
      c.x += (U * 1.5 + wind * U * 2.5) * c.sp * dt;
      if (c.x > W + c.s * 3) c.x = -c.s * 3;
      if (c.x < -c.s * 3) c.x = W + c.s * 3;
    }
  }

  // ---------- Update ----------
  function update(dt) {
    time += dt;
    wind = Math.sin(time * 0.11) * 0.6 + Math.sin(time * 0.27 + 1.3) * 0.4;
    tod = (1 - Math.cos((time / 150) * TAU)) / 2; // day → golden evening → day
    shake = Math.max(0, shake - dt * 25);
    updateEffects(dt);
    if (paused) { audio.setPech(0); return; }

    updateFallers(dt);
    updateBirds(dt);
    updatePlayer(dt);

    const playing = state === 'play' && !player.dead && !demo;
    if (playing) { runTime += dt; manjaT = Math.max(0, manjaT - dt); }

    spawnT -= dt;
    const cap = demo ? 2 : playing ? maxRivals() : 0;
    if (rivals.length < cap && spawnT <= 0) { spawnRival(); spawnT = rand(1.2, 2.4); }
    for (const r of rivals) updateRival(r, dt, playing);

    player.pts = player.dead ? null : stringPts(anchor.x, anchor.y, player.x, player.y + K * 0.15);
    for (const r of rivals) r.pts = stringPts(r.ax, r.ay, r.x, r.y + r.size * 0.15);

    let intensity = 0;
    if (playing) { intensity = engage(dt); if (!player.dead) updatePickup(dt); }
    else for (const r of rivals) r.crossing = false;
    rivals = rivals.filter((r) => !r.gone);
    audio.setPech(intensity);

    if (state === 'play' && player.dead) { overT -= dt; if (overT <= 0) showOver(); }
  }

  // ---------- Render (primitives in draw.js) ----------
  const tilt = (o) => clamp((o.vx / VMAX) * 0.6, -0.55, 0.55) + Math.sin(time * 3 + o.seed) * 0.05;
  const snap = (v) => Math.round(v * DPR) / DPR; // whole device pixels: images are copied, not resampled

  // A full-screen gradient fill is very slow on phones that draw the canvas in software, so a
  // vertical gradient is painted into a 1px-wide column (again only when its colours or size
  // change) and stretched across the rect: same pixels, about the cost of a plain copy.
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

  const skyCol = {};
  function drawSky() {
    vGrad(skyCol, -20, -20, W + 40, H + 40, 0, roofY,
      [0, mix('#3a8ee0', '#2b3d8c', tod), 0.6, mix('#8ccaf6', '#e9875c', tod), 1, mix('#dff3ff', '#ffcf8f', tod)]);
    const sx = W * 0.8, sy = lerp(H * 0.16, roofY - H * 0.2, tod), sr = U * 4.5;
    if (!sunGlow) { // the halo never changes, so it is painted once and copied each frame
      const n = Math.ceil(sr * 10 * DPR), x = (sunGlow = document.createElement('canvas')).getContext('2d');
      sunGlow.width = sunGlow.height = n;
      const glow = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, sr * 5 * DPR);
      glow.addColorStop(0, 'rgba(255,236,170,0.55)'); glow.addColorStop(1, 'rgba(255,236,170,0)');
      x.fillStyle = glow; x.fillRect(0, 0, n, n);
    }
    ctx.drawImage(sunGlow, snap(sx - sr * 5), snap(sy - sr * 5), sunGlow.width / DPR, sunGlow.height / DPR);
    ctx.fillStyle = mix('#fff6c8', '#ff9a4d', tod); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.85 - 0.3 * tod})`;
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.s, 0, TAU); ctx.arc(c.x + c.s * 0.9, c.y + c.s * 0.15, c.s * 0.75, 0, TAU);
      ctx.arc(c.x - c.s * 0.9, c.y + c.s * 0.2, c.s * 0.7, 0, TAU); ctx.arc(c.x + c.s * 0.3, c.y - c.s * 0.45, c.s * 0.7, 0, TAU);
      ctx.fill();
    }
  }

  function drawFarKites() {
    ctx.lineWidth = 1;
    for (const f of farKites) {
      const x = f.x + Math.sin(time * 0.7 + f.ph) * U * 1.5, y = f.y + Math.cos(time * 0.9 + f.ph) * U;
      ctx.strokeStyle = 'rgba(40,30,30,0.18)';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + f.ax) / 2, (y + roofY) / 2 + U * 6, f.ax, roofY + U * 5); ctx.stroke();
      drawKite(x, y, f.s, Math.sin(time * 2 + f.ph) * 0.15, f.pal, false, 0.7);
    }
  }

  function drawFlags() {
    for (const L of flagLines) {
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = Math.max(2, U * 0.5); // bamboo pole
      ctx.beginPath(); ctx.moveTo(L.x1, roofY); ctx.lineTo(L.x1, L.y1); ctx.stroke();
      const cx = (L.x1 + L.x2) / 2, cy = Math.max(L.y1, L.y2) + U * 3;
      ctx.strokeStyle = 'rgba(60,40,30,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L.x1, L.y1); ctx.quadraticCurveTo(cx, cy, L.x2, L.y2); ctx.stroke();
      const fw = Math.max(5, U * 1.6), fh = Math.max(7, U * 2.1);
      for (let i = 0; i < L.n; i++) {
        const s = (i + 0.5) / L.n, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
        const px = a * L.x1 + b * cx + c * L.x2, py = a * L.y1 + b * cy + c * L.y2;
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(time * 3 + i * 0.7) * 0.25 + wind * 0.3);
        ctx.fillStyle = FLAG[i % 5]; ctx.fillRect(-fw / 2, 0, fw, fh);
        ctx.restore();
      }
    }
  }

  function drawFigure() { // you, on the rooftop, with a dhaka topi and a lattai
    const f = FIG, x = PX, y = roofY;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2d2f45'; ctx.lineWidth = f * 0.9;
    line(x - f * 0.5, y - f * 3, x - f * 0.8, y - f * 0.2);
    line(x + f * 0.5, y - f * 3, x + f * 0.9, y - f * 0.2);
    ctx.fillStyle = '#f4efe2'; rr(ctx, x - f * 1.3, y - f * 6.3, f * 2.6, f * 3.7, f * 0.6); ctx.fill();
    ctx.fillStyle = '#003893'; rr(ctx, x - f * 1.3, y - f * 6.3, f * 2.6, f * 1.9, f * 0.6); ctx.fill();
    ctx.strokeStyle = '#f4efe2'; ctx.lineWidth = f * 0.8;
    line(x - f * 0.9, y - f * 5.8, x - f * 1.9, y - f * 4.4);
    ctx.fillStyle = '#8a5a2b'; rr(ctx, x - f * 2.6, y - f * 5.3, f * 1.4, f * 2, f * 0.3); ctx.fill();
    ctx.fillStyle = '#fafafa'; ctx.fillRect(x - f * 2.4, y - f * 4.9, f * 1.0, f * 1.2);
    ctx.strokeStyle = '#f4efe2';
    line(x + f * 0.9, y - f * 5.8, anchor.x, anchor.y);
    ctx.fillStyle = '#b98563'; dot(anchor.x, anchor.y, f * 0.45); dot(x, y - f * 7.2, f * 1.05);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.moveTo(x - f * 1.05, y - f * 7.55); ctx.lineTo(x + f * 1.05, y - f * 7.55); ctx.lineTo(x + f * 0.75, y - f * 8.85); ctx.lineTo(x - f * 0.95, y - f * 8.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(x - f * 0.6, y - f * 8.3, f * 0.35, f * 0.35); ctx.fillRect(x + f * 0.2, y - f * 8.2, f * 0.35, f * 0.35);
    ctx.fillStyle = '#f5c518'; ctx.fillRect(x - f * 0.15, y - f * 8.0, f * 0.3, f * 0.3);
  }

  function drawPlayerString() {
    if (player.pts) {
      strokePts(player.pts);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(30,20,20,0.35)'; ctx.lineWidth = manjaT > 0 ? 3.6 : 3; ctx.stroke();
      ctx.strokeStyle = manjaT > 0 ? '#f5c518' : '#ffffff'; ctx.lineWidth = manjaT > 0 ? 2.2 : 1.6; ctx.stroke();
    } else if (player.dead && player.cutAt) { // the loose end falling away
      const k = Math.min(1, player.deadT / 1.2);
      const ex = lerp(player.cutAt.x, anchor.x + U * 6, k), ey = lerp(player.cutAt.y, roofY + U * 4, k);
      ctx.globalAlpha = 1 - k * 0.5;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y); ctx.quadraticCurveTo((anchor.x + ex) / 2, Math.max(anchor.y, ey) + U * 4, ex, ey); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawPickup() {
    if (pickup.life < 2 && Math.floor(time * 8) % 2 === 0) return;
    const s = K * 0.55, x = pickup.x, y = pickup.y + Math.sin(time * 3) * U;
    const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.4);
    g.addColorStop(0, 'rgba(255,220,90,0.7)'); g.addColorStop(1, 'rgba(255,220,90,0)');
    ctx.fillStyle = g; ctx.fillRect(x - s * 2.4, y - s * 2.4, s * 4.8, s * 4.8);
    ctx.strokeStyle = '#6b4320'; ctx.lineWidth = Math.max(2, s * 0.15);
    line(x - s * 1.4, y, x + s * 1.4, y);
    ctx.fillStyle = '#f5c518'; rr(ctx, x - s * 0.6, y - s * 0.5, s * 1.2, s, s * 0.15); ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, x - s * 0.9, y - s * 0.75, s * 0.3, s * 1.5, s * 0.1); ctx.fill();
    rr(ctx, x + s * 0.6, y - s * 0.75, s * 0.3, s * 1.5, s * 0.1); ctx.fill();
  }

  function drawFaller(f) {
    ctx.strokeStyle = 'rgba(45,30,25,0.7)'; ctx.lineWidth = 1.2;
    const bx = f.x, by = f.y + f.size * 0.15;
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + Math.sin(f.t * 2) * U * 4, by + f.tail * 0.5, bx - f.vx * 0.4 + Math.sin(f.t * 1.6) * U * 3, by + f.tail);
    ctx.stroke();
    drawKite(f.x, f.y, f.size, f.rot, f.pal);
  }

  function drawBirds() {
    const s = clamp(U * 2.2, 8, 18);
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = Math.max(1.5, U * 0.45); ctx.lineCap = 'round';
    for (const b of birds) {
      const fl = Math.sin(b.flap) * s * 0.6;
      ctx.beginPath(); ctx.moveTo(b.x - s, b.y - fl);
      ctx.quadraticCurveTo(b.x - s * 0.4, b.y - s * 0.35, b.x, b.y);
      ctx.quadraticCurveTo(b.x + s * 0.4, b.y - s * 0.35, b.x + s, b.y - fl);
      ctx.stroke();
    }
  }

  function drawDuels() { // duel bar at each crossing: red = your cut on them, their colour = wear on your string
    for (const r of rivals) {
      if (!r.cross || (!r.crossing && r.p < 0.02)) continue;
      const [x, y0] = r.cross, w = Math.max(70, U * 13), h = Math.max(7, U * 1.3), y = y0 - K * 1.1;
      ctx.globalAlpha = r.crossing ? 1 : 0.5;
      ctx.fillStyle = 'rgba(20,12,10,0.65)'; rr(ctx, x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, h); ctx.fill();
      const pw = (w / 2) * clamp(r.p, 0, 1), qw = (w / 2) * clamp(fray, 0, 1);
      ctx.fillStyle = '#dc143c'; ctx.fillRect(x - w / 2, y - h / 2, pw, h);
      ctx.fillStyle = r.pal[0]; ctx.fillRect(x + w / 2 - qw, y - h / 2, qw, h);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - h / 2 - 2, 2, h + 4);
      ctx.globalAlpha = 1;
    }
  }

  function drawHUD() {
    const pad = 14, h = clamp(U * 7, 40, 54);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const score = num(cuts), label = t('hudCuts');
    ctx.font = `800 ${Math.round(h * 0.5)}px ${FONT}`; const sw = ctx.measureText(score).width;
    ctx.font = `700 ${Math.round(h * 0.28)}px ${FONT}`; const lw = ctx.measureText(label).width;
    const w = h * 0.95 + sw + 8 + lw + h * 0.45;
    ctx.fillStyle = 'rgba(255,248,236,0.92)'; rr(ctx, pad, pad, w, h, h / 2); ctx.fill();
    drawKite(pad + h * 0.48, pad + h * 0.44, h * 0.24, 0, PLAYER_PAL);
    ctx.fillStyle = '#2a1a14'; ctx.font = `800 ${Math.round(h * 0.5)}px ${FONT}`; ctx.fillText(score, pad + h * 0.95, pad + h / 2 + 1);
    ctx.fillStyle = '#7a6457'; ctx.font = `700 ${Math.round(h * 0.28)}px ${FONT}`; ctx.fillText(label, pad + h * 0.95 + sw + 8, pad + h / 2 + 1);
    drawText(`${t('hudBest')} ${num(best)}`, pad + 4, pad + h + h * 0.4, h * 0.3, '#ffffff', 700);
    { // string health
      const bw = Math.max(110, U * 16), y1 = pad + h + h * 0.8, hp = 1 - clamp(fray, 0, 1);
      ctx.fillStyle = 'rgba(20,12,10,0.5)'; rr(ctx, pad, y1, bw, 10, 5); ctx.fill();
      ctx.fillStyle = hp > 0.5 ? '#2e9e5b' : hp > 0.25 ? '#f39a1e' : '#e23b3b';
      if (hp > 0.01) { rr(ctx, pad, y1, Math.max(10, bw * hp), 10, 5); ctx.fill(); }
      drawText(t('string'), pad + bw + 8, y1 + 5, h * 0.28, '#ffffff', 800);
    }
    if (manjaT > 0) {
      const bw = Math.max(110, U * 16), y2 = pad + h + h * 1.2;
      ctx.fillStyle = 'rgba(20,12,10,0.5)'; rr(ctx, pad, y2, bw, 10, 5); ctx.fill();
      ctx.fillStyle = '#f5c518'; rr(ctx, pad, y2, Math.max(10, (bw * manjaT) / 8), 10, 5); ctx.fill();
      drawText(t('manja'), pad + bw + 8, y2 + 5, h * 0.28, '#f5c518', 800);
    }
    // wind gauge
    const ww = clamp(U * 18, 104, 160), cx = W / 2, wy = pad + h / 2;
    ctx.fillStyle = 'rgba(255,248,236,0.85)'; rr(ctx, cx - ww / 2, pad + h * 0.12, ww, h * 0.76, h * 0.38); ctx.fill();
    ctx.fillStyle = '#7a6457'; ctx.font = `700 ${Math.round(h * 0.26)}px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(t('wind'), cx - ww * 0.22, wy + 1);
    const ax = cx + ww * 0.2, len = (ww * 0.18) * Math.abs(wind) + 4, dir = wind >= 0 ? 1 : -1;
    ctx.strokeStyle = '#1f6fd1'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    line(ax - dir * len, wy, ax + dir * len, wy);
    line(ax + dir * len, wy, ax + dir * (len - 6), wy - 5);
    line(ax + dir * len, wy, ax + dir * (len - 6), wy + 5);
    if (runTime < 5) { // first-seconds hint
      ctx.globalAlpha = Math.min(1, 5 - runTime);
      drawText(t('hint'), W / 2, pad + h * 2.9, clamp(U * 3.6, 15, 24), '#ffffff', 800);
      ctx.globalAlpha = 1;
    }
  }

  function drawPause() {
    ctx.fillStyle = 'rgba(0,20,60,0.5)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    drawText(t('paused'), W / 2, H * 0.42, clamp(U * 8, 30, 56), '#ffffff', 900);
    drawText(t('resume'), W / 2, H * 0.42 + clamp(U * 8, 30, 56), clamp(U * 3.5, 15, 22), '#fff3b0', 700);
  }

  function render() {
    ctx.save();
    if (shake > 0) ctx.translate(snap((Math.random() - 0.5) * shake), snap((Math.random() - 0.5) * shake));
    drawSky();
    ctx.drawImage(bgLayer, 0, 0, W, H);
    drawFarKites();
    ctx.strokeStyle = 'rgba(45,30,25,0.75)'; ctx.lineWidth = 1.2;
    for (const r of rivals) { strokePts(r.pts || stringPts(r.ax, r.ay, r.x, r.y)); ctx.stroke(); }
    ctx.drawImage(cityLayer, 0, 0, W, H);
    drawFlags();
    drawFigure();
    drawPlayerString();
    if (pickup) drawPickup();
    for (const f of fallers) drawFaller(f);
    for (const r of rivals) drawKite(r.x, r.y, r.size, tilt(r), r.pal);
    if (!player.dead) drawKite(player.x, player.y, K, tilt(player), PLAYER_PAL, manjaT > 0);
    drawBirds();
    if (tod > 0.02) { ctx.fillStyle = `rgba(255,120,60,${0.13 * tod})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
    drawDuels();
    for (const p of particles) {
      ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of popups) {
      const k = p.life / p.max, pop = 1 + 0.35 * Math.max(0, 1 - p.life / 0.12);
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      drawText(p.text, p.x, p.y, K * 0.85 * p.scale * pop, p.color, 900);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (state === 'play') drawHUD();
    if (paused) drawPause();
  }

  // ---------- Flow ----------
  function start() {
    audio.init(); audio.startMusic();
    resetWorld(false);
    state = 'play';
    ui.menu.classList.add('hidden'); ui.over.classList.add('hidden');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function showOver() {
    state = 'over';
    ui.finalCuts.textContent = num(cuts);
    ui.finalTime.textContent = fmtTime(Math.floor(runTime));
    ui.overBest.textContent = num(best);
    ui.menuBest.textContent = num(best);
    ui.newBest.classList.toggle('hidden', !newBest);
    ui.over.classList.remove('hidden');
    retryLock = performance.now() + 600;
  }

  // ---------- Input ----------
  const drag = { id: null, x: 0, y: 0 };
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'play') return;
    e.preventDefault();
    audio.init();
    if (paused) { paused = false; return; }
    if (e.pointerType === 'mouse') { player.tx = e.clientX; player.ty = e.clientY; }
    else { drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; }
  });
  window.addEventListener('pointermove', (e) => {
    if (state !== 'play' || paused || !player || player.dead) return;
    if (e.pointerType === 'mouse') { player.tx = e.clientX; player.ty = e.clientY; }
    else if (e.pointerId === drag.id) { // relative drag so your finger never hides the kite
      player.tx += (e.clientX - drag.x) * 1.5; player.ty += (e.clientY - drag.y) * 1.5;
      drag.x = e.clientX; drag.y = e.clientY;
    }
  });
  const endDrag = (e) => { if (e.pointerId === drag.id) drag.id = null; };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') { audio.init(); toggleMute(); return; }
    if ((e.code === 'Escape' || e.code === 'KeyP') && state === 'play' && !player.dead) { paused = !paused; return; }
    if (KEYMAP[e.code]) {
      keys.add(KEYMAP[e.code]);
      if (state === 'play') { e.preventDefault(); paused = false; }
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (e.target.closest && e.target.closest('button')) return; // the focused button handles it
      e.preventDefault();
      if (e.repeat) return;
      if (state === 'menu') start();
      else if (state === 'over' && performance.now() > retryLock) start();
      else if (paused) paused = false;
    }
  });
  window.addEventListener('keyup', (e) => { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); });

  ui.play.addEventListener('click', start);
  ui.retry.addEventListener('click', () => { if (performance.now() > retryLock) start(); });
  ui.mute.addEventListener('click', () => { audio.init(); toggleMute(); ui.mute.blur(); });
  ui.lang.addEventListener('click', () => { I18n.lang = I18n.lang === 'en' ? 'ne' : 'en'; store.set('cc_lang', I18n.lang); applyLang(); });
  ui.share.addEventListener('click', async () => {
    const text = t('shareText')(num(cuts)), url = location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ title: 'Changa Chet · चङ्गा चेट', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      ui.share.textContent = t('copied');
      setTimeout(() => { ui.share.textContent = t('share'); }, 1500);
    } catch { /* share cancelled or unavailable */ }
  });

  const pauseIfPlaying = () => { if (state === 'play' && player && !player.dead) paused = true; };
  window.addEventListener('blur', () => { pauseIfPlaying(); keys.clear(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseIfPlaying(); if (audio.ac) audio.ac.suspend(); }
    else if (audio.ac) audio.ac.resume();
  });
  window.addEventListener('resize', resize);

  // ---------- Go ----------
  resize();
  resetWorld(true);
  setMuteUI();
  applyLang();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
