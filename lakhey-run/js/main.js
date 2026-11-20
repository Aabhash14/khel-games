// Lakhey Run: screens, HUD, Yomari stall and the story image.
(function () {
  const LR = window.LR, G = LR.G, A = LR.audio, D = LR.D;
  const $ = (id) => document.getElementById(id);
  const YOMARI_PRICE = 300;
  const screens = ['menu', 'hud', 'pause', 'revive', 'over', 'how', 'shop', 'nogl'];
  function show(...ids) { screens.forEach((s) => $(s).classList.toggle('show', ids.includes(s))); }
  function tap(el, fn) { el.addEventListener('click', (e) => { e.stopPropagation(); A.init(); A.click(); fn(e); }); }

  function refreshMenu() {
    $('bank').textContent = LR.num(D.bank);
    $('yom').textContent = LR.num(D.yomari);
    $('best').textContent = LR.num(D.best);
    const today = G.today();
    $('dailyBest').textContent = D.daily.d === today && D.daily.best ? LR.num(D.daily.best) : '';
    $('lang').textContent = D.lang === 'ne' ? 'EN' : 'ने';
    $('snd').classList.toggle('off', D.muted);
    document.querySelectorAll('.pick').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.who === (D.who === 'f' ? 'f' : 'm'))));
  }
  function relang() { LR.applyLang(); refreshMenu(); }

  // ---------- boot ----------
  async function boot() {
    LR.applyLang();
    try { await Promise.race([Promise.all([document.fonts.load('64px "Yatra One"'), document.fonts.load('30px "Mukta"')]), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* fonts optional */ }
    const ok = G.init($('gl'));
    $('loading').classList.add('out');
    setTimeout(() => $('loading').classList.remove('show'), 600);
    if (!ok) { show('nogl'); return; }
    refreshMenu();
    show('menu');
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ---------- menu ----------
  function startRun(daily) {
    A.init();
    if (daily) G.prepare(true);
    show('hud');
    resetHud();
    G.start();
  }
  tap($('play'), () => startRun(false));
  tap($('daily'), () => startRun(true));
  G.on.startKey = () => startRun(false);
  tap($('lang'), () => { D.lang = D.lang === 'ne' ? 'en' : 'ne'; LR.save(); relang(); });
  tap($('snd'), () => { D.muted = !D.muted; LR.save(); A.setMuted(D.muted); refreshMenu(); });
  document.querySelectorAll('.pick').forEach((b) => tap(b, () => {
    if (D.who === b.dataset.who) return;
    D.who = b.dataset.who; LR.save(); G.setRunner(D.who); refreshMenu();
  }));
  tap($('howBtn'), () => show('menu', 'how'));
  tap($('shopBtn'), () => { openShop(); });
  document.querySelectorAll('.close').forEach((b) => tap(b, () => { show('menu'); refreshMenu(); }));
  // first touch on the menu starts the menu music on first touch
  let menuMusic = false;
  window.addEventListener('pointerdown', () => { if (!menuMusic && G.state() === 'menu') { menuMusic = true; A.init(); A.music(true, true); } }, { once: false });

  function openShop() {
    $('shopYom').textContent = LR.num(D.yomari); $('shopBank').textContent = LR.num(D.bank);
    $('buyBtn').innerHTML = '';
    $('buyBtn').append(document.createTextNode(LR.t('buy') + ' ' + LR.num(1) + ' '), Object.assign(document.createElement('i'), { className: 'ico yom' }), document.createTextNode(' · ' + LR.num(YOMARI_PRICE) + ' '), Object.assign(document.createElement('i'), { className: 'ico coin' }));
    $('buyWarn').hidden = true;
    show('menu', 'shop');
  }
  tap($('buyBtn'), () => {
    if (D.bank < YOMARI_PRICE) { $('buyWarn').hidden = false; return; }
    D.bank -= YOMARI_PRICE; D.yomari++; LR.save(); A.yomari(); openShop(); refreshMenu();
  });

  // ---------- HUD ----------
  let hudCache = {}, hintTimer = 0, toastTimer = 0;
  function resetHud() { hudCache = {}; $('pw').innerHTML = ''; $('hint').classList.remove('on'); $('toast').classList.remove('on'); }
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  const PW = [['naach', 'naachp', 6.5], ['magnet', 'dhime', 9], ['mult', 'bhusya', 10], ['shield', 'chamar', 25]];
  let hudT = 0;
  G.on.hud = function (p) {
    const now = performance.now();
    if (now - hudT < 90) return;
    hudT = now;
    setText('score', LR.num(p.score));
    setText('dist', LR.num(p.dist) + ' ' + LR.t('m'));
    setText('hc', LR.num(p.coins));
    const f = p.meter / 45;
    const key = Math.round(f * 100);
    if (hudCache.meter !== key) {
      hudCache.meter = key;
      $('naachRing').style.strokeDashoffset = String(276.5 * (1 - f));
      $('naach').classList.toggle('ready', f >= 1 && p.naach <= 0);
    }
    const danger = p.chase > 0.3 && p.alive;
    if (hudCache.danger !== danger) { hudCache.danger = danger; $('hud').classList.toggle('danger', danger); }
    // power-up pills
    const act = PW.filter(([k]) => p[k] > 0).map(([k, c, max]) => [c, p[k] / max]);
    const sig = act.map((a) => a[0]).join(',');
    if (hudCache.pw !== sig) {
      hudCache.pw = sig;
      $('pw').innerHTML = act.map(([c]) => '<span class="p ' + c + '"><i></i><span class="bar"></span></span>').join('');
    }
    const bars = $('pw').querySelectorAll('.bar');
    act.forEach((a, i) => { if (bars[i]) bars[i].style.width = Math.round(a[1] * 100) + '%'; });
  };
  G.on.hint = function (k) {
    $('hint').textContent = LR.t(k); $('hint').classList.add('on');
    clearTimeout(hintTimer); hintTimer = setTimeout(() => $('hint').classList.remove('on'), 1700);
  };
  G.on.toast = function (k) {
    $('toast').textContent = LR.t(k); $('toast').classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('on'), 1300);
  };
  $('naach').addEventListener('pointerdown', (e) => { e.stopPropagation(); G.naach(); });
  tap($('pauseBtn'), () => { G.pause(true); show('hud', 'pause'); });
  G.on.pauseKey = () => { if (G.state() === 'run') { G.pause(true); show('hud', 'pause'); } else if (G.state() === 'paused') { show('hud'); G.pause(false); } };
  tap($('resume'), () => { show('hud'); G.pause(false); });
  tap($('quit'), () => { G.pause(false); G.finish(); goHome(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state() === 'run') { G.pause(true); show('hud', 'pause'); } });

  // ---------- death, revive, results ----------
  let revTimer = 0, revStart = 0;
  G.on.death = function (reason) {
    $('deathMsg').textContent = LR.t(reason === 'caught' ? 'caught' : reason === 'walled' ? 'walled' : 'crashed');
    if (G.canRevive()) {
      $('revBtn').innerHTML = '';
      $('revBtn').append(document.createTextNode(LR.t('reviveBtn', { n: LR.num(G.reviveCost()) }) + ' '), Object.assign(document.createElement('i'), { className: 'ico yom' }));
      show('hud', 'revive');
      revStart = performance.now();
      cancelAnimationFrame(revTimer);
      const tick = () => {
        const t = (performance.now() - revStart) / 4500;
        $('revRing').style.strokeDashoffset = String(289 * Math.min(1, t));
        if (t >= 1) { results(); return; }
        revTimer = requestAnimationFrame(tick);
      };
      tick();
    } else results();
  };
  tap($('revBtn'), () => { cancelAnimationFrame(revTimer); G.revive(); show('hud'); });
  tap($('revNo'), () => { cancelAnimationFrame(revTimer); results(); });

  let lastStats = null;
  function results() {
    cancelAnimationFrame(revTimer);
    const st = (lastStats = G.finish());
    $('overWhy').textContent = LR.t(st.reason === 'caught' ? 'caught' : st.reason === 'walled' ? 'walled' : 'crashed');
    $('oScore').textContent = LR.num(st.score);
    $('oDist').textContent = LR.num(st.dist) + ' ' + LR.t('m');
    $('oCoins').textContent = LR.num(st.coins);
    $('oBest').textContent = LR.num(st.daily ? D.daily.best : D.best);
    $('newBest').hidden = !st.best;
    show('over');
  }
  tap($('again'), () => { const daily = G.isDaily(); G.prepare(daily); show('hud'); resetHud(); G.start(); });
  tap($('homeBtn'), goHome);
  function goHome() { G.prepare(false); refreshMenu(); show('menu'); A.music(true, true); }
  tap($('shareBtn'), () => share(lastStats));

  // ---------- story image (1080 x 1920) ----------
  async function share(st) {
    if (!st) return;
    const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a1a0c'); bg.addColorStop(1, '#1a0b05');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // brick strip texture
    for (let y = 0; y < H; y += 18) for (let x = (y / 18) % 2 ? -30 : 0; x < W; x += 60) { g.fillStyle = 'rgba(160,60,35,' + (0.08 + Math.random() * 0.06) + ')'; g.fillRect(x + 2, y + 2, 56, 14); }
    // 3D shot inside a carved window frame
    const fx = 90, fy = 150, fw = 900, fh = 1060;
    const shot = G.snapshot(fw, fh);
    g.fillStyle = '#1d0f07'; g.fillRect(fx - 40, fy - 40, fw + 80, fh + 80);
    g.fillStyle = '#5e3418'; g.fillRect(fx - 26, fy - 26, fw + 52, fh + 52);
    g.fillStyle = '#8a5a2c'; for (let i = fx - 20; i < fx + fw + 20; i += 16) { g.fillRect(i, fy - 20, 8, 8); g.fillRect(i, fy + fh + 12, 8, 8); }
    for (let j = fy - 20; j < fy + fh + 20; j += 16) { g.fillRect(fx - 20, j, 8, 8); g.fillRect(fx + fw + 12, j, 8, 8); }
    g.fillStyle = '#3a1d0d'; g.fillRect(fx - 80, fy - 70, fw + 160, 30); g.fillRect(fx - 80, fy + fh + 40, fw + 160, 30);
    g.drawImage(shot, fx, fy);
    // marigold string across the top
    for (let i = 0; i <= 40; i++) { const x = 40 + i * 25; const y = 100 + Math.sin(i / 40 * Math.PI) * 30; g.fillStyle = i % 2 ? '#ff8a00' : '#ffb300'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
    // title
    g.textAlign = 'center';
    g.font = '110px "Yatra One", serif'; g.lineWidth = 14; g.strokeStyle = '#5a1406'; g.fillStyle = '#ffd76a';
    g.strokeText('Lakhey Run', W / 2, 1360); g.fillText('Lakhey Run', W / 2, 1360);
    g.font = '58px "Yatra One", serif'; g.fillStyle = '#fff3e0'; g.fillText('लाखे दौड', W / 2, 1440);
    // score
    g.font = '170px "Yatra One", serif'; g.lineWidth = 16; g.strokeStyle = '#7a0b07'; g.fillStyle = '#ffd76a';
    const sc = LR.num(st.score); g.strokeText(sc, W / 2, 1620); g.fillText(sc, W / 2, 1620);
    g.font = '800 40px "Mukta", sans-serif'; g.fillStyle = '#f3dcc0';
    g.fillText(LR.num(st.dist) + ' ' + LR.t('m') + '   ·   ' + LR.num(st.coins) + ' ' + LR.t('coins'), W / 2, 1690);
    g.font = '500 38px "Mukta", sans-serif'; g.fillStyle = '#fff3e0';
    wrap(g, LR.t('shareLine', { d: LR.num(st.dist) }), W / 2, 1760, 900, 48);
    if (st.daily) { g.font = '800 32px "Mukta", sans-serif'; g.fillStyle = '#ffb21f'; g.fillText(LR.t('dailyTag') + ' · ' + G.today(), W / 2, 1870); }
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'lakhey-run.png', { type: 'image/png' });
    const text = LR.t('shareLine', { d: LR.num(st.dist) });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lakhey-run.png'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    const sb = $('shareBtn'); sb.textContent = LR.t('saved'); setTimeout(() => { sb.textContent = LR.t('share'); }, 1800);
  }
  function wrap(g, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', yy = y;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
    g.fillText(line, x, yy);
  }

  boot();
})();
