// 36 drawn people for "Who Is It?". The roster is fixed (seeded) so players learn the faces over time.
const NAMES = [
  ['Aasha', 'आशा', 'f'], ['Aarav', 'आरव', 'm'], ['Binita', 'बिनिता', 'f'], ['Bibek', 'विवेक', 'm'],
  ['Deepa', 'दीपा', 'f'], ['Dipesh', 'दिपेश', 'm'], ['Gita', 'गीता', 'f'], ['Ganesh', 'गणेश', 'm'],
  ['Jamuna', 'जमुना', 'f'], ['Hari', 'हरि', 'm'], ['Kabita', 'कविता', 'f'], ['Ishwor', 'ईश्वर', 'm'],
  ['Laxmi', 'लक्ष्मी', 'f'], ['Kiran', 'किरण', 'm'], ['Maya', 'माया', 'f'], ['Manish', 'मनिस', 'm'],
  ['Nisha', 'निशा', 'f'], ['Nabin', 'नवीन', 'm'], ['Puja', 'पूजा', 'f'], ['Pasang', 'पासाङ', 'm'],
  ['Rita', 'रिता', 'f'], ['Prakash', 'प्रकाश', 'm'], ['Sarita', 'सरिता', 'f'], ['Rajan', 'राजन', 'm'],
  ['Sunita', 'सुनिता', 'f'], ['Sabin', 'सबिन', 'm'], ['Usha', 'उषा', 'f'], ['Suman', 'सुमन', 'm'],
  ['Anjali', 'अञ्जली', 'f'], ['Tashi', 'ताशी', 'm'], ['Lhamo', 'ल्हामो', 'f'], ['Ujjwal', 'उज्ज्वल', 'm'],
  ['Pema', 'पेमा', 'f'], ['Yubraj', 'युवराज', 'm'], ['Smriti', 'स्मृति', 'f'], ['Bishal', 'विशाल', 'm'],
];

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pick(r, table) { let x = r(); for (const [v, w] of table) { if ((x -= w) < 0) return v; } return table[table.length - 1][0]; }

function build() {
  const r = rng(20261112);
  const seen = new Set(); const out = [];
  for (const [en, ne, g] of NAMES) {
    for (;;) {
      const f = g === 'f';
      const style = pick(r, f ? [['long', 0.42], ['bun', 0.22], ['short', 0.16], ['curly', 0.2]] : [['short', 0.42], ['curly', 0.2], ['bald', 0.16], ['long', 0.1], ['bun', 0.12]]);
      const hair = style === 'bald' ? 'none' : pick(r, [['black', 0.46], ['brown', 0.24], ['white', 0.15], ['pink', 0.15]]);
      let hat = pick(r, [['none', 0.62], ['topi', f ? 0.08 : 0.24], ['cap', 0.16]]);
      if (style === 'bald' || style === 'bun') hat = 'none';
      const p = {
        en, ne, style, hair, hat,
        glasses: r() < 0.32,
        facial: f ? 'none' : pick(r, [['none', 0.5], ['mustache', 0.28], ['beard', 0.22]]),
        earrings: r() < (f ? 0.55 : 0.12),
        tika: r() < 0.28,
        smile: r() < 0.42,
        shirt: pick(r, [['red', 0.25], ['blue', 0.25], ['green', 0.25], ['yellow', 0.25]]),
        skin: Math.floor(r() * 3),
      };
      const key = [p.style, p.hair, p.hat, p.glasses, p.facial, p.earrings, p.tika, p.smile, p.shirt].join();
      if (!seen.has(key)) { seen.add(key); out.push(p); break; }
    }
  }
  return out;
}

export const PEOPLE = build();

export const QUESTIONS = [
  ['hairBlack', 'Black hair?', 'कालो कपाल?', (p) => p.hair === 'black'],
  ['hairBrown', 'Brown hair?', 'खैरो कपाल?', (p) => p.hair === 'brown'],
  ['hairWhite', 'White hair?', 'फुलेको कपाल?', (p) => p.hair === 'white'],
  ['hairPink', 'Pink hair?', 'गुलाबी कपाल?', (p) => p.hair === 'pink'],
  ['long', 'Long hair?', 'लामो कपाल?', (p) => p.style === 'long'],
  ['curly', 'Curly hair?', 'घुम्रिएको कपाल?', (p) => p.style === 'curly'],
  ['bun', 'Hair in a bun?', 'जुरो?', (p) => p.style === 'bun'],
  ['bald', 'Bald?', 'तालु खुइले?', (p) => p.style === 'bald'],
  ['hat', 'Any hat?', 'कुनै टोपी?', (p) => p.hat !== 'none'],
  ['topi', 'Dhaka topi?', 'ढाका टोपी?', (p) => p.hat === 'topi'],
  ['cap', 'A cap?', 'क्याप?', (p) => p.hat === 'cap'],
  ['glasses', 'Glasses?', 'चस्मा?', (p) => p.glasses],
  ['facial', 'Moustache or beard?', 'जुँगा वा दाह्री?', (p) => p.facial !== 'none'],
  ['beard', 'Full beard?', 'पूरा दाह्री?', (p) => p.facial === 'beard'],
  ['earrings', 'Earrings?', 'मुन्द्रा?', (p) => p.earrings],
  ['tika', 'Tika?', 'टीका?', (p) => p.tika],
  ['smile', 'Big toothy smile?', 'दाँत देखिने हाँसो?', (p) => p.smile],
  ['red', 'Red top?', 'रातो लुगा?', (p) => p.shirt === 'red'],
  ['blue', 'Blue top?', 'निलो लुगा?', (p) => p.shirt === 'blue'],
  ['green', 'Green top?', 'हरियो लुगा?', (p) => p.shirt === 'green'],
  ['yellow', 'Yellow top?', 'पहेँलो लुगा?', (p) => p.shirt === 'yellow'],
].map(([id, en, ne, test]) => ({ id, en, ne, test }));

const SKIN = ['#f2c9a5', '#d9a172', '#9c6440'];
const HAIR = { black: '#231a17', brown: '#7a4522', white: '#e4e0d8', pink: '#ff6fae', none: '#231a17' };
const SHIRT = { red: '#cf2a3a', blue: '#2f6fd6', green: '#2e9e4f', yellow: '#f2c230' };
const DARK = '#2a1b14';

export function faceSVG(p) {
  const sk = SKIN[p.skin]; const hc = HAIR[p.hair]; const o = [];
  o.push('<svg viewBox="0 0 100 100" aria-hidden="true">');
  o.push(`<rect width="100" height="100" fill="${['#f8e7c6', '#efe0f0', '#dcecf0'][p.skin]}"/>`);
  if (p.style === 'long') o.push(`<path d="M25 46Q20 86 32 92H68Q80 86 75 46Z" fill="${hc}"/>`);
  o.push(`<path d="M12 101Q14 78 36 74H64Q86 78 88 101Z" fill="${SHIRT[p.shirt]}"/><path d="M42 74L50 84 58 74Z" fill="#ffffff55"/>`);
  o.push(`<rect x="43" y="62" width="14" height="14" fill="${sk}"/><rect x="43" y="66" width="14" height="4" fill="#0002"/>`);
  o.push(`<ellipse cx="28" cy="50" rx="4" ry="6" fill="${sk}"/><ellipse cx="72" cy="50" rx="4" ry="6" fill="${sk}"/>`);
  if (p.earrings) o.push('<circle cx="27.5" cy="58" r="2.8" fill="#e9b43c" stroke="#a87a10" stroke-width=".8"/><circle cx="72.5" cy="58" r="2.8" fill="#e9b43c" stroke="#a87a10" stroke-width=".8"/>');
  o.push(`<ellipse cx="50" cy="47" rx="22" ry="25" fill="${sk}"/>`);
  // hair on top
  if (p.hat === 'none') {
    if (p.style === 'short') o.push(`<path d="M28 46Q26 20 50 20Q74 20 72 46Q68 31 50 30Q34 31 28 46Z" fill="${hc}"/>`);
    if (p.style === 'long') o.push(`<path d="M27 52Q24 19 50 19Q76 19 73 52Q70 31 56 30Q50 36 40 32Q31 36 27 52Z" fill="${hc}"/>`);
    if (p.style === 'bun') o.push(`<circle cx="50" cy="15" r="9" fill="${hc}"/><path d="M28 44Q27 21 50 21Q73 21 72 44Q66 30 50 30Q34 30 28 44Z" fill="${hc}"/>`);
    if (p.style === 'curly') {
      for (let a = 0; a <= 10; a++) {
        const t = Math.PI * (1.05 - a * 0.11);
        o.push(`<circle cx="${(50 + Math.cos(t) * 23).toFixed(1)}" cy="${(40 - Math.sin(t) * 19).toFixed(1)}" r="7" fill="${hc}"/>`);
      }
    }
  } else if (p.style !== 'bald') {
    o.push(`<path d="M27.5 36Q26 47 29 52L31 37Z M72.5 36Q74 47 71 52L69 37Z" fill="${hc}" stroke="${hc}" stroke-width="3"/>`);
    if (p.style === 'curly') o.push(`<circle cx="28" cy="40" r="5" fill="${hc}"/><circle cx="72" cy="40" r="5" fill="${hc}"/>`);
  }
  // face
  const brow = p.style === 'bald' ? DARK : (p.hair === 'white' ? '#b9b3a8' : p.hair === 'pink' ? DARK : hc);
  o.push(`<path d="M37 40Q41 37.5 45 40M55 40Q59 37.5 63 40" fill="none" stroke="${brow}" stroke-width="2.2" stroke-linecap="round"/>`);
  o.push(`<circle cx="41" cy="47" r="2.6" fill="${DARK}"/><circle cx="59" cy="47" r="2.6" fill="${DARK}"/>`);
  if (p.glasses) o.push(`<g fill="#ffffff22" stroke="${DARK}" stroke-width="2"><circle cx="41" cy="47" r="7"/><circle cx="59" cy="47" r="7"/></g><path d="M48 47h4M34 46l-6-2M66 46l6-2" stroke="${DARK}" stroke-width="2"/>`);
  o.push('<path d="M50 50Q47.5 55 50 56" fill="none" stroke="#0004" stroke-width="1.8" stroke-linecap="round"/>');
  if (p.smile) o.push(`<path d="M41 59Q50 69 59 59Z" fill="#fff" stroke="${DARK}" stroke-width="1.8" stroke-linejoin="round"/>`);
  else o.push(`<path d="M44 60Q50 63.5 56 60" fill="none" stroke="${DARK}" stroke-width="2" stroke-linecap="round"/>`);
  const fh = p.hair === 'none' ? HAIR.black : hc;
  if (p.facial === 'beard') o.push(`<path d="M28 47Q29 75 50 75Q71 75 72 47Q69 63 60 64Q55 58 50 66Q45 58 40 64Q31 63 28 47Z" fill="${fh}"/>`);
  if (p.facial !== 'none') o.push(`<path d="M41 57.5Q46 53 50 55.5Q54 53 59 57.5Q54 56.5 50 57.5Q46 56.5 41 57.5Z" fill="${fh}" stroke="${fh}" stroke-width="1.5"/>`);
  if (p.tika) o.push('<ellipse cx="50" cy="35" rx="2" ry="3.2" fill="#d4142b"/>');
  if (p.hat === 'topi') {
    o.push('<path d="M27 36L30 17Q50 11 70 17L73 36Q50 29 27 36Z" fill="#a8202c"/>');
    o.push('<path d="M29 31L33 25 37 31 41 25 45 31 49 25 53 31 57 25 61 31 65 25 69 31" fill="none" stroke="#1c2330" stroke-width="2.4"/><path d="M30 22L34 19 38 22 42 19 46 22 50 19 54 22 58 19 62 22 66 19 70 22" fill="none" stroke="#f3ddb2" stroke-width="1.8"/>');
  }
  if (p.hat === 'cap') {
    const cc = p.shirt === 'blue' ? '#1c2330' : '#2f6fd6';
    o.push(`<path d="M27 37Q26 15 50 15Q74 15 73 37Z" fill="${cc}"/><path d="M50 35Q72 31 87 37Q73 42 50 39Z" fill="${cc}" stroke="#0003" stroke-width="1"/><circle cx="50" cy="15.5" r="2" fill="#fff6e3"/>`);
  }
  o.push('</svg>');
  return o.join('');
}
