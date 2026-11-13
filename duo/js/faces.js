// 36 cartoon people for "Who Is It?". The roster is fixed (seeded) so players learn the faces.
// Drawn as bold cartoons: thick ink outline, flat colours with one cel shade, big eyes,
// and lots of visible differences (head shape, hair, hats, glasses, mouths, extras) so every
// face can be told apart at a glance, even small.
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

const HEAD_TYPES = ['round', 'oval', 'wide', 'long', 'square'];

// Seed found by searching seeds 1-60000 for the roster where every question is true for
// 3-14 of the 36 people and all five head shapes appear often. Changing it reshuffles everyone.
const SEED = 58558;
export function buildRoster(seed = SEED) {
  const r = rng(seed);
  const seen = new Set(); const out = [];
  NAMES.forEach(([en, ne, g], idx) => {
    for (;;) {
      const f = g === 'f';
      const style = pick(r, f
        ? [['long', 0.32], ['bun', 0.2], ['curly', 0.2], ['short', 0.16], ['spiky', 0.12]]
        : [['short', 0.3], ['spiky', 0.2], ['curly', 0.16], ['bald', 0.18], ['long', 0.08], ['bun', 0.08]]);
      const hair = style === 'bald' ? 'none' : pick(r, [['black', 0.34], ['brown', 0.24], ['white', 0.14], ['pink', 0.14], ['blue', 0.14]]);
      let hat = pick(r, [['none', 0.58], ['topi', f ? 0.06 : 0.2], ['cap', 0.14], ['beanie', 0.12]]);
      if (style === 'bald' || style === 'bun') hat = 'none';
      const p = {
        idx, en, ne, style, hair, hat,
        glasses: pick(r, [['none', 0.62], ['glasses', 0.26], ['shades', 0.12]]),
        facial: f ? 'none' : pick(r, [['none', 0.45], ['mustache', 0.3], ['beard', 0.25]]),
        earrings: r() < (f ? 0.5 : 0.12),
        tika: r() < 0.25,
        freckles: r() < 0.25,
        headphones: r() < 0.2,
        mouth: pick(r, [['smile', 0.32], ['grin', 0.22], ['laugh', 0.14], ['flat', 0.16], ['smirk', 0.16]]),
        shirt: pick(r, [['red', 0.25], ['blue', 0.25], ['green', 0.25], ['yellow', 0.25]]),
        // visual-only variety (never asked about)
        skin: Math.floor(r() * 4),
        head: HEAD_TYPES[Math.floor(r() * HEAD_TYPES.length)],
        eyes: pick(r, [['round', 0.45], ['dot', 0.4], ['happy', 0.15]]),
        nose: Math.floor(r() * 3),
        brow: r() * 0.5 - 0.25,
        frame: ['#1e1712', '#c0392b', '#7a4b1e', '#2b59c3'][Math.floor(r() * 4)],
        capC: ['#e23b3b', '#2b59c3', '#262626', '#ff8a00'][Math.floor(r() * 4)],
        beanieC: ['#7c4dff', '#ff6d00', '#00897b', '#e91e63'][Math.floor(r() * 4)],
        phonesC: ['#ff4f9a', '#00b8d4', '#ffcb1f'][Math.floor(r() * 3)],
      };
      const key = [p.style, p.hair, p.hat, p.glasses, p.facial, p.earrings, p.tika, p.freckles, p.headphones, ['grin', 'laugh'].includes(p.mouth), p.shirt].join();
      if (!seen.has(key)) { seen.add(key); out.push(p); break; }
    }
  });
  return out;
}

export const PEOPLE = buildRoster();

export const QUESTIONS = [
  ['hairBlack', 'Black hair?', 'कालो कपाल?', (p) => p.hair === 'black'],
  ['hairBrown', 'Brown hair?', 'खैरो कपाल?', (p) => p.hair === 'brown'],
  ['hairWhite', 'White hair?', 'फुलेको (सेतो) कपाल?', (p) => p.hair === 'white'],
  ['hairPink', 'Pink hair?', 'गुलाबी कपाल?', (p) => p.hair === 'pink'],
  ['hairBlue', 'Blue hair?', 'निलो कपाल?', (p) => p.hair === 'blue'],
  ['long', 'Long hair?', 'लामो कपाल?', (p) => p.style === 'long'],
  ['curly', 'Curly hair?', 'घुम्रिएको कपाल?', (p) => p.style === 'curly'],
  ['spiky', 'Spiky hair?', 'ठाडो काँडे कपाल?', (p) => p.style === 'spiky'],
  ['bun', 'Hair in a bun?', 'जुरो?', (p) => p.style === 'bun'],
  ['bald', 'Bald?', 'तालु खुइले?', (p) => p.style === 'bald'],
  ['hat', 'Any hat?', 'कुनै टोपी?', (p) => p.hat !== 'none'],
  ['topi', 'Dhaka topi?', 'ढाका टोपी?', (p) => p.hat === 'topi'],
  ['cap', 'A cap?', 'क्याप?', (p) => p.hat === 'cap'],
  ['beanie', 'Woolly hat?', 'ऊनी टोपी?', (p) => p.hat === 'beanie'],
  ['glasses', 'Any glasses?', 'कुनै चस्मा?', (p) => p.glasses !== 'none'],
  ['shades', 'Sunglasses?', 'कालो चस्मा?', (p) => p.glasses === 'shades'],
  ['facial', 'Moustache or beard?', 'जुँगा वा दाह्री?', (p) => p.facial !== 'none'],
  ['beard', 'Full beard?', 'पूरा दाह्री?', (p) => p.facial === 'beard'],
  ['earrings', 'Earrings?', 'मुन्द्रा?', (p) => p.earrings],
  ['tika', 'Tika?', 'टीका?', (p) => p.tika],
  ['freckles', 'Freckles?', 'गालामा थोप्ला?', (p) => p.freckles],
  ['headphones', 'Headphones?', 'हेडफोन?', (p) => p.headphones],
  ['teeth', 'Showing teeth?', 'दाँत देखिने?', (p) => p.mouth === 'grin' || p.mouth === 'laugh'],
  ['red', 'Red top?', 'रातो लुगा?', (p) => p.shirt === 'red'],
  ['blue', 'Blue top?', 'निलो लुगा?', (p) => p.shirt === 'blue'],
  ['green', 'Green top?', 'हरियो लुगा?', (p) => p.shirt === 'green'],
  ['yellow', 'Yellow top?', 'पहेँलो लुगा?', (p) => p.shirt === 'yellow'],
].map(([id, en, ne, test]) => ({ id, en, ne, test }));

const INK = '#1e1712';
const SW = 2.4;
const BG = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6', '#a0c4ff', '#ffadad', '#d0f4de'];
const SKIN = [{ base: '#ffdcbc', shade: '#f0b994' }, { base: '#f1b98a', shade: '#d9976a' }, { base: '#cf8a5c', shade: '#ad6c42' }, { base: '#9a5f3d', shade: '#7a4529' }];
const HAIR = { black: '#2b2222', brown: '#8a5230', white: '#ece8e0', pink: '#ff7ab8', blue: '#4f8cff', none: '#4a3528' };
const SHIRT = { red: '#ef4444', blue: '#3b6fe0', green: '#2fae5a', yellow: '#f5c518' };
const HEADS = { round: { rx: 23, ry: 24 }, oval: { rx: 20, ry: 26 }, wide: { rx: 26, ry: 21 }, long: { rx: 18, ry: 27 }, square: { rx: 22, ry: 23 } };

const f1 = (n) => Math.round(n * 10) / 10;
function shapeTag(p, cx, cy, rx, ry) {
  return p.head === 'square'
    ? `<rect x="${f1(cx - rx)}" y="${f1(cy - ry)}" width="${f1(rx * 2)}" height="${f1(ry * 2)}" rx="${f1(rx * 0.62)}"/>`
    : `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
}
// cloud of overlapping circles with one clean outline (stroke pass, then fill pass)
function cloud(circles, fillC) {
  const s = circles.map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/>`).join('');
  return `<g fill="${fillC}" stroke="${INK}" stroke-width="${SW * 2}">${s}</g><g fill="${fillC}">${s}</g>`;
}

export function faceSVG(p) {
  const { rx, ry } = HEADS[p.head];
  const cx = 50; const cy = 47;
  const sk = SKIN[p.skin]; const hc = HAIR[p.hair];
  const ex = rx * 0.42; const ey = cy - ry * 0.04; const my = cy + ry * 0.5;
  const sy = cy + ry - 3;
  const id = `fc${p.idx}`;
  const head = shapeTag(p, cx, cy, rx, ry);
  const o = [`<svg viewBox="0 0 100 100" aria-hidden="true">`];
  o.push(`<rect width="100" height="100" fill="${BG[(p.idx * 4) % BG.length]}"/>`);
  o.push('<path d="M-10 80L80-10M10 110L110 10M40 120L120 40" stroke="#ffffff59" stroke-width="9"/>');

  // hair behind the head
  if (p.style === 'long') {
    o.push(`<path d="M${cx - rx - 5} ${cy}C${cx - rx - 9} ${cy + ry + 6} ${cx - rx} ${cy + ry + 15} ${cx - rx + 4} ${cy + ry + 15}L${cx + rx - 4} ${cy + ry + 15}C${cx + rx} ${cy + ry + 15} ${cx + rx + 9} ${cy + ry + 6} ${cx + rx + 5} ${cy}C${cx + rx + 4} ${cy - ry - 9} ${cx - rx - 4} ${cy - ry - 9} ${cx - rx - 5} ${cy}Z" fill="${hc}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  }
  if (p.style === 'curly') {
    const c = [];
    for (let k = 0; k <= 10; k++) { const a = Math.PI * (0.9 + k * 0.12); c.push([cx + Math.cos(a) * (rx + 4), cy - 2 + Math.sin(a) * (ry + 3), 8.5]); }
    o.push(cloud(c, hc));
  }
  if (p.style === 'bun') o.push(`<circle cx="${cx}" cy="${f1(cy - ry - 6)}" r="9" fill="${hc}" stroke="${INK}" stroke-width="${SW}"/>`);

  // body, neck, collar
  o.push(`<path d="M12 101C13 ${sy + 12} 24 ${sy + 4} 38 ${sy + 2}L62 ${sy + 2}C76 ${sy + 4} 87 ${sy + 12} 88 101Z" fill="${SHIRT[p.shirt]}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  o.push(`<rect x="${cx - 7}" y="${f1(cy + ry - 9)}" width="14" height="13" fill="${sk.shade}" stroke="${INK}" stroke-width="${SW}"/>`);
  o.push(`<path d="M41 ${sy + 2}L50 ${sy + 11}L59 ${sy + 2}" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`);
  if (p.headphones) {
    o.push(`<path d="M${cx - 15} ${sy + 3}Q${cx} ${sy + 17} ${cx + 15} ${sy + 3}" fill="none" stroke="#2b2b35" stroke-width="3.5" stroke-linecap="round"/>`);
    [cx - 22, cx + 13].forEach((x) => o.push(`<rect x="${x}" y="${sy - 3}" width="9" height="12" rx="3.5" fill="${p.phonesC}" stroke="${INK}" stroke-width="2"/>`));
  }

  // ears + earrings
  [-1, 1].forEach((s) => {
    o.push(`<circle cx="${cx + s * rx}" cy="${cy + 1}" r="5.5" fill="${sk.base}" stroke="${INK}" stroke-width="${SW}"/>`);
    if (p.earrings) o.push(`<circle cx="${cx + s * rx}" cy="${cy + 9}" r="3.2" fill="none" stroke="#f2b705" stroke-width="2.2"/>`);
  });

  // head with one cel shade
  o.push(`<clipPath id="${id}">${head}</clipPath>`);
  o.push(`<g fill="${sk.base}">${head}</g>`);
  o.push(`<g clip-path="url(#${id})"><ellipse cx="${f1(cx + rx * 0.95)}" cy="${cy + 4}" rx="${f1(rx * 0.5)}" ry="${f1(ry * 1.1)}" fill="${sk.shade}" opacity=".6"/></g>`);
  o.push(`<g fill="none" stroke="${INK}" stroke-width="${SW}">${head}</g>`);
  [-1, 1].forEach((s) => o.push(`<ellipse cx="${f1(cx + s * rx * 0.6)}" cy="${f1(cy + ry * 0.3)}" rx="4.6" ry="2.6" fill="#ff5d5d" opacity=".28"/>`));
  if (p.freckles) [-1, 1].forEach((s) => [[0, 0], [2.6, -1.6], [2.4, 1.8], [-2.2, 1.2]].forEach(([dx, dy]) => o.push(`<circle cx="${f1(cx + s * (rx * 0.55 + dx))}" cy="${f1(cy + ry * 0.24 + dy)}" r=".95" fill="#8a4a26" opacity=".8"/>`)));

  // beard sits under the mouth
  const fhC = p.hair === 'none' ? HAIR.none : hc;
  if (p.facial === 'beard') o.push(`<path d="M${cx - rx} ${cy + 2}C${cx - rx} ${cy + ry + 7} ${cx + rx} ${cy + ry + 7} ${cx + rx} ${cy + 2}C${cx + rx - 3} ${f1(cy + ry * 0.55)} ${cx + 6} ${f1(my + 6)} ${cx} ${f1(my + 6)}C${cx - 6} ${f1(my + 6)} ${cx - rx + 3} ${f1(cy + ry * 0.55)} ${cx - rx} ${cy + 2}Z" fill="${fhC}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);

  // front hair
  const sideTufts = () => [-1, 1].forEach((s) => o.push(`<path d="M${f1(cx + s * (rx + 1))} ${f1(cy - ry * 0.35)}q${-s * 3} 9 ${s * 1} 15l${s * 4} -13z" fill="${hc}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`));
  if (p.hat !== 'none') { if (p.style !== 'bald' && p.style !== 'long' && p.style !== 'curly') sideTufts(); } else if (p.style === 'short' || p.style === 'bun') {
    o.push(`<path d="M${cx - rx - 1} ${cy + 2}C${cx - rx - 3} ${cy - ry - 8} ${cx + rx + 3} ${cy - ry - 8} ${cx + rx + 1} ${cy + 2}C${cx + rx - 3} ${f1(cy - ry * 0.35)} ${f1(cx + rx * 0.3)} ${f1(cy - ry * 0.62)} ${f1(cx - rx * 0.1)} ${f1(cy - ry * 0.48)}C${f1(cx - rx * 0.5)} ${f1(cy - ry * 0.62)} ${cx - rx + 2} ${f1(cy - ry * 0.4)} ${cx - rx - 1} ${cy + 2}Z" fill="${hc}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  } else if (p.style === 'spiky') {
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (1.06 + (k / 12) * 0.88);
      const tip = k % 2 === 1; const R = tip ? 11 : 1;
      pts.push(`${f1(cx + Math.cos(a) * (rx + R))},${f1(cy + Math.sin(a) * (ry + R + (tip ? 2 : 0)))}`);
    }
    pts.push(`${f1(cx + rx * 0.55)},${f1(cy - ry * 0.42)}`, `${cx},${f1(cy - ry * 0.55)}`, `${f1(cx - rx * 0.55)},${f1(cy - ry * 0.42)}`);
    o.push(`<polygon points="${pts.join(' ')}" fill="${hc}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  } else if (p.style === 'long') {
    o.push(`<path d="M${cx - rx - 2} ${f1(cy + ry * 0.7)}C${cx - rx - 4} ${cy - ry - 8} ${cx + rx + 4} ${cy - ry - 8} ${cx + rx + 2} ${f1(cy + ry * 0.7)}L${cx + rx - 3} ${f1(cy + ry * 0.7)}C${cx + rx - 2} ${f1(cy - ry * 0.2)} ${f1(cx + rx * 0.4)} ${f1(cy - ry * 0.55)} ${cx} ${f1(cy - ry * 0.55)}C${f1(cx - rx * 0.6)} ${f1(cy - ry * 0.5)} ${cx - rx + 1} ${f1(cy - ry * 0.1)} ${cx - rx + 3} ${f1(cy + ry * 0.7)}Z" fill="${hc}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  } else if (p.style === 'curly') {
    const c = [];
    for (let k = 0; k <= 6; k++) { const a = Math.PI * (1.12 + k * 0.127); c.push([cx + Math.cos(a) * (rx - 1), cy - 3 + Math.sin(a) * (ry - 2), 6.5]); }
    o.push(cloud(c, hc));
  } else if (p.style === 'bald') {
    o.push(`<ellipse cx="${f1(cx - rx * 0.32)}" cy="${f1(cy - ry * 0.66)}" rx="6.5" ry="3" transform="rotate(-20 ${f1(cx - rx * 0.32)} ${f1(cy - ry * 0.66)})" fill="#fff" opacity=".5"/>`);
  }

  // brows, eyes, glasses
  const browC = p.hair === 'white' ? '#9a948a' : (p.hair === 'black' || p.hair === 'brown') ? hc : INK;
  [-1, 1].forEach((s) => {
    const bx = cx + s * ex; const by = ey - 7.5;
    o.push(`<path d="M${f1(bx - 4)} ${f1(by + s * p.brow * 3)}Q${f1(bx)} ${f1(by - 3)} ${f1(bx + 4)} ${f1(by - s * p.brow * 3)}" fill="none" stroke="${browC}" stroke-width="2.7" stroke-linecap="round"/>`);
    if (p.glasses === 'shades') return;
    if (p.eyes === 'round') {
      o.push(`<ellipse cx="${f1(bx)}" cy="${f1(ey)}" rx="4.6" ry="5" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`);
      o.push(`<circle cx="${f1(bx - s * 0.8)}" cy="${f1(ey + 0.6)}" r="2.6" fill="${INK}"/><circle cx="${f1(bx - s * 0.8 - 0.9)}" cy="${f1(ey - 0.5)}" r=".9" fill="#fff"/>`);
    } else if (p.eyes === 'dot') {
      o.push(`<ellipse cx="${f1(bx)}" cy="${f1(ey)}" rx="2.7" ry="3.2" fill="${INK}"/><circle cx="${f1(bx - 0.9)}" cy="${f1(ey - 1)}" r=".95" fill="#fff"/>`);
    } else {
      o.push(`<path d="M${f1(bx - 3.6)} ${f1(ey + 1)}q3.6 -4.6 7.2 0" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linecap="round"/>`);
    }
  });
  if (p.glasses === 'glasses') {
    [-1, 1].forEach((s) => o.push(`<circle cx="${f1(cx + s * ex)}" cy="${f1(ey)}" r="7" fill="#ffffff2e" stroke="${p.frame}" stroke-width="2.4"/>`));
    o.push(`<path d="M${f1(cx - ex + 7)} ${f1(ey)}Q${cx} ${f1(ey - 3)} ${f1(cx + ex - 7)} ${f1(ey)}M${f1(cx - ex - 7)} ${f1(ey - 1)}L${cx - rx + 1} ${f1(ey - 3)}M${f1(cx + ex + 7)} ${f1(ey - 1)}L${cx + rx - 1} ${f1(ey - 3)}" fill="none" stroke="${p.frame}" stroke-width="2.2"/>`);
  }
  if (p.glasses === 'shades') {
    [-1, 1].forEach((s) => o.push(`<rect x="${f1(cx + s * ex - 7)}" y="${f1(ey - 5)}" width="14" height="10" rx="4" fill="#1b1b2a" stroke="${INK}" stroke-width="2"/><path d="M${f1(cx + s * ex - 4)} ${f1(ey - 2)}l3 -1.4" stroke="#ffffffaa" stroke-width="1.6" stroke-linecap="round"/>`));
    o.push(`<path d="M${f1(cx - ex + 7)} ${f1(ey - 1)}H${f1(cx + ex - 7)}M${f1(cx - ex - 7)} ${f1(ey - 2)}L${cx - rx + 1} ${f1(ey - 3)}M${f1(cx + ex + 7)} ${f1(ey - 2)}L${cx + rx - 1} ${f1(ey - 3)}" stroke="${INK}" stroke-width="2.2"/>`);
  }
  if (p.tika) o.push(`<ellipse cx="${cx}" cy="${f1(ey - 9.5)}" rx="1.7" ry="2.7" fill="#e0142b"/>`);

  // nose
  const ny = cy + ry * 0.2;
  if (p.nose === 0) o.push(`<ellipse cx="${cx}" cy="${f1(ny)}" rx="2.8" ry="2.2" fill="${sk.shade}" stroke="${INK}" stroke-width="1.4"/>`);
  if (p.nose === 1) o.push(`<path d="M${cx + 0.5} ${f1(ny - 5)}q-3.5 6 0.5 7" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`);
  if (p.nose === 2) o.push(`<ellipse cx="${cx}" cy="${f1(ny)}" rx="4" ry="3.2" fill="${sk.shade}" stroke="${INK}" stroke-width="1.6"/>`);

  // mouth
  const m = { x: cx, y: f1(my) };
  if (p.mouth === 'smile') o.push(`<path d="M${m.x - 7} ${m.y - 1}Q${m.x} ${m.y + 6} ${m.x + 7} ${m.y - 1}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`);
  if (p.mouth === 'grin') o.push(`<path d="M${m.x - 8} ${m.y - 2}Q${m.x} ${m.y + 9} ${m.x + 8} ${m.y - 2}Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M${m.x - 6} ${m.y + 0.6}H${m.x + 6}M${m.x - 2} ${m.y - 1.5}v3.6M${m.x + 2} ${m.y - 1.5}v3.6" stroke="${INK}" stroke-width=".9"/>`);
  if (p.mouth === 'laugh') o.push(`<path d="M${m.x - 7} ${m.y - 2}Q${m.x} ${m.y + 11} ${m.x + 7} ${m.y - 2}Z" fill="#5a1a1a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="${m.x}" cy="${m.y + 4.6}" rx="3.4" ry="2" fill="#ff7b8a"/><path d="M${m.x - 6} ${m.y - 1.2}H${m.x + 6}" stroke="#fff" stroke-width="2"/>`);
  if (p.mouth === 'flat') o.push(`<path d="M${m.x - 5} ${m.y + 1}H${m.x + 5}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`);
  if (p.mouth === 'smirk') o.push(`<path d="M${m.x - 5} ${m.y + 1}Q${m.x + 2} ${m.y + 3} ${m.x + 7} ${m.y - 2.5}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`);
  if (p.facial !== 'none') o.push(`<path d="M${m.x} ${m.y - 3.5}c-3 -3.4 -9 -3.4 -11.5 1c3.5 -1.2 6.5 0 11.5 -1c5 1 8 -0.2 11.5 1c-2.5 -4.4 -8.5 -4.4 -11.5 -1Z" fill="${fhC}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`);

  // hats on top
  if (p.hat === 'topi') {
    const tp = `M${cx - rx + 1} ${f1(cy - ry * 0.5)}L${f1(cx - rx * 0.8)} ${cy - ry - 10}Q${cx} ${cy - ry - 15} ${f1(cx + rx * 0.8)} ${cy - ry - 8}L${cx + rx - 1} ${f1(cy - ry * 0.5)}Q${cx} ${f1(cy - ry * 0.64)} ${cx - rx + 1} ${f1(cy - ry * 0.5)}Z`;
    o.push(`<clipPath id="${id}t"><path d="${tp}"/></clipPath><path d="${tp}" fill="#b3202d"/>`);
    let zz = ''; let zw = '';
    for (let x = cx - rx; x <= cx + rx; x += 6) { zz += `${x === cx - rx ? 'M' : 'L'}${x} ${f1(cy - ry * 0.72)}l3 -5`; zw += `${x === cx - rx ? 'M' : 'L'}${x} ${cy - ry - 3}l3 -4`; }
    o.push(`<g clip-path="url(#${id}t)" fill="none" stroke-width="2.2"><path d="${zz}" stroke="#141210"/><path d="${zw}" stroke="#fffaf0"/></g>`);
    o.push(`<path d="${tp}" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
  }
  if (p.hat === 'cap') {
    const dark = '#00000040';
    o.push(`<path d="M${cx - rx - 1} ${f1(cy - ry * 0.32)}C${cx - rx - 1} ${cy - ry - 9} ${cx + rx + 1} ${cy - ry - 9} ${cx + rx + 1} ${f1(cy - ry * 0.32)}Z" fill="${p.capC}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
    o.push(`<path d="M${f1(cx - rx * 0.15)} ${f1(cy - ry * 0.4)}Q${cx + rx + 10} ${f1(cy - ry * 0.56)} ${cx + rx + 15} ${f1(cy - ry * 0.24)}Q${cx + rx} ${f1(cy - ry * 0.1)} ${f1(cx - rx * 0.15)} ${f1(cy - ry * 0.28)}Z" fill="${p.capC}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M${f1(cx - rx * 0.15)} ${f1(cy - ry * 0.33)}Q${cx + rx + 6} ${f1(cy - ry * 0.4)} ${cx + rx + 14} ${f1(cy - ry * 0.25)}" fill="none" stroke="${dark}" stroke-width="3"/>`);
    o.push(`<circle cx="${cx}" cy="${f1(cy - ry - 6)}" r="2.2" fill="${p.capC}" stroke="${INK}" stroke-width="1.6"/><path d="M${cx} ${cy - ry - 4}V${f1(cy - ry * 0.34)}" stroke="${dark}" stroke-width="1.4"/>`);
  }
  if (p.hat === 'beanie') {
    o.push(`<path d="M${cx - rx - 1} ${f1(cy - ry * 0.4)}C${cx - rx - 2} ${cy - ry - 12} ${cx + rx + 2} ${cy - ry - 12} ${cx + rx + 1} ${f1(cy - ry * 0.4)}Z" fill="${p.beanieC}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`);
    let ribs = '';
    for (let x = cx - rx + 6; x < cx + rx - 3; x += 6) ribs += `M${x} ${f1(cy - ry * 0.55)}V${f1(cy - ry - 2 + Math.abs(x - cx) * 0.35)}`;
    o.push(`<path d="${ribs}" stroke="#00000033" stroke-width="1.6"/>`);
    o.push(`<rect x="${cx - rx - 2}" y="${f1(cy - ry * 0.62)}" width="${rx * 2 + 4}" height="8" rx="4" fill="${p.beanieC}" stroke="${INK}" stroke-width="${SW}"/><rect x="${cx - rx - 2}" y="${f1(cy - ry * 0.62)}" width="${rx * 2 + 4}" height="8" rx="4" fill="#00000026"/>`);
    o.push(`<circle cx="${cx}" cy="${f1(cy - ry - 11)}" r="5.5" fill="#fffaf0" stroke="${INK}" stroke-width="${SW}"/>`);
  }
  o.push('</svg>');
  return o.join('');
}
