// Tihar Diyo: screens, progress, scoring, hints, results and the daily puzzle.
// Test hooks live on window.TD (no visible debug UI).
(function (root) {
  'use strict';
  var R = root.TDR, LV = root.TDL, A = root.TDA, I = root.TDI, S = root.TDS, SH = root.TDShare;
  var $ = function (id) { return document.getElementById(id); };
  var STORE = 'tihar-diyo-v1';
  var reduced = root.TDStage.reduced;
  var HERO_DEMO = 2;

  // ---------- saved progress ----------
  function load() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { d = {}; }
    return {
      stars: d.stars || {}, best: d.best || {}, hinted: d.hinted || {},
      coins: typeof d.coins === 'number' ? d.coins : 3,
      daily: d.daily || {}, dailyTries: d.dailyTries || {}, lastDaily: d.lastDaily || '', streak: d.streak || 0,
      muted: !!d.muted
    };
  }
  var P = load();
  function save() {
    try {
      var cur = JSON.parse(localStorage.getItem(STORE) || '{}') || {};
      P.muted = cur.muted != null ? cur.muted : P.muted; // audio.js owns the mute flag
      localStorage.setItem(STORE, JSON.stringify(P));
    } catch (e) { /* storage blocked: progress lives for this visit only */ }
  }
  function isFresh() { return totalStars() === 0 && !Object.keys(P.daily).length; }
  function totalStars() { var s = 0; for (var k in P.stars) s += P.stars[k] || 0; return s; }
  function nightStars(n) { var s = 0; for (var k = 0; k < 6; k++) s += P.stars[n * 6 + k + 1] || 0; return s; }
  function nightOpen(n) { return totalStars() >= LV.NIGHTS[n].need; }
  function levelOpen(L) { if (!nightOpen(L.night)) return false; var k = (L.id - 1) % 6; return k === 0 || !!P.stars[L.id - 1]; }
  function nightName(n) { return I.t('n_' + LV.NIGHTS[n].id); }
  function nightShort(n) { var k = 'n_' + LV.NIGHTS[n].id + '_short'; return I.S.en[k] ? I.t(k) : nightName(n); }

  // ---------- state ----------
  var st = { screen: 'home', mode: 'level', L: null, board: null, start: null, moves: 0, hints: 0, tries: 1, won: false, tapsAt: null, armed: false, busy: false, result: null, lastMsg: 0, prevOn: null };
  var stage, hero, daily = null;

  var kbdUser = false;
  document.addEventListener('keydown', function (e) { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') kbdUser = true; }, true);
  document.addEventListener('pointerdown', function () { kbdUser = false; }, true);
  function buzz(p) {
    try {
      var ua = navigator.userActivation;
      if (reduced || !navigator.vibrate || (ua && !ua.hasBeenActive)) return;
      navigator.vibrate(p);
    } catch (e) { /* not supported */ }
  }

  // ---------- screens ----------
  function show(name) {
    st.screen = name;
    if (name !== 'play') closeSheet();
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-screen') === name); });
    document.body.setAttribute('data-screen', name);
    S.setScene(name === 'play' ? 'play' : 'menu');
    if (name === 'home') renderHome();
    if (name === 'nights') renderNights();
    if (name === 'play') requestAnimationFrame(function () { stage.dirty = true; stage.resize(); });
    if (name === 'home') requestAnimationFrame(function () { hero.dirty = true; hero.resize(); });
    window.scrollTo(0, 0);
  }

  function renderHome() {
    var key = R.dateKey();
    var dn = R.dayNumber(key), done = P.daily[key];
    $('dailySub').textContent = done ? I.t('dailyDone', { n: dn, m: done.moves, p: done.par }) : I.t('dailySub', { n: dn });
    // a brand-new player starts on the first house, not on a full-size daily
    var fresh = isFresh();
    $('goNights').querySelector('.bb-main').textContent = fresh ? I.t('start') : I.t('nights');
    $('nightsSub').textContent = fresh ? I.t('startSub') : I.t('nightsSub', { s: totalStars(), t: LV.LEVELS.length * 3 });
    $('goNights').classList.toggle('hot', fresh); $('goDaily').classList.toggle('hot', !fresh);
    document.querySelector('.menu').classList.toggle('fresh', fresh);
    $('coinHome').textContent = I.t('coinsHave', { n: P.coins });
  }

  function lamps(n, size) {
    var h = '';
    for (var k = 0; k < 3; k++) h += '<svg class="lamp' + (k < n ? ' lit' : '') + '" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path class="fl" d="M15.5 3c-2.2 2.4-2.8 4.4-1.4 6.4 1.6-.6 2.6-2.7 1.4-6.4z"/><path class="bowl" d="M3 12h15.5l3-2.5-1 3.5c-1 4-4.5 6.5-8.5 6.5S4.6 16.8 3 12z"/></svg>';
    return h;
  }

  function renderNights() {
    var box = $('nightList'); box.innerHTML = '';
    LV.NIGHTS.forEach(function (N, n) {
      var open = nightOpen(n);
      var li = document.createElement('li');
      li.className = 'night n-' + N.id + (open ? '' : ' shut');
      var head = '<div class="night-head"><span class="night-no">' + I.t('night', { n: n + 1 }) + '</span>' +
        '<h3>' + nightName(n) + '</h3><p class="night-sub">' + I.t('n_' + N.id + '_sub') + '</p>' +
        '<span class="night-stars">' + (open ? I.num(nightStars(n)) + '/' + I.num(18) + ' <i class="star-i" aria-hidden="true"></i>' : '<i class="lock-i" aria-hidden="true"></i>' + I.t('needStars', { n: N.need })) + '</span></div>';
      var row = '<ol class="lv-row">';
      for (var k = 0; k < 6; k++) {
        var L = LV.LEVELS[n * 6 + k], ok = levelOpen(L), s = P.stars[L.id] || 0;
        var lbl = I.t('levelN', { n: L.id }) + ', ' + (ok ? (s ? I.t('starsOf', { n: s }) : I.t('notPlayed')) : I.t('locked'));
        row += '<li><button type="button" class="lv' + (s ? ' done' : '') + '" data-level="' + L.id + '"' + (ok ? '' : ' disabled') + ' aria-label="' + lbl + '">' +
          '<b>' + I.num(k + 1) + '</b><span class="lv-lamps">' + lamps(s, 12) + '</span></button></li>';
      }
      row += '</ol>';
      li.innerHTML = head + row;
      box.appendChild(li);
    });
  }

  // ---------- playing ----------
  function startLevel(L, mode) {
    st.mode = mode; st.L = L;
    st.board = R.parse(L); st.start = R.parse(L);
    st.moves = 0; st.won = false; st.armed = false; st.busy = false; st.result = null; st.stake = null;
    st.tapsAt = new Int16Array(L.w * L.h);
    st.hints = 0;
    if (mode === 'daily') {
      P.dailyTries[L.key] = (P.dailyTries[L.key] || 0) + 1; st.tries = P.dailyTries[L.key];
      for (var k in P.dailyTries) if (k !== L.key) delete P.dailyTries[k];
      save();
    } else st.tries = 1;
    show('play');
    var palKey = mode === 'daily' ? A.NIGHT_IDS[(L.n - 1) % 5] : A.NIGHT_IDS[L.night];
    document.body.setAttribute('data-night', palKey);
    stage.setBoard(st.board, palKey, mode === 'daily' ? L.n : L.id * 13);
    var f = R.flow(st.board);
    st.prevOn = f.on;
    stage.sync(f);
    $('playLabel').textContent = label();
    updateHud(f);
    closeSheet();
    var intro = mode === 'daily' ? function () { return I.t('tw_' + L.twist, { n: L.wind || 3 }); }
      : L.intro ? function () { return I.t('i_' + L.intro, { n: L.wind || 3 }); }
      : mode === 'level' && (L.id - 1) % 6 === 0 ? function () { return nightName(L.night) + '. ' + I.t('n_' + LV.NIGHTS[L.night].id + '_sub'); } : null;
    say(intro || litMsg(f), intro ? 6000 : 0);
    if (kbdUser) setTimeout(function () { try { $('cv').focus({ preventScroll: true }); } catch (e) { /* fine */ } }, 50);
  }
  function label() {
    if (st.mode === 'daily') return I.t('dailyLabel', { n: st.L.n });
    return nightShort(st.L.night) + ' · ' + I.num((st.L.id - 1) % 6 + 1) + '/' + I.num(6);
  }
  function updateHud(f) {
    $('movesN').textContent = I.num(st.moves);
    $('parN').textContent = I.num(st.L.par);
    $('coinN').textContent = I.num(P.coins);
    $('movesBox').classList.toggle('over', st.moves > st.L.par);
    // the stars still on the table: a lamp goes out the moment a move costs one
    var want = R.stars(st.moves, st.L.par, st.hints > 0);
    if (want !== st.stake) {
      var drop = st.stake != null && want < st.stake && !st.won;
      $('stake').innerHTML = lamps(want, 13) + (drop ? '<i class="puff" aria-hidden="true"></i>' : '');
      $('stake').className = 'stake s' + want + (drop ? ' drop' : '');
      if (drop && st.moves > 0 && !st.hints) { S.dark(); buzz([8, 40, 8]); say(tk(want === 2 ? 's_past2' : 's_past1'), 3500); }
      st.stake = want;
    }
    $('movesBox').setAttribute('aria-label', I.t('moves') + ' ' + I.num(st.moves) + ', ' + I.t('starsOf', { n: want }));
    $('hintBtn').classList.toggle('armed', st.armed);
    $('hintTxt').textContent = st.armed ? I.t('hintSure') : I.t('hint');
    $('hintBtn').setAttribute('aria-label', (st.armed ? I.t('hintSure') : I.t('hint')) + ', ' + I.t('coinsHave', { n: P.coins }));
  }
  var sayTimer = null;
  function litMsg(f) { var a = f.lit, b = f.diyos, fn = function () { return I.t('s_lit', { a: a, b: b }); }; fn.lit = true; return fn; }
  function tk(key, vars) { return function () { return I.t(key, vars); }; }
  // msg is a function so the line can be said again in the other language
  function say(msg, hold) {
    st.msg = msg;
    $('sub').textContent = msg();
    $('sub').classList.remove('pop'); void $('sub').offsetWidth; $('sub').classList.add('pop');
    st.lastMsg = Date.now() + (hold || 0);
  }

  function onTap(i, dir) {
    S.init();
    if (st.won || st.busy || !st.board) return;
    var c = st.board.cells[i];
    if (!c || c.empty) return;
    disarm();
    if (c.lock) { stage.blocked(i); S.thunk(); buzz(18); say(tk('s_nailed'), 1800); return; }
    if (c.wind) { stage.blocked(i); S.thunk(); buzz(18); var wl = R.tapsToWind(st.board); say(tk(wl === 1 ? 's_wind1' : 's_wind', { n: wl }), 1800); return; }
    doTap(i, dir);
  }
  function doTap(i, dir) {
    var res = R.tap(st.board, i, dir);
    if (!res) return;
    st.moves++; st.tapsAt[i]++;
    stage.turned(i, dir);
    S.click(dir); buzz(6);
    var msg = null;
    if (res.wind.length) {
      res.wind.forEach(function (j) { stage.turned(j, 1); stage.spark(j, 'wind'); });
      S.wind(); buzz([10, 30, 10]);
      msg = tk('s_windTurned');
    }
    var f = R.flow(st.board);
    var fresh = 0;
    for (var k = 0; k < f.on.length; k++) if (f.on[k] && !st.prevOn[k] && k !== i) fresh++;
    if (fresh) S.glint(fresh);
    st.prevOn = f.on;
    stage.sync(f);
    updateHud(f);
    if (f.won) { win(); return; }
    if (f.lit === f.diyos && f.leaks.length) { msg = tk('s_leaking'); S.drip(); }
    if (msg) say(msg, 1800);
    else if (Date.now() > st.lastMsg) say(litMsg(f));
  }

  function disarm() { if (st.armed) { st.armed = false; updateHud(); } }
  var armTimer = null;
  function useHint() {
    S.init();
    if (st.won || st.busy || !st.board) return;
    var h = R.hint(st.board);
    if (!h) return;
    if (h.wait) { say(tk('hintWait'), 3500); return; }
    if (P.coins <= 0) { say(tk('noCoins'), 3000); S.thunk(); return; }
    if (!st.armed) {
      st.armed = true; updateHud(); S.ui();
      clearTimeout(armTimer); armTimer = setTimeout(disarm, 4000);
      return;
    }
    st.armed = false; clearTimeout(armTimer);
    P.coins--; st.hints++; save();
    updateHud();
    S.hint();
    stage.hintMark(h.i);
    say(tk('hintUsed'), 2500);
    st.busy = true;
    var left = h.n;
    (function step() {
      if (left-- <= 0 || st.won) { st.busy = false; return; }
      doTap(h.i, h.dir);
      setTimeout(step, 260);
    })();
  }

  function restart() {
    if (!st.L || st.busy) return;
    S.init(); S.ui();
    if (st.won) startLevel(st.L, st.mode);
    else if (st.moves > 0) {
      var hints = st.hints; // a mid-level restart keeps the hint cap
      startLevel(st.L, st.mode);
      st.hints = hints; st.stake = null; updateHud();
    }
  }

  // ---------- winning ----------
  function moveMap() {
    var m = '', b = st.start;
    for (var i = 0; i < b.cells.length; i++) {
      var c = b.cells[i];
      if (c.empty) m += ' ';
      else if (!R.tappable(c)) m += 'f';
      else m += st.tapsAt[i] <= R.cost(c.m, c.sol) ? 'p' : 'o';
    }
    return m;
  }
  function win() {
    st.won = true;
    var L = st.L, stars = R.stars(st.moves, L.par, st.hints > 0);
    var before = totalStars(), earned = false, nightMsg = '';
    if (st.mode === 'level') {
      var prev = P.stars[L.id] || 0;
      if (stars === 3 && prev < 3) { P.coins++; earned = true; }
      P.stars[L.id] = Math.max(prev, stars);
      P.best[L.id] = Math.min(P.best[L.id] || 999, st.moves);
      var after = totalStars();
      for (var n = 1; n < LV.NIGHTS.length; n++) if (before < LV.NIGHTS[n].need && after >= LV.NIGHTS[n].need) nightMsg = I.t('nightOpen', { night: nightName(n) });
    } else {
      var key = L.key;
      if (!P.daily[key]) {
        var kp = key.split('-'), y = new Date(+kp[0], +kp[1] - 1, +kp[2] - 1);
        P.streak = P.lastDaily === R.dateKey(y) ? P.streak + 1 : 1;
        P.lastDaily = key;
        P.daily[key] = { moves: st.moves, par: L.par, stars: stars, tries: st.tries, hints: st.hints };
        var keys = Object.keys(P.daily).sort();
        while (keys.length > 60) delete P.daily[keys.shift()];
      }
    }
    save();
    var nd = 0; st.board.cells.forEach(function (c) { if (c.diyo) nd++; });
    st.result = {
      daily: st.mode === 'daily', n: L.n, levelLabel: st.mode === 'daily' ? '' : I.t('levelN', { n: L.id }), night: st.mode === 'daily' ? '' : nightShort(L.night),
      moves: st.moves, par: L.par, stars: stars, hints: st.hints, tries: st.tries, streak: st.mode === 'daily' ? P.streak : 0,
      w: L.w, h: L.h, map: moveMap(), palKey: st.mode === 'daily' ? A.NIGHT_IDS[(L.n - 1) % 5] : A.NIGHT_IDS[L.night], diyos: nd,
      earned: earned, nightMsg: nightMsg
    };
    say(tk('s_lit', { a: nd, b: nd }));
    stage.waitForWin(function () {
      S.win(); buzz([30, 60, 30, 60, 120]);
      S.setIntensity(1);
      setTimeout(showResult, reduced ? 700 : 2500);
    });
  }

  // quiet: re-render in place (language switch) without replaying the lamps or moving focus
  function showResult(quiet) {
    var r = st.result; if (!r) return;
    var L = st.L, sh = $('sheet');
    var titles = ['win1', 'win2', 'win3', 'win4'];
    var title = I.t(titles[(r.moves + (r.daily ? r.n : L.id)) % titles.length]);
    var d = r.moves - r.par, note = d <= 0 ? I.t('atPar') : I.t('overPar', { d: d }) + (r.stars < 3 && !r.hints ? ' ' + I.t('try3') : '');
    if (r.hints) note = I.t('hinted');
    var extra = '';
    if (r.earned) extra += '<p class="res-earn"><i class="foot-i" aria-hidden="true"></i>' + I.t('earned') + '</p>';
    var nightLine = '';
    var btns = '';
    if (r.daily) {
      var bits = [r.tries <= 1 ? I.t('firstTry') : I.t('tries', { n: r.tries })];
      if (r.streak > 1) bits.push(I.t('streak', { n: r.streak }));
      nightLine = bits.join(' · ') + '. ' + I.t('tomorrow');
      btns = '<button type="button" class="btn main" id="rShare">' + I.t('share') + '</button>' +
        '<button type="button" class="btn" id="rCopy">' + I.t('copy') + '</button>' +
        '<button type="button" class="btn ghost" id="rHome">' + I.t('home') + '</button>';
    } else {
      var next = LV.LEVELS[L.id];
      if (r.nightMsg) nightLine = r.nightMsg;
      else if (L.id % 6 === 0) nightLine = L.id === 30 ? I.t('allDone') : I.t('nightDone', { night: nightName(L.night) });
      if (next && !levelOpen(next)) {
        var need = LV.NIGHTS[next.night].need - totalStars();
        nightLine = (nightLine ? nightLine + ' ' : '') + I.t('needMore', { n: need, night: nightName(next.night) });
      }
      var primary = next && levelOpen(next)
        ? '<button type="button" class="btn main" id="rNext">' + (next.night !== L.night ? I.t('nextNight') : I.t('next')) + '</button>'
        : '<button type="button" class="btn main" id="rNights">' + I.t('toNights') + '</button>';
      btns = primary + '<button type="button" class="btn" id="rAgain">' + I.t('again') + '</button>' +
        '<button type="button" class="btn ghost" id="rShare">' + I.t('share') + '</button>';
    }
    sh.innerHTML = '<p class="res-kick">' + label() + '</p><h2 id="sheetH">' + title + '</h2>' +
      '<div class="res-lamps">' + lamps(r.stars, 46) + '</div>' +
      '<p class="res-moves">' + I.t('resMoves', { m: r.moves, p: r.par }) + '</p>' +
      '<p class="res-note">' + note + '</p>' + extra +
      (nightLine ? '<p class="res-night">' + nightLine + '</p>' : '') +
      '<div class="res-btns">' + btns + '</div>';
    $('sheetWrap').hidden = false;
    if (!quiet) peek(false);
    requestAnimationFrame(function () { $('sheetWrap').classList.add('on'); });
    sh.querySelectorAll('.res-lamps .lamp').forEach(function (el, k) {
      if (quiet) { el.style.animation = 'none'; return; }
      el.style.animationDelay = (0.15 + k * 0.28) + 's';
      if (k < r.stars) setTimeout(function () { S.star(k); }, 150 + k * 280);
    });
    var on = function (id, fn) { var el = $(id); if (el) el.addEventListener('click', function () { S.ui(); fn(); }); };
    on('rNext', function () { startLevel(LV.LEVELS[L.id], 'level'); });
    on('rNights', function () { closeSheet(); show('nights'); });
    on('rAgain', function () { startLevel(L, st.mode); });
    on('rHome', function () { closeSheet(); show('home'); });
    on('rShare', function () { doShare(); });
    on('rCopy', function () { SH.copyText(SH.text(r)).then(function (ok) { toast(ok === false ? SH.text(r) : I.t('copied')); }); });
    var first = sh.querySelector('.btn'); if (first && !quiet) first.focus({ preventScroll: true });
  }
  function doShare() {
    var r = st.result; if (!r) return;
    var btn = $('rShare'); if (btn) btn.disabled = true;
    SH.share(r).then(function (how) {
      if (how === 'saved') toast(I.t('saved'));
    }).catch(function () { toast(I.t('saved')); }).then(function () { if (btn) btn.disabled = false; });
  }
  function closeSheet() {
    var w = $('sheetWrap');
    w.classList.remove('on', 'peek'); w.hidden = true;
  }
  // tap outside the result to lower it and look at the lit house; tap the tab to bring it back
  function peek(on) {
    var w = $('sheetWrap');
    w.classList.toggle('peek', on);
    $('sheet').setAttribute('aria-modal', String(!on));
    if (!on) return;
    try { $('sheet').focus({ preventScroll: true }); } catch (e) { /* fine */ }
  }
  var toastTimer = null;
  function toast(msg) {
    var el = $('toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2200);
  }

  // ---------- daily ----------
  function getDaily() {
    var key = R.dateKey();
    if (!daily || daily.key !== key) daily = R.daily(key);
    return daily;
  }
  function openDaily() {
    var L = getDaily(); if (!L) return;
    startLevel(L, 'daily');
  }

  // ---------- wiring ----------
  function applyLang() {
    I.apply();
    document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === I.getLang())); });
    $('cv').setAttribute('aria-label', I.t('canvasLabel'));
    $('hero').setAttribute('aria-label', I.t('heroLabel'));
    if (st.screen === 'home') renderHome();
    if (st.screen === 'nights') renderNights();
    if (st.screen === 'play' && st.L) {
      $('playLabel').textContent = label(); updateHud();
      if (st.msg) $('sub').textContent = st.msg();
      if (st.result && !st.result.daily) { st.result.night = nightShort(st.L.night); st.result.levelLabel = I.t('levelN', { n: st.L.id }); }
      if (st.won && !$('sheetWrap').hidden) showResult(true);
    }
  }
  function syncMute() {
    var m = S.isMuted();
    $('mute').setAttribute('aria-pressed', String(m));
    $('mute').classList.toggle('muted', m);
  }

  function boot() {
    stage = new root.TDStage($('cv'), {
      interactive: true, onTap: onTap,
      onLight: function (i, n) { S.light(n); buzz(12); var f = stage.flow; if (f) S.setIntensity(stage.countLit() / Math.max(1, f.diyos)); },
      onDark: function () { S.dark(); var f = stage.flow; if (f) S.setIntensity(stage.countLit() / Math.max(1, f.diyos)); },
      onHold: function () { buzz(14); },
      onFocus: function (i) { if (st.board) $('srLive').textContent = I.t('s_cell', { r: Math.floor(i / st.board.w) + 1, c: i % st.board.w + 1 }); }
    });
    hero = new root.TDStage($('hero'), { interactive: false, maxTile: 46 });
    var demo = R.parse(LV.LEVELS[HERO_DEMO]);
    demo.cells.forEach(function (c) { c.m = c.sol; });
    hero.setBoard(demo, 'laxmi', 5);
    hero.sync(R.flow(demo)); hero.fillAll();

    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.addEventListener('click', function () { I.setLang(b.getAttribute('data-set-lang')); applyLang(); });
    });
    $('mute').addEventListener('click', function () { S.init(); S.setMuted(!S.isMuted()); syncMute(); });
    $('goDaily').addEventListener('click', function () { S.init(); S.ui(); var key = R.dateKey(); if (P.daily[key] && st.result && st.result.daily && st.L && st.L.key === key) { show('play'); showResult(); return; } openDaily(); });
    $('goNights').addEventListener('click', function () { S.init(); S.ui(); if (isFresh()) startLevel(LV.LEVELS[0], 'level'); else show('nights'); });
    $('nightsBack').addEventListener('click', function () { S.ui(); show('home'); });
    $('playBack').addEventListener('click', function () { S.ui(); closeSheet(); show(st.mode === 'daily' ? 'home' : 'nights'); });
    $('nightList').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-level]'); if (!b || b.disabled) return;
      S.init(); S.ui(); startLevel(LV.LEVELS[+b.getAttribute('data-level') - 1], 'level');
    });
    $('hintBtn').addEventListener('click', useHint);
    $('restartBtn').addEventListener('click', restart);
    $('sheetWrap').addEventListener('keydown', function (e) {
      if (e.key === 'Escape') peek(true);
      else if ((e.key === 'Enter' || e.key === ' ') && $('sheetWrap').classList.contains('peek')) { e.preventDefault(); peek(false); }
    });
    $('sheetWrap').addEventListener('click', function (e) {
      var w = $('sheetWrap');
      if (e.target === w) { S.ui(); peek(true); return; }
      if (w.classList.contains('peek')) { e.preventDefault(); e.stopPropagation(); S.ui(); peek(false); }
    }, true);
    document.addEventListener('keydown', function (e) {
      if (st.screen !== 'play' || e.target.closest('.sheet')) return;
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) restart();
      if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey) useHint();
    });
    var unlock = function () { S.init(); S.setScene(st.screen === 'play' ? 'play' : 'menu'); };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('resize', function () { stage.dirty = true; hero.dirty = true; if (st.screen === 'play') stage.resize(); if (st.screen === 'home') hero.resize(); });
    syncMute();
    applyLang();
    show('home');
    document.body.classList.add('ready');
    loop();
  }

  // ---------- frame loop (manual mode for tests) ----------
  var lastT = 0, manual = false;
  function frame(dt) {
    if (st.screen === 'play') { stage.tick(dt); stage.draw(); }
    else if (st.screen === 'home') { hero.tick(dt); hero.draw(); }
  }
  function loop(ts) {
    if (!manual && !document.hidden) {
      var dt = lastT ? (ts - lastT) / 1000 : 0.016;
      if (ts) lastT = ts;
      frame(dt);
    }
    requestAnimationFrame(loop);
  }

  root.TD = {
    state: function () {
      var f = st.board ? R.flow(st.board) : null;
      return { screen: st.screen, mode: st.mode, level: st.L ? (st.L.id || st.L.key) : null, moves: st.moves, par: st.L ? st.L.par : null,
        won: st.won, lit: f ? f.lit : 0, diyos: f ? f.diyos : 0, leaks: f ? f.leaks.length : 0, coins: P.coins, hints: st.hints,
        stars: totalStars(), taps: st.board ? st.board.taps : 0, sheet: !$('sheetWrap').hidden, peek: $('sheetWrap').classList.contains('peek'), litOnScreen: stage ? stage.countLit() : 0,
        lang: I.getLang(), muted: S.isMuted(), result: st.result };
    },
    start: function (id) { if (id === 'daily') openDaily(); else startLevel(LV.LEVELS[id - 1], 'level'); },
    go: show,
    tap: function (i, dir) { onTap(i, dir || 1); },
    hint: useHint,
    restart: restart,
    // play the cheapest move list (pairs of wasted moves first on wind levels)
    solve: function () {
      var b = st.board, p = R.par(b), moves = [], flexI = -1;
      b.cells.forEach(function (c, i) {
        if (!R.tappable(c)) return;
        var per = R.period(c.m); if (per === 1) flexI = i;
        var k = R.turnsTo(c.m, c.sol) % per, dir = k <= per - k ? 1 : -1, n = Math.min(k, per - k);
        for (var t = 0; t < n; t++) moves.push([i, dir]);
      });
      var extra = p - moves.length, any = -1;
      b.cells.forEach(function (c, i) { if (any < 0 && R.tappable(c) && R.period(c.m) > 1) any = i; });
      if (extra % 2) { moves.push([flexI, 1]); extra--; }
      var pad = []; for (var e = 0; e < extra; e += 2) pad.push([any, 1], [any, -1]);
      pad.concat(moves).forEach(function (m) { if (!st.won) onTap(m[0], m[1]); });
      return st.moves;
    },
    cellPoint: function (i) {
      var c = stage.center(i), r = $('cv').getBoundingClientRect();
      return c ? { x: r.left + c[0], y: r.top + c[1] } : null;
    },
    manual: function (on) { manual = !!on; },
    step: function (ms, n) { n = n || 1; for (var k = 0; k < n; k++) frame((ms || 16) / 1000); },
    progress: function () { return JSON.parse(JSON.stringify(P)); },
    setProgress: function (p) { Object.assign(P, p); save(); if (st.screen === 'home') renderHome(); if (st.screen === 'nights') renderNights(); },
    reset: function () { try { localStorage.removeItem(STORE); } catch (e) { /* fine */ } P = load(); },
    story: function () { return SH.fontsReady().then(function () { return st.result ? SH.draw(st.result).toDataURL('image/png') : null; }); },
    shareText: function () { return st.result ? SH.text(st.result) : null; },
    daily: getDaily,
    board: function () { return st.board; },
    heroDemo: function (k) { var d = R.parse(LV.LEVELS[k]); d.cells.forEach(function (c) { c.m = c.sol; }); hero.setBoard(d, 'laxmi', 5); hero.sync(R.flow(d)); hero.fillAll(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(this);
