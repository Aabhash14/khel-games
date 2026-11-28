// English + Nepali text, the current language, and Devanagari digits.
(() => {
  'use strict';
  const CC = (window.CC = window.CC || {});
  const { store } = CC.Util;

  const TEXT = {
    en: {
      kicker: 'Dashain Kite Fight',
      tag: 'Fly your kite over the Kathmandu rooftops and cut every rival string.',
      how1: 'Drag your finger (or move the mouse) to steer your kite',
      how2: 'Cross a rival’s string, then saw back and forth fast',
      how3: 'Grab the gold manja spool for a sharper string',
      play: 'Play', best: 'Best', lang: 'नेपाली',
      cutYou: 'Your kite was cut!', cuts: 'Kites cut', time: 'Time flying',
      newBest: 'New record!', again: 'Play again', share: 'Share', copied: 'Copied!',
      hudCuts: 'CUT', hudBest: 'BEST', wind: 'WIND', manja: 'MANJA', string: 'STRING',
      paused: 'PAUSED', resume: 'Tap to resume',
      hint: 'Cross their string and saw to cut!',
      shareText: (n) => `I cut ${n} kites in Changa Chet! Can you beat me?`,
    },
    ne: {
      kicker: 'दशैंको चङ्गा युद्ध',
      tag: 'काठमाडौंको छतबाट चङ्गा उडाउनुहोस् र सबैको धागो काट्नुहोस्।',
      how1: 'चङ्गा चलाउन औंलाले तान्नुहोस् (वा माउस सार्नुहोस्)',
      how2: 'अरूको धागोमा पेच पारेर छिटो-छिटो रगड्नुहोस्',
      how3: 'धागो धारिलो बनाउन सुनौलो मान्जा टिप्नुहोस्',
      play: 'खेल्नुहोस्', best: 'उत्कृष्ट', lang: 'English',
      cutYou: 'तपाईंको चङ्गा काटियो!', cuts: 'काटेका चङ्गा', time: 'उडेको समय',
      newBest: 'नयाँ रेकर्ड!', again: 'फेरि खेल्नुहोस्', share: 'सेयर', copied: 'कपी भयो!',
      hudCuts: 'चेट', hudBest: 'उत्कृष्ट', wind: 'हावा', manja: 'मान्जा', string: 'धागो',
      paused: 'रोकिएको छ', resume: 'जारी राख्न ट्याप गर्नुहोस्',
      hint: 'पेच पारेर रगड्नुहोस्, धागो काटिन्छ!',
      shareText: (n) => `मैले चङ्गा चेटमा ${n} वटा चङ्गा काटें! तपाईं सक्नुहुन्छ?`,
    },
  };
  let lang = store.get('cc_lang', 'en') === 'ne' ? 'ne' : 'en';
  const t = (k) => TEXT[lang][k];
  const DEV_DIGITS = '०१२३४५६७८९';
  const num = (n) => (lang === 'ne' ? String(n).replace(/\d/g, (d) => DEV_DIGITS[d]) : String(n));
  const fmtTime = (s) => (lang === 'ne' ? `${num(s)} सेकेन्ड` : `${s}s`);

  // `lang` lives here; main.js reads and switches it through CC.I18n.lang.
  CC.I18n = {
    TEXT, DEV_DIGITS, t, num, fmtTime,
    get lang() { return lang; },
    set lang(v) { lang = v; },
  };
})();
