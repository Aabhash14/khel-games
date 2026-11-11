// The 1080×1920 story card, its preview, and sharing.
import { ART as A } from '../art/side.js';
import { E } from '../core/engine.js';
import { UI } from '../core/ui.js';
import { t, L } from '../core/i18n.js';
import { save } from '../core/store.js';
import { Photo } from '../core/photo.js';
import { PHOTO_CREDITS } from '../data/credits.js';

export const CARD_PHOTO = 'start';

export const rank = (n) => (n >= 9 ? 3 : n >= 7 ? 2 : n >= 4 ? 1 : 0);

export function renderCard(n) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
  const g = c.getContext('2d'), Wc = 1080, Hc = 1920;
  A.use(g);
  g.save(); g.beginPath(); g.rect(60, 60, Wc - 120, 1040); g.clip();
  const ph = Photo.image(CARD_PHOTO);
  if (ph) {
    // a real Indra Jatra photograph, cover-fitted, warmed, with a soft vignette
    const bw = Wc - 120, bh = 1040, ia = ph.naturalWidth / ph.naturalHeight, ba = bw / bh;
    const sw = ia > ba ? ph.naturalHeight * ba : ph.naturalWidth, sh = ia > ba ? ph.naturalHeight : ph.naturalWidth / ba;
    g.drawImage(ph, (ph.naturalWidth - sw) / 2, (ph.naturalHeight - sh) * 0.45, sw, sh, 60, 60, bw, bh);
    g.fillStyle = 'rgba(255,170,90,.08)'; g.fillRect(60, 60, bw, bh);
    const vg = g.createRadialGradient(Wc / 2, 560, 300, Wc / 2, 560, 760); vg.addColorStop(0, 'rgba(10,4,8,0)'); vg.addColorStop(1, 'rgba(10,4,8,.6)');
    g.fillStyle = vg; g.fillRect(60, 60, bw, bh);
    const cr = PHOTO_CREDITS.find((c) => c.key === CARD_PHOTO);
    if (cr) { g.font = "600 24px 'Mukta',sans-serif"; g.textAlign = 'right'; g.fillStyle = 'rgba(255,243,214,.85)'; g.fillText(t('photoBy') + ': ' + cr.artist + ' · ' + cr.license + ' · Wikimedia Commons', Wc - 84, 1084); }
  } else {
    A.sky(Wc, 1100, 2.7); A.moon(860, 200, 46);
    A.street(Wc, 760, 21, 2.7, 0, 2.1); A.ground(Wc, 760, 1100, 2.7);
    A.rath(370, 1000, 600, 1.2, 'kumari', 0);
    A.lakhey(900, 1050, 380, 0.6, 'calm', -1);
  }
  g.restore();
  g.lineWidth = 16; g.strokeStyle = '#d8a535'; g.strokeRect(60, 60, Wc - 120, 1040);
  g.fillStyle = '#7d1610'; g.fillRect(0, 0, Wc, 60); g.fillRect(0, 1100, Wc, Hc - 1100); g.fillRect(0, 0, 60, 1100); g.fillRect(Wc - 60, 0, 60, 1100);
  g.fillStyle = '#f3e5c4'; g.fillRect(60, 1130, Wc - 120, 730);
  g.lineWidth = 6; g.strokeStyle = '#d8a535'; g.strokeRect(74, 1144, Wc - 148, 702);
  const F = "'Mukta','Nirmala UI','Noto Sans Devanagari',sans-serif";
  g.textAlign = 'center';
  g.fillStyle = '#7d1610'; g.font = '800 120px ' + F; g.fillText(L === 'ne' ? 'इन्द्रजात्रा' : 'Indra Jatra', Wc / 2, 1290);
  g.fillStyle = '#5b3a22'; g.font = '700 46px ' + F; g.fillText(t('finalKicker'), Wc / 2, 1360);
  g.fillStyle = '#2a130a'; g.font = '800 76px ' + F; g.fillText(t('rank' + rank(n)), Wc / 2, 1470);
  for (let k = 0; k < 9; k++) {
    const x = Wc / 2 + (k - 4) * 96, y = 1585;
    A.diyo(x, y, 30, k < n, 1 + k);
    if (k >= n) { g.fillStyle = 'rgba(243,229,196,.6)'; g.beginPath(); g.arc(x, y - 4, 32, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = '#2a130a'; g.font = '700 40px ' + F;
  const dots = (k) => '●'.repeat(save.best[k] || 0) + '○'.repeat(3 - (save.best[k] || 0));
  g.fillText(`${t('c_yosin')} ${dots('yosin')}   ${t('c_lakhey')} ${dots('lakhey')}   ${t('c_rath')} ${dots('rath')}`, Wc / 2, 1690);
  const extra = [save.memory ? t('cardAji', { m: t('m_' + save.memory) }) : '', save.lucky ? '🐟 ' + t('cardFish') : ''].filter(Boolean).join('   ·   ');
  if (extra) g.fillText(extra, Wc / 2, 1752);
  g.fillStyle = '#f6d77a'; g.font = '700 34px ' + F;
  g.fillText((location.host || 'khel') + location.pathname.replace(/index\.html$/, ''), Wc / 2, 1900 - 18);
  A.use(E.g);
  return c;
}

export function showCard(n, onMenu) {
  const big = renderCard(n);
  UI.sheet((b, mk) => {
    b.append(mk('p', 'kicker', t('finalKicker')), mk('h2', '', t('rank' + rank(n))));
    const pv = mk('canvas', 'card-preview'); pv.width = 540; pv.height = 960; pv.setAttribute('role', 'img'); pv.setAttribute('aria-label', t('rank' + rank(n)));
    pv.getContext('2d').drawImage(big, 0, 0, 540, 960);
    const msg = mk('p', 'hint');
    b.append(pv, mk('p', 'lede', t('finalText', { lamps: t('lampsOf', { n }) })));
    const row = mk('div', 'row');
    row.append(UI.button(t('share'), 'main', () => share(big, n, msg)), UI.button(t('menu'), '', onMenu));
    b.append(row, msg);
  }, 'final');
}

function share(c, n, msg) {
  const text = t('shareText', { n });
  c.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], 'indra-jatra.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title: 'Indra Jatra' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'indra-jatra.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    msg.textContent = t('saved');
  }, 'image/png');
}
