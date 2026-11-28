/* Bato Harayo (बाटो हरायो) — lost on a dark road with a dead phone. Find your way before morning. */
/* Game state, choices and story flow, the story panel, endings, input and the main loop. */
(() => {
  'use strict';
  const BH = window.BH;
  const { DAWN, store, randInt, clamp, pick, sleep, vibrate } = BH.Util;
  const { getLang, setLang, L, cap, fill, digits, t, fmtClock } = BH.I18n;
  const { VILLAGES, PATHS, SCENES, PEOPLE, HONEST_THOUGHT, EVENTS, THOUGHTS, LINES, EXTRA, DILEMMAS, NO_SIGNAL, PLAYER, ENDINGS } = BH.Story;
  const { genWorld } = BH.World;
  const audio = BH.Audio;
  const voice = BH.Voice;
  const Art = BH.Art;

  // ---------- Setup ----------
  const $ = (id) => document.getElementById(id);
  const ui = {
    menu: $('menu'), over: $('over'), play: $('play'), retry: $('retry'), share: $('share'),
    mute: $('mute'), lang: $('lang'), menuBest: $('menuBest'), overBest: $('overBest'),
    overTitle: $('overTitle'), overSub: $('overSub'), overThought: $('overThought'), stars: $('stars'),
    finalTime: $('finalTime'), finalMet: $('finalMet'), finalPlaces: $('finalPlaces'), newBest: $('newBest'),
    hud: $('hud'), clock: $('clock'), stBar: $('stBar'), fearBar: $('fearBar'), memBtn: $('memBtn'),
    memory: $('memory'), memList: $('memList'), memClose: $('memClose'),
    panel: $('panel'), place: $('place'), voiceBtn: $('voiceBtn'), battBar: $('battBar'), badges: $('badges'), newBadges: $('newBadges'), lines: $('lines'), choices: $('choices'), fade: $('fade'), fadeText: $('fadeText'),
  };

  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Badges collected across nights (saved in the browser).
  const BADGES = [
    { id: 'midnight', ne: 'मध्यरात अघि घर', en: 'Home before midnight', test: (k) => k === 'home' && minutes < 180 },
    { id: 'kind', ne: 'दयालु मन', en: 'Kind heart', test: () => flags.helpedChild },
    { id: 'kich', ne: 'किचकन्नीलाई चिनेँ', en: 'Spotted the kichkandi', test: () => flags.sawFeet && !flags.followedHer },
    { id: 'dog', ne: 'कुकुरको साथी', en: 'Dog’s best friend', test: () => flags.followedDog },
    { id: 'call', ne: 'हेलो मामा!', en: 'Hello, Mama!', test: () => flags.calledOk },
    { id: 'riddle', ne: 'पहेली सुल्झाएँ', en: 'Riddle solved', test: () => flags.riddleSolved },
    { id: 'nophone', ne: 'मोबाइल बिनै घर', en: 'Home without the phone', test: (k) => k === 'home' && !flags.charged },
    { id: 'dawn', ne: 'रात कटाएँ', en: 'Survived the night', test: (k) => k === 'morning' },
    { id: 'tea', ne: 'चियाको सोखिन', en: 'Tea lover', test: () => (flags.teaCount || 0) >= 2 },
  ];

  // ---------- State ----------
  let state = 'menu';
  let best = store.get('bh_best', null);
  let world = null, cur = 0, prevNode = -1, minutes = 0, stamina = 100, fear = 10, moves = 0;
  let metSet = new Set(), memory = [], lines = [], busy = false, endKind = null, endMinutes = 0, endStars = 0;
  let midnightDone = false, time = 0, village = VILLAGES[0];
  let battery = 0, torchOn = false, hasTorch = false, flags = {}, dilemmasSeen = new Set();
  const badges = new Set(store.get('bh_badges', []));

  function setVoiceUI() { ui.voiceBtn.classList.toggle('muted', !voice.on); ui.voiceBtn.setAttribute('aria-pressed', String(voice.on)); }

  const node = (id = cur) => world.nodes[id];
  const pathName = (e) => L(PATHS[e.path]);
  const sceneName = (n) => L(SCENES[n.scene].name);
  const personName = (p) => L(PEOPLE[p.type].name);
  const correctExit = (n) => n.exits.reduce((b, e) => (node(e.to).dist < node(b.to).dist ? e : b));
  function wrongExit(n) {
    const c = correctExit(n), others = n.exits.filter((e) => e !== c);
    if (!others.length) return c;
    return others.sort((a, b) => node(b.to).dist - node(a.to).dist)[0];
  }
  function personHere(n) {
    const p = n.person;
    if (!p || p.gone) return null;
    if (p.type === 'kichkandi' && minutes < 120) return null; // she only appears after 11 PM
    return p;
  }

  // ---------- Panel ----------
  function addLine(kind, text, who, voiceKey) {
    if (!text) return;
    lines.push({ kind, text, who });
    if (state !== 'play') return;
    const key = voiceKey || (kind === 'thought' ? 'thought' : kind === 'me' ? 'me' : null);
    if (!key) return;
    let spoken = text;
    if (kind === 'narr' || kind === 'event') { // only the quoted speech inside narration is spoken
      const q = [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      if (!q.length) return;
      spoken = q.join(' ');
    }
    voice.say(spoken, key);
  }
  function renderPanel() {
    const n = node();
    ui.place.textContent = sceneName(n);
    ui.lines.innerHTML = '';
    for (const l of lines) {
      const p = document.createElement('p');
      p.className = `line ${l.kind}`;
      if (l.kind === 'thought') p.dataset.label = t('thinking');
      if (l.kind === 'say' || l.kind === 'me') { const b = document.createElement('b'); b.textContent = l.kind === 'me' ? t('you') : l.who; p.appendChild(b); p.appendChild(document.createTextNode(l.text)); }
      else p.textContent = l.text;
      ui.lines.appendChild(p);
    }
    ui.choices.innerHTML = '';
    const list = buildChoices();
    let k = 0;
    for (const c of list) {
      if (c.label === null) { const d = document.createElement('p'); d.className = 'choices-label'; d.textContent = c.text; ui.choices.appendChild(d); continue; }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `choice ${c.path ? 'path' : 'act'}`;
      b.disabled = busy;
      k++;
      b.textContent = `${k}. ${c.label}`;
      if (c.small) { const s = document.createElement('small'); s.textContent = ` (${c.small})`; b.appendChild(s); }
      b.addEventListener('click', () => { if (!busy) c.act(); });
      ui.choices.appendChild(b);
    }
    updateHUD();
    ui.lines.scrollTop = ui.lines.scrollHeight; // after the buttons, so the newest line stays in view
    requestAnimationFrame(() => { ui.lines.scrollTop = ui.lines.scrollHeight; });
  }

  function buildChoices() {
    const n = node(), p = personHere(n), out = [];
    if (n.dilemma && !n.dilemmaDone) { // a decision blocks the road until you make it
      for (const o of DILEMMAS[n.dilemma].options) {
        if (o.needs === 'light' && !(hasTorch || battery > 0)) continue;
        out.push({ label: L(o.label), act: () => resolveDilemma(o.act) });
      }
      return out;
    }
    if (p) {
      if (!n.asked) out.push({ label: t('ask'), act: ask });
      else if (!n.sureAsked && !['dog'].includes(PEOPLE[p.type].kind)) out.push({ label: t('sure'), act: sure });
      if (p.type === 'kukur') {
        if (!n.petted) out.push({ label: t('pet'), act: pet });
        out.push({ label: t('followDog'), act: followDog });
      } else if (!n.chatted) out.push({ label: t('chat'), act: chat });
      if (p.type === 'kichkandi') out.push({ label: t('followHer'), act: followHer });
      if (p.type === 'didi' && !n.tea) out.push({ label: t('tea'), act: tea });
      if (p.type === 'didi' && !n.charged) out.push({ label: t('charge'), act: charge });
    }
    if (n.scene === 'chautari' && !n.rested) out.push({ label: t('rest'), act: rest });
    if (n.sign && !n.signRead) out.push({ label: t('sign'), act: readSign });
    if (hasTorch || battery > 0) out.push({ label: torchOn ? t('torchOff') : t('torchOn'), small: hasTorch ? '' : `${digits(battery)}%`, act: toggleTorch });
    if (battery >= 5) out.push({ label: t('call'), small: `${digits(battery)}%`, act: callMama });
    out.push({ label: null, text: t('choosePath') });
    for (const e of n.exits) out.push({ label: cap(pathName(e)), small: e.to === prevNode ? t('cameFrom') : '', path: true, act: () => walk(e) });
    return out;
  }

  function updateHUD() {
    ui.clock.textContent = fmtClock(minutes);
    ui.stBar.style.width = `${clamp(stamina, 0, 100)}%`;
    ui.stBar.style.background = stamina > 50 ? '#2e9e5b' : stamina > 25 ? '#f39a1e' : '#e23b3b';
    ui.fearBar.style.width = `${clamp(fear, 0, 100)}%`;
    ui.battBar.style.width = `${clamp(battery, 0, 100)}%`;
  }

  function remember(n, who, said) { memory.push({ place: sceneName(n), who, said }); }

  // ---------- Thoughts ----------
  function chooseThought(n, p, ctxInfo) {
    if (minutes >= 450) return L(THOUGHTS.dawn);
    if (ctxInfo.eventThought) return ctxInfo.eventThought;
    if (n.exits.length === 1) return L(THOUGHTS.deadEnd);
    if (n.dist === 1) return L(THOUGHTS.near);
    if (n.visits > 1) return L(THOUGHTS.revisit);
    if (p && ctxInfo.firstMeet) return L(PEOPLE[p.type].introThought);
    if (fear >= 70) return pick(L(THOUGHTS.fear));
    if (stamina <= 30) return pick(L(THOUGHTS.tired));
    if (minutes >= 240 && Math.random() < 0.4) return pick(L(THOUGHTS.late));
    const th = L(SCENES[n.scene].think);
    return th[n.thinkIdx % th.length];
  }

  // ---------- Flow ----------
  function arrive(id, info = {}) {
    voice.stop();
    cur = id;
    const n = node();
    n.visits++;
    lines = [];
    if (n.scene === 'village') { finish('home'); return; }
    if (info.start) addLine('narr', fill(L(LINES.start), { village: L(village) }));
    else {
      if (info.lead) addLine('narr', info.lead);
      const d = L(SCENES[n.scene].desc);
      addLine('narr', d[n.descIdx % d.length]);
      if (n.visits > 1) addLine('sys', t('visited'));
    }
    for (const ev of info.events || []) addLine('event', ev);
    const p = personHere(n);
    let firstMeet = false;
    if (p) {
      metSet.add(n.id);
      if (n.met) addLine('sys', fill(t('stillHere'), { name: personName(p) }));
      else {
        n.met = true; firstMeet = true;
        addLine('narr', L(PEOPLE[p.type].intro), null, p.type);
        fear = clamp(fear + (PEOPLE[p.type].meetFear || 0), 0, 100);
        if (p.type === 'kukur') audio.bark();
        if (p.type === 'kichkandi') audio.whisper();
      }
    } else if (n.person && n.person.type === 'kichkandi' && n.person.gone) addLine('narr', L(THOUGHTS.kichGone));
    let dThought = null;
    if (!info.start && !p && n.visits === 1) maybeDilemma(n);
    if (n.dilemma && !n.dilemmaDone) {
      const D = DILEMMAS[n.dilemma];
      addLine('event', L(D.text), null, D.voice);
      dThought = L(D.thought);
      if (n.dilemma === 'eyes') setTimeout(() => audio.jackal(), 400);
      if (n.dilemma === 'snake') setTimeout(() => audio.rustle(), 300);
    }
    audio.setRain(n.dilemma === 'rain' && !n.dilemmaDone);
    addLine('thought', info.start ? L(THOUGHTS.intro) : dThought || chooseThought(n, p, { eventThought: info.eventThought, firstMeet }));
    audio.setScene(n.scene, p && p.type);
    renderPanel();
  }

  function spend(mins, cost = {}) {
    const before = minutes;
    minutes += mins;
    stamina = clamp(stamina + (cost.stamina || 0), 0, 100);
    fear = clamp(fear + (cost.fear || 0), 0, 100);
    if (!midnightDone && before < 180 && minutes >= 180) { midnightDone = true; addLine('event', L(LINES.midnight)); audio.bell(); }
  }
  function checkEnd() {
    if (stamina <= 0) { finish('sleep'); return true; }
    if (minutes >= DAWN) { finish('morning'); return true; }
    return false;
  }

  function maybeDilemma(n) {
    if (Math.random() > 0.32) return;
    const options = Object.keys(DILEMMAS).filter((k) => !dilemmasSeen.has(k) && DILEMMAS[k].scenes.includes(n.scene) && (!DILEMMAS[k].after || minutes >= DILEMMAS[k].after));
    if (!options.length) return;
    n.dilemma = pick(options);
    dilemmasSeen.add(n.dilemma);
  }

  function resolveDilemma(act) {
    const n = node();
    n.dilemmaDone = true;
    switch (act) {
      case 'helpChild': {
        addLine('me', L(PLAYER.helpChild));
        spend(35, { stamina: -6, fear: -6 });
        flags.helpedChild = true; hasTorch = true; torchOn = true; n.childGone = true;
        const e = correctExit(n);
        addLine('narr', L(EXTRA.childHome));
        addLine('say', fill(L(EXTRA.babaSays), { village: L(village), path: pathName(e) }), t('baba'), 'baba');
        remember(n, t('baba'), pathName(e));
        addLine('thought', L(EXTRA.childThought));
        break;
      }
      case 'leaveChild': addLine('me', L(PLAYER.leaveChild)); spend(0, { fear: 5 }); addLine('narr', L(EXTRA.leaveChild)); addLine('thought', L(EXTRA.leaveChildThought)); break;
      case 'snakeWait': spend(15, { fear: -4 }); addLine('narr', L(EXTRA.snakeWait)); addLine('thought', L(EXTRA.snakeThought)); break;
      case 'snakeStone':
        if (Math.random() < 0.5) { spend(3); addLine('narr', L(EXTRA.snakeStoneOk)); }
        else { spend(3, { fear: 15 }); addLine('event', L(EXTRA.snakeStoneBad)); vibrate(80); }
        addLine('thought', L(EXTRA.snakeThought));
        break;
      case 'snakeAround': spend(10, { stamina: -8 }); addLine('narr', L(EXTRA.snakeAround)); addLine('thought', L(EXTRA.snakeThought)); break;
      case 'rainShelter': spend(25, { fear: -3 }); audio.setRain(false); addLine('narr', L(EXTRA.rainShelter)); addLine('thought', L(EXTRA.rainThought)); break;
      case 'rainWalk': spend(0, { stamina: -12, fear: 3 }); audio.setRain(false); addLine('narr', L(EXTRA.rainWalk)); addLine('thought', L(EXTRA.rainThought)); break;
      case 'eyesTorch':
        if (!hasTorch) battery = Math.max(0, battery - 2);
        torchOn = hasTorch || battery > 0;
        spend(2, { fear: -5 }); addLine('narr', L(EXTRA.eyesTorch)); addLine('thought', L(EXTRA.eyesThought));
        break;
      case 'eyesShout': spend(2, { fear: 5 }); addLine('narr', L(EXTRA.eyesShout), null, 'me'); addLine('thought', L(EXTRA.eyesThought)); break;
      case 'eyesBack':
        if (prevNode >= 0) { const back = prevNode; prevNode = cur; renderPanel(); travel(back, 15, { fear: 3 }, { lead: L(EXTRA.eyesBack), eventThought: L(EXTRA.eyesThought) }); return; }
        spend(2, { fear: 5 }); addLine('narr', L(EXTRA.eyesShout), null, 'me'); addLine('thought', L(EXTRA.eyesThought));
        break;
      default: break;
    }
    if (!checkEnd()) renderPanel();
  }

  function charge() {
    const n = node();
    n.charged = true; flags.charged = true;
    spend(20);
    addLine('me', L(PLAYER.charge));
    battery = Math.min(100, battery + 12);
    addLine('narr', L(EXTRA.charge), null, 'didi');
    addLine('thought', L(EXTRA.chargeThought));
    if (!checkEnd()) renderPanel();
  }

  function toggleTorch() {
    torchOn = !torchOn;
    if (torchOn) { spend(0, { fear: -5 }); addLine('narr', L(hasTorch ? EXTRA.realTorchOn : EXTRA.torchOn)); addLine('thought', L(EXTRA.torchThought)); }
    else addLine('narr', L(EXTRA.torchOff));
    renderPanel();
  }

  function callMama() {
    const n = node();
    addLine('me', L(PLAYER.call));
    if (NO_SIGNAL.includes(n.scene)) {
      battery = Math.max(0, battery - 1); spend(2);
      addLine('narr', L(EXTRA.noSignal)); addLine('thought', L(EXTRA.noSignalThought));
    } else {
      battery = Math.max(0, battery - 5); spend(10);
      if (Math.random() < 0.25) {
        addLine('say', L(EXTRA.callDropSay), t('mama'), 'mama'); addLine('sys', L(EXTRA.callDrop)); addLine('thought', L(EXTRA.callDropThought));
      } else {
        const e = correctExit(n);
        flags.calledOk = true;
        addLine('say', fill(L(EXTRA.mamaSays), { place: sceneName(n), path: pathName(e) }), t('mama'), 'mama');
        remember(n, t('mama'), pathName(e));
        spend(0, { fear: -8 });
        addLine('thought', L(EXTRA.mamaThought));
      }
    }
    if (battery === 0 && !hasTorch) torchOn = false;
    if (!checkEnd()) renderPanel();
  }

  function ask() {
    const n = node(), p = personHere(n), def = PEOPLE[p.type];
    n.asked = true;
    spend(5);
    const v = { village: L(village) };
    addLine('me', fill(L(def.kind === 'dog' ? PLAYER.askDog : PLAYER.ask), v));
    let e = null, text, thought = HONEST_THOUGHT;
    switch (def.kind) {
      case 'honest': e = correctExit(n); text = def.ask; break;
      case 'sadhu': e = p.wrong ? wrongExit(n) : correctExit(n); text = def.ask; break;
      case 'riddle': e = correctExit(n); text = def.ask; v.riddle = L(PATHS[e.path].riddle); thought = def.askThought; break;
      case 'joker': if (n.exits.length === 1) p.lies = false; e = p.lies ? wrongExit(n) : correctExit(n); text = p.lies ? def.askLie : def.askTrue; thought = p.lies ? def.lieThought : def.trueThought; break;
      case 'drunk': e = pick(n.exits); text = def.ask; thought = def.askThought; break;
      case 'liar': e = wrongExit(n); text = def.ask; thought = def.askThought; break;
      case 'dog': addLine('narr', L(def.ask)); audio.bark(); addLine('thought', L(def.askThought)); renderPanel(); return;
      default: break;
    }
    n.told = e;
    v.path = pathName(e);
    const said = fill(L(text), v);
    addLine('say', said, personName(p), p.type);
    addLine('thought', L(thought));
    remember(n, personName(p), def.kind === 'riddle' ? v.riddle : v.path);
    if (!checkEnd()) renderPanel();
  }

  function sure() {
    const n = node(), p = personHere(n), def = PEOPLE[p.type];
    n.sureAsked = true;
    spend(5);
    addLine('me', L(PLAYER.sure));
    const v = { village: L(village) };
    let text = def.sure;
    if (def.kind === 'joker' && p.lies) { p.lies = false; n.told = correctExit(n); text = def.confess; remember(n, personName(p), pathName(n.told)); }
    else if (def.kind === 'drunk') { n.told = pick(n.exits); remember(n, personName(p), pathName(n.told)); }
    else if (def.kind === 'liar') { spend(0, { fear: 6 }); audio.whisper(); }
    v.path = pathName(n.told);
    addLine('say', fill(L(text), v), personName(p), p.type);
    if (def.kind === 'joker') addLine('thought', L(text === def.confess ? def.trueThought : HONEST_THOUGHT));
    if (!checkEnd()) renderPanel();
  }

  function chat() {
    const n = node(), p = personHere(n), def = PEOPLE[p.type];
    n.chatted = true;
    spend(10, def.chatFx || {});
    addLine('me', L(PLAYER.chat));
    addLine(p.type === 'kichkandi' ? 'event' : 'narr', L(def.chat), null, p.type);
    addLine('thought', L(def.chatThought));
    if (p.type === 'kichkandi') { flags.sawFeet = true; audio.whisper(); vibrate(80); }
    if (p.type === 'driver') { battery = Math.min(100, battery + 8); flags.charged = true; addLine('narr', L(EXTRA.driverCharge)); }
    if (!checkEnd()) renderPanel();
  }

  function tea() {
    const n = node();
    n.tea = true;
    flags.teaCount = (flags.teaCount || 0) + 1;
    spend(15, { stamina: 25, fear: -12 });
    addLine('me', L(PLAYER.tea));
    addLine('narr', L(LINES.tea), null, 'didi'); addLine('thought', L(LINES.teaThought));
    audio.pour();
    if (!checkEnd()) renderPanel();
  }

  function rest() {
    const n = node();
    n.rested = true;
    spend(40, { stamina: 22, fear: -4 });
    addLine('narr', L(LINES.rest)); addLine('thought', L(LINES.restThought));
    if (!checkEnd()) renderPanel();
  }

  function pet() {
    const n = node();
    n.petted = true;
    spend(5, { fear: -10 });
    addLine('narr', L(LINES.pet)); addLine('thought', L(LINES.petThought));
    if (!checkEnd()) renderPanel();
  }

  function readSign() {
    const n = node();
    n.signRead = true;
    spend(5);
    if (n.signOk === undefined) n.signOk = Math.random() < 0.7;
    if (n.signOk) {
      const e = correctExit(n);
      addLine('narr', fill(L(LINES.signRead), { village: L(village), path: pathName(e) }));
      addLine('thought', L(THOUGHTS.sign));
      remember(n, L(LINES.signName), pathName(e));
    } else { addLine('narr', L(LINES.signFaded)); addLine('thought', L(THOUGHTS.signBad)); }
    if (!checkEnd()) renderPanel();
  }

  async function travel(destId, mins, cost, info) {
    busy = true; renderPanel();
    ui.fadeText.textContent = t('walking');
    ui.fade.classList.add('on');
    audio.footsteps();
    await sleep(reduceMotion ? 150 : 650);
    const before = lines.length;
    spend(mins, cost);
    const midnight = lines.length > before ? lines[lines.length - 1].text : null;
    moves++;
    if (stamina <= 0) { await sleep(300); finish('sleep'); busy = false; ui.fade.classList.remove('on'); return; }
    if (minutes >= DAWN && node(destId).scene !== 'village') { await sleep(300); cur = destId; finish('morning'); busy = false; ui.fade.classList.remove('on'); return; }
    if (midnight) info.events = [midnight, ...(info.events || [])];
    if (fear >= 100) { // panic: run blindly somewhere
      const from = destId;
      destId = pick(node(destId).exits).to;
      prevNode = from;
      minutes += 15; stamina = clamp(stamina - 10, 0, 100); fear = 60;
      info.events = [...(info.events || []), L(LINES.panic)];
      info.eventThought = L(LINES.panicThought);
      vibrate([60, 40, 60]);
      if (stamina <= 0) { finish('sleep'); busy = false; ui.fade.classList.remove('on'); return; }
    }
    arrive(destId, info);
    await sleep(250);
    ui.fade.classList.remove('on');
    busy = false;
    if (state === 'play') renderPanel();
  }

  function walk(e) {
    const dest = node(e.to), here = node();
    if (here.person && PEOPLE[here.person.type].kind === 'riddle' && here.told === e) flags.riddleSolved = true;
    prevNode = cur;
    const late = minutes >= 180 && minutes < 330 ? 4 : 1;
    const cost = { stamina: -(randInt(5, 9) + (e.path === 'up' ? 4 : 0)), fear: SCENES[dest.scene].fear + late };
    const info = { events: [] };
    if (torchOn) { // light halves the fear of dark places and stops you slipping
      if (cost.fear > 0) cost.fear = Math.round(cost.fear / 2);
      if (!hasTorch) { battery = Math.max(0, battery - 3); if (!battery) { torchOn = false; info.events.push(L(EXTRA.battDead)); } }
    }
    if (Math.random() < 0.3 && dest.scene !== 'village') {
      let ev = pick(EVENTS);
      if (torchOn && ev.stamina) ev = EVENTS[2];
      cost.fear += ev.fear || 0; cost.stamina += ev.stamina || 0;
      info.events.push(L(ev.text)); info.eventThought = L(ev.thought);
      if (ev.sound) setTimeout(() => audio[ev.sound] && audio[ev.sound](), 900);
    }
    travel(e.to, e.cost, cost, info);
  }

  function followDog() {
    const n = node();
    addLine('me', L(PLAYER.followDog)); renderPanel();
    flags.followedDog = true;
    n.person.gone = true; // the dog leaves with you
    let id = cur, mins = 0;
    for (let k = 0; k < 2; k++) {
      const here = node(id);
      if (here.scene === 'village') break;
      const e = correctExit(here);
      mins += Math.round(e.cost * 0.8);
      prevNode = id; id = e.to;
    }
    travel(id, mins, { stamina: -10, fear: -5 }, { lead: L(LINES.dogLead), eventThought: L(LINES.dogThought) });
  }

  function followHer() {
    const n = node();
    addLine('me', L(PLAYER.followHer)); renderPanel();
    flags.followedHer = true;
    n.person.gone = true;
    const far = world.nodes.filter((x) => x.scene !== 'village' && x.id !== cur).sort((a, b) => b.dist - a.dist);
    const dest = pick(far.slice(0, 3));
    prevNode = -1;
    audio.whisper();
    travel(dest.id, 40, { stamina: -12, fear: 20 }, { lead: L(LINES.herLead), eventThought: L(LINES.herThought) });
  }

  function start() {
    audio.init();
    world = genWorld();
    village = pick(VILLAGES);
    minutes = 0; stamina = 100; fear = 15; moves = 0; prevNode = -1;
    metSet = new Set(); memory = []; busy = false; endKind = null; midnightDone = false;
    battery = 0; torchOn = false; hasTorch = false; flags = {}; dilemmasSeen = new Set();
    state = 'play';
    ui.menu.classList.add('hidden'); ui.over.classList.add('hidden');
    ui.hud.classList.remove('hidden'); ui.panel.classList.remove('hidden');
    Art.resize(state);
    arrive(world.start.id, { start: true });
    if (voice.on && voice.supported && !voice.available()) { addLine('sys', t('noVoice')); renderPanel(); }
  }

  function finish(kind) {
    if (state !== 'play') return;
    state = 'over'; endKind = kind; endMinutes = Math.min(minutes, DAWN);
    const E = ENDINGS[kind];
    const stars = kind === 'home' ? (minutes < 300 ? 3 : minutes < 390 ? 2 : 1) : 0; // before 2:00 AM, 3:30 AM
    endStars = stars;
    const score = kind === 'home' ? stars * 1000 + (DAWN - minutes) : 0;
    let isBest = false;
    if (kind === 'home' && (!best || score > best.score)) { best = { score, stars, minutes }; store.set('bh_best', best); isBest = true; }
    ui.overTitle.textContent = E.title;
    ui.stars.innerHTML = kind === 'home' ? `${'★'.repeat(stars)}<span class="off">${'★'.repeat(3 - stars)}</span>` : '';
    ui.stars.setAttribute('aria-label', `${stars} / 3`);
    ui.overSub.textContent = fill(L(E.sub), { village: L(village) });
    ui.overThought.textContent = L(E.thought);
    ui.finalTime.textContent = fmtClock(endMinutes);
    ui.finalMet.textContent = digits(metSet.size);
    ui.finalPlaces.textContent = digits(moves);
    ui.newBest.classList.toggle('hidden', !isBest);
    if (flags.helpedChild) ui.overSub.textContent += L(EXTRA.childSmile);
    const fresh = BADGES.filter((b) => b.test(kind) && !badges.has(b.id)).map((b) => b.id);
    fresh.forEach((id) => badges.add(id));
    store.set('bh_badges', [...badges]);
    renderBadges(ui.newBadges, fresh);
    renderBadges(ui.badges);
    showBest();
    ui.hud.classList.add('hidden'); ui.panel.classList.add('hidden'); ui.memory.classList.add('hidden');
    audio.setScene(kind === 'home' ? 'village' : 'dawn', null);
    audio.ending(kind);
    voice.stop();
    const quote = [...L(E.sub).matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
    if (quote) voice.say(quote, 'maiju');
    voice.say(L(E.thought), 'me');
    Art.resize(state);
    setTimeout(() => ui.over.classList.remove('hidden'), 700);
  }

  function renderBadges(el, only) {
    el.innerHTML = '';
    const list = only ? BADGES.filter((b) => only.includes(b.id)) : BADGES;
    if (only && !list.length) return;
    const h = document.createElement('p');
    h.className = 'badges-title';
    h.textContent = only ? t('newBadges') : `${t('badgesLbl')} ${digits(badges.size)}/${digits(BADGES.length)}`;
    el.appendChild(h);
    for (const b of list) {
      const c = document.createElement('span');
      c.className = `chip${only || badges.has(b.id) ? ' on' : ''}`;
      c.textContent = L(b);
      el.appendChild(c);
    }
  }

  function showBest() {
    const s = best ? `${'★'.repeat(best.stars)} · ${fmtClock(best.minutes)}` : '–';
    ui.menuBest.textContent = s; ui.overBest.textContent = s;
  }

  function openMemory() {
    ui.memList.innerHTML = '';
    if (!memory.length) { const li = document.createElement('li'); li.textContent = t('memEmpty'); ui.memList.appendChild(li); }
    for (const m of memory) {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = `${m.place} · ${m.who}`;
      li.appendChild(b); li.appendChild(document.createElement('br')); li.appendChild(document.createTextNode(`"${m.said}"`));
      ui.memList.appendChild(li);
    }
    ui.memory.classList.remove('hidden');
    ui.memClose.focus();
  }

  function applyLang() {
    document.documentElement.lang = getLang();
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    renderBadges(ui.badges);
    showBest();
  }

  function setMuteUI() { ui.mute.classList.toggle('muted', audio.muted); ui.mute.setAttribute('aria-pressed', String(audio.muted)); }

  // ---------- Input ----------
  ui.play.addEventListener('click', start);
  ui.retry.addEventListener('click', start);
  ui.mute.addEventListener('click', () => { audio.init(); if (!audio.muted) voice.stop(); audio.setMuted(!audio.muted); store.set('bh_muted', audio.muted); setMuteUI(); ui.mute.blur(); });
  ui.lang.addEventListener('click', () => { setLang(getLang() === 'en' ? 'ne' : 'en'); store.set('bh_lang', getLang()); applyLang(); });
  ui.memBtn.addEventListener('click', openMemory);
  ui.voiceBtn.addEventListener('click', () => { voice.on = !voice.on; store.set('bh_voice', voice.on); if (!voice.on) voice.stop(); setVoiceUI(); ui.voiceBtn.blur(); });
  ui.memClose.addEventListener('click', () => { ui.memory.classList.add('hidden'); ui.memBtn.focus(); });
  ui.share.addEventListener('click', async () => {
    const s = endKind === 'home' ? '★'.repeat(endStars) : '';
    const text = endKind === 'home' ? t('shareHome')(fmtClock(endMinutes), s) : t('shareOther')();
    const url = location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ title: 'Bato Harayo · बाटो हरायो', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      ui.share.textContent = t('copied');
      setTimeout(() => { ui.share.textContent = t('share'); }, 1500);
    } catch { /* share cancelled or unavailable */ }
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') { audio.init(); if (!audio.muted) voice.stop(); audio.setMuted(!audio.muted); store.set('bh_muted', audio.muted); setMuteUI(); return; }
    if (e.code === 'Escape' && !ui.memory.classList.contains('hidden')) { ui.memory.classList.add('hidden'); return; }
    if (state === 'play' && !busy && ui.memory.classList.contains('hidden') && /^Digit[1-9]$/.test(e.code)) {
      const btns = [...ui.choices.querySelectorAll('button')];
      const b = btns[Number(e.code.slice(5)) - 1];
      if (b) { e.preventDefault(); b.click(); }
    }
  });
  window.addEventListener('resize', () => Art.resize(state));
  document.addEventListener('visibilitychange', () => { if (!audio.ac) return; if (document.hidden) audio.ac.suspend(); else audio.ac.resume(); });



  // ---------- Go ----------
  Art.resize(state);
  setMuteUI();
  setVoiceUI();
  applyLang();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now; time += dt;
    audio.tick(dt, minutes, state, fear);
    Art.render({ state, world, endKind, minutes, time, torchOn, hasTorch, fear, node, personHere });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
