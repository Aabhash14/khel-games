// Lakhey Run: English + Nepali strings. LR.t('key') returns the string in the current language.
(function () {
  const LR = (window.LR = window.LR || {});

  LR.STR = {
    title: ['Lakhey Run', 'लाखे दौड'],
    tag: ['You teased Majipa Lakhey. Now he is coming for you!', 'माझिपा लाखेलाई जिस्क्यायौ। अब ऊ लखेट्दै आउँदैछ!'],
    run: ['Run!', 'दौड!'],
    daily: ['Daily run', 'आजको दौड'],
    dailySub: ['Same streets for everyone today', 'आज सबैका लागि एउटै गल्ली'],
    best: ['Best', 'उत्कृष्ट'],
    coins: ['Mohar', 'मोहर'],
    yomari: ['Yomari', 'योमरी'],
    buy: ['Buy', 'किन'],
    shopTitle: ['Yomari stall', 'योमरी पसल'],
    shopNote: ['A Yomari lets you keep running after you get caught.', 'समातिएपछि पनि दौडिरहन योमरी चाहिन्छ।'],
    shopCost: ['for {n} mohar', '{n} मोहरमा'],
    notEnough: ['Not enough mohar yet', 'अझै मोहर पुगेन'],
    sound: ['Sound', 'आवाज'],
    howTitle: ['How to run', 'कसरी दौडने'],
    how1: ['Swipe left or right to switch lanes', 'लेन बदल्न दायाँ-बायाँ स्वाइप'],
    how2: ['Swipe up to jump the pots and poles', 'माटोको भाँडा र बाँस नाघ्न माथि स्वाइप'],
    how3: ['Swipe down to slide under the garlands', 'माला मुनिबाट छिर्न तल स्वाइप'],
    how4: ['At a corner, swipe the way the road turns', 'मोडमा, बाटो जता मोडिन्छ उतै स्वाइप'],
    how5: ['Fill the Jatra meter, then rush through anything', 'जात्रा मिटर भर, अनि जे आए पनि हुँइकिएर पार'],
    keys: ['Keyboard: arrows or WASD, Space to jump, N for Jatra rush', 'किबोर्ड: एरो वा WASD, जम्पका लागि Space, जात्राका लागि N'],
    // HUD
    m: ['m', 'मि'],
    score: ['Score', 'अंक'],
    naach: ['Jatra!', 'जात्रा!'],
    paused: ['Paused', 'रोकियो'],
    resume: ['Keep running', 'दौडिरहू'],
    home: ['Home', 'गृह'],
    // hints
    hJump: ['Swipe up: jump!', 'माथि स्वाइप: उफ्र!'],
    hSlide: ['Swipe down: slide!', 'तल स्वाइप: घिस्रिएर छिर!'],
    hLane: ['Swipe left: change lane', 'बायाँ स्वाइप: लेन बदल'],
    hTurnL: ['Corner! Swipe left', 'मोड! बायाँ स्वाइप'],
    hTurnR: ['Corner! Swipe right', 'मोड! दायाँ स्वाइप'],
    hChoose: ['Fork! Pick a road', 'दोबाटो! बाटो रोज'],
    hNaach: ['Jatra is full: tap it!', 'जात्रा भरियो: थिच!'],
    // fork signs
    gali: ['Sun Gali', 'सुन गल्ली'],
    galiSub: ['more mohar, more danger', 'धेरै मोहर, धेरै खतरा'],
    mandir: ['Mandir Bato', 'मन्दिर बाटो'],
    mandirSub: ['a blessing waits', 'आशीर्वाद पर्खिरहेछ'],
    // toasts
    tDhime: ['Dhime! Mohar come to you', 'धिमे! मोहर आफैँ आउँछ'],
    tBhusya: ['Bhusya! Double score', 'भुस्या! दोब्बर अंक'],
    tShield: ['Chamar! One free hit', 'चमर! एक पटक बचाउ'],
    tYomari: ['+1 Yomari!', '+१ योमरी!'],
    tNaach: ['Jatra rush!', 'जात्रा हुँइकाइ!'],
    tClose: ['Lakhey is right behind you!', 'लाखे ठ्याक्कै पछाडि!'],
    tSaved: ['The Chamar saved you', 'चमरले जोगायो'],
    // death and results
    caught: ['Lakhey caught you!', 'लाखेले समात्यो!'],
    crashed: ['Smashed into it!', 'ठोक्कियो!'],
    walled: ['Missed the corner!', 'मोड छुट्यो!'],
    revive: ['Eat a Yomari and keep running?', 'योमरी खाएर दौडिरहने?'],
    reviveBtn: ['Eat {n}', '{n} खाऊ'],
    noThanks: ['No thanks', 'पर्दैन'],
    over: ['Run over', 'दौड सकियो'],
    newBest: ['New best!', 'नयाँ रेकर्ड!'],
    dist: ['Distance', 'दूरी'],
    again: ['Run again', 'फेरि दौड'],
    share: ['Share story', 'स्टोरी सेयर'],
    shareLine: ['I teased Majipa Lakhey and ran {d} m before he got me. Beat that!', 'माझिपा लाखेलाई जिस्क्याएर {d} मि दौडेँ। जित्न सक्छौ?'],
    dailyTag: ['Daily run', 'आजको दौड'],
    saved: ['Image saved', 'फोटो सुरक्षित भयो'],
    who: ['Who runs?', 'को दौडने?'],
    boy: ['Boy', 'केटा'],
    girl: ['Girl', 'केटी'],
    boySub: ['Tapālan + topi', 'तपालन + टोपी'],
    girlSub: ['Haku patasi', 'हाकु पटासी'],
    loading: ['Lighting the lamps…', 'बत्ती बाल्दै…'],
    noGL: ['This device cannot show 3D graphics. Try another browser.', 'यो डिभाइसमा 3D चल्दैन। अर्को ब्राउजर प्रयोग गर।'],
    about: ['During Indra Jatra, Majipa Lakhey dances through Kathmandu and kids dare each other to tease him, then run when he lunges. Lakhey was a demon who became the protector of the city.', 'इन्द्रजात्रामा माझिपा लाखे काठमाडौँका गल्लीमा नाच्छ। केटाकेटी उसलाई जिस्क्याउँछन् अनि ऊ झम्टिँदा भाग्छन्। लाखे राक्षस थियो, जो पछि सहरको रक्षक बन्यो।'],
  };

  const KEY = 'lakhey-run-v1';
  const def = { who: 'm', lang: (navigator.language || '').startsWith('ne') ? 'ne' : 'en', muted: false, best: 0, daily: { d: '', best: 0 }, bank: 0, yomari: 1, tut: false, runs: 0 };
  LR.save = function () { try { localStorage.setItem(KEY, JSON.stringify(LR.D)); } catch (e) { /* storage blocked */ } };
  LR.D = (function () {
    try { return Object.assign({}, def, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, def); }
  })();

  LR.t = function (k, vars) {
    const a = LR.STR[k];
    let s = a ? a[LR.D.lang === 'ne' ? 1 : 0] : k;
    if (vars) for (const v in vars) s = s.replace('{' + v + '}', vars[v]);
    return s;
  };
  const NE = '०१२३४५६७८९';
  LR.num = function (n) {
    const s = Math.floor(n).toLocaleString('en-IN');
    return LR.D.lang === 'ne' ? s.replace(/\d/g, (d) => NE[d]) : s;
  };
  LR.applyLang = function () {
    document.documentElement.lang = LR.D.lang;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = LR.t(el.dataset.t); });
  };
})();
