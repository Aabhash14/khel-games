// Best XI, team strength and analyst grades. The season itself is in league.js and match.js.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});
  const { TEAMS } = IPLA.data;
  const { P } = IPLA.engine;

  const isBowler = (p) => p.role === 'PACE' || p.role === 'SPIN' || p.role === 'AR';

  // How much each batting slot matters. The top six face most of the balls; 8-11 rarely bat long.
  const BAT_W = [1, 1, 1, 0.95, 0.85, 0.75, 0.6, 0.4, 0.25, 0.15, 0.1];
  // Twenty overs = five bowlers x four. A sixth option helps when one is taken apart.
  const BOWL_W = [1, 1, 1, 0.95, 0.85, 0.25];
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const BAT_T = sum(BAT_W);
  const BOWL_T = sum(BOWL_W);

  // A side's quality from its batting and bowling skills. adj = today's form and pitch fit.
  // A side with fewer than five real bowlers has to give overs to part-timers, and their low
  // bowling skill drags the score down by itself.
  function xiScore(xi, adj) {
    const bat = xi.map((p) => p.bat + adj(p)).sort((a, b) => b - a);
    const real = xi.filter(isBowler).map((p) => p.bowl + adj(p)).sort((a, b) => b - a);
    const part = xi.filter((p) => !isBowler(p)).map((p) => Math.min(p.bowl, 55) + adj(p) - 6).sort((a, b) => b - a);
    const bowl = [...real, ...part].slice(0, BOWL_W.length);
    let b = 0; let k = 0;
    BAT_W.forEach((w, i) => { b += w * (bat[i] ?? 20); });
    BOWL_W.forEach((w, i) => { k += w * (bowl[i] ?? 20); });
    let sc = (b / BAT_T) * 0.5 + (k / BOWL_T) * 0.5;
    // Fewer than five front-line bowlers is a real gap, not just a lower average.
    sc -= Math.max(0, 5 - real.length) * 2.5;
    if (!xi.some((p) => p.role === 'WK')) sc -= 4; // someone else keeps: byes, drops, missed stumpings
    return sc;
  }

  // Max 4 overseas, a keeper if the squad has one, then the mix of batters and bowlers that
  // scores best. Start from a sensible greedy pick, then keep making the single swap
  // (XI player for bench player) that helps most until no swap helps.
  // val: how good a player is today (default: rating). Computer captains add form and pitch fit.
  function bestXI(squadPids, val = (p) => p.r) {
    const adj = (p) => val(p) - p.r;
    const pool = squadPids.map((id) => P[id]).filter(Boolean).sort((a, b) => val(b) - val(a));
    const xi = [];
    let os = 0;
    const take = (p) => { xi.push(p); if (p.os) os++; };
    const ok = (p) => !xi.includes(p) && (!p.os || os < 4);
    const wk = [...pool].filter((p) => p.role === 'WK').sort((a, b) => b.bat + adj(b) - (a.bat + adj(a)))[0];
    if (wk) take(wk);
    for (const p of pool.filter((x) => x.role === 'PACE' || x.role === 'SPIN')) { if (xi.filter(isBowler).length >= 4) break; if (ok(p)) take(p); }
    while (xi.length < 11) {
      const needBowl = xi.filter(isBowler).length < 5 && 11 - xi.length <= 5 - xi.filter(isBowler).length;
      const p = pool.find((x) => ok(x) && (!needBowl || isBowler(x))) || pool.find(ok);
      if (!p) break;
      take(p);
    }

    const hasWK = !!wk;
    const legal = (team) => team.filter((p) => p.os).length <= 4 && (!hasWK || team.some((p) => p.role === 'WK'));
    let best = xiScore(xi, adj);
    for (let round = 0; round < 25; round++) {
      let move = null;
      const bench = pool.filter((p) => !xi.includes(p));
      for (let i = 0; i < xi.length; i++) {
        for (const q of bench) {
          const team = xi.slice(); team[i] = q;
          if (!legal(team)) continue;
          const sc = xiScore(team, adj);
          if (sc > best + 0.01) { best = sc; move = [i, q]; }
        }
      }
      if (!move) break;
      xi[move[0]] = move[1];
    }

    const order = { BAT: 0, WK: 1, AR: 2, SPIN: 3, PACE: 4 };
    return xi.sort((a, b) => order[a.role] - order[b.role] || b.r - a.r);
  }

  // Team strength for the analyst grades: the best XI, plus a little for the bench
  // (injuries, the Impact Player and a long season all lean on it).
  function strength(squadPids) {
    const xi = bestXI(squadPids);
    const flat = () => 0;
    const bench = squadPids.map((id) => P[id]).filter((p) => p && !xi.includes(p))
      .map((p) => Math.max(p.bat, isBowler(p) ? p.bowl : 0)).sort((a, b) => b - a).slice(0, 4);
    while (bench.length < 4) bench.push(45);
    const depth = sum(bench) / 4;
    const sc = xiScore(xi, flat) * 0.9 + depth * 0.1 - (11 - xi.length) * 6;
    return Math.round(sc * 10) / 10;
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
    const buys = s.teams[t].squad.filter((e) => e.how !== 'ret' && e.how !== 'kept');
    const dear = [...buys].sort((a, b) => b.price - a.price)[0] || null;
    const steal = [...buys].filter((e) => P[e.pid].r >= 70).sort((a, b) => P[b.pid].r / b.price - P[a.pid].r / a.price)[0] || null;
    return { dear, steal };
  }

  IPLA.season = { bestXI, strength, grades, highlights, xiScore };
})();
