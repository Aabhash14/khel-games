// Pool (8-ball, simplified). Drag back from the white ball, let go to shoot.
// Table space: felt is 1 wide, 2 tall; y grows towards the bottom player.
const R = 0.036;
const POCKETS = [[0, 0, 0.078], [1, 0, 0.078], [0, 1, 0.066], [1, 1, 0.066], [0, 2, 0.078], [1, 2, 0.078]];
const COLORS = { red: '#d41f16', yellow: '#ffcb1f', black: '#141414', cue: '#fbf6ea' };
const HEAD = [0.5, 1.5];

export default {
  id: 'pool',
  mount(root, api) {
    const cv = document.createElement('canvas'); cv.className = 'cv'; root.append(cv);
    const ctx = cv.getContext('2d');
    let W = 0; let H = 0; let s = 100; let ox = 0; let oy = 0; let rail = 20;
    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = root.clientWidth; H = root.clientHeight;
      cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      s = Math.min((W - 8) / 1.12, (H - 8) / 2.12);
      rail = s * 0.06; ox = (W - s) / 2; oy = (H - 2 * s) / 2;
    };
    const ro = new ResizeObserver(resize); ro.observe(root); resize();

    // ---- balls ----
    const balls = [];
    const add = (x, y, kind) => { const b = { x, y, vx: 0, vy: 0, kind, on: true }; balls.push(b); return b; };
    const cue = add(...HEAD, 'cue');
    (() => {
      const kinds = [];
      for (let i = 0; i < 7; i++) kinds.push('red', 'yellow');
      for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
      const spots = [];
      for (let row = 0; row < 5; row++) for (let j = 0; j <= row; j++) spots.push([row, j]);
      const blackIdx = spots.findIndex(([r, j]) => r === 2 && j === 1);
      // back corners get one of each colour
      const c1 = spots.findIndex(([r, j]) => r === 4 && j === 0); const c2 = spots.findIndex(([r, j]) => r === 4 && j === 4);
      const plan = Array(15).fill(null); plan[blackIdx] = 'black'; plan[c1] = 'red'; plan[c2] = 'yellow';
      kinds.splice(kinds.indexOf('red'), 1); kinds.splice(kinds.indexOf('yellow'), 1);
      for (let i = 0; i < 15; i++) if (!plan[i]) plan[i] = kinds.pop();
      spots.forEach(([row, j], i) => add(0.5 + (j - row / 2) * 2 * R * 1.02, 0.55 - row * R * Math.sqrt(3) * 1.02, plan[i]));
    })();

    let turn = api.first;
    const group = [null, null];
    let moving = false; let handBall = false; let shot = null;
    let aim = null; // {mode:'aim'|'move', fx, fy}
    const sinking = [];
    let raf = 0; let last = performance.now(); let lastSound = 0;
    const timers = [];

    const left = (g) => balls.filter((b) => b.on && b.kind === g).length;
    const onBlack = (p) => group[p] && left(group[p]) === 0;
    const gName = (g) => api.t(g === 'red' ? 'pool.reds' : 'pool.yellows');
    function hud() {
      [0, 1].forEach((p) => {
        api.score(p, group[p] ? (onBlack(p) ? '8' : left(group[p])) : '');
        const head = group[p] ? `${gName(group[p])} · ${onBlack(p) ? api.t('pool.onBlack') : api.t('pool.left', { n: left(group[p]) })}` : api.t('pool.open');
        api.msg(p, p === turn && handBall ? api.t('pool.hand') : head);
      });
      api.turn(turn);
    }
    hud();

    // ---- input ----
    const toTable = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s]; };
    const canShoot = () => !moving && api.live;
    cv.addEventListener('pointerdown', (e) => {
      if (!canShoot()) return;
      try { cv.setPointerCapture(e.pointerId); } catch { /* synthetic or lost pointer */ }
      const [x, y] = toTable(e);
      if (handBall && Math.hypot(x - cue.x, y - cue.y) < R * 5) aim = { mode: 'move', fx: x, fy: y };
      else aim = { mode: 'aim', fx: x, fy: y };
    });
    cv.addEventListener('pointermove', (e) => {
      if (!aim) return;
      const [x, y] = toTable(e);
      aim.fx = x; aim.fy = y;
      if (aim.mode === 'move') {
        const nx = Math.min(1 - R, Math.max(R, x)); const ny = Math.min(2 - R, Math.max(R, y));
        const clearOfPockets = POCKETS.every(([px, py, pr]) => Math.hypot(nx - px, ny - py) > pr + R * 1.5);
        if (clearOfPockets && balls.every((b) => b === cue || !b.on || Math.hypot(b.x - nx, b.y - ny) > 2 * R)) { cue.x = nx; cue.y = ny; }
      }
    });
    const release = () => {
      if (!aim) return;
      const a = aim; aim = null;
      if (a.mode !== 'aim' || !canShoot()) return;
      const { dir, power } = aimInfo(a);
      if (power < 0.04) return;
      const sp = 0.35 + power * 4.4;
      cue.vx = dir[0] * sp; cue.vy = dir[1] * sp;
      moving = true; shot = { first: null, potted: [], cue: false, wasOnBlack: onBlack(turn) };
      handBall = false; api.sfx.cue(); api.buzz(12); hud();
    };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', () => { aim = null; });

    function aimInfo(a) {
      const dx = cue.x - a.fx; const dy = cue.y - a.fy;
      const d = Math.hypot(dx, dy) || 1e-6;
      return { dir: [dx / d, dy / d], power: Math.min(1, Math.max(0, (d - 0.06) / 0.5)) };
    }

    // ---- physics ----
    function step(dt) {
      for (const b of balls) {
        if (!b.on) continue;
        b.x += b.vx * dt; b.y += b.vy * dt;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 0) {
          const ns = Math.max(0, sp - (0.32 + sp * 0.5) * dt);
          b.vx *= ns / sp; b.vy *= ns / sp;
        }
        for (const [px, py, pr] of POCKETS) {
          if (Math.hypot(b.x - px, b.y - py) < pr) { pot(b, px, py); break; }
        }
        if (!b.on) continue;
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * 0.78; bump(sp); }
        if (b.x > 1 - R) { b.x = 1 - R; b.vx = -Math.abs(b.vx) * 0.78; bump(sp); }
        if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * 0.78; bump(sp); }
        if (b.y > 2 - R) { b.y = 2 - R; b.vy = -Math.abs(b.vy) * 0.78; bump(sp); }
      }
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i]; if (!a.on) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j]; if (!b.on) continue;
          const dx = b.x - a.x; const dy = b.y - a.y; const d = Math.hypot(dx, dy);
          if (d >= 2 * R || d === 0) continue;
          const nx = dx / d; const ny = dy / d; const ov = (2 * R - d) / 2;
          a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel <= 0) continue;
          const imp = rel * 0.97;
          a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny;
          if (shot && !shot.first) { if (a === cue) shot.first = b.kind; else if (b === cue) shot.first = a.kind; }
          const now = performance.now();
          if (now - lastSound > 30) { api.sfx.clack(Math.min(1, rel / 3)); lastSound = now; }
        }
      }
    }
    function bump(sp) { const now = performance.now(); if (sp > 0.3 && now - lastSound > 40) { api.sfx.rail(Math.min(1, sp / 3)); lastSound = now; } }
    function pot(b, px, py) {
      b.on = false; sinking.push({ x: b.x, y: b.y, px, py, kind: b.kind, t: 0 });
      b.vx = b.vy = 0;
      api.sfx.pocket(); api.buzz(25);
      if (shot) { if (b.kind === 'cue') shot.cue = true; else shot.potted.push(b.kind); }
    }

    function settle() {
      moving = false;
      const p = turn; const o = 1 - p; const sh = shot; shot = null;
      if (sh.potted.includes('black')) {
        const legal = sh.wasOnBlack && !sh.cue;
        const note = api.t(legal ? 'pool.blackWin' : sh.cue ? 'pool.blackFoul' : 'pool.blackEarly');
        api.callout(note, null, '#ffcb1f');
        api.over(legal ? p : o, note); draw(); return;
      }
      let foul = null;
      const mine = group[p];
      if (sh.cue) foul = 'pool.scratch';
      else if (!sh.first) foul = 'pool.noHit';
      else if (sh.wasOnBlack ? sh.first !== 'black' : (sh.first === 'black' || (mine && sh.first !== mine))) foul = 'pool.wrongFirst';
      if (!mine && !foul) {
        const col = sh.potted.find((k) => k === 'red' || k === 'yellow');
        if (col) { group[p] = col; group[o] = col === 'red' ? 'yellow' : 'red'; }
      }
      if (sh.cue) {
        cue.on = true; cue.vx = cue.vy = 0; cue.x = HEAD[0]; cue.y = HEAD[1];
        for (let k = 0; k < 40 && balls.some((b) => b !== cue && b.on && Math.hypot(b.x - cue.x, b.y - cue.y) < 2 * R); k++) cue.x = R + Math.random() * (1 - 2 * R);
      }
      if (foul) {
        turn = o; handBall = true;
        api.callout(api.t('pool.foul'), null, '#ff4f9a'); api.msg(p, api.t(foul)); api.sfx.bad();
        timers.push(setTimeout(hud, 1200));
      } else {
        const keep = sh.potted.some((k) => k === group[p]);
        if (!keep) turn = o;
        hud();
      }
    }

    // ---- drawing ----
    const X = (x) => ox + x * s; const Y = (y) => oy + y * s;
    function ball(x, y, kind, scale = 1) {
      const r = R * s * scale;
      ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.arc(x + r * 0.15, y + r * 0.25, r, 0, 7); ctx.fill();
      ctx.fillStyle = COLORS[kind]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      if (kind === 'black') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, 7); ctx.fill(); ctx.fillStyle = '#141414'; ctx.font = `800 ${r * 0.7}px Bungee, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('8', x, y + r * 0.05); }
      ctx.fillStyle = '#ffffff70'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, 7); ctx.fill();
    }
    function table() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#141210'; ctx.beginPath(); ctx.roundRect(X(0) - rail, Y(0) - rail, s + 2 * rail, 2 * s + 2 * rail, rail * 0.8); ctx.fill();
      ctx.strokeStyle = '#00000040'; ctx.lineWidth = 2; ctx.stroke();
      const g = ctx.createRadialGradient(X(0.5), Y(1), s * 0.2, X(0.5), Y(1), s * 1.2); g.addColorStop(0, '#1d7f5a'); g.addColorStop(1, '#0f4d37');
      ctx.fillStyle = g; ctx.fillRect(X(0), Y(0), s, 2 * s);
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2; ctx.strokeRect(X(0) - rail * 0.45, Y(0) - rail * 0.45, s + rail * 0.9, 2 * s + rail * 0.9);
      ctx.fillStyle = '#ffcb1f';
      [0.25, 0.5, 0.75].forEach((f) => { [[f, -0.03], [f, 2.03]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(X(x), Y(y), 2.2, 0, 7); ctx.fill(); }); });
      [0.25, 0.5, 0.75, 1.25, 1.5, 1.75].forEach((f) => { [[-0.03, f], [1.03, f]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(X(x), Y(y), 2.2, 0, 7); ctx.fill(); }); });
      ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(0), Y(1.5)); ctx.lineTo(X(1), Y(1.5)); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(0.5), Y(0.55), 2.5, 0, 7); ctx.fillStyle = '#ffffff33'; ctx.fill();
      for (const [px, py, pr] of POCKETS) { ctx.fillStyle = '#0b0705'; ctx.beginPath(); ctx.arc(X(px), Y(py), pr * s * 0.8, 0, 7); ctx.fill(); }
    }
    function guide() {
      if (!aim || aim.mode !== 'aim' || moving) return;
      const { dir, power } = aimInfo(aim);
      // ray vs balls
      let best = Infinity; let hit = null;
      for (const b of balls) {
        if (b === cue || !b.on) continue;
        const fx = b.x - cue.x; const fy = b.y - cue.y;
        const tca = fx * dir[0] + fy * dir[1]; if (tca < 0) continue;
        const d2 = fx * fx + fy * fy - tca * tca; const rr = 4 * R * R; if (d2 > rr) continue;
        const tt = tca - Math.sqrt(rr - d2); if (tt < best) { best = tt; hit = b; }
      }
      let tw = Infinity;
      if (dir[0] > 0) tw = Math.min(tw, (1 - R - cue.x) / dir[0]); if (dir[0] < 0) tw = Math.min(tw, (R - cue.x) / dir[0]);
      if (dir[1] > 0) tw = Math.min(tw, (2 - R - cue.y) / dir[1]); if (dir[1] < 0) tw = Math.min(tw, (R - cue.y) / dir[1]);
      const tEnd = Math.min(best, tw);
      const gx = cue.x + dir[0] * tEnd; const gy = cue.y + dir[1] * tEnd;
      ctx.setLineDash([5, 6]); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(cue.x), Y(cue.y)); ctx.lineTo(X(gx), Y(gy)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(X(gx), Y(gy), R * s, 0, 7); ctx.stroke();
      if (hit && best <= tw) {
        const nx = hit.x - gx; const ny = hit.y - gy; const d = Math.hypot(nx, ny);
        ctx.strokeStyle = COLORS[hit.kind] === COLORS.black ? '#fff' : COLORS[hit.kind]; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(X(hit.x), Y(hit.y)); ctx.lineTo(X(hit.x + (nx / d) * 0.22), Y(hit.y + (ny / d) * 0.22)); ctx.stroke();
      }
      // cue stick behind the ball
      const back = R * 1.6 + power * 0.22;
      const sx = cue.x - dir[0] * back; const sy = cue.y - dir[1] * back;
      const ex = sx - dir[0] * 0.95; const ey = sy - dir[1] * 0.95;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#3a2412'; ctx.lineWidth = R * s * 0.75; ctx.beginPath(); ctx.moveTo(X(sx), Y(sy)); ctx.lineTo(X(ex), Y(ey)); ctx.stroke();
      ctx.strokeStyle = '#e9d3a0'; ctx.lineWidth = R * s * 0.55; ctx.beginPath(); ctx.moveTo(X(sx), Y(sy)); ctx.lineTo(X(sx - dir[0] * 0.6), Y(sy - dir[1] * 0.6)); ctx.stroke();
      ctx.strokeStyle = '#7fb6e6'; ctx.beginPath(); ctx.moveTo(X(sx), Y(sy)); ctx.lineTo(X(sx - dir[0] * 0.02), Y(sy - dir[1] * 0.02)); ctx.stroke();
      ctx.lineCap = 'butt';
      // power meter
      const p = turn ? -1 : 1; const mx = W - 14; const my0 = H / 2 + p * 20; const len = H * 0.3;
      ctx.fillStyle = '#0006'; ctx.fillRect(mx - 5, Math.min(my0, my0 + p * len), 10, len);
      ctx.fillStyle = power > 0.8 ? '#d41f16' : '#ffcb1f'; ctx.fillRect(mx - 5, Math.min(my0, my0 + p * len * power), 10, len * power);
    }
    function draw() {
      table();
      for (const sk of sinking) { const k = 1 - sk.t; ball(X(sk.x + (sk.px - sk.x) * sk.t), Y(sk.y + (sk.py - sk.y) * sk.t), sk.kind, Math.max(0.05, k)); }
      for (const b of balls) if (b.on) ball(X(b.x), Y(b.y), b.kind);
      if (handBall && !moving) { ctx.strokeStyle = '#ffcb1f'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(cue.x), Y(cue.y), R * s * 1.8, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      guide();
    }

    function loop(now) {
      const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
      if (api.live && moving) {
        const n = 10; for (let i = 0; i < n; i++) step(dt / n);
        if (balls.every((b) => !b.on || Math.hypot(b.vx, b.vy) < 0.01)) { balls.forEach((b) => { b.vx = b.vy = 0; }); settle(); }
      }
      for (const sk of sinking) sk.t = Math.min(1, sk.t + dt * 4);
      for (let i = sinking.length - 1; i >= 0; i--) if (sinking[i].t >= 1) sinking.splice(i, 1);
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return {
      destroy() { cancelAnimationFrame(raf); ro.disconnect(); timers.forEach(clearTimeout); },
      resume() { last = performance.now(); },
    };
  },
};
