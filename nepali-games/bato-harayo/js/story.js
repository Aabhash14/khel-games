/* Bato Harayo: story content in both languages (scenes, people, events, thoughts, lines, endings) and voice profiles. */
(() => {
  'use strict';
  const BH = (window.BH = window.BH || {});

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

  BH.Story = {
    VILLAGES, PATHS, PATH_IDS, revPath, SCENE_PATH, SCENES, PEOPLE, PEOPLE_CAPS, HONEST, HONEST_THOUGHT,
    EVENTS, THOUGHTS, LINES, EXTRA, DILEMMAS, NO_SIGNAL, PLAYER, VOICE, ENDINGS,
  };
})();
