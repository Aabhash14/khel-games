// Who Is It?: each player has a secret person; ask yes/no questions, the phone answers,
// faces that don't fit fall down. Guess wrong and you lose.
import { PEOPLE, QUESTIONS, faceSVG } from '../faces.js';

export default {
  id: 'guess',
  mount(root, api) {
    const ne = api.lang === 'ne';
    const nm = (p) => (ne ? p.ne : p.en);
    const s0 = Math.floor(Math.random() * PEOPLE.length);
    let s1 = Math.floor(Math.random() * (PEOPLE.length - 1)); if (s1 >= s0) s1++;
    const secret = [s0, s1];
    const down = [new Set(), new Set()];
    const asked = [new Set(), new Set()];
    let turn = api.first; let lock = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const button = (label, cls, fn) => { const b = el('button', 'btn ' + cls, label); b.type = 'button'; b.addEventListener('click', () => { api.sfx.tap(); fn(); }); return b; };

    const gw = el('div', 'gw'); root.append(gw);
    let faces = [];
    const fit = () => {
      const w = (root.clientWidth - 20) / 6; const h = (root.clientHeight - 64 - 24) / 6 - 16;
      gw.style.setProperty('--fw', `${Math.floor(Math.min(w, h))}px`);
    };
    const ro = new ResizeObserver(fit); ro.observe(root); fit();

    const remaining = (p) => PEOPLE.length - down[p].size;
    const scores = () => { [0, 1].forEach((p) => api.score(p, remaining(p))); };

    function render() {
      const p = turn;
      api.face(p); api.turn(p);
      api.msg(p, api.t('yourTurn')); api.msg(1 - p, api.t('waiting'));
      gw.innerHTML = ''; gw.classList.remove('picking');
      const grid = el('div', 'gw-grid');
      faces = PEOPLE.map((person, i) => {
        const b = el('button', 'face' + (down[p].has(i) ? ' down' : '')); b.type = 'button';
        b.innerHTML = faceSVG(person) + `<span class="fn">${nm(person)}</span>`;
        b.setAttribute('aria-label', nm(person));
        b.addEventListener('click', () => tapFace(i));
        grid.append(b); return b;
      });
      const bar = el('div', 'gw-bar');
      const peek = el('button', 'peek'); peek.type = 'button';
      peek.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg><span class="sec">${faceSVG(PEOPLE[secret[p]])}<span class="fn" style="font-size:11px;font-weight:800;color:#141210">${nm(PEOPLE[secret[p]])}</span></span>`;
      peek.setAttribute('aria-label', api.t('guess.peek'));
      const on = (e) => { e.preventDefault(); peek.classList.add('on'); api.sfx.flip(); };
      const off = () => peek.classList.remove('on');
      peek.addEventListener('pointerdown', on); peek.addEventListener('pointerup', off); peek.addEventListener('pointerleave', off); peek.addEventListener('pointercancel', off);
      peek.addEventListener('contextmenu', (e) => e.preventDefault());
      const ask = button(api.t('guess.ask'), 'pc', openAsk); ask.dataset.p = p;
      const gs = button(api.t('guess.guess'), 'ghost', startPick);
      bar.append(peek, ask, gs);
      gw.append(grid, bar);
      scores(); lock = false;
    }

    function tapFace(i) {
      if (lock || !api.live) return;
      if (gw.classList.contains('picking')) { if (!down[turn].has(i)) confirmPick(i); return; }
      // Manual flip, like the real board.
      if (down[turn].has(i)) down[turn].delete(i); else down[turn].add(i);
      faces[i].classList.toggle('down', down[turn].has(i)); api.sfx.flip(); scores();
    }

    function openAsk() {
      if (lock || !api.live) return;
      const sh = el('div', 'qsheet');
      sh.append(el('h3', '', api.t('guess.askTitle')));
      const list = el('div', 'qlist');
      QUESTIONS.forEach((q) => {
        const b = el('button', '', ne ? q.ne : q.en); b.type = 'button';
        b.disabled = asked[turn].has(q.id);
        b.addEventListener('click', () => { sh.remove(); askQ(q); });
        list.append(b);
      });
      sh.append(list, button(api.t('guess.cancel'), 'ghost', () => sh.remove()));
      gw.append(sh);
    }

    function askQ(q) {
      lock = true;
      const p = turn;
      asked[p].add(q.id);
      const ans = q.test(PEOPLE[secret[1 - p]]);
      const a = el('div', 'answer ' + (ans ? 'yes' : 'no'));
      a.append(el('span', '', ne ? q.ne : q.en), el('b', '', api.t(ans ? 'guess.yes' : 'guess.no')));
      gw.append(a);
      (ans ? api.sfx.yes : api.sfx.no)();
      let k = 0;
      later(() => {
        PEOPLE.forEach((person, i) => {
          if (q.test(person) !== ans && !down[p].has(i)) {
            down[p].add(i);
            const d = k++ * 35;
            later(() => { faces[i].classList.add('down'); if (d % 105 === 0) api.sfx.flip(); }, d);
          }
        });
        later(() => { scores(); api.msg(p, api.t('guess.left', { n: remaining(p) })); }, k * 35 + 50);
        later(() => { a.remove(); turn = 1 - p; render(); }, Math.max(1800, k * 35 + 1400));
      }, 900);
    }

    function startPick() {
      if (lock || !api.live) return;
      gw.classList.add('picking');
      api.msg(turn, api.t('guess.pick'));
      const bar = gw.querySelector('.gw-bar'); bar.innerHTML = '';
      bar.append(el('p', 'note', api.t('guess.pick')), button(api.t('guess.cancel'), 'ghost', render));
      bar.firstChild.style.cssText = 'margin:0;flex:1;font-weight:800;color:var(--gold)';
    }

    function confirmPick(i) {
      const sh = el('div', 'qsheet');
      sh.style.justifyContent = 'center'; sh.style.alignItems = 'center';
      const card = el('div', 'face'); card.style.width = '120px'; card.innerHTML = faceSVG(PEOPLE[i]) + `<span class="fn">${nm(PEOPLE[i])}</span>`;
      const row = el('div', ''); row.style.cssText = 'display:flex;gap:10px';
      const yes = button(api.t('guess.yesSure'), 'pc', () => { sh.remove(); finalGuess(i); }); yes.dataset.p = turn;
      row.append(button(api.t('guess.cancel'), 'ghost', () => sh.remove()), yes);
      sh.append(el('h3', '', api.t('guess.sure', { name: nm(PEOPLE[i]) })), card, row);
      gw.append(sh);
    }

    function finalGuess(i) {
      lock = true;
      const p = turn; const target = PEOPLE[secret[1 - p]];
      const right = i === secret[1 - p];
      const idx = secret[1 - p];
      faces.forEach((f, k) => { f.classList.toggle('down', k !== idx); });
      const r = faces[idx].getBoundingClientRect();
      api.burst(r.x + r.width / 2, r.y + r.height / 2, right ? '#ffcb1f' : '#d41f16', 30);
      const note = api.t(right ? 'guess.right' : 'guess.wrong', { name: nm(target) });
      api.msg(p, note);
      (right ? api.sfx.yes : api.sfx.no)();
      if (!right) api.shake(8);
      api.over(right ? p : 1 - p, note);
    }

    render();
    return { destroy() { ro.disconnect(); timers.forEach(clearTimeout); } };
  },
};
