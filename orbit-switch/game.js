/* Orbit Switch — a one-button arcade game. No dependencies. */
(() => {
  'use strict';

  // ---------- Setup ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {
    menu: $('menu'), over: $('over'), play: $('play'), retry: $('retry'), share: $('share'),
    mute: $('mute'), menuBest: $('menuBest'), overBest: $('overBest'),
    finalScore: $('finalScore'), newBest: $('newBest'),
  };

  const TAU = Math.PI * 2;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const COL = { bg: '#07060f', ring: '140,150,255', player: '#3cf2ff', block: '#ff3d9a', star: '#ffd23f', text: '#eef0ff' };
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  // ---------- Layout ----------
  let W = 0, H = 0, CX = 0, CY = 0, R_IN = 0, R_OUT = 0, PR = 0;
  let bgStars = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = W / 2; CY = H / 2;
    const m = Math.min(W, H);
    R_OUT = m * 0.38; R_IN = m * 0.25; PR = Math.max(7, m * 0.022);
    bgStars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({
      x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.3 + 0.3, p: Math.random() * TAU,
    }));
  }
  window.addEventListener('resize', resize);
  resize();

  const ringR = (t) => R_IN + (R_OUT - R_IN) * t;
  const pos = (a, r) => [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  const easeOut = (k) => 1 - (1 - k) * (1 - k);

  // ---------- Audio (generated, no files) ----------
  const audio = {
    ac: null,
    muted: !!store.get('orbit_muted', false),
    init() {
      if (!this.ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ac = new AC(); }
      if (this.ac && this.ac.state === 'suspended') this.ac.resume();
    },
    tone(freq, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
      if (this.muted || !this.ac) return;
      const t = this.ac.currentTime + delay;
      const o = this.ac.createOscillator(), gn = this.ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      gn.gain.setValueAtTime(vol, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn).connect(this.ac.destination);
      o.start(t); o.stop(t + dur + 0.02);
    },
    sw(up) { this.tone(up ? 420 : 620, 0.08, 'triangle', 0.1, up ? 260 : -220); },
    pass() { this.tone(240, 0.04, 'sine', 0.04); },
    star() { this.tone(880, 0.09, 'sine', 0.12); this.tone(1320, 0.14, 'sine', 0.1, 0, 0.06); },
    die() { this.tone(220, 0.55, 'sawtooth', 0.16, -170); this.tone(90, 0.4, 'square', 0.08, -40); },
  };

  function setMuteUI() {
    ui.mute.classList.toggle('muted', audio.muted);
    ui.mute.setAttribute('aria-pressed', String(audio.muted));
  }
  function toggleMute() { audio.muted = !audio.muted; store.set('orbit_muted', audio.muted); setMuteUI(); }
  setMuteUI();

  // ---------- State ----------
  const MENU = 'menu', PLAY = 'play', OVER = 'over';
  let state = MENU;
  let best = store.get('orbit_best', 0) | 0;
  let retryLock = 0, shake = 0, time = 0;
  let particles = [], popups = [];
  let g = makeGame(true);

  function makeGame(demo) {
    return {
      demo, angle: -Math.PI / 2, speed: demo ? 1.1 : 1.7,
      ring: 1, rt: 1, score: 0,
      obstacles: [], stars: [], trail: [],
      nextSpawn: -Math.PI / 2 + 3.4, nextHalf: 0.11,
      dead: false, deadT: 0, paused: false, newBest: false, demoT: 0,
    };
  }

  const difficulty = () => Math.min(1, g.score / 70);

  // Keep the track filled about 0.8 of a lap ahead of the player.
  function spawn() {
    while (g.nextSpawn < g.angle + TAU * 0.8) {
      const d = difficulty();
      const a = g.nextSpawn, half = g.nextHalf;
      g.obstacles.push({ a, half, ring: Math.random() < 0.5 ? 0 : 1, passed: false, born: time });

      const nextHalf = 0.09 + Math.random() * (0.05 + 0.1 * d);
      const minT = 0.62 - 0.3 * d, maxT = 1.25 - 0.55 * d; // seconds of clear space between blocks
      const clear = (minT + Math.random() * (maxT - minT)) * g.speed;
      if (Math.random() < 0.45) {
        g.stars.push({ a: a + half + clear / 2, ring: Math.random() < 0.5 ? 0 : 1, born: time });
      }
      g.nextSpawn = a + half + clear + nextHalf;
      g.nextHalf = nextHalf;
    }
  }

  // ---------- Effects ----------
  function burst(x, y, color, n, power) {
    if (reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = power * (0.3 + Math.random() * 0.7);
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.4 + Math.random() * 0.5, color, size: 1.5 + Math.random() * 2.5 });
    }
  }
  function popup(x, y, text, color) { popups.push({ x, y, text, color, life: 0 }); }

  function updateEffects(dt) {
    for (const p of particles) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; }
    particles = particles.filter((p) => p.life < p.max);
    for (const t of popups) { t.life += dt; t.y -= 40 * dt; }
    popups = popups.filter((t) => t.life < 0.8);
  }

  // ---------- Flow ----------
  function start() {
    audio.init();
    g = makeGame(false);
    particles = []; popups = [];
    state = PLAY;
    ui.menu.classList.add('hidden');
    ui.over.classList.add('hidden');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function die() {
    g.dead = true; g.deadT = 0;
    const [x, y] = pos(g.angle, ringR(g.rt));
    burst(x, y, COL.player, 40, 380);
    burst(x, y, COL.block, 22, 260);
    shake = reduceMotion ? 0 : 14;
    audio.die();
    if (navigator.vibrate) navigator.vibrate(90);
    if (g.score > best) { best = g.score; store.set('orbit_best', best); g.newBest = true; }
  }

  function showOver() {
    state = OVER;
    ui.finalScore.textContent = g.score;
    ui.overBest.textContent = best;
    ui.newBest.classList.toggle('hidden', !g.newBest);
    ui.over.classList.remove('hidden');
    retryLock = performance.now() + 550;
  }

  function switchRing() {
    g.ring ^= 1;
    audio.sw(g.ring === 1);
    const [x, y] = pos(g.angle, ringR(g.rt));
    burst(x, y, COL.player, 6, 90);
  }

  // ---------- Update ----------
  function update(dt) {
    time += dt;
    shake = Math.max(0, shake - dt * 30);
    updateEffects(dt);
    if (g.paused) return;
    if (g.dead) { g.deadT += dt; if (state === PLAY && g.deadT > 0.75) showOver(); return; }

    const target = g.demo ? 1.1 : 1.7 + 1.6 * difficulty();
    g.speed += (target - g.speed) * Math.min(1, dt * 0.8);
    g.angle += g.speed * dt;

    const diff = g.ring - g.rt;
    if (diff) { const step = dt / 0.11; g.rt = Math.abs(diff) <= step ? g.ring : g.rt + Math.sign(diff) * step; }

    g.trail.push({ a: g.angle, t: g.rt });
    if (g.trail.length > 16) g.trail.shift();

    if (g.demo) { g.demoT += dt; if (g.demoT > 1.4) { g.demoT = 0; g.ring ^= 1; } return; }

    spawn();
    const pr = ringR(g.rt);
    const hit = PR * 0.8; // forgiving hitbox

    for (const o of g.obstacles) {
      const r = ringR(o.ring);
      const reach = o.half + hit / r;
      const da = g.angle - o.a;
      if (o.passed) continue;
      if (da > reach) {
        o.passed = true; g.score++;
        audio.pass();
      } else if (Math.abs(da) < reach && Math.abs(pr - r) < PR * 1.6) {
        die();
        return;
      }
    }
    g.obstacles = g.obstacles.filter((o) => g.angle - o.a < 0.8);

    for (const s of g.stars) {
      const r = ringR(s.ring);
      if (Math.abs(g.angle - s.a) * r < PR * 1.8 && Math.abs(pr - r) < PR * 1.6) {
        s.got = true; g.score += 3;
        const [x, y] = pos(s.a, r);
        burst(x, y, COL.star, 16, 200);
        popup(x, y - PR * 1.5, '+3', COL.star);
        audio.star();
      }
    }
    g.stars = g.stars.filter((s) => !s.got && g.angle - s.a < 0.8);
  }

  // ---------- Render ----------
  function drawStar(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r, a = rot + (i * Math.PI) / 5;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  function render() {
    ctx.save();
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    // background stars
    ctx.fillStyle = '#fff';
    for (const s of bgStars) {
      ctx.globalAlpha = 0.15 + 0.35 * Math.sin(time * 1.2 + s.p) ** 2;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // center glow
    const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, R_OUT * 1.5);
    glow.addColorStop(0, 'rgba(60,242,255,0.09)');
    glow.addColorStop(1, 'rgba(60,242,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // rings
    for (let i = 0; i < 2; i++) {
      const active = g.ring === i;
      ctx.strokeStyle = `rgba(${COL.ring},${active ? 0.5 : 0.18})`;
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.beginPath(); ctx.arc(CX, CY, ringR(i), 0, TAU); ctx.stroke();
    }

    // score in the middle
    if (state === PLAY) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(238,240,255,0.92)';
      ctx.font = `900 ${Math.round(R_IN * 0.62)}px ${FONT}`;
      ctx.fillText(String(g.score), CX, CY - R_IN * 0.06);
      ctx.fillStyle = 'rgba(138,143,181,0.9)';
      ctx.font = `700 ${Math.max(11, Math.round(R_IN * 0.1))}px ${FONT}`;
      ctx.fillText(`BEST ${best}`, CX, CY + R_IN * 0.36);
    }

    // blocks
    ctx.lineCap = 'round';
    ctx.lineWidth = PR * 1.6;
    ctx.strokeStyle = COL.block;
    ctx.shadowColor = COL.block;
    ctx.shadowBlur = 16;
    for (const o of g.obstacles) {
      const k = Math.min(1, (time - o.born) / 0.35);
      const fade = o.passed ? Math.max(0, 1 - (g.angle - o.a - o.half) / 0.5) : 1;
      const r = ringR(o.ring);
      // round caps extend past the arc ends, so shrink the arc to keep the visible edge = hitbox edge
      const h = Math.max(0.01, (o.half - (PR * 0.8) / r) * (0.4 + 0.6 * easeOut(k)));
      ctx.globalAlpha = k * fade;
      ctx.beginPath(); ctx.arc(CX, CY, r, o.a - h, o.a + h); ctx.stroke();
    }

    // stars
    ctx.fillStyle = COL.star;
    ctx.shadowColor = COL.star;
    ctx.shadowBlur = 14;
    for (const s of g.stars) {
      const k = Math.min(1, (time - s.born) / 0.35);
      const [x, y] = pos(s.a, ringR(s.ring));
      ctx.globalAlpha = k;
      drawStar(x, y, PR * (0.85 + 0.12 * Math.sin(time * 6 + s.a)) * easeOut(k), time * 2);
    }

    // player + trail
    if (!g.dead) {
      ctx.fillStyle = COL.player;
      ctx.shadowColor = COL.player;
      ctx.shadowBlur = 0;
      g.trail.forEach((p, i) => {
        const k = i / g.trail.length;
        const [x, y] = pos(p.a, ringR(p.t));
        ctx.globalAlpha = k * 0.35;
        ctx.beginPath(); ctx.arc(x, y, PR * (0.3 + 0.6 * k), 0, TAU); ctx.fill();
      });
      const [x, y] = pos(g.angle, ringR(g.rt));
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(x, y, PR, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, PR * 0.45, 0, TAU); ctx.fill();
    }

    // particles
    ctx.shadowBlur = 0;
    for (const p of particles) {
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    // popups
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(PR * 1.4)}px ${FONT}`;
    for (const t of popups) {
      ctx.globalAlpha = 1 - t.life / 0.8;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }

    // paused
    if (g.paused) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(7,6,15,0.6)';
      ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.fillStyle = COL.text;
      ctx.font = `900 ${Math.round(R_IN * 0.22)}px ${FONT}`;
      ctx.fillText('PAUSED', CX, CY - R_IN * 0.1);
      ctx.fillStyle = 'rgba(138,143,181,1)';
      ctx.font = `700 ${Math.max(12, Math.round(R_IN * 0.09))}px ${FONT}`;
      ctx.fillText('TAP TO RESUME', CX, CY + R_IN * 0.15);
    }

    ctx.restore();
  }

  // ---------- Input ----------
  function press() {
    audio.init();
    if (state === MENU) start();
    else if (state === PLAY) {
      if (g.paused) { g.paused = false; return; }
      if (!g.dead) switchRing();
    } else if (state === OVER && performance.now() > retryLock) start();
  }

  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('button')) return;
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    press();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') { toggleMute(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === PLAY && !g.dead) g.paused = !g.paused; return; }
    if (!['Space', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.code)) return;
    if (e.target.closest && e.target.closest('button')) return; // let the focused button handle it
    e.preventDefault();
    if (!e.repeat) press();
  });

  ui.play.addEventListener('click', start);
  ui.retry.addEventListener('click', () => { if (performance.now() > retryLock) start(); });
  ui.mute.addEventListener('click', () => { audio.init(); toggleMute(); ui.mute.blur(); });
  ui.share.addEventListener('click', async () => {
    const text = `I scored ${g.score} in Orbit Switch. Can you beat it?`;
    const url = location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ title: 'Orbit Switch', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      ui.share.textContent = 'Copied!';
      setTimeout(() => { ui.share.textContent = 'Share'; }, 1500);
    } catch { /* share cancelled or unavailable */ }
  });

  const pauseIfPlaying = () => { if (state === PLAY && !g.dead) g.paused = true; };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseIfPlaying(); });
  window.addEventListener('blur', pauseIfPlaying);

  ui.menuBest.textContent = best;

  // ---------- Loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Offline support (only works over http/https) ----------
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
