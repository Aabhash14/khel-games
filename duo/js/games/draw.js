// Quick Draw: wait for the target picture, slap your half first. Slap on a decoy and you lose the round.
import { ANIMALS, byId, animalURL } from '../animals.js';

const PICS = ANIMALS.map((a) => a.id);
const WIN = 4;

export default {
  id: 'draw',
  mount(root, api) {
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const qd = el('div', 'qd'); root.append(qd);
    const pads = [1, 0].map((p) => {
      const b = el('button', 'qd-pad'); b.type = 'button'; b.dataset.p = p;
      const tgt = el('span', 'tgt'); const res = el('span', 'res'); const lbl = el('span', 'lbl', api.t('draw.tapHalf'));
      b.append(tgt, res, lbl);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); slap(p); });
      return { p, b, tgt, res };
    });
    const mid = el('div', 'qd-mid'); const sign = el('div', 'qd-sign'); mid.append(sign);
    qd.append(pads[0].b, mid, pads[1].b);
    const pad = (p) => pads.find((x) => x.p === p);
    const pic = (id, px) => `<img src="${animalURL(id, px)}" alt="${api.lang === 'ne' ? byId[id].ne : byId[id].en}" draggable="false">`;

    const score = [0, 0];
    let phase = 'idle'; let target = ''; let showing = ''; let goAt = 0;
    let timers = [];
    const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    api.score(0, 0); api.score(1, 0); api.turn(null);

    function round() {
      clear();
      target = PICS[Math.floor(Math.random() * PICS.length)];
      phase = 'wait'; showing = ''; sign.textContent = ''; sign.classList.remove('go');
      pads.forEach((x) => { x.tgt.innerHTML = `${api.t('draw.wait')} <em>${pic(target, 96)}</em>`; x.res.textContent = ''; });
      api.msg(null, api.t('draw.hold'));
      let at = 1500;
      const decoys = Math.floor(Math.random() * 5);
      for (let i = 0; i < decoys; i++) {
        at += 600 + Math.random() * 1300;
        let d; do { d = PICS[Math.floor(Math.random() * PICS.length)]; } while (d === target);
        const showAt = at;
        later(() => { if (phase !== 'wait') return; showing = d; sign.innerHTML = pic(d, 220); api.sfx.blip(); }, showAt);
        later(() => { if (phase !== 'wait') return; showing = ''; sign.textContent = ''; }, showAt + 520 + Math.random() * 250);
        at += 800;
      }
      at += 700 + Math.random() * 2200;
      later(() => {
        if (phase !== 'wait') return;
        phase = 'go'; showing = target; sign.innerHTML = pic(target, 220); sign.classList.add('go'); goAt = performance.now(); api.sfx.go();
      }, at);
    }

    function slap(p) {
      if (!api.live) return;
      if (phase === 'wait') {
        const fake = !!showing;
        endRound(1 - p, p, api.t(fake ? 'draw.fake' : 'draw.early'));
        api.sfx.bad(); return;
      }
      if (phase !== 'go') return;
      const ms = Math.round(performance.now() - goAt);
      api.sfx.slap();
      endRound(p, null, api.t('draw.ms', { ms }));
    }

    function endRound(winner, fouler, text) {
      phase = 'done'; clear();
      score[winner]++; api.score(winner, score[winner]);
      pad(winner).b.classList.remove('flash'); void pad(winner).b.offsetWidth; pad(winner).b.classList.add('flash');
      pad(winner).res.textContent = fouler == null ? text : '+1';
      pad(1 - winner).res.textContent = fouler == null ? '' : text;
      api.buzz(fouler == null ? 40 : [30, 30, 30]);
      if (fouler != null) api.shake(6);
      const r = pad(winner).b.getBoundingClientRect(); api.burst(r.x + r.width / 2, r.y + r.height / 2, '#ffcb1f', 24);
      if (score[winner] >= WIN) { api.over(winner, `${api.num(score[0])} – ${api.num(score[1])}`); return; }
      later(round, 1700);
    }

    round();
    return {
      destroy() { clear(); },
      pause() { clear(); phase = 'idle'; },
      resume() { round(); },
    };
  },
};
