/* Pro Scout — question builders (clue ladders), categories, and round building (seeded). */
(() => {
  'use strict';

  window.PS = window.PS || {};
  const { SPORTS, COUNTRIES, CONTINENTS, PLAYERS } = window.PS_DATA;
  const { esc, mulberry32, shuffle, pick, sex, cName, flag, clubsOf, sameNation, POS } = PS.Core;
  const { failedPhotos, pinFailed, loadImage } = PS.Photos;
  const { GEO, PART_NAME } = PS.Draw;

  // Extra real teams used only as wrong answers, so small sports still get 4 options.
  const EXTRA_TEAMS = {
    football: ['Benfica', 'Porto', 'Valencia', 'Lazio', 'Aston Villa', 'Olympique Lyonnais', 'Feyenoord', 'Boca Juniors', 'River Plate', 'Everton', 'Sporting CP', 'Anderlecht', 'Lille'],
    basketball: ['Boston Celtics', 'Chicago Bulls', 'New York Knicks', 'Toronto Raptors', 'Utah Jazz', 'Detroit Pistons', 'Sacramento Kings', 'Atlanta Hawks', 'Panathinaikos', 'Olympiacos'],
    f1: ['Williams', 'Haas', 'Force India', 'Jaguar', 'Brabham', 'Tyrrell', 'Arrows', 'Benetton', 'Renault'],
    nfl: ['Dallas Cowboys', 'Green Bay Packers', 'Pittsburgh Steelers', 'San Francisco 49ers', 'Denver Broncos', 'Buffalo Bills'],
    hockey: ['Montreal Canadiens', 'Toronto Maple Leafs', 'Detroit Red Wings', 'Chicago Blackhawks', 'SKA Saint Petersburg', 'CSKA Moscow'],
    baseball: ['Chicago Cubs', 'San Francisco Giants', 'St. Louis Cardinals', 'Yomiuri Giants', 'Seattle Mariners', 'Hanshin Tigers'],
  };
  const teamsBySport = {};
  for (const p of PLAYERS) for (const c of clubsOf(p)) (teamsBySport[p.s] ||= new Set()).add(c);
  for (const [s, list] of Object.entries(EXTRA_TEAMS)) for (const c of list) (teamsBySport[s] ||= new Set()).add(c);

  // ---------- Question builders ----------
  // Every question has a clue ladder: stage 0 is free, each later stage costs points.
  // Stage fields: parts (face windows shown, or 'all'), cover (sticker over the face), add (clue chips), remove (wrong answers struck out), shown (career path clubs visible), label (button text).
  const avail = (used, f) => PLAYERS.filter((p) => !used.has(p.id) && f(p));

  function clueCountry(p) { return { k: 'Country', html: `${flag(p.c)} ${esc(cName(p.c))}` }; }
  function clueSport(p) { return { k: 'Sport', html: esc(SPORTS[p.s].name) }; }
  function clueBorn(p) { return { k: 'Born', html: String(p.b) }; }

  function nameOpts(rng, ans, opts = {}) {
    const ok = (p) => p.id !== ans.id && sex(p) === sex(ans) && (!opts.filter || opts.filter(p));
    const same = shuffle(rng, PLAYERS.filter((p) => ok(p) && p.s === ans.s));
    const other = shuffle(rng, PLAYERS.filter((p) => ok(p) && p.s !== ans.s));
    const nSame = opts.sameSport ?? 3;
    const picks = same.slice(0, nSame);
    while (picks.length < 3 && other.length) picks.push(other.shift());
    while (picks.length < 3 && same.length > picks.length) picks.push(same[picks.length]);
    if (picks.length < 3) return null;
    return shuffle(rng, [ans, ...picks]).map((p) => ({ label: p.n, sub: opts.sub ? opts.sub(p) : '', pid: p.id, correct: p.id === ans.id }));
  }
  const textOpts = (rng, right, wrongs, extra = {}) =>
    shuffle(rng, [{ label: right, correct: true, ...extra.right }, ...wrongs.map((w) => ({ label: w, correct: false, ...(extra.wrong ? extra.wrong(w) : {}) }))]);

  // A face question needs the pinned photo (so the face position is known) and at least n face windows.
  const hasFace = (id, n = 2) => !failedPhotos.has(id) && !pinFailed.has(id) && !!GEO(id) && Object.keys(GEO(id).parts).length >= n;
  function faceQ(rng, used, footballOnly) {
    const c = avail(used, (p) => (!footballOnly || p.s === 'football') && hasFace(p.id));
    if (!c.length) return null;
    const ans = pick(rng, c);
    const opts = nameOpts(rng, ans);
    if (!opts) return null;
    const [a, b] = shuffle(rng, Object.keys(GEO(ans.id).parts));
    const extra = footballOnly ? (ans.pos ? { k: 'Position', html: POS[ans.pos] } : clueBorn(ans)) : clueCountry(ans);
    return {
      subject: ans.id, view: 'parts', photo: ans.id, prompt: footballOnly ? 'Name the footballer' : 'Who is this?', opts,
      stages: [{ parts: [a] }, { parts: [a, b], label: 'Add the ' + PART_NAME[b].toLowerCase() }, { parts: 'all', add: [extra], label: 'Whole face + ' + extra.k.toLowerCase() }],
    };
  }
  // "Who am I?" clues, from hardest to easiest.
  function whoPools(p) {
    const hard = [{ k: 'Born', html: String(p.b) }];
    if (p.pos) hard.push({ k: 'Position', html: POS[p.pos] });
    const mid = (p.path || []).slice(1, -1).filter((c) => c !== p.first);
    if (mid.length) hard.push({ k: 'Once played for', html: esc(mid[0]) });
    const medium = [];
    if (p.first) medium.push({ k: 'Started at', html: esc(p.first) });
    if (p.num) medium.push({ k: 'Famous number', html: '#' + p.num });
    if (p.path && p.path.length > 1) medium.push({ k: 'Latest club', html: esc(p.path[p.path.length - 1]) });
    const easy = [clueCountry(p)];
    if (p.nick) easy.push({ k: 'Nickname', html: '“' + esc(p.nick) + '”' });
    return { hard, medium, easy };
  }

  const MAKERS = {
    face(rng, used) { return faceQ(rng, used, false); },
    footy(rng, used) { return faceQ(rng, used, true); },
    sport(rng, used) {
      const ok = (p) => hasFace(p.id, 1);
      const sports = Object.keys(SPORTS).filter((s) => avail(used, (p) => p.s === s && ok(p)).length);
      if (!sports.length) return null;
      const s = pick(rng, sports);
      const ans = pick(rng, avail(used, (p) => p.s === s && ok(p)));
      const wrong = shuffle(rng, Object.keys(SPORTS).filter((k) => k !== s)).slice(0, 3);
      return {
        subject: ans.id, view: 'cover', photo: ans.id, prompt: 'What sport do they play?',
        opts: textOpts(rng, SPORTS[s].name, wrong.map((k) => SPORTS[k].name)),
        stages: [{ cover: true }, { cover: false, label: 'Peel off the sticker' }, { cover: false, add: [clueCountry(ans)], label: 'Their country' }],
      };
    },
    who(rng, used) {
      const c = avail(used, (p) => { const P = whoPools(p); return P.hard.length + P.medium.length >= 3; });
      if (!c.length) return null;
      const ans = pick(rng, c);
      const P = whoPools(ans);
      const h = shuffle(rng, P.hard), m = shuffle(rng, P.medium);
      const cl = h.slice(0, 2);
      while (cl.length < 2) cl.push(m.shift());
      cl.push(m.length ? m.shift() : h[2]);
      cl.push(pick(rng, P.easy));
      const opts = nameOpts(rng, ans);
      if (!opts) return null;
      return {
        subject: ans.id, view: 'who', sport: ans.s, prompt: 'Who am I?', opts,
        stages: [{ add: cl.slice(0, 2) }, { add: [cl[2]], label: 'Another clue' }, { add: [cl[3]], label: 'The giveaway' }],
      };
    },
    country(rng, used) {
      const ans = pick(rng, avail(used, () => true));
      const cont = COUNTRIES[ans.c][1];
      const others = Object.keys(COUNTRIES).filter((c) => !sameNation(c, ans.c));
      const near = shuffle(rng, others.filter((c) => COUNTRIES[c][1] === cont));
      const far = shuffle(rng, others.filter((c) => COUNTRIES[c][1] !== cont));
      const wrong = [...near.slice(0, 2), ...far].slice(0, 3);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true }, prompt: 'Which country do they represent?',
        opts: shuffle(rng, [ans.c, ...wrong]).map((c) => ({ label: cName(c), flagC: c, correct: c === ans.c })),
        stages: [{}, { add: [{ k: 'Continent', html: esc(CONTINENTS[cont]) }], label: 'Continent' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    first(rng, used) {
      const c = avail(used, (p) => p.first);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const mine = clubsOf(ans);
      const pool = shuffle(rng, [...teamsBySport[ans.s]].filter((t) => !mine.has(t)));
      if (pool.length < 3) return null;
      const next = ans.path && ans.path.find((t) => t !== ans.first);
      const what = ans.s === 'football' ? 'club' : 'team';
      const prompt = ans.s === 'f1' ? 'Their first F1 team?' : ans.s === 'football' ? 'Their first senior club?' : 'Their first pro team?';
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true, country: true }, prompt,
        opts: textOpts(rng, ans.first, pool.slice(0, 3)),
        stages: [{}, next ? { add: [{ k: 'Next ' + what, html: esc(next) }], label: `Their next ${what}` } : { remove: 1, label: 'Strike out a wrong answer' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    path(rng, used) {
      const c = avail(used, (p) => p.path && p.path.length >= 3);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const key = ans.path.join('|');
      const opts = nameOpts(rng, ans, { filter: (p) => !p.path || p.path.join('|') !== key });
      if (!opts) return null;
      const half = Math.ceil(ans.path.length / 2);
      return {
        subject: ans.id, view: 'path', path: ans.path, prompt: 'Whose career is this?', opts,
        stages: [{ shown: half }, { shown: ans.path.length, label: 'Full career' }, { shown: ans.path.length, add: [clueCountry(ans), clueBorn(ans)], label: 'Country + birth year' }],
      };
    },
    nick(rng, used) {
      const c = avail(used, (p) => p.nick);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const opts = nameOpts(rng, ans, { sameSport: 1 });
      if (!opts) return null;
      return {
        subject: ans.id, view: 'quote', quote: ans.nick, prompt: 'Who is known as this?', opts,
        stages: [{}, { add: [clueSport(ans)], label: 'Their sport' }, { add: [clueCountry(ans)], label: 'Their country' }],
      };
    },
    older(rng, used) {
      const a = pick(rng, avail(used, () => true));
      const c = avail(used, (p) => p.id !== a.id && p.b !== a.b && Math.abs(p.b - a.b) <= 6);
      if (!c.length) return null;
      const b = pick(rng, c);
      const pair = shuffle(rng, [a, b]);
      const old = a.b < b.b ? a : b;
      return {
        subject: old.id, pids: [a.id, b.id], view: 'duo', duo: pair.map((p) => p.id), prompt: 'Who is older?', values: [200, 100],
        opts: pair.map((p) => ({ label: p.n, sub: SPORTS[p.s].name, pid: p.id, correct: p.id === old.id })),
        stages: [{}, { add: [{ k: pair[0].n, html: 'born ' + pair[0].b }], label: `${pair[0].n.split(' ').pop()}'s birth year` }],
      };
    },
    year(rng, used) {
      const ans = pick(rng, avail(used, () => true));
      const offs = shuffle(rng, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]).slice(0, 3);
      const years = [ans.b, ...offs.map((o) => ans.b + o)].sort((x, y) => x - y);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true, country: true }, prompt: 'What year were they born?', bigNum: true,
        opts: years.map((y) => ({ label: String(y), correct: y === ans.b })),
        stages: [{}, { remove: 1, label: 'Strike out a wrong answer' }, { remove: 1, label: 'Strike out another' }],
      };
    },
    odd(rng, used) {
      const variant = pick(rng, ['country', 'club', 'decade']);
      const pool = avail(used, () => true);
      let three, odd, rule, why;
      const groups = (keyOf) => { const m = {}; for (const p of pool) for (const k of keyOf(p)) (m[k] ||= []).push(p); return Object.entries(m).filter(([, v]) => v.length >= 3); };
      if (variant === 'country') {
        const g = groups((p) => [p.c]);
        if (!g.length) return null;
        const [c, members] = pick(rng, g);
        three = shuffle(rng, members).slice(0, 3);
        const sports = new Set(three.map((p) => p.s));
        const cand = pool.filter((p) => !sameNation(p.c, c) && sports.has(p.s));
        if (!cand.length) return null;
        odd = pick(rng, cand);
        rule = `represent ${cName(c)}`;
        why = `${odd.n} represents ${cName(odd.c)}.`;
      } else if (variant === 'club') {
        const g = groups((p) => (p.s === 'football' && p.path ? [...clubsOf(p)] : []));
        if (!g.length) return null;
        const [club, members] = pick(rng, g);
        three = shuffle(rng, members).slice(0, 3);
        const cand = pool.filter((p) => p.s === 'football' && p.path && !clubsOf(p).has(club));
        if (!cand.length) return null;
        odd = pick(rng, cand);
        rule = `played for ${club}`;
        why = `${odd.n} never did.`;
      } else {
        const dec = (p) => Math.floor(p.b / 10) * 10;
        const g = groups((p) => [dec(p)]);
        if (!g.length) return null;
        const [d, members] = pick(rng, g);
        three = shuffle(rng, members).slice(0, 3);
        const cand = pool.filter((p) => Math.abs(dec(p) - +d) === 10);
        if (!cand.length) return null;
        odd = pick(rng, cand);
        rule = `were born in the ${d}s`;
        why = `${odd.n} was born in ${odd.b}.`;
      }
      const showSport = variant !== 'club';
      return {
        subject: odd.id, pids: [...three, odd].map((p) => p.id), view: 'odd', prompt: "Who's the odd one out?",
        opts: shuffle(rng, [...three, odd]).map((p) => ({ label: p.n, sub: showSport ? SPORTS[p.s].name : '', pid: p.id, correct: p.id === odd.id })),
        stages: [{}, { add: [{ k: 'The link', html: 'Three of them ' + esc(rule) }], label: 'Reveal the link' }, { remove: 1, label: 'Strike out a wrong answer' }],
        why: `The other three ${rule}. ${why}`,
      };
    },
    club(rng, used) {
      const c = avail(used, (p) => p.path && ['football', 'basketball', 'f1'].includes(p.s));
      if (!c.length) return null;
      const ans = pick(rng, c);
      const club = pick(rng, ans.path);
      const pool = shuffle(rng, avail(used, (p) => p.id !== ans.id && p.s === ans.s && p.path && !clubsOf(p).has(club)));
      if (pool.length < 3) return null;
      const verb = ans.s === 'f1' ? 'drove for' : 'played for';
      return {
        subject: ans.id, pids: [ans.id, ...pool.slice(0, 3).map((p) => p.id)], view: 'club', club, verb, prompt: `Who ${verb} this ${ans.s === 'f1' ? 'team' : 'club'}?`,
        opts: shuffle(rng, [ans, ...pool.slice(0, 3)]).map((p) => ({ label: p.n, pid: p.id, correct: p.id === ans.id })),
        stages: [{}, { add: [clueBorn(ans)], label: 'Birth year of the right one' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    number(rng, used) {
      const c = avail(used, (p) => p.num);
      if (!c.length) return null;
      const ans = pick(rng, c);
      const banned = new Set([ans.num, ...(ans.alt || [])]);
      const COMMON = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 30, 32, 33, 34, 44, 77, 99].filter((n) => !banned.has(n));
      const pool = shuffle(rng, COMMON);
      const same = pool.find((n) => n % 2 === ans.num % 2);
      const wrong = [same, ...pool.filter((n) => n !== same)].slice(0, 3);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { sport: true, country: true }, bigNum: true,
        prompt: ans.s === 'f1' ? 'Their race number?' : 'Their iconic shirt number?',
        opts: textOpts(rng, String(ans.num), wrong.map(String)),
        stages: [{}, { add: [{ k: 'Hint', html: ans.num % 2 ? 'It’s an odd number' : 'It’s an even number' }], label: 'Odd or even?' }, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
    position(rng, used) {
      const c = avail(used, (p) => p.pos);
      if (!c.length) return null;
      const ans = pick(rng, c);
      return {
        subject: ans.id, view: 'portrait', photo: ans.id, plate: { country: true }, prompt: 'What position?', values: [200, 100],
        opts: ['GK', 'DF', 'MF', 'FW'].map((k) => ({ label: POS[k], correct: k === ans.pos })),
        stages: [{}, { remove: 1, label: 'Strike out a wrong answer' }],
      };
    },
  };

  const CATS = [
    { key: 'face', name: 'Face Reveal', desc: 'Eyes only, then the hair or smile, then the face. Any sport.', color: '#2858a6' },
    { key: 'footy', name: 'Footballer Photo', desc: 'Footballers only. Name them from their eyes.', color: '#1f8a4c' },
    { key: 'sport', name: 'Which Sport?', desc: 'Their face is hidden. Spot the sport from the rest.', color: '#e0702a' },
    { key: 'who', name: 'Who Am I?', desc: 'Read the clues. Fewer clues, more points.', color: '#c2410c' },
    { key: 'path', name: 'Career Path', desc: 'Follow the transfers. Whose career is it?', color: '#1c1a16' },
    { key: 'first', name: 'First Club', desc: 'Where did their pro career start?', color: '#7a4bb0' },
    { key: 'country', name: 'Flag Them', desc: 'Which country does this athlete play for?', color: '#d6402b' },
    { key: 'nick', name: 'Nickname', desc: 'Who answers to this name?', color: '#b0306a' },
    { key: 'odd', name: 'Odd One Out', desc: 'Three share a link. Find the one who doesn’t.', color: '#3949ab' },
    { key: 'club', name: 'Club Connection', desc: 'Only one of them played there. Which one?', color: '#2e7d32' },
    { key: 'older', name: 'Who’s Older?', desc: 'Two athletes. Pick the one born first.', color: '#00897b' },
    { key: 'year', name: 'Birth Year', desc: 'Name the year they were born.', color: '#6d4c41' },
    { key: 'number', name: 'Shirt Number', desc: 'The number they made famous.', color: '#ef6c00' },
    { key: 'position', name: 'Position', desc: 'Keeper, defender, midfielder or forward?', color: '#00838f' },
  ];
  const CAT = Object.fromEntries(CATS.map((c) => [c.key, c]));
  const MODE_NAME = (k) => (k === 'daily' ? 'Daily Scout' : k === 'mix' ? 'Quick Mix' : CAT[k].name);
  const ROUND = 10;
  const VALUES = [300, 200, 100];

  function makeQ(cat, rng, used) {
    for (let t = 0; t < 25; t++) {
      const q = MAKERS[cat](rng, used);
      if (q) {
        q.cat = cat;
        q.values ||= VALUES.slice(0, q.stages.length);
        const wrong = q.opts.map((o, i) => (o.correct ? -1 : i)).filter((i) => i >= 0);
        q.removeOrder = shuffle(rng, wrong);
        for (const id of q.pids || [q.subject]) used.add(id);
        return q;
      }
    }
    return cat === 'year' ? null : makeQ('year', rng, used);
  }

  async function buildRound(mode, seed, onProgress) {
    const rng = mulberry32(seed);
    const plan = mode === 'daily' || mode === 'mix' ? shuffle(rng, CATS.map((c) => c.key)).slice(0, ROUND) : Array(ROUND).fill(mode);
    const used = new Set();
    const qs = plan.map((c) => makeQ(c, rng, used));
    // Photo questions need their photo before the round starts; swap in another player if one fails.
    // Face questions also need the pinned photo, because the eye/hair windows are measured on it.
    const isFace = (q) => q.view === 'parts' || q.view === 'cover';
    const need = qs.map((q, i) => i).filter((i) => isFace(qs[i]));
    let done = 0;
    onProgress(0, need.length);
    await Promise.all(need.map(async (i) => {
      const alt = mulberry32((seed ^ Math.imul(i + 1, 2654435761)) >>> 0);
      let q = qs[i];
      for (let t = 0; t < 4 && q; t++) {
        const img = await loadImage(q.photo);
        if (img && img.pinned) { qs[i] = q; onProgress(++done, need.length); return; }
        pinFailed.add(q.photo);
        q = makeQ(q.cat, alt, used);
        if (q && !isFace(q)) { qs[i] = q; onProgress(++done, need.length); return; }
      }
      qs[i] = null;
      onProgress(++done, need.length);
    }));
    if (qs.some((q) => !q)) throw new Error('photos');
    // Warm up the photos the round will show (the answer's photo, or both in Who's Older), two at a time
    // in question order, so the next question's photo arrives first and no data goes on photos never shown.
    const warm = [...new Set(qs.flatMap((q) => q.duo || [q.subject]))];
    const warmNext = () => { if (warm.length) loadImage(warm.shift()).then(warmNext); };
    warmNext(); warmNext();
    return qs;
  }

  PS.Questions = { CATS, CAT, MODE_NAME, buildRound };
})();
