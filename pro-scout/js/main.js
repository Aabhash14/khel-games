/* Pro Scout — guess the athlete. No dependencies, no build step.
 * Screens, home, round flow, clue card, final bet, answers, results, keyboard and boot. */
(() => {
  'use strict';

  const { SPORTS } = window.PS_DATA;
  const { BY, $, esc, fmt, reduceMotion, store, cName, flag, sportTag, POS, svg } = PS.Core;
  const { photoInfo, loadImage } = PS.Photos;
  const { GEO, drawPeep, drawCover, tween, photoFrame } = PS.Draw;
  const { sfx, paintMute } = PS.Sound;
  const { CATS, CAT, MODE_NAME, buildRound } = PS.Questions;
  const { streakBonus, gridOf, verdict } = PS.Scoring;
  const { collect, albumCount, renderAlbum } = PS.Album;
  const { todaySeed, dailyNumber, readChallenge, shareText, share } = PS.Daily;

  // ---------- Screens ----------
  const screens = ['home', 'loading', 'play', 'result', 'album'];
  function show(id) {
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    window.scrollTo(0, 0);
  }

  // ---------- Home ----------
  let challenge = null;

  function renderHome() {
    $('albumCount').textContent = albumCount();
    const seed = todaySeed();
    const d = new Date();
    $('dailyDate').textContent = `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · #${dailyNumber(seed)}`;
    const done = store.get('ps-daily-' + seed, null);
    const right = $('dailyRight');
    if (done) {
      right.innerHTML = `<div class="daily-done"><p class="eyebrow">Today's score</p><p class="big">${fmt(done.score)}</p><p class="grid">${done.grid}</p></div>
        <button class="btn gold" type="button" id="dailyShare">Share result</button>
        <button class="link" type="button" id="dailyAgain" style="color:var(--paper)">Practise today's again</button>`;
      $('dailyShare').onclick = () => share(shareText('daily', seed, done.score, done.grid), $('dailyShare'));
      $('dailyAgain').onclick = () => start('daily', seed, { practice: true });
    } else {
      right.innerHTML = '<button class="btn gold" type="button" id="dailyPlay">Play today</button>';
      $('dailyPlay').onclick = () => start('daily', seed);
    }

    const best = store.get('ps-best', {});
    const tiles = CATS.map((c) => `
      <button class="cat" type="button" data-cat="${c.key}">
        <span class="cat-ico" style="--c:${c.color}">${svg(c.key)}</span>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-desc">${esc(c.desc)}</span>
        ${best[c.key] ? `<span class="cat-best">Best ${fmt(best[c.key])}</span>` : ''}
      </button>`).join('');
    $('cats').innerHTML = tiles + `
      <button class="cat mix" type="button" data-cat="mix">
        <span class="cat-ico" style="--c:var(--ink)">${svg('mix')}</span>
        <span class="cat-name">Quick Mix</span>
        <span class="cat-desc">10 random categories, new every time.</span>
        ${best.mix ? `<span class="cat-best">Best ${fmt(best.mix)}</span>` : ''}
      </button>`;
    $('cats').querySelectorAll('.cat').forEach((b) => b.addEventListener('click', () => start(b.dataset.cat, (Math.random() * 2 ** 32) >>> 0)));

    const ch = $('challenge');
    if (challenge) {
      const who = challenge.by ? esc(challenge.by) : 'A friend';
      const name = challenge.cat === 'daily' ? `Daily Scout #${dailyNumber(challenge.seed)}` : MODE_NAME(challenge.cat);
      ch.innerHTML = `<p><b>${who}</b> ${challenge.score !== null ? `scored <b>${fmt(challenge.score)}</b>` : 'challenged you'} in <b>${esc(name)}</b>. Same 10 questions. Can you beat it?</p>
        <button class="btn" type="button" id="acceptCh">Accept challenge</button>`;
      ch.classList.remove('hidden');
      $('acceptCh').onclick = () => start(challenge.cat, challenge.seed, { challenge });
    } else ch.classList.add('hidden');
    show('home');
  }

  // ---------- Round ----------
  let S = null;

  async function start(mode, seed, extra = {}) {
    show('loading');
    $('loadingText').textContent = 'Scouting players…';
    let qs;
    try {
      qs = await buildRound(mode, seed, (n, total) => { if (total) $('loadingText').textContent = `Scouting players… ${n}/${total} photos`; });
    } catch {
      $('loadingText').innerHTML = 'Couldn’t load the photos. Photo categories need an internet connection.<br><br><button class="btn" type="button" id="loadBack">Back</button>';
      $('loadBack').onclick = renderHome;
      return;
    }
    const isDaily = mode === 'daily' && seed === todaySeed() && !extra.practice && !store.get('ps-daily-' + seed, null);
    S = { mode, seed, qs, i: 0, score: 0, doubles: 2, fifty: 1, streak: 0, results: [], cards: [], isDaily, challenge: extra.challenge || null };
    show('play');
    renderQ();
  }

  const cur = () => S.qs[S.i];
  const isFinal = () => S.i === S.qs.length - 1;
  const ROLE = { football: 'a footballer', basketball: 'a basketball player', tennis: 'a tennis player', cricket: 'a cricketer', f1: 'a Formula 1 driver', athletics: 'a track & field athlete', swimming: 'a swimmer', gymnastics: 'a gymnast', golf: 'a golfer', boxing: 'a boxer', mma: 'an MMA fighter', nfl: 'an American football player', hockey: 'an ice hockey player', baseball: 'a baseball player', cycling: 'a cyclist', rugby: 'a rugby player' };

  function paintStreak() {
    const el = $('streak');
    el.classList.toggle('hidden', S.streak < 2);
    el.textContent = `🔥 ${S.streak}`;
    el.title = `${S.streak} correct in a row`;
  }

  function renderQ() {
    const q = cur();
    Object.assign(S, { stage: 0, doubled: false, fiftyNow: false, answered: false });
    $('qCat').textContent = S.mode === 'daily' ? `Daily Scout · ${CAT[q.cat].name}` : S.mode === 'mix' ? `Quick Mix · ${CAT[q.cat].name}` : CAT[q.cat].name;
    $('qNum').textContent = isFinal() ? 'Final question' : `Question ${S.i + 1} of ${S.qs.length}`;
    $('score').textContent = fmt(S.score);
    renderProgress();
    paintStreak();
    if (isFinal() && q.stake === undefined) { showBet(q); return; }
    $('bet').classList.add('hidden');
    $('playGrid').classList.remove('hidden');

    $('prompt').textContent = q.prompt;
    $('feedback').classList.add('hidden');
    $('feedback').innerHTML = '';
    $('tools').classList.remove('hidden');
    $('doubleBtn').classList.toggle('hidden', q.stake !== undefined);
    $('fiftyBtn').classList.toggle('hidden', q.stake !== undefined);

    const box = $('options');
    box.className = 'options' + (q.opts.length === 2 ? ' two' : '');
    box.innerHTML = q.opts.map((o, i) => `
      <button class="opt${q.bigNum ? ' big-num' : ''}" type="button" data-i="${i}">
        <span class="key" aria-hidden="true">${i + 1}</span>
        ${o.flagC ? flag(o.flagC, 'lg') : ''}
        <span class="lbl"><span>${esc(o.label)}</span>${o.sub ? `<span class="sub">${esc(o.sub)}</span>` : ''}</span>
      </button>`).join('');
    box.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.i)));

    buildStage(q);
    applyStage(true);
  }

  // Final question: stake any part of your score before you see it.
  function showBet(q) {
    $('playGrid').classList.add('hidden');
    const bet = $('bet');
    bet.classList.remove('hidden');
    const max = Math.max(300, Math.floor(S.score / 50) * 50);
    $('betCat').innerHTML = `<span class="cat-ico" style="--c:${CAT[q.cat].color}">${svg(q.cat)}</span>${esc(CAT[q.cat].name)}`;
    $('betHave').textContent = fmt(S.score);
    $('betMax').textContent = S.score < 300 ? ' (you can stake up to 300 even if you have less)' : '';
    const r = $('betRange');
    r.max = String(max);
    r.value = String(Math.round(max / 2 / 50) * 50);
    const paint = () => { $('betOut').textContent = fmt(+r.value); };
    r.oninput = paint;
    paint();
    bet.querySelectorAll('[data-f]').forEach((b) => { b.onclick = () => { r.value = String(Math.round(max * +b.dataset.f / 50) * 50); paint(); sfx.tick(); }; });
    $('betGo').onclick = () => {
      const stake = +r.value;
      q.stake = stake;
      q.values = q.stages.map((_, i) => Math.round(stake / 2 ** i / 10) * 10);
      sfx.reveal();
      renderQ();
    };
    $('betGo').focus({ preventScroll: true });
  }

  function renderProgress() {
    $('progress').innerHTML = S.qs.map((_, i) => {
      const r = S.results[i];
      const cls = r ? (r.ok ? 'r' + r.stage : 'rx') : i === S.i ? 'now' : '';
      return `<li class="${cls}${i === S.qs.length - 1 ? ' fin' : ''}"></li>`;
    }).join('');
  }

  function plateHTML(p, opt = {}) {
    const bits = [];
    if (opt.country) bits.push(`${flag(p.c)} ${esc(cName(p.c))}`);
    if (opt.sport) bits.push(sportTag(p.s));
    return `<div class="name-plate"><div class="nm">${esc(p.n)}</div>${bits.length ? `<div class="meta">${bits.join(' ')}</div>` : ''}</div>`;
  }

  // Builds the static part of the clue card for a question. applyStage() updates it as clues are bought.
  function buildStage(q) {
    const st = $('stage');
    st.innerHTML = '';
    S.view = {};
    if (q.view === 'parts' || q.view === 'cover') {
      const fr = document.createElement('div');
      fr.className = 'photo-frame' + (q.view === 'parts' ? ' peep' : '');
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', q.view === 'parts' ? 'Part of the mystery athlete’s face' : 'Photo of the mystery athlete with their face covered');
      fr.appendChild(cv);
      st.appendChild(fr);
      S.view.canvas = cv;
      loadImage(q.photo).then((img) => {
        if (!S || cur() !== q || !img) return;
        S.view.img = img;
        paintFace(q, S.answered ? { parts: 'all', cover: false } : stageState(q, S.stage), true);
      });
    } else if (q.view === 'portrait') {
      const p = BY[q.photo];
      st.appendChild(photoFrame(p.id));
      st.insertAdjacentHTML('beforeend', plateHTML(p, q.plate));
    } else if (q.view === 'path') {
      st.innerHTML = '<p class="eyebrow">Career path · main clubs</p><ol class="path" id="pathList"></ol>';
    } else if (q.view === 'quote') {
      st.innerHTML = `<p class="eyebrow">Nickname</p><p class="headline quote">${esc(q.quote)}</p>`;
    } else if (q.view === 'who') {
      st.innerHTML = `<p class="eyebrow">Mystery athlete</p><p class="who-intro">I’m ${esc(ROLE[q.sport] || 'an athlete')}…</p><ol class="who-list" id="whoList"></ol>`;
    } else if (q.view === 'duo') {
      const wrap = document.createElement('div');
      wrap.className = 'duo';
      for (const id of q.duo) {
        const col = document.createElement('div');
        col.appendChild(photoFrame(id));
        col.insertAdjacentHTML('beforeend', `<div class="name-plate" style="margin-top:8px"><div class="nm">${esc(BY[id].n)}</div><div class="meta">${sportTag(BY[id].s)}</div></div>`);
        wrap.appendChild(col);
      }
      st.appendChild(wrap);
    } else if (q.view === 'odd') {
      st.innerHTML = `<p class="eyebrow">Odd one out</p><p class="headline">Three of these four have something in common</p><p class="odd-hint">Pick the one who doesn’t fit.</p>`;
    } else if (q.view === 'club') {
      st.innerHTML = `<p class="eyebrow">Who ${esc(q.verb)}</p><span class="club-badge">${svg('club')}${esc(q.club)}</span><p class="odd-hint">Only one of the four did.</p>`;
      st.querySelector('.club-badge svg').setAttribute('style', 'width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linejoin:round');
    }
  }

  function paintFace(q, s, instant) {
    const { canvas, img } = S.view;
    const g = GEO(q.photo);
    if (!canvas || !img || !g) return;
    if (q.view === 'parts') {
      const prev = S.view.shownParts, now = s.parts;
      S.view.shownParts = now;
      if (instant || !prev) drawPeep(canvas, img, g, now, null, 1);
      else tween(canvas, (t) => drawPeep(canvas, img, g, now, prev, t));
    } else {
      const was = S.view.cover, now = s.cover ? 1 : 0;
      S.view.cover = now;
      if (instant || was === undefined || was === now) drawCover(canvas, img, g, now);
      else tween(canvas, (t) => drawCover(canvas, img, g, was + (now - was) * t));
    }
  }

  function stageState(q, upto) {
    const s = { parts: null, cover: null, clues: [], remove: 0, shown: 0 };
    for (let i = 0; i <= upto; i++) {
      const g = q.stages[i];
      if (g.parts !== undefined) s.parts = g.parts;
      if (g.cover !== undefined) s.cover = g.cover;
      if (g.shown !== undefined) s.shown = g.shown;
      if (g.add) s.clues.push(...g.add);
      if (g.remove) s.remove += g.remove;
    }
    return s;
  }
  const removedSet = (q, s) => {
    const wrongs = q.removeOrder.length;
    const n = Math.min(Math.max(0, wrongs - 1), s.remove + (S.fiftyNow ? 2 : 0));
    return new Set(q.removeOrder.slice(0, n));
  };
  // The next stage only helps if it shows something new, or there are still wrong answers to strike out.
  function nextStageUseful(q) {
    const nx = q.stages[S.stage + 1];
    if (!nx) return false;
    if (nx.add || nx.parts !== undefined || nx.cover !== undefined || nx.shown !== undefined) return true;
    return removedSet(q, stageState(q, S.stage)).size < q.removeOrder.length - 1;
  }

  function whoListHTML(clues, prevCount) {
    return clues.map((c, i) => `<li class="${i >= prevCount ? 'new' : ''}"><span class="k">${esc(c.k)}</span><span class="v">${c.html}</span></li>`).join('');
  }

  function applyStage(first) {
    const q = cur();
    const s = stageState(q, S.stage);

    if ((q.view === 'parts' || q.view === 'cover') && S.view.img) paintFace(q, s, first);
    if (q.view === 'path') {
      const list = $('pathList');
      const prev = S.view.shown || 0;
      list.innerHTML = q.path.map((club, i) => i < s.shown
        ? `<li class="${!first && i >= prev ? 'new' : ''}"><span class="yr">${i + 1}</span><span>${esc(club)}</span></li>`
        : `<li class="hid"><span class="yr">${i + 1}</span><span class="club" aria-label="hidden club"></span></li>`).join('');
      S.view.shown = s.shown;
    }
    if (q.view === 'who') {
      $('whoList').innerHTML = whoListHTML(s.clues, first ? 99 : S.view.whoCount || 0);
      S.view.whoCount = s.clues.length;
    }

    // Clue chips + locked ones still to come (Who Am I? shows its clues on the card instead)
    const chips = q.view === 'who' ? [] : s.clues.map((c) => `<li><span class="k">${esc(c.k)}</span> ${c.html}</li>`);
    for (let i = S.stage + 1; i < q.stages.length; i++) chips.push(`<li class="locked"><span class="k">Clue ${i + 1}</span> ${esc(q.stages[i].label)}</li>`);
    $('clues').innerHTML = chips.join('');

    const gone = removedSet(q, s);
    $('options').querySelectorAll('.opt').forEach((b, i) => {
      const off = gone.has(i);
      b.classList.toggle('gone', off);
      b.disabled = off || S.answered;
      b.setAttribute('aria-disabled', String(off));
    });

    paintTools();
  }

  function worth() { return cur().values[S.stage]; }
  function paintTools() {
    const q = cur();
    const v = worth();
    const w = $('worth');
    if (q.stake !== undefined) w.textContent = q.stake ? `Win ${fmt(v)} · risk ${fmt(-q.stake)}` : 'No bet';
    else w.textContent = S.doubled ? `Worth ${fmt(v * 2)} · risk ${fmt(-v)}` : `Worth ${fmt(v)}`;
    w.classList.toggle('doubled', S.doubled || (q.stake !== undefined && q.stake > 0));

    const rb = $('revealBtn');
    if (nextStageUseful(q)) {
      const cost = v - q.values[S.stage + 1];
      rb.innerHTML = `Next clue <span class="cost">${cost ? '−' + fmt(cost) : 'free'}</span>`;
      rb.title = q.stages[S.stage + 1].label;
      rb.disabled = S.answered;
    } else { rb.innerHTML = 'No more clues'; rb.disabled = true; }

    const pips = (n, total) => `<span class="pips" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? '' : 'used'}"></i>`).join('')}</span>`;
    const db = $('doubleBtn');
    db.innerHTML = `Double down ${pips(S.doubles, 2)}`;
    db.setAttribute('aria-pressed', String(S.doubled));
    db.setAttribute('aria-label', `Double down, ${S.doubles} left`);
    db.disabled = S.answered || q.stake !== undefined || (!S.doubled && S.doubles <= 0);

    const fb = $('fiftyBtn');
    const remaining = q.opts.length - removedSet(q, stageState(q, S.stage)).size;
    fb.innerHTML = `50:50 ${pips(S.fifty, 1)}`;
    fb.setAttribute('aria-label', `Fifty fifty, ${S.fifty} left`);
    fb.disabled = S.answered || q.stake !== undefined || S.fifty <= 0 || remaining <= 2;
  }

  $('revealBtn').addEventListener('click', () => {
    if (!S || S.answered || !nextStageUseful(cur())) return;
    S.stage++;
    sfx.reveal();
    applyStage(false);
  });
  $('doubleBtn').addEventListener('click', () => {
    if (!S || S.answered || cur().stake !== undefined) return;
    if (!S.doubled && S.doubles <= 0) return;
    S.doubled = !S.doubled;
    sfx.tick();
    paintTools();
  });
  $('fiftyBtn').addEventListener('click', () => {
    if (!S || S.answered || S.fifty <= 0 || cur().stake !== undefined) return;
    S.fifty--; S.fiftyNow = true;
    sfx.reveal();
    applyStage(false);
  });

  function answer(i) {
    if (!S || S.answered) return;
    const q = cur();
    const o = q.opts[i];
    if (!o || removedSet(q, stageState(q, S.stage)).has(i)) return;
    S.answered = true;
    const v = worth(), ok = o.correct;
    const final = q.stake !== undefined;
    const pts = final ? (ok ? v : -q.stake) : ok ? v * (S.doubled ? 2 : 1) : S.doubled ? -v : 0;
    if (S.doubled) S.doubles--;
    S.streak = ok ? S.streak + 1 : 0;
    const bonus = ok ? streakBonus(S.streak) : 0;
    S.score += pts + bonus;
    S.results[S.i] = { ok, stage: S.stage, doubled: S.doubled, final: final && q.stake > 0, pts, bonus };

    $('options').querySelectorAll('.opt').forEach((b, j) => {
      b.disabled = true;
      if (q.opts[j].correct) b.classList.add('right');
      else if (j === i) b.classList.add('wrong', 'shake');
      else b.classList.add('dim');
    });
    $('tools').classList.add('hidden');
    $('score').textContent = fmt(S.score);
    if (pts || bonus) { const sb = $('score').parentElement; sb.classList.remove('bump'); void sb.offsetWidth; sb.classList.add('bump'); }
    paintStreak();

    // Reveal everything on the clue card
    if (q.view === 'parts' || q.view === 'cover') paintFace(q, { parts: 'all', cover: false }, false);
    if (q.view === 'path') { const list = $('pathList'); const prev = S.view.shown; S.view.shown = q.path.length; list.innerHTML = q.path.map((c, k) => `<li class="${k >= prev ? 'new' : ''}"><span class="yr">${k + 1}</span><span>${esc(c)}</span></li>`).join(''); }
    if (q.view === 'who') $('whoList').innerHTML = whoListHTML(stageState(q, q.stages.length - 1).clues, S.view.whoCount);
    if (q.view === 'duo') {
      $('stage').querySelectorAll('.name-plate .meta').forEach((m, k) => { m.insertAdjacentHTML('beforeend', ` <b>${BY[q.duo[k]].b}</b>`); });
    }
    $('clues').querySelectorAll('.locked').forEach((li) => li.remove());

    let card = null;
    if (ok) {
      const gold = S.stage === 0 && !S.fiftyNow;
      card = collect(q.subject, gold);
      S.cards.push({ id: q.subject, gold, isNew: card.isNew || card.upgraded });
      if (gold || bonus) sfx.gold(); else sfx.ok();
    } else sfx.no();
    renderProgress();
    showFeedback(q, ok, pts, card);
  }

  function factLine(q) {
    const p = BY[q.subject];
    switch (q.cat) {
      case 'path': return `Career: ${q.path.map(esc).join(' → ')}`;
      case 'first': return `Started at <b>${esc(p.first)}</b>${p.path && p.path.length > 1 ? `, then ${p.path.slice(p.path.indexOf(p.first) + 1).map(esc).join(' → ')}` : ''}.`;
      case 'nick': return `Known as <b>“${esc(p.nick)}”</b>.`;
      case 'number': return `Famous for <b>#${p.num}</b>${p.alt && p.alt.length ? ` (also wore ${p.alt.map((n) => '#' + n).join(', ')})` : ''}.`;
      case 'older': return q.duo.map((id) => `${esc(BY[id].n)}: <b>${BY[id].b}</b>`).join(' · ');
      case 'odd': return esc(q.why);
      case 'club': return `${esc(p.n)} ${esc(q.verb)} <b>${esc(q.club)}</b>. Career: ${p.path.map(esc).join(' → ')}`;
      case 'position': return `Plays as a <b>${POS[p.pos].toLowerCase()}</b>.`;
      case 'year': return `Born in <b>${p.b}</b>.`;
      case 'country': return `Represents <b>${esc(cName(p.c))}</b>.`;
      case 'sport': return `Sport: <b>${esc(SPORTS[p.s].name)}</b>.`;
      default: return p.path ? `Career: ${p.path.map(esc).join(' → ')}` : p.nick ? `Known as <b>“${esc(p.nick)}”</b>.` : `Born in ${p.b}.`;
    }
  }

  function showFeedback(q, ok, pts, card) {
    const p = BY[q.subject];
    const r = S.results[S.i];
    const titleOk = r.final ? 'Bet won!' : ['Spot on!', 'Got it!', 'Got there!'][Math.min(S.stage, 2)];
    const titleNo = r.final ? 'Bet lost' : 'Not this time';
    const fb = $('feedback');
    const ptsHtml = pts > 0 ? `+${fmt(pts)}` : pts < 0 ? fmt(pts) : '+0';
    const tag = r.doubled ? ' <small>(doubled)</small>' : r.final ? ' <small>(final bet)</small>' : '';
    const last = S.cards[S.cards.length - 1];
    const collectHtml = card
      ? `<p class="fb-collect${last.gold ? ' gold' : ''}">${last.gold ? '★ Gold card' : 'Card'} ${card.isNew ? 'added to your album' : card.upgraded ? 'upgraded to gold' : 'already in your album'}</p>`
      : '';
    const streakHtml = r.bonus ? `<p class="fb-streak">🔥 ${S.streak} in a row: +${r.bonus} streak bonus</p>` : '';
    fb.innerHTML = `
      <div class="fb-head"><p class="fb-title ${ok ? 'ok' : 'no'}">${ok ? titleOk : titleNo}</p><span class="fb-pts${pts < 0 ? ' neg' : ''}">${ptsHtml}${tag}</span></div>
      <div class="fb-card"><div id="fbPhoto"></div><div class="fb-who"><div class="nm">${esc(p.n)}</div><div class="meta">${flag(p.c)} ${esc(cName(p.c))} ${sportTag(p.s)} <span>b. ${p.b}</span></div></div></div>
      <p class="fb-fact">${factLine(q)}</p>
      ${streakHtml}${collectHtml}
      <div class="fb-foot"><span class="credit" id="fbCredit"></span><button class="btn" type="button" id="nextBtn">${S.i + 1 < S.qs.length ? (S.i + 2 === S.qs.length ? 'Final question' : 'Next') : 'See results'} →</button></div>`;
    $('fbPhoto').replaceWith(photoFrame(p.id));
    photoInfo(p.id).then((m) => { if (m && $('fbCredit')) $('fbCredit').innerHTML = `Photo: <a href="${m.f}" target="_blank" rel="noopener">Wikimedia Commons (author &amp; licence)</a>`; }).catch(() => {});
    fb.classList.remove('hidden');
    $('nextBtn').addEventListener('click', next);
    $('nextBtn').focus({ preventScroll: true });
    if (window.innerWidth <= 820) fb.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  function next() {
    if (!S || !S.answered) return;
    if (S.i + 1 < S.qs.length) { S.i++; renderQ(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); } else finish();
  }

  // ---------- Results ----------
  function finish() {
    const grid = gridOf(S.results);
    const key = S.mode;
    const best = store.get('ps-best', {});
    const isBest = S.mode !== 'daily' && S.score > (best[key] || 0);
    if (isBest) { best[key] = S.score; store.set('ps-best', best); }
    if (S.isDaily) store.set('ps-daily-' + S.seed, { score: S.score, grid });

    $('rCat').textContent = S.mode === 'daily' ? `Daily Scout #${dailyNumber(S.seed)}` : MODE_NAME(S.mode);
    $('rScore').textContent = fmt(S.score);
    $('rVerdict').textContent = (isBest ? 'New personal best! ' : '') + verdict(S.score);
    $('rGrid').textContent = grid;
    const vs = $('rVs');
    if (S.challenge && S.challenge.score !== null) {
      const who = S.challenge.by || 'your friend';
      const d = S.score - S.challenge.score;
      vs.textContent = d > 0 ? `You beat ${who} by ${fmt(d)} points!` : d < 0 ? `${who} wins by ${fmt(-d)}. Rematch?` : `Dead heat with ${who}!`;
      vs.classList.remove('hidden');
    } else vs.classList.add('hidden');
    $('rCards').innerHTML = S.cards.length
      ? S.cards.map((c) => `<span class="${c.gold ? 'gold' : ''}${c.isNew ? ' new' : ''}">${esc(BY[c.id].n)}</span>`).join('')
      : '<span>No cards this round</span>';
    $('rName').value = store.get('ps-name', '');
    $('rToast').textContent = '';
    show('result');
  }

  $('rName').addEventListener('input', (e) => store.set('ps-name', e.target.value.trim().slice(0, 20)));
  $('rShare').addEventListener('click', (e) => share(shareText(S.mode, S.seed, S.score, gridOf(S.results)), e.currentTarget));
  $('rAgain').addEventListener('click', () => {
    if (S.mode === 'daily') start('mix', (Math.random() * 2 ** 32) >>> 0);
    else start(S.mode, (Math.random() * 2 ** 32) >>> 0);
  });
  $('rHome').addEventListener('click', () => { S = null; renderHome(); });
  $('quit').addEventListener('click', () => { if (!S || confirm('Quit this round? Your score won’t be saved.')) { S = null; renderHome(); } });

  $('openAlbum').addEventListener('click', () => { renderAlbum(); show('album'); });
  $('albumBack').addEventListener('click', renderHome);

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (!S || $('play').classList.contains('hidden') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.tagName === 'INPUT') return;
    if (isFinal() && cur().stake === undefined) return; // final-bet screen: stake first
    const k = e.key.toLowerCase();
    if (!S.answered && /^[1-4]$/.test(k)) { answer(+k - 1); e.preventDefault(); }
    else if (!S.answered && k === 'r') $('revealBtn').click();
    else if (!S.answered && k === 'd') $('doubleBtn').click();
    else if (!S.answered && k === 'f') $('fiftyBtn').click();
    else if (S.answered && (k === 'enter' || k === ' ' || k === 'n') && document.activeElement?.id !== 'nextBtn') { next(); e.preventDefault(); }
  });

  // Keep the face card crisp when the window is resized.
  window.addEventListener('resize', () => {
    if (S && S.view && S.view.canvas && S.view.img) { const q = cur(); paintFace(q, S.answered ? { parts: 'all', cover: false } : stageState(q, S.stage), true); }
  });

  // ---------- Boot ----------
  paintMute();
  challenge = readChallenge();
  renderHome();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
