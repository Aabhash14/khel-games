// Screens, game flow, computer player, tutorial, Daily Bagh, stats and sharing.
(function () {
  'use strict';
  var R = window.BCRules, AI = window.BCAI, I = window.BCI18N, t = I.t, SND = window.BCAudio, A = window.BCArt;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }

  var prefs = load('bagh.prefs', { side: 'G', level: 'medium', hints: false });
  var stats = load('bagh.stats', {});
  var dailyRec = load('bagh.daily', {});
  var learned = load('bagh.learned', false);
  var FAST = false;
  var THINK = { easy: 520, medium: 650, hard: 300 };

  var view = new window.BCView.View($('#cv'), $('#pts'));
  view.hints = !!prefs.hints;
  var S = null;          // current session
  var aiToken = 0;
  var subTimer = null;

  // ---------- screens ----------
  var current = 'home';
  function show(name) {
    current = name;
    document.body.setAttribute('data-screen', name);
    $$('.screen').forEach(function (el) { el.classList.toggle('on', el.dataset.screen === name); });
    view.visible = name === 'play';
    if (name === 'play') { view.resize(); view.refresh(); }
    else { SND.pulse(false); }
    if (name === 'home') renderHome();
    if (name === 'setup') renderSetup();
    var h = document.querySelector('.screen.on h1, .screen.on h2');
    if (h && name !== 'play') { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { /* fine */ } }
    window.scrollTo(0, 0);
  }

  // ---------- language + mute ----------
  function applyLang() {
    var l = I.get();
    document.documentElement.lang = l === 'ne' ? 'ne' : 'en';
    $$('[data-t]').forEach(function (el) { el.textContent = t(el.dataset.t); });
    $$('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.setLang === l ? 'true' : 'false'); });
    $('#pts').setAttribute('aria-label', t('board'));
    if (current === 'home') renderHome();
    if (current === 'setup') renderSetup();
    if (S) { hud(); prompt(); view.labelPoints(t); if (S.mode === 'learn') coach(); }
  }
  $$('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { I.set(b.dataset.setLang); applyLang(); });
  });
  function applyMute() {
    var m = SND.isMuted();
    $('#mute').setAttribute('aria-pressed', m ? 'true' : 'false');
  }
  $('#mute').addEventListener('click', function () {
    SND.setMuted(!SND.isMuted()); applyMute();
    if (!SND.isMuted()) SND.sfx('pick');
  });
  // sound starts on the first gesture
  var unlocked = false;
  function unlock() { if (unlocked) return; unlocked = true; SND.unlock(); if (current === 'play' && S && !S.game.result) SND.pulse(true, tension()); }
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });

  // ---------- home ----------
  function dayN() { return AI.dayNumber(new Date()); }
  function sideName(sd) { return sd === 'G' ? t('goats') : t('tigers'); }
  function resText(r) { return r ? t(r.r === 'W' ? 'resW' : r.r === 'L' ? 'resL' : 'resD', { n: r.moves }) : ''; }
  function renderHome() {
    var n = dayN(), rec = dailyRec[n];
    var ss = savedSession();
    $('#goResume').hidden = !ss;
    if (ss) $('#resumeSub').textContent = labelFor(ss.cfg) + ' · ' + t('movesN', { n: ss.list.length });
    $('#dailyMain').textContent = t('daily', { n: n });
    $('#dailySub').textContent = rec ? t('dailyDone', { res: resText(rec) }) : t('dailySubG');
    $('#goDaily').classList.toggle('done', !!rec);
    $('#goLearn').classList.toggle('fresh', !learned);
    var w = 0, l = 0, d = 0;
    Object.keys(stats).forEach(function (k) { w += stats[k].w; l += stats[k].l; d += stats[k].d; });
    $('#homeRecord').textContent = (w + l + d) ? t('statsTitle') + ': ' + t('record', { w: w, l: l, d: d }) : '';
  }
  function drawHero() {
    var c = $('#heroArt'); if (!c) return;
    var r = c.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    var size = Math.round(r.width || 240);
    c.width = Math.round(size * dpr); c.height = Math.round(size * dpr);
    var x = c.getContext('2d'); x.scale(dpr, dpr);
    var s = R.initial();
    s.b[0] = 0; s.b[6] = R.TIGER; s.b[24] = 0; s.b[18] = R.TIGER;
    [1, 2, 7, 11, 12, 13, 17, 22].forEach(function (i) { s.b[i] = R.GOAT; });
    window.BCView.drawPosition(x, A.geom(4, 4, size - 8), s);
  }

  // ---------- setup ----------
  function statKey(lv, sd) { return lv + '-' + sd; }
  function renderSetup() {
    $$('[data-side]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.side === prefs.side ? 'true' : 'false'); });
    $$('[data-level]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.level === prefs.level ? 'true' : 'false'); });
    var st = stats[statKey(prefs.level, prefs.side)];
    var txt = st ? t('record', { w: st.w, l: st.l, d: st.d }) + (st.best ? ' · ' + t('bestWin', { n: st.best }) : '') : t('noGames');
    $('#setupRecord').textContent = txt;
  }
  function tokenIcon(canvas, kind) {
    var dpr = Math.min(3, window.devicePixelRatio || 1), sz = canvas.width / dpr || 56;
    var css = parseInt(canvas.getAttribute('width'), 10) || 56;
    canvas.width = css * dpr; canvas.height = css * dpr; canvas.style.width = css + 'px'; canvas.style.height = css + 'px';
    var x = canvas.getContext('2d'); x.scale(dpr, dpr);
    if (kind === 'T') A.tiger(x, css / 2, css / 2, css * 0.46); else A.goat(x, css / 2, css / 2, css * 0.46);
  }
  $$('[data-side]').forEach(function (b) { b.addEventListener('click', function () { prefs.side = b.dataset.side; save('bagh.prefs', prefs); SND.sfx('pick'); renderSetup(); }); });
  $$('[data-level]').forEach(function (b) { b.addEventListener('click', function () { prefs.level = b.dataset.level; save('bagh.prefs', prefs); SND.sfx('tick'); renderSetup(); }); });
  $('#startBtn').addEventListener('click', function () { startGame({ mode: 'ai', human: prefs.side, level: prefs.level }); });

  // ---------- sessions ----------
  // list: moves to replay straight away (resuming a saved game after a reload).
  function startGame(cfg, list) {
    cancelAI();
    view.reset(); animating = false;
    clearTimeout(subTimer); subTimer = null; lastSub = null;
    var start = cfg.start ? R.fromPlain(cfg.start) : R.initial();
    S = { mode: cfg.mode, human: cfg.human || 'both', level: cfg.level || 'hard', daily: cfg.daily || 0, game: new R.Game(start), cfg: cfg, step: cfg.step || 0, ended: false };
    if (list) for (var i = 0; i < list.length && !S.game.result; i++) if (!S.game.play(list[i])) break;
    view.only = cfg.only || null;
    view.lastMove = S.game.list.length ? S.game.list[S.game.list.length - 1] : 0;
    view.select(-1);
    view.sync(S.game.s);
    closeSheet();
    show('play');
    $('#playLabel').textContent = label();
    $('#undoBtn').disabled = S.mode === 'daily' || S.mode === 'learn';
    $('#newBtn').hidden = S.mode === 'learn';
    $('#coach').hidden = S.mode !== 'learn';
    if (S.mode === 'learn') coach();
    if (unlocked) SND.pulse(true, 0);
    next();
    // say what winning means for you, once, while the first move is made
    if (!list && S && S.mode !== 'learn' && !S.game.result) {
      sub(S.mode === 'pass' ? 'goalPass' : S.mode === 'daily' ? 'goalDaily' : S.human === 'G' ? 'goalG' : 'goalT', null, 3200);
    }
  }
  function label() { return S ? labelFor(S) : ''; }
  function labelFor(c) {
    if (c.mode === 'ai') return t('labelAI', { lv: t(c.level) });
    if (c.mode === 'pass') return t('labelPass');
    if (c.mode === 'daily') return t('labelDaily', { n: c.daily });
    return t('labelLearn');
  }
  function sideToMove() { return S.game.s.turn === R.G ? 'G' : 'T'; }
  function humanTurn() { return S.mode === 'pass' || S.mode === 'learn' || sideToMove() === S.human; }
  function tension() {
    if (!S) return 0;
    return S.game.s.cap + (R.inDanger(S.game.s).length && S.game.s.turn === R.T ? 0.6 : 0);
  }

  function hud() {
    if (!S) return;
    var s = S.game.s;
    $('#capN').textContent = I.num(s.cap);
    $('#handN').textContent = I.num(s.hand);
    $('#trapN').textContent = I.num(R.trapped(s).length);
    $('#capMax').textContent = I.num(5); $('#trapMax').textContent = I.num(4);
    var who = function (sd) {
      if (S.mode === 'pass') return sd === 'G' ? t('p1') : t('p2');
      if (S.mode === 'learn') return sd === S.human ? t('you') : '';
      return sd === S.human ? t('you') : t('cpu');
    };
    $('#whoT').textContent = who('T');
    $('#whoG').textContent = who('G');
    var over = !!S.game.result;
    $('#tagT').classList.toggle('on', !over && s.turn === R.T);
    $('#tagG').classList.toggle('on', !over && s.turn === R.G);
    $('#tagT').classList.toggle('hot', s.cap >= 3);
    $('#handWrap').hidden = s.hand === 0;
    $('#playLabel').textContent = label();
  }

  // A short subtitle that holds for a moment, then the turn prompt comes back.
  // Kept as key + vars so a language switch can redraw it.
  var lastSub = null;
  function sub(k, vars, hold) {
    var el = $('#sub');
    lastSub = { k: k, vars: vars };
    el.textContent = t(k, vars);
    el.classList.remove('thinking');
    el.classList.toggle('goal', k.indexOf('goal') === 0);
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    clearTimeout(subTimer); subTimer = null;
    if (hold) subTimer = setTimeout(function () { subTimer = null; prompt(); }, hold);
  }
  function resultLine() {
    var r = S.game.result;
    return t(r.w === 'G' ? 'winG' : r.w === 'T' ? 'winT' : 'draw') + ' ' + t({ trapped: 'whyTrapped', caps: 'whyCaps', stuck: 'whyStuck', repeat: 'whyRepeat' }[r.why]) + (I.get() === 'ne' ? '।' : '.');
  }
  function prompt() {
    if (!S) return;
    var s = S.game.s, el = $('#sub');
    if (subTimer) { if (lastSub) el.textContent = t(lastSub.k, lastSub.vars); return; }
    el.classList.remove('goal');
    if (S.game.result) { el.classList.remove('thinking'); el.textContent = resultLine(); return; }
    el.classList.remove('thinking');
    if (S.mode === 'learn') { el.textContent = t(['learn1', 'learn2', 'learn3'][S.step]); return; }
    if (!humanTurn()) { el.textContent = t(sideToMove() === 'T' ? 'thinkT' : 'thinkG'); el.classList.add('thinking'); return; }
    el.classList.remove('thinking');
    if (S.mode === 'pass') { el.textContent = t(sideToMove() === 'G' ? 'tPassG' : 'tPassT'); return; }
    if (view.sel >= 0) { el.textContent = t('pickTarget'); return; }
    el.textContent = sideToMove() === 'T' ? t('tMoveT') : (s.hand > 0 ? t('tDrop') : t('tMoveG'));
  }

  // The game in progress survives a reload (phones drop background tabs). The tutorial is not kept.
  function saveSession() {
    if (!S || S.mode === 'learn') return;
    if (!S.game.result && S.game.list.length) {
      var c = S.cfg;
      save('bagh.session', { v: 1, cfg: { mode: c.mode, human: c.human, level: c.level, daily: c.daily, start: c.start }, list: S.game.list.slice() });
    } else dropSession();
  }
  function dropSession() { try { localStorage.removeItem('bagh.session'); } catch (e) { /* fine */ } }
  function savedSession() {
    var ss = load('bagh.session', null);
    if (!ss || ss.v !== 1 || !ss.cfg || !Array.isArray(ss.list) || !ss.list.length) return null;
    if (['ai', 'pass', 'daily'].indexOf(ss.cfg.mode) < 0) return null;
    return ss;
  }

  function next() {
    if (!S) return;
    saveSession();
    hud();
    view.thinking = null;
    SND.pulse(unlocked && current === 'play' && !S.game.result, tension());
    if (S.game.result) { end(); return; }
    if (humanTurn()) {
      view.side = sideToMove();
      view.labelPoints(t);
      prompt();
      view.refresh();
      return;
    }
    view.side = null;
    view.labelPoints(t);
    view.thinking = sideToMove();
    prompt();
    view.refresh();
    requestAI();
  }

  // ---------- computer player ----------
  var worker = null, workerBroken = false, pending = {};
  function getWorker() {
    if (worker || workerBroken) return worker;
    if (location.protocol === 'file:' || typeof Worker === 'undefined') { workerBroken = true; return null; }
    try {
      worker = new Worker('js/worker.js?v=3');
      worker.onmessage = function (e) { var cb = pending[e.data.id]; delete pending[e.data.id]; if (cb) cb(e.data); };
      worker.onerror = function () {
        workerBroken = true; worker = null;
        var ids = Object.keys(pending); var cbs = ids.map(function (k) { return pending[k]; }); pending = {};
        cbs.forEach(function (cb) { cb(null); });
      };
    } catch (e) { workerBroken = true; worker = null; }
    return worker;
  }
  function search(payload, cb) {
    var w = getWorker();
    var local = function () {
      var r = AI.choose(R.fromPlain(payload.state), { level: payload.level, seen: payload.seen, time: Math.min(payload.time, 350) });
      cb({ move: r.move });
    };
    if (!w) { local(); return; }
    pending[payload.id] = function (res) { if (res) cb(res); else local(); };
    w.postMessage(payload);
  }
  // Stop a search in flight by dropping the worker. A Daily board being built is sent again.
  var dailyReq = {};
  function cancelAI() {
    aiToken++;
    var ids = Object.keys(pending);
    if (!worker || !ids.some(function (k) { return !(k in dailyReq); })) return;
    var keep = {};
    ids.forEach(function (k) { if (k in dailyReq) keep[k] = pending[k]; });
    worker.terminate(); worker = null; pending = {};
    Object.keys(keep).forEach(function (k) {
      var w = getWorker();
      if (!w) { keep[k](null); return; }
      pending[k] = keep[k]; w.postMessage({ type: 'daily', id: k, n: dailyReq[k] });
    });
  }
  function requestAI() {
    var token = ++aiToken, t0 = performance.now(), s = S.game.s;
    var lv = S.level;
    var payload = { id: token, state: { b: s.b.slice(), hand: s.hand, cap: s.cap, turn: s.turn }, level: lv, seen: S.game.seen.slice(), time: FAST ? 40 : AI.LEVELS[lv].time };
    // let the "thinking" frame paint before any heavy work
    requestAnimationFrame(function () {
      setTimeout(function () {
        if (token !== aiToken) return;
        search(payload, function (res) {
          if (token !== aiToken || !S) return;
          var wait = FAST ? 0 : Math.max(0, THINK[lv] - (performance.now() - t0));
          setTimeout(function () {
            if (token !== aiToken || !S) return;
            view.thinking = null;
            var m = res.move;
            if (!R.isLegal(S.game.s, m)) { var ms = R.moves(S.game.s); m = ms[0]; }
            commit(m, {});
          }, wait);
        });
      }, 16);
    });
  }

  // ---------- moves ----------
  var animating = false;
  function commit(m, opts) {
    if (!S || animating) return;
    var before = R.clone(S.game.s);
    if (!S.game.play(m)) return;
    animating = true;
    // a tap tip like "Now tap a glowing point" is stale once a move is made; the goal line stays
    if (subTimer && lastSub && lastSub.k.indexOf('goal') !== 0) { clearTimeout(subTimer); subTimer = null; }
    view.side = null;
    view.animate(m, opts, function (res) {
      animating = false;
      feedback(m, before, res);
      if (S && S.mode === 'learn') { learnCheck(m); return; }
      next();
    });
  }
  view.on.move = function (m, opts) {
    if (!S || animating || S.game.result || !humanTurn()) return;
    commit(m, opts);
  };
  view.on.msg = function (k) { sub(k, null, 1500); };
  view.on.sfx = function (n) { SND.sfx(n); };
  view.on.selChange = function () { if (S && !subTimer) prompt(); if (S) view.labelPoints(t); };

  function buzz(p) { if (!unlocked || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; try { if (navigator.vibrate && !window.BCView.reduce) navigator.vibrate(p); } catch (e) { /* fine */ } }

  function feedback(m, before, res) {
    var s = S.game.s;
    if (R.mCap(m) >= 0) {
      buzz([35, 40, 70]);
      if (!S.game.result) sub('ate', { n: s.cap }, 1700);
    } else if (res && res.newlyTrapped) {
      SND.sfx('trap'); buzz(25);
      if (!S.game.result) sub('trapOne', { n: R.trapped(s).length }, 1700);
    } else if (res && res.freed) {
      SND.sfx('growl');
      sub('freed', null, 1400);
    } else if (before.hand === 1 && s.hand === 0 && S.mode !== 'learn') {
      sub('allDown', null, 1900);
    } else if (!S.game.result && S.game.repCount() === 2) {
      sub('repeatWarn', null, 2000);
    } else if (view.hints && S.mode !== 'learn' && s.turn === R.G && R.inDanger(s).length && (S.human === 'G' || S.mode === 'pass')) {
      sub('danger', null, 1500);
    }
  }

  // ---------- undo / new / hints ----------
  $('#undoBtn').addEventListener('click', function () {
    if (!S) return;
    if (S.mode === 'daily') { sub('noUndoDaily', null, 1800); return; }
    if (S.mode === 'learn' || animating) return;
    var g = S.game, n = undoSteps();
    if (!n) { sub('nothingToUndo', null, 1400); return; }
    cancelAI();
    g.undo(n);
    // taking back a finished game also takes back the result it put in your record
    if (S.ended && S.rec) { if (S.rec.prev) stats[S.rec.k] = S.rec.prev; else delete stats[S.rec.k]; save('bagh.stats', stats); }
    S.ended = false; S.rec = null;
    closeSheet();
    view.thinking = null; view.over = false; view.reset();
    view.sync(g.s);
    view.lastMove = g.list.length ? g.list[g.list.length - 1] : 0;
    SND.sfx('tick');
    next();
  });
  // How many plies back to the last earlier position where it was your move.
  function undoSteps() {
    var g = S.game, len = g.list.length, s = R.clone(g.start), turns = [];
    for (var i = 0; i < len; i++) { turns.push(s.turn); R.make(s, g.list[i]); }
    if (S.mode === 'pass') return len ? 1 : 0;
    var mine = S.human === 'G' ? R.G : R.T;
    for (var k = 1; k <= len; k++) if (turns[len - k] === mine) return k;
    return 0;
  }
  $('#hintBtn').addEventListener('click', function () {
    view.hints = !view.hints; prefs.hints = view.hints; save('bagh.prefs', prefs);
    $('#hintBtn').setAttribute('aria-pressed', view.hints ? 'true' : 'false');
    SND.sfx('tick'); view.refresh();
  });
  $('#newBtn').addEventListener('click', function () {
    if (!S) return;
    if (!S.game.list.length || S.game.result) { restart(); return; }
    confirmSheet(t('newQ'), '', t('newYes'), restart);
  });
  function restart() {
    if (!S) return;
    var c = S.cfg;
    startGame(c);
  }
  $('#playBack').addEventListener('click', function () {
    if (S && S.game.list.length && !S.game.result && S.mode !== 'learn') confirmSheet(t('leaveQ'), t('leaveSub'), t('leave'), leave);
    else leave();
  });
  function leave() { if (S && S.mode !== 'learn') dropSession(); cancelAI(); view.reset(); animating = false; S = null; view.side = null; view.thinking = null; closeSheet(); show('home'); }

  // ---------- end of game ----------
  function myMoves() {
    if (!S) return 0;
    var s = R.clone(S.game.start), n = 0, mine = S.human === 'G' ? R.G : R.T;
    S.game.list.forEach(function (m) { if (S.mode === 'pass' || s.turn === mine) n++; R.make(s, m); });
    return n;
  }
  function outcome() {
    var r = S.game.result;
    if (!r) return null;
    if (S.mode === 'pass') return r.w === 'D' ? 'D' : r.w;
    if (r.w === 'D') return 'D';
    return r.w === S.human ? 'W' : 'L';
  }
  function end() {
    if (S.ended) return;
    S.ended = true;
    view.side = null; view.thinking = null; view.over = true; view.select(-1);
    view.celebrate(S.game.result.w);
    SND.pulse(false);
    var o = outcome(), moves = myMoves();
    if (S.mode === 'ai') {
      var k = statKey(S.level, S.human), st = stats[k] || { w: 0, l: 0, d: 0, best: 0 };
      S.rec = { k: k, prev: stats[k] ? JSON.parse(JSON.stringify(stats[k])) : null };
      if (o === 'W') { st.w++; if (!st.best || moves < st.best) st.best = moves; }
      else if (o === 'L') st.l++; else st.d++;
      stats[k] = st; save('bagh.stats', stats);
    }
    if (S.mode === 'daily' && !dailyRec[S.daily]) {
      dailyRec[S.daily] = { r: o, moves: moves, cap: S.game.s.cap };
      // keep the last 30 days only
      var keys = Object.keys(dailyRec).map(Number).sort(function (a, b) { return b - a; });
      keys.slice(30).forEach(function (kk) { delete dailyRec[kk]; });
      save('bagh.daily', dailyRec);
    }
    var good = o === 'W' || (S.mode === 'pass' && o !== 'D');
    SND.sfx(o === 'D' ? 'draw' : good ? 'win' : 'lose');
    buzz(good ? [40, 60, 40, 60, 120] : [120]);
    clearTimeout(subTimer); subTimer = null; lastSub = null;
    $('#sub').classList.remove('thinking');
    $('#sub').textContent = resultLine();
    hud();
    setTimeout(function () { if (S && S.ended) resultSheet(); }, FAST ? 0 : 1500);
  }

  function shareData() {
    var r = S.game.result, o = outcome(), moves = myMoves(), cap = S.game.s.cap;
    var lv = t(S.level);
    var head, text;
    if (S.mode === 'pass') {
      head = r.w === 'G' ? t('storyWinG') : r.w === 'T' ? t('storyWinT') : t('storyDraw');
      text = t('sharePass', { w: t(r.w === 'G' ? 'winG' : r.w === 'T' ? 'winT' : 'draw').replace(/!$/, ''), n: S.game.list.length });
    } else if (o === 'W') {
      head = S.human === 'G' ? t('storyWinG') : t('storyWinT');
      text = t(S.human === 'G' ? 'shareWinG' : 'shareWinT', { n: moves });
    } else if (o === 'L') {
      head = S.human === 'G' ? t('storyLose') : t('storyLoseT');
      text = t('shareLose', { lv: lv });
    } else {
      head = t('storyDraw');
      text = t('shareDraw', { lv: lv, n: moves });
    }
    var tag = S.mode === 'daily' ? t('shareDailyTag', { n: S.daily }) : S.mode === 'pass' ? t('labelPass') : t('labelAI', { lv: lv });
    var url = location.href.split('#')[0].split('?')[0];
    var date = new Date().toLocaleDateString(I.get() === 'ne' ? 'ne-NP' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    var line = [t('movesN', { n: S.mode === 'pass' ? S.game.list.length : moves }), t('lostN', { n: cap }), date].join(' · ');
    return {
      state: { b: S.game.s.b.slice(), cap: cap, hand: S.game.s.hand, turn: S.game.s.turn },
      head: head, line: line, tag: tag,
      side: S.mode === 'pass' ? t('storyAsPass') : t('storyAs', { side: sideName(S.human), lv: lv }),
      cta: t('shareCta'), url: url.replace(/^https?:\/\//, ''),
      text: (S.mode === 'daily' ? tag + ': ' : '') + text + ' ' + t('shareCta') + ' ' + url,
      file: 'bagh-chal-' + (S.mode === 'daily' ? 'daily-' + S.daily : 'result') + '.png',
    };
  }

  // ---------- sheets ----------
  var lastFocus = null;
  function openSheet(html, bind) {
    var wrap = $('#sheetWrap'), sh = $('#sheet');
    lastFocus = document.activeElement;
    sh.innerHTML = html;
    wrap.hidden = false;
    requestAnimationFrame(function () { wrap.classList.add('on'); });
    if (bind) bind(sh);
    var f = sh.querySelector('[autofocus]') || sh.querySelector('button');
    try { (f || sh).focus({ preventScroll: true }); } catch (e) { /* fine */ }
  }
  function closeSheet() {
    var wrap = $('#sheetWrap');
    if (wrap.hidden) return;
    wrap.classList.remove('on'); wrap.hidden = true; $('#sheet').innerHTML = '';
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* fine */ } }
  }
  $('#sheetWrap').addEventListener('click', function (e) { if (e.target.id === 'sheetWrap' && !$('#sheet').dataset.locked) closeSheet(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#sheetWrap').hidden && !$('#sheet').dataset.locked) closeSheet();
    if (e.key === 'Tab' && !$('#sheetWrap').hidden) {
      var f = $$('#sheet button, #sheet a');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function confirmSheet(q, subt, yes, onYes) {
    $('#sheet').dataset.locked = '';
    delete $('#sheet').dataset.locked;
    openSheet('<h2 id="sheetH" class="sheet-h">' + esc(q) + '</h2>' + (subt ? '<p class="sheet-p">' + esc(subt) + '</p>' : '') +
      '<div class="sheet-row"><button type="button" class="big-btn slim" data-a="no" autofocus>' + esc(t('stay')) + '</button><button type="button" class="big-btn slim brass" data-a="yes">' + esc(yes) + '</button></div>',
      function (sh) {
        sh.querySelector('[data-a=no]').addEventListener('click', closeSheet);
        sh.querySelector('[data-a=yes]').addEventListener('click', function () { closeSheet(); onYes(); });
      });
  }
  function resultSheet() {
    var r = S.game.result, o = outcome(), moves = myMoves();
    var big = t(r.w === 'G' ? 'winG' : r.w === 'T' ? 'winT' : 'draw');
    var why = t({ trapped: 'whyTrapped', caps: 'whyCaps', stuck: 'whyStuck', repeat: 'whyRepeat' }[r.why]);
    var you = S.mode === 'pass' ? '' : (o === 'W' ? t('youWon') : o === 'L' ? t('youLost') : '');
    var cls = o === 'W' || (S.mode === 'pass' && r.w !== 'D') ? 'win' : o === 'L' ? 'lose' : 'draw';
    var line = [t('movesN', { n: S.mode === 'pass' ? S.game.list.length : moves }), t('lostN', { n: S.game.s.cap })].join(' · ');
    var st = S.mode === 'ai' ? stats[statKey(S.level, S.human)] : null;
    var rec = st ? '<p class="sheet-rec">' + esc(t('record', { w: st.w, l: st.l, d: st.d })) + (st.best ? ' · ' + esc(t('bestWin', { n: st.best })) : '') + '</p>' : '';
    openSheet(
      '<div class="res ' + cls + '">' +
      (you ? '<p class="res-you">' + esc(you) + '</p>' : '') +
      '<h2 id="sheetH" class="res-big">' + esc(big) + '</h2>' +
      '<p class="res-why">' + esc(why) + '</p>' +
      '<p class="res-line">' + esc(line) + '</p>' + rec +
      '</div>' +
      '<button type="button" class="big-btn brass" data-a="share" autofocus><span class="bb-main">' + esc(t('share')) + '</span></button>' +
      '<div class="sheet-row">' +
      '<button type="button" class="big-btn slim" data-a="again">' + esc(t(o === 'L' ? 'tryAgain' : 'again')) + '</button>' +
      '<button type="button" class="big-btn slim" data-a="home">' + esc(t('home')) + '</button>' +
      '</div>' +
      (S.mode !== 'daily' && S.mode !== 'learn' && S.game.list.length > 1 ? '<button type="button" class="link-btn" data-a="undo">' + esc(t('undo')) + '</button>' : ''),
      function (sh) {
        sh.querySelector('[data-a=share]').addEventListener('click', function (e) {
          var btn = e.currentTarget; btn.disabled = true;
          window.BCShare.share(shareData()).then(function (msg) { if (msg) toast(msg); }).catch(function () {}).then(function () { btn.disabled = false; });
        });
        sh.querySelector('[data-a=again]').addEventListener('click', function () { closeSheet(); restart(); });
        sh.querySelector('[data-a=home]').addEventListener('click', function () { closeSheet(); leave(); });
        var u = sh.querySelector('[data-a=undo]');
        if (u) u.addEventListener('click', function () { $('#undoBtn').click(); });
      });
  }
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2400);
  }

  // ---------- Daily Bagh ----------
  // The board is built by two engines playing it out (up to a second on a slow phone),
  // so it runs in the worker when there is one, and is kept for the rest of the day.
  function dailyFor(n, cb) {
    var cache = load('bagh.dailyPos', null);
    if (cache && cache.n === n && cache.v === 2) { cb(cache.d); return; }
    var done = function (d) { save('bagh.dailyPos', { n: n, v: 2, d: d }); cb(d); };
    var w = getWorker(), id = 'd' + n + '-' + Date.now();
    if (!w) { setTimeout(function () { done(AI.daily(n)); }, 30); return; }
    dailyReq[id] = n;
    pending[id] = function (res) { delete dailyReq[id]; if (res && res.daily) done(res.daily); else done(AI.daily(n)); };
    w.postMessage({ type: 'daily', id: id, n: n });
  }
  var dailyBusy = false;
  $('#goDaily').addEventListener('click', function () {
    if (dailyBusy) return;
    var n = dayN();
    var btn = $('#goDaily'); btn.classList.add('busy'); dailyBusy = true;
    $('#dailySub').textContent = t('dailyLoading');
    dailyFor(n, function (d) {
      dailyBusy = false;
      btn.classList.remove('busy');
      if (current !== 'home') { renderHome(); return; }
      startGame({ mode: 'daily', daily: n, human: d.side, level: 'hard', start: d.state });
    });
  });
  $('#goAI').addEventListener('click', function () { show('setup'); });
  $('#goResume').addEventListener('click', function () {
    var ss = savedSession(); if (!ss) { renderHome(); return; }
    startGame(ss.cfg, ss.list);
  });
  $('#goPass').addEventListener('click', function () { startGame({ mode: 'pass' }); });
  $('#goLearn').addEventListener('click', function () { startLearn(0); });
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.go); }); });

  // ---------- tutorial: learn by doing ----------
  function learnPos(step) {
    var s = R.initial(), only = null, human = 'G';
    if (step === 1) {
      s.b = new Array(25).fill(0);
      [0, 4, 24, 12].forEach(function (i) { s.b[i] = R.TIGER; });
      [7, 18, 21].forEach(function (i) { s.b[i] = R.GOAT; });
      s.hand = 17; s.cap = 0; s.turn = R.T; human = 'T';
      only = [R.enc(12, 2, 7)];
    } else if (step === 2) {
      s.b = new Array(25).fill(0);
      [0, 4, 20, 24].forEach(function (i) { s.b[i] = R.TIGER; });
      [1, 2, 3, 5, 6, 7, 8, 9, 10, 14, 15, 16, 18, 19, 21, 22, 23].forEach(function (i) { s.b[i] = R.GOAT; });
      s.hand = 0; s.cap = 3; s.turn = R.G;
      only = [R.enc(7, 12, -1)];
    }
    R.rehash(s);
    return { start: { b: s.b, hand: s.hand, cap: s.cap, turn: s.turn }, only: only, human: human };
  }
  function startLearn(step) {
    var p = learnPos(step);
    startGame({ mode: 'learn', step: step, start: p.start, only: p.only, human: p.human });
  }
  function coach() {
    $('#coachStep').textContent = t('step', { n: S.step + 1 });
    $('#coachText').textContent = t(['learn1', 'learn2', 'learn3'][S.step]);
  }
  function learnCheck() {
    sub('nice', null, 900);
    SND.sfx('tick');
    var step = S.step;
    view.side = null;
    setTimeout(function () {
      if (!S || S.mode !== 'learn') return;
      if (step < 2) { startLearn(step + 1); return; }
      learned = true; save('bagh.learned', true);
      SND.sfx('win');
      openSheet('<div class="res win"><h2 id="sheetH" class="res-big">' + esc(t('nice')) + '</h2><p class="res-why">' + esc(t('learnDone')) + '</p></div>' +
        '<button type="button" class="big-btn brass" data-a="go" autofocus><span class="bb-main">' + esc(t('learnStart')) + '</span></button>' +
        '<div class="sheet-row"><button type="button" class="big-btn slim" data-a="home">' + esc(t('home')) + '</button></div>',
        function (sh) {
          sh.querySelector('[data-a=go]').addEventListener('click', function () { closeSheet(); S = null; show('setup'); });
          sh.querySelector('[data-a=home]').addEventListener('click', function () { closeSheet(); leave(); });
        });
    }, FAST ? 0 : 1000);
  }
  $('#skipLearn').addEventListener('click', function () { learned = true; save('bagh.learned', true); leave(); });

  // ---------- boot ----------
  $$('canvas[data-token]').forEach(function (c) { tokenIcon(c, c.dataset.token); });
  $('#hintBtn').setAttribute('aria-pressed', view.hints ? 'true' : 'false');
  applyLang(); applyMute(); renderHome();
  var fontsDone = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsDone.then(drawHero);
  drawHero();
  var rT = null;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (current === 'play') view.resize(); drawHero(); }, 80); });
  if (window.ResizeObserver) new ResizeObserver(function () { if (current === 'play') view.resize(); }).observe($('#stage'));
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) SND.pulse(false);
    else if (current === 'play' && S && !S.game.result && unlocked) SND.pulse(true, tension());
  });

  // ---------- test hooks ----------
  window.BC = {
    R: R, AI: AI, view: view,
    fast: function (on) { FAST = !!on; view.fast = !!on; return FAST; },
    state: function () {
      if (!S) return { screen: current };
      var s = S.game.s;
      return { screen: current, mode: S.mode, human: S.human, level: S.level, b: s.b.join(''), hand: s.hand, cap: s.cap, turn: s.turn === R.G ? 'G' : 'T', result: S.game.result, plies: S.game.list.length, sel: view.sel, targets: view.targets.map(R.dec), side: view.side, thinking: view.thinking, busy: view.busy() || animating, step: S.step, sub: $('#sub').textContent, sheet: !$('#sheetWrap').hidden };
    },
    start: function (cfg) { startGame(cfg); return true; },
    learn: function (step) { startLearn(step || 0); },
    show: show,
    tap: function (i) { view.tapPoint(i); },
    pt: function (i) { var r = view.cv.getBoundingClientRect(), p = view.L.G.pts[i]; return { x: r.left + p.x, y: r.top + p.y }; },
    hand: function () {
      var r = view.cv.getBoundingClientRect(), hp = null;
      for (var k = view.pieces.length - 1; k >= 0; k--) if (view.pieces[k].where === 'h') { hp = view.pieces[k]; break; }
      return hp ? { x: r.left + hp.x, y: r.top + hp.y } : null;
    },
    move: function (from, to) {
      var m = R.moves(S.game.s).filter(function (x) { return R.mFrom(x) === from && R.mTo(x) === to; })[0];
      if (m) view.on.move(m, {});
      return !!m;
    },
    flush: function () { view.flush(); },
    daily: function (n) { return new Promise(function (res) { dailyFor(n || dayN(), res); }); },
    session: function () { return load('bagh.session', null); },
    storyURL: function () { return window.BCShare.story(shareData()).then(function (c) { return c.toDataURL('image/png'); }); },
    shareText: function () { return shareData().text; },
  };
})();
