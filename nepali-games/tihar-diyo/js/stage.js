// Tihar Diyo: the live stage. Owns one canvas: lays out the house, keeps the static backdrop cached,
// animates tiles (spring snap), oil spreading tile by tile, diyo flames, petals and sparks, and turns
// taps, holds, right-clicks and keys into moves. Game rules live in rules.js; this file only shows them.
(function (root) {
  'use strict';
  var A = root.TDA;
  var TAU = Math.PI * 2;
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  var HOLD_MS = 380;
  var reduced = false;
  try { reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* old browser */ }

  function Stage(canvas, opts) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = opts || {};
    this.bg = document.createElement('canvas');
    this.board = null;
    this.pal = A.PAL.kaag;
    this.palKey = 'kaag';
    this.t = 0;
    this.parts = [];
    this.shake = 0;
    this.flare = 0;
    this.focus = -1;
    this.kbd = false;
    this.lockInput = false;
    this.lit = null;
    this.nextFw = 3;
    this.seed = 7;
    this.dirty = true;
    if (this.o.interactive) this.bindInput();
  }
  var P = Stage.prototype;

  P.setBoard = function (board, palKey, seed) {
    this.board = board;
    this.palKey = palKey || 'kaag';
    this.pal = A.PAL[this.palKey];
    this.seed = seed || 7;
    var n = board.cells.length;
    this.ang = new Float32Array(n); this.vel = new Float32Array(n);
    this.fill = new Float32Array(n); this.bump = new Float32Array(n); this.hint = new Float32Array(n); this.pop = new Float32Array(n);
    this.press = null;
    this.litNow = new Uint8Array(n);
    this.flow = null;
    this.parts.length = 0;
    this.flare = 0; this.shake = 0; this.celebrating = false; this.waitWin = null;
    this.focus = -1;
    this.lockInput = false;
    this.dirty = true;
    this.resize();
  };
  P.sync = function (flow) { this.flow = flow; };
  P.fillAll = function () { if (this.fill) this.fill.fill(1); };

  P.resize = function () {
    var r = this.cv.getBoundingClientRect();
    var w = Math.max(200, Math.round(r.width)), h = Math.max(200, Math.round(r.height));
    var dpr = Math.min(root.devicePixelRatio || 1, 2.5);
    if (w === this.w && h === this.h && dpr === this.dpr && !this.dirty) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    if (!this.board) return;
    this.L = A.layout(w, h, this.board.w, this.board.h, { maxTile: this.o.maxTile });
    this.bg.width = this.cv.width; this.bg.height = this.cv.height;
    var b = this.bg.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    A.paintBackdrop(b, this.L, this.pal, this.seed);
    this.dirty = false;
  };

  // ---------- events from the game ----------
  P.turned = function (i, dir) {
    // the model already turned: start the drawing a quarter turn back and let the spring bring it home
    this.ang[i] -= dir * Math.PI / 2;
    this.fill[i] = 0;
    this.pop[i] = 1;
    this.spark(i, 'dust');
  };
  P.blocked = function (i) { this.bump[i] = 0.35; };
  P.hintMark = function (i) {
    this.hint[i] = 1;
    var c = this.center(i);
    if (!c) return;
    for (var k = 0; k < 4; k++) this.parts.push({ k: 'foot', x: c[0] + (k % 2 ? 6 : -6), y: c[1] + 30 - k * 16, life: 0, max: 1.6, delay: k * 0.18, side: k % 2 ? 1 : -1 });
  };
  P.celebrate = function () {
    this.celebrating = true;
    this.flare = 1;
    if (!reduced) this.shake = 0.5;
    var L = this.L, self = this;
    if (!L) return;
    var n = reduced ? 30 : 110;
    for (var k = 0; k < n; k++) {
      this.parts.push({ k: 'petal', x: Math.random() * L.W, y: -10 - Math.random() * L.H * 0.6, vx: (Math.random() - 0.5) * 30, vy: 40 + Math.random() * 60,
        rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, life: 0, max: 5 + Math.random() * 2, size: 3 + Math.random() * 4,
        col: Math.random() < 0.6 ? self.pal.garland[0] : self.pal.garland[1] });
    }
    // phuljhadi sparks from every diyo
    this.board.cells.forEach(function (c, i) {
      if (!c.diyo) return;
      var p = self.center(i);
      for (var j = 0; j < (reduced ? 4 : 14); j++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 60 + Math.random() * 160;
        self.parts.push({ k: 'spark', x: p[0], y: p[1] - L.s * 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + Math.random() * 0.7, col: Math.random() < 0.5 ? '#fff3c4' : '#ffb83a' });
      }
    });
    for (var f = 0; f < (reduced ? 1 : 4); f++) this.firework(L.W * (0.15 + Math.random() * 0.7), Math.max(10, L.roofTop * (0.3 + Math.random() * 0.5)), 1.2, f * 0.25);
  };
  P.firework = function (x, y, big, delay) {
    var cols = ['#ffd23f', '#ff5a3c', '#5ad1ff', '#7dff8a', '#ff8ad8', '#fff4e0'];
    var col = cols[Math.floor(Math.random() * cols.length)], n = Math.round(22 * big);
    for (var k = 0; k < n; k++) {
      var a = k / n * TAU, v = (40 + Math.random() * 30) * big;
      this.parts.push({ k: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.9 + Math.random() * 0.5, col: col, delay: delay || 0, drag: 1.6 });
    }
  };
  P.spark = function (i, kind) {
    var p = this.center(i);
    if (!p || reduced) return;
    var s = this.L.s;
    if (kind === 'dust') {
      for (var k = 0; k < 3; k++) this.parts.push({ k: 'spark', x: p[0] + (Math.random() - 0.5) * s * 0.6, y: p[1] + (Math.random() - 0.5) * s * 0.6, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 20, life: 0, max: 0.35, col: 'rgba(255,220,160,0.6)' });
    } else if (kind === 'light') {
      this.parts.push({ k: 'ring', x: p[0], y: p[1] - s * 0.15, life: 0, max: 0.6, size: s * 0.9 });
      for (var j = 0; j < 8; j++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * 2, v = 50 + Math.random() * 70;
        this.parts.push({ k: 'spark', x: p[0], y: p[1] - s * 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + Math.random() * 0.3, col: '#ffd76a' });
      }
    } else if (kind === 'wind') {
      for (var w = 0; w < 6; w++) this.parts.push({ k: 'streak', x: p[0] - s * 0.8, y: p[1] + (w - 3) * s * 0.12, vx: 220 + Math.random() * 80, vy: 0, life: 0, max: 0.4, col: 'rgba(200,230,255,0.7)', delay: w * 0.03 });
    }
  };

  P.center = function (i) {
    if (!this.L) return null;
    var L = this.L, x = i % this.board.w, y = Math.floor(i / this.board.w);
    return [L.gx + x * L.s + L.s / 2, L.gy + y * L.s + L.s / 2];
  };
  P.cellAt = function (px, py) {
    var L = this.L;
    if (!L || !this.board) return -1;
    var x = Math.floor((px - L.gx) / L.s), y = Math.floor((py - L.gy) / L.s);
    if (x < 0 || y < 0 || x >= this.board.w || y >= this.board.h) return -1;
    return y * this.board.w + x;
  };

  // ---------- simulation ----------
  P.tick = function (dt) {
    if (!this.board) return;
    dt = Math.min(dt, 0.05);
    this.t += dt;
    var b = this.board, n = b.cells.length, i, f = this.flow;
    // tile springs: a soft snap with a little overshoot (none with reduced motion)
    var k = reduced ? 900 : 520, c = reduced ? 60 : 30;
    for (i = 0; i < n; i++) {
      if (this.ang[i] !== 0 || this.vel[i] !== 0) {
        this.vel[i] += (-k * this.ang[i] - c * this.vel[i]) * dt;
        this.ang[i] += this.vel[i] * dt;
        if (Math.abs(this.ang[i]) < 0.002 && Math.abs(this.vel[i]) < 0.05) { this.ang[i] = 0; this.vel[i] = 0; }
      }
      if (this.bump[i] > 0) this.bump[i] = Math.max(0, this.bump[i] - dt);
      if (this.hint[i] > 0) this.hint[i] = Math.max(0, this.hint[i] - dt * 0.5);
      if (this.pop[i] > 0) this.pop[i] = Math.max(0, this.pop[i] - dt * 4);
    }
    // oil: a tile fills once the tile it comes from is full; settled tiles only
    if (f) {
      var rate = 15;
      for (var q = 0; q < f.order.length; q++) {
        i = f.order[q];
        if (Math.abs(this.ang[i]) > 0.25) continue;
        var src = b.cells[i].src;
        var up = src ? 1 : this.fill[nbIdx(b, i, f.from[i])];
        if (up >= 1 && this.fill[i] < 1) this.fill[i] = Math.min(1, this.fill[i] + dt * rate);
      }
      for (i = 0; i < n; i++) if (!f.on[i] && this.fill[i] > 0) this.fill[i] = Math.max(0, this.fill[i] - dt * 6);
      // diyos light when the oil reaches the middle of their tile
      var count = 0;
      for (i = 0; i < n; i++) {
        if (!b.cells[i].diyo) continue;
        var on = f.on[i] && this.fill[i] >= 0.5 ? 1 : 0;
        if (on && !this.litNow[i]) { this.litNow[i] = 1; this.spark(i, 'light'); if (this.o.onLight) this.o.onLight(i, this.countLit() ); }
        else if (!on && this.litNow[i]) { this.litNow[i] = 0; if (this.o.onDark) this.o.onDark(i); }
        count += this.litNow[i];
      }
      // a win waits for the oil to reach every diyo on screen
      if (this.waitWin && !this.celebrating) {
        this.waitWin.t += dt;
        var all = true;
        for (i = 0; i < n; i++) if (f.on[i] && this.fill[i] < 1) all = false;
        if (all || this.waitWin.t > 2.5) { var cb = this.waitWin.cb; this.waitWin = null; this.celebrate(); cb(); }
      }
    }
    if (this.flare > 0 && !this.celebrating) this.flare = Math.max(0, this.flare - dt);
    if (this.celebrating) this.flare = Math.max(0.35, this.flare - dt * 0.5);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    // far-off fireworks over the valley, now and then
    this.nextFw -= dt;
    if (this.nextFw <= 0 && this.L && this.L.roofTop > 40 && !reduced) {
      this.firework(this.L.W * (0.08 + Math.random() * 0.84), this.L.roofTop * (0.25 + Math.random() * 0.5), 0.45);
      this.nextFw = 4 + Math.random() * 7;
      if (this.o.onFirework) this.o.onFirework();
    }
    // particles
    for (var p = this.parts.length - 1; p >= 0; p--) {
      var pt = this.parts[p];
      if (pt.delay > 0) { pt.delay -= dt; continue; }
      pt.life += dt;
      if (pt.life >= pt.max) { this.parts.splice(p, 1); continue; }
      if (pt.vx !== undefined) {
        if (pt.k === 'petal') { pt.vx += Math.sin(this.t * 2 + pt.rot) * 20 * dt; pt.rot += pt.vr * dt; }
        else if (pt.k === 'spark') { pt.vy += 160 * dt; if (pt.drag) { pt.vx *= 1 - pt.drag * dt; pt.vy *= 1 - pt.drag * dt; } }
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      }
    }
  };
  P.countLit = function () { var c = 0; if (!this.litNow) return 0; for (var i = 0; i < this.litNow.length; i++) c += this.litNow[i]; return c; };
  P.waitForWin = function (cb) { this.waitWin = { t: 0, cb: cb }; this.lockInput = true; };

  function nbIdx(b, i, d) {
    if (d < 0) return i;
    var x = (i % b.w) + DX[d], y = Math.floor(i / b.w) + DY[d];
    return y * b.w + x;
  }

  // ---------- drawing ----------
  P.draw = function () {
    if (!this.board || !this.L) return;
    var ctx = this.ctx, L = this.L, b = this.board, dpr = this.dpr, t = this.t, i;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.shake > 0) ctx.translate(Math.sin(t * 70) * this.shake * 6, Math.cos(t * 55) * this.shake * 4);
    // twinkle a few stars
    for (i = 0; i < 6; i++) {
      var sx = ((i * 197 + this.seed * 31) % 1000) / 1000 * L.W, sy = ((i * 389 + this.seed * 17) % 1000) / 1000 * Math.max(10, L.roofTop - 4);
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.7 + i * 0.13) + i));
      ctx.fillStyle = '#fff7e0'; ctx.beginPath(); ctx.arc(sx, sy, 1.1, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    var f = this.flow, s = L.s, leakMask = null;
    if (f && f.leaks.length) {
      leakMask = new Uint8Array(b.cells.length);
      for (i = 0; i < f.leaks.length; i++) leakMask[f.leaks[i][0]] |= 1 << f.leaks[i][1];
    }
    var windLeft = b.windEvery ? b.windEvery - (b.taps % b.windEvery) : 0;
    for (i = 0; i < b.cells.length; i++) {
      var c = b.cells[i], x = L.gx + (i % b.w) * s, y = L.gy + Math.floor(i / b.w) * s;
      // a finger on a tile presses it in; a turn lands with a little bounce
      var pressed = this.press && this.press.i === i && !this.press.done && !c.empty;
      var sc = pressed ? 0.9 : reduced ? 1 : 1 + 0.07 * Math.sin(this.pop[i] * Math.PI);
      if (sc !== 1) { ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.scale(sc, sc); ctx.translate(-x - s / 2, -y - s / 2); }
      A.tile(ctx, x, y, s, c, {
        ang: this.ang[i], fill: this.fill[i], from: f ? f.from[i] : -1, on: f ? f.on[i] : 0, dist: f ? f.dist[i] : 0,
        leak: leakMask && Math.abs(this.ang[i]) < 0.05 && this.fill[i] >= 0.5 ? leakMask[i] : 0,
        bump: this.bump[i], hint: this.hint[i], focus: this.kbd && this.focus === i,
        windLeft: windLeft, windEvery: b.windEvery
      }, t, this.pal);
      if (sc !== 1) ctx.restore();
    }
    this.drawHold(ctx);
    // kalash and diyos sit on top of their tiles and don't turn with them
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < b.cells.length; i++) {
      if (!b.cells[i].diyo || !this.litNow[i]) continue;
      var p = this.center(i);
      A.glow(ctx, p[0], p[1] - s * 0.2, s * (0.9 + this.flare * 0.8) * (1 + 0.05 * Math.sin(t * 9 + i)), 0.38 + this.flare * 0.25);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < b.cells.length; i++) {
      var cc = b.cells[i];
      if (!cc.diyo && !cc.src) continue;
      var q = this.center(i);
      if (cc.src) A.kalash(ctx, q[0], q[1], s * 0.66, t, f && this.fill[i] > 0);
      else A.diyo(ctx, q[0], q[1] + s * 0.06, s * 0.6, this.litNow[i] ? 1 : 0, t, i * 1.7, this.flare);
    }
    // sill diyos follow the count
    var nD = 0; for (i = 0; i < b.cells.length; i++) if (b.cells[i].diyo) nD++;
    var lit = this.countLit(), spots = A.sillSpots(L, nD);
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < lit; i++) A.glow(ctx, spots[i][0], spots[i][1] - spots[i][2] * 0.3, spots[i][2] * 1.6, 0.3);
    ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < spots.length; i++) A.diyo(ctx, spots[i][0], spots[i][1], spots[i][2], i < lit ? 1 : 0, t, i * 2.3, this.flare * 0.5);
    A.garlands(ctx, L, this.pal, t);
    // particles
    for (i = 0; i < this.parts.length; i++) {
      var pt = this.parts[i];
      if (pt.delay > 0) continue;
      var a = 1 - pt.life / pt.max;
      if (pt.k === 'petal') {
        ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot); ctx.globalAlpha = Math.min(1, a * 3);
        ctx.fillStyle = pt.col; ctx.beginPath(); ctx.ellipse(0, 0, pt.size, pt.size * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore();
      } else if (pt.k === 'spark' || pt.k === 'streak') {
        ctx.globalAlpha = a; ctx.strokeStyle = pt.col; ctx.lineWidth = pt.k === 'streak' ? 1.2 : 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x - pt.vx * 0.04, pt.y - pt.vy * 0.04); ctx.stroke();
      } else if (pt.k === 'ring') {
        ctx.globalAlpha = a * 0.8; ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * (1 - a) + 4, 0, TAU); ctx.stroke();
      } else if (pt.k === 'foot') {
        ctx.globalAlpha = Math.min(1, a * 2.5) * Math.min(1, pt.life * 5);
        A.foot(ctx, pt.x, pt.y, Math.max(6, s * 0.16), pt.side);
      }
    }
    ctx.globalAlpha = 1;
  };

  // A held finger draws a ring that fills the other way round; when it closes the tile turns left.
  P.drawHold = function (ctx) {
    var pr = this.press;
    if (!pr || pr.done || !pr.turnable) return;
    var k = (now() - pr.t0 - 110) / (HOLD_MS - 110);
    if (k <= 0) return;
    k = Math.min(1, k);
    var c = this.center(pr.i), s = this.L.s, rad = s * 0.44, a0 = -Math.PI / 2, a1 = a0 - k * TAU;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(18,8,4,0.55)'; ctx.lineWidth = Math.max(4, s * 0.1);
    ctx.beginPath(); ctx.arc(c[0], c[1], rad, 0, TAU); ctx.stroke();
    ctx.shadowColor = 'rgba(255,190,70,0.9)'; ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = Math.max(3, s * 0.065);
    ctx.beginPath(); ctx.arc(c[0], c[1], rad, a0, a1, true); ctx.stroke();
    // arrow head on the moving end, pointing anticlockwise
    var hx = c[0] + Math.cos(a1) * rad, hy = c[1] + Math.sin(a1) * rad, tx = Math.sin(a1), ty = -Math.cos(a1), hs = Math.max(5, s * 0.11);
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.moveTo(hx + tx * hs, hy + ty * hs);
    ctx.lineTo(hx - ty * hs * 0.75, hy + tx * hs * 0.75); ctx.lineTo(hx + ty * hs * 0.75, hy - tx * hs * 0.75); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  function now() { return root.performance && performance.now ? performance.now() : Date.now(); }

  // ---------- input ----------
  P.bindInput = function () {
    var self = this, cv = this.cv, press = null;
    function local(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function fire(i, dir) { if (self.o.onTap) self.o.onTap(i, dir); }
    cv.addEventListener('pointerdown', function (e) {
      if (self.lockInput) return;
      var p = local(e), i = self.cellAt(p[0], p[1]);
      self.kbd = false;
      if (i < 0) return;
      if (e.button === 2) { e.preventDefault(); fire(i, -1); return; }
      if (e.button !== 0) return;
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
      var cell = self.board.cells[i];
      press = { id: e.pointerId, i: i, x: p[0], y: p[1], done: false, t0: now(), turnable: !cell.empty && !cell.lock && !cell.wind };
      self.press = press;
      if (self.o.onPress) self.o.onPress(i);
      press.timer = setTimeout(function () {
        if (!press || press.done) return;
        press.done = true; fire(press.i, -1);
        if (press.turnable && !reduced) { var c = self.center(press.i); self.parts.push({ k: 'ring', x: c[0], y: c[1], life: 0, max: 0.4, size: self.L.s * 0.7 }); }
        if (self.o.onHold) self.o.onHold(press.i);
      }, HOLD_MS);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!press || press.id !== e.pointerId) return;
      var p = local(e);
      if (Math.abs(p[0] - press.x) > 14 || Math.abs(p[1] - press.y) > 14) { clearTimeout(press.timer); press.done = true; press.turnable = false; }
    });
    cv.addEventListener('pointerup', function (e) {
      if (!press || press.id !== e.pointerId) return;
      clearTimeout(press.timer);
      var tap = !press.done && !self.lockInput, ti = press.i;
      press.done = true; press = null; self.press = null;
      if (tap) fire(ti, 1);
    });
    cv.addEventListener('pointercancel', function () { if (press) clearTimeout(press.timer); press = null; self.press = null; });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('keydown', function (e) {
      if (!self.board || self.lockInput) return;
      var b = self.board, k = e.key, f = self.focus < 0 ? firstTile(b) : self.focus;
      var x = f % b.w, y = Math.floor(f / b.w), moved = true;
      if (k === 'ArrowLeft') x = Math.max(0, x - 1);
      else if (k === 'ArrowRight') x = Math.min(b.w - 1, x + 1);
      else if (k === 'ArrowUp') y = Math.max(0, y - 1);
      else if (k === 'ArrowDown') y = Math.min(b.h - 1, y + 1);
      else moved = false;
      if (moved) { e.preventDefault(); self.kbd = true; self.focus = y * b.w + x; if (self.o.onFocus) self.o.onFocus(self.focus); return; }
      if (k === ' ' || k === 'Enter' || k === 'e' || k === 'E' || k === 'q' || k === 'Q') {
        e.preventDefault();
        self.kbd = true; self.focus = f;
        var ccw = e.shiftKey || k === 'q' || k === 'Q';
        fire(f, ccw ? -1 : 1);
      }
    });
    cv.addEventListener('focus', function () { if (self.focus < 0 && self.board) self.focus = firstTile(self.board); });
  };
  function firstTile(b) { for (var i = 0; i < b.cells.length; i++) if (!b.cells[i].empty) return i; return 0; }

  root.TDStage = Stage;
  root.TDStage.reduced = reduced;
})(this);
