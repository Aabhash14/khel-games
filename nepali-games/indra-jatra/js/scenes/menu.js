// Title screen: Basantapur at night, the Yosin standing, Lakhey dancing in the square.
import { E } from '../core/engine.js';
import { ART as A } from '../art/side.js';
import { Particles, vignette } from '../core/fx.js';
import { UI, lampSVG, ICON } from '../core/ui.js';
import { AU, SFX } from '../core/audio.js';
import { t, num, note, setLang, L } from '../core/i18n.js';
import { save } from '../core/store.js';
import { CHAPTERS, SCORED, NOTE_ORDER } from '../data/strings.js';
import { goChapter, unlocked, totalLamps, nextChapter } from './common.js';
import { SOUND_CREDITS, PHOTO_CREDITS } from '../data/credits.js';
import { Photo } from '../core/photo.js';


const $ = (q) => document.querySelector(q);
let P, crowd, lay = {};
function layout() {
  const { W, H } = E;
  lay.GY = Math.round(H * (H > W ? 0.5 : 0.62));
  lay.S = Math.max(0.6, Math.min(1.8, Math.min(W / 420, lay.GY / 380)));
  crowd = A.makeCrowd(26, -30, W + 30, 61);
}

export const menuScene = {
  enter() {
    layout(); P = new Particles(200);
    UI.hideHud(); UI.hideControls(); UI.hush();
    AU.song('menu', 0.45); AU.amb(0.3, 0);
    render();
    $('#menu').hidden = false;
    Photo.show('night', { grade: 'cine', slides: ['night', 'start', 'lakhey', 'swet', 'procession', 'raising'], zoom: [1.05, 1.18], dur: 8 });
  },
  exit() { $('#menu').hidden = true; },
  resize: layout,
  update(dt) {
    P.update(dt, 4);
    if (Math.random() < 0.25) P.emit('ember', Math.random() * E.W, lay.GY + 40 * lay.S, 1, { speed: 12, angle: -Math.PI / 2, spread: 0.6, life: 4, size: 2 });
  },
  draw(g) {
    const { W, H } = E, { GY, S: sc } = lay, tm = E.t;
    A.use(g);
    g.clearRect(0, 0, W, H);
    P.draw(g);
    vignette(g, 0.35);
  },
};

function render() {
  setLang(L);
  const next = nextChapter();
  const cta = $('#cta');
  cta.querySelector('.cta-t').textContent = next ? (save.done.yosin ? t('continueCh', { name: t('c_' + next) }) : t('play')) : t('replay');
  cta.onclick = () => { SFX.ui(); goChapter(next || 'yosin'); };
  const ol = $('#chapters'); ol.innerHTML = '';
  CHAPTERS.forEach((id, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ch' + (id === next ? ' next' : '') + (save.done[id] ? ' done' : '');
    const open = unlocked(id); b.disabled = !open;
    const lamps = SCORED.includes(id) ? [0, 1, 2].map((k) => lampSVG(k < (save.best[id] || 0), 'sm')).join('') : (save.done[id] ? lampSVG(true, 'sm') : '');
    b.innerHTML = `<span class="ch-n">${num(i + 1)}</span><span class="ch-t"></span><span class="ch-d"></span><span class="ch-l">${lamps}</span>`;
    b.querySelector('.ch-t').textContent = t('c_' + id);
    b.querySelector('.ch-d').textContent = open ? t('d_' + id) : t('locked');
    b.addEventListener('click', () => { SFX.ui(); goChapter(id); });
    li.appendChild(b); ol.appendChild(li);
  });
  $('#lampTotal').innerHTML = lampSVG(true, 'sm') + ' <span></span>';
  $('#lampTotal span').textContent = t('lampsOf', { n: totalLamps() });
  $('#lang').onclick = () => { SFX.ui(); setLang(L === 'ne' ? 'en' : 'ne'); render(); };
  $('#mute').innerHTML = AU.muted ? ICON.mute : ICON.sound;
  $('#mute').setAttribute('aria-pressed', String(AU.muted));
  $('#mute').onclick = () => { AU.setMuted(!AU.muted); render(); };
  $('#notesBtn').onclick = () => { SFX.ui(); notes(); };
}

function notes() {
  UI.sheet((b, mk) => {
    b.append(mk('h2', '', t('notes')));
    const ol = mk('ol', 'note-list');
    for (const id of NOTE_ORDER) { const has = save.notes.includes(id); ol.appendChild(mk('li', has ? '' : 'locked', has ? note(id) : '· · ·')); }
    b.appendChild(ol);
    // credits for the field recordings
    const cr = mk('div', 'credits');
    cr.append(mk('h3', '', t('soundCredits')));
    for (const c of SOUND_CREDITS) {
      const p = mk('p');
      const a = mk('a', '', c.author); a.href = c.url; a.target = '_blank'; a.rel = 'noopener';
      const l = mk('a', '', c.license); l.href = c.licenseUrl; l.target = '_blank'; l.rel = 'noopener';
      p.append(mk('span', '', c.note[L === 'ne' ? 0 : 1] + ' '), a, mk('span', '', ' · '), l);
      cr.appendChild(p);
    }
    b.appendChild(cr);
    const pc = mk('div', 'credits');
    pc.append(mk('h3', '', t('photoCredits')));
    for (const c of PHOTO_CREDITS) {
      const p = mk('p');
      const a = mk('a', '', c.title); a.href = c.page; a.target = '_blank'; a.rel = 'noopener';
      const l = mk('a', '', c.license); l.href = c.licenseUrl; l.target = '_blank'; l.rel = 'noopener';
      p.append(a, mk('span', '', ' · ' + c.artist + ' · '), l);
      pc.appendChild(p);
    }
    b.appendChild(pc);
    const row = mk('div', 'row'); row.append(UI.button(t('close'), 'main', () => UI.closeSheet())); b.appendChild(row);
  }, 'tall');
}
