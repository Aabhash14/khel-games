// Phewa Glide: English + Nepali strings and the saved profile. PG.t('key') returns the current language.
(function () {
  const PG = (window.PG = window.PG || {});

  PG.STR = {
    title: ['Phewa Glide', 'फेवा उडान'],
    tag: ['Run off Sarangkot, ride the thermals, land on the lakeshore.', 'सराङकोटबाट दौडेर उड, तातो हावा समात, ताल किनारमा ओर्ल।'],
    loading: ['Laying out the wing…', 'पखेटा फिँजाउँदै…'],
    fly: ['Fly', 'उड'],
    flights: ['Flights', 'उडानहरू'],
    daily: ['Daily flight', 'आजको उडान'],
    dailySub: ['Same sky for everyone today', 'आज सबैका लागि एउटै आकाश'],
    locked: ['Get 1 star on the flight before', 'अघिल्लो उडानमा १ तारा ल्याऊ'],
    best: ['Best', 'उत्कृष्ट'],
    wing: ['Wing', 'पखेटा'],
    howTitle: ['How to fly', 'कसरी उड्ने'],
    how1: ['Drag left or right (or ← →) to turn. Lean into it.', 'घुम्न दायाँ-बायाँ तान (वा ← →)।'],
    how2: ['Drag up (↑) for speed bar: faster, but you sink.', 'माथि तान (↑): छिटो, तर तल झरिन्छ।'],
    how3: ['Drag down (↓) for brakes: slower. Brake just before touchdown to flare.', 'तल तान (↓): ब्रेक, बिस्तारै। भुइँ छुनुअघि ब्रेक लगाएर नरम ओर्ल।'],
    how4: ['Circle where the vultures circle. That is a thermal: free height.', 'गिद्ध घुमेको ठाउँमा घुम। त्यहाँ तातो हावा छ: सित्तैमा उचाइ।'],
    how5: ['The south face of Sarangkot lifts you when the lake breeze hits it.', 'तालको हावा सराङकोटको भीरमा ठोक्किँदा तिमीलाई माथि उचाल्छ।'],
    how6: ['Fly through prayer-flag rings, then land on the target by the lake.', 'लुङदार घेराबाट छिर, अनि ताल किनारको निशानामा ओर्ल।'],
    keys: ['Keyboard: arrows or WASD, P to pause', 'किबोर्ड: एरो वा WASD, रोक्न P'],
    ok: ['Got it', 'बुझेँ'],
    // flights
    f1: ['Morning breeze', 'बिहानको हावा'],
    f1s: ['Strong thermals, an easy line to the lake', 'बलियो तातो हावा, तालसम्म सजिलो बाटो'],
    f2: ['Midday tour', 'मध्यान्ह यात्रा'],
    f2s: ['Out to the Peace Pagoda and back', 'शान्ति स्तूपासम्म गएर फर्क'],
    f3: ['Golden hour', 'साँझको घाम'],
    f3s: ['Weak air, long glide, sunset landing', 'कमजोर हावा, लामो उडान, सूर्यास्तमा ओर्लाइ'],
    // HUD
    alt: ['Altitude', 'उचाइ'],
    agl: ['above ground', 'भुइँदेखि'],
    vario: ['Climb', 'चढाइ'],
    speed: ['Speed', 'गति'],
    rings: ['Rings', 'घेरा'],
    kmh: ['km/h', 'कि.मि./घ'],
    ms: ['m/s', 'मि/से'],
    m: ['m', 'मि'],
    paused: ['Paused', 'रोकियो'],
    resume: ['Keep flying', 'उडिरहू'],
    restart: ['Start again', 'फेरि सुरु'],
    home: ['Home', 'गृह'],
    // hints
    hStart: ['Drag to steer. Follow the arrow.', 'घुम्न तान। तीर पछ्याऊ।'],
    hThermal: ['Thermal! Keep turning inside it', 'तातो हावा! भित्रै घुमिरहू'],
    hRidge: ['Ridge lift: fly along the hill', 'भीरको हावा: डाँडाको छेउछेउ उड'],
    hSink: ['Sinking air, get out', 'झर्ने हावा, निस्क'],
    hLand: ['Head for the landing target', 'ओर्लने निशानातिर जाऊ'],
    hFlare: ['Brake now! (drag down)', 'अहिले ब्रेक! (तल तान)'],
    hLow: ['Getting low, find lift or land', 'होचो भयो, हावा खोज वा ओर्ल'],
    hBack: ['Turn back to the valley', 'उपत्यकातिर फर्क'],
    ring: ['Ring!', 'घेरा!'],
    combo: ['Chain ×{n}', 'लगातार ×{n}'],
    allRings: ['Every ring!', 'सबै घेरा!'],
    // results
    landed: ['Landed', 'ओर्लियो'],
    rBull: ['Bullseye!', 'ठ्याक्कै निशानामा!'],
    rTarget: ['On the target', 'निशानामा'],
    rField: ['In the landing field', 'ओर्लने मैदानमा'],
    rOff: ['Off the field, long walk back', 'मैदान बाहिर, लामो हिँडाइ'],
    rWater: ['Splash! A boatman fished you out of Phewa', 'छप्लाक! डुङ्गावालाले फेवाबाट निकाले'],
    rTree: ['Tree landing. The locals are not impressed', 'रुखमा अड्कियो। गाउँलेहरू खुसी भएनन्'],
    rHard: ['Hard landing, ouch', 'जोडले बजारियो, आत्था'],
    rSoft: ['Soft as a feather', 'प्वाँख जस्तै नरम'],
    sRings: ['Rings', 'घेरा'],
    sChain: ['Chain bonus', 'लगातार बोनस'],
    sLanding: ['Landing', 'ओर्लाइ'],
    sFlare: ['Flare', 'नरम ओर्लाइ'],
    sAir: ['Air time', 'हावामा समय'],
    sTotal: ['Total', 'जम्मा'],
    newBest: ['New best!', 'नयाँ रेकर्ड!'],
    again: ['Fly again', 'फेरि उड'],
    next: ['Next flight', 'अर्को उडान'],
    share: ['Share', 'सेयर'],
    copied: ['Copied!', 'कपी भयो!'],
    shareText: ['I flew {f} over Phewa Lake: {s} points, {r} rings, {st}. Beat me:', 'मैले फेवा तालमाथि {f} उडेँ: {s} अंक, {r} घेरा, {st}। जित्न सक्छौ?'],
    noGL: ['This browser cannot draw 3D. Try Chrome or update your phone.', 'यो ब्राउजरले 3D देखाउन सक्दैन। Chrome चलाऊ वा फोन अपडेट गर।'],
    wRed: ['Lali', 'लाली'],
    wSky: ['Himal', 'हिमाल'],
    wDhaka: ['Dhaka', 'ढाका'],
    wGold: ['Saanjh', 'साँझ'],
  };

  // ---------- saved profile ----------
  const KEY = 'phewa-glide-v1';
  const D = (PG.D = { lang: null, muted: false, wing: 0, stars: [0, 0, 0], best: [0, 0, 0], daily: { d: '', best: 0 }, seenHow: false });
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') Object.assign(D, s);
  } catch (e) { /* private mode */ }
  if (!D.lang) {
    let hub = null;
    try { hub = localStorage.getItem('khel.lang'); } catch (e) { /* ignore */ }
    D.lang = hub === 'ne' || hub === 'en' ? hub : ((navigator.language || '').toLowerCase().startsWith('ne') ? 'ne' : 'en');
  }
  PG.save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { /* ignore */ } };

  PG.t = (k, vars) => {
    const row = PG.STR[k];
    let s = row ? row[D.lang === 'ne' ? 1 : 0] : k;
    if (vars) for (const v in vars) s = s.replace('{' + v + '}', vars[v]);
    return s;
  };
  const NE_DIG = '०१२३४५६७८९';
  PG.num = (n) => {
    const s = Math.round(n).toLocaleString('en-US');
    return D.lang === 'ne' ? s.replace(/\d/g, (d) => NE_DIG[d]) : s;
  };
  PG.dec = (n) => {
    const s = (Math.round(n * 10) / 10).toFixed(1);
    return D.lang === 'ne' ? s.replace(/\d/g, (d) => NE_DIG[d]) : s;
  };
  PG.applyLang = () => {
    document.documentElement.lang = D.lang;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = PG.t(el.dataset.t); });
  };
})();
