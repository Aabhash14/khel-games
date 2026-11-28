/* Himal Climb: the 10 mountains, their routes, camps and ground types. Pure data. */
(() => {
  'use strict';
  const HC = (window.HC = window.HC || {});

  // ---------- The 10 highest mountains on Earth, played lowest first ----------
  // Each level climbs the mountain's standard route. Camp heights are the usual real ones.
  // sections: [from m, ground, hazard rate, crevasse rate, English, Nepali]
  // rows: taps from start to summit (longer climbs as you go up the list);
  // dmax: how sparse and crumbly the holds get; haz: overall falling ice/rock rate;
  // drain: how fast strength drains (lower = gentler early levels).
  const S = (m, terrain, haz, crev, en, ne) => ({ m, terrain, haz, crev, en, ne });
  const KHUMBU = [
    S(5000, 'moraine', 0.5, 0, 'Khumbu Glacier', 'खुम्बु हिमनदी'),
    S(5364, 'ice', 1.2, 0.07, 'Khumbu Icefall', 'खुम्बु आइसफल'),
    S(6065, 'snow', 0.45, 0.05, 'Western Cwm', 'वेस्टर्न कुम'),
    S(6600, 'blueice', 1, 0, 'Lhotse Face', 'ल्होत्से फेस'),
  ];
  const MOUNTAINS = [
    { id: 'annapurna', en: 'Annapurna I', ne: 'अन्नपूर्ण प्रथम', m: 8091, rank: 10, where: 'np', route: ['North Face', 'उत्तरी फेस'],
      start: 3900, rows: 200, dmax: 0.35, haz: 0.6, drain: 0.7, camps: [4190, 5100, 5600, 6400, 7100], sections: [
        S(3900, 'moraine', 0.5, 0, 'North Annapurna Glacier', 'उत्तरी अन्नपूर्ण हिमनदी'),
        S(4300, 'ice', 0.9, 0.06, 'Crevasse Field', 'क्रेभास क्षेत्र'),
        S(5100, 'dark', 1, 0, 'Dutch Rib', 'डच रिब'),
        S(5600, 'blueice', 1.35, 0, 'Under the Sickle', 'सिकलमुनि'),
        S(6400, 'snow', 0.8, 0, 'North Face', 'उत्तरी फेस'),
        S(7700, 'dark', 0.6, 0, 'Summit Ridge', 'शिखर धार')] },
    { id: 'nangaparbat', en: 'Nanga Parbat', ne: 'नाङ्गा पर्वत', m: 8126, rank: 9, where: 'pk', route: ['Kinshofer Route', 'किन्सहोफर रुट'],
      start: 3900, rows: 240, dmax: 0.42, haz: 0.65, drain: 0.78, camps: [4200, 5100, 6000, 6800, 7200], sections: [
        S(3900, 'moraine', 0.5, 0, 'Diamir Glacier', 'दियामीर हिमनदी'),
        S(4300, 'snow', 0.8, 0.04, 'Diamir Face', 'दियामीर फेस'),
        S(5500, 'dark', 1.3, 0, 'Kinshofer Wall', 'किन्सहोफर भित्ता'),
        S(6000, 'blueice', 1, 0, 'Upper Diamir Face', 'माथिल्लो दियामीर फेस'),
        S(7200, 'snow', 0.7, 0, 'Bazhin Basin', 'बाजिन बेसिन'),
        S(7800, 'dark', 0.7, 0, 'Summit Pyramid', 'शिखर पिरामिड')] },
    { id: 'manaslu', en: 'Manaslu', ne: 'मनास्लु', m: 8163, rank: 8, where: 'np', route: ['Northeast Face', 'उत्तरपूर्वी फेस'],
      start: 4500, rows: 280, dmax: 0.5, haz: 0.7, drain: 0.84, camps: [4800, 5700, 6400, 6800, 7400], sections: [
        S(4500, 'moraine', 0.5, 0, 'Manaslu Glacier', 'मनास्लु हिमनदी'),
        S(4800, 'snow', 0.5, 0.03, 'Lower Slopes', 'तल्लो ढलान'),
        S(5700, 'ice', 1.1, 0.07, 'Manaslu Icefall', 'मनास्लु आइसफल'),
        S(6400, 'snow', 0.9, 0, 'Snow Slopes', 'हिउँ ढलान'),
        S(7400, 'ridge', 0.6, 0, 'Summit Plateau', 'शिखर पठार'),
        S(8050, 'ridge', 0.4, 0, 'Summit Pinnacle', 'शिखर चुचुरो')] },
    { id: 'dhaulagiri', en: 'Dhaulagiri I', ne: 'धौलागिरि प्रथम', m: 8167, rank: 7, where: 'np', route: ['Northeast Ridge', 'उत्तरपूर्वी धार'],
      start: 4400, rows: 300, dmax: 0.55, haz: 0.65, drain: 0.8, camps: [4700, 5800, 6450, 7250], sections: [
        S(4400, 'moraine', 0.5, 0, 'Chhonbardan Glacier', 'छोनबार्दान हिमनदी'),
        S(4900, 'ice', 1.1, 0.06, 'Dhaulagiri Icefall', 'धौलागिरि आइसफल'),
        S(5700, 'snow', 0.7, 0, 'Northeast Col', 'उत्तरपूर्वी कोल'),
        S(6000, 'blueice', 0.9, 0, 'Northeast Ridge', 'उत्तरपूर्वी धार'),
        S(7250, 'snow', 0.7, 0, 'Upper Ridge', 'माथिल्लो धार'),
        S(7900, 'dark', 0.7, 0, 'Summit Couloir', 'शिखर गल्छी')] },
    { id: 'chooyu', en: 'Cho Oyu', ne: 'चो ओयु', m: 8188, rank: 6, where: 'npcn', route: ['Northwest Ridge', 'उत्तरपश्चिमी धार'], abc: true,
      start: 5400, rows: 380, dmax: 0.74, haz: 1, drain: 1, camps: [5700, 6400, 7100, 7450], sections: [
        S(5400, 'moraine', 0.4, 0, 'Gyabrag Glacier', 'ग्याब्राग हिमनदी'),
        S(5800, 'moraine', 0.6, 0, 'Scree Slope', 'गेग्रान ढलान'),
        S(6300, 'snow', 0.6, 0, 'Northwest Ridge', 'उत्तरपश्चिमी धार'),
        S(6550, 'blueice', 1.2, 0, 'Ice Cliff', 'हिउँको भीर'),
        S(6700, 'snow', 0.6, 0, 'Northwest Ridge', 'उत्तरपश्चिमी धार'),
        S(7600, 'yellow', 1, 0, 'Yellow Band', 'येलो ब्यान्ड'),
        S(7750, 'ridge', 0.4, 0, 'Summit Plateau', 'शिखर पठार')] },
    { id: 'makalu', en: 'Makalu', ne: 'मकालु', m: 8485, rank: 5, where: 'npcn', route: ['Northwest Ridge', 'उत्तरपश्चिमी धार'], abc: true,
      start: 5400, rows: 420, dmax: 0.72, haz: 0.85, drain: 0.93, camps: [5700, 6400, 6800, 7400, 7700], sections: [
        S(5400, 'moraine', 0.5, 0, 'Barun Glacier', 'बरुण हिमनदी'),
        S(5900, 'snow', 0.6, 0.04, 'Crevasse Field', 'क्रेभास क्षेत्र'),
        S(6800, 'blueice', 1.1, 0, 'Ice Headwall', 'बरफको ठाडो भित्ता'),
        S(7400, 'ridge', 0.6, 0, 'Makalu La', 'मकालु ला'),
        S(7900, 'dark', 1, 0, 'French Couloir', 'फ्रेन्च गल्छी'),
        S(8300, 'ridge', 0.5, 0, 'Summit Ridge', 'शिखर धार')] },
    { id: 'lhotse', en: 'Lhotse', ne: 'ल्होत्से', m: 8516, rank: 4, where: 'npcn', route: ['West Face', 'पश्चिमी फेस'],
      start: 5000, rows: 480, dmax: 0.8, haz: 0.9, drain: 0.96, camps: [5364, 6065, 6400, 7162, 7800], sections: [
        ...KHUMBU,
        S(7800, 'dark', 1.2, 0, 'Lhotse Couloir', 'ल्होत्से गल्छी')] },
    { id: 'kangchenjunga', en: 'Kangchenjunga', ne: 'कञ्चनजङ्घा', m: 8586, rank: 3, where: 'npin', route: ['Southwest Face', 'दक्षिणपश्चिमी फेस'], tradition: true,
      start: 5200, rows: 560, dmax: 0.87, haz: 0.95, drain: 0.98, camps: [5500, 6200, 6500, 7200, 7700], sections: [
        S(5200, 'moraine', 0.5, 0, 'Yalung Glacier', 'यालुङ हिमनदी'),
        S(5600, 'ice', 1, 0.06, 'Lower Icefall', 'तल्लो आइसफल'),
        S(6500, 'blueice', 1.1, 0.03, 'Upper Icefall', 'माथिल्लो आइसफल'),
        S(7150, 'snow', 0.7, 0, 'Great Shelf', 'ग्रेट शेल्फ'),
        S(7900, 'ridge', 0.7, 0, 'The Gangway', 'ग्याङवे'),
        S(8350, 'dark', 0.6, 0, 'Summit Rocks', 'शिखर चट्टान')] },
    { id: 'k2', en: 'K2', ne: 'के२', m: 8611, rank: 2, where: 'pkcn', route: ['Abruzzi Spur', 'अब्रुज्जी स्पर'],
      start: 4700, rows: 640, dmax: 0.95, haz: 1.05, drain: 1, camps: [5000, 6050, 6700, 7200, 7800], sections: [
        S(4700, 'moraine', 0.5, 0, 'Godwin-Austen Glacier', 'गडविन-अस्टिन हिमनदी'),
        S(5300, 'snow', 0.8, 0, 'Abruzzi Spur', 'अब्रुज्जी स्पर'),
        S(6550, 'dark', 1.3, 0, "House's Chimney", 'हाउस चिम्नी'),
        S(6700, 'dark', 1.3, 0, 'Black Pyramid', 'ब्ल्याक पिरामिड'),
        S(7350, 'ridge', 0.7, 0, 'The Shoulder', 'द सोल्डर'),
        S(8200, 'blueice', 1.6, 0, 'The Bottleneck', 'बटलनेक'),
        S(8350, 'blueice', 1.4, 0, 'The Traverse', 'ट्राभर्स'),
        S(8450, 'ridge', 0.5, 0, 'Summit Slopes', 'शिखर ढलान')] },
    { id: 'everest', en: 'Sagarmatha (Everest)', ne: 'सगरमाथा', m: 8849, rank: 1, where: 'npcn', route: ['South Col Route', 'साउथ कोल रुट'],
      start: 5000, rows: 770, dmax: 1, haz: 1, drain: 1, camps: [5364, 6065, 6400, 7162, 7950], sections: [
        ...KHUMBU,
        S(7450, 'yellow', 1.15, 0, 'Yellow Band', 'येलो ब्यान्ड'),
        S(7650, 'dark', 1.1, 0, 'Geneva Spur', 'जेनेभा स्पर'),
        S(7950, 'ridge', 0.55, 0, 'Southeast Ridge', 'दक्षिणपूर्वी धार'),
        S(8790, 'dark', 0.3, 0, 'Hillary Step', 'हिलारी स्टेप'),
        S(8805, 'ridge', 0.3, 0, 'Summit Ridge', 'शिखर धार')],
      // Ledges on summit day that are not camps.
      marks: [{ m: 8400, en: 'The Balcony', ne: 'बाल्कोनी', note: 'swap' }, { m: 8749, en: 'South Summit', ne: 'दक्षिणी शिखर', note: 'close' }] },
  ];
  const WHERE = { np: ['Nepal', 'नेपाल'], pk: ['Pakistan', 'पाकिस्तान'], npcn: ['Nepal–China', 'नेपाल–चीन'], npin: ['Nepal–India', 'नेपाल–भारत'], pkcn: ['Pakistan–China', 'पाकिस्तान–चीन'] };
  const DEATH_ALT = 8000;

  // Wall colours per ground type; ice: true means kicked steps instead of rock holds.
  const TERRAIN = {
    moraine: { wall: ['#4f4842', '#7a7068'], crack: 'rgba(30,24,20,0.45)', ice: false },
    ice: { wall: ['#86b2d0', '#d6ebf7'], crack: 'rgba(30,100,150,0.55)', ice: true },
    snow: { wall: ['#b3c6da', '#eef4fa'], crack: 'rgba(90,120,160,0.4)', ice: true },
    blueice: { wall: ['#4f88b5', '#9cc7e5'], crack: 'rgba(15,55,100,0.55)', ice: true },
    yellow: { wall: ['#86703f', '#b99e66'], crack: 'rgba(60,45,20,0.5)', ice: false },
    dark: { wall: ['#2f2e36', '#56555f'], crack: 'rgba(10,10,15,0.55)', ice: false },
    ridge: { wall: ['#bccbdc', '#f4f8fc'], crack: 'rgba(90,120,160,0.4)', ice: true },
  };

  Object.assign(HC, { MOUNTAINS, WHERE, DEATH_ALT, TERRAIN });
})();
