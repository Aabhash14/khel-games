/* Bato Harayo: language, interface text in both languages, and clock formatting. */
(() => {
  'use strict';
  const BH = (window.BH = window.BH || {});
  const { store } = BH.Util;

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

  BH.I18n = {
    getLang: () => lang,
    setLang: (v) => { lang = v; },
    L, cap, fill, DEV, digits, TEXT, t, clockParts, fmtClock,
  };
})();
