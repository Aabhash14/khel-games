// Language: the menu toggle switches between Nepali and English. All interface text, numbers in Devanagari, prices, the clock.
(() => {
  'use strict';
  window.MM = window.MM || {};
  const { store } = MM.Util;
  // The one piece of mutable state shared between files: the language (switched in main.js, read everywhere).
  const shared = (MM.shared = MM.shared || {});

  // ---------- Language ----------
  shared.lang = store.get('mm_lang', 'ne') === 'en' ? 'en' : 'ne';
  const L = (o) => (o && typeof o === 'object' && 'ne' in o ? o[shared.lang] : o);
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const fill = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (k === 'Item' ? cap(v.item) : v[k] ?? ''));
  const DEV = '०१२३४५६७८९';
  const digits = (s) => (shared.lang === 'ne' ? String(s).replace(/\d/g, (d) => DEV[d]) : String(s));
  const num = (n) => digits(Math.round(n).toLocaleString('en-IN'));
  const rs = (n) => (shared.lang === 'ne' ? 'रु. ' : 'Rs ') + num(n);

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
  const t = (k) => TEXT[shared.lang][k];

  // ---------- Time ----------
  function fmtClock(m) {
    const total = 600 + Math.floor(m), h24 = Math.floor(total / 60), mm = total % 60, h12 = h24 % 12 || 12;
    const s = `${h12}:${String(mm).padStart(2, '0')}`;
    if (shared.lang === 'ne') return `${h24 < 12 ? 'बिहान' : h24 < 16 ? 'दिउँसो' : 'बेलुका'} ${digits(s)}`;
    return `${s} ${h24 >= 12 ? 'PM' : 'AM'}`;
  }

  MM.I18n = { L, cap, fill, digits, num, rs, TEXT, t, fmtClock };
})();
