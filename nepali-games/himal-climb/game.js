/* Himal Climb (हिमाल चढाइ) — climb the 10 highest mountains on Earth, lowest first. No dependencies. */
(() => {
  'use strict';

  // ---------- Setup ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {
    menu: $('menu'), over: $('over'), play: $('play'), retry: $('retry'), share: $('share'),
    mute: $('mute'), lang: $('lang'), menuBest: $('menuBest'), overBest: $('overBest'),
    overTitle: $('overTitle'), overSub: $('overSub'), finalAlt: $('finalAlt'), overMt: $('overMt'),
    peaks: $('peaks'), mtName: $('mtName'), mtOther: $('mtOther'), mtMeta: $('mtMeta'), mtRoute: $('mtRoute'),
    mtLock: $('mtLock'), next: $('next'), toMenu: $('toMenu'),
    finalCamp: $('finalCamp'), finalTime: $('finalTime'), newBest: $('newBest'),
  };

  const TAU = Math.PI * 2;
  const FONT = '"Nirmala UI", "Noto Sans Devanagari", "Kohinoor Devanagari", Mangal, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const FLAG = ['#1f6fd1', '#f4f4f4', '#e23b3b', '#2e9e5b', '#f5c518']; // prayer flag order

  // ---------- The 10 highest mountains on Earth, played lowest first ----------
  // Each level climbs the mountain's standard route. Camp heights are the usual real ones.
  // sections: [from m, ground, hazard rate, crevasse rate, English, Nepali]
  // rows: taps from start to summit (longer climbs as you go up the list);
  // dmax: how sparse and crumbly the holds get; haz: overall falling ice/rock rate;
  // drain: how fast strength drains (lower = gentler early levels).
  const S = (m, terrain, haz, crev, en, ne) => ({ m, terrain, haz, crev, en, ne });
  const KHUMBU = [
    S(5000, 'moraine', 0.5, 0, 'Khumbu Glacier', 'खुम्बु हिमनदी'),
    S(5364, 'ice', 1.2, 0.07, 'Khumbu Icefall', 'खुम्बु आइसफल'),
    S(6065, 'snow', 0.45, 0.05, 'Western Cwm', 'वेस्टर्न कुम'),
    S(6600, 'blueice', 1, 0, 'Lhotse Face', 'ल्होत्से फेस'),
  ];
  const MOUNTAINS = [
    { id: 'annapurna', en: 'Annapurna I', ne: 'अन्नपूर्ण प्रथम', m: 8091, rank: 10, where: 'np', route: ['North Face', 'उत्तरी फेस'],
      start: 3900, rows: 200, dmax: 0.35, haz: 0.6, drain: 0.7, camps: [4190, 5100, 5600, 6400, 7100], sections: [
        S(3900, 'moraine', 0.5, 0, 'North Annapurna Glacier', 'उत्तरी अन्नपूर्ण हिमनदी'),
        S(4300, 'ice', 0.9, 0.06, 'Crevasse Field', 'क्रेभास क्षेत्र'),
        S(5100, 'dark', 1, 0, 'Dutch Rib', 'डच रिब'),
        S(5600, 'blueice', 1.35, 0, 'Under the Sickle', 'सिकलमुनि'),
        S(6400, 'snow', 0.8, 0, 'North Face', 'उत्तरी फेस'),
        S(7700, 'dark', 0.6, 0, 'Summit Ridge', 'शिखर धार')] },
    { id: 'nangaparbat', en: 'Nanga Parbat', ne: 'नाङ्गा पर्वत', m: 8126, rank: 9, where: 'pk', route: ['Kinshofer Route', 'किन्सहोफर रुट'],
      start: 3900, rows: 240, dmax: 0.42, haz: 0.65, drain: 0.78, camps: [4200, 5100, 6000, 6800, 7200], sections: [
        S(3900, 'moraine', 0.5, 0, 'Diamir Glacier', 'दियामीर हिमनदी'),
        S(4300, 'snow', 0.8, 0.04, 'Diamir Face', 'दियामीर फेस'),
        S(5500, 'dark', 1.3, 0, 'Kinshofer Wall', 'किन्सहोफर भित्ता'),
        S(6000, 'blueice', 1, 0, 'Upper Diamir Face', 'माथिल्लो दियामीर फेस'),
        S(7200, 'snow', 0.7, 0, 'Bazhin Basin', 'बाजिन बेसिन'),
        S(7800, 'dark', 0.7, 0, 'Summit Pyramid', 'शिखर पिरामिड')] },
    { id: 'manaslu', en: 'Manaslu', ne: 'मनास्लु', m: 8163, rank: 8, where: 'np', route: ['Northeast Face', 'उत्तरपूर्वी फेस'],
      start: 4500, rows: 280, dmax: 0.5, haz: 0.7, drain: 0.84, camps: [4800, 5700, 6400, 6800, 7400], sections: [
        S(4500, 'moraine', 0.5, 0, 'Manaslu Glacier', 'मनास्लु हिमनदी'),
        S(4800, 'snow', 0.5, 0.03, 'Lower Slopes', 'तल्लो ढलान'),
        S(5700, 'ice', 1.1, 0.07, 'Manaslu Icefall', 'मनास्लु आइसफल'),
        S(6400, 'snow', 0.9, 0, 'Snow Slopes', 'हिउँ ढलान'),
        S(7400, 'ridge', 0.6, 0, 'Summit Plateau', 'शिखर पठार'),
        S(8050, 'ridge', 0.4, 0, 'Summit Pinnacle', 'शिखर चुचुरो')] },
    { id: 'dhaulagiri', en: 'Dhaulagiri I', ne: 'धौलागिरि प्रथम', m: 8167, rank: 7, where: 'np', route: ['Northeast Ridge', 'उत्तरपूर्वी धार'],
      start: 4400, rows: 300, dmax: 0.55, haz: 0.65, drain: 0.8, camps: [4700, 5800, 6450, 7250], sections: [
        S(4400, 'moraine', 0.5, 0, 'Chhonbardan Glacier', 'छोनबार्दान हिमनदी'),
        S(4900, 'ice', 1.1, 0.06, 'Dhaulagiri Icefall', 'धौलागिरि आइसफल'),
        S(5700, 'snow', 0.7, 0, 'Northeast Col', 'उत्तरपूर्वी कोल'),
        S(6000, 'blueice', 0.9, 0, 'Northeast Ridge', 'उत्तरपूर्वी धार'),
        S(7250, 'snow', 0.7, 0, 'Upper Ridge', 'माथिल्लो धार'),
        S(7900, 'dark', 0.7, 0, 'Summit Couloir', 'शिखर गल्छी')] },
    { id: 'chooyu', en: 'Cho Oyu', ne: 'चो ओयु', m: 8188, rank: 6, where: 'npcn', route: ['Northwest Ridge', 'उत्तरपश्चिमी धार'], abc: true,
      start: 5400, rows: 380, dmax: 0.74, haz: 1, drain: 1, camps: [5700, 6400, 7100, 7450], sections: [
        S(5400, 'moraine', 0.4, 0, 'Gyabrag Glacier', 'ग्याब्राग हिमनदी'),
        S(5800, 'moraine', 0.6, 0, 'Scree Slope', 'गेग्रान ढलान'),
        S(6300, 'snow', 0.6, 0, 'Northwest Ridge', 'उत्तरपश्चिमी धार'),
        S(6550, 'blueice', 1.2, 0, 'Ice Cliff', 'हिउँको भीर'),
        S(6700, 'snow', 0.6, 0, 'Northwest Ridge', 'उत्तरपश्चिमी धार'),
        S(7600, 'yellow', 1, 0, 'Yellow Band', 'येलो ब्यान्ड'),
        S(7750, 'ridge', 0.4, 0, 'Summit Plateau', 'शिखर पठार')] },
    { id: 'makalu', en: 'Makalu', ne: 'मकालु', m: 8485, rank: 5, where: 'npcn', route: ['Northwest Ridge', 'उत्तरपश्चिमी धार'], abc: true,
      start: 5400, rows: 420, dmax: 0.72, haz: 0.85, drain: 0.93, camps: [5700, 6400, 6800, 7400, 7700], sections: [
        S(5400, 'moraine', 0.5, 0, 'Barun Glacier', 'बरुण हिमनदी'),
        S(5900, 'snow', 0.6, 0.04, 'Crevasse Field', 'क्रेभास क्षेत्र'),
        S(6800, 'blueice', 1.1, 0, 'Ice Headwall', 'बरफको ठाडो भित्ता'),
        S(7400, 'ridge', 0.6, 0, 'Makalu La', 'मकालु ला'),
        S(7900, 'dark', 1, 0, 'French Couloir', 'फ्रेन्च गल्छी'),
        S(8300, 'ridge', 0.5, 0, 'Summit Ridge', 'शिखर धार')] },
    { id: 'lhotse', en: 'Lhotse', ne: 'ल्होत्से', m: 8516, rank: 4, where: 'npcn', route: ['West Face', 'पश्चिमी फेस'],
      start: 5000, rows: 480, dmax: 0.8, haz: 0.9, drain: 0.96, camps: [5364, 6065, 6400, 7162, 7800], sections: [
        ...KHUMBU,
        S(7800, 'dark', 1.2, 0, 'Lhotse Couloir', 'ल्होत्से गल्छी')] },
    { id: 'kangchenjunga', en: 'Kangchenjunga', ne: 'कञ्चनजङ्घा', m: 8586, rank: 3, where: 'npin', route: ['Southwest Face', 'दक्षिणपश्चिमी फेस'], tradition: true,
      start: 5200, rows: 560, dmax: 0.87, haz: 0.95, drain: 0.98, camps: [5500, 6200, 6500, 7200, 7700], sections: [
        S(5200, 'moraine', 0.5, 0, 'Yalung Glacier', 'यालुङ हिमनदी'),
        S(5600, 'ice', 1, 0.06, 'Lower Icefall', 'तल्लो आइसफल'),
        S(6500, 'blueice', 1.1, 0.03, 'Upper Icefall', 'माथिल्लो आइसफल'),
        S(7150, 'snow', 0.7, 0, 'Great Shelf', 'ग्रेट शेल्फ'),
        S(7900, 'ridge', 0.7, 0, 'The Gangway', 'ग्याङवे'),
        S(8350, 'dark', 0.6, 0, 'Summit Rocks', 'शिखर चट्टान')] },
    { id: 'k2', en: 'K2', ne: 'के२', m: 8611, rank: 2, where: 'pkcn', route: ['Abruzzi Spur', 'अब्रुज्जी स्पर'],
      start: 4700, rows: 640, dmax: 0.95, haz: 1.05, drain: 1, camps: [5000, 6050, 6700, 7200, 7800], sections: [
        S(4700, 'moraine', 0.5, 0, 'Godwin-Austen Glacier', 'गडविन-अस्टिन हिमनदी'),
        S(5300, 'snow', 0.8, 0, 'Abruzzi Spur', 'अब्रुज्जी स्पर'),
        S(6550, 'dark', 1.3, 0, "House's Chimney", 'हाउस चिम्नी'),
        S(6700, 'dark', 1.3, 0, 'Black Pyramid', 'ब्ल्याक पिरामिड'),
        S(7350, 'ridge', 0.7, 0, 'The Shoulder', 'द सोल्डर'),
        S(8200, 'blueice', 1.6, 0, 'The Bottleneck', 'बटलनेक'),
        S(8350, 'blueice', 1.4, 0, 'The Traverse', 'ट्राभर्स'),
        S(8450, 'ridge', 0.5, 0, 'Summit Slopes', 'शिखर ढलान')] },
    { id: 'everest', en: 'Sagarmatha (Everest)', ne: 'सगरमाथा', m: 8849, rank: 1, where: 'npcn', route: ['South Col Route', 'साउथ कोल रुट'],
      start: 5000, rows: 770, dmax: 1, haz: 1, drain: 1, camps: [5364, 6065, 6400, 7162, 7950], sections: [
        ...KHUMBU,
        S(7450, 'yellow', 1.15, 0, 'Yellow Band', 'येलो ब्यान्ड'),
        S(7650, 'dark', 1.1, 0, 'Geneva Spur', 'जेनेभा स्पर'),
        S(7950, 'ridge', 0.55, 0, 'Southeast Ridge', 'दक्षिणपूर्वी धार'),
        S(8790, 'dark', 0.3, 0, 'Hillary Step', 'हिलारी स्टेप'),
        S(8805, 'ridge', 0.3, 0, 'Summit Ridge', 'शिखर धार')],
      // Ledges on summit day that are not camps.
      marks: [{ m: 8400, en: 'The Balcony', ne: 'बाल्कोनी', note: 'swap' }, { m: 8749, en: 'South Summit', ne: 'दक्षिणी शिखर', note: 'close' }] },
  ];
  const WHERE = { np: ['Nepal', 'नेपाल'], pk: ['Pakistan', 'पाकिस्तान'], npcn: ['Nepal–China', 'नेपाल–चीन'], npin: ['Nepal–India', 'नेपाल–भारत'], pkcn: ['Pakistan–China', 'पाकिस्तान–चीन'] };
  const DEATH_ALT = 8000;
  // The current level. Everything below reads these, and loadLevel() sets them.
  let LV = 0, MT = null, START_ALT = 5000, STEP_M = 5, CAMPS = [], CAMP_AT = new Map(), SUMMIT = 0, SUMMIT_ROW = 0;
  let MARKS = [], MARK_AT = new Map(), SECTIONS = [], O2_ALT = 7000, DEATH_ROW = 0, ROPE_ROW = 0, SKY = [];
  const toRow = (m) => Math.ceil((m - START_ALT) / STEP_M - 1e-9);
  function loadLevel(i) {
    LV = clamp(i | 0, 0, MOUNTAINS.length - 1); MT = MOUNTAINS[LV];
    START_ALT = MT.start; STEP_M = (MT.m - MT.start) / MT.rows;
    const last = MT.camps.length - 1;
    // Oxygen starts at the first camp at 7,000 m or higher; the summit push leaves from the last camp at night.
    const o2Camp = MT.camps.findIndex((m) => m >= 7000);
    CAMPS = MT.camps.map((m, k) => ({
      m,
      en: k ? `Camp ${k}` : MT.abc ? 'Advanced Base Camp' : 'Base Camp',
      ne: k ? `शिविर ${DEV[k]}` : MT.abc ? 'अग्रिम आधार शिविर' : 'आधार शिविर',
      notes: [k === o2Camp ? 'o2on' : '', k === last ? 'night' : ''].filter(Boolean),
    }));
    CAMPS.push({ m: MT.m, en: 'Summit', ne: 'शिखर', notes: [] });
    CAMPS.forEach((c) => { c.row = toRow(c.m); });
    CAMP_AT = new Map(CAMPS.map((c, k) => [c.row, k]));
    SUMMIT = CAMPS.length - 1; SUMMIT_ROW = CAMPS[SUMMIT].row;
    MARKS = (MT.marks || []).map((l) => ({ ...l, row: toRow(l.m) }));
    MARK_AT = new Map(MARKS.map((l, k) => [l.row, k]));
    SECTIONS = MT.sections;
    O2_ALT = MT.camps[o2Camp]; DEATH_ROW = toRow(DEATH_ALT); ROPE_ROW = CAMPS[0].row;
    // Sky: deeper blue in thin air, night from the last camp, sunrise partway up summit day, then morning.
    const L = MT.camps[last], top = MT.m, at = (f) => L + f * (top - L);
    SKY = [
      [START_ALT, '#3d8fe0', '#8fc7f2', '#dceefc', 0, 0],
      [L - 50, '#1d58b5', '#5c9cdb', '#bcdcf3', 0, 0],
      [L + 40, '#070b24', '#141c4a', '#27306a', 1, 0],
      [at(0.45), '#0a1033', '#1b2460', '#35407e', 1, 0],
      [at(0.6), '#1c2c6e', '#7a5aa0', '#ffa86b', 0.35, 1],
      [at(0.8), '#1b4ea6', '#5d9bdc', '#ffe0b8', 0, 0.4],
      [top, '#0d3788', '#3b7ccf', '#cfe6fa', 0, 0],
    ];
  }
  const rowAlt = (row) => START_ALT + row * STEP_M;
  const sectionAt = (alt) => { let s = SECTIONS[0]; for (const x of SECTIONS) if (alt >= x.m) s = x; return s; };
  const terrainOf = (row) => sectionAt(rowAlt(row)).terrain;
  const altOf = (row) => (CAMP_AT.has(row) ? CAMPS[CAMP_AT.get(row)].m : MARK_AT.has(row) ? MARKS[MARK_AT.get(row)].m : rowAlt(row));
  // Wall colours per ground type; ice: true means kicked steps instead of rock holds.
  const TERRAIN = {
    moraine: { wall: ['#4f4842', '#7a7068'], crack: 'rgba(30,24,20,0.45)', ice: false },
    ice: { wall: ['#86b2d0', '#d6ebf7'], crack: 'rgba(30,100,150,0.55)', ice: true },
    snow: { wall: ['#b3c6da', '#eef4fa'], crack: 'rgba(90,120,160,0.4)', ice: true },
    blueice: { wall: ['#4f88b5', '#9cc7e5'], crack: 'rgba(15,55,100,0.55)', ice: true },
    yellow: { wall: ['#86703f', '#b99e66'], crack: 'rgba(60,45,20,0.5)', ice: false },
    dark: { wall: ['#2f2e36', '#56555f'], crack: 'rgba(10,10,15,0.55)', ice: false },
    ridge: { wall: ['#bccbdc', '#f4f8fc'], crack: 'rgba(90,120,160,0.4)', ice: true },
  };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const easeOut = (k) => 1 - (1 - k) * (1 - k);
  const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})`; };
  const vibrate = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch { /* ignore */ } };
  function mulberry32(s) {
    return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function oval(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }

  // ---------- Language ----------
  const TEXT = {
    en: {
      kicker: 'Himalayan Climb',
      tag: 'Climb the 10 highest mountains on Earth on their real routes, from Annapurna I all the way up to Sagarmatha.',
      how1: 'Tap the column with a solid hold or a kicked step (or ← ↑ → keys)',
      how2: 'Bare ice, bare rock and cracked holds make you slip. Watch for falling ice and rock!',
      how3: 'Camps and nun chiya give you strength. Above 7,000 m, oxygen bottles keep the thin air from wearing you down',
      play: 'Climb', best: 'Best', lang: 'नेपाली',
      fell: 'Too exhausted to go on. Your Sherpa helps you back down.', summitSub: 'You stood on top of the world!',
      alt: 'Highest point', camp: 'Highest camp', time: 'Time', none: 'None',
      newBest: 'New record!', again: 'Climb again', share: 'Share', copied: 'Copied!',
      energy: 'STRENGTH', o2: 'O₂', to: 'to', m: 'm', paused: 'PAUSED', resume: 'Tap to resume',
      hint: 'Tap the column with a solid hold!', slip: 'Slip!', refill: 'strength back',
      o2on: 'oxygen on', night: 'summit push at night', swap: 'fresh oxygen bottle', close: '100 m to go',
      death: 'Death zone', deathSub: 'Your body can no longer recover',
      noO2: 'Out of oxygen!',
      shareText: (m, mt) => `I reached ${m} m on ${mt} in Himal Climb! Can you make the summit?`,
      shareSummit: (mt, h, tm) => `I summited ${mt} (${h} m) in ${tm} in Himal Climb! Can you beat my time?`,
      level: 'Level', next: 'Next', mountains: 'All mountains', locked: (mt) => `Summit ${mt} to unlock`,
      rankTxt: (n) => (n === 1 ? 'Highest on Earth' : `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} highest on Earth`),
      allDone: 'You climbed all 10 highest mountains on Earth!', tradition: 'stop just below the top, by tradition',
    },
    ne: {
      kicker: 'हिमाली आरोहण',
      tag: 'संसारका १० सबैभन्दा अग्ला हिमाल तिनकै साँचो बाटोबाट चढ्नुहोस्, अन्नपूर्णदेखि सगरमाथासम्म।',
      how1: 'बलियो ढुङ्गा वा हिउँमा बनेको पाइला भएको लाइनमा ट्याप गर्नुहोस् (वा ← ↑ → कुञ्जी)',
      how2: 'खाली बरफ, खाली चट्टान र चर्केको ढुङ्गाले चिप्लाउँछ। खस्ने बरफ र ढुङ्गाबाट बच्नुहोस्!',
      how3: 'शिविर र नुन चियाले बल दिन्छ। ७,००० मिटरमाथि अक्सिजन सिलिन्डरले पातलो हावामा थाक्नबाट जोगाउँछ',
      play: 'चढ्नुहोस्', best: 'उत्कृष्ट', lang: 'English',
      fell: 'अब चढ्ने बल बाँकी छैन। शेर्पाले तपाईंलाई तल झार्नुभयो।', summitSub: 'तपाईं संसारको शिखरमा पुग्नुभयो!',
      alt: 'सबैभन्दा माथि', camp: 'पुगेको शिविर', time: 'समय', none: 'छैन',
      newBest: 'नयाँ रेकर्ड!', again: 'फेरि चढ्नुहोस्', share: 'सेयर', copied: 'कपी भयो!',
      energy: 'बल', o2: 'O₂', to: 'सम्म', m: 'मि.', paused: 'रोकिएको छ', resume: 'जारी राख्न ट्याप गर्नुहोस्',
      hint: 'बलियो समात्ने ठाउँ भएको लाइनमा ट्याप गर्नुहोस्!', slip: 'चिप्लियो!', refill: 'बल फर्कियो',
      o2on: 'अक्सिजन सुरु', night: 'राति शिखरतिर', swap: 'नयाँ अक्सिजन सिलिन्डर', close: '१०० मिटर बाँकी',
      death: 'मृत्यु क्षेत्र', deathSub: 'अब शरीरले आफैं बल फर्काउन सक्दैन',
      noO2: 'अक्सिजन सकियो!',
      shareText: (m, mt) => `मैले हिमाल चढाइमा ${mt} मा ${m} मिटर चढें! तपाईं शिखर पुग्न सक्नुहुन्छ?`,
      shareSummit: (mt, h, tm) => `मैले हिमाल चढाइमा ${tm} मा ${mt} (${h} मि.) चढें! तपाईं योभन्दा छिटो पुग्न सक्नुहुन्छ?`,
      level: 'तह', next: 'अर्को', mountains: 'सबै हिमाल', locked: (mt) => `${mt} चढेपछि खुल्छ`,
      rankTxt: (n) => (n === 1 ? 'संसारकै सबैभन्दा अग्लो' : `संसारको ${['', '', 'दोस्रो', 'तेस्रो', 'चौथो', 'पाँचौं', 'छैटौं', 'सातौं', 'आठौं', 'नवौं', 'दशौं'][n]} अग्लो`),
      allDone: 'तपाईंले संसारका १० सबैभन्दा अग्ला हिमाल चढ्नुभयो!', tradition: 'परम्पराअनुसार चुचुरोभन्दा अलि तल',
    },
  };
  let lang = store.get('hc_lang', 'en') === 'ne' ? 'ne' : 'en';
  const t = (k) => TEXT[lang][k];
  const DEV = '०१२३४५६७८९';
  const digits = (s) => (lang === 'ne' ? String(s).replace(/\d/g, (d) => DEV[d]) : String(s));
  const fmtNum = (n) => digits(Math.round(n).toLocaleString('en-US'));
  const fmtAlt = (m) => `${fmtNum(m)} ${t('m')}`;
  const fmtTime = (s) => digits(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`);
  const campName = (i) => CAMPS[i][lang];
  const fmtBest = () => (best ? fmtAlt(best) + (bestTime ? ` · ${fmtTime(bestTime)}` : '') : '–');

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    renderPicker();
  }

  // ---------- Layout ----------
  let W = 0, H = 0, DPR = 1, U = 1, wallW = 0, wallX = 0, colW = 0, rowH = 0, playerY = 0;
  let peaksLayer = null, stars = [], clouds = [], snow = [], wallFill = {};

  // ---------- State ----------
  let state = 'menu';
  // Progress: how many mountains are open, and the best height and fastest summit (seconds) on each.
  const prog = store.get('hc_prog', null) || {};
  prog.unlocked = clamp(prog.unlocked | 0, 0, MOUNTAINS.length - 1);
  if (!prog.rec || typeof prog.rec !== 'object') prog.rec = {};
  const allOpen = /[?&]all(&|=|$)/.test(location.search); // testing: ?all opens every mountain without saving it
  const isOpen = (i) => allOpen || i <= prog.unlocked;
  let best = 0, bestTime = 0;
  function useRecord() { const r = prog.rec[MT.id] || {}; best = r.alt | 0; bestTime = +r.time || 0; }
  function saveRecord() { prog.rec[MT.id] = { alt: best, time: bestTime }; store.set('hc_prog', prog); }
  let time = 0, shake = 0, paused = false, isDemo = true, demoT = 0, retryLock = 0, newBest = false;
  let rows = [], nextTeaRow = 15, crevLeft = 0, crevCol = 1;
  let pr = 0, pc = 1, fromC = 1, fromR = 0, animT = 1, camRow = 0, armUp = 0;
  let energy = 100, o2 = 0, stunT = 0, invulnT = 0, maxRow = 0, campReached = -1, runTime = 0, won = 0;
  let falling = false, fall = null, rocks = [], rockT = 0, musicT = 0, breathT = 0;
  let particles = [], popups = [], banner = null, toast = null, toasts = [], lastSection = null, noO2Told = false;
  const pressT = [0, 0, 0];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    U = Math.min(W, H) / 100;
    wallW = Math.min(W * 0.94, H * 0.62, 560);
    wallX = (W - wallW) / 2;
    colW = wallW / 3;
    rowH = colW * 0.6;
    playerY = H * 0.68;
    buildPeaks();
    wallFill = {};
    for (const [k, v] of Object.entries(TERRAIN)) {
      const g = ctx.createLinearGradient(wallX, 0, wallX + wallW, 0);
      g.addColorStop(0, v.wall[0]); g.addColorStop(0.5, v.wall[1]); g.addColorStop(1, v.wall[0]);
      wallFill[k] = g;
    }
    stars = Array.from({ length: 90 }, () => ({ x: rand(0, W), y: rand(0, H * 0.7), s: rand(0.6, 1.8), p: rand(0, TAU) }));
    clouds = Array.from({ length: 6 }, () => ({ x: rand(0, W), y0: rand(0, H + 300), s: rand(U * 6, U * 12), sp: rand(4, 12) }));
    snow = Array.from({ length: 150 }, () => ({ x: rand(0, W), y: rand(0, H), s: rand(1, 3), v: rand(30, 80), p: rand(0, TAU) }));
  }

  function buildPeaks() {
    const c = document.createElement('canvas');
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    const x = c.getContext('2d');
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    const rnd = mulberry32(11 + LV * 7); // each mountain has its own skyline
    const ridge = (baseY, amp, stops) => {
      let ys = [baseY - rnd() * amp, baseY - rnd() * amp], disp = amp * 0.75;
      for (let it = 0; it < 7; it++) {
        const next = [];
        for (let i = 0; i < ys.length - 1; i++) next.push(ys[i], (ys[i] + ys[i + 1]) / 2 + (rnd() - 0.5) * disp * 2);
        next.push(ys[ys.length - 1]); ys = next; disp *= 0.55;
      }
      x.beginPath(); x.moveTo(0, H);
      ys.forEach((y, i) => x.lineTo((i / (ys.length - 1)) * W, y));
      x.lineTo(W, H); x.closePath();
      const g = x.createLinearGradient(0, Math.min(...ys), 0, baseY + amp * 0.5);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      x.fillStyle = g; x.fill();
    };
    ridge(H * 0.5, H * 0.28, [[0, '#ffffff'], [0.35, '#dfe9f4'], [0.7, '#9fb4cb'], [1, '#7f96b0']]);
    ridge(H * 0.72, H * 0.16, [[0, '#f4f8fc'], [0.5, '#b8c8d9'], [1, '#8aa0b8']]);
    peaksLayer = c;
  }

  const colX = (c) => wallX + colW * (c + 0.5);
  const rowY = (i) => playerY - (i - camRow) * rowH;
  const dispCol = () => lerp(fromC, pc, easeOut(animT));
  const dispRow = () => lerp(fromR, pr, easeOut(animT));
  const altT = () => clamp(camRow / SUMMIT_ROW, 0, 1);
  const camAlt = () => rowAlt(camRow);
  const diffAt = (row) => MT.dmax * Math.min(1, row / (MT.rows * 0.9)); // holds get sparser as you climb
  const difficulty = () => diffAt(maxRow);
  const rowAtY = (y) => camRow + (playerY - y) / rowH;
  // The fixed rope Sherpas string up the route, from Base Camp to the top.
  const ropeX = (r) => wallX + wallW * (0.5 + 0.36 * Math.sin(r * 0.085) + 0.06 * Math.sin(r * 0.31));
  function skyAt(alt) {
    let k = 0;
    while (k < SKY.length - 2 && alt > SKY[k + 1][0]) k++;
    const a = SKY[k], b = SKY[k + 1], f = clamp((alt - a[0]) / (b[0] - a[0]), 0, 1);
    return { top: mix(a[1], b[1], f), mid: mix(a[2], b[2], f), bot: mix(a[3], b[3], f), night: lerp(a[4], b[4], f), dawn: lerp(a[5], b[5], f) };
  }

  // ---------- Audio (generated: wind, singing bowl, bansuri, effects) ----------
  const audio = {
    ac: null, master: null, noiseBuf: null, wind: null, windF: null,
    muted: !!store.get('hc_muted', false),
    init() {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ac = (this.ac = new AC());
        this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(ac.destination);
        const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        this.windF = ac.createBiquadFilter(); this.windF.type = 'lowpass'; this.windF.frequency.value = 400;
        this.wind = ac.createGain(); this.wind.gain.value = 0;
        src.connect(this.windF).connect(this.wind).connect(this.master); src.start();
      }
      if (this.ac.state === 'suspended') this.ac.resume();
    },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
    setWind(level) {
      if (!this.ac) return;
      const now = this.ac.currentTime;
      this.wind.gain.setTargetAtTime(level, now, 0.6);
      this.windF.frequency.setTargetAtTime(300 + 900 * level * 10 + Math.sin(time * 0.6) * 120, now, 0.6);
    },
    noise(tm, dur, type, f0, vol, f1 = 0, attack = 0) {
      const ac = this.ac, s = ac.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, tm);
      if (f1) f.frequency.exponentialRampToValueAtTime(f1, tm + dur);
      const g = ac.createGain();
      if (attack) { g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + attack); } else g.gain.setValueAtTime(vol, tm);
      g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      s.connect(f).connect(g).connect(this.master); s.start(tm, Math.random()); s.stop(tm + dur + 0.02);
    },
    tone(tm, freq, dur, type, vol, toFreq) {
      const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, tm);
      if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, tm + dur);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); o.stop(tm + dur + 0.02);
    },
    flute(tm, freq, dur, vol = 0.06) {
      const ac = this.ac, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, tm);
      lfo.frequency.value = 5; lg.gain.value = freq * 0.012; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.06);
      g.gain.setValueAtTime(vol, tm + Math.max(0.07, dur - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master);
      o.start(tm); lfo.start(tm); o.stop(tm + dur + 0.02); lfo.stop(tm + dur + 0.02);
    },
    bowl(tm, f = 196, vol = 0.12) { // singing bowl: inharmonic partials with slow beating
      [[1, 1, 3.2], [2.76, 0.45, 2.2], [5.4, 0.2, 1.3]].forEach(([p, a, dec]) => {
        for (const detune of [1, 1.004]) {
          const o = this.ac.createOscillator(), g = this.ac.createGain();
          o.type = 'sine'; o.frequency.value = f * p * detune;
          g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol * a * 0.5, tm + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, tm + dec);
          o.connect(g).connect(this.master); o.start(tm); o.stop(tm + dec + 0.05);
        }
      });
    },
    phrase(tm, slow = 0.32, rising = false) { // original folk-style line, D major pentatonic
      if (!this.ac) return;
      const SC = [440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66];
      let i = rising ? 2 : 3 + ((Math.random() * 2) | 0);
      const n = rising ? 6 : 4 + ((Math.random() * 3) | 0);
      for (let k = 0; k < n; k++) {
        if (!rising && k === n - 1) i = Math.random() < 0.5 ? 2 : 5;
        const d = (k === n - 1 ? 2.5 : Math.random() < 0.3 ? 1.5 : 1) * slow;
        this.flute(tm, SC[i], d * 0.95, 0.045);
        tm += d;
        i = rising ? Math.min(SC.length - 1, i + 1) : clamp(i + [-2, -1, 1, 1, 2][(Math.random() * 5) | 0], 0, SC.length - 1);
      }
    },
    now() { return this.ac ? this.ac.currentTime : 0; },
    step(alt) { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.04, 'highpass', 2600, 0.16); this.tone(tm, alt ? 820 : 700, 0.045, 'triangle', 0.05); },
    slip() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.32, 'bandpass', 1400, 0.22, 300); this.tone(tm, 300, 0.25, 'sine', 0.06, 160); },
    warn() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.7, 'lowpass', 220, 0.3, 0, 0.12); this.tone(tm, 70, 0.6, 'sine', 0.1, 50); },
    hit() { if (!this.ac) return; const tm = this.now(); this.tone(tm, 150, 0.35, 'sine', 0.3, 45); this.noise(tm, 0.3, 'lowpass', 800, 0.3); },
    tea() { if (!this.ac) return; const tm = this.now(); this.flute(tm, 880, 0.12, 0.06); this.flute(tm + 0.09, 1174.66, 0.18, 0.06); },
    o2() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.5, 'highpass', 3500, 0.12, 0, 0.03); this.tone(tm, 660, 0.12, 'triangle', 0.05); this.tone(tm + 0.1, 990, 0.18, 'triangle', 0.05); },
    breath(mask) { // slow inhale/exhale; through a mask it hisses
      if (!this.ac) return; const tm = this.now();
      this.noise(tm, 0.7, 'bandpass', 520, 0.07, 900, 0.3);
      this.noise(tm + 0.75, 0.8, 'bandpass', 700, 0.06, 380, 0.15);
      if (mask) this.noise(tm, 0.5, 'highpass', 4200, 0.025, 0, 0.2);
    },
    camp() { if (!this.ac) return; const tm = this.now(); this.bowl(tm, 196, 0.14); this.phrase(tm + 0.3, 0.2, true); },
    summit() { if (!this.ac) return; const tm = this.now(); this.bowl(tm, 147, 0.16); this.bowl(tm + 0.8, 196, 0.12); this.phrase(tm + 0.2, 0.22, true); this.phrase(tm + 1.7, 0.3); },
    fall() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 1.2, 'bandpass', 1800, 0.2, 200); [880, 739.99, 587.33, 493.88, 440].forEach((f, i) => this.flute(tm + 0.3 + i * 0.2, f, 0.24, 0.05)); },
  };
  function setMuteUI() { ui.mute.classList.toggle('muted', audio.muted); ui.mute.setAttribute('aria-pressed', String(audio.muted)); }
  function toggleMute() { audio.setMuted(!audio.muted); store.set('hc_muted', audio.muted); setMuteUI(); }

  // ---------- The wall ----------
  const ledgeRow = (camp, mark) => ({ cells: ['hold', 'hold', 'hold'], ledge: true, camp, mark, tea: -1 });
  const nearLedge = (i) => { for (let k = -1; k <= 4; k++) if (CAMP_AT.has(i + k) || MARK_AT.has(i + k)) return true; return false; };
  function genRow(i) {
    if (i > SUMMIT_ROW) return { cells: ['none', 'none', 'none'], ledge: false, camp: -1, mark: -1, tea: -1, sky: true };
    if (CAMP_AT.has(i)) return ledgeRow(CAMP_AT.get(i), -1);
    if (MARK_AT.has(i)) return ledgeRow(-1, MARK_AT.get(i));
    if (i === 0) return ledgeRow(-1, -1);
    if (i < 4) return { cells: ['hold', 'hold', 'hold'], ledge: false, camp: -1, mark: -1, tea: -1 };
    const crevRow = (edge) => { const cells = ['none', 'none', 'none']; cells[crevCol] = 'ladder'; return { cells, ledge: false, camp: -1, mark: -1, tea: -1, crev: edge }; };
    if (crevLeft > 0) { crevLeft--; return crevRow(crevLeft === 0 ? 'top' : 'mid'); }
    const sec = sectionAt(rowAlt(i));
    // Crevasses in the Icefall and the Western Cwm: one aluminium ladder is the only way across.
    if (sec.crev && !nearLedge(i) && rowAlt(i) > sec.m + 15 && Math.random() < sec.crev) {
      crevCol = (Math.random() * 3) | 0; crevLeft = 1 + ((Math.random() * 2) | 0);
      return crevRow('bottom');
    }
    const d = diffAt(i);
    const n = Math.random() < lerp(0.7, 0.3, d) ? 2 : 1;
    const order = [0, 1, 2].sort(() => Math.random() - 0.5);
    const cells = ['none', 'none', 'none'];
    order.slice(0, n).forEach((c) => { cells[c] = 'hold'; });
    if (i > 30) for (let c = 0; c < 3; c++) if (cells[c] === 'none' && Math.random() < lerp(0.15, 0.55, d)) cells[c] = 'loose';
    let tea = -1, kind = 'tea';
    if (i >= nextTeaRow) {
      tea = order[0];
      // Above Camp 3 the stashes hold oxygen bottles instead of tea.
      if (rowAlt(i) >= O2_ALT) { kind = 'o2'; nextTeaRow = i + 22 + ((Math.random() * 10) | 0); }
      else nextTeaRow = i + 16 + ((Math.random() * 10) | 0) + Math.floor(d * 8);
    }
    return { cells, ledge: false, camp: -1, mark: -1, tea, kind };
  }
  function ensureRows() { while (rows.length < pr + 18) rows.push(genRow(rows.length)); }

  function newRun(demo) {
    isDemo = demo;
    rows = []; nextTeaRow = 15; crevLeft = 0;
    pr = 0; pc = 1; fromC = 1; fromR = 0; animT = 1; camRow = 0; armUp = 0;
    energy = 100; o2 = 0; stunT = 0; invulnT = 0; maxRow = 0; campReached = -1; runTime = 0; won = 0;
    falling = false; fall = null; rocks = []; rockT = 4; musicT = rand(4, 8); breathT = 0;
    particles = []; popups = []; banner = null; toast = null; toasts = []; paused = false; newBest = false; demoT = 0;
    lastSection = SECTIONS[0]; noO2Told = false;
    ensureRows();
  }

  // ---------- Effects ----------
  function burst(x, y, colors, n, power, grav = 1) {
    if (reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = power * (0.3 + Math.random() * 0.7);
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.3, life: 0, max: 0.5 + Math.random() * 0.6, color: pick(colors), size: 2 + Math.random() * 3, grav });
    }
  }
  function popup(x, y, text, color, scale = 1) { popups.push({ x, y, text, color, scale, life: 0, max: 1 }); }

  // ---------- Actions ----------
  const solid = (row, c) => row.ledge || row.cells[c] === 'hold' || row.cells[c] === 'ladder';

  function step(col) {
    const next = rows[pr + 1];
    pressT[col] = 0.15;
    if (!solid(next, col)) { slip(col); return; }
    fromC = dispCol(); fromR = dispRow();
    pc = col; pr++; animT = 0; armUp ^= 1;
    ensureRows();
    if (isDemo) return;
    const alt = rowAlt(pr);
    if (alt < DEATH_ALT) energy = Math.min(100, energy + 0.6); // above 8,000 m the body cannot recover
    if (pr > maxRow) maxRow = pr;
    audio.step(armUp);
    const ice = TERRAIN[terrainOf(pr)].ice;
    burst(colX(col), rowY(pr), ice ? ['#ffffff', '#cfe6fa'] : ['#b8a28c', '#ffffff'], 3, U * 8);
    if (next.tea === col) {
      next.tea = -1;
      if (next.kind === 'o2') {
        o2 = Math.min(100, o2 + 60); noO2Told = false; energy = Math.min(100, energy + 15);
        popup(colX(col), rowY(pr) - rowH * 0.6, '+O₂ +15', '#8fd3ff');
        burst(colX(col), rowY(pr), ['#f39a1e', '#ffffff', '#8fd3ff'], 12, U * 18);
        audio.o2();
      } else {
        energy = Math.min(100, energy + 30);
        popup(colX(col), rowY(pr) - rowH * 0.6, '+30', '#7CFFB2');
        burst(colX(col), rowY(pr), ['#f5c518', '#ffffff'], 12, U * 18);
        audio.tea();
      }
    }
    if (next.camp > campReached) reachCamp(next.camp);
    if (next.mark >= 0 && !next.markDone) reachMark(next);
    const sec = sectionAt(alt);
    if (sec.m > lastSection.m) {
      lastSection = sec;
      if (!CAMP_AT.has(pr)) toasts.push({ text: sec[lang], sub: fmtAlt(sec.m), color: '#ffffff' });
    }
    if (pr === DEATH_ROW && !next.deathTold) {
      next.deathTold = true;
      toasts.unshift({ text: `${t('death')} · ${fmtAlt(DEATH_ALT)}`, sub: t('deathSub'), color: '#ff9a8a' });
      audio.warn(); vibrate([60, 40, 60]);
    }
  }

  function reachMark(row) {
    row.markDone = true;
    const m = MARKS[row.mark];
    if (m.note === 'swap') { o2 = 100; noO2Told = false; energy = Math.min(100, energy + 25); audio.o2(); }
    banner = { title: m[lang], sub: `${fmtAlt(m.m)} · ${t(m.note)}`, t: 2.2, max: 2.2, big: false };
    burst(W / 2, rowY(pr) - rowH, FLAG, 16, U * 30);
    audio.camp(); vibrate(40);
  }

  function slip(col) {
    const row = rows[pr + 1], x = colX(col), y = rowY(pr + 1);
    energy -= 6; stunT = 0.3; shake = reduceMotion ? 0 : 5;
    popup(x, y - rowH * 0.4, t('slip'), '#ffb38a', 0.8);
    burst(x, y, ['#8a7b70', '#5d534c', '#d8c7b4'], 10, U * 14);
    if (row.cells[col] === 'loose') { row.cells[col] = 'none'; burst(x, y, ['#ff7a3d', '#8a7b70'], 8, U * 10); }
    audio.slip(); vibrate(40);
    if (energy <= 0) startFall();
  }

  function reachCamp(i) {
    campReached = i;
    energy = Math.min(100, energy + 40);
    const c = CAMPS[i], summit = i === SUMMIT;
    if (c.m >= O2_ALT && !summit) { o2 = 100; noO2Told = false; } // a full bottle at Camps 3 and 4
    banner = { title: summit ? `${campName(i)}!` : campName(i), sub: summit ? `${fmtAlt(c.m)} · ${MT.tradition ? t('tradition') : t('summitSub')}` : `${fmtAlt(c.m)} · ${c.notes.length ? c.notes.map(t).join(' · ') : t('refill')}`, t: summit ? 3.5 : 2.4, max: summit ? 3.5 : 2.4, big: summit };
    const y = rowY(pr);
    for (let k = 0; k < (summit ? 3 : 1); k++) burst(W / 2 + rand(-wallW / 3, wallW / 3), y - rowH, FLAG, 26, U * 40);
    if (summit) audio.summit(); else audio.camp();
    vibrate(summit ? [80, 60, 80, 60, 200] : 60);
    if (summit) { // the top: there is nowhere higher to go
      won = 3.4; rocks = [];
      if (c.m > best) { best = c.m; newBest = true; }
      if (!bestTime || runTime < bestTime) { bestTime = runTime; newBest = true; }
      prog.unlocked = Math.max(prog.unlocked, Math.min(LV + 1, MOUNTAINS.length - 1)); // the next mountain opens
      saveRecord();
    }
  }

  function rockHit() {
    energy -= 20;
    popup(colX(pc), rowY(pr) - rowH * 0.6, '-20', '#ff8a8a');
    burst(colX(pc), rowY(pr), ['#6d6f78', '#a3a6ae', '#ffffff'], 18, U * 30);
    fromC = dispCol(); fromR = dispRow();
    pr = Math.max(0, pr - 2); animT = 0;
    stunT = 0.55; invulnT = 1.3; shake = reduceMotion ? 0 : 12;
    audio.hit(); vibrate(110);
    if (energy <= 0) startFall();
  }

  function startFall() {
    energy = 0;
    if (falling) return;
    falling = true;
    rocks = []; // no leftover warnings behind the game-over card
    // Clipped to the fixed rope, an exhausted climber slumps and slides down it.
    fall = { x: colX(dispCol()), y: rowY(dispRow()), vx: 0, vy: 0, rot: 0, t: 0 };
    shake = reduceMotion ? 0 : 10;
    audio.fall(); vibrate([80, 50, 150]);
    const reached = altOf(maxRow);
    if (reached > best) { best = reached; saveRecord(); newBest = true; }
  }

  // Ice (serac blocks) falls in icy sections, rock in rocky ones.
  function spawnRock(col, warn) {
    rocks.push({ col, phase: 'warn', t: warn, max: warn, y: -colW, rot: rand(0, TAU), hit: false, ice: TERRAIN[terrainOf(pr + 6)].ice });
  }

  // Fairness: whenever ice or rock is coming, the next rows always offer a hold in a safe column.
  function ensureEscape(danger) {
    const safe = [0, 1, 2].filter((c) => !danger.includes(c));
    for (let k = 1; k <= 8; k++) { // covers the warning + fall time even for fast climbers
      const row = rows[pr + k];
      if (!row || row.ledge || row.sky || safe.some((c) => row.cells[c] === 'hold')) continue;
      row.cells[pick(safe)] = 'hold';
    }
  }

  function updateRocks(dt) {
    const d = difficulty();
    rockT -= dt;
    // Nothing falls while a ladder crossing is close: a ladder is the only way over a crevasse.
    let ladderNear = false;
    for (let k = 0; k <= 8; k++) if (rows[pr + k] && rows[pr + k].crev) ladderNear = true;
    if (rockT <= 0 && maxRow > 10 && !ladderNear && pr < SUMMIT_ROW - 3) {
      const warn = lerp(1.25, 0.7, d);
      const aim = Math.random() < 0.7 ? pc : (Math.random() * 3) | 0;
      spawnRock(aim, warn);
      const danger = [aim];
      if (d > 0.35 && Math.random() < 0.35 * d) { // a second rock, never all three columns
        let other = (Math.random() * 3) | 0;
        if (other === aim) other = (aim + 1 + ((Math.random() * 2) | 0)) % 3;
        spawnRock(other, warn + 0.2);
        danger.push(other);
      }
      ensureEscape(danger);
      rockT = (rand(2.6, 5) * (1 - 0.45 * d)) / (sectionAt(rowAlt(pr)).haz * MT.haz);
      audio.warn();
    }
    const py = rowY(dispRow()), col = Math.round(dispCol()), win = rowH * 0.45;
    for (const r of rocks) {
      if (r.phase === 'warn') { r.t -= dt; if (r.t <= 0) { r.phase = 'fall'; r.y = -colW * 0.3; } continue; }
      const prevY = r.y;
      r.y += H * 2.1 * dt; r.rot += dt * 9;
      if (!r.hit && !falling && invulnT <= 0 && r.col === col && prevY < py + win && r.y > py - win) { r.hit = true; rockHit(); }
      if (Math.random() < dt * 30) particles.push({ x: colX(r.col) + rand(-colW * 0.15, colW * 0.15), y: r.y - colW * 0.2, vx: rand(-20, 20), vy: -rand(20, 60), life: 0, max: 0.4, color: '#c9ccd3', size: 2, grav: 0.5 });
    }
    rocks = rocks.filter((r) => r.phase === 'warn' || r.y < H + colW);
  }

  // ---------- Update ----------
  function update(dt) {
    time += dt;
    shake = Math.max(0, shake - dt * 25);
    for (let c = 0; c < 3; c++) pressT[c] = Math.max(0, pressT[c] - dt);
    for (const p of particles) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy += U * 60 * p.grav * dt; }
    particles = particles.filter((p) => p.life < p.max);
    for (const p of popups) { p.life += dt; p.y -= U * 7 * dt; }
    popups = popups.filter((p) => p.life < p.max);
    const at = altT(), windX = -20 - 60 * at - (camAlt() > DEATH_ALT ? 120 : 0); // jet-stream wind on the ridge
    const flakes = Math.floor(30 + 120 * at);
    for (let i = 0; i < flakes; i++) {
      const f = snow[i];
      f.y += f.v * dt * (0.6 + U / 10); f.x += (Math.sin(time * 0.8 + f.p) * 15 + windX) * dt;
      if (f.y > H + 5) { f.y = -5; f.x = rand(0, W); }
      if (f.x < -5) f.x = W + 5;
      if (f.x > W + 5) f.x = -5;
    }
    audio.setWind(paused ? 0 : 0.012 + 0.05 * at + (camAlt() > DEATH_ALT ? 0.03 : 0));
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    if (toast) { toast.t -= dt; if (toast.t <= 0) toast = null; }
    if (!toast && !banner && toasts.length && !isDemo) toast = { ...toasts.shift(), t: 2.2, max: 2.2 };
    if (paused) return;

    animT = Math.min(1, animT + dt / 0.11);
    camRow += (dispRow() - camRow) * Math.min(1, dt * 10);

    if (isDemo) { // menu attract: the climber goes up by itself
      demoT += dt;
      if (demoT > 0.45 && animT >= 1) {
        demoT = 0;
        const next = rows[pr + 1];
        step(pick([0, 1, 2].filter((c) => solid(next, c))));
      }
      if (pr > 45) newRun(true);
      return;
    }

    if (falling) {
      fall.t += dt; fall.vy += U * 45 * dt; fall.y += fall.vy * dt; fall.rot = Math.min(0.45, fall.rot + dt * 0.8);
      if (state === 'play' && fall.t > 1.8) showOver();
      return;
    }
    if (state !== 'play') return;
    if (won > 0) { won -= dt; if (won <= 0) showOver(); return; }

    runTime += dt; stunT -= dt; invulnT -= dt;
    // Thinner air drains you faster. Above Camp 3, bottled oxygen eases it while it lasts.
    const alt = rowAlt(pr);
    let drain = 1.6 + 6 * clamp((alt - START_ALT) / 3500, 0, 1);
    if (alt >= O2_ALT) {
      if (o2 > 0) {
        drain *= 0.5;
        o2 = Math.max(0, o2 - 2.2 * dt);
        if (o2 === 0 && !noO2Told) { noO2Told = true; popup(colX(pc), rowY(pr) - rowH, t('noO2'), '#8fd3ff', 0.8); }
      } else drain *= 1.1;
    }
    energy -= drain * MT.drain * dt;
    if (energy <= 0) { startFall(); return; }
    if (alt >= CAMPS[SUMMIT - 1].m) { // heavy breathing on summit day
      breathT -= dt;
      if (breathT <= 0) { audio.breath(o2 > 0); breathT = o2 > 0 ? 2.2 : 1.6; }
    }
    updateRocks(dt);
    musicT -= dt;
    if (musicT <= 0) { audio.phrase(audio.now()); musicT = rand(10, 16); }
  }

  // ---------- Render ----------
  function drawSky() {
    const a = altT(), sky = skyAt(camAlt());
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sky.top); g.addColorStop(0.6, sky.mid); g.addColorStop(1, sky.bot);
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.drawImage(peaksLayer, 0, H * 0.6 * (1 - Math.exp(-camRow / 250)), W, H);
    if (sky.night > 0) { ctx.fillStyle = `rgba(7,11,36,${0.6 * sky.night})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
    if (sky.dawn > 0) { // sunrise glow along the horizon, below you
      const dg = ctx.createLinearGradient(0, H * 0.45, 0, H);
      dg.addColorStop(0, 'rgba(255,150,90,0)'); dg.addColorStop(1, `rgba(255,150,90,${0.55 * sky.dawn})`);
      ctx.fillStyle = dg; ctx.fillRect(-20, H * 0.45, W + 40, H * 0.55 + 20);
    }
    if (sky.night > 0.02) {
      ctx.fillStyle = '#ffffff';
      for (const s of stars) {
        ctx.globalAlpha = sky.night * (0.4 + 0.6 * Math.sin(time * 1.5 + s.p) ** 2);
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(255,255,255,${(0.8 - 0.35 * a) * (1 - 0.7 * sky.night)})`;
    for (const c of clouds) {
      const y = ((c.y0 + camRow * rowH * 0.3) % (H + 300)) - 150;
      const x = ((c.x + time * c.sp) % (W + c.s * 6)) - c.s * 3;
      ctx.beginPath();
      ctx.arc(x, y, c.s, 0, TAU); ctx.arc(x + c.s, y + c.s * 0.2, c.s * 0.8, 0, TAU);
      ctx.arc(x - c.s, y + c.s * 0.25, c.s * 0.7, 0, TAU); ctx.arc(x + c.s * 0.3, y - c.s * 0.45, c.s * 0.7, 0, TAU);
      ctx.fill();
    }
  }

  const visibleRows = () => [Math.floor(camRow - (H - playerY) / rowH) - 2, Math.ceil(camRow + playerY / rowH) + 2];
  const edgeL = (i) => wallX - colW * 0.06 + (hash(i, 1) - 0.5) * colW * 0.22;
  const edgeR = (i) => wallX + wallW + colW * 0.06 + (hash(i, 2) - 0.5) * colW * 0.22;

  function drawCrevasse(y, edge) { // a deep blue gap across the glacier
    const top = y - rowH / 2, h = rowH + 1;
    ctx.fillStyle = '#0c2442'; ctx.fillRect(wallX - colW, top, wallW + colW * 2, h);
    if (edge !== 'mid') {
      const atTop = edge === 'top', g = ctx.createLinearGradient(0, atTop ? top : top + h, 0, y);
      g.addColorStop(0, '#3f78a8'); g.addColorStop(1, 'rgba(12,36,66,0)');
      ctx.fillStyle = g; ctx.fillRect(wallX - colW, top, wallW + colW * 2, h);
      ctx.fillStyle = '#eef7fd'; // overhanging snow lip
      for (let k = 0; k < 7; k++) oval(wallX + ((k + 0.5) * wallW) / 7, atTop ? top + rowH * 0.04 : top + h - rowH * 0.04, wallW / 11, rowH * 0.11);
    }
  }

  function drawRope(i0, i1) { // the fixed line, anchored every few metres
    const a = Math.max(i0, ROPE_ROW);
    if (a > i1) return;
    const trace = () => { ctx.beginPath(); for (let r = a; r <= i1; r += 0.5) ctx.lineTo(ropeX(r), rowY(r)); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    trace(); ctx.strokeStyle = 'rgba(20,15,30,0.45)'; ctx.lineWidth = Math.max(3, U * 0.7); ctx.stroke();
    trace(); ctx.strokeStyle = '#f5c518'; ctx.lineWidth = Math.max(1.5, U * 0.35); ctx.stroke();
    for (let r = Math.ceil(a / 8) * 8; r <= i1; r += 8) {
      if (rows[r] && rows[r].crev) continue;
      ctx.fillStyle = '#2a2a33'; dot(ropeX(r), rowY(r), Math.max(3, U * 0.8));
      ctx.fillStyle = '#b9c2cc'; dot(ropeX(r), rowY(r), Math.max(2, U * 0.5));
    }
  }

  function drawLadder(x, y, edge) { // aluminium ladder lashed across a crevasse
    const half = colW * 0.17, top = y - rowH / 2 - (edge === 'top' ? rowH * 0.2 : 0), bot = y + rowH / 2 + (edge === 'bottom' ? rowH * 0.2 : 0);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3d4654'; ctx.lineWidth = Math.max(3, colW * 0.05);
    line(x - half, top, x - half, bot); line(x + half, top, x + half, bot);
    for (let k = 0; k < 3; k++) { const ry = top + ((k + 0.5) * (bot - top)) / 3; line(x - half, ry, x + half, ry); }
    ctx.strokeStyle = '#d9e1ea'; ctx.lineWidth = Math.max(1.5, colW * 0.028);
    line(x - half, top, x - half, bot); line(x + half, top, x + half, bot);
    for (let k = 0; k < 3; k++) { const ry = top + ((k + 0.5) * (bot - top)) / 3; line(x - half, ry, x + half, ry); }
  }

  function drawO2(x, y) { // an orange oxygen cylinder stashed on the route
    const s = colW * 0.13, cx = x + colW * 0.2, cy = y - colW * 0.1;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 2.6);
    g.addColorStop(0, 'rgba(143,211,255,0.6)'); g.addColorStop(1, 'rgba(143,211,255,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - s * 2.6, cy - s * 2.6, s * 5.2, s * 5.2);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.35);
    ctx.fillStyle = '#2a1a14'; rr(ctx, -s * 0.42, -s * 0.95, s * 0.84, s * 1.9, s * 0.4); ctx.fill();
    ctx.fillStyle = '#f2711c'; rr(ctx, -s * 0.34, -s * 0.85, s * 0.68, s * 1.72, s * 0.32); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-s * 0.2, -s * 0.6, s * 0.12, s * 1.2);
    ctx.fillStyle = '#b9c2cc'; ctx.fillRect(-s * 0.16, -s * 1.2, s * 0.32, s * 0.32);
    ctx.restore();
  }

  function drawWall() {
    const [i0, iTop] = visibleRows(), i1 = Math.min(iTop, SUMMIT_ROW);
    const peak = iTop > SUMMIT_ROW; // the summit is in view: the mountain ends in a snowy point
    const peakY = rowY(SUMMIT_ROW) - rowH * 1.1;
    const outline = () => {
      ctx.beginPath();
      if (peak) ctx.moveTo(colX(1) + colW * 0.15, peakY); else ctx.moveTo(edgeL(i1), -60);
      for (let i = i1; i >= i0; i--) ctx.lineTo(edgeL(i), rowY(i) - rowH / 2);
      ctx.lineTo(edgeL(i0), H + 60); ctx.lineTo(edgeR(i0), H + 60);
      for (let i = i0; i <= i1; i++) ctx.lineTo(edgeR(i), rowY(i) - rowH / 2);
      if (!peak) ctx.lineTo(edgeR(i1), -60);
      ctx.closePath();
    };
    outline();
    ctx.save(); ctx.clip();
    // Bands of real ground: moraine, icefall, snow, blue ice, the Yellow Band, dark rock.
    for (let i = i0; i <= i1; i++) {
      const y = rowY(i), top = i === i1 ? Math.min(-60, peakY) : y - rowH / 2, bot = i === i0 ? H + 60 : y + rowH / 2;
      ctx.fillStyle = wallFill[terrainOf(Math.max(0, i))];
      ctx.fillRect(wallX - colW, top, wallW + colW * 2, bot - top + 1);
    }
    const a = altT();
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const y = rowY(i), tk = terrainOf(i), tr = TERRAIN[tk], row = rows[i];
      if (row && row.crev) { drawCrevasse(y, row.crev); continue; }
      ctx.strokeStyle = tr.crack; ctx.lineWidth = Math.max(1, U * 0.3);
      const cx = wallX + hash(i, 3) * wallW;
      if (tk === 'ice' || tk === 'blueice') { // serac blocks: straight fractures and glassy streaks
        line(cx, y - rowH * 0.5, cx + (hash(i, 4) - 0.5) * colW * 0.15, y + rowH * 0.5);
        if (hash(i, 11) < 0.5) line(wallX + hash(i, 12) * wallW * 0.5, y + rowH * 0.5, wallX + (0.5 + hash(i, 13) * 0.5) * wallW, y + rowH * 0.5);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(2, U * 0.6);
        const sx = wallX + hash(i, 14) * wallW;
        line(sx, y - rowH * 0.3, sx + colW * 0.12, y + rowH * 0.1);
      } else if (tr.ice) { // wind-packed snow: soft ripples
        ctx.beginPath(); ctx.arc(cx, y + rowH * 0.6, colW * 0.35, -2.4, -0.7); ctx.stroke();
      } else { // rock: cracks, snow on ledges, grit
        line(cx, y - rowH * 0.5, cx + (hash(i, 4) - 0.5) * colW * 0.5, y + rowH * 0.15);
        if (hash(i, 5) < 0.3 + 0.45 * a) {
          ctx.fillStyle = 'rgba(245,250,255,0.85)';
          const sw = colW * (0.4 + hash(i, 7) * 0.6);
          oval(wallX + hash(i, 6) * (wallW - sw) + sw / 2, y + rowH * 0.42, sw / 2, rowH * 0.07);
        }
        ctx.fillStyle = tk === 'moraine' ? 'rgba(20,15,10,0.35)' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(wallX + hash(i, 8) * wallW, y - rowH * 0.2, 3, 3);
        ctx.fillRect(wallX + hash(i, 9) * wallW, y + rowH * 0.1, 2, 2);
        ctx.fillRect(wallX + hash(i, 10) * wallW, y + rowH * 0.3, 3, 2);
      }
    }
    if (peak) { // snow cornice on the very top
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(colX(1) + colW * 0.15, peakY);
      ctx.lineTo(edgeL(SUMMIT_ROW) + colW * 0.5, rowY(SUMMIT_ROW) - rowH * 0.5);
      ctx.lineTo(edgeR(SUMMIT_ROW) - colW * 0.3, rowY(SUMMIT_ROW) - rowH * 0.5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    outline();
    ctx.strokeStyle = 'rgba(20,22,30,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    drawRope(i0, i1);
    const groundY = rowY(0) + rowH * 0.35; // snowy ground below the start
    if (groundY < H) {
      const sg = ctx.createLinearGradient(0, groundY, 0, H);
      sg.addColorStop(0, '#f4f8fc'); sg.addColorStop(1, '#c4d4e6');
      ctx.fillStyle = sg; ctx.fillRect(-20, groundY, W + 40, H - groundY + 20);
    }
  }

  function drawHold(x, y, i, c, loose, ice) {
    const r = colW * 0.16 * (0.9 + 0.25 * hash(i, c + 10));
    ctx.save(); ctx.translate(x, y);
    if (ice && !loose) { // a step kicked into snow or ice: deep shadowed notch with a bright lip
      ctx.fillStyle = 'rgba(10,30,60,0.2)'; oval(0, r * 0.5, r * 1.25, r * 0.45);
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU, q = r * (0.85 + 0.25 * hash(i * 7 + c, k));
        ctx.lineTo(Math.cos(a) * q * 1.2, Math.sin(a) * q * 0.72);
      }
      ctx.closePath(); ctx.fillStyle = '#1d3a60'; ctx.fill();
      ctx.fillStyle = '#4d7fae'; oval(0, r * 0.18, r * 0.8, r * 0.3);
      ctx.fillStyle = '#ffffff'; oval(0, -r * 0.42, r * 1.05, r * 0.22);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, r * 0.08); // crampon scratches
      line(-r * 0.5, r * 0.65, -r * 0.4, r * 0.95); line(r * 0.1, r * 0.65, r * 0.15, r * 0.95); line(r * 0.55, r * 0.6, r * 0.6, r * 0.9);
      ctx.restore();
      return;
    }
    if (loose) ctx.rotate(Math.sin(time * 16 + i) * 0.05);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; oval(0, r * 0.45, r * 1.1, r * 0.55);
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU, q = r * (0.8 + 0.3 * hash(i * 7 + c, k));
      ctx.lineTo(Math.cos(a) * q * 1.15, Math.sin(a) * q * 0.8);
    }
    ctx.closePath();
    ctx.fillStyle = loose ? '#7d716b' : '#6b4a33'; ctx.fill();
    ctx.fillStyle = loose ? 'rgba(255,255,255,0.15)' : '#a57a52'; oval(-r * 0.15, -r * 0.25, r * 0.6, r * 0.28);
    if (loose) {
      ctx.strokeStyle = '#ff7a3d'; ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.1); ctx.lineTo(-r * 0.2, r * 0.18); ctx.lineTo(r * 0.1, -r * 0.22); ctx.lineTo(r * 0.65, r * 0.12); ctx.stroke();
    }
    ctx.restore();
  }

  function drawTea(x, y) {
    const s = colW * 0.13, cx = x + colW * 0.2, cy = y - colW * 0.12;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 2.6);
    g.addColorStop(0, 'rgba(255,220,90,0.6)'); g.addColorStop(1, 'rgba(255,220,90,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - s * 2.6, cy - s * 2.6, s * 5.2, s * 5.2);
    ctx.fillStyle = '#fff8ec'; rr(ctx, cx - s * 0.6, cy - s * 0.5, s * 1.2, s, s * 0.25); ctx.fill();
    ctx.fillStyle = '#dc143c'; ctx.fillRect(cx - s * 0.6, cy - s * 0.2, s * 1.2, s * 0.22);
    ctx.strokeStyle = '#fff8ec'; ctx.lineWidth = Math.max(1.5, s * 0.15);
    ctx.beginPath(); ctx.arc(cx + s * 0.65, cy, s * 0.25, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5;
    for (const o of [-0.25, 0.2]) {
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) ctx.lineTo(cx + o * s + Math.sin(time * 4 + k + o * 9) * s * 0.15, cy - s * 0.6 - k * s * 0.18);
      ctx.stroke();
    }
  }

  function drawNepalFlag(x, y, s) { // pole base at (x, y), the double-pennant flag of Nepal
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(2, s * 0.06);
    line(x, y, x, y - s * 2.1);
    const fx = x + 1, fy = y - s * 2.1;
    const P = [[0, 0], [1.0, 0.82], [0.4, 0.82], [1.0, 1.72], [0, 1.72]];
    ctx.beginPath(); P.forEach(([px, py], k) => (k ? ctx.lineTo : ctx.moveTo).call(ctx, fx + px * s, fy + py * s)); ctx.closePath();
    ctx.fillStyle = '#dc143c'; ctx.fill();
    ctx.strokeStyle = '#003893'; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.lineJoin = 'miter'; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(fx + s * 0.3, fy + s * 0.5, s * 0.13, 0, Math.PI); ctx.fill(); // moon
    ctx.fillStyle = '#dc143c'; ctx.beginPath(); ctx.arc(fx + s * 0.3, fy + s * 0.46, s * 0.11, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#ffffff'; dot(fx + s * 0.3, fy + s * 1.3, s * 0.11); // sun
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, s * 0.04);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; line(fx + s * 0.3 + Math.cos(a) * s * 0.12, fy + s * 1.3 + Math.sin(a) * s * 0.12, fx + s * 0.3 + Math.cos(a) * s * 0.19, fy + s * 1.3 + Math.sin(a) * s * 0.19); }
  }

  function drawPrayerFlags(x1, x2, y, sag) {
    ctx.strokeStyle = 'rgba(40,30,25,0.7)'; ctx.lineWidth = 1;
    const cx = (x1 + x2) / 2, cy = y + sag;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.quadraticCurveTo(cx, cy, x2, y); ctx.stroke();
    const n = Math.max(6, Math.round((x2 - x1) / (colW * 0.22)));
    const fw = Math.max(6, colW * 0.12), fh = Math.max(8, colW * 0.15);
    for (let k = 0; k < n; k++) {
      const s = (k + 0.5) / n, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
      ctx.save(); ctx.translate(a * x1 + b * cx + c * x2, a * y + b * cy + c * y);
      ctx.rotate(Math.sin(time * 3 + k * 0.7) * 0.25 - 0.15);
      ctx.fillStyle = FLAG[k % 5]; ctx.fillRect(-fw / 2, 0, fw, fh);
      ctx.restore();
    }
  }

  function drawLedge(i, y, row) {
    const x0 = wallX - colW * 0.08, w = wallW + colW * 0.16;
    if (row.mark >= 0) {
      const m = MARKS[row.mark];
      if (m.note === 'swap') for (let k = 0; k < 4; k++) drawO2(wallX + colW * (0.05 + k * 0.16), y + rowH * 0.05); // the oxygen stash
    }
    if (row.camp >= 0) {
      drawPrayerFlags(edgeL(i) - 4, edgeR(i) + 4, y - rowH * 0.52, rowH * 0.1); // kept below the next row of holds
      if (row.camp === SUMMIT) drawNepalFlag(colX(1) + colW * 0.25, y + rowH * 0.05, rowH * 0.55);
      else { // tent
        const tx = wallX + colW * 0.3, ty = y + rowH * 0.05, tw = colW * 0.45, th = rowH * 0.5;
        ctx.fillStyle = '#f39a1e'; ctx.beginPath(); ctx.moveTo(tx - tw / 2, ty); ctx.lineTo(tx, ty - th); ctx.lineTo(tx + tw / 2, ty); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7a3d0a'; ctx.beginPath(); ctx.moveTo(tx - tw * 0.12, ty); ctx.lineTo(tx, ty - th * 0.55); ctx.lineTo(tx + tw * 0.12, ty); ctx.closePath(); ctx.fill();
      }
    }
    ctx.fillStyle = '#41444e'; rr(ctx, x0, y, w, rowH * 0.3, rowH * 0.1); ctx.fill();
    ctx.fillStyle = '#f4f8fc'; rr(ctx, x0, y - rowH * 0.05, w, rowH * 0.12, rowH * 0.06); ctx.fill();
    const label = row.camp >= 0 ? `${campName(row.camp)} · ${fmtAlt(CAMPS[row.camp].m)}` : row.mark >= 0 ? `${MARKS[row.mark][lang]} · ${fmtAlt(MARKS[row.mark].m)}` : '';
    if (label) {
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      drawText(label, wallX + wallW - colW * 0.08, y + rowH * 0.5, Math.max(12, colW * 0.12), '#ffffff', 800);
      ctx.textAlign = 'center';
    }
  }

  function drawDeathLine() { // 8,000 m: where the death zone begins
    const y = rowY(DEATH_ROW) + rowH / 2;
    if (y < -20 || y > H + 20) return;
    ctx.save();
    ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(255,90,80,0.85)'; ctx.lineWidth = 2;
    line(wallX - colW * 0.1, y, wallX + wallW + colW * 0.1, y);
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    drawText(`${fmtAlt(DEATH_ALT)} · ${t('death')}`, wallX + colW * 0.05, y + rowH * 0.22, Math.max(11, colW * 0.1), '#ffb3a8', 800);
    ctx.textAlign = 'center';
  }

  function drawRows() {
    const [i0, i1] = visibleRows();
    if (state === 'play' && !falling && !isDemo) {
      const y = rowY(pr + 1);
      ctx.fillStyle = `rgba(255,255,255,${0.06 + 0.03 * Math.sin(time * 6)})`;
      ctx.fillRect(wallX, y - rowH * 0.45, wallW, rowH * 0.9);
    }
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const row = rows[i];
      if (!row || row.sky) continue;
      const y = rowY(i);
      if (row.ledge) { drawLedge(i, y, row); continue; }
      const ice = TERRAIN[terrainOf(i)].ice;
      for (let c = 0; c < 3; c++) {
        const cell = row.cells[c];
        if (cell === 'ladder') drawLadder(colX(c), y, row.crev);
        else if (cell !== 'none') drawHold(colX(c), y, i, c, cell === 'loose', ice);
      }
      if (row.tea >= 0) (row.kind === 'o2' ? drawO2 : drawTea)(colX(row.tea), y);
    }
    drawDeathLine();
  }

  function drawClimber(x, handY, s, rot = 0, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, handY); ctx.rotate(rot);
    ctx.lineCap = 'round';
    const up = armUp, reach = (1 - easeOut(animT)) * s * 0.25;
    const r = rowAtY(handY), alt = rowAlt(r), ice = TERRAIN[terrainOf(Math.max(0, Math.round(r)))].ice;
    if (r >= ROPE_ROW) { // short tether from the harness to the fixed rope, with a jumar on it
      const rx = (ropeX(r + 0.4) - x) / Math.cos(rot), ry = s * 0.4;
      ctx.strokeStyle = '#2d6fd1'; ctx.lineWidth = Math.max(1.5, s * 0.09);
      ctx.beginPath(); ctx.moveTo(0, s * 1.9); ctx.quadraticCurveTo(rx * 0.5, s * 1.9 + s * 0.4, rx, ry); ctx.stroke();
      ctx.fillStyle = '#1b1b1b'; rr(ctx, rx - s * 0.12, ry - s * 0.2, s * 0.24, s * 0.4, s * 0.08); ctx.fill();
    }
    const legs = (x0, x1, dy) => line(x0, s * 2.0, x1, s * 2.9 - dy);
    ctx.strokeStyle = '#a3121f'; ctx.lineWidth = s * 0.34; // down suit
    legs(-s * 0.25, -s * 0.5, up ? s * 0.3 : 0); legs(s * 0.25, s * 0.5, up ? 0 : s * 0.3);
    ctx.fillStyle = '#f2c94c'; // high-altitude boots
    rr(ctx, -s * 0.7, s * 2.8 - (up ? s * 0.3 : 0), s * 0.4, s * 0.28, s * 0.08); ctx.fill();
    rr(ctx, s * 0.3, s * 2.8 - (up ? 0 : s * 0.3), s * 0.4, s * 0.28, s * 0.08); ctx.fill();
    if (ice) { // crampon points
      ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = Math.max(1, s * 0.06);
      for (const [bx, dy] of [[-s * 0.5, up ? s * 0.3 : 0], [s * 0.5, up ? 0 : s * 0.3]]) {
        const by = s * 3.08 - dy;
        for (let k = -1; k <= 1; k++) line(bx + k * s * 0.13, by, bx + k * s * 0.13, by + s * 0.12);
      }
    }
    ctx.fillStyle = '#dc143c'; rr(ctx, -s * 0.58, s * 0.85, s * 1.16, s * 1.4, s * 0.34); ctx.fill();
    ctx.fillStyle = '#f39a1e'; rr(ctx, -s * 0.42, s * 0.95, s * 0.84, s * 1.0, s * 0.2); ctx.fill();
    ctx.fillStyle = '#c4700f'; ctx.fillRect(-s * 0.42, s * 1.3, s * 0.84, s * 0.12);
    const onO2 = o2 > 0 && alt >= O2_ALT && !isDemo;
    if (onO2) { // oxygen cylinder in the pack, hose over the shoulder to the mask
      ctx.fillStyle = '#2a1a14'; rr(ctx, s * 0.06, s * 0.62, s * 0.3, s * 1.0, s * 0.14); ctx.fill();
      ctx.fillStyle = '#f2711c'; rr(ctx, s * 0.1, s * 0.66, s * 0.22, s * 0.92, s * 0.1); ctx.fill();
      ctx.strokeStyle = '#3a3d48'; ctx.lineWidth = Math.max(1.5, s * 0.08);
      ctx.beginPath(); ctx.moveTo(s * 0.21, s * 0.66); ctx.quadraticCurveTo(s * 0.55, s * 0.55, s * 0.32, s * 0.82); ctx.stroke();
    }
    ctx.strokeStyle = '#dc143c'; ctx.lineWidth = s * 0.32;
    const cheer = won > 0 && !isDemo;
    const lh = cheer ? -s * 0.7 : up ? -reach : s * 0.45, rh = cheer ? -s * 0.7 : up ? s * 0.45 : -reach;
    line(-s * 0.45, s * 1.0, -s * (cheer ? 0.85 : 0.55), lh);
    line(s * 0.45, s * 1.0, s * (cheer ? 0.85 : 0.55), rh);
    ctx.fillStyle = '#1b1b1b'; dot(-s * (cheer ? 0.85 : 0.55), lh, s * 0.17); dot(s * (cheer ? 0.85 : 0.55), rh, s * 0.17);
    if (ice && !cheer) { // ice axe in the reaching hand
      const hx = up ? -s * 0.55 : s * 0.55, hy = up ? lh : rh;
      ctx.strokeStyle = '#3a3d48'; ctx.lineWidth = Math.max(1.5, s * 0.1);
      line(hx, hy + s * 0.35, hx, hy - s * 0.25);
      ctx.strokeStyle = '#c9d2dc'; line(hx - s * 0.22, hy - s * 0.25, hx + s * 0.18, hy - s * 0.18);
    }
    ctx.fillStyle = '#f5c518'; dot(0, s * 0.6, s * 0.38); // helmet
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = Math.max(1.5, s * 0.1); // goggle strap
    ctx.beginPath(); ctx.arc(0, s * 0.62, s * 0.38, 0.2, Math.PI - 0.2); ctx.stroke();
    if (skyAt(alt).night > 0.05) { // headlamp
      ctx.fillStyle = '#fffbe0'; dot(0, s * 0.3, s * 0.12);
    }
    ctx.restore();
  }

  function drawRocks() {
    for (const r of rocks) {
      const x = colX(r.col);
      if (r.phase === 'warn') {
        const k = 1 - r.t / r.max, pulse = 0.5 + 0.5 * Math.sin(time * 18);
        const g = ctx.createLinearGradient(0, 0, 0, playerY);
        g.addColorStop(0, `rgba(255,60,40,${0.25 + 0.15 * k})`); g.addColorStop(1, 'rgba(255,60,40,0)');
        ctx.fillStyle = g; ctx.fillRect(x - colW / 2, 0, colW, playerY);
        const ty = Math.max(H * 0.17, 96), ts = colW * (0.2 + 0.05 * pulse);
        ctx.fillStyle = '#f5c518'; ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x, ty - ts); ctx.lineTo(x + ts, ty + ts * 0.75); ctx.lineTo(x - ts, ty + ts * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2a1a14'; ctx.fillRect(x - ts * 0.08, ty - ts * 0.45, ts * 0.16, ts * 0.65); dot(x, ty + ts * 0.42, ts * 0.1);
      } else {
        const rad = colW * 0.22;
        ctx.save(); ctx.translate(x, r.y); ctx.rotate(r.rot);
        if (r.ice) { // a serac block: angular, glassy blue-white
          ctx.beginPath();
          for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU, q = rad * (0.75 + 0.4 * hash(k, r.col + 7)); ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
          ctx.closePath(); ctx.fillStyle = '#d8eefa'; ctx.fill();
          ctx.strokeStyle = '#3f78a8'; ctx.lineWidth = Math.max(2, rad * 0.1); ctx.stroke();
          ctx.fillStyle = '#9cc8e6'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(rad * 0.7, -rad * 0.2); ctx.lineTo(rad * 0.3, rad * 0.6); ctx.closePath(); ctx.fill();
          ctx.restore();
          continue;
        }
        ctx.fillStyle = '#5d6068';
        ctx.beginPath();
        for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, q = rad * (0.85 + 0.25 * hash(k, r.col + 3)); ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8b8e96'; oval(-rad * 0.25, -rad * 0.25, rad * 0.4, rad * 0.25);
        ctx.fillStyle = '#44464d'; dot(rad * 0.3, rad * 0.25, rad * 0.15);
        ctx.restore();
      }
    }
  }

  function drawText(text, x, y, size, color, weight = 800) {
    ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.16); ctx.strokeStyle = 'rgba(20,15,30,0.75)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }

  function drawHUD() {
    const pad = 14, h = clamp(U * 7, 40, 54);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const altText = fmtAlt(altOf(pr));
    ctx.font = `800 ${Math.round(h * 0.46)}px ${FONT}`;
    const w = h * 0.95 + ctx.measureText(altText).width + h * 0.45;
    ctx.fillStyle = 'rgba(255,248,236,0.92)'; rr(ctx, pad, pad, w, h, h / 2); ctx.fill();
    const mx = pad + h * 0.5, my = pad + h * 0.55; // tiny mountain icon
    ctx.fillStyle = '#5b6f8c'; ctx.beginPath(); ctx.moveTo(mx - h * 0.28, my + h * 0.16); ctx.lineTo(mx, my - h * 0.24); ctx.lineTo(mx + h * 0.28, my + h * 0.16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(mx - h * 0.1, my - h * 0.1); ctx.lineTo(mx, my - h * 0.24); ctx.lineTo(mx + h * 0.1, my - h * 0.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1a14'; ctx.fillText(altText, pad + h * 0.95, pad + h / 2 + 1);

    const bw = clamp(U * 22, 130, 200), by = pad + h + 10, e = clamp(energy / 100, 0, 1);
    ctx.fillStyle = 'rgba(20,12,30,0.5)'; rr(ctx, pad, by, bw, 12, 6); ctx.fill();
    ctx.fillStyle = e > 0.5 ? '#2e9e5b' : e > 0.25 ? '#f39a1e' : '#e23b3b';
    if (e > 0.25 || Math.sin(time * 12) > -0.3) { rr(ctx, pad, by, Math.max(12, bw * e), 12, 6); ctx.fill(); }
    drawText(t('energy'), pad + bw + 8, by + 6, h * 0.28, '#ffffff', 800);
    let ly = by + 30;
    const alt = rowAlt(pr);
    if (alt >= O2_ALT - 150) { // oxygen gauge from just below Camp 3
      const o = clamp(o2 / 100, 0, 1), oy = by + 18;
      ctx.fillStyle = 'rgba(20,12,30,0.5)'; rr(ctx, pad, oy, bw, 10, 5); ctx.fill();
      ctx.fillStyle = '#8fd3ff';
      if (o > 0) { rr(ctx, pad, oy, Math.max(10, bw * o), 10, 5); ctx.fill(); }
      else if (alt >= O2_ALT && Math.sin(time * 8) > 0) { ctx.strokeStyle = '#8fd3ff'; ctx.lineWidth = 1.5; rr(ctx, pad, oy, bw, 10, 5); ctx.stroke(); }
      drawText(t('o2'), pad + bw + 8, oy + 5, h * 0.28, '#8fd3ff', 800);
      ly += 18;
    }
    const sec = sectionAt(alt), dz = alt >= DEATH_ALT;
    drawText(dz ? `${sec[lang]} · ${t('death')}` : sec[lang], pad + 2, ly, h * 0.3, dz ? '#ffb3a8' : '#ffffff', 800);
    const next = CAMPS.find((c) => c.row > maxRow);
    if (next) {
      const left = Math.max(0, next.m - altOf(pr));
      drawText(`${next[lang]}: ${fmtAlt(left)}`, pad + 2, ly + h * 0.45, h * 0.28, 'rgba(255,255,255,0.92)', 700);
    }
    drawText(`${t('best')} ${fmtBest()}`, pad + 2, ly + h * 0.86, h * 0.26, 'rgba(255,255,255,0.8)', 700);

    // column buttons (tap targets)
    const bh = clamp(U * 9, 44, 64), y = H - bh - Math.max(14, U * 2);
    for (let c = 0; c < 3; c++) {
      const x = wallX + colW * c + 6, cw = colW - 12;
      ctx.fillStyle = `rgba(255,255,255,${0.14 + pressT[c] * 2})`; rr(ctx, x, y, cw, bh, bh / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      const ax = x + cw / 2, ay = y + bh / 2, al = bh * 0.22, dx = (c - 1) * al * 0.8;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      line(ax - dx, ay + al, ax + dx, ay - al);
      const ang = Math.atan2(-2 * al, 2 * dx);
      line(ax + dx, ay - al, ax + dx - Math.cos(ang - 0.6) * al * 0.7, ay - al - Math.sin(ang - 0.6) * al * 0.7);
      line(ax + dx, ay - al, ax + dx - Math.cos(ang + 0.6) * al * 0.7, ay - al - Math.sin(ang + 0.6) * al * 0.7);
    }
    if (runTime > 2.4 && runTime < 6.5) { // after the mountain's name has shown
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, 6.5 - runTime, (runTime - 2.4) * 3);
      drawText(t('hint'), W / 2, H * 0.3, clamp(U * 3.6, 15, 24), '#ffffff', 800);
      ctx.globalAlpha = 1;
    }
  }

  function render() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawSky();
    drawWall();
    drawRows();
    const s = rowH * 0.38;
    if (falling) drawClimber(fall.x, fall.y, s, fall.rot);
    else {
      const jitter = stunT > 0 ? Math.sin(time * 60) * s * 0.15 : 0;
      const alpha = invulnT > 0 && Math.sin(time * 30) > 0 ? 0.45 : 1;
      drawClimber(colX(dispCol()) + jitter, rowY(dispRow()), s, 0, alpha);
    }
    drawRocks();
    const sky = skyAt(camAlt());
    if (sky.night > 0.02) { // night: only the headlamp lights the wall
      const hx = falling ? fall.x : colX(dispCol()), hy = (falling ? fall.y : rowY(dispRow())) - rowH * 0.6;
      const g = ctx.createRadialGradient(hx, hy, rowH * 0.6, hx, hy, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(7,11,36,0)'); g.addColorStop(0.35, `rgba(7,11,36,${0.45 * sky.night})`); g.addColorStop(1, `rgba(7,11,36,${0.7 * sky.night})`);
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    // Hypoxia: the edges of your vision close in when strength or oxygen runs low.
    const hyp = isDemo || falling ? 0 : clamp((30 - energy) / 30, 0, 1) * 0.6 + (o2 <= 0 && rowAlt(pr) >= O2_ALT ? 0.35 : 0);
    if (hyp > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(20,0,10,0)'); g.addColorStop(1, `rgba(20,0,10,${hyp * (0.75 + 0.25 * Math.sin(time * 3))})`);
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const flakes = Math.floor(30 + 120 * altT());
    for (let i = 0; i < flakes; i++) { const f = snow[i]; ctx.fillRect(f.x, f.y, f.s, f.s); }
    for (const p of particles) {
      ctx.globalAlpha = 1 - p.life / p.max; ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of popups) {
      const k = p.life / p.max;
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      drawText(p.text, p.x, p.y, clamp(U * 4.5, 18, 32) * p.scale, p.color, 900);
    }
    ctx.globalAlpha = 1;
    if (banner && !isDemo) {
      const k = 1 - banner.t / banner.max, pop = 1 + 0.3 * Math.max(0, 1 - k * 8);
      ctx.globalAlpha = banner.t < 0.5 ? banner.t / 0.5 : 1;
      const size = clamp(U * (banner.big ? 11 : 8), 30, banner.big ? 84 : 60) * pop;
      drawText(banner.title, W / 2, H * 0.36, size, banner.big ? '#f5c518' : '#ffffff', 900);
      drawText(banner.sub, W / 2, H * 0.36 + size * 0.85, size * 0.38, '#fff3b0', 800);
      ctx.globalAlpha = 1;
    }
    if (toast && !isDemo) { // entering a new stretch of the route
      ctx.globalAlpha = Math.min(1, toast.t / 0.4, (toast.max - toast.t) / 0.25);
      const size = clamp(U * 5.5, 22, 40), ty = Math.max(H * 0.27, 205);
      drawText(toast.text, W / 2, ty, size, toast.color, 900);
      drawText(toast.sub, W / 2, ty + size * 0.8, size * 0.42, '#fff3b0', 800);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (state === 'play' && !isDemo) drawHUD();
    if (paused) {
      ctx.fillStyle = 'rgba(10,16,51,0.55)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      drawText(t('paused'), W / 2, H * 0.42, clamp(U * 8, 30, 56), '#ffffff', 900);
      drawText(t('resume'), W / 2, H * 0.42 + clamp(U * 8, 30, 56), clamp(U * 3.5, 15, 22), '#fff3b0', 700);
    }
  }

  // ---------- Levels ----------
  const L2 = () => (lang === 'en' ? 0 : 1);
  const climbed = (i) => !!(prog.rec[MOUNTAINS[i].id] || {}).time;
  function selectLevel(i, demo = true) {
    loadLevel(i); useRecord(); store.set('hc_level', LV);
    buildPeaks();
    if (demo) newRun(true); // the menu background climbs the chosen mountain
    renderPicker();
  }
  function buildPicker() {
    MOUNTAINS.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pk'; b.setAttribute('role', 'radio');
      b.style.setProperty('--h', `${34 + i * 7.3}%`); // each level a taller peak
      b.innerHTML = '<span class="tri" aria-hidden="true"></span><span class="n" aria-hidden="true"></span>';
      b.addEventListener('click', () => selectLevel(i));
      ui.peaks.appendChild(b);
    });
    ui.peaks.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      selectLevel(LV + d);
      ui.peaks.children[LV].focus();
    });
  }
  function renderPicker() {
    [...ui.peaks.children].forEach((b, i) => {
      const m = MOUNTAINS[i];
      b.classList.toggle('locked', !isOpen(i)); b.classList.toggle('done', climbed(i));
      b.setAttribute('aria-checked', String(i === LV)); b.tabIndex = i === LV ? 0 : -1;
      b.setAttribute('aria-label', `${t('level')} ${i + 1}: ${m[lang]}, ${fmtAlt(m.m)}${climbed(i) ? ' ✓' : isOpen(i) ? '' : ' 🔒'}`);
      b.querySelector('.n').textContent = digits(i + 1);
    });
    ui.mtName.textContent = MT[lang];
    ui.mtOther.textContent = lang === 'en' ? MT.ne : MT.en;
    ui.mtOther.lang = lang === 'en' ? 'ne' : 'en';
    ui.mtMeta.textContent = `${t('level')} ${digits(LV + 1)} · ${fmtAlt(MT.m)} · ${WHERE[MT.where][L2()]}`;
    ui.mtRoute.textContent = `${t('rankTxt')(MT.rank)} · ${MT.route[L2()]}`;
    const open = isOpen(LV);
    ui.mtLock.textContent = open ? '' : t('locked')(MOUNTAINS[LV - 1][lang]);
    ui.mtLock.classList.toggle('hidden', open);
    ui.play.disabled = !open;
    ui.menuBest.textContent = fmtBest();
  }

  // ---------- Flow ----------
  function start() {
    if (!isOpen(LV)) return;
    audio.init();
    newRun(false);
    toasts.push({ text: MT[lang], sub: `${fmtAlt(MT.m)} · ${MT.route[L2()]}`, color: '#ffffff' });
    state = 'play';
    ui.menu.classList.add('hidden'); ui.over.classList.add('hidden');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function toMenu() {
    state = 'menu';
    selectLevel(LV);
    ui.over.classList.add('hidden'); ui.menu.classList.remove('hidden');
    ui.play.focus();
  }

  function showOver() {
    state = 'over';
    const summit = campReached === SUMMIT, hasNext = summit && LV < MOUNTAINS.length - 1;
    ui.overMt.textContent = `${t('level')} ${digits(LV + 1)} · ${MT[lang]}`;
    ui.overTitle.textContent = summit ? 'शिखर!' : 'थाकियो!';
    ui.overSub.textContent = !summit ? t('fell') : MOUNTAINS.every((m, i) => climbed(i)) ? t('allDone') : t('summitSub');
    ui.next.classList.toggle('hidden', !hasNext);
    if (hasNext) ui.next.textContent = `${t('next')}: ${MOUNTAINS[LV + 1][lang]}`;
    ui.retry.classList.toggle('ghost', hasNext);
    ui.finalAlt.textContent = fmtAlt(altOf(maxRow));
    ui.finalCamp.textContent = campReached >= 0 ? campName(campReached) : t('none');
    ui.finalTime.textContent = fmtTime(runTime);
    ui.overBest.textContent = fmtBest();
    ui.menuBest.textContent = fmtBest();
    ui.newBest.classList.toggle('hidden', !newBest);
    ui.over.classList.remove('hidden');
    retryLock = performance.now() + 600;
  }

  function press(col) {
    if (state !== 'play' || isDemo || falling || paused || stunT > 0 || won > 0) return;
    step(col);
  }

  // ---------- Input ----------
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'play') return;
    e.preventDefault();
    audio.init();
    if (paused) { paused = false; return; }
    press(clamp(Math.floor((e.clientX - wallX) / colW), 0, 2));
  });

  const KEYCOL = { ArrowLeft: 0, KeyA: 0, KeyJ: 0, Digit1: 0, ArrowUp: 1, ArrowDown: 1, KeyW: 1, KeyS: 1, KeyK: 1, Digit2: 1, ArrowRight: 2, KeyD: 2, KeyL: 2, Digit3: 2 };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') { audio.init(); toggleMute(); return; }
    if ((e.code === 'Escape' || e.code === 'KeyP') && state === 'play' && !falling) { paused = !paused; return; }
    if (e.code in KEYCOL && state === 'play') {
      e.preventDefault();
      if (e.repeat) return;
      if (paused) { paused = false; return; }
      press(KEYCOL[e.code]);
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (e.target.closest && e.target.closest('button')) return;
      e.preventDefault();
      if (e.repeat) return;
      if (state === 'menu') start();
      else if (state === 'over' && performance.now() > retryLock) start();
      else if (paused) paused = false;
    }
  });

  ui.play.addEventListener('click', start);
  ui.retry.addEventListener('click', () => { if (performance.now() > retryLock) start(); });
  ui.next.addEventListener('click', () => {
    if (performance.now() > retryLock && !ui.next.classList.contains('hidden') && isOpen(LV + 1)) { selectLevel(LV + 1, false); start(); }
  });
  ui.toMenu.addEventListener('click', toMenu);
  ui.mute.addEventListener('click', () => { audio.init(); toggleMute(); ui.mute.blur(); });
  ui.lang.addEventListener('click', () => { lang = lang === 'en' ? 'ne' : 'en'; store.set('hc_lang', lang); applyLang(); });
  ui.share.addEventListener('click', async () => {
    const text = campReached === SUMMIT ? t('shareSummit')(MT[lang], fmtNum(MT.m), fmtTime(runTime)) : t('shareText')(fmtNum(altOf(maxRow)), MT[lang]), url = location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ title: 'Himal Climb · हिमाल चढाइ', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      ui.share.textContent = t('copied');
      setTimeout(() => { ui.share.textContent = t('share'); }, 1500);
    } catch { /* share cancelled or unavailable */ }
  });

  const pauseIfPlaying = () => { if (state === 'play' && !isDemo && !falling && !won) paused = true; };
  window.addEventListener('blur', pauseIfPlaying);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseIfPlaying(); if (audio.ac) audio.ac.suspend(); }
    else if (audio.ac) audio.ac.resume();
  });
  window.addEventListener('resize', resize);


  // ---------- Go ----------
  const saved = store.get('hc_level', prog.unlocked) | 0;
  loadLevel(isOpen(saved) ? saved : prog.unlocked); useRecord();
  buildPicker();
  resize();
  newRun(true);
  setMuteUI();
  applyLang();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
