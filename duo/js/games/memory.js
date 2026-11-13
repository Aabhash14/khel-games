// Memory: flip two, match = keep them and go again.
// Pictures are painted on canvas at the card's real pixel size (see pics.js), so they stay sharp.
import { PICS, paintPic } from '../pics.js';
const COLS = 4; const ROWS = 6;

export default {
  id: 'memory',
  mount(root, api) {
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const pics = shuffle([...PICS]).slice(0, (COLS * ROWS) / 2);
    const deck = shuffle([...pics, ...pics]);
    const score = [0, 0];
    let turn = api.first; let open = []; let lock = false; let left = pics.length;
    const timers = [];

    const wrap = document.createElement('div'); wrap.className = 'surface';
    const grid = document.createElement('div'); grid.className = 'mem-grid wood';
    wrap.append(grid); root.append(wrap);

    const cards = deck.map((pic, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card';
      b.setAttribute('aria-label', `${i + 1}`); b.dataset.pic = pic.id;
      b.innerHTML = '<span class="in"><span class="bk"></span><span class="fr"><canvas></canvas></span></span>';
      b.addEventListener('click', () => flip(i));
      grid.append(b);
      return b;
    });

    let painted = 0;
    const size = () => {
      const w = root.clientWidth - 20; const h = root.clientHeight - 20;
      const c = Math.floor(Math.min((w - 6 * (COLS - 1) - 16) / COLS, (h - 6 * (ROWS - 1) - 16) / ROWS));
      grid.style.gridTemplateColumns = `repeat(${COLS}, ${c}px)`;
      grid.style.gridAutoRows = `${c}px`;
      // paint each picture once at full device resolution, then copy it to both cards of the pair
      const px = Math.round(c * 0.86 * Math.min(3, Math.max(2, devicePixelRatio || 1)));
      if (px === painted || px <= 0) return;
      painted = px;
      const master = document.createElement('canvas');
      pics.forEach((pic) => {
        paintPic(master, pic, px);
        cards.forEach((b, i) => {
          if (deck[i] !== pic) return;
          const cv = b.querySelector('canvas'); cv.width = cv.height = px;
          cv.getContext('2d').drawImage(master, 0, 0);
        });
      });
    };
    const ro = new ResizeObserver(size); ro.observe(root); size();

    const setTurn = () => {
      api.turn(turn); api.msg(turn, api.t('yourTurn')); api.msg(1 - turn, api.t('waiting'));
    };
    api.score(0, 0); api.score(1, 0); setTurn();

    function flip(i) {
      if (lock || !api.live) return;
      const b = cards[i];
      if (b.classList.contains('up') || b.classList.contains('done')) return;
      b.classList.add('up'); api.sfx.flip(); open.push(i);
      if (open.length < 2) return;
      lock = true;
      const [a, c] = open;
      if (deck[a] === deck[c]) {
        timers.push(setTimeout(() => {
          [a, c].forEach((k) => { cards[k].classList.remove('up'); cards[k].classList.add('done'); cards[k].dataset.p = turn; });
          score[turn]++; api.score(turn, score[turn]); api.sfx.good(); api.buzz(20);
          const r = cards[c].getBoundingClientRect(); api.burst(r.x + r.width / 2, r.y + r.height / 2, turn ? '#1f52d4' : '#d41f16');
          api.msg(turn, api.t('memory.pair'));
          open = []; lock = false; left--;
          if (!left) api.over(score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1, `${api.num(score[0])} – ${api.num(score[1])}`);
        }, 380));
      } else {
        timers.push(setTimeout(() => {
          api.sfx.bad(); api.msg(turn, api.t('memory.miss'));
          timers.push(setTimeout(() => {
            [a, c].forEach((k) => cards[k].classList.remove('up'));
            open = []; lock = false; turn = 1 - turn; setTurn();
          }, 650));
        }, 500));
      }
    }

    return { destroy() { ro.disconnect(); timers.forEach(clearTimeout); } };
  },
};
