// Words, numbers and clock times in the chosen language.
import { save, persist } from './store.js';
import { S, NOTES } from '../data/strings.js';

export let L = save.lang === 'en' ? 'en' : 'ne';
const ND = '०१२३४५६७८९';

export function setLang(l) {
  L = l; save.lang = l; persist();
  document.documentElement.lang = l;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
}
export function num(n) { const s = String(n); return L === 'ne' ? s.replace(/\d/g, (d) => ND[d]) : s; }
export function t(k, v) {
  const e = S[k];
  let s = e ? e[L === 'ne' ? 0 : 1] : k;
  if (v) for (const key in v) s = s.split('{' + key + '}').join(typeof v[key] === 'number' ? num(v[key]) : v[key]);
  return s;
}
export function note(id) { return NOTES[id][L === 'ne' ? 0 : 1]; }
export function clock(min) {
  const h = Math.floor(min / 60), m = Math.floor(min % 60);
  return num((h > 12 ? h - 12 : h) + ':' + String(m).padStart(2, '0'));
}
