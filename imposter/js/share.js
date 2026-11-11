// 1080x1920 story image of the round, drawn as a notebook page with a rubber stamp.
import { t, num, getLang } from './i18n.js';

const W = 1080; const H = 1920;

async function fontsReady() {
  const ne = getLang() === 'ne';
  const want = ['80px Anton', '700 80px Kalam', '800 60px Mukta'];
  try { await Promise.all(want.map((f) => document.fonts.load(f, ne ? 'नक्कली Aa' : 'Aa'))); } catch { /* draw anyway */ }
}

function fit(ctx, text, max, size, font) {
  let s = size;
  do { ctx.font = font.replace('{s}', s); s -= 4; } while (ctx.measureText(text).width > max && s > 24);
}

function stamp(ctx, text, x, y, color, rot, font) {
  // Drawn on its own layer so the grunge holes show the paper, not a transparent hole.
  const layer = document.createElement('canvas'); layer.width = 900; layer.height = 300;
  const s = layer.getContext('2d');
  s.translate(450, 150);
  fit(s, text, 700, 150, font);
  const w = s.measureText(text).width + 70;
  s.strokeStyle = color; s.fillStyle = color; s.lineWidth = 14;
  s.textAlign = 'center'; s.textBaseline = 'middle';
  s.beginPath(); s.roundRect(-w / 2, -105, w, 210, 22); s.stroke();
  s.fillText(text, 0, 10);
  s.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) {
    s.globalAlpha = Math.random() * 0.8;
    s.beginPath(); s.arc((Math.random() - 0.5) * w, (Math.random() - 0.5) * 220, Math.random() * 4, 0, 7); s.fill();
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(layer, -450, -150); ctx.restore();
}

export async function drawStory(d) {
  await fontsReady();
  const ne = getLang() === 'ne';
  const display = ne ? '800 {s}px Mukta' : '{s}px Anton';
  const hand = '700 {s}px Kalam';
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // desk + page
  ctx.fillStyle = '#24283a'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.012);
  ctx.shadowColor = '#0009'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#fbf7ea'; ctx.fillRect(-470, -880, 940, 1760);
  ctx.restore();
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.012); ctx.translate(-W / 2, -H / 2);
  ctx.beginPath(); ctx.rect(70, 80, 940, 1760); ctx.clip();
  ctx.fillStyle = '#c3d3ea';
  for (let y = 200; y < 1840; y += 64) ctx.fillRect(70, y, 940, 3);
  ctx.fillStyle = '#e9a3a3'; ctx.fillRect(170, 80, 4, 1760);
  ctx.restore();

  const L = 220; // left text edge
  ctx.textBaseline = 'alphabetic';
  // header
  ctx.fillStyle = '#5e5a52'; ctx.font = '700 44px Kalam';
  ctx.fillText(`${t('roundN', { n: d.round })} · ${t('subtitle')}`, L, 182);
  stamp(ctx, 'IMPOSTER', 520, 330, '#d62828', -0.09, '{s}px Anton');

  // outcome headline
  const crewWon = d.outcome === 'crew';
  const head = crewWon ? t('headCrew') : d.outcome === 'stolen' ? t('headStolen') : t('headEscaped');
  ctx.fillStyle = crewWon ? '#1f3a9e' : '#d62828';
  fit(ctx, head, 700, 130, display);
  ctx.fillText(head, L, 610);

  // the imposter, highlighted
  ctx.fillStyle = '#4b5f9e'; ctx.font = ne ? '500 48px Mukta' : '700 48px Kalam';
  ctx.fillText(t('storyImp'), L, 740);
  fit(ctx, d.imposter, 740, 150, hand);
  const nw = ctx.measureText(d.imposter).width;
  ctx.fillStyle = '#ff8ac1cc'; ctx.save(); ctx.transform(1, 0, -0.2, 1, 0, 0);
  ctx.fillRect(L + 160, 800, nw + 30, 66); ctx.restore();
  ctx.fillStyle = '#1f3a9e'; ctx.fillText(d.imposter, L, 860);

  // two chits: crew word / imposter word
  const chit = (x, y, rot, label, word, top) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = '#0004'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, 360, 220);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = top; ctx.fillRect(0, 0, 360, 12);
    ctx.fillStyle = '#5e5a52'; ctx.font = '500 34px Mukta'; ctx.fillText(label, 26, 70);
    ctx.fillStyle = '#1f3a9e'; fit(ctx, word, 310, 72, hand); ctx.fillText(word, 26, 165);
    ctx.restore();
  };
  chit(L - 20, 960, -0.04, t('crewWord'), d.word, '#1f3a9e');
  chit(L + 380, 990, 0.05, t('impHad', { name: d.impName }).slice(0, 22), d.impWord, '#d62828');

  // scoreboard
  ctx.fillStyle = '#5e5a52'; ctx.font = '700 46px Kalam'; ctx.fillText(t('scores'), L, 1340);
  d.board.slice(0, 5).forEach((p, k) => {
    const y = 1420 + k * 64;
    ctx.fillStyle = '#5e5a52'; ctx.font = '700 36px Kalam'; ctx.fillText(num(k + 1), L, y);
    ctx.fillStyle = p.imp ? '#d62828' : '#1f3a9e';
    fit(ctx, p.name, 520, 46, hand); ctx.fillText(p.name, L + 60, y);
    ctx.font = '52px Anton'; ctx.textAlign = 'right'; ctx.fillText(num(p.score), 940, y); ctx.textAlign = 'left';
  });

  // footer
  ctx.fillStyle = '#ffe94d'; ctx.fillRect(L - 10, 1760, 640, 54);
  ctx.fillStyle = '#1f3a9e'; ctx.font = ne ? '800 40px Mukta' : '700 40px Kalam';
  ctx.fillText(t('storyCta'), L, 1800);
  return c;
}

export async function shareStory(d) {
  const canvas = await drawStory(d);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return null;
  const file = new File([blob], `imposter-round-${d.round}.png`, { type: 'image/png' });
  const text = t('shareText', { name: d.imposter, w: d.word });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return null;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return null;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return t('saved');
}
