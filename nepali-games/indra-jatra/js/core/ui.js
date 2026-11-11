// DOM layer over the canvas: HUD, subtitles, thumb controls, chapter banners and sheets.
import { bindButton, clearAll, setEnabled } from './input.js';
import { t } from './i18n.js';
import { SFX } from './audio.js';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

export const ICON = {
  ropeL: '<svg viewBox="0 0 48 48"><path d="M42 6C32 16 22 26 9 34" stroke-width="3" stroke-dasharray="2 3"/><path d="M9 34l12 1M9 34l5-11" stroke-width="5"/><circle cx="26" cy="22" r="5" fill="currentColor" stroke="none"/></svg>',
  ropeR: '<svg viewBox="0 0 48 48"><path d="M6 6c10 10 20 20 33 28" stroke-width="3" stroke-dasharray="2 3"/><path d="M39 34l-12 1M39 34l-5-11" stroke-width="5"/><circle cx="22" cy="22" r="5" fill="currentColor" stroke="none"/></svg>',
  wind: '<svg viewBox="0 0 48 48"><path d="M6 18h24a6 6 0 1 0-6-6M6 26h32a6 6 0 1 1-6 6M6 34h14" stroke-width="4"/></svg>',
  fwd: '<svg viewBox="0 0 48 48"><path d="M14 12l14 12-14 12M24 12l14 12-14 12" stroke-width="5"/></svg>',
  back: '<svg viewBox="0 0 48 48"><path d="M34 12L20 24l14 12M24 12L10 24l14 12" stroke-width="5"/></svg>',
  shout: '<svg viewBox="0 0 48 48"><path d="M8 20v8h6l14 8V12l-14 8z" stroke-width="3.5" fill="currentColor"/><path d="M34 16c3 2 4 5 4 8s-1 6-4 8M38 10c5 4 7 9 7 14s-2 10-7 14" stroke-width="3"/></svg>',
  left: '<svg viewBox="0 0 48 48"><path d="M30 10L16 24l14 14" stroke-width="6"/></svg>',
  right: '<svg viewBox="0 0 48 48"><path d="M18 10l14 14-14 14" stroke-width="6"/></svg>',
  pull: '<svg viewBox="0 0 48 48"><path d="M24 40V10M12 22l12-12 12 12" stroke-width="6"/></svg>',
  brake: '<svg viewBox="0 0 48 48"><rect x="13" y="13" width="22" height="22" rx="3" stroke-width="5"/></svg>',
  walk: '<svg viewBox="0 0 48 48"><path d="M16 38l6-12 6 4 4 8M22 26l2-10 8 4 4 6M24 16l-6 2-4 6" stroke-width="3.5"/><circle cx="27" cy="9" r="4" fill="currentColor" stroke="none"/></svg>',
  shield: '<svg viewBox="0 0 48 48"><path d="M24 12c4 6 5 9 0 15-5-6-4-9 0-15z" fill="currentColor" stroke="none"/><path d="M8 26c2 10 8 14 16 14s14-4 16-14" stroke-width="4.5"/></svg>',
  lamp: '<svg viewBox="0 0 48 48"><path d="M24 6c5 8 6 12 0 19-6-7-5-11 0-19z" fill="currentColor" stroke="none"/><path d="M8 28h32c-2 8-9 12-16 12S10 36 8 28z" fill="currentColor" stroke="none"/></svg>',
  catch: '<svg viewBox="0 0 48 48"><path d="M8 20h32l-4 16H12z" stroke-width="4"/><path d="M18 12c4 3 8 3 12 0" stroke-width="3"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke-width="2"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6" stroke-width="2.2"/></svg>',
};
const KEYNAME = { left: '←', right: '→', up: '↑', down: '↓', action: 'Space' };

export function lampSVG(on, cls = '') {
  return `<svg class="lamp ${on ? '' : 'off'} ${cls}" viewBox="0 0 48 48" aria-hidden="true"><path class="flame" d="M24 6c5 8 6 12 0 20-6-8-5-12 0-20z" fill="#ffc94a"/><path class="flame" d="M24 14c2 4 2 6 0 10-2-4-2-6 0-10z" fill="#fff4c8"/><path class="bowl" d="M6 28h36c-2 9-10 13-18 13S8 37 6 28z" fill="#a0522d"/><path d="M6 28h36" stroke="#5a2a12" stroke-width="2"/></svg>`;
}

let onPause = null, sayTimer = 0;
const statEls = {};

export const UI = {
  init() {
    $('#pauseBtn').innerHTML = ICON.pause;
    $('#pauseBtn').addEventListener('click', () => onPause && onPause());
  },
  hud(title, sub, pauseFn) {
    $('#hud').hidden = false;
    $('#hudTitle').textContent = title; $('#hudSub').textContent = sub || '';
    onPause = pauseFn; $('#hudStats').innerHTML = '';
    for (const k in statEls) delete statEls[k];
  },
  sub(text) { $('#hudSub').textContent = text; },
  hideHud() { $('#hud').hidden = true; onPause = null; },
  stats(defs) {
    const box = $('#hudStats'); box.innerHTML = '';
    for (const d of defs) {
      const c = el('div', 'chip' + (d.wide ? ' wide' : ''));
      const l = el('span', 'chip-l', d.label), v = el('b', 'chip-v', d.value ?? '');
      c.append(l, v);
      let bar = null;
      if (d.meter) { const m = el('i', 'chip-m'); bar = el('i', 'chip-mf'); m.appendChild(bar); c.appendChild(m); }
      box.appendChild(c);
      statEls[d.id] = { c, v, bar };
    }
  },
  stat(id, value, cls, meter) {
    const s = statEls[id]; if (!s) return;
    if (s.v.textContent !== value) s.v.textContent = value;
    const want = 'chip' + (cls ? ' ' + cls : '') + (s.c.classList.contains('wide') ? ' wide' : '');
    if (s.c.className !== want) s.c.className = want;
    if (s.bar && meter !== undefined) s.bar.style.transform = `scaleX(${Math.max(0, Math.min(1, meter))})`;
  },
  say(text, tone = '', ms = 2600) {
    const box = $('#say');
    box.className = 'say show ' + tone; box.textContent = text;
    clearTimeout(sayTimer);
    if (ms) sayTimer = setTimeout(() => { box.className = 'say ' + tone; }, ms);
  },
  hush() { clearTimeout(sayTimer); $('#say').className = 'say'; },
  controls(defs) {
    clearAll();
    const box = $('#controls'); box.innerHTML = ''; box.hidden = !defs.length;
    for (const d of defs) {
      const b = el('button', `ctl ${d.pos} ${d.size || ''}`);
      b.type = 'button'; b.dataset.action = d.action;
      b.setAttribute('aria-label', d.label);
      b.innerHTML = `<span class="ctl-ring"></span><span class="ctl-ico" aria-hidden="true">${ICON[d.icon] || ''}</span><span class="ctl-lbl"></span><kbd>${KEYNAME[d.action] || ''}</kbd>`;
      b.querySelector('.ctl-lbl').textContent = d.label;
      bindButton(b, d.action, d.onPress);
      box.appendChild(b);
    }
    setEnabled(true);
  },
  setControl(action, o) {
    const b = document.querySelector(`.ctl[data-action="${action}"]`); if (!b) return;
    if (o.disabled !== undefined && b.disabled !== o.disabled) { b.disabled = o.disabled; if (o.disabled) b.classList.remove('on'); }
    if (o.label !== undefined) { b.querySelector('.ctl-lbl').textContent = o.label; b.setAttribute('aria-label', o.label); }
    if (o.progress !== undefined) b.style.setProperty('--p', Math.max(0, Math.min(1, o.progress)));
    if (o.hot !== undefined) b.classList.toggle('hot', o.hot);
    if (o.hidden !== undefined) b.hidden = o.hidden;
  },
  hideControls() { $('#controls').hidden = true; $('#controls').innerHTML = ''; clearAll(); },
  // cinematic chapter title
  banner(kicker, title, ms = 2200) {
    const b = $('#banner');
    b.querySelector('.bn-k').textContent = kicker; b.querySelector('.bn-t').textContent = title;
    b.hidden = false; b.classList.remove('out'); void b.offsetWidth; b.classList.add('in');
    return new Promise((res) => setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.hidden = true; b.classList.remove('in', 'out'); res(); }, 450); }, ms));
  },
  // bottom sheet; build(body) fills it. Returns the body element.
  sheet(build, cls = '') {
    setEnabled(false);
    const wrap = $('#sheet'), body = $('#sheetBody');
    body.className = 'sheet ' + cls; body.innerHTML = '';
    build(body, el);
    wrap.hidden = false; wrap.classList.remove('show'); void wrap.offsetWidth; wrap.classList.add('show');
    setTimeout(() => body.querySelector('.btn.main, button')?.focus({ preventScroll: true }), 60);
    return body;
  },
  closeSheet() { const w = $('#sheet'); w.classList.remove('show'); w.hidden = true; setEnabled(true); },
  get sheetOpen() { return !$('#sheet').hidden; },
  button(text, cls, fn) {
    const b = el('button', 'btn ' + (cls || ''), text); b.type = 'button';
    b.addEventListener('click', () => { SFX.ui(); fn(); });
    return b;
  },
  // how-to card before a chapter: rows of [icon, text]
  howTo(kicker, title, intro, rows) {
    return new Promise((res) => {
      UI.sheet((b, mk) => {
        b.append(mk('p', 'kicker', kicker), mk('h2', '', title), mk('p', 'lede', intro));
        const ul = mk('ul', 'howto');
        for (const [icon, text] of rows) { const li = mk('li'); const i = mk('span', 'how-ico'); i.innerHTML = ICON[icon] || ''; li.append(i, mk('span', '', text)); ul.appendChild(li); }
        b.appendChild(ul);
        const row = mk('div', 'row');
        row.append(UI.button(t('start'), 'main', () => { UI.closeSheet(); res(); }));
        b.appendChild(row);
      }, 'howto-sheet');
    });
  },
  floatText(x, y, text, cls = '') {
    const e = el('div', 'float ' + cls, text);
    e.style.left = x + 'px'; e.style.top = y + 'px';
    document.body.appendChild(e); setTimeout(() => e.remove(), 1400);
  },
};
