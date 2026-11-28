/* Mol-Molai (मोलमोलाई) — Dashain shopping in Asan bazaar. Haggle, bluff, and read the shopkeepers' faces. */
(() => {
  'use strict';
  const { TAU, store, rand, clamp, lerp, pick, sleep, mulberry32, hash, vibrate, niceUp, niceDown } = MM.Util;
  const { L, cap, fill, digits, num, rs, TEXT, t, fmtClock } = MM.I18n;
  const { ALL_TOLES, LEVELS, TITHI, HOLIDAY, COACH_WHEN, LEVEL_TEXT, ITEMS, iname, CAT, KEEPERS, kname, sname, KIND } = MM.Data;
  const { LINES, kline, ME, TELLS, THOUGHTS, EVENTS, ENDINGS, AAMA, BADGES } = MM.Lines;
  const { MAP, TOLE, tname, tolePath, pathLen, tolesOnPath, walkFrom } = MM.AsanMap;
  const { genWorld } = MM.World;
  const { voice, audio } = MM.Audio;
  const {
    icon, FONT, FLAG, SACHETS, CLOTH, rr, circle, poly, ease, shadeHex, withCtx, makePerson,
    buildFacade, hangingGoods, buildTemple, mapLabel, drawMapBase, drawDharahara, drawKite, drawPigeon, drawDhaka, drawGoat,
  } = MM.Art;
  const shared = MM.shared;

  // ---------- Setup ----------
  const canvas = document.getElementById('game');
  let ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {};
  for (const id of ['menu', 'over', 'retry', 'next', 'share', 'toMenu', 'mute', 'voiceBtn', 'menuMute', 'menuVoice', 'lang', 'meVoice',
    'levels', 'brief', 'starTotal', 'badges', 'newBadges', 'overTitle', 'overLvl', 'overNum', 'overSub', 'overThought', 'stars',
    'meterFill', 'meterGoal', 'meterSaved', 'meterTarget', 'meterNext', 'tallySaved', 'tallyGoal', 'monthName', 'receipt', 'hud', 'lvlName', 'toleName', 'lvlNum', 'clock', 'money', 'target', 'rep',
    'panel', 'place', 'listBtn', 'lines', 'choices', 'sheet', 'listItems', 'sheetClose']) ui[id] = $(id);
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let DAY = 480; // minutes the bazaar stays open in this level, counted from 10:00

  // ---------- State ----------
  let state = 'menu', view = 'lane';
  let G = null, curShop = null, curItem = null, offerVal = 0, busy = false, homeConfirm = false;
  let lines = [], time = 0, talkT = 0, walkAnim = null, mapWalk = null, mapSel = null, showAll = false, fx = [];
  let selLevel = 0;
  const progress = () => store.get('mm_levels', {});
  const unlocked = (i) => i === 0 || (progress()[i - 1] || 0) > 0;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const badges = new Set(store.get('mm_badges', []));

  voice.init();
  function setVoiceUI() {
    for (const b of [ui.voiceBtn, ui.menuVoice]) { if (!b) continue; b.innerHTML = icon(voice.on ? 'voice' : 'voiceOff'); b.classList.toggle('off', !voice.on); b.setAttribute('aria-pressed', String(voice.on)); }
  }

  const shopAt = (pos, tole = G.tole) => G.shops.find((s) => s.tole === tole && s.pos === pos);
  const toleShops = (tole) => (G ? G.shops.filter((s) => s.tole === tole) : []);
  const needed = () => G.list.filter((it) => !G.bought[it]);
  const earn = (id) => G.earned.add(id);

  function openListing(shop, it) {
    const ls = shop.listings[it];
    if (!ls.open) {
      const K = KEEPERS[shop.id], f = G.items[it].fair, st = G.items[it].step;
      ls.open = ls.ask = niceUp(f * ls.openK * (1 - 0.05 * G.rep), st);
      ls.pmax = ls.patience = Math.max(2, K.patience + (G.rep >= 2 ? 1 : 0) - (G.rep <= -2 ? 1 : 0));
    }
    return ls;
  }

  // The shopkeeper's real lowest price right now. Never shown to the player.
  function floorOf(shop, ls) {
    const K = KEEPERS[shop.id], fair = G.items[ls.item].fair;
    let k = ls.floorK - 0.015 * G.rep;
    if (G.minutes < shop.bohaniAt) k -= 0.07; // no first sale yet: keen to make one
    if (shop.chatted) k -= K.kind === 'chatty' ? 0.08 : 0.02;
    if (shop.mood) k -= 0.04;
    if (shop.regular) k -= 0.03;
    if (K.lateDrop) k -= K.lateDrop * clamp((G.minutes - 300) / 150, 0, 1);
    if (shop.bossCalled) k = Math.max(k, 0.95);
    return fair * Math.max(k, 0.55);
  }

  function advance(m) {
    G.minutes = Math.min(DAY, G.minutes + m);
    for (const s of G.shops) {
      while (s.sales.length && s.sales[0] <= G.minutes) {
        s.sales.shift();
        if (s.stock > 0) { s.stock--; G.news.push(s); }
      }
    }
  }

  function note(shop, it, price, kind = 'quote') {
    const e = G.notes.find((n) => n.item === it && n.shop === shop.id && n.kind === kind);
    if (e) e.price = Math.min(e.price, price);
    else G.notes.push({ item: it, shop: shop.id, price, kind });
  }

  function deal(shop, ls, p) {
    const K = KEEPERS[shop.id], fair = G.items[ls.item].fair, f = floorOf(shop, ls);
    const first = G.minutes < shop.bohaniAt;
    G.money -= p;
    if (first) { shop.bohaniAt = G.minutes; earn('bohani'); }
    shop.regular++;
    if (K.stock) shop.stock = Math.max(0, shop.stock - 1);
    G.bought[ls.item] = { shop: shop.id, price: p, open: ls.open };
    if (p <= ls.open * 0.55) earn('half');
    if (K.kind === 'cunning' && p <= f * 1.03) earn('sahu');
    if (ls.item === 'goat') earn('goat');
    let kindNote = null;
    if (K.kind === 'kind') {
      if (p >= fair && !G.kindDone) { G.kindDone = true; G.rep = Math.min(3, G.rep + 1); earn('kind'); kindNote = 'full'; }
      else if (p < fair * 0.9) { G.rep = Math.max(-3, G.rep - 1); kindNote = 'low'; }
    }
    return { t: 'deal', p, first, kindNote, firstPrice: ls.rounds === 0 && p >= ls.open };
  }

  // ---------- Haggling rules (pure: they change G and return what happened) ----------
  function coreQuote(shop, it) {
    const ls = openListing(shop, it), first = !ls.seen;
    ls.seen = true;
    advance(first ? 2 : 1);
    if (ls.returning) { ls.returning = false; ls.ask = Math.min(ls.open, niceUp(ls.ask * 1.05, G.items[it].step)); }
    note(shop, it, ls.ask);
    if (!ls.hist.length || ls.hist[ls.hist.length - 1].p !== ls.ask) ls.hist.push({ me: false, p: ls.ask });
    return { first, p: ls.ask };
  }

  function coreOffer(shop, ls, o) {
    const K = KEEPERS[shop.id], k = KIND[K.kind], it = G.items[ls.item], st = it.step;
    advance(4);
    G.stats.offers++;
    if (o >= ls.ask) return deal(shop, ls, ls.ask);
    const prev = ls.lastOffer, lowered = prev > 0 && o < prev;
    if (lowered) ls.patience -= 1;
    ls.lastOffer = o;
    if (K.kind === 'naive' && !shop.bossCalled && o < it.fair * 0.78) {
      shop.bossCalled = true;
      ls.patience -= 1;
      const f2 = floorOf(shop, ls);
      ls.ask = Math.max(niceUp(f2, st), Math.min(ls.ask, niceUp(it.fair * 1.1, st)));
      ls.rounds++;
      note(shop, ls.item, ls.ask);
      return { t: 'boss', p: ls.ask, lowered, prev };
    }
    const f = floorOf(shop, ls);
    if (o >= f) {
      let ch = k.acc + 0.1 * ls.rounds + (o >= f * 1.06 ? 0.25 : 0) + (o >= (ls.ask + f) / 2 ? 0.2 : 0);
      if (lowered) ch -= 0.2;
      if (Math.random() < ch) return deal(shop, ls, o);
      let na = niceUp(o + (ls.ask - o) * 0.45, st);
      if (na >= ls.ask) na = ls.ask - st;
      if (na <= o) return deal(shop, ls, o);
      ls.ask = na; ls.rounds++;
      note(shop, ls.item, na);
      return { t: 'counter', p: na, lowered, prev, final: false, fake: K.kind === 'cunning' && Math.random() < 0.3 };
    }
    const insult = o < f * 0.7;
    ls.patience -= insult ? 2 : 1;
    if (ls.patience <= 0) return kick(shop, ls);
    const c = k.conc * (insult ? 0.4 : 1) * (1 + 0.1 * Math.min(ls.rounds, 4));
    const target = niceUp(f, st);
    let na = Math.max(target, niceUp(ls.ask - (ls.ask - f) * c, st));
    const stuck = na >= ls.ask;
    if (stuck) na = ls.ask;
    ls.ask = na; ls.rounds++;
    note(shop, ls.item, na);
    const atFloor = na - f < st;
    let final = false, fake = false;
    if (atFloor) final = K.kind === 'poker' ? Math.random() < 0.5 : true;
    else if (K.kind === 'cunning') fake = Math.random() < 0.3;
    return { t: insult ? 'insult' : 'counter', p: na, o, lowered, prev, final, fake, stuck };
  }

  function kick(shop, ls) {
    shop.kickedUntil = G.minutes + 60;
    ls.ask = ls.open; ls.patience = Math.ceil(ls.pmax / 2); ls.lastOffer = 0;
    return { t: 'kick' };
  }

  // Who would you name as having quoted lower? A real quote if you have one, otherwise someone else who sells it.
  function pickCite(shop, it, n) {
    const real = G.notes.filter((q) => q.item === it && q.shop !== shop.id && q.kind !== 'tip' && q.price <= n).sort((a, b) => a.price - b.price);
    if (real.length) return { other: G.shops.find((s) => s.id === real[0].shop), truth: true };
    const quoted = G.notes.filter((q) => q.item === it && q.shop !== shop.id && q.kind !== 'tip').sort((a, b) => a.price - b.price);
    if (quoted.length) return { other: G.shops.find((s) => s.id === quoted[0].shop), truth: false, known: true };
    const others = G.shops.filter((s) => s !== shop && s.sells.includes(it));
    return { other: others.length ? pick(others) : null, truth: false, known: false };
  }

  function coreBluff(shop, ls, n, cite) {
    const K = KEEPERS[shop.id], it = G.items[ls.item], st = it.step;
    advance(4);
    shop.bluffs++;
    if (!cite.truth) {
      const p = K.susp * 0.8 + Math.max(0, (0.9 * it.fair - n) / it.fair) * 1.5 + (cite.known ? 0 : 0.12) + 0.12 * (shop.bluffs - 1) - 0.04 * G.rep;
      if (Math.random() < clamp(p, 0.05, 0.95)) {
        G.stats.caught++;
        earn('caught');
        ls.patience -= 1;
        ls.ask = Math.min(ls.open, niceUp(ls.ask * 1.06, st));
        const loss = K.gossip ? 2 : 1;
        G.rep = Math.max(-3, G.rep - loss);
        if (ls.patience <= 0) { kick(shop, ls); return { t: 'caught', kick: true, loss }; }
        note(shop, ls.item, ls.ask);
        return { t: 'caught', loss };
      }
      G.stats.lies++;
      if (G.stats.lies >= 3 && !G.stats.caught) earn('liar');
    }
    const f = floorOf(shop, ls);
    ls.rounds++;
    if (n >= f) {
      ls.ask = Math.min(ls.ask, niceUp(K.kind === 'cunning' ? n + st : n, st));
      note(shop, ls.item, ls.ask);
      return { t: 'match', p: ls.ask, n };
    }
    ls.ask = Math.max(niceUp(f, st), Math.min(ls.ask, niceUp(f + (ls.ask - f) * 0.2, st)));
    note(shop, ls.item, ls.ask);
    return { t: 'no', p: ls.ask, n };
  }

  function coreWalk(shop, ls) {
    const K = KEEPERS[shop.id], st = G.items[ls.item].step, f = floorOf(shop, ls);
    advance(1);
    const can = ls.ask - f >= st * 2 && !ls.calledBack;
    const p = K.callback + (G.minutes < shop.bohaniAt ? 0.2 : 0) + (G.minutes > 390 ? 0.15 : 0) - (ls.rounds === 0 ? 0.3 : 0);
    if (can && Math.random() < p) {
      ls.calledBack = true;
      ls.ask = niceUp(f + (ls.ask - f) * rand(0.3, 0.6), st);
      note(shop, ls.item, ls.ask);
      earn('callback');
      return { t: 'callback', p: ls.ask };
    }
    // Nobody called you back. Come back later and they know you want it.
    ls.returning = true;
    ls.floorK = Math.min(1.02, ls.floorK + 0.03);
    return { t: 'leave' };
  }

  function coreChat(shop) {
    advance(12);
    shop.chatted = true;
    for (const ls of Object.values(shop.listings)) if (ls.open) ls.patience = Math.min(ls.pmax + 1, ls.patience + 1);
    return { noBohani: G.minutes < shop.bohaniAt };
  }

  function coreAccept(shop, ls) {
    advance(2);
    if (ls.ask > G.money) return { t: 'poor' };
    return deal(shop, ls, ls.ask);
  }

  const walkMin = (shop) => walkFrom(G.tole, G.pos, shop);
  function routeMinutes(list) {
    let tole = G.tole, pos = G.pos, m = 0;
    for (const s of list) { m += walkFrom(tole, pos, s); tole = s.tole; pos = s.pos; }
    return m;
  }
  const useful = (s) => s.sells.some((it) => needed().includes(it)) && !(KEEPERS[s.id].stock && !s.stock);

  // ---------- Panel ----------
  function addLine(kind, text, who) {
    if (!text) return;
    const name = who && typeof who === 'object' ? kname(who) : who;
    lines.push({ kind, text, who: name });
    if (state !== 'play') return;
    if (kind === 'say') { voice.say(text, who && who.id); talkT = 1.3; audio.blip(who && who.id); }
    else if (kind === 'me') voice.say(text, 'me');
    else if (kind === 'thought') voice.say(text, 'thought');
  }
  const say = (shop, key, v = {}) => addLine('say', fill(pick(L(key)), v), shop);
  const think = (key, v = {}) => addLine('thought', fill(pick(L(key)), v));

  function renderPanel() {
    ui.place.textContent = view === 'lane' ? `${tname(G.tole)} · ${t('lane')}` : view === 'map' ? t('mapTitle') : view === 'haggle' ? `${sname(curShop)} · ${cap(iname(curItem))}` : `${sname(curShop)} · ${tname(curShop.tole)}`;
    ui.lines.innerHTML = '';
    let shown = lines;
    // One scroller in the sheet: keep the log short so the moves stay in reach of the thumb.
    if (sidebar) shown = view === 'map' ? lines.slice(-6) : lines;
    else if (view === 'haggle') { const lastMe = lines.map((l) => l.kind).lastIndexOf('me'); shown = lines.slice(Math.max(lastMe, 0)).filter((l) => l.kind !== 'thought' && l.kind !== 'sys').slice(-3); }
    else if (view === 'map') shown = [];
    else shown = lines.slice(view === 'lane' ? -4 : -6);
    ui.panel.classList.toggle('haggling', view === 'haggle');
    for (const l of shown) {
      const p = document.createElement('p');
      p.className = `line ${l.kind}`;
      if (l.kind === 'thought') p.dataset.label = t('thinking');
      if (l.kind === 'coach') p.dataset.label = t('tip');
      if (l.kind === 'say' || l.kind === 'me') {
        const b = document.createElement('b');
        b.textContent = l.kind === 'me' ? t('you') : l.who;
        p.appendChild(b);
        p.appendChild(document.createTextNode(l.text));
      } else p.textContent = l.text;
      ui.lines.appendChild(p);
    }
    renderChoices();
    updateHUD();
    ui.panel.scrollTop = 0;
  }

  let pr = null; // references to the price stepper, updated in place
  function renderChoices() {
    ui.choices.innerHTML = '';
    pr = null;
    let col = 0;
    const label = (text) => { const d = document.createElement('p'); d.className = 'choices-label'; d.textContent = text; ui.choices.appendChild(d); col = 0; };
    const cell = ({ title, key = '', ic, cls = '', act, disabled, span = 1 }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `cellb ${cls}${span === 2 ? ' wide' : span >= 4 ? ' full' : ''}`;
      b.disabled = busy || !!disabled;
      b.innerHTML = `<span class="top"><span class="k">${esc(key)}</span>${ic ? icon(ic) : ''}</span><span class="t">${esc(title)}</span>`;
      b.addEventListener('click', () => { if (!busy) act(); });
      ui.choices.appendChild(b);
      col += span;
      if (col >= 4) { b.classList.add('end'); col = 0; }
      return b;
    };
    const row = ({ name, info = '', big, small = '', cls = '', act, disabled }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `rowb ${cls}`;
      b.disabled = busy || !!disabled;
      b.innerHTML = `<span class="rt"><span class="rn">${esc(name)}</span>${info ? `<span class="ri">${esc(info)}</span>` : ''}</span><span class="rm"><b>${esc(big)}</b><span>${esc(small)}</span></span>`;
      b.addEventListener('click', () => { if (!busy) act(); });
      ui.choices.appendChild(b);
      col = 0;
      return b;
    };
    const fillRow = () => { while (col !== 0) { const sp = document.createElement('span'); sp.className = 'cellb'; sp.setAttribute('aria-hidden', 'true'); ui.choices.appendChild(sp); col++; if (col >= 4) { sp.classList.add('end'); col = 0; } } };

    const shopInfo = (s) => {
      const bits = [tname(s.tole)];
      const here = s.sells.filter((it) => needed().includes(it)).map(iname);
      if (here.length) bits.push(here.join(', '));
      if (KEEPERS[s.id].stock) bits.push(s.stock ? fill(t('left'), { n: digits(s.stock) }) : t('soldOut'));
      if (G.minutes < s.kickedUntil) bits.push(t('angry'));
      return bits.join(' · ');
    };
    const isHere = (s) => s.tole === G.tole && s.pos === G.pos;
    const shopRow = (s, act, extra = '') => row({
      name: sname(s), info: shopInfo(s), big: isHere(s) ? '०' : digits(walkMin(s)), small: isHere(s) ? t('here') : t('minLbl'),
      cls: `${useful(s) ? 'need' : ''}${isHere(s) ? ' here' : ''}${KEEPERS[s.id].stock && !s.stock ? ' out' : ''} ${extra}`, act,
    });

    if (view === 'lane' || view === 'map') {
      const shops = [...G.shops].sort((a, b) => walkMin(a) - walkMin(b));
      if (view === 'map') {
        if (mapSel) {
          const s = mapSel, pts = s.tole === G.tole ? [] : tolePath(G.tole, s.tole), pass = pts.length ? tolesOnPath(pts, G.tole, s.tole) : [];
          label(`${sname(s)} · ${fill(t('sellsLbl'), { list: s.sells.map(iname).join(', ') })}${pass.length ? ' · ' + fill(t('passing'), { list: pass.map(tname).join(', ') }) : ''}`);
          cell({ title: t('goHere'), key: fill(t('mins'), { m: digits(walkMin(s)) }), ic: 'offer', cls: 'primary', span: 2, act: () => goShop(s) });
          if (!G.route.includes(s)) cell({ title: t('addRoute'), key: digits(G.route.length + 1), ic: 'route', span: 2, act: () => { G.route.push(s); renderChoices(); } });
          else cell({ title: t('removeRoute'), ic: 'route', span: 2, act: () => { G.route = G.route.filter((x) => x !== s); renderChoices(); } });
        } else label(t('mapHint'));
        if (G.route.length) {
          label(`${fill(t('route'), { list: G.route.map((x) => KEEPERS[x.id].name[shared.lang]).join(' → ') })} · ${fill(t('routeTotal'), { m: digits(routeMinutes(G.route)), n: digits(G.route.length) })}`);
          cell({ title: t('startRoute'), key: fill(t('mins'), { m: digits(walkMin(G.route[0])) }), ic: 'play', cls: 'dark', span: 2, act: () => goShop(G.route[0]) });
          cell({ title: t('clearRoute'), ic: 'back', span: 2, act: () => { G.route = []; renderChoices(); } });
        }
        label(t('pickOnMap'));
        for (const s of shops) shopRow(s, () => { mapSel = s; audio.tick(); renderChoices(); }, mapSel === s ? 'sel' : '');
        cell({ title: t('backStreet'), ic: 'back', span: 4, act: closeMap });
        return;
      }
      if (G.route.length) {
        const nx = G.route[0];
        row({ name: fill(t('nextStop'), { name: sname(nx) }), info: shopInfo(nx), big: digits(walkMin(nx)), small: t('minLbl'), cls: 'go', act: () => goShop(nx) });
      }
      const miss = needed().length;
      cell({ title: t('openMap'), key: t('routeHint'), ic: 'map', span: 2, act: openMap });
      cell({ title: t('listShort'), key: `${digits(G.list.length - miss)}/${digits(G.list.length)}`, ic: 'list', act: openSheet });
      cell({ title: homeConfirm ? fill(t('sureHome'), { n: digits(miss) }) : t('goHome'), key: t('homeLbl'), ic: 'home', cls: miss ? '' : 'primary', act: goHome });
      label(t('where'));
      const good = shops.filter(useful), rest = shops.filter((x) => !useful(x));
      for (const s of good) shopRow(s, () => goShop(s));
      if (showAll) for (const s of rest) shopRow(s, () => goShop(s));
      else if (rest.length) cell({ title: fill(t('moreShops'), { n: digits(rest.length) }), ic: 'grid', span: 4, act: () => { showAll = true; renderChoices(); } });
      return;
    }

    if (view === 'shop') {
      const kicked = G.minutes < curShop.kickedUntil;
      const here = curShop.sells.filter((it) => needed().includes(it));
      if (here.length && !kicked) {
        label(t('pickItem'));
        for (const it of here) {
          const ls = curShop.listings[it], out = KEEPERS[curShop.id].stock && !curShop.stock;
          row({ name: fill(t('haggleFor'), { item: iname(it) }), info: out ? t('soldOut') : `${t('aamaSays')} ${rs(G.items[it].hint)}`, big: ls.seen ? num(ls.ask) : '?', small: t('theirPrice'), cls: out ? 'out' : 'need', act: () => selectItem(it), disabled: out });
        }
      }
      if (!curShop.chatted && !kicked) cell({ title: t('chat'), key: fill(t('mins'), { m: digits(12) }), ic: 'chat', span: 2, act: doChat });
      cell({ title: t('backLane'), ic: 'back', span: curShop.chatted || kicked ? 4 : 2, act: backLane });
      return;
    }

    // Haggling: what has been said so far, the price stepper, then the moves
    const ls = curShop.listings[curItem], st = G.items[curItem].step;
    if (ls.hist.length > 1) {
      const h = document.createElement('div');
      h.className = 'history';
      h.innerHTML = `<span class="lbl">${esc(t('myPrice'))} / ${esc(t('theirPrice'))}</span>` + ls.hist.map((e, i) => {
        const last = i === ls.hist.length - 1 && !e.me;
        return `<span class="${e.me ? 'mine' : 'theirs'}">${last ? `<b>${num(e.p)}</b>` : `<s>${num(e.p)}</s>`}</span>`;
      }).join('');
      ui.choices.appendChild(h);
      requestAnimationFrame(() => { h.scrollLeft = h.scrollWidth; });
    }
    const wrap = document.createElement('div');
    wrap.className = 'pricer';
    const mk = (txt, d, aria, big) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = `step${big ? ' big' : ''}`; b.textContent = txt; b.setAttribute('aria-label', aria);
      b.disabled = busy;
      b.addEventListener('click', () => nudge(d));
      return b;
    };
    const val = document.createElement('div');
    val.className = 'val';
    const lab = document.createElement('span'); lab.textContent = t('myPrice');
    const vb = document.createElement('b');
    const em = document.createElement('em');
    val.append(lab, vb, em);
    wrap.append(mk(`−${num(5 * st)}`, -5 * st, `-${5 * st}`, true), mk(`−${num(st)}`, -st, `-${st}`), val, mk(`+${num(st)}`, st, `+${st}`), mk(`+${num(5 * st)}`, 5 * st, `+${5 * st}`, true));
    ui.choices.appendChild(wrap);
    col = 0;
    const offerBtn = cell({ title: t('offer'), key: rs(offerVal), ic: 'offer', cls: 'primary', act: doOffer });
    const bluffBtn = cell({ title: t('bluff'), key: rs(offerVal), ic: 'bluff', act: doBluff, disabled: offerVal >= ls.ask });
    cell({ title: t('accept'), key: rs(ls.ask), ic: 'accept', cls: 'dark', act: doAccept });
    cell({ title: t('walk'), ic: 'walk', act: doWalk });
    if (!curShop.chatted) cell({ title: t('chat'), key: fill(t('mins'), { m: digits(12) }), ic: 'chat', span: 4, act: doChat });
    fillRow();
    pr = { vb, em, offerBtn, bluffBtn, ls };
    updatePricer();
  }

  function setRoll(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    if (reduceMotion) return;
    el.classList.remove('roll'); void el.offsetWidth; el.classList.add('roll');
  }
  function updatePricer() {
    if (!pr) return;
    const { ls } = pr;
    setRoll(pr.vb, rs(offerVal));
    pr.em.textContent = fill(t('ofAsk'), { p: digits(Math.round((offerVal / ls.ask) * 100)) });
    pr.offerBtn.querySelector('.k').textContent = rs(offerVal);
    pr.bluffBtn.querySelector('.k').textContent = rs(offerVal);
    pr.bluffBtn.disabled = busy || offerVal >= ls.ask;
  }

  function clampOffer() {
    if (!curItem) return;
    const ls = curShop.listings[curItem], st = G.items[curItem].step;
    offerVal = clamp(offerVal, st, Math.max(st, Math.min(ls.ask - st, niceDown(G.money, st))));
  }
  function nudge(d) {
    if (busy || view !== 'haggle') return;
    offerVal += d;
    clampOffer();
    audio.tick();
    updatePricer();
  }

  function updateHUD() {
    if (!G) return;
    ui.lvlName.textContent = `${fill(t('level'), { n: digits(G.level + 1) })} · ${L(LEVEL_TEXT[G.level].name)}`;
    ui.toleName.textContent = view === 'map' ? t('mapTitle') : view === 'lane' ? tname(G.tole) : `${sname(curShop)} · ${tname(curShop.tole)}`;
    ui.lvlNum.textContent = digits(G.level + 1);
    setRoll(ui.money, rs(G.money));
    ui.target.textContent = rs(G.target);
    const left = Math.max(0, DAY - G.minutes);
    setRoll(ui.clock, digits(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`));
    ui.clock.classList.toggle('warn', left <= 40);
    const filled = clamp(G.rep + 3, 0, 6);
    ui.rep.innerHTML = Array.from({ length: 6 }, (_, i) => `<i class="${i < filled ? (G.rep < 0 ? 'bad' : 'on') : ''}"></i>`).join('');
    ui.rep.setAttribute('aria-label', `${t('rep')}: ${G.rep}`);
  }

  // ---------- Flow ----------
  function coach(when) {
    if (!G || G.coached || COACH_WHEN[LEVELS[G.level].idea] !== when) return;
    G.coached = true;
    addLine('coach', L(LEVEL_TEXT[G.level].idea));
  }
  function start(lv) {
    audio.init();
    voice.stop();
    lv = clamp(lv | 0, 0, LEVELS.length - 1);
    DAY = LEVELS[lv].day;
    G = genWorld((Math.random() * 2 ** 31) | 0, lv);
    lines = []; fx = []; view = 'lane'; curShop = null; curItem = null; busy = false; homeConfirm = false; walkAnim = null; mapWalk = null; mapSel = null; showAll = false;
    state = 'play';
    ui.menu.classList.add('hidden'); ui.over.classList.add('hidden');
    ui.hud.classList.remove('hidden'); ui.panel.classList.remove('hidden');
    resize();
    camX = playerWX() - W / 2;
    addLine('narr', fill(L(EVENTS.intro), { b: num(G.budget) }));
    if (voice.on && voice.supported && voice.list.length && !voice.pick(null)) addLine('sys', t('noVoice'));
    else if (voice.on && shared.lang === 'ne' && voice.list.length && !voice.hasNepali()) addLine('sys', t('edgeHint'));
    think(THOUGHTS.start);
    coach('start');
    audio.setScene('lane');
    renderPanel();
  }

  function checkClock() {
    if (G.minutes >= DAY) { endDay(true); return true; }
    if (!G.closingWarned && G.minutes >= DAY - 40) { G.closingWarned = true; think(THOUGHTS.closing); }
    if (!G.lateWarned && G.minutes >= 330 && !G.bought.goat && G.list.includes('goat') && G.shops.some((s) => KEEPERS[s.id].kind === 'farmer' && s.stock)) { G.lateWarned = true; think(THOUGHTS.late); }
    return false;
  }

  function flushNews() {
    const wantGoat = G.list.includes('goat') && !G.bought.goat;
    for (const s of G.news) {
      if (!wantGoat) continue;
      addLine('event', fill(L(s.stock ? EVENTS.goatSold : EVENTS.goatGone), { name: kname(s), n: digits(s.stock) }));
    }
    G.news = [];
  }

  function laneEvent(toShop) {
    if (Math.random() > 0.32) return;
    const need = needed();
    const opts = ['cow', 'tip', 'friend', 'tourist'].filter((e) => !G.used.has(e));
    if (!opts.length) return;
    const e = pick(opts);
    G.used.add(e);
    const targets = [];
    for (const s of G.shops) for (const it of s.sells) if (need.includes(it) && s !== toShop && !(KEEPERS[s.id].stock && !s.stock)) targets.push({ s, it });
    if (e === 'cow') { addLine('event', L(EVENTS.cow)); advance(10); audio.moo(); return; }
    if (!targets.length) return;
    const { s, it } = pick(targets), ls = s.listings[it], st = G.items[it].step;
    if (e === 'tip') {
      const p = niceUp(floorOf(s, ls) * rand(1.0, 1.04), st);
      note(s, it, p, 'tip');
      addLine('event', fill(L(EVENTS.tip), { name: kname(s), item: iname(it), p: num(p) }));
    } else if (e === 'friend') {
      const p = niceUp(floorOf(s, ls) * rand(1.02, 1.08), st);
      note(s, it, p, 'friend');
      addLine('event', fill(L(EVENTS.friend), { name: kname(s), item: iname(it), p: num(p) }));
    } else {
      s.mood = true;
      s.bohaniAt = Math.min(s.bohaniAt, G.minutes);
      addLine('event', fill(L(EVENTS.tourist), { name: kname(s) }));
    }
  }

  async function goShop(shop) {
    if (busy || state !== 'play') return;
    voice.stop();
    homeConfirm = false;
    if (shop === curShop && shop.tole === G.tole && shop.pos === G.pos) { if (view === 'map') view = 'lane'; enterShop(curShop, true); renderPanel(); return; }
    busy = true;
    const mins = walkMin(shop);
    if (shop.tole === G.tole) { // next door: walk along the street
      const d = Math.abs(shop.pos - G.pos);
      walkAnim = { from: G.pos, to: shop.pos, t: 0, dur: Math.min(1.5, 0.35 + d * 0.13) };
      playerDir = shop.pos > G.pos ? 1 : -1;
      view = 'lane';
      audio.footsteps(walkAnim.dur);
      renderPanel();
      await sleep(walkAnim.dur * 1000);
      walkAnim = null;
    } else { // across Asan: follow the real streets on the map
      const pts = tolePath(G.tole, shop.tole), meters = pathLen(pts);
      mapWalk = { pts, len: meters, t: 0, dur: clamp(0.8 + meters / 360, 1, 2.6), dest: shop, from: G.minutes, mins };
      view = 'lane';
      audio.footsteps(mapWalk.dur);
      renderPanel();
      await sleep(mapWalk.dur * 1000);
      mapWalk = null;
      playerDir = 1;
    }
    advance(mins);
    G.tole = shop.tole; G.pos = shop.pos;
    camX = playerWX() - W / 2;
    G.route = G.route.filter((x) => x !== shop);
    lines = [];
    laneEvent(shop);
    flushNews();
    busy = false;
    if (checkClock()) return;
    enterShop(shop);
    renderPanel();
  }

  function openMap() { if (busy) return; voice.stop(); view = 'map'; mapSel = null; renderPanel(); }
  function closeMap() { view = 'lane'; mapSel = null; renderPanel(); }

  function enterShop(shop, again) {
    curShop = shop; curItem = null; view = 'shop';
    audio.setScene('shop');
    const K = KEEPERS[shop.id];
    if (!shop.met) { shop.met = true; addLine('say', L(K.greet), shop); }
    else if (!again) addLine('say', L(LINES.nothing), shop);
    coach('shop');
    if (G.minutes < shop.kickedUntil) { say(shop, LINES.kicked); return; }
    if (G.minutes < shop.bohaniAt && !shop.chatted && Math.random() < 0.7) addLine('tell', fill(L(LINES.noBohaniTell), { name: kname(shop) }));
    const here = shop.sells.filter((it) => needed().includes(it));
    if (K.stock && !shop.stock && here.length) { say(shop, LINES.noneLeft); return; }
    if (here.length === 1) selectItem(here[0], true);
  }

  function selectItem(it, quiet) {
    if (busy) return;
    curItem = it;
    const ls = openListing(curShop, it), first = !ls.seen;
    if (first) addLine('me', fill(L(ME.askPrice), { item: iname(it) }));
    const q = coreQuote(curShop, it);
    say(curShop, first ? LINES.quote : LINES.back, { item: iname(it), p: num(q.p) });
    if (first && KEEPERS[curShop.id].kind === 'poker') think(THOUGHTS.poker);
    coach('haggle');
    view = 'haggle';
    const st = G.items[it].step;
    offerVal = ls.lastOffer ? ls.lastOffer + st : niceDown(ls.ask * 0.55, st);
    clampOffer();
    if (!quiet) { if (checkClock()) return; renderPanel(); }
    else checkClock();
  }

  async function act(meText, fn) {
    if (busy || state !== 'play') return;
    voice.stop();
    busy = true;
    if (meText) addLine('me', meText);
    renderPanel();
    await sleep(520);
    if (state !== 'play') return;
    fn();
    busy = false;
    flushNews();
    if (checkClock()) return;
    if (state === 'play') renderPanel();
  }

  function tellAndThink(shop, ls) {
    const K = KEEPERS[shop.id], f = floorOf(shop, ls), gap = (ls.ask - f) / ls.ask;
    const low = ls.patience <= Math.max(1, Math.round(ls.pmax * 0.34));
    if (low) { addLine('tell', fill(pick(L(TELLS.annoyed)), { name: kname(shop) })); return; }
    if (K.kind === 'poker') { if (Math.random() < 0.6) addLine('tell', fill(pick(L(TELLS.poker)), { name: kname(shop) })); return; }
    if (Math.random() < 0.22) return;
    let band = gap < 0.06 ? 'near' : gap < 0.16 ? 'mid' : 'far';
    if (K.kind === 'cunning' && band === 'near' && Math.random() < 0.4) band = 'mid';
    addLine('tell', fill(pick(L(TELLS[band])), { name: kname(shop) }));
    if (band !== 'mid' && Math.random() < 0.3) think(THOUGHTS[band]);
  }

  function respondDeal(r) {
    const shop = curShop, it = curItem, fair = G.items[it].fair;
    say(shop, r.kindNote === 'low' ? LINES.kindLow : r.kindNote === 'full' ? LINES.kindFull : LINES.accept);
    if (r.first) say(shop, LINES.bohani);
    addLine('deal', fill(t('dealLine'), { item: iname(it), p: num(r.p) }));
    if (r.kindNote === 'full') { addLine('sys', t('repUp')); think(THOUGHTS.kindFull); }
    else if (r.kindNote === 'low') { addLine('bad', t('repDown')); think(THOUGHTS.kindLow); }
    else if (r.firstPrice) think(THOUGHTS.firstPrice);
    else if (r.p <= fair * 0.95) think(THOUGHTS.goodDeal);
    audio.deal();
    if (it === 'goat') audio.bleat();
    vibrate(30);
    fx.push({ kind: 'stamp', t: 0 });
    curItem = null;
    view = 'shop';
    const left = needed();
    if (!left.length) think(THOUGHTS.allDone);
    else {
      const cheapest = Math.min(...left.map((x) => G.items[x].fair * 0.8));
      if (G.money < left.reduce((s, x) => s + G.items[x].fair * 0.85, 0) && G.money >= cheapest) think(THOUGHTS.poor);
    }
  }

  function respondOffer(r) {
    const shop = curShop, K = KEEPERS[shop.id], ls = shop.listings[curItem];
    if (r.t === 'deal') { respondDeal(r); return; }
    if (r.t === 'kick') { say(shop, LINES.kick); audio.grumble(); vibrate([40, 40, 40]); view = 'shop'; curItem = null; return; }
    if (r.lowered) say(shop, LINES.lower, { prev: num(r.prev) });
    if (r.t === 'boss') { say(shop, LINES.boss, { p: num(r.p) }); think(THOUGHTS.boss); return; }
    if (r.t === 'insult') say(shop, LINES.insult, { o: num(r.o) });
    if (r.final) {
      say(shop, LINES.final, { p: num(r.p) });
      if (K.kind !== 'cunning' && K.kind !== 'poker' && Math.random() < 0.35) think(THOUGHTS.trueFinal, { name: kname(shop) });
    } else if (r.fake) {
      say(shop, LINES.fakeFinal, { p: num(r.p) });
      if (!G.used.has('fakeThought')) { G.used.add('fakeThought'); think(THOUGHTS.fake, { name: kname(shop) }); }
    } else if (r.t !== 'insult' || r.stuck === false) say(shop, r.stuck ? LINES.stuck : kline(K.kind, 'counter'), { p: num(r.p) });
    tellAndThink(shop, ls);
    if (offerVal >= ls.ask) offerVal = ls.ask - G.items[curItem].step;
    clampOffer();
  }

  function doOffer() {
    const o = offerVal;
    const ls0 = curShop.listings[curItem];
    ls0.hist.push({ me: true, p: o });
    act(fill(pick(L(ME.offer)), { p: num(o) }), () => { const r = coreOffer(curShop, ls0, o); if (r.p && r.t !== 'deal') ls0.hist.push({ me: false, p: r.p }); respondOffer(r); });
  }

  function doBluff() {
    const shop = curShop, it = curItem, ls = shop.listings[it], n = offerVal;
    if (n >= ls.ask) return;
    const cite = pickCite(shop, it, n);
    const other = cite.other ? kname(cite.other) : shared.lang === 'ne' ? 'अर्को पसल' : 'the other shop';
    act(fill(pick(L(ME.bluff)), { other, p: num(n) }), () => {
      ls.hist.push({ me: true, p: n });
      const r = coreBluff(shop, ls, n, cite);
      if (r.t !== 'caught') ls.hist.push({ me: false, p: r.p });
      if (r.t === 'caught') {
        addLine('event', fill(L(LINES.shout), { name: kname(shop), other, item: iname(it), n: num(n) }));
        if (cite.other) addLine('say', L(LINES.shoutNo), cite.other);
        say(shop, LINES.caught, { other });
        addLine('bad', t('repDown'));
        think(KEEPERS[shop.id].gossip ? THOUGHTS.caughtGossip : THOUGHTS.caught);
        audio.caught();
        vibrate([60, 40, 60]);
        fx.push({ kind: 'caught', t: 0 });
        if (r.kick) { say(shop, LINES.kick); view = 'shop'; curItem = null; }
        return;
      }
      if (cite.truth && cite.other && Math.random() < 0.35) {
        addLine('event', fill(L(LINES.shout), { name: kname(shop), other, item: iname(it), n: num(n) }));
        addLine('say', L(LINES.shoutYes), cite.other);
      }
      if (r.t === 'match') { say(shop, LINES.bluffMatch, { other, n: num(n), p: num(r.p) }); if (!cite.truth) think(THOUGHTS.bluffWin); }
      else say(shop, LINES.bluffNo, { n: num(n), p: num(r.p) });
      tellAndThink(shop, ls);
      clampOffer();
    });
  }

  function doAccept() {
    const ls = curShop.listings[curItem];
    if (ls.ask > G.money) { addLine('bad', t('noMoney')); addLine('sys', fill(t('poorLine'), { p: num(G.money) })); renderPanel(); return; }
    act(fill(L(ME.accept), { p: num(ls.ask) }), () => {
      const r = coreAccept(curShop, ls);
      if (r.t === 'poor') { addLine('bad', t('noMoney')); return; }
      respondDeal(r);
    });
  }

  function doChat() {
    const shop = curShop;
    act(L(ME.chat), () => {
      const r = coreChat(shop);
      addLine('say', L(KEEPERS[shop.id].chat), shop);
      say(shop, r.noBohani ? LINES.chatNoBohani : LINES.chatBohani);
      if (KEEPERS[shop.id].kind === 'chatty') { say(shop, LINES.chatty); think(THOUGHTS.chatty); }
    });
  }

  function doWalk() {
    const shop = curShop, ls = shop.listings[curItem];
    act(pick(L(ME.walk)), () => {
      const r = coreWalk(shop, ls);
      if (r.t === 'callback') { ls.hist.push({ me: false, p: r.p }); say(shop, LINES.callback, { p: num(r.p) }); audio.callback(); clampOffer(); return; }
      curItem = null;
      view = 'lane';
      audio.setScene('lane');
    });
  }

  function backLane() {
    if (busy) return;
    voice.stop();
    curItem = null;
    view = 'lane';
    audio.setScene('lane');
    renderPanel();
  }

  function goHome() {
    if (busy) return;
    const miss = needed();
    if (miss.length && !homeConfirm && G.minutes < DAY) {
      homeConfirm = true;
      think({ ne: fill(TEXT.ne.homeWarn, { list: miss.map((x) => ITEMS[x].name.ne).join(', ') }), en: fill(TEXT.en.homeWarn, { list: miss.map((x) => ITEMS[x].name.en).join(', ') }) });
      renderPanel();
      return;
    }
    endDay(false);
  }

  function endDay(closed) {
    if (state !== 'play') return;
    state = 'over';
    busy = false;
    voice.stop();
    const LV = LEVELS[G.level], miss = needed();
    const saved = G.money, pct = saved / G.budget;
    const stars = miss.length ? 0 : pct >= LV.stars[2] ? 3 : pct >= LV.stars[1] ? 2 : pct >= LV.stars[0] ? 1 : 0;
    const pass = stars > 0;
    if (stars === 3) earn('three');
    const prog = progress();
    if (stars > (prog[G.level] || 0)) { prog[G.level] = stars; store.set('mm_levels', prog); }
    const fresh = [...G.earned].filter((b) => !badges.has(b));
    for (const b of fresh) badges.add(b);
    store.set('mm_badges', [...badges]);

    const kind = miss.length ? 'scold' : stars >= 2 ? 'happy' : pass ? 'ok' : 'scold';
    ui.overLvl.textContent = `${fill(t('level'), { n: digits(G.level + 1) })} · ${L(LEVEL_TEXT[G.level].name)}`;
    ui.overNum.textContent = digits(G.level + 1);
    ui.overTitle.textContent = pass ? t('passTitle') : miss.length ? t('missTitle') : t('failTitle');
    ui.overTitle.lang = shared.lang;
    const missNames = miss.map(iname).join(', ');
    ui.overSub.textContent = (closed ? t('closed') + ' ' : '') + (miss.length ? fill(L(ENDINGS.scold.sub), { list: missNames }) : pass ? fill(L(ENDINGS[kind].sub), { s: num(saved) }) : fill(t('failSub'), { s: num(saved), t: num(G.target) }));
    ui.overThought.textContent = L(miss.includes('goat') ? AAMA.goat : AAMA[stars]);
    ui.stars.innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">${icon('star')}</span>`).join('');
    ui.stars.setAttribute('aria-label', `${stars}/3`);
    const scale = LV.stars[2] * 1.15;
    ui.meterGoal.style.left = `${(LV.stars[0] / scale) * 100}%`;
    ui.meterFill.style.width = '0%';
    requestAnimationFrame(() => requestAnimationFrame(() => { ui.meterFill.style.width = `${clamp(miss.length ? 0 : pct / scale, 0, 1) * 100}%`; }));
    ui.meterSaved.textContent = fill(t('savedOf'), { s: rs(miss.length ? 0 : saved), p: digits(Math.round((miss.length ? 0 : pct) * 100)) });
    ui.meterTarget.textContent = fill(t('goalOf'), { s: rs(G.target) });
    const cur = shared.lang === 'ne' ? 'रु.' : 'Rs';
    ui.tallySaved.innerHTML = `<small>${cur}</small>${num(miss.length ? 0 : saved)}`;
    ui.tallySaved.classList.toggle('win', pass);
    ui.tallyGoal.innerHTML = `<small>${cur}</small>${num(G.target)}`;
    ui.meterNext.innerHTML = LV.stars.map((k, i) => {
      const need = niceUp(G.budget * k, 50);
      return `<span class="${stars > i ? 'got' : ''}">${icon('star').repeat(i + 1)} ${esc(rs(need))}</span>`;
    }).join('');
    ui.receipt.innerHTML = '';
    for (const it of G.list) {
      const li = document.createElement('li');
      const a = document.createElement('span'), b = document.createElement('span');
      a.textContent = cap(iname(it));
      if (G.bought[it]) b.textContent = rs(G.bought[it].price);
      else { b.textContent = t('missing'); li.className = 'miss'; }
      li.append(a, b);
      ui.receipt.appendChild(li);
    }
    renderBadges(ui.newBadges, new Set(fresh), t('newBadges'));
    const last = G.level >= LEVELS.length - 1;
    ui.next.classList.toggle('hidden', !pass);
    ui.next.innerHTML = `<span>${esc(last ? t('allDone') : fill(t('nextLevel'), { n: digits(G.level + 2) }))}</span>${icon('play')}`;
    ui.retry.classList.toggle('primary', !pass);
    ui.retry.innerHTML = `<span>${esc(t('again'))}</span>${icon('retry')}`;
    ui.toMenu.innerHTML = `<span>${esc(t('menu'))}</span>${icon('grid')}`;
    ui.share.innerHTML = `<span>${esc(t('share'))}</span>${icon('share')}`;
    lastEnd = { level: G.level, stars, saved, miss: miss.length, pass };
    selLevel = pass && !last ? G.level + 1 : G.level;
    ui.hud.classList.add('hidden');
    ui.panel.classList.add('hidden');
    ui.sheet.classList.add('hidden');
    ui.over.classList.remove('hidden');
    ui.over.scrollTop = 0;
    resize();
    audio.setScene('menu');
    audio.ending(kind);
    (pass ? ui.next : ui.retry).focus();
  }
  let lastEnd = null;

  // ---------- Menu, list sheet, badges ----------
  function renderBadges(el, set, title) {
    el.innerHTML = '';
    const list = title ? BADGES.filter((b) => set.has(b.id)) : BADGES;
    if (!list.length) return;
    const h = document.createElement('p');
    h.className = 'badges-title';
    h.textContent = title || `${t('badgesLbl')} ${digits(BADGES.filter((b) => set.has(b.id)).length)}/${digits(BADGES.length)}`;
    el.appendChild(h);
    for (const b of list) {
      const c = document.createElement('span');
      c.className = `chip${set.has(b.id) ? ' on' : ''}`;
      c.textContent = b[shared.lang];
      el.appendChild(c);
    }
  }

  function renderLevels() {
    const prog = progress();
    const total = Object.values(prog).reduce((a, b) => a + b, 0);
    ui.starTotal.innerHTML = `${icon('star')}${digits(total)}/${digits(LEVELS.length * 3)}`;
    ui.monthName.textContent = shared.lang === 'ne' ? 'कात्तिक २०८३' : 'Kartik 2083';
    if (!unlocked(selLevel)) selLevel = 0;
    ui.levels.innerHTML = '';
    LEVELS.forEach((LV, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      const open = unlocked(i), st = prog[i] || 0;
      b.type = 'button';
      b.className = `lvl${i === selLevel ? ' sel' : ''}${open && !st ? ' cur' : ''}${i === HOLIDAY ? ' holiday' : ''}`;
      b.disabled = !open;
      b.innerHTML = `<span class="n">${digits(i + 1)}</span><span class="cn">${esc(TITHI[shared.lang][i])}</span><span class="nm">${esc(L(LEVEL_TEXT[i].name))}</span><span class="st">${[1, 2, 3].map((k) => icon('star', k <= st ? 'on' : '')).join('')}${open ? '' : icon('lock', 'lock')}</span>`;
      b.setAttribute('aria-label', `${fill(t('level'), { n: i + 1 })}: ${L(LEVEL_TEXT[i].name)}, ${st}/3`);
      b.setAttribute('aria-pressed', String(i === selLevel));
      b.addEventListener('click', () => { selLevel = i; audio.init(); audio.tick(); renderLevels(); });
      li.appendChild(b);
      ui.levels.appendChild(li);
    });
    const LV = LEVELS[selLevel], end = 600 + LV.day, eh = Math.floor(end / 60) % 12 || 12, em = String(end % 60).padStart(2, '0');
    ui.brief.innerHTML = `<h2>${esc(fill(t('level'), { n: digits(selLevel + 1) }))} · ${esc(L(LEVEL_TEXT[selLevel].name))}</h2>`
      + `<p class="idea">${esc(L(LEVEL_TEXT[selLevel].idea))}</p>`
      + `<div class="facts"><div><span>${esc(t('targetShort'))}</span><b>${digits(Math.round(LV.stars[0] * 100))}%</b></div><div><span>${esc(t('itemsLbl'))}</span><b>${digits(LV.items)}</b></div><div><span>${esc(t('hoursLbl'))}</span><b>${digits(`10:00–${eh}:${em}`)}</b></div></div>`
      + `<div class="goals">${LV.stars.map((k, j) => `<div class="${(progress()[selLevel] || 0) > j ? 'got' : ''}"><span class="sts">${icon('star').repeat(j + 1)}</span><b>${digits(Math.round(k * 100))}%</b></div>`).join('')}</div>`
      + `<ul class="tolelist">${ALL_TOLES.slice(0, LV.toles).map((id, j) => `<li class="${selLevel > 0 && j >= LEVELS[selLevel - 1].toles ? 'new' : ''}">${esc(tname(id))}</li>`).join('')}</ul>`
      + `<button class="play" id="playBtn" type="button"><span>${esc(t('play'))}</span>${icon('play')}</button>`;
    $('playBtn').addEventListener('click', () => start(selLevel));
  }
  function applyLang() {
    document.documentElement.lang = shared.lang;
    for (const el of document.querySelectorAll('[data-i18n]')) { const v = t(el.dataset.i18n); if (typeof v === 'string') el.textContent = v; }
    renderLevels();
    renderBadges(ui.badges, badges);
    ui.meVoice.textContent = t('meVoice')[voice.me];
    ui.listBtn.innerHTML = `${icon('list')}<span>${esc(t('list'))}</span>`;
    setMuteUI(); setVoiceUI();
  }
  function firstOpenLevel() {
    const prog = progress();
    let i = 0;
    while (i < LEVELS.length - 1 && (prog[i] || 0) > 0) i++;
    return i;
  }

  function openSheet() {
    ui.listItems.innerHTML = '';
    const m = document.createElement('li');
    m.className = 'money';
    m.textContent = `${t('pocket')}: ${rs(G.money)} / ${rs(G.budget)}`;
    ui.listItems.appendChild(m);
    for (const it of G.list) {
      const li = document.createElement('li');
      const done = G.bought[it];
      if (done) li.className = 'done';
      const b = document.createElement('b');
      b.textContent = `${cap(iname(it))}${done ? ` · ${rs(done.price)}` : ''}`;
      li.appendChild(b);
      const h = document.createElement('span');
      h.className = 'hint';
      h.textContent = `${t('aamaSays')} ${rs(G.items[it].hint)}`;
      li.appendChild(h);
      const qs = G.notes.filter((q) => q.item === it).sort((a, c) => a.price - c.price);
      for (const q of qs) {
        const s = document.createElement('span');
        s.className = 'q';
        const shop = G.shops.find((x) => x.id === q.shop);
        s.textContent = fill(t(q.kind === 'tip' ? 'tipNote' : q.kind === 'friend' ? 'friendNote' : 'quoteNote'), { name: kname(shop), p: num(q.price) });
        li.appendChild(s);
      }
      if (!qs.length && !done) { const s = document.createElement('span'); s.className = 'q'; s.textContent = t('noQuotes'); li.appendChild(s); }
      ui.listItems.appendChild(li);
    }
    ui.sheet.classList.remove('hidden');
    ui.sheetClose.focus();
  }
  function closeSheet() { ui.sheet.classList.add('hidden'); ui.listBtn.focus(); }

  function setMuteUI() {
    for (const b of [ui.mute, ui.menuMute]) { if (!b) continue; b.innerHTML = icon(audio.muted ? 'soundOff' : 'sound'); b.classList.toggle('off', audio.muted); b.setAttribute('aria-pressed', String(audio.muted)); }
  }

  // ---------- Rendering ----------
  const hudBottom = () => (state === 'play' && !ui.hud.classList.contains('hidden') ? ui.hud.getBoundingClientRect().bottom : 0);
  let W = 0, H = 0, DPR = 1, sidebar = false, VHs = 0, SW = 200, gy = 0, camX = 0;
  let walkers = [], kites = [], pigeons = [], bikes = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const vw = window.innerWidth, vh = window.innerHeight;
    sidebar = state === 'play' && vw >= 900 && vw / vh >= 1.25;
    W = sidebar ? vw - Math.min(440, vw * 0.36) : vw; H = vh;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!VHs) VHs = H;
    if (!walkers.length) {
      walkers = Array.from({ length: 30 }, () => makePerson(rand(-6, 6)));
      bikes = Array.from({ length: 2 }, () => ({ x: rand(-6, 6), dir: Math.random() < 0.5 ? -1 : 1, sp: rand(1.1, 1.7), col: pick(['#c62828', '#1565c0', '#212121', '#6a1b9a']), shirt: pick(CLOTH), pants: '#263238', helmet: pick(['#f5f5f5', '#e53935', '#212121', '#fdd835']) }));
      kites = Array.from({ length: 6 }, (_, i) => ({ x: rand(-1, 10), y: rand(0.06, 0.22), c: FLAG[i % 5], c2: pick(['#e23b3b', '#1f6fd1', '#f5c518', '#2e9e5b']), ph: rand(0, TAU) }));
      pigeons = Array.from({ length: 16 }, () => ({ x: rand(-2.4, 0.3), r: Math.random(), ph: rand(0, TAU) }));
    }
  }

  function targetVH() {
    if (state !== 'play' || sidebar) return H;
    const top = ui.panel.getBoundingClientRect().top;
    return clamp(top, H * 0.36, H);
  }


  function playerPos() {
    if (!G) return 4;
    if (walkAnim) return lerp(walkAnim.from, walkAnim.to, ease(clamp(walkAnim.t / walkAnim.dur, 0, 1)));
    return G.pos;
  }
  const playerWX = () => (playerPos() + 0.5) * SW;
  const laneTole = () => (G ? G.tole : 'asan');
  const laneN = () => Math.max(1, toleShops(laneTole()).length || 3);

  function skyColors() {
    const k = G ? G.minutes / DAY : 0.3;
    const top = k < 0.6 ? '#4f9be6' : k < 0.85 ? '#5a86d0' : '#3d4f9a';
    const bot = k < 0.5 ? '#cfe8ff' : k < 0.8 ? '#ffe2b0' : '#ffad6b';
    return [top, bot];
  }

  // The scene height eases toward the top of the panel; VHt is where it is heading.
  let VHt = 0;
  function settleVH(dt) { VHt = targetVH(); VHs = lerp(VHs || H, VHt, Math.min(1, dt * 8)); }

  // In play the patro band (top) and the panel (bottom) are opaque, so only the strip of canvas between them is drawn.
  // The clip needs save/restore; the pen (colours, line width and caps, font) is carried over to the next frame
  // as it always was, so every frame draws exactly as before.
  const PEN = ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'globalAlpha'];
  function render(dt) {
    settleVH(dt);
    const top = state === 'play' ? Math.max(0, Math.floor(hudBottom() * DPR) - 2) / DPR : 0;
    const bot = state === 'play' && !sidebar ? Math.min(H, (Math.ceil(ui.panel.getBoundingClientRect().top * DPR) + 2) / DPR) : H;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, top, W, bot - top); ctx.clip();
    ctx.clearRect(0, 0, W, H);
    if (state === 'play' && (view === 'map' || mapWalk)) drawFullMap();
    else if (state === 'play' && (view === 'shop' || view === 'haggle') && curShop && !walkAnim) drawShopClose(dt);
    else drawLane(dt);
    drawFx(dt);
    const pen = PEN.map((k) => ctx[k]);
    ctx.restore();
    PEN.forEach((k, i) => { ctx[k] = pen[i]; });
  }

  // ----- Asan bazaar: the lane, the Annapurna temple at the chowk, the crowd -----
  // Each house is drawn once into its own small canvas, then copied every frame (scaled to the street's current size).
  const facadeCache = new Map();
  function facade(i, shop, w = SW, gq = gy) {
    const key = `${i}|${shop ? shop.id : ''}|${Math.round(w / 6)}|${Math.round(gq / 6)}|${shared.lang}|${DPR}`;
    let f = facadeCache.get(key);
    if (f) return f;
    if (facadeCache.size > 110) facadeCache.clear();
    const pad = Math.ceil(w * 0.1);
    const c = document.createElement('canvas');
    c.width = Math.ceil((w + pad * 2) * DPR); c.height = Math.ceil((gq + 2) * DPR);
    const o = c.getContext('2d');
    o.setTransform(DPR, 0, 0, DPR, pad * DPR, gq * DPR);
    let meta = null;
    withCtx(o, () => { meta = buildFacade(i, w, gq, shop); });
    f = { c, pad, w, gq, top: meta.top / gq, side: meta.side };
    facadeCache.set(key, f);
    return f;
  }
  function blitFacade(f, x) {
    const sx = SW / f.w, sy = gy / f.gq;
    ctx.drawImage(f.c, x - f.pad * sx, gy - f.gq * sy, (f.c.width / DPR) * sx, (f.c.height / DPR) * sy);
  }

  // Annapurna temple at Asan chowk: three gilded roofs, bells, the long golden banner
  let templeCache = null, templeKey = '';
  function temple(T) {
    const key = `${Math.round(T / 4)}|${DPR}`;
    if (templeKey === key) return templeCache;
    const wd = T * 2.2, ht = T * 1.45;
    const c = document.createElement('canvas');
    c.width = Math.ceil(wd * DPR); c.height = Math.ceil(ht * DPR);
    const o = c.getContext('2d');
    o.setTransform(DPR, 0, 0, DPR, (wd / 2) * DPR, ht * DPR);
    withCtx(o, () => buildTemple(T));
    templeCache = { c, wd, ht, T }; templeKey = key;
    return templeCache;
  }
  // Tangled electric wires on concrete poles: the Kathmandu skyline
  function drawWires() {
    const poles = [];
    for (let i = -6; i <= laneN() + 4; i += 3) poles.push(i * SW + SW * 0.02);
    for (let p = 0; p < poles.length - 1; p++) {
      const x0 = poles[p] - camX, x1 = poles[p + 1] - camX;
      if (x1 < -20 || x0 > W + 20) continue;
      for (let k = 0; k < 9; k++) {
        const y0 = gy * (0.2 + k * 0.022 + hash(p * 13 + k) * 0.02), y1 = gy * (0.2 + k * 0.022 + hash(p * 13 + k + 1) * 0.02);
        const sag = gy * (0.04 + hash(p * 7 + k) * 0.08);
        ctx.strokeStyle = k % 4 === 0 ? 'rgba(20,20,20,0.85)' : 'rgba(30,30,30,0.6)'; ctx.lineWidth = k % 4 === 0 ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1); ctx.stroke();
      }
    }
    for (const px of poles) {
      const x = px - camX;
      if (x < -30 || x > W + 30) continue;
      const pw = Math.max(4, gy * 0.014);
      ctx.fillStyle = '#9e9a92'; ctx.fillRect(x - pw / 2, gy * 0.17, pw, gy * 0.83);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + pw * 0.1, gy * 0.17, pw * 0.4, gy * 0.83);
      ctx.fillStyle = '#6d6a64'; ctx.fillRect(x - gy * 0.05, gy * 0.2, gy * 0.1, 3); ctx.fillRect(x - gy * 0.035, gy * 0.26, gy * 0.07, 3);
      ctx.strokeStyle = 'rgba(15,15,15,0.85)'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + gy * 0.012, gy * (0.33 + k * 0.018), gy * 0.025, gy * 0.012, 0.2, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#546e7a'; ctx.fillRect(x - gy * 0.025, gy * 0.42, gy * 0.05, gy * 0.07);
      ctx.fillStyle = '#ffeb3b'; ctx.fillRect(x - gy * 0.006, gy * 0.44, gy * 0.012, gy * 0.012);
    }
  }

  // Brick paving, basket-weave
  let streetPat = null, streetKey = '', streetL = 10;
  function streetPattern() {
    const L = Math.max(8, Math.round(gy * 0.032)), key = `${L}|${DPR}`;
    if (streetKey === key) return streetPat;
    const S = L * 2, c = document.createElement('canvas');
    c.width = S * DPR; c.height = S * DPR;
    const o = c.getContext('2d'); o.scale(DPR, DPR);
    o.fillStyle = '#5a3524'; o.fillRect(0, 0, S, S);
    const R = mulberry32(77);
    const brick = (x, y, w, h) => { const v = R(); o.fillStyle = v < 0.3 ? '#a0583a' : v < 0.6 ? '#93502f' : v < 0.85 ? '#8a4a2e' : '#7a4030'; o.fillRect(x + 1, y + 1, w - 2, h - 2); };
    brick(0, 0, L, L / 2); brick(0, L / 2, L, L / 2);
    brick(L, 0, L / 2, L); brick(L * 1.5, 0, L / 2, L);
    brick(0, L, L / 2, L); brick(L / 2, L, L / 2, L);
    brick(L, L, L, L / 2); brick(L, L * 1.5, L, L / 2);
    streetPat = ctx.createPattern(c, 'repeat');
    if (streetPat.setTransform && window.DOMMatrix) streetPat.setTransform(new DOMMatrix().scale(1 / DPR));
    streetKey = key; streetL = L;
    return streetPat;
  }
  // Brick paving as a ground plane in perspective: bricks grow toward the viewer and slide faster as you walk.
  let vpY = 0;
  const depthS = (y) => 1 + (y - gy) / (gy - vpY);
  const projX = (wx, sc) => W / 2 + (wx - camX - W / 2) * sc;
  function drawStreet(y0, cam, vy) {
    const pat = streetPattern(), d = y0 - vy, Zc = d * 2.2, step = 3, yEnd = Math.min(H, (sidebar || state !== 'play' ? H : VHs) + 12);
    ctx.fillStyle = '#5a3524'; ctx.fillRect(0, y0, W, H - y0);
    for (let y = y0; y < yEnd; y += step) {
      const sc = 1 + (y - y0) / d, wz = Zc * (1 - 1 / sc), dz = Zc / (sc * sc * d);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, y, W, step + 0.6); ctx.clip();
      ctx.setTransform(DPR * sc, 0, 0, DPR / dz, DPR * (W / 2 - (cam + W / 2) * sc), DPR * (y - wz / dz));
      ctx.fillStyle = pat;
      ctx.fillRect(cam + W / 2 - W / (2 * sc) - 40, wz - 2, W / sc + 80, step * dz + 4);
      ctx.restore();
    }
    const g = ctx.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, 'rgba(20,10,5,0.5)'); g.addColorStop(0.1, 'rgba(20,10,5,0.14)'); g.addColorStop(0.45, 'rgba(255,230,190,0.06)'); g.addColorStop(1, 'rgba(20,10,5,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0);
    ctx.fillStyle = '#7d776e'; ctx.fillRect(0, y0, W, Math.max(3, VHs * 0.008));
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, y0, W, 1);
  }

  // Where a tall house stands beside a shorter one (or the open chowk), you see its side wall going back toward the eye line.
  function drawSideWall(ex, yTall, yLow, side, faceRight) {
    const k = 0.1, vx = W / 2, px = (x) => x + (vx - x) * k, py = (y) => y + (vpY - y) * k;
    if ((faceRight && vx <= ex) || (!faceRight && vx >= ex)) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(faceRight ? ex - 1 : 0, -10, faceRight ? W : ex + 1, yLow + 10); ctx.clip();
    ctx.fillStyle = side;
    poly([[ex, yTall], [ex, yLow + 40], [px(ex), py(yLow + 40)], [px(ex), py(yTall)]]);
    const g = ctx.createLinearGradient(ex, 0, px(ex), 0);
    g.addColorStop(0, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g;
    poly([[ex, yTall], [ex, yLow + 40], [px(ex), py(yLow + 40)], [px(ex), py(yTall)]]);
    ctx.restore();
  }

  function drawLane(dt) {
    const vh = VHs;
    gy = vh * 0.82;
    SW = clamp(vh * 0.62, W / 3.6, W / 1.6);
    // Houses and the temple are cached at the size the street is easing toward, so they are not redrawn on every step of the ease.
    const fw = clamp(VHt * 0.62, W / 3.6, W / 1.6), fg = VHt * 0.82;
    const LT = laneTole(), TT = TOLE[LT], n = laneN(), base = TT.idx * 40, isAsan = LT === 'asan', total = n * SW;
    let target;
    if (state === 'play' && G) target = playerWX() - W / 2;
    else target = lerp(-3.2 * SW, total - W + SW, (Math.sin(time * 0.05) + 1) / 2);
    camX = state === 'play' ? lerp(camX, target, Math.min(1, dt * (walkAnim ? 9 : 4))) : target;

    const [top, bot] = skyColors();
    const g = ctx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy);
    // distant hills in the haze
    ctx.fillStyle = 'rgba(90,110,130,0.35)';
    ctx.beginPath(); ctx.moveTo(0, gy * 0.5);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, gy * (0.42 + 0.05 * Math.sin((x + camX * 0.1) * 0.01) + 0.03 * Math.sin((x + camX * 0.1) * 0.027)));
    ctx.lineTo(W, gy); ctx.lineTo(0, gy); ctx.fill();
    for (const k of kites) {
      const x = ((k.x * SW - camX * 0.3) % (total + W) + total + W) % (total + W) - SW * 0.5;
      drawKite(x, vh * k.y + Math.sin(time * 0.8 + k.ph) * vh * 0.015, vh * 0.026, k.c, k.c2, time + k.ph);
    }

    // a second row of houses behind, hazy: seen over low rooftops and across the chowk
    const bz = 0.78, bw = SW * bz, bcam = camX * 0.88;
    for (let i = Math.floor(bcam / bw) - 1; i < Math.floor(bcam / bw) + W / bw + 2; i++) {
      const f = facade(500 + i, null, fw, fg), sx = (SW / f.w) * bz, sy = (gy / f.gq) * bz, x = i * bw - bcam;
      ctx.drawImage(f.c, x - f.pad * sx, gy - gy * 0.04 - f.gq * sy, (f.c.width / DPR) * sx, (f.c.height / DPR) * sy);
    }
    ctx.fillStyle = 'rgba(190,205,222,0.42)'; ctx.fillRect(0, 0, W, gy);
    // the tole you are standing in: its houses and shops (Asan has the temple chowk at slots -2 and -1)
    vpY = gy - gy * 0.36;
    if (TT.open) {
      drawOpenGround(vh, n, camX);
      drawField(gy, camX);
      for (let i = 0; i < n; i++) {
        const x = i * SW - camX, shop = G ? shopAt(i, LT) : null;
        if (x > W + SW * 0.2 || x + SW * 1.2 < 0) continue;
        drawStall(x, vh, ['#1e66b0', '#e65100', '#2f7d4a'][i % 3]);
        if (shop) drawShopLife(shop, x, vh);
      }
    } else {
      const tops = {};
      for (let i = -6; i < n + 3; i++) {
        if (isAsan && (i === -2 || i === -1)) continue;
        const x = i * SW - camX;
        if (x > W + SW * 0.2 || x + SW * 1.2 < 0) continue;
        const shop = G && i >= 0 && i < n ? shopAt(i, LT) : null;
        const f = facade(base + i, shop, fw, fg);
        blitFacade(f, x);
        tops[i] = f;
        if (shop) drawShopLife(shop, x, vh);
      }
      for (let i = -7; i < n + 3; i++) {
        const a = tops[i], b = tops[i + 1], ex = (i + 1) * SW - camX;
        const ya = a ? gy + a.top * gy : gy, yb = b ? gy + b.top * gy : gy;
        if (a && ya < yb - 2) drawSideWall(ex, ya, yb, a.side, true);
        else if (b && yb < ya - 2) drawSideWall(ex, yb, ya, b.side, false);
      }
      if (isAsan) {
        const tc = temple(Math.min(fw * 1.05, fg * 0.6)), k = Math.min(SW * 1.05, gy * 0.6) / tc.T, wd = tc.wd * k, ht = tc.ht * k, tx = -SW - camX;
        if (tx + wd / 2 > 0 && tx - wd / 2 < W) ctx.drawImage(tc.c, tx - wd / 2, gy - ht, wd, ht);
      }
      drawWires();
      drawStreet(gy, camX, vpY);
    }

    // pigeons around the chowk
    if (isAsan || TT.open) for (const p of pigeons) {
      const y = gy + vh * (0.03 + p.r * 0.1), sc = depthS(y), x = projX(p.x * SW, sc);
      if (x < -20 || x > W + 20) continue;
      drawPigeon(x, y, vh * 0.0065 * sc, time + p.ph);
    }
    // the crowd, back to front: nearer people are bigger and slide past faster
    const actors = [];
    for (const w of walkers) {
      w.x += w.dir * w.sp * dt;
      if (w.x > n + 3) w.x = -6; if (w.x < -6) w.x = n + 3;
      const y = gy + vh * (0.03 + w.row * 0.05), sc = depthS(y);
      actors.push({ y, draw: () => drawPerson(w, projX(w.x * SW, sc), y, gy * 0.15 * sc * w.h * (w.type === 'kid' ? 0.68 : 1), time * 7 * w.sp * 4 + w.ph, true) });
    }
    for (const b of bikes) {
      b.x += b.dir * b.sp * dt;
      if (b.x > n + 4) b.x = -7; if (b.x < -7) b.x = n + 4;
      if (TT.open) continue;
      const y = gy + vh * 0.15, sc = depthS(y);
      actors.push({ y, draw: () => drawBike(b, projX(b.x * SW, sc), y, gy * 0.2 * sc) });
    }
    if (state === 'play' && G) {
      const py = gy + vh * 0.11, sc = depthS(py), px = projX(playerWX(), sc);
      actors.push({ y: py, draw: () => {
        if (G.bought.goat) drawGoat(px - gy * 0.1 * sc * playerDir, py, gy * 0.085 * sc, playerDir < 0, '#f2ede4', walkAnim ? time * 10 : 0);
        drawPerson(playerLook(), px, py, gy * 0.15 * sc, time * 9, !!walkAnim);
        const my = py - gy * 0.17 * sc, ms = gy * 0.018;
        ctx.fillStyle = '#d7261e'; ctx.strokeStyle = '#141414'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px - ms, my - ms * 1.4); ctx.lineTo(px + ms, my - ms * 1.4); ctx.lineTo(px, my); ctx.closePath(); ctx.fill(); ctx.stroke();
      } });
    }
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw();

    // time of day: warm afternoon, orange evening
    const k = G ? G.minutes / DAY : 0.35;
    ctx.fillStyle = k < 0.5 ? 'rgba(255,236,200,0.05)' : k < 0.8 ? `rgba(255,190,110,${(0.06 + (k - 0.5) * 0.25).toFixed(3)})` : `rgba(255,120,60,${(0.14 + (k - 0.8) * 0.5).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    miniRect = null;
    if (state === 'play' && G && view === 'lane') {
      const m = clamp(Math.min(W * 0.34, VHs * 0.34), 92, 180);
      miniRect = { x: W - m - 10, y: hudBottom() + 10, w: m, h: m };
      drawMap(miniRect, false);
    }
  }

  // ----- The map of Asan: a mini-map in the corner of the street, and the full map for planning a route -----
  const catColor = (s) => CAT[KEEPERS[s.id].cat].color;
  // Which way each tole's shop pins fan out on the map, so neighbouring toles don't overlap.
  const PIN_DIR = { asan: -2.6, kamalakshi: -0.75, bhotahity: 0.9, balkumari: 2.0, keltol: 2.4, indrachowk: 1.6, bangemuda: -2.1, khulamanch: -0.5 };
  const LABEL_OFF = { asan: [8, 30], kamalakshi: [-46, -8], bhotahity: [40, -12], balkumari: [-6, -14], keltol: [-4, -14], indrachowk: [-44, -10], bangemuda: [0, 26], khulamanch: [0, 28] };
  let mapHits = [], miniRect = null;
  function mapFit(rect) { const sc = Math.min(rect.w / MAP.w, rect.h / MAP.h); return { sc, ox: rect.x + (rect.w - MAP.w * sc) / 2, oy: rect.y + (rect.h - MAP.h * sc) / 2 }; }
  const pinR = (f) => clamp(12 * f.sc / 0.9, 8, 12);
  function pinXY(s, f, full) {
    const T = TOLE[s.tole], a = PIN_DIR[s.tole] || 0, r = pinR(f), d = full ? r * 1.8 + s.pos * r * 2.2 : 4 + s.pos * 4.5;
    return [f.ox + T.x * f.sc + Math.cos(a) * d, f.oy + T.y * f.sc + Math.sin(a) * d];
  }
  function playerMapXY() {
    if (mapWalk) {
      const P = mapWalk.pts, k = ease(clamp(mapWalk.t / mapWalk.dur, 0, 1)) * mapWalk.len;
      let acc = 0;
      for (let i = 1; i < P.length; i++) {
        const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
        if (acc + d >= k) { const tt = d ? (k - acc) / d : 0; return [lerp(P[i - 1][0], P[i][0], tt), lerp(P[i - 1][1], P[i][1], tt)]; }
        acc += d;
      }
      return P[P.length - 1];
    }
    const T = TOLE[G.tole];
    return [T.x, T.y];
  }
  // The map is printed in the patro's two inks: black streets on paper, red for what matters to you.
  // The paper, ponds, parks and streets never change, so they are drawn once per map size into a spare canvas
  // (lined up with the screen's device pixels) and copied every frame.
  const mapBase = { mini: null, full: null };
  function drawMap(rect, full) {
    const f = mapFit(rect), X = (x) => f.ox + x * f.sc, Y = (y) => f.oy + y * f.sc;
    const INK = '#141414', RED = '#d7261e', PAPER = '#fdfcf8';
    const kind = full ? 'full' : 'mini', key = `${rect.x}|${rect.y}|${rect.w}|${rect.h}|${DPR}`;
    let b = mapBase[kind];
    if (!b || b.key !== key) {
      const dx = Math.floor(rect.x * DPR) - 1, dy = Math.floor(rect.y * DPR) - 1, c = b ? b.c : document.createElement('canvas');
      c.width = Math.ceil((rect.x + rect.w) * DPR) + 1 - dx; c.height = Math.ceil((rect.y + rect.h) * DPR) + 1 - dy;
      const o = c.getContext('2d');
      o.setTransform(DPR, 0, 0, DPR, -dx, -dy);
      withCtx(o, () => drawMapBase(rect, full, f, X, Y));
      b = mapBase[kind] = { key, c, dx, dy };
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(b.c, b.dx, b.dy);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const drawPath = (pts, col, w, dash) => {
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.lineCap = 'butt';
      ctx.beginPath(); pts.forEach((p, i) => { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); }); ctx.stroke();
      ctx.setLineDash([]); ctx.lineCap = 'round';
    };
    if (G) {
      let tole = G.tole;
      for (const s of G.route) { if (s.tole !== tole) drawPath(tolePath(tole, s.tole), INK, full ? 3.5 : 2, full ? [8, 5] : [4, 3]); tole = s.tole; }
      if (full && mapSel && mapSel.tole !== G.tole && !mapWalk) drawPath(tolePath(G.tole, mapSel.tole), RED, 4);
      if (mapWalk) drawPath(mapWalk.pts, RED, full ? 5 : 2.5);
    }
    if (full) {
      for (const l of MAP.l) {
        const x = X(l.x), y = Y(l.y);
        if (l.k === 'temple') { ctx.fillStyle = RED; poly([[x - 5, y + 3], [x + 5, y + 3], [x, y - 7]]); ctx.fillRect(x - 5, y + 3, 10, 3); continue; }
        mapLabel(L(l), x, y + 4, 11, '#4a4a4a', 700);
      }
    }
    for (const T of Object.values(TOLE)) {
      const x = X(T.x), y = Y(T.y), d = full ? 4.5 : 2;
      ctx.fillStyle = INK; ctx.fillRect(x - d, y - d, d * 2, d * 2);
      if (full) { // paper knock-out under the name, laid before the pins so pins stay on top
        const o = LABEL_OFF[T.id] || [0, 24], k = clamp(f.sc / 0.9, 0.6, 1), size = f.sc < 0.6 ? 12 : 14;
        ctx.font = `800 ${size}px ${FONT}`;
        const tw = ctx.measureText(L(T)).width, lx = x + o[0] * k, ly = y + o[1] * k;
        ctx.fillStyle = 'rgba(253,252,248,0.9)'; ctx.fillRect(lx - tw / 2 - 3, ly - size, tw + 6, size + 4);
      }
    }
    mapHits = full ? [] : mapHits;
    if (G) for (const s of G.shops) {
      const [x, y] = pinXY(s, f, full), use = useful(s), out = KEEPERS[s.id].stock && !s.stock;
      if (full) { // each shop is a small day-cell: the walk in minutes is its numeral; red cells sell what you need
        const T = TOLE[s.tole], r = pinR(f);
        ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(T.x), Y(T.y)); ctx.lineTo(x, y); ctx.stroke();
        if (mapSel === s) { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x - r - 5, y - r - 5, r * 2 + 10, r * 2 + 10); }
        ctx.fillStyle = use && !out ? RED : PAPER; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
        const here = s.tole === G.tole && s.pos === G.pos;
        if (here) { ctx.fillStyle = use && !out ? '#ffffff' : INK; ctx.fillRect(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.6); }
        else mapLabel(digits(walkMin(s)), x, y + r * 0.42, Math.round(r * 1.15), use && !out ? '#ffffff' : INK, 800, true);
        if (out) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.stroke(); }
        const ri = G.route.indexOf(s);
        if (ri >= 0) { const bs = Math.max(13, r * 1.1); ctx.fillStyle = INK; ctx.fillRect(x + r - bs * 0.4, y - r - bs * 0.6, bs, bs); mapLabel(digits(ri + 1), x + r + bs * 0.1, y - r - bs * 0.6 + bs * 0.78, Math.round(bs * 0.8), '#ffffff', 800, true); }
        if (G.minutes < s.kickedUntil) mapLabel('!', x - r - 6, y + 4, 15, RED, 800);
        mapHits.push({ s, x, y, r: r + 9 });
      } else {
        const d = 2.6;
        ctx.fillStyle = use && !out ? RED : INK; ctx.fillRect(x - d, y - d, d * 2, d * 2);
      }
    }
    if (G) {
      const [px, py] = playerMapXY(), x = X(px), y = Y(py), pulse = 1 + Math.sin(time * 5) * 0.15;
      ctx.strokeStyle = RED; ctx.lineWidth = full ? 3 : 2; ctx.beginPath(); ctx.arc(x, y, (full ? 13 : 7) * pulse, 0, TAU); ctx.stroke();
      ctx.fillStyle = PAPER; circle(x, y, full ? 7 : 4);
      ctx.fillStyle = INK; circle(x, y, full ? 5 : 2.8);
    }
    if (full) for (const T of Object.values(TOLE)) { // names on top, haloed, after the pins
      const o = LABEL_OFF[T.id] || [0, 24], k = clamp(f.sc / 0.9, 0.6, 1), size = f.sc < 0.6 ? 12 : 14;
      mapLabel(L(T), X(T.x) + o[0] * k, Y(T.y) + o[1] * k, size, INK, 800);
    }
    if (full) {
      const nx = rect.x + rect.w - 24, ny = rect.y + 30;
      ctx.fillStyle = INK; poly([[nx, ny - 14], [nx + 7, ny + 6], [nx, ny + 2], [nx - 7, ny + 6]]);
      mapLabel(t('north'), nx, ny + 20, 11, INK, 800);
      const sm = 100 * f.sc, sx = rect.x + 14, sy = rect.y + rect.h - 26;
      ctx.fillStyle = INK; ctx.fillRect(sx, sy, sm, 3); ctx.fillRect(sx, sy - 4, 2, 7); ctx.fillRect(sx + sm - 2, sy - 4, 2, 7);
      mapLabel(`${digits(100)} ${t('meters')}`, sx + sm / 2, sy - 6, 11, INK, 700);
      ctx.font = `700 10px ${FONT}`; ctx.fillStyle = INK; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('© OpenStreetMap contributors', rect.x + rect.w - 8, rect.y + rect.h - 8);
    }
    ctx.restore();
    if (!full) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = INK; ctx.fillRect(rect.x, rect.y + rect.h - 20, 58, 20);
      mapLabel(t('mapLbl'), rect.x + 29, rect.y + rect.h - 6, 12, '#ffffff', 800, true);
    }
  }
  function drawFullMap() {
    ctx.fillStyle = '#fdfcf8'; ctx.fillRect(0, 0, W, H);
    const top = hudBottom() + 8;
    const rect = { x: 8, y: top, w: W - 16, h: Math.max(140, VHs - top - 8) };
    drawMap(rect, true);
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 2; ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (mapWalk) {
      const k = clamp(mapWalk.t / mapWalk.dur, 0, 1);
      ctx.fillStyle = '#141414'; ctx.fillRect(W / 2 - 150, rect.y + 6, 300, 30);
      mapLabel(`${fill(t('walkingTo'), { place: tname(mapWalk.dest.tole) })}  ${fmtClock(mapWalk.from + mapWalk.mins * k)}`, W / 2, rect.y + 26, 14, '#ffffff', 800, true);
    }
  }

  // Khula Manch: the open ground where goats are sold for Dashain, with the Dharahara tower beyond the trees.
  function drawOpenGround(vh, n, cam) {
    drawDharahara(W * 0.18 - cam * 0.2, gy - gy * 0.12, gy * 0.7);
    for (let k = -4; k < 22; k++) {
      const x = k * SW * 0.42 - cam * 0.7, y = gy - gy * 0.1;
      if (x < -SW || x > W + SW) continue;
      ctx.fillStyle = '#5b4632'; ctx.fillRect(x - 3, y, 6, gy * 0.1);
      ctx.fillStyle = k % 2 ? '#3d6b35' : '#4a7c3f'; ctx.beginPath(); ctx.ellipse(x, y - gy * 0.04, SW * 0.24, gy * 0.11, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(x - SW * 0.06, y - gy * 0.08, SW * 0.1, gy * 0.05, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#7d8a5a'; ctx.fillRect(0, gy - gy * 0.02, W, gy * 0.02);
  }
  function drawField(y0, cam) {
    const g = ctx.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, '#9b8b5e'); g.addColorStop(1, '#6f6040');
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0);
    ctx.strokeStyle = 'rgba(80,110,50,0.55)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 90; k++) {
      const yy = y0 + Math.pow(hash(k + 3), 1.6) * (H - y0), sc = depthS(yy), xx = ((hash(k) * 3000 - cam * sc) % W + W) % W;
      ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - 2 * sc, yy - 6 * sc); ctx.moveTo(xx, yy); ctx.lineTo(xx + 2 * sc, yy - 5 * sc); ctx.stroke();
    }
  }
  function drawStall(x, vh, col) { // bamboo poles and a tarp over each goat seller
    const w = SW, top = gy - gy * 0.42;
    ctx.fillStyle = '#c8a46a';
    for (const px of [0.08, 0.92]) ctx.fillRect(x + w * px - 2, top, 4, gy - top + vh * 0.02);
    ctx.fillStyle = col; poly([[x + w * 0.02, top], [x + w * 0.98, top], [x + w * 1.04, top + gy * 0.08], [x - w * 0.04, top + gy * 0.08]]);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + w * 0.02, top, w * 0.96, gy * 0.015);
    const g = ctx.createLinearGradient(0, top + gy * 0.08, 0, gy);
    g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x, top + gy * 0.08, w, gy - top - gy * 0.08);
  }

  // The parts of a shop that change: the shopkeeper, the goods on the step, the goats.
  function drawShopLife(shop, x, vh) {
    const K = KEEPERS[shop.id], w = SW, gf = gy * 0.26, ex = shopExpr(shop);
    const street = !K.sign;
    if (!street) {
      drawKeeper(x + w * 0.32, gy - gf * 0.13, gf * 0.068, K, ex);
      ctx.fillStyle = '#5b3a26'; ctx.fillRect(x + w * 0.02, gy - gf * 0.13, w * 0.96, gf * 0.13);
      ctx.fillStyle = '#7a5032'; ctx.fillRect(x + w * 0.02, gy - gf * 0.13, w * 0.96, 2);
      if (K.stock) for (let k = 0; k < shop.stock; k++) drawGoat(x + w * (0.3 + k * 0.24), gy + vh * 0.03, gf * 0.26, k % 2 === 0, k === 2 ? '#3e2723' : k === 1 ? '#f2ede4' : '#8d6e63', 0);
      else shop.sells.slice(0, 3).forEach((it, k) => { drawItem(it, x + w * (0.56 + k * 0.15), gy - gf * 0.13, gf * 0.2); if (k === 0) drawItem(it, x + w * 0.12, gy - gf * 0.13, gf * 0.18); });
    } else if (K.cat === 'street') {
      ctx.fillStyle = '#8d2f2f'; ctx.fillRect(x + w * 0.1, gy + vh * 0.005, w * 0.8, vh * 0.025);
      drawKeeper(x + w * 0.3, gy + vh * 0.005, gf * 0.075, K, ex);
      drawItem('fruit', x + w * 0.62, gy + vh * 0.025, gf * 0.3);
      if (shop.sells.includes('tika')) drawItem('tika', x + w * 0.84, gy + vh * 0.025, gf * 0.2);
    } else {
      drawKeeper(x + w * 0.22, gy + vh * 0.01, gf * 0.08, K, ex);
      for (let k = 0; k < shop.stock; k++) drawGoat(x + w * (0.5 + k * 0.24), gy + vh * 0.04, gf * 0.26, k % 2 === 1, k === 1 ? '#5d4037' : '#f2ede4', 0);
    }
    if (state === 'play' && G && shop.pos === G.pos && !walkAnim) {
      ctx.strokeStyle = 'rgba(245,197,24,0.95)'; ctx.lineWidth = 3;
      rr(x + 2, gy - gf * 1.0, w - 4, gf * 1.0, 4); ctx.stroke();
    }
    if (G && G.minutes < shop.kickedUntil) {
      ctx.fillStyle = '#e23b3b'; ctx.font = `800 ${Math.round(gf * 0.3)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('!', x + w * 0.5, gy - gf * 1.05);
    }
  }

  let playerDir = 1;
  function playerLook() {
    return { type: voice.me === 'm' ? 'man' : 'woman', dir: playerDir, skin: '#b07a52', top: '#1f6fd1', bottom: '#263238', shawl: '#f5c518', topi: false, jhola: true };
  }

  function drawPerson(o, x, y, s, ph, moving) {
    if (x < -s || x > W + s) return;
    const porter = o.type === 'porter', old = o.type === 'old', kid = o.type === 'kid';
    const long = o.type === 'woman' || o.type === 'sari';
    const lean = porter ? 0.25 : old ? 0.1 : 0;
    const sw = moving ? Math.sin(ph) : 0;
    ctx.save(); ctx.translate(x, y); if (o.dir < 0) ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.17, s * 0.03, 0, 0, TAU); ctx.fill();
    const hipY = -s * 0.47, lw = s * (kid ? 0.07 : 0.062);
    ctx.lineCap = 'round';
    for (const k of [-1, 1]) {
      const legCol = o.type === 'sari' ? o.skin : o.bottom;
      ctx.strokeStyle = k < 0 ? shadeHex(legCol, -0.3) : legCol;
      ctx.lineWidth = lw;
      const fx = Math.sin(sw * 0.4 * k) * s * 0.42;
      ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(fx, -s * 0.025); ctx.stroke();
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.ellipse(fx + s * 0.025, -s * 0.014, s * 0.045, s * 0.018, 0, 0, TAU); ctx.fill();
    }
    if (o.type === 'sari') {
      ctx.fillStyle = o.top; poly([[-s * 0.11, hipY - s * 0.02], [s * 0.12, hipY - s * 0.02], [s * 0.15 + sw * s * 0.03, -s * 0.04], [-s * 0.14 + sw * s * 0.03, -s * 0.04]]);
      ctx.fillStyle = '#e8b923'; ctx.fillRect(-s * 0.14, -s * 0.06, s * 0.29, s * 0.02);
    }
    ctx.translate(0, hipY); ctx.rotate(lean);
    const tw = s * (kid ? 0.17 : 0.2), th = s * 0.36;
    const armSw = sw * 0.45, shY = -th + s * 0.035;
    ctx.strokeStyle = shadeHex(o.top, -0.3); ctx.lineWidth = lw * 0.9;
    ctx.beginPath(); ctx.moveTo(0, shY); ctx.lineTo(Math.sin(-armSw) * s * 0.3, shY + Math.cos(armSw) * s * 0.3); ctx.stroke();
    if (porter) { // doko basket on the back, strap (namlo) round the forehead
      ctx.fillStyle = '#a07842';
      poly([[-tw * 0.4, -th * 0.05], [-tw * 0.75, -th * 0.05], [-tw * 1.5, -th * 1.25], [-tw * 0.35, -th * 1.25]]);
      ctx.strokeStyle = 'rgba(70,45,20,0.6)'; ctx.lineWidth = 1;
      for (let k = 1; k < 6; k++) { const yy = -th * 0.05 - (k * th * 1.2) / 6; ctx.beginPath(); ctx.moveTo(-tw * (0.4 + 0.03 * k), yy); ctx.lineTo(-tw * (0.75 + 0.15 * k), yy); ctx.stroke(); }
      ctx.fillStyle = '#d7ccc8'; ctx.beginPath(); ctx.ellipse(-tw * 0.95, -th * 1.3, tw * 0.6, th * 0.18, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.ellipse(-tw * 0.75, -th * 1.42, tw * 0.35, th * 0.14, 0.2, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = o.top; rr(-tw / 2, -th, tw, th + (long ? s * 0.16 : s * 0.02), s * 0.05); ctx.fill();
    const tg = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0);
    tg.addColorStop(0, 'rgba(255,255,255,0.12)'); tg.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = tg; rr(-tw / 2, -th, tw, th + (long ? s * 0.16 : s * 0.02), s * 0.05); ctx.fill();
    if (long) { ctx.fillStyle = o.shawl; poly([[-tw * 0.5, -th * 0.95], [-tw * 0.1, -th], [tw * 0.5, -th * 0.35], [tw * 0.5, -th * 0.15]]); }
    if (o.jhola) { ctx.strokeStyle = '#7a1f1f'; ctx.lineWidth = Math.max(1, s * 0.012); ctx.beginPath(); ctx.moveTo(-tw * 0.4, -th); ctx.lineTo(tw * 0.35, -th * 0.15); ctx.stroke(); drawDhaka(tw * 0.15, -th * 0.2, s * 0.12, s * 0.11); }
    ctx.strokeStyle = shadeHex(o.top, -0.1); ctx.lineWidth = lw * 0.9;
    const hx = Math.sin(armSw) * s * 0.3, hy2 = shY + Math.cos(armSw) * s * 0.3;
    ctx.beginPath(); ctx.moveTo(0, shY); ctx.lineTo(hx, hy2); ctx.stroke();
    ctx.fillStyle = o.skin; circle(hx, hy2, lw * 0.55);
    // head
    const hy = -th - s * 0.09, hr = s * (kid ? 0.085 : 0.072);
    ctx.fillStyle = o.skin; ctx.fillRect(-s * 0.018, -th - s * 0.03, s * 0.036, s * 0.04);
    circle(s * 0.01, hy, hr);
    ctx.fillStyle = 'rgba(60,25,10,0.18)'; ctx.beginPath(); ctx.arc(s * 0.01, hy, hr, -0.3 * Math.PI, 0.6 * Math.PI); ctx.fill();
    const hair = old ? '#d6d6d6' : '#17100b';
    ctx.fillStyle = hair;
    if (long) { ctx.beginPath(); ctx.arc(s * 0.005, hy - hr * 0.1, hr * 1.04, Math.PI * 0.75, Math.PI * 1.95); ctx.fill(); circle(-hr * 0.95, hy + hr * 0.1, hr * 0.45); }
    else { ctx.beginPath(); ctx.arc(s * 0.005, hy - hr * 0.15, hr * 1.02, Math.PI * 0.95, Math.PI * 1.98); ctx.fill(); }
    if (o.topi) { ctx.save(); ctx.beginPath(); ctx.moveTo(-hr * 0.95, hy - hr * 0.45); ctx.lineTo(hr * 1.05, hy - hr * 0.45); ctx.lineTo(hr * 0.8, hy - hr * 1.35); ctx.lineTo(-hr * 0.7, hy - hr * 1.25); ctx.closePath(); ctx.clip(); drawDhaka(-hr, hy - hr * 1.4, hr * 2.1, hr); ctx.restore(); }
    if (porter) { ctx.strokeStyle = '#6d4c2f'; ctx.lineWidth = Math.max(1.2, s * 0.012); ctx.beginPath(); ctx.moveTo(hr * 0.7, hy - hr * 0.5); ctx.lineTo(-tw * 1.2, -th * 1.15); ctx.stroke(); }
    ctx.fillStyle = '#1b120c'; circle(s * 0.045, hy - hr * 0.1, Math.max(0.8, hr * 0.12));
    ctx.restore();
  }

  function drawBike(b, x, y, s) {
    if (x < -s || x > W + s) return;
    ctx.save(); ctx.translate(x, y); if (b.dir < 0) ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.05, 0, 0, TAU); ctx.fill();
    const wr = s * 0.16;
    for (const wx of [-s * 0.32, s * 0.34]) {
      ctx.fillStyle = '#1b1b1b'; circle(wx, -wr, wr);
      ctx.fillStyle = '#9e9e9e'; circle(wx, -wr, wr * 0.45);
      ctx.strokeStyle = '#616161'; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) { const a = time * 14 + (k * TAU) / 3; ctx.beginPath(); ctx.moveTo(wx, -wr); ctx.lineTo(wx + Math.cos(a) * wr * 0.8, -wr + Math.sin(a) * wr * 0.8); ctx.stroke(); }
    }
    ctx.fillStyle = b.col;
    poly([[-s * 0.35, -wr * 1.3], [s * 0.05, -wr * 1.6], [s * 0.3, -wr * 2.2], [s * 0.38, -wr * 1.4], [s * 0.1, -wr * 0.9], [-s * 0.3, -wr * 0.9]]);
    ctx.fillStyle = '#212121'; rr(-s * 0.3, -wr * 1.75, s * 0.32, wr * 0.35, wr * 0.15); ctx.fill();
    ctx.fillStyle = '#fff59d'; circle(s * 0.38, -wr * 1.9, wr * 0.18);
    ctx.strokeStyle = '#424242'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s * 0.3, -wr * 2.2); ctx.lineTo(s * 0.22, -wr * 2.8); ctx.stroke();
    // rider
    ctx.strokeStyle = b.pants; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -wr * 1.9); ctx.lineTo(s * 0.08, -wr * 1.5); ctx.lineTo(s * 0.06, -wr * 0.6); ctx.stroke();
    ctx.fillStyle = b.shirt; rr(-s * 0.17, -wr * 4.0, s * 0.15, wr * 2.2, s * 0.04); ctx.fill();
    ctx.strokeStyle = b.shirt; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.08, -wr * 3.6); ctx.lineTo(s * 0.2, -wr * 2.8); ctx.stroke();
    ctx.fillStyle = b.helmet; circle(-s * 0.08, -wr * 4.45, s * 0.075);
    ctx.fillStyle = 'rgba(30,30,40,0.8)'; ctx.fillRect(-s * 0.04, -wr * 4.6, s * 0.05, s * 0.05);
    ctx.restore();
  }

  // ----- Goods -----
  function drawItem(id, x, y, s) {
    ctx.save();
    switch (id) {
      case 'rice': {
        ctx.fillStyle = '#e9dcc0'; rr(x - s * 0.45, y - s, s * 0.9, s, s * 0.25); ctx.fill();
        ctx.fillStyle = '#c62828'; ctx.fillRect(x - s * 0.45, y - s * 0.55, s * 0.9, s * 0.08); ctx.fillRect(x - s * 0.45, y - s * 0.35, s * 0.9, s * 0.05);
        ctx.fillStyle = '#d6c7a6'; poly([[x - s * 0.2, y - s], [x + s * 0.2, y - s], [x + s * 0.1, y - s * 1.15], [x - s * 0.1, y - s * 1.15]]);
        break;
      }
      case 'spice': {
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(x - s * 0.6, y - s * 0.12, s * 1.2, s * 0.12);
        [['#c62828', -0.38], ['#f9a825', 0], ['#795548', 0.38]].forEach(([c, o]) => { ctx.fillStyle = c; poly([[x + o * s - s * 0.2, y - s * 0.12], [x + o * s + s * 0.2, y - s * 0.12], [x + o * s, y - s * 0.6]]); });
        break;
      }
      case 'tika': {
        [['#d50000', -0.25], ['#f5f0e6', 0.25]].forEach(([c, o]) => {
          ctx.fillStyle = '#b08d57'; ctx.beginPath(); ctx.ellipse(x + o * s, y - s * 0.15, s * 0.22, s * 0.15, 0, 0, Math.PI); ctx.fill();
          ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + o * s, y - s * 0.17, s * 0.2, s * 0.12, 0, Math.PI, TAU); ctx.fill();
        });
        break;
      }
      case 'fruit': {
        ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.2, s * 0.55, s * 0.25, 0, 0, Math.PI); ctx.fill();
        [['#fb8c00', -0.25, 0.32], ['#e53935', 0.05, 0.38], ['#fb8c00', 0.3, 0.3], ['#fdd835', -0.05, 0.55]].forEach(([c, o, h]) => { ctx.fillStyle = c; circle(x + o * s, y - h * s, s * 0.17); });
        break;
      }
      case 'brass': {
        ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.12, s * 0.55, s * 0.13, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8b923'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.15, s * 0.46, s * 0.09, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d4a017'; rr(x - s * 0.18, y - s * 0.75, s * 0.36, s * 0.5, s * 0.15); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - s * 0.1, y - s * 0.7, s * 0.05, s * 0.35);
        break;
      }
      case 'cards': {
        for (let k = -2; k <= 1; k++) {
          ctx.save(); ctx.translate(x, y - s * 0.1); ctx.rotate(k * 0.22 + 0.1);
          ctx.fillStyle = '#fafafa'; rr(-s * 0.15, -s * 0.55, s * 0.3, s * 0.45, 2); ctx.fill();
          ctx.strokeStyle = '#999'; ctx.lineWidth = 0.6; ctx.stroke();
          ctx.fillStyle = k % 2 ? '#c62828' : '#212121'; circle(0, -s * 0.38, s * 0.05);
          ctx.restore();
        }
        break;
      }
      case 'kite': {
        drawKite(x, y - s * 0.75, s * 0.4, '#e23b3b', '#f5c518', time, true);
        ctx.fillStyle = '#8d6e63'; rr(x + s * 0.25, y - s * 0.35, s * 0.3, s * 0.35, 3); ctx.fill();
        ctx.fillStyle = '#eeeeee'; ctx.fillRect(x + s * 0.28, y - s * 0.28, s * 0.24, s * 0.2);
        break;
      }
      case 'daura': {
        ['#efe8d8', '#e3dac6', '#f5efe2'].forEach((c, k) => { ctx.fillStyle = c; rr(x - s * 0.5, y - s * 0.22 * (k + 1), s, s * 0.2, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.stroke(); });
        ctx.fillStyle = '#5d4037'; ctx.fillRect(x - s * 0.1, y - s * 0.66, s * 0.2, s * 0.2);
        break;
      }
      case 'sari': {
        ['#ad1457', '#d81b60', '#c2185b'].forEach((c, k) => { ctx.fillStyle = c; rr(x - s * 0.5, y - s * 0.22 * (k + 1), s, s * 0.2, 3); ctx.fill(); ctx.fillStyle = '#e8b923'; ctx.fillRect(x - s * 0.5, y - s * 0.22 * (k + 1) + s * 0.15, s, s * 0.04); });
        break;
      }
      case 'shoes': {
        for (const o of [-0.22, 0.22]) { ctx.fillStyle = '#3e2723'; rr(x + o * s - s * 0.2, y - s * 0.28, s * 0.42, s * 0.26, s * 0.12); ctx.fill(); ctx.fillStyle = '#1b1b1b'; ctx.fillRect(x + o * s - s * 0.2, y - s * 0.06, s * 0.44, s * 0.06); }
        break;
      }
      case 'topi': {
        ctx.save(); ctx.beginPath(); ctx.moveTo(x - s * 0.45, y); ctx.lineTo(x + s * 0.45, y); ctx.lineTo(x + s * 0.35, y - s * 0.5); ctx.lineTo(x - s * 0.3, y - s * 0.45); ctx.closePath(); ctx.clip();
        drawDhaka(x - s * 0.45, y - s * 0.5, s * 0.9, s * 0.5); ctx.restore();
        break;
      }
      case 'goat': drawGoat(x, y, s * 1.2, false, '#f2ede4', 0); break;
      default: break;
    }
    ctx.restore();
  }

  // ----- Shopkeepers -----
  function shopExpr(shop) {
    const ex = { mouth: 0.45, brow: 0, look: 0, sweat: false, crossed: false };
    if (!G) return ex;
    if (G.minutes < shop.kickedUntil) return { ...ex, mouth: -0.6, brow: -1, crossed: true };
    return ex;
  }

  function haggleExpr(shop) {
    const K = KEEPERS[shop.id], ex = shopExpr(shop);
    if (ex.crossed) return ex;
    const ls = curItem ? shop.listings[curItem] : null;
    if (fx.some((f) => f.kind === 'stamp')) return { ...ex, mouth: 1 };
    if (fx.some((f) => f.kind === 'caught')) return { ...ex, mouth: -0.6, brow: -1, crossed: true };
    if (!ls || !ls.open) return ex;
    const f = floorOf(shop, ls), gap = (ls.ask - f) / ls.ask;
    const low = ls.patience <= Math.max(1, Math.round(ls.pmax * 0.34));
    if (K.kind === 'poker') return { ...ex, mouth: 0, brow: 0, crossed: low };
    if (low) return { ...ex, mouth: -0.5, brow: -0.8, crossed: true };
    if (gap < 0.06) return { ...ex, mouth: K.kind === 'cunning' ? 0.4 : -0.1, brow: 0.6, sweat: K.kind !== 'cunning', look: 1 };
    if (gap < 0.16) return { ...ex, mouth: 0.15, brow: 0.25 };
    return { ...ex, mouth: 0.75 };
  }

  function drawKeeper(cx, base, r, K, ex, talk) {
    const lk = K.look, fat = lk.fat || 1, sh = r * 1.65 * fat;
    const headY = base - r * 3.25, bodyTop = base - r * 2.3;
    // body
    ctx.fillStyle = lk.body; rr(cx - sh, bodyTop, sh * 2, r * 3.2, r * 0.9); ctx.fill();
    const bg = ctx.createLinearGradient(cx - sh, 0, cx + sh, 0);
    bg.addColorStop(0, 'rgba(255,255,255,0.1)'); bg.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = bg; rr(cx - sh, bodyTop, sh * 2, r * 3.2, r * 0.9); ctx.fill();
    if (lk.vest) { ctx.fillStyle = lk.vest; rr(cx - sh * 0.8, bodyTop + r * 0.2, sh * 0.62, r * 3, r * 0.3); ctx.fill(); rr(cx + sh * 0.18, bodyTop + r * 0.2, sh * 0.62, r * 3, r * 0.3); ctx.fill(); }
    if (lk.shawl) { ctx.fillStyle = lk.shawl; poly([[cx - sh, bodyTop + r * 0.3], [cx - sh * 0.4, bodyTop], [cx + sh, bodyTop + r * 1.8], [cx + sh, bodyTop + r * 2.5]]); }
    if (lk.tape) { ctx.strokeStyle = '#fdd835'; ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.beginPath(); ctx.moveTo(cx - r * 0.5, bodyTop); ctx.lineTo(cx - r * 0.6, bodyTop + r * 2); ctx.moveTo(cx + r * 0.5, bodyTop); ctx.lineTo(cx + r * 0.6, bodyTop + r * 2); ctx.stroke(); }
    ctx.fillStyle = lk.skin; ctx.fillRect(cx - r * 0.3, headY + r * 0.7, r * 0.6, r * 0.5);
    // arms
    const sleeve = lk.vest ? lk.body : lk.body;
    if (ex.crossed) {
      ctx.fillStyle = sleeve; rr(cx - sh * 0.9, bodyTop + r * 0.9, sh * 1.8, r * 0.75, r * 0.37); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = lk.skin; circle(cx - sh * 0.55, bodyTop + r * 1.27, r * 0.24); circle(cx + sh * 0.55, bodyTop + r * 1.27, r * 0.24);
    } else {
      ctx.fillStyle = sleeve;
      rr(cx - sh * 1.02, bodyTop + r * 0.35, r * 0.6, base - bodyTop - r * 0.35, r * 0.3); ctx.fill();
      rr(cx + sh * 1.02 - r * 0.6, bodyTop + r * 0.35, r * 0.6, base - bodyTop - r * 0.35, r * 0.3); ctx.fill();
      ctx.fillStyle = lk.skin; circle(cx - sh * 1.02 + r * 0.3, base - r * 0.05, r * 0.26); circle(cx + sh * 1.02 - r * 0.3, base - r * 0.05, r * 0.26);
    }
    // head
    ctx.fillStyle = lk.skin; circle(cx - r * 0.95, headY + r * 0.05, r * 0.2); circle(cx + r * 0.95, headY + r * 0.05, r * 0.2);
    circle(cx, headY, r);
    const fg = ctx.createRadialGradient(cx - r * 0.35, headY - r * 0.35, r * 0.1, cx, headY, r * 1.05);
    fg.addColorStop(0, 'rgba(255,230,200,0.22)'); fg.addColorStop(1, 'rgba(60,25,10,0.28)');
    ctx.fillStyle = fg; circle(cx, headY, r);
    ctx.strokeStyle = 'rgba(70,35,20,0.5)'; ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.beginPath(); ctx.moveTo(cx + r * 0.02, headY - r * 0.02); ctx.quadraticCurveTo(cx + r * 0.13, headY + r * 0.2, cx - r * 0.04, headY + r * 0.24); ctx.stroke();
    // hair and hats
    const hair = lk.hair === 'white' ? '#e0e0e0' : '#1b120c';
    if (lk.hat === 'topi') {
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx - r * 0.9, headY - r * 0.5); ctx.lineTo(cx + r * 0.9, headY - r * 0.5); ctx.lineTo(cx + r * 0.72, headY - r * 1.3); ctx.lineTo(cx - r * 0.62, headY - r * 1.2); ctx.closePath(); ctx.clip();
      drawDhaka(cx - r * 0.9, headY - r * 1.3, r * 1.8, r * 0.8); ctx.restore();
    } else if (lk.hair === 'bun' || lk.hair === 'white') {
      ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(cx, headY - r * 0.05, r * 1.02, Math.PI * 1.05, TAU * 0.985); ctx.fill();
      circle(cx + r * 0.75, headY - r * 0.75, r * 0.38);
    } else if (lk.hair === 'short') {
      ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(cx, headY - r * 0.08, r * 1.02, Math.PI * 1.08, TAU * 0.98); ctx.fill();
    } else if (lk.hair === 'cap') {
      ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(cx, headY - r * 0.12, r * 1.03, Math.PI * 1.02, TAU * 0.995); ctx.fill();
      ctx.fillRect(cx - r * 1.5, headY - r * 0.42, r * 0.7, r * 0.18);
    } else if (lk.hair === 'bald') {
      ctx.fillStyle = '#3e2c20'; ctx.beginPath(); ctx.ellipse(cx - r * 0.9, headY - r * 0.2, r * 0.18, r * 0.35, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + r * 0.9, headY - r * 0.2, r * 0.18, r * 0.35, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.3, headY - r * 0.65, r * 0.25, r * 0.12, -0.4, 0, TAU); ctx.fill();
    } else if (lk.hair === 'spiky') {
      ctx.fillStyle = hair;
      for (let k = -3; k <= 3; k++) poly([[cx + k * r * 0.28 - r * 0.2, headY - r * 0.6], [cx + k * r * 0.28 + r * 0.2, headY - r * 0.6], [cx + k * r * 0.3, headY - r * 1.25 + Math.abs(k) * r * 0.08]]);
    }
    // eyes
    const blink = (time + cx * 0.01) % 3.7 < 0.12;
    const ey = headY - r * 0.05 + ex.look * r * 0.1;
    ctx.fillStyle = '#1b120c';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + d * r * 0.36, ey, r * 0.1, blink ? r * 0.02 : r * 0.12, 0, 0, TAU); ctx.fill(); }
    if (lk.glasses) { ctx.strokeStyle = '#212121'; ctx.lineWidth = Math.max(1, r * 0.07); for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + d * r * 0.36, headY - r * 0.05, r * 0.24, 0, TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(cx - r * 0.12, headY - r * 0.07); ctx.lineTo(cx + r * 0.12, headY - r * 0.07); ctx.stroke(); }
    // brows
    ctx.strokeStyle = lk.hair === 'white' || lk.whiteMustache ? '#bdbdbd' : '#1b120c'; ctx.lineWidth = Math.max(1.2, r * 0.09); ctx.lineCap = 'round';
    const up = Math.max(0, ex.brow) * r * 0.14, down = Math.max(0, -ex.brow) * r * 0.14;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * r * 0.16, headY - r * 0.32 - up + down); ctx.lineTo(cx + d * r * 0.56, headY - r * 0.36 - up - down * 0.3); ctx.stroke(); }
    // mouth
    const my = headY + r * 0.45;
    if (talk) {
      const o = (Math.sin(time * 22) * 0.5 + 0.5) * r * 0.18 + r * 0.04;
      ctx.fillStyle = '#5a1a14'; ctx.beginPath(); ctx.ellipse(cx, my, r * 0.2, o, 0, 0, TAU); ctx.fill();
    } else {
      ctx.strokeStyle = '#5a1a14'; ctx.lineWidth = Math.max(1.2, r * 0.08);
      ctx.beginPath(); ctx.moveTo(cx - r * 0.28, my); ctx.quadraticCurveTo(cx, my + ex.mouth * r * 0.32, cx + r * 0.28, my); ctx.stroke();
    }
    if (lk.mustache) { ctx.fillStyle = lk.whiteMustache ? '#e0e0e0' : '#1b120c'; ctx.beginPath(); ctx.ellipse(cx - r * 0.17, my - r * 0.14, r * 0.2, r * 0.08, 0.25, 0, TAU); ctx.ellipse(cx + r * 0.17, my - r * 0.14, r * 0.2, r * 0.08, -0.25, 0, TAU); ctx.fill(); }
    if (lk.stubble) { ctx.fillStyle = 'rgba(30,20,15,0.35)'; for (let k = 0; k < 14; k++) circle(cx + Math.cos(k * 0.45 + 0.3) * r * 0.6, headY + r * 0.3 + Math.sin(k * 1.7) * r * 0.25, Math.max(0.6, r * 0.03)); }
    if (lk.tika) { ctx.fillStyle = '#d50000'; circle(cx, headY - r * 0.5, r * 0.08); }
    if (lk.old) { ctx.strokeStyle = 'rgba(60,30,20,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - r * 0.35, headY - r * 0.55); ctx.lineTo(cx + r * 0.35, headY - r * 0.55); ctx.stroke(); }
    if (ex.sweat) {
      const sy = headY - r * 0.4 + ((time * 0.6) % 1) * r * 0.6;
      ctx.fillStyle = '#8fd3ff'; ctx.beginPath(); ctx.moveTo(cx + r * 0.85, sy - r * 0.18); ctx.quadraticCurveTo(cx + r * 1.0, sy + r * 0.05, cx + r * 0.85, sy + r * 0.08); ctx.quadraticCurveTo(cx + r * 0.7, sy + r * 0.05, cx + r * 0.85, sy - r * 0.18); ctx.fill();
    }
  }

  // ----- Inside a shop (close-up) -----

  // The shop as a small room in one-point perspective: back wall, side walls and ceiling all run toward the keeper's eye line.
  function drawInterior(shop, K, vh, cy) {
    const R = mulberry32(Object.keys(KEEPERS).indexOf(shop.id) * 131 + 7), wall = K.wall || '#cfc3a5';
    const bx0 = W * 0.15, bx1 = W * 0.85, by0 = vh * 0.15, by1 = cy + vh * 0.06, fy = cy + vh * 0.3;
    const eyeY = cy - vh * 0.22, s0 = (W / 2) / (W / 2 - bx0);
    let g = ctx.createLinearGradient(0, 0, 0, by0);
    g.addColorStop(0, shadeHex(wall, -0.6)); g.addColorStop(1, shadeHex(wall, -0.35));
    ctx.fillStyle = g; poly([[0, 0], [W, 0], [bx1, by0], [bx0, by0]]);
    ctx.fillStyle = shadeHex(wall, -0.2); poly([[0, 0], [bx0, by0], [bx0, by1], [0, fy]]);
    ctx.fillStyle = shadeHex(wall, -0.34); poly([[W, 0], [bx1, by0], [bx1, by1], [W, fy]]);
    g = ctx.createLinearGradient(0, by0, 0, by1);
    g.addColorStop(0, shadeHex(wall, -0.05)); g.addColorStop(1, shadeHex(wall, -0.28));
    ctx.fillStyle = g; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx0, by0); ctx.lineTo(bx1, by0); ctx.lineTo(W, 0); ctx.moveTo(bx0, by0); ctx.lineTo(bx0, by1); ctx.moveTo(bx1, by0); ctx.lineTo(bx1, by1); ctx.stroke();
    for (let k = 0; k < 4; k++) { // damp patches
      const sx = bx0 + R() * (bx1 - bx0), sy = by0 + R() * (by1 - by0) * 0.6, sr = W * (0.06 + R() * 0.1);
      const sg = ctx.createRadialGradient(sx, sy, 1, sx, sy, sr);
      sg.addColorStop(0, 'rgba(70,55,35,0.15)'); sg.addColorStop(1, 'rgba(70,55,35,0)');
      ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
    // calendar on the back wall
    const cw = Math.min(W * 0.09, vh * 0.09), cx = bx1 - cw * 1.4, cyy = by0 + vh * 0.03;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(cx + 3, cyy + 3, cw, cw * 1.4);
    ctx.fillStyle = '#fafafa'; ctx.fillRect(cx, cyy, cw, cw * 1.4);
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx, cyy, cw, cw * 0.18);
    const hg = ctx.createRadialGradient(cx + cw / 2, cyy + cw * 0.6, 1, cx + cw / 2, cyy + cw * 0.6, cw * 0.4);
    hg.addColorStop(0, '#ffd54f'); hg.addColorStop(1, '#ff8f00');
    ctx.fillStyle = hg; circle(cx + cw / 2, cyy + cw * 0.6, cw * 0.32);
    ctx.fillStyle = '#ad1457'; poly([[cx + cw * 0.35, cyy + cw * 0.95], [cx + cw * 0.65, cyy + cw * 0.95], [cx + cw * 0.58, cyy + cw * 0.5], [cx + cw * 0.42, cyy + cw * 0.5]]);
    ctx.fillStyle = '#c68a5c'; circle(cx + cw / 2, cyy + cw * 0.45, cw * 0.09);
    ctx.fillStyle = '#c62828'; ctx.font = `800 ${Math.round(cw * 0.2)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(digits('2083'), cx + cw / 2, cyy + cw * 1.2);
    ctx.fillStyle = '#fafafa'; ctx.fillText(shared.lang === 'ne' ? 'कात्तिक' : 'Kartik', cx + cw / 2, cyy + cw * 0.09, cw * 0.9);
    // shelves: straight on the back wall, angled on the side walls
    const items = shop.sells, th = vh * 0.014;
    const goodAt = (x, y, sz, k) => {
      if (K.cat === 'grocery' && k % 3 === 2) {
        const bw = sz * 0.7, bh = sz * (0.85 + R() * 0.5);
        ctx.fillStyle = SACHETS[Math.floor(R() * SACHETS.length)]; ctx.fillRect(x - bw / 2, y - bh, bw, bh);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + bw * 0.3, y - bh, bw * 0.2, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - bw * 0.35, y - bh * 0.7, bw * 0.6, bh * 0.2);
      } else drawItem(items[k % items.length], x, y, sz);
    };
    for (let row = 0; row < 3; row++) {
      const yb = by0 + (by1 - by0) * (0.3 + row * 0.2), above = yb < eyeY;
      const yf = eyeY + (yb - eyeY) * s0;
      for (const [x0, x1] of [[bx0, 0], [bx1, W]]) { // side-wall plank, seen from below or above
        ctx.fillStyle = '#6b4428'; poly([[x0, yb], [x1, yf], [x1, yf + th * s0], [x0, yb + th]]);
        ctx.fillStyle = above ? 'rgba(0,0,0,0.3)' : 'rgba(255,220,170,0.25)';
        poly([[x0, yb + (above ? th : 0)], [x1, yf + (above ? th * s0 : 0)], [x1, yf + (above ? th * s0 * 1.8 : -th * s0 * 0.8)], [x0, yb + (above ? th * 1.4 : -th * 0.4)]]);
        for (let j = 1; j <= 3; j++) {
          const tt = j / 4, sc = 1 + tt * (s0 - 1), x = lerp(x0, x1, tt), y = eyeY + (yb - eyeY) * sc;
          goodAt(x, y, vh * 0.055 * sc, j + row);
        }
      }
      ctx.fillStyle = '#6b4428'; ctx.fillRect(bx0, yb, bx1 - bx0, th);
      ctx.fillStyle = above ? 'rgba(0,0,0,0.3)' : 'rgba(255,220,170,0.3)'; ctx.fillRect(bx0, above ? yb + th : yb - 2, bx1 - bx0, above ? th * 0.5 : 2);
      const n = Math.max(4, Math.floor((bx1 - bx0) / (vh * 0.08)));
      for (let k = 0; k < n; k++) goodAt(bx0 + (k + 0.5) * ((bx1 - bx0) / n) + (R() - 0.5) * vh * 0.008, yb, vh * 0.055, k + row);
    }
    // tube light on the ceiling
    const lx = W * 0.5, ly = by0 * 0.55;
    const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, W * 0.55);
    lg.addColorStop(0, 'rgba(235,248,255,0.32)'); lg.addColorStop(1, 'rgba(235,248,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, cy);
    ctx.fillStyle = '#f5fbff'; poly([[lx - W * 0.1, ly], [lx + W * 0.1, ly], [lx + W * 0.09, ly + Math.max(4, vh * 0.012)], [lx - W * 0.09, ly + Math.max(4, vh * 0.012)]]);
    hangingGoods(K.cat, W * 0.04, 0, W * 0.92, vh * 0.62, R);
    // incense at the end of the lowest right-hand shelf
    const ix = bx1 + (W - bx1) * 0.3, iy = eyeY + (by0 + (by1 - by0) * 0.7 - eyeY) * (1 + 0.3 * (s0 - 1));
    ctx.fillStyle = '#b8860b'; ctx.fillRect(ix - vh * 0.02, iy - vh * 0.012, vh * 0.04, vh * 0.012);
    ctx.strokeStyle = 'rgba(235,235,235,0.5)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(ix, iy - vh * 0.012);
    for (let k = 1; k < 10; k++) ctx.lineTo(ix + Math.sin(time * 1.5 + k * 0.7) * vh * 0.01 * (k / 4), iy - vh * 0.012 - k * vh * 0.012);
    ctx.stroke();
    // looking in from the street: brick pillars and the rolled-up shutter frame the view
    const pw = Math.max(12, W * 0.035);
    for (const px of [0, W - pw]) {
      ctx.fillStyle = '#8c4128'; ctx.fillRect(px, 0, pw, H);
      ctx.fillStyle = 'rgba(50,15,5,0.35)'; for (let y = 4; y < H; y += 7) ctx.fillRect(px, y, pw, 1);
      ctx.fillStyle = px ? 'rgba(0,0,0,0.3)' : 'rgba(255,230,200,0.12)'; ctx.fillRect(px ? px : pw - 3, 0, 3, H);
    }
    ctx.fillStyle = '#7d8288'; ctx.fillRect(0, 0, W, Math.max(10, vh * 0.035));
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let k = 1; k < 4; k++) ctx.fillRect(0, (k * Math.max(10, vh * 0.035)) / 4, W, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, Math.max(10, vh * 0.035), W, 3);
  }

  function drawOutdoor(shop, vh, cy) {
    const [top, bot] = skyColors();
    const g = ctx.createLinearGradient(0, 0, 0, cy);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, cy);
    if (TOLE[shop.tole].open) { // Khula Manch: trees, the Dharahara, open ground
      const sg = gy; gy = cy;
      drawOpenGround(vh, 1, shop.pos * 60);
      drawField(cy, shop.pos * 60);
      gy = sg;
      ctx.fillStyle = ['#1e66b0', '#e65100', '#2f7d4a'][shop.pos % 3]; poly([[0, 0], [W, 0], [W, vh * 0.06], [0, vh * 0.1]]);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, vh * 0.06, W, vh * 0.05);
      return;
    }
    // the houses behind the seller, close up
    const base = TOLE[shop.tole].idx * 40;
    const f0 = facade(base + shop.pos, shop), z = (cy * 1.02) / f0.gq;
    for (let k = -1; k <= 1; k++) {
      const p = shop.pos + k, f = facade(base + p, k === 0 ? shop : shopAt(p, shop.tole) || null);
      const w = f.w * z, x = W / 2 - w / 2 + k * w;
      ctx.drawImage(f.c, x - f.pad * z, cy - f.gq * z, (f.c.width / DPR) * z, (f.c.height / DPR) * z);
    }
    ctx.fillStyle = 'rgba(30,15,5,0.28)'; ctx.fillRect(0, 0, W, cy);
    drawStreet(cy, shop.pos * 37, cy - cy * 0.32);
  }

  function drawShopClose(dt) {
    const vh = VHs, shop = curShop, K = KEEPERS[shop.id];
    const outdoor = !!K.stock || !K.sign;
    const cy = vh * 0.8;
    if (outdoor) drawOutdoor(shop, vh, cy); else drawInterior(shop, K, vh, cy);
    const r = Math.min(vh * 0.075, W * 0.075);
    const kx = W * (W < H ? 0.34 : 0.36);
    if (!outdoor) { // soft shadow on the back wall, light from the upper left
      const sx = kx + r * 1.3, sy = cy - r * 1.9, sg = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 3.2);
      sg.addColorStop(0, 'rgba(0,0,0,0.2)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.fillRect(sx - r * 3.2, sy - r * 3.2, r * 6.4, r * 6.4);
    }
    drawKeeper(kx, cy, r, K, haggleExpr(shop), talkT > 0);
    if (outdoor) {
      if (K.stock) { // wooden fence of the goat pen, straw on the ground
        ctx.fillStyle = '#6d4c2f';
        for (const fy of [cy - r * 0.55, cy - r * 0.05]) { ctx.fillStyle = '#6d4c2f'; ctx.fillRect(0, fy, W, r * 0.28); ctx.fillStyle = '#9a7048'; ctx.fillRect(0, fy, W, r * 0.07); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, fy + r * 0.28, W, r * 0.08); }
        for (let x = W * 0.05; x < W; x += W * 0.18) { ctx.fillStyle = '#5a3d24'; ctx.fillRect(x, cy - r * 0.9, r * 0.3, r * 1.4); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + r * 0.2, cy - r * 0.9, r * 0.1, r * 1.4); ctx.fillStyle = '#8a6440'; ctx.beginPath(); ctx.ellipse(x + r * 0.15, cy - r * 0.9, r * 0.15, r * 0.05, 0, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = '#d4b04a'; ctx.lineWidth = 1.5;
        for (let k = 0; k < 40; k++) { const sx = hash(k) * W, sy = cy + r * 0.4 + hash(k + 99) * r * 0.6; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + r * 0.4, sy - r * 0.1); ctx.stroke(); }
      } else { // Hajurama's low wooden stall with baskets
        ctx.fillStyle = '#7a5032'; ctx.fillRect(0, cy - r * 0.3, W, r * 0.35);
        ctx.fillStyle = '#5b3a26'; ctx.fillRect(0, cy + r * 0.05, W, r * 0.9);
        ctx.fillStyle = '#9a7a4a';
        for (let x = 0; x < W; x += r * 0.5) ctx.fillRect(x, cy + r * 0.05, 1.5, r * 0.9);
      }
    } else {
      const ct = vh * 0.055;
      ctx.fillStyle = '#5e361c'; ctx.fillRect(0, cy + ct, W, H - cy - ct);
      const tg = ctx.createLinearGradient(0, cy, 0, cy + ct);
      tg.addColorStop(0, '#7a4a28'); tg.addColorStop(1, '#a06a3e');
      ctx.fillStyle = tg; poly([[W * 0.03, cy], [W * 0.97, cy], [W * 1.02, cy + ct], [-W * 0.02, cy + ct]]);
      ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.fillRect(0, cy + ct, W, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, cy + ct + 2, W, vh * 0.012);
      // glass display case under the counter top
      const gx = W * 0.06, gw = W * 0.88, gyy = cy + vh * 0.08, gh = Math.min(vh * 0.12, H - gyy - 4);
      if (gh > 10) {
        ctx.fillStyle = 'rgba(160,200,220,0.25)'; ctx.fillRect(gx, gyy, gw, gh);
        const n = Math.max(3, Math.floor(gw / (vh * 0.11)));
        for (let k = 0; k < n; k++) drawItem(shop.sells[k % shop.sells.length], gx + (k + 0.5) * (gw / n), gyy + gh * 0.92, vh * 0.055);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; poly([[gx + gw * 0.1, gyy], [gx + gw * 0.18, gyy], [gx + gw * 0.12, gyy + gh], [gx + gw * 0.04, gyy + gh]]);
        ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2; ctx.strokeRect(gx, gyy, gw, gh);
      }
    }
    const ix = W * 0.72;
    if (K.stock) for (let k = 0; k < shop.stock; k++) drawGoat(ix + (k - (shop.stock - 1) / 2) * r * 2.6, cy + vh * 0.07, r * 2.1, k % 2 === 1, k === 1 ? '#5d4037' : '#f2ede4', 0);
    else {
      const oy2 = outdoor ? cy + vh * 0.01 : cy + vh * 0.035, list = curItem ? [[curItem, ix, r * 1.9]] : shop.sells.slice(0, 3).map((it, k) => [it, W * (0.6 + k * 0.14), r * 1.3]);
      for (const [it, x, sz] of list) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + sz * 0.08, oy2, sz * 0.55, sz * 0.09, 0, 0, TAU); ctx.fill(); drawItem(it, x, oy2, sz); }
    }

    if (curItem && view === 'haggle') { // the price on the table, set like the day's numeral on a patro
      const ls = shop.listings[curItem], fs = Math.round(clamp(VHs * 0.155, 58, 104)), hh = Math.round(fs * 0.36);
      const prev = ls.hist.filter((e) => !e.me).slice(-2, -1)[0];
      ctx.font = `800 ${fs}px ${FONT}`;
      const txt = num(ls.ask), tw = ctx.measureText(txt).width;
      const bw = Math.max(tw + fs * 0.6, fs * 2.6), bh = hh + fs * 1.08 + (prev ? fs * 0.42 : 0);
      let bx = kx + r * 1.4, by = cy - r * 6.4 - fs * 0.3;
      bx = Math.min(bx, W - bw - 10); by = Math.max(by, hudBottom() + 10);
      ctx.fillStyle = '#fdfcf8'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#d7261e'; ctx.fillRect(bx, by, bw, hh);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      ctx.beginPath(); ctx.moveTo(bx, by + hh); ctx.lineTo(bx + bw, by + hh); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(hh * 0.58)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(t('theirPrice'), bx + bw / 2, by + hh / 2 + 1, bw - 8);
      ctx.fillStyle = '#d7261e'; ctx.font = `800 ${fs}px ${FONT}`; ctx.textBaseline = 'alphabetic';
      ctx.fillText(txt, bx + bw / 2, by + hh + fs * 0.95);
      if (prev) {
        const ps = Math.round(fs * 0.3), pt = num(prev.p);
        ctx.font = `700 ${ps}px ${FONT}`; ctx.fillStyle = '#4a4a4a';
        const py2 = by + bh - fs * 0.12, pw = ctx.measureText(pt).width;
        ctx.fillText(pt, bx + bw / 2, py2);
        ctx.strokeStyle = '#a8150e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + bw / 2 - pw / 2 - 3, py2 - ps * 0.35); ctx.lineTo(bx + bw / 2 + pw / 2 + 3, py2 - ps * 0.35); ctx.stroke();
      }
      ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.moveTo(bx + 12, by + bh); ctx.lineTo(kx + r * 0.7, cy - r * 3.9); ctx.lineTo(bx + 30, by + bh); ctx.closePath(); ctx.fill();
    }
    talkT = Math.max(0, talkT - dt);
  }

  function ageFx(dt) {
    if (!fx.length) return;
    for (const f of fx) f.t += dt;
    fx = fx.filter((f) => f.t < 1.6);
  }
  function drawFx(dt) {
    ageFx(dt);
    for (const f of fx) {
      if (f.kind === 'stamp') {
        const a = f.t < 0.15 ? f.t / 0.15 : 1 - Math.max(0, f.t - 1.1) / 0.5, s = 1 + Math.max(0, 0.15 - f.t) * 4;
        ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(W * 0.68, VHs * 0.5); ctx.rotate(-0.2); ctx.scale(s, s);
        ctx.strokeStyle = '#d7261e'; ctx.lineWidth = 5; const R = Math.min(VHs * 0.12, W * 0.16);
        ctx.strokeRect(-R, -R * 0.5, R * 2, R); ctx.lineWidth = 2; ctx.strokeRect(-R + 7, -R * 0.5 + 7, R * 2 - 14, R - 14);
        ctx.fillStyle = '#d7261e'; ctx.font = `800 ${Math.round(R * 0.44)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(t('bought'), 0, 2);
        ctx.restore();
      } else if (f.kind === 'caught') {
        ctx.fillStyle = `rgba(215,38,30,${0.3 * (1 - f.t / 1.6)})`; ctx.fillRect(0, 0, W, H);
      }
    }
  }

  // ---------- Input ----------
  ui.retry.addEventListener('click', () => start(lastEnd ? lastEnd.level : selLevel));
  ui.next.addEventListener('click', () => {
    if (lastEnd && lastEnd.level < LEVELS.length - 1) start(lastEnd.level + 1);
    else { ui.over.classList.add('hidden'); ui.menu.classList.remove('hidden'); state = 'menu'; applyLang(); resize(); }
  });
  ui.toMenu.addEventListener('click', () => { ui.over.classList.add('hidden'); ui.menu.classList.remove('hidden'); state = 'menu'; applyLang(); resize(); ui.menu.scrollTop = 0; });
  const toggleMute = () => { audio.init(); if (!audio.muted) voice.stop(); audio.setMuted(!audio.muted); store.set('mm_muted', audio.muted); setMuteUI(); };
  ui.mute.addEventListener('click', toggleMute);
  ui.menuMute.addEventListener('click', toggleMute);
  const toggleVoice = () => { voice.on = !voice.on; store.set('mm_voice', voice.on); if (!voice.on) voice.stop(); setVoiceUI(); };
  ui.voiceBtn.addEventListener('click', toggleVoice);
  ui.menuVoice.addEventListener('click', toggleVoice);
  ui.lang.addEventListener('click', () => { shared.lang = shared.lang === 'en' ? 'ne' : 'en'; store.set('mm_lang', shared.lang); applyLang(); });
  ui.meVoice.addEventListener('click', () => {
    voice.me = voice.me === 'f' ? 'm' : 'f';
    store.set('mm_mevoice', voice.me);
    applyLang();
    voice.stop();
    voice.say(shared.lang === 'ne' ? 'नमस्ते! यो खसी कति हो?' : 'Namaste! How much is this goat?', 'me');
  });
  ui.listBtn.addEventListener('click', openSheet);
  ui.sheetClose.addEventListener('click', closeSheet);
  ui.share.addEventListener('click', async () => {
    if (!lastEnd) return;
    const lv = digits(lastEnd.level + 1);
    const text = lastEnd.pass ? t('shareWin')(lv, num(lastEnd.saved), digits(lastEnd.stars)) : t('shareLose')(lv);
    const url = location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ title: 'Mol-Molai · मोलमोलाई', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      ui.share.querySelector('span').textContent = t('copied');
      setTimeout(() => { ui.share.querySelector('span').textContent = t('share'); }, 1500);
    } catch { /* share cancelled or unavailable */ }
  });
  canvas.addEventListener('click', (e) => {
    if (state !== 'play' || busy) return;
    const rect = canvas.getBoundingClientRect(), cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    if (view === 'map') {
      let best = null, bd = 1e9;
      for (const h of mapHits) { const d = Math.hypot(h.x - cx, h.y - cy); if (d < h.r && d < bd) { bd = d; best = h.s; } }
      if (best) { mapSel = best; audio.tick(); renderChoices(); }
      return;
    }
    if (view !== 'lane' || walkAnim) return;
    if (miniRect && cx >= miniRect.x && cx <= miniRect.x + miniRect.w && cy >= miniRect.y && cy <= miniRect.y + miniRect.h) { openMap(); return; }
    if (cy > gy + VHs * 0.12) return;
    const s2 = shopAt(Math.floor((cx + camX) / SW));
    if (s2) goShop(s2);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') { toggleMute(); return; }
    if (!ui.sheet.classList.contains('hidden')) { if (e.code === 'Escape') closeSheet(); return; }
    if (state !== 'play' || busy) return;
    if (e.code === 'KeyL') { openSheet(); return; }
    if (view === 'haggle' && G) {
      const st = G.items[curItem].step;
      if (e.code === 'ArrowUp' || e.code === 'ArrowRight') { e.preventDefault(); nudge(e.shiftKey ? 5 * st : st); return; }
      if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') { e.preventDefault(); nudge(e.shiftKey ? -5 * st : -st); return; }
    }
    if (/^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code)) {
      const d = Number(e.code.slice(-1)), idx = d === 0 ? 9 : d - 1;
      const b = [...ui.choices.querySelectorAll('button.cellb, button.rowb')][idx];
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    }
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!audio.ac) return; if (document.hidden) audio.ac.suspend(); else audio.ac.resume(); });

  // ---------- Go ----------
  selLevel = firstOpenLevel();
  resize();
  setMuteUI();
  setVoiceUI();
  applyLang();
  // The month sheet, the result sheet and the list are opaque pages over the whole canvas. Once one has
  // faded in (0.25 s), stop drawing the scene behind it; the clocks keep running.
  const coverState = () => (ui.menu.classList.contains('hidden') ? 0 : 1) | (ui.over.classList.contains('hidden') ? 0 : 2) | (ui.sheet.classList.contains('hidden') ? 0 : 4);
  let covered = coverState(), seenAt = -Infinity;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now; time += dt;
    if (walkAnim) walkAnim.t += dt;
    if (mapWalk) mapWalk.t += dt;
    audio.tickAmb(dt, state, view);
    const c = coverState();
    if (!c || c !== covered) seenAt = now;
    covered = c;
    if (now - seenAt < 400) render(dt);
    else { settleVH(dt); ageFx(dt); talkT = Math.max(0, talkT - dt); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
