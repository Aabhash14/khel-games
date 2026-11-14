// Tournament screens: season hub (table, caps, stats, results), pre-match (XI + toss),
// the live broadcast for your matches, and full scorecards.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { teamById, VENUES, SEASON } = IPLA.data;
  const { P } = IPLA.engine;
  const Lg = IPLA.league;
  const M = IPLA.match;
  const { t, num, ordinal, getLang, applyStatic } = IPLA.i18n;
  const A = IPLA.audio;

  const $ = (id) => document.getElementById(id);
  const ui = () => IPLA.ui;
  const S = () => IPLA.ui.S;
  const SCREENS = ['hub', 'prematch', 'live', 'card'];
  const esc = (x) => ui().esc(x);
  const pill = (id) => ui().pill(id);
  const pick = (key) => { const arr = t(key).split('|'); return arr[Math.floor(Math.random() * arr.length)]; };
  // The live screen redraws every ball (up to ~14 a second at 15x). Only touch the DOM
  // when a block really changed, so unchanged parts never re-layout or lose a tap.
  const lastHTML = new WeakMap();
  function html(el, h) { if (lastHTML.get(el) !== h) { lastHTML.set(el, h); el.innerHTML = h; } }
  function text(el, v) { if (el.textContent !== v) el.textContent = v; }

  let tab = 'table';
  let live = null;
  let pre = null;
  let cardView = null;

  // ---------- formatting ----------
  const name = (pid) => P[pid].name;
  function short(pid) {
    const w = P[pid].name.split(' ');
    return w.length > 1 ? `${w[0][0]} ${w.slice(1).join(' ')}` : w[0];
  }
  const ovs = (balls) => num(`${Math.floor(balls / 6)}.${balls % 6}`);
  const dec = (x, d = 2) => num(x.toFixed(d));
  const stageName = (fx) => (fx.stage === 'league' ? t('matchN', { n: fx.id }) : t(fx.stage));
  const venueName = (k) => (VENUES[k] ? VENUES[k].name : '');
  function resultText(r) {
    const w = r.res.w;
    if (r.res.superOver) return t('wonSO', { t: w });
    if (r.res.runs != null) return t('wonRuns', { t: w, n: r.res.runs });
    return t('wonWkts', { t: w, n: r.res.wkts });
  }
  function howOut(out) {
    if (!out) return t('notOut');
    const [k, b, f] = out;
    if (k === 'c') return b === f ? `c & b ${short(b)}` : `c ${short(f)} b ${short(b)}`;
    if (k === 'b') return `b ${short(b)}`;
    if (k === 'lbw') return `lbw b ${short(b)}`;
    if (k === 'st') return `st †${short(f)} b ${short(b)}`;
    return `${t('runOut')} (${short(f)})`;
  }
  const isMine = (fx) => fx.a === S().user || fx.b === S().user;

  // ---------- open / navigation ----------
  function open() {
    tab = 'table';
    ui().show('hub');
    renderHub();
  }
  const owns = (screen) => SCREENS.includes(screen);
  function refresh() {
    applyStatic();
    const sc = ui().screen();
    if (sc === 'hub') renderHub();
    if (sc === 'prematch') renderPre();
    if (sc === 'live') renderLive();
    if (sc === 'card' && cardView) renderCard();
  }

  // ---------- hub ----------
  function renderHub() {
    const s = S(); const L = s.league; const u = s.user;
    const next = Lg.nextFixture(s);
    ui().save();
    $('hubKicker').textContent = `${t('seasonTitle', { y: num(SEASON) })} · ${next ? stageName(next) : t('final')}`;
    $('hubH').textContent = teamById[u].name;
    const tbl = Lg.table(s);
    const me = tbl.find((r) => r.t === u);
    const played = Object.keys(L.results).length;
    $('hubVerdict').textContent = L.champion ? ui().verdict() : played ? `${ordinal(tbl.indexOf(me) + 1)} · ${num(me.w)}-${num(me.l)} · NRR ${me.nrr >= 0 ? '+' : ''}${dec(me.nrr, 3)}` : t('seasonStart');
    const ch = $('hubChamp');
    ch.hidden = !L.champion;
    if (L.champion) { ui().teamVars(ch, L.champion); ch.innerHTML = `<span>${t('champions')}</span><b>${esc(teamById[L.champion].name)}</b>`; }
    $('hubEnd').hidden = !L.champion;
    const fxEl = $('nextFx'); const btns = $('hubBtns');
    if (next) {
      fxEl.hidden = false; btns.hidden = false;
      const mine = isMine(next);
      const row = (id) => { const r = tbl.find((x) => x.t === id); return `<div class="fx-team">${pill(id)}<span>${esc(teamById[id].name)}</span><small>${num(r.w)}-${num(r.l)} ${r.form.map((f) => `<i class="fm ${f}">${f}</i>`).join('')}</small></div>`; };
      fxEl.className = `fixture${mine ? ' mine' : ''}`;
      fxEl.innerHTML = `<p class="fx-k">${stageName(next)}${mine ? ` · <b>${t('yourMatch')}</b>` : ''}</p>${row(next.a)}<p class="fx-v">${t('vs')}</p>${row(next.b)}<p class="fx-venue">${esc(venueName(next.venue))}</p>`;
      const upcomingMine = L.fixtures.slice(L.next).some(isMine) || (!L.champion && next.stage !== 'final');
      btns.innerHTML = mine
        ? `<button type="button" class="big-btn gold" data-act="play"><span class="bb-main">${t('playMatch')}</span><span class="bb-sub">${t('playMatchSub')}</span></button><button type="button" class="ghost-btn" data-act="simMine">${t('simMine')}</button>`
        : `<button type="button" class="big-btn gold" data-act="toMine"><span class="bb-main">${upcomingMine ? t('simToMine') : t('simRest')}</span></button><button type="button" class="ghost-btn" data-act="simOne">${t('simMatch')}</button>`;
      btns.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => hubAct(b.dataset.act, next)));
    } else { fxEl.hidden = true; btns.hidden = true; }
    document.querySelectorAll('#hubTabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    renderTab();
  }

  function hubAct(act, fx) {
    A.unlock(); A.tap();
    const s = S();
    if (act === 'play') { openPre(fx); return; }
    if (act === 'simMine' || act === 'simOne') {
      const r = Lg.simFixture(s, fx);
      ui().save();
      if (isMine(fx)) { (r.res.w === s.user ? A.cheer : A.unsold)(); openCard(fx.id, 'hub'); return; }
      ui().toast(`${fx.a} v ${fx.b}: ${resultText(r)}`);
      renderHub(); return;
    }
    if (act === 'toMine') {
      let n = 0; let f = Lg.nextFixture(s);
      while (f && !isMine(f) && n < 120) { Lg.simFixture(s, f); n++; f = Lg.nextFixture(s); }
      ui().save();
      ui().toast(t('simmed', { n }));
      if (S().league.champion) { (S().league.champion === s.user ? A.cheer : A.sting)(); }
      renderHub();
    }
  }

  document.querySelectorAll('#hubTabs [data-tab]').forEach((b) => b.addEventListener('click', () => { A.tap(); tab = b.dataset.tab; renderHub(); }));
  $('hubShare').addEventListener('click', () => ui().doShare());
  $('hubAgain').addEventListener('click', () => { if (confirm(t('confirmNew'))) ui().newAuction(); });

  // ---------- tabs ----------
  function playerCell(pid, team) {
    return `<span class="pc">${team ? pill(team) : ''}<span>${esc(name(pid))}</span></span>`;
  }
  function renderTab() {
    const s = S(); const L = s.league; const u = s.user; const body = $('hubBody');
    if (tab === 'table') {
      const tbl = Lg.table(s);
      let h = `<div class="table-wrap"><table class="pts"><thead><tr><th>#</th><th></th><th>${t('tP')}</th><th>${t('tW')}</th><th>${t('tL')}</th><th>${t('tNrr')}</th><th>${t('tPts')}</th></tr></thead><tbody>`;
      tbl.forEach((r, i) => { h += `<tr class="${r.t === u ? 'me' : ''} ${i < 4 ? 'q' : ''}"><td>${num(i + 1)}</td><td>${pill(r.t)}</td><td>${num(r.p)}</td><td>${num(r.w)}</td><td>${num(r.l)}</td><td>${r.nrr >= 0 ? '+' : ''}${dec(r.nrr, 3)}</td><td><b>${num(r.pts)}</b></td></tr>`; });
      h += '</tbody></table></div>';
      const po = L.fixtures.filter((f) => f.stage !== 'league');
      if (po.length) {
        h += `<h3 class="sub-h">${t('playoffs')}</h3><ul class="ko">`;
        for (const f of po) { const r = L.results[f.id]; h += `<li class="${isMine(f) ? 'me' : ''}" data-fx="${f.id}"><span class="k-stage">${t(f.stage)}</span>${pill(f.a)} ${t('vs')} ${pill(f.b)}${r ? ` · ${resultText(r)}` : ''}</li>`; }
        h += '</ul>';
      }
      body.innerHTML = h;
    } else if (tab === 'caps') {
      const st = Lg.stats(s);
      let h = `<h3 class="sub-h cap orange">${t('orangeCap')}</h3><div class="table-wrap"><table class="stat"><thead><tr><th></th><th>${t('mShort')}</th><th>${t('runs')}</th><th>${t('hs')}</th><th>${t('sr')}</th></tr></thead><tbody>`;
      st.orange.slice(0, 10).forEach((x, i) => { h += `<tr class="${x.t === u ? 'me' : ''}${i === 0 ? ' lead' : ''}"><td>${playerCell(x.pid, x.t)}</td><td>${num(x.m)}</td><td><b>${num(x.r)}</b></td><td>${num(x.hs)}${x.hsNo ? '*' : ''}</td><td>${dec(x.sr, 1)}</td></tr>`; });
      h += `</tbody></table></div><h3 class="sub-h cap purple">${t('purpleCap')}</h3><div class="table-wrap"><table class="stat"><thead><tr><th></th><th>${t('mShort')}</th><th>${t('wkts')}</th><th>${t('econ')}</th><th>${t('best')}</th></tr></thead><tbody>`;
      st.purple.slice(0, 10).forEach((x, i) => { h += `<tr class="${x.t === u ? 'me' : ''}${i === 0 ? ' lead' : ''}"><td>${playerCell(x.pid, x.t)}</td><td>${num(x.m)}</td><td><b>${num(x.w)}</b></td><td>${dec(x.econ)}</td><td>${num(x.best[0])}/${num(x.best[1])}</td></tr>`; });
      h += '</tbody></table></div>';
      body.innerHTML = Object.keys(L.results).length ? h : `<p class="empty">${t('noStats')}</p>`;
    } else if (tab === 'stats') {
      const st = Lg.stats(s);
      const list = (title, rows, val) => `<h3 class="sub-h">${title}</h3><ol class="lb">${rows.slice(0, 5).map((x) => `<li class="${x.t === u ? 'me' : ''}">${playerCell(x.pid, x.t)}<b>${val(x)}</b></li>`).join('')}</ol>`;
      body.innerHTML = Object.keys(L.results).length ? [
        list(t('mostSixes'), st.sixes, (x) => num(x.f6)),
        list(t('mostFours'), st.fours, (x) => num(x.f4)),
        list(t('highScores'), st.hs, (x) => `${num(x.r)}${x.no ? '*' : ''} <small>(${num(x.b)})</small>`),
        list(t('bestFigs'), st.best, (x) => `${num(x.w)}/${num(x.r)} <small>(${ovs(x.balls)})</small>`),
        list(t('bestSR'), st.sr, (x) => dec(x.sr, 1)),
        list(t('bestEcon'), st.econ, (x) => dec(x.econ)),
      ].join('') : `<p class="empty">${t('noStats')}</p>`;
    } else if (tab === 'results') {
      const done = L.fixtures.filter((f) => L.results[f.id]).reverse();
      body.innerHTML = done.length ? `<ul class="games">${done.map((f) => { const r = L.results[f.id]; return `<li class="${isMine(f) ? 'me' : ''} tap" data-fx="${f.id}"><span class="k-stage">${stageName(f)}</span>${pill(r.inns[0].t)} ${num(r.inns[0].runs)}/${num(r.inns[0].wkts)} · ${pill(r.inns[1].t)} ${num(r.inns[1].runs)}/${num(r.inns[1].wkts)}<span class="k-hero">${resultText(r)} · ${t('potmShort')}: ${esc(name(r.res.potm))}</span></li>`; }).join('')}</ul>` : `<p class="empty">${t('noStats')}</p>`;
    } else if (tab === 'mine') {
      const my = L.fixtures.filter(isMine);
      const st = Lg.stats(s);
      const topR = st.orange.find((x) => x.t === u); const topW = st.purple.find((x) => x.t === u);
      let h = `<div class="hl-row">${topR ? `<div class="hl"><span>${t('topRuns')}</span><b>${esc(name(topR.pid))}</b><small>${num(topR.r)}</small></div>` : ''}${topW ? `<div class="hl"><span>${t('topWkts')}</span><b>${esc(name(topW.pid))}</b><small>${num(topW.w)}</small></div>` : ''}</div>`;
      h += `<button type="button" class="ghost-btn wide" id="mySquadBtn">${t('mySquad')}</button><h3 class="sub-h">${t('myMatches')}</h3><ul class="games">`;
      for (const f of my) {
        const r = L.results[f.id]; const opp = f.a === u ? f.b : f.a;
        h += `<li class="${r ? 'tap' : ''} ${r ? (r.res.w === u ? 'won' : 'lost') : ''}" ${r ? `data-fx="${f.id}"` : ''}><span class="k-stage">${stageName(f)} · ${esc(venueName(f.venue))}</span>${t('vs')} ${pill(opp)}${r ? ` · <b>${r.res.w === u ? 'W' : 'L'}</b> ${resultText(r)}` : ''}</li>`;
      }
      body.innerHTML = h + '</ul>';
      $('mySquadBtn').addEventListener('click', () => ui().openSquad(u));
    }
    body.querySelectorAll('[data-fx]').forEach((el) => el.addEventListener('click', () => { if (S().league.results[el.dataset.fx]) openCard(+el.dataset.fx, 'hub'); }));
  }

  // ---------- pre-match ----------
  function openPre(fx) {
    const s = S();
    pre = { fx, xi: Lg.teamXI(s, s.user), toss: null, called: null };
    ui().show('prematch');
    renderPre();
  }

  function xiProblem(xi) {
    if (xi.length !== 11) return t('xiErr11', { n: xi.length });
    if (xi.filter((id) => P[id].os).length > 4) return t('xiErrOs');
    return null;
  }

  function renderPre() {
    const s = S(); const { fx } = pre; const u = s.user; const opp = fx.a === u ? fx.b : fx.a;
    $('preKicker').textContent = stageName(fx);
    $('preH').innerHTML = `${pill(fx.a)} ${t('vs')} ${pill(fx.b)}`;
    $('preVenue').textContent = venueName(fx.venue) + (VENUES[fx.venue] ? ` · ${VENUES[fx.venue].runs >= 1.05 ? t('pitchFlat') : VENUES[fx.venue].spin >= 3 ? t('pitchSpin') : t('pitchEven')}` : '');
    // toss
    const tossEl = $('toss');
    if (!pre.toss && !pre.called) {
      tossEl.innerHTML = `<p class="ctl-k">${t('callToss')}</p><div class="seg"><button type="button" data-call="h">${t('heads')}</button><button type="button" data-call="t">${t('tails')}</button></div>`;
      tossEl.querySelectorAll('[data-call]').forEach((b) => b.addEventListener('click', () => {
        A.unlock(); A.tap();
        const coin = Math.random() < 0.5 ? 'h' : 't';
        pre.called = { call: b.dataset.call, coin, won: b.dataset.call === coin };
        if (!pre.called.won) pre.toss = { w: opp, d: Lg.aiToss(opp) };
        renderPre();
      }));
    } else if (pre.called && pre.called.won && !pre.toss) {
      tossEl.innerHTML = `<p class="toss-res win">${t(pre.called.coin === 'h' ? 'heads' : 'tails')}! ${t('wonToss')}</p><div class="seg"><button type="button" data-d="bat">${t('batFirst')}</button><button type="button" data-d="bowl">${t('bowlFirst')}</button></div>`;
      tossEl.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { A.tap(); pre.toss = { w: u, d: b.dataset.d }; renderPre(); }));
    } else {
      tossEl.innerHTML = `<p class="toss-res ${pre.toss.w === u ? 'win' : ''}">${pre.toss.w === u ? t('youChose', { d: t(pre.toss.d) }) : t('lostToss', { t: opp, d: t(pre.toss.d) })}</p>`;
    }
    // XI
    const squad = s.teams[u].squad.map((e) => P[e.pid]);
    const order = { WK: 0, BAT: 1, AR: 2, PACE: 3, SPIN: 4 };
    squad.sort((a, b) => order[a.role] - order[b.role] || b.r - a.r);
    const os = pre.xi.filter((id) => P[id].os).length;
    const prob = xiProblem(pre.xi);
    $('xiCount').textContent = prob || t('xiOk', { o: os });
    $('xiCount').className = prob ? 'bad' : '';
    const ul = $('xiPick'); ul.innerHTML = '';
    for (const p of squad) {
      const on = pre.xi.includes(p.id);
      const li = document.createElement('li'); const b = document.createElement('button');
      b.type = 'button'; b.className = 'prow'; b.setAttribute('aria-pressed', String(on));
      ui().teamVars(b, u);
      b.innerHTML = `<span class="avatar">${ui().initials(p.name)}</span><span><span class="pr-name">${esc(p.name)}${p.os ? ' ✈' : ''}</span><span class="pr-sub">${t(`role_${p.role}`)} · ${ui().cname(p.country)}</span></span><span class="pr-r">${num(p.r)}</span>`;
      b.addEventListener('click', () => {
        A.tap();
        pre.xi = on ? pre.xi.filter((x) => x !== p.id) : [...pre.xi, p.id];
        renderPre();
      });
      li.append(b); ul.append(li);
    }
    $('startMatch').disabled = !pre.toss || !!prob;
  }

  $('startMatch').addEventListener('click', () => {
    const s = S();
    if (!pre || !pre.toss || xiProblem(pre.xi)) return;
    A.unlock(); A.sting();
    s.league.myXI = pre.xi.slice();
    ui().save();
    const m = Lg.startMatch(s, pre.fx, pre.toss);
    startLive(pre.fx, m);
  });

  // ---------- live match ----------
  const SPEEDS = [1100, 550, 220, 70];
  const INTENTS = { '-1': -0.7, auto: null, 1: 0.9 };

  function startLive(fx, m) {
    live = { fx, m, speed: 0, paused: false, intent: null, bowlerPick: null, timer: null, overBalls: [], feed: [], brk: false };
    ui().show('live');
    A.crowdOn();
    document.querySelectorAll('#intentBox [data-intent]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.intent === 'auto')));
    $('lvSpeed').textContent = '1×';
    $('lvPause').setAttribute('aria-pressed', 'false'); $('lvPause').textContent = '⏸';
    $('breakBox').hidden = true;
    renderLive();
    schedule(1200);
  }

  function userBats() { const I = live.m.inns[live.m.i]; return I.bat === S().user; }
  function ctl() {
    if (userBats()) return { intent: live.intent };
    return { bowler: live.bowlerPick };
  }

  function schedule(ms) {
    clearTimeout(live.timer);
    live.timer = setTimeout(tick, ms);
  }

  function tick() {
    if (!live || live.paused || live.brk || live.m.done) return;
    const ev = M.step(live.m, ctl());
    const extra = handle(ev, true);
    renderLive();
    if (ev.matchDone) { endMatch(); return; }
    if (ev.innsDone) { inningsBreak(); return; }
    const base = SPEEDS[live.speed];
    schedule(base + extra * (live.speed === 0 ? 1 : live.speed === 1 ? 0.5 : 0.15));
  }

  // Returns extra delay (ms) for dramatic moments.
  function handle(ev, loud) {
    const I = live.m.inns[ev.inn];
    if (live.overKey !== `${ev.inn}.${ev.over}`) { live.overBalls = []; live.overKey = `${ev.inn}.${ev.over}`; }
    if (ev.bowler === live.bowlerPick) live.bowlerPick = null;
    const ballLabel = ev.out ? 'W' : ev.extra === 'wd' ? 'wd' : ev.extra === 'nb' ? `nb${ev.bat ? '+' + ev.bat : ''}` : ev.extra === 'lb' ? '1lb' : String(ev.runs);
    live.overBalls.push({ label: ballLabel, kind: ev.out ? 'w' : ev.runs === 6 && !ev.extra ? 's' : ev.runs === 4 && !ev.extra ? 'f' : ev.extra ? 'x' : ev.runs ? 'r' : 'd' });
    const userBat = I.bat === S().user;
    let text = ''; let flash = ''; let extra = 0;
    if (ev.out) {
      const out = ev.out;
      text = `${t('outW')} ${short(out.pid)} ${howOut(out.how)} · ${num(I.card.find((c) => c.pid === out.pid).r)} (${num(I.card.find((c) => c.pid === out.pid).b)})`;
      flash = t('outW'); extra = 900;
      if (loud) A.wicket(!userBat);
    } else if (ev.extra === 'wd') { text = t('wideT'); if (loud) A.dot(); }
    else if (ev.extra === 'nb') { text = `${t('noballT')}${ev.bat ? ` + ${num(ev.bat)}` : ''}. ${t('freeHit')}!`; flash = t('freeHit'); extra = 300; if (loud) A.single(); }
    else if (ev.extra === 'lb') { text = t('legbyeT'); if (loud) A.single(); }
    else if (ev.runs === 6) { text = pick('c6'); flash = t('sixT'); extra = 700; if (loud) A.six(); }
    else if (ev.runs === 4) { text = pick('c4'); flash = t('fourT'); extra = 500; if (loud) A.four(); }
    else if (ev.runs === 0) { text = pick('c0'); if (loud) A.dot(); }
    else { text = ev.runs === 1 ? t('oneRun') : t('runsN', { n: ev.runs }); if (loud) A.single(); }
    // milestones
    const bc = I.card.find((c) => c.pid === ev.batter);
    if (bc && !ev.out && ev.runs && !ev.extra) {
      const before = bc.r - ev.runs;
      if (before < 100 && bc.r >= 100) { flash = `${t('hundredT')} · ${short(bc.pid)}`; extra = 1400; if (loud) { A.cheer(); } }
      else if (before < 50 && bc.r >= 50) { flash = `${t('fiftyT')} · ${short(bc.pid)}`; extra = 1000; if (loud) A.applause(); }
    }
    const bw = I.bowl[ev.bowler];
    if (ev.out && bw && (bw.w === 3 || bw.w === 5)) { flash = `${num(bw.w)} ${t('wktsFor')} · ${short(ev.bowler)}`; }
    live.feed.unshift({ k: live.overBalls[live.overBalls.length - 1].kind, txt: `<b>${num(`${ev.over}.${ev.ballInOver}`)}</b> ${esc(short(ev.bowler))} → ${esc(short(ev.batter))}: ${text}` });
    if (ev.overDone && !ev.innsDone) {
      const o = I.overs[I.overs.length - 1];
      live.feed.unshift({ k: 'over', txt: `${t('endOver', { n: I.overs.length, r: o.runs })} · ${pill(I.bat)} ${num(I.runs)}/${num(I.wkts)}` });
      extra += 400;
    }
    live.feed = live.feed.slice(0, 14);
    if (flash && loud) showFlash(flash, ev.out ? 'w' : ev.runs === 6 ? 's' : 'f');
    // tension in a close finish
    if (live.m.i === 1 && !live.m.done) {
      const J = live.m.inns[1]; const need = live.m.target - J.runs; const left = 120 - J.balls;
      if (left <= 30 && need > 0 && need <= left * 2.2 + 6 && J.wkts < 10) A.tension(500 * (left <= 6 ? 5 : left <= 12 ? 4 : left <= 18 ? 3 : left <= 24 ? 2 : 1), 0);
    }
    return extra;
  }

  let flashT = null;
  function showFlash(txt, kind) {
    const f = $('flash');
    f.className = `flash on ${kind}`; f.textContent = txt;
    clearTimeout(flashT); flashT = setTimeout(() => { f.className = 'flash'; }, 1300);
  }

  function renderLive() {
    if (!live) return;
    const s = S(); const m = live.m; const u = s.user;
    const I = m.inns[m.i];
    const first = m.inns[0];
    text($('barMid'), stageName(live.fx));
    html($('bug'), `<div class="bug-main">${pill(I.bat)}<span class="bug-score">${num(I.runs)}/${num(I.wkts)}</span><span class="bug-ov">${ovs(I.balls)}</span></div>
      <div class="bug-side">${m.i === 1 ? `${pill(first.bat)} ${num(first.runs)}/${num(first.wkts)} <small>(${ovs(first.balls)})</small>` : `${t('vs')} ${pill(I.bowlT)}`}</div>`);
    const crr = I.balls ? (I.runs / I.balls) * 6 : 0;
    if (m.i === 1 && !m.done) {
      const need = m.target - I.runs; const left = 120 - I.balls;
      html($('chaseLine'), `<b>${t('need', { r: num(Math.max(0, need)), b: num(left) })}</b> · ${t('crr')} ${dec(crr)} · ${t('rrr')} ${dec(left ? (need / left) * 6 : 0)}`);
    } else if (!m.done) {
      // Early on, lean on a normal T20 rate (about 9 an over) rather than the first few balls.
      const rate = (crr * I.balls + 9 * 36) / (I.balls + 36);
      html($('chaseLine'), `${t('crr')} ${dec(crr)} · ${t('proj')} ${num(Math.round(I.runs + rate * (120 - I.balls) / 6))}`);
    }
    // batters
    const bat = (idx, strike) => {
      const c = I.card[idx]; if (!c || c.out) return '';
      return `<div class="bt${strike ? ' on' : ''}"><span class="bt-n">${esc(short(c.pid))}${strike ? ' *' : ''}</span><span class="bt-r">${num(c.r)}</span><span class="bt-b">(${num(c.b)})</span><span class="bt-x">${num(c.f4)}×4 ${num(c.f6)}×6</span></div>`;
    };
    html($('batters'), m.done ? '' : bat(I.striker, true) + bat(I.non, false) + `<p class="pship">${t('pship')} ${num(I.part.r)} (${num(I.part.b)})</p>`);
    const bwId = I.cur ? I.cur.bowler : I.last;
    const bw = bwId != null ? I.bowl[bwId] : null;
    html($('bowlerRow'), bw && !m.done ? `<span class="bt-n">${esc(short(bwId))}</span><span>${ovs(bw.balls)}-${num(bw.m)}-${num(bw.r)}-${num(bw.w)}</span><span class="bt-x">${t('econ')} ${dec(bw.balls ? (bw.r / bw.balls) * 6 : 0)}</span>` : '');
    html($('thisOver'), live.overBalls.map((b) => `<i class="ball ${b.kind}">${b.label === '0' ? '•' : b.label}</i>`).join(''));
    html($('feed'), live.feed.map((f) => `<li class="${f.k}">${f.txt}</li>`).join(''));
    // controls
    const ub = userBats();
    $('intentBox').hidden = m.done || !ub;
    $('bowlBox').hidden = m.done || ub;
    if (!ub && !m.done) {
      const elig = I.cur ? [] : M.eligibleBowlers(m);
      const opts = I.bowlers;
      text($('bowlNote'), I.cur ? t('pickNext') : '');
      html($('bowlChips'), `<button type="button" class="chip-b${live.bowlerPick == null ? ' on' : ''}" data-b="auto">${t('auto')}</button>` + opts.map((pid) => {
        const st = I.bowl[pid] || { balls: 0, r: 0, w: 0 };
        const can = (I.cur ? pid !== I.cur.bowler : elig.includes(pid)) && st.balls < 24;
        return `<button type="button" class="chip-b${live.bowlerPick === pid ? ' on' : ''}" data-b="${pid}" ${can ? '' : 'disabled'}>${esc(short(pid))}<small>${ovs(st.balls)}-${num(st.r)}-${num(st.w)}</small></button>`;
      }).join(''));
    }
  }
  // One listener for all bowler chips, so redraws never drop a tap.
  $('bowlChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-b]');
    if (!b || b.disabled || !live) return;
    A.tap(); live.bowlerPick = b.dataset.b === 'auto' ? null : +b.dataset.b; renderLive();
  });

  document.querySelectorAll('#intentBox [data-intent]').forEach((b) => b.addEventListener('click', () => {
    if (!live) return;
    A.tap();
    live.intent = INTENTS[b.dataset.intent];
    document.querySelectorAll('#intentBox [data-intent]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('lvPause').addEventListener('click', () => {
    if (!live) return;
    live.paused = !live.paused;
    $('lvPause').setAttribute('aria-pressed', String(live.paused)); $('lvPause').textContent = live.paused ? '▶' : '⏸';
    if (!live.paused) schedule(200);
  });
  $('lvSpeed').addEventListener('click', () => {
    if (!live) return;
    live.speed = (live.speed + 1) % SPEEDS.length;
    $('lvSpeed').textContent = ['1×', '2×', '5×', '15×'][live.speed];
  });
  // Skip to the end of this over (quietly), or of the whole match.
  function fastForward(untilOver) {
    if (!live || live.m.done || live.brk) return;
    clearTimeout(live.timer);
    let guard = 0;
    while (!live.m.done && guard++ < 300) {
      const ev = M.step(live.m, ctl());
      handle(ev, false);
      if (ev.innsDone) { renderLive(); if (ev.matchDone) endMatch(); else inningsBreak(); return; }
      if (untilOver && ev.overDone) break;
    }
    renderLive();
    if (live.m.done) { endMatch(); return; }
    schedule(SPEEDS[live.speed]);
  }
  $('lvOver').addEventListener('click', () => { A.tap(); fastForward(true); });
  $('lvEnd').addEventListener('click', () => { A.tap(); fastForward(false); });

  function inningsBreak() {
    live.brk = true;
    A.tensionOff();
    const m = live.m; const I = m.inns[0];
    const top = I.card.filter((c) => c.batted).sort((a, b) => b.r - a.r)[0];
    const bb = Object.entries(I.bowl).sort((a, b) => b[1].w - a[1].w || a[1].r - b[1].r)[0];
    const box = $('breakBox');
    box.hidden = false;
    box.innerHTML = `<div class="brk-card"><p class="kicker">${t('inningsBreak')}</p>
      <p class="brk-score">${pill(I.bat)} ${num(I.runs)}/${num(I.wkts)} <small>(${ovs(I.balls)})</small></p>
      <p>${top ? `${esc(name(top.pid))} ${num(top.r)} (${num(top.b)})` : ''}${bb ? ` · ${esc(name(+bb[0]))} ${num(bb[1].w)}/${num(bb[1].r)}` : ''}</p>
      <p class="brk-need">${t('needToWin', { t: m.b, n: num(m.target), b: num(120) })}</p>
      <button type="button" class="big-btn gold" id="brkGo"><span class="bb-main">${t('startChase')}</span></button></div>`;
    A.applause();
    $('brkGo').addEventListener('click', () => { A.tap(); box.hidden = true; live.brk = false; live.overBalls = []; live.feed.unshift({ k: 'over', txt: `${t('chaseOn', { t: m.b, n: num(m.target) })}` }); renderLive(); schedule(900); });
  }

  function endMatch() {
    clearTimeout(live.timer);
    A.tensionOff();
    const s = S(); const m = live.m; const fx = live.fx;
    Lg.record(s, fx, m);
    ui().save();
    const r = s.league.results[fx.id];
    const won = r.res.w === s.user;
    if (won) A.cheer(); else A.unsold();
    const box = $('breakBox');
    box.hidden = false;
    box.innerHTML = `<div class="brk-card ${won ? 'won' : 'lost'}"><p class="kicker">${stageName(fx)}</p>
      <p class="brk-score">${resultText(r)}</p>
      <p>${t('potm')}: <b>${esc(name(r.res.potm))}</b></p>
      ${fx.stage === 'final' && won ? `<p class="brk-need">🏆 ${t('youWon')}</p>` : ''}
      <button type="button" class="big-btn gold" id="brkCard"><span class="bb-main">${t('scorecard')}</span></button>
      <button type="button" class="ghost-btn wide" id="brkHub">${t('continue')}</button></div>`;
    $('brkCard').addEventListener('click', () => { A.tap(); live = null; openCard(fx.id, 'hub'); });
    $('brkHub').addEventListener('click', () => { A.tap(); live = null; open(); });
  }

  // ---------- scorecard ----------
  function openCard(id, from) {
    cardView = { id, from, inn: 0 };
    ui().show('card');
    renderCard();
  }

  function renderCard() {
    const s = S(); const fx = s.league.fixtures.find((f) => f.id === cardView.id); const r = s.league.results[cardView.id];
    $('cardKicker').textContent = `${stageName(fx)} · ${venueName(fx.venue)}`;
    $('cardH').innerHTML = `${pill(r.inns[0].t)} ${t('vs')} ${pill(r.inns[1].t)}`;
    $('cardRes').textContent = resultText(r);
    $('cardPotm').innerHTML = `${t('potm')}: <b>${esc(name(r.res.potm))}</b> · ${t('tossLine', { t: r.toss.w, d: t(r.toss.d) })}`;
    $('cardTabs').innerHTML = r.inns.map((I, i) => `<button type="button" role="tab" aria-selected="${i === cardView.inn}" data-i="${i}">${I.t} ${num(I.runs)}/${num(I.wkts)}</button>`).join('');
    $('cardTabs').querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { A.tap(); cardView.inn = +b.dataset.i; renderCard(); }));
    const I = r.inns[cardView.inn];
    let h = `<div class="table-wrap"><table class="sc"><thead><tr><th>${t('batter')}</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>`;
    for (const [pid, runs, balls, f4, f6, out] of I.bat) {
      h += `<tr class="${runs >= 50 ? 'big' : ''}"><td><b>${esc(name(pid))}</b><small>${esc(howOut(out))}</small></td><td><b>${num(runs)}</b></td><td>${num(balls)}</td><td>${num(f4)}</td><td>${num(f6)}</td><td>${dec(balls ? (runs / balls) * 100 : 0, 1)}</td></tr>`;
    }
    const e = I.ext; const extras = e.wd + e.nb + e.b + e.lb;
    h += `<tr class="sub"><td>${t('extras')} <small>(lb ${num(e.lb)}, w ${num(e.wd)}, nb ${num(e.nb)})</small></td><td colspan="5">${num(extras)}</td></tr>`;
    h += `<tr class="tot"><td>${t('total')} <small>(${ovs(I.balls)} ${t('ovShort')}, RR ${dec(I.balls ? (I.runs / I.balls) * 6 : 0)})</small></td><td colspan="5"><b>${num(I.runs)}/${num(I.wkts)}</b></td></tr></tbody></table></div>`;
    if (I.dnb.length) h += `<p class="dnb"><b>${t('dnb')}:</b> ${I.dnb.map((pid) => esc(name(pid))).join(', ')}</p>`;
    if (I.fow.length) h += `<p class="dnb"><b>${t('fow')}:</b> ${I.fow.map(([sc, w, pid, b]) => `${num(sc)}-${num(w)} (${esc(short(pid))}, ${ovs(b)})`).join(', ')}</p>`;
    h += `<div class="table-wrap"><table class="sc"><thead><tr><th>${t('bowler')}</th><th>O</th><th>M</th><th>R</th><th>W</th><th>${t('econ')}</th></tr></thead><tbody>`;
    for (const [pid, balls, mdn, runs, wk, wd, nb] of I.bowl) {
      h += `<tr class="${wk >= 3 ? 'big' : ''}"><td><b>${esc(name(pid))}</b>${wd || nb ? `<small>${wd ? `${num(wd)}wd ` : ''}${nb ? `${num(nb)}nb` : ''}</small>` : ''}</td><td>${ovs(balls)}</td><td>${num(mdn)}</td><td>${num(runs)}</td><td><b>${num(wk)}</b></td><td>${dec(balls ? (runs / balls) * 6 : 0)}</td></tr>`;
    }
    h += '</tbody></table></div>';
    const mx = Math.max(10, ...I.overs);
    h += `<h3 class="sub-h">${t('overByOver')}</h3><div class="manhattan" aria-hidden="true">${I.overs.map((o, i) => `<span style="height:${Math.round((o / mx) * 100)}%" title="${i + 1}: ${o}"><i>${num(o)}</i></span>`).join('')}</div>`;
    $('cardBody').innerHTML = h;
  }
  $('cardBack').addEventListener('click', () => { A.tap(); if (cardView && cardView.from === 'hub') open(); });

  IPLA.tour = { open, owns, refresh };
})();
