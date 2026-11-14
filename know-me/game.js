// Know Me: open a pack, answer 8 cards, pull your holo card. Then friends guess your picks.
// Plain JS, no backend. Challenge links carry the answers in the URL hash.
(() => {
  'use strict';

  const PER_AXIS = 2; // 2 per trait -> 8 questions
  const app = document.getElementById('app');
  const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
  const KEYS = Object.keys(ARCHETYPES);
  const LETTERS = ['A', 'B', 'C', 'D'];
  const INK = '#0b0b2e';
  const COBALT = '#2140ff';

  // ---------- storage & language ----------
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('knowme.' + k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem('knowme.' + k, JSON.stringify(v)); } catch { /* blocked: fine */ } },
  };
  let lang = store.get('lang') === 'ne' ? 'ne' : 'en';
  const t = (pair) => (Array.isArray(pair) ? pair[lang === 'ne' ? 1 : 0] : pair);
  const fmt = (pair, vars = {}) => t(pair).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  const num = (n) => (lang === 'ne' ? String(n).replace(/\d/g, (d) => '०१२३४५६७८९'[d]) : String(n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const baseUrl = () => location.href.split('#')[0];
  const cleanName = (s) => String(s || '').replace(/[~\n\r]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));

  // ---------- icons (authored, 24px, 2px stroke) ----------
  const ICON = {
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    save: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    send: '<path d="M4 12l16-8-6 16-3-7-7-1z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    redo: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>',
  };
  const icon = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

  // ---------- scoring ----------
  function drawQuestions() {
    const picked = [];
    for (const ax of AXES) picked.push(...shuffle(SCENARIOS.filter((s) => s.axis === ax.id)).slice(0, PER_AXIS));
    let order = shuffle(picked);
    for (let i = 0; i < 50 && order.some((s, k) => k && order[k - 1].axis === s.axis); i++) order = shuffle(picked);
    return order.map((s) => s.id);
  }

  function score(qids, answers) {
    const pcts = {};
    for (const ax of AXES) {
      let sum = 0, max = 0, min = 0;
      qids.forEach((id, i) => {
        const ws = byId[id].o.map((o) => o[2][ax.id] || 0);
        max += Math.max(...ws); min += Math.min(...ws);
        sum += byId[id].o[answers[i]][2][ax.id] || 0;
      });
      let pct = max === min ? 50 : Math.round((100 * (sum - min)) / (max - min));
      if (pct === 50) pct = sum >= 0 ? 51 : 49;
      pcts[ax.id] = pct;
    }
    const key = AXES.map((ax) => (pcts[ax.id] >= 50 ? ax.a.key : ax.b.key)).join('');
    const poles = AXES.map((ax) => {
      const p = pcts[ax.id], win = p >= 50 ? ax.a : ax.b;
      return { ax, pole: win, val: p >= 50 ? p : 100 - p };
    });
    const strongest = poles.slice().sort((a, b) => b.val - a.val)[0];
    return { pcts, key, type: ARCHETYPES[key], poles, strongest, no: KEYS.indexOf(key) + 1, seed: hash(qids.join('.') + '|' + answers.join('')) };
  }

  function lean(scenario, oi) {
    const w = scenario.o[oi][2][scenario.axis] || 0;
    const ax = AXES.find((a) => a.id === scenario.axis);
    return w > 0 ? ax.a.color : w < 0 ? ax.b.color : null;
  }

  function compat(a, b) {
    const diff = AXES.reduce((s, ax) => s + Math.abs(a.pcts[ax.id] - b.pcts[ax.id]), 0) / AXES.length;
    const match = Math.round(100 - diff);
    const lines = AXES.map((ax) => {
      const pa = a.pcts[ax.id] >= 50, pb = b.pcts[ax.id] >= 50;
      return COMPAT_LINES[ax.id][pa === pb ? (pa ? 0 : 1) : 2];
    });
    const head = match >= 85 ? UI.twins : match >= 70 ? UI.easy : match >= 55 ? UI.balance : UI.opposite;
    return { match, lines, head };
  }

  // ---------- seeded card art ----------
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed || 1; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  const f = (n) => n.toFixed(1);
  const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  function star(cx, cy, r, pts, inner, rot) {
    let d = '';
    for (let i = 0; i < pts * 2; i++) {
      const rr = i % 2 ? r * inner : r, a = rot + (i * Math.PI) / pts;
      d += (i ? 'L' : 'M') + f(cx + rr * Math.cos(a)) + ' ' + f(cy + rr * Math.sin(a));
    }
    return d + 'Z';
  }
  function heart(cx, cy, s, rot) {
    const P = [[0, -0.35], [0, -0.85, -0.95, -0.85, -0.95, -0.2], [-0.95, 0.3, -0.35, 0.6, 0, 0.95], [0.35, 0.6, 0.95, 0.3, 0.95, -0.2], [0.95, -0.85, 0, -0.85, 0, -0.35]];
    const c = Math.cos(rot), sn = Math.sin(rot);
    const tp = (x, y) => f(cx + s * (x * c - y * sn)) + ' ' + f(cy + s * (x * sn + y * c));
    return `M${tp(...P[0])}` + P.slice(1).map((q) => `C${tp(q[0], q[1])} ${tp(q[2], q[3])} ${tp(q[4], q[5])}`).join('') + 'Z';
  }

  // One emblem per type (20x20 box, even-odd fill) so every card in the set has its own face.
  const EMBLEMS = {
    BOHP: () => 'M2 16L3.5 6L7.5 10.5L10 3.5L12.5 10.5L16.5 6L18 16Z',
    BOHF: () => 'M11.5 1.5L3.5 11.5H9L7.5 18.5L16.5 8H11Z',
    BORP: () => 'M10 1.5C14 6 16.5 9 16.5 12.8C16.5 16.4 13.6 19 10 19C6.4 19 3.5 16.4 3.5 12.8C3.5 10 5.2 8 6.8 6.2C7.2 9 8.4 10.4 10 10.6C10.3 7.5 9.3 4.8 10 1.5Z',
    BORF: () => 'M10 1L12.2 7.8L19 10L12.2 12.2L10 19L7.8 12.2L1 10L7.8 7.8Z',
    BIHP: () => circ(10, 10, 8.5) + circ(10, 10, 5.5) + circ(10, 10, 2.6),
    BIHF: () => star(10, 10, 9.5, 8, 0.74, 0) + circ(10, 10, 3),
    BIRP: () => 'M10 1.5L17.5 9.5H12.5V18.5H7.5V9.5H2.5Z',
    BIRF: () => 'M10 1L14.2 10L10 19L5.8 10Z' + circ(10, 10, 1.9),
    SOHP: () => 'M2.5 10.5L6 7L9 10L15 3.5L18.5 7L9 16.5Z',
    SOHF: () => 'M7.5 2H12.5V7.5H18V12.5H12.5V18H7.5V12.5H2V7.5H7.5Z',
    SORP: () => 'M10 2L18.5 9.5V18H1.5V9.5Z' + 'M8 18V12.5H12V18Z',
    SORF: () => circ(6.2, 10, 5.2) + circ(13.8, 10, 5.2),
    SIHP: () => 'M3.5 9H16.5V18.5H3.5Z' + circ(10, 13.6, 1.7) + 'M5.5 9V6.5A4.5 4.5 0 0 1 14.5 6.5V9H12V6.5A2 2 0 0 0 8 6.5V9Z',
    SIHF: () => 'M1 10Q10 1.5 19 10Q10 18.5 1 10Z' + circ(10, 10, 4.4) + circ(10, 10, 2.1),
    SIRP: () => 'M10 1L18 4V10C18 15 14 18 10 19C6 18 2 15 2 10V4Z',
    SIRF: () => 'M13 2A8 8 0 1 0 18.5 14A6.5 6.5 0 1 1 13 2Z',
  };
  const MARK = {
    power: 'M11.5 1.5L3.5 11.5H9L7.5 18.5L16.5 8H11Z',
    weak: 'M10 2L19 18H1Z M9 7.5H11V13H9Z' + ' M8.9 15.3a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0Z',
  };
  const markSVG = (k) => `<span class="mark" aria-hidden="true"><svg viewBox="0 0 20 20"><path fill-rule="evenodd" d="${MARK[k]}"/></svg></span>`;

  // Each trait pole has its own shape, sized by how strong it is; the seed (from your answers) places it.
  function cardArt(res) {
    const R = rng(res.seed);
    const j = (n) => (R() - 0.5) * 2 * n;
    const [dr, en, co, pa] = res.poles;
    const s = (p) => (p.val - 50) / 50; // 0..1
    const shapes = [];
    // Pace: stripes behind everything
    if (pa.pole.key === 'P') {
      for (let i = 0; i < 4; i++) { const y = 18 + i * 20 + j(2); shapes.push({ d: `M-5 ${f(y + 18)}L105 ${f(y - 14)}`, stroke: COLORS.plan, sw: 5 + 3 * s(pa) }); }
    } else {
      for (let i = 0; i < 3; i++) {
        const y = 24 + i * 26 + j(3), a = 7 + 6 * s(pa);
        shapes.push({ d: `M-5 ${f(y)}Q12 ${f(y - a)} 30 ${f(y)}T65 ${f(y)}T100 ${f(y)}T135 ${f(y)}`, stroke: COLORS.flow, sw: 5 + 3 * s(pa) });
      }
    }
    // Drive: starburst (Bold) or circle (Steady)
    const dx = 26 + j(4), dy = 62 + j(4), drR = 16 + 10 * s(dr);
    shapes.push(dr.pole.key === 'B'
      ? { d: star(dx, dy, drR, 11, 0.64, R() * Math.PI), fill: COLORS.bold, ink: true }
      : { d: circ(dx, dy, drR * 0.92), fill: COLORS.steady, ink: true });
    // Compass: triangle (Head) or heart (Heart)
    const cx = 78 + j(3), cy = 70 + j(3), cs = 9 + 6 * s(co), rot = j(0.35);
    if (co.pole.key === 'H') {
      const pts = [0, 1, 2].map((k) => { const a = rot - Math.PI / 2 + (k * 2 * Math.PI) / 3; return f(cx + cs * 1.25 * Math.cos(a)) + ' ' + f(cy + cs * 1.25 * Math.sin(a)); });
      shapes.push({ d: `M${pts[0]}L${pts[1]}L${pts[2]}Z`, fill: COLORS.head, ink: true });
    } else {
      shapes.push({ d: heart(cx, cy, cs, rot), fill: COLORS.heart, ink: true });
    }
    // Energy: a cluster of dots (Social) or one dot with a ring (Solo)
    const ex = 78 + j(3), ey = 27 + j(3);
    if (en.pole.key === 'O') {
      const n = 4 + Math.round(2 * s(en));
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + R(); shapes.push({ d: circ(ex + 11 * Math.cos(a), ey + 9 * Math.sin(a), 4 + R() * 2.5), fill: COLORS.social, ink: true }); }
    } else {
      shapes.push({ d: circ(ex, ey, 14 + 4 * s(en)), stroke: COLORS.solo, sw: 3 });
      shapes.push({ d: circ(ex, ey, 7 + 2 * s(en)), fill: COLORS.solo, ink: true });
    }
    // The type's emblem: the focal figure, on a white badge in the middle
    shapes.push({ d: circ(50, 48, 23), fill: '#ffffff', ink: true });
    shapes.push({ d: EMBLEMS[res.key](), emblem: true, tf: [33, 31, 1.7] });
    return shapes;
  }
  const artSVG = (res) => `<svg class="c-art-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${cardArt(res).map((sh) => sh.emblem
    ? `<path d="${sh.d}" fill="${INK}" fill-rule="evenodd" transform="translate(${sh.tf[0]} ${sh.tf[1]}) scale(${sh.tf[2]})"/>`
    : sh.fill
    ? `<path d="${sh.d}" fill="${sh.fill}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`
    : `<path d="${sh.d}" fill="none" stroke="${sh.stroke}" stroke-width="${sh.sw}" stroke-linecap="round"/>`).join('')}</svg>`;

  // ---------- the card ----------
  function cardHTML(res, { faceDown = false, cls = '', label = '' } = {}) {
    const ty = res.type;
    const hue = res.seed % 360;
    const aria = label || `${t(ty.name)}. ${res.poles.map((p) => `${t(p.pole.label)} ${p.val}`).join(', ')}`;
    return `<div class="card3d ${cls}" style="--hue:${hue}deg;--band:${COLORS[res.strongest.pole.color]}" role="img" aria-label="${esc(aria)}">
      <div class="card-inner ${faceDown ? 'down' : ''}">
        <div class="face front">
          <div class="c-frame">
            <div class="c-band"><span class="c-name">${esc(t(ty.name))}</span><span class="c-no">#${num(String(res.no).padStart(2, '0'))}</span></div>
            <div class="c-art">${artSVG(res)}</div>
            <p class="c-tag">${esc(t(ty.tag))}</p>
            <div class="c-stats">${res.poles.map((p) => `<div class="c-stat" style="--c:${COLORS[p.pole.color]}"><span>${esc(t(p.pole.label))}</span><b>${num(p.val)}</b></div>`).join('')}</div>
          </div>
          <div class="sheen" aria-hidden="true"></div>
        </div>
        <div class="face back" aria-hidden="true">
          <div class="b-logo"><span>KNOW</span><span>ME</span></div>
          <div class="sheen"></div>
        </div>
      </div>
    </div>`;
  }

  // Drag (or tilt the phone) to rotate the card and move the foil.
  let orientHandler = null;
  function tilt(el) {
    if (!el) return;
    const set = (x, y) => { // x,y in -1..1
      el.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-y * 14).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${((x + 1) * 50).toFixed(1)}%`);
      el.style.setProperty('--my', `${((y + 1) * 50).toFixed(1)}%`);
    };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      set(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)), Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)));
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', move);
    el.addEventListener('pointerleave', () => { el.classList.add('settle'); set(0, 0); setTimeout(() => el.classList.remove('settle'), 500); });
    if (orientHandler) window.removeEventListener('deviceorientation', orientHandler);
    let base = null;
    orientHandler = (e) => {
      if (e.gamma == null || !el.isConnected) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      set(Math.max(-1, Math.min(1, (e.gamma - base.g) / 25)), Math.max(-1, Math.min(1, (e.beta - base.b) / 25)));
    };
    window.addEventListener('deviceorientation', orientHandler);
  }
  function askMotion() {
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {});
  }

  // ---------- challenge links ----------
  const SALT = 'knowme';
  function encode({ name, qids, answers }) {
    const s = ['1', cleanName(name), qids.map((n) => n.toString(36)).join(''), answers.join('')].join('~');
    const bytes = new TextEncoder().encode(s).map((b, i) => b ^ SALT.charCodeAt(i % SALT.length));
    let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(code) {
    try {
      const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = Uint8Array.from(bin, (c, i) => c.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length));
      const [v, name, q, a] = new TextDecoder().decode(bytes).split('~');
      if (v !== '1' || !q || !a || q.length !== a.length) return null;
      const qids = q.split('').map((c) => parseInt(c, 36));
      const answers = a.split('').map(Number);
      if (qids.some((id) => !byId[id]) || answers.some((n) => !(n >= 0 && n <= 3))) return null;
      return { name: cleanName(name), qids, answers };
    } catch { return null; }
  }
  const challengeUrl = (d) => baseUrl() + '#c=' + encode(d);
  const friendName = (ch) => ch.name || t(UI.friend);

  // ---------- sharing ----------
  async function shareText(text, url, btn) {
    const full = url ? `${text}\n${url}` : text;
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share(url ? { text, url } : { text }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(full); flash(btn, t(UI.copied)); } catch { window.prompt('', full); }
  }
  function flash(btn, msg) {
    if (!btn) return;
    const lbl = btn.querySelector('.lbl') || btn;
    const old = lbl.textContent; lbl.textContent = msg; btn.disabled = true;
    setTimeout(() => { lbl.textContent = old; btn.disabled = false; }, 1500);
  }

  // Story image: 1080 x 1920, drawn from the same card data.
  async function storyImage(res) {
    try { await Promise.all(['72px Anton', '800 40px Mukta', '700 40px Mukta'].map((ft) => document.fonts.load(ft, 'Aaक'))); } catch { /* draw with fallbacks */ }
    const W = 1080, H = 1920, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const DISPLAY = lang === 'ne' ? 'Mukta' : 'Anton';
    const dW = lang === 'ne' ? '800 ' : '';
    x.fillStyle = COBALT; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.font = '130px Anton, Impact, sans-serif'; x.fillText('KNOW ME', W / 2, 300);
    // card
    const cw = 840, chh = Math.round(cw * 88 / 63), cx0 = (W - cw) / 2, cy0 = 370;
    x.save(); x.translate(W / 2, cy0 + chh / 2); x.rotate(-0.035); x.translate(-W / 2, -(cy0 + chh / 2));
    x.shadowColor = 'rgba(5,10,60,.45)'; x.shadowBlur = 60; x.shadowOffsetY = 30;
    x.fillStyle = '#fff'; rr(x, cx0, cy0, cw, chh, 40); x.fill();
    x.shadowColor = 'transparent';
    const pad = 30, ix = cx0 + pad, iy = cy0 + pad, iw = cw - pad * 2, ih = chh - pad * 2;
    let foil;
    const hue = res.seed % 360;
    if (x.createConicGradient) {
      foil = x.createConicGradient((hue * Math.PI) / 180, ix + iw * 0.3, iy + ih * 0.25);
      ['#ffb3e6', '#ffe680', '#9dffd9', '#a8bfff', '#dda6ff', '#ffb3e6'].forEach((col, i, arr) => foil.addColorStop(i / (arr.length - 1), col));
    } else { foil = x.createLinearGradient(ix, iy, ix + iw, iy + ih); foil.addColorStop(0, '#ffb3e6'); foil.addColorStop(0.5, '#9dffd9'); foil.addColorStop(1, '#dda6ff'); }
    x.fillStyle = foil; rr(x, ix, iy, iw, ih, 18); x.fill();
    x.save(); rr(x, ix, iy, iw, ih, 18); x.clip();
    x.translate(ix + iw / 2, iy + ih / 2); x.rotate(-0.44);
    x.fillStyle = 'rgba(255,255,255,.38)';
    for (let k = -1400; k < 1400; k += 64) x.fillRect(k, -1400, 22, 2800);
    x.setTransform(1, 0, 0, 1, 0, 0);
    const glow = x.createRadialGradient(ix + iw * 0.3, iy + ih * 0.22, 0, ix + iw * 0.3, iy + ih * 0.22, iw * 0.7);
    glow.addColorStop(0, 'rgba(255,255,255,.7)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = glow; x.fillRect(ix, iy, iw, ih);
    x.restore();
    x.lineWidth = 5; x.strokeStyle = INK; rr(x, ix, iy, iw, ih, 18); x.stroke();
    // band
    const bandH = 120;
    x.save(); rr(x, ix, iy, iw, ih, 18); x.clip();
    x.fillStyle = COLORS[res.strongest.pole.color]; x.fillRect(ix, iy, iw, bandH);
    x.fillStyle = INK; x.fillRect(ix, iy + bandH, iw, 5);
    x.restore();
    x.fillStyle = INK; x.textAlign = 'left';
    fitText(x, t(res.type.name).toUpperCase(), ix + 30, iy + 88, iw - 190, 78, dW, DISPLAY);
    x.textAlign = 'right'; x.font = '56px Anton, Impact, sans-serif';
    x.fillText('#' + String(res.no).padStart(2, '0'), ix + iw - 28, iy + 84);
    // art
    const artS = iw - 80, ax = ix + 40, ay = iy + bandH + 30;
    const artH = ih - bandH - 30 - 100 - 150 - 34; // fill the card down to the tag and stats
    const sc = Math.max(artS, artH) / 100;
    x.fillStyle = 'rgba(255,255,255,.55)'; rr(x, ax, ay, artS, artH, 16); x.fill();
    x.save(); rr(x, ax, ay, artS, artH, 16); x.clip();
    x.translate(ax + (artS - 100 * sc) / 2, ay + (artH - 100 * sc) / 2); x.scale(sc, sc);
    for (const sh of cardArt(res)) {
      const p = new Path2D(sh.d);
      if (sh.emblem) { x.save(); x.translate(sh.tf[0], sh.tf[1]); x.scale(sh.tf[2], sh.tf[2]); x.fillStyle = INK; x.fill(p, 'evenodd'); x.restore(); }
      else if (sh.fill) { x.fillStyle = sh.fill; x.fill(p); x.lineWidth = 2.2; x.strokeStyle = INK; x.lineJoin = 'round'; x.stroke(p); }
      else { x.lineWidth = sh.sw; x.strokeStyle = sh.stroke; x.lineCap = 'round'; x.stroke(p); }
    }
    x.restore();
    x.lineWidth = 4; x.strokeStyle = INK; rr(x, ax, ay, artS, artH, 16); x.stroke();
    // tag
    x.fillStyle = INK; x.textAlign = 'center'; x.font = '700 40px Mukta, sans-serif';
    x.fillText(t(res.type.tag), cx0 + cw / 2, ay + artH + 66, iw - 40);
    // stats
    const sy = ay + artH + 100, sw = (iw - 40 - 30) / 4;
    res.poles.forEach((p, i) => {
      const sx = ix + 20 + i * (sw + 10);
      x.fillStyle = '#fff'; rr(x, sx, sy, sw, 150, 14); x.fill();
      x.lineWidth = 4; x.strokeStyle = INK; rr(x, sx, sy, sw, 150, 14); x.stroke();
      x.fillStyle = COLORS[p.pole.color]; rr(x, sx + 14, sy + 16, 22, 22, 6); x.fill();
      x.fillStyle = INK; x.textAlign = 'left'; x.font = '800 28px Mukta, sans-serif';
      x.fillText(t(p.pole.label).toUpperCase(), sx + 44, sy + 36, sw - 54);
      x.textAlign = 'center'; x.font = '84px Anton, Impact, sans-serif';
      x.fillText(num(p.val), sx + sw / 2, sy + 130);
    });
    // holo pass over the whole face, band included (matches the on-screen .sheen)
    x.save(); rr(x, ix, iy, iw, ih, 18); x.clip();
    x.globalCompositeOperation = 'overlay';
    x.translate(ix + iw / 2, iy + ih / 2); x.rotate(-0.44);
    const holo = ['rgba(255,0,170,.5)', 'rgba(0,255,220,.5)', 'rgba(255,236,0,.5)', 'rgba(120,90,255,.5)'];
    for (let k = -1500, n = 0; k < 1500; k += 46, n++) { x.fillStyle = holo[n % 4]; x.fillRect(k, -1500, 46, 3000); }
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'screen';
    const shine = x.createRadialGradient(ix + iw * 0.28, iy + ih * 0.2, 0, ix + iw * 0.28, iy + ih * 0.2, iw * 0.65);
    shine.addColorStop(0, 'rgba(255,255,255,.55)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = shine; x.fillRect(ix, iy, iw, ih);
    x.restore();
    // name and number stay crisp on top of the foil
    x.fillStyle = COLORS[res.strongest.pole.color]; x.globalAlpha = 0.55; x.fillRect(ix + 5, iy + 5, iw - 10, bandH - 5); x.globalAlpha = 1;
    x.fillStyle = INK; x.textAlign = 'left';
    fitText(x, t(res.type.name).toUpperCase(), ix + 30, iy + 88, iw - 190, 78, dW, DISPLAY);
    x.textAlign = 'right'; x.font = '56px Anton, Impact, sans-serif';
    x.fillText('#' + String(res.no).padStart(2, '0'), ix + iw - 28, iy + 84);
    x.restore();
    // superpower sticker
    const stY = cy0 + chh + 50, stW = W - 160, stH = 130;
    x.save(); x.translate(W / 2, stY + stH / 2); x.rotate(-0.02);
    x.shadowColor = 'rgba(5,10,60,.4)'; x.shadowBlur = 30; x.shadowOffsetY = 14;
    x.fillStyle = '#fff'; rr(x, -stW / 2, -stH / 2, stW, stH, 22); x.fill();
    x.shadowColor = 'transparent';
    x.fillStyle = '#ffe66b'; x.beginPath(); x.arc(-stW / 2 + 70, 0, 38, 0, Math.PI * 2); x.fill();
    x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
    x.save(); x.translate(-stW / 2 + 70 - 22, -22); x.scale(2.2, 2.2); x.fillStyle = INK; x.fill(new Path2D(MARK.power)); x.restore();
    x.fillStyle = INK; x.textAlign = 'left'; x.font = '800 46px Mukta, sans-serif';
    x.fillText(t(res.type.power), -stW / 2 + 130, 16, stW - 160);
    x.restore();
    x.textAlign = 'center';
    x.font = '800 40px Mukta, sans-serif'; x.fillStyle = '#cdd6ff';
    x.fillText(t(UI.storyFoot) + '  ' + location.host, W / 2, cy0 + chh + 260, W - 120);
    return new Promise((r) => c.toBlob(r, 'image/png'));
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function fitText(x, s, X, Y, maxW, size, weight, family) {
    let sz = size;
    do { x.font = `${weight}${sz}px ${family}, Impact, sans-serif`; sz -= 4; } while (x.measureText(s).width > maxW && sz > 30);
    x.fillText(s, X, Y);
  }
  async function saveStory(res, btn) {
    const lbl = btn.querySelector('.lbl'); const old = lbl.textContent;
    lbl.textContent = t(UI.saving); btn.disabled = true;
    try {
      const blob = await storyImage(res);
      const file = new File([blob], `know-me-${res.key.toLowerCase()}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ files: [file], text: fmt(UI.shareCardText, { type: t(res.type.name) }) }); } catch { /* cancelled */ }
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
      lbl.textContent = t(UI.saved);
    } catch { lbl.textContent = old; }
    setTimeout(() => { lbl.textContent = old; btn.disabled = false; }, 1500);
  }

  // ---------- screen shell ----------
  let rerender = () => {};
  let keyHandler = null;
  const session = { compareWith: null };

  function topbar(left = '') {
    return `<div class="topbar">
      ${left || `<button class="wordmark" type="button" data-home>KNOW ME</button>`}
      <div class="lang" role="group" aria-label="Language">
        <button type="button" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
        <button type="button" data-lang="ne" aria-pressed="${lang === 'ne'}">नेपाली</button>
      </div></div>`;
  }
  function slots(fills = [], total = 8) {
    return `<div class="slots" aria-hidden="true">${Array.from({ length: total }, (_, i) => {
      const v = fills[i];
      if (!v) return '<i></i>';
      if (v.color) return `<i class="on" style="--c:${v.color}"></i>`;
      return `<i class="on ${v.cls}">${v.txt || ''}</i>`;
    }).join('')}</div>`;
  }
  function show(html, render, focusSel = 'h1, h2', cls = '') {
    rerender = render;
    keyHandler = null;
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';
    app.innerHTML = `<div class="screen ${cls}">${html}</div>`;
    window.scrollTo(0, 0);
    app.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
      lang = b.dataset.lang; store.set('lang', lang); rerender();
    }));
    app.querySelectorAll('[data-home]').forEach((b) => b.addEventListener('click', () => { history.replaceState(null, '', baseUrl()); home(); }));
    const fEl = app.querySelector(focusSel);
    if (fEl) { fEl.setAttribute('tabindex', '-1'); fEl.focus({ preventScroll: true }); }
  }
  const on = (sel, fn) => app.querySelectorAll(sel).forEach((el) => el.addEventListener('click', fn));
  const btn = (id, label, ic, cls = '') => `<button class="btn ${cls}" id="${id}" type="button">${ic ? icon(ic) : ''}<span class="lbl">${esc(label)}</span></button>`;

  // ---------- HOME ----------
  function home() {
    const last = store.get('last');
    const lastRes = last && last.qids ? score(last.qids, last.answers) : null;
    show(`
      ${topbar()}
      <div class="pack-wrap">
        <div class="pack" id="pack">
          <div class="crimp top"></div>
          <div class="pack-label"><h1 class="pack-title">KNOW<br>ME</h1><p>${esc(t(UI.packLine))}</p></div>
          <div class="crimp bottom"></div>
          <div class="sheen" aria-hidden="true"></div>
        </div>
      </div>
      ${btn('tear', t(UI.tear), '', 'primary big')}
      <p class="meta">${esc(t(UI.howLong))}</p>
      ${lastRes ? `<button class="last" id="last" type="button">
          <span class="mini-wrap">${cardHTML(lastRes, { cls: 'mini' })}</span>
          <span class="last-txt"><small>${esc(t(UI.yourCard))}</small><b>${esc(t(lastRes.type.name))}</b></span></button>` : ''}
      ${slots(last && last.qids ? last.qids.map((id, i) => { const c = lean(byId[id], last.answers[i]); return { color: c ? COLORS[c] : '#ffffff' }; }) : [], last && last.qids ? last.qids.length : 8)}
      <p class="fine">${esc(t(UI.notTest))}</p>`, home, '.pack-title');
    tilt(app.querySelector('#pack'));
    on('#tear', async () => {
      askMotion();
      const pack = app.querySelector('#pack');
      pack.classList.add('torn');
      app.querySelector('#tear').disabled = true;
      await wait(650);
      startQuiz();
    });
    on('#last', () => result(last.qids, last.answers));
  }

  // ---------- QUIZ ----------
  function startQuiz(opts = {}) {
    const qids = opts.challenge ? opts.challenge.qids : drawQuestions();
    question({ friend: opts.challenge || null, qids, answers: [], orders: qids.map(() => shuffle([0, 1, 2, 3])), i: 0, points: 0, log: [], fills: [] });
  }

  function question(st) {
    const s = byId[st.qids[st.i]];
    const n = st.qids.length;
    const fr = st.friend;
    const ax = AXES.find((a) => a.id === s.axis);
    const backBtn = st.i && !fr
      ? `<button class="iconbtn" id="back" type="button" aria-label="${esc(t(UI.back))}">${icon('back')}</button>`
      : `<button class="iconbtn" id="back" type="button" aria-label="${esc(t(UI.quit))}">${icon('close')}</button>`;
    show(`
      ${topbar(backBtn)}
      ${fr ? `<p class="ask">${esc(fmt(UI.whatPick, { name: friendName(fr) }))}</p>` : ''}
      <article class="qcard" id="qcard" style="--ca:${COLORS[ax.a.color]};--cb:${COLORS[ax.b.color]}">
        <div class="q-band"><span>${esc(t(UI.card))} ${num(st.i + 1)}/${num(n)}</span>${fr ? `<span>${num(st.points)} ${lang === 'ne' ? 'अंक' : 'pts'}</span>` : ''}</div>
        <h2 class="q-text">${esc(t(s.q))}</h2>
      </article>
      <div class="answers" role="group">
        ${st.orders[st.i].map((oi, pos) => `<button class="ans" type="button" data-oi="${oi}">
          <span class="ans-key">${LETTERS[pos]}</span><span class="ans-text">${esc(t(s.o[oi]))}</span><span class="ans-tag"></span></button>`).join('')}
      </div>
      <div class="verdict" aria-live="polite"></div>
      ${slots(st.fills, n)}`, () => question(st), '.q-text', 'deal');

    on('#back', () => {
      if (st.i && !fr) { st.i--; st.answers.pop(); st.fills.pop(); question(st); return; }
      history.replaceState(null, '', baseUrl()); home();
    });

    let locked = false;
    const pick = async (b) => {
      if (locked) return; locked = true;
      const oi = Number(b.dataset.oi);
      b.classList.add('picked');
      app.querySelectorAll('.ans').forEach((x) => { x.disabled = true; });
      if (!fr) {
        st.answers[st.i] = oi;
        const col = lean(s, oi);
        st.fills[st.i] = { color: col ? COLORS[col] : '#ffffff' };
        b.style.setProperty('--c', col ? COLORS[col] : '#ffffff');
        const slot = app.querySelectorAll('.slots i')[st.i];
        slot.classList.add('on', 'pop'); slot.style.setProperty('--c', st.fills[st.i].color);
        app.querySelector('#qcard').classList.add('dealt');
        await wait(420);
        next(st);
        return;
      }
      const truth = fr.answers[st.i];
      const w = (k) => s.o[k][2][s.axis] || 0;
      const kind = oi === truth ? 'exact' : (w(truth) !== 0 && Math.sign(w(oi)) === Math.sign(w(truth)) ? 'close' : 'miss');
      st.points += kind === 'exact' ? 2 : kind === 'close' ? 1 : 0;
      st.log.push(kind);
      st.fills[st.i] = { cls: kind, txt: kind === 'exact' ? '+2' : kind === 'close' ? '+1' : '' };
      app.querySelectorAll('.ans').forEach((x) => {
        const k = Number(x.dataset.oi);
        if (k === truth) { x.classList.add('truth'); x.querySelector('.ans-tag').textContent = fmt(UI.theirPick, { name: friendName(fr) }); }
        else if (k === oi) x.classList.add(kind === 'close' ? 'near' : 'wrong');
      });
      const pts = app.querySelector('.q-band span:last-child');
      if (pts) pts.textContent = `${num(st.points)} ${lang === 'ne' ? 'अंक' : 'pts'}`;
      const slot = app.querySelectorAll('.slots i')[st.i];
      slot.className = `on pop ${kind}`; slot.textContent = st.fills[st.i].txt;
      const v = app.querySelector('.verdict');
      v.innerHTML = `<p class="v v-${kind}">${esc(t(UI[kind]))} <b>+${num(kind === 'exact' ? 2 : kind === 'close' ? 1 : 0)}</b></p>
        ${btn('next', st.i + 1 < n ? t(UI.next) : t(UI.seeScore), '', 'primary')}`;
      const nb = v.querySelector('#next');
      nb.addEventListener('click', () => next(st));
      nb.focus({ preventScroll: true });
      v.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    };
    on('.ans', (e) => pick(e.currentTarget));
    keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      const pos = '1234'.includes(k) && k ? Number(k) - 1 : LETTERS.indexOf(k);
      if (pos >= 0 && !locked) pick(app.querySelectorAll('.ans')[pos]);
    };
  }

  function next(st) {
    st.i++;
    if (st.i < st.qids.length) return question(st);
    if (st.friend) return friendResult(st);
    store.set('last', { qids: st.qids, answers: st.answers, at: Date.now() });
    result(st.qids, st.answers, { fresh: true });
  }

  // ---------- RESULT ----------
  function result(qids, answers, opts = {}) {
    const res = score(qids, answers);
    const ty = res.type;
    const vs = session.compareWith;
    const vsRes = vs ? score(vs.qids, vs.answers) : null;
    const cp = vsRes ? compat(res, vsRes) : null;
    const myName = store.get('name') || '';
    const fresh = opts.fresh && !reduced();
    show(`
      ${topbar()}
      <div class="stage">${cardHTML(res, { faceDown: fresh, cls: 'big' })}</div>
      <p class="hint">${esc(t(UI.tapFlip))}</p>
      <div class="stickers">
        <div class="sticker s1">${markSVG('power')}<b><span class="sr">${esc(t(UI.power))}: </span>${esc(t(ty.power))}</b></div>
        <div class="sticker s2">${markSVG('weak')}<b><span class="sr">${esc(t(UI.weak))}: </span>${esc(t(ty.weak))}</b></div>
      </div>
      ${btn('story', t(UI.saveStory), 'save', 'primary big')}

      ${cp ? `<section class="match">
        <div class="pair"><span class="mini-wrap l">${cardHTML(res, { cls: 'mini' })}</span><span class="mini-wrap r">${cardHTML(vsRes, { cls: 'mini' })}</span></div>
        <h2 class="match-num">${num(cp.match)}%</h2>
        <p class="match-head">${esc(fmt(UI.matchWith, { name: friendName(vs) }))} · ${esc(t(cp.head))}</p>
        <ul class="lines">${cp.lines.map((l) => `<li>${esc(t(l))}</li>`).join('')}</ul>
        ${btn('shareMatch', t(UI.shareMatch), 'send', 'ghost')}
      </section>` : ''}

      <section class="challenge">
        <h2>${esc(t(UI.challengeH))}</h2>
        <p>${esc(t(UI.challengeP))}</p>
        <div class="send-row">
          <label class="field"><span class="sr">${esc(t(UI.yourName))}</span>
            <input id="name" type="text" maxlength="20" autocomplete="given-name" value="${esc(myName)}" placeholder="${esc(t(UI.yourName))}"></label>
          ${btn('send', t(UI.send), 'send', 'primary')}
        </div>
        <p class="err" id="err" hidden>${esc(t(UI.needName))}</p>
        <div class="link-out" id="linkOut" hidden>
          <input id="linkField" type="text" readonly aria-label="Link">
          ${btn('copyLink', t(UI.copy), 'copy', 'ghost')}
        </div>
      </section>
      ${btn('again', t(UI.again), 'redo', 'text')}`, () => result(qids, answers), '.wordmark');

    const card = app.querySelector('.card3d.big');
    tilt(card);
    const inner = card.querySelector('.card-inner');
    card.addEventListener('click', () => { askMotion(); inner.classList.toggle('down'); });
    if (fresh) setTimeout(() => inner.classList.remove('down'), 650);

    on('#story', (e) => saveStory(res, e.currentTarget));
    on('#send', (e) => {
      const input = app.querySelector('#name');
      const nm = cleanName(input.value);
      if (!nm) { app.querySelector('#err').hidden = false; input.focus(); return; }
      store.set('name', nm);
      const url = challengeUrl({ name: nm, qids, answers });
      app.querySelector('#linkOut').hidden = false;
      app.querySelector('#linkField').value = url;
      shareText(t(UI.challengeText), url, e.currentTarget);
    });
    app.querySelector('#name').addEventListener('input', () => { app.querySelector('#err').hidden = true; });
    app.querySelector('#name').addEventListener('keydown', (e) => { if (e.key === 'Enter') app.querySelector('#send').click(); });
    on('#copyLink', (e) => {
      const fl = app.querySelector('#linkField'); fl.select();
      const b = e.currentTarget;
      navigator.clipboard.writeText(fl.value).then(() => flash(b, t(UI.copied)), () => document.execCommand('copy'));
    });
    on('#shareMatch', (e) => shareText(fmt(UI.matchText, { name: friendName(vs), pct: cp.match }), baseUrl(), e.currentTarget));
    on('#again', () => startQuiz());
  }

  // ---------- FRIEND ----------
  function friendIntro(ch) {
    const res = score(ch.qids, ch.answers);
    const done = store.get('played.' + encode(ch));
    const nm = friendName(ch);
    show(`
      ${topbar()}
      <div class="stage">${cardHTML(res, { faceDown: true, cls: 'big mid', label: fmt(UI.faceDown, { name: nm }) })}</div>
      <h1 class="title">${esc(fmt(UI.faceDown, { name: nm }))}</h1>
      <p class="lede">${esc(fmt(UI.guessIntro, { name: nm }))}</p>
      <p class="pill">${esc(t(UI.rules))}</p>
      ${done ? `<p class="lede small">${esc(fmt(UI.played, { pct: num(done.pct) }))}</p>` : ''}
      ${btn('go', t(UI.startGuess), '', 'primary big')}
      ${btn('self', t(UI.skipGuess), '', 'text')}`, () => friendIntro(ch), 'h1');
    tilt(app.querySelector('.card3d'));
    on('#go', () => { askMotion(); startQuiz({ challenge: ch }); });
    on('#self', () => { history.replaceState(null, '', baseUrl()); session.compareWith = ch; startQuiz(); });
  }

  function friendResult(st) {
    const ch = st.friend;
    const nm = friendName(ch);
    const pct = Math.round((100 * st.points) / (st.qids.length * 2));
    const tier = FRIEND_TIERS.find(([min]) => pct >= min);
    const res = score(ch.qids, ch.answers);
    store.set('played.' + encode(ch), { pct, at: Date.now() });
    session.compareWith = ch;
    const render = () => {
      show(`
        ${topbar()}
        <div class="score-head">
          <p class="lede">${esc(fmt(UI.youKnow, { name: nm }))}</p>
          <h1 class="huge">${num(pct)}%</h1>
          <p class="tier">${esc(t(tier[1]))}</p>
          <p class="lede">${esc(t(tier[2]))}</p>
        </div>
        ${slots(st.fills, st.qids.length)}
        <div class="stage">${cardHTML(res, { faceDown: true, cls: 'big' })}</div>
        ${btn('mine', t(UI.getMine), '', 'primary big')}
        <p class="meta">${esc(fmt(UI.thenMatch, { name: nm }))}</p>
        ${btn('shareScore', t(UI.shareScore), 'send', 'ghost')}`, render, 'h1');
      const card = app.querySelector('.card3d');
      tilt(card);
      const inner = card.querySelector('.card-inner');
      card.addEventListener('click', () => inner.classList.toggle('down'));
      setTimeout(() => inner.classList.remove('down'), reduced() ? 0 : 700);
      on('#shareScore', (e) => shareText(fmt(UI.scoreText, { name: nm, pct, tier: t(tier[1]) }), challengeUrl(ch), e.currentTarget));
      on('#mine', () => { history.replaceState(null, '', baseUrl()); startQuiz(); });
    };
    render();
  }

  // ---------- boot ----------
  document.addEventListener('keydown', (e) => { if (keyHandler) keyHandler(e); });
  function route() {
    const m = location.hash.match(/^#c=([\w-]+)/);
    if (m) {
      const ch = decode(m[1]);
      if (ch) return friendIntro(ch);
      history.replaceState(null, '', baseUrl());
    }
    home();
  }
  window.addEventListener('hashchange', route);
  route();

  // Register after load, so the offline copy (all fonts included) doesn't compete with the first screen's downloads.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
