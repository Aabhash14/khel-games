// Reversi: place a coin so it traps a straight line of the other colour; every trapped coin flips.
// Dots show your legal moves. No move? You pass. Most coins at the end wins.
const N = 8;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export default {
  id: 'reversi',
  mount(root, api) {
    const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
    const wrap = el('div', 'surface'); const frame = el('div', 'rv'); const grid = el('div', 'rv-grid');
    frame.append(grid); wrap.append(frame); root.append(wrap);
    const b = Array.from({ length: N }, () => Array(N).fill(-1));
    b[3][3] = 1; b[4][4] = 1; b[3][4] = 0; b[4][3] = 0;
    const cells = []; const discs = Array.from({ length: N }, () => Array(N).fill(null));
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const btn = el('button', 'rv-cell'); btn.type = 'button';
      btn.setAttribute('aria-label', `${'ABCDEFGH'[c]}${r + 1}`);
      btn.addEventListener('click', () => play(r, c));
      grid.append(btn); cells.push(btn);
    }
    const cell = (r, c) => cells[r * N + c];
    function putDisc(r, c, p, pop) {
      const d = el('span', 'rdisc'); d.dataset.s = p;
      d.innerHTML = '<i class="f0"></i><i class="f1"></i>';
      if (pop) d.classList.add('pop');
      cell(r, c).append(d); discs[r][c] = d;
    }
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c] >= 0) putDisc(r, c, b[r][c], false);

    let turn = api.first; let busy = false; let over = false; let last = null;
    const timers = [];
    const wait = (ms) => new Promise((res) => timers.push(setTimeout(res, ms)));

    const size = () => {
      const s = Math.floor(Math.min(root.clientWidth - 30, root.clientHeight - 30) / N) - 3;
      grid.style.gridTemplateColumns = `repeat(${N}, ${Math.max(28, s)}px)`;
    };
    const ro = new ResizeObserver(size); ro.observe(root); size();

    function flipsFor(r, c, p) {
      if (b[r][c] !== -1) return [];
      const out = [];
      for (const [dr, dc] of DIRS) {
        const line = []; let rr = r + dr; let cc = c + dc;
        while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr][cc] === 1 - p) { line.push([rr, cc]); rr += dr; cc += dc; }
        if (line.length && rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr][cc] === p) out.push(...line);
      }
      return out;
    }
    function moves(p) {
      const m = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const f = flipsFor(r, c, p); if (f.length) m.push([r, c, f]); }
      return m;
    }
    const counts = () => { let a = 0; let z = 0; b.forEach((row) => row.forEach((v) => { if (v === 0) a++; if (v === 1) z++; })); return [a, z]; };

    function setTurn() {
      const [a, z] = counts(); api.score(0, a); api.score(1, z);
      api.turn(turn); api.msg(turn, api.t('yourTurn')); api.msg(1 - turn, api.t('waiting'));
      const legal = new Set(moves(turn).map(([r, c]) => r * N + c));
      cells.forEach((btn, i) => { btn.classList.toggle('hint', legal.has(i)); btn.dataset.p = turn; btn.classList.toggle('last', last === i); });
    }

    async function play(r, c) {
      if (busy || over || !api.live) return;
      const f = flipsFor(r, c, turn);
      if (!f.length) { if (b[r][c] === -1) { api.sfx.bad(); cell(r, c).animate([{ translate: '0 0' }, { translate: '3px 0' }, { translate: '-3px 0' }, { translate: '0 0' }], { duration: 180 }); } return; }
      busy = true;
      const p = turn;
      cells.forEach((btn) => btn.classList.remove('hint'));
      b[r][c] = p; putDisc(r, c, p, true); last = r * N + c;
      api.sfx.coin(); api.buzz(10);
      f.sort((x, y) => Math.max(Math.abs(x[0] - r), Math.abs(x[1] - c)) - Math.max(Math.abs(y[0] - r), Math.abs(y[1] - c)));
      await wait(160);
      for (let k = 0; k < f.length; k++) {
        const [rr, cc] = f[k];
        b[rr][cc] = p; discs[rr][cc].dataset.s = p;
        api.sfx.disc(k);
        await wait(70);
      }
      if (f.length >= 5) { api.callout(`+${api.num(f.length)}`, p, '#ffcb1f'); api.sfx.good(); }
      await wait(320);
      const other = 1 - p;
      if (moves(other).length) turn = other;
      else if (moves(p).length) {
        api.callout(api.t('reversi.pass', { name: api.names[other] }), null, '#fffaf0'); api.sfx.pass();
        turn = p;
      } else {
        over = true; setTurn();
        const [a, z] = counts();
        api.over(a === z ? null : a > z ? 0 : 1, `${api.num(a)} – ${api.num(z)}`);
        return;
      }
      busy = false;
      setTurn();
    }

    setTurn();
    return { destroy() { over = true; ro.disconnect(); timers.forEach(clearTimeout); } };
  },
};
