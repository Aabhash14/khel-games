// The play surface: one canvas holding the captured-goat tray, the board and the goat trough.
// Handles layout, sprites, tweens, particles, shake, and tap / drag input.
(function (root) {
  'use strict';
  var R = root.BCRules, A = root.BCArt;
  var TAU = Math.PI * 2;
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* old browser */ }

  var ease = {
    out: function (k) { return 1 - Math.pow(1 - k, 3); },
    inOut: function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    back: function (k) { var c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    lin: function (k) { return k; },
  };

  function V(canvas, ptsEl) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.ptsEl = ptsEl;
    this.s = R.initial();
    this.pieces = []; this.tweens = []; this.parts = [];
    this.sel = -1; this.targets = []; this.drag = null; this.hover = -1;
    this.side = null;          // which side the person controls right now ('G' | 'T' | null)
    this.only = null;          // tutorial: list of allowed moves
    this.hints = false; this.thinking = null; this.lastMove = 0;
    this.trapped = {}; this.shakeAmp = 0; this.speed = reduce ? 0.55 : 1;
    this.on = { move: function () {}, msg: function () {}, sfx: function () {} };
    this.time = 0; this.running = false; this.manual = false;
    this.btns = [];
    this.gen = 0;
    this._bind();
    this.resize();
  }

  V.prototype.layout = function () {
    var W = this.W, H = this.H;
    // portrait: tray above, board, trough below. landscape: trays to the sides.
    var Sp = Math.min(W - 6, H / 1.44), Sl = Math.min(H - 6, W / 1.45);
    var L = { mode: Sp >= Sl ? 'p' : 'l' };
    var S = Math.floor(Math.max(Sp, Sl));
    var g, capR, handR;
    if (L.mode === 'p') {
      var tot = S * 1.44, y0 = (H - tot) / 2, x0 = (W - S) / 2;
      L.cap = { x: x0 + S * 0.12, y: y0, w: S * 0.76, h: S * 0.15 };
      L.G = A.geom(x0, y0 + S * 0.18, S);
      L.hand = { x: x0, y: y0 + S * 1.21, w: S, h: S * 0.23 };
      g = L.G.g;
      capR = Math.min(L.cap.h * 0.36, L.G.rg * 0.92);
      L.capSlots = [];
      for (var i = 0; i < 5; i++) L.capSlots.push({ x: L.cap.x + L.cap.w * (0.1 + i * 0.2), y: L.cap.y + L.cap.h / 2 });
      handR = Math.min(L.hand.h * 0.2, S * 0.042);
      L.handSlots = [];
      for (var j = 0; j < 20; j++) {
        var row = j < 10 ? 1 : 0, col = j % 10;
        L.handSlots.push({ x: L.hand.x + S * 0.075 + col * S * 0.0944, y: L.hand.y + L.hand.h * (row ? 0.66 : 0.34) });
      }
    } else {
      var totw = S * 1.45, x1 = (W - totw) / 2, y1 = (H - S) / 2;
      L.cap = { x: x1, y: y1 + S * 0.1, w: S * 0.17, h: S * 0.8 };
      L.G = A.geom(x1 + S * 0.2, y1, S);
      L.hand = { x: x1 + S * 1.23, y: y1, w: S * 0.22, h: S };
      g = L.G.g;
      capR = Math.min(L.cap.w * 0.36, L.G.rg * 0.92);
      L.capSlots = [];
      for (var i2 = 0; i2 < 5; i2++) L.capSlots.push({ x: L.cap.x + L.cap.w / 2, y: L.cap.y + L.cap.h * (0.1 + i2 * 0.2) });
      handR = Math.min(L.hand.w * 0.19, S * 0.042);
      L.handSlots = [];
      for (var j2 = 0; j2 < 20; j2++) {
        var col2 = j2 % 2, row2 = 9 - Math.floor(j2 / 2);
        L.handSlots.push({ x: L.hand.x + L.hand.w * (0.29 + col2 * 0.42), y: L.hand.y + S * (0.068 + row2 * 0.096) });
      }
    }
    L.capR = capR; L.handR = handR; L.S = S;
    L.w = L.mode === 'p' ? S : Math.round(S * 1.45);
    this.L = L;
  };

  V.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect();
    var W = Math.max(200, Math.round(r.width)), H = Math.max(200, Math.round(r.height));
    var dpr = Math.min(3, root.devicePixelRatio || 1);
    if (W === this.W && H === this.H && dpr === this.dpr && this.stat) return;
    this.W = W; this.H = H; this.dpr = dpr;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    this.layout();
    this._static();
    this._sprites();
    this._placeButtons();
    try { this.cv.parentNode.parentNode.style.setProperty('--boardw', this.L.w + 'px'); } catch (e) { /* fine */ }
    this.sync(this.s);
  };

  V.prototype._static = function () {
    var L = this.L, d = this.dpr;
    var c = document.createElement('canvas'); c.width = this.cv.width; c.height = this.cv.height;
    var x = c.getContext('2d'); x.scale(d, d);
    var k = L.S / 400;
    // captured tray: five carved sockets
    A.panel(x, L.cap.x, L.cap.y, L.cap.w, L.cap.h, Math.min(L.cap.w, L.cap.h) * 0.3, 31, k);
    L.capSlots.forEach(function (p) { A.socket(x, p.x, p.y, L.capR * 1.08, k); });
    // the board
    A.board(x, L.G, 7);
    // goat trough
    A.panel(x, L.hand.x, L.hand.y, L.hand.w, L.hand.h, Math.min(L.hand.w, L.hand.h) * 0.22, 53, k);
    var m = Math.min(L.hand.w, L.hand.h) * 0.1;
    A.well(x, L.hand.x + m, L.hand.y + m, L.hand.w - 2 * m, L.hand.h - 2 * m, Math.min(L.hand.w, L.hand.h) * 0.16, k);
    this.stat = c;
  };

  V.prototype._sprites = function () {
    var d = this.dpr, L = this.L;
    this.spT = A.sprite('tiger', L.G.rt * d);
    this.spG = A.sprite('goat', L.G.rg * d);
    this.spGs = A.sprite('goat', L.handR * d * 1.0);
  };

  V.prototype._placeButtons = function () {
    if (!this.ptsEl) return;
    var L = this.L, self = this;
    if (!this.btns.length) {
      for (var i = 0; i < 25; i++) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'pt'; b.dataset.i = i; b.tabIndex = i === 12 ? 0 : -1;
        this.ptsEl.appendChild(b); this.btns.push(b);
      }
      this.ptsEl.addEventListener('click', function (e) {
        var b = e.target.closest('.pt'); if (!b) return;
        self.tapPoint(+b.dataset.i);
      });
      this.ptsEl.addEventListener('keydown', function (e) {
        var b = e.target.closest('.pt'); if (!b) return;
        var i = +b.dataset.i, r = (i / 5) | 0, c = i % 5;
        var map = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (!map[e.key]) return;
        e.preventDefault();
        r = Math.max(0, Math.min(4, r + map[e.key][0])); c = Math.max(0, Math.min(4, c + map[e.key][1]));
        self.focusPoint(r * 5 + c);
      });
    }
    var sz = Math.max(44, L.G.g * 0.8);
    this.btns.forEach(function (b, i) {
      var p = L.G.pts[i];
      b.style.left = (p.x - sz / 2) + 'px'; b.style.top = (p.y - sz / 2) + 'px';
      b.style.width = sz + 'px'; b.style.height = sz + 'px';
    });
  };
  V.prototype.focusPoint = function (i) {
    this.btns.forEach(function (b, k) { b.tabIndex = k === i ? 0 : -1; });
    this.btns[i].focus();
  };
  V.prototype.labelPoints = function (t) {
    var s = this.s, self = this;
    var tg = {};
    this.targets.forEach(function (m) { tg[R.mTo(m)] = 1; });
    this.btns.forEach(function (b, i) {
      var what = s.b[i] === R.TIGER ? t('ptTiger') : s.b[i] === R.GOAT ? t('ptGoat') : t('ptEmpty');
      if (i === self.sel) what += ', ' + t('ptSel');
      if (tg[i]) what += ', ' + t('ptTarget');
      b.setAttribute('aria-label', t('ptLabel', { r: ((i / 5) | 0) + 1, c: i % 5 + 1, what: what }));
      b.setAttribute('aria-pressed', i === self.sel ? 'true' : 'false');
    });
  };

  // Rebuild every piece from a position, no animation.
  V.prototype.sync = function (s) {
    this.s = R.clone(s);
    var L = this.L, P = [], i;
    for (i = 0; i < 25; i++) {
      if (s.b[i] === R.TIGER) P.push(this._piece('T', 'b', i, L.G.pts[i]));
      else if (s.b[i] === R.GOAT) P.push(this._piece('G', 'b', i, L.G.pts[i]));
    }
    for (i = 0; i < s.hand; i++) P.push(this._piece('G', 'h', i, L.handSlots[i]));
    for (i = 0; i < Math.min(5, s.cap); i++) {
      var pc = this._piece('G', 'c', i, L.capSlots[i]); pc.rot = (i % 2 ? -0.3 : 0.25); P.push(pc);
    }
    var trapped = {};
    R.trapped(s).forEach(function (t) { trapped[t] = 1; });
    P.forEach(function (p) { if (p.kind === 'T' && trapped[p.i]) p.dim = 1; });
    this.trapped = trapped;
    this.pieces = P;
    if (this.sel >= 0 && !this._own(this.sel)) this.select(-1);
    this.refresh();
  };
  V.prototype.refresh = function () { if (this.L && this.stat) { this.draw(); this.start(); } };
  V.prototype._piece = function (kind, where, i, pt) {
    return { kind: kind, where: where, i: i, x: pt.x, y: pt.y, z: 0, sc: 1, rot: 0, a: 1, dim: 0, dx: 0 };
  };
  V.prototype.pieceAt = function (i) {
    for (var k = 0; k < this.pieces.length; k++) { var p = this.pieces[k]; if (p.where === 'b' && p.i === i) return p; }
    return null;
  };

  // ---- tweens ----
  V.prototype.tween = function (dur, fn, ez, done) {
    dur = dur * this.speed;
    if (this.fast || dur <= 0) { fn(1); if (done) done(); return; }
    this.tweens.push({ t0: this.time, dur: dur, fn: fn, ez: ez || ease.out, done: done });
    this.start();
  };
  V.prototype.busy = function () { return this.tweens.length > 0; };
  // Drop every running animation (new game, leaving mid-move). Pending move callbacks are ignored.
  V.prototype.reset = function () {
    this.gen++; this.tweens = []; this.parts = []; this.drag = null; this.hover = -1; this.shakeAmp = 0; this.over = false;
  };

  // ---- particles ----
  V.prototype.burst = function (x, y, n, kind, col) {
    if (reduce || this.fast) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, sp = kind === 'spark' ? 90 + Math.random() * 260 : 20 + Math.random() * 70;
      this.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'spark' ? 80 : 10), life: 0, max: kind === 'spark' ? 0.45 + Math.random() * 0.35 : 0.6 + Math.random() * 0.5, size: kind === 'spark' ? 1.2 + Math.random() * 2.2 : 4 + Math.random() * 7, kind: kind, col: col || '255,220,120' });
    }
    this.start();
  };
  // One-off effects drawn by the particle pass: 'slash' (three claw marks), 'ring' (a shock ring).
  V.prototype.fx = function (kind, x, y, r, col, max) {
    if (this.fast || (reduce && kind === 'slash')) return;
    this.parts.push({ kind: kind, x: x, y: y, vx: 0, vy: 0, r: r, col: col || '255,90,50', life: 0, max: max || 0.45, ang: -0.7 + Math.random() * 0.4 });
    this.start();
  };
  V.prototype.shake = function (amp) { if (!reduce) { this.shakeAmp = Math.max(this.shakeAmp, amp); this.start(); } };

  // ---- animation of a move (state s is the position before m) ----
  V.prototype.animate = function (m, opts, done) {
    var self = this, L = this.L, s = this.s, f = R.mFrom(m), t = R.mTo(m), c = R.mCap(m);
    var to = L.G.pts[t];
    opts = opts || {};
    this.select(-1);
    var after = R.apply(s, m);
    var gen = this.gen;
    var finish = function () {
      if (gen !== self.gen) return; // the board was reset mid-move
      self.lastMove = m;
      var before = self.trapped;
      self.sync(after);
      // tigers that just got stuck shake and dim; freed ones light back up
      var newly = [];
      Object.keys(self.trapped).forEach(function (k) { if (!before[k]) newly.push(+k); });
      newly.forEach(function (k) {
        var p = self.pieceAt(k); if (!p) return;
        p.dim = 0;
        self.tween(520, function (e) { p.dx = Math.sin(e * 26) * (1 - e) * L.G.g * 0.07; p.dim = e; }, ease.lin);
      });
      if (done) done({ newlyTrapped: newly.length, freed: Object.keys(before).filter(function (k) { return !self.trapped[k]; }).length });
    };
    if (f < 0) {
      // a goat leaves the trough and drops onto the point
      var hp = null;
      for (var k = this.pieces.length - 1; k >= 0; k--) if (this.pieces[k].where === 'h') { hp = this.pieces[k]; break; }
      if (opts.piece) hp = opts.piece;
      if (!hp) { finish(); return; }
      var x0 = hp.x, y0 = hp.y, z0 = hp.z;
      var sc0 = (hp.where === 'h' ? L.handR : L.G.rg) * hp.sc / L.G.rg;
      hp.where = 'f'; hp.sc = sc0;
      var dist = Math.hypot(to.x - x0, to.y - y0);
      this.tween(Math.min(420, 180 + dist * 0.9), function (e) {
        hp.x = x0 + (to.x - x0) * e; hp.y = y0 + (to.y - y0) * e;
        hp.z = z0 * (1 - e) + Math.sin(Math.PI * e) * Math.min(1, dist / 200) * 0.9;
        hp.sc = sc0 + (1 - sc0) * e;
      }, ease.inOut, function () {
        hp.z = 0;
        self.on.sfx('place');
        self.burst(to.x, to.y + L.G.rg * 0.6, 7, 'dust');
        self.tween(160, function (e) { hp.sc = 1 + Math.sin(Math.PI * e) * 0.08; }, ease.lin, finish);
      });
      return;
    }
    var p = this.pieceAt(f);
    if (!p) { finish(); return; }
    var sx = p.x, sy = p.y, sz = p.z;
    if (c < 0) {
      this.tween(opts.dragged ? 140 : 260, function (e) {
        p.x = sx + (to.x - sx) * e; p.y = sy + (to.y - sy) * e; p.z = sz * (1 - e) + Math.sin(Math.PI * e) * 0.25 * (opts.dragged ? 0 : 1);
      }, ease.out, function () {
        p.z = 0;
        self.on.sfx(p.kind === 'T' ? 'tstep' : 'gstep');
        self.burst(to.x, to.y + L.G.rt * 0.6, 4, 'dust');
        finish();
      });
      return;
    }
    // capture: the tiger leaps in an arc, the goat is knocked off and tumbles into the tray
    var gp = this.pieceAt(c), knocked = false;
    var slot = L.capSlots[Math.min(4, s.cap)];
    var dur = opts.dragged ? 240 : 520;
    var knock = function (e) {
      if (!knocked && e > (opts.dragged ? 0.15 : 0.42) && gp) {
        knocked = true;
        self.on.sfx('bleat');
        self.fx('slash', gp.x, gp.y, L.G.rg * 1.25, '255,80,40', 0.42);
        self.fx('ring', gp.x, gp.y, L.G.g * 0.55, '255,90,50', 0.4);
        self.burst(gp.x, gp.y, 10, 'spark', '255,120,70');
        var gx = gp.x, gy = gp.y;
        gp.where = 'f';
        var spin = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 2);
        self.tween(820, function (k) {
          // pop up, then fall into the socket with a spin
          gp.x = gx + (slot.x - gx) * ease.inOut(k);
          gp.y = gy + (slot.y - gy) * ease.inOut(k);
          gp.z = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 1.4;
          gp.rot = spin * k * TAU / 3;
          gp.sc = 1 - (1 - L.capR / L.G.rg) * k;
        }, ease.lin, function () { self.on.sfx('thud'); self.burst(slot.x, slot.y, 5, 'dust'); self.fx('ring', slot.x, slot.y, L.capR * 1.7, '255,110,60', 0.5); });
      }
    };
    var land = function () {
      p.z = 0;
      self.on.sfx('roar');
      self.shake(L.G.g * 0.13);
      self.burst(to.x, to.y, 18, 'spark');
      self.burst(to.x, to.y + L.G.rt * 0.6, 9, 'dust');
      self.fx('ring', to.x, to.y, L.G.g * 0.7, '255,200,110', 0.35);
      // squash on landing, then wait for the goat to reach the tray before handing back control
      self.tween(200, function (e) { p.sc = 1 + 0.16 * Math.sin(Math.PI * e) * (1 - e); }, ease.lin);
      var wait = function () { if (gen !== self.gen) return; if (self.tweens.length > 0) { setTimeout(wait, 40); } else finish(); };
      if (self.fast) finish(); else wait();
    };
    var leap = function () {
      self.on.sfx('leap');
      self.tween(dur, function (e) {
        p.x = sx + (to.x - sx) * e; p.y = sy + (to.y - sy) * e;
        p.z = sz * (1 - e) + Math.sin(Math.PI * e) * (opts.dragged ? 0.7 : 1.9);
        p.sc = 1 + 0.06 * Math.sin(Math.PI * e);
        knock(e);
      }, ease.inOut, land);
    };
    if (opts.dragged || reduce || this.fast) { leap(); return; }
    // a short crouch before the pounce
    this.tween(110, function (e) { p.sc = 1 - 0.1 * e; }, ease.out, leap);
  };

  // End of game: the winners celebrate on the board (a hop rippling out from the middle, sparks).
  V.prototype.celebrate = function (w) {
    var self = this, G = this.L.G;
    if (this.fast || reduce) return;
    var ctr = G.pts[12], list = this.pieces.filter(function (p) { return p.where === 'b' && (w === 'D' || p.kind === w); });
    list.forEach(function (p) { p.delay = Math.hypot(p.x - ctr.x, p.y - ctr.y) / G.g * 90; });
    var hop = w === 'T' ? 0.9 : w === 'D' ? 0.25 : 0.55;
    var gen = this.gen;
    this.tween(1300, function (e) {
      var ms = e * 1300;
      list.forEach(function (p) {
        var k = Math.max(0, Math.min(1, (ms - p.delay) / 420));
        p.z = Math.sin(Math.PI * k) * hop;
        if (w === 'T') p.sc = 1 + 0.18 * Math.sin(Math.PI * k);
      });
    }, ease.lin, function () { list.forEach(function (p) { p.z = 0; p.sc = 1; }); });
    if (w === 'D') return;
    var col = w === 'T' ? '255,110,60' : '255,226,140';
    [0, 260, 520].forEach(function (d, i) {
      setTimeout(function () {
        if (gen !== self.gen || !self.visible) return;
        var at = list.length ? list[(i * 5) % list.length] : ctr;
        self.burst(at.x, at.y, 20, 'spark', col);
        self.fx('ring', at.x, at.y, G.g * 1.1, col, 0.6);
      }, d);
    });
    if (w === 'T') this.shake(G.g * 0.08);
  };

  // ---- selection / targets ----
  V.prototype._own = function (i) {
    var s = this.s;
    if (!this.side) return false;
    if (this.side === 'T') return s.turn === R.T && s.b[i] === R.TIGER;
    return s.turn === R.G && s.b[i] === R.GOAT && s.hand === 0;
  };
  V.prototype.legal = function () {
    var ms = R.moves(this.s);
    if (this.only) { var o = this.only; ms = ms.filter(function (m) { return o.indexOf(m) >= 0; }); }
    return ms;
  };
  V.prototype.select = function (i) {
    this.sel = i;
    var self = this;
    this.targets = i >= 0 ? this.legal().filter(function (m) { return R.mFrom(m) === i; }) : [];
    if (i >= 0) this.on.sfx('pick');
    if (this.on.selChange) this.on.selChange(i);
    this.refresh();
  };
  V.prototype.dropTargets = function () {
    var s = this.s;
    if (!this.side || this.side !== 'G' || s.turn !== R.G || s.hand === 0) return [];
    return this.legal();
  };

  // ---- input ----
  V.prototype._xy = function (e) {
    var r = this.cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  V.prototype.hit = function (x, y, radius) {
    var G = this.L.G, best = -1, bd = (radius || 0.48) * G.g;
    for (var i = 0; i < 25; i++) {
      var d = Math.hypot(G.pts[i].x - x, G.pts[i].y - y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  V.prototype._inHand = function (x, y) {
    var h = this.L.hand; return x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h;
  };
  V.prototype.canAct = function () { return !!this.side && !this.busy() && !this.locked; };

  V.prototype._bind = function () {
    var self = this, cv = this.cv;
    cv.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      var p = self._xy(e);
      self.down(p.x, p.y, e.pointerId);
      if (self.drag) { try { cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } }
    });
    cv.addEventListener('pointermove', function (e) { if (self.drag) { var p = self._xy(e); self.moveTo(p.x, p.y); } });
    var end = function (e) { if (self.drag) { var p = self._xy(e); self.up(p.x, p.y); } };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', function () { if (self.drag) self.cancelDrag(); });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  };

  V.prototype.down = function (x, y) {
    if (!this.canAct()) return;
    var s = this.s, i = this.hit(x, y), side = this.side;
    var myTurn = (side === 'G' && s.turn === R.G) || (side === 'T' && s.turn === R.T);
    if (!myTurn) return;
    if (side === 'G' && s.hand > 0) {
      if (this._inHand(x, y)) {
        var hp = null;
        for (var k = this.pieces.length - 1; k >= 0; k--) if (this.pieces[k].where === 'h') { hp = this.pieces[k]; break; }
        if (hp) { this.drag = { kind: 'hand', piece: hp, x0: x, y0: y, px: hp.x, py: hp.y, moved: false }; this.on.sfx('pick'); this.start(); }
        return;
      }
      if (i < 0) return;
      if (s.b[i] === R.EMPTY) { this._try(R.enc(-1, i, -1)); return; }
      this.on.msg(s.b[i] === R.TIGER ? 'notYours' : 'tDrop');
      return;
    }
    if (i < 0) { this.select(-1); return; }
    if (this._own(i)) {
      var ms = this.legal().filter(function (m) { return R.mFrom(m) === i; });
      if (!ms.length) {
        var pc = this.pieceAt(i);
        if (pc) this.tween(300, function (e) { pc.dx = Math.sin(e * 20) * (1 - e) * 4; }, ease.lin);
        this.on.msg(this.only ? 'learnOops' : 'stuckPiece'); this.on.sfx('nope');
        return;
      }
      var was = this.sel === i;
      this.select(i);
      var p = this.pieceAt(i);
      this.drag = { kind: 'board', i: i, piece: p, x0: x, y0: y, px: p.x, py: p.y, moved: false, was: was };
      this.start();
      return;
    }
    if (this.sel >= 0) {
      var m = this.targets.filter(function (mm) { return R.mTo(mm) === i; })[0];
      if (m) { this._try(m); return; }
      if (s.b[i] === R.EMPTY) { this.on.msg('cantGo'); this.on.sfx('nope'); }
      this.select(-1);
      return;
    }
    if (s.b[i] !== R.EMPTY) this.on.msg('notYours');
  };
  V.prototype.moveTo = function (x, y) {
    var d = this.drag; if (!d) return;
    if (!d.moved && Math.hypot(x - d.x0, y - d.y0) < 7) return;
    d.moved = true;
    d.piece.x = d.px + (x - d.x0); d.piece.y = d.py + (y - d.y0); d.piece.z = 0.55;
    if (d.kind === 'hand') d.piece.sc = Math.min(this.L.G.rg / this.L.handR, 1 + Math.hypot(x - d.x0, y - d.y0) / 60 * (this.L.G.rg / this.L.handR - 1));
    var i = this.hit(d.piece.x, d.piece.y, 0.6);
    var ok = d.kind === 'hand' ? (i >= 0 && this.s.b[i] === R.EMPTY && this.legal().indexOf(R.enc(-1, i, -1)) >= 0) : (i >= 0 && this.targets.some(function (m) { return R.mTo(m) === i; }));
    if (ok && i !== this.hover) this.on.sfx('hover');
    this.hover = ok ? i : -1;
  };
  V.prototype.up = function (x, y) {
    var d = this.drag; if (!d) return;
    this.drag = null; this.hover = -1;
    if (!d.moved) {
      if (d.kind === 'board' && d.was) this.select(-1);
      else if (d.kind === 'board') this.on.msg('pickTarget');
      return;
    }
    var i = this.hit(d.piece.x, d.piece.y, 0.6);
    if (d.kind === 'hand') {
      var pm = i >= 0 ? R.enc(-1, i, -1) : 0;
      if (i >= 0 && this.legal().indexOf(pm) >= 0) { this._try(pm, { dragged: true, piece: d.piece }); return; }
      this._snapBack(d);
      if (i >= 0 && this.only) this.on.msg('learnOops');
      return;
    }
    var m = this.targets.filter(function (mm) { return R.mTo(mm) === i; })[0];
    if (m) { this._try(m, { dragged: true }); return; }
    this._snapBack(d);
    if (i >= 0 && i !== d.i) { this.on.msg(this.only ? 'learnOops' : 'cantGo'); this.on.sfx('nope'); }
  };
  V.prototype._snapBack = function (d) {
    var p = d.piece, x0 = p.x, y0 = p.y, z0 = p.z, s0 = p.sc, self = this;
    this.tween(200, function (e) { p.x = x0 + (d.px - x0) * e; p.y = y0 + (d.py - y0) * e; p.z = z0 * (1 - e); p.sc = s0 + (1 - s0) * e; }, ease.back, function () { self.sync(self.s); });
  };
  V.prototype.cancelDrag = function () { var d = this.drag; this.drag = null; this.hover = -1; if (d && d.moved) this._snapBack(d); };
  V.prototype._try = function (m, opts) {
    if (this.only && this.only.indexOf(m) < 0) { this.on.msg('learnOops'); this.on.sfx('nope'); return; }
    this.on.move(m, opts || {});
  };
  // keyboard / test path: a tap with no drag
  V.prototype.tapPoint = function (i) {
    var p = this.L.G.pts[i];
    this.down(p.x, p.y);
    if (this.drag) this.up(p.x, p.y);
  };

  // ---- loop ----
  V.prototype.start = function () {
    if (this.running || this.manual) return;
    this.running = true;
    var self = this, last = performance.now();
    var frame = function (now) {
      if (!self.running) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      self.step(dt);
      if (self.alive()) requestAnimationFrame(frame); else self.running = false;
    };
    requestAnimationFrame(frame);
  };
  V.prototype.stop = function () { this.running = false; };
  // keep drawing while anything moves, glows or the computer is thinking
  V.prototype.alive = function () {
    return this.visible && (this.tweens.length || this.parts.length || this.drag || this.shakeAmp > 0.2 || this.sel >= 0 || this.thinking || this.hints || this.dropTargets().length || (this.only && this.side) || this.pulse);
  };
  V.prototype.step = function (dt) {
    this.time += dt * 1000;
    var now = this.time, i;
    var list = this.tweens.slice();
    for (i = 0; i < list.length; i++) {
      var tw = list[i], k = Math.min(1, (now - tw.t0) / tw.dur);
      tw.fn(tw.ez(k));
      if (k >= 1) { var idx = this.tweens.indexOf(tw); if (idx >= 0) this.tweens.splice(idx, 1); if (tw.done) tw.done(); }
    }
    for (i = this.parts.length - 1; i >= 0; i--) {
      var p = this.parts[i];
      p.life += dt;
      if (p.life >= p.max) { this.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'spark') p.vy += 520 * dt; else if (p.kind === 'dust') { p.vx *= 0.92; p.vy *= 0.92; }
    }
    this.shakeAmp *= Math.pow(0.0009, dt);
    this.draw();
  };
  V.prototype.flush = function () { // test hook: finish all tweens now
    var guard = 0;
    while ((this.tweens.length || this.parts.length) && guard++ < 400) this.step(0.05);
    this.draw();
  };

  // ---- drawing ----
  V.prototype.draw = function () {
    var ctx = this.ctx, d = this.dpr, L = this.L, G = L.G, t = this.time / 1000, self = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    var sx = 0, sy = 0;
    if (this.shakeAmp > 0.2) { sx = (Math.random() * 2 - 1) * this.shakeAmp; sy = (Math.random() * 2 - 1) * this.shakeAmp; }
    ctx.setTransform(1, 0, 0, 1, sx * d, sy * d);
    ctx.drawImage(this.stat, 0, 0);
    ctx.setTransform(d, 0, 0, d, sx * d, sy * d);

    var pulse = 0.5 + 0.5 * Math.sin(t * 5);
    // last move ghost
    if (this.lastMove && !this.drag) {
      var lf = R.mFrom(this.lastMove), lt = R.mTo(this.lastMove);
      ctx.lineWidth = 1.5;
      if (lf >= 0) { ctx.beginPath(); ctx.arc(G.pts[lf].x, G.pts[lf].y, G.g * 0.2, 0, TAU); ctx.strokeStyle = 'rgba(255,214,140,0.35)'; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.beginPath(); ctx.arc(G.pts[lt].x, G.pts[lt].y, G.rt * 1.12, 0, TAU); ctx.strokeStyle = 'rgba(255,214,140,0.28)'; ctx.stroke();
    }
    // goat drop targets: a lamp-glow ring on every empty point, rippling across the board
    var drops = this.dropTargets();
    this.topHand = null;
    if (drops.length && !this.busy()) {
      var unsafe = {};
      if (this.hints) R.unsafeDrops(this.s).forEach(function (u) { unsafe[u] = 1; });
      drops.forEach(function (m) {
        var to = R.mTo(m), q = G.pts[to], hov = self.hover === to, bad = unsafe[to];
        var ph = reduce ? 0.6 : 0.5 + 0.5 * Math.sin(t * 3.4 - (q.x - G.x + (q.y - G.y) * 0.6) / G.g * 1.1);
        var rgb = bad ? '255,96,60' : '255,214,130';
        self._glow(q.x, q.y, G.g * (hov ? 0.42 : 0.3), rgb, hov ? 0.95 : 0.3 + 0.32 * ph);
        ctx.lineWidth = Math.max(1.6, G.g * 0.03);
        ctx.beginPath(); ctx.arc(q.x, q.y, G.g * (hov ? 0.2 : 0.15 + 0.025 * ph), 0, TAU);
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (hov ? 0.95 : 0.4 + 0.45 * ph).toFixed(2) + ')'; ctx.stroke();
        if (bad) {
          var u = G.g * 0.07; ctx.strokeStyle = 'rgba(255,110,80,0.9)';
          ctx.beginPath(); ctx.moveTo(q.x - u, q.y - u); ctx.lineTo(q.x + u, q.y + u); ctx.moveTo(q.x + u, q.y - u); ctx.lineTo(q.x - u, q.y + u); ctx.stroke();
        }
      });
      // the next goat in the trough lifts a little: pick me up
      if (!this.drag) for (var hk = this.pieces.length - 1; hk >= 0; hk--) if (this.pieces[hk].where === 'h') { this.topHand = this.pieces[hk]; break; }
    }
    // tutorial: point at the piece to move, and where it should go
    if (this.only && this.side && this.sel < 0 && !this.busy() && !this.drag) {
      this.only.forEach(function (m) {
        var f = R.mFrom(m); if (f < 0) return;
        var fp = G.pts[f], tp = G.pts[R.mTo(m)];
        self._glow(fp.x, fp.y, G.rt * 1.7, '255,215,120', 0.45 + 0.4 * pulse);
        self._glow(tp.x, tp.y, G.g * 0.3, '255,215,120', 0.3 + 0.3 * pulse);
      });
    }
    // move targets
    this.victims = {};
    if (this.sel >= 0) {
      var sp = G.pts[this.sel];
      this._glow(sp.x, sp.y, G.rt * 1.5, '255,215,120', 0.55 + 0.25 * pulse);
      this.targets.forEach(function (m) {
        var q = G.pts[R.mTo(m)], cap = R.mCap(m) >= 0, hov = self.hover === R.mTo(m);
        if (cap) self.victims[R.mCap(m)] = 1;
        self._glow(q.x, q.y, G.g * (hov ? 0.42 : 0.3), cap ? '255,96,50' : '255,215,120', (hov ? 1 : 0.6) + 0.3 * pulse);
        ctx.beginPath(); ctx.arc(q.x, q.y, G.g * 0.11, 0, TAU); ctx.fillStyle = cap ? 'rgba(255,120,70,0.95)' : 'rgba(255,232,160,0.9)'; ctx.fill();
        ctx.beginPath(); ctx.arc(q.x, q.y, G.g * (0.19 + 0.03 * pulse), 0, TAU);
        ctx.strokeStyle = cap ? 'rgba(255,110,60,' + (0.6 + 0.4 * pulse).toFixed(2) + ')' : 'rgba(255,226,150,' + (0.45 + 0.4 * pulse).toFixed(2) + ')';
        ctx.lineWidth = Math.max(1.6, G.g * 0.03); ctx.stroke();
        if (cap) {
          // arc showing the leap over the goat
          var a = G.pts[self.sel], c = G.pts[R.mCap(m)];
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x + (c.y - a.y) * 0.25, c.y - (c.x - a.x) * 0.25 - G.g * 0.25, q.x, q.y);
          ctx.strokeStyle = 'rgba(255,120,70,' + (0.45 + 0.4 * pulse).toFixed(2) + ')'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
        }
      });
    }

    // pieces: resting first, flying / lifted last
    var P = this.pieces.slice().sort(function (a, b) { return (a.z + (a.where === 'f' ? 0.01 : 0)) - (b.z + (b.where === 'f' ? 0.01 : 0)); });
    var danger = {};
    var showHints = this.hints && !this.busy() && !this.over;
    if (showHints) R.inDanger(this.s).forEach(function (g) { danger[g] = 1; });
    var mob = showHints;
    P.forEach(function (p) { self._drawPiece(p, t, danger, mob); });
    // brass ring around the picked-up piece
    if (this.sel >= 0 && !this.drag) {
      var sq = G.pts[this.sel], rr = (this.s.b[this.sel] === R.TIGER ? G.rt : G.rg) * (1.14 + 0.04 * pulse);
      ctx.beginPath(); ctx.arc(sq.x, sq.y, rr, 0, TAU);
      ctx.strokeStyle = 'rgba(255,226,150,' + (0.7 + 0.3 * pulse).toFixed(2) + ')'; ctx.lineWidth = Math.max(2, G.g * 0.035); ctx.stroke();
    }
    // tutorial: a pulsing ring on the piece to use
    if (this.only && this.side && this.sel < 0 && !this.busy() && !this.drag) {
      this.only.forEach(function (m) {
        var f = R.mFrom(m); if (f < 0) return;
        var fq = G.pts[f], fr = (self.s.b[f] === R.TIGER ? G.rt : G.rg) * (1.12 + 0.1 * pulse);
        ctx.beginPath(); ctx.arc(fq.x, fq.y, fr, 0, TAU);
        ctx.strokeStyle = 'rgba(255,226,150,' + (0.5 + 0.5 * pulse).toFixed(2) + ')'; ctx.lineWidth = Math.max(2, G.g * 0.03); ctx.stroke();
      });
    }

    // particles
    this.parts.forEach(function (p) {
      var k = p.life / p.max;
      if (p.kind === 'spark') {
        ctx.fillStyle = 'rgba(' + p.col + ',' + (1 - k).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - k * 0.5), 0, TAU); ctx.fill();
      } else if (p.kind === 'ring') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.35 + 0.65 * ease.out(k)), 0, TAU);
        ctx.strokeStyle = 'rgba(' + p.col + ',' + (0.85 * (1 - k)).toFixed(2) + ')'; ctx.lineWidth = Math.max(1.5, p.r * 0.09 * (1 - k)); ctx.stroke();
      } else if (p.kind === 'slash') {
        // three claw marks raked across the goat
        var grow = ease.out(Math.min(1, k * 2.6)), fade = k < 0.5 ? 1 : 1 - (k - 0.5) * 2;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.lineCap = 'round';
        for (var ci = -1; ci <= 1; ci++) {
          var ox = ci * p.r * 0.32, len = p.r * (ci === 0 ? 1.1 : 0.9) * grow;
          ctx.beginPath(); ctx.moveTo(ox - len * 0.1, -len / 2); ctx.quadraticCurveTo(ox + p.r * 0.18, 0, ox - len * 0.1, len / 2);
          ctx.strokeStyle = 'rgba(255,240,200,' + (0.9 * fade).toFixed(2) + ')'; ctx.lineWidth = p.r * 0.16; ctx.stroke();
          ctx.strokeStyle = 'rgba(' + p.col + ',' + fade.toFixed(2) + ')'; ctx.lineWidth = p.r * 0.09; ctx.stroke();
        }
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(190,140,90,' + (0.28 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + k), 0, TAU); ctx.fill();
      }
    });
  };

  V.prototype._glow = function (x, y, r, rgb, a) {
    var ctx = this.ctx, g = ctx.createRadialGradient(x, y, 0, x, y, r);
    a = Math.max(0, Math.min(1, a));
    g.addColorStop(0, 'rgba(' + rgb + ',' + (a * 0.9).toFixed(3) + ')');
    g.addColorStop(0.55, 'rgba(' + rgb + ',' + (a * 0.35).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };

  V.prototype._drawPiece = function (p, t, danger, mob) {
    var ctx = this.ctx, L = this.L, G = L.G, d = this.dpr;
    var tiger = p.kind === 'T';
    var baseR = tiger ? G.rt : (p.where === 'h' ? L.handR : (p.where === 'c' ? L.capR : G.rg));
    if (p.where === 'f' && !tiger) baseR = G.rg;
    var think = this.thinking === p.kind && p.where === 'b';
    var bob = 0, breathe = 1, invite = p === this.topHand;
    if (invite) {
      bob = reduce ? 0.2 : 0.22 + 0.14 * Math.sin(t * 4.2);
      this._glow(p.x, p.y - L.handR * 0.2, L.handR * 2.1, '255,214,130', 0.5 + (reduce ? 0 : 0.25 * Math.sin(t * 4.2)));
    }
    if (think && !reduce) {
      if (tiger) breathe = 1 + 0.035 * Math.sin(t * 6 + p.i);
      else bob = 0.06 * (0.5 + 0.5 * Math.sin(t * 7 + p.i * 1.7));
    }
    var z = p.z + bob;
    var sc = p.sc * breathe * (1 + z * 0.22);
    var r = baseR * sc;
    var x = p.x + p.dx, y = p.y - z * baseR * 0.7;
    if (p.where === 'h' && !invite) { // small goats in the trough, a little stacked look
      A.shadow(ctx, x + 1, y + baseR * 0.25, baseR, 0.7);
    } else {
      A.shadow(ctx, p.x + p.dx + baseR * (0.12 + z * 0.4), p.y + baseR * (0.2 + z * 0.5), baseR * (1 + z * 0.15), Math.max(0.25, 1 - z * 0.35));
    }
    if (think && tiger) this._glow(x, y, r * 1.55, '255,170,60', 0.25 + 0.2 * Math.sin(t * 5));
    if ((danger[p.i] || (this.victims && this.victims[p.i])) && p.where === 'b' && !tiger) this._glow(x, y, r * 1.6, '255,60,40', 0.45 + 0.35 * Math.sin(t * 7));
    var sp = tiger ? this.spT : (r <= L.handR * 1.25 ? this.spGs : this.spG);
    var drawR = sp.r / d, scale = r / drawR;
    ctx.save();
    ctx.translate(x, y);
    if (p.rot) ctx.rotate(p.rot);
    ctx.globalAlpha = p.a;
    var sz = sp.size / d * scale;
    ctx.drawImage(sp.c, -sz / 2, -sz / 2, sz, sz);
    if (think && tiger) {
      // eyes light up while the bagh is thinking
      var ga = 0.55 + 0.45 * Math.sin(t * 6);
      ctx.globalCompositeOperation = 'lighter';
      [-1, 1].forEach(function (s) {
        var ex = s * 0.23 * r, ey = -0.12 * r, gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 0.2);
        gr.addColorStop(0, 'rgba(255,200,60,' + ga.toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,120,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, ey, r * 0.2, 0, TAU); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    if (p.dim > 0) {
      ctx.globalAlpha = 0.55 * p.dim;
      ctx.beginPath(); ctx.arc(0, 0, r * 1.01, 0, TAU); ctx.fillStyle = '#0a0402'; ctx.fill();
      ctx.globalAlpha = p.dim;
      // a dark iron ring = stuck
      ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, TAU); ctx.strokeStyle = 'rgba(30,20,15,0.9)'; ctx.lineWidth = r * 0.12; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, TAU); ctx.strokeStyle = 'rgba(160,150,140,0.5)'; ctx.lineWidth = r * 0.03; ctx.setLineDash([r * 0.12, r * 0.08]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    // hint pips: how many moves this tiger has
    if (mob && tiger && p.where === 'b') {
      var n = R.tigerMobility(this.s, p.i);
      for (var k = 0; k < n; k++) {
        var a = Math.PI / 2 + (k - (n - 1) / 2) * 0.32;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 1.22, y + Math.sin(a) * r * 1.22, Math.max(2, r * 0.09), 0, TAU);
        ctx.fillStyle = '#ffe08a'; ctx.fill(); ctx.strokeStyle = '#3a1d05'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  };

  // For the story image and the home screen: draw a finished position onto any canvas.
  function drawPosition(ctx, G, s, opts) {
    opts = opts || {};
    A.board(ctx, G, 7);
    var trapped = {};
    R.trapped(s).forEach(function (t) { trapped[t] = 1; });
    for (var i = 0; i < 25; i++) {
      var p = G.pts[i];
      if (s.b[i] === R.TIGER) {
        A.shadow(ctx, p.x + G.rt * 0.12, p.y + G.rt * 0.2, G.rt, 1);
        A.tiger(ctx, p.x, p.y, G.rt);
        if (trapped[i] && opts.dimTrapped !== false) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, G.rt, 0, TAU); ctx.fillStyle = '#0a0402'; ctx.fill(); ctx.globalAlpha = 1; }
      } else if (s.b[i] === R.GOAT) {
        A.shadow(ctx, p.x + G.rg * 0.12, p.y + G.rg * 0.2, G.rg, 1);
        A.goat(ctx, p.x, p.y, G.rg);
      }
    }
  }

  root.BCView = { View: V, drawPosition: drawPosition, reduce: reduce };
})(this);
