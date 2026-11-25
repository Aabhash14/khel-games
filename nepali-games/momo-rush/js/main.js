// Momo Rush: screens, input, the real-time loop, effects and test hooks (window.MR).
(function () {
  const MR = window.MR; const R = (MR.Rules = window.MRRules); const A = MR.art; const au = MR.audio; const t = MR.t;
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'momo-rush-v1';
  const buzz = (p) => {
    try {
      if (!navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; // no tap yet: the browser would block it
      navigator.vibrate(p);
    } catch (e) { /* not supported */ }
  };

  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
  if (!store.daily) store.daily = {};
  const save = () => {
    // during service the week's cash already has today's stock taken off; today replays from the bazaar
    // after a quit or reload, so save the cash from before the bazaar
    const mid = G.S && store.week && store.week === G.W && !G.S.over ? G.S.cost : 0;
    if (mid) G.W.cash += mid;
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode */ }
    if (mid) G.W.cash -= mid;
  };

  const G = (MR.G = {
    screen: 'home', W: null, S: null, L: null, plan: null, stock: null, paused: false, vt: 0,
    parts: [], leavers: [], enter: {}, looks: {}, lastFace: {}, drag: null, sel: -1, pop: {}, nope: null,
    shake: 0, closeAt: null, cardSlot: -1, said: {}, tutDoneAt: null, rushSaid: false, burnSaid: {},
  });

  // ---------- language + sound toggles ----------
  function applyLang() {
    const ne = MR.getLang() === 'ne';
    document.documentElement.lang = ne ? 'ne' : 'en';
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === MR.getLang())));
    $('how6').textContent = t('how6', { rent: R.RENT });
    $('game').setAttribute('aria-label', t('gameLabel'));
    document.querySelectorAll('.mute').forEach((b) => b.setAttribute('aria-label', t('sound')));
    if (G.screen === 'home') renderHome();
    if (G.screen === 'bazaar') renderBazaar();
    if (G.screen === 'report' && G.report) renderReport(G.report);
    if (G.screen === 'upgrade') renderUpgrades();
    if (G.screen === 'week') renderWeek();
    if (G.cardSlot >= 0) fillCard(G.cardSlot);
  }
  document.querySelectorAll('[data-set-lang]').forEach((b) => b.addEventListener('click', () => { MR.setLang(b.dataset.setLang); au.tap(); applyLang(); }));
  function syncMute() { document.querySelectorAll('.mute').forEach((b) => b.setAttribute('aria-pressed', String(au.isMuted()))); }
  document.querySelectorAll('.mute').forEach((b) => b.addEventListener('click', () => { au.unlock(); au.setMuted(!au.isMuted()); syncMute(); }));
  syncMute();
  document.addEventListener('pointerdown', () => au.unlock(), { once: true });
  document.addEventListener('keydown', () => au.unlock(), { once: true });

  // ---------- screens ----------
  function show(name) {
    G.screen = name;
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.dataset.screen === name));
    document.body.classList.toggle('playing', name === 'play');
    window.scrollTo(0, 0);
    const h = document.querySelector(`.screen[data-screen="${name}"] h2`);
    if (h && name !== 'play') { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    if (name === 'play') setTimeout(() => $('game').focus({ preventScroll: true }), 50);
  }
  let toastT = 0;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2200);
  }

  // ---------- home ----------
  function today() { const d = new Date(); return { key: R.dailyKey(d), n: R.dailyNumber(d) }; }
  function renderHome() {
    const d = today();
    $('dailyMain').textContent = t('daily', { n: MR.num(d.n) });
    const done = store.daily[d.key];
    $('dailySub').textContent = done ? t('dailyDone', { p: done.profit }) : t('dailySub');
    $('weekSub').textContent = t('newWeekSub', { cash: R.START_CASH });
    const wk = store.week;
    $('goCont').hidden = !(wk && !wk.done);
    if (wk && !wk.done) $('contSub').textContent = t('contSub', { d: MR.num(wk.day + 1), cash: wk.cash });
    $('bestLine').textContent = store.best ? t('best', { p: store.best.profit }) : t('noBest');
  }
  $('goWeek').addEventListener('click', () => startWeek(false));
  $('goDaily').addEventListener('click', () => startWeek(true));
  $('goCont').addEventListener('click', () => {
    au.unlock(); au.tap(); G.W = store.week;
    if (G.W.evening) { renderUpgrades(); show('upgrade'); } else goBazaar();
  });

  function startWeek(daily, opts) {
    au.unlock(); au.tap();
    const d = today();
    const seed = daily ? 'daily-' + d.key : 'w-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const tut = opts && 'tutorial' in opts ? opts.tutorial : !store.tutDone;
    G.W = R.newWeek(seed, { daily, tutorial: tut });
    G.W.dailyKey = daily ? d.key : null; G.W.dailyN = daily ? d.n : null;
    store.week = G.W; save();
    goBazaar();
  }

  // ---------- bazaar ----------
  const GLYPH = {
    buff: '<path d="M5 6q0 9 7 9t7-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15" r="2.8" fill="currentColor"/>',
    chicken: '<ellipse cx="10" cy="10" rx="5.6" ry="4.6" transform="rotate(-40 10 10)" fill="currentColor"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="18.6" cy="17" r="1.8" fill="currentColor"/><circle cx="17" cy="18.8" r="1.8" fill="currentColor"/>',
    veg: '<path d="M6 18Q5 6 18 6q0 12-12 12z" fill="currentColor"/><path d="M7 17l8-8" stroke="#2c5e22" stroke-width="1.4"/>',
  };
  const svgGlyph = (f) => `<svg viewBox="0 0 24 24" aria-hidden="true">${GLYPH[f]}</svg>`;

  // the tip jar is money too: once the cash box is empty, filling can be paid from tips
  const budget = () => Math.max(0, G.W.cash) + Math.max(0, G.W.tips);
  const broke = () => budget() < Math.min.apply(null, G.plan.cfg.fills.map((f) => R.COST[f]));
  function goBazaar() {
    const W = G.W;
    if (W.evening) { delete W.evening; store.week = W; save(); }
    G.plan = R.dayPlan(W, W.day);
    const prev = W.reports[W.reports.length - 1];
    const st = { buff: 0, chicken: 0, veg: 0 };
    if (W.day === 0) { st.buff = 4; st.veg = 3; }
    else G.plan.cfg.fills.forEach((f) => { st[f] = prev && prev.bought[f] ? prev.bought[f] : 3; });
    while (R.stockCost(st) > budget()) {
      const f = R.FILLS.slice().sort((a, b) => st[b] - st[a])[0]; if (!st[f]) break; st[f]--;
    }
    G.stock = st;
    au.musicStop(); au.ambience(false);
    renderBazaar(true);
    show('bazaar');
  }

  function renderBazaar(fresh) {
    const W = G.W; const P = G.plan;
    $('bazDay').textContent = t('dayOf', { d: MR.num(W.day + 1) });
    $('bazCash').textContent = MR.rs() + ' ' + MR.money(W.cash);
    const rm = $('rumour');
    rm.className = 'rumour src-' + (P.rumour ? P.source : 'none');
    $('rSrc').textContent = P.rumour ? t('src_' + P.source) : t('dayN', { d: MR.num(1) });
    $('rText').textContent = P.rumour ? t('r_' + P.rumour) : t('day1Note');
    $('rQ').textContent = P.rumour ? t('trustQ') : '';
    const nt = ['', 'new_chicken', 'new_jhol', 'new_kothey', ''][W.day];
    $('newToday').hidden = !nt; if (nt) $('newToday').textContent = t(nt);
    const prev = W.reports[W.reports.length - 1];
    $('yday').textContent = prev ? t('yesterday', { b: prev.today.sold.buff, c: prev.today.sold.chicken, v: prev.today.sold.veg }) : '';
    const owned = Object.keys(W.upg);
    $('owned').hidden = !owned.length;
    if (owned.length) $('owned').textContent = t('upgOwned', { list: owned.map((u) => t('u_' + u)).join(', ') });
    const box = $('bowls');
    if (fresh || box.dataset.day !== String(W.day) || box.dataset.lang !== MR.getLang()) {
      box.dataset.day = String(W.day); box.dataset.lang = MR.getLang();
      box.innerHTML = '';
      P.cfg.fills.forEach((f) => {
        const el = document.createElement('div'); el.className = 'bwl'; el.dataset.f = f;
        el.innerHTML = `<button type="button" class="bwl-main" aria-label="${t('more', { f: t(f) })}">
            <span class="dish f-${f}"><span class="mince"></span><span class="gly">${svgGlyph(f)}</span></span>
            <b class="bwl-n"></b><span class="bwl-name">${t(f)}</span>
            <span class="bwl-price">${t('perPlate', { c: R.COST[f] })}</span><span class="bwl-sell">${t('sells', { p: R.PRICE[f] })}</span>
          </button>
          <button type="button" class="bwl-minus" aria-label="${t('less', { f: t(f) })}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>`;
        holdRepeat(el.querySelector('.bwl-main'), () => scoop(f, 1));
        holdRepeat(el.querySelector('.bwl-minus'), () => scoop(f, -1));
        box.append(el);
      });
    }
    updateBowls();
  }
  function holdRepeat(btn, fn) {
    let timer = 0; let rep = 0; let fired = false;
    const stop = () => { clearTimeout(timer); clearInterval(rep); };
    btn.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      fired = true; fn();
      timer = setTimeout(() => { rep = setInterval(fn, 110); }, 420);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    btn.addEventListener('click', (e) => { if (fired) { fired = false; return; } fn(); e.preventDefault(); }); // keyboard
    btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fired = false; });
  }
  function scoop(f, d) {
    au.unlock();
    const st = G.stock;
    if (d > 0) {
      if (st[f] >= R.MAX_STOCK) { toast(t('bowlFull')); au.nope(); return; }
      if (R.stockCost(st) + R.COST[f] > budget()) { toast(t('noCash')); au.nope(); buzz(30); return; }
      st[f]++; au.pleat(st[f] % 4);
      const el = document.querySelector(`.bwl[data-f="${f}"] .dish`);
      if (el && !reduce) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    } else {
      if (st[f] <= 0) return;
      st[f]--; au.tap();
    }
    updateBowls();
  }
  function updateBowls() {
    const st = G.stock;
    document.querySelectorAll('.bwl').forEach((el) => {
      const f = el.dataset.f;
      el.querySelector('.bwl-n').textContent = MR.num(st[f]);
      el.querySelector('.dish').style.setProperty('--lvl', String(st[f] / R.MAX_STOCK));
      el.querySelector('.bwl-minus').disabled = st[f] <= 0;
    });
    const cost = R.stockCost(st);
    $('spendN').textContent = MR.rs() + ' ' + MR.money(cost);
    const fromCash = Math.max(0, G.W.cash);
    $('leftN').textContent = cost > fromCash ? t('fromTips', { n: cost - fromCash }) : MR.rs() + ' ' + MR.money(G.W.cash - cost);
    const total = R.FILLS.reduce((n, f) => n + st[f], 0);
    const bust = broke();
    $('broke').hidden = !bust; if (bust) $('broke').textContent = t('broke');
    $('openBtn').querySelector('.bb-main').textContent = bust ? t('endWeek') : total ? t('open') : t('openEmpty');
  }
  $('openBtn').addEventListener('click', () => {
    if (!broke()) { openStall(); return; }
    // nothing left to buy filling with: the week ends here instead of four empty evenings
    au.tap(); R.finishWeek(G.W); recordWeek(); store.week = null; save();
    renderWeek(); show('week'); au.lose();
  });

  // ---------- play ----------
  const cv = $('game'); const ctx = cv.getContext('2d');
  let dpr = 1; let sky = null; let back = null; let front = null;

  function openStall(stock) {
    au.unlock();
    const st = stock || G.stock;
    const short = R.stockCost(st) - Math.max(0, G.W.cash);
    if (short > 0) { const k = Math.min(short, Math.max(0, G.W.tips)); G.W.tips -= k; G.W.cash += k; }
    G.S = R.startDay(G.W, st);
    Object.assign(G, { parts: [], leavers: [], enter: {}, looks: {}, lastFace: {}, drag: null, sel: -1, pop: {}, nope: null, shake: 0,
      closeAt: null, cardSlot: -1, cardGap: 0, said: {}, tutDoneAt: null, rushSaid: false, burnSaid: {}, paused: false, report: null });
    $('card').hidden = true; $('coach').hidden = true; $('subs').textContent = '';
    show('play');
    resize();
    au.bell(); au.musicStart(); au.ambience(true); au.intensity(0.2);
    banner(t('dayN', { d: MR.num(G.W.day + 1) }), t('bnOpen'));
    if (G.W.day === 1) say(t('new_chicken'));
  }

  function resize() {
    if (G.screen !== 'play' || !G.S) return;
    const wrap = $('playWrap'); const r = wrap.getBoundingClientRect();
    const cw = Math.max(200, r.width); const ch = Math.max(300, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    const S = G.S;
    G.L = A.layout(cw, ch, S.tiers.length, { fills: S.fills, jhol: S.styles.indexOf('jhol') >= 0, kothey: S.styles.indexOf('kothey') >= 0 });
    sky = A.makeSky(G.L); back = A.makeBack(G.L, dpr); front = A.makeFront(G.L, dpr);
    const L = G.L;
    // overlay positions in css px
    const px = (y) => y * L.s + 'px';
    $('subs').style.top = px(L.cTop - 30);
    // the coach sits on the empty pass shelf while you work the table, and drops onto the table once
    // the plate is on the shelf, so it never hides the thing it is pointing at
    $('coach').style.setProperty('--hi', px(L.wTop - 8));
    $('coach').style.setProperty('--lo', px(L.wTop + 10));
    $('card').style.top = px(L.roof + 6);
    $('card').style.maxHeight = px(L.cTop - L.roof - 10);
    $('banner').style.top = px(L.roof + 40);
  }
  if (window.ResizeObserver) new ResizeObserver(() => resize()).observe($('playWrap'));
  window.addEventListener('resize', resize);

  // ---- subtitles, banner, coach ----
  let subT = 0;
  function say(text, ms) {
    const el = $('subs');
    el.textContent = text; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(subT); subT = setTimeout(() => el.classList.remove('on'), ms || 1800);
  }
  let bnT = 0;
  function banner(k, title) {
    const el = $('banner');
    $('bnK').textContent = k; $('bnT').textContent = title; el.hidden = false;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(bnT); bnT = setTimeout(() => { el.hidden = true; }, 1700);
  }

  // ---- particles ----
  function emit(kind, x, y, n, o) {
    o = o || {};
    const cap = reduce ? 60 : 320;
    for (let i = 0; i < n && G.parts.length < cap; i++) {
      const a = (o.a != null ? o.a : -Math.PI / 2) + (Math.random() - 0.5) * (o.spread != null ? o.spread : 1.2);
      const sp = (o.sp || 40) * (0.5 + Math.random());
      G.parts.push({ kind, x: x + (Math.random() - 0.5) * (o.jx || 0), y: y + (Math.random() - 0.5) * (o.jy || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: (o.life || 1) * (0.7 + Math.random() * 0.6), r: (o.r || 4) * (0.7 + Math.random() * 0.6), col: o.col, g: o.g || 0, text: o.text, tx: o.tx, ty: o.ty });
    }
  }
  function updateParts(dt) {
    const P = G.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life += dt;
      if (p.life >= p.max) { P.splice(i, 1); continue; }
      if (p.kind === 'coin') {
        const k = Math.min(1, p.life / p.max); const e = k * k;
        p.x += (p.tx - p.x) * e * 0.35; p.y += (p.ty - p.y) * e * 0.35 + p.vy * dt * (1 - k);
      } else {
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === 'steam' || p.kind === 'smoke') { p.vx += Math.sin(G.vt * 2 + p.y * 0.05) * 6 * dt; p.r += dt * (p.kind === 'smoke' ? 18 : 10); }
      }
    }
  }
  function drawParts() {
    for (const p of G.parts) {
      const k = p.life / p.max;
      if (p.kind === 'steam') { ctx.fillStyle = `rgba(255,255,255,${0.28 * (1 - k)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      else if (p.kind === 'smoke') { ctx.fillStyle = `rgba(30,20,20,${0.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      else if (p.kind === 'spark') { ctx.fillStyle = `rgba(255,230,140,${1 - k})`; A.star(ctx, p.x, p.y, p.r * (1 - k * 0.5)); }
      else if (p.kind === 'dot') { ctx.fillStyle = p.col; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
      else if (p.kind === 'coin') { ctx.fillStyle = '#f2b51d'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * Math.abs(Math.cos(p.life * 10)) + 1, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#9a6a00'; ctx.lineWidth = 1; ctx.stroke(); }
      else if (p.kind === 'text') {
        ctx.globalAlpha = 1 - k * k; ctx.font = '20px Anton, Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = '#1b1430'; ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = p.col || '#ffd27a'; ctx.fillText(p.text, p.x, p.y); ctx.globalAlpha = 1;
      }
    }
  }

  // ---- event handling ----
  const fname = (f) => t(f);
  function handleEvents() {
    const S = G.S; const L = G.L;
    for (const e of S.ev) {
      switch (e.type) {
        case 'arrive': {
          const c = S.slots[e.slot];
          if (c) { G.looks[c.id] = A.look(c.look, c.special); G.enter[c.id] = { t0: G.vt, dir: e.slot === 0 ? -1 : 1 }; }
          au.arrive();
          break;
        }
        case 'tut-skip': G.tutDoneAt = G.vt - 10; break;
        case 'walkby': if (sayOnce('walkby', 6)) say(t('s_walkby')); break;
        case 'mood':
          if (e.mood === 'frown' && sayOnce('wait', 5)) say(t(Math.random() < 0.5 ? 's_wait' : 's_wait2'));
          break;
        case 'leave': {
          const c = { id: e.id }; const lk = G.looks[e.id];
          if (e.slot >= 0 && lk) G.leavers.push({ lk, x: L.slots[e.slot].x, dir: e.slot === 0 ? -1 : 1, t0: G.vt, face: e.why === 'happy' ? (e.face || 'yum') : e.why === 'angry' ? 'angry' : 'ok', mood: e.why === 'angry' ? 'frown' : 'happy' });
          if (e.why === 'angry') { au.angry(); say(t('s_angry')); if (e.slot >= 0) emit('smoke', L.slots[e.slot].x, L.cTop - 120, 8, { sp: 30, r: 6, life: 0.8 }); kick(4); buzz(40); }
          if (e.why === 'soldout') { say(t('s_soldout', { f: fname(e.fill) })); au.wrong(); }
          if (G.cardSlot === e.slot) hideCard();
          delete G.enter[c.id];
          break;
        }
        case 'select': au.select(['buff', 'chicken', 'veg'].indexOf(e.fill)); break;
        case 'pleat':
          au.pleat(e.n);
          emit('dot', L.board.x, L.board.y, reduce ? 3 : 8, { col: '#fff8ec', sp: 70, spread: 6.28, r: 2.2, life: 0.5 });
          if (!e.bhai) buzz(8);
          break;
        case 'folded': au.folded(); emit('spark', L.board.x, L.board.y - 20, 6, { sp: 60, spread: 6.28, r: 5, life: 0.6 }); break;
        case 'load': { au.load(); const b = L.tiers[e.tier]; emit('steam', b.x + b.w / 2, b.y, 10, { sp: 50, jx: b.w, r: 6, life: 0.9 }); buzz(12); break; }
        case 'cooked': au.cooked(); break;
        case 'tier-perfect': au.perfectOn(); break;
        case 'tier-burnt': {
          au.burnt(); const b = L.tiers[e.tier]; emit('smoke', b.x + b.w / 2, b.y + 6, 16, { sp: 50, jx: b.w, r: 8, life: 1.4 });
          if (!G.burnSaid[e.tier]) { say(t('burning')); G.burnSaid[e.tier] = 1; }
          kick(6); buzz([30, 40, 30]);
          break;
        }
        case 'pull': {
          G.burnSaid[e.tier] = 0;
          au.pull(e.q); G.pop[e.slot] = G.vt;
          const p = L.pass[e.slot];
          if (e.q === 'perfect') { emit('spark', p.x, p.y, reduce ? 6 : 16, { sp: 120, spread: 6.28, r: 6, life: 0.8 }); say(t('perfect'), 1000); buzz(25); }
          else if (e.q === 'burnt') emit('smoke', p.x, p.y, 10, { sp: 40, r: 7, life: 1 });
          const b = L.tiers[e.tier]; emit('steam', b.x + b.w / 2, b.y + 4, 12, { sp: 80, jx: b.w * 0.8, r: 7, life: 1 });
          break;
        }
        case 'nope': {
          au.nope();
          const msg = 'n_' + e.why;
          if (MR.STR[msg] && sayOnce(msg, 1.2)) say(t(msg, { f: e.fill ? fname(e.fill) : '' }), 1300);
          G.nope = { e, t0: G.vt };
          break;
        }
        case 'achar': { au.achar(); const p = dragPos() || L.achar; emit('dot', p.x, p.y, 7, { col: '#d8321e', sp: 80, spread: 6.28, r: 2.6, life: 0.5, g: 200 }); buzz(10); break; }
        case 'jhol': { au.jhol(); const p = dragPos() || L.jhol; emit('dot', p.x, p.y, 8, { col: '#e0782a', sp: 90, spread: 6.28, r: 3, life: 0.5, g: 220 }); break; }
        case 'fry': au.fry(); au.sizzle(true); break;
        case 'unfry': au.sizzle(false); au.pull(e.q === 'perfect' ? 'perfect' : 'ok'); G.pop[e.slot] = G.vt; if (e.q === 'perfect') emit('spark', L.pass[e.slot].x, L.pass[e.slot].y, 10, { sp: 100, spread: 6.28, r: 5, life: 0.7 }); break;
        case 'tawa-perfect': au.perfectOn(); break;
        case 'tawa-burnt': au.burnt(); emit('smoke', L.tawa.x, L.tawa.y, 12, { sp: 40, jx: 40, r: 7, life: 1.2 }); kick(4); break;
        case 'bin': au.bin(); break;
        case 'wrong': au.wrong(); say(t('s_wrong'), 1300); G.nope = { e: { why: 'cust', slot: e.slot }, t0: G.vt }; buzz(30); break;
        case 'serve': {
          G.lastFace[e.slot] = e.face;
          au.serve();
          const sx = L.slots[e.slot].x; const sy = L.cTop - 110;
          if (e.free) say(t('s_free'), 1300);
          else {
            au.coin(1 + (e.tip > 20 ? 2 : e.tip > 0 ? 1 : 0));
            emit('coin', sx, sy, Math.min(8, 2 + Math.round(e.tip / 8)), { sp: 60, r: 5, life: 0.9, tx: 230, ty: 14 });
            emit('text', sx, sy - 20, 1, { sp: 34, spread: 0.2, life: 1.1, text: '+' + MR.money(e.pay + e.tip), col: e.face === 'yuck' ? '#ff8a7a' : '#ffd27a' });
            const line = e.face === 'yum' ? (e.perfect ? 's_yum2' : 's_yum') : 's_' + e.face;
            say(t(line), 1300);
          }
          if (e.perfect) emit('spark', sx, sy, 10, { sp: 90, spread: 6.28, r: 5, life: 0.7 });
          buzz(15);
          break;
        }
        case 'decide': {
          hideCard();
          au.swipe(e.yes);
          say(t(e.timeout && e.kind !== 'vlogger' ? 'r_timeout' : 'r_' + e.kind + (e.yes ? '_yes' : '_no')), 1700);
          break;
        }
        case 'close':
          au.bell(); au.sizzle(false); au.steam(0);
          banner(t('closed'), t('bnClose'));
          G.closeAt = G.vt + 1.9;
          hideCard();
          break;
        default: break;
      }
    }
    S.ev.length = 0;
  }
  function sayOnce(key, gap) {
    const now = G.vt;
    if (G.said[key] && now - G.said[key] < gap) return false;
    G.said[key] = now; return true;
  }
  function kick(n) { if (!reduce) G.shake = Math.max(G.shake, n); }
  function dragPos() { return G.drag ? { x: G.drag.x, y: G.drag.y } : null; }

  // ---- special customer card ----
  function fillCard(slot) {
    const c = G.S && G.S.slots[slot]; if (!c || !c.special) return;
    const sp = c.special; const k = sp.type;
    let who; let tell;
    if (k === 'student') { who = t('sp_student'); tell = t(sp.gang ? 'tell_gang' : 'tell_alone'); }
    else if (k === 'credit') {
      who = t('sp_' + sp.who);
      const owes = G.W.credit.filter((cr) => cr.who === sp.who && !cr.settled).reduce((n, cr) => n + cr.amount, 0);
      tell = owes ? t('tell_owes', { n: owes }) : t('tell_' + sp.who);
    } else if (k === 'inspector') { who = t('sp_inspector'); tell = t('tell_' + sp.tell); }
    else { who = t(sp.big ? 'sp_vlogBig' : 'sp_vlogSmall'); tell = t(sp.big ? 'tell_big' : 'tell_small'); }
    $('cardWho').textContent = who;
    $('cardAsk').textContent = t('ask_' + k, { fee: R.FEE });
    $('cardTell').textContent = tell;
    $('cardYesT').textContent = t('yes_' + k, { fee: R.FEE });
    $('cardNoT').textContent = t('no_' + k);
    $('card').dataset.kind = k;
  }
  function showCard(slot) {
    const c = G.S && G.S.slots[slot];
    if (!c || !c.special || c.special.decided !== null || G.screen !== 'play') return;
    G.cardSlot = slot;
    fillCard(slot);
    const el = $('card'); el.hidden = false;
    el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    const ci = $('cardIn'); ci.style.transform = ''; ci.style.setProperty('--yes', '0'); ci.style.setProperty('--no', '0');
    au.card(); buzz(15);
  }
  function hideCard() { if (G.cardSlot >= 0) G.cardGap = G.vt + 0.8; G.cardSlot = -1; $('card').hidden = true; }
  function decideCard(yes) {
    if (G.cardSlot < 0) return;
    R.decide(G.S, G.cardSlot, yes);
  }
  let swipedAt = -1e9; // a swipe that starts on a button must not also click it
  $('cardYes').addEventListener('click', () => { if (performance.now() - swipedAt > 400) decideCard(true); });
  $('cardNo').addEventListener('click', () => { if (performance.now() - swipedAt > 400) decideCard(false); });
  (function swipe() {
    // the swipe can start anywhere on the card, buttons included: thumbs land low on a phone
    const el = $('cardIn'); let x0 = null; let dx = 0; let id = null; let on = false;
    el.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; id = e.pointerId; on = false; });
    el.addEventListener('pointermove', (e) => {
      if (x0 === null || e.pointerId !== id) return;
      dx = e.clientX - x0;
      if (!on) {
        if (Math.abs(dx) < 10) return;
        on = true; try { el.setPointerCapture(id); } catch (err) { /* already released */ }
        el.classList.add('dragging');
      }
      el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      el.style.setProperty('--yes', String(Math.max(0, Math.min(1, dx / 80))));
      el.style.setProperty('--no', String(Math.max(0, Math.min(1, -dx / 80))));
    });
    const end = (e) => {
      if (x0 === null || e.pointerId !== id) return;
      x0 = null; el.classList.remove('dragging');
      if (!on) return;
      on = false; swipedAt = performance.now();
      if (Math.abs(dx) > 70) {
        el.style.transform = `translateX(${dx > 0 ? 420 : -420}px) rotate(${dx > 0 ? 25 : -25}deg)`;
        decideCard(dx > 0);
      } else { el.style.transform = ''; el.style.setProperty('--yes', '0'); el.style.setProperty('--no', '0'); }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  })();

  // ---- input on the canvas ----
  function toCol(e) {
    const r = cv.getBoundingClientRect(); const L = G.L;
    return { x: (e.clientX - r.left) / L.s - L.ox, y: (e.clientY - r.top) / L.s };
  }
  const near = (p, c, pad) => Math.hypot(p.x - c.x, p.y - c.y) <= c.r + (pad || 8);
  const inRect = (p, b, pad) => p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad;
  function hit(p) {
    const S = G.S; const L = G.L;
    for (const f of S.fills) if (near(p, L.bowls[f], 6)) return { kind: 'bowl', f };
    if (near(p, L.board, 4)) return { kind: 'board' };
    for (let i = 0; i < L.tiers.length; i++) if (inRect(p, L.tiers[i], 6)) return { kind: 'tier', i };
    if (inRect(p, { x: L.lid.x, y: L.lid.y, w: L.lid.w, h: L.lid.h }, 4)) return { kind: 'tier', i: L.tiers.length - 1 };
    for (let i = 0; i < L.pass.length; i++) if (near(p, L.pass[i], 4)) return { kind: 'pass', i };
    if (near(p, L.achar, 6)) return { kind: 'achar' };
    if (L.jhol.on && near(p, L.jhol, 6)) return { kind: 'jhol' };
    if (L.tawa.on && near(p, L.tawa, 8)) return { kind: 'tawa' };
    if (near(p, L.bin, 8)) return { kind: 'bin' };
    for (let i = 0; i < 3; i++) { const s = L.slots[i]; if (Math.abs(p.x - s.x) < 50 && p.y > L.cTop - 200 && p.y < L.cTop + 4) return { kind: 'cust', i }; }
    return null;
  }
  function firstFreeTier() { return G.S.tiers.indexOf(null); }

  cv.addEventListener('pointerdown', (e) => {
    if (G.screen !== 'play' || G.paused || !G.S || G.S.over) return;
    au.unlock();
    const p = toCol(e); const h = hit(p); const S = G.S;
    cv.setPointerCapture(e.pointerId);
    G.drag = null;
    if (!h) { G.sel = -1; return; }
    if (h.kind === 'bowl') { R.select(S, h.f); G.sel = -1; return; }
    if (h.kind === 'board') {
      if (S.board.ready) G.drag = { kind: 'tray', x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false };
      else G.drag = { kind: 'fold', x: p.x, y: p.y, sx: p.x, sy: p.y, armed: true, did: false };
      return;
    }
    if (h.kind === 'tier') {
      const tr = S.tiers[h.i];
      if (!tr) { if (S.board.ready) R.load(S, h.i); else R.tierTap(S, h.i); return; }
      G.drag = { kind: 'tier', i: h.i, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false };
      return;
    }
    if (h.kind === 'pass') {
      if (S.pass[h.i]) G.drag = { kind: 'plate', slot: h.i, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, dipped: false };
      else G.sel = -1;
      return;
    }
    if (h.kind === 'tawa') { if (S.tawa) R.unfry(S); else if (G.sel >= 0) { R.fry(S, G.sel); G.sel = -1; } return; }
    const sel = G.sel;
    if (sel >= 0 && S.pass[sel]) {
      if (h.kind === 'achar') R.achar(S, sel);
      else if (h.kind === 'jhol') R.jhol(S, sel);
      else if (h.kind === 'bin') { R.bin(S, sel); G.sel = -1; }
      else if (h.kind === 'cust') { if (R.serve(S, sel, h.i)) G.sel = -1; }
    }
  });
  cv.addEventListener('pointermove', (e) => {
    const d = G.drag; if (!d || !G.S) return;
    const p = toCol(e); const S = G.S; const L = G.L;
    d.x = p.x; d.y = p.y;
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 10) d.moved = true;
    if (d.kind === 'fold') {
      if (d.armed && d.sy - p.y > 22) { R.pleat(S); d.armed = false; d.did = true; d.sy = p.y; }
      else if (!d.armed && p.y - d.sy > 12) { d.armed = true; d.sy = p.y; }
      else if (!d.armed && p.y < d.sy) d.sy = p.y;
    }
    if (d.kind === 'tier' && d.moved) {
      const before = S.pass.slice();
      if (R.pull(S, d.i)) {
        const slot = S.pass.findIndex((x, k) => x && !before[k]);
        G.drag = { kind: 'plate', slot, x: p.x, y: p.y, sx: d.sx, sy: d.sy, moved: true, dipped: false };
      } else G.drag = null;
    }
    if (d.kind === 'plate' && S.pass[d.slot]) {
      if (near(p, L.achar, 4) && !S.pass[d.slot].achar) R.achar(S, d.slot);
      if (L.jhol.on && near(p, L.jhol, 4) && !S.pass[d.slot].jhol) R.jhol(S, d.slot);
    }
  });
  function endDrag(e) {
    const d = G.drag; if (!d || !G.S) { G.drag = null; return; }
    G.drag = null;
    const S = G.S; const L = G.L;
    const p = e && e.clientX != null ? toCol(e) : { x: d.x, y: d.y };
    if (d.kind === 'fold') { if (!d.did) R.pleat(S); return; }
    if (d.kind === 'tray') {
      const h = hit(p);
      if (h && h.kind === 'tier' && !S.tiers[h.i]) R.load(S, h.i);
      else if (!d.moved || (p.x > 250 && p.y > L.wTop)) { const i = firstFreeTier(); if (i >= 0) R.load(S, i); else { au.nope(); say(t('n_steamFull'), 1300); } }
      return;
    }
    if (d.kind === 'tier') { R.pull(S, d.i); return; }
    if (d.kind === 'plate') {
      if (!S.pass[d.slot]) return;
      if (!d.moved) { G.sel = G.sel === d.slot ? -1 : d.slot; au.tap(); return; }
      const h = hit(p);
      if (!h) return;
      if (h.kind === 'cust') R.serve(S, d.slot, h.i);
      else if (h.kind === 'tawa') R.fry(S, d.slot);
      else if (h.kind === 'bin') R.bin(S, d.slot);
      if (G.sel === d.slot && !S.pass[d.slot]) G.sel = -1;
    }
  }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', () => { G.drag = null; });

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (G.screen !== 'play' || !G.S) return;
    const S = G.S; const k = e.key.toLowerCase();
    if (k === 'escape' || k === 'p') { e.preventDefault(); if (G.paused) resume(); else pause(); return; }
    if (G.paused || S.over) return;
    if (G.cardSlot >= 0 && (k === 'arrowright' || k === 'arrowleft' || k === 'y' || k === 'n')) { e.preventDefault(); decideCard(k === 'arrowright' || k === 'y'); return; }
    if (e.target.closest && e.target.closest('.card')) return;
    const plateIdx = () => (G.sel >= 0 && S.pass[G.sel] ? G.sel : S.pass.findIndex(Boolean));
    let used = true;
    if (k === '1' || k === '2' || k === '3') R.select(S, S.fills[+k - 1]);
    else if (k === ' ' || k === 'f') R.pleat(S);
    else if (k === 's') {
      if (S.board.ready && firstFreeTier() >= 0) R.load(S, firstFreeTier());
      else {
        let best = -1; let bt = -1;
        S.tiers.forEach((tr, i) => { if (tr && tr.t >= S.cook.raw && tr.t > bt) { bt = tr.t; best = i; } });
        if (best >= 0) R.pull(S, best); else au.nope();
      }
    } else if (k === 'a') { const i = S.pass.findIndex((p, j) => p && !p.achar && !p.jhol && (G.sel < 0 || j === G.sel)); if (i >= 0) R.achar(S, i); }
    else if (k === 'j') { const i = plateIdx(); if (i >= 0) R.jhol(S, i); }
    else if (k === 'k') { if (S.tawa) R.unfry(S); else { const i = plateIdx(); if (i >= 0) R.fry(S, i); } }
    else if (k === 'q' || k === 'w' || k === 'e' || k === 'r') { const i = 'qwer'.indexOf(k); G.sel = S.pass[i] ? i : -1; au.tap(); }
    else if (k === 'enter') {
      const order = G.sel >= 0 ? [G.sel] : [0, 1, 2, 3];
      let done = false;
      for (const i of order) {
        const p = S.pass[i]; if (!p) continue;
        const ci = S.slots.findIndex((c) => c && !(c.special && c.special.decided === null) && R.matches(c, p));
        if (ci >= 0) { R.serve(S, i, ci); done = true; G.sel = -1; break; }
      }
      if (!done) au.nope();
    } else if (k === 'backspace' || k === 'delete') { if (G.sel >= 0) { R.bin(S, G.sel); G.sel = -1; } }
    else used = false;
    if (used) e.preventDefault();
  });

  // ---- pause ----
  function pause() {
    if (G.screen !== 'play' || G.paused || !G.S || G.S.over) return;
    G.paused = true; au.musicStop(); au.steam(0); au.sizzle(false); au.ambience(false);
    $('pauseSheet').hidden = false; $('resumeBtn').focus();
  }
  function resume() {
    G.paused = false; $('pauseSheet').hidden = true; au.musicStart(); au.ambience(true);
    if (G.S && G.S.tawa) au.sizzle(true);
    $('game').focus({ preventScroll: true });
  }
  $('pauseBtn').addEventListener('click', pause);
  $('resumeBtn').addEventListener('click', resume);
  $('quitBtn').addEventListener('click', () => {
    G.paused = false; $('pauseSheet').hidden = true; au.musicStop(); au.ambience(false); au.steam(0); au.sizzle(false);
    if (G.S && !G.S.over) G.W.cash += G.S.cost; // today starts again from the bazaar
    G.S = null; hideCard();
    store.week = G.W; save();
    renderHome(); show('home');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  // ---- simulation step + visuals ----
  function simStep(dt) {
    const S = G.S;
    G.vt += dt;
    if (S && !G.paused) {
      R.step(S, dt);
      handleEvents();
      // emitters
      const L = G.L;
      let cooking = 0;
      S.tiers.forEach((tr, i) => {
        if (!tr) return; cooking++;
        const b = L.tiers[i];
        if (Math.random() < dt * (reduce ? 2 : 7)) emit('steam', b.x + 6 + Math.random() * (b.w - 12), b.y + 2, 1, { sp: 30, r: 4, life: 1.2, spread: 0.6 });
      });
      if (cooking && Math.random() < dt * (reduce ? 3 : 10)) emit('steam', L.lid.x + L.lid.w / 2, L.lid.y, 1, { sp: 45, jx: 30, r: 7, life: 1.8, spread: 0.5 });
      if (L.jhol.on && Math.random() < dt * 2) emit('steam', L.jhol.x, L.jhol.y - 10, 1, { sp: 20, r: 4, life: 1.2, spread: 0.6 });
      if (S.tawa && Math.random() < dt * 8) emit('dot', L.tawa.x + (Math.random() - 0.5) * 50, L.tawa.y, 1, { col: '#fff3c0', sp: 60, r: 1.3, life: 0.3, spread: 1.6 });
      au.steam(cooking);
      // music follows the crowd
      const waiting = S.queue.length + S.slots.filter(Boolean).length;
      const low = S.slots.filter((c) => c && c.pat / c.patMax < 0.35).length;
      au.intensity(0.2 + waiting * 0.09 + low * 0.1 + (S.t / S.len > 0.55 && S.t / S.len < 0.85 ? 0.2 : 0));
      if (!G.rushSaid && S.t / S.len > 0.55 && S.queue.length >= 1) { G.rushSaid = true; say(t('rush'), 1400); }
      if (G.cardSlot < 0 && G.vt >= G.cardGap) { const c = R.asking(S); if (c && S.t - c.seatT >= 0.45) showCard(c.slot); }
      if (S.tut === 'done' && G.tutDoneAt === null) { G.tutDoneAt = G.vt; store.tutDone = true; save(); }
      if (S.over && G.closeAt !== null && G.vt >= G.closeAt) { G.closeAt = null; finishDay(); }
    }
    updateParts(dt);
    G.shake = Math.max(0, G.shake - dt * 30);
    G.leavers = G.leavers.filter((l) => G.vt - l.t0 < 0.9);
  }

  function finishDay() {
    const S = G.S; if (!S) return;
    hideCard();
    const rep = R.endDay(G.W, S);
    G.report = rep;
    au.musicStop(); au.ambience(false); au.steam(0); au.sizzle(false);
    G.S = null;
    if (G.W.done) recordWeek();
    else G.W.evening = true; // a reload now still offers tonight's upgrades
    store.week = G.W.done ? null : G.W; save();
    renderReport(rep); show('report');
    au.coin(3);
  }

  // ---- render ----
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  function render() {
    const S = G.S; const L = G.L;
    if (!S || !L || !back) return;
    const sx = G.shake ? (Math.random() - 0.5) * G.shake * dpr : 0; const sy = G.shake ? (Math.random() - 0.5) * G.shake * dpr : 0;
    const k = L.s * dpr;
    const col = () => ctx.setTransform(k, 0, 0, k, L.ox * k + sx, sy);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#121638'; ctx.fillRect(0, 0, cv.width, cv.height);
    const nk = R.clamp(S.t / S.len, 0, 1);
    ctx.drawImage(sky, sx, sy, sky.width * dpr / Math.min(1, L.s), sky.height * dpr / Math.min(1, L.s));
    col();
    A.nightSky(ctx, L, nk);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(back, sx, sy);
    col();
    const vt = G.vt;
    A.nightCity(ctx, L, nk, vt, reduce);
    if (!reduce) A.traffic(ctx, L, vt);
    A.reflections(ctx, L, vt);
    // queue: little silhouettes waiting at the side
    const q = S.queue.length;
    for (let i = 0; i < Math.min(3, q); i++) {
      const x = L.queue.x - i * 14; const y = L.cTop - 40;
      ctx.fillStyle = '#1b1430cc'; ctx.beginPath(); ctx.arc(x, y - 20, 9, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y + 6, 14, 20, 0, Math.PI, 0); ctx.fill();
    }
    // leaving customers
    for (const l of G.leavers) {
      const kk = (vt - l.t0) / 0.9;
      ctx.globalAlpha = 1 - kk;
      A.customer(ctx, l.x + l.dir * ease(kk) * 200, L.cTop, l.lk, l.mood, vt, l.face);
      ctx.globalAlpha = 1;
    }
    // customers at the counter
    S.slots.forEach((c, i) => {
      if (!c) return;
      const lk = G.looks[c.id] || (G.looks[c.id] = A.look(c.look, c.special));
      const en = G.enter[c.id];
      const kk = en ? Math.min(1, (vt - en.t0) / 0.45) : 1;
      let x = L.slots[i].x + (1 - ease(kk)) * (en ? en.dir : 1) * 220;
      if (G.nope && G.nope.e.why === 'cust' && G.nope.e.slot === i && vt - G.nope.t0 < 0.35) x += Math.sin((vt - G.nope.t0) * 60) * 5;
      const mood = R.mood(c);
      A.customer(ctx, x, L.cTop, lk, mood, vt, null);
    });
    A.bulbs(ctx, L, vt, reduce);
    A.sign(ctx, 200, 60, 124, reduce ? 0 : Math.sin(vt * 0.9) * 0.025);
    // bubbles on top of the heads
    S.slots.forEach((c, i) => {
      if (!c) return;
      const en = G.enter[c.id]; const kk = en ? Math.min(1, (vt - en.t0) / 0.45) : 1;
      if (kk < 1) return;
      const lk = G.looks[c.id];
      A.bubble(ctx, L.slots[i].x, L.cTop - 92 * (lk ? lk.h : 1) - 58, c, R.frac(c), vt, c.pat / c.patMax < 0.25);
    });
    if (q > 0) {
      ctx.fillStyle = '#f07a1a'; A.rr(ctx, L.queue.x - 46, L.cTop - 30, 50, 22, 11); ctx.fill();
      ctx.fillStyle = '#1b1430'; ctx.font = '15px Anton, Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+' + MR.num(q), L.queue.x - 21, L.cTop - 18.5);
    }
    // front: counter + table
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(front, sx, sy);
    col();
    S.slots.forEach((c, i) => {
      if (!c) return;
      const en = G.enter[c.id]; const kk = en ? Math.min(1, (vt - en.t0) / 0.45) : 1;
      const lk = G.looks[c.id];
      if (kk >= 1 && lk) A.hands(ctx, L.slots[i].x, L.cTop, lk, R.mood(c), vt);
    });
    // counter stations
    const dragPlate = G.drag && G.drag.kind === 'plate' ? G.drag.slot : -1;
    const holding = dragPlate >= 0 || G.sel >= 0;
    A.acharBowl(ctx, L.achar, vt, holding);
    if (L.jhol.on) A.jholPot(ctx, L.jhol, vt, holding);
    L.pass.forEach((ps, i) => {
      const p = S.pass[i];
      if (!p || i === dragPlate) { A.passSlot(ctx, ps); return; }
      const pk = G.pop[i] != null ? Math.min(1, (vt - G.pop[i]) / 0.3) : 1;
      const r = ps.r * (reduce ? 1 : 0.6 + 0.4 * (1 - Math.pow(1 - pk, 2) * Math.cos(pk * 6)));
      A.plate(ctx, ps.x, ps.y, r, p, vt, G.sel === i);
    });
    // work table
    const nb = G.nope && vt - G.nope.t0 < 0.3 ? Math.sin((vt - G.nope.t0) * 70) * 4 : 0;
    S.fills.forEach((f) => {
      const b = L.bowls[f];
      const wob = G.nope && G.nope.e.why === 'noStock' && G.nope.e.fill === f ? nb : 0;
      A.bowl(ctx, { x: b.x + wob, y: b.y, r: b.r }, f, S.stock[f], S.sel === f, vt);
    });
    const boardWob = G.nope && /board|pickFirst|nothingFolded/.test(G.nope.e.why) ? nb : 0;
    A.board(ctx, { x: L.board.x + boardWob, y: L.board.y, r: L.board.r }, S.board, vt, G.drag && G.drag.kind === 'tray');
    if (L.tawa.on) A.tawaPan(ctx, L.tawa, S.tawa, vt, R.FRY);
    ctx.save();
    if (G.nope && G.nope.e.tier != null && vt - G.nope.t0 < 0.3) ctx.translate(nb, 0);
    A.steamer(ctx, L, S.tiers, vt, S.cook);
    ctx.restore();
    if (S.bhai) drawBhai(L, vt, S);
    drawParts();
    // dragged things on top
    const d = G.drag;
    if (d && d.kind === 'tray') A.tray(ctx, d.x, d.y, S.board.fill, vt, false);
    if (d && d.kind === 'plate' && S.pass[d.slot]) A.plate(ctx, d.x, d.y - 6, 32, S.pass[d.slot], vt, false);
    drawCoach(L, vt, S);
  }

  function drawBhai(L, vt, S) {
    // the little brother peeking over the board edge: cap, big eyes, hands patting the dough while he folds
    const x = L.board.x + L.board.r - 2; const y = L.board.y + L.board.r - 14;
    const busy = S.helperT > 0;
    const bob = reduce ? 0 : Math.sin(vt * (busy ? 9 : 2)) * (busy ? 1.6 : 0.8);
    ctx.save(); ctx.translate(x, y + bob);
    ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(2, 20, 18, 5, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2f6fb0'; A.rr(ctx, -14, 6, 28, 16, 7); ctx.fill();                  // school jumper
    ctx.fillStyle = '#c98d62'; ctx.beginPath(); ctx.arc(0, -4, 12, 0, 6.283); ctx.fill(); // face
    ctx.fillStyle = '#c84a2a'; ctx.beginPath(); ctx.ellipse(0, -10, 13, 8, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-14, -11, 12, 3); // cap, peak toward the board
    ctx.fillStyle = '#1a1210';
    const blink = !busy && (vt % 3.2) < 0.12;
    if (blink) { ctx.fillRect(-6, -3, 4, 1.4); ctx.fillRect(2, -3, 4, 1.4); }
    else { ctx.beginPath(); ctx.arc(-4, -3, 1.8, 0, 6.283); ctx.arc(4, -3, 1.8, 0, 6.283); ctx.fill(); }
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.4; ctx.beginPath();
    if (busy) { ctx.moveTo(-3, 3); ctx.lineTo(3, 3); } else ctx.arc(0, 2, 3.4, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    // hands on the dough
    const k1 = busy && !reduce ? Math.max(0, Math.sin(vt * 12)) * 4 : 0; const k2 = busy && !reduce ? Math.max(0, -Math.sin(vt * 12)) * 4 : 0;
    ctx.fillStyle = '#c98d62';
    ctx.beginPath(); ctx.ellipse(-20, -6 - k1, 5, 4, -0.5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-12, 8 - k2, 5, 4, -0.3, 0, 6.283); ctx.fill();
    ctx.restore();
    if (busy) {
      const tag = MR.getLang() === 'ne' ? 'भाइ' : 'Bhai';
      ctx.font = '800 11px Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(tag).width + 10;
      ctx.fillStyle = '#1b1430cc'; A.rr(ctx, x - w / 2, y + 26, w, 15, 7); ctx.fill();
      ctx.fillStyle = '#fff4e2'; ctx.fillText(tag, x, y + 34);
    }
  }

  // ---- tutorial coach ----
  function drawCoach(L, vt, S) {
    const el = $('coach');
    if (!S.tut || (S.tut === 'done' && G.tutDoneAt !== null && G.vt - G.tutDoneAt > 2.5)) { if (!el.hidden) el.hidden = true; return; }
    let key = null; let from = null; let to = null; let tap = false;
    const tier0 = S.tiers.findIndex(Boolean);
    const plateI = S.pass.findIndex(Boolean);
    switch (S.tut) {
      case 'pick': key = 'tPick'; from = L.bowls[S.tutFill] || L.bowls[S.fills[0]]; tap = true; break;
      case 'fold': key = 'tFold'; from = { x: L.board.x, y: L.board.y + 30 }; to = { x: L.board.x, y: L.board.y - 30 }; break;
      case 'steam': key = 'tSteam'; from = L.board; { const b = L.tiers[Math.max(0, firstFreeTier())]; to = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; } break;
      case 'wait': {
        const tr = tier0 >= 0 ? S.tiers[tier0] : null;
        if (tr && tr.t >= S.cook.perfect) { key = 'tPull'; const b = L.tiers[tier0]; from = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; tap = true; }
        else key = 'tWait';
        break;
      }
      case 'achar': key = 'tAchar'; if (plateI >= 0) { from = L.pass[plateI]; to = L.achar; } break;
      case 'serve': key = 'tServe'; if (plateI >= 0) { from = L.pass[plateI]; to = { x: L.slots[1].x, y: L.cTop - 60 }; } break;
      case 'done': key = 'tDone'; break;
      default: break;
    }
    if (key) {
      const txt = t(key, { f: t(S.tutFill || 'buff') }); if (el.textContent !== txt) el.textContent = txt; if (el.hidden) el.hidden = false;
      const low = plateI >= 0 && (S.tut === 'achar' || S.tut === 'serve' || S.tut === 'done');
      if (el.classList.contains('low') !== low) el.classList.toggle('low', low);
    }
    if (G.drag || !from) return;
    const cyc = (vt % 1.6) / 1.6;
    if (tap || !to) { A.hand(ctx, from.x + 4, from.y + 4, cyc > 0.5); return; }
    const kk = Math.min(1, cyc / 0.8);
    const e2 = kk < 0.5 ? 2 * kk * kk : 1 - Math.pow(-2 * kk + 2, 2) / 2;
    A.hand(ctx, from.x + (to.x - from.x) * e2 + 4, from.y + (to.y - from.y) * e2 + 4, cyc < 0.85);
  }

  // ---- HUD ----
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function starStr(r) { const n = Math.round(r * 2) / 2; let s = ''; for (let i = 1; i <= 5; i++) s += n >= i ? '★' : n >= i - 0.5 ? '⯪' : '☆'; return s; }
  function hud() {
    const S = G.S; if (!S) return;
    const k = Math.min(1, S.t / S.len);
    const mins = 18 * 60 + Math.floor(k * 180);
    const h = Math.floor(mins / 60) - 12; const m = mins % 60;
    setText('clockT', MR.num(h + ':' + String(m).padStart(2, '0')));
    setText('clockDay', MR.num(G.W.day + 1));
    const arc = $('clockArc'); const off = String(94.25 * (1 - k));
    if (hudCache.arc !== off) { hudCache.arc = off; arc.style.strokeDashoffset = off; }
    setText('takeN', MR.rs() + ' ' + MR.money(S.take));
    setText('tipsN', MR.money(S.tips));
    setText('hudStars', starStr(R.clamp(S.rep, 0, 5)));
    $('hud').classList.toggle('late', k > 0.85);
    if (G.cardSlot >= 0) {
      const c = S.slots[G.cardSlot];
      if (c && c.special && c.special.decided === null) $('cardTimer').style.transform = `scaleX(${Math.max(0, c.dec / R.DECIDE_T)})`;
    }
  }

  // ---- hero art on the home screen ----
  const hero = $('heroArt'); const hctx = hero.getContext('2d');
  const heroParts = [];
  function drawHero(dt) {
    const w = 400; const h = 190;
    const sc = Math.min(2, window.devicePixelRatio || 1);
    if (hero.width !== w * sc) { hero.width = w * sc; hero.height = h * sc; }
    const c = hctx; c.setTransform(sc, 0, 0, sc, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, A.C.sky1); g.addColorStop(0.6, A.C.sky2); g.addColorStop(1, A.C.sky3);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const save = ctx; // reuse art functions on the hero context
    A.bulbs.call(null, c, { ox: 0 }, G.vt, reduce);
    const L = { pot: { x: 139, y: 148, w: 122, h: 30 }, flame: { x: 200, y: 186 }, tiers: [0, 1, 2].map((i) => ({ x: 147, y: 148 - (i + 1) * 30, w: 106, h: 30 })), lid: { x: 147, y: 148 - 90 - 20, w: 106, h: 20 } };
    c.fillStyle = '#9aa4ae'; c.fillRect(0, 160, w, 30); c.fillStyle = '#eef2f5'; c.fillRect(0, 158, w, 3);
    A.steamer(c, L, [{ fill: 'buff', t: 7.4 }, { fill: 'veg', t: 5.4 }, { fill: 'chicken', t: 2.4 }], G.vt, R.COOK);
    A.plate(c, 70, 172, 26, { fill: 'buff', q: 'perfect', achar: true }, G.vt);
    A.plate(c, 330, 172, 26, { fill: 'veg', q: 'ok', jhol: true }, G.vt);
    A.acharBowl(c, { x: 22, y: 150, r: 16 }, G.vt);
    if (Math.random() < dt * (reduce ? 2 : 9)) heroParts.push({ x: 200 + (Math.random() - 0.5) * 30, y: 40, r: 5, life: 0, max: 1.6 + Math.random() });
    for (let i = heroParts.length - 1; i >= 0; i--) {
      const p = heroParts[i]; p.life += dt; if (p.life > p.max) { heroParts.splice(i, 1); continue; }
      p.y -= 18 * dt; p.x += Math.sin(G.vt * 2 + p.y * 0.1) * 8 * dt; p.r += 7 * dt;
      c.fillStyle = `rgba(255,255,255,${0.3 * (1 - p.life / p.max)})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
    }
    void save;
  }

  // ---------- evening report ----------
  function renderReport(rep) {
    const W = G.W;
    $('repH').textContent = t('evening', { d: MR.num(rep.d + 1) });
    const td = rep.today;
    const chips = [['servedN', td.plates, 'ok'], ['perfectN', td.perfect, 'gold'], ['angryN', td.angry, 'bad'], ['turnedN', td.turned, 'bad'], ['burntN', td.burnt, 'bad']]
      .filter(([k, n], i) => i === 0 || n > 0);
    $('tally').innerHTML = chips.map(([k, n, cls]) => `<li class="${cls}">${t(k, { n: MR.num(n) })}</li>`).join('');
    const fees = (rep.notes.filter((n) => n.k === 'inspRealPaid' || n.k === 'inspFakePaid').length) * R.FEE;
    const extras = rep.net - (rep.take - rep.overhead - rep.cost);
    const rows = [
      [t('sales'), rep.take + fees, ''],
      fees || extras ? [t('extras'), extras - fees, ''] : null,
      [t('stockCost'), -rep.cost, ''],
      [t('overhead'), -rep.overhead, ''],
      [t('todayNet'), rep.net, 'sum'],
      rep.spoiled ? [t(rep.spoiledPlates === 1 ? 'spoiled1' : 'spoiled', { n: MR.num(rep.spoiledPlates) }), -rep.spoiled, 'muted'] : null,
      [t('tipJar'), W.tips, 'tips'],
      [t('cashNow'), W.cash, 'sum'],
    ].filter(Boolean);
    $('ledger').innerHTML = rows.map(([l, v, cls]) => `<li class="${cls}"><span>${l}</span><b>${v < 0 ? '−' : cls === 'sum' || cls === 'tips' ? '' : '+'}${MR.rs()} ${MR.money(Math.abs(v))}</b></li>`).join('');
    const notes = [];
    const plan = R.dayPlan(W, rep.d);
    if (plan.rumour) notes.push(`<li class="${plan.truth ? 'good' : 'bad'}">${t(plan.truth ? 'rumourTrue' : 'rumourFalse')} <small>${t('src_' + plan.source)}</small></li>`);
    rep.notes.forEach((n) => {
      const who = n.who ? t(n.who) : '';
      const good = /paidBack|inspRealPaid|inspFakeNo|studentGang|studentFed|vlog_perfect|vlog_ok/.test(n.k);
      const bad = /noShow|inspFakePaid|inspRealNo|studentLeft|vlog_bad|creditNo/.test(n.k);
      notes.push(`<li class="${good ? 'good' : bad ? 'bad' : ''}">${t('n_' + n.k, { who, n: n.amount || 0, p: MR.num(n.pct || 0) })}</li>`);
    });
    $('notes').innerHTML = notes.join('');
    $('repStars').textContent = starStr(rep.repTo);
    $('repStars').setAttribute('aria-label', MR.num(Math.round(rep.repTo * 2) / 2) + ' / ' + MR.num(5));
    $('repNextT').textContent = W.done ? t('seeWeek') : t('toUpgrades');
  }
  $('repNext').addEventListener('click', () => {
    au.tap();
    if (G.W.done) { renderWeek(); show('week'); if (G.W.result.profit >= 0) au.win(); else au.lose(); }
    else { renderUpgrades(); show('upgrade'); }
  });

  // ---------- upgrades ----------
  function renderUpgrades() {
    const W = G.W;
    $('upTips').textContent = MR.rs() + ' ' + MR.money(W.tips);
    const offers = R.offerUpgrades(W);
    $('upgs').innerHTML = offers.map((o) => `
      <article class="upg u-${o.id}">
        <canvas class="u-ico" width="120" height="120" data-ico="${o.id}" aria-hidden="true"></canvas>
        <div class="u-txt"><h3>${t('u_' + o.id)}</h3><p>${t('ud_' + o.id)}</p></div>
        <button type="button" class="u-buy" data-u="${o.id}" ${o.afford ? '' : 'disabled'}>${o.afford ? t('buy', { n: o.cost }) : t('needMore', { n: o.cost - W.tips })}</button>
      </article>`).join('');
    $('upgs').querySelectorAll('canvas.u-ico').forEach((c) => { const x = c.getContext('2d'); x.scale(2, 2); A.icon(x, c.dataset.ico); });
    $('upgs').querySelectorAll('.u-buy').forEach((b) => b.addEventListener('click', () => {
      if (R.buyUpgrade(W, b.dataset.u)) { au.upgrade(); buzz(20); toast(t('bought', { u: t('u_' + b.dataset.u) })); store.week = W; save(); goBazaar(); }
    }));
  }
  $('upSkip').addEventListener('click', () => { au.tap(); store.week = G.W; save(); goBazaar(); });

  // ---------- week result ----------
  function recordWeek() {
    const W = G.W; const res = W.result;
    const beat = !store.best || res.profit > store.best.profit;
    res.newBest = beat && (!!store.best || res.profit >= 0); // no party for a first week that lost money
    if (beat) store.best = { profit: res.profit, title: res.title, at: Date.now() };
    if (W.daily && W.dailyKey) {
      const old = store.daily[W.dailyKey];
      if (!old || res.profit > old.profit) store.daily[W.dailyKey] = { profit: res.profit, title: res.title, stars: res.stars };
      const keys = Object.keys(store.daily).sort();
      while (keys.length > 30) delete store.daily[keys.shift()];
    }
    store.weeks = (store.weeks || 0) + 1;
    save();
  }
  // the week's decisions, added up from the evening notes: [class, text, weight]
  function weekCalls(W) {
    const out = []; const n = { given: 0, back: 0, ok: 0, insp: 0, stud: 0, spoiled: 0, soldout: 0, vlog: null };
    W.reports.forEach((r) => {
      n.spoiled += r.spoiledPlates || 0; n.soldout += r.today.soldout || 0;
      r.notes.forEach((x) => {
        if (x.k === 'creditGiven') n.given += x.amount;
        else if (x.k === 'paidBack') n.back += x.amount;
        else if (/^insp/.test(x.k)) { n.insp++; if (x.k === 'inspRealPaid' || x.k === 'inspFakeNo') n.ok++; }
        else if (x.k === 'studentFed' || x.k === 'studentGang') n.stud++;
        else if (/^vlog_/.test(x.k)) { const v = x.k.slice(5); if (!n.vlog || v === 'perfect' || (v === 'ok' && n.vlog === 'bad')) n.vlog = v; }
      });
    });
    out.push([n.spoiled + n.soldout > 6 ? 'bad' : 'good', t('c_stock', { s: MR.num(n.spoiled), t: MR.num(n.soldout) }), 1]);
    if (n.given) out.push([n.back >= n.given ? 'good' : 'bad', t('c_udharo', { g: MR.money(n.given), b: MR.money(n.back) }), 3]);
    if (n.insp) out.push([n.ok === n.insp ? 'good' : 'bad', t('c_insp', { ok: MR.num(n.ok), n: MR.num(n.insp) }), 3]);
    if (n.vlog) out.push([n.vlog === 'bad' ? 'bad' : 'good', t('c_vlog_' + n.vlog), 2]);
    if (n.stud) out.push(['good', t('c_student', { n: MR.num(n.stud) }), 2]);
    return out;
  }
  function storyData() {
    const W = G.W; const res = W.result; const st = W.stats;
    const plates = st.sold.buff + st.sold.chicken + st.sold.veg;
    const mode = W.daily ? t('daily', { n: MR.num(W.dailyN) }) : t('weekMode');
    const stars = starStr(res.stars);
    const url = /^https?:/.test(location.protocol) ? location.origin + location.pathname : '';
    return {
      mode, title: t('t_' + res.title), profit: res.profit, money: MR.money(Math.abs(res.profit)), stars: res.stars,
      calls: weekCalls(W).slice().sort((a, b) => b[2] - a[2]).slice(0, 2).map((c) => c[1]),
      sub: (W.reports.length >= R.DAYS ? t('days5') : W.reports.length === 1 ? t('days1') : t('daysN', { n: MR.num(W.reports.length) })) + ' · ' + (res.rentOk ? t('rentPaid', { n: R.RENT }) : t('rentFail', { n: R.RENT })),
      stats: t('soldTotal', { n: MR.num(plates) }) + ' · ' + t('perfectN', { n: MR.num(st.perfect) }),
      cta: t('storyCta'), file: 'momo-rush-' + (W.dailyKey || 'week') + '.png',
      text: t('shareText', { mode, title: t('t_' + res.title), p: MR.money(Math.abs(res.profit)), pl: res.profit >= 0 ? t('profit').toLowerCase() : t('loss').toLowerCase(), stars }) + (url ? '\n' + url : ''),
    };
  }
  let prevToken = 0;
  function renderWeek() {
    const W = G.W; const res = W.result; if (!res) return;
    const st = W.stats;
    $('wkMode').textContent = W.daily ? t('daily', { n: MR.num(W.dailyN) }) : t('weekMode');
    $('wkH').textContent = t('t_' + res.title);
    $('wkBest').hidden = !res.newBest;
    $('wkPL').textContent = res.profit >= 0 ? t('profit') : t('loss');
    $('wkProfit').textContent = (res.profit >= 0 ? '+' : '−') + MR.rs() + ' ' + MR.money(Math.abs(res.profit));
    $('wkProfit').className = res.profit >= 0 ? 'up' : 'down';
    $('wkStars').textContent = starStr(res.stars);
    const plates = st.sold.buff + st.sold.chicken + st.sold.veg;
    const lines = [
      [res.rentOk ? 'good' : 'bad', t(res.rentOk ? 'rentPaid' : 'rentFail', { n: R.RENT })],
      ['', t('finalCash') + ': ' + (res.final < 0 ? '−' : '') + MR.rs() + ' ' + MR.money(Math.abs(res.final))],
      ['', t('soldTotal', { n: MR.num(plates) }) + ' · ' + t('perfectN', { n: MR.num(st.perfect) })],
      res.unpaid ? ['bad', t('unpaid', { n: res.unpaid })] : null,
    ].filter(Boolean);
    $('wkLines').innerHTML = lines.map(([c, s]) => `<li class="${c}">${s}</li>`).join('');
    const calls = W.reports.length ? weekCalls(W) : [];
    $('wkCallsBox').hidden = !calls.length;
    $('wkCalls').innerHTML = calls.map(([c, s]) => `<li class="${c}">${s}</li>`).join('');
    const box = $('storyPrev'); const tok = ++prevToken;
    MR.drawStory(storyData()).then((c) => {
      if (tok !== prevToken) return;
      box.innerHTML = ''; c.setAttribute('aria-hidden', 'true'); box.append(c);
    }).catch(() => {});
  }
  $('shareBtn').addEventListener('click', async () => { au.tap(); const msg = await MR.shareStory(storyData()); if (msg) toast(msg); });
  $('copyBtn').addEventListener('click', async () => {
    au.tap();
    try { await navigator.clipboard.writeText(storyData().text); toast(t('copied')); } catch (e) { toast(t('copyFail')); }
  });
  $('againBtn').addEventListener('click', () => startWeek(false));
  $('homeBtn').addEventListener('click', () => { au.tap(); renderHome(); show('home'); });

  // ---------- loop ----------
  // phone turned sideways: the portrait stall would be tiny, so the day waits behind a 'turn upright' note
  const sideMQ = window.matchMedia ? matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)') : null;
  const sideways = () => !!(sideMQ && sideMQ.matches);
  let last = performance.now();
  MR.manual = false;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!MR.manual) {
      if (G.screen === 'play') { if (!sideways()) simStep(dt); render(); hud(); }
      else { G.vt += dt; if (G.screen === 'home') drawHero(dt); }
    }
    requestAnimationFrame(frame);
  }

  // ---------- test hooks ----------
  MR.step = function (dt, n) {
    dt = dt || 1 / 60; n = n || 1;
    for (let i = 0; i < n; i++) { if (G.screen === 'play') simStep(dt); else G.vt += dt; }
    if (G.screen === 'play') { render(); hud(); } else if (G.screen === 'home') drawHero(dt);
    return MR.state();
  };
  MR.state = function () {
    const S = G.S; const W = G.W;
    return {
      screen: G.screen, paused: G.paused, card: G.cardSlot,
      week: W ? { day: W.day, cash: W.cash, tips: W.tips, rep: W.rep, done: W.done, upg: Object.keys(W.upg), result: W.result || null, seed: W.seed } : null,
      svc: S ? {
        t: +S.t.toFixed(2), len: S.len, over: S.over, tut: S.tut, take: S.take, tips: S.tips, rep: +S.rep.toFixed(2), sel: S.sel,
        stock: Object.assign({}, S.stock), board: Object.assign({}, S.board),
        tiers: S.tiers.map((x) => x && { fill: x.fill, t: +x.t.toFixed(2), q: R.cookQ(x.t, S.cook) }),
        pass: S.pass.map((p) => p && { fill: p.fill, q: p.q, achar: p.achar, jhol: p.jhol, kothey: p.kothey }),
        slots: S.slots.map((c) => c && { id: c.id, fill: c.fill, style: c.style, qty: c.qty, served: c.served || 0, pat: +(c.pat / c.patMax).toFixed(2), special: c.special ? { type: c.special.type, decided: c.special.decided, yes: c.special.yes } : null }),
        queue: S.queue.length, today: S.today, tawa: S.tawa ? +S.tawa.t.toFixed(2) : null,
      } : null,
    };
  };
  // client (css px) coordinates of things on the canvas, for driving real input
  MR.pos = function (kind, i) {
    const L = G.L; if (!L) return null;
    const r = cv.getBoundingClientRect();
    const at = (x, y) => ({ x: r.left + (x + L.ox) * L.s, y: r.top + y * L.s });
    switch (kind) {
      case 'bowl': return at(L.bowls[i].x, L.bowls[i].y);
      case 'board': return at(L.board.x, L.board.y);
      case 'tier': { const b = L.tiers[i]; return at(b.x + b.w / 2, b.y + b.h / 2); }
      case 'pass': return at(L.pass[i].x, L.pass[i].y);
      case 'achar': return at(L.achar.x, L.achar.y);
      case 'jhol': return at(L.jhol.x, L.jhol.y);
      case 'tawa': return at(L.tawa.x, L.tawa.y);
      case 'bin': return at(L.bin.x, L.bin.y);
      case 'cust': return at(L.slots[i].x, L.cTop - 60);
      default: return null;
    }
  };
  MR.start = (daily, opts) => startWeek(!!daily, opts);
  MR.open = (stock) => openStall(stock);
  MR.act = (name, ...args) => { const r = R[name](G.S, ...args); return r; };
  MR.endService = () => { if (G.S) { G.S.t = G.S.len; } };
  MR.finishDay = () => finishDay();
  MR.show = (name) => { if (name === 'home') renderHome(); show(name); };
  Object.defineProperty(MR, 'W', { get: () => G.W });
  Object.defineProperty(MR, 'S', { get: () => G.S });

  // ---------- boot ----------
  applyLang();
  renderHome();
  if (document.fonts && document.fonts.load) {
    Promise.all(['16px Anton', '16px "Yatra One"', '16px Pacifico', '800 16px Mukta'].map((f) => document.fonts.load(f, 'मःम पसल Aa1'))).then(() => { if (G.screen === 'play') resize(); }).catch(() => {});
  }
  requestAnimationFrame(frame);
})();
