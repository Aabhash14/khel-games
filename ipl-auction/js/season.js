// Best XI, team strength and analyst grades. The season itself is in league.js and match.js.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { TEAMS } = IPLA.data;
  const { P } = IPLA.engine;

  const batVal = (p) => (p.role === 'BAT' || p.role === 'WK' ? p.r : p.role === 'AR' ? p.r * 0.92 : p.r * 0.45);
  const bowlVal = (p) => (p.role === 'PACE' || p.role === 'SPIN' ? p.r : p.role === 'AR' ? p.r * 0.85 : 30);
  const isBowler = (p) => p.role === 'PACE' || p.role === 'SPIN' || p.role === 'AR';

  // Max 4 overseas, at least one keeper, at least five bowling options.
  function bestXI(squadPids) {
    const pool = squadPids.map((id) => P[id]).sort((a, b) => b.r - a.r);
    const xi = [];
    let os = 0;
    const take = (p) => { xi.push(p); if (p.os) os++; };
    const ok = (p) => !xi.includes(p) && (!p.os || os < 4);
    const wk = pool.find((p) => p.role === 'WK' && ok(p));
    if (wk) take(wk);
    for (const p of pool.filter((x) => x.role === 'PACE' || x.role === 'SPIN')) { if (xi.filter(isBowler).length >= 4) break; if (ok(p)) take(p); }
    while (xi.length < 11) {
      const needBowl = xi.filter(isBowler).length < 5 && 11 - xi.length <= 5 - xi.filter(isBowler).length;
      const p = pool.find((x) => ok(x) && (!needBowl || isBowler(x)));
      if (!p) break;
      take(p);
    }
    const order = { BAT: 0, WK: 1, AR: 2, SPIN: 3, PACE: 4 };
    return xi.sort((a, b) => order[a.role] - order[b.role] || b.r - a.r);
  }

  function strength(squadPids) {
    const xi = bestXI(squadPids);
    const bat = xi.map(batVal).sort((a, b) => b - a).slice(0, 7);
    const bowl = xi.map(bowlVal).sort((a, b) => b - a).slice(0, 5);
    const avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    return Math.round((avg(bat) * 0.5 + avg(bowl) * 0.5 - (11 - xi.length) * 6) * 10) / 10;
  }

  const GRADES = ['A+', 'A', 'A', 'B+', 'B+', 'B', 'B', 'C+', 'C+', 'C'];
  function grades(s) {
    const rows = TEAMS.map((T) => ({ t: T.id, str: strength(s.teams[T.id].squad.map((e) => e.pid)) }));
    rows.sort((a, b) => b.str - a.str);
    rows.forEach((r, i) => { r.rank = i + 1; r.grade = GRADES[i]; });
    return rows;
  }

  // Best steal: highest rating per crore among auction buys. Most expensive: the top price.
  function highlights(s, t) {
    const buys = s.teams[t].squad.filter((e) => e.how !== 'ret');
    const dear = [...buys].sort((a, b) => b.price - a.price)[0] || null;
    const steal = [...buys].filter((e) => P[e.pid].r >= 70).sort((a, b) => P[b.pid].r / b.price - P[a.pid].r / a.price)[0] || null;
    return { dear, steal };
  }

  IPLA.season = { bestXI, strength, grades, highlights };
})();
