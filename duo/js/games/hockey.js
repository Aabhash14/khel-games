// Air Hockey: each player drags a paddle in their own half. First to 7.
const RW = 1; const RH = 1.8; const PR = 0.05; const MR = 0.085; const GOAL = 0.19; const WIN = 7;

export default {
  id: 'hockey',
  mount(root, api) {
    const cv = document.createElement('canvas'); cv.className = 'cv'; root.append(cv);
    const ctx = cv.getContext('2d');
    let W = 0; let H = 0; let s = 100; let ox = 0; let oy = 0;
    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = root.clientWidth; H = root.clientHeight;
      cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      s = Math.min((W - 12) / RW, (H - 12) / RH); ox = (W - RW * s) / 2; oy = (H - RH * s) / 2;
    };
    const ro = new ResizeObserver(resize); ro.observe(root); resize();

    const puck = { x: 0.5, y: api.first === 0 ? RH * 0.7 : RH * 0.3, vx: 0, vy: 0 };
    const mal = [{ x: 0.5, y: RH - 0.2, tx: 0.5, ty: RH - 0.2, vx: 0, vy: 0 }, { x: 0.5, y: 0.2, tx: 0.5, ty: 0.2, vx: 0, vy: 0 }];
    const score = [0, 0];
    const owners = new Map();
    let freeze = 0; let raf = 0; let last = performance.now(); let lastHit = 0;
    const trail = [];
    api.score(0, 0); api.score(1, 0); api.turn(null);
    api.msg(null, `${api.t('hockey.r3')}`);

    const toRink = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s]; };
    const clampM = (p, x, y) => [Math.min(RW - MR, Math.max(MR, x)), p === 0 ? Math.min(RH - MR, Math.max(RH / 2 + MR, y)) : Math.min(RH / 2 - MR, Math.max(MR, y))];
    cv.addEventListener('pointerdown', (e) => {
      const [x, y] = toRink(e); const p = y > RH / 2 ? 0 : 1;
      owners.set(e.pointerId, p); try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic or lost pointer */ }
      const [cx, cy] = clampM(p, x, y - (p === 0 ? 0.06 : -0.06)); mal[p].tx = cx; mal[p].ty = cy;
    });
    cv.addEventListener('pointermove', (e) => {
      const p = owners.get(e.pointerId); if (p == null) return;
      const [x, y] = toRink(e);
      // Paddle sits a little ahead of the finger so the thumb doesn't hide it.
      const [cx, cy] = clampM(p, x, y - (p === 0 ? 0.06 : -0.06)); mal[p].tx = cx; mal[p].ty = cy;
    });
    const up = (e) => owners.delete(e.pointerId);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    function step(dt) {
      if (dt <= 0) return;
      for (const m of mal) {
        const dx = m.tx - m.x; const dy = m.ty - m.y;
        const max = 14 * dt; const d = Math.hypot(dx, dy);
        const k = d > max ? max / d : 1;
        m.vx = (dx * k) / dt; m.vy = (dy * k) / dt;
        m.x += dx * k; m.y += dy * k;
      }
      if (freeze > 0) return;
      puck.x += puck.vx * dt; puck.y += puck.vy * dt;
      const f = Math.pow(0.7, dt); puck.vx *= f; puck.vy *= f;
      if (puck.x < PR) { puck.x = PR; puck.vx = Math.abs(puck.vx) * 0.9; wall(); }
      if (puck.x > RW - PR) { puck.x = RW - PR; puck.vx = -Math.abs(puck.vx) * 0.9; wall(); }
      const inMouth = Math.abs(puck.x - 0.5) < GOAL - PR * 0.3;
      if (!inMouth) {
        if (puck.y < PR) { puck.y = PR; puck.vy = Math.abs(puck.vy) * 0.9; wall(); }
        if (puck.y > RH - PR) { puck.y = RH - PR; puck.vy = -Math.abs(puck.vy) * 0.9; wall(); }
      } else if (puck.y < -PR) { goal(0); return; } else if (puck.y > RH + PR) { goal(1); return; }
      mal.forEach((m) => {
        const dx = puck.x - m.x; const dy = puck.y - m.y; const d = Math.hypot(dx, dy);
        if (d >= PR + MR || d === 0) return;
        const nx = dx / d; const ny = dy / d;
        puck.x = m.x + nx * (PR + MR); puck.y = m.y + ny * (PR + MR);
        const rvx = puck.vx - m.vx; const rvy = puck.vy - m.vy; const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
          puck.vx -= 1.9 * vn * nx; puck.vy -= 1.9 * vn * ny;
          const now = performance.now();
          if (now - lastHit > 60) { const v = Math.min(1, -vn / 5); api.sfx.puck(v); if (v > 0.5) api.buzz(15); lastHit = now; }
        }
      });
      const sp = Math.hypot(puck.vx, puck.vy);
      if (sp > 7) { puck.vx *= 7 / sp; puck.vy *= 7 / sp; }
    }
    function wall() { const now = performance.now(); if (now - lastHit > 50) { api.sfx.wall(Math.min(1, Math.hypot(puck.vx, puck.vy) / 5)); lastHit = now; } }
    function goal(p) {
      score[p]++; api.score(p, score[p]);
      api.sfx.goal(); api.shake(10); api.buzz([60, 40, 60]);
      api.callout(api.t('hockey.goal'), null, p ? '#fffaf0' : '#ffcb1f');
      api.burst(ox + puck.x * s, oy + (p === 0 ? 0 : RH * s), p ? '#1f52d4' : '#d41f16', 40);
      if (score[p] >= WIN) { puck.vx = puck.vy = 0; puck.y = -10; api.over(p, `${api.num(score[0])} – ${api.num(score[1])}`); return; }
      const loser = 1 - p;
      puck.x = 0.5; puck.y = loser === 0 ? RH * 0.72 : RH * 0.28; puck.vx = puck.vy = 0;
      freeze = 0.9;
    }

    const X = (x) => ox + x * s; const Y = (y) => oy + y * s;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#141210'; ctx.beginPath(); ctx.roundRect(X(0) - 6, Y(0) - 6, RW * s + 12, RH * s + 12, 26); ctx.fill();
      const g = ctx.createLinearGradient(X(0), Y(0), X(RW), Y(RH)); g.addColorStop(0, '#ffd23f'); g.addColorStop(1, '#ffc414');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(X(0), Y(0), RW * s, RH * s, 20); ctx.fill();
      ctx.strokeStyle = '#d41f16'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(X(0) + 7, Y(0) + 7, RW * s - 14, RH * s - 14, 15); ctx.stroke();
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(X(0) + 11, Y(0) + 11, RW * s - 22, RH * s - 22, 12); ctx.stroke();
      ctx.strokeStyle = '#d41f16'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(0), Y(RH / 2)); ctx.lineTo(X(RW), Y(RH / 2)); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(0.5), Y(RH / 2), 0.16 * s, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#14121088'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(0.5), Y(0), 0.26 * s, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(0.5), Y(RH), 0.26 * s, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#141210';
      ctx.fillRect(X(0.5 - GOAL), Y(0) - 6, GOAL * 2 * s, 9); ctx.fillRect(X(0.5 - GOAL), Y(RH) - 3, GOAL * 2 * s, 9);
      trail.forEach((p, i) => { ctx.fillStyle = `rgba(28,35,48,${(i / trail.length) * 0.18})`; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), PR * s, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.arc(X(puck.x) + 2, Y(puck.y) + 3, PR * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#141210'; ctx.beginPath(); ctx.arc(X(puck.x), Y(puck.y), PR * s, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X(puck.x), Y(puck.y), PR * s * 0.6, 0, 7); ctx.stroke();
      mal.forEach((m, i) => {
        const c = i ? ['#1f52d4', '#133a9e'] : ['#d41f16', '#9b130c'];
        ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.arc(X(m.x) + 3, Y(m.y) + 4, MR * s, 0, 7); ctx.fill();
        ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), MR * s, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), MR * s * 0.75, 0, 7); ctx.stroke();
        ctx.fillStyle = c[1]; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), MR * s * 0.42, 0, 7); ctx.fill();
      });
    }

    function loop(now) {
      const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
      if (api.live) {
        if (freeze > 0) freeze -= dt;
        const n = 6; for (let i = 0; i < n; i++) step(dt / n);
        trail.push([puck.x, puck.y]); if (trail.length > 8) trail.shift();
      }
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return {
      destroy() { cancelAnimationFrame(raf); ro.disconnect(); },
      resume() { last = performance.now(); },
    };
  },
};
