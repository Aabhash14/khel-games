// Four in a Row, laid sideways: coins slide in from the left and stack against the gold right edge,
// so neither player reads the board upside down. A win slashes through the line and cuts the coins in half.
const COLS = 10; const H = 10; // logical columns (screen rows) and stack height (screen columns)

export default {
  id: 'four',
  mount(root, api) {
    const board = Array.from({ length: COLS }, () => []);
    let turn = api.first; let lock = false; let moves = 0; let done = false;
    const discs = [];
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

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

    let s = 40; let strike = null;
    // Holes' offsetParent is the positioned .four box, the same box the discs live in.
    const pos = (c, k) => { const h = rows[c].holes[H - 1 - k]; return [h.offsetLeft, h.offsetTop]; };
    const place = (d) => { const [x, y] = pos(d.c, d.k); d.el.style.width = d.el.style.height = `${s}px`; d.el.style.translate = `${x}px ${y}px`; };
    const size = () => {
      const w = root.clientWidth; const hh = root.clientHeight;
      // frame padding 18 each side, row padding 2, gaps 4 (see .four rules in style.css)
      s = Math.floor(Math.min((w - 36 - 4 - 4 * (H - 1)) / H, (hh - 36 - 4 * (COLS - 1)) / COLS - 4));
      rows.forEach(({ r }) => { r.style.gridTemplateColumns = `repeat(${H}, ${s}px)`; });
      discs.forEach(place);
      if (strike) drawStrike(false);
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
        if (cells.length >= 4) return cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      }
      return null;
    }

    function drop(c) {
      if (lock || done || !api.live) return;
      const k = board[c].length;
      if (k >= H) { api.sfx.bad(); rows[c].r.animate([{ translate: '0 0' }, { translate: '0 3px' }, { translate: '0 -3px' }, { translate: '0 0' }], 180); return; }
      lock = true;
      board[c].push(turn); moves++;
      const el = document.createElement('span'); el.className = 'disc'; el.dataset.p = turn;
      const d = { el, c, k }; discs.push(d);
      place(d); box.append(el);
      const [x, y] = pos(c, k);
      const x0 = rows[c].holes[0].offsetLeft - s - 8;
      // roll in, hit the stack, bounce back a little, settle; run on the compositor
      const dist = x - x0; const ms = 260 + dist * 0.55;
      el.animate([
        { translate: `${x0}px ${y}px`, easing: 'cubic-bezier(.45, 0, .9, .6)' },
        { translate: `${x}px ${y}px`, offset: 0.72, easing: 'cubic-bezier(.2, .7, .4, 1)' },
        { translate: `${x - Math.min(10, s * 0.28)}px ${y}px`, offset: 0.86, easing: 'cubic-bezier(.6, 0, .8, .6)' },
        { translate: `${x}px ${y}px` },
      ], { duration: ms });
      api.sfx.whoosh();
      later(() => { api.sfx.coin(); api.buzz(15); }, ms * 0.72);
      later(() => {
        const win = line(c, k, turn);
        if (win) { cut(win); return; }
        if (moves === COLS * H) { done = true; api.over(null); return; }
        turn = 1 - turn; setTurn(); lock = false;
      }, ms);
    }

    // ---- the winning slash ----
    function drawStrike(animate) {
      const { cells, el } = strike;
      const [a0, a1] = pos(...cells[0]); const [b0, b1] = pos(...cells[cells.length - 1]);
      const ax = a0 + s / 2; const ay = a1 + s / 2; const bx = b0 + s / 2; const by = b1 + s / 2;
      const ang = Math.atan2(by - ay, bx - ax); const ext = s * 0.75;
      const len = Math.hypot(bx - ax, by - ay) + ext * 2;
      Object.assign(el.style, { width: `${len}px`, left: `${ax - Math.cos(ang) * ext}px`, top: `${ay - Math.sin(ang) * ext}px`, rotate: `${ang}rad` });
      strike.ang = ang;
      if (animate) el.animate([{ scale: '0 1' }, { scale: '1 1' }], { duration: 300, easing: 'cubic-bezier(.3, 0, .2, 1)' });
    }
    function cut(cells) {
      done = true;
      const el = document.createElement('span'); el.className = 'strike'; el.dataset.p = turn;
      box.append(el); strike = { cells, el };
      drawStrike(true);
      api.sfx.whoosh();
      later(() => {
        api.sfx.crash(); api.shake(6); api.buzz([30, 30, 60]);
        cells.forEach(([cc, kk], i) => {
          const dd = discs.find((q) => q.c === cc && q.k === kk); if (!dd) return;
          dd.el.style.setProperty('--a', `${strike.ang}rad`);
          dd.el.innerHTML = '<i class="h t"></i><i class="h b"></i>';
          dd.el.style.setProperty('--d', `${i * 40}ms`);
          dd.el.classList.add('cut');
        });
        const r = el.getBoundingClientRect();
        api.burst(r.x + r.width / 2, r.y + r.height / 2, turn ? '#1f52d4' : '#d41f16', 18);
      }, 220);
      later(() => api.over(turn), 650);
    }

    return { destroy() { done = true; ro.disconnect(); timers.forEach(clearTimeout); } };
  },
};
