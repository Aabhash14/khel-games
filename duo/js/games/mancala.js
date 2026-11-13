// Mancala (Kalah rules). Each player's row of six pits faces them; their store is the big pit on their right.
// Tap a pit: its seeds are sown one per pit, round the board, skipping the other player's store.
// Last seed in your store: go again. Last seed in an empty pit of yours: steal the pit across.
const SEEDS = 4;
const COLORS = ['#d41f16', '#1f52d4', '#ffcb1f', '#17803a', '#ff4f9a', '#fffaf0', '#ff8a00', '#7c4dff'];
// slots: 0-5 Red pits (bottom row, left to right), 6 Red store (right),
//        7-12 Blue pits (top row, right to left on screen), 13 Blue store (left)
const STORE = [6, 13];
const own = (p, i) => (p === 0 ? i >= 0 && i <= 5 : i >= 7 && i <= 12);
const next = (i, p) => { let j = (i + 1) % 14; if (j === STORE[1 - p]) j = (j + 1) % 14; return j; };

export default {
  id: 'mancala',
  mount(root, api) {
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    const wrap = el('div', 'surface'); const board = el('div', 'mancala'); wrap.append(board); root.append(wrap);
    const slots = []; // { el, count, seeds: [] }
    for (let i = 0; i < 14; i++) {
      const isStore = i === 6 || i === 13;
      const s = el(isStore ? 'div' : 'button', isStore ? 'mstore' : 'mpit');
      if (!isStore) { s.type = 'button'; s.addEventListener('click', () => play(i)); }
      const col = i === 13 ? 1 : i === 6 ? 8 : i < 6 ? i + 2 : 14 - i;
      s.style.gridColumn = String(col);
      s.style.gridRow = isStore ? '1 / span 2' : i < 6 ? '2' : '1';
      s.dataset.p = i <= 6 ? 0 : 1;
      const count = el('span', 'mcount'); s.append(count);
      board.append(s);
      slots.push({ el: s, count, seeds: [] });
    }
    // seeds
    let sid = 0;
    for (let i = 0; i < 14; i++) {
      if (i === 6 || i === 13) continue;
      for (let k = 0; k < SEEDS; k++) {
        const e = el('span', 'seed');
        e.style.setProperty('--c', COLORS[(sid * 3 + i) % COLORS.length]);
        const seed = { e, id: sid++, jx: Math.random() - 0.5, jy: Math.random() - 0.5 };
        board.append(e); slots[i].seeds.push(seed);
      }
    }

    let turn = api.first; let busy = false; let over = false;
    const timers = [];
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));

    function layoutSlot(i) {
      const s = slots[i];
      const bx = board.getBoundingClientRect(); const r = s.el.getBoundingClientRect();
      const w = r.width; const h = r.height; const x0 = r.left - bx.left; const y0 = r.top - bx.top;
      const n = s.seeds.length; const ss = parseFloat(getComputedStyle(board).getPropertyValue('--ss')) || 12;
      const cols = (i === 6 || i === 13) ? 3 : 2;
      const rows = Math.max(1, Math.ceil(n / cols));
      const padY = 22;
      const step = Math.min(ss * 0.95, (h - padY * 2 - ss) / Math.max(1, rows - 1));
      const blockH = (rows - 1) * step;
      s.seeds.forEach((seed, k) => {
        const c = k % cols; const rw = Math.floor(k / cols);
        const cx = x0 + w / 2 + (c - (cols - 1) / 2) * ss * 0.9 + seed.jx * ss * 0.25 - ss / 2;
        const cy = y0 + h / 2 - blockH / 2 + rw * step + seed.jy * ss * 0.2 - ss / 2;
        seed.e.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
        seed.e.style.zIndex = String(10 + rw);
      });
      s.count.textContent = api.num(n);
    }
    const layoutAll = () => slots.forEach((_, i) => layoutSlot(i));

    const size = () => {
      const w = root.clientWidth; const h = root.clientHeight;
      board.style.width = `${Math.min(w, 520)}px`;
      board.style.height = `${Math.min(h - 8, 380)}px`;
      board.style.setProperty('--ss', `${Math.max(9, Math.min(15, Math.floor(w / 30)))}px`);
      layoutAll();
    };
    const ro = new ResizeObserver(size); ro.observe(root);

    function setTurn() {
      api.turn(turn); api.msg(turn, api.t('mancala.pick')); api.msg(1 - turn, api.t('waiting'));
      slots.forEach((s, i) => s.el.classList.toggle('can', !over && own(turn, i) && s.seeds.length > 0));
      api.score(0, slots[6].seeds.length); api.score(1, slots[13].seeds.length);
    }

    function move(seed, to) { slots[to].seeds.push(seed); }

    async function play(i) {
      if (busy || over || !api.live || !own(turn, i) || !slots[i].seeds.length) return;
      busy = true;
      slots.forEach((s) => s.el.classList.remove('can'));
      const p = turn;
      const hand = slots[i].seeds.splice(0);
      layoutSlot(i);
      api.sfx.tap();
      let at = i; let step = 0;
      for (const seed of hand) {
        at = next(at, p);
        move(seed, at); layoutSlot(at);
        slots[at].el.classList.remove('pulse'); void slots[at].el.offsetWidth; slots[at].el.classList.add('pulse');
        if (at === STORE[p]) api.sfx.store(); else api.sfx.seed(step);
        step++;
        await wait(190);
        if (!api.live && over) return;
      }
      let again = false;
      if (at === STORE[p]) {
        again = true;
        api.callout(api.t('mancala.again'), p, '#ffcb1f'); api.sfx.again(); api.buzz(20);
      } else if (own(p, at) && slots[at].seeds.length === 1 && slots[12 - at].seeds.length > 0) {
        await wait(150);
        const loot = [...slots[12 - at].seeds.splice(0), ...slots[at].seeds.splice(0)];
        layoutSlot(12 - at); layoutSlot(at);
        loot.forEach((s) => move(s, STORE[p]));
        layoutSlot(STORE[p]);
        api.callout(api.t('mancala.steal'), p, '#ff4f9a'); api.sfx.capture(); api.shake(5); api.buzz([30, 30, 30]);
        const r = slots[STORE[p]].el.getBoundingClientRect(); api.burst(r.x + r.width / 2, r.y + r.height / 2, p ? '#1f52d4' : '#d41f16', 22);
        await wait(350);
      }
      // game over when either row is empty: the rest go to their owner's store
      const empty = [0, 1].map((q) => slots.every((s, k) => !own(q, k) || s.seeds.length === 0));
      if (empty[0] || empty[1]) {
        over = true;
        for (let k = 0; k < 14; k++) {
          if (k === 6 || k === 13 || !slots[k].seeds.length) continue;
          const q = own(0, k) ? 0 : 1;
          slots[k].seeds.splice(0).forEach((s) => move(s, STORE[q]));
        }
        layoutAll(); api.sfx.store();
        await wait(600);
        const a = slots[6].seeds.length; const b = slots[13].seeds.length;
        api.score(0, a); api.score(1, b);
        api.over(a === b ? null : a > b ? 0 : 1, `${api.num(a)} – ${api.num(b)}`);
        return;
      }
      if (!again) turn = 1 - turn;
      busy = false;
      setTurn();
    }

    size();
    setTurn();
    return { destroy() { over = true; ro.disconnect(); timers.forEach(clearTimeout); } };
  },
};
