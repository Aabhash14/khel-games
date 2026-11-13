// Animal Stack: take turns dropping an animal onto the tempo roof. Topple the pile and you lose.
// The board turns to face whoever is dropping, so the stack always looks upright to them.
// Physics: Matter.js (MIT), vendored in js/vendor and loaded on first play.
import { ANIMALS, drawAnimal, life, tickLife } from '../animals.js';

const WW = 360; // world width in physics units
let matterP = null;
function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  matterP ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/matter.min.js', import.meta.url).href;
    s.onload = () => res(window.Matter); s.onerror = rej;
    document.head.append(s);
  });
  return matterP;
}

function makeBody(M, a) {
  const parts = a.parts.map(([kind, ...v]) => {
    if (kind === 'rect') return M.Bodies.rectangle(v[0], v[1], v[2], v[3], { chamfer: { radius: Math.min(v[4], Math.min(v[2], v[3]) / 2 - 1) } });
    if (kind === 'circle') return M.Bodies.circle(v[0], v[1], v[2]);
    const pts = v[0].map(([x, y]) => ({ x, y }));
    const c = M.Vertices.centre(pts);
    return M.Bodies.fromVertices(c.x, c.y, [pts]);
  });
  const body = parts.length === 1 ? parts[0] : M.Body.create({ parts });
  const com = { x: body.position.x, y: body.position.y };
  M.Body.set(body, { friction: 0.9, frictionStatic: 1.4, frictionAir: 0.012, restitution: 0.02 });
  M.Body.setDensity(body, 0.0016);
  return { body, com };
}

const ROT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DROP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v13M6 12l6 6 6-6M5 21h14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export default {
  id: 'stack',
  mount(root, api) {
    const ne = api.lang === 'ne';
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const cv = el('canvas', 'cv stack-cv'); const ctx = cv.getContext('2d');
    const bar = el('div', 'stack-ctl');
    const turnBtn = el('button', 'btn ghost', `${ROT}<span>${api.t('stack.turn')}</span>`); turnBtn.type = 'button';
    const label = el('span', 'stack-lbl');
    const dropBtn = el('button', 'btn pc', `${DROP}<span>${api.t('stack.drop')}</span>`); dropBtn.type = 'button';
    bar.append(turnBtn, label, dropBtn);
    root.append(cv, bar);

    let M = null; let engine = null; let destroyed = false;
    let W = 0; let H = 0; let s = 1; let WH = 600; let platY = 500;
    const placed = []; // { body, com, a, by, L }
    const byBody = new Map();
    let tS = 0; let fdt = 0.016;
    const count = [0, 0];
    let turn = api.first; let lastDropper = null;
    let state = 'load'; let aim = null; let cam = 0; let camTarget = 0;
    let calmSince = 0; let dropAt = 0; let raf = 0; let last = performance.now(); let acc = 0; let lastThump = 0;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      s = W / WW; WH = H / s;
    };
    const ro = new ResizeObserver(resize); ro.observe(cv); resize();
    platY = WH - 96;

    const anName = (a) => (ne ? a.ne : a.en);
    function setAimLabel() { label.textContent = aim ? api.t('stack.your', { a: anName(aim.a) }) : ''; }
    let lastPick = null;
    function pickAnimal() {
      let a; do { a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]; } while (a.id === lastPick && ANIMALS.length > 1);
      lastPick = a.id;
      return a;
    }

    function newTurn() {
      api.face(turn); api.turn(turn);
      api.msg(turn, api.t('yourTurn')); api.msg(1 - turn, api.t('waiting'));
      bar.dataset.p = turn; dropBtn.dataset.p = turn;
      later(() => {
        if (destroyed || state === 'over') return;
        aim = { a: pickAnimal(), x: WW / 2, angle: 0, shown: 0, L: life() };
        state = 'aim'; setAimLabel(); api.sfx.voice(aim.a.id);
      }, 650);
    }

    function stackTop() {
      let top = platY;
      for (const p of placed) top = Math.min(top, p.body.bounds.min.y);
      return top;
    }

    loadMatter().then((Matter) => {
      if (destroyed) return;
      M = Matter;
      engine = M.Engine.create({ enableSleeping: true });
      engine.gravity.y = 1;
      const roof = M.Bodies.rectangle(WW / 2, platY + 12, 196, 24, { isStatic: true, chamfer: { radius: 8 }, friction: 1, frictionStatic: 2 });
      M.Composite.add(engine.world, roof);
      M.Events.on(engine, 'collisionStart', (ev) => {
        const now = performance.now();
        let v = 0;
        for (const p of ev.pairs) {
          const rel = Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y);
          v = Math.max(v, rel);
          // whoever gets bumped squashes like a soft toy
          [p.bodyA.parent, p.bodyB.parent].forEach((b) => { const e = byBody.get(b.id); if (e && rel > 0.5) e.L.sqV += Math.min(5, rel) * 1.7; });
        }
        if (v > 1.2 && now - lastThump > 70) { api.sfx.thump(Math.min(1, v / 8)); lastThump = now; if (v > 4) api.buzz(12); }
      });
      api.score(0, 0); api.score(1, 0);
      newTurn();
    }).catch(() => { label.textContent = 'Physics failed to load'; });

    // ---- input ----
    const toWorldX = (e) => {
      const r = cv.getBoundingClientRect();
      const flipped = root.classList.contains('face1');
      return ((flipped ? r.right - e.clientX : e.clientX - r.left) / r.width) * WW;
    };
    let dragging = false;
    cv.addEventListener('pointerdown', (e) => { if (state !== 'aim' || !api.live) return; dragging = true; try { cv.setPointerCapture(e.pointerId); } catch { /* fine */ } moveAim(e); });
    cv.addEventListener('pointermove', (e) => { if (dragging) moveAim(e); });
    const stop = () => { dragging = false; };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
    function moveAim(e) { if (!aim) return; aim.x = Math.max(24, Math.min(WW - 24, toWorldX(e))); }
    turnBtn.addEventListener('click', () => { if (state !== 'aim' || !api.live) return; aim.angle += Math.PI / 4; api.sfx.turn(); });
    dropBtn.addEventListener('click', drop);

    function drop() {
      if (state !== 'aim' || !api.live || !aim) return;
      const { body, com } = makeBody(M, aim.a);
      M.Body.setPosition(body, { x: aim.x, y: aimY() });
      M.Body.setAngle(body, aim.angle);
      M.Composite.add(engine.world, body);
      const entry = { body, com, a: aim.a, by: turn, L: aim.L };
      placed.push(entry); byBody.set(body.id, entry);
      lastDropper = turn; aim = null; setAimLabel();
      state = 'settle'; dropAt = performance.now(); calmSince = 0;
      api.sfx.whoosh(); api.msg(turn, api.t('stack.steady'));
    }

    const aimY = () => cam + 74;

    function check(now) {
      // anything off the roof and falling = toppled
      for (const p of placed) {
        const b = p.body.position;
        if (b.y > platY + 110 || b.x < -80 || b.x > WW + 80) { toppled(p); return; }
      }
      if (state !== 'settle') return;
      const calm = placed.every((p) => p.body.isSleeping || (p.body.speed < 0.12 && p.body.angularSpeed < 0.01));
      if (calm) { if (!calmSince) calmSince = now; } else calmSince = 0;
      if ((calmSince && now - calmSince > 450 && now - dropAt > 800) || now - dropAt > 7000) {
        count[lastDropper]++; api.score(lastDropper, count[lastDropper]);
        state = 'next'; turn = 1 - turn; newTurn();
      }
    }

    function toppled(fallen) {
      if (state === 'over') return;
      state = 'over';
      if (fallen) api.sfx.voice(fallen.a.id);
      const loser = lastDropper ?? turn;
      api.sfx.crash(); api.shake(10); api.buzz([80, 40, 80]);
      api.callout(api.t('stack.fell'), null, '#ffcb1f');
      api.over(1 - loser, api.t('stack.note', { n: placed.length }));
    }

    // ---- drawing ----
    function scenery() {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#6cc4ef'); sky.addColorStop(0.6, '#bfe6f6'); sky.addColorStop(1, '#fff1c4');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      const par = (k) => -cam * s * k;
      ctx.fillStyle = '#fff4c2'; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.18 + par(0.05), W * 0.09, 0, 7); ctx.fill();
      // far Himalaya with snow caps
      const base = H * 0.62 + par(0.15);
      ctx.fillStyle = '#9fc3dc';
      ctx.beginPath(); ctx.moveTo(0, base);
      [[0.08, -0.16], [0.2, -0.05], [0.34, -0.26], [0.48, -0.09], [0.6, -0.2], [0.74, -0.04], [0.88, -0.22], [1, -0.08]].forEach(([x, y]) => ctx.lineTo(W * x, base + H * y));
      ctx.lineTo(W, base); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      [[0.34, -0.26], [0.6, -0.2], [0.88, -0.22], [0.08, -0.16]].forEach(([x, y]) => {
        const px = W * x; const py = base + H * y;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - W * 0.05, py + H * 0.05); ctx.lineTo(px - W * 0.015, py + H * 0.04); ctx.lineTo(px + W * 0.01, py + H * 0.055); ctx.lineTo(px + W * 0.045, py + H * 0.045); ctx.closePath(); ctx.fill();
      });
      // near green hills
      const hb = H * 0.8 + par(0.35);
      const hill = ctx.createLinearGradient(0, hb - H * 0.1, 0, H);
      hill.addColorStop(0, '#3aa063'); hill.addColorStop(1, '#17603a');
      ctx.fillStyle = hill; ctx.beginPath(); ctx.moveTo(0, hb);
      ctx.bezierCurveTo(W * 0.25, hb - H * 0.09, W * 0.45, hb + H * 0.02, W * 0.65, hb - H * 0.05);
      ctx.bezierCurveTo(W * 0.82, hb - H * 0.1, W * 0.95, hb - H * 0.02, W, hb - H * 0.04);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    }

    function tempo() {
      // the painted tempo whose roof is the stage (world units)
      const x0 = WW / 2 - 98; const y0 = platY;
      const body = ctx.createLinearGradient(0, y0 + 24, 0, y0 + 200);
      body.addColorStop(0, '#1f7a4c'); body.addColorStop(1, '#0c5a3b');
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(x0 - 8, y0 + 18, 212, 220, 18); ctx.fill();
      ctx.strokeStyle = '#141210'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x0, y0 + 26, 196, 200, 12); ctx.stroke();
      // windows
      ctx.fillStyle = '#bfe6f6'; ctx.strokeStyle = '#141210'; ctx.lineWidth = 2.5;
      [[x0 + 14, 82], [x0 + 104, 82]].forEach(([x, w]) => { ctx.beginPath(); ctx.roundRect(x, y0 + 38, w - 4, 36, 8); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#ffffff66'; ctx.beginPath(); ctx.roundRect(x0 + 20, y0 + 42, 22, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(x0 + 110, y0 + 42, 22, 8, 4); ctx.fill();
      // bumper band
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 8, y0 + 86, 212, 14); ctx.clip();
      ctx.fillStyle = '#ffcb1f'; ctx.fillRect(x0 - 8, y0 + 86, 212, 14);
      ctx.fillStyle = '#141210';
      for (let i = -2; i < 24; i++) { ctx.beginPath(); ctx.moveTo(x0 - 8 + i * 12, y0 + 86); ctx.lineTo(x0 - 2 + i * 12, y0 + 86); ctx.lineTo(x0 + 4 + i * 12, y0 + 100); ctx.lineTo(x0 - 2 + i * 12, y0 + 100); ctx.fill(); }
      ctx.restore();
      // roof (the stage)
      ctx.fillStyle = '#ffcb1f'; ctx.beginPath(); ctx.roundRect(WW / 2 - 98, platY, 196, 24, 8); ctx.fill();
      ctx.strokeStyle = '#141210'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#d41f16'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(WW / 2 - 92, platY + 5, 184, 14, 5); ctx.stroke();
    }

    function paintPlaced(p) {
      const an = tickLife(p.L, tS, fdt, p.body.speed);
      const sq = Math.max(-0.45, Math.min(0.45, p.L.sq));
      const breathe = Math.sin(an.t * 2.4) * 0.012;
      ctx.save();
      ctx.translate(p.body.position.x, p.body.position.y); ctx.rotate(p.body.angle);
      ctx.scale(1 + sq * 0.16, 1 - sq * 0.16 + breathe);
      ctx.translate(-p.com.x, -p.com.y);
      drawAnimal(ctx, p.a, an);
      ctx.restore();
    }

    function drawAim(now) {
      if (!aim || state !== 'aim') return;
      aim.shown = Math.min(1, aim.shown + 0.08);
      const y = aimY() + Math.sin(now / 320) * 2;
      // drop guide
      ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = '#14121055'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(aim.x, y + 30); ctx.lineTo(aim.x, stackTop() - 4); ctx.stroke(); ctx.restore();
      aim.da = (aim.da ?? aim.angle) + (aim.angle - (aim.da ?? aim.angle)) * 0.25;
      ctx.save(); ctx.globalAlpha = aim.shown;
      ctx.translate(aim.x, y); ctx.rotate(aim.da); ctx.scale(0.6 + 0.4 * aim.shown, 0.6 + 0.4 * aim.shown);
      const com = comOf(aim.a);
      ctx.translate(-com.x, -com.y);
      drawAnimal(ctx, aim.a, tickLife(aim.L, tS, fdt, dragging ? 3 : 0));
      ctx.restore();
    }
    const comCache = new Map();
    function comOf(a) {
      if (!comCache.has(a.id)) { const { com } = makeBody(M, a); comCache.set(a.id, com); }
      return comCache.get(a.id);
    }

    function render(now) {
      ctx.clearRect(0, 0, W, H);
      scenery();
      ctx.save(); ctx.scale(s, s); ctx.translate(0, -cam);
      tempo();
      for (const p of placed) paintPlaced(p);
      drawAim(now);
      ctx.restore();
      // height marker
      if (placed.length) {
        const hM = Math.max(0, (platY - stackTop()) / 100);
        ctx.fillStyle = '#141210cc'; ctx.beginPath(); ctx.roundRect(10, 10, 74, 28, 14); ctx.fill();
        ctx.fillStyle = '#ffcb1f'; ctx.font = '14px Bungee, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${api.num(hM.toFixed(1))} m`, 47, 25);
      }
    }

    function loop(now) {
      const dt = Math.min(50, Math.max(0, now - last)); last = now;
      tS = now / 1000; fdt = dt / 1000;
      if (engine && api.live && state !== 'over') {
        acc += dt;
        while (acc >= 1000 / 60) { M.Engine.update(engine, 1000 / 60); acc -= 1000 / 60; }
        check(now);
      }
      if (engine) {
        camTarget = Math.min(0, stackTop() - 230);
        cam += (camTarget - cam) * 0.06;
      }
      render(now);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return {
      destroy() { destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); timers.forEach(clearTimeout); if (engine) { M.World.clear(engine.world, false); M.Engine.clear(engine); } },
      resume() { last = performance.now(); acc = 0; },
    };
  },
};
