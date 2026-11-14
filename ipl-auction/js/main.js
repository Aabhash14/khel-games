(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { TEAMS, teamById, SEASON, COUNTRIES } = IPLA.data;
  const R = IPLA.rules;
  const E = IPLA.engine;
  const { bestXI, grades, highlights } = IPLA.season;
  const { t, money, setLang, getLang, applyStatic, setName, num, ordinal, crShort } = IPLA.i18n;
  const A = IPLA.audio;
  const { shareImage } = IPLA.share;

  const $ = (id) => document.getElementById(id);
  const P = E.P;
  const SAVE = 'ipla.save';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* fine */ } },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let S = null;          // auction state (saved)
  let lot = null;        // the lot on the block
  let pickTeam = null;
  let keepSel = [];
  let ffSet = null;      // set index being skipped, or null
  let screen = 'home';
  const timers = { ai: null, raf: null, next: null, think: null };
  let hammer = null;     // { start, dur, stage }
  let hammerAnim = null; // the hammer bar's compositor animation

  const HAMMER_MS = 3000;
  const OPEN_MS = 3400;

  // ---------- helpers ----------
  // Team colours on an element. Players with no IPL team yet wear their country colour.
  function teamVars(el, id, country = null) {
    const T = teamById[id];
    if (T) { el.style.setProperty('--c1', T.c1); el.style.setProperty('--c2', T.c2); el.style.setProperty('--ci', T.ink); return; }
    const c = (COUNTRIES[country] || [, , '#2a3350'])[2];
    el.style.setProperty('--c1', c); el.style.setProperty('--c2', 'rgba(255,255,255,0.35)'); el.style.setProperty('--ci', '#ffffff');
  }
  const cname = (code) => (COUNTRIES[code] ? COUNTRIES[code][getLang() === 'ne' ? 1 : 0] : code);
  const lastTeam = (p) => (teamById[p.team] ? p.team : t('newToIpl'));
  function initials(name) {
    const w = name.replace(/[^A-Za-z\s-]/g, '').split(/[\s-]+/).filter(Boolean);
    return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function roleTags(p) {
    let h = `<span class="tag">${t(`role_${p.role}`)}</span>`;
    h += p.os ? `<span class="tag os">✈ ${cname(p.country)}</span>` : `<span class="tag">${cname(p.country)}</span>`;
    if (!p.capped) h += `<span class="tag unc">${t('uncapped')}</span>`;
    return h;
  }
  let toastT = null;
  function toast(msg, ms = 2200) {
    const el = $('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms);
  }
  // Saving the whole game is a big JSON.stringify. Do it when the browser is idle,
  // not in the middle of a SOLD stamp, and flush right away if the page is closing.
  let saveQ = null;
  const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 1200 }) : (fn) => setTimeout(fn, 250);
  const unIdle = window.cancelIdleCallback ? cancelIdleCallback : clearTimeout;
  function saveNow() { if (saveQ != null) { unIdle(saveQ); saveQ = null; } if (S) store.set(SAVE, S); }
  function save() { if (saveQ == null) saveQ = idle(() => { saveQ = null; if (S) store.set(SAVE, S); }); }
  addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

  function show(name) {
    screen = name;
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.dataset.screen === name));
    window.scrollTo(0, 0);
    if (name !== 'auction') { A.crowdOff(); $('barMid').textContent = ''; }
    if (name === 'home') renderHome();
  }

  function setUserColour() {
    const T = teamById[S ? S.user : pickTeam];
    if (!T) return;
    document.documentElement.style.setProperty('--team', T.c1 === '#1c2a4a' ? T.c2 : T.c1);
    document.documentElement.style.setProperty('--team-ink', T.c1 === '#1c2a4a' ? '#1c2a4a' : T.ink === '#ffffff' ? '#ffffff' : T.ink);
  }

  // ---------- home ----------
  function renderHome() {
    applyStatic();
    const saved = store.get(SAVE, null);
    const btn = $('goResume');
    if (saved && saved.v === 1 && saved.phase !== 'done') {
      btn.hidden = false;
      $('resumeSub').textContent = t('contSub', { team: saved.user, n: saved.idx + 1, t: saved.lots.length });
    } else if (saved && saved.phase === 'done') {
      btn.hidden = false;
      const L = saved.league;
      $('resumeSub').textContent = L ? `${saved.user} · ${t('seasonTitle', { y: num(SEASON) })} · ${t('matchN', { n: Math.min(L.next + 1, L.fixtures.length) })}` : `${saved.user} · ${t('doneTitle')}`;
    } else btn.hidden = true;
  }

  $('goStart').addEventListener('click', () => {
    A.unlock(); A.tap();
    const saved = store.get(SAVE, null);
    if (saved && (saved.phase !== 'done' || (saved.league && !saved.league.champion)) && !confirm(t('confirmNew'))) return;
    show('mode');
  });
  // Auction format: fresh (everyone starts empty, no RTM) or retain + RTM.
  let gameMode = 'rtm';
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    A.tap(); gameMode = b.dataset.mode; renderPick(); show('pick');
  }));
  $('goResume').addEventListener('click', () => {
    A.unlock(); A.tap();
    const saved = store.get(SAVE, null);
    if (!saved) { toast(t('resumeLost')); return; }
    S = saved; setUserColour();
    if (S.phase === 'done') { renderDone(); show('done'); if (S.league) IPLA.tour.open(); return; }
    if (S.phase === 'fill') { endMain(); return; }
    startAuction();
  });

  // ---------- pick franchise ----------
  function renderPick() {
    const ul = $('teamGrid'); ul.innerHTML = '';
    for (const T of TEAMS) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'team-tile';
      teamVars(b, T.id);
      b.innerHTML = `<span class="tt-code">${T.id}</span><span class="tt-name">${esc(T.name)}</span>`;
      b.addEventListener('click', () => {
        A.tap(); pickTeam = T.id; keepSel = []; setUserColour();
        if (gameMode === 'fresh') { A.sting(); S = E.newGame(pickTeam, [], undefined, 'fresh'); save(); startAuction(); return; }
        renderRetain(); show('retain');
      });
      li.append(b); ul.append(li);
    }
  }

  // ---------- retention ----------
  function renderRetain() {
    const T = teamById[pickTeam];
    const head = $('retHead');
    head.style.setProperty('--team', T.c1); head.style.setProperty('--team-ink', T.ink);
    $('barMid').textContent = T.name;
    const keep = keepSel.map((id) => P[id]);
    const cost = R.retentionCost(keep);
    $('retMeter').innerHTML = `
      <div class="meter"><b>${money(R.PURSE - cost)}</b><span>${t('purse')}</span></div>
      <div class="meter"><b>${num(keep.length)}/${num(R.MAX_RETAIN)}</b><span>${t('kept')}</span></div>
      <div class="meter"><b>${num(R.MAX_RETAIN - keep.length)}</b><span>${t('rtmCards')}</span></div>`;
    const ul = $('retList'); ul.innerHTML = '';
    const squad = P.filter((p) => p.team === pickTeam).sort((a, b) => b.r - a.r);
    for (const p of squad) {
      const on = keepSel.includes(p.id);
      const extra = on ? null : R.retentionCost([...keep, p]) - cost;
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'prow'; b.setAttribute('aria-pressed', String(on));
      teamVars(b, p.team);
      b.innerHTML = `<span class="avatar">${initials(p.name)}</span>
        <span><span class="pr-name">${esc(p.name)}</span><span class="pr-sub">${t(`role_${p.role}`)} · ${p.os ? '✈ ' + cname(p.country) : cname(p.country)}${p.capped ? '' : ' · ' + t('uncapped')}</span></span>
        <span class="pr-r">${num(p.r)}<small>${on ? '✓ ' + t('kept') : t('costNext', { p: money(extra) })}</small></span>`;
      b.addEventListener('click', () => {
        A.tap();
        if (on) keepSel = keepSel.filter((x) => x !== p.id);
        else {
          const err = R.retentionCheck([...keep, p]);
          if (err) { toast(t({ max: 'errMax', capped: 'errCapped', uncapped: 'errUncapped' }[err])); return; }
          keepSel.push(p.id);
        }
        renderRetain();
      });
      li.append(b); ul.append(li);
    }
  }

  $('goAuction').addEventListener('click', () => {
    A.unlock(); A.sting();
    S = E.newGame(pickTeam, keepSel, undefined, 'rtm');
    save();
    startAuction();
  });

  // ---------- auction floor ----------
  function startAuction() {
    setUserColour();
    show('auction');
    A.crowdOn();
    ffSet = null;
    nextLot();
  }

  function clearTimers() {
    clearTimeout(timers.ai); clearTimeout(timers.next); clearTimeout(timers.think); cancelAnimationFrame(timers.raf);
    timers.ai = timers.next = null; hammer = null;
    if (hammerAnim) hammerAnim.pause();
  }

  function nextLot() {
    clearTimers();
    if (S.phase === 'fill') { endMain(); return; }
    const L = E.currentLot(S);
    lot = E.startLot(S, L.pid);
    lot.set = L.set; lot.open = false; lot.done = false;
    if (ffSet != null && (L.set !== ffSet || S.star.includes(L.pid))) ffSet = null;
    renderCard(true);
    renderBid();
    renderBoard();
    renderMine();
    renderTicker();
    setHeat(0);
    A.tensionOff();
    if (ffSet != null) { quickResolve(); return; }
    $('call').textContent = t('opening'); $('call').classList.remove('hot');
    const prev = S.idx > 0 ? S.lots[S.idx - 1] : null;
    comm(!prev || prev.set !== L.set ? t('comm_set', { s: setName(S.sets[L.set]) }) : '');
    A.heat(0.1);
    timers.next = setTimeout(openBidding, 900);
  }

  // ---------- TV commentary + heat ----------
  let commT = null;
  function comm(msg, kind = '') {
    const el = $('comm');
    clearTimeout(commT);
    el.className = `comm ${kind}`;
    el.textContent = msg;
    if (msg) { void el.offsetWidth; el.classList.add('flash'); commT = setTimeout(() => el.classList.add('fade'), 2400); }
  }
  // Heat fades two light layers. Only opacity changes, so the compositor does the work.
  // The red layer sits inside the gold one, so it shows at heat², only in a real bidding war.
  const heatEl = $('heat'); const heatRed = heatEl.firstElementChild;
  let heatNow = -1;
  function setHeat(h) {
    h = Math.round(Math.max(0, Math.min(1, h)) * 100) / 100;
    if (h === heatNow) return;
    heatNow = h;
    heatEl.style.opacity = heatRed.style.opacity = String(h);
  }
  const tierLabel = (tier) => [5, 10, 15, 20, 25][tier - 1];
  const RECORD = 2700; // ₹27 Cr, Rishabh Pant 2025
  const listNames = (ids) => ids.join(getLang() === 'ne' ? ', ' : ' & ');

  function renderCard(enter = false) {
    const p = P[lot.pid];
    const card = $('card');
    if (enter) { card.classList.remove('enter'); void card.offsetWidth; card.classList.add('enter'); }
    const av = $('cAvatar'); teamVars(av, p.team, p.country); av.textContent = initials(p.name);
    $('cName').textContent = p.name;
    $('cMeta').innerHTML = roleTags(p);
    $('cRating').textContent = num(p.r);
    $('cRbar').style.width = `${Math.max(0, (p.r - 50) * 2)}%`;
    $('cBase').textContent = money(lot.base);
    $('cLast').textContent = lastTeam(p);
    const holder = S.teams[p.team] && S.teams[p.team].rtm > 0 ? p.team : null;
    $('cRtm').hidden = !holder;
    if (holder) $('cRtm').textContent = holder === S.user ? `★ ${t('rtmAvail', { t: p.team })} (${t('rtmCards')}: ${num(S.teams[S.user].rtm)})` : t('rtmAvail', { t: p.team });
    const star = S.star.includes(p.id);
    $('cStar').setAttribute('aria-pressed', String(star));
    // Scouting hint: which teams are short of this role, and how many have him on their wishlist.
    const short = TEAMS.filter((T) => T.id !== S.user && E.counts(S, T.id)[p.role] < E.TARGET[p.role] - 1 && E.maxBid(S, T.id, p.id) >= lot.base).map((T) => T.id);
    const wish = TEAMS.filter((T) => E.isTarget(S, T.id, p.id)).length;
    let needs = short.length ? t('needs', { role: t(`role_${p.role}`), teams: short.slice(0, 5).join(', ') + (short.length > 5 ? '…' : '') }) : '';
    if (wish >= 2) needs = `<span class="hot">${t('hot', { n: wish })}</span>${needs ? ' · ' + esc(needs) : ''}`;
    else needs = esc(needs);
    $('cNeeds').innerHTML = needs;
    $('stamp').hidden = true;
    const prog = E.setProgress(S);
    $('setName').textContent = `${setName(prog.set)} · ${num(prog.pos)}/${num(prog.n)}`;
    $('barMid').textContent = t('lot', { n: S.idx + 1, t: S.lots.length });
  }

  function renderBid(bump = false) {
    const v = $('bidV');
    if (lot.bid == null) {
      $('bidK').textContent = t('base');
      v.textContent = money(lot.base);
      $('bidder').innerHTML = lot.open ? `<span>${t('waiting')}</span>` : '';
    } else {
      $('bidK').textContent = t('current');
      v.textContent = money(lot.bid);
      const id = lot.bidder;
      $('bidder').innerHTML = `<span class="pill" style="--c1:${teamById[id].c1};--c2:${teamById[id].c2};--ci:${teamById[id].ink}">${id}</span>${id === S.user ? `<span>${t('youHigh')}</span>` : ''}`;
    }
    const tier = lot.bid ? A.tierOf(lot.bid) : 0;
    v.classList.toggle('t3', tier === 3); v.classList.toggle('t4', tier === 4); v.classList.toggle('t5', tier >= 5);
    if (bump) { v.classList.remove('bump'); void v.offsetWidth; v.classList.add('bump'); }
    renderPaddle();
    document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('lead', c.dataset.t === lot.bidder));
  }

  function jumpAmount() {
    const next = E.lotNext(lot);
    return lot.bid == null ? E.jumpTo(lot.base) : E.jumpTo(next);
  }

  function renderPaddle() {
    const pd = $('paddle');
    const amt = E.lotNext(lot);
    const reason = E.blockReason(S, S.user, lot.pid, amt);
    const mine = lot.bidder === S.user;
    pd.classList.toggle('mine', mine);
    if (mine) {
      $('pdK').textContent = t('pdYou');
      $('pdV').textContent = money(lot.bid);
    } else {
      $('pdK').textContent = t('bid');
      $('pdV').textContent = money(amt);
    }
    pd.disabled = !lot.open || lot.done || mine || !!reason;
    const ja = jumpAmount();
    $('jumpV').textContent = money(ja);
    $('btnJump').disabled = pd.disabled || !!E.blockReason(S, S.user, lot.pid, ja);
    const max = E.maxBid(S, S.user, lot.pid);
    $('pdNote').textContent = reason
      ? t({ full: 'blockFull', overseas: 'blockOverseas', purse: 'blockPurse' }[reason])
      : t('maxYou', { p: money(max) });
    $('btnSkip').disabled = lot.done;
    $('btnSet').disabled = lot.done;
  }

  function renderBoard() {
    const b = $('board');
    if (!b.children.length) {
      for (const T of TEAMS) {
        const c = document.createElement('button');
        c.type = 'button'; c.className = 'chip'; c.dataset.t = T.id; c.setAttribute('role', 'listitem');
        teamVars(c, T.id);
        c.innerHTML = `<span class="ch-code">${T.id}</span><span class="ch-p"></span><span class="ch-n"></span>`;
        c.addEventListener('click', () => openSquad(T.id));
        b.append(c);
      }
    }
    const nem = E.nemesis(S);
    for (const c of b.children) {
      const id = c.dataset.t; const n = E.counts(S, id);
      c.classList.toggle('me', id === S.user);
      c.classList.toggle('nem', !!nem && nem.team === id);
      c.querySelector('.ch-p').textContent = `${crShort(S.teams[id].purse)}`;
      c.querySelector('.ch-n').textContent = `${num(n.n)} · ✈${num(n.os)}`;
      c.setAttribute('aria-label', `${id}: ${money(S.teams[id].purse)} ${t('left')}, ${n.n} ${t('players')}${nem && nem.team === id ? ', ' + t('rival') : ''}`);
      const amt = lot ? E.lotNext(lot) : 0;
      // What you could see in the room: who has a paddle up in this lot, and who can't afford or has dropped.
      const fighting = !!lot && lot.in.has(id) && !lot.dropped.has(id) && !(lot.outNoted && lot.outNoted.has(id));
      c.classList.toggle('in', fighting && id !== lot.bidder);
      c.classList.toggle('out', !!lot && id !== lot.bidder && (!!E.blockReason(S, id, lot.pid, amt) || lot.dropped.has(id) || !!(lot.outNoted && lot.outNoted.has(id))));
    }
  }

  function renderMine() {
    const me = S.teams[S.user]; const n = E.counts(S, S.user);
    $('myStrip').innerHTML = `<span>${t('mySquad')} <span class="ms-dim">${num(n.n)}/${num(R.MAX_SQUAD)} · ✈ ${num(n.os)}/${num(R.MAX_OVERSEAS)} · RTM ${num(me.rtm)}</span></span><span class="ms-p">${money(me.purse)}</span>`;
  }

  function renderTicker() {
    const items = S.log.slice(0, 3).map((e) => (e.team ? `<b>${esc(P[e.pid].name)}</b> → ${e.team} ${money(e.price)}${e.how === 'rtm' ? ' (RTM)' : ''}` : `<b>${esc(P[e.pid].name)}</b> ${t('unsold').toLowerCase()}`));
    $('ticker').innerHTML = items.join(' · ');
  }

  // ---------- the clock ----------
  function openBidding() {
    lot.open = true;
    renderBid();
    $('call').textContent = '';
    startHammer(OPEN_MS);
    scheduleAI();
  }

  // The bar runs as a compositor animation, so it stays smooth even while the page is busy.
  function hammerBar(dur) {
    if (hammerAnim) { hammerAnim.cancel(); hammerAnim = null; }
    const bar = $('hammerBar');
    if (!dur) { bar.style.transform = 'scaleX(0)'; return; }
    bar.style.transform = '';
    hammerAnim = bar.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: dur, easing: 'linear', fill: 'forwards' });
  }

  function startHammer(dur) {
    cancelAnimationFrame(timers.raf);
    hammer = { start: performance.now(), dur, stage: 0 };
    hammerBar(dur);
    const call = $('call');
    const tick = (now) => {
      if (!hammer) return;
      const f = Math.min(1, (now - hammer.start) / hammer.dur);
      if (hammer.stage < 1 && f >= 0.4) { hammer.stage = 1; call.textContent = t('once'); call.classList.remove('hot'); if (lot.bid != null) A.bell(1, lot.bid); if (!timers.ai) scheduleAI(); }
      if (hammer.stage < 2 && f >= 0.72) { hammer.stage = 2; call.textContent = t('twice'); call.classList.add('hot'); if (lot.bid != null) A.bell(2, lot.bid); if (!timers.ai) scheduleAI(); }
      if (f >= 1) { hammer = null; hammerDown(); return; }
      timers.raf = requestAnimationFrame(tick);
    };
    timers.raf = requestAnimationFrame(tick);
  }

  // Ask the computer teams who goes next, and when. The timing is the tell:
  // confident teams fire back fast, teams near their limit hesitate, snipers wait for "going once".
  function scheduleAI() {
    clearTimeout(timers.ai); timers.ai = null;
    const stage = hammer ? hammer.stage : 0;
    const n = E.aiNext(S, lot, Math.random, stage);
    if (!n) return;
    const token = lot.bids;
    const userIn = lot.in.has(S.user);
    const dur = lot.bid == null ? OPEN_MS : HAMMER_MS;
    const left = hammer ? Math.max(300, dur - (performance.now() - hammer.start)) : dur;
    const style = teamById[n.team].bid;
    let d; let thinking = false;
    if (style === 'sniper' && !lot.in.has(n.team)) d = rand(150, Math.max(200, left - 250));
    else if (n.margin > 0.35) d = userIn ? rand(450, 900) : rand(220, 480);
    else if (n.margin > 0.12) d = userIn ? rand(800, 1500) : rand(400, 900);
    else { d = rand(1300, Math.max(1350, left - 250)); thinking = true; }
    d = Math.min(d, left - 120);
    if (thinking && lot.in.has(n.team)) {
      timers.think = setTimeout(() => { if (lot.bids === token && !lot.done) comm(t('comm_think', { t: n.team }), 'tell'); }, 650);
    }
    timers.ai = setTimeout(() => {
      timers.ai = null;
      if (!lot.open || lot.done || lot.bids !== token) return;
      if (n.amt < E.lotNext(lot) || E.blockReason(S, n.team, lot.pid, n.amt)) { scheduleAI(); return; }
      placeBid(n.team, n.amt, { jump: n.jump });
    }, Math.max(80, d));
  }

  function placeBid(team, amt, info = {}) {
    clearTimeout(timers.think);
    const before = { bidder: lot.bidder, bid: lot.bid, in: new Set(lot.in), top: S.top || 0 };
    E.placeBid(lot, team, amt);
    const mine = team === S.user;
    A.paddle(mine, amt);
    if (info.jump) A.jump();
    if (navigator.vibrate && amt >= 1000 && mine) navigator.vibrate(20);

    // Commentary, most dramatic first.
    let msg = ''; let kind = '';
    const scared = info.jump ? E.applyFear(S, lot) : [];
    const tier = A.tension(amt, lot.bids);
    if (amt > RECORD && before.top <= RECORD && (before.bid || 0) <= RECORD) {
      msg = t('comm_record'); kind = 'hot'; A.record(); shake();
    } else if (tier) {
      msg = t('comm_tier', { n: num(tierLabel(tier)) }); kind = 'hot'; A.milestone(tier); shake();
    } else if (info.jump) {
      msg = mine ? t('comm_youJump', { p: money(amt) }) : t('comm_jump', { t: team, p: money(amt) }); kind = 'hot';
    } else if (before.bid == null) {
      msg = t('comm_open', { t: team, p: money(amt) });
    } else if (!before.in.has(team) && !mine) {
      const nem = E.nemesis(S);
      msg = nem && nem.team === team && lot.in.has(S.user) ? t('comm_rival', { t: team }) : t('comm_join', { t: team });
      if (nem && nem.team === team) kind = 'hot';
    } else {
      const fighters = [...lot.in].filter((x) => !lot.dropped.has(x));
      if (lot.bids >= 8 && fighters.length === 2 && lot.bids % 4 === 0) msg = t('comm_war', { a: fighters[0], b: fighters[1] });
    }
    if (scared.length) { msg = (msg ? msg + ' ' : '') + t('comm_back', { list: listNames(scared) }); setTimeout(() => A.drop(), 250); }
    // Teams that had a paddle up but won't go higher put it down.
    if (!lot.outNoted) lot.outNoted = new Set();
    const still = new Set(E.stillIn(S, lot));
    const newlyOut = [...before.in].filter((x) => x !== S.user && x !== team && !still.has(x) && !lot.outNoted.has(x) && !scared.includes(x));
    newlyOut.forEach((x) => lot.outNoted.add(x));
    if (!msg && newlyOut.length) { msg = t('comm_drop', { t: listNames(newlyOut) }); A.drop(); }
    if (msg) comm(msg, kind);

    const p = P[lot.pid];
    setHeat(Math.min(1, amt / 2500 + lot.bids / 40 + (p.r >= 85 ? 0.1 : 0)));
    renderBid(true);
    renderBoard();
    $('call').textContent = ''; $('call').classList.remove('hot');
    startHammer(HAMMER_MS);
    scheduleAI();
  }

  function shake() {
    const f = document.querySelector('.floor');
    f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
  }

  function userBid(amt, jump = false) {
    if (!lot || !lot.open || lot.done || lot.bidder === S.user) return;
    if (E.blockReason(S, S.user, lot.pid, amt)) return;
    A.unlock();
    const pd = $('paddle'); pd.classList.remove('hit'); void pd.offsetWidth; pd.classList.add('hit');
    setTimeout(() => pd.classList.remove('hit'), 160);
    if (navigator.vibrate) navigator.vibrate(jump ? [10, 40, 18] : 12);
    placeBid(S.user, amt, { jump });
  }
  $('paddle').addEventListener('click', () => { if (lot) userBid(E.lotNext(lot)); });
  $('btnJump').addEventListener('click', () => { if (lot) userBid(jumpAmount(), true); });

  // Skip: you're out of this lot, the computer teams finish it instantly.
  function quickResolve() {
    if (lot.done) return;
    clearTimers();
    lot.open = false;
    E.autoResolve(S, lot);
    renderBid();
    hammerDown(true);
  }
  $('btnSkip').addEventListener('click', () => { A.tap(); quickResolve(); });
  $('btnSet').addEventListener('click', () => { A.tap(); ffSet = lot.set; quickResolve(); });

  $('cStar').addEventListener('click', () => {
    const pid = lot.pid;
    S.star = S.star.includes(pid) ? S.star.filter((x) => x !== pid) : [...S.star, pid];
    $('cStar').setAttribute('aria-pressed', String(S.star.includes(pid)));
    save();
  });

  async function hammerDown(fast = false) {
    if (lot.done) return;
    lot.done = true; lot.open = false;
    clearTimeout(timers.ai); clearTimeout(timers.think); timers.ai = null;
    renderPaddle();
    hammerBar(0);
    const pid = lot.pid;
    if (!lot.bidder) {
      E.noteRivalry(S, lot); A.tensionOff(); setHeat(0);
      E.markUnsold(S, pid);
      stamp(null, 0);
      if (!fast || ffSet == null) A.unsold();
      return moveOn(ffSet != null ? 160 : fast ? 450 : 1100);
    }
    let res = { team: lot.bidder, price: lot.bid, how: 'buy' };
    const f = E.rtmHolder(S, pid, res.team);
    if (f === S.user) {
      if (!E.blockReason(S, S.user, pid, res.price)) res = await userRtm(res.team, res.price);
    } else if (f && E.aiWantsRtm(S, f, pid, res.price)) {
      if (res.team === S.user) res = await rtmAgainstUser(f, res.price);
      else {
        const raised = E.aiFinalRaise(S, res.team, pid, res.price);
        if (E.aiMatches(S, f, pid, raised)) res = { team: f, price: raised, how: 'rtm' };
        else res = { team: res.team, price: raised, how: 'buy' };
        if (res.how === 'rtm' && ffSet == null) toast(`RTM! ${f} · ${P[pid].name} · ${money(raised)}`);
      }
    }
    const wasRecord = res.price > RECORD && (S.top || 0) <= RECORD;
    E.noteRivalry(S, lot);
    S.top = Math.max(S.top || 0, res.price);
    E.assign(S, pid, res.team, res.price, res.how);
    stamp(res.team, res.price, res.how, wasRecord);
    A.tensionOff();
    const loud = ffSet == null || res.team === S.user;
    if (loud) {
      A.sold(res.price, res.team === S.user);
      const p = P[pid];
      if (res.team === S.user) comm(t('comm_youWin'), 'hot');
      else if (lot.push[res.team] && lot.vals[res.team] < res.price) comm(t('comm_stuck', { t: res.team }), 'hot');
      else if (E.isTarget(S, res.team, pid)) comm(t('comm_got', { t: res.team }));
      else if (p.r >= 74 && res.price <= lot.base * 1.2) comm(t('comm_steal', { p: money(res.price) }));
    }
    setHeat(0);
    moveOn(ffSet != null && res.team !== S.user ? 220 : fast ? 900 : res.price >= 1500 ? 2100 : 1500);
  }

  function stamp(team, price, how, rec = false) {
    const el = $('stamp');
    el.className = `stamp${team ? '' : ' unsold'}`;
    if (team) {
      el.style.setProperty('--sc', teamById[team].c1 === '#1c2a4a' ? teamById[team].c2 : teamById[team].c1);
      el.innerHTML = `<b>${t('sold')}</b><span>${team} · ${money(price)}${how === 'rtm' ? ' · RTM' : ''}</span>${rec ? `<span class="rec">${t('record')}</span>` : ''}`;
    } else {
      el.innerHTML = `<b>${t('unsold')}</b>`;
    }
    el.hidden = false;
    renderBoard(); renderMine(); renderTicker();
    A.heat(0.05);
  }

  function moveOn(ms) {
    E.advance(S);
    save();
    clearTimeout(timers.next);
    timers.next = setTimeout(() => { if (screen === 'auction') nextLot(); }, ms);
  }

  // ---------- modals ----------
  function modal({ title, text, buttons, stepper = null }) {
    return new Promise((resolve) => {
      $('modalH').textContent = title;
      $('modalP').textContent = text;
      const st = $('stepper');
      let value = stepper ? stepper.min : null;
      const btnWrap = $('modalBtns'); btnWrap.innerHTML = '';
      const els = buttons.map((b) => {
        const el = document.createElement('button');
        el.type = 'button'; el.className = b.gold ? 'big-btn gold' : 'big-btn';
        el.innerHTML = `<span class="bb-main"></span>`;
        el.addEventListener('click', () => { A.tap(); $('modalBack').hidden = true; resolve(stepper ? { val: b.val, value } : b.val); });
        btnWrap.append(el);
        return { el, b };
      });
      const paint = () => {
        els.forEach(({ el, b }) => { el.querySelector('.bb-main').textContent = typeof b.label === 'function' ? b.label(value) : b.label; });
        if (stepper) $('stepV').textContent = money(value);
      };
      st.hidden = !stepper;
      if (stepper) {
        $('stepUp').onclick = () => { const nv = value + R.step(value); if (nv <= stepper.max) { value = nv; A.tap(); paint(); } };
        $('stepDown').onclick = () => { if (value > stepper.min) { let v = stepper.min; while (v + R.step(v) < value) v += R.step(v); value = v; A.tap(); paint(); } };
      }
      paint();
      $('modalBack').hidden = false;
      els[0].el.focus();
    });
  }

  async function userRtm(w, price) {
    const pid = lot.pid; const name = P[pid].name;
    A.sting();
    const use = await modal({
      title: t('rtmQ'), text: t('rtmAsk', { name, t: w, p: money(price) }),
      buttons: [{ label: t('rtmUse'), val: true, gold: true }, { label: t('rtmPass'), val: false }],
    });
    if (!use) return { team: w, price, how: 'buy' };
    const raised = E.aiFinalRaise(S, w, pid, price);
    const canPay = !E.blockReason(S, S.user, pid, raised);
    const text = (raised > price ? t('rtmRaised', { t: w, p: money(raised) }) : t('rtmNoRaise', { t: w, p: money(price) })) + (canPay ? '' : ` ${t('blockPurse')}.`);
    const btns = canPay ? [{ label: t('rtmMatch', { p: money(raised) }), val: true, gold: true }, { label: t('rtmDecline'), val: false }] : [{ label: t('rtmDecline'), val: false }];
    const m = await modal({ title: name, text, buttons: btns });
    if (m) { toast(t('rtmYouGot', { name, p: money(raised) })); return { team: S.user, price: raised, how: 'rtm' }; }
    return { team: w, price: raised, how: 'buy' };
  }

  async function rtmAgainstUser(f, price) {
    const pid = lot.pid; const name = P[pid].name;
    A.sting();
    const max = Math.min(E.maxBid(S, S.user, pid), price * 3);
    const canRaise = max >= R.nextBid(price);
    const r = await modal({
      title: t('rtmVsYou', { t: f, name }), text: t('rtmVsYouSub', { p: money(price), t: f }),
      stepper: canRaise ? { min: R.nextBid(price), max } : null,
      buttons: canRaise
        ? [{ label: (v) => t('raiseTo', { p: money(v) }), val: 'raise', gold: true }, { label: t('noRaise', { p: money(price) }), val: 'keep' }]
        : [{ label: t('noRaise', { p: money(price) }), val: 'keep', gold: true }],
    });
    const choice = canRaise ? r.val : r;
    const newP = choice === 'raise' ? r.value : price;
    const matched = E.aiMatches(S, f, pid, newP);
    await modal({
      title: name,
      text: matched ? t('rtmTheyMatched', { t: f, name }) : t('rtmTheyPassed', { t: f, name, p: money(newP) }),
      buttons: [{ label: t('ok'), val: true, gold: true }],
    });
    return matched ? { team: f, price: newP, how: 'rtm' } : { team: S.user, price: newP, how: 'buy' };
  }

  // ---------- sheets ----------
  function openSheet(title, html, teamId = null) {
    $('sheetH').textContent = title;
    const body = $('sheetBody'); body.innerHTML = html;
    if (teamId) teamVars($('sheet'), teamId);
    $('sheet').hidden = false; $('sheetBack').hidden = false;
    $('sheetClose').focus();
    return body;
  }
  function closeSheet() { $('sheet').hidden = true; $('sheetBack').hidden = true; }
  $('sheetClose').addEventListener('click', closeSheet);
  $('sheetBack').addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });

  function squadHtml(id) {
    const T = S.teams[id]; const n = E.counts(S, id);
    let h = `<div class="sq-sum"><span class="tag">${t('purse')}: ${money(T.purse)}</span><span class="tag">${num(n.n)}/${num(R.MAX_SQUAD)}</span><span class="tag os">✈ ${num(n.os)}/${num(R.MAX_OVERSEAS)}</span><span class="tag">RTM ${num(T.rtm)}</span></div>`;
    for (const role of E.ROLES) {
      const rows = T.squad.filter((e) => P[e.pid].role === role).sort((a, b) => b.price - a.price);
      if (!rows.length) continue;
      h += `<p class="sq-role">${t(`role_${role}`)} · ${num(rows.length)}</p><ul class="mini">`;
      for (const e of rows) {
        const p = P[e.pid];
        const how = e.how === 'ret' ? ` · ${t('retained')}` : e.how === 'rtm' ? ' · RTM' : '';
        h += `<li><span>${esc(p.name)}${p.os ? ' ✈' : ''} <span class="m-r">${num(p.r)}${how}</span></span><span class="m-p">${money(e.price)}</span></li>`;
      }
      h += '</ul>';
    }
    return h;
  }
  function openSquad(id) { A.tap(); openSheet(id === S.user ? t('mySquad') : t('squadOf', { t: teamById[id].name }), squadHtml(id), id); }
  $('myStrip').addEventListener('click', () => openSquad(S.user));

  $('openUpcoming').addEventListener('click', () => {
    A.tap();
    let h = `<p class="note">${t('upcomingSub')}</p>`;
    let lastSet = -1;
    for (let i = S.idx + 1; i < Math.min(S.lots.length, S.idx + 60); i++) {
      const L = S.lots[i]; const p = P[L.pid];
      if (L.set !== lastSet) { h += `<p class="up-set">${setName(S.sets[L.set])}</p>`; lastSet = L.set; }
      h += `<button type="button" class="up-row" data-pid="${p.id}" aria-pressed="${S.star.includes(p.id)}"><span class="u-star">★</span><span class="u-main">${esc(p.name)}${p.os ? ' ✈' : ''}<small>${t(`role_${p.role}`)} · ${cname(p.country)} · ${lastTeam(p)} · ${money(R.basePrice(p))}</small></span><span class="pr-r">${num(p.r)}</span></button>`;
    }
    const body = openSheet(t('upcoming'), h);
    body.querySelectorAll('.up-row').forEach((b) => b.addEventListener('click', () => {
      const pid = +b.dataset.pid;
      S.star = S.star.includes(pid) ? S.star.filter((x) => x !== pid) : [...S.star, pid];
      b.setAttribute('aria-pressed', String(S.star.includes(pid)));
      A.tap(); save();
    }));
  });

  // ---------- after the hammer: fill the squad ----------
  function endMain() {
    clearTimers(); A.crowdOff();
    S.phase = 'fill'; save();
    if (E.counts(S, S.user).n >= R.MIN_SQUAD) { finishAuction(); return; }
    renderFill(); show('fill');
  }

  function renderFill() {
    const n = E.counts(S, S.user).n;
    const need = Math.max(0, R.MIN_SQUAD - n);
    $('fillH').textContent = need ? t('fillTitle', { n: need }) : t('mySquad') + ` ${num(n)}/${num(R.MAX_SQUAD)}`;
    const signable = E.leftovers(S).some((p) => !E.blockReason(S, S.user, p.id, R.basePrice(p)));
    $('fillDone').disabled = need > 0 && signable;
    const ul = $('fillList'); ul.innerHTML = '';
    // Only players you can actually sign (squad room, overseas limit, purse).
    for (const p of E.leftovers(S).filter((x) => !E.blockReason(S, S.user, x.id, R.basePrice(x))).slice(0, 80)) {
      const price = R.basePrice(p);
      const block = E.blockReason(S, S.user, p.id, price);
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'prow'; b.disabled = !!block;
      teamVars(b, p.team, p.country);
      b.innerHTML = `<span class="avatar">${initials(p.name)}</span>
        <span><span class="pr-name">${esc(p.name)}</span><span class="pr-sub">${t(`role_${p.role}`)} · ${p.os ? '✈ ' + cname(p.country) : cname(p.country)}</span></span>
        <span class="pr-r">${num(p.r)}<small>${t('sign')} ${money(price)}</small></span>`;
      b.addEventListener('click', () => { A.paddle(true); E.assign(S, p.id, S.user, price, 'fill'); save(); renderFill(); });
      li.append(b); ul.append(li);
    }
  }
  $('fillDone').addEventListener('click', () => { A.tap(); finishAuction(); });

  function finishAuction() {
    E.fillAI(S);
    S.phase = 'done';
    save();
    A.cheer();
    renderDone(); show('done');
  }

  // ---------- results ----------
  function myRows() {
    const g = grades(S);
    return { g, mine: g.find((r) => r.t === S.user) };
  }

  function renderDone() {
    const T = teamById[S.user];
    const head = $('doneHead');
    head.style.setProperty('--team', T.c1); head.style.setProperty('--team-ink', T.ink);
    $('doneH').textContent = T.name;
    const { g, mine } = myRows();
    const me = S.teams[S.user]; const n = E.counts(S, S.user);
    $('gradeRow').innerHTML = `<div class="grade-big" aria-label="${t('grade')}">${mine.grade}</div>
      <div class="grade-facts"><span>${t('grade')} · <b>#${num(mine.rank)}</b>/10</span>
      <span>${t('spent')}: <b>${money(R.PURSE - me.purse)}</b> · ${t('left')}: <b>${money(me.purse)}</b></span>
      <span><b>${num(n.n)}</b> ${t('players')} · ✈ <b>${num(n.os)}</b></span>${E.nemesis(S) ? `<span>⚔ ${t('rival')}: <b>${E.nemesis(S).team}</b> ×${num(E.nemesis(S).n)}</span>` : ''}</div>`;
    const hl = highlights(S, S.user);
    const hlBox = (k, e) => (e ? `<div class="hl"><span>${t(k)}</span><b>${esc(P[e.pid].name)}</b><small>${money(e.price)}</small></div>` : '');
    $('hlRow').innerHTML = hlBox('steal', hl.steal) + hlBox('dear', hl.dear);
    const priceOf = Object.fromEntries(me.squad.map((e) => [e.pid, e]));
    const xi = bestXI(me.squad.map((e) => e.pid));
    $('xiList').innerHTML = xi.map((p) => {
      const e = priceOf[p.id];
      const how = e.how === 'ret' ? ` · ${t('retained')}` : e.how === 'rtm' ? ' · RTM' : '';
      return `<li><span>${esc(p.name)}${p.os ? ' ✈' : ''}<span class="x-sub">${t(`role_${p.role}`)} · ${num(p.r)}${how}</span></span><span class="x-p">${money(e.price)}</span></li>`;
    }).join('');
    const ul = $('gradesList'); ul.innerHTML = '';
    for (const r of g) {
      const li = document.createElement('li'); const b = document.createElement('button');
      b.type = 'button'; b.className = r.t === S.user ? 'me' : '';
      teamVars(b, r.t);
      b.innerHTML = `<span class="g-code">${r.t}</span><span>${esc(teamById[r.t].name)}<br><small>${num(S.teams[r.t].squad.length)} ${t('players')} · ${money(S.teams[r.t].purse)} ${t('left')}</small></span><span></span><span class="g-g">${r.grade}</span>`;
      b.addEventListener('click', () => openSquad(r.t));
      li.append(b); ul.append(li);
    }
  }

  function newAuction() {
    A.tap();
    store.del(SAVE); S = null; lot = null;
    renderPick(); show('pick');
  }
  $('againDone').addEventListener('click', newAuction);

  // ---------- season (tour.js runs the tournament screens) ----------
  function startSeason() {
    A.unlock(); A.sting();
    if (!S.league) { IPLA.league.newLeague(S); save(); }
    IPLA.tour.open();
  }
  $('goSeason').addEventListener('click', startSeason);

  // One line on how your season went (or is going).
  function verdict() {
    const L = S.league; if (!L) return null;
    const u = S.user;
    const tbl = IPLA.league.table(S);
    const pos = tbl.findIndex((r) => r.t === u) + 1;
    if (L.champion === u) return t('youWon');
    const fin = L.fixtures.find((f) => f.stage === 'final');
    if (L.champion && fin && (fin.a === u || fin.b === u)) return t('youRunner');
    const lost = L.fixtures.find((f) => f.stage !== 'league' && f.stage !== 'q1' && (f.a === u || f.b === u) && L.results[f.id] && L.results[f.id].res.w !== u);
    if (lost) return t('youOut', { stage: t(lost.stage) });
    return t('youFinished', { pos: ordinal(pos) });
  }

  const pill = (id) => (teamById[id] ? `<span class="t-code" style="--c1:${teamById[id].c1};--c2:${teamById[id].c2};--ci:${teamById[id].ink}">${id}</span>` : '');

  // ---------- share ----------
  async function doShare() {
    A.tap();
    const T = teamById[S.user]; const me = S.teams[S.user];
    const { mine } = myRows();
    const priceOf = Object.fromEntries(me.squad.map((e) => [e.pid, e]));
    const xi = bestXI(me.squad.map((e) => e.pid)).map((p) => ({ name: p.name, os: p.os, price: money(priceOf[p.id].price), how: priceOf[p.id].how }));
    const hl = highlights(S, S.user);
    let caps = null;
    if (S.league && Object.keys(S.league.results).length) {
      const st = IPLA.league.stats(S);
      const o = st.orange[0]; const pu = st.purple[0];
      caps = { orange: o ? `${P[o.pid].name} · ${num(o.r)}` : '', purple: pu ? `${P[pu.pid].name} · ${num(pu.w)}` : '' };
    }
    const res = await shareImage({
      team: T, grade: mine.grade, rank: mine.rank, xi,
      verdict: S.league ? verdict() : `${t('grade')}: ${mine.grade}`,
      champion: S.league && S.league.champion ? teamById[S.league.champion].name : null,
      steal: hl.steal ? { name: P[hl.steal.pid].name, price: money(hl.steal.price) } : null,
      dear: hl.dear ? { name: P[hl.dear.pid].name, price: money(hl.dear.price) } : null,
      spent: money(R.PURSE - me.purse), caps,
      L: { title: t('shareTitle'), xi: t('bestXI'), steal: t('steal'), dear: t('dear'), spent: t('spent'), grade: t('grade'), kept: t('retained'), season: t('seasonTitle', { y: num(SEASON) }), orange: t('orangeCap'), purple: t('purpleCap') },
    });
    if (res === 'saved') toast(t('copied'));
  }
  $('shareDone').addEventListener('click', doShare);

  // Shared with tour.js.
  IPLA.ui = {
    get S() { return S; }, show, save, toast, teamVars, esc, initials, pill, newAuction, doShare, verdict, modal, openSquad, cname,
    screen: () => screen,
  };

  // ---------- language + sound ----------
  document.querySelectorAll('[data-set-lang]').forEach((b) => b.addEventListener('click', () => {
    setLang(b.dataset.setLang); applyStatic();
    if (screen === 'home') renderHome();
    if (screen === 'retain') renderRetain();
    if (screen === 'auction' && lot) { renderCard(); renderBid(); renderBoard(); renderMine(); renderTicker(); }
    if (screen === 'fill') renderFill();
    if (screen === 'done') renderDone();
    if (IPLA.tour && IPLA.tour.owns(screen)) IPLA.tour.refresh();
  }));
  const muteBtn = $('mute');
  muteBtn.setAttribute('aria-pressed', String(A.isMuted()));
  muteBtn.addEventListener('click', () => { A.setMuted(!A.isMuted()); muteBtn.setAttribute('aria-pressed', String(A.isMuted())); });

  // Leaving the floor pauses nothing important; coming back to a hidden tab keeps the lot moving.
  document.addEventListener('visibilitychange', () => { if (document.hidden) A.crowdOff(); else if (screen === 'auction') A.crowdOn(); });

  applyStatic();
  renderHome();
})();
