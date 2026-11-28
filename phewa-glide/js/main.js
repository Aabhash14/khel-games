// Phewa Glide: screens, menu, HUD, minimap, results and sharing.
(function () {
  const PG = window.PG, G = PG.G, A = PG.audio, D = PG.D, W = PG.W;
  const $ = (id) => document.getElementById(id);
  const screens = ['menu', 'hud', 'pause', 'over', 'how', 'nogl'];
  function show(...ids) {
    screens.forEach((s) => $(s).classList.toggle('show', ids.includes(s)));
    document.body.classList.toggle('flying', ids.includes('hud') && !ids.includes('pause'));
  }
  function tap(el, fn) { el.addEventListener('click', (e) => { e.stopPropagation(); A.init(); A.click(); fn(e); }); }
  if (D.sel == null) D.sel = 0;
  const unlocked = (i) => i === 'daily' || i === 0 || (D.stars[i - 1] || 0) >= 1;

  // ---------- menu ----------
  function starHTML(n) { return [0, 1, 2].map((i) => `<span class="${i < n ? 'on' : ''}">★</span>`).join(''); }
  function buildFlights() {
    const box = $('flights'); box.innerHTML = '';
    const items = G.FLIGHTS.map((f, i) => ({ id: i, no: (D.lang === 'ne' ? 'उडान ' : 'Flight ') + PG.num(i + 1), name: PG.t(f.name), sub: PG.t(f.sub), stars: D.stars[i] || 0, best: D.best[i] || 0 }));
    const today = G.today();
    items.push({ id: 'daily', no: PG.t('daily'), name: PG.t('daily'), sub: PG.t('dailySub'), daily: true, best: D.daily.d === today ? D.daily.best : 0 });
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'fcard' + (it.daily ? ' daily' : '') + (unlocked(it.id) ? '' : ' locked');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(D.sel === it.id));
      b.innerHTML = `<span class="no">${it.daily ? '☀ ' + new Date().toLocaleDateString(D.lang === 'ne' ? 'ne-NP' : 'en-GB', { day: 'numeric', month: 'short' }) : it.no}</span><b>${it.name}</b><small>${unlocked(it.id) ? it.sub : PG.t('locked')}</small>` +
        `<span class="meta"><span class="st">${it.daily ? '' : starHTML(it.stars)}</span><span>${it.best ? PG.t('best') + ' ' + PG.num(it.best) : ''}</span></span>`;
      tap(b, () => { if (!unlocked(it.id)) return; D.sel = it.id; PG.save(); buildFlights(); });
      box.appendChild(b);
    });
  }
  function buildWings() {
    const box = $('wings'); box.innerHTML = '';
    PG.WINGS.forEach((w, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'wsw';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String((D.wing | 0) === i));
      b.setAttribute('aria-label', PG.t(w.key));
      b.title = PG.t(w.key);
      b.style.backgroundImage = `url(${PG.wingTexture(i).image.toDataURL()})`;
      tap(b, () => { D.wing = i; PG.save(); G.setWing(i); buildWings(); });
      box.appendChild(b);
    });
  }
  function refreshMenu() {
    $('lang').textContent = D.lang === 'ne' ? 'EN' : 'ने';
    $('snd').classList.toggle('off', D.muted);
    buildFlights(); buildWings();
  }
  function relang() { PG.applyLang(); refreshMenu(); }

  // ---------- boot ----------
  async function boot() {
    PG.applyLang();
    try { await Promise.race([document.fonts.load('800 40px "Mukta"'), new Promise((r) => setTimeout(r, 1200))]); } catch (e) { /* fonts optional */ }
    await new Promise((r) => setTimeout(r, 30));
    const ok = G.init($('gl'));
    $('loading').classList.add('out');
    setTimeout(() => $('loading').classList.remove('show'), 650);
    if (!ok) { show('nogl'); return; }
    buildMap();
    refreshMenu();
    show('menu');
    if (!D.seenHow) { D.seenHow = true; PG.save(); }
    // dev convenience: ?fly=0..2 or ?fly=daily jumps straight into a flight
    const q = new URLSearchParams(location.search).get('fly');
    if (q !== null) {
      startFlight(q === 'daily' ? 'daily' : Math.max(0, Math.min(2, q | 0)));
      const ff = +new URLSearchParams(location.search).get('ff');
      if (ff > 0) G.step(1 / 30, Math.round(ff * 30), true);
    }
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
    try {
      const played = JSON.parse(localStorage.getItem('khel.played') || '[]');
      if (Array.isArray(played) && !played.includes('phewa-glide')) { played.push('phewa-glide'); localStorage.setItem('khel.played', JSON.stringify(played)); }
    } catch (e) { /* ignore */ }
  }

  // ---------- flying ----------
  let current = 0;
  function startFlight(which) {
    if (!unlocked(which)) which = 0;
    current = which;
    A.init(); A.pad(false);
    show('hud');
    $('hint').classList.remove('show');
    G.start(which);
  }
  tap($('play'), () => startFlight(D.sel));
  G.on.startKey = () => { if (G.state() === 'menu' && $('menu').classList.contains('show')) startFlight(D.sel); };
  tap($('lang'), () => { D.lang = D.lang === 'ne' ? 'en' : 'ne'; PG.save(); relang(); });
  tap($('snd'), () => { D.muted = !D.muted; PG.save(); A.setMuted(D.muted); refreshMenu(); });
  tap($('howBtn'), () => show('menu', 'how'));
  document.querySelectorAll('.close').forEach((b) => tap(b, () => show('menu')));
  window.addEventListener('pointerdown', () => { if (G.state() === 'menu') { A.init(); A.pad(true); } });

  function pause() {
    if (G.state() !== 'fly' && G.state() !== 'launch') return;
    G.pause(true); show('hud', 'pause');
  }
  G.on.pauseKey = () => { if (G.state() === 'paused') { G.pause(false); show('hud'); } else pause(); };
  tap($('pauseBtn'), pause);
  tap($('resume'), () => { G.pause(false); show('hud'); });
  tap($('restart'), () => { G.pause(false); startFlight(current); });
  tap($('quit'), goHome);
  function goHome() { G.pause(false); G.menu(); refreshMenu(); show('menu'); A.pad(true); }

  // ---------- HUD ----------
  const el = { alt: $('alt'), agl: $('agl'), vario: $('vario'), vfill: $('vfill'), spd: $('spd'), rc: $('rc'), next: $('next') };
  G.on.hud = (h) => {
    el.alt.textContent = PG.num(h.alt);
    el.agl.textContent = PG.num(Math.max(0, h.agl));
    const v = h.vario;
    el.vario.textContent = (v >= 0 ? '+' : '−') + PG.dec(Math.abs(v)) + ' ' + PG.t('ms');
    el.vario.className = 'vario' + (v > 0.3 ? ' up' : v < -2.5 ? ' down' : '');
    const k = Math.max(-1, Math.min(1, v / 8));
    el.vfill.style.top = (k >= 0 ? 50 - k * 50 : 50) + '%';
    el.vfill.style.height = Math.abs(k) * 50 + '%';
    el.vfill.style.background = k >= 0 ? 'var(--up)' : 'var(--down)';
    el.spd.textContent = PG.num(h.speed);
    el.rc.textContent = PG.num(h.got) + '/' + PG.num(h.n);
    const d = h.dist >= 1000 ? PG.dec(h.dist / 1000) + (D.lang === 'ne' ? ' कि.मि.' : ' km') : PG.num(h.dist) + ' ' + PG.t('m');
    el.next.textContent = (h.toLand ? (D.lang === 'ne' ? 'ओर्लने ठाउँ' : 'Landing') : (D.lang === 'ne' ? 'अर्को घेरा' : 'Next ring')) + ' · ' + d;
    el.next.classList.toggle('land', h.toLand);
    drawMap();
  };
  let hintT = 0;
  G.on.hint = (k) => {
    const h = $('hint'); h.textContent = PG.t(k); h.classList.add('show');
    clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('show'), 3200);
  };
  G.on.toast = (big, small) => {
    const t = $('toast');
    t.querySelector('b').textContent = big; t.querySelector('span').textContent = small;
    t.classList.remove('go'); void t.offsetWidth; t.classList.add('go');
  };

  // ---------- minimap ----------
  const MAP = { span: 6800, cx: -100, cz: 100, bg: null };
  function buildMap() {
    const c = document.createElement('canvas'); c.width = c.height = 240;
    const g = c.getContext('2d');
    const img = g.createImageData(240, 240);
    for (let j = 0; j < 240; j++) for (let i = 0; i < 240; i++) {
      const x = MAP.cx + (i / 240 - 0.5) * MAP.span, z = MAP.cz + (j / 240 - 0.5) * MAP.span;
      const h = W.ground(x, z);
      let r, gg, b;
      if (h < 0) { r = 40; gg = 120; b = 140; }
      else {
        const k = Math.min(1, h / 900);
        const sh = (W.ground(x - 20, z - 20) - h) * 0.02;
        r = 70 + k * 90 + sh * 60; gg = 110 + k * 60 + sh * 60; b = 55 + k * 50 + sh * 40;
      }
      const o = (j * 240 + i) * 4;
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    MAP.bg = c;
  }
  let mapT = 0;
  function drawMap() {
    if (++mapT % 2) return;
    const cv = $('map'), g = cv.getContext('2d'), m = G.mapData();
    if (!MAP.bg || !m.pos) return;
    const P = (x, z) => [((x - MAP.cx) / MAP.span + 0.5) * 240, ((z - MAP.cz) / MAP.span + 0.5) * 240];
    g.save();
    g.clearRect(0, 0, 240, 240);
    g.beginPath(); g.arc(120, 120, 120, 0, 7); g.clip();
    g.drawImage(MAP.bg, 0, 0);
    // thermals
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
    m.thermals.forEach((t) => { const [x, y] = P(t.x, t.z); g.beginPath(); g.arc(x, y, 7, 0, 7); g.stroke(); });
    // course
    const pts = m.rings.filter((r) => !r.got).map((r) => P(r.p.x, r.p.z));
    if (pts.length) {
      g.strokeStyle = 'rgba(255,194,61,.55)'; g.setLineDash([5, 5]); g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      const [lx, ly] = P(W.LAND.x, W.LAND.z); g.lineTo(lx, ly); g.stroke(); g.setLineDash([]);
    }
    m.rings.forEach((r) => {
      if (r.got) return;
      const [x, y] = P(r.p.x, r.p.z);
      g.fillStyle = r.i === m.next ? '#ffc23d' : '#fff6e6';
      g.beginPath(); g.arc(x, y, r.i === m.next ? 7 : 4.5, 0, 7); g.fill();
    });
    const [lx, ly] = P(W.LAND.x, W.LAND.z);
    g.strokeStyle = '#ff6b3d'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(lx - 7, ly - 7); g.lineTo(lx + 7, ly + 7); g.moveTo(lx + 7, ly - 7); g.lineTo(lx - 7, ly + 7); g.stroke();
    // you
    const [px, py] = P(m.pos.x, m.pos.z);
    g.translate(px, py); g.rotate(-m.head);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#0f3d44'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 8); g.lineTo(0, 4); g.lineTo(-8, 8); g.closePath(); g.stroke(); g.fill();
    g.restore();
  }

  // ---------- results ----------
  G.on.landed = () => { $('hint').classList.remove('show'); document.body.classList.remove('flying'); };
  G.on.end = (R) => {
    const fl = G.flight();
    $('rFlight').textContent = R.flight === 'daily' ? PG.t('daily') : PG.t(fl.name);
    $('rTitle').textContent = PG.t(R.key);
    $('rSub').textContent = R.soft ? PG.t('rSoft') : R.kind === 'ground' ? PG.num(R.dist) + ' ' + PG.t('m') + (D.lang === 'ne' ? ' निशानाबाट' : ' from the target') : '';
    const st = $('rStars');
    st.querySelectorAll('i').forEach((s, i) => s.classList.toggle('on', i < R.stars));
    st.setAttribute('aria-label', R.stars + ' / 3');
    const rows = [
      [PG.t('sRings') + ' ' + PG.num(R.rings) + '/' + PG.num(R.n), R.ringPts],
      [PG.t('sChain'), R.chainPts],
      [PG.t('sLanding'), R.landPts],
      [PG.t('sFlare'), R.flarePts],
      [PG.t('sAir'), R.airPts],
    ];
    $('tally').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v ? '+' + PG.num(v) : '—'}</dd>`).join('') + `<dt class="tot">${PG.t('sTotal')}</dt><dd class="tot">${PG.num(R.total)}</dd>`;
    // save
    let newBest = false;
    if (R.flight === 'daily') {
      const today = G.today();
      if (D.daily.d !== today) D.daily = { d: today, best: 0 };
      if (R.total > D.daily.best) { D.daily.best = R.total; newBest = true; }
    } else {
      const i = R.flight;
      if (R.total > (D.best[i] || 0)) { D.best[i] = R.total; newBest = true; }
      D.stars[i] = Math.max(D.stars[i] || 0, R.stars);
    }
    PG.save();
    $('newBest').hidden = !newBest;
    const hasNext = typeof R.flight === 'number' && R.flight + 1 < G.FLIGHTS.length && unlocked(R.flight + 1);
    $('nextBtn').hidden = !hasNext;
    show('hud', 'over');
    document.body.classList.remove('flying');
    A.stars(R.stars);
    lastResult = R;
  };
  let lastResult = null;
  tap($('again'), () => startFlight(current));
  tap($('nextBtn'), () => { D.sel = current + 1; PG.save(); startFlight(D.sel); });
  tap($('homeBtn'), goHome);
  tap($('shareBtn'), async () => {
    const R = lastResult; if (!R) return;
    const fl = R.flight === 'daily' ? PG.t('daily') : PG.t(G.flight().name);
    const text = PG.t('shareText', { f: fl, s: PG.num(R.total), r: PG.num(R.rings) + '/' + PG.num(R.n), st: '★'.repeat(R.stars) + '☆'.repeat(3 - R.stars) });
    const url = location.href.split('#')[0].split('?')[0];
    try {
      if (navigator.share) await navigator.share({ title: PG.t('title'), text, url });
      else { await navigator.clipboard.writeText(text + ' ' + url); $('shareBtn').textContent = PG.t('copied'); setTimeout(() => ($('shareBtn').textContent = PG.t('share')), 1600); }
    } catch (e) { /* cancelled */ }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  boot();
})();
