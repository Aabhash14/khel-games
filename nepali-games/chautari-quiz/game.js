(function () {
  'use strict';

  /* rules live in logic.js so they can be unit-tested */
  const { LADDER, SAFE, digits, money, shuffle, banked: bankedAt, safeFloor: floorAt, cutTwo, makePoll, drawQuestion } = window.ChautariLogic;

  /* ---------- words ---------- */
  const T = {
    en: {
      title: 'Chautari Quiz',
      tagline: 'Fifteen questions. One crore rupees. Take a seat under the pipal tree.',
      how1: 'Answer 15 questions. Each one is harder and worth more than the last, up to Rs. 1,00,00,000.',
      how2: 'Reach a safe step (Rs. 10,000 and Rs. 3,20,000) and that money stays yours even if you slip later.',
      how3: 'Four lifelines, one use each. Walk away any time with what you have won.',
      start: 'Take a seat',
      sound: 'Sound',
      ladder: 'Prize ladder',
      stake: (n, amt) => `Question ${n} · for ${amt}`,
      walk: (amt) => `Walk away with ${amt}`,
      walkSure: (amt) => `Sure? Take ${amt} home`,
      cut: 'Cut two',
      poll: 'Ask the chautari',
      swap: 'Swap question',
      double: 'Double guess',
      keys: ['A', 'B', 'C', 'D'],
      pick: 'Tap an answer. Your first choice is final.',
      locked: 'Locked in…',
      right: (amt) => `Correct! ${amt} is yours.`,
      rightSafe: (amt) => `Correct! ${amt} is safe now, whatever happens next.`,
      wrongTry: 'Not that one, but your double guess gives you one more try.',
      cutDone: 'Two wrong answers are gone.',
      pollDone: 'The chautari has voted. The crowd is not always right.',
      swapDone: 'Here is a different question for the same money.',
      doubleOn: 'Double guess is on: if your first answer is wrong, you get one more try.',
      endWon: 'Ek crore! You climbed the whole ladder.',
      endWalk: 'You walked away with',
      endWrong: 'Not this time. You take home',
      wasRight: (ans) => `The right answer was “${ans}”.`,
      walkDetail: (n) => n ? `You answered ${n} question${n > 1 ? 's' : ''} correctly.` : 'You left before the first question. The chautari will wait for you.',
      wonDetail: 'Fifteen out of fifteen. The whole village is talking about it.',
      again: 'Play again',
      best: (amt) => `Your best so far: ${amt}`,
      bankInfo: (total, fresh) => `${total} questions in the bank · ${fresh} you haven’t seen yet`,
    },
    np: {
      title: 'चौतारी क्विज',
      tagline: 'पन्ध्र प्रश्न, एक करोड रुपैयाँ। पिपलको छहारीमा बस्नुहोस्।',
      how1: '१५ प्रश्नको उत्तर दिनुहोस्। हरेक प्रश्न अघिल्लोभन्दा गाह्रो हुन्छ र रकम बढ्दै रु. १,००,००,००० सम्म पुग्छ।',
      how2: 'सुरक्षित खुड्किलो (रु. १०,००० र रु. ३,२०,०००) मा पुगेपछि पछि गल्ती भए पनि त्यो रकम तपाईंकै हुन्छ।',
      how3: 'चार सहायता, हरेक एक पटक मात्र। जुनसुकै बेला जितेको रकम लिएर उठ्न सक्नुहुन्छ।',
      start: 'सुरु गरौं',
      sound: 'आवाज',
      ladder: 'पुरस्कार सिँढी',
      stake: (n, amt) => `प्रश्न ${n} · ${amt} का लागि`,
      walk: (amt) => `${amt} लिएर उठ्नुहोस्`,
      walkSure: (amt) => `पक्का? ${amt} लिएर घर जाने`,
      cut: 'दुई हटाउनुहोस्',
      poll: 'चौतारीलाई सोध्नुहोस्',
      swap: 'प्रश्न फेर्नुहोस्',
      double: 'दुई पटक मौका',
      keys: ['क', 'ख', 'ग', 'घ'],
      pick: 'उत्तर छान्नुहोस्। पहिलो छनोट नै अन्तिम हुन्छ।',
      locked: 'उत्तर पक्का भयो…',
      right: (amt) => `सही उत्तर! ${amt} तपाईंको भयो।`,
      rightSafe: (amt) => `सही उत्तर! अब ${amt} सुरक्षित भयो।`,
      wrongTry: 'त्यो मिलेन, तर दुई पटक मौकाले अर्को एक पटक छान्न पाउनुहुन्छ।',
      cutDone: 'दुई गलत उत्तर हटाइयो।',
      pollDone: 'चौतारीले मत दियो। भीड सधैं सही हुँदैन।',
      swapDone: 'उही रकमका लागि नयाँ प्रश्न।',
      doubleOn: 'दुई पटक मौका सक्रिय: पहिलो उत्तर गलत भए अर्को एक पटक छान्न पाउनुहुन्छ।',
      endWon: 'एक करोड! तपाईं सिँढीको टुप्पोमा पुग्नुभयो।',
      endWalk: 'तपाईं यति रकम लिएर उठ्नुभयो',
      endWrong: 'यसपालि मिलेन। तपाईंले घर लैजाने रकम',
      wasRight: (ans) => `सही उत्तर “${ans}” थियो।`,
      walkDetail: (n) => n ? `तपाईंले ${digits(String(n), 'np')} वटा प्रश्नको सही उत्तर दिनुभयो।` : 'पहिलो प्रश्नअघि नै उठ्नुभयो। चौतारीले तपाईंलाई पर्खिरहनेछ।',
      wonDetail: 'पन्ध्रमा पन्ध्र। पूरै गाउँमा तपाईंकै चर्चा छ।',
      again: 'फेरि खेलौं',
      best: (amt) => `अहिलेसम्मको उत्तम: ${amt}`,
      bankInfo: (total, fresh) => `भण्डारमा ${total} प्रश्न · तीमध्ये ${fresh} तपाईंले अझै देख्नुभएको छैन`,
    }
  };

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- sound: small synthesized cues ---------- */
  let audio = null;
  let soundOn = store.get('cq-sound') !== 'off';
  function tone(freq, start, dur, type, vol) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime + start;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(audio.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* audio unavailable */ }
  }
  const sfx = {
    pick: () => tone(740, 0, 0.08, 'triangle', 0.06),
    lock: () => { tone(220, 0, 0.5, 'sine', 0.1); tone(277, 0.25, 0.6, 'sine', 0.08); },
    right: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle', 0.1)); },
    wrong: () => { tone(196, 0, 0.35, 'sawtooth', 0.07); tone(147, 0.18, 0.5, 'sawtooth', 0.07); },
    life: () => { tone(880, 0, 0.1, 'sine', 0.08); tone(1175, 0.08, 0.14, 'sine', 0.07); },
    win: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.12, 0.5, 'triangle', 0.1)); }
  };

  /* ---------- state ---------- */
  let lang = store.get('cq-lang') === 'np' ? 'np' : 'en';
  let g = null; // current game

  /* ---------- no repeats: remember every question this device has been asked ---------- */
  const BANK = window.QUESTION_BANK;
  const seen = new Set((() => { try { return JSON.parse(store.get('cq-seen') || '[]'); } catch (e) { return []; } })());
  const saveSeen = () => store.set('cq-seen', JSON.stringify([...seen]));
  const freshCount = () => BANK.reduce((n, lvl) => n + lvl.filter((q) => !seen.has(q.id)).length, 0);

  /* A random question from difficulty level `lvl` the player hasn't seen yet. When a level
     is used up, its questions are released again (the rest of the bank stays remembered). */
  function draw(lvl, avoid) {
    const q = drawQuestion(BANK[lvl], seen, avoid);
    saveSeen();
    return q ? prep(q) : null;
  }

  function newGame() {
    // question N comes from difficulty level N, drawn only when the player reaches it
    const asked = new Set();
    g = {
      level: 0,
      questions: [draw(0, asked)],
      asked,
      lives: { cut: true, poll: true, swap: true, double: true },
      phase: 'choose',
      selected: null,
      gone: new Set(),
      tried: new Set(),
      poll: null,
      doubleActive: false,
      walkConfirm: false,
      end: null
    };
  }
  function prep(q) { return { q, order: shuffle([0, 1, 2, 3]) }; }
  const cur = () => g.questions[g.level];
  const correctSlot = () => cur().order.indexOf(cur().q.c);
  const banked = () => bankedAt(g.level);
  const safeFloor = () => floorAt(g.level);

  /* ---------- rendering ---------- */
  const els = {
    start: $('screen-start'), game: $('screen-game'), end: $('screen-end'),
    stake: $('stake'), question: $('question'), answers: [...document.querySelectorAll('.answer')],
    note: $('note'), walk: $('walk'),
    lives: [...document.querySelectorAll('.life')], ladder: $('ladder'), live: $('live')
  };

  function applyLang() {
    document.documentElement.lang = lang === 'np' ? 'ne' : 'en';
    document.title = T[lang].title;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = T[lang][el.dataset.i18n];
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    renderBest();
    if (g && !els.game.hidden) renderGame();
    if (g && g.end && !els.end.hidden) renderEnd();
  }

  function renderBest() {
    const best = parseInt(store.get('cq-best') || '0', 10);
    const txt = best > 0 ? T[lang].best(money(best, lang)) : '';
    $('best').textContent = txt;
    $('best-end').textContent = txt;
    $('bank-info').textContent = T[lang].bankInfo(digits(String(window.QUESTION_BANK_SIZE), lang), digits(String(freshCount()), lang));
  }

  function renderLadder() {
    els.ladder.innerHTML = '';
    for (let i = LADDER.length - 1; i >= 0; i--) {
      const li = document.createElement('li');
      li.className = 'step' + (SAFE.includes(i) ? ' safe' : '') + (i === 14 ? ' top' : '') +
        (i < g.level ? ' done' : '') + (i === g.level && !g.end ? ' now' : '');
      li.style.setProperty('--w', (100 - i * 2.2) + '%');
      if (i === g.level && !g.end) li.setAttribute('aria-current', 'step');
      li.innerHTML = '<span class="n"></span><span class="amt"></span>';
      li.querySelector('.n').textContent = digits(String(i + 1), lang);
      li.querySelector('.amt').textContent = money(LADDER[i], lang);
      els.ladder.appendChild(li);
    }
    const now = els.ladder.querySelector('.now');
    if (now && window.matchMedia('(max-width: 860px)').matches) {
      now.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced.matches ? 'auto' : 'smooth' });
    }
  }

  function renderGame() {
    const t = T[lang];
    const c = cur();
    els.stake.textContent = t.stake(digits(String(g.level + 1), lang), money(LADDER[g.level], lang));
    els.question.textContent = c.q[lang];
    els.answers.forEach((btn, slot) => {
      const ai = c.order[slot];
      btn.querySelector('.key').textContent = t.keys[slot] + ':';
      btn.querySelector('.txt').textContent = c.q.a[ai][lang === 'np' ? 1 : 0];
      btn.setAttribute('aria-pressed', String(g.selected === slot));
      const gone = g.gone.has(slot) || g.tried.has(slot);
      btn.classList.toggle('gone', g.gone.has(slot));
      btn.classList.toggle('wrong', g.tried.has(slot) || (g.phase === 'revealed' && g.end && g.selected === slot && slot !== correctSlot()));
      btn.disabled = gone || g.phase !== 'choose';
      const pct = g.poll ? g.poll[slot] : null;
      btn.querySelector('.pct').textContent = pct === null || pct === undefined ? '' : digits(String(pct), lang) + '%';
      btn.style.setProperty('--pct', pct ? pct + '%' : '0%');
      const label = t.keys[slot] + ': ' + btn.querySelector('.txt').textContent + (pct !== null && pct !== undefined ? ` (${pct}%)` : '');
      btn.setAttribute('aria-label', label);
    });
    els.walk.textContent = g.walkConfirm ? t.walkSure(money(banked(), lang)) : t.walk(money(banked(), lang));
    els.walk.classList.toggle('confirm', g.walkConfirm);
    els.walk.disabled = g.phase !== 'choose';
    els.lives.forEach((b) => {
      const k = b.dataset.life;
      b.querySelector('span').textContent = t[k];
      const used = !g.lives[k];
      b.classList.toggle('used', used && !(k === 'double' && g.doubleActive));
      b.classList.toggle('active', k === 'double' && g.doubleActive);
      b.disabled = used || g.phase !== 'choose';
      b.setAttribute('aria-pressed', String(k === 'double' && g.doubleActive));
    });
    renderLadder();
  }

  function say(msg, kind) {
    els.note.textContent = msg || '';
    els.note.className = 'note' + (kind ? ' ' + kind : '');
    els.live.textContent = msg || '';
  }

  function show(screen) {
    for (const s of [els.start, els.game, els.end]) s.hidden = s !== screen;
  }

  /* ---------- play ---------- */
  function start() {
    newGame();
    show(els.game);
    renderGame();
    say(T[lang].pick);
    els.question.focus({ preventScroll: true });
  }

  /* One tap answers: the chosen answer locks in at once. */
  function select(slot) {
    if (!g || g.phase !== 'choose' || els.answers[slot].disabled) return;
    g.selected = slot;
    g.walkConfirm = false;
    sfx.pick();
    lock();
  }

  function lock() {
    if (g.phase !== 'choose' || g.selected === null) return;
    g.phase = 'locked';
    g.walkConfirm = false;
    renderGame();
    const btn = els.answers[g.selected];
    btn.classList.add('locked');
    say(T[lang].locked);
    sfx.lock();
    setTimeout(reveal, reduced.matches ? 300 : 1700);
  }

  function reveal() {
    const btn = els.answers[g.selected];
    btn.classList.remove('locked');
    const right = g.selected === correctSlot();
    const t = T[lang];
    if (right) {
      els.answers[correctSlot()].classList.add('right');
      const won = LADDER[g.level];
      saveBest(won);
      if (g.level === 14) { sfx.win(); setTimeout(() => finish('won', won), 1200); return; }
      sfx.right();
      g.phase = 'revealed';
      renderGame();
      els.answers[correctSlot()].classList.add('right');
      say(SAFE.includes(g.level) ? t.rightSafe(money(won, lang)) : t.right(money(won, lang)), 'good');
      // straight on to the next question after a moment to enjoy it
      g.timer = setTimeout(next, reduced.matches ? 1200 : 2200);
      return;
    }
    if (g.doubleActive) {
      // first miss under double guess: mark it and choose again
      g.doubleActive = false;
      g.tried.add(g.selected);
      g.selected = null;
      g.phase = 'choose';
      sfx.wrong();
      renderGame();
      say(t.wrongTry, 'bad');
      return;
    }
    sfx.wrong();
    btn.classList.add('wrong');
    els.answers[correctSlot()].classList.add('right');
    g.phase = 'over';
    setTimeout(() => finish('wrong', safeFloor()), 2000);
  }

  function next() {
    if (!g || g.phase !== 'revealed') return;
    g.level += 1;
    g.questions[g.level] = draw(g.level, g.asked);
    g.phase = 'choose';
    g.selected = null;
    g.gone = new Set();
    g.tried = new Set();
    g.poll = null;
    g.doubleActive = false;
    els.answers.forEach((b) => b.classList.remove('right', 'wrong', 'locked'));
    renderGame();
    say(T[lang].pick);
    els.question.focus({ preventScroll: true });
  }

  function walk() {
    if (g.phase !== 'choose') return;
    if (!g.walkConfirm) { g.walkConfirm = true; renderGame(); return; }
    finish('walk', banked());
  }

  function finish(how, amount) {
    clearTimeout(g.timer);
    g.end ={ how, amount, answer: cur().q.a[cur().q.c], correctCount: how === 'won' ? 15 : g.level };
    saveBest(amount);
    show(els.end);
    renderEnd();
    $('end-title').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function renderEnd() {
    const t = T[lang], e = g.end;
    els.end.classList.toggle('won', e.how === 'won');
    $('end-title').textContent = e.how === 'won' ? t.endWon : e.how === 'walk' ? t.endWalk : t.endWrong;
    $('end-amount').textContent = money(e.amount, lang);
    $('end-detail').textContent = e.how === 'won' ? t.wonDetail
      : e.how === 'walk' ? t.walkDetail(e.correctCount)
      : t.wasRight(e.answer[lang === 'np' ? 1 : 0]);
    renderBest();
  }

  function saveBest(amount) {
    const best = parseInt(store.get('cq-best') || '0', 10);
    if (amount > best) store.set('cq-best', String(amount));
  }

  /* ---------- lifelines ---------- */
  function useLife(k) {
    if (!g || g.phase !== 'choose' || !g.lives[k]) return;
    const t = T[lang];
    g.lives[k] = false;
    g.walkConfirm = false;
    sfx.life();
    const live = [0, 1, 2, 3].filter((s) => !g.gone.has(s) && !g.tried.has(s));
    const right = correctSlot();
    if (k === 'cut') {
      const wrong = cutTwo(live, right);
      wrong.forEach((s) => g.gone.add(s));
      if (wrong.includes(g.selected)) g.selected = null;
      if (g.poll) wrong.forEach((s) => { g.poll[s] = null; });
      say(t.cutDone);
    } else if (k === 'poll') {
      g.poll = makePoll(g.level, live, right);
      say(t.pollDone);
    } else if (k === 'swap') {
      const fresh = draw(g.level, g.asked);
      if (fresh) g.questions[g.level] = fresh;
      g.selected = null; g.gone = new Set(); g.tried = new Set(); g.poll = null;
      say(t.swapDone);
    } else if (k === 'double') {
      g.doubleActive = true;
      say(t.doubleOn);
    }
    renderGame();
  }

  /* ---------- wiring ---------- */
  $('start').addEventListener('click', start);
  $('again').addEventListener('click', start);
  els.walk.addEventListener('click', walk);
  els.answers.forEach((b, i) => b.addEventListener('click', () => select(i)));
  els.lives.forEach((b) => b.addEventListener('click', () => useLife(b.dataset.life)));
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    store.set('cq-lang', lang);
    applyLang();
  }));
  const soundBtn = $('sound');
  const paintSound = () => soundBtn.setAttribute('aria-pressed', String(soundOn));
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    store.set('cq-sound', soundOn ? 'on' : 'off');
    paintSound();
    if (soundOn) sfx.pick();
  });

  // keyboard: A-D or 1-4 answers straight away
  document.addEventListener('keydown', (e) => {
    if (!g || els.game.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const map = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
    if (k in map) select(map[k]);
  });

  paintSound();
  applyLang();
})();
