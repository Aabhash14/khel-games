/* Bato Harayo: random map generation for one night. */
(() => {
  'use strict';
  const BH = (window.BH = window.BH || {});
  const { randInt, clamp, pick, shuffle } = BH.Util;
  const { PATH_IDS, revPath, SCENE_PATH, PEOPLE, PEOPLE_CAPS, HONEST } = BH.Story;

  // ---------- World generation ----------
  function genWorld() {
    const nodes = [], counts = {};
    const add = (scene) => { const n = { id: nodes.length, scene, exits: [], person: null, visits: 0, descIdx: randInt(0, 5), thinkIdx: randInt(0, 5), sign: scene === 'crossroads' }; nodes.push(n); counts[scene] = (counts[scene] || 0) + 1; return n; };
    const CAPS = { teashop: 2, temple: 1, bridge: 2 };
    const POOL = ['forest', 'forest', 'forest', 'river', 'river', 'bridge', 'chautari', 'chautari', 'temple', 'teashop', 'fields', 'fields', 'road', 'crossroads', 'crossroads'];
    const sceneFor = () => { for (;;) { const s = pick(POOL); if (!CAPS[s] || (counts[s] || 0) < CAPS[s]) return s; } };
    const edges = [];
    const linked = (a, b) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    const deg = (n) => edges.filter(([x, y]) => x === n || y === n).length;
    const link = (a, b) => { if (a !== b && !linked(a, b)) edges.push([a, b]); };

    const LEN = 6;
    const main = [add('road')];
    for (let i = 1; i < LEN; i++) main.push(add(sceneFor()));
    main.push(add('village'));
    for (let i = 0; i < LEN; i++) link(main[i], main[i + 1]);
    for (let i = 0; i < LEN; i++) {
      const branches = i === 0 ? 2 : randInt(1, 2);
      for (let b = 0; b < branches && deg(main[i]) < 4; b++) {
        let prev = main[i];
        const len = randInt(1, 2);
        for (let k = 0; k < len; k++) { const s = add(sceneFor()); link(prev, s); prev = s; }
        if (Math.random() < 0.5) { // sometimes a side path loops back to the main route
          const target = main[clamp(i + pick([-1, 1, 2]), 0, LEN - 1)];
          if (target !== main[i] && deg(target) < 4 && deg(prev) < 3) link(prev, target);
        }
      }
    }
    if (!counts.teashop) { const n = pick(nodes.filter((x) => x.scene !== 'village' && x.id !== 0)); n.scene = 'teashop'; n.sign = false; }

    for (const [a, b] of edges) { // label each path with a landmark
      const ua = new Set(a.exits.map((e) => e.path)), ub = new Set(b.exits.map((e) => e.path));
      const ok = (p) => !ua.has(p) && !ub.has(revPath(p));
      const pref = SCENE_PATH[b.scene];
      const p = pref && ok(pref) && Math.random() < 0.6 ? pref : shuffle(PATH_IDS.slice()).find(ok) || 'trail';
      const cost = randInt(25, 45) + (p === 'up' || p === 'down' ? 5 : 0);
      a.exits.push({ to: b.id, path: p, cost });
      b.exits.push({ to: a.id, path: revPath(p), cost });
    }

    for (const n of nodes) { // a dead end can't be a crossroads or a bridge
      if (n.exits.length === 1 && (n.scene === 'crossroads' || n.scene === 'bridge')) { n.scene = pick(['forest', 'fields', 'river']); n.sign = false; }
    }
    const home = main[LEN];
    nodes.forEach((n) => { n.dist = Infinity; });
    home.dist = 0;
    const queue = [home];
    while (queue.length) { const n = queue.shift(); for (const e of n.exits) { const m = nodes[e.to]; if (m.dist === Infinity) { m.dist = n.dist + 1; queue.push(m); } } }

    const used = {};
    const can = (type) => (used[type] || 0) < PEOPLE_CAPS[type];
    const mk = (type) => { used[type] = (used[type] || 0) + 1; return { type, lies: type === 'gothalo' && Math.random() < 0.6, wrong: type === 'sadhu' && Math.random() < 0.15, gone: false }; };
    for (const n of nodes) {
      if (n.id === 0 || n.scene === 'village') continue;
      if (n.scene === 'teashop') { n.person = mk('didi'); continue; }
      if (Math.random() < (main.includes(n) ? 0.75 : 0.55)) {
        const options = Object.keys(PEOPLE).filter((k) => PEOPLE[k].scenes.includes(n.scene) && can(k));
        if (options.length) n.person = mk(pick(options));
      }
    }
    // fairness: at least two honest helpers somewhere on the true route
    const route = main.slice(1, LEN);
    let honest = route.filter((n) => n.person && (HONEST.includes(n.person.type) || n.person.type === 'didi')).length;
    for (const n of shuffle(route.slice())) {
      if (honest >= 2) break;
      if (n.person && (HONEST.includes(n.person.type) || n.person.type === 'didi')) continue;
      const options = HONEST.filter((k) => PEOPLE[k].scenes.includes(n.scene));
      n.person = mk(options.length ? pick(options) : 'bhariya');
      honest++;
    }
    return { nodes, start: main[0], home };
  }

  BH.World = { genWorld };
})();
