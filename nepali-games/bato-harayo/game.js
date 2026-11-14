/* Bato Harayo (बाटो हरायो) — lost on a dark road with a dead phone. Find your way before morning. */
(() => {
  'use strict';

  // ---------- Setup ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
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

  const TAU = Math.PI * 2;
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const FLAG = ['#1f6fd1', '#f4f4f4', '#e23b3b', '#2e9e5b', '#f5c518'];
  const DAWN = 510; // minutes after 9 PM = 5:30 AM

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})`; };
  function mulberry32(s) {
    return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const vibrate = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch { /* ignore */ } };

  // ---------- Language ----------
  let lang = store.get('bh_lang', 'ne') === 'en' ? 'en' : 'ne';
  const L = (o) => (o && typeof o === 'object' && 'ne' in o ? o[lang] : o);
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => (k === 'Path' ? cap(v.path) : v[k] ?? ''));
  const DEV = '०१२३४५६७८९';
  const digits = (s) => (lang === 'ne' ? String(s).replace(/\d/g, (d) => DEV[d]) : String(s));

  const TEXT = {
    ne: {
      tag: 'अन्तिम बसले तपाईंलाई गलत बिसौनीमा ओराल्यो। मोबाइलको ब्याट्री सकियो। चारैतिर अँध्यारो छ। बिहान नहुँदै मामाघर पुग्नुपर्छ, बाटोमा भेटिएकालाई सोध्दै।',
      how1: 'भेटिएका मान्छेलाई बाटो सोध्नुहोस्, तर सबैले साँचो बोल्दैनन्।',
      how2: 'आफ्नो मनको कुरा सुन्नुहोस्। शङ्का लागे "पक्का हो?" भनेर सोध्नुहोस्।',
      how3: 'शक्ति र डरको ख्याल गर्नुहोस्। चिया पसलमा मोबाइल चार्ज गरे टर्च बाल्न वा मामालाई फोन गर्न सकिन्छ। बिहान ५:३० मा उज्यालो हुन्छ।',
      play: 'हिँड्न थाल्नुहोस्', best: 'उत्कृष्ट', lang: 'English',
      strength: 'शक्ति', fear: 'डर', memory: 'सम्झना', memTitle: 'मान्छेहरूले भनेका कुरा',
      memEmpty: 'अहिलेसम्म कसैले केही भनेको छैन।', close: 'बन्द',
      ask: 'बाटो सोध्ने', sure: 'पक्का हो?', chat: 'अलिकति गफ गर्ने', tea: 'चिया खाने', rest: 'एकछिन आराम गर्ने',
      sign: 'साइनबोर्ड पढ्ने', pet: 'कुकुरलाई मुसार्ने', followDog: 'कुकुरको पछि लाग्ने', followHer: 'उनको पछि लाग्ने',
      choosePath: 'कुन बाटो जाने?', cameFrom: 'आएको बाटो', walking: 'हिँड्दै...', thinking: 'मनमा...',
      charge: 'मोबाइल चार्ज गर्ने', torchOn: 'टर्च बाल्ने', torchOff: 'टर्च निभाउने', call: 'मामालाई फोन गर्ने', battery: 'ब्याट्री',
      badgesLbl: 'पदक', newBadges: 'नयाँ पदक!', mama: 'मामा (फोनमा)', baba: 'नानीका बुबा',
      you: 'म', noVoice: 'यो ब्राउजरमा नेपाली वा हिन्दी आवाज भेटिएन। आवाज सुन्न Microsoft Edge वा Chrome प्रयोग गर्नुहोस्, वा English मा खेल्नुहोस्।',
      visited: 'यहाँ त पहिले नै आइसकेको छु।', stillHere: '{name} अझै यहीँ हुनुहुन्छ।',
      again: 'फेरि खेल्नुहोस्', share: 'सेयर', copied: 'कपी भयो!', newBest: 'नयाँ रेकर्ड!',
      timeLbl: 'समय', metLbl: 'भेटिएका मान्छे', placesLbl: 'हिँडेका ठाउँ',
      shareHome: (t, s) => `"बाटो हरायो" मा राति बाटो बिराएर पनि ${t} मा मामाघर पुगेँ! ${s}`,
      shareOther: () => '"बाटो हरायो" मा रातभर बाटो खोज्दै बिहान पारेँ! तपाईं घर पुग्न सक्नुहुन्छ?',
    },
    en: {
      tag: 'The last bus dropped you at the wrong stop. Your phone is dead. It is dark all around. Reach your mamaghar (your uncle\'s home) before morning by asking whoever you meet.',
      how1: 'Ask the people you meet for directions, but not everyone tells the truth.',
      how2: 'Listen to your own thoughts. If something feels off, ask "Are you sure?"',
      how3: 'Watch your strength and fear. Charge your phone at a tea shop to use the torch or call Mama. Dawn breaks at 5:30.',
      play: 'Start walking', best: 'Best', lang: 'नेपाली',
      strength: 'Strength', fear: 'Fear', memory: 'Memory', memTitle: 'What people told me',
      memEmpty: 'Nobody has told you anything yet.', close: 'Close',
      ask: 'Ask the way', sure: 'Are you sure?', chat: 'Talk a little', tea: 'Drink tea', rest: 'Rest a while',
      sign: 'Read the sign', pet: 'Pet the dog', followDog: 'Follow the dog', followHer: 'Follow her',
      choosePath: 'Which way?', cameFrom: 'the way I came', walking: 'Walking...', thinking: 'Thinking...',
      charge: 'Charge my phone', torchOn: 'Turn on the torch', torchOff: 'Turn off the torch', call: 'Call Mama', battery: 'Battery',
      badgesLbl: 'Badges', newBadges: 'New badges!', mama: 'Mama (on the phone)', baba: 'The girl’s father',
      you: 'Me', noVoice: 'No voice for this language was found in this browser. Try Microsoft Edge or Chrome to hear the characters.',
      visited: 'I have been here before.', stillHere: '{name} is still here.',
      again: 'Play again', share: 'Share', copied: 'Copied!', newBest: 'New record!',
      timeLbl: 'Time', metLbl: 'People met', placesLbl: 'Places walked',
      shareHome: (t, s) => `I got lost at night in "Bato Harayo" and still reached home at ${t}! ${s}`,
      shareOther: () => 'I survived a whole night lost in "Bato Harayo"! Can you find your way home?',
    },
  };
  const t = (k) => TEXT[lang][k];

  // ---------- Story content ----------
  const VILLAGES = [
    { ne: 'सिमलटार', en: 'Simaltar' }, { ne: 'देउराली', en: 'Deurali' }, { ne: 'पिपलबोट', en: 'Pipalbot' },
    { ne: 'कालीखोला', en: 'Kalikhola' }, { ne: 'चिसापानी', en: 'Chisapani' }, { ne: 'भीरकोट', en: 'Bhirkot' },
  ];

  const PATHS = {
    up: { ne: 'उकालो बाटो', en: 'the uphill path', rev: 'down', riddle: { ne: 'आकाशतिर चढ्ने बाटो', en: 'the way that climbs toward the sky' } },
    down: { ne: 'ओरालो बाटो', en: 'the downhill path', rev: 'up', riddle: { ne: 'गुडेको ढुङ्गा जता जान्छ', en: 'where a rolling stone would go' } },
    river: { ne: 'खोला किनारको बाटो', en: 'the riverside path', riddle: { ne: 'जहाँ पानी बोल्छ', en: 'where the water speaks' } },
    stairs: { ne: 'ढुङ्गे सिँढी', en: 'the stone stairs', riddle: { ne: 'पुर्खाले बिछ्याएका ढुङ्गा', en: 'the stones our ancestors laid' } },
    trail: { ne: 'जङ्गलको गोरेटो', en: 'the forest trail', riddle: { ne: 'रुखहरूले लुकाएको गोरेटो', en: 'the track the trees are hiding' } },
    field: { ne: 'खेतको आली', en: 'the path along the fields', riddle: { ne: 'धानले कुरेको डिल', en: 'the edge the rice keeps watch over' } },
    road: { ne: 'कच्ची मोटरबाटो', en: 'the dirt road', riddle: { ne: 'पाङ्ग्राले कोरेको बाटो', en: 'the path drawn by wheels' } },
    peepal: { ne: 'पीपलको रुख भएको बाटो', en: 'the path by the peepal tree', riddle: { ne: 'पात कहिल्यै नथाक्ने रुख', en: 'the tree whose leaves never rest' } },
    bamboo: { ne: 'बाँसघारीको बाटो', en: 'the path through the bamboo', riddle: { ne: 'हावासँग बाँसुरी बजाउने घारी', en: 'the grove that plays flute with the wind' } },
  };
  const PATH_IDS = Object.keys(PATHS);
  const revPath = (p) => PATHS[p].rev || p;
  const SCENE_PATH = { river: 'river', bridge: 'river', fields: 'field', road: 'road', crossroads: 'road', chautari: 'peepal', forest: 'trail', temple: 'stairs', teashop: 'road', village: 'stairs' };

  const SCENES = {
    road: {
      name: { ne: 'कच्ची मोटरबाटो', en: 'Dirt road' }, fear: 2,
      desc: { ne: ['धुलाम्मे कच्ची मोटरबाटो। टायरका डोबहरू अँध्यारोमा हराउँछन्।', 'बिजुलीका खम्बा छन्, तर एउटा पनि बत्ती बलेको छैन।'], en: ['A dusty dirt road. Tire tracks disappear into the dark.', 'There are electric poles, but not a single light is on.'] },
      think: { ne: ['कुनै गाडी आइदिए हुन्थ्यो।', 'यही बाटोमा बस आएको थियो कि अर्कोमा?'], en: ['If only a car would come by.', 'Was this the road the bus came on, or another one?'] },
    },
    forest: {
      name: { ne: 'घना जङ्गल', en: 'Deep forest' }, fear: 10,
      desc: { ne: ['रुखहरू यति घना छन् कि आकाश पनि देखिँदैन।', 'झाडीबाट झ्याउँकिरीको चर्को आवाज आइरहेको छ।', 'पात खस्दा पनि कसैको पाइला जस्तो सुनिन्छ।'], en: ['The trees are so thick you can\'t even see the sky.', 'Crickets are shrieking from the bushes.', 'Even falling leaves sound like footsteps.'] },
      think: { ne: ['पछाडि कोही छ कि? ...नहेर्ने, नहेर्ने।', 'यहाँ बाघ त होला नि? होइन होला।', 'रुखहरूले मलाई हेरिरहेजस्तो लाग्छ।'], en: ['Is someone behind me? ...Don\'t look. Don\'t look.', 'There aren\'t tigers here... right?', 'It feels like the trees are watching me.'] },
    },
    river: {
      name: { ne: 'खोला किनार', en: 'Riverbank' }, fear: 4,
      desc: { ne: ['खोला सुसाइरहेको छ। जूनको उज्यालो पानीमा टल्किन्छ।', 'खोलाबाट चिसो हावा माथि आउँदैछ।'], en: ['The river is rushing. Moonlight shimmers on the water.', 'A cold wind rises off the river.'] },
      think: { ne: ['पानीको आवाजले मन अलि शान्त भयो।', 'खोलाको किनारै किनार गए गाउँ भेटिन्छ भन्नुहुन्थ्यो हजुरबुबा।'], en: ['The sound of water calms me a little.', 'Hajurbuba used to say: follow a river and you\'ll find a village.'] },
    },
    bridge: {
      name: { ne: 'झोलुङ्गे पुल', en: 'Suspension bridge' }, fear: 7,
      desc: { ne: ['झोलुङ्गे पुल हावामा हल्लिरहेको छ। तल अँध्यारोमा खोला गर्जिन्छ।'], en: ['A suspension bridge sways in the wind. Below, the river roars in the dark.'] },
      think: { ne: ['तल नहेर्ने। एक, दुई, तीन...', 'पुलमा बाँधिएका लुङ्दरहरू फरफराइरहेका छन्।'], en: ['Don\'t look down. One, two, three...', 'The prayer flags on the bridge are snapping in the wind.'] },
    },
    chautari: {
      name: { ne: 'पीपलको चौतारी', en: 'Peepal chautari' }, fear: -4,
      desc: { ne: ['पीपल र बरको छहारीमुनि ढुङ्गाको चौतारी छ। बटुवाहरू यहीँ थकाइ मार्छन्।'], en: ['A stone chautari sits under a peepal and a banyan tree. Travelers rest here.'] },
      think: { ne: ['एकछिन बसूँ कि? खुट्टा गलिसके।', 'पीपलको पात हल्लिँदा सानोमा सुनेका भूतका कथा याद आए।'], en: ['Should I sit for a bit? My legs are done.', 'The rustling peepal leaves remind me of childhood ghost stories.'] },
    },
    temple: {
      name: { ne: 'सानो मन्दिर', en: 'Small shrine' }, fear: -8,
      desc: { ne: ['सानो मन्दिरमा दियो बलिरहेको छ। घण्टी हावामा मधुरो बजिरहेको छ।'], en: ['A butter lamp still burns in a small shrine. A bell chimes softly in the wind.'] },
      think: { ne: ['हे भगवान्, बाटो देखाइदिनुहोस्।', 'दियो बलेको छ, मतलब कोही नजिकै बस्छ होला।'], en: ['Please, God, show me the way.', 'Someone lit this lamp. Someone must live nearby.'] },
    },
    teashop: {
      name: { ne: 'चिया पसल', en: 'Tea shop' }, fear: -10,
      desc: { ne: ['सडक छेउको सानो चिया पसलमा अझै लालटिन बलेको छ।'], en: ['A tiny roadside tea shop still has a lantern burning.'] },
      think: { ne: ['तातो चियाको बास्ना! यो सपना त होइन नि?'], en: ['The smell of hot tea! Am I dreaming?'] },
    },
    fields: {
      name: { ne: 'खेतका गरा', en: 'Terraced fields' }, fear: 3,
      desc: { ne: ['गरा-गरा खेतमा धान झुलिरहेको छ। जुनकिरीहरू झिलिमिली बलिरहेका छन्।'], en: ['Terraced rice fields sway in the dark. Fireflies blink everywhere.'] },
      think: { ne: ['जुनकिरी... सानोमा बोतलमा थुन्थेँ।', 'खेत छ भने गाउँ पनि नजिकै होला।'], en: ['Fireflies... I used to catch them in a bottle.', 'Fields mean a village can\'t be far.'] },
    },
    crossroads: {
      name: { ne: 'चौबाटो', en: 'Crossroads' }, fear: 4,
      desc: { ne: ['चौबाटोमा एउटा पुरानो, खुइलिएको साइनबोर्ड ढल्केको छ।'], en: ['At the crossroads an old, faded signboard leans to one side.'] },
      think: { ne: ['राति चौबाटोमा एक्लै उभिनु हुँदैन भन्थे...', 'साइनबोर्डले केही भन्ला कि?'], en: ['They say you shouldn\'t stand alone at a crossroads at night...', 'Maybe the sign will tell me something.'] },
    },
    village: { name: { ne: 'गाउँ', en: 'Village' }, fear: -20, desc: { ne: [''], en: [''] }, think: { ne: [''], en: [''] } },
  };

  // kind: honest | riddle | joker | drunk | liar | dog | sadhu
  const PEOPLE = {
    hajurama: {
      kind: 'honest', name: { ne: 'लालटिन बोकेकी हजुरआमा', en: 'Old woman with a lantern' },
      intro: { ne: 'लालटिन बोकेकी एक हजुरआमा बिस्तारै हिँड्दै आउनुभयो। "यति राति कता हिँडेको, नानी?"', en: 'An old woman with a lantern shuffles toward you. "Where are you going this late, child?"' },
      introThought: { ne: 'लालटिनको उज्यालो देखेर बल्ल सास फर्कियो।', en: 'Seeing her lantern, I can finally breathe again.' },
      ask: { ne: '"{village} जाने? {path} समातेर जाऊ, नानी। म यहीँ जन्मेर हुर्केकी हुँ।"', en: '"Going to {village}? Take {path}, child. I was born and raised here."' },
      sure: { ne: '"पक्का, नानी। बूढी भए पनि बाटो बिर्सेकी छैन।"', en: '"I\'m sure, child. I\'m old, but I haven\'t forgotten the way."' },
      chat: { ne: '"मेरो नाति पनि सहरमा पढ्छ। ऊ पनि यसरी नै हराउँछ होला।" उहाँले मुस्कुराउँदै खल्तीबाट भुटेको मकै दिनुभयो।', en: '"My grandson studies in the city. He probably gets lost like this too." Smiling, she hands you some roasted corn.' },
      chatThought: { ne: 'उहाँको आँखामा माया छ। ढाँट्ने मान्छे होइनन्।', en: 'There\'s love in her eyes. She\'s not someone who lies.' },
      chatFx: { stamina: 10, fear: -6 }, meetFear: -12, scenes: ['chautari', 'temple', 'fields', 'road'],
    },
    gothalo: {
      kind: 'joker', name: { ne: 'गोठालो केटो', en: 'Cowherd boy' },
      intro: { ne: 'बाँसको लौरो बोकेको एउटा केटो ढुङ्गामा बसेर खुट्टा हल्लाइरहेको छ। "ए! बाटो हराउनुभयो?" ऊ हाँस्यो।', en: 'A boy with a bamboo stick sits on a rock, swinging his legs. "Hey! Lost, are you?" he laughs.' },
      introThought: { ne: 'राति यस्तो ठाउँमा केटो? गाउँ नजिकै होला।', en: 'A kid out here at night? The village must be close.' },
      askLie: { ne: '"{village}? {path}बाट! सिधै जानुस्! हिहि..."', en: '"{village}? {Path}! Straight that way! Hee hee..."' },
      askTrue: { ne: '"{village}? {path}बाट जानुस्। म दिनहुँ त्यतै गाई चराउन जान्छु।"', en: '"{village}? Take {path}. I take the cows that way every day."' },
      lieThought: { ne: 'भन्दाभन्दै ऊ मुसुक्क हाँस्यो... किन?', en: 'He giggled while saying it... why?' },
      trueThought: { ne: 'यसपालि ऊ गम्भीर देखियो।', en: 'This time he looked serious.' },
      confess: { ne: '"हाहा, ठट्टा गरेको! साँचो भन्नुपर्दा {path} हो।"', en: '"Haha, I was joking! Honestly, it\'s {path}."' },
      sure: { ne: '"साँच्चै भनेको! कसम!"', en: '"For real! I swear!"' },
      chat: { ne: '"गाई खोज्दै आएको, अझै भेटिएन! तपाईंले देख्नुभयो?" ऊ फेरि खित्का छोडेर हाँस्यो।', en: '"I came looking for our cow and still haven\'t found her! Have you seen her?" He bursts out laughing again.' },
      chatThought: { ne: 'यो केटो ठट्टा गर्न औधी मन पराउँछ जस्तो छ।', en: 'This kid really loves a joke.' },
      chatFx: { fear: -4 }, meetFear: -6, scenes: ['fields', 'forest', 'river', 'crossroads'],
    },
    drunk: {
      kind: 'drunk', name: { ne: 'रक्सी खाएका काका', en: 'Tipsy uncle' },
      intro: { ne: 'एक जना काका लरबराउँदै गीत गाउँदै आउनुभयो। रक्सीको गन्ध हावामै छ।', en: 'An uncle stumbles along, singing. The smell of raksi hangs in the air.' },
      introThought: { ne: 'रक्सीको गन्ध यहाँसम्मै आयो।', en: 'I can smell the raksi from here.' },
      ask: { ne: '"हिक्! {village}? {path}... होइन होइन... हो, त्यही!"', en: '"Hic! {village}? {Path}... no, no... yes, that one!"' },
      askThought: { ne: 'बाटो देखाउँदा उहाँको औँला नै अन्तै गयो...', en: 'When he pointed, his finger wandered off somewhere else...' },
      sure: { ne: '"मैले के भनेँ र? हिक्! {path}, पक्का!"', en: '"What did I say? Hic! {Path}, for sure!"' },
      chat: { ne: '"म जवान छँदा यो डाँडा दौडेरै काट्थेँ! हिक्!" उहाँ आफ्नै कुरामा गललल हाँस्नुभयो।', en: '"When I was young I\'d run over this hill! Hic!" He roars at his own story.' },
      chatThought: { ne: 'उहाँ आफूले भनेको कुरा आफैँ बिर्सनुहुन्छ जस्तो छ।', en: 'He seems to forget what he says as soon as he says it.' },
      chatFx: { fear: -3 }, meetFear: -3, scenes: ['road', 'chautari', 'bridge', 'crossroads'],
    },
    didi: {
      kind: 'honest', name: { ne: 'चिया पसलकी दिदी', en: 'Tea-shop didi' },
      intro: { ne: 'पसलकी दिदी शटर झार्दै हुनुहुन्थ्यो। "बन्द गर्न लागेकी, तर आउनुहोस्, एक कप चिया त खानुहोस्।"', en: 'The shopkeeper was pulling down the shutter. "I was closing, but come, have a cup of tea at least."' },
      introThought: { ne: 'उज्यालो, मान्छे, अनि चिया! भगवान्ले सुन्नुभयो।', en: 'Light, people, and tea! Someone up there heard me.' },
      ask: { ne: '"{path} बाट जानुहोस्। दूध बोक्ने दाइ दिनहुँ {village}बाट त्यतै आउनुहुन्छ।"', en: '"Take {path}. The milkman comes from {village} that way every morning."' },
      sure: { ne: '"पक्का हो। म बीस वर्षदेखि यहीँ चिया बेच्छु।"', en: '"I\'m sure. I\'ve sold tea right here for twenty years."' },
      chat: { ne: '"यति राति यता कोही आउँदैन। तपाईं भाग्यमानी हुनुहुन्छ।"', en: '"Nobody comes by this late. You\'re lucky."' },
      chatThought: { ne: 'लालटिनको उज्यालोले मन नै न्यानो भयो।', en: 'The lantern light warms me up inside.' },
      chatFx: { fear: -5 }, meetFear: -10, scenes: ['teashop'],
    },
    jhankri: {
      kind: 'riddle', name: { ne: 'ढ्याङ्ग्रो बजाउने झाँक्री', en: 'Jhankri with a drum' },
      intro: { ne: 'ढ्याङ्ग्रोको ढ्याङ-ढ्याङ आवाज आयो। प्वाँख लगाएको टोपी पहिरेका एक झाँक्री आगोको छेउमा बसिरहेका छन्।', en: 'Dhyang, dhyang... a drumbeat. A jhankri in a feathered crown sits beside a small fire.' },
      introThought: { ne: 'ढ्याङ्ग्रोको आवाजले जिउ नै सिरिङ्ग भयो।', en: 'The drumbeat sends a shiver through me.' },
      ask: { ne: '"{riddle}... त्यहीँ तिम्रो बाटो छ, बटुवा।"', en: '"{riddle}... there lies your road, traveler."' },
      askThought: { ne: 'पहेली? यी बाटोहरूमध्ये कुन चाहिँ होला?', en: 'A riddle? Which of these paths could that be?' },
      sure: { ne: '"देवताले झुटो बोल्दैनन्, बटुवा।"', en: '"The gods do not lie, traveler."' },
      chat: { ne: '"तिम्रो पछि पछि कोही आइरहेको छ... तर नडराऊ। बिहान सबै छाया हराउँछन्।"', en: '"Someone is following you... but do not fear. At dawn every shadow disappears."' },
      chatThought: { ne: 'उहाँका कुरा बुझ्न गाह्रो छ, तर केही अर्थ होला।', en: 'Hard to understand, but it must mean something.' },
      chatFx: { fear: 4 }, meetFear: 2, scenes: ['forest', 'temple', 'river'],
    },
    kichkandi: {
      kind: 'liar', name: { ne: 'सेतो सारीमा एउटी महिला', en: 'Woman in a white sari' },
      intro: { ne: 'अँध्यारोबाट सेतो सारीमा एउटी महिला निस्किइन्। लामो कपालले अनुहार छोपिएको छ। "बाटो हराउनुभयो? म देखाइदिन्छु।"', en: 'A woman in a white sari steps out of the dark, long hair hiding her face. "Lost? I\'ll show you the way."' },
      introThought: { ne: 'यति राति एक्ली महिला? अनि हिँड्दा उनको पाइलाको आवाज किन आउँदैन?', en: 'A woman alone at this hour? And why don\'t her steps make any sound?' },
      ask: { ne: '"{path}। आउनुहोस्, म पनि त्यतै जाँदैछु..."', en: '"{Path}. Come, I\'m going that way too..."' },
      askThought: { ne: 'उनको स्वर किन यति चिसो?', en: 'Why is her voice so cold?' },
      sure: { ne: '"म कहिल्यै झुटो बोल्दिनँ..." उनी अनौठो गरी मुस्कुराइन्।', en: '"I never lie..." she smiles strangely.' },
      chat: { ne: 'उनी नजिक आइन्। जूनको उज्यालोमा उनका खुट्टा देखिए... खुट्टा त उल्टो फर्किएका छन्!', en: 'She steps closer. In the moonlight I see her feet... they point backwards!' },
      chatThought: { ne: 'किचकन्नी?! हजुरआमाले सुनाउनुभएको कथा साँचो रहेछ!', en: 'A kichkandi?! Hajurama\'s stories were true!' },
      chatFx: { fear: 15 }, meetFear: 8, scenes: ['forest', 'river', 'bridge', 'fields', 'chautari', 'crossroads'],
    },
    kukur: {
      kind: 'dog', name: { ne: 'एउटा भुस्याहा कुकुर', en: 'A scruffy dog' },
      intro: { ne: 'एउटा भुस्याहा कुकुर पुच्छर हल्लाउँदै नजिक आयो।', en: 'A scruffy dog trots up, wagging its tail.' },
      introThought: { ne: 'तिहारमा पूजा गर्ने साथी! एक्लो नभएजस्तो लाग्यो।', en: 'The friend we honor at Tihar! I don\'t feel so alone.' },
      ask: { ne: 'कुकुरले टाउको ढल्कायो र पुच्छर हल्लायो। कुकुरले बोल्न त सक्दैन नि!', en: 'The dog tilts its head and wags its tail. Dogs can\'t talk, silly!' },
      askThought: { ne: 'तर कुकुरलाई गाउँको बाटो थाहा हुन्छ भन्छन्।', en: 'But they say dogs always know the way to the village.' },
      meetFear: -6, scenes: ['road', 'chautari', 'fields', 'crossroads', 'forest'],
    },
    bhariya: {
      kind: 'honest', name: { ne: 'डोको बोकेका भरिया दाइ', en: 'Porter with a doko basket' },
      intro: { ne: 'भारी डोको बोकेका एक दाइ नाम्लो निधारमा अड्याएर पसिना पुछ्दै हुनुहुन्छ।', en: 'A porter rests with a heavy doko on his back, the strap across his forehead, wiping sweat.' },
      introThought: { ne: 'यत्रो भारी बोकेर राति हिँड्ने... कति मेहनती।', en: 'Carrying that load at night... what a hard worker.' },
      ask: { ne: '"{path} भएर जानुस्। त्यसपछिको बाटो चाहिँ मलाई पनि थाहा छैन।"', en: '"Go by {path}. After that, I\'m not sure myself."' },
      sure: { ne: '"यही बाटो भारी बोकेर हजार पटक हिँडेको छु।"', en: '"I\'ve carried loads on that path a thousand times."' },
      chat: { ne: '"भोलि बिहानै बजारमा सामान पुर्‍याउनुपर्छ।" उहाँले डोकोबाट एउटा सुन्तला निकालेर दिनुभयो।', en: '"I have to get these goods to the market by morning." He pulls an orange from his doko and gives it to you.' },
      chatThought: { ne: 'थकित भए पनि उहाँ इमानदार देखिनुहुन्छ।', en: 'He\'s exhausted, but he seems honest.' },
      chatFx: { stamina: 10 }, meetFear: -6, scenes: ['forest', 'river', 'bridge', 'road', 'chautari'],
    },
    sadhu: {
      kind: 'sadhu', name: { ne: 'धुनी बालेर बसेका साधु बाबा', en: 'Sadhu baba by a fire' },
      intro: { ne: 'धुनीको आगो तापेर एक साधु बाबा ध्यानमा बस्नुभएको छ। आँखा नखोली उहाँ बोल्नुभयो, "आऊ, बटुवा।"', en: 'A sadhu sits meditating by his fire. Without opening his eyes he says, "Come, traveler."' },
      introThought: { ne: 'धुनीको आगोले चिसो अलि कम भयो।', en: 'The fire takes the edge off the cold.' },
      ask: { ne: '"{path}। भगवान्ले तिमीलाई साथ दिऊन्।"', en: '"{Path}. May God walk with you."' },
      sure: { ne: '"मन शान्त राख, बटुवा। {path}।"', en: '"Calm your mind, traveler. {Path}."' },
      chat: { ne: 'उहाँले निधारमा रातो टीका लगाइदिनुभयो। "डर मनमा हुन्छ, बाटोमा होइन।"', en: 'He presses a red tika on your forehead. "Fear lives in the mind, not on the road."' },
      chatThought: { ne: 'टीकाले होला, मन अलि हल्का भयो।', en: 'Maybe it\'s the tika, but my heart feels lighter.' },
      chatFx: { fear: -15 }, meetFear: -8, scenes: ['temple', 'chautari'],
    },
    driver: {
      kind: 'honest', name: { ne: 'ट्रक ड्राइभर दाइ', en: 'Truck driver' },
      intro: { ne: 'पङ्क्चर भएको ट्रकको छेउमा एक ड्राइभर दाइ टायर फेर्दै हुनुहुन्छ। हेडलाइटले बाटो उज्यालो बनाएको छ।', en: 'A driver is changing a flat tire beside his truck. The headlights light up the road.' },
      introThought: { ne: 'ट्रक! ...तर पङ्क्चर रहेछ।', en: 'A truck! ...With a flat tire.' },
      ask: { ne: '"{village}? {path} समात्नुस्। म अर्कोतिर नजाने भए त पुर्‍याइदिन्थेँ।"', en: '"{village}? Take {path}. If I weren\'t heading the other way, I\'d drive you."' },
      sure: { ne: '"पक्का हो, यो लाइनमा दस वर्ष गाडी चलाएँ।"', en: '"I\'m sure. Ten years driving this route."' },
      chat: { ne: '"राति एक्लै नहिँड्नू, स्यालहरू कराउँछन्। तर मान्छेलाई केही गर्दैनन्।"', en: '"Don\'t walk alone at night, the jackals howl. They don\'t hurt people, though."' },
      chatThought: { ne: 'स्याल... केही गर्दैनन् रे। ठिकै छ।', en: 'Jackals... harmless, he says. Okay.' },
      chatFx: { fear: -4 }, meetFear: -8, scenes: ['road', 'crossroads'],
    },
  };
  PEOPLE.hajurbuba = {
    kind: 'honest', name: { ne: 'कथा सुनाउने हजुरबुबा', en: 'Grandfather with stories' },
    intro: { ne: 'चौतारीमा बसेर एक हजुरबुबा चिलिम तान्दै हुनुहुन्छ। "आऊ, एकछिन बस। यति राति एक्लै?"', en: 'An old man sits smoking his chilim. "Come, sit a while. Alone at this hour?"' },
    introThought: { ne: 'हजुरबुबाको चाउरी परेको अनुहारमा कति धेरै कथा लुकेका होलान्।', en: 'So many stories must be hiding in that wrinkled face.' },
    ask: { ne: '"{village}? {path} समात। हाम्रो पालामा त्यो बाटोमा बाघ आउँथ्यो, अहिले केही डर छैन।"', en: '"{village}? Take {path}. In my day tigers walked that path; nothing to fear now."' },
    sure: { ne: '"यो बूढो आँखाले सत्तरी वर्षदेखि यही बाटो हेरेको छ।"', en: '"These old eyes have watched that path for seventy years."' },
    chat: { ne: '"सुन, एउटा कथा भन्छु। पहिले पहिले राति सेतो सारीमा एउटी आइमाई बटुवालाई बाटो देखाउँछु भन्थी। तर उसको खुट्टा उल्टो हुन्थ्यो! कहिल्यै उसको पछि नलाग्नू।"', en: '"Listen, here is a story. Long ago a woman in a white sari offered to guide travelers at night. But her feet pointed backwards! Never follow her."' },
    chatThought: { ne: 'सेतो सारी... उल्टो खुट्टा... याद राख्नुपर्छ।', en: 'White sari... backwards feet... I must remember that.' },
    chatFx: { fear: -8 }, meetFear: -10, scenes: ['chautari', 'temple', 'fields'],
  };
  const PEOPLE_CAPS = { hajurbuba: 1, hajurama: 2, gothalo: 2, drunk: 2, didi: 2, jhankri: 1, kichkandi: 2, kukur: 2, bhariya: 2, sadhu: 1, driver: 2 };
  const HONEST = ['hajurama', 'hajurbuba', 'bhariya', 'driver', 'sadhu', 'jhankri'];
  const HONEST_THOUGHT = { ne: 'उहाँको कुरामा भर पर्न सकिन्छ जस्तो लाग्यो।', en: 'I feel I can trust that.' };

  const EVENTS = [
    { text: { ne: 'झाडीमा केही सर्‍याक्क चल्यो!', en: 'Something rustles in the bushes!' }, thought: { ne: '...खरायो होला। खरायो नै होला।', en: '...A rabbit. It\'s just a rabbit.' }, fear: 10, sound: 'rustle' },
    { text: { ne: 'टाढा कतै स्यालहरू हुइयाँ गरे।', en: 'Somewhere far away, jackals howl.' }, thought: { ne: 'स्याल कराउँदा मुटु नै हल्लियो।', en: 'The jackals\' howl shook my heart.' }, fear: 8, sound: 'jackal' },
    { text: { ne: 'बाटोभरि जुनकिरीहरू बत्ती बालेझैँ उड्न थाले।', en: 'Fireflies rise along the path like tiny lamps.' }, thought: { ne: 'कत्ति राम्रो! एकछिन त डर नै बिर्सेँ।', en: 'So beautiful! For a moment I forgot to be afraid.' }, fear: -6 },
    { text: { ne: 'ढुङ्गामा खुट्टा चिप्लियो!', en: 'Your foot slips on a stone!' }, thought: { ne: 'आथ्थ! घुँडा छिलियो।', en: 'Ouch! Scraped my knee.' }, stamina: -8, sound: 'slip' },
    { text: { ne: 'आकाशमा एउटा तारा खस्यो।', en: 'A shooting star crosses the sky.' }, thought: { ne: 'इच्छा माग्छु: छिट्टै घर पुगियोस्।', en: 'I make a wish: let me get home soon.' }, fear: -4 },
    { text: { ne: 'रुखबाट उल्लु बोल्यो: हुँ... हुँ...', en: 'An owl calls from a tree: hoo... hoo...' }, thought: { ne: 'उल्लु बोल्नु अशुभ भन्थे... होइन, त्यो त अन्धविश्वास हो।', en: 'They say an owl\'s call is a bad omen... no, that\'s just superstition.' }, fear: 5, sound: 'owl' },
  ];

  const THOUGHTS = {
    intro: { ne: 'मोबाइल पनि बन्द भयो... आमालाई फोन गर्न पनि मिलेन। ठिक छ, आँट गर्नुपर्छ।', en: 'My phone died too... I can\'t even call Aama. Okay. I have to be brave.' },
    revisit: { ne: 'यो ठाउँ त पहिले नै आएको हुँ... घुमिरहेको त छैन?', en: 'I\'ve been here before... am I going in circles?' },
    near: { ne: 'टाढा कतै कुकुर भुकेको सुनियो, बत्ती पनि टिलपिल गर्दैछ... गाउँ नजिकै होला!', en: 'A dog barks somewhere close and a light flickers... the village must be near!' },
    dawn: { ne: 'पूर्वतिर आकाश अलि उज्यालो हुँदैछ! अलिकति मात्र बाँकी।', en: 'The eastern sky is getting lighter! Not much longer.' },
    fear: { ne: ['मुटु ढुकढुक गरिरहेको छ।', 'आमाको याद आयो। अहिले आमा यहाँ भइदिए...', 'शान्त हो, शान्त हो। लामो सास ले।'], en: ['My heart is pounding.', 'I miss Aama. If only she were here...', 'Calm down, calm down. Breathe slowly.'] },
    tired: { ne: ['खुट्टा गल्न थाले।', 'भोक पनि लाग्यो... बिहान खाएको दालभात कति टाढा लाग्छ।'], en: ['My legs are giving out.', 'I\'m hungry too... this morning\'s dal bhat feels so far away.'] },
    late: { ne: ['बिहान हुन अझै कति बाँकी होला?', 'घरमा सबै सुतिसके होलान्।'], en: ['How long until morning?', 'Everyone at home must be asleep.'] },
    sign: { ne: 'साइनबोर्डले त झुटो बोल्दैन... कसैले घुमाएको छैन भने।', en: 'A sign doesn\'t lie... unless someone turned it around.' },
    signBad: { ne: 'धत्! अक्षर नै मेटिएछ।', en: 'Ugh! The letters have worn away.' },
    deadEnd: { ne: 'यो बाटो त यहीँ टुङ्गियो। फर्किनुपर्ने भयो।', en: 'The path ends here. I’ll have to turn back.' },
    kichGone: { ne: 'सेतो सारीकी महिला अब यहाँ छैनन्। के उनी साँच्चै थिइन्?', en: 'The woman in white is gone. Was she ever really here?' },
  };

  const LINES = {
    start: { ne: 'राति ९ बजेको छ। बस धुलो उडाउँदै गयो। बत्ती छैन, मान्छे छैनन्। {village} जाने बाटो कता होला?', en: 'It is 9 at night. The bus drives off in a cloud of dust. No lights, no people. Which way to {village}?' },
    midnight: { ne: 'टाढाको मन्दिरबाट घण्टी बज्यो। मध्यरात भयो।', en: 'A distant temple bell rings. It is midnight.' },
    panic: { ne: 'डरले होस नै हरायो! म अन्धाधुन्ध दौडिएँ...', en: 'Fear took over! I ran blindly...' },
    panicThought: { ne: '...कहाँ आइपुगेँ म?', en: '...Where am I now?' },
    signRead: { ne: 'धमिलो अक्षरमा लेखिएको छ: "{village} →" अनि तीर {path}तिर देखाउँछ।', en: 'Faded letters read: "{village} →" and the arrow points to {path}.' },
    signFaded: { ne: 'अक्षरहरू पूरै खुइलिएका छन्। केही पढ्न सकिएन।', en: 'The letters are completely worn away. I can\'t read anything.' },
    tea: { ne: 'दिदीले कपमा तातो दूध चिया खन्याइदिनुभयो। "बाटो बिराएकालाई पैसा पर्दैन।"', en: 'Didi pours a cup of hot milk tea. "No charge for lost travelers."' },
    teaThought: { ne: 'तातो चिया! शरीरमा फेरि ज्यान आयो।', en: 'Hot tea! I feel alive again.' },
    rest: { ne: 'चौतारीको ढुङ्गामा ढल्केँ। माथि पीपलका पातहरू सुसाइरहे।', en: 'I lie back on the chautari stones. The peepal leaves whisper overhead.' },
    restThought: { ne: 'आँखा लोलाउन थाले... तर सुत्नु हुँदैन!', en: 'My eyes are closing... but I can\'t fall asleep!' },
    pet: { ne: 'कुकुरको टाउको मुसारेँ। ऊ मेरो खुट्टामा टाँसियो।', en: 'I scratch the dog\'s head. It leans against my leg.' },
    petThought: { ne: 'अब एक्लो नभएजस्तो लाग्यो।', en: 'I don\'t feel alone anymore.' },
    dogLead: { ne: 'कुकुर अगाडि अगाडि कुद्यो, म पछि पछि। केही बेरपछि ऊ पुच्छर हल्लाउँदै अँध्यारोमा हरायो।', en: 'The dog trotted ahead and I followed. After a while it wagged its tail and vanished into the dark.' },
    dogThought: { ne: 'धन्यवाद, साथी!', en: 'Thank you, friend!' },
    herLead: { ne: 'उनको पछि पछि गएँ... अचानक उनी अँध्यारोमा बिलाइन्। म कहाँ आइपुगेँ?', en: 'I followed her... then suddenly she melted into the dark. Where am I?' },
    herThought: { ne: 'मैले किन पछ्याएँ? मनले त पहिल्यै शङ्का गरिरहेको थियो।', en: 'Why did I follow her? Something felt wrong from the start.' },
    signName: { ne: 'साइनबोर्ड', en: 'Signboard' },
  };

  // ---------- Phone, road decisions, badges ----------
  const EXTRA = {
    charge: { ne: '"हुन्छ, त्यो प्लगमा लगाउनुहोस्। बत्ती आउँदाजाँदा गर्छ है।" बीस मिनेटमा ब्याट्री १२% पुग्यो।', en: '"Sure, use that socket. The power comes and goes, though." After twenty minutes the battery reaches 12%.' },
    chargeThought: { ne: 'स्क्रिन बल्यो! बाह्र प्रतिशत मात्र... जोगाएर चलाउनुपर्छ।', en: 'The screen lights up! Only twelve percent... I have to use it wisely.' },
    driverCharge: { ne: 'उहाँले ट्रकको चार्जरमा मोबाइल केहीबेर लगाइदिनुभयो। ब्याट्री ८% बढ्यो।', en: 'He plugs your phone into the truck charger for a while. The battery goes up 8%.' },
    torchOn: { ne: 'मोबाइलको टर्च बालेँ। सेतो उज्यालोले बाटो छर्लङ्ग देखियो।', en: 'I switch on the phone torch. The white light shows the path clearly.' },
    realTorchOn: { ne: 'टर्च बालेँ। पहेँलो उज्यालो वरिपरि फैलियो।', en: 'I switch on the torch. Warm light spills around me.' },
    torchThought: { ne: 'उज्यालो भएपछि डर आधा भयो।', en: 'With some light, half my fear is gone.' },
    torchOff: { ne: 'टर्च निभाएँ। ब्याट्री जोगाउनुपर्छ।', en: 'I switch off the torch. I need to save the battery.' },
    battDead: { ne: 'ब्याट्री सकियो! मोबाइल फेरि बन्द भयो।', en: 'The battery died! The phone is off again.' },
    noSignal: { ne: 'स्क्रिनमा "नेटवर्क छैन" लेखियो। यहाँ टावर टिप्दैन।', en: 'The screen says "No service". There is no signal here.' },
    noSignalThought: { ne: 'खुला वा अग्लो ठाउँमा पुगेर फेरि प्रयास गर्नुपर्छ।', en: 'I need to try again somewhere open or higher up.' },
    callDropSay: { ne: '"हेलो? हेलो? ...आवाज टुटेर आयो..."', en: '"Hello? Hello? ...you’re breaking up..."' },
    callDrop: { ne: 'कल काटियो।', en: 'The call drops.' },
    callDropThought: { ne: 'धत्! ब्याट्री पनि खायो, कुरा पनि भएन।', en: 'Ugh! Battery gone and nothing learned.' },
    mamaSays: { ne: '"ए, कहाँ छस् तँ? ...{place}? ठिक छ, {path} समातेर आइज। म ढोकामा बत्ती बालेर कुर्छु!"', en: '"Hey, where are you? ...{place}? Okay, take {path}. I’ll leave the porch light on for you!"' },
    mamaThought: { ne: 'मामाको आवाज सुनेर आँखा रसाए।', en: 'Hearing Mama’s voice makes my eyes well up.' },
    childHome: { ne: 'नानीको हात समातेर नजिकैको घरसम्म पुर्‍याएँ। उसका बुबा लालटिन लिएर दौडिँदै आउनुभयो।', en: 'Holding her hand, I walk her to a house nearby. Her father comes running with a lantern.' },
    babaSays: { ne: '"धन्यवाद! हामीले कति खोजिसक्यौँ। यो टर्च लैजानुहोस्, अनि {village} जान {path} समात्नुहोस्।"', en: '"Thank you! We searched everywhere. Take this torch, and for {village} take {path}."' },
    childThought: { ne: 'मन नै हल्का भयो। राम्रो काम कहिल्यै खेर जाँदैन।', en: 'My heart feels light. A good deed is never wasted.' },
    leaveChild: { ne: 'म अगाडि बढेँ। पछाडि नानीको रुवाइ सुनिइरह्यो।', en: 'I walk on. Behind me, she keeps crying.' },
    leaveChildThought: { ne: 'उसको रुवाइ अझै कानमा गुन्जिरहेछ...', en: 'Her crying is still ringing in my ears...' },
    snakeWait: { ne: 'सास रोकेर पर्खिएँ। केहीबेरमा सर्प बिस्तारै झाडीतिर सर्‍यो।', en: 'I hold my breath and wait. After a while the snake slides off into the bushes.' },
    snakeStoneOk: { ne: 'ढुङ्गा फालेँ। सर्प सर्‍याक्क झाडीमा लुक्यो।', en: 'I toss a stone. The snake whips away into the bushes.' },
    snakeStoneBad: { ne: 'ढुङ्गा फालेँ। सर्पले फणा उठाएर फुँ गर्‍यो! म उफ्रिएर पछि हटेँ, अनि बल्ल ऊ गयो।', en: 'I toss a stone. The snake rears up and hisses! I leap back, and only then does it leave.' },
    snakeAround: { ne: 'काँडेदार झाडी हुँदै छेउबाट पार भएँ। लुगा च्यातियो, तर सर्पबाट टाढै रहेँ।', en: 'I push through the thorny bushes around it. My clothes tear, but I stay well away from the snake.' },
    snakeThought: { ne: 'हजुरआमा भन्नुहुन्थ्यो, सर्पलाई नचलाए उसले पनि केही गर्दैन।', en: 'Hajurama used to say: leave a snake alone and it leaves you alone.' },
    rainShelter: { ne: 'रुखमुनि ओत लागेँ। झरी थामियो, माटोको मीठो बास्ना आयो।', en: 'I shelter under a tree. The rain stops and the earth smells sweet.' },
    rainWalk: { ne: 'भिजेरै हिँडेँ। चिसोले दाँत कटकटाउन थाले।', en: 'I keep walking, soaked. My teeth start chattering from the cold.' },
    rainThought: { ne: 'साउनको झरी जस्तै... तर अहिले त रमाइलो लागेन।', en: 'Just like a monsoon shower... but it’s no fun right now.' },
    eyesTorch: { ne: 'टर्चको उज्यालो पर्नासाथ आँखाहरू हराए। स्यालहरू भागे!', en: 'The moment the light hits them, the eyes vanish. The jackals ran!' },
    eyesShout: { ne: 'जोडले कराएँ, "हट्!" स्यालहरू भागे, तर मेरो आफ्नै आवाजले मलाई नै डर लाग्यो!', en: 'I shout "Get away!" The jackals run, but my own voice scared me too!' },
    eyesBack: { ne: 'बिस्तारै पछि हटेँ र आएकै बाटो फर्किएँ।', en: 'I step back slowly and return the way I came.' },
    eyesThought: { ne: 'स्यालले मान्छेलाई केही गर्दैन भन्थे... तर ती आँखा कति डरलाग्दा!', en: 'They say jackals don’t hurt people... but those eyes!' },
    childSmile: { ne: ' बाटोमा भेटेकी सानी नानीलाई सम्झेर ओठमा मुस्कान आयो।', en: ' Thinking of the little girl you helped, you smile.' },
  };

  // Decisions that appear on the road. Each one is resolved once by a choice.
  const DILEMMAS = {
    child: {
      scenes: ['chautari', 'fields', 'road', 'crossroads', 'temple'], voice: 'child',
      text: { ne: 'बाटो छेउमा एउटी सानी नानी घुँडामा टाउको राखेर रोइरहेकी छ। "मेरो घर हरायो... आमा कहाँ हुनुहुन्छ?"', en: 'A little girl sits by the path, crying into her knees. "I can’t find my house... where is my mother?"' },
      thought: { ne: 'म आफैँ हराएको छु... तर यति सानी नानीलाई यसरी छोडेर कसरी जाऊँ?', en: 'I’m lost myself... but how can I leave someone so small like this?' },
      options: [
        { label: { ne: 'नानीलाई घर पुर्‍याइदिने (३५ मिनेट)', en: 'Help her find home (35 min)' }, act: 'helpChild' },
        { label: { ne: 'माफ गर नानी, म आफैँ हराएको छु', en: 'Sorry, I’m lost too' }, act: 'leaveChild' },
      ],
    },
    snake: {
      scenes: ['forest', 'fields', 'river'],
      text: { ne: 'बाटोको बीचमा एउटा लामो सर्प कुण्डली पारेर बसेको छ!', en: 'A long snake lies coiled in the middle of the path!' },
      thought: { ne: 'नचल्नू... बिस्तारै सास फेर्नू।', en: 'Don’t move... breathe slowly.' },
      options: [
        { label: { ne: 'चुपचाप पर्खिने', en: 'Wait quietly' }, act: 'snakeWait' },
        { label: { ne: 'ढुङ्गा फालेर तर्साउने', en: 'Toss a stone to scare it' }, act: 'snakeStone' },
        { label: { ne: 'झाडी हुँदै छेउबाट जाने', en: 'Go around through the bushes' }, act: 'snakeAround' },
      ],
    },
    rain: {
      scenes: ['forest', 'fields', 'road', 'crossroads', 'river', 'chautari'],
      text: { ne: 'अचानक झरी पर्न थाल्यो! चिसो पानीले जिउ भिज्न थाल्यो।', en: 'Suddenly it starts to pour! The cold rain soaks through your clothes.' },
      thought: { ne: 'अब के गर्ने? ओत लाग्ने कि हिँडिरहने?', en: 'What now? Take shelter or keep going?' },
      options: [
        { label: { ne: 'रुखमुनि ओत लाग्ने (२५ मिनेट)', en: 'Shelter under a tree (25 min)' }, act: 'rainShelter' },
        { label: { ne: 'भिजेरै अगाडि बढ्ने', en: 'Keep going, soaked' }, act: 'rainWalk' },
      ],
    },
    eyes: {
      scenes: ['forest', 'fields', 'crossroads'], after: 150,
      text: { ne: 'अँध्यारोमा दुईवटा, चारवटा... धेरै आँखा चम्किए। स्यालहरू!', en: 'In the dark, two eyes, then four... many eyes glow. Jackals!' },
      thought: { ne: 'मुटु मुखमै आयो...', en: 'My heart is in my throat...' },
      options: [
        { label: { ne: 'टर्च बालेर तर्साउने', en: 'Scare them with the torch' }, act: 'eyesTorch', needs: 'light' },
        { label: { ne: 'जोडले कराउने', en: 'Shout loudly' }, act: 'eyesShout' },
        { label: { ne: 'बिस्तारै पछि हट्ने', en: 'Back away slowly' }, act: 'eyesBack' },
      ],
    },
  };

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
  const NO_SIGNAL = ['forest', 'river', 'bridge'];

  // What you say out loud: the conversation goes both ways.
  const PLAYER = {
    ask: { ne: 'नमस्ते! {village} जाने बाटो कता हो, बताइदिनुहुन्छ?', en: 'Namaste! Could you tell me the way to {village}?' },
    askDog: { ne: 'ए साथी, तँलाई {village} जाने बाटो थाहा छ?', en: 'Hey buddy, do you know the way to {village}?' },
    sure: { ne: 'पक्का हो? म फेरि हराउन चाहन्नँ।', en: 'Are you sure? I really don’t want to get lost again.' },
    chat: { ne: 'यति राति तपाईं यहाँ के गर्दै हुनुहुन्छ?', en: 'What brings you out here so late?' },
    tea: { ne: 'दिदी, एक कप चिया पाऊँ न।', en: 'Didi, could I have a cup of tea?' },
    followHer: { ne: 'ठिक छ, म तपाईंसँगै आउँछु।', en: 'Okay, I’ll come with you.' },
    followDog: { ne: 'हिँड् साथी, बाटो देखा!', en: 'Come on, buddy, show me the way!' },
    charge: { ne: 'दिदी, मोबाइल एकछिन चार्ज गर्न पाऊँ?', en: 'Didi, may I charge my phone for a bit?' },
    call: { ne: 'हेलो मामा? म बाटो हराएँ...', en: 'Hello, Mama? I’m lost...' },
    helpChild: { ne: 'नरोऊ नानी, म तिमीलाई घर पुर्‍याइदिन्छु।', en: 'Don’t cry, little one. I’ll take you home.' },
    leaveChild: { ne: 'माफ गर नानी... म आफैँ हराएको छु।', en: 'I’m sorry, little one... I’m lost too.' },
  };

  // Each person gets their own voice (pitch / speed) from the browser's speech engine.
  const VOICE = {
    me: { pitch: 1.0, rate: 1.0 }, thought: { pitch: 1.05, rate: 1.08, volume: 0.7 },
    hajurama: { pitch: 1.25, rate: 0.82 }, gothalo: { pitch: 1.6, rate: 1.15 }, drunk: { pitch: 0.8, rate: 0.78 },
    didi: { pitch: 1.3, rate: 1.0 }, jhankri: { pitch: 0.6, rate: 0.8 }, kichkandi: { pitch: 0.55, rate: 0.72, volume: 0.85 },
    bhariya: { pitch: 0.85, rate: 0.95 }, sadhu: { pitch: 0.65, rate: 0.78 }, driver: { pitch: 0.9, rate: 1.05 }, maiju: { pitch: 1.3, rate: 1.0 },
    child: { pitch: 1.8, rate: 1.1 }, baba: { pitch: 0.85, rate: 0.95 }, mama: { pitch: 0.9, rate: 1.05 }, hajurbuba: { pitch: 0.7, rate: 0.82 },
  };

  const ENDINGS = {
    home: {
      title: 'घर पुगियो!',
      sub: { ne: 'मामाघरको आँगनमा बत्ती बल्यो। माइजुले ढोका खोल्नुभयो: "यति राति? आऊ आऊ, भित्र आऊ!"', en: 'A light comes on in your mamaghar\'s courtyard. Maiju opens the door: "This late? Come in, come in!"' },
      thought: { ne: 'मोबाइल बन्द भए पनि मान्छेहरूको मनले बाटो देखायो।', en: 'My phone was dead, but people\'s kindness showed me the way.' },
    },
    morning: {
      title: 'बिहान भयो',
      sub: { ne: 'पूर्वमा घाम झुल्कियो, चराहरू चिरबिर गर्न थाले। उज्यालोमा दूध बोक्ने दाइ भेटिनुभयो र {village} पुर्‍याइदिनुभयो।', en: 'The sun rises in the east and the birds start singing. In the daylight a milkman finds you and walks you to {village}.' },
      thought: { ne: 'रात जति लामो भए पनि बिहान हुन्छ नै।', en: 'No matter how long the night, morning always comes.' },
    },
    sleep: {
      title: 'थाकेर निदाइयो',
      sub: { ne: 'थकाइले बाटोकै छेउमा निदाइयो। बिहान एक हजुरबुबाले उठाएर {village} पुर्‍याइदिनुभयो।', en: 'Exhausted, you fall asleep by the roadside. In the morning an old man wakes you and takes you to {village}.' },
      thought: { ne: 'अर्को पटक मोबाइल चार्ज गरेर मात्र हिँड्नुपर्छ!', en: 'Next time, I\'m charging my phone before I leave!' },
    },
  };

  // ---------- State ----------
  let state = 'menu';
  let best = store.get('bh_best', null);
  let world = null, cur = 0, prevNode = -1, minutes = 0, stamina = 100, fear = 10, moves = 0;
  let metSet = new Set(), memory = [], lines = [], busy = false, endKind = null, endMinutes = 0;
  let midnightDone = false, time = 0, village = VILLAGES[0];
  let battery = 0, torchOn = false, hasTorch = false, flags = {}, dilemmasSeen = new Set();
  const badges = new Set(store.get('bh_badges', []));
  const demoNode = { id: 7, scene: 'forest', person: null };

  // ---------- Voices (Web Speech API: free, built into the browser) ----------
  const voice = {
    on: store.get('bh_voice', true) !== false,
    list: [],
    supported: 'speechSynthesis' in window,
    init() {
      if (!this.supported) return;
      const load = () => { this.list = speechSynthesis.getVoices(); };
      load();
      speechSynthesis.addEventListener('voiceschanged', load);
    },
    pick() { // a Nepali voice if the device has one, otherwise Hindi (reads Devanagari well)
      const v = this.list;
      if (lang === 'ne') return v.find((x) => /^ne/i.test(x.lang)) || v.find((x) => /^hi/i.test(x.lang)) || null;
      return v.find((x) => /^en-IN/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang) && x.localService) || v.find((x) => /^en/i.test(x.lang)) || null;
    },
    available() { return this.supported && !!this.pick(); },
    say(text, key) {
      if (!this.on || !this.supported || audio.muted) return;
      const v = this.pick();
      if (!v) return;
      const clean = text.replace(/["“”]/g, '').replace(/\.\.\./g, ', ').replace(/→/g, '').trim();
      if (!clean) return;
      const prof = VOICE[key] || VOICE.me;
      const u = new SpeechSynthesisUtterance(clean);
      u.voice = v; u.lang = v.lang; u.pitch = prof.pitch; u.rate = prof.rate; u.volume = prof.volume ?? 1;
      speechSynthesis.speak(u);
    },
    stop() { if (this.supported) speechSynthesis.cancel(); },
  };
  voice.init();
  function setVoiceUI() { ui.voiceBtn.classList.toggle('muted', !voice.on); ui.voiceBtn.setAttribute('aria-pressed', String(voice.on)); }

  // ---------- Time ----------
  function clockParts(m) {
    const total = 21 * 60 + Math.floor(m), h24 = Math.floor(total / 60) % 24, mm = total % 60;
    return { h24, h12: h24 % 12 || 12, mm };
  }
  function fmtClock(m) {
    const c = clockParts(m), s = `${c.h12}:${String(c.mm).padStart(2, '0')}`;
    if (lang === 'ne') return `${c.h24 >= 4 && c.h24 < 12 ? 'बिहान' : 'राति'} ${digits(s)}`;
    return `${s} ${c.h24 >= 12 ? 'PM' : 'AM'}`;
  }

  // ---------- World generation ----------
  function genWorld() {
    const nodes = [], counts = {};
    const add = (scene) => { const n = { id: nodes.length, scene, exits: [], person: null, visits: 0, descIdx: randInt(0, 5), thinkIdx: randInt(0, 5), sign: scene === 'crossroads' }; nodes.push(n); counts[scene] = (counts[scene] || 0) + 1; return n; };
    const CAPS = { teashop: 2, temple: 1, bridge: 2 };
    const POOL = ['forest', 'forest', 'forest', 'river', 'river', 'bridge', 'chautari', 'chautari', 'temple', 'teashop', 'fields', 'fields', 'road', 'crossroads', 'crossroads'];
    const sceneFor = () => { for (;;) { const s = pick(POOL); if (!CAPS[s] || (counts[s] || 0) < CAPS[s]) return s; } };
    const edges = [];
    const linked = (a, b) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    const deg = (n) => edges.filter(([x, y]) => x === n || y === n).length;
    const link = (a, b) => { if (a !== b && !linked(a, b)) edges.push([a, b]); };

    const LEN = 6;
    const main = [add('road')];
    for (let i = 1; i < LEN; i++) main.push(add(sceneFor()));
    main.push(add('village'));
    for (let i = 0; i < LEN; i++) link(main[i], main[i + 1]);
    for (let i = 0; i < LEN; i++) {
      const branches = i === 0 ? 2 : randInt(1, 2);
      for (let b = 0; b < branches && deg(main[i]) < 4; b++) {
        let prev = main[i];
        const len = randInt(1, 2);
        for (let k = 0; k < len; k++) { const s = add(sceneFor()); link(prev, s); prev = s; }
        if (Math.random() < 0.5) { // sometimes a side path loops back to the main route
          const target = main[clamp(i + pick([-1, 1, 2]), 0, LEN - 1)];
          if (target !== main[i] && deg(target) < 4 && deg(prev) < 3) link(prev, target);
        }
      }
    }
    if (!counts.teashop) { const n = pick(nodes.filter((x) => x.scene !== 'village' && x.id !== 0)); n.scene = 'teashop'; n.sign = false; }

    for (const [a, b] of edges) { // label each path with a landmark
      const ua = new Set(a.exits.map((e) => e.path)), ub = new Set(b.exits.map((e) => e.path));
      const ok = (p) => !ua.has(p) && !ub.has(revPath(p));
      const pref = SCENE_PATH[b.scene];
      const p = pref && ok(pref) && Math.random() < 0.6 ? pref : shuffle(PATH_IDS.slice()).find(ok) || 'trail';
      const cost = randInt(25, 45) + (p === 'up' || p === 'down' ? 5 : 0);
      a.exits.push({ to: b.id, path: p, cost });
      b.exits.push({ to: a.id, path: revPath(p), cost });
    }

    for (const n of nodes) { // a dead end can't be a crossroads or a bridge
      if (n.exits.length === 1 && (n.scene === 'crossroads' || n.scene === 'bridge')) { n.scene = pick(['forest', 'fields', 'river']); n.sign = false; }
    }
    const home = main[LEN];
    nodes.forEach((n) => { n.dist = Infinity; });
    home.dist = 0;
    const queue = [home];
    while (queue.length) { const n = queue.shift(); for (const e of n.exits) { const m = nodes[e.to]; if (m.dist === Infinity) { m.dist = n.dist + 1; queue.push(m); } } }

    const used = {};
    const can = (type) => (used[type] || 0) < PEOPLE_CAPS[type];
    const mk = (type) => { used[type] = (used[type] || 0) + 1; return { type, lies: type === 'gothalo' && Math.random() < 0.6, wrong: type === 'sadhu' && Math.random() < 0.15, gone: false }; };
    for (const n of nodes) {
      if (n.id === 0 || n.scene === 'village') continue;
      if (n.scene === 'teashop') { n.person = mk('didi'); continue; }
      if (Math.random() < (main.includes(n) ? 0.75 : 0.55)) {
        const options = Object.keys(PEOPLE).filter((k) => PEOPLE[k].scenes.includes(n.scene) && can(k));
        if (options.length) n.person = mk(pick(options));
      }
    }
    // fairness: at least two honest helpers somewhere on the true route
    const route = main.slice(1, LEN);
    let honest = route.filter((n) => n.person && (HONEST.includes(n.person.type) || n.person.type === 'didi')).length;
    for (const n of shuffle(route.slice())) {
      if (honest >= 2) break;
      if (n.person && (HONEST.includes(n.person.type) || n.person.type === 'didi')) continue;
      const options = HONEST.filter((k) => PEOPLE[k].scenes.includes(n.scene));
      n.person = mk(options.length ? pick(options) : 'bhariya');
      honest++;
    }
    return { nodes, start: main[0], home };
  }

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
    resize();
    arrive(world.start.id, { start: true });
    if (voice.on && voice.supported && !voice.available()) { addLine('sys', t('noVoice')); renderPanel(); }
  }

  function finish(kind) {
    if (state !== 'play') return;
    state = 'over'; endKind = kind; endMinutes = Math.min(minutes, DAWN);
    const E = ENDINGS[kind];
    const stars = kind === 'home' ? (minutes < 300 ? 3 : minutes < 390 ? 2 : 1) : 0; // before 2:00 AM, 3:30 AM
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
    resize();
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
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    renderBadges(ui.badges);
    showBest();
  }

  // ---------- Audio (all generated) ----------
  const audio = {
    ac: null, master: null, noiseBuf: null, river: null, wind: null, eerie: null, fire: null, scene: 'forest', who: null,
    muted: !!store.get('bh_muted', false),
    timers: { cricket: 0, owl: 8, heart: 0, bell: 4, bark: 6, bird: 0, fire: 0 },
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
        this.river = loop('bandpass', 700, 0.4);
        this.wind = loop('lowpass', 280, 0.7);
        this.eerie = ac.createGain(); this.eerie.gain.value = 0;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        this.eerie.connect(lp).connect(this.master);
        for (const f of [220, 223.4, 331]) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(this.eerie); o.start(); }
      }
      if (this.ac.state === 'suspended') this.ac.resume();
      this.setScene(this.scene, this.who);
    },
    rain: false,
    setRain(on) { this.rain = on; this.setScene(this.scene, this.who); },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ac.currentTime, 0.02); },
    setScene(scene, who) {
      this.scene = scene; this.who = who;
      if (!this.ac) return;
      const now = this.ac.currentTime;
      this.river.gain.setTargetAtTime(this.rain ? 0.11 : scene === 'river' || scene === 'bridge' ? 0.07 : 0, now, 0.8);
      this.wind.gain.setTargetAtTime(scene === 'bridge' ? 0.07 : 0.035, now, 0.8);
      this.eerie.gain.setTargetAtTime(who === 'kichkandi' ? 0.03 : 0, now, 1.2);
    },
    now() { return this.ac.currentTime; },
    tone(tm, f, dur, type, vol, f2) {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, tm); if (f2) o.frequency.exponentialRampToValueAtTime(f2, tm + dur);
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + Math.min(0.05, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
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
      g.gain.setValueAtTime(0.0001, tm); g.gain.exponentialRampToValueAtTime(vol, tm + 0.06);
      g.gain.setValueAtTime(vol, tm + Math.max(0.07, dur - 0.1)); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(this.master); o.start(tm); lfo.start(tm); o.stop(tm + dur + 0.02); lfo.stop(tm + dur + 0.02);
    },
    chirp(tm) { for (let k = 0; k < 3; k++) this.tone(tm + k * 0.045, 4300 + Math.random() * 300, 0.03, 'sine', 0.02); },
    owl() { if (!this.ac) return; const tm = this.now(); this.tone(tm, 420, 0.35, 'sine', 0.05, 380); this.tone(tm + 0.55, 400, 0.5, 'sine', 0.045, 360); },
    heart() { const tm = this.now(); this.tone(tm, 60, 0.12, 'sine', 0.22, 45); this.tone(tm + 0.22, 55, 0.12, 'sine', 0.16, 42); },
    bell() { if (!this.ac) return; const tm = this.now(); [[880, 0.05, 2.2], [1320, 0.025, 1.6], [2210, 0.012, 1]].forEach(([f, v, d]) => this.tone(tm, f, d, 'sine', v)); },
    bark() { if (!this.ac) return; const tm = this.now(); for (const o of [0, 0.32]) { this.noise(tm + o, 0.12, 'bandpass', 900, 0.15); this.tone(tm + o, 420, 0.12, 'sawtooth', 0.03, 300); } },
    jackal() { if (!this.ac) return; const tm = this.now(); for (const d of [0, 0.25]) { const o = this.ac.createOscillator(), g = this.ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(500 + d * 200, tm + d); o.frequency.linearRampToValueAtTime(950, tm + d + 0.5); o.frequency.linearRampToValueAtTime(620, tm + d + 1.3); g.gain.setValueAtTime(0.0001, tm + d); g.gain.exponentialRampToValueAtTime(0.03, tm + d + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, tm + d + 1.4); o.connect(g).connect(this.master); o.start(tm + d); o.stop(tm + d + 1.5); } },
    rustle() { if (!this.ac) return; const tm = this.now(); for (let k = 0; k < 5; k++) this.noise(tm + k * 0.07, 0.08, 'highpass', 2500, 0.08); },
    slip() { if (!this.ac) return; this.noise(this.now(), 0.25, 'bandpass', 1500, 0.15, 400); },
    whisper() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 1.6, 'bandpass', 3000, 0.05, 1200); this.tone(tm, 1480, 1.4, 'sine', 0.012, 1400); },
    pour() { if (!this.ac) return; const tm = this.now(); this.noise(tm, 0.8, 'bandpass', 1800, 0.06, 900); this.tone(tm + 0.8, 1320, 0.4, 'sine', 0.03); },
    footsteps() { if (!this.ac) return; const tm = this.now(); for (let k = 0; k < 4; k++) this.noise(tm + k * 0.22, 0.08, 'lowpass', 500, 0.25); },
    crackle() { const tm = this.now(); for (let k = 0; k < 3; k++) this.noise(tm + Math.random() * 0.3, 0.03, 'highpass', 1800, 0.05); },
    ending(kind) {
      if (!this.ac) return;
      const tm = this.now(), SC = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];
      const seq = kind === 'home' ? [0, 1, 2, 3, 4, 5, 3, 5] : kind === 'morning' ? [3, 2, 3, 4, 3, 2, 0] : [3, 2, 1, 0];
      seq.forEach((i, k) => this.flute(tm + 0.4 + k * 0.32, SC[i], 0.34, 0.05));
    },
    tick(dt) {
      if (!this.ac || this.ac.state !== 'running') return;
      const T = this.timers, dawnK = clamp((minutes - 450) / 60, 0, 1), playing = state === 'play';
      T.cricket -= dt;
      if (T.cricket <= 0 && dawnK < 0.8 && state !== 'over') { this.chirp(this.now()); T.cricket = rand(0.15, 0.9) * (this.scene === 'forest' || this.scene === 'fields' ? 0.6 : 1.3); }
      T.owl -= dt; if (T.owl <= 0) { if (dawnK < 0.5 && state !== 'over') this.owl(); T.owl = rand(14, 28); }
      if (playing && fear > 60) { T.heart -= dt; if (T.heart <= 0) { this.heart(); T.heart = lerp(1.0, 0.5, (fear - 60) / 40); } }
      if (this.scene === 'temple') { T.bell -= dt; if (T.bell <= 0) { this.bell(); T.bell = rand(7, 12); } }
      if (this.who === 'kukur') { T.bark -= dt; if (T.bark <= 0) { this.bark(); T.bark = rand(10, 18); } }
      if (this.who === 'jhankri' || this.who === 'sadhu') { T.fire -= dt; if (T.fire <= 0) { this.crackle(); T.fire = rand(0.4, 1.2); } }
      if (dawnK > 0.3 || state === 'over') { T.bird -= dt; if (T.bird <= 0) { const tm = this.now(); for (let k = 0; k < 4; k++) this.tone(tm + k * 0.09, rand(2600, 3800), 0.07, 'sine', 0.02, rand(2200, 4200)); T.bird = rand(0.6, 2); } }
    },
  };
  function setMuteUI() { ui.mute.classList.toggle('muted', audio.muted); ui.mute.setAttribute('aria-pressed', String(audio.muted)); }

  // ---------- Rendering ----------
  let W = 0, H = 0, DPR = 1, gy = 0, u = 10, px = 0, portrait = false;
  let stars = [], hills = [], fireflies = [];
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const vw = window.innerWidth, vh = window.innerHeight;
    // Wide screens: the story sits in a right-hand column (same rule as the CSS media query); the scene fills the rest.
    const sidebar = state === 'play' && vw >= 900 && vw / vh >= 1.25;
    W = sidebar ? vw - Math.min(440, vw * 0.36) : vw; H = vh;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    glows.clear(); vignette = null;
    portrait = H > W * 1.1;
    gy = H * (sidebar ? 0.6 : portrait ? 0.4 : 0.46);
    u = sidebar ? Math.min(H * 0.03, W * 0.05) : Math.min(H * 0.024, W * 0.045);
    px = W * (portrait ? 0.64 : 0.62);
    stars = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * gy, s: rand(0.6, 1.8), p: rand(0, TAU) }));
    const rnd = mulberry32(3);
    hills = [0, 1].map((k) => { const pts = []; for (let i = 0; i <= 40; i++) pts.push(gy - (k ? 0.05 : 0.12) * H - (rnd() * 0.06 + Math.sin(i * 0.4 + k * 2) * 0.03) * H); return pts; });
    fireflies = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: gy + rand(-H * 0.2, H * 0.1), p: rand(0, TAU), s: rand(0.5, 1.2) }));
  }

  // Big gradient fills are very slow on phones that draw the canvas in software, so gradients
  // are painted once into small offscreen canvases and copied (whole device pixels, so a copy
  // is never resampled), with globalAlpha supplying any flicker. Same pixels, much less work.
  const snap = (v) => Math.round(v * DPR) / DPR;
  const glows = new Map(); // a few soft glow sprites, by size and colour
  function glow(x, y, r, rgb, a) {
    const key = `${r}|${rgb}`;
    let s = glows.get(key);
    if (!s) {
      if (glows.size > 8) glows.delete(glows.keys().next().value); // keep memory small
      const n = Math.ceil(r * 2 * DPR), c = (s = document.createElement('canvas')).getContext('2d');
      s.width = s.height = n;
      const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, r * DPR);
      g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g; c.fillRect(0, 0, n, n);
      glows.set(key, s);
    }
    const ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * a; ctx.drawImage(s, snap(x - r), snap(y - r), s.width / DPR, s.height / DPR); ctx.globalAlpha = ga;
  }
  // A vertical gradient is painted into a 1px-wide column (again only when its colours or size
  // change) and stretched across the rect.
  function vGrad(slot, x, y, w, h, y0, y1, stops) {
    const rows = Math.max(1, Math.ceil(h * DPR)), key = `${DPR}|${rows}|${y0 - y}|${y1 - y}|${stops.join()}`;
    const c = slot.c || (slot.c = document.createElement('canvas'));
    if (slot.key !== key) {
      slot.key = key; c.width = 1; c.height = rows;
      const cx = c.getContext('2d'), g = cx.createLinearGradient(0, (y0 - y) * DPR, 0, (y1 - y) * DPR);
      for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
      cx.fillStyle = g; cx.fillRect(0, 0, 1, rows);
    }
    ctx.drawImage(c, 0, 0, 1, h * DPR, x, y, w, h);
  }
  const skyCol = {}, groundCol = {}, riverCol = {}, beamCol = {};
  let vignette = null; // the dark edges: drawn once at full strength, then faded with globalAlpha
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function poly(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); }

  function pine(x, base, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x - h * 0.03, base - h * 0.25, h * 0.06, h * 0.25);
    for (let k = 0; k < 3; k++) { const w = h * (0.42 - k * 0.1), y0 = base - h * (0.2 + k * 0.25); poly([[x - w, y0], [x, y0 - h * 0.38], [x + w, y0]]); }
  }
  function broad(x, base, h, col, rnd) {
    ctx.fillStyle = col;
    ctx.fillRect(x - h * 0.04, base - h * 0.55, h * 0.08, h * 0.55);
    for (let k = 0; k < 5; k++) dot(x + (rnd() - 0.5) * h * 0.5, base - h * (0.6 + rnd() * 0.3), h * (0.18 + rnd() * 0.08));
  }

  function drawSky(dawnK) {
    vGrad(skyCol, 0, 0, W, gy + 2, 0, gy, [0, mix('#03050f', '#2b3a6b', dawnK), 0.7, mix('#0a1130', '#c86b4a', dawnK), 1, mix('#141c44', '#f2b36b', dawnK)]);
    ctx.fillStyle = '#ffffff';
    for (const s of stars) { ctx.globalAlpha = (1 - dawnK) * (0.3 + 0.7 * Math.sin(time * 1.3 + s.p) ** 2); ctx.fillRect(s.x, s.y, s.s, s.s); }
    ctx.globalAlpha = 1;
    const mk = clamp(minutes / DAWN, 0, 1), mx = lerp(W * 0.3, W * 0.9, mk), my = Math.max(gy * 0.36, 150) - Math.sin(mk * Math.PI) * gy * 0.08; // clear of the HUD
    glow(mx, my, u * 6, '220,230,255', 0.25 * (1 - dawnK));
    ctx.fillStyle = `rgba(240,240,225,${1 - dawnK * 0.7})`; dot(mx, my, u * 1.3);
    ctx.fillStyle = mix('#03050f', '#2b3a6b', dawnK); dot(mx + u * 0.5, my - u * 0.25, u * 1.1); // crescent
    if (dawnK > 0) glow(W * 0.85, gy, H * 0.4, '255,170,90', 0.35 * dawnK);
    hills.forEach((pts, k) => {
      ctx.fillStyle = mix(k ? '#070b1c' : '#0b1230', k ? '#3a3048' : '#5a4a6a', dawnK);
      ctx.beginPath(); ctx.moveTo(0, gy + 2);
      pts.forEach((y, i) => ctx.lineTo((i / (pts.length - 1)) * W, y));
      ctx.lineTo(W, gy + 2); ctx.closePath(); ctx.fill();
    });
    vGrad(groundCol, 0, gy, W, H - gy, gy, H, [0, mix('#0b1022', '#3a3a3a', dawnK * 0.6), 1, '#03040a']);
  }

  function drawScene(n, dawnK) {
    const rnd = mulberry32(n.id * 977 + 13);
    const back = mix('#0f1736', '#3b3550', dawnK), front = mix('#060912', '#1c1a26', dawnK);
    switch (n.scene) {
      case 'forest': {
        for (let i = 0; i < 16; i++) pine(rnd() * W, gy + rnd() * u * 2, u * (6 + rnd() * 5), back);
        ctx.fillStyle = '#1a1a26'; poly([[W * 0.42, gy], [W * 0.5, gy], [W * 0.75, H], [W * 0.2, H]]);
        for (let i = 0; i < 6; i++) { const left = i % 2 === 0; pine(left ? rnd() * W * 0.22 : W - rnd() * W * 0.22, gy + u * (3 + rnd() * 4), u * (14 + rnd() * 6), front); }
        break;
      }
      case 'river': {
        for (let i = 0; i < 10; i++) broad(rnd() * W, gy, u * (5 + rnd() * 3), back, rnd);
        vGrad(riverCol, 0, gy + u, W, H, gy + u, H, [0, mix('#14244a', '#7a6a8a', dawnK), 1, '#050a18']);
        ctx.strokeStyle = 'rgba(200,215,255,0.25)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 18; i++) { const y = gy + u * 2 + rnd() * (H - gy), x = ((rnd() * W + time * 30 * (0.5 + rnd())) % (W + 80)) - 40; line(x, y, x + u * (2 + rnd() * 3), y); }
        ctx.fillStyle = front; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(rnd() * W, gy + u * (2 + rnd() * 6), u * (1.5 + rnd() * 2), u * 0.8, 0, 0, TAU); ctx.fill(); }
        break;
      }
      case 'bridge': {
        ctx.fillStyle = '#04060c'; ctx.fillRect(0, gy, W, H);
        ctx.fillStyle = front; poly([[0, gy - u * 2], [W * 0.18, gy - u * 1], [W * 0.12, H], [0, H]]); poly([[W, gy - u * 2], [W * 0.82, gy - u], [W * 0.88, H], [W, H]]);
        const sag = (x0, x1, y, s) => { ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + s, x1, y); ctx.stroke(); };
        const sway = Math.sin(time * 0.8) * u * 0.4;
        ctx.strokeStyle = '#3b3f55'; ctx.lineWidth = Math.max(2, u * 0.25);
        sag(W * 0.15, W * 0.85, gy - u * 1.2, u * 3 + sway);
        ctx.strokeStyle = '#555a72'; ctx.lineWidth = Math.max(1.5, u * 0.12);
        sag(W * 0.15, W * 0.85, gy - u * 4.5, u * 2.5 + sway); sag(W * 0.15, W * 0.85, gy - u * 4.8, u * 2.5 + sway);
        for (let i = 1; i < 14; i++) { const s = i / 14, x = lerp(W * 0.15, W * 0.85, s), b = 4 * s * (1 - s); line(x, gy - u * 4.5 + (u * 2.5 + sway) * b, x, gy - u * 1.2 + (u * 3 + sway) * b); }
        for (let i = 0; i < 22; i++) { const s = (i + 0.5) / 22, x = lerp(W * 0.15, W * 0.85, s), y = gy - u * 4.8 + (u * 2.5 + sway) * 4 * s * (1 - s); ctx.fillStyle = FLAG[i % 5]; ctx.globalAlpha = 0.55; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(time * 4 + i) * 0.3); ctx.fillRect(-u * 0.3, 0, u * 0.6, u * 0.8); ctx.restore(); }
        ctx.globalAlpha = 1;
        break;
      }
      case 'chautari': {
        for (let i = 0; i < 6; i++) broad(rnd() * W, gy, u * (5 + rnd() * 3), back, rnd);
        const cx = W * (portrait ? 0.3 : 0.35);
        ctx.fillStyle = mix('#1d1f2e', '#4a4552', dawnK);
        ctx.fillRect(cx - u * 6, gy - u * 1.6, u * 12, u * 1.6); ctx.fillRect(cx - u * 4.5, gy - u * 3, u * 9, u * 1.4);
        ctx.fillStyle = front; ctx.fillRect(cx - u * 0.6, gy - u * 12, u * 1.2, u * 9);
        const sway = Math.sin(time * 0.9) * u * 0.3;
        for (let k = 0; k < 9; k++) dot(cx + (rnd() - 0.5) * u * 14 + sway, gy - u * (12 + rnd() * 5), u * (3 + rnd() * 2));
        break;
      }
      case 'temple': {
        for (let i = 0; i < 8; i++) pine(rnd() * W, gy, u * (5 + rnd() * 4), back);
        const cx = W * (portrait ? 0.3 : 0.36), base = gy;
        ctx.fillStyle = '#1f1a22'; ctx.fillRect(cx - u * 4, base - u * 1, u * 8, u); ctx.fillRect(cx - u * 2.6, base - u * 5, u * 5.2, u * 4);
        ctx.fillStyle = '#120c10'; poly([[cx - u * 4.4, base - u * 4.6], [cx, base - u * 7.2], [cx + u * 4.4, base - u * 4.6]]); poly([[cx - u * 3, base - u * 6.6], [cx, base - u * 8.8], [cx + u * 3, base - u * 6.6]]);
        ctx.fillStyle = '#c99a2e'; poly([[cx - u * 0.4, base - u * 8.7], [cx, base - u * 10], [cx + u * 0.4, base - u * 8.7]]);
        const fl = 0.45 + 0.08 * Math.sin(time * 11) + 0.05 * Math.sin(time * 17);
        glow(cx, base - u * 2.2, u * 9, '255,180,80', fl);
        ctx.fillStyle = '#ffd27a'; dot(cx, base - u * 2.2, u * 0.35);
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 1.5; line(cx + u * 3.4, base - u * 5, cx + u * 3.4, base - u * 3.8);
        ctx.fillStyle = '#9c7a3a'; dot(cx + u * 3.4, base - u * 3.6, u * 0.4);
        break;
      }
      case 'teashop': {
        for (let i = 0; i < 6; i++) broad(rnd() * W, gy, u * (5 + rnd() * 3), back, rnd);
        const cx = n.anchorX = W * (portrait ? 0.55 : 0.55), top = gy - u * 9;
        ctx.fillStyle = '#1b1612'; ctx.fillRect(cx - u * 7, top, u * 14, u * 9);
        ctx.fillStyle = '#2b2f3a'; poly([[cx - u * 8, top + u * 0.5], [cx + u * 8, top - u * 0.8], [cx + u * 8, top + u * 0.2], [cx - u * 8, top + u * 1.4]]);
        const fl = 0.55 + 0.08 * Math.sin(time * 9);
        glow(cx - u * 3, top + u * 2, u * 14, '255,170,70', fl);
        ctx.fillStyle = '#3a2516'; ctx.fillRect(cx - u * 6, gy - u * 3.4, u * 12, u * 3.4);
        ctx.fillStyle = '#ffcf7a'; ctx.fillRect(cx - u * 3.3, top + u * 1.6, u * 0.6, u * 0.9);
        ctx.strokeStyle = '#ffcf7a'; ctx.lineWidth = 1; line(cx - u * 3, top + u * 1.2, cx - u * 3, top + u * 1.6);
        ctx.fillStyle = '#7a7f8a'; ctx.fillRect(cx + u * 2.4, gy - u * 4.4, u * 1.6, u * 1.0);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
        for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let j = 0; j <= 6; j++) ctx.lineTo(cx + u * (3 + k * 0.5) + Math.sin(time * 3 + j + k * 2) * u * 0.25, gy - u * 4.6 - j * u * 0.35); ctx.stroke(); }
        ctx.fillStyle = '#3a2516'; ctx.fillRect(cx - u * 3.6, top - u * 2.6, u * 7.2, u * 1.9); // signboard on the roof
        ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1, u * 0.15); line(cx - u * 2.8, top - u * 0.7, cx - u * 2.8, top + u * 0.2); line(cx + u * 2.8, top - u * 0.7, cx + u * 2.8, top - u * 0.4);
        ctx.fillStyle = '#e8d6b0'; ctx.font = `700 ${Math.round(u * 1.1)}px "Nirmala UI", "Noto Sans Devanagari", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('चिया पसल', cx, top - u * 1.65);
        n.anchorY = gy - u * 3.2;
        break;
      }
      case 'fields': {
        for (let i = 0; i < 5; i++) broad(rnd() * W, gy - u * 0.5, u * (4 + rnd() * 2), back, rnd);
        for (let k = 0; k < 7; k++) {
          const y = gy + (H - gy) * (k / 7) ** 1.3;
          ctx.fillStyle = mix(k % 2 ? '#0b1a14' : '#0e2018', '#3a4a3a', dawnK * 0.6);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + u * (1 + k * 0.6) * (k % 2 ? 1 : -1), W, y); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(160,190,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + u * (1 + k * 0.6) * (k % 2 ? 1 : -1), W, y); ctx.stroke();
        }
        break;
      }
      case 'crossroads':
      case 'road': {
        for (let i = 0; i < 7; i++) broad(rnd() * W, gy, u * (4 + rnd() * 3), back, rnd);
        ctx.strokeStyle = back; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const x = W * (0.15 + i * 0.35); line(x, gy - u * 9, x, gy + u * 2); line(x - u * 1.2, gy - u * 8.5, x + u * 1.2, gy - u * 8.5); }
        ctx.strokeStyle = 'rgba(15,23,54,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, gy - u * 8); ctx.quadraticCurveTo(W * 0.32, gy - u * 6.5, W * 0.5, gy - u * 8.5); ctx.quadraticCurveTo(W * 0.68, gy - u * 6.5, W, gy - u * 8); ctx.stroke();
        ctx.fillStyle = mix('#1e1c22', '#5a5048', dawnK);
        if (n.scene === 'road') poly([[W * 0.46, gy], [W * 0.54, gy], [W * 0.85, H], [W * 0.15, H]]);
        else { poly([[W * 0.45, gy], [W * 0.55, gy], [W * 0.7, H], [W * 0.3, H]]); poly([[W * 0.5, gy + u * 3], [W * 0.52, gy + u * 5], [-W * 0.1, gy + u * 10], [0, gy + u * 4]]); poly([[W * 0.5, gy + u * 3], [W * 0.5, gy + u * 5], [W * 1.1, gy + u * 10], [W, gy + u * 4]]); }
        if (n.scene === 'crossroads') {
          const sx = W * (portrait ? 0.3 : 0.36);
          ctx.save(); ctx.translate(sx, gy + u * 2); ctx.rotate(-0.12);
          ctx.fillStyle = '#2a2420'; ctx.fillRect(-u * 0.25, -u * 8, u * 0.5, u * 8);
          ctx.fillStyle = '#3d4a5c'; ctx.fillRect(-u * 3.5, -u * 8.2, u * 7, u * 2.2);
          ctx.strokeStyle = 'rgba(220,220,200,0.35)'; ctx.lineWidth = 2; line(-u * 2.6, -u * 7.1, u * 1.6, -u * 7.1); line(u * 1.6, -u * 7.1, u * 0.9, -u * 7.6);
          ctx.restore();
        } else { ctx.fillStyle = '#d8d2c4'; ctx.fillRect(W * 0.2, gy + u * 1.5, u * 1.2, u * 1.6); ctx.fillStyle = '#c23a2e'; ctx.fillRect(W * 0.2, gy + u * 1.5, u * 1.2, u * 0.5); }
        break;
      }
      case 'village': {
        for (let i = 0; i < 6; i++) broad(rnd() * W, gy, u * (4 + rnd() * 3), back, rnd);
        for (let i = 0; i < 6; i++) {
          const x = W * (0.08 + i * 0.16) + (rnd() - 0.5) * u * 2, w = u * (4 + rnd() * 2), h = u * (3 + rnd() * 2), y = gy + u * (1 + rnd() * 3);
          ctx.fillStyle = mix('#2a1c18', '#7a4a36', dawnK); ctx.fillRect(x - w / 2, y - h, w, h);
          ctx.fillStyle = mix('#14100e', '#4a3a30', dawnK); poly([[x - w * 0.62, y - h], [x, y - h - u * 2], [x + w * 0.62, y - h]]);
          glow(x, y - h * 0.5, u * 4, '255,190,90', 0.35);
          ctx.fillStyle = '#ffcf7a'; ctx.fillRect(x - u * 0.5, y - h * 0.7, u, u * 0.9);
        }
        break;
      }
      default: break;
    }
  }

  function drawPerson(n, p) {
    const anchorX = n.scene === 'teashop' ? (n.anchorX || W * 0.55) : px;
    const x = anchorX, base = n.scene === 'teashop' ? (n.anchorY || gy) : n.scene === 'river' ? gy + u * 0.6 : gy + u * 1.5; // on the bank, not in the water
    const skin = '#7a5440';
    ctx.lineCap = 'round';
    switch (p.type) {
      case 'hajurama': {
        glow(x + u * 2.6, base - u * 3.6, u * 10, '255,190,90', 0.38 + 0.05 * Math.sin(time * 9));
        ctx.strokeStyle = '#2a1c14'; ctx.lineWidth = u * 0.25; line(x - u * 2, base, x - u * 1.3, base - u * 5);
        ctx.fillStyle = '#4a1e26';
        ctx.beginPath(); ctx.moveTo(x - u * 1.7, base); ctx.lineTo(x - u * 1.4, base - u * 4.6); ctx.quadraticCurveTo(x - u * 0.5, base - u * 6.6, x + u * 0.9, base - u * 5.4); ctx.lineTo(x + u * 1.5, base); ctx.closePath(); ctx.fill();
        ctx.fillStyle = skin; dot(x + u * 0.55, base - u * 5.6, u * 0.72);
        ctx.fillStyle = '#5e2a32'; ctx.beginPath(); ctx.arc(x + u * 0.45, base - u * 5.7, u * 0.9, Math.PI * 0.9, Math.PI * 2.05); ctx.fill();
        ctx.strokeStyle = '#4a1e26'; ctx.lineWidth = u * 0.5; line(x + u * 0.7, base - u * 4.3, x + u * 2.3, base - u * 3.7);
        ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + u * 2.6, base - u * 3.5, u * 0.5, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = '#ffd27a'; ctx.fillRect(x + u * 2.2, base - u * 3.5, u * 0.8, u * 1.1);
        break;
      }
      case 'gothalo': {
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = u * 0.2; line(x - u * 1.6, base - u * 6.5, x + u * 1.2, base - u * 1.5);
        ctx.strokeStyle = '#1c2236'; ctx.lineWidth = u * 0.5; line(x - u * 0.4, base - u * 2, x - u * 0.6, base); line(x + u * 0.4, base - u * 2, x + u * 0.6, base);
        ctx.fillStyle = '#2c3a5a'; ctx.fillRect(x - u * 0.9, base - u * 4.4, u * 1.8, u * 2.5);
        ctx.fillStyle = skin; dot(x, base - u * 5.1, u * 0.65);
        ctx.fillStyle = '#7a2a2a'; poly([[x - u * 0.7, base - u * 5.4], [x + u * 0.7, base - u * 5.4], [x + u * 0.5, base - u * 6.1], [x - u * 0.6, base - u * 6]]);
        ctx.fillStyle = '#f5c518'; ctx.fillRect(x - u * 0.15, base - u * 5.9, u * 0.25, u * 0.25);
        break;
      }
      case 'drunk': {
        ctx.save(); ctx.translate(x, base); ctx.rotate(Math.sin(time * 1.4) * 0.09);
        ctx.strokeStyle = '#1a1c28'; ctx.lineWidth = u * 0.55; line(-u * 0.5, -u * 2.6, -u * 0.8, 0); line(u * 0.5, -u * 2.6, u * 0.9, 0);
        ctx.fillStyle = '#3a3226'; ctx.fillRect(-u * 1.1, -u * 5.6, u * 2.2, u * 3.1);
        ctx.fillStyle = skin; dot(0, -u * 6.3, u * 0.75);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-u * 0.8, -u * 7.1, u * 1.6, u * 0.45);
        ctx.strokeStyle = '#3a3226'; ctx.lineWidth = u * 0.45; line(u * 0.9, -u * 5.2, u * 1.9, -u * 4);
        ctx.fillStyle = '#6aa0a0'; ctx.globalAlpha = 0.7; ctx.fillRect(u * 1.7, -u * 4.4, u * 0.45, u * 1.2); ctx.globalAlpha = 1;
        ctx.restore();
        break;
      }
      case 'didi': {
        ctx.fillStyle = '#7a1f3a'; ctx.fillRect(x - u * 1.2, base - u * 3.2, u * 2.4, u * 3.2);
        ctx.fillStyle = skin; dot(x, base - u * 3.9, u * 0.75);
        ctx.fillStyle = '#120c0a'; ctx.beginPath(); ctx.arc(x, base - u * 4.05, u * 0.8, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#f5c518'; dot(x + u * 0.1, base - u * 3.2, u * 0.12);
        break;
      }
      case 'jhankri': {
        const fl = 0.5 + 0.1 * Math.sin(time * 13);
        glow(x - u * 2.6, base - u * 0.5, u * 8, '255,140,50', fl);
        ctx.fillStyle = '#ff8a2a'; for (let k = 0; k < 3; k++) poly([[x - u * (3.2 - k * 0.5), base], [x - u * (2.9 - k * 0.5) + Math.sin(time * 15 + k) * u * 0.2, base - u * (1.4 + Math.sin(time * 9 + k) * 0.3)], [x - u * (2.5 - k * 0.5), base]]);
        ctx.fillStyle = '#d8d2c4'; poly([[x - u * 1.8, base], [x - u * 0.8, base - u * 5], [x + u * 0.8, base - u * 5], [x + u * 1.8, base]]);
        ctx.strokeStyle = '#c23a2e'; ctx.lineWidth = u * 0.2; line(x - u * 0.8, base - u * 4.6, x + u * 0.8, base - u * 3.6);
        ctx.fillStyle = skin; dot(x, base - u * 5.7, u * 0.7);
        ctx.strokeStyle = '#2e7d6b'; ctx.lineWidth = u * 0.2;
        for (let k = -3; k <= 3; k++) line(x, base - u * 6.2, x + k * u * 0.35, base - u * 7.8 - Math.abs(k) * -u * 0.15);
        ctx.fillStyle = '#d4a017'; for (let k = -3; k <= 3; k++) dot(x + k * u * 0.35, base - u * 7.8 + Math.abs(k) * u * 0.15, u * 0.16);
        ctx.fillStyle = '#c8b48a'; dot(x + u * 2, base - u * 3.6, u * 1.1);
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = u * 0.15; line(x + u * 2, base - u * 2.5, x + u * 2, base - u * 1.2);
        break;
      }
      case 'kichkandi': {
        const bob = Math.sin(time * 1.6) * u * 0.3;
        glow(x, base - u * 3.5 + bob, u * 7, '200,210,255', 0.18);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#d9dde8'; poly([[x - u * 1.6, base - u * 0.3 + bob], [x - u * 0.8, base - u * 5.2 + bob], [x + u * 0.8, base - u * 5.2 + bob], [x + u * 1.6, base - u * 0.3 + bob]]);
        ctx.fillStyle = '#05060a'; poly([[x - u * 0.9, base - u * 6.7 + bob], [x + u * 0.9, base - u * 6.7 + bob], [x + u * 1.1, base - u * 3.4 + bob], [x - u * 1.1, base - u * 3.4 + bob]]);
        dot(x, base - u * 6.3 + bob, u * 0.85);
        ctx.fillStyle = '#c9c2b6'; // feet pointing backwards
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * u * 0.5, base + bob, u * 0.45, u * 0.2, 0, 0, TAU); ctx.fill(); for (let k = 0; k < 3; k++) dot(x + s * u * 0.5 + (k - 1) * u * 0.18, base - u * 0.2 + bob, u * 0.08); }
        ctx.globalAlpha = 1;
        break;
      }
      case 'kukur': {
        const b = base, wag = Math.sin(time * 12) * 0.5;
        ctx.fillStyle = '#5a4630';
        ctx.beginPath(); ctx.ellipse(x, b - u * 1.6, u * 1.6, u * 0.8, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#5a4630'; ctx.lineWidth = u * 0.35;
        for (const s of [-1.1, -0.6, 0.6, 1.1]) line(x + s * u, b - u * 1.2, x + s * u, b);
        dot(x + u * 1.7, b - u * 2.4, u * 0.7);
        poly([[x + u * 1.4, b - u * 3], [x + u * 1.6, b - u * 3.7], [x + u * 1.9, b - u * 2.9]]);
        ctx.save(); ctx.translate(x - u * 1.5, b - u * 1.9); ctx.rotate(-0.8 + wag); ctx.fillRect(0, -u * 0.15, u * 1.3, u * 0.3); ctx.restore();
        ctx.fillStyle = '#ffe9a0'; dot(x + u * 2, b - u * 2.5, u * 0.1);
        break;
      }
      case 'bhariya': {
        ctx.fillStyle = '#3a2f22'; poly([[x - u * 2.6, base - u * 7], [x + u * 0.2, base - u * 7.6], [x - u * 0.6, base - u * 3], [x - u * 1.8, base - u * 3]]);
        ctx.strokeStyle = 'rgba(120,100,70,0.6)'; ctx.lineWidth = 1; for (let k = 1; k < 5; k++) line(x - u * (2.5 - k * 0.12), base - u * (7 - k * 0.9), x + u * (0.1 - k * 0.15), base - u * (7.5 - k * 0.9));
        ctx.strokeStyle = '#1a1c28'; ctx.lineWidth = u * 0.5; line(x - u * 0.2, base - u * 2.6, x - u * 0.6, base); line(x + u * 0.4, base - u * 2.6, x + u * 0.6, base);
        ctx.fillStyle = '#2e3b4e'; poly([[x - u * 0.9, base - u * 2.4], [x - u * 0.4, base - u * 5], [x + u * 0.9, base - u * 4.6], [x + u * 0.9, base - u * 2.4]]);
        ctx.fillStyle = skin; dot(x + u * 0.7, base - u * 5.4, u * 0.65);
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = u * 0.15; line(x + u * 0.4, base - u * 5.9, x - u * 0.5, base - u * 6.8);
        ctx.lineWidth = u * 0.2; line(x + u * 1.6, base, x + u * 1.6, base - u * 3.5); line(x + u * 1.1, base - u * 3.5, x + u * 2.1, base - u * 3.5);
        break;
      }
      case 'sadhu': {
        const fl = 0.5 + 0.1 * Math.sin(time * 12);
        glow(x - u * 2.4, base - u * 0.6, u * 8, '255,140,50', fl);
        ctx.fillStyle = '#ff8a2a'; for (let k = 0; k < 3; k++) poly([[x - u * (3 - k * 0.5), base], [x - u * (2.7 - k * 0.5), base - u * (1.3 + Math.sin(time * 9 + k) * 0.3)], [x - u * (2.3 - k * 0.5), base]]);
        ctx.fillStyle = '#b8541a'; ctx.beginPath(); ctx.ellipse(x, base - u * 0.6, u * 2, u * 0.8, 0, 0, TAU); ctx.fill();
        poly([[x - u * 1.2, base - u * 0.6], [x - u * 0.8, base - u * 3.8], [x + u * 0.8, base - u * 3.8], [x + u * 1.2, base - u * 0.6]]);
        ctx.fillStyle = skin; dot(x, base - u * 4.5, u * 0.7);
        ctx.fillStyle = '#c8c4bc'; poly([[x - u * 0.5, base - u * 4.3], [x + u * 0.5, base - u * 4.3], [x, base - u * 3]]);
        ctx.fillStyle = '#2a2018'; dot(x, base - u * 5.3, u * 0.45);
        break;
      }
      case 'driver': {
        ctx.fillStyle = '#20232e'; ctx.fillRect(x - u * 9, base - u * 6.5, u * 6.5, u * 5.2); ctx.fillRect(x - u * 2.8, base - u * 4.6, u * 2.4, u * 3.3);
        ctx.fillStyle = '#0c0d12'; dot(x - u * 7.5, base - u * 1.2, u * 1.1); dot(x - u * 1.6, base - u * 1.2, u * 1.1);
        ctx.fillStyle = 'rgba(255,240,180,0.12)'; poly([[x - u * 0.4, base - u * 3.2], [W, base - u * 6], [W, base + u * 2]]);
        ctx.fillStyle = '#ffe9a0'; dot(x - u * 0.5, base - u * 3.2, u * 0.35);
        ctx.strokeStyle = '#1a1c28'; ctx.lineWidth = u * 0.5; line(x + u * 1.2, base - u * 2.4, x + u * 0.9, base); line(x + u * 1.9, base - u * 2.4, x + u * 2.2, base);
        ctx.fillStyle = '#4a5a3a'; ctx.fillRect(x + u * 0.6, base - u * 5, u * 2, u * 2.7);
        ctx.fillStyle = skin; dot(x + u * 1.6, base - u * 5.7, u * 0.7);
        ctx.fillStyle = '#c23a2e'; ctx.fillRect(x + u * 0.9, base - u * 6.5, u * 1.4, u * 0.4);
        break;
      }
      case 'hajurbuba': {
        ctx.fillStyle = '#e8e2d2'; poly([[x - u * 1.4, base], [x - u * 0.9, base - u * 3.4], [x + u * 0.9, base - u * 3.4], [x + u * 1.4, base]]);
        ctx.fillStyle = '#2d2f45'; ctx.fillRect(x - u * 1.6, base - u * 0.6, u * 3.2, u * 0.6);
        ctx.fillStyle = skin; dot(x, base - u * 4.1, u * 0.7);
        ctx.fillStyle = '#d8d2c4'; poly([[x - u * 0.45, base - u * 3.9], [x + u * 0.45, base - u * 3.9], [x, base - u * 3.1]]);
        ctx.fillStyle = '#7a2a2a'; poly([[x - u * 0.7, base - u * 4.4], [x + u * 0.7, base - u * 4.4], [x + u * 0.5, base - u * 5.1], [x - u * 0.6, base - u * 5]]);
        ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = u * 0.2; line(x + u * 1.6, base, x + u * 1.2, base - u * 4.5);
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - u * 1.05, base - u * 3.7, u * 0.4, u * 0.9);
        ctx.fillStyle = 'rgba(220,220,230,0.22)';
        for (let k = 0; k < 3; k++) dot(x - u * 0.9 - k * u * 0.3 + Math.sin(time + k) * u * 0.2, base - u * (4.3 + k * 0.7), u * (0.25 + k * 0.12));
        break;
      }
      default: break;
    }
  }

  function drawDilemma(n) {
    if (!n.dilemma) return;
    const x = px, base = gy + u * 1.5, open = !n.dilemmaDone;
    if (n.dilemma === 'child' && !n.childGone) { // she is still there if you walked past
      ctx.fillStyle = '#8a2a4a'; poly([[x - u * 1.1, base], [x - u * 0.6, base - u * 2.6], [x + u * 0.6, base - u * 2.6], [x + u * 1.1, base]]);
      ctx.fillStyle = '#7a5440'; dot(x, base - u * 3.2, u * 0.6);
      ctx.fillStyle = '#120c0a'; dot(x - u * 0.62, base - u * 3.1, u * 0.24); dot(x + u * 0.62, base - u * 3.1, u * 0.24);
      ctx.beginPath(); ctx.arc(x, base - u * 3.3, u * 0.63, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(170,210,255,0.85)'; dot(x - u * 0.25, base - u * (3.1 - ((time * 1.5) % 1) * 0.6), u * 0.08);
    }
    if (n.dilemma === 'snake' && open) {
      const sx = W * 0.5, sy = gy + u * 3.5;
      ctx.strokeStyle = '#4a5a30'; ctx.lineWidth = u * 0.45; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) { const a = (k / 30) * TAU * 1.6, r = u * (1.8 - (k / 30) * 1.2); ctx.lineTo(sx + Math.cos(a) * r * 1.6, sy + Math.sin(a) * r * 0.6); }
      ctx.stroke();
      const hx = sx + u * 0.4, hy = sy - u * 1.6 + Math.sin(time * 3) * u * 0.15;
      ctx.beginPath(); ctx.moveTo(sx + u * 0.6, sy - u * 0.3); ctx.quadraticCurveTo(sx + u * 0.9, sy - u, hx, hy); ctx.stroke();
      ctx.fillStyle = '#4a5a30'; ctx.beginPath(); ctx.ellipse(hx, hy, u * 0.45, u * 0.3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8d24a'; dot(hx + u * 0.15, hy - u * 0.05, u * 0.07);
      if (Math.sin(time * 6) > 0.5) { ctx.strokeStyle = '#c23a2e'; ctx.lineWidth = 1.5; line(hx + u * 0.45, hy, hx + u * 0.85, hy + u * 0.1); }
    }
    if (n.dilemma === 'eyes' && open) {
      const r = mulberry32(n.id + 5);
      for (let k = 0; k < 6; k++) {
        const ex = W * (0.1 + r() * 0.8), ey = gy + u * (r() * 4 - 1);
        if (Math.sin(time * 1.3 + k * 2) > -0.85) { glow(ex, ey, u * 1.2, '255,220,80', 0.45); ctx.fillStyle = '#ffe680'; dot(ex - u * 0.3, ey, u * 0.12); dot(ex + u * 0.3, ey, u * 0.12); }
      }
    }
    if (n.dilemma === 'rain' && open) {
      const r = mulberry32(99);
      ctx.strokeStyle = 'rgba(170,190,230,0.35)'; ctx.lineWidth = 1;
      for (let k = 0; k < 140; k++) { const rx = (r() * W + time * 60) % W, ry = (r() * H + time * 700 * (0.7 + r() * 0.3)) % H; line(rx, ry, rx - 3, ry + 14); }
    }
  }

  function render() {
    const n = state === 'menu' || !world ? demoNode : (state === 'over' && endKind === 'home' ? { id: 999, scene: 'village' } : node());
    const dawnK = state === 'over' ? 1 : clamp((minutes - 450) / 60, 0, 1);
    drawSky(dawnK);
    drawScene(n, dawnK);
    if (state === 'play') { const p = personHere(n); if (p) drawPerson(n, p); else drawDilemma(n); }
    const ffScene = ['forest', 'fields', 'river', 'chautari'].includes(n.scene) && dawnK < 0.8;
    if (ffScene) {
      for (const f of fireflies) {
        const x = f.x + Math.sin(time * 0.5 * f.s + f.p) * 30, y = f.y + Math.cos(time * 0.7 * f.s + f.p) * 18;
        const a = Math.max(0, Math.sin(time * 2 * f.s + f.p));
        glow(x, y, 6, '210,255,120', 0.6 * a);
      }
    }
    ctx.fillStyle = `rgba(160,170,210,${0.05 * (1 - dawnK)})`;
    for (let k = 0; k < 2; k++) { const y = gy - u * (1 + k * 2), x = ((time * (8 + k * 6)) % (W * 2)) - W; ctx.fillRect(x, y, W * 1.4, u * 1.2); }
    ctx.fillStyle = `rgba(0,0,8,${0.22 * (1 - dawnK)})`; ctx.fillRect(0, 0, W, H);
    const lit = state === 'play' && torchOn;
    if (lit) { // torch beam from where you stand
      const top = gy - u * 4;
      ctx.save(); ctx.beginPath(); ctx.moveTo(W * 0.42, H); ctx.lineTo(W * 0.58, H); ctx.lineTo(W * 0.88, top); ctx.lineTo(W * 0.12, top); ctx.closePath(); ctx.clip();
      vGrad(beamCol, 0, top, W, H - top, H, top, [0, hasTorch ? 'rgba(255,225,160,0.3)' : 'rgba(235,245,255,0.28)', 1, 'rgba(255,240,210,0)']);
      ctx.restore();
    }
    const f = state === 'play' ? fear / 100 * (lit ? 0.7 : 1) : 0.1;
    const pulse = f > 0.6 ? Math.max(0, Math.sin(time * lerp(6, 11, (f - 0.6) / 0.4))) * 0.08 : 0;
    if (!vignette) {
      const c = (vignette = document.createElement('canvas')).getContext('2d');
      vignette.width = canvas.width; vignette.height = canvas.height; c.setTransform(DPR, 0, 0, DPR, 0, 0);
      const v = c.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.2, W / 2, H * 0.4, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = v; c.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = clamp(0.35 + 0.5 * f + pulse, 0, 0.95); ctx.drawImage(vignette, 0, 0, W, H); ctx.globalAlpha = 1;
  }

  // ---------- Input ----------
  ui.play.addEventListener('click', start);
  ui.retry.addEventListener('click', start);
  ui.mute.addEventListener('click', () => { audio.init(); if (!audio.muted) voice.stop(); audio.setMuted(!audio.muted); store.set('bh_muted', audio.muted); setMuteUI(); ui.mute.blur(); });
  ui.lang.addEventListener('click', () => { lang = lang === 'en' ? 'ne' : 'en'; store.set('bh_lang', lang); applyLang(); });
  ui.memBtn.addEventListener('click', openMemory);
  ui.voiceBtn.addEventListener('click', () => { voice.on = !voice.on; store.set('bh_voice', voice.on); if (!voice.on) voice.stop(); setVoiceUI(); ui.voiceBtn.blur(); });
  ui.memClose.addEventListener('click', () => { ui.memory.classList.add('hidden'); ui.memBtn.focus(); });
  ui.share.addEventListener('click', async () => {
    const s = best && endKind === 'home' ? '★'.repeat(best.stars) : '';
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
    if (e.code === 'KeyM') { audio.init(); audio.setMuted(!audio.muted); store.set('bh_muted', audio.muted); setMuteUI(); return; }
    if (e.code === 'Escape' && !ui.memory.classList.contains('hidden')) { ui.memory.classList.add('hidden'); return; }
    if (state === 'play' && !busy && ui.memory.classList.contains('hidden') && /^Digit[1-9]$/.test(e.code)) {
      const btns = [...ui.choices.querySelectorAll('button')];
      const b = btns[Number(e.code.slice(5)) - 1];
      if (b) { e.preventDefault(); b.click(); }
    }
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!audio.ac) return; if (document.hidden) audio.ac.suspend(); else audio.ac.resume(); });



  // ---------- Go ----------
  resize();
  setMuteUI();
  setVoiceUI();
  applyLang();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now; time += dt;
    audio.tick(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
