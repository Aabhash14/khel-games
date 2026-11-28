/* Himal Climb: English and Nepali text, and Devanagari digits. */
(() => {
  'use strict';
  const HC = (window.HC = window.HC || {});

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
  const DEV = '०१२३४५६७८९';

  Object.assign(HC, { TEXT, DEV });
})();
