/* Builds the full 1000-question bank (window.QUESTION_BANK: 15 arrays, one per level).
   Sources: hand-written questions (questions.js, questions-extra.js) plus questions
   generated from the data tables below. Generated answers are computed from the data,
   and every question has a stable id so the game can remember what a player has seen. */
(function () {
  'use strict';

  const TARGET = 1000;
  const ND = '०१२३४५६७८९';
  const npd = (s) => String(s).replace(/[0-9]/g, (d) => ND[d]);
  const L = (n) => Math.max(1, Math.min(15, Math.round(n)));
  function group(n, lakh) {
    const s = String(n);
    if (!lakh || s.length <= 3) return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const last3 = s.slice(-3), rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  const numEn = (n) => (Math.abs(n) >= 10000 ? group(n, false) : String(n));
  const numNp = (n) => npd(Math.abs(n) >= 10000 ? group(n, true) : String(n));
  const pair = (n) => [numEn(n), numNp(n)];

  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h; }
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffled(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  /* pick n distinct items (by english text) not equal to the right answer */
  function pick(r, pool, n, right) {
    const out = [], seen = new Set([right[0]]);
    for (const x of shuffled(pool, r)) { if (out.length === n) break; if (!seen.has(x[0])) { seen.add(x[0]); out.push(x); } }
    return out;
  }
  /* plausible wrong numbers near the right one */
  function numWrong(r, ans) {
    const c = new Set();
    const add = (v) => { if (Number.isInteger(v) && v > 0 && v !== ans) c.add(v); };
    if (ans <= 12) { [1, 2, 3, -1, -2, -3, 4].forEach((d) => add(ans + d)); }
    else if (ans < 100) {
      [1, -1, 2, -2, 10, -10].forEach((d) => add(ans + d));
      const s = String(ans); add(parseInt(s[1] + s[0], 10)); // swapped digits
    } else {
      // step keeps the last digits the same, so the answer can't be spotted from them
      const step = ans < 1000 ? 10 : 10 ** (String(ans).length - 2);
      [1, -1, 2, -2, 3].forEach((k) => add(ans + k * step));
      add(ans * 2); if (ans % 2 === 0) add(ans / 2);
    }
    const near = [...c].sort((a, b) => Math.abs(a - ans) - Math.abs(b - ans));
    return shuffled(near.slice(0, 6), r).slice(0, 3);
  }

  const bank = Array.from({ length: 15 }, () => []);
  const ids = new Set();
  function add(id, lv, en, np, right, wrongs) {
    if (ids.has(id) || wrongs.length < 3) return false;
    ids.add(id);
    bank[L(lv) - 1].push({ id, en, np, a: [right, ...wrongs.slice(0, 3)], c: 0 });
    return true;
  }

  /* ---------- 1. hand-written ---------- */
  (window.QUESTIONS || []).forEach((level, i) => level.forEach((q) => {
    const id = 'h' + hash(q.en).toString(36);
    if (!ids.has(id)) { ids.add(id); bank[i].push(Object.assign({ id }, q)); }
  }));
  (window.QUESTIONS_EXTRA || []).forEach(([lv, en, np, right, ...wrongs]) => add('h' + hash(en).toString(36), lv, en, np, right, wrongs));

  /* ---------- 2. countries ---------- */
  const CONT = { AS: ['Asia', 'एसिया'], EU: ['Europe', 'युरोप'], AF: ['Africa', 'अफ्रिका'], NA: ['North America', 'उत्तर अमेरिका'], SA: ['South America', 'दक्षिण अमेरिका'], OC: ['Oceania', 'ओसनिया'] };
  /* [country en, np, capital en, np (null = skip: disputed or several capitals), continent (null = spans two),
      currency en, np (null = skip), fame tier 1-15, trap cities [[en,np],...]] */
  const C = [
    ['India', 'भारत', 'New Delhi', 'नयाँ दिल्ली', 'AS', 'Indian rupee', 'भारतीय रुपैयाँ', 1, [['Mumbai', 'मुम्बई'], ['Kolkata', 'कोलकाता']]],
    ['China', 'चीन', 'Beijing', 'बेइजिङ', 'AS', 'Yuan (renminbi)', 'युआन', 2, [['Shanghai', 'साङ्घाई']]],
    ['Japan', 'जापान', 'Tokyo', 'टोकियो', 'AS', 'Yen', 'येन', 2, [['Osaka', 'ओसाका']]],
    ['United States', 'अमेरिका', 'Washington, D.C.', 'वासिङ्टन डी.सी.', 'NA', 'US dollar', 'अमेरिकी डलर', 2, [['New York', 'न्युयोर्क']]],
    ['United Kingdom', 'बेलायत', 'London', 'लन्डन', 'EU', 'Pound sterling', 'पाउन्ड स्टर्लिङ', 2, []],
    ['Bangladesh', 'बंगलादेश', 'Dhaka', 'ढाका', 'AS', 'Taka', 'टाका', 3, [['Chittagong', 'चटगाउँ']]],
    ['France', 'फ्रान्स', 'Paris', 'पेरिस', 'EU', 'Euro', 'युरो', 3, []],
    ['Germany', 'जर्मनी', 'Berlin', 'बर्लिन', 'EU', 'Euro', 'युरो', 3, [['Munich', 'म्युनिख']]],
    ['Italy', 'इटाली', 'Rome', 'रोम', 'EU', 'Euro', 'युरो', 3, [['Milan', 'मिलान']]],
    ['Russia', 'रुस', 'Moscow', 'मस्को', null, 'Ruble', 'रुबल', 3, [['Saint Petersburg', 'सेन्ट पिटर्सबर्ग']]],
    ['Bhutan', 'भुटान', 'Thimphu', 'थिम्पु', 'AS', 'Ngultrum', 'न्गुल्ट्रम', 4, [['Paro', 'पारो']]],
    ['Pakistan', 'पाकिस्तान', 'Islamabad', 'इस्लामाबाद', 'AS', 'Pakistani rupee', 'पाकिस्तानी रुपैयाँ', 4, [['Karachi', 'कराँची'], ['Lahore', 'लाहोर']]],
    ['South Korea', 'दक्षिण कोरिया', 'Seoul', 'सोल', 'AS', 'South Korean won', 'दक्षिण कोरियाली वोन', 4, [['Busan', 'बुसान']]],
    ['Thailand', 'थाइल्यान्ड', 'Bangkok', 'बैंकक', 'AS', 'Baht', 'बाट', 4, []],
    ['Sri Lanka', 'श्रीलंका', null, null, 'AS', 'Sri Lankan rupee', 'श्रीलंकाली रुपैयाँ', 4, []],
    ['Egypt', 'इजिप्ट', 'Cairo', 'काइरो', 'AF', 'Egyptian pound', 'इजिप्सियन पाउन्ड', 5, [['Alexandria', 'अलेक्जेन्ड्रिया']]],
    ['Malaysia', 'मलेसिया', 'Kuala Lumpur', 'क्वालालम्पुर', 'AS', 'Ringgit', 'रिङ्गिट', 5, []],
    ['Spain', 'स्पेन', 'Madrid', 'मड्रिड', 'EU', 'Euro', 'युरो', 5, [['Barcelona', 'बार्सिलोना']]],
    ['Australia', 'अस्ट्रेलिया', 'Canberra', 'क्यानबेरा', 'OC', 'Australian dollar', 'अस्ट्रेलियाली डलर', 6, [['Sydney', 'सिड्नी'], ['Melbourne', 'मेलबर्न']]],
    ['Canada', 'क्यानडा', 'Ottawa', 'ओटावा', 'NA', 'Canadian dollar', 'क्यानेडियन डलर', 6, [['Toronto', 'टोरन्टो'], ['Vancouver', 'भ्यानकुभर']]],
    ['Afghanistan', 'अफगानिस्तान', 'Kabul', 'काबुल', 'AS', 'Afghani', 'अफगानी', 6, [['Kandahar', 'कन्धार']]],
    ['Saudi Arabia', 'साउदी अरब', 'Riyadh', 'रियाद', 'AS', 'Saudi riyal', 'साउदी रियाल', 6, [['Jeddah', 'जेद्दा'], ['Mecca', 'मक्का']]],
    ['Qatar', 'कतार', 'Doha', 'दोहा', 'AS', 'Qatari riyal', 'कतारी रियाल', 6, []],
    ['Greece', 'ग्रीस', 'Athens', 'एथेन्स', 'EU', null, null, 6, []],
    ['Mexico', 'मेक्सिको', 'Mexico City', 'मेक्सिको सिटी', 'NA', 'Mexican peso', 'मेक्सिकन पेसो', 6, []],
    ['Indonesia', 'इन्डोनेसिया', null, null, 'AS', 'Rupiah', 'रुपिया', 6, []],
    ['Brazil', 'ब्राजिल', 'Brasília', 'ब्राजिलिया', 'SA', 'Brazilian real', 'ब्राजिलियन रियल', 7, [['Rio de Janeiro', 'रियो डि जेनेरियो'], ['São Paulo', 'साओ पाउलो']]],
    ['Maldives', 'माल्दिभ्स', 'Malé', 'माले', 'AS', 'Rufiyaa', 'रुफिया', 7, []],
    ['Philippines', 'फिलिपिन्स', 'Manila', 'मनिला', 'AS', 'Philippine peso', 'फिलिपिनी पेसो', 7, [['Cebu', 'सेबु']]],
    ['Vietnam', 'भियतनाम', 'Hanoi', 'हनोई', 'AS', 'Dong', 'डोङ', 7, [['Ho Chi Minh City', 'हो ची मिन्ह सिटी']]],
    ['United Arab Emirates', 'संयुक्त अरब इमिरेट्स', 'Abu Dhabi', 'अबुधाबी', 'AS', 'UAE dirham', 'युएई दिरहाम', 7, [['Dubai', 'दुबई']]],
    ['Kuwait', 'कुवेत', 'Kuwait City', 'कुवेत सिटी', 'AS', 'Kuwaiti dinar', 'कुवेती दिनार', 8, []],
    ['Turkey', 'टर्की', 'Ankara', 'अंकारा', null, 'Turkish lira', 'टर्किस लिरा', 8, [['Istanbul', 'इस्तानबुल']]],
    ['Iran', 'इरान', 'Tehran', 'तेहरान', 'AS', 'Iranian rial', 'इरानी रियाल', 8, []],
    ['Iraq', 'इराक', 'Baghdad', 'बगदाद', 'AS', 'Iraqi dinar', 'इराकी दिनार', 8, [['Basra', 'बसरा']]],
    ['Portugal', 'पोर्चुगल', 'Lisbon', 'लिस्बन', 'EU', null, null, 8, [['Porto', 'पोर्टो']]],
    ['Ireland', 'आयरल्यान्ड', 'Dublin', 'डब्लिन', 'EU', null, null, 8, []],
    ['Argentina', 'अर्जेन्टिना', 'Buenos Aires', 'ब्युनस आयर्स', 'SA', 'Argentine peso', 'अर्जेन्टाइन पेसो', 8, []],
    ['Kenya', 'केन्या', 'Nairobi', 'नैरोबी', 'AF', 'Kenyan shilling', 'केन्याली सिलिङ', 8, [['Mombasa', 'मोम्बासा']]],
    ['New Zealand', 'न्युजिल्यान्ड', 'Wellington', 'वेलिङ्टन', 'OC', 'New Zealand dollar', 'न्युजिल्यान्ड डलर', 8, [['Auckland', 'अकल्यान्ड']]],
    ['Netherlands', 'नेदरल्यान्ड्स', 'Amsterdam', 'एम्स्टर्डम', 'EU', null, null, 9, [['Rotterdam', 'रोटरडम']]],
    ['Sweden', 'स्वीडेन', 'Stockholm', 'स्टकहोम', 'EU', 'Swedish krona', 'स्विडिस क्रोना', 9, []],
    ['Norway', 'नर्वे', 'Oslo', 'ओस्लो', 'EU', 'Norwegian krone', 'नर्वेजियन क्रोन', 9, []],
    ['Denmark', 'डेनमार्क', 'Copenhagen', 'कोपनहेगन', 'EU', 'Danish krone', 'डेनिस क्रोन', 9, []],
    ['Austria', 'अस्ट्रिया', 'Vienna', 'भियना', 'EU', null, null, 9, []],
    ['Belgium', 'बेल्जियम', 'Brussels', 'ब्रसेल्स', 'EU', null, null, 9, [['Antwerp', 'एन्टवर्प']]],
    ['Ukraine', 'युक्रेन', 'Kyiv', 'किभ', 'EU', 'Hryvnia', 'ह्रिभ्निया', 9, []],
    ['North Korea', 'उत्तर कोरिया', 'Pyongyang', 'प्योङयाङ', 'AS', 'North Korean won', 'उत्तर कोरियाली वोन', 9, []],
    ['Switzerland', 'स्विट्जरल्यान्ड', 'Bern', 'बर्न', 'EU', 'Swiss franc', 'स्विस फ्र्याङ्क', 10, [['Zurich', 'ज्युरिख'], ['Geneva', 'जेनेभा']]],
    ['Finland', 'फिनल्यान्ड', 'Helsinki', 'हेल्सिंकी', 'EU', null, null, 10, []],
    ['Poland', 'पोल्यान्ड', 'Warsaw', 'वार्सा', 'EU', 'Złoty', 'ज्लोटी', 10, [['Krakow', 'क्राको']]],
    ['Myanmar', 'म्यानमार', 'Naypyidaw', 'नेपिडो', 'AS', 'Kyat', 'क्याट', 10, [['Yangon', 'याङ्गुन']]],
    ['Nigeria', 'नाइजेरिया', 'Abuja', 'अबुजा', 'AF', 'Naira', 'नाइरा', 10, [['Lagos', 'लागोस']]],
    ['Ethiopia', 'इथियोपिया', 'Addis Ababa', 'अदिस अबाबा', 'AF', 'Birr', 'बिर', 10, []],
    ['Cuba', 'क्युबा', 'Havana', 'हभाना', 'NA', 'Cuban peso', 'क्युबाली पेसो', 10, []],
    ['Cambodia', 'कम्बोडिया', 'Phnom Penh', 'नोम पेन्ह', 'AS', 'Riel', 'रिएल', 10, [['Siem Reap', 'सिएम रिप']]],
    ['South Africa', 'दक्षिण अफ्रिका', null, null, 'AF', 'Rand', 'र्‍यान्ड', 7, []],
    ['Hungary', 'हंगेरी', 'Budapest', 'बुडापेस्ट', 'EU', 'Forint', 'फोरिन्ट', 11, []],
    ['Czech Republic', 'चेक गणतन्त्र', 'Prague', 'प्राग', 'EU', 'Czech koruna', 'चेक कोरुना', 11, []],
    ['Chile', 'चिली', 'Santiago', 'सान्टियागो', 'SA', 'Chilean peso', 'चिलीयन पेसो', 11, []],
    ['Peru', 'पेरु', 'Lima', 'लिमा', 'SA', 'Sol', 'सोल', 11, []],
    ['Colombia', 'कोलम्बिया', 'Bogotá', 'बोगोटा', 'SA', 'Colombian peso', 'कोलम्बियन पेसो', 11, [['Medellín', 'मेडेलिन']]],
    ['Ghana', 'घाना', 'Accra', 'अक्रा', 'AF', 'Cedi', 'सेडी', 11, []],
    ['Mongolia', 'मंगोलिया', 'Ulaanbaatar', 'उलानबातर', 'AS', 'Tögrög', 'तुग्रिक', 11, []],
    ['Syria', 'सिरिया', 'Damascus', 'दमस्कस', 'AS', 'Syrian pound', 'सिरियाली पाउन्ड', 11, [['Aleppo', 'अलेप्पो']]],
    ['Venezuela', 'भेनेजुएला', 'Caracas', 'काराकस', 'SA', 'Bolívar', 'बोलिभार', 12, []],
    ['Jamaica', 'जमैका', 'Kingston', 'किङ्स्टन', 'NA', 'Jamaican dollar', 'जमैकन डलर', 12, []],
    ['Morocco', 'मोरक्को', 'Rabat', 'रबात', 'AF', 'Moroccan dirham', 'मोरक्कन दिरहाम', 12, [['Casablanca', 'कासाब्लान्का'], ['Marrakesh', 'माराकेस']]],
    ['Uganda', 'युगान्डा', 'Kampala', 'कम्पाला', 'AF', 'Ugandan shilling', 'युगान्डाली सिलिङ', 12, []],
    ['Algeria', 'अल्जेरिया', 'Algiers', 'अल्जियर्स', 'AF', 'Algerian dinar', 'अल्जेरियन दिनार', 12, []],
    ['Zimbabwe', 'जिम्बाब्वे', 'Harare', 'हरारे', 'AF', null, null, 12, []],
    ['Laos', 'लाओस', 'Vientiane', 'भियन्तियान', 'AS', 'Kip', 'किप', 12, []],
    ['Iceland', 'आइसल्यान्ड', 'Reykjavík', 'रेक्याभिक', 'EU', 'Icelandic króna', 'आइसल्यान्डिक क्रोना', 12, []],
    ['Romania', 'रोमानिया', 'Bucharest', 'बुखारेस्ट', 'EU', 'Romanian leu', 'रोमानियन ल्यु', 12, []],
    ['Ecuador', 'इक्वेडर', 'Quito', 'किटो', 'SA', 'US dollar', 'अमेरिकी डलर', 12, [['Guayaquil', 'ग्वायाकिल']]],
    ['Bahrain', 'बहराइन', 'Manama', 'मनामा', 'AS', 'Bahraini dinar', 'बहराइनी दिनार', 12, []],
    ['Oman', 'ओमान', 'Muscat', 'मस्कट', 'AS', 'Omani rial', 'ओमानी रियाल', 12, []],
    ['Jordan', 'जोर्डन', 'Amman', 'अम्मान', 'AS', 'Jordanian dinar', 'जोर्डनियन दिनार', 12, []],
    ['Lebanon', 'लेबनान', 'Beirut', 'बेरुत', 'AS', 'Lebanese pound', 'लेबनानी पाउन्ड', 12, []],
    ['Tanzania', 'तान्जानिया', 'Dodoma', 'डोडोमा', 'AF', 'Tanzanian shilling', 'तान्जानियाली सिलिङ', 13, [['Dar es Salaam', 'दार एस सलाम']]],
    ['Senegal', 'सेनेगल', 'Dakar', 'डकार', 'AF', null, null, 13, []],
    ['Fiji', 'फिजी', 'Suva', 'सुभा', 'OC', 'Fijian dollar', 'फिजियन डलर', 13, [['Nadi', 'नादी']]],
    ['Kazakhstan', 'काजाकस्तान', 'Astana', 'अस्ताना', null, 'Tenge', 'टेङ्गे', 13, [['Almaty', 'अल्माटी']]],
    ['Uzbekistan', 'उज्बेकिस्तान', 'Tashkent', 'ताश्कन्द', 'AS', 'Uzbek som', 'उज्बेक सोम', 13, [['Samarkand', 'समरकन्द']]],
    ['Mauritius', 'मौरिसस', 'Port Louis', 'पोर्ट लुइस', 'AF', 'Mauritian rupee', 'मौरिसियन रुपैयाँ', 13, []],
    ['Papua New Guinea', 'पपुवा न्यु गिनी', 'Port Moresby', 'पोर्ट मोरेस्बी', 'OC', 'Kina', 'किना', 14, []],
    ['Madagascar', 'मडागास्कर', 'Antananarivo', 'अन्तानानारिभो', 'AF', 'Ariary', 'आरियारी', 14, []],
    ['Burkina Faso', 'बुर्किना फासो', 'Ouagadougou', 'वागाडुगु', 'AF', null, null, 15, []],
    ['Kyrgyzstan', 'किर्गिस्तान', 'Bishkek', 'बिश्केक', 'AS', 'Kyrgyz som', 'किर्गिज सोम', 15, []],
    ['Tajikistan', 'ताजिकिस्तान', 'Dushanbe', 'दुशान्बे', 'AS', 'Somoni', 'सोमोनी', 15, []],
    ['Turkmenistan', 'तुर्कमेनिस्तान', 'Ashgabat', 'अस्गाबात', 'AS', 'Turkmen manat', 'तुर्कमेन मनात', 15, []],
    ['Brunei', 'ब्रुनाई', 'Bandar Seri Begawan', 'बन्दर सेरी बेगवान', 'AS', 'Brunei dollar', 'ब्रुनाई डलर', 15, []]
  ];
  const withCap = C.filter((c) => c[2]);
  for (const [en, np, capEn, capNp, cont, curEn, curNp, tier, traps] of C) {
    const r = rng(hash('cty' + en));
    const near = (k) => Math.abs(k[7] - tier) <= 4 && k[0] !== en;
    if (capEn) {
      const others = withCap.filter(near).map((k) => [k[2], k[3]]);
      const wrong = traps.slice(0, 2).concat(pick(r, others, 3, [capEn]));
      add('cap:' + en, tier, `What is the capital of ${en}?`, `${np}को राजधानी कुन हो?`, [capEn, capNp], pick(r, wrong.slice(0, 2), 2, [capEn]).concat(wrong.slice(2)).slice(0, 3));
      const countries = withCap.filter(near).map((k) => [k[0], k[1]]);
      add('capr:' + en, tier + 1, `${capEn} is the capital of which country?`, `${capNp} कुन देशको राजधानी हो?`, [en, np], pick(r, countries, 3, [en]));
    }
    if (cont) {
      add('cont:' + en, Math.max(1, Math.round(tier * 0.7)), `On which continent is ${en}?`, `${np} कुन महादेशमा पर्छ?`, CONT[cont], pick(r, Object.values(CONT), 3, CONT[cont]));
    }
    if (curEn) {
      const curs = C.filter((k) => k[5] && k[5] !== curEn).map((k) => [k[5], k[6]]);
      const lv = curEn === 'US dollar' && en === 'Ecuador' ? 14 : tier + 2;
      add('cur:' + en, lv, `What is the currency of ${en}?`, `${np}को मुद्रा के हो?`, [curEn, curNp], pick(r, curs, 3, [curEn]));
    }
  }

  /* ---------- 3. chemical elements ---------- */
  /* [atomic number, symbol, english, nepali, tier, symbol from Latin?] */
  const E = [
    [1, 'H', 'Hydrogen', 'हाइड्रोजन', 3], [2, 'He', 'Helium', 'हिलियम', 5], [3, 'Li', 'Lithium', 'लिथियम', 9], [4, 'Be', 'Beryllium', 'बेरिलियम', 12],
    [5, 'B', 'Boron', 'बोरोन', 10], [6, 'C', 'Carbon', 'कार्बन', 3], [7, 'N', 'Nitrogen', 'नाइट्रोजन', 4], [8, 'O', 'Oxygen', 'अक्सिजन', 2],
    [9, 'F', 'Fluorine', 'फ्लोरिन', 9], [10, 'Ne', 'Neon', 'नियोन', 8], [11, 'Na', 'Sodium', 'सोडियम', 7, 1], [12, 'Mg', 'Magnesium', 'म्याग्नेसियम', 8],
    [13, 'Al', 'Aluminium', 'एल्युमिनियम', 7], [14, 'Si', 'Silicon', 'सिलिकन', 9], [15, 'P', 'Phosphorus', 'फस्फोरस', 8], [16, 'S', 'Sulphur', 'गन्धक (सल्फर)', 7],
    [17, 'Cl', 'Chlorine', 'क्लोरिन', 6], [18, 'Ar', 'Argon', 'आर्गन', 10], [19, 'K', 'Potassium', 'पोटासियम', 9, 1], [20, 'Ca', 'Calcium', 'क्याल्सियम', 6],
    [24, 'Cr', 'Chromium', 'क्रोमियम', 12], [25, 'Mn', 'Manganese', 'म्याङ्गनिज', 12], [26, 'Fe', 'Iron', 'फलाम', 6, 1], [27, 'Co', 'Cobalt', 'कोबाल्ट', 12],
    [28, 'Ni', 'Nickel', 'निकल', 10], [29, 'Cu', 'Copper', 'तामा', 7, 1], [30, 'Zn', 'Zinc', 'जस्ता', 8], [35, 'Br', 'Bromine', 'ब्रोमिन', 12],
    [36, 'Kr', 'Krypton', 'क्रिप्टन', 12], [38, 'Sr', 'Strontium', 'स्ट्रोन्सियम', 14], [47, 'Ag', 'Silver', 'चाँदी', 7, 1], [50, 'Sn', 'Tin', 'टिन', 10, 1],
    [53, 'I', 'Iodine', 'आयोडिन', 9], [54, 'Xe', 'Xenon', 'जेनन', 13], [55, 'Cs', 'Caesium', 'सिजियम', 14], [74, 'W', 'Tungsten', 'टङ्गस्टन', 14, 1],
    [78, 'Pt', 'Platinum', 'प्लेटिनम', 11], [79, 'Au', 'Gold', 'सुन', 6, 1], [80, 'Hg', 'Mercury', 'पारो', 9, 1], [82, 'Pb', 'Lead', 'सिसा', 9, 1],
    [86, 'Rn', 'Radon', 'रेडन', 13], [92, 'U', 'Uranium', 'युरेनियम', 10]
  ];
  const syms = E.map((e) => [e[1], e[1]]), names = E.map((e) => [e[2], e[3]]);
  for (const [z, sym, en, np, tier, latin] of E) {
    const r = rng(hash('el' + sym));
    if (sym !== 'Au') { // gold's symbol is already a hand-written question
      const close = syms.filter((s) => s[0][0] === sym[0] && s[0] !== sym);
      add('elsym:' + sym, tier + (latin ? 2 : 0), `What is the chemical symbol for ${en}?`, `${np}को रासायनिक संकेत के हो?`, [sym, sym], pick(r, close, 2, [sym]).concat(pick(r, syms, 3, [sym])).filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i).slice(0, 3));
    }
    add('elname:' + sym, tier + 1 + (latin ? 1 : 0), `Which element has the chemical symbol ${sym}?`, `${sym} रासायनिक संकेत भएको तत्त्व कुन हो?`, [en, np], pick(r, names, 3, [en]));
    if (z <= 20 || ['Fe', 'Cu', 'Ag', 'Au'].includes(sym)) {
      add('elz:' + sym, z <= 20 ? 6 + Math.ceil(z / 3) : 15, `What is the atomic number of ${en}?`, `${np}को परमाणु संख्या कति हो?`, pair(z), numWrong(r, z).map(pair));
    }
  }

  /* ---------- 4. districts of Nepal and their provinces ---------- */
  const PROV = { K: ['Koshi', 'कोशी'], M: ['Madhesh', 'मधेश'], B: ['Bagmati', 'बागमती'], G: ['Gandaki', 'गण्डकी'], L: ['Lumbini', 'लुम्बिनी'], R: ['Karnali', 'कर्णाली'], S: ['Sudurpashchim', 'सुदूरपश्चिम'] };
  const D = {
    K: [['Taplejung', 'ताप्लेजुङ', 11], ['Panchthar', 'पाँचथर', 11], ['Ilam', 'इलाम', 7], ['Jhapa', 'झापा', 6], ['Morang', 'मोरङ', 6], ['Sunsari', 'सुनसरी', 7], ['Dhankuta', 'धनकुटा', 9], ['Terhathum', 'तेह्रथुम', 11], ['Sankhuwasabha', 'संखुवासभा', 11], ['Bhojpur', 'भोजपुर', 10], ['Solukhumbu', 'सोलुखुम्बु', 8], ['Okhaldhunga', 'ओखलढुङ्गा', 11], ['Khotang', 'खोटाङ', 11], ['Udayapur', 'उदयपुर', 10]],
    M: [['Saptari', 'सप्तरी', 9], ['Siraha', 'सिराहा', 9], ['Dhanusha', 'धनुषा', 8], ['Mahottari', 'महोत्तरी', 10], ['Sarlahi', 'सर्लाही', 10], ['Bara', 'बारा', 9], ['Parsa', 'पर्सा', 8], ['Rautahat', 'रौतहट', 10]],
    B: [['Sindhuli', 'सिन्धुली', 10], ['Ramechhap', 'रामेछाप', 10], ['Dolakha', 'दोलखा', 9], ['Sindhupalchok', 'सिन्धुपाल्चोक', 9], ['Kavrepalanchok', 'काभ्रेपलाञ्चोक', 8], ['Lalitpur', 'ललितपुर', 5], ['Bhaktapur', 'भक्तपुर', 5], ['Kathmandu', 'काठमाडौं', 4], ['Nuwakot', 'नुवाकोट', 9], ['Rasuwa', 'रसुवा', 10], ['Dhading', 'धादिङ', 9], ['Makwanpur', 'मकवानपुर', 9], ['Chitwan', 'चितवन', 7]],
    G: [['Gorkha', 'गोरखा', 8], ['Lamjung', 'लमजुङ', 10], ['Tanahun', 'तनहुँ', 10], ['Syangja', 'स्याङ्जा', 10], ['Kaski', 'कास्की', 6], ['Manang', 'मनाङ', 9], ['Mustang', 'मुस्ताङ', 8], ['Myagdi', 'म्याग्दी', 11], ['Parbat', 'पर्वत', 11], ['Baglung', 'बागलुङ', 10], ['Nawalparasi East (Nawalpur)', 'नवलपरासी (बर्दघाट सुस्ता पूर्व)', 13]],
    L: [['Gulmi', 'गुल्मी', 11], ['Palpa', 'पाल्पा', 9], ['Nawalparasi West (Parasi)', 'नवलपरासी (बर्दघाट सुस्ता पश्चिम)', 13], ['Rupandehi', 'रुपन्देही', 7], ['Kapilvastu', 'कपिलवस्तु', 8], ['Arghakhanchi', 'अर्घाखाँची', 11], ['Pyuthan', 'प्युठान', 11], ['Rolpa', 'रोल्पा', 11], ['Rukum East', 'रुकुम (पूर्वी भाग)', 13], ['Dang', 'दाङ', 8], ['Banke', 'बाँके', 8], ['Bardiya', 'बर्दिया', 9]],
    R: [['Rukum West', 'रुकुम (पश्चिम भाग)', 13], ['Salyan', 'सल्यान', 11], ['Dolpa', 'डोल्पा', 10], ['Humla', 'हुम्ला', 10], ['Jumla', 'जुम्ला', 9], ['Kalikot', 'कालिकोट', 12], ['Mugu', 'मुगु', 10], ['Surkhet', 'सुर्खेत', 8], ['Dailekh', 'दैलेख', 11], ['Jajarkot', 'जाजरकोट', 11]],
    S: [['Bajura', 'बाजुरा', 11], ['Bajhang', 'बझाङ', 11], ['Achham', 'अछाम', 10], ['Doti', 'डोटी', 10], ['Kailali', 'कैलाली', 8], ['Kanchanpur', 'कञ्चनपुर', 9], ['Dadeldhura', 'डडेल्धुरा', 10], ['Baitadi', 'बैतडी', 11], ['Darchula', 'दार्चुला', 10]]
  };
  for (const [p, list] of Object.entries(D)) {
    for (const [en, np, lv] of list) {
      const r = rng(hash('dist' + en));
      add('dist:' + en, lv, `${en} district is in which province?`, `${np} जिल्ला कुन प्रदेशमा पर्छ?`, PROV[p], pick(r, Object.values(PROV), 3, PROV[p]));
    }
  }

  /* ---------- 5. Nepali months (Bikram Sambat) ---------- */
  const MONTHS = [['Baisakh', 'वैशाख'], ['Jestha', 'जेठ'], ['Asar', 'असार'], ['Shrawan', 'साउन'], ['Bhadra', 'भदौ'], ['Asoj', 'असोज'], ['Kartik', 'कात्तिक'], ['Mangsir', 'मंसिर'], ['Poush', 'पुस'], ['Magh', 'माघ'], ['Falgun', 'फागुन'], ['Chaitra', 'चैत']];
  const ORD_EN = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
  const ORD_NP = ['पहिलो', 'दोस्रो', 'तेस्रो', 'चौथो', 'पाँचौं', 'छैटौं', 'सातौं', 'आठौं', 'नवौं', 'दसौं', 'एघारौं', 'बाह्रौं'];
  MONTHS.forEach((m, i) => {
    const r = rng(hash('mon' + i));
    const near = MONTHS.filter((_, j) => Math.abs(j - i) <= 3 && j !== i);
    add('mon:' + i, i === 0 || i === 11 ? 3 : 4 + Math.min(i, 11 - i) * 0.6, `Which is the ${ORD_EN[i]} month of the Nepali calendar (Bikram Sambat)?`, `विक्रम सम्वत्‌को ${ORD_NP[i]} महिना कुन हो?`, m, pick(r, near, 3, m));
    const nxt = MONTHS[(i + 1) % 12];
    add('monnext:' + i, 5 + Math.min(i, 11 - i) * 0.5, `Which Nepali month comes right after ${m[0]}?`, `${m[1]} पछि तुरुन्तै कुन महिना आउँछ?`, nxt, pick(r, MONTHS.filter((x) => x !== m), 3, nxt));
  });

  /* ---------- 6. planets ---------- */
  const PL = [['Mercury', 'बुध'], ['Venus', 'शुक्र'], ['Earth', 'पृथ्वी'], ['Mars', 'मंगल'], ['Jupiter', 'बृहस्पति'], ['Saturn', 'शनि'], ['Uranus', 'अरुण (युरेनस)'], ['Neptune', 'वरुण (नेप्च्युन)']];
  PL.forEach((p, i) => {
    const r = rng(hash('pl' + i));
    if (i === 2) return; // "third from the sun" is too easy to give away
    add('pl:' + i, [6, 7, 0, 8, 9, 10, 12, 12][i], `Which planet is ${ORD_EN[i]} from the Sun?`, `सूर्यबाट ${ORD_NP[i]} ग्रह कुन हो?`, p, pick(r, PL, 3, p));
  });

  /* ---------- 7. Roman numerals ---------- */
  function roman(n) {
    const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = ''; for (const [v, r] of t) while (n >= v) { s += r; n -= v; } return s;
  }
  const ROM = [[3, 3], [6, 4], [4, 5], [12, 5], [9, 6], [14, 6], [50, 6], [100, 6], [19, 7], [27, 7], [500, 7], [1000, 7], [40, 8], [76, 8], [44, 9], [48, 9], [64, 9], [90, 9], [49, 10], [99, 11], [400, 11], [900, 12], [2024, 12], [444, 13], [1666, 13], [1999, 13], [499, 14], [944, 14], [1888, 14], [1994, 14], [994, 15], [1444, 15], [3888, 15], [3999, 15]];
  for (const [n, lv] of ROM) {
    const r = rng(hash('rom' + n));
    const right = roman(n);
    const wrong = new Set();
    [n + 1, n - 1, n + 10, n - 10, n + 5, n - 5, n + 100, n - 100].forEach((v) => { if (v > 0 && v < 4000) wrong.add(roman(v)); });
    if (n === 4) wrong.add('IIII'); if (n === 9) wrong.add('VIIII'); if (n === 49) wrong.add('IL'); if (n === 99) wrong.add('IC'); if (n === 1999) wrong.add('MIM');
    const opts = shuffled([...wrong].filter((w) => w !== right), r).slice(0, 3).map((w) => [w, w]);
    add('rom:' + n, lv, `How is ${numEn(n)} written in Roman numerals?`, `${npd(String(n))} लाई रोमन अंकमा कसरी लेखिन्छ?`, [right, right], opts);
  }

  /* ---------- 8. units, counts and facts with a number answer ---------- */
  const U = [
    ['How many minutes are in an hour?', 'एक घण्टामा कति मिनेट हुन्छ?', 60, 1], ['How many hours are in a day?', 'एक दिनमा कति घण्टा हुन्छ?', 24, 1],
    ['How many days are in a week?', 'एक हप्तामा कति दिन हुन्छ?', 7, 1], ['How many months are in a year?', 'एक वर्षमा कति महिना हुन्छ?', 12, 1],
    ['How many centimetres are in a metre?', 'एक मिटरमा कति सेन्टिमिटर हुन्छ?', 100, 2], ['How many years are in a century?', 'एक शताब्दीमा कति वर्ष हुन्छ?', 100, 2],
    ['How many years are in a decade?', 'एक दशकमा कति वर्ष हुन्छ?', 10, 2], ['How many colours are in a rainbow?', 'इन्द्रेणीमा कति रङ हुन्छन्?', 7, 2],
    ['How many grams are in a kilogram?', 'एक किलोग्राममा कति ग्राम हुन्छ?', 1000, 3], ['How many metres are in a kilometre?', 'एक किलोमिटरमा कति मिटर हुन्छ?', 1000, 3],
    ['How many paisa make one Nepali rupee?', 'एक नेपाली रुपैयाँमा कति पैसा हुन्छ?', 100, 3], ['How many sides does a pentagon have?', 'पञ्चभुजका कति भुजा हुन्छन्?', 5, 3],
    ['At how many degrees Celsius does water boil at sea level?', 'समुद्री सतहमा पानी कति डिग्री सेल्सियसमा उम्लिन्छ?', 100, 3], ['How many letters are in the English alphabet?', 'अंग्रेजी वर्णमालामा कति अक्षर छन्?', 26, 3],
    ['How many millilitres are in a litre?', 'एक लिटरमा कति मिलिलिटर हुन्छ?', 1000, 4], ['How many sides does a hexagon have?', 'षट्भुजका कति भुजा हुन्छन्?', 6, 4],
    ['How many degrees are in a right angle?', 'समकोणमा कति डिग्री हुन्छ?', 90, 4], ['About how many weeks are in a year?', 'एक वर्षमा लगभग कति हप्ता हुन्छन्?', 52, 4],
    ['How many millimetres are in a metre?', 'एक मिटरमा कति मिलिमिटर हुन्छ?', 1000, 5], ['How many years are in a millennium?', 'एक सहस्राब्दीमा कति वर्ष हुन्छ?', 1000, 5],
    ['How many sides does an octagon have?', 'अष्टभुजका कति भुजा हुन्छन्?', 8, 5], ['How many degrees are in a full circle?', 'पूरा वृत्तमा कति डिग्री हुन्छ?', 360, 5],
    ['How many players does a cricket team have on the field?', 'क्रिकेटमा एउटा टोलीका कति खेलाडी मैदानमा हुन्छन्?', 11, 5], ['How many minutes does a football match last, without extra time?', 'थप समयबाहेक फुटबल खेल कति मिनेटको हुन्छ?', 90, 5],
    ['How many seconds are in an hour?', 'एक घण्टामा कति सेकेन्ड हुन्छ?', 3600, 6], ['What is the sum of the angles of a triangle, in degrees?', 'त्रिभुजका तीन कोणको योगफल कति डिग्री हुन्छ?', 180, 6],
    ['How many rings are on the Olympic flag?', 'ओलम्पिक झण्डामा कति वटा घेरा छन्?', 5, 6], ['How many hours are in a week?', 'एक हप्तामा कति घण्टा हुन्छ?', 168, 7],
    ['How many teeth does an adult human usually have?', 'वयस्क मानिसका सामान्यतया कति वटा दाँत हुन्छन्?', 32, 7], ['How many squares are on a chessboard?', 'चेस बोर्डमा कति वटा कोठा हुन्छन्?', 64, 7],
    ['How many strings does a standard guitar have?', 'सामान्य गितारमा कति वटा तार हुन्छन्?', 6, 7], ['How many districts does Nepal have?', 'नेपालमा कति वटा जिल्ला छन्?', 77, 7],
    ['How many minutes are in a day?', 'एक दिनमा कति मिनेट हुन्छ?', 1440, 8], ['How many chambers does the human heart have?', 'मानव मुटुमा कति वटा कक्ष हुन्छन्?', 4, 8],
    ['How many players does a volleyball team have on court?', 'भलिबलमा एउटा टोलीका कति खेलाडी कोर्टमा हुन्छन्?', 6, 8], ['How many players does a basketball team have on court?', 'बास्केटबलमा एउटा टोलीका कति खेलाडी कोर्टमा हुन्छन्?', 5, 8],
    ['How many bones are in the adult human body?', 'वयस्क मानिसको शरीरमा कति वटा हड्डी हुन्छन्?', 206, 10], ['How many seconds are in a day?', 'एक दिनमा कति सेकेन्ड हुन्छ?', 86400, 11],
    ['How many mountains in the world are higher than 8,000 m?', 'संसारमा ८,००० मिटरभन्दा अग्ला कति वटा हिमाल छन्?', 14, 11], ['How many keys does a standard piano have?', 'सामान्य पियानोमा कति वटा कुञ्जी हुन्छन्?', 88, 12],
    ['How many members does Nepal’s House of Representatives have?', 'नेपालको प्रतिनिधि सभामा कति सदस्य हुन्छन्?', 275, 12], ['How many metropolitan cities does Nepal have?', 'नेपालमा कति वटा महानगरपालिका छन्?', 6, 12],
    ['How many of the world’s 8,000 m peaks are in Nepal or on its border?', '८,००० मिटरभन्दा अग्ला हिमालमध्ये कति वटा नेपालमा वा नेपालको सिमानामा छन्?', 8, 13],
    ['How many members does Nepal’s National Assembly have?', 'नेपालको राष्ट्रिय सभामा कति सदस्य हुन्छन्?', 59, 14], ['How many local levels (municipalities and rural municipalities) does Nepal have?', 'नेपालमा कति वटा स्थानीय तह छन्?', 753, 14]
  ];
  for (const [en, np, ans, lv] of U) add('u' + hash(en).toString(36), lv, en, np, pair(ans), numWrong(rng(hash(en)), ans).map(pair));

  /* ---------- 9. maths: a pool per level, used to fill the bank to TARGET ---------- */
  const mathPool = Array.from({ length: 15 }, () => []);
  const mr = rng(20261121);
  const ri = (a, b) => a + Math.floor(mr() * (b - a + 1));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
  const M = (lv, id, en, np, ans, wrongs) => mathPool[lv - 1].push({ id: 'm:' + id, lv, en, np, right: pair(ans), wrongs: (wrongs || numWrong(rng(hash(id)), ans)).map(pair) });
  const t = (s) => npd(s);
  for (let k = 0; k < 40; k++) {
    let a = ri(2, 9), b = ri(2, 9); M(1, `${a}+${b}`, `What is ${a} + ${b}?`, `${t(a)} + ${t(b)} कति हुन्छ?`, a + b);
    a = ri(11, 40); b = ri(5, 19); M(2, `${a}+${b}`, `What is ${a} + ${b}?`, `${t(a)} + ${t(b)} कति हुन्छ?`, a + b);
    a = ri(20, 60); b = ri(5, 19); M(2, `${a}-${b}`, `What is ${a} − ${b}?`, `${t(a)} − ${t(b)} कति हुन्छ?`, a - b);
    a = ri(3, 10); b = ri(3, 10); M(3, `${a}x${b}`, `What is ${a} × ${b}?`, `${t(a)} × ${t(b)} कति हुन्छ?`, a * b);
    a = ri(11, 15); b = ri(3, 9); M(4, `${a}x${b}`, `What is ${a} × ${b}?`, `${t(a)} × ${t(b)} कति हुन्छ?`, a * b);
    a = ri(3, 12); b = ri(6, 15); M(4, `${a * b}/${a}`, `What is ${a * b} ÷ ${a}?`, `${t(a * b)} ÷ ${t(a)} कति हुन्छ?`, b);
    a = ri(16, 39); b = ri(3, 9); M(5, `${a}x${b}`, `What is ${a} × ${b}?`, `${t(a)} × ${t(b)} कति हुन्छ?`, a * b);
    a = ri(120, 480); b = ri(110, 390); M(5, `${a}+${b}`, `What is ${a} + ${b}?`, `${t(a)} + ${t(b)} कति हुन्छ?`, a + b);
    let p = [10, 20, 25, 50][ri(0, 3)], n = ri(2, 20) * 20; M(6, `${p}%${n}`, `What is ${p}% of ${n}?`, `${t(n)} को ${t(p)}% कति हुन्छ?`, (p * n) / 100);
    n = ri(11, 20); M(7, `sq${n}`, `What is ${n} squared (${n}²)?`, `${t(n)} को वर्ग (${t(n)}²) कति हुन्छ?`, n * n);
    n = ri(11, 25); M(8, `rt${n * n}`, `What is the square root of ${n * n}?`, `${t(n * n)} को वर्गमूल कति हो?`, n);
    n = ri(3, 10); M(9, `cu${n}`, `What is ${n} cubed (${n}³)?`, `${t(n)} को घन (${t(n)}³) कति हुन्छ?`, n * n * n);
    p = [5, 15, 30, 75][ri(0, 3)]; n = ri(2, 24) * 20; M(9, `${p}%${n}`, `What is ${p}% of ${n}?`, `${t(n)} को ${t(p)}% कति हुन्छ?`, (p * n) / 100);
    a = ri(12, 29); b = ri(12, 29); M(10, `${a}x${b}`, `What is ${a} × ${b}?`, `${t(a)} × ${t(b)} कति हुन्छ?`, a * b);
    a = ri(4, 18); b = ri(4, 18); if (a !== b) M(11, `lcm${Math.min(a, b)},${Math.max(a, b)}`, `What is the LCM (lowest common multiple) of ${a} and ${b}?`, `${t(a)} र ${t(b)} को लघुत्तम समापवर्त्य (ल.स.) कति हो?`, (a * b) / gcd(a, b));
    const f = ri(3, 12); a = f * ri(2, 9); b = f * ri(2, 9); if (a !== b) M(12, `hcf${Math.min(a, b)},${Math.max(a, b)}`, `What is the HCF (highest common factor) of ${a} and ${b}?`, `${t(a)} र ${t(b)} को महत्तम समापवर्तक (म.स.) कति हो?`, gcd(a, b));
    n = ri(9, 16); M(13, `pow2^${n}`, `What is 2 to the power ${n} (2^${n})?`, `२ को घात ${t(n)} (२^${t(n)}) कति हुन्छ?`, 2 ** n);
    n = ri(12, 60); M(13, `sum1..${n}`, `What is the sum of all whole numbers from 1 to ${n}?`, `१ देखि ${t(n)} सम्मका सबै पूर्ण संख्याको योगफल कति हुन्छ?`, (n * (n + 1)) / 2);
    a = ri(31, 99); b = ri(31, 99); M(14, `${a}x${b}`, `What is ${a} × ${b}?`, `${t(a)} × ${t(b)} कति हुन्छ?`, a * b);
    n = ri(11, 21); M(15, `cbrt${n ** 3}`, `What is the cube root of ${numEn(n ** 3)}?`, `${numNp(n ** 3)} को घनमूल कति हो?`, n);
    a = ri(101, 399); b = ri(11, 29); M(15, `${a}x${b}`, `What is ${a} × ${b}?`, `${t(a)} × ${t(b)} कति हुन्छ?`, a * b);
  }
  // prime spotting (level 14): one prime among three odd look-alikes that are not
  const odd = []; for (let n = 51; n < 400; n += 2) if (n % 5 && n % 3 && !isPrime(n)) odd.push(n); // composites that pass the easy tests
  for (let n = 101; n < 400; n += 2) if (isPrime(n)) {
    const r = rng(hash('pr' + n));
    const w = shuffled(odd.filter((x) => Math.abs(x - n) < 120), r).slice(0, 3);
    if (w.length === 3) mathPool[13].push({ id: 'm:prime' + n, lv: 14, en: 'Which of these is a prime number?', np: 'यीमध्ये रूढ (अभाज्य) संख्या कुन हो?', right: pair(n), wrongs: w.map(pair) });
  }

  /* ---------- fill to TARGET with maths, always topping up the thinnest level ---------- */
  mathPool.forEach((pool, i) => { mathPool[i] = shuffled(pool, rng(99 + i)); });
  let total = bank.reduce((s, l) => s + l.length, 0);
  while (total < TARGET) {
    let best = -1;
    for (let i = 0; i < 15; i++) if (mathPool[i].length && (best < 0 || bank[i].length < bank[best].length)) best = i;
    if (best < 0) break;
    const m = mathPool[best].shift();
    if (add(m.id, m.lv, m.en, m.np, m.right, m.wrongs)) total++;
  }

  window.QUESTION_BANK = bank;
  window.QUESTION_BANK_SIZE = total;
})();
