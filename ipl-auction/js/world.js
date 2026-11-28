// The living world around the auction and the season: ages and potential, hidden "underrated" players,
// form, injuries, pitch conditions, captaincy, the news feed, and the career that rolls one IPL season
// into the next (ratings move with performance, mini auction). Players don't age or retire.
// No DOM. Everything that changes is stored in the save (s.w for the career, s.league for one season).
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { PLAYERS, SEASON, TEAMS, VENUES } = IPLA.data;
  const P = PLAYERS;
  const BASE_N = P.length;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // Seeded 0..1 (same idea as the engine's): stable per career, per player.
  function h01(...keys) {
    let h = 2166136261;
    const s = keys.join('|');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return ((h >>> 0) + 0.5) / 4294967297;
  }

  // ---------- ages ----------
  // Approximate birth years (our estimates, two digits: 97 = 1997, 11 = 2011).
  const BORN = `Ruturaj Gaikwad:97|Sanju Samson:94|Shivam Dube:93|Noor Ahmad:05|Khaleel Ahmed:97|MS Dhoni:81|Anshul Kamboj:00|Dewald Brevis:03|Gurjapneet Singh:98|Nathan Ellis:94|Jamie Overton:94|Mukesh Choudhary:96|Ramakrishna Ghosh:97|Shreyas Gopal:93|Ayush Mhatre:07|Urvil Patel:98|Sarfaraz Khan:97|Matt Henry:91|Rahul Chahar:99|Akeal Hosein:93|Prashant Veer:05|Kartik Sharma:06|Zak Foulkes:02|Matthew Short:95|Aman Khan:96|Axar Patel:94|KL Rahul:92|Kuldeep Yadav:94|Mitchell Starc:90|T Natarajan:91|Tristan Stubbs:00|Mukesh Kumar:93|Nitish Rana:93|Abhishek Porel:02|Ashutosh Sharma:98|Sameer Rizvi:03|Dushmantha Chameera:92|Karun Nair:91|Madhav Tiwari:03|Ajay Mandal:96|Tripurana Vijay:01|Vipraj Nigam:04|David Miller:89|Prithvi Shaw:99|Ben Duckett:94|Auqib Nabi:96|Pathum Nissanka:98|Kyle Jamieson:94|Lungi Ngidi:96|Sahil Parekh:06|Rashid Khan:98|Shubman Gill:99|Jos Buttler:90|Mohammed Siraj:94|Kagiso Rabada:95|Prasidh Krishna:96|Sai Sudharsan:01|Rahul Tewatia:93|Shahrukh Khan:95|Washington Sundar:99|Sai Kishore:96|Glenn Phillips:96|Arshad Khan:97|Gurnoor Brar:00|Ishant Sharma:88|Jayant Yadav:90|Kumar Kushagra:04|Anuj Rawat:99|Manav Suthar:02|Nishant Sindhu:04|Ashok Sharma:02|Jason Holder:91|Tom Banton:98|Prithvi Raj:98|Luke Wood:95|Rinku Singh:97|Sunil Narine:88|Varun Chakravarthy:91|Harshit Rana:01|Ramandeep Singh:97|Angkrish Raghuvanshi:05|Vaibhav Arora:97|Ajinkya Rahane:88|Rovman Powell:93|Manish Pandey:89|Umran Malik:99|Anukul Roy:98|Cameron Green:99|Rachin Ravindra:99|Finn Allen:99|Akash Deep:96|Matheesha Pathirana:02|Tejasvi Singh:02|Kartik Tyagi:00|Prashant Solanki:00|Rahul Tripathi:91|Tim Seifert:94|Mustafizur Rahman:95|Sarthak Ranjan:96|Daksh Kamra:04|Rishabh Pant:97|Nicholas Pooran:95|Mayank Yadav:02|Mohammed Shami:90|Avesh Khan:96|Abdul Samad:01|Ayush Badoni:99|Mohsin Khan:98|Mitchell Marsh:91|Shahbaz Ahmed:94|Aiden Markram:94|Manimaran Siddharth:98|Matthew Breetzke:98|Akash Singh:02|Arjun Tendulkar:99|Arshin Kulkarni:05|Himmat Singh:96|Digvesh Rathi:99|Prince Yadav:01|Wanindu Hasaranga:97|Anrich Nortje:93|Mukul Choudhary:04|Naman Tiwari:05|Josh Inglis:95|Akshat Raghuwanshi:03|Jasprit Bumrah:93|Hardik Pandya:93|Suryakumar Yadav:90|Rohit Sharma:87|Trent Boult:89|Deepak Chahar:92|Tilak Varma:02|Will Jacks:98|Naman Dhir:00|Allah Ghazanfar:06|Sherfane Rutherford:98|Shardul Thakur:91|Mitchell Santner:92|Ryan Rickelton:96|Corbin Bosch:94|Robin Minz:02|Raj Angad Bawa:02|Ashwani Kumar:01|Raghu Sharma:93|Mayank Markande:97|Quinton de Kock:92|Danish Malewar:03|Mayank Rawat:02|Mohammad Izhar:05|Atharva Ankolekar:00|Shreyas Iyer:94|Arshdeep Singh:99|Yuzvendra Chahal:90|Marcus Stoinis:89|Marco Jansen:00|Shashank Singh:91|Nehal Wadhera:00|Prabhsimran Singh:00|Priyansh Arya:01|Mitchell Owen:01|Azmatullah Omarzai:00|Lockie Ferguson:91|Vijaykumar Vyshak:97|Yash Thakur:98|Harpreet Brar:95|Vishnu Vinod:93|Xavier Bartlett:98|Pyla Avinash:04|Harnoor Pannu:03|Musheer Khan:05|Suryansh Shedge:03|Ben Dwarshuis:94|Praveen Dubey:93|Cooper Connolly:03|Vishal Nishad:04|Yashasvi Jaiswal:01|Riyan Parag:01|Ravindra Jadeja:88|Dhruv Jurel:01|Jofra Archer:95|Shimron Hetmyer:96|Tushar Deshpande:95|Sandeep Sharma:93|Nandre Burger:95|Sam Curran:98|Kwena Maphaka:06|Vaibhav Sooryavanshi:11|Donovan Ferreira:98|Shubham Dubey:94|Yudhvir Singh:97|Lhuan-dre Pretorius:06|Ravi Bishnoi:00|Sushant Mishra:00|Yash Raj Punja:05|Vignesh Puthur:01|Adam Milne:92|Kuldeep Sen:96|Aman Rao:04|Ravi Singh:02|Brijesh Sharma:03|Virat Kohli:88|Josh Hazlewood:91|Phil Salt:96|Rajat Patidar:93|Jitesh Sharma:93|Bhuvneshwar Kumar:90|Rasikh Salam:00|Krunal Pandya:91|Yash Dayal:97|Tim David:96|Suyash Sharma:03|Jacob Bethell:03|Devdutt Padikkal:00|Nuwan Thushara:94|Romario Shepherd:94|Swapnil Singh:91|Abhinandan Singh:97|Venkatesh Iyer:94|Jacob Duffy:94|Jordan Cox:00|Satvik Deswal:04|Vicky Ostwal:02|Mangesh Yadav:02|Vihaan Malhotra:07|Kanishk Chouhan:06|Heinrich Klaasen:91|Pat Cummins:93|Travis Head:93|Abhishek Sharma:00|Ishan Kishan:98|Harshal Patel:90|Nitish Kumar Reddy:03|Eshan Malinga:01|Brydon Carse:95|Jaydev Unadkat:91|Kamindu Mendis:98|Zeeshan Ansari:99|Smaran Ravichandran:03|Aniket Verma:02|Harsh Dubey:02|Liam Livingstone:93|Shivam Mavi:98|Shivang Kumar:02|Salil Arora:02|Sakib Hussain:04|Onkar Tarmale:01|Amit Kumar:03|Praful Hinge:01|Krains Fuletra:03|Jack Edwards:00|Harry Brook:99|Ben Stokes:91|Adil Rashid:88|Mark Wood:90|Gus Atkinson:98|Joe Root:90|Liam Dawson:89|Adam Zampa:92|Glenn Maxwell:88|Steve Smith:89|Jake Fraser-McGurk:02|Spencer Johnson:95|Aaron Hardie:99|Daryl Mitchell:91|Kane Williamson:90|Devon Conway:91|Ish Sodhi:92|Michael Bracewell:91|Gerald Coetzee:00|Tabraiz Shamsi:90|Keshav Maharaj:90|Reeza Hendricks:89|Ottniel Baartman:93|Shai Hope:93|Alzarri Joseph:96|Brandon King:94|Gudakesh Motie:95|Rahmanullah Gurbaz:01|Fazalhaq Farooqi:00|Mujeeb Ur Rahman:01|Naveen-ul-Haq:99|Mohammad Nabi:85|Ibrahim Zadran:01|Maheesh Theekshana:00|Kusal Mendis:95|Charith Asalanka:97|Dilshan Madushanka:00|Taskin Ahmed:95|Litton Das:94|Towhid Hridoy:00|Rishad Hossain:02|Sikandar Raza:86|Blessing Muzarabani:96|Josh Little:99|Paul Stirling:90|Lorcan Tucker:96|Sandeep Lamichhane:00|Dipendra Singh Airee:00|Rohit Paudel:02|Kushal Bhurtel:97|Kushal Malla:04|Aasif Sheikh:01|Gulsan Jha:06|Sompal Kami:96|Karan KC:91|Lalit Rajbanshi:99|Saurabh Netravalkar:91|Aaron Jones:94|Ali Khan:90|Andries Gous:93|Monank Patel:93|Harmeet Singh:92|Bas de Leede:99|Logan van Beek:90|Max ODowd:94|Scott Edwards:96|Paul van Meekeren:93|Roelof van der Merwe:84|Brandon McMullen:99|George Munsey:93|Mark Watt:96|Richie Berrington:87|Muhammad Waseem:94|Gerhard Erasmus:95|Ruben Trumpelmann:98|JJ Smit:95|Aqib Ilyas:92|Nicholas Kirton:98|Mayank Agarwal:91|Deepak Hooda:95|Kumar Kartikeya:97|Akash Madhwal:93|Simarjeet Singh:98|Abhinav Manohar:94|Mahipal Lomror:99|Atharva Taide:00|Shams Mulani:97|Tanush Kotian:98|Anmolpreet Singh:98|Yash Dhull:02|Rajvardhan Hangargekar:02|Vidwath Kaverappa:99|Lalit Yadav:97|Darshan Nalkande:98|Swastik Chikara:05|Andre Siddarth:06|Vansh Bedi:02|Shaik Rasheed:04|Priyam Garg:00|Suyash Prabhudessai:97|Mayank Dagar:96|Vivrant Sharma:99|Sanvir Singh:96|Raj Limbani:05|Ishan Porel:98|Jamie Smith:00|Saqib Mahmood:97|Rehan Ahmed:04|Josh Tongue:97|Tanveer Sangha:01|Tony de Zorzi:97|Nqaba Peter:02|Will ORourke:01|Ben Sears:97|Mitchell Hay:00|Josh Clarkson:97|Shamar Joseph:99|Matthew Forde:02|Jayden Seales:01|Keacy Carty:96|Dunith Wellalage:03|Sediqullah Atal:01|Darwish Rasooli:99|Qais Ahmad:00|Nahid Rana:02|Tanzim Hasan Sakib:02|Parvez Hossain Emon:02|Jaker Ali:97|Brian Bennett:03|Sundeep Jora:01|Abinash Bohara:99|Kamal Singh Airee:98|Alishan Sharafu:02`;
  const BY = {};
  for (const x of BORN.split('|')) { const [n, y] = x.split(':'); BY[n] = +y < 30 ? 2000 + +y : 1900 + +y; }

  // Captaincy (0-100). Known leaders from their record; everyone else from experience and rating.
  const CAPT = { 'MS Dhoni': 96, 'Rohit Sharma': 92, 'Shreyas Iyer': 90, 'Pat Cummins': 89, 'Kane Williamson': 88, 'Ben Stokes': 88, 'Virat Kohli': 86, 'Suryakumar Yadav': 85, 'Steve Smith': 85, 'Hardik Pandya': 84, 'Aiden Markram': 84, 'Ajinkya Rahane': 83, 'Mitchell Marsh': 83, 'Sanju Samson': 82, 'KL Rahul': 82, 'Rajat Patidar': 82, 'Jos Buttler': 82, 'Mitchell Santner': 82, 'Rohit Paudel': 82, 'Axar Patel': 81, 'Shubman Gill': 80, 'Ruturaj Gaikwad': 80, 'Rishabh Pant': 80, 'Rashid Khan': 80, 'Nicholas Pooran': 80, 'Sikandar Raza': 80, 'Gerhard Erasmus': 80, 'Scott Edwards': 79, 'Travis Head': 78, 'Richie Berrington': 78, 'David Miller': 77, 'Paul Stirling': 77, 'Ravindra Jadeja': 76, 'Krunal Pandya': 76, 'Quinton de Kock': 76, 'Monank Patel': 76, 'Riyan Parag': 74, 'Glenn Maxwell': 74 };

  // ---------- applying the world to the shared player list ----------
  // Players don't age: the career moves the year on, but a player's stage of development is fixed at
  // the start (it only sets how much room a young player has to grow). No retirements either.
  P.forEach((p) => {
    p.r0 = p.r; p.bat0 = p.bat; p.bowl0 = p.bowl; p.team0 = p.team; p.capped0 = p.capped;
    p.by = BY[p.name] || (p.capped ? 1994 + Math.floor(h01('by', p.name) * 5) : 2001 + Math.floor(h01('by', p.name) * 4));
  });
  // How much the headline rating follows the bat (1) or the ball (0).
  const batShare = (p) => (p.role === 'BAT' || p.role === 'WK' ? 1 : p.role === 'AR' ? clamp(0.5 + (p.bat - p.bowl) / 40, 0.25, 0.75) : 0);

  // The top end of batting and bowling skill in the real pool: the level the career keeps the league at.
  const BASE_TOP = {};
  for (const [g, n, ok, sk] of [['bat', 60, (p) => p.role !== 'PACE' && p.role !== 'SPIN', 'bat0'], ['bowl', 70, (p) => p.role !== 'BAT' && p.role !== 'WK', 'bowl0']]) {
    const top = P.filter(ok).map((p) => p[sk]).sort((a, b) => b - a).slice(0, n);
    BASE_TOP[g] = top.reduce((a, b) => a + b, 0) / top.length;
  }

  let cur = null; // the save the player list currently reflects
  const year = (s) => (s && s.w ? s.w.year : SEASON);

  // Hidden traits are seeded per career: a young player's ceiling, and the "underrated" bonus
  // (some mid-rated players play better than their number says).
  function traits(p, seed) {
    const age0 = SEASON - p.by;
    if (p.pot0 == null) {
      const u = h01(seed, 'pot', p.name);
      const gain = age0 <= 19 ? 8 + 14 * u : age0 <= 21 ? 5 + 11 * u : age0 <= 23 ? 3 + 8 * u : age0 <= 25 ? 4 * u : 0;
      p.pot = Math.min(97, Math.round(p.r0 + gain));
    } else p.pot = p.pot0;
    const ux = p.r0 >= 60 && p.r0 <= 79 && h01(seed, 'ux', p.name) < 0.12 ? 3 + Math.floor(h01(seed, 'ux2', p.name) * 4) : 0;
    p.ux = ux;
    p.scout = h01(seed, 'sc', p.name) < 0.7;
  }

  function apply(s) {
    cur = s;
    P.length = BASE_N;
    for (const p of P) { p.r = p.r0; p.bat = p.bat0; p.bowl = p.bowl0; p.team = p.team0; p.capped = p.capped0; p.gone = false; delete p.pot0; }
    const W = s && s.w;
    const seed = W ? W.seed : s ? s.seed : 0;
    if (W) {
      // Generated youngsters from older saves.
      for (const g of W.gen) {
        const sk = IPLA.data.skills(g.role, g.r, g.name);
        P.push({ id: P.length, name: g.name, team: '-', country: g.country, role: g.role, r: g.r, r0: g.r, ...sk, bat0: sk.bat, bowl0: sk.bowl, capped: false, capped0: false, os: g.country !== 'IND', bs: g.bs || '', ws: g.ws || '', by: g.by, pot0: g.pot, team0: '-' });
      }
    }
    for (const p of P) traits(p, seed);
    if (W) {
      for (const [pid, o] of Object.entries(W.pl)) {
        const p = P[pid]; if (!p) continue;
        if (o.r != null) p.r = o.r;
        // Batting and bowling skill. Older saves only stored the rating: move the main skill with it.
        if (o.b != null) p.bat = o.b; else if (o.r != null && batShare(p) > 0) p.bat = clamp(p.bat0 + (o.r - p.r0), 20, 99);
        if (o.k != null) p.bowl = o.k; else if (o.r != null && batShare(p) < 1) p.bowl = clamp(p.bowl0 + (o.r - p.r0), 20, 99);
        if (o.t != null) p.team = o.t;
        if (o.c != null) p.capped = !!o.c;
        if (o.g) p.gone = true;
        if (o.u != null) p.ux = o.u;
      }
    }
  }

  // A new game (mega auction) starts a new career.
  function init(s) {
    s.w = { seed: s.seed, year: SEASON, pl: {}, gen: [], hist: [], tot: {}, form: {}, cap: {}, titles: 0 };
    apply(s);
  }
  // Older saves: add what is missing.
  function ensure(s) {
    if (!s) { apply(null); return; }
    if (!s.w) s.w = { seed: s.seed, year: SEASON, pl: {}, gen: [], hist: [], tot: {}, form: {}, cap: {}, titles: 0 };
    apply(s);
    if (s.league) ensureLeague(s.league);
  }
  function ensureLeague(L) {
    if (!L.inj) L.inj = {};
    if (!L.news) L.news = [];
    if (!L.hold) L.hold = {};
  }

  // ---------- labels the screens show ----------
  // A prospect: a player who still has real room to grow.
  const young = (p) => p.pot - p.r >= 3;
  // Potential shown as 0-3 stars.
  function potStars(p) {
    const g = p.pot - p.r;
    return g >= 12 ? 3 : g >= 7 ? 2 : g >= 3 ? 1 : 0;
  }
  const underrated = (p) => p.ux > 0 && p.scout;

  // ---------- form ----------
  // -1 (cold) .. +1 (red hot). Worth up to ±4 rating points in a match.
  function form(s, pid) {
    const f = s && s.w ? s.w.form[pid] : null;
    if (f != null) return f;
    return Math.round((h01(s ? s.w.seed : 0, 'f0', s ? s.w.year : 0, pid) - 0.5) * 50) / 100;
  }
  function formKey(f) { return f >= 0.5 ? 'hot' : f >= 0.18 ? 'good' : f > -0.18 ? 'ok' : f > -0.5 ? 'poor' : 'cold'; }
  const FORM_ICON = { hot: '🔥', good: '▲', ok: '●', poor: '▼', cold: '❄' };

  // ---------- injuries ----------
  const injured = (s, pid) => !!(s && s.league && s.league.inj && s.league.inj[pid]);
  const injury = (s, pid) => (s && s.league && s.league.inj ? s.league.inj[pid] || null : null);
  const INJ_KINDS = ['ham', 'side', 'finger', 'ankle', 'back', 'shoulder', 'ill', 'knee'];

  // ---------- pitch ----------
  // runs: scoring factor. pace / spin: extra skill for that kind of bowler. wear: extra spin in the
  // second innings. P / A: how power hitters and anchors suit the surface.
  const PITCHES = {
    good: { runs: 1.0, pace: 1, spin: 1, wear: 0, P: 0, A: 0 },
    flat: { runs: 1.08, pace: -1, spin: -1, wear: 0, P: 2, A: 0 },
    green: { runs: 0.95, pace: 5, spin: -2, wear: 0, P: -1, A: 1 },
    dry: { runs: 0.94, pace: -1, spin: 4, wear: 2, P: -1, A: 2 },
    slow: { runs: 0.93, pace: 2, spin: 2, wear: 1, P: -2, A: 2 },
  };
  const PITCH_BIAS = { CSK: { dry: 3, slow: 2 }, LSG: { slow: 3, dry: 1 }, RCB: { flat: 4 }, MI: { flat: 2, green: 1 }, SRH: { flat: 2.5 }, DC: { flat: 2 }, PBKS: { green: 2 }, GT: { good: 1, green: 1 }, KKR: { good: 1, dry: 1 }, RR: { dry: 1, slow: 1 } };
  function pitchFor(fx) {
    if (fx.pitch) return fx.pitch;
    const w = { good: 4, flat: 3, green: 1.5, dry: 1.5, slow: 1.5 };
    for (const [k, v] of Object.entries(PITCH_BIAS[fx.venue] || {})) w[k] += v;
    let x = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
    let k = 'good';
    for (const [key, v] of Object.entries(w)) { x -= v; if (x <= 0) { k = key; break; } }
    fx.pitch = { k, dew: Math.random() < 0.3 };
    return fx.pitch;
  }
  // The conditions a match is played in: home ground and today's pitch together.
  function conditions(fx) {
    const V = VENUES[fx.venue] || { runs: 1, spin: 0 };
    const pi = pitchFor(fx); const T = PITCHES[pi.k];
    const c = { name: V.name, k: pi.k, dew: pi.dew, runs: V.runs * T.runs, spin: V.spin + T.spin, pace: T.pace, P: T.P, A: T.A };
    // Second innings: the surface wears (more spin); dew makes the ball wet (harder to grip, easier to hit).
    const c2 = { ...c, spin: c.spin + T.wear - (pi.dew ? 2 : 0), pace: c.pace - (pi.dew ? 0.5 : 0), runs: c.runs * (pi.dew ? 1.015 : 1) };
    return { c, c2 };
  }
  const par = (fx) => Math.round(182 * conditions(fx).c.runs / 5) * 5;
  // How well a player suits today's pitch: -2..+3.
  function pitchFit(p, fx) {
    const { c } = conditions(fx);
    let f = 0;
    // Measured against an ordinary surface (pace +1, spin about +2), so only a real edge shows.
    if (p.role === 'PACE') f += c.pace - 1;
    else if (p.role === 'SPIN') f += c.spin - 2;
    else if (p.role === 'AR') f += Math.max(c.pace - 1, c.spin - 2) * 0.3;
    if (p.role !== 'PACE' && p.role !== 'SPIN') f += p.bs === 'P' ? c.P : p.bs === 'A' ? c.A : 0;
    return Math.round(clamp(f, -3, 5) * 10) / 10;
  }

  // ---------- captaincy ----------
  function capSkill(p) {
    if (CAPT[p.name]) return CAPT[p.name];
    const exp = p.capped ? 10 : 3; // international experience
    return Math.round(clamp(42 + exp * 1.6 + (p.r - 60) * 0.45 + (p.role === 'WK' || p.role === 'AR' ? 3 : 0), 35, 84));
  }
  // The franchise's captain: your pick, or the best leader in the squad.
  function captainOf(s, t) {
    const sq = s.teams[t].squad.map((e) => e.pid);
    const c = s.w.cap[t];
    if (c != null && sq.includes(c) && !P[c].gone) return c;
    const best = [...sq].sort((a, b) => capSkill(P[b]) - capSkill(P[a]) || P[b].r - P[a].r)[0];
    s.w.cap[t] = best;
    return best;
  }
  // Who leads on the day: the captain, or the best leader in the XI if he is not playing.
  function leaderIn(s, t, xi) {
    const c = captainOf(s, t);
    if (xi.includes(c)) return c;
    return [...xi].sort((a, b) => capSkill(P[b]) - capSkill(P[a]))[0];
  }

  // ---------- what a player brings to a match ----------
  // Rating used to pick a computer team's XI: rating + hidden bonus + form + pitch fit.
  function matchValue(s, fx) { return (p) => p.r + p.ux * 0.5 + form(s, p.id) * 4 + (fx ? pitchFit(p, fx) * 0.8 : 0); }

  // Per-player skill changes for one match: [batting, bowling].
  function matchAdj(s, fx, teams, xis) {
    const adj = {}; const leaders = {};
    for (const t of teams) {
      const lead = leaderIn(s, t, xis[t]);
      leaders[t] = lead;
      const cs = capSkill(P[lead]);
      const team = clamp((cs - 75) / 8, -2, 2.5); // field placings, bowling changes
      for (const e of s.teams[t].squad) {
        const p = P[e.pid];
        const base = p.ux + form(s, p.id) * 4;
        let me = 0;
        if (e.pid === lead) me = cs >= 85 ? 1 : cs < 62 ? -1.5 : 0; // leads from the front, or feels the pressure
        adj[e.pid] = [base + team * 0.5 + me, base + team + me];
      }
    }
    return { adj, leaders };
  }

  // ---------- after every match: form, injuries, news ----------
  function owners(s) { const o = {}; for (const T of Object.values(s.teams)) for (const e of T.squad) o[e.pid] = T.id; return o; }
  function addNews(L, item) { L.news.unshift(item); if (L.news.length > 160) L.news.length = 160; }

  function afterMatch(s, fx, m, sum) {
    const L = s.league; ensureLeague(L);
    const W = s.w;
    const own = owners(s);
    const teams = [m.a, m.b];
    const nid = fx.id;
    // 1. Injured players of both teams miss this game: one game closer to fitness.
    for (const [pid, x] of Object.entries(L.inj)) {
      if (!teams.includes(own[pid])) continue;
      x.n--;
      if (x.n <= 0) { delete L.inj[pid]; addNews(L, { id: nid, k: 'fit', p: +pid, t: own[pid] }); }
    }
    // 2. Form from today's numbers. Bench players drift back towards normal.
    const played = new Set([...m.xi[m.a], ...m.xi[m.b], ...Object.values(m.sub).map((x) => x.out)]);
    const perf = {};
    for (const I of sum.inns) {
      for (const [pid, r, b] of I.bat) {
        let v = (r - 22) / 28;
        if (b >= 10) v += ((r / b) * 100 - 140) / 160;
        perf[pid] = (perf[pid] || 0) + clamp(v, -0.9, 1.6);
      }
      for (const [pid, balls, , runs, w] of I.bowl) {
        let v = w * 0.42 - 0.42;
        if (balls >= 12) v += (8.6 - (runs / balls) * 6) / 5;
        perf[pid] = (perf[pid] || 0) + clamp(v, -1, 1.8);
      }
    }
    const hotBefore = {};
    for (const t of teams) {
      for (const e of s.teams[t].squad) {
        const pid = e.pid; const f = form(s, pid);
        hotBefore[pid] = f >= 0.7;
        if (played.has(pid)) W.form[pid] = Math.round(clamp(f * 0.72 + clamp(perf[pid] || -0.1, -1, 1.6) * 0.34, -1, 1) * 100) / 100;
        else W.form[pid] = Math.round(f * 0.9 * 100) / 100;
      }
    }
    // At most one "on fire" story a match: the best performer who just turned red hot.
    const hot = [...played].filter((pid) => (W.form[pid] || 0) >= 0.7 && !hotBefore[pid] && (perf[pid] || 0) > 1.3).sort((x, y) => perf[y] - perf[x])[0];
    if (hot != null) addNews(L, { id: nid, k: 'hot', p: hot, t: own[hot] });
    // 3. Big moments.
    const res = sum.res;
    const loser = res.w === sum.a ? sum.b : sum.a;
    let big = 0;
    sum.inns.forEach((I, ii) => {
      const opp = ii === 0 ? sum.b : sum.a;
      for (const [pid, r, b] of I.bat) {
        if (r >= 100) { addNews(L, { id: nid, k: 'ton', p: pid, t: I.t, o: opp, r, b }); big++; }
        else if (r >= 50 && !P[pid].capped) { addNews(L, { id: nid, k: 'young', p: pid, t: I.t, o: opp, r, b }); big++; }
      }
      for (const [pid, , , runs, w] of I.bowl) {
        if (w >= 4) { addNews(L, { id: nid, k: 'haul', p: pid, t: opp, o: I.t, w, r: runs }); big++; }
        else if (w >= 3 && !P[pid].capped) { addNews(L, { id: nid, k: 'youngB', p: pid, t: opp, o: I.t, w, r: runs }); big++; }
      }
      if (I.runs >= 230) { addNews(L, { id: nid, k: 'big', t: I.t, o: opp, r: I.runs }); big++; }
    });
    if (res.superOver || (res.runs != null && res.runs <= 3) || (res.balls != null && res.balls <= 1)) addNews(L, { id: nid, k: 'thriller', t: res.w, o: loser, so: res.superOver ? 1 : 0, n: res.runs != null ? res.runs : res.wkts, by: res.runs != null ? 'r' : 'w' });
    else if (res.runs >= 60 || (res.wkts >= 9 && res.balls >= 24)) addNews(L, { id: nid, k: 'thrash', t: res.w, o: loser, n: res.runs != null ? res.runs : res.wkts, by: res.runs != null ? 'r' : 'w' });
    // The player of the match was an underrated pick: the scouts were right (or missed him).
    const potm = res.potm;
    if (potm != null && P[potm].ux > 0 && !W.found) W.found = {};
    if (potm != null && P[potm].ux > 0 && !W.found[potm]) { W.found[potm] = 1; addNews(L, { id: nid, k: 'gem', p: potm, t: own[potm] }); }
    // Your own result is always news.
    if (teams.includes(s.user)) addNews(L, { id: nid, k: res.w === s.user ? 'myW' : 'myL', t: s.user, o: s.user === sum.a ? sum.b : sum.a, p: potm });
    // 4. New injuries: picked up in this match.
    for (const pid of played) {
      if (L.inj[pid] || P[pid].gone) continue;
      const p = P[pid];
      const chance = p.role === 'PACE' ? 0.017 : 0.0095;
      if (Math.random() >= chance) continue;
      const x = Math.random();
      const n = x < 0.35 ? 1 : x < 0.6 ? 2 : x < 0.78 ? 3 : x < 0.93 ? 4 + Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 4);
      const kind = INJ_KINDS[Math.floor(Math.random() * INJ_KINDS.length)];
      L.inj[pid] = { n, k: kind, at: nid };
      addNews(L, { id: nid, k: 'inj', p: pid, t: own[pid], n, kind });
    }
    // 5. Caps changing hands, streaks, playoffs.
    const st = IPLA.league.stats(s);
    const o = st.orange[0]; const pu = st.purple[0];
    const played0 = Object.keys(L.results).length - 6; // caps only count as news once the season has settled
    if (o && L.hold.o != null && L.hold.o !== o.pid && played0 >= 8) addNews(L, { id: nid, k: 'orange', p: o.pid, t: own[o.pid], r: o.r });
    if (pu && L.hold.p != null && L.hold.p !== pu.pid && played0 >= 8) addNews(L, { id: nid, k: 'purple', p: pu.pid, t: own[pu.pid], w: pu.w });
    if (o) L.hold.o = o.pid; if (pu) L.hold.p = pu.pid;
    if (fx.stage === 'league') {
      const tbl = IPLA.league.table(s);
      for (const t of teams) {
        const f = tbl.find((r) => r.t === t).form;
        const tail = f.slice(-4);
        if (tail.length === 4 && tail.every((x) => x === tail[0]) && (f.length < 5 || f[f.length - 5] !== tail[0])) addNews(L, { id: nid, k: tail[0] === 'W' ? 'streakW' : 'streakL', t });
      }
      const leagueLeft = L.fixtures.filter((f) => f.stage === 'league' && !L.results[f.id] && f.id !== fx.id).length;
      if (!leagueLeft) tbl.slice(0, 4).forEach((r, i) => addNews(L, { id: nid, k: 'qual', t: r.t, n: i + 1 }));
    }
    if (fx.stage === 'final') addNews(L, { id: nid, k: 'champ', t: res.w, o: loser });
    void big;
  }

  // Players a team can pick today.
  const fit = (s, pids) => pids.filter((id) => !injured(s, id) && !P[id].gone);

  // ---------- season awards ----------
  // Impact points: runs, wickets and dot balls (our own MVP formula).
  function impact(st) {
    const pts = {};
    for (const x of Object.values(st.bat)) pts[x.pid] = (pts[x.pid] || 0) + x.r + x.f6 * 2 + x.f4;
    for (const x of Object.values(st.bowl)) pts[x.pid] = (pts[x.pid] || 0) + x.w * 25 + x.dots * 1.2;
    return pts;
  }
  function awards(s) {
    const st = IPLA.league.stats(s);
    const pts = impact(st);
    const rows = Object.entries(pts).map(([pid, v]) => ({ pid: +pid, v: Math.round(v) })).sort((a, b) => b.v - a.v);
    const own = owners(s);
    const priceOf = {};
    for (const T of Object.values(s.teams)) for (const e of T.squad) priceOf[e.pid] = e.price;
    return {
      orange: st.orange[0] || null, purple: st.purple[0] || null,
      mvp: rows[0] || null,
      // Like the real Emerging Player award: the best uncapped player of the season.
      emerging: rows.find((r) => !P[r.pid].capped) || null,
      young: rows.filter((r) => !P[r.pid].capped).slice(0, 8).map((r) => ({ ...r, t: own[r.pid] })),
      bargains: rows.filter((r) => priceOf[r.pid] != null && priceOf[r.pid] <= 200).slice(0, 8).map((r) => ({ ...r, t: own[r.pid], price: priceOf[r.pid] })),
      pts,
    };
  }

  // Every match a player played this season, newest first: [fixture, runs, balls, out?, wkts, runsConceded, balls bowled].
  function playerLog(s, pid) {
    const L = s.league; const out = [];
    if (!L) return out;
    for (const fx of L.fixtures) {
      const r = L.results[fx.id]; if (!r) continue;
      let row = null;
      r.inns.forEach((I) => {
        const b = I.bat.find((x) => x[0] === pid);
        const w = I.bowl.find((x) => x[0] === pid);
        const inXI = b || w || I.dnb.includes(pid);
        if (!inXI) return;
        if (!row) row = { fx, opp: null, bat: null, bowl: null };
        if (b) row.bat = { r: b[1], b: b[2], no: !b[5] };
        if (w) row.bowl = { w: w[4], r: w[3], balls: w[1] };
      });
      if (row) { const tm = r.inns.find((I) => I.bat.some((x) => x[0] === pid) || I.dnb.includes(pid)); row.opp = tm ? (tm.t === r.a ? r.b : r.a) : null; row.won = tm ? r.res.w === tm.t : false; out.push(row); }
    }
    return out.reverse();
  }

  // ---------- career: one season into the next ----------
  const PURSE_STEP = 500; // +₹5 Cr each year
  const purseFor = (y) => IPLA.rules.PURSE + PURSE_STEP * (y - SEASON);

  function setPl(W, p, k, v) { (W.pl[p.id] ||= {})[k] = v; }

  function endSeason(s) {
    const W = s.w; const L = s.league;
    const y = W.year;
    const st = IPLA.league.stats(s);
    const aw = awards(s);
    const tbl = IPLA.league.table(s);
    const own = owners(s);
    // 1. History and career totals.
    W.hist.push({
      y, champ: L.champion, team: s.user, pos: tbl.findIndex((r) => r.t === s.user) + 1, verdict: IPLA.ui ? IPLA.ui.verdict() : '',
      orange: aw.orange ? [aw.orange.pid, aw.orange.r] : null, purple: aw.purple ? [aw.purple.pid, aw.purple.w] : null,
      mvp: aw.mvp ? [aw.mvp.pid, aw.mvp.v] : null, emerging: aw.emerging ? [aw.emerging.pid, aw.emerging.v] : null,
    });
    if (L.champion === s.user) W.titles = (W.titles || 0) + 1;
    for (const x of Object.values(st.bat)) {
      const c = (W.tot[x.pid] ||= { s: 0, m: 0, inn: 0, no: 0, r: 0, b: 0, f4: 0, f6: 0, hs: 0, f50: 0, f100: 0, w: 0, balls: 0, rc: 0 });
      c.inn += x.inn; c.no += x.no; c.r += x.r; c.b += x.b; c.f4 += x.f4; c.f6 += x.f6; c.hs = Math.max(c.hs, x.hs); c.f50 += x.f50; c.f100 += x.f100;
    }
    for (const x of Object.values(st.bowl)) {
      const c = (W.tot[x.pid] ||= { s: 0, m: 0, inn: 0, no: 0, r: 0, b: 0, f4: 0, f6: 0, hs: 0, f50: 0, f100: 0, w: 0, balls: 0, rc: 0 });
      c.w += x.w; c.balls += x.balls; c.rc += x.r;
    }
    const games = {};
    for (const fx of L.fixtures) {
      const r = L.results[fx.id]; if (!r) continue;
      for (const I of r.inns) for (const pid of [...I.bat.map((b) => b[0]), ...I.dnb]) games[pid] = (games[pid] || 0) + 1;
    }
    for (const [pid, n] of Object.entries(games)) { const c = (W.tot[pid] ||= { s: 0, m: 0, inn: 0, no: 0, r: 0, b: 0, f4: 0, f6: 0, hs: 0, f50: 0, f100: 0, w: 0, balls: 0, rc: 0 }); c.m += n; c.s += 1; }

    // 2. Ratings move with what each player did this season (nobody ages, nobody retires).
    // A batter who scored more, and faster, than batters of his skill usually do goes up; one who
    // flopped goes down. Same for bowlers with wickets and economy. A full season counts more than
    // three games. Prospects grow toward their ceiling, faster when they play. Steps stay small.
    const rnd = (a, b) => a + Math.random() * (b - a);
    const changes = []; const capsNew = [];
    // How far a player's season was above or below what players of his skill did (in standard
    // deviations): a straight line through every regular's season against his skill.
    const vsSkill = (rows, perf, skill) => {
      const out = {};
      if (rows.length < 8) return out;
      const xs = rows.map(skill); const ys = rows.map(perf); const n = rows.length;
      const mx = xs.reduce((a, b) => a + b, 0) / n; const my = ys.reduce((a, b) => a + b, 0) / n;
      let sxy = 0; let sxx = 0;
      for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
      const b = sxx ? sxy / sxx : 0;
      const res = ys.map((y, i) => y - (my + b * (xs[i] - mx)));
      const sd = Math.sqrt(res.reduce((a, r) => a + r * r, 0) / n) || 1;
      rows.forEach((x, i) => { out[x.pid] = res[i] / sd; });
      return out;
    };
    const bats = st.orange.filter((x) => x.inn >= 4);
    const batGap = vsSkill(bats, (x) => (x.r / x.inn) * Math.pow(Math.max(60, x.sr) / 140, 0.8), (x) => P[x.pid].bat);
    const bowls = st.purple.filter((x) => x.balls >= 72);
    const bowlGap = vsSkill(bowls, (x) => (x.w * 20 + (9 - x.econ) * (x.balls / 6)) / (x.balls / 6), (x) => P[x.pid].bowl);
    const batN = Object.fromEntries(bats.map((x) => [x.pid, x.inn]));
    const bowlOv = Object.fromEntries(bowls.map((x) => [x.pid, x.balls / 6]));
    const nb = {}; const nw = {};
    for (const p of P) {
      if (p.gone) continue;
      const g = games[p.id] || 0;
      const sh = batShare(p);
      let db = 0; let dw = 0;
      if (batGap[p.id] != null) db += clamp(batGap[p.id] * 1.6, -3.5, 3.5) * Math.min(1, batN[p.id] / 10);
      if (bowlGap[p.id] != null) dw += clamp(bowlGap[p.id] * 1.6, -3.5, 3.5) * Math.min(1, bowlOv[p.id] / 32);
      // Room to grow: prospects get better every year, quicker with games under their belt.
      if (p.pot > p.r) { const gr = (p.pot - p.r) * rnd(0.15, 0.3) * (g >= 4 ? 1.3 : 0.7); db += gr * (sh > 0 ? 1 : 0); dw += gr * (sh < 1 ? 1 : 0); }
      // An underrated player who got games shows it: the rating catches up with how he plays.
      if (p.ux > 0 && g >= 3) { const gain = Math.ceil(p.ux * 0.6); db += sh > 0 ? gain : 0; dw += sh < 1 ? gain : 0; setPl(W, p, 'u', p.ux - gain); }
      // Out of the side all season: a little rust. Everyone: a little noise.
      if (g < 3 && !(p.pot > p.r)) { db -= sh > 0 ? rnd(0, 0.8) : 0; dw -= sh < 1 ? rnd(0, 0.8) : 0; }
      db += rnd(-0.6, 0.6); dw += rnd(-0.6, 0.6);
      // Staying at the very top is hard.
      if (p.bat > 90) db -= (p.bat - 90) * 0.12;
      if (p.bowl > 90) dw -= (p.bowl - 90) * 0.12;
      nb[p.id] = p.bat + db; nw[p.id] = p.bowl + dw;
      // Former team for the next auction: where he played this season.
      setPl(W, p, 't', own[p.id] || (p.team && p.team !== '-' ? p.team : '-'));
    }
    // Keep the league's standard steady: if the best batting (or bowling) got stronger or weaker
    // as a whole, shift it back most of the way, so scores stay like a real IPL.
    for (const [key, n, sk, base] of [['bat', 60, nb, BASE_TOP.bat], ['bowl', 70, nw, BASE_TOP.bowl]]) {
      const ids = Object.keys(sk).filter((id) => (key === 'bat' ? batShare(P[id]) > 0 : batShare(P[id]) < 1));
      const top = ids.map((id) => sk[id]).sort((a, b) => b - a).slice(0, n);
      const shift = (base - top.reduce((a, b) => a + b, 0) / Math.max(1, top.length)) * 0.85;
      for (const id of ids) sk[id] += shift;
    }
    for (const id of Object.keys(nb)) {
      const p = P[id]; const sh = batShare(p);
      const b = clamp(Math.round(nb[id]), 20, 98); const k = clamp(Math.round(nw[id]), 20, 98);
      const nr = clamp(Math.round(p.r + clamp(sh * (nb[id] - p.bat) + (1 - sh) * (nw[id] - p.bowl), -5, 5)), 40, 97);
      if (b !== p.bat) setPl(W, p, 'b', b);
      if (k !== p.bowl) setPl(W, p, 'k', k);
      if (nr !== p.r) { changes.push({ pid: p.id, from: p.r, to: nr }); setPl(W, p, 'r', nr); }
      if (!p.capped && !p.os && nr >= 80) { setPl(W, p, 'c', 1); capsNew.push(p.id); }
    }
    // 3. Form cools over the break; the new year begins.
    for (const k of Object.keys(W.form)) W.form[k] = Math.round(W.form[k] * 0.4 * 100) / 100;
    const mine = new Set(s.teams[s.user].squad.map((e) => e.pid));
    W.year = y + 1;
    W.review = {
      y, champ: L.champion, aw: { orange: aw.orange && [aw.orange.pid, aw.orange.r], purple: aw.purple && [aw.purple.pid, aw.purple.w], mvp: aw.mvp && [aw.mvp.pid, aw.mvp.v], emerging: aw.emerging && [aw.emerging.pid, aw.emerging.v] },
      mine: changes.filter((c) => mine.has(c.pid)).sort((a, b) => (b.to - b.from) - (a.to - a.from)),
      risers: changes.filter((c) => !mine.has(c.pid)).sort((a, b) => (b.to - b.from) - (a.to - a.from)).slice(0, 6),
      fallers: changes.filter((c) => !mine.has(c.pid) && P[c.pid].r0 >= 75).sort((a, b) => (a.to - a.from) - (b.to - b.from)).slice(0, 6),
      retired: [], capsNew, born: [],
    };
    apply(s);
    return W.review;
  }

  // Which of its players a computer team keeps for next year (at their current price).
  function aiKeep(s, t) {
    const y = s.w.year;
    const purse = purseFor(y);
    const worth = (r) => (r < 60 ? 30 : r < 70 ? 30 + (r - 60) * 10 : r < 80 ? 130 + (r - 70) * 30 : 430 + (r - 80) * 75);
    const sq = s.teams[t].squad.filter((e) => !P[e.pid].gone).map((e) => {
      const p = P[e.pid];
      let val = worth(p.r + p.ux * 0.5);
      if (p.pot > p.r) val *= 1 + (p.pot - p.r) * 0.03;
      return { ...e, val, score: val / Math.max(30, e.price) };
    });
    // Stars stay; everyone else has to be worth his price.
    const star = (e) => P[e.pid].r >= 83;
    let keep = sq.filter((e) => star(e) || (e.score >= 0.5 && P[e.pid].r >= 58)).sort((a, b) => b.val - a.val).slice(0, 20);
    // A few fringe players go anyway: teams like fresh faces.
    keep = keep.filter((e, i) => i < 10 || Math.random() > 0.15);
    // Keep at least ₹15 Cr to spend: let the worst value for money go first.
    keep.sort((a, b) => (star(b) - star(a)) || b.score - a.score);
    while (keep.length && purse - keep.reduce((x, e) => x + e.price, 0) < 1500) keep.pop();
    // Overseas cap.
    let os = 0;
    keep = keep.filter((e) => { if (!P[e.pid].os) return true; os++; return os <= 7; });
    return keep.map((e) => ({ pid: e.pid, price: e.price }));
  }

  IPLA.world = {
    BASE_N, apply, init, ensure, ensureLeague, year, young, potStars, underrated, form, formKey, FORM_ICON,
    injured, injury, fit, pitchFor, conditions, par, pitchFit, PITCHES, capSkill, captainOf, leaderIn, matchValue, matchAdj,
    afterMatch, awards, impact, playerLog, endSeason, aiKeep, purseFor, owners, current: () => cur,
  };
})();
