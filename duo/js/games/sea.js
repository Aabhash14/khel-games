// Sea Battle: hide 5 boats while the other looks away, then take turns firing. Hit = fire again.
const N = 8; const FLEET = [4, 3, 3, 2, 2];

function emptyGrid(v) { return Array.from({ length: N }, () => Array(N).fill(v)); }

function fits(occ, cells, skip = -1) {
  return cells.every(([r, c]) => {
    if (r < 0 || c < 0 || r >= N || c >= N) return false;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr; const cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < N && cc < N && occ[rr][cc] !== -1 && occ[rr][cc] !== skip) return false;
    }
    return true;
  });
}
const shape = (r, c, len, vert) => Array.from({ length: len }, (_, i) => (vert ? [r + i, c] : [r, c + i]));

function randomFleet() {
  for (;;) {
    const occ = emptyGrid(-1); const ships = []; let ok = true;
    for (const [i, len] of FLEET.entries()) {
      let placed = false;
      for (let tries = 0; tries < 200 && !placed; tries++) {
        const vert = Math.random() < 0.5;
        const cells = shape(Math.floor(Math.random() * N), Math.floor(Math.random() * N), len, vert);
        if (fits(occ, cells)) { cells.forEach(([r, c]) => { occ[r][c] = i; }); ships.push({ cells, vert, hits: 0 }); placed = true; }
      }
      if (!placed) { ok = false; break; }
    }
    if (ok) return { occ, ships };
  }
}

export default {
  id: 'sea',
  mount(root, api) {
    const fleets = [randomFleet(), randomFleet()];
    const shots = [emptyGrid(0), emptyGrid(0)]; // shots fired AT player p's sea: 1 miss, 2 hit
    const sunkCount = [0, 0];
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let shooter = api.first; let lock = false;
    const A = api.first; const B = 1 - A;

    const wrap = document.createElement('div'); wrap.className = 'surface';
    root.append(wrap);
    let cell = 30;
    const measure = () => { cell = Math.floor(Math.min((root.clientWidth - 30 - 2 * (N - 1)) / N, (root.clientHeight - 170 - 2 * (N - 1)) / N)); wrap.querySelectorAll('.sea-grid').forEach((g) => { g.style.gridTemplateColumns = `repeat(${N}, ${cell}px)`; }); };
    const ro = new ResizeObserver(measure); ro.observe(root);

    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const button = (label, cls, fn) => { const b = el('button', 'btn ' + cls, label); b.type = 'button'; b.addEventListener('click', () => { api.sfx.tap(); fn(); }); return b; };

    function makeGrid(onCell) {
      const g = el('div', 'sea-grid');
      g.style.gridTemplateColumns = `repeat(${N}, ${cell}px)`;
      const cells = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const b = el('button', 'cell'); b.type = 'button';
        b.setAttribute('aria-label', `${'ABCDEFGH'[c]}${r + 1}`);
        b.addEventListener('click', () => onCell(r, c));
        g.append(b); cells.push(b);
      }
      return { g, at: (r, c) => cells[r * N + c] };
    }

    // ---- hiding phase ----
    function cover(p) {
      api.face(p); api.turn(p);
      api.msg(p, api.t('sea.hide', { name: api.names[p] }));
      api.msg(1 - p, api.t('sea.away', { name: api.names[1 - p] }));
      wrap.innerHTML = '';
      const box = el('div', 'sea');
      box.append(el('h2', '', ''));
      box.firstChild.style.cssText = 'margin:0;font-size:34px;line-height:1.15;font-weight:400;text-align:center';
      box.firstChild.textContent = api.t('sea.away', { name: api.names[1 - p] });
      box.append(el('p', 'tip', api.t('sea.hide', { name: api.names[p] })));
      const b = button(api.t('sea.imReady'), 'pc', () => hide(p));
      b.dataset.p = p; box.append(b);
      wrap.append(box);
    }

    function hide(p) {
      wrap.innerHTML = '';
      const box = el('div', 'sea');
      const fl = fleets[p];
      const { g, at } = makeGrid((r, c) => {
        const i = fl.occ[r][c]; if (i === -1) return;
        const s = fl.ships[i]; const [r0, c0] = s.cells[0];
        const cells = shape(r0, c0, s.cells.length, !s.vert);
        if (!fits(fl.occ, cells, i)) { api.sfx.bad(); api.shake(3); return; }
        s.cells.forEach(([rr, cc]) => { fl.occ[rr][cc] = -1; });
        cells.forEach(([rr, cc]) => { fl.occ[rr][cc] = i; });
        s.cells = cells; s.vert = !s.vert; api.sfx.turn(); paint();
      });
      const paint = () => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) at(r, c).classList.toggle('ship', fl.occ[r][c] !== -1); };
      paint();
      box.append(el('p', 'tip', api.t('sea.rotate')), g);
      const row = el('div', ''); row.style.cssText = 'display:flex;gap:10px';
      row.append(button(api.t('sea.shuffle'), 'ghost', () => { fleets[p] = randomFleet(); hide(p); }));
      const done = button(api.t('sea.ready'), 'pc', () => { if (p === A) cover(B); else battle(); });
      done.dataset.p = p; row.append(done);
      box.append(row);
      wrap.append(box);
    }

    // ---- battle phase ----
    let view = null;
    function battle() {
      api.score(0, 0); api.score(1, 0);
      showFor(shooter);
    }

    function showFor(p) {
      const target = 1 - p;
      api.face(p); api.turn(p);
      api.msg(p, api.t('yourTurn')); api.msg(target, api.t('waiting'));
      wrap.innerHTML = '';
      const box = el('div', 'sea');
      const { g, at } = makeGrid((r, c) => fire(p, r, c));
      const fleetRow = el('div', 'fleet');
      box.append(el('p', 'tip', api.t('sea.fire')), g, fleetRow);
      wrap.append(box);
      view = { at, fleetRow, target };
      paintTarget();
      lock = false;
    }

    function paintTarget() {
      const { at, fleetRow, target } = view;
      const fl = fleets[target];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const b = at(r, c); const s = shots[target][r][c];
        b.className = 'cell' + (s === 1 ? ' miss' : s === 2 ? ' hit' : '');
        const i = fl.occ[r][c];
        if (s === 2 && fl.ships[i].hits === fl.ships[i].cells.length) b.classList.add('sunk');
      }
      fleetRow.innerHTML = '';
      fleetRow.append(el('b', '', api.t('sea.theirs') + ':'));
      fl.ships.forEach((s) => {
        const sp = el('span', s.hits === s.cells.length ? 'gone' : '');
        s.cells.forEach(() => sp.append(el('i')));
        fleetRow.append(sp);
      });
    }

    function fire(p, r, c) {
      if (lock || !api.live || p !== shooter) return;
      const target = 1 - p;
      if (shots[target][r][c]) return;
      lock = true;
      const fl = fleets[target]; const i = fl.occ[r][c];
      const b = view.at(r, c);
      if (i === -1) {
        shots[target][r][c] = 1; paintTarget(); view.at(r, c).classList.add('boom');
        api.sfx.splash(); api.callout(api.t('sea.miss'), p, '#fffaf0');
        later(() => { shooter = target; showFor(shooter); }, 1300);
        return;
      }
      shots[target][r][c] = 2; fl.ships[i].hits++;
      const sunk = fl.ships[i].hits === fl.ships[i].cells.length;
      paintTarget(); view.at(r, c).classList.add('boom');
      const rc = b.getBoundingClientRect(); api.burst(rc.x + rc.width / 2, rc.y + rc.height / 2, '#ffcb1f', 22);
      api.sfx.boom(); api.shake(sunk ? 10 : 5); api.buzz(sunk ? [40, 40, 80] : 50);
      if (sunk) {
        sunkCount[p]++; api.score(p, sunkCount[p]);
        api.callout(api.t('sea.sunk', { n: fl.ships[i].cells.length }), p, '#ffcb1f');
        if (sunkCount[p] === FLEET.length) { api.over(p); return; }
      } else api.callout(api.t('sea.hit'), p, '#ff4f9a');
      later(() => { lock = false; }, 500);
    }

    measure();
    cover(A);
    return { destroy() { ro.disconnect(); timers.forEach(clearTimeout); } };
  },
};
