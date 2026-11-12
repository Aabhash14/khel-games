// Four in a Row, laid sideways: coins slide in from the left and stack against the gold right edge,
// so neither player reads the board upside down.
const COLS = 10; const H = 10; // logical columns (screen rows) and stack height (screen columns)

export default {
  id: 'four',
  mount(root, api) {
    const board = Array.from({ length: COLS }, () => []);
    let turn = api.first; let lock = false; let moves = 0;
    const discs = [];
    const timers = [];

    const wrap = document.createElement('div'); wrap.className = 'surface';
    const box = document.createElement('div'); box.className = 'four';
    const grid = document.createElement('div'); grid.className = 'four-grid';
    const gutter = document.createElement('span'); gutter.className = 'gutter';
    box.append(grid, gutter); wrap.append(box); root.append(wrap);

    const rows = [];
    for (let c = 0; c < COLS; c++) {
      const r = document.createElement('button');
      r.type = 'button'; r.className = 'four-row';
      r.setAttribute('aria-label', `${c + 1}`);
      const holes = [];
      for (let k = 0; k < H; k++) { const h = document.createElement('span'); h.className = 'hole'; r.append(h); holes.push(h); }
      r.addEventListener('click', () => drop(c));
      grid.append(r); rows.push({ r, holes });
    }

    let s = 40;
    // Holes' offsetParent is the positioned .four box, the same box the discs live in.
    const pos = (c, k) => { const h = rows[c].holes[H - 1 - k]; return [h.offsetLeft, h.offsetTop]; };
    const size = () => {
      const w = root.clientWidth; const hh = root.clientHeight;
      // frame padding 18 each side, row padding 2, gaps 4 (see .four rules in style.css)
      s = Math.floor(Math.min((w - 36 - 4 - 4 * (H - 1)) / H, (hh - 36 - 4 * (COLS - 1)) / COLS - 4));
      rows.forEach(({ r }) => { r.style.gridTemplateColumns = `repeat(${H}, ${s}px)`; });
      discs.forEach((d) => { const [x, y] = pos(d.c, d.k); Object.assign(d.el.style, { width: `${s}px`, height: `${s}px`, left: '0', top: '0' }); d.el.style.transition = 'none'; requestAnimationFrame(() => { d.el.style.transition = ''; }); d.el.style.translate = `${x}px ${y}px`; });
    };
    const ro = new ResizeObserver(size); ro.observe(root); size();

    const setTurn = () => { api.turn(turn); api.msg(turn, api.t('yourTurn')); api.msg(1 - turn, api.t('waiting')); };
    setTurn();

    function line(c, k, p) {
      for (const [dc, dk] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const cells = [[c, k]];
        for (const sgn of [1, -1]) {
          let cc = c + dc * sgn; let kk = k + dk * sgn;
          while (cc >= 0 && cc < COLS && kk >= 0 && kk < H && board[cc][kk] === p) { cells.push([cc, kk]); cc += dc * sgn; kk += dk * sgn; }
        }
        if (cells.length >= 4) return cells;
      }
      return null;
    }

    function drop(c) {
      if (lock || !api.live) return;
      const k = board[c].length;
      if (k >= H) { api.sfx.bad(); return; }
      lock = true;
      board[c].push(turn); moves++;
      const el = document.createElement('span'); el.className = 'disc'; el.dataset.p = turn;
      Object.assign(el.style, { width: `${s}px`, height: `${s}px`, left: '0', top: '0' });
      const [x, y] = pos(c, k);
      el.style.translate = `${rows[c].holes[0].offsetLeft - s - 8}px ${y}px`;
      box.append(el); discs.push({ el, c, k });
      api.sfx.whoosh();
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.translate = `${x}px ${y}px`; }));
      timers.push(setTimeout(() => {
        api.sfx.coin(); api.buzz(15);
        const win = line(c, k, turn);
        if (win) {
          win.forEach(([cc, kk]) => discs.find((d) => d.c === cc && d.k === kk)?.el.classList.add('win'));
          api.shake(5); api.over(turn);
          return;
        }
        if (moves === COLS * H) { api.over(null); return; }
        turn = 1 - turn; setTurn(); lock = false;
      }, 460));
    }

    return { destroy() { ro.disconnect(); timers.forEach(clearTimeout); } };
  },
};
