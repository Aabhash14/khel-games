// Static content: the levels, the goods, the shopkeepers and their personalities.
(() => {
  'use strict';
  window.MM = window.MM || {};
  const { L } = MM.I18n;

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

  // acc: chance to accept an offer that is already above their lowest price. conc: how far they move toward it per round.
  const KIND = {
    cunning: { acc: 0.2, conc: 0.22 }, honest: { acc: 0.5, conc: 0.4 }, chatty: { acc: 0.35, conc: 0.3 }, naive: { acc: 0.55, conc: 0.45 },
    kind: { acc: 0.6, conc: 0.5 }, grumpy: { acc: 0.45, conc: 0.35 }, farmer: { acc: 0.45, conc: 0.35 }, poker: { acc: 0.3, conc: 0.28 }, cheerful: { acc: 0.45, conc: 0.38 },
  };

  MM.Data = { ALL_TOLES, LEVELS, TITHI, HOLIDAY, COACH_WHEN, LEVEL_TEXT, ITEMS, iname, CAT, KEEPERS, kname, sname, KIND };
})();
