// 1080x1920 story image of the rivalry, painted like the back of a tempo: crown, medals, panels, bumper stripes.
import { t, num, getLang } from './i18n.js';

const W = 1080; const H = 1920;
const C = { green: '#0c5a3b', green2: '#08402a', yellow: '#ffcb1f', red: '#d41f16', blue: '#1f52d4', pink: '#ff4f9a', leaf: '#17803a', white: '#fffaf0', ink: '#141210' };
const FILLS = [[C.red, C.white], [C.blue, C.white], [C.yellow, C.ink], [C.pink, C.ink], [C.leaf, C.white]];

function fit(ctx, text, max, size, font) {
  let s = size;
  do { ctx.font = font.replace('{s}', s); s -= 4; } while (ctx.measureText(text).width > max && s > 20);
}

function bumper(x, y) {
  x.save(); x.beginPath(); x.rect(0, y, W, 60); x.clip();
  x.fillStyle = C.yellow; x.fillRect(0, y, W, 60);
  x.fillStyle = C.ink;
  for (let i = -2; i < 40; i++) { x.beginPath(); x.moveTo(i * 72, y); x.lineTo(i * 72 + 36, y); x.lineTo(i * 72 + 96, y + 60); x.lineTo(i * 72 + 60, y + 60); x.fill(); }
  x.restore();
}

// painted panel: fill, ink keyline, white pinstripe
function panel(x, px, py, pw, ph, r, fill) {
  x.fillStyle = fill; x.beginPath(); x.roundRect(px, py, pw, ph, r); x.fill();
  x.lineWidth = 6; x.strokeStyle = C.ink; x.beginPath(); x.roundRect(px + 3, py + 3, pw - 6, ph - 6, r - 3); x.stroke();
  x.lineWidth = 5; x.strokeStyle = C.white; x.beginPath(); x.roundRect(px + 16, py + 16, pw - 32, ph - 32, r - 12); x.stroke();
}

function disc(x, cx, cy, r, c) {
  x.fillStyle = C.ink; x.beginPath(); x.arc(cx, cy, r + 5, 0, 7); x.fill();
  x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  x.strokeStyle = C.white; x.lineWidth = 7; x.beginPath(); x.arc(cx, cy, r - 9, 0, 7); x.stroke();
}

export async function drawStory({ names, totals, games }) {
  const ne = getLang() === 'ne';
  try { await Promise.all(['80px Bungee', "80px 'Bungee Shade'", "60px 'Yatra One'", '600 40px Hind'].map((f) => document.fonts.load(f, 'जोडी Aa'))); } catch { /* draw anyway */ }
  const sign = ne ? "{s}px 'Yatra One'" : '{s}px Bungee';
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';

  x.fillStyle = C.green; x.fillRect(0, 0, W, H);
  bumper(x, 0); bumper(x, H - 60);

  // crown
  x.fillStyle = C.yellow; x.beginPath();
  x.moveTo(70, 470); x.lineTo(70, 300); x.bezierCurveTo(70, 120, 1010, 120, 1010, 300); x.lineTo(1010, 470); x.closePath(); x.fill();
  x.fillStyle = C.red; x.font = "230px 'Bungee Shade'"; x.fillText('DUO', W / 2, 360);
  x.font = "110px 'Yatra One'"; x.fillStyle = C.ink; x.fillText('जोडी', W / 2 + 10, 460); x.fillStyle = C.white; x.fillText('जोडी', W / 2 + 5, 455); x.fillStyle = C.blue; x.fillText('जोडी', W / 2, 450);

  // ribbon
  x.fillStyle = C.ink; x.fillRect(250, 486, 580, 86); x.fillStyle = C.white; x.fillRect(256, 492, 568, 74); x.fillStyle = C.red; x.fillRect(262, 498, 556, 62);
  x.fillStyle = C.white; x.font = "46px 'Yatra One'"; x.fillText('पालो पर्खनुस्', W / 2, 545);

  // medals
  const cols = [C.red, C.blue];
  [0, 1].forEach((i) => {
    const mx = i ? 600 : 70; const mw = 410;
    x.fillStyle = C.white; x.beginPath(); x.roundRect(mx, 620, mw, 150, 75); x.fill();
    const dx = i ? mx + mw - 75 : mx + 75;
    disc(x, dx, 695, 58, cols[i]);
    x.fillStyle = C.white; x.font = '58px Bungee'; x.fillText(num(totals[i]), dx, 716);
    x.fillStyle = C.ink; fit(x, names[i], 240, 56, "{s}px 'Yatra One'"); x.fillText(names[i], i ? mx + 145 : mx + 265, 714);
  });
  x.fillStyle = C.yellow; x.font = "44px 'Yatra One'"; x.fillText('बनाम', W / 2, 712);
  const lead = totals[0] === totals[1] ? null : totals[0] > totals[1] ? 0 : 1;
  if (lead != null) { x.fillStyle = C.yellow; x.font = '34px Bungee'; x.fillText(ne ? 'अगाडि' : 'LEADS', lead ? 805 : 275, 812); }

  // nine painted panels
  const gx = 70; const gy = 850; const gap = 24; const pw = (W - 140 - 2 * gap) / 3; const ph = 270;
  games.forEach((gm, k) => {
    const px = gx + (k % 3) * (pw + gap); const py = gy + Math.floor(k / 3) * (ph + gap);
    const [fill, ink] = FILLS[k % 5];
    panel(x, px, py, pw, ph, 28, fill);
    x.fillStyle = ink; fit(x, gm.name, pw - 60, ne ? 46 : 30, sign); x.fillText(gm.name, px + pw / 2, py + 90);
    x.font = '84px Bungee'; x.fillText(`${num(gm.w[0])}·${num(gm.w[1])}`, px + pw / 2, py + 200);
  });

  x.fillStyle = C.white; fit(x, t('kicker'), 900, 44, ne ? "{s}px 'Yatra One'" : '{s}px Bungee'); x.fillText(t('kicker'), W / 2, H - 150);
  x.fillStyle = C.yellow; x.font = ne ? "40px 'Yatra One'" : '600 40px Hind'; x.fillText(t('shareFoot'), W / 2, H - 92);
  return c;
}

export async function shareStory(data) {
  const c = await drawStory(data);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  if (!blob) return 'fail';
  const file = new File([blob], 'duo-rivalry.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Duo · जोडी' }); return 'shared'; }
  } catch (e) { if (e?.name === 'AbortError') return 'cancel'; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'duo-rivalry.png';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'saved';
}
