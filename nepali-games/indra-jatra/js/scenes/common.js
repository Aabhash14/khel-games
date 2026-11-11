// Shared chapter flow: intro banner + how-to, pause, results, progress.
import { E, go } from '../core/engine.js';
import { UI, lampSVG } from '../core/ui.js';
import { t, num, note } from '../core/i18n.js';
import { save, persist } from '../core/store.js';
import { AU, SFX } from '../core/audio.js';
import { CHAPTERS, CH_NOTES, SCORED } from '../data/strings.js';
import { Photo } from '../core/photo.js';

const INTRO_PHOTO = { yosin: 'raising', upaku: 'offering', lakhey: 'lakhey', rath: 'ropes', finale: 'swet' };
const RESULT_PHOTO = { yosin: 'start', upaku: 'indra', lakhey: 'night', rath: 'procession', finale: 'swet' };

export const SCENES = {}; // filled by main.js: { menu, yosin, upaku, lakhey, rath, finale }

export function goChapter(id) { UI.closeSheet(); go(SCENES[id], { id }); }
export function goMenu() { UI.closeSheet(); UI.hideHud(); UI.hideControls(); UI.hush(); go(SCENES.menu); }
export const unlocked = (id) => { const i = CHAPTERS.indexOf(id); return i <= 0 || !!save.done[CHAPTERS[i - 1]]; };
export const totalLamps = () => SCORED.reduce((a, k) => a + (save.best[k] || 0), 0);
export const nextChapter = () => CHAPTERS.find((c) => !save.done[c]) || null;

export async function intro(id, rows) {
  const n = CHAPTERS.indexOf(id) + 1;
  UI.hideControls();
  E.photoOnly = true;
  Photo.show(INTRO_PHOTO[id], { grade: 'cine', zoom: [1.02, 1.16], dur: 9 });
  Photo.preload([RESULT_PHOTO[id]]);
  await UI.banner(t('chapter', { n }) + ' · ' + t('d_' + id), t('c_' + id), 2000);
  await UI.howTo(t('d_' + id), t('c_' + id), t('i_' + id), rows);
  E.photoOnly = false;
}

export function pause(restart) {
  if (UI.sheetOpen) return;
  E.paused = true;
  AU.intensity(0.08);
  UI.sheet((b, mk) => {
    b.append(mk('h2', '', t('paused')));
    const row = mk('div', 'row col');
    row.append(
      UI.button(t('resume'), 'main', () => { UI.closeSheet(); E.paused = false; }),
      UI.button(t('restart'), '', () => { UI.closeSheet(); restart(); }),
      UI.button(t('menu'), 'ghost', goMenu),
    );
    b.appendChild(row);
  }, 'small');
}

function unlockNotes(id) {
  const fresh = [];
  for (const n of CH_NOTES[id] || []) if (!save.notes.includes(n)) { save.notes.push(n); fresh.push(n); }
  return fresh;
}

// lamps: 1..3, or 0 for an unscored chapter
export function finish(id, lamps, text) {
  UI.hideControls(); UI.hush();
  save.done[id] = true;
  if (lamps) save.best[id] = Math.max(save.best[id] || 0, lamps);
  const fresh = unlockNotes(id);
  persist();
  if (lamps === 3 || !lamps) SFX.win(); else SFX.cheer(0.6);
  const next = CHAPTERS[CHAPTERS.indexOf(id) + 1];
  setTimeout(() => { E.photoOnly = true; Photo.show(RESULT_PHOTO[id], { grade: 'cine', zoom: [1.12, 1.02], dur: 10 }); }, 700);
  setTimeout(() => UI.sheet((b, mk) => {
    b.append(mk('p', 'kicker', t('resK')), mk('h2', '', t('c_' + id)));
    const lb = mk('div', 'lamps'); lb.setAttribute('role', 'img');
    lb.setAttribute('aria-label', lamps ? num(lamps) + ' / ' + num(3) : t('noScore'));
    lb.innerHTML = lamps ? [0, 1, 2].map((k) => lampSVG(k < lamps)).join('') : lampSVG(true);
    b.append(lb, mk('p', 'lede', text));
    for (const nid of (fresh.length ? fresh : (CH_NOTES[id] || []).slice(0, 1))) {
      const c = mk('div', 'note'); c.append(mk('b', '', fresh.length ? t('newNote') : t('notes')), mk('span', '', note(nid))); b.appendChild(c);
    }
    const row = mk('div', 'row');
    if (lamps) row.append(UI.button(t('retry'), '', () => goChapter(id)));
    row.append(UI.button(next ? t('next') : t('menu'), 'main', () => (next ? goChapter(next) : goMenu())));
    b.appendChild(row);
  }, 'result'), 900);
}
