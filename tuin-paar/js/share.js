// 1080x1920 story image: the gorge at dawn, the tuin across it, and the result painted on a tin sign.
import { t, num, getLang } from './i18n.js';

const W = 1080; const H = 1920;
const FLAGS = ['#2a6fdb', '#f6f2ea', '#d7261e', '#2e9e4f', '#f2c230'];

async function fontsReady() {
  try { await Promise.all(['80px Anton', '800 60px Mukta', '500 40px Mukta'].map((f) => document.fonts.load(f, 'तुइन Aa'))); } catch { /* draw anyway */ }
}

function fit(ctx, text, max, size, font) {
  let s = size;
  do { ctx.font = font.replace('{s}', s); s -= 4; } while (ctx.measureText(text).width > max && s > 20);
}

const loadImg = (src) => new Promise((res) => {
  const i = new Image();
  i.onload = () => res(i); i.onerror = () => res(null);
  i.src = src;
});

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
}

export async function drawStory(d) {
  await fontsReady();
  const ne = getLang() === 'ne';
  const display = ne ? '800 {s}px Mukta' : '{s}px Anton';
  const [gorge, rock, water, weave, ...cast] = await Promise.all([
    loadImg('img/gorge.svg'), loadImg('img/rock.svg'), loadImg('img/water.svg'), loadImg('img/weave.svg'),
    ...d.cast.map((id) => loadImg(`img/${id}.webp`)),
  ]);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // backdrop: same dawn gorge as the game, cropped like CSS cover from the bottom
  ctx.fillStyle = '#241d19'; ctx.fillRect(0, 0, W, H);
  if (gorge) { const s = Math.max(W / 400, 1500 / 500); ctx.drawImage(gorge, (W - 400 * s) / 2, 1500 - 500 * s, 400 * s, 500 * s); }

  // river far below, then the two cliffs in procedural rock
  const pat = (img, sc) => { if (!img) return null; const p = ctx.createPattern(img, 'repeat'); p.setTransform(new DOMMatrix().scale(sc)); return p; };
  ctx.fillStyle = '#0f6b70'; ctx.fillRect(300, 1100, 480, H - 1100);
  const wp = pat(water, 1.6);
  if (wp) { ctx.globalAlpha = 0.55; ctx.fillStyle = wp; ctx.fillRect(300, 1100, 480, H - 1100); ctx.globalAlpha = 1; }
  const rp = pat(rock, 1.4) || '#5b4b40';
  const cliff = (pts, shadeX0, shadeX1) => {
    ctx.save();
    ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.fillStyle = '#5b4b40'; ctx.fill(); ctx.fillStyle = rp; ctx.fill(); ctx.clip();
    const g = ctx.createLinearGradient(shadeX0, 0, shadeX1, 0); g.addColorStop(0, '#0000'); g.addColorStop(1, '#000a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const top = ctx.createLinearGradient(0, 880, 0, 960); top.addColorStop(0, '#ffd9a870'); top.addColorStop(1, '#ffd9a800');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
  cliff([[0, 900], [120, 886], [250, 898], [318, 930], [300, 1010], [330, 1120], [300, 1260], [326, 1420], [296, 1600], [320, H], [0, H]], 120, 330);
  cliff([[W, 890], [960, 880], [830, 896], [762, 934], [782, 1020], [752, 1130], [784, 1270], [756, 1430], [786, 1600], [760, H], [W, H]], 960, 750);

  // steel cable and the prayer-flag string
  const cy = (x) => 830 + 300 * (x / W) * (1 - x / W);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2b2724'; ctx.lineWidth = 11;
  ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, cy(x)); ctx.stroke();
  ctx.strokeStyle = '#a8a19a'; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
  ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, cy(x) - 1); ctx.stroke();
  ctx.setLineDash([]);
  for (let k = 0; k < 13; k++) {
    const x = 120 + k * 66;
    ctx.save(); ctx.translate(x, cy(x) + 6); ctx.rotate(0.05);
    ctx.fillStyle = FLAGS[k % 5]; ctx.fillRect(-15, 0, 30, 40);
    const sh = ctx.createLinearGradient(-15, 0, 15, 0); sh.addColorStop(0, '#ffffff30'); sh.addColorStop(1, '#00000040');
    ctx.fillStyle = sh; ctx.fillRect(-15, 0, 30, 40);
    ctx.restore();
  }

  // basket mid-crossing, bamboo weave, carrying the first two of the cast
  const bx = 600; const by = cy(bx);
  ctx.strokeStyle = '#2b2724'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(bx - 60, by + 8); ctx.lineTo(bx - 84, by + 86); ctx.moveTo(bx + 60, by + 8); ctx.lineTo(bx + 84, by + 86); ctx.stroke();
  ctx.fillStyle = '#5b5550'; ctx.beginPath(); ctx.arc(bx, by, 22, 0, 7); ctx.fill();
  ctx.fillStyle = '#b9b2aa'; ctx.beginPath(); ctx.arc(bx, by, 12, 0, 7); ctx.fill();
  cast.slice(0, 2).forEach((img, i) => img && ctx.drawImage(img, bx - 120 + i * 112, by + 18, 128, 128));
  ctx.save();
  ctx.beginPath(); ctx.roundRect(bx - 140, by + 92, 280, 96, [8, 8, 26, 26]);
  ctx.fillStyle = pat(weave, 2.4) || '#9a5b2c'; ctx.fill(); ctx.clip();
  const bs = ctx.createLinearGradient(0, by + 92, 0, by + 188); bs.addColorStop(0, '#0000'); bs.addColorStop(1, '#0009');
  ctx.fillStyle = bs; ctx.fillRect(bx - 140, by + 92, 280, 96);
  ctx.restore();
  ctx.fillStyle = '#b47c3a'; ctx.beginPath(); ctx.roundRect(bx - 150, by + 84, 300, 18, 9); ctx.fill();

  // everyone else safe on the far cliff, with contact shadows
  const rest = cast.slice(2);
  rest.forEach((img, i) => {
    if (!img) return;
    const x = 806 + (i % 3) * 86; const y = 930 + Math.floor(i / 3) * 104;
    const sh = ctx.createRadialGradient(x + 50, y + 104, 2, x + 50, y + 104, 42); sh.addColorStop(0, '#000a'); sh.addColorStop(1, '#0000');
    ctx.fillStyle = sh; ctx.fillRect(x + 6, y + 92, 88, 24);
    ctx.drawImage(img, x, y, 104, 104);
  });

  // title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff4e0'; ctx.font = '170px Anton';
  ctx.shadowColor = '#0006'; ctx.shadowOffsetY = 8; ctx.shadowBlur = 18;
  ctx.fillText('TUIN PAAR', W / 2, 250);
  ctx.font = '800 78px Mukta';
  ctx.fillText('तुइन पार', W / 2, 350);
  ctx.shadowColor = 'transparent'; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0;

  // tin trail sign with the result
  const sx = 110; const sy = 1290; const sw = W - 220; const sh = 450;
  ctx.shadowColor = '#000a'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(sx - 10, sy - 10, sw + 20, sh + 20, 34); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#1f448f'; ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 26); ctx.fill();
  const tin = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh); tin.addColorStop(0, '#ffffff1c'); tin.addColorStop(0.5, '#0000'); tin.addColorStop(1, '#00000030');
  ctx.fillStyle = tin; ctx.fill();
  ctx.fillStyle = '#c9d3e8';
  [[sx + 30, sy + 30], [sx + sw - 30, sy + 30], [sx + 30, sy + sh - 30], [sx + sw - 30, sy + sh - 30]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#ffffff';
  fit(ctx, d.title, sw - 120, 64, '800 {s}px Mukta');
  ctx.fillText(d.title, W / 2, sy + 96);
  const big = `${num(d.trips)} ${t('trips').toUpperCase()}`;
  fit(ctx, big, sw - 100, 150, display);
  ctx.fillText(big, W / 2, sy + 250);
  for (let k = 0; k < 3; k++) {
    starPath(ctx, W / 2 + (k - 1) * 110, sy + 322, 44);
    ctx.fillStyle = k < d.stars ? '#f2b51d' : '#ffffff26'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = k < d.stars ? '#9a6a00' : '#ffffff40'; ctx.stroke();
  }
  ctx.fillStyle = '#d9e4ff';
  const extra = [`${t('par')} ${num(d.par)}`, d.oops ? t('oops', { n: d.oops }) : t('firstTry'), d.hinted ? t('hinted') : null].filter(Boolean).join(' · ');
  fit(ctx, extra, sw - 80, 44, '500 {s}px Mukta');
  ctx.fillText(extra, W / 2, sy + 418);

  // footer
  ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.roundRect(170, 1790, 740, 84, 42); ctx.fill();
  ctx.fillStyle = '#221a15';
  fit(ctx, t('storyCta'), 680, 46, '800 {s}px Mukta');
  ctx.fillText(t('storyCta'), W / 2, 1846);
  return c;
}

export async function shareStory(d) {
  const canvas = await drawStory(d);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return null;
  const file = new File([blob], d.file, { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: d.text });
      return null;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return null;
  }
  let copied = false;
  try { await navigator.clipboard.writeText(d.text); copied = true; } catch { /* no clipboard */ }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return copied ? `${t('saved')} · ${t('copied')}` : t('saved');
}
