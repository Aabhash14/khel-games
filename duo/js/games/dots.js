// Dots & Boxes: close a box, keep it, go again.
const BC = 5; const BR = 7; const S = 100; const M = 30;
const NS = 'http://www.w3.org/2000/svg';

export default {
  id: 'dots',
  mount(root, api) {
    const W = BC * S + 2 * M; const Hh = BR * S + 2 * M;
    const hE = Array.from({ length: BR + 1 }, () => Array(BC).fill(false));
    const vE = Array.from({ length: BR }, () => Array(BC + 1).fill(false));
    const owner = Array.from({ length: BR }, () => Array(BC).fill(-1));
    const score = [0, 0];
    let turn = api.first; let lastEl = null; let left = BC * BR;

    const wrap = document.createElement('div'); wrap.className = 'surface dots';
    const pad = document.createElement('div'); pad.className = 'wood';
    pad.style.cssText = 'width:100%;height:100%;padding:6px';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    pad.append(svg); wrap.append(pad); root.append(wrap);
    const mk = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.append(e); return e; };

    const gBox = mk('g', {}); const gLine = mk('g', {}); const gHit = mk('g', {}); const gDot = mk('g', {});
    const boxEls = owner.map((row, r) => row.map((_, c) => {
      const g = mk('g', { class: 'box' }, gBox);
      mk('rect', { x: M + c * S + 4, y: M + r * S + 4, width: S - 8, height: S - 8, rx: 10, style: 'fill:var(--pc);opacity:.25' }, g);
      mk('circle', { cx: M + c * S + S / 2, cy: M + r * S + S / 2, r: 24, style: 'fill:var(--pc)' }, g);
      mk('circle', { cx: M + c * S + S / 2, cy: M + r * S + S / 2, r: 15, fill: 'none', stroke: '#ffffff44', 'stroke-width': 3 }, g);
      return g;
    }));
    const lineEls = { h: [], v: [] };
    const addEdge = (kind, r, c, x1, y1, x2, y2) => {
      const ln = mk('line', { x1, y1, x2, y2, class: 'edge', 'stroke-width': 9 }, gLine);
      const hit = mk('line', { x1: x1 + (x2 - x1) * 0.14, y1: y1 + (y2 - y1) * 0.14, x2: x2 - (x2 - x1) * 0.14, y2: y2 - (y2 - y1) * 0.14, class: 'hit', 'stroke-width': 70 }, gHit);
      hit.addEventListener('pointerdown', (e) => { e.preventDefault(); play(kind, r, c, ln); });
      (lineEls[kind][r] ||= [])[c] = ln;
    };
    for (let r = 0; r <= BR; r++) for (let c = 0; c < BC; c++) addEdge('h', r, c, M + c * S, M + r * S, M + (c + 1) * S, M + r * S);
    for (let r = 0; r < BR; r++) for (let c = 0; c <= BC; c++) addEdge('v', r, c, M + c * S, M + r * S, M + c * S, M + (r + 1) * S);
    for (let r = 0; r <= BR; r++) for (let c = 0; c <= BC; c++) mk('circle', { cx: M + c * S, cy: M + r * S, r: 9, class: 'dot' }, gDot);

    const setTurn = () => { api.turn(turn); api.msg(turn, api.t('yourTurn')); api.msg(1 - turn, api.t('waiting')); };
    api.score(0, 0); api.score(1, 0); setTurn();

    const closed = (r, c) => hE[r][c] && hE[r + 1][c] && vE[r][c] && vE[r][c + 1];

    function play(kind, r, c, ln) {
      if (!api.live) return;
      const arr = kind === 'h' ? hE : vE;
      if (arr[r][c]) return;
      arr[r][c] = true;
      ln.classList.add('on');
      lastEl?.classList.remove('last'); ln.classList.add('last'); lastEl = ln;
      api.sfx.tap(); api.buzz(8);
      const cand = kind === 'h' ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]];
      let got = 0;
      for (const [br, bc] of cand) {
        if (br < 0 || bc < 0 || br >= BR || bc >= BC || owner[br][bc] !== -1 || !closed(br, bc)) continue;
        owner[br][bc] = turn; got++; left--;
        const g = boxEls[br][bc]; g.dataset.p = turn; g.classList.add('on');
        const rc = g.getBoundingClientRect(); api.burst(rc.x + rc.width / 2, rc.y + rc.height / 2, turn ? '#1f52d4' : '#d41f16', 12);
      }
      if (got) {
        score[turn] += got; api.score(turn, score[turn]); api.sfx.good();
        if (!left) { api.over(score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1, `${api.num(score[0])} – ${api.num(score[1])}`); }
        return;
      }
      turn = 1 - turn; setTurn();
    }

    return { destroy() {} };
  },
};
