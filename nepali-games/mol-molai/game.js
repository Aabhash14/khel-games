/* Mol-Molai (मोलमोलाई) — Dashain shopping in Asan bazaar. Haggle, bluff, and read the shopkeepers' faces. */
(() => {
  'use strict';

  // ---------- Setup ----------
  const canvas = document.getElementById('game');
  let ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {};
  for (const id of ['menu', 'over', 'retry', 'next', 'share', 'toMenu', 'mute', 'voiceBtn', 'menuMute', 'menuVoice', 'lang', 'meVoice',
    'levels', 'brief', 'starTotal', 'badges', 'newBadges', 'overTitle', 'overLvl', 'overNum', 'overSub', 'overThought', 'stars',
    'meterFill', 'meterGoal', 'meterSaved', 'meterTarget', 'meterNext', 'tallySaved', 'tallyGoal', 'monthName', 'receipt', 'hud', 'lvlName', 'toleName', 'lvlNum', 'clock', 'money', 'target', 'rep',
    'panel', 'place', 'listBtn', 'lines', 'choices', 'sheet', 'listItems', 'sheetClose']) ui[id] = $(id);

  const TAU = Math.PI * 2;
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let DAY = 480; // minutes the bazaar stays open in this level, counted from 10:00

  // Levels: each opens more of Asan and asks you to bring home a bigger share of the budget.
  // stars: share of the budget saved for 1, 2 and 3 stars (1 star passes the level).
  const ALL_TOLES = ['asan', 'kamalakshi', 'bhotahity', 'balkumari', 'keltol', 'indrachowk', 'khulamanch', 'bangemuda'];
  const LEVELS = [
    { toles: 1, items: 2, stars: [0.08, 0.22, 0.3], day: 180, idea: 'offer' },
    { toles: 2, items: 3, stars: [0.1, 0.22, 0.29], day: 210, idea: 'compare' },
    { toles: 3, items: 3, big: true, stars: [0.12, 0.2, 0.25], day: 240, idea: 'walk' },
    { toles: 4, items: 3, big: true, stars: [0.13, 0.21, 0.26], day: 270, idea: 'tells' },
    { toles: 5, items: 4, big: true, stars: [0.14, 0.21, 0.26], day: 300, idea: 'bluff' },
    { toles: 6, items: 4, big: true, stars: [0.14, 0.21, 0.26], day: 330, idea: 'chat' },
    { toles: 7, items: 4, goat: true, stars: [0.13, 0.18, 0.23], day: 360, idea: 'goat' },
    { toles: 8, items: 5, big: true, stars: [0.15, 0.2, 0.25], day: 360, idea: 'route' },
    { toles: 8, items: 5, big: true, stars: [0.15, 0.2, 0.25], day: 330, rep: -1, idea: 'rep' },
    { toles: 8, items: 5, big: true, stars: [0.16, 0.21, 0.26], day: 270, idea: 'time' },
    { toles: 8, items: 5, goat: true, stars: [0.14, 0.18, 0.22], day: 300, hard: 0.02, idea: 'hard' },
    { toles: 8, items: 6, goat: true, stars: [0.15, 0.19, 0.22], day: 300, hard: 0.02, idea: 'final' },
  ];
  // When each level's new idea is taught: at the start, in the first shop, or at the first haggle.
  // Each level is a day on the month sheet: its corner carries the lunar day (tithi), as on a printed patro.
  const TITHI = { ne: ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी'], en: ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi'] };
  const HOLIDAY = 9; // Dashami, Vijaya Dashami: printed red
  const COACH_WHEN = { offer: 'haggle', compare: 'start', walk: 'haggle', tells: 'haggle', bluff: 'haggle', chat: 'shop', goat: 'start', route: 'start', rep: 'start', time: 'start', hard: 'start', final: 'start' };
  const LEVEL_TEXT = [
    { name: { ne: 'पहिलो मोल', en: 'First haggle' }, idea: { ne: 'रातो बाकसको अंक पसलेको दाम हो। − र + ले आफ्नो दाम मिलाउनुहोस्, अनि «दाम भन्ने» थिच्नुहोस्। पहिलो दाममा कहिल्यै नकिन्नुहोस्!', en: 'The number in the red box is the shopkeeper\'s price. Set your own with − and +, then press "Name my price". Never pay the first price!' } },
    { name: { ne: 'दुई पसल', en: 'Two shops' }, idea: { ne: 'उही सामान अर्को पसलमा पनि पाइन्छ। एक ठाउँमा दाम सोधेर अर्कोमा «अर्को पसलमा यति भन्यो» भन्नुहोस्: साँचो कुरा भए काम गर्छ।', en: 'The same goods are sold in another shop too. Ask one, then tell the other "the other shop said this": a true claim works.' } },
    { name: { ne: 'छोडेर हिँड्ने', en: 'Walk away' }, idea: { ne: 'दाम नघटे «छोडेर हिँड्ने» थिच्नुहोस्। धेरै पसलेले फर्काएर बोलाउँछन्, तर नबोलाए पछि फर्कँदा दाम बढ्छ।', en: 'If the price won\'t move, walk away. Many shopkeepers call you back, but if they don\'t, the price is higher when you return.' } },
    { name: { ne: 'अनुहार पढ', en: 'Read the face' }, idea: { ne: 'पसलेको अनुहार पढ्नुहोस्: मुस्कान र चिया भए अझै धेरै ठाउँ छ; पसिना र लामो सास भए सीमा नजिक छ।', en: 'Read the face: smiles and sips of tea mean lots of room; sweat and long sighs mean you are near their limit.' } },
    { name: { ne: 'झुटको खेल', en: 'Bluffing' }, idea: { ne: 'झुट पनि बोल्न सकिन्छ, तर पक्राउ परे बजारमा नाम घट्छ र सबै पसलको दाम बढ्छ।', en: 'You can lie too, but get caught and your name in the bazaar drops, so every shop starts higher.' } },
    { name: { ne: 'गफ', en: 'Small talk' }, idea: { ne: 'गफ गर्दा १२ मिनेट लाग्छ, तर पसले नरम हुन्छन्। कपडा दाइ गफ गर्नेलाई साँच्चै सस्तो दिन्छन्।', en: 'A chat costs 12 minutes but softens shopkeepers. Cloth Dai really does give chatty customers a discount.' } },
    { name: { ne: 'खसी', en: 'The goat' }, idea: { ne: 'खुला मञ्चमा दसैँको खसी बिक्छ। दिनभरि अरूले पनि किन्छन्: ढिलो गरे सकिन सक्छ!', en: 'Dashain goats are sold at Khula Manch. Others buy them all day: wait too long and they are gone!' } },
    { name: { ne: 'पूरा असन', en: 'All of Asan' }, idea: { ne: 'अब पूरा असन खुला छ। नक्सामा रुट बनाउनुहोस्: टाढाको पसल जान समय लाग्छ।', en: 'All of Asan is open now. Plan a route on the map: far shops cost time.' } },
    { name: { ne: 'बदनाम', en: 'Bad name' }, idea: { ne: 'यो पटक बजारमा तपाईंको नाम अलि बिग्रेको छ: पसलेहरू सुरुमै महँगो भन्छन् र छिटो शङ्का गर्छन्।', en: 'This time your name in the bazaar is already a little bad: shops start higher and suspect lies faster.' } },
    { name: { ne: 'छोटो दिन', en: 'Short day' }, idea: { ne: 'आज बजार चाँडै बन्द हुन्छ। कहाँ जाने, कति गफ गर्ने, होसियारीसाथ छान्नुहोस्।', en: 'The bazaar closes early today. Choose carefully where to go and how long to chat.' } },
    { name: { ne: 'कडा पसले', en: 'Tough sellers' }, idea: { ne: 'दसैँ नजिकियो, पसलेहरू कडा भए: न्यूनतम दाम माथि सरेको छ।', en: 'Dashain is close and shopkeepers have turned tough: their lowest prices are higher.' } },
    { name: { ne: 'अन्तिम बजार', en: 'Last bazaar' }, idea: { ne: 'दसैँको अघिल्लो दिन: छ वटा सामान, खसी सहित, सबैभन्दा कडा लक्ष्य।', en: 'The day before Dashain: six items including a goat, and the toughest target.' } },
  ];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = (arr) => (Array.isArray(arr) ? arr[(Math.random() * arr.length) | 0] : arr);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function mulberry32(s) {
    return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hash = (n) => { const r = mulberry32(n * 9973 + 17); r(); return r(); };
  const vibrate = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch { /* ignore */ } };
  const stepFor = (fair) => (fair < 300 ? 5 : fair < 1000 ? 10 : fair < 5000 ? 50 : fair < 15000 ? 100 : 500);
  const niceUp = (x, st) => Math.ceil(x / st - 1e-9) * st;
  const niceDown = (x, st) => Math.floor(x / st + 1e-9) * st;

  // ---------- Language ----------
  let lang = store.get('mm_lang', 'ne') === 'en' ? 'en' : 'ne';
  const L = (o) => (o && typeof o === 'object' && 'ne' in o ? o[lang] : o);
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const fill = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (k === 'Item' ? cap(v.item) : v[k] ?? ''));
  const DEV = '०१२३४५६७८९';
  const digits = (s) => (lang === 'ne' ? String(s).replace(/\d/g, (d) => DEV[d]) : String(s));
  const num = (n) => digits(Math.round(n).toLocaleString('en-IN'));
  const rs = (n) => (lang === 'ne' ? 'रु. ' : 'Rs ') + num(n);

  const TEXT = {
    ne: {
      tag: 'दसैँ आयो! आमाले पैसा र सामानको सूची दिएर असन बजार पठाउनुभयो। जति बचाउँछौ, त्यो तिम्रै।',
      how1: 'पसलेले भनेको पहिलो दाममा कहिल्यै नकिन्नुहोस्। आफ्नो दाम भन्नुहोस् र उहाँको अनुहार पढ्नुहोस्।',
      how2: '"अर्को पसलमा सस्तो भन्यो" भन्न सकिन्छ। साँचो भए काम लाग्छ। झुट पक्राउ परे बजारभरि नाम बिग्रिन्छ।',
      how3: 'असनका टोलहरूमा उस्तै सामान बेच्ने धेरै पसल छन्। नक्सामा रुट बनाउनुहोस्, हिँड्दा समय लाग्छ। बेलुका ६ बजे बजार बन्द हुन्छ।',
      sub: 'असन बजार · दसैँको किनमेल', levels: 'स्तरहरू', level: 'स्तर {n}', targetLbl: 'लक्ष्य बचत', timeLeft: 'समय बाँकी', play: 'खेल्नुहोस्', itemsLbl: 'सामान', hoursLbl: 'बजार खुला', targetShort: 'लक्ष्य बचत', tolesOpen: 'खुला टोल: {list}', tip: 'सुझाव', nextLevel: 'स्तर {n} खेल्ने', allDone: 'सबै स्तर पार! स्तरहरू हेर्ने', passTitle: 'लक्ष्य पुग्यो!', failTitle: 'लक्ष्य पुगेन', missTitle: 'किनमेल अधुरो', savedOf: 'बचत {s} ({p}%)', goalOf: 'लक्ष्य {s}', failSub: 'सबै सामान किनियो, तर रु. {s} मात्र बच्यो। लक्ष्य रु. {t} थियो।', minLbl: 'मिनेट', spentLbl: 'खर्च', homeLbl: 'घर', listShort: 'सूची',
      daily: 'आजको बजार', random: 'नयाँ बजार', best: 'उत्कृष्ट बचत', todayBest: 'आजको बजारमा', lang: 'English', menu: 'मेनु',
      rep: 'बजारमा नाम', list: 'सूची', listTitle: 'सूची र कापी', aamaSays: 'आमाका अनुसार करिब', pocket: 'खल्तीमा', close: 'बन्द',
      lane: 'असन बजार', thinking: 'मनमा...', you: 'म',
      where: 'कुन पसलमा जाने?', goHome: 'घर फर्किने', sureHome: 'पक्का घर फर्किने? ({n} सामान बाँकी)',
      homeWarn: 'अझै {list} किन्न बाँकी छ। आमाले के भन्नुहोला?',
      openMap: 'नक्सा र रुट', routeHint: 'कहाँ कति टाढा?', mapTitle: 'असनको नक्सा', mapHint: 'नक्सामा पसल छोएर छान्नुहोस्: त्यहीँ जाने, वा धेरै पसल जोडेर रुट बनाउने।',
      goHere: 'यहाँ जाने', addRoute: 'रुटमा थप्ने', removeRoute: 'रुटबाट हटाउने', startRoute: 'रुट सुरु गर्ने', clearRoute: 'रुट खाली गर्ने', backStreet: 'सडकमा फर्किने',
      nextStop: 'अर्को रोकाइ: {name}', moreShops: 'अरू पसल पनि हेर्ने ({n})', route: 'रुट: {list}', routeTotal: 'कुल {m} मिनेट हिँडाइ, {n} पसल', passing: 'बाटोमा: {list}', sellsLbl: 'पाइने: {list}',
      pickOnMap: 'पसल छान्नुहोस्:', walkingTo: '{place} तिर हिँड्दै...', mapLbl: 'नक्सा', north: 'उ', meters: 'मि',
      pickItem: 'केको मोलमोलाई गर्ने?', haggleFor: 'मोलमोलाई: {item}', chat: 'अलिकति गफ गर्ने', backLane: 'बजारतिर निस्कने',
      offer: 'मेरो दाम भन्ने', bluff: '"अर्को पसलमा यति भन्यो"', accept: 'उहाँको दाममा किन्ने', walk: 'छोडेर हिँड्ने',
      myPrice: 'मेरो दाम', theirPrice: 'उहाँको दाम', ofAsk: 'उहाँको दामको {p}%',
      bought: 'किनियो', soldOut: 'सकियो', angry: 'रिसाउनुभएको', mins: '{m} मिनेट', left: '{n} वटा बाँकी', here: 'यहीँ',
      noMoney: 'त्यति पैसा खल्तीमा छैन!', closed: 'बजार बन्द भयो!', repDown: 'बजारमा तपाईंको नाम घट्यो।', repUp: 'बजारमा तपाईंको नाम बढ्यो।',
      dealLine: '{Item} किनियो: रु. {p}', poorLine: 'खल्तीमा रु. {p} मात्र छ।',
      savedLbl: 'बचत', boughtLbl: 'किनेका सामान', offLbl: 'मोलमोलाई', missing: 'नकिनिएको',
      quoteNote: '{name}: रु. {p}', friendNote: '{name}: रु. {p} (साथीले किनेको)', tipNote: '{name}: रु. {p} भन्दा तल दिनुहुन्न रे',
      noQuotes: 'अहिलेसम्म दाम सोधिएको छैन।',
      again: 'फेरि खेल्नुहोस्', share: 'सेयर', copied: 'कपी भयो!', newBest: 'नयाँ रेकर्ड!',
      badgesLbl: 'पदक', newBadges: 'नयाँ पदक!',
      noVoice: 'यो ब्राउजरमा नेपाली वा हिन्दी आवाज भेटिएन। आवाज सुन्न Microsoft Edge वा Chrome प्रयोग गर्नुहोस्, वा English मा खेल्नुहोस्।',
      edgeHint: 'यो ब्राउजरमा नेपाली आवाज छैन, त्यसैले हिन्दी आवाजले पढ्दैछ। स्पष्ट नेपाली आवाज सुन्न Microsoft Edge वा एन्ड्रोइड फोनमा खेल्नुहोस्।',
      meVoice: { f: 'मेरो आवाज: महिला', m: 'मेरो आवाज: पुरुष' },
      shareWin: (lv, s, st) => `"मोलमोलाई" स्तर ${lv}: दसैँको सबै किनमेल गरेर रु. ${s} बचाएँ, ${st}/३ तारा! तपाईं कति बचाउन सक्नुहुन्छ?`,
      shareLose: (lv) => `"मोलमोलाई" स्तर ${lv} मा असन बजारका पसलेहरूसँग हारेँ! तपाईं जित्न सक्नुहुन्छ?`,
    },
    en: {
      tag: 'Dashain is here! Aama gave you money and a shopping list and sent you to Asan bazaar. Whatever you save is yours.',
      how1: 'Never pay the first price. Name your own, and read the shopkeeper\'s face.',
      how2: 'You can say "the other shop offered less". True claims work. Get caught lying and the whole bazaar hears about it.',
      how3: "Asan's toles have several shops selling the same things. Plan a route on the map: walking takes time. The bazaar closes at 6 PM.",
      sub: 'Asan bazaar · Dashain shopping', levels: 'Levels', level: 'Level {n}', targetLbl: 'Save at least', timeLeft: 'Time left', play: 'Play', itemsLbl: 'Items', hoursLbl: 'Bazaar open', targetShort: 'Save at least', tolesOpen: 'Open toles: {list}', tip: 'Tip', nextLevel: 'Play level {n}', allDone: 'All levels done! See the levels', passTitle: 'Target reached!', failTitle: 'Target missed', missTitle: 'Shopping unfinished', savedOf: 'Saved {s} ({p}%)', goalOf: 'Target {s}', failSub: 'You bought everything but saved only Rs {s}. The target was Rs {t}.', minLbl: 'min', spentLbl: 'Spent', homeLbl: 'Home', listShort: 'List',
      daily: "Today's bazaar", random: 'New bazaar', best: 'Best savings', todayBest: "Today's bazaar", lang: 'नेपाली', menu: 'Menu',
      rep: 'Name in the bazaar', list: 'List', listTitle: 'List and notebook', aamaSays: 'Aama says about', pocket: 'In my pocket', close: 'Close',
      lane: 'Asan bazaar', thinking: 'Thinking...', you: 'Me',
      where: 'Which shop?', goHome: 'Go home', sureHome: 'Really go home? ({n} items missing)',
      homeWarn: 'I still need to buy: {list}. What will Aama say?',
      openMap: 'Map and route', routeHint: 'how far is everything?', mapTitle: 'Map of Asan', mapHint: 'Tap a shop on the map: walk there now, or add several shops to plan a route.',
      goHere: 'Walk here', addRoute: 'Add to route', removeRoute: 'Remove from route', startRoute: 'Start the route', clearRoute: 'Clear the route', backStreet: 'Back to the street',
      nextStop: 'Next stop: {name}', moreShops: 'Show other shops too ({n})', route: 'Route: {list}', routeTotal: '{m} min of walking, {n} shops', passing: 'on the way: {list}', sellsLbl: 'sells: {list}',
      pickOnMap: 'Pick a shop:', walkingTo: 'Walking to {place}...', mapLbl: 'Map', north: 'N', meters: 'm',
      pickItem: 'What to haggle for?', haggleFor: 'Haggle for {item}', chat: 'Chat a little', backLane: 'Back to the lane',
      offer: 'Name my price', bluff: '"The other shop said this"', accept: 'Buy at their price', walk: 'Walk away',
      myPrice: 'My price', theirPrice: 'Their price', ofAsk: '{p}% of their price',
      bought: 'bought', soldOut: 'sold out', angry: 'angry', mins: '{m} min', left: '{n} left', here: 'here',
      noMoney: "I don't have that much money!", closed: 'The bazaar is closed!', repDown: 'Your name in the bazaar just dropped.', repUp: 'Your name in the bazaar just went up.',
      dealLine: 'Bought the {item}: Rs {p}', poorLine: 'I only have Rs {p} left.',
      savedLbl: 'Saved', boughtLbl: 'Items', offLbl: 'Haggled off', missing: 'not bought',
      quoteNote: '{name}: Rs {p}', friendNote: '{name}: Rs {p} (a friend bought it)', tipNote: '{name}: won\'t go below Rs {p}, they say',
      noQuotes: 'No prices asked yet.',
      again: 'Play again', share: 'Share', copied: 'Copied!', newBest: 'New record!',
      badgesLbl: 'Badges', newBadges: 'New badges!',
      noVoice: 'No voice for this language was found in this browser. Try Microsoft Edge or Chrome to hear the characters.',
      edgeHint: '',
      meVoice: { f: 'My voice: female', m: 'My voice: male' },
      shareWin: (lv, s, st) => `"Mol-Molai" level ${lv}: I did all the Dashain shopping and saved Rs ${s}, ${st}/3 stars! How much can you save?`,
      shareLose: (lv) => `The shopkeepers of Asan beat me on level ${lv} of "Mol-Molai"! Can you do better?`,
    },
  };
  const t = (k) => TEXT[lang][k];

  // ---------- Icons: one drawn set, square strokes ----------
  const ICON = {
    offer: '<path d="M4 12h13M12 6l6 6-6 6"/>',
    bluff: '<path d="M3 20V10l4-4 4 4v10z"/><path d="M13 20V10l4-4 4 4v10z"/><path d="M7 14v2M17 14v2"/>',
    accept: '<path d="M4 12.5l5 5L20 6.5"/>',
    chat: '<path d="M4 5h16v11H11l-5 4v-4H4z"/>',
    walk: '<path d="M14 4h6v16h-6"/><path d="M3 12h11M8 7l-5 5 5 5"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h2M4 12h2M4 18h2"/>',
    back: '<path d="M20 12H7M12 6l-6 6 6 6"/>',
    home: '<path d="M3 11.5l9-7.5 9 7.5"/><path d="M5.5 10v10h13V10"/>',
    star: '<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    lock: '<path d="M5 11h14v10H5z"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    route: '<path d="M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    soundOff: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
    voice: '<path d="M4 4h16v11H10l-5 4v-4H4z"/><path d="M8 8.5h8M8 11.5h5"/>',
    voiceOff: '<path d="M4 4h16v11H10l-5 4v-4H4z"/><path d="M3 3l18 18"/>',
    play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
    retry: '<path d="M5 12a7 7 0 1 0 2.2-5.1"/><path d="M5 3.5v5h5"/>',
    share: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 13v8h16v-8"/>',
    grid: '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>',
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

  // ---------- Bazaar content ----------
  const ITEMS = {
    goat: { name: { ne: 'खसी', en: 'goat' }, fair: 22000, big: true, icon: '🐐' },
    rice: { name: { ne: 'चामलको बोरा', en: 'sack of rice' }, fair: 2400, icon: '🍚' },
    daura: { name: { ne: 'दौरा सुरुवाल', en: 'daura suruwal' }, fair: 3600, big: true, icon: '👔' },
    sari: { name: { ne: 'सारी', en: 'sari' }, fair: 4200, big: true, icon: '🥻' },
    shoes: { name: { ne: 'जुत्ता', en: 'pair of shoes' }, fair: 2800, big: true, icon: '👟' },
    brass: { name: { ne: 'काँसको थाल', en: 'brass plate' }, fair: 1800, big: true, icon: '🍽️' },
    topi: { name: { ne: 'ढाका टोपी', en: 'dhaka topi' }, fair: 650, icon: '🧢' },
    kite: { name: { ne: 'चङ्गा र लट्टाई', en: 'kite and spool' }, fair: 450, icon: '🪁' },
    spice: { name: { ne: 'मसला', en: 'spices' }, fair: 700, icon: '🌶️' },
    fruit: { name: { ne: 'फलफूल', en: 'fruit' }, fair: 550, icon: '🍊' },
    tika: { name: { ne: 'टीकाको अबिर', en: 'tika powder' }, fair: 180, icon: '🔴' },
    cards: { name: { ne: 'तास', en: 'deck of cards' }, fair: 150, icon: '🃏' },
  };
  const iname = (id) => L(ITEMS[id].name);

  // Personalities: hidden numbers as multiples of an item's fair price.
  // open: first price, floor: real lowest price, patience, susp: chance to catch a lie, callback: chance to call you back.
  const KINDP = {
    cunning: { open: [1.6, 1.85], floor: [0.84, 0.9], patience: 6, susp: 0.5, callback: 0.3 },
    honest: { open: [1.28, 1.42], floor: [0.9, 0.95], patience: 5, susp: 0.4, callback: 0.3 },
    chatty: { open: [1.55, 1.8], floor: [0.84, 0.9], patience: 7, susp: 0.3, callback: 0.45 },
    naive: { open: [1.4, 1.6], floor: [0.8, 0.88], patience: 5, susp: 0.12, callback: 0.5 },
    kind: { open: [1.1, 1.2], floor: [0.76, 0.84], patience: 9, susp: 0.2, callback: 0.6 },
    grumpy: { open: [1.35, 1.55], floor: [0.86, 0.92], patience: 3, susp: 0.45, callback: 0.65 },
    farmer: { open: [1.18, 1.3], floor: [0.93, 0.98], patience: 6, susp: 0.25, callback: 0.4, lateDrop: 0.17 },
    poker: { open: [1.5, 1.75], floor: [0.8, 0.88], patience: 6, susp: 0.4, callback: 0.3 },
    cheerful: { open: [1.3, 1.5], floor: [0.85, 0.92], patience: 6, susp: 0.3, callback: 0.35 },
  };
  // What each kind of shop stocks; each day a shop carries a random part of this.
  const CAT = {
    grocery: { sells: ['rice', 'spice', 'tika', 'cards'], color: '#e65100' },
    street: { sells: ['fruit', 'tika'], color: '#7b1fa2' },
    kite: { sells: ['kite', 'cards'], color: '#0288d1' },
    readymade: { sells: ['shoes', 'daura', 'sari', 'topi'], color: '#00796b' },
    cloth: { sells: ['daura', 'sari', 'topi'], color: '#283593' },
    brass: { sells: ['brass'], color: '#b8860b' },
    goat: { sells: ['goat'], color: '#5d4037' },
  };

  // The shopkeepers of Asan, each in a real tole. Several sell the same things: compare, bluff, plan your route.
  const KEEPERS = {
    tuladhar: {
      kind: 'cunning', cat: 'grocery', tole: 'asan', style: 'concrete', wall: '#a9c2cc', color: '#b71c1c', g: 'm', pitch: 0.92, rate: 0.9,
      name: { ne: 'तुलाधर साहुजी', en: 'Tuladhar Sahuji' }, shop: { ne: 'तुलाधर स्टोर्स', en: 'Tuladhar Stores' }, sign: { ne: 'तुलाधर स्टोर्स', en: 'TULADHAR STORES' },
      look: { skin: '#c68a5c', body: '#f1ece0', vest: '#2b2b2b', hat: 'topi', mustache: true, fat: 1.18 },
      greet: { ne: 'आउनुस्, आउनुस्! तुलाधर स्टोर्समा नपाइने केही छैन।', en: "Come in, come in! There's nothing Tuladhar Stores doesn't have." },
      chat: { ne: 'मेरो बुबाले यो पसल पचास वर्षअघि खोल्नुभएको। यो बजारको हरेक चलाखी मैले देखिसकेँ।', en: "My father opened this shop fifty years ago. I've seen every trick in this bazaar." },
    },
    masaladidi: {
      kind: 'honest', gossip: true, cat: 'grocery', tole: 'asan', style: 'newari', wall: '#e2c48a', color: '#e65100', g: 'f', pitch: 1.04, rate: 1.0,
      name: { ne: 'मसला दिदी', en: 'Spice Didi' }, shop: { ne: 'असन मसला भण्डार', en: 'Asan Spice Store' }, sign: { ne: 'असन मसला भण्डार', en: 'ASAN SPICES' },
      look: { skin: '#b97a52', body: '#c2185b', hair: 'bun', tika: true },
      greet: { ne: 'के चाहियो? मसला एकदम ताजा छ, सुँघेर हेर्नुस् त!', en: 'What do you need? The spices are fresh, have a sniff!' },
      chat: { ne: 'यो बजारमा कसले कसलाई के भन्यो, सबै मेरो कानमा आइपुग्छ।', en: 'Whoever says whatever to whomever in this bazaar, it reaches my ears.' },
    },
    aama: {
      kind: 'kind', cat: 'street', tole: 'asan', style: 'newari', color: '#6a1b9a', g: 'f', pitch: 0.9, rate: 0.8,
      name: { ne: 'हजुरआमा', en: 'Hajurama' }, shop: { ne: 'हजुरआमाको डालो', en: "Hajurama's basket" }, sign: null,
      look: { skin: '#a8754e', body: '#7b1fa2', shawl: '#d84315', hair: 'white', old: true },
      greet: { ne: 'आऊ, आऊ। आफ्नै बारीको ताजा फलफूल छ।', en: 'Come, come. Fresh fruit from my own garden.' },
      chat: { ne: 'गाउँबाट बिहानै हिँडेर आएँ। सबै बेचेर बेलुकी फर्किनुपर्छ।', en: 'I walked in from the village at dawn. I have to sell it all and walk back tonight.' },
    },
    shrestha: {
      kind: 'poker', cat: 'grocery', tole: 'kamalakshi', style: 'concrete', wall: '#cfd8c4', color: '#4e342e', g: 'm', pitch: 0.95, rate: 0.9,
      name: { ne: 'श्रेष्ठ साहु', en: 'Shrestha Sahu' }, shop: { ne: 'श्रेष्ठ किराना पसल', en: 'Shrestha Grocery' }, sign: { ne: 'श्रेष्ठ किराना', en: 'SHRESTHA KIRANA' },
      look: { skin: '#c08a5e', body: '#6d4c41', hair: 'bald', glasses: true, mustache: true },
      greet: { ne: 'के लिने?', en: 'What will it be?' },
      chat: { ne: 'कमलाक्षीमा तीन पुस्तादेखि यो पसल छ। दाम चाहिँ हिसाबले मात्र।', en: 'Three generations of this shop in Kamalakshi. Prices go by the numbers, nothing else.' },
    },
    changadai: {
      kind: 'cheerful', cat: 'kite', tole: 'kamalakshi', style: 'newari', wall: '#b6d4ea', color: '#0277bd', g: 'm', pitch: 1.1, rate: 1.05,
      name: { ne: 'चङ्गा दाइ', en: 'Kite Dai' }, shop: { ne: 'कमलाक्षी चङ्गा पसल', en: 'Kamalakshi kite shop' }, sign: { ne: 'चङ्गा लट्टाई', en: 'KITES & SPOOLS' },
      look: { skin: '#b57a50', body: '#ffb300', hair: 'spiky' },
      greet: { ne: 'चङ्गा! लट्टाई! धागो! आकाश तपाईंको!', en: 'Kites! Spools! String! The sky is yours!' },
      chat: { ne: 'सानोमा म यही गल्लीमा सबैको चङ्गा चेट गर्थेँ, हाहा!', en: 'As a kid I cut down every kite in this lane, haha!' },
    },
    bhai: {
      kind: 'naive', cat: 'readymade', tole: 'bhotahity', style: 'concrete', wall: '#a8d5c6', color: '#00796b', g: 'm', pitch: 1.14, rate: 1.06,
      name: { ne: 'पसले भाइ', en: 'Shop Boy' }, shop: { ne: 'न्यू रेडिमेड पसल', en: 'New Readymade shop' }, sign: { ne: 'न्यू रेडिमेड', en: 'NEW READYMADE' },
      look: { skin: '#c08458', body: '#e53935', hair: 'cap', young: true },
      greet: { ne: 'मालिक बाहिर जानुभएको छ, आज पसल म हेर्दै छु।', en: "The owner has stepped out, so I'm minding the shop today." },
      chat: { ne: 'मलाई अझै सबै दाम थाहा छैन। धेरै तल भन्नुभयो भने मालिकलाई फोन गर्नुपर्छ।', en: "I don't know all the prices yet. If you go too low I have to phone the owner." },
    },
    maharjan: {
      kind: 'cunning', cat: 'readymade', tole: 'bhotahity', style: 'concrete', wall: '#d9c3e0', color: '#37474f', g: 'm', pitch: 1.0, rate: 1.0,
      name: { ne: 'महर्जन दाइ', en: 'Maharjan Dai' }, shop: { ne: 'महर्जन फेसन', en: 'Maharjan Fashion' }, sign: { ne: 'महर्जन फेसन', en: 'MAHARJAN FASHION' },
      look: { skin: '#a86d45', body: '#212121', hair: 'short' },
      greet: { ne: 'भोटाहिटीकै सबैभन्दा नयाँ डिजाइन यहीँ छ, आउनुस्!', en: 'The newest designs in all of Bhotahity are right here, come in!' },
      chat: { ne: 'होलसेलमा ल्याउँछु, तर तपाईंलाई खुद्रामै सस्तो दिन्छु... हेहे।', en: "I buy wholesale, but for you I'll give a cheap retail price... heh." },
    },
    kansakar: {
      kind: 'poker', cat: 'brass', tole: 'balkumari', style: 'newari', wall: '#d2c6a6', color: '#8d6e00', g: 'm', pitch: 0.95, rate: 0.9,
      name: { ne: 'कंसाकार साहु', en: 'Kansakar Sahu' }, shop: { ne: 'कंसाकार भाँडा पसल', en: 'Kansakar Brassware' }, sign: { ne: 'कंसाकार भाँडा', en: 'KANSAKAR BRASS' },
      look: { skin: '#c48b60', body: '#1b5e20', hair: 'bald', glasses: true },
      greet: { ne: 'काँस, पित्तल, तामा। सबै असली।', en: 'Brass, bronze, copper. All genuine.' },
      chat: { ne: 'हिसाब भनेको हिसाब हो। भावनाले पसल चल्दैन।', en: "Numbers are numbers. Feelings don't run a shop." },
    },
    phaldidi: {
      kind: 'honest', cat: 'street', tole: 'balkumari', style: 'concrete', color: '#2e7d32', g: 'f', pitch: 1.05, rate: 1.0,
      name: { ne: 'फलफूल दिदी', en: 'Fruit Didi' }, shop: { ne: 'दिदीको फलफूल डालो', en: "Didi's fruit basket" }, sign: null,
      look: { skin: '#a8754e', body: '#2e7d32', shawl: '#fbc02d', hair: 'bun', tika: true },
      greet: { ne: 'सुन्तला ताजा छ, गोरखाबाट आएको!', en: 'The oranges are fresh, straight from Gorkha!' },
      chat: { ne: 'बिहान चार बजे कालीमाटीबाट ल्याएको। दाम ठिक भए बिकिहाल्छ।', en: 'I brought these from Kalimati at four this morning. A fair price and they sell themselves.' },
    },
    bajracharya: {
      kind: 'honest', cat: 'brass', tole: 'keltol', style: 'newari', wall: '#e0cfa8', color: '#795548', g: 'm', pitch: 0.97, rate: 0.95,
      name: { ne: 'बज्राचार्य दाइ', en: 'Bajracharya Dai' }, shop: { ne: 'बज्राचार्य भाँडा पसल', en: 'Bajracharya Brassware' }, sign: { ne: 'बज्राचार्य भाँडा', en: 'BAJRACHARYA BRASS' },
      look: { skin: '#b07a52', body: '#efe8d8', vest: '#5d4037', hat: 'topi', mustache: true },
      greet: { ne: 'पाटनका कालिगडले बनाएको काँस हो, हेर्नुस्।', en: 'Brass made by Patan craftsmen, have a look.' },
      chat: { ne: 'बुबाले पनि यही केल टोलमा भाँडा बेच्नुहुन्थ्यो। म ठग्दिनँ।', en: "My father sold brass right here in Kel Tol too. I don't cheat people." },
    },
    changabhai: {
      kind: 'naive', cat: 'kite', tole: 'keltol', style: 'concrete', wall: '#c5e1a5', color: '#1565c0', g: 'm', pitch: 1.15, rate: 1.07,
      name: { ne: 'चङ्गा भाइ', en: 'Kite Boy' }, shop: { ne: 'केल टोल चङ्गा पसल', en: 'Kel Tol kite stall' }, sign: { ne: 'चङ्गा पसल', en: 'KITE STALL' },
      look: { skin: '#b57a50', body: '#1e88e5', hair: 'cap', young: true },
      greet: { ne: 'चङ्गा चाहियो? सस्तोमा दिन्छु!', en: "Want a kite? I'll give you a cheap one!" },
      chat: { ne: 'यो मेरो काकाको पसल हो। मलाई त चङ्गा उडाउन मात्र आउँछ, हिसाब आउँदैन।', en: "This is my uncle's stall. I know how to fly kites, not how to do sums." },
    },
    kapadadai: {
      kind: 'chatty', cat: 'cloth', tole: 'indrachowk', style: 'concrete', wall: '#dcb7bd', color: '#283593', g: 'm', pitch: 1.0, rate: 1.03,
      name: { ne: 'कपडा दाइ', en: 'Cloth Dai' }, shop: { ne: 'दाइको कपडा पसल', en: "Dai's cloth shop" }, sign: { ne: 'फेसन कपडा', en: 'FASHION CLOTH' },
      look: { skin: '#a86d45', body: '#3f51b5', hair: 'short', mustache: true, tape: true },
      greet: { ne: 'दसैँमा नयाँ लुगा नलगाई हुन्छ? आउनुस्, हेर्नुस्!', en: "You can't have Dashain without new clothes! Come, take a look!" },
      chat: { ne: 'मलाई गफ गर्न खुब मन पर्छ। गफ गर्ने ग्राहकलाई म सस्तोमै दिन्छु, हाहा!', en: 'I love a good chat. Customers who chat with me get a better price, haha!' },
    },
    pradhandidi: {
      kind: 'cheerful', cat: 'cloth', tole: 'indrachowk', style: 'newari', wall: '#f0c8d8', color: '#ad1457', g: 'f', pitch: 1.08, rate: 1.03,
      name: { ne: 'प्रधान दिदी', en: 'Pradhan Didi' }, shop: { ne: 'प्रधान वस्त्रालय', en: 'Pradhan Cloth House' }, sign: { ne: 'प्रधान वस्त्रालय', en: 'PRADHAN CLOTH HOUSE' },
      look: { skin: '#c08458', body: '#6a1b9a', shawl: '#f06292', hair: 'bun', tika: true },
      greet: { ne: 'इन्द्रचोकको सबैभन्दा राम्रो कपडा! छुएर हेर्नुस्।', en: 'The best cloth in Indra Chowk! Feel it.' },
      chat: { ne: 'दसैँमा सबैलाई नयाँ लुगा चाहिन्छ। म हाँसीखुसी बेच्छु, हाहा!', en: 'Everyone needs new clothes for Dashain. I sell with a smile, haha!' },
    },
    shakya: {
      kind: 'cunning', cat: 'cloth', sells: ['topi', 'daura', 'shoes'], tole: 'bangemuda', style: 'newari', wall: '#d7ccc8', color: '#1a237e', g: 'm', pitch: 0.94, rate: 0.92,
      name: { ne: 'शाक्य साहुजी', en: 'Shakya Sahuji' }, shop: { ne: 'शाक्य टोपी भण्डार', en: 'Shakya Topi Store' }, sign: { ne: 'शाक्य टोपी भण्डार', en: 'SHAKYA TOPI' },
      look: { skin: '#c68a5c', body: '#283593', vest: '#1b1b1b', hat: 'topi', glasses: true, fat: 1.1 },
      greet: { ne: 'असली पाल्पाली ढाका! बाङ्गेमुडामा यस्तो कतै पाइँदैन।', en: "Genuine Palpali dhaka! You won't find this anywhere else in Bangemuda." },
      chat: { ne: 'मेरो टोपी लगाएर प्रधानमन्त्रीसम्म पुगेका छन्, थाहा छ?', en: 'My topis have been worn all the way up to Prime Ministers, you know?' },
    },
    khasi: {
      kind: 'grumpy', cat: 'goat', tole: 'khulamanch', color: '#5d4037', g: 'm', pitch: 0.86, rate: 0.98, stock: 3, sales: [40, 470],
      name: { ne: 'खसी बेपारी', en: 'Goat Trader' }, shop: { ne: 'खसी बेपारीको खोर', en: "Goat Trader's pen" }, sign: null,
      look: { skin: '#8d5a3a', body: '#5d4037', hat: 'topi', stubble: true },
      greet: { ne: 'खसी चाहियो? छिटो भन्नुस्, मसँग फुर्सद छैन।', en: "Want a goat? Out with it, I haven't got all day." },
      chat: { ne: 'हुँह, गफ? ...ल ठिक छ। मेरा खसी बजारमै सबैभन्दा मोटा छन्, सबैलाई थाहा छ।', en: 'Hmph, small talk? ...Fine. My goats are the fattest in the bazaar, everyone knows it.' },
    },
    ba: {
      kind: 'farmer', cat: 'goat', tole: 'khulamanch', color: '#558b2f', g: 'm', pitch: 0.86, rate: 0.8, stock: 2, sales: [200, 560],
      name: { ne: 'गाउँका बा', en: 'Village Ba' }, shop: { ne: 'बाका खसी', en: "Ba's goats" }, sign: null,
      look: { skin: '#9a6644', body: '#efe8d8', hat: 'topi', mustache: true, whiteMustache: true, old: true },
      greet: { ne: 'नमस्ते। गाउँबाट ल्याएको खसी हो, आफैँले पालेको।', en: 'Namaste. I brought these goats from the village. Raised them myself.' },
      chat: { ne: 'साँझ पर्नुअघि बस चढ्नुपर्छ। नबिके फेरि डोर्याएर गाउँ लैजानुपर्छ।', en: "I have to catch the bus before dark. If they don't sell, I walk them all the way home." },
    },
    thulo: {
      kind: 'cunning', cat: 'goat', tole: 'khulamanch', color: '#b71c1c', g: 'm', pitch: 0.9, rate: 0.95, stock: 3, sales: [60, 420],
      name: { ne: 'ठूला बेपारी', en: 'Big Dealer' }, shop: { ne: 'ठूला बेपारीको खसी', en: "Big Dealer's goats" }, sign: null,
      look: { skin: '#8d5a3a', body: '#b71c1c', hat: 'topi', mustache: true, fat: 1.2 },
      greet: { ne: 'तराईका मोटा खसी! एकपटक हेर्नुस् त।', en: 'Fat goats from the Terai! Just take a look.' },
      chat: { ne: 'म हरेक दसैँमा ट्रक भरेर खसी ल्याउँछु। दाम? बजार हेरेर।', en: 'Every Dashain I bring a whole truckload of goats. The price? Depends on the market.' },
    },
  };
  for (const k of Object.values(KEEPERS)) { Object.assign(k, { ...KINDP[k.kind], ...k }); if (!k.sells) k.sells = CAT[k.cat].sells; }
  const kname = (s) => L(KEEPERS[s.id].name);
  const sname = (s) => L(KEEPERS[s.id].shop);

  // ---------- The map of Asan: real streets from OpenStreetMap (© OpenStreetMap contributors, ODbL) ----------
  // Metres: x to the east, y to the south. p: street points, r: streets [class, point, point...], t: toles, l: other places, a: ponds and parks.
  const MAP = {"w":729,"h":754,"p":[554,415,563,263,570,252,618,232,658,224,591,432,87,544,51,754,56,773,361,369,349,361,145,303,-2,266,97,24,203,30,177,149,116,425,95,525,357,-19,354,37,353,94,341,195,329,254,318,284,387,763,380,704,382,687,605,87,600,124,590,206,-1,494,657,468,646,490,539,564,437,548,396,543,354,537,239,3,232,27,231,30,224,64,474,393,480,339,483,297,174,744,166,775,253,755,292,762,333,763,528,-7,526,37,602,56,243,118,233,110,191,95,189,90,144,62,56,4,33,-19,385,96,453,111,477,299,473,290,449,271,452,250,443,245,435,231,448,145,460,71,200,55,131,141,498,770,496,749,505,723,751,516,747,535,750,585,721,494,618,-8,614,22,609,58,551,452,511,703,516,694,504,755,714,205,430,48,430,68,487,75,715,101,667,124,673,121,256,723,280,611,279,601,222,590,711,516,685,507,613,474,575,459,569,533,579,554,658,580,725,598,669,516,648,505,636,473,624,467,638,514,641,530,660,566,442,432,446,426,457,425,464,389,501,289,497,243,502,158,486,33,490,117,687,33,490,697,430,688,375,652,353,631,352,600,353,560,361,455,377,400,363,383,332,603,667,487,682,492,612,485,620,495,631,497,-17,384,220,457,446,382,382,378,344,336,303,240,275,186,245,76,439,-20,591,217,598,228,673,66,-19,608,74,547,128,512,326,386,442,318,527,693,568,435,40,27,332,192,292,187,391,562,386,565,442,337,407,358,334,773,344,631,341,622,438,415,422,418,418,426],"r":[[3,0,1],[3,1,2],[3,3,4],[3,5,0],[2,6,7,8],[1,9,10],[1,10,11],[1,11,12],[1,13,14],[2,15,11],[2,11,16],[2,16,17],[2,17,6],[1,18,19],[1,19,20],[1,20,21],[1,21,22,23],[1,24,25,26],[3,27,28],[3,28,29],[1,17,30],[2,31,32],[1,33,34],[1,34,35],[1,35,36],[2,37,38],[2,38,39],[2,39,40],[2,41,42],[2,42,43],[1,44,45],[1,46,47,48],[1,48,24],[1,49,50,51],[1,52,53,54,55],[1,55,56,13],[1,13,57],[1,57,58],[1,59,60],[1,61,62,63,64,65,66,67],[1,67,60],[1,60,68],[2,69,55],[1,15,70],[3,71,72,73],[3,74,75,76],[3,31,77,74],[3,2,3],[3,78,79],[3,79,80],[3,80,27],[3,33,81],[3,82,83],[3,83,33],[3,84,82],[3,4,85],[1,38,19],[1,19,86],[1,86,87,68],[1,68,88],[1,88,27],[1,27,89],[1,28,90,91],[1,46,92,93,94],[1,94,95,6],[2,96,97],[2,97,32],[2,32,98],[2,98,99,100,101,102],[2,102,103,96],[2,97,104,105,32],[2,32,106,107,98],[2,32,108,109,110,102],[1,34,111,112,113,114],[1,115,116,117,67],[1,118,88],[1,60,119],[1,79,120],[1,83,121,122,26],[1,26,123,124],[1,124,125],[1,125,126],[1,126,36],[1,36,127,128,129,9],[1,94,130,125],[2,32,131,132,97],[2,98,133,134,135,32],[1,136,16],[1,16,137],[1,0,41],[1,41,114],[1,114,138],[1,138,139,9],[1,10,140,23],[1,23,141,142],[1,142,52],[1,52,143,40],[1,86,144],[3,29,145,146,3],[3,73,82],[2,69,14],[2,14,39],[2,40,69],[1,51,80],[1,80,147],[1,148,149,6],[1,6,150,137],[1,137,151,9],[1,9,152],[1,152,61],[1,61,43],[1,43,115],[1,115,1],[2,153,83],[1,59,20],[3,2,29],[3,81,0],[3,5,31],[3,81,154,5],[1,57,155],[2,55,15],[2,21,156],[2,157,142],[1,35,158,159,126],[1,46,44],[1,160,42],[1,152,160],[1,160,161],[1,48,162],[1,124,163,164],[1,138,165,166,167]],"t":[{"id":"asan","ne":"असन टोल","en":"Asan Tol","x":386,"y":361,"n":139},{"id":"kamalakshi","ne":"कमलाक्षी","en":"Kamalakshi","x":403,"y":307,"n":152},{"id":"bhotahity","ne":"भोटाहिटी","en":"Bhotahity","x":454,"y":394,"n":114},{"id":"balkumari","ne":"बालकुमारी","en":"Balkumari","x":299,"y":409,"n":151},{"id":"keltol","ne":"केल टोल","en":"Kel Tol","x":204,"y":464,"n":137},{"id":"indrachowk","ne":"इन्द्रचोक","en":"Indra Chowk","x":100,"y":530,"n":17},{"id":"bangemuda","ne":"बाङ्गेमुडा","en":"Bangemuda","x":149,"y":291,"n":11},{"id":"khulamanch","ne":"खुला मञ्च","en":"Khula Manch","x":628,"y":630,"n":102}],"l":[{"ne":"अन्नपूर्ण अजिमा","en":"Annapurna Ajima","x":357,"y":381,"k":"temple"},{"ne":"असन गणेश","en":"Asan Ganesh","x":360,"y":363,"k":"temple"},{"ne":"जनबाहल","en":"Janabahal","x":218,"y":448,"k":"temple"},{"ne":"न्हैकनतल्ला","en":"Nhaikantalla","x":234,"y":308,"k":"place"},{"ne":"नःघल","en":"Naghal","x":176,"y":184,"k":"place"},{"ne":"ताहिटि","en":"Tahiti","x":215,"y":45,"k":"place"},{"ne":"मखन","en":"Makhan","x":23,"y":582,"k":"place"},{"ne":"भेडासिंङ","en":"Bhedasing","x":114,"y":423,"k":"place"},{"ne":"सबल बाहल","en":"Sabal Bahal","x":308,"y":671,"k":"place"},{"ne":"रानी पोखरी","en":"Rani Pokhari","x":661,"y":332,"k":"water"},{"ne":"कान्ति पथ","en":"Kanti Path","x":586,"y":222,"k":"road"}],"a":[{"k":"water","p":[582,332,579,392,741,397,748,272,583,267,582,328,654,330,654,323,672,324,672,342,654,341,654,334,582,332]},{"k":"park","p":[651,479,708,501,729,530,734,535,736,540,740,578,740,619,566,555,568,550,566,539,569,454,582,438,588,439,651,479]},{"k":"park","p":[566,555,563,581,559,586,551,597,533,665,531,688,755,706,740,619,566,555]},{"k":"water","p":[47,48,26,95,15,120,11,121,-11,117,-16,115,-18,112,-18,109,-9,75,1,35,5,30,11,28,17,28,32,38,47,48]},{"k":"park","p":[711,463,712,404,579,400,579,416,601,427,636,441,676,444,691,461,711,463]}]};
  const MP = MAP.p, mpt = (i) => [MP[2 * i], MP[2 * i + 1]];
  const ADJ = Array.from({ length: MP.length / 2 }, () => []);
  for (const r of MAP.r) for (let k = 2; k < r.length; k++) {
    const a = r[k - 1], b = r[k], [ax, ay] = mpt(a), [bx, by] = mpt(b), d = Math.hypot(ax - bx, ay - by);
    ADJ[a].push([b, d]); ADJ[b].push([a, d]);
  }
  function dijkstra(src) {
    const n = ADJ.length, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    dist[src] = 0;
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0) break;
      done[u] = 1;
      for (const [v, w] of ADJ[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
    }
    return { dist, prev };
  }
  const TOLE = {};
  MAP.t.forEach((t, i) => { TOLE[t.id] = { ...t, idx: i, open: t.id === 'khulamanch', sp: dijkstra(t.n) }; });
  const tname = (id) => L(TOLE[id]);
  // The walking route between two toles, along real streets.
  function tolePath(a, b) {
    const A = TOLE[a], B = TOLE[b], pts = [[B.x, B.y]];
    for (let u = B.n; u >= 0; u = A.sp.prev[u]) { pts.push(mpt(u)); if (u === A.n) break; }
    pts.push([A.x, A.y]);
    return pts.reverse();
  }
  const pathLen = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const WALK_M_PER_MIN = 45; // a crowded bazaar, not an empty road
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, tt = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
    return Math.hypot(px - ax - tt * dx, py - ay - tt * dy);
  }
  // Toles you pass on the way (where you could stop too).
  function tolesOnPath(pts, a, b) {
    return Object.values(TOLE).filter((T) => T.id !== a && T.id !== b && pts.some((p, i) => i && segDist(T.x, T.y, pts[i - 1][0], pts[i - 1][1], p[0], p[1]) < 30)).map((T) => T.id);
  }

  // acc: chance to accept an offer that is already above their lowest price. conc: how far they move toward it per round.
  const KIND = {
    cunning: { acc: 0.2, conc: 0.22 }, honest: { acc: 0.5, conc: 0.4 }, chatty: { acc: 0.35, conc: 0.3 }, naive: { acc: 0.55, conc: 0.45 },
    kind: { acc: 0.6, conc: 0.5 }, grumpy: { acc: 0.45, conc: 0.35 }, farmer: { acc: 0.45, conc: 0.35 }, poker: { acc: 0.3, conc: 0.28 }, cheerful: { acc: 0.45, conc: 0.38 },
  };

  const LINES = {
    quote: { ne: ['{Item}? रु. {p}। एकदम राम्रो माल छ।', 'यसको रु. {p} पर्छ। यो भन्दा राम्रो बजारमै पाइँदैन।', '{Item}? तपाईंलाई रु. {p}।'], en: ['The {item}? Rs {p}. Top quality.', "That's Rs {p}. You won't find better in the whole bazaar.", 'For you, Rs {p}.'] },
    counter: { ne: ['त्यसमा त घाटा हुन्छ। रु. {p} सम्म दिन सक्छु।', 'ल, तपाईंलाई भनेर रु. {p}।', 'हुँदैन, हुँदैन। रु. {p} दिनुस्।'], en: ["I'd lose money at that. I can do Rs {p}.", 'Fine, just for you: Rs {p}.', 'No, no. Make it Rs {p}.'] },
    stuck: { ne: ['भनिसकेँ नि, रु. {p}।', 'रु. {p} नै हो।'], en: ['I told you, Rs {p}.', 'It stays at Rs {p}.'] },
    accept: { ne: ['ल ठिक छ, लानुस्!', 'हुन्छ। दसैँको बेला हो, लानुस्।', 'ठिकै छ, तपाईंकै कुरा।'], en: ['Alright, take it!', "Okay. It's Dashain, take it.", 'Fine, have it your way.'] },
    insult: { ne: ['के भन्नुभएको? त्यति त मैले किनेकै पर्दैन!', 'ठट्टा गर्नुभएको? रु. {o}?', 'यस्तो दाम भन्ने भए अर्को पसल जानुस्।'], en: ["What? I didn't even pay that much for it!", 'Are you joking? Rs {o}?', "If you're going to name prices like that, try another shop."] },
    lower: { ne: ['अघि त रु. {prev} भन्नुभएको थियो, अहिले झन् तल?', 'उल्टो तल झर्नुहुन्छ? यस्तो मोलमोलाई कहाँ हुन्छ!'], en: ['You said Rs {prev} a minute ago, and now lower?', "Going backwards? That's not how haggling works!"] },
    kick: { ne: ['बस्, भयो! मेरो समय खेर नफाल्नुस्। जानुस्!', 'जानुस्, जानुस्। अरू ग्राहक पर्खिरहेका छन्।'], en: ['Enough! Stop wasting my time. Off you go!', 'Go, go. Other customers are waiting.'] },
    kicked: { ne: 'अघि भर्खर झगडा गर्नुभएको होइन? एकछिनपछि आउनुस्।', en: "Didn't we just argue? Come back later." },
    final: { ne: ['रु. {p}, अन्तिम। यो भन्दा तल मेरो पनि पर्दैन।', 'साँच्चै भन्छु, रु. {p} भन्दा तल सक्दिन।'], en: ['Rs {p}, final. Any lower and I lose money.', "Honestly, I can't go below Rs {p}."] },
    fakeFinal: { ne: ['कसम! रु. {p} भन्दा एक रुपैयाँ पनि तल सक्दिन!', 'रु. {p}। यो मेरो अन्तिम दाम हो, भगवान् साक्षी!'], en: ['I swear! Not one rupee below Rs {p}!', 'Rs {p}. My final price, as God is my witness!'] },
    bluffMatch: { ne: ['{other}ले रु. {n} भन्नुभयो? ल ठिक छ, म रु. {p} मै दिन्छु।', 'हम्म... ल, रु. {p}। तर अरूलाई नभन्नुहोला।'], en: ["{other} said Rs {n}? Fine, I'll do Rs {p}.", "Hmm... okay, Rs {p}. But don't tell anyone."] },
    bluffNo: { ne: ['रु. {n}? त्यसो भए उतै किन्नुस्। म रु. {p} भन्दा तल सक्दिन।', 'त्यति दिनुहुन्छ भने उतै जानुस्। मेरो रु. {p}।'], en: ["Rs {n}? Then buy it there. I can't go below Rs {p}.", "If they'll sell it for that, go there. Mine is Rs {p}."] },
    shout: { ne: '{name}ले गल्लीतिर कराएर सोध्नुभयो: "ए {other}! {item} रु. {n} मा दिन्छौ रे, हो?"', en: '{name} shouts down the lane: "Hey, {other}! Selling the {item} for Rs {n}, are you?"' },
    shoutNo: { ne: '"कहाँ हो! त्यति सस्तोमा कसले दिन्छ!"', en: '"Never! Who would sell that cheap?"' },
    shoutYes: { ne: '"हो, भनेको हो!"', en: '"Yes, I did!"' },
    caught: { ne: ['झुट! {other}ले त्यस्तो भन्नुभएकै छैन। मसँग खेल्ने?', 'हामी सबै एकअर्कालाई चिन्छौँ नि! झुट बोलेर हुन्छ?'], en: ['Liar! {other} never said that. Playing games with me?', "We all know each other here! Lying won't work."] },
    callback: { ne: ['ए, पख्नुस् पख्नुस्! ल, रु. {p} मा लानुस्।', 'कहाँ जानुभयो? आउनुस्, आउनुस्! रु. {p}, अब त ठिक छ?'], en: ['Hey, wait, wait! Okay, take it for Rs {p}.', 'Where are you off to? Come back! Rs {p}, fair enough now?'] },
    back: { ne: ['फेरि आउनुभयो? अघिकै कुरा: रु. {p}।', 'ए, फर्किनुभयो! रु. {p} नै हो।'], en: ['Back again? Same as before: Rs {p}.', "Ah, you're back! Still Rs {p}."] },
    bohani: { ne: 'बोहनी गरिदिनुभयो, धन्यवाद! आजको दिन राम्रो जाला।', en: "My first sale of the day, thank you! It'll be a good day." },
    noBohaniTell: { ne: '{name} बिहानदेखि ग्राहक नआएजस्तो खाली बसिरहनुभएको छ। पसलमा धूप बलिरहेको छ।', en: '{name} sits waiting, with no customers yet today by the look of it. Incense smoulders at the shop.' },
    chatNoBohani: { ne: 'बिहानदेखि बोहनी भएको छैन। आज के हुने हो!', en: 'Not a single sale since morning. What a day.' },
    chatBohani: { ne: 'आज त राम्रै बिक्री भयो, दसैँ हो नि।', en: "Sales have been good today. It's Dashain after all." },
    soldOut: { ne: 'माफ गर्नुस्, अन्तिमचाहिँ भर्खरै अर्को ग्राहकले लग्यो!', en: 'Sorry, someone just took the last one!' },
    noneLeft: { ne: 'सबै बिकिसक्यो। भोलि आउनुस्।', en: 'All sold out. Come back tomorrow.' },
    kindLow: { ne: 'ल, हुन्छ नि... लैजाऊ।', en: "Alright... that's fine. Take it." },
    kindFull: { ne: 'तिमीजस्तो असल केटाकेटी कमै भेटिन्छन्। भगवानले भलो गरून्!', en: 'Few young people are as kind as you. Bless you!' },
    boss: { ne: 'त्यति तल? पख्नुस्, मालिकलाई फोन गर्छु... "हजुर? ...हस्, हस्।" मालिक रिसाउनुभयो। रु. {p} भन्दा तल पाइँदैन।', en: 'That low? Wait, let me phone the owner... "Yes? ...Okay, okay." The owner is not pleased. Nothing below Rs {p}.' },
    nothing: { ne: 'अरू केही चाहियो कि?', en: 'Anything else?' },
    chatty: { ne: 'हाहा, तपाईंसँग गफ गरेर मज्जा आयो!', en: 'Haha, I like chatting with you!' },
  };
  // Personal styles for the haggling counter-offers.
  const KLINES = {
    grumpy: { counter: { ne: ['रु. {p}। लिने भए लिनुस्, नभए जानुस्।', 'हुँदैन। रु. {p}।'], en: ['Rs {p}. Take it or leave it.', 'No. Rs {p}.'] } },
    kind: { counter: { ne: ['ल, रु. {p} देऊ न त।', 'मेरो पनि त घर चलाउनुपर्छ। रु. {p}।'], en: ['Alright, give me Rs {p} then.', 'I have a home to run too. Rs {p}.'] } },
    naive: { counter: { ne: ['अँ... रु. {p}? हुन्छ होला।', 'उम्... रु. {p} सम्म सक्छु जस्तो लाग्छ।'], en: ['Umm... Rs {p}? That should be okay.', 'Uh... I think I can do Rs {p}.'] } },
    cheerful: { counter: { ne: ['हाहा, राम्रो मोलमोलाई! ल रु. {p}।', 'तपाईं त पक्का व्यापारी! रु. {p}।'], en: ['Haha, good haggling! Okay, Rs {p}.', "You're a real trader! Rs {p}."] } },
    poker: { counter: { ne: ['रु. {p}।', '... रु. {p}।'], en: ['Rs {p}.', '... Rs {p}.'] } },
    farmer: { counter: { ne: ['मैले वर्षभरि घाँस काटेर पालेको। रु. {p} त दिनुस्।', 'रु. {p}। यो भन्दा तल त गाउँ फर्किने भाडा पनि पुग्दैन।'], en: ['I cut grass for this goat all year. At least Rs {p}.', "Rs {p}. Any lower and I can't even pay the bus home."] } },
    cunning: { counter: { ne: ['तपाईंलाई मात्र, अरूलाई होइन: रु. {p}।', 'ओहो, मेरो त घाटै भयो। ल रु. {p}।'], en: ['Only for you, nobody else: Rs {p}.', "Oh, I'm losing money here. Fine, Rs {p}."] } },
  };
  const kline = (kind, key) => (KLINES[kind] && KLINES[kind][key]) || LINES[key];

  const ME = {
    askPrice: { ne: '{Item} कति हो?', en: 'How much for the {item}?' },
    offer: { ne: ['रु. {p} मा दिनुहुन्छ?', 'रु. {p} भए लैजान्छु।', 'रु. {p} ठिक छ।'], en: ['Will you do Rs {p}?', "I'll take it for Rs {p}.", 'Rs {p} is fair.'] },
    bluff: { ne: ['{other}ले त रु. {p} भन्नुभयो नि।', '{other}ले रु. {p} मै दिन्छु भन्नुभएको थियो।'], en: ['{other} said Rs {p}, you know.', '{other} offered it to me for Rs {p}.'] },
    accept: { ne: 'ल ठिक छ, रु. {p} मा लिन्छु।', en: "Okay, I'll take it for Rs {p}." },
    walk: { ne: ['पर्दैन, म अरू पसल हेर्छु।', 'महँगो भयो। म जान्छु।'], en: ["Never mind, I'll look elsewhere.", "Too expensive. I'm going."] },
    chat: { ne: 'दसैँको तयारी कस्तो छ?', en: 'How are the Dashain preparations going?' },
  };

  // What you notice about the shopkeeper: how close they are to their real limit.
  const TELLS = {
    far: { ne: ['{name} मुसुक्क हाँस्नुभयो, कुनै हतार छैन जस्तो।', '{name}ले आरामले चिया सुरुप्प पिउनुभयो।', '{name} पछाडि ढल्किएर बस्नुभयो।', '{name}ले अरू ग्राहकतिर हेर्दै हात हल्लाउनुभयो।'], en: ['{name} smiles, in no hurry at all.', '{name} takes a slow sip of tea.', '{name} leans back, relaxed.', '{name} waves at another customer.'] },
    mid: { ne: ['{name}ले टाउको कन्याउनुभयो।', '{name} एकछिन चुप लाग्नुभयो।', '{name}ले क्यालकुलेटरमा केही थिच्नुभयो।', '{name}ले सामानतिर हेर्दै ओठ टोक्नुभयो।'], en: ['{name} pauses, thinking it over.', '{name} goes quiet for a moment.', '{name} taps something into a calculator.', '{name} glances at the goods and bites a lip.'] },
    near: { ne: ['{name}ले लामो सास फेर्नुभयो।', '{name}को निधारमा पसिना देखियो।', '{name}ले बेर्ने कागज झिक्नुभयो।', '{name}ले फेरि फेरि हिसाब गर्नुभयो।'], en: ['{name} lets out a long sigh.', "A bead of sweat appears on {name}'s forehead.", '{name} reaches for the wrapping paper.', '{name} does the sums again, and again.'] },
    annoyed: { ne: ['{name}ले निधार खुम्च्याउनुभयो।', '{name}ले हात बाँध्नुभयो।', '{name} अरू ग्राहकतिर फर्किनुभयो।'], en: ['{name} frowns.', '{name} folds both arms.', '{name} turns toward another customer.'] },
    poker: { ne: ['{name}को अनुहारमा कुनै भाव छैन।', '{name} चुपचाप तपाईंलाई हेरिरहनुभएको छ।'], en: ["{name}'s face gives nothing away.", '{name} just looks at you, silent.'] },
  };

  const THOUGHTS = {
    start: { ne: ['पहिले दुई-तीन पसलमा दाम सोध्छु, अनि मात्र किन्छु।', 'आमा भन्नुहुन्छ: पसलेले भनेको आधाबाट सुरु गर्नू।'], en: ["I'll ask at two or three shops first, then buy.", 'Aama always says: start at half of what they ask.'] },
    near: { ne: ['अब धेरै तल झर्नुहुन्न जस्तो छ...', 'यो त सीमामै पुग्यो जस्तो छ।'], en: ['Not much room left, I think...', 'That looks close to the limit.'] },
    far: { ne: ['अझै धेरै तल झर्न सक्नुहुन्छ जस्तो लाग्छ।', 'यति हाँसिहाँसी बोल्नुहुन्छ, अझै नाफा धेरै होला।'], en: ["There's still plenty of room, it feels like.", 'All smiles... there must be a fat margin in this.'] },
    fake: { ne: '{name}को "कसम" मा कति पत्याउने?', en: 'How much is {name}\'s "I swear" really worth?' },
    trueFinal: { ne: '{name} झुट बोल्ने मान्छे जस्तो लाग्दैन।', en: "{name} doesn't seem the lying type." },
    poker: { ne: 'अनुहारबाट केही थाहा हुँदैन। हिसाबले खेल्नुपर्छ।', en: "Can't read anything from that face. I'll have to go by the numbers." },
    caught: { ne: ['उफ्! अब यो कुरा बजारभरि फैलिन्छ।', 'छी, लाज लाग्यो...'], en: ['Ugh! Now the whole bazaar will hear about this.', 'Oh no, how embarrassing...'] },
    caughtGossip: { ne: 'दिदीसँग झुट बोल्नु हुँदैनथ्यो। दिदीले त सबैलाई भनिहाल्नुहुन्छ!', en: "I shouldn't have lied to Didi. Didi tells everyone!" },
    bluffWin: { ne: ['हेहे, पत्याउनुभयो!', 'अनुहार नबिगारी भनेँ, काम गर्यो।'], en: ['Heh, it worked!', 'Kept a straight face, and it worked.'] },
    kindLow: { ne: 'हजुरआमाको हात काँपिरहेको थियो... त्यति धेरै घटाउनु हुँदैनथ्यो कि?', en: "Hajurama's hands were shaking... maybe I pushed too hard." },
    kindFull: { ne: 'केही रुपैयाँ बढी गयो होला, तर मन हलुका भयो।', en: 'Maybe a few rupees more, but my heart feels lighter.' },
    firstPrice: { ne: 'पहिलो दाममै किनेँ... आमाले थाहा पाउनुभयो भने!', en: 'I paid the very first price... if Aama finds out!' },
    goodDeal: { ne: ['राम्रो मोल भयो!', 'यो त सस्तोमै पर्यो।'], en: ['Good deal!', 'That came out cheap.'] },
    closing: { ne: 'बजार बन्द हुन लाग्यो! छिटो गर्नुपर्छ।', en: 'The bazaar is about to close! I need to hurry.' },
    allDone: { ne: 'सबै सामान किनियो! अब घर गएर आमालाई देखाउँछु।', en: 'Got everything! Time to go home and show Aama.' },
    boss: { ne: 'धेरै तल भनेँ जस्तो छ... अब मालिक पनि आइपुग्नुभयो।', en: 'I went too low... now the owner is involved.' },
    late: { ne: 'साँझ पर्दैछ। गाउँका बालाई घर फर्किने हतार होला।', en: 'It is getting late. Village Ba must be in a hurry to get home.' },
    poor: { ne: 'पैसा पुग्दैन जस्तो छ... अब धेरै होसियार हुनुपर्छ।', en: "I'm running short of money... I need to be careful now." },
    chatty: { ne: 'दाइ गफ गरेर खुसी हुनुभयो। अब अलि सस्तो दिनुहोला।', en: 'Dai enjoyed that chat. Maybe the price will soften now.' },
  };

  const EVENTS = {
    intro: { ne: 'आमाले रु. {b} र सूची हातमा राखिदिनुभयो: "जति बचाउँछौ, त्यो तिम्रै दसैँ खर्च। ठगिएर नआउनू!"', en: 'Aama pressed Rs {b} and the list into your hand: "Whatever you save is your Dashain money. Don\'t get cheated!"' },
    cow: { ne: 'गल्लीको बीचमा एउटा गाई बसेको छ। कसैले हटाउन सकेन, घुमेर जानुपर्यो।', en: 'A cow is lying in the middle of the lane. Nobody can move it, so you take the long way round.' },
    tip: { ne: 'चिनेकी काकीले कानेखुसी गर्नुभयो: "{name}ले {item} रु. {p} भन्दा तल दिनुहुन्न रे।"', en: 'An auntie you know whispers: "They say {name} won\'t sell the {item} below Rs {p}."' },
    friend: { ne: 'साथी भेटियो! उसले {name}बाट {item} रु. {p} मा किनेछ।', en: 'You bump into a friend who just bought a {item} from {name} for Rs {p}.' },
    tourist: { ne: 'एक जना विदेशीले {name}लाई दोब्बर दाम तिरेर गए। {name} आज खुब खुसी हुनुहुन्छ।', en: 'A tourist just paid {name} double. {name} is in a great mood now.' },
    goatSold: { ne: '{name}को एउटा खसी बिक्यो। अब {n} वटा मात्र बाँकी।', en: '{name} just sold a goat. Only {n} left.' },
    goatGone: { ne: '{name}का सबै खसी बिकिसके!', en: '{name} has sold every goat!' },
  };

  const ENDINGS = {
    happy: { title: { ne: 'आमा दङ्ग!', en: 'Aama is thrilled!' }, sub: { ne: 'सबै सामान किनेर रु. {s} बचाएर ल्यायौ!', en: 'You bought everything and brought back Rs {s}!' } },
    ok: { title: { ne: 'घर पुगियो', en: 'Home with everything' }, sub: { ne: 'सबै सामान ल्याइयो, रु. {s} बच्यो।', en: 'You brought everything, with Rs {s} left over.' } },
    scold: { title: { ne: 'आमाले गाली गर्नुभयो', en: 'Aama is not pleased' }, sub: { ne: '{list} त ल्याएनौ नि!', en: 'You forgot the {list}!' } },
  };
  const AAMA = {
    3: { ne: '"यत्रो बचत? अब त तिमी साहुजीलाई पनि उछिन्ने भयौ!"', en: '"You saved all that? Soon you\'ll be out-haggling Sahuji!"' },
    2: { ne: '"शाबास! राम्रो मोलमोलाई गरेछौ।"', en: '"Well done! That was some good haggling."' },
    1: { ne: '"ठिकै छ। अर्को पटक अलि बढी मोलमोलाई गर्नू।"', en: '"Not bad. Haggle a bit harder next time."' },
    0: { ne: '"दसैँमा सामान नै नपुगे कसरी हुन्छ? भोलि फेरि जानुपर्यो।"', en: '"How can we do Dashain without everything? You\'ll have to go back tomorrow."' },
    goat: { ne: '"दसैँमा खसी नै छैन? अब के गर्ने!"', en: '"No goat for Dashain? What are we going to do!"' },
  };

  const BADGES = [
    { id: 'bohani', ne: 'बोहनी गराइयो', en: 'First sale' },
    { id: 'kind', ne: 'ठूलो मन', en: 'Big heart' },
    { id: 'liar', ne: 'झुटको गुरु', en: 'Master bluffer' },
    { id: 'caught', ne: 'पक्राउ!', en: 'Busted!' },
    { id: 'half', ne: 'आधा दाममा', en: 'Half price' },
    { id: 'callback', ne: 'फर्काएर बोलाए', en: 'Called back' },
    { id: 'sahu', ne: 'चलाख साहुलाई जितियो', en: 'Beat a sly trader' },
    { id: 'goat', ne: 'खसी घर पुग्यो', en: 'Goat home' },
    { id: 'three', ne: 'आमा दङ्ग', en: 'Aama amazed' },
  ];

  // g: which voice to use (female / male). pitch and rate stay gentle: big pitch shifts make the words hard to follow.
  // 'me' and 'thought' use the player's chosen voice; each shopkeeper's voice comes from KEEPERS (gender, age).
  const VOICE = { me: { pitch: 1.04, rate: 0.95 }, thought: { pitch: 1.0, rate: 0.88, volume: 0.75 } };
  for (const [id, k] of Object.entries(KEEPERS)) VOICE[id] = { g: k.g, pitch: k.pitch, rate: k.rate };
  const FEMALE_VOICE = /hemkala|swara|kalpana|neerja|heera|aria|jenny|zira|sonia|libby|hazel|susan|samantha|veena|lekha|female|woman|google हिन्दी|google hindi/i;
  const MALE_VOICE = /sagar|madhur|hemant|prabhat|ravi|guy|david|mark|ryan|george|daniel|rishi|male|\bman\b/i;

  // ---------- State ----------
  let state = 'menu', view = 'lane';
  let G = null, curShop = null, curItem = null, offerVal = 0, busy = false, homeConfirm = false;
  let lines = [], time = 0, talkT = 0, walkAnim = null, mapWalk = null, mapSel = null, showAll = false, fx = [];
  let selLevel = 0;
  const progress = () => store.get('mm_levels', {});
  const unlocked = (i) => i === 0 || (progress()[i - 1] || 0) > 0;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const badges = new Set(store.get('mm_badges', []));

  // ---------- Voices (Web Speech API: free, built into the browser) ----------
  const voice = {
    on: store.get('mm_voice', true) !== false,
    list: [],
    supported: 'speechSynthesis' in window,
    init() {
      if (!this.supported) return;
      const load = () => { this.list = speechSynthesis.getVoices(); };
      load();
      speechSynthesis.addEventListener('voiceschanged', load);
    },
    me: store.get('mm_mevoice', 'f') === 'm' ? 'm' : 'f',
    genderOf(x) { return FEMALE_VOICE.test(x.name) ? 'f' : MALE_VOICE.test(x.name) ? 'm' : null; },
    // Best voice for this language and gender: real Nepali first (Edge: Hemkala, Sagar), then Hindi; natural voices are clearest.
    pick(g) {
      const tiers = lang === 'ne' ? [/^ne/i, /^hi/i] : [/^en-IN/i, /^en/i];
      for (const re of tiers) {
        const pool = this.list.filter((x) => re.test(x.lang));
        if (!pool.length) continue;
        const score = (x) => { const xg = this.genderOf(x); return (!g ? 0 : xg === g ? 10 : xg ? 0 : 4) + (/natural|online|neural/i.test(x.name) ? 3 : 0) + (x.localService ? 0 : 1); };
        return pool.sort((a, b) => score(b) - score(a))[0];
      }
      return null;
    },
    hasNepali() { return this.list.some((x) => /^ne/i.test(x.lang)); },
    speakable(text) {
      let s = text.replace(/["“”✔()]/g, ' ').replace(/\.\.\.|…/g, ', ');
      if (lang === 'ne') s = s.replace(/रु\.\s*([०-९,]+)/g, (_, n) => `${n.replace(/,/g, '')} रुपैयाँ`);
      else s = s.replace(/Rs\s*([\d,]+)/g, (_, n) => `${n.replace(/,/g, '')} rupees`);
      return s.replace(/\s+/g, ' ').trim();
    },
    say(text, key) {
      if (!this.on || !this.supported || audio.muted) return;
      const prof = VOICE[key] || VOICE.me, g = prof.g || this.me;
      const v = this.pick(g);
      if (!v) return;
      const clean = this.speakable(text);
      if (!clean) return;
      // Only if the device has no voice of the right gender, fake it with pitch.
      const vg = this.genderOf(v), fix = vg === g ? 1 : g === 'f' ? 1.18 : 0.84;
      const u = new SpeechSynthesisUtterance(clean);
      u.voice = v; u.lang = v.lang; u.pitch = clamp(prof.pitch * fix, 0.6, 1.5); u.rate = prof.rate; u.volume = prof.volume ?? 1;
      speechSynthesis.speak(u);
    },
    stop() { if (this.supported) speechSynthesis.cancel(); },
  };
  voice.init();
  function setVoiceUI() {
    for (const b of [ui.voiceBtn, ui.menuVoice]) { if (!b) continue; b.innerHTML = icon(voice.on ? 'voice' : 'voiceOff'); b.classList.toggle('off', !voice.on); b.setAttribute('aria-pressed', String(voice.on)); }
  }

  // ---------- Time ----------
  function fmtClock(m) {
    const total = 600 + Math.floor(m), h24 = Math.floor(total / 60), mm = total % 60, h12 = h24 % 12 || 12;
    const s = `${h12}:${String(mm).padStart(2, '0')}`;
    if (lang === 'ne') return `${h24 < 12 ? 'बिहान' : h24 < 16 ? 'दिउँसो' : 'बेलुका'} ${digits(s)}`;
    return `${s} ${h24 >= 12 ? 'PM' : 'AM'}`;
  }

  // ---------- Bazaar generation ----------
  function genWorld(seed, lv) {
    const LV = LEVELS[lv], open = ALL_TOLES.slice(0, LV.toles);
    const R = mulberry32(seed);
    const rr = (a, b) => a + R() * (b - a);
    const rsh = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const items = {};
    for (const [id, it] of Object.entries(ITEMS)) {
      const step = stepFor(it.fair), fair = niceUp(it.fair * rr(0.92, 1.08), step);
      items[id] = { fair, step, hint: niceUp(fair * rr(0.93, 1.07), step) };
    }
    const slots = {};
    const shops = Object.keys(KEEPERS).filter((id) => open.includes(KEEPERS[id].tole)).map((id) => {
      const K = KEEPERS[id], pos = (slots[K.tole] = (slots[K.tole] ?? -1) + 1);
      let sells = [...K.sells];
      if (sells.length > 2) sells = rsh(sells).slice(0, Math.max(2, Math.round(sells.length * rr(0.55, 1))));
      const listings = {};
      for (const it of sells) {
        listings[it] = { item: it, openK: rr(K.open[0], K.open[1]), floorK: rr(K.floor[0], K.floor[1]) + (LV.hard || 0), open: 0, ask: 0, patience: 0, pmax: 0, rounds: 0, lastOffer: 0, calledBack: false, seen: false, hist: [] };
      }
      const shop = { id, pos, tole: K.tole, sells, listings, bohaniAt: R() < 0.3 ? 0 : rr(25, 230), chatted: false, mood: false, regular: 0, kickedUntil: -1, bossCalled: false, bluffs: 0, met: false, stock: K.stock || 0, sales: [] };
      if (K.stock) shop.sales = Array.from({ length: K.stock }, () => rr(K.sales[0], K.sales[1])).sort((a, b) => a - b);
      return shop;
    });
    const sellers = (it) => shops.filter((s) => s.sells.includes(it));
    let cand = Object.keys(ITEMS).filter((it) => sellers(it).length >= 2);
    if (cand.length < LV.items) cand = Object.keys(ITEMS).filter((it) => sellers(it).length >= 1);
    const bigs = rsh(cand.filter((it) => ITEMS[it].big && it !== 'goat')), smalls = rsh(cand.filter((it) => !ITEMS[it].big));
    const list = [];
    if (LV.goat && cand.includes('goat')) list.push('goat');
    else if (LV.big && bigs.length) list.push(bigs.shift());
    for (const it of [...smalls, ...bigs]) { if (list.length >= LV.items) break; if (!list.includes(it)) list.push(it); }
    const budget = niceUp(list.reduce((s, it) => s + items[it].fair, 0) * 1.12, 500);
    return {
      seed, level: lv, items, shops, list, budget, money: budget, target: niceUp(budget * LV.stars[0], 50), minutes: 0, rep: LV.rep || 0, tole: 'asan', pos: -1, route: [], coached: false,
      bought: {}, notes: [], news: [], used: new Set(), earned: new Set(), closingWarned: false, lateWarned: false, kindDone: false,
      stats: { lies: 0, caught: 0, offers: 0 },
    };
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

  // Minutes to walk from (tole, slot) to a shop: next door is quick, other toles follow the real streets.
  function walkFrom(tole, pos, shop) {
    if (shop.tole === tole) return 1 + Math.abs(shop.pos - pos);
    const T = TOLE[tole], U = TOLE[shop.tole];
    const m = T.sp.dist[U.n] + Math.hypot(T.x - mpt(T.n)[0], T.y - mpt(T.n)[1]) + Math.hypot(U.x - mpt(U.n)[0], U.y - mpt(U.n)[1]);
    return Math.max(2, Math.round(m / WALK_M_PER_MIN + 0.5 * (Math.abs(pos) + shop.pos)));
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
          label(`${fill(t('route'), { list: G.route.map((x) => KEEPERS[x.id].name[lang]).join(' → ') })} · ${fill(t('routeTotal'), { m: digits(routeMinutes(G.route)), n: digits(G.route.length) })}`);
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
    else if (voice.on && lang === 'ne' && voice.list.length && !voice.hasNepali()) addLine('sys', t('edgeHint'));
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
    const other = cite.other ? kname(cite.other) : lang === 'ne' ? 'अर्को पसल' : 'the other shop';
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
    ui.overTitle.lang = lang;
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
    const cur = lang === 'ne' ? 'रु.' : 'Rs';
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
      c.textContent = b[lang];
      el.appendChild(c);
    }
  }

  function renderLevels() {
    const prog = progress();
    const total = Object.values(prog).reduce((a, b) => a + b, 0);
    ui.starTotal.innerHTML = `${icon('star')}${digits(total)}/${digits(LEVELS.length * 3)}`;
    ui.monthName.textContent = lang === 'ne' ? 'कात्तिक २०८३' : 'Kartik 2083';
    if (!unlocked(selLevel)) selLevel = 0;
    ui.levels.innerHTML = '';
    LEVELS.forEach((LV, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      const open = unlocked(i), st = prog[i] || 0;
      b.type = 'button';
      b.className = `lvl${i === selLevel ? ' sel' : ''}${open && !st ? ' cur' : ''}${i === HOLIDAY ? ' holiday' : ''}`;
      b.disabled = !open;
      b.innerHTML = `<span class="n">${digits(i + 1)}</span><span class="cn">${esc(TITHI[lang][i])}</span><span class="nm">${esc(L(LEVEL_TEXT[i].name))}</span><span class="st">${[1, 2, 3].map((k) => icon('star', k <= st ? 'on' : '')).join('')}${open ? '' : icon('lock', 'lock')}</span>`;
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
    document.documentElement.lang = lang;
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

  // ---------- Audio (all generated) ----------
  const audio = {
    ac: null, master: null, noiseBuf: null, crowd: null, chatter: null, scene: 'menu',
    muted: !!store.get('mm_muted', false),
    timers: { cycle: 5, horn: 16, pigeon: 3, temple: 9, chat: 0 },
    init() {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ac = (this.ac = new AC());
        this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(ac.destination);
        const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        const loop = (type, freq, q) => {
          const s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
          const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
          const g = ac.createGain(); g.gain.value = 0;
          s.connect(f).connect(g).connect(this.master); s.start();
          return g;
        };
        this.crowd = loop('bandpass', 480, 0.6);
        this.chatter = loop('bandpass', 1400, 2.5);
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      this.setScene(this.scene);
    },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
    setScene(s) {
      this.scene = s;
      if (!this.ac) return;
      const now = this.ac.currentTime;
      this.crowd.gain.setTargetAtTime(s === 'lane' ? 0.07 : s === 'shop' ? 0.035 : 0.03, now, 0.6);
      this.chatter.gain.setTargetAtTime(s === 'lane' ? 0.012 : 0.006, now, 0.6);
    },
    now() { return this.ac.currentTime; },
    ok() { return this.ac && this.ac.state === 'running'; },
    tone(tm, f, dur, type, vol, f2) {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, tm); if (f2) o.frequency.exponentialRampToValueAtTime(f2, tm + dur);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + Math.min(0.03, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); o.stop(tm + dur + 0.02);
    },
    noise(tm, dur, type, f, vol, f2) {
      const s = this.ac.createBufferSource(); s.buffer = this.noiseBuf;
      const fl = this.ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, tm); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, tm + dur);
      const g = this.ac.createGain(); g.gain.setValueAtTime(vol, tm); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      s.connect(fl).connect(g).connect(this.master); s.start(tm, Math.random()); s.stop(tm + dur + 0.02);
    },
    flute(tm, f, dur, vol = 0.05) {
      const o = this.ac.createOscillator(), lfo = this.ac.createOscillator(), lg = this.ac.createGain(), g = this.ac.createGain();
      o.frequency.value = f; lfo.frequency.value = 5; lg.gain.value = f * 0.012; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.05);
      g.gain.setValueAtTime(vol, tm + Math.max(0.06, dur - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); lfo.start(tm); o.stop(tm + dur + 0.02); lfo.stop(tm + dur + 0.02);
    },
    madal(tm, low) { this.tone(tm, low ? 95 : 190, 0.18, 'sine', 0.22, low ? 60 : 140); this.noise(tm, 0.05, 'bandpass', low ? 300 : 900, 0.12); },
    tick() { if (!this.ok()) return; this.tone(this.now(), 1800, 0.03, 'square', 0.015); },
    blip(who) {
      if (!this.ok() || (voice.on && voice.pick(null) && !this.muted)) return; // voices already speak
      const p = (VOICE[who] || VOICE.me).pitch, tm = this.now();
      for (let k = 0; k < 4; k++) this.tone(tm + k * 0.08, 260 * p * rand(0.85, 1.25), 0.06, 'triangle', 0.035);
    },
    coin() { if (!this.ok()) return; const tm = this.now(); [2637, 3136, 3951].forEach((f, k) => this.tone(tm + k * 0.06, f, 0.25, 'sine', 0.05)); },
    deal() { if (!this.ok()) return; this.coin(); const tm = this.now() + 0.2; [1, 0, 1, 1].forEach((l, k) => this.madal(tm + k * 0.14, !l)); },
    bleat() {
      if (!this.ok()) return;
      const tm = this.now() + 0.5, o = this.ac.createOscillator(), lfo = this.ac.createOscillator(), lg = this.ac.createGain(), g = this.ac.createGain(), f = this.ac.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = 430; lfo.frequency.value = 11; lg.gain.value = 40; lfo.connect(lg).connect(o.frequency);
      f.type = 'lowpass'; f.frequency.value = 1600;
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(0.06, tm + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, tm + 0.7);
      o.connect(f).connect(g).connect(this.master); o.start(tm); lfo.start(tm); o.stop(tm + 0.75); lfo.stop(tm + 0.75);
    },
    caught() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 140, 0.5, 'sawtooth', 0.06, 70); this.noise(tm, 0.3, 'lowpass', 400, 0.2); },
    grumble() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 120, 0.35, 'sawtooth', 0.05, 90); this.noise(tm + 0.1, 0.25, 'bandpass', 600, 0.1); },
    callback() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 1100, 0.14, 'sine', 0.05, 1600); this.tone(tm + 0.2, 1100, 0.2, 'sine', 0.05, 1700); },
    footsteps(dur) { if (!this.ok()) return; const tm = this.now(), n = Math.max(2, Math.round(dur / 0.22)); for (let k = 0; k < n; k++) this.noise(tm + k * 0.22, 0.07, 'lowpass', 600, 0.2); },
    moo() { if (!this.ok()) return; const tm = this.now(); this.tone(tm, 150, 1.1, 'sawtooth', 0.04, 120); },
    bell() { const tm = this.now(); [2100, 2800].forEach((f) => { this.tone(tm, f, 0.4, 'sine', 0.025); this.tone(tm + 0.16, f, 0.5, 'sine', 0.025); }); },
    horn() { const tm = this.now(); for (const d of [0, 0.3]) { this.tone(tm + d, 440, 0.2, 'square', 0.015); this.tone(tm + d, 554, 0.2, 'square', 0.012); } },
    pigeon() { const tm = this.now(); this.tone(tm, 360, 0.25, 'sine', 0.035, 300); this.tone(tm + 0.3, 330, 0.4, 'sine', 0.03, 280); },
    temple() { const tm = this.now(); [[880, 0.04, 2.2], [1320, 0.02, 1.6], [2210, 0.01, 1]].forEach(([f, v, d]) => this.tone(tm, f, d, 'sine', v)); },
    ending(kind) {
      if (!this.ok()) return;
      const tm = this.now(), SC = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];
      const seq = kind === 'happy' ? [0, 2, 3, 4, 5, 4, 5] : kind === 'ok' ? [0, 1, 2, 3, 2, 3] : [3, 2, 1, 0];
      seq.forEach((i, k) => this.flute(tm + 0.3 + k * 0.3, SC[i], 0.32, 0.05));
      if (kind === 'happy') for (let k = 0; k < 8; k++) this.madal(tm + 0.3 + k * 0.26, k % 4 === 0);
    },
    tickAmb(dt) {
      if (!this.ok()) return;
      const T = this.timers, lane = state !== 'play' || view === 'lane';
      for (const k in T) T[k] -= dt;
      if (T.cycle <= 0) { if (lane) this.bell(); T.cycle = rand(9, 20); }
      if (T.horn <= 0) { if (lane && state === 'play') this.horn(); T.horn = rand(18, 40); }
      if (T.pigeon <= 0) { this.pigeon(); T.pigeon = rand(8, 18); }
      if (T.temple <= 0) { this.temple(); T.temple = rand(16, 30); }
    },
  };
  function setMuteUI() {
    for (const b of [ui.mute, ui.menuMute]) { if (!b) continue; b.innerHTML = icon(audio.muted ? 'soundOff' : 'sound'); b.classList.toggle('off', audio.muted); b.setAttribute('aria-pressed', String(audio.muted)); }
  }

  // ---------- Rendering ----------
  const FONT = '"Mukta", "Nirmala UI", "Noto Sans Devanagari", "Kohinoor Devanagari", Mangal, system-ui, sans-serif';
  const hudBottom = () => (state === 'play' && !ui.hud.classList.contains('hidden') ? ui.hud.getBoundingClientRect().bottom : 0);
  const FLAG = ['#1f6fd1', '#f4f4f4', '#e23b3b', '#2e9e5b', '#f5c518'];
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

  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
  const circle = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); };
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

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
  const PLASTER = ['#e8d6a8', '#efc7b2', '#c8dbc4', '#d9d0e6', '#f1e3c2', '#cfd9dd', '#f3d9a4', '#e6e0d0'];
  const BOARDS = {
    ne: ['दन्त क्लिनिक', 'टेलर्स', 'ट्युसन सेन्टर', 'गहना पसल', 'होलसेल', 'फोटो स्टुडियो', 'मनी ट्रान्सफर', 'मोबाइल पसल', 'कस्मेटिक', 'चस्मा घर'],
    en: ['DENTAL CLINIC', 'TAILORS', 'TUITION CENTRE', 'JEWELLERS', 'WHOLESALE', 'PHOTO STUDIO', 'MONEY TRANSFER', 'MOBILE SHOP', 'COSMETICS', 'OPTICIANS'],
  };
  const BOARD_COLS = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#ef6c00', '#00838f'];
  const SACHETS = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#fb8c00', '#8e24aa', '#ffffff', '#00acc1'];
  const SKINS = ['#b07a52', '#a86d45', '#c08458', '#9a6644', '#c68a5c', '#8d5a3a'];
  const CLOTH = ['#c62828', '#1565c0', '#2e7d32', '#6a1b9a', '#ef6c00', '#00838f', '#4e342e', '#ad1457', '#f9a825', '#37474f', '#e0e0e0', '#283593'];

  function shadeHex(hex, amt) {
    const n = parseInt(hex.slice(1), 16), f = (c) => clamp(Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt), 0, 255);
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function withCtx(o, fn) { const m = ctx; ctx = o; try { fn(); } finally { ctx = m; } }

  function makePerson(x) {
    const r = Math.random();
    const type = r < 0.3 ? 'man' : r < 0.52 ? 'woman' : r < 0.66 ? 'sari' : r < 0.78 ? 'porter' : r < 0.9 ? 'kid' : 'old';
    return {
      type, x, dir: Math.random() < 0.5 ? -1 : 1, sp: type === 'porter' || type === 'old' ? rand(0.06, 0.11) : rand(0.12, 0.28),
      row: (Math.random() * 3) | 0, ph: rand(0, TAU), skin: pick(SKINS), top: pick(CLOTH), shawl: pick(CLOTH),
      bottom: pick(['#263238', '#3e2723', '#455a64', '#1b1b1b', '#5d4037', '#efebe0']),
      topi: (type === 'man' || type === 'old') && Math.random() < 0.55, h: rand(0.94, 1.06),
    };
  }

  // Each house is drawn once into its own small canvas, then copied every frame (scaled to the street's current size).
  const facadeCache = new Map();
  function facade(i, shop, w = SW, gq = gy) {
    const key = `${i}|${shop ? shop.id : ''}|${Math.round(w / 6)}|${Math.round(gq / 6)}|${lang}|${DPR}`;
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

  function buildFacade(i, w, gq, shop) {
    const R = mulberry32(i * 7919 + 31);
    const K = shop ? KEEPERS[shop.id] : null;
    const style = K ? K.style || 'newari' : R() < 0.5 ? 'newari' : 'concrete';
    const gf = gq * 0.26, fl = gq * (0.145 + R() * 0.025);
    const floors = style === 'newari' ? 3 + (R() < 0.45 ? 1 : 0) : 3 + Math.floor(R() * 3);
    const top = -(gf + fl * floors);
    let col = null;
    if (style === 'newari') newariUpper(R, w, gf, fl, floors, top);
    else col = concreteUpper(R, w, gf, fl, floors, top);
    if (K && K.sign) shopFront(R, w, gf, K, i, K.cat);
    else shutterFront(R, w, gf, style);
    // afternoon sun from the left: the right side of each house falls into shade
    const sg = ctx.createLinearGradient(0, 0, w, 0);
    sg.addColorStop(0, 'rgba(255,236,200,0.10)'); sg.addColorStop(0.65, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(20,8,0,0.28)');
    ctx.fillStyle = sg; ctx.fillRect(0, top, w, -top);
    return { top, side: col ? shadeHex(col, -0.4) : '#6a2e1d' };
  }

  function woodBand(x, y, w, h) {
    ctx.fillStyle = '#3b2416'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(x, y, w, Math.max(1, h * 0.25));
    ctx.fillStyle = '#6b4528';
    const st = Math.max(4, h * 1.3);
    for (let k = x + st * 0.3; k < x + w; k += st) ctx.fillRect(k, y + h * 0.4, st * 0.45, h * 0.45);
  }

  function carvedWindow(x, y, ww, wh, panels, R) {
    const ext = ww * 0.14;
    ctx.fillStyle = '#2a170e';
    ctx.fillRect(x - ext, y - wh * 0.12, ww + ext * 2, wh * 0.11);
    ctx.fillRect(x - ext * 0.7, y + wh, ww + ext * 1.4, wh * 0.09);
    ctx.fillStyle = '#4a2c1a';
    ctx.beginPath(); ctx.ellipse(x + ww / 2, y - wh * 0.12, ww * 0.3, wh * 0.15, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#3b2416'; ctx.fillRect(x - ww * 0.04, y - wh * 0.02, ww * 1.08, wh * 1.04);
    const pw = ww / panels;
    for (let k = 0; k < panels; k++) {
      const px = x + k * pw + pw * 0.08, pww = pw * 0.84, py = y + wh * 0.06, ph = wh * 0.88;
      const open = R() < 0.22;
      ctx.fillStyle = open ? '#140b06' : '#5b3a24'; ctx.fillRect(px, py, pww, ph);
      if (!open) {
        ctx.save(); ctx.beginPath(); ctx.rect(px, py, pww, ph); ctx.clip();
        ctx.strokeStyle = '#22130a'; ctx.lineWidth = Math.max(1, pww * 0.06);
        const st = Math.max(4, pww / 4);
        for (let d = -ph; d < pww + ph; d += st) {
          ctx.beginPath(); ctx.moveTo(px + d, py); ctx.lineTo(px + d + ph, py + ph); ctx.moveTo(px + d, py + ph); ctx.lineTo(px + d + ph, py); ctx.stroke();
        }
        ctx.restore();
      } else if (R() < 0.6) { ctx.fillStyle = 'rgba(255,196,120,0.22)'; ctx.fillRect(px + pww * 0.2, py + ph * 0.25, pww * 0.6, ph * 0.55); }
      ctx.strokeStyle = '#7a5232'; ctx.lineWidth = 1; ctx.strokeRect(px, py, pww, ph);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px, py, pww, Math.max(2, ph * 0.08)); ctx.fillRect(px, py, Math.max(2, pww * 0.1), ph);
    }
  }

  function newariUpper(R, w, gf, fl, floors, top) {
    ctx.fillStyle = '#6a321f'; ctx.fillRect(0, top, w, -top);
    const bh = Math.max(3, fl * 0.07), bw = bh * 2.4;
    let row = 0;
    for (let y = top; y < 0; y += bh, row++) {
      for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
        const v = R();
        ctx.fillStyle = v < 0.3 ? '#a3502f' : v < 0.6 ? '#94442a' : v < 0.92 ? '#9b4a2c' : '#7d3a22';
        ctx.fillRect(x + 0.6, y + 0.6, bw - 1.2, bh - 1.2);
      }
    }
    for (let f = 0; f < floors; f++) {
      const yb = -gf - f * fl, yt = yb - fl;
      woodBand(-w * 0.02, yb - fl * 0.08, w * 1.04, fl * 0.08);
      if (f === 0) carvedWindow(w * 0.14, yt + fl * 0.2, w * 0.72, fl * 0.6, 3, R);
      else if (f === floors - 1) { const n = w > 150 ? 3 : 2; for (let k = 0; k < n; k++) carvedWindow(w * ((k + 0.5) / n) - w * 0.08, yt + fl * 0.3, w * 0.16, fl * 0.42, 1, R); }
      else for (let k = 0; k < 2; k++) carvedWindow(w * (k ? 0.6 : 0.14), yt + fl * 0.18, w * 0.26, fl * 0.58, 1, R);
    }
    // tiled roof with carved struts
    const eh = fl * 0.34;
    ctx.fillStyle = '#3a1f14';
    poly([[-w * 0.09, top], [w * 1.09, top], [w * 1.0, top - eh], [0, top - eh]]);
    ctx.fillStyle = '#5c2d1b';
    for (let r2 = 1; r2 < 5; r2++) { const y = top - eh + (r2 * eh) / 5, k = r2 / 5; ctx.fillRect(-w * 0.09 * k, y, w + w * 0.18 * k, Math.max(1, eh * 0.06)); }
    ctx.strokeStyle = '#2a170e'; ctx.lineWidth = Math.max(2, w * 0.016);
    for (let k = 0; k <= 5; k++) { const x = w * (k / 5); ctx.beginPath(); ctx.moveTo(x * 0.9 + w * 0.05, top + fl * 0.34); ctx.lineTo(x * 1.14 - w * 0.07, top + 1); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, top, 0, top + fl * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, top, w, fl * 0.5);
  }

  function glassWindow(x, y, ww, wh, grill, R) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - ww * 0.12, y - wh * 0.02, ww * 1.24, wh * 0.14); // shadow under the sunshade
    ctx.fillStyle = '#cfcfcf'; ctx.fillRect(x - 2, y - 2, ww + 4, wh + 4);
    const g = ctx.createLinearGradient(x, y, x + ww, y + wh);
    g.addColorStop(0, '#86a9bd'); g.addColorStop(1, '#2c4656');
    ctx.fillStyle = g; ctx.fillRect(x, y, ww, wh);
    if (R() < 0.5) { ctx.fillStyle = pick(['#c2185b', '#f9a825', '#7cb342', '#8e24aa']); ctx.globalAlpha = 0.7; ctx.fillRect(x, y, ww * 0.3, wh); ctx.globalAlpha = 1; }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; poly([[x + ww * 0.55, y], [x + ww * 0.75, y], [x + ww * 0.35, y + wh], [x + ww * 0.15, y + wh]]);
    ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x + ww / 2 - 1, y, 2, wh);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y, ww, Math.max(2, wh * 0.1)); ctx.fillRect(x, y, Math.max(2, ww * 0.06), wh);
    if (grill) { ctx.fillStyle = '#263238'; for (let k = x + 3; k < x + ww; k += Math.max(4, ww / 7)) ctx.fillRect(k, y, 1.5, wh); }
    ctx.fillStyle = '#bdbdbd'; ctx.fillRect(x - ww * 0.12, y - wh * 0.14, ww * 1.24, wh * 0.1); // concrete sunshade
  }

  function concreteUpper(R, w, gf, fl, floors, top) {
    const col = PLASTER[Math.floor(R() * PLASTER.length)];
    ctx.fillStyle = col; ctx.fillRect(0, top, w, -top);
    for (let k = 0; k < 5; k++) { // rain streaks and grime
      const sx = R() * w, sw = w * (0.04 + R() * 0.12), len = (-top - gf) * (0.3 + R() * 0.6);
      const g = ctx.createLinearGradient(0, top, 0, top + len);
      g.addColorStop(0, 'rgba(60,50,40,0.22)'); g.addColorStop(1, 'rgba(60,50,40,0)');
      ctx.fillStyle = g; ctx.fillRect(sx, top, sw, len);
    }
    if (R() < 0.5) { // plaster fallen off, bricks showing
      const px = R() * w * 0.6, py = top + (-top - gf) * R() * 0.7, pw = w * 0.2, ph = fl * 0.3;
      ctx.fillStyle = '#9b4a2c'; ctx.beginPath(); ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0.2, 0, TAU); ctx.fill();
    }
    const boardFloor = R() < 0.65 ? Math.floor(R() * Math.min(2, floors)) : -1;
    for (let f = 0; f < floors; f++) {
      const yb = -gf - f * fl, yt = yb - fl;
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(0, yb - 2, w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, yb - fl * 0.06, w, 1.5);
      const n = w > 150 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const ww = w * (n === 2 ? 0.3 : 0.5), x = n === 2 ? w * (k ? 0.6 : 0.1) : w * 0.25;
        glassWindow(x, yt + fl * 0.26, ww, fl * 0.5, f < 2, R);
      }
      if (f === boardFloor) {
        const bc = BOARD_COLS[Math.floor(R() * BOARD_COLS.length)], bh = fl * 0.24, by = yb - fl * 0.3;
        ctx.fillStyle = bc; ctx.fillRect(w * 0.06, by, w * 0.88, bh);
        ctx.fillStyle = bc === '#f9a825' ? '#1b1b1b' : '#ffffff';
        ctx.font = `800 ${Math.round(bh * 0.55)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(BOARDS[lang][Math.floor(R() * BOARDS[lang].length)], w / 2, by + bh * 0.52, w * 0.82);
      }
      if (f === 1 && R() < 0.65) { // balcony with railing and laundry
        const by = yb - fl * 0.05;
        const bsh = ctx.createLinearGradient(0, by + fl * 0.07, 0, by + fl * 0.3); bsh.addColorStop(0, 'rgba(0,0,0,0.3)'); bsh.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bsh; ctx.fillRect(0, by + fl * 0.07, w, fl * 0.23);
        ctx.fillStyle = shadeHex(col, -0.2); ctx.fillRect(-w * 0.03, by, w * 1.06, fl * 0.07);
        ctx.fillStyle = shadeHex(col, -0.45); ctx.fillRect(-w * 0.03, by + fl * 0.05, w * 1.06, fl * 0.025);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(-w * 0.03, by - fl * 0.32, w * 1.06, 2);
        for (let k = -w * 0.03; k < w * 1.03; k += Math.max(5, w / 16)) ctx.fillRect(k, by - fl * 0.32, 1.5, fl * 0.32);
        ctx.strokeStyle = 'rgba(40,40,40,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, by - fl * 0.55); ctx.quadraticCurveTo(w / 2, by - fl * 0.48, w, by - fl * 0.55); ctx.stroke();
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = pick(CLOTH); const cx = w * (0.12 + k * 0.18);
          ctx.fillRect(cx, by - fl * 0.53, w * 0.1, fl * (0.14 + R() * 0.12));
        }
      }
    }
    // flat roof: parapet, black water tank, rebar waiting for the next floor
    ctx.fillStyle = shadeHex(col, -0.15); ctx.fillRect(-2, top - fl * 0.07, w + 4, fl * 0.07);
    const tx = w * (0.15 + R() * 0.5), tw = w * 0.2, th = fl * 0.42;
    ctx.fillStyle = '#1c1c1c'; rr(tx, top - fl * 0.07 - th, tw, th, tw * 0.15); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let k = 1; k < 4; k++) ctx.fillRect(tx, top - fl * 0.07 - th + (k * th) / 4, tw, 1.5);
    ctx.fillRect(tx + tw * 0.15, top - fl * 0.07 - th, tw * 0.08, th);
    ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 1.2;
    for (const rx of [w * 0.03, w * 0.06, w * 0.94, w * 0.97]) { ctx.beginPath(); ctx.moveTo(rx, top - fl * 0.07); ctx.lineTo(rx + (R() - 0.5) * 3, top - fl * 0.07 - fl * (0.25 + R() * 0.2)); ctx.stroke(); }
    if (R() < 0.4) { ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.ellipse(w * 0.82, top - fl * 0.2, fl * 0.12, fl * 0.09, -0.5, 0, TAU); ctx.fill(); }
    return col;
  }

  function hangingGoods(id, x, y, w, h, R) {
    ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x + w * 0.04, y + h * 0.05); ctx.lineTo(x + w * 0.96, y + h * 0.05); ctx.stroke();
    if (id === 'cloth' || id === 'readymade') { // clothes on hangers
      for (let k = 0; k < 7; k++) {
        const cx = x + w * (0.1 + k * 0.13), c = pick(CLOTH), cw = w * 0.1, ch = h * 0.3;
        ctx.strokeStyle = '#9e9e9e'; ctx.beginPath(); ctx.moveTo(cx, y + h * 0.05); ctx.lineTo(cx, y + h * 0.09); ctx.stroke();
        ctx.fillStyle = c; poly([[cx - cw * 0.5, y + h * 0.1], [cx + cw * 0.5, y + h * 0.1], [cx + cw * 0.4, y + h * 0.1 + ch], [cx - cw * 0.4, y + h * 0.1 + ch]]);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx - 0.5, y + h * 0.1, 1, ch);
      }
    } else if (id === 'kite') {
      for (let k = 0; k < 6; k++) drawKite(x + w * (0.12 + k * 0.15), y + h * (0.2 + (k % 2) * 0.08), h * 0.09, pick(FLAG), pick(['#e23b3b', '#1f6fd1', '#f5c518']), 0, true);
    } else if (id === 'brass') {
      for (let k = 0; k < 7; k++) {
        const cx = x + w * (0.1 + k * 0.13), r = h * (0.06 + R() * 0.04);
        ctx.strokeStyle = '#9e9e9e'; ctx.beginPath(); ctx.moveTo(cx, y + h * 0.05); ctx.lineTo(cx, y + h * 0.12); ctx.stroke();
        ctx.fillStyle = k % 3 === 2 ? '#b0643a' : '#d4a017'; circle(cx, y + h * 0.12 + r, r);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; circle(cx - r * 0.35, y + h * 0.12 + r * 0.7, r * 0.25);
      }
    } else if (id === 'goat') {
      ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) { const cx = x + w * (0.2 + k * 0.2); ctx.beginPath(); ctx.ellipse(cx, y + h * 0.18, w * 0.04, h * 0.1, 0, 0, TAU); ctx.stroke(); }
    } else { // sachet strips and chilli garlands, the look of every Kathmandu grocery
      for (let k = 0; k < 9; k++) {
        const cx = x + w * (0.07 + k * 0.1), n = 4 + Math.floor(R() * 4);
        if (k % 3 === 1 && R() < 0.6) { ctx.fillStyle = '#c62828'; for (let j = 0; j < n + 2; j++) { ctx.beginPath(); ctx.ellipse(cx, y + h * (0.1 + j * 0.045), w * 0.012, h * 0.025, 0, 0, TAU); ctx.fill(); } continue; }
        const c = SACHETS[Math.floor(R() * SACHETS.length)];
        for (let j = 0; j < n; j++) { ctx.fillStyle = j % 2 ? c : shadeHex(c, -0.15); ctx.fillRect(cx - w * 0.025, y + h * (0.08 + j * 0.055), w * 0.05, h * 0.05); }
      }
    }
  }

  function shopFront(R, w, gf, K, i, id) {
    const sx = w * 0.04, sw = w * 0.92, oh = gf * 0.72, oy = -oh;
    // wall around the opening
    ctx.fillStyle = '#6f6a62'; ctx.fillRect(0, -gf, w, gf);
    const g = ctx.createLinearGradient(0, oy, 0, 0);
    g.addColorStop(0, '#120a05'); g.addColorStop(1, '#33200f');
    ctx.fillStyle = g; ctx.fillRect(sx, oy, sw, oh);
    for (let r = 0; r < 3; r++) { // shelves at the back
      const y = oy + oh * (0.3 + r * 0.2);
      ctx.fillStyle = '#4a2f1c'; ctx.fillRect(sx + 3, y, sw - 6, Math.max(2, oh * 0.015));
      ctx.globalAlpha = 0.5;
      for (let x = sx + 5; x < sx + sw - 8; x += oh * (0.05 + R() * 0.03)) {
        const bh = oh * (0.05 + R() * 0.07);
        ctx.fillStyle = SACHETS[Math.floor(R() * SACHETS.length)]; ctx.fillRect(x, y - bh, oh * 0.04, bh);
      }
      ctx.globalAlpha = 1;
    }
    const lg = ctx.createRadialGradient(sx + sw / 2, oy + 4, 1, sx + sw / 2, oy + 4, sw * 0.5);
    lg.addColorStop(0, 'rgba(230,245,255,0.35)'); lg.addColorStop(1, 'rgba(230,245,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(sx, oy, sw, oh);
    ctx.fillStyle = '#eef6ff'; ctx.fillRect(sx + sw * 0.38, oy + 3, sw * 0.24, 2.5);
    hangingGoods(id, sx, oy, sw, oh, R);
    // shutter tracks and the rolled-up shutter
    ctx.fillStyle = '#5f6469'; ctx.fillRect(sx - 2, oy, 3, oh); ctx.fillRect(sx + sw - 1, oy, 3, oh);
    ctx.fillStyle = '#7d8288'; rr(sx - 3, oy - oh * 0.1, sw + 6, oh * 0.11, oh * 0.05); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 1; k < 4; k++) ctx.fillRect(sx - 3, oy - oh * 0.1 + (k * oh * 0.11) / 4, sw + 6, 1);
    // signboard
    const bh = gf * 0.22, by = -gf * 0.985;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(w * 0.03, by + bh, w * 0.96, bh * 0.16);
    ctx.fillStyle = K.color; ctx.fillRect(w * 0.02, by, w * 0.96, bh);
    ctx.fillStyle = shadeHex(K.color, -0.45); ctx.fillRect(w * 0.02, by + bh * 0.9, w * 0.96, bh * 0.1);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.strokeRect(w * 0.035, by + 2, w * 0.93, bh - 4);
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(bh * 0.5)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(L(K.sign), w / 2, by + bh * 0.42, w * 0.86);
    ctx.fillStyle = '#ffe082'; ctx.font = `600 ${Math.round(bh * 0.2)}px ${FONT}`;
    const phone = `01-42${String(10000 + Math.floor(hash(i + 3) * 89999))}`;
    ctx.fillText(lang === 'ne' ? `फोन: ${digits(phone)}` : `Ph: ${phone}`, w / 2, by + bh * 0.82, w * 0.8);
    // blue plastic tarp sheltering the front
    const tarp = R() < 0.65 ? '#1e66b0' : '#2f7d4a';
    const tsh = ctx.createLinearGradient(0, oy + oh * 0.13, 0, oy + oh * 0.45); tsh.addColorStop(0, 'rgba(0,0,0,0.4)'); tsh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tsh; ctx.fillRect(sx, oy + oh * 0.13, sw, oh * 0.32);
    ctx.fillStyle = shadeHex(tarp, -0.4); ctx.fillRect(-w * 0.08, oy + oh * 0.13, w * 1.16, Math.max(2, oh * 0.025));
    ctx.fillStyle = tarp;
    poly([[sx - w * 0.02, oy - oh * 0.06], [sx + sw + w * 0.02, oy - oh * 0.06], [w * 1.08, oy + oh * 0.13], [-w * 0.08, oy + oh * 0.13]]);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let k = 0; k < 4; k++) { const x0 = -w * 0.06 + (w * 1.12 * (k + 0.3)) / 4; poly([[x0, oy + oh * 0.13], [x0 + w * 0.05, oy + oh * 0.13], [x0 + w * 0.04, oy - oh * 0.05], [x0 + w * 0.02, oy - oh * 0.05]]); }
  }

  function shutterFront(R, w, gf, style) {
    ctx.fillStyle = style === 'newari' ? '#5a2a1a' : '#6f6a62'; ctx.fillRect(0, -gf, w, gf);
    const sx = w * 0.05, sw = w * 0.9, oh = gf * 0.82;
    const col = ['#7b8087', '#6b7f73', '#7a6f8a', '#8a7f6a', '#5d7a8c'][Math.floor(R() * 5)];
    ctx.fillStyle = col; ctx.fillRect(sx, -oh, sw, oh);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = -oh + 3; y < 0; y += 4) ctx.fillRect(sx, y, sw, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(sx, -oh, sw * 0.4, oh);
    ctx.fillStyle = '#4a4f55'; ctx.fillRect(sx, -oh * 0.06, sw, oh * 0.06);
    if (R() < 0.7) { // posters glued on the shutter
      for (let k = 0; k < 2; k++) {
        const px = sx + sw * (0.15 + R() * 0.55), py = -oh * (0.75 - R() * 0.2), pw = sw * 0.16, ph = oh * 0.22;
        ctx.fillStyle = pick(['#f5f0e6', '#ffe082', '#ffccbc']); ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = pick(['#c62828', '#1565c0', '#2e7d32']); ctx.fillRect(px + pw * 0.1, py + ph * 0.12, pw * 0.8, ph * 0.22);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let j = 0; j < 3; j++) ctx.fillRect(px + pw * 0.1, py + ph * (0.48 + j * 0.15), pw * 0.8, 1);
      }
    }
    ctx.fillStyle = '#c9a227'; ctx.fillRect(sx + sw / 2 - 3, -oh * 0.1, 6, 7);
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
  function buildTemple(T) {
    const gold = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#fbe08a'); g.addColorStop(0.45, '#d9a51e'); g.addColorStop(1, '#8a6508'); return g; };
    let y = 0;
    // the big bell on its frame, beside the temple
    const bx = -T * 0.92;
    ctx.fillStyle = '#4a2f1c'; ctx.fillRect(bx - T * 0.14, -T * 0.42, T * 0.025, T * 0.42); ctx.fillRect(bx + T * 0.12, -T * 0.42, T * 0.025, T * 0.42);
    ctx.fillRect(bx - T * 0.16, -T * 0.44, T * 0.32, T * 0.03);
    ctx.fillStyle = '#8d6e3f'; ctx.beginPath(); ctx.moveTo(bx - T * 0.07, -T * 0.2); ctx.quadraticCurveTo(bx - T * 0.07, -T * 0.38, bx, -T * 0.38); ctx.quadraticCurveTo(bx + T * 0.07, -T * 0.38, bx + T * 0.07, -T * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,160,0.35)'; ctx.fillRect(bx - T * 0.04, -T * 0.36, T * 0.015, T * 0.14);
    // stone plinth
    for (const [sw, sh] of [[1.5, 0.035], [1.32, 0.035], [1.14, 0.035]]) {
      ctx.fillStyle = '#8f8a80'; ctx.fillRect((-sw * T) / 2, y - sh * T, sw * T, sh * T);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect((-sw * T) / 2, y - sh * T, sw * T, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect((-sw * T) / 2, y - 2, sw * T, 2);
      y -= sh * T;
    }
    // ground shrine: brick walls, gilded doorway, torana, garland
    const b1w = 0.8 * T, b1h = 0.3 * T;
    ctx.fillStyle = '#93452b'; ctx.fillRect(-b1w / 2, y - b1h, b1w, b1h);
    ctx.fillStyle = 'rgba(60,20,10,0.35)'; for (let k = y - b1h + 4; k < y; k += 5) ctx.fillRect(-b1w / 2, k, b1w, 1);
    for (const px of [-0.36, -0.2, 0.2, 0.36]) { ctx.fillStyle = '#3b2416'; ctx.fillRect(px * T - T * 0.025, y - b1h, T * 0.05, b1h); }
    ctx.fillStyle = gold(y - b1h * 0.8, y); ctx.fillRect(-T * 0.14, y - b1h * 0.78, T * 0.28, b1h * 0.78);
    ctx.fillStyle = '#1a0f09'; ctx.fillRect(-T * 0.1, y - b1h * 0.68, T * 0.2, b1h * 0.68);
    const glow = ctx.createRadialGradient(0, y - b1h * 0.35, 1, 0, y - b1h * 0.35, T * 0.1);
    glow.addColorStop(0, 'rgba(255,170,60,0.9)'); glow.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = glow; ctx.fillRect(-T * 0.1, y - b1h * 0.68, T * 0.2, b1h * 0.68);
    ctx.fillStyle = gold(y - b1h, y - b1h * 0.7); ctx.beginPath(); ctx.ellipse(0, y - b1h * 0.78, T * 0.17, T * 0.1, 0, Math.PI, TAU); ctx.fill();
    for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? '#ffb300' : '#ef6c00'; circle(-T * 0.16 + (k * T * 0.32) / 8, y - b1h * 0.75 + Math.sin((k / 8) * Math.PI) * T * 0.04, T * 0.018); }
    y -= b1h;
    // three gilded roofs
    const tiers = [[1.3, 0.15, 0.56, 0.13], [1.0, 0.13, 0.4, 0.11], [0.74, 0.12, 0, 0]];
    let ti = 0;
    for (const [rw, rh, bw, bh] of tiers) {
      const topW = (bw || 0.22) * T;
      ctx.strokeStyle = '#2a170e'; ctx.lineWidth = Math.max(2, T * 0.012);
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * topW * 0.22, y + T * 0.07); ctx.lineTo(k * rw * T * 0.2, y + 2); ctx.stroke(); }
      ctx.fillStyle = gold(y - rh * T, y);
      poly([[(-rw * T) / 2, y], [(rw * T) / 2, y], [topW / 2, y - rh * T], [-topW / 2, y - rh * T]]);
      ctx.strokeStyle = 'rgba(110,70,0,0.45)'; ctx.lineWidth = 1;
      for (let k = 0; k <= 14; k++) { const tt = k / 14; ctx.beginPath(); ctx.moveTo(lerp(-rw * T / 2, rw * T / 2, tt), y); ctx.lineTo(lerp(-topW / 2, topW / 2, tt), y - rh * T); ctx.stroke(); }
      ctx.fillStyle = '#5a3a0a'; ctx.fillRect((-rw * T) / 2, y - 1.5, rw * T, 3);
      ctx.fillStyle = '#e8b923';
      for (let k = 0; k <= 16; k++) { const bx2 = lerp(-rw * T / 2, rw * T / 2, k / 16); ctx.fillRect(bx2 - 0.75, y, 1.5, T * 0.025); circle(bx2, y + T * 0.03, T * 0.008); }
      y -= rh * T;
      if (bw) {
        ctx.fillStyle = '#93452b'; ctx.fillRect((-bw * T) / 2, y - bh * T, bw * T, bh * T);
        ctx.fillStyle = gold(y - bh * T, y);
        for (const wx of ti === 0 ? [-0.15, 0, 0.15] : [-0.08, 0.08]) ctx.fillRect(wx * T - T * 0.035, y - bh * T * 0.8, T * 0.07, bh * T * 0.6);
        y -= bh * T;
      }
      ti++;
    }
    // gajur: the golden pinnacle
    ctx.fillStyle = gold(y - T * 0.28, y);
    circle(0, y - T * 0.04, T * 0.05);
    poly([[-T * 0.07, y - T * 0.08], [T * 0.07, y - T * 0.08], [0, y - T * 0.18]]);
    circle(0, y - T * 0.19, T * 0.025);
    poly([[-T * 0.012, y - T * 0.2], [T * 0.012, y - T * 0.2], [0, y - T * 0.28]]);
    // the long gilded banner (pataka) hanging from the top down the front
    const by0 = y - T * 0.02, by1 = -T * 0.105 - b1h * 0.98;
    ctx.fillStyle = gold(by0, by1);
    ctx.fillRect(-T * 0.022, by0, T * 0.044, by1 - by0);
    ctx.fillStyle = 'rgba(90,58,10,0.6)';
    for (let k = by0 + T * 0.04; k < by1; k += T * 0.05) ctx.fillRect(-T * 0.022, k, T * 0.044, 1.2);
    // pigeons resting on the roofs
    ctx.fillStyle = '#7d838c';
    for (let k = 0; k < 7; k++) { const px = (k / 6 - 0.5) * T * 0.9, py = -T * 0.405 - (k % 3) * T * 0.002; ctx.beginPath(); ctx.ellipse(px, py - T * 0.012, T * 0.016, T * 0.01, 0, 0, TAU); ctx.fill(); }
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
  function mapLabel(text, x, y, size, col, weight, noHalo) {
    ctx.font = `${weight || 700} ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (!noHalo) { ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,250,240,0.92)'; ctx.strokeText(text, x, y); }
    ctx.fillStyle = col; ctx.fillText(text, x, y);
  }
  // The map is printed in the patro's two inks: black streets on paper, red for what matters to you.
  // The paper, ponds, parks and streets never change, so they are drawn once per map size into a spare canvas
  // (lined up with the screen's device pixels) and copied every frame.
  const mapBase = { mini: null, full: null };
  function drawMapBase(rect, full, f, X, Y) {
    const INK = '#141414', PAPER = '#fdfcf8';
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.fillStyle = '#f1efe8'; ctx.fill(); ctx.clip();
    for (const a of MAP.a) {
      ctx.beginPath();
      for (let i = 0; i < a.p.length; i += 2) { if (i) ctx.lineTo(X(a.p[i]), Y(a.p[i + 1])); else ctx.moveTo(X(a.p[i]), Y(a.p[i + 1])); }
      ctx.closePath();
      ctx.fillStyle = PAPER; ctx.fill();
      ctx.save(); ctx.clip();
      const bx = Math.min(...a.p.filter((_, i) => i % 2 === 0).map(X)), by = Math.min(...a.p.filter((_, i) => i % 2 === 1).map(Y));
      const ex = Math.max(...a.p.filter((_, i) => i % 2 === 0).map(X)), ey = Math.max(...a.p.filter((_, i) => i % 2 === 1).map(Y));
      ctx.strokeStyle = 'rgba(20,20,20,0.35)'; ctx.lineWidth = 1;
      if (a.k === 'water') { for (let y = by; y < ey; y += 4) { ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(ex, y); ctx.stroke(); } }
      else { ctx.fillStyle = 'rgba(20,20,20,0.3)'; for (let y = by; y < ey; y += 7) for (let x = bx + ((y / 7) % 2) * 3.5; x < ex; x += 7) ctx.fillRect(x, y, 1.2, 1.2); }
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    }
    const wd = (c) => Math.max(full ? 2.5 : 1.1, (c === 3 ? 10 : c === 2 ? 7 : 5) * f.sc);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (const r of MAP.r) {
        ctx.strokeStyle = pass ? PAPER : INK;
        ctx.lineWidth = wd(r[0]) + (pass ? 0 : full ? 2 : 1);
        ctx.beginPath();
        for (let k = 1; k < r.length; k++) { const [x, y] = mpt(r[k]); if (k > 1) ctx.lineTo(X(x), Y(y)); else ctx.moveTo(X(x), Y(y)); }
        ctx.stroke();
      }
    }
  }
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
  function drawDharahara(x, base, h) {
    const bw = h * 0.15, tw = h * 0.09, sh = h * 0.78;
    ctx.fillStyle = '#efece6'; poly([[x - bw / 2, base], [x + bw / 2, base], [x + tw / 2, base - sh], [x - tw / 2, base - sh]]);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; poly([[x + bw * 0.1, base], [x + bw / 2, base], [x + tw / 2, base - sh], [x + tw * 0.05, base - sh]]);
    ctx.fillStyle = 'rgba(120,110,100,0.35)';
    for (let k = 1; k < 8; k++) { const y = base - (sh * k) / 8, w2 = lerp(bw, tw, k / 8); ctx.fillRect(x - w2 / 2, y, w2, 1.5); }
    ctx.fillStyle = '#d8d3ca'; ctx.fillRect(x - tw * 0.85, base - sh * 0.86, tw * 1.7, h * 0.025);
    ctx.fillStyle = '#c9961a'; poly([[x - tw * 0.45, base - sh], [x + tw * 0.45, base - sh], [x, base - h]]);
    circle(x, base - sh - h * 0.02, tw * 0.3);
  }
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

  function drawKite(x, y, s, c, c2, ph, noString) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(ph * 1.3) * 0.15);
    ctx.fillStyle = c; poly([[0, -s], [s * 0.8, 0], [0, s * 1.1], [-s * 0.8, 0]]);
    ctx.fillStyle = c2; poly([[0, -s], [s * 0.8, 0], [0, 0]]);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, s * 1.1);
    for (let k = 1; k < 6; k++) ctx.lineTo(Math.sin(ph * 3 + k) * s * 0.3, s * 1.1 + k * s * 0.35);
    ctx.stroke();
    ctx.restore();
    if (!noString) { ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x, y + s); ctx.lineTo(x - s * 6, y + s * 14); ctx.stroke(); }
  }

  function drawPigeon(x, y, s, ph) {
    const peck = Math.max(0, Math.sin(ph * 2)) * s * 0.5;
    ctx.fillStyle = '#8a8f99'; ctx.beginPath(); ctx.ellipse(x, y - s, s * 1.3, s * 0.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5f6670'; ctx.beginPath(); ctx.ellipse(x - s * 0.9, y - s * 1.1, s * 0.6, s * 0.3, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6d7480'; circle(x + s * 1.1, y - s * 1.4 + peck, s * 0.55);
    ctx.fillStyle = '#4f7f6a'; circle(x + s * 0.8, y - s * 1.2 + peck * 0.5, s * 0.3);
    ctx.fillStyle = '#e0a020'; ctx.fillRect(x + s * 1.6, y - s * 1.4 + peck, s * 0.4, s * 0.15);
  }

  function drawDhaka(x, y, w, h) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = '#b71c1c'; ctx.fillRect(x, y, w, h);
    const c = Math.max(3, w / 4);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#1b1b1b' : '#f5f0e6';
      const cx = x + i * c, cy = y + j * c;
      poly([[cx, cy - c * 0.3], [cx + c * 0.3, cy], [cx, cy + c * 0.3], [cx - c * 0.3, cy]]);
    }
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

  function drawGoat(x, y, s, flip, col, ph) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    const step = ph ? Math.sin(ph) * s * 0.08 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(s * 0.05, 0, s * 0.6, s * 0.08, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [lx, d] of [[-0.35, 1], [-0.2, -1], [0.22, 1], [0.36, -1]]) { ctx.moveTo(lx * s, -s * 0.4); ctx.lineTo(lx * s + d * step, 0); }
    ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -s * 0.55, s * 0.5, s * 0.25, 0, 0, TAU); ctx.fill();
    if (col !== '#3e2723') { ctx.fillStyle = 'rgba(93,64,55,0.45)'; ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.6, s * 0.15, s * 0.1, 0.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * 0.35, -s * 0.65); ctx.lineTo(s * 0.55, -s * 0.95); ctx.lineTo(s * 0.68, -s * 0.85); ctx.lineTo(s * 0.5, -s * 0.5); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.66, -s * 0.9, s * 0.17, s * 0.11, 0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8d7b6a'; ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.beginPath(); ctx.moveTo(s * 0.58, -s * 1.0); ctx.quadraticCurveTo(s * 0.5, -s * 1.2, s * 0.38, -s * 1.12); ctx.stroke();
    ctx.fillStyle = '#1b1b1b'; circle(s * 0.68, -s * 0.94, Math.max(1, s * 0.03));
    ctx.fillStyle = col === '#3e2723' ? '#5d4037' : '#d7ccc8'; poly([[s * 0.74, -s * 0.82], [s * 0.8, -s * 0.66], [s * 0.7, -s * 0.8]]);
    ctx.fillStyle = col; poly([[-s * 0.48, -s * 0.62], [-s * 0.62, -s * 0.78], [-s * 0.5, -s * 0.55]]);
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
    ctx.fillStyle = '#fafafa'; ctx.fillText(lang === 'ne' ? 'कात्तिक' : 'Kartik', cx + cw / 2, cyy + cw * 0.09, cw * 0.9);
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
  ui.lang.addEventListener('click', () => { lang = lang === 'en' ? 'ne' : 'en'; store.set('mm_lang', lang); applyLang(); });
  ui.meVoice.addEventListener('click', () => {
    voice.me = voice.me === 'f' ? 'm' : 'f';
    store.set('mm_mevoice', voice.me);
    applyLang();
    voice.stop();
    voice.say(lang === 'ne' ? 'नमस्ते! यो खसी कति हो?' : 'Namaste! How much is this goat?', 'me');
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
    if (e.code === 'KeyM') { audio.init(); audio.setMuted(!audio.muted); store.set('mm_muted', audio.muted); setMuteUI(); return; }
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
    audio.tickAmb(dt);
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
