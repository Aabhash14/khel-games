// IPL mega auction rules (2025 mega auction format). All money is in lakh (100 lakh = 1 crore).
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});

  const PURSE = 12000;          // ₹120 Cr
  const MIN_SQUAD = 18;
  const MAX_SQUAD = 25;
  const MAX_OVERSEAS = 8;
  const MAX_RETAIN = 6;         // retentions + RTM cards together
  const MAX_RETAIN_CAPPED = 5;
  const MAX_RETAIN_UNCAPPED = 2;
  const RETAIN_COST_CAPPED = [1800, 1400, 1100, 1800, 1400];
  const RETAIN_COST_UNCAPPED = 400;
  const MIN_PRICE = 30;

  // Bid steps: +5 L up to ₹1 Cr, +10 L to ₹2 Cr, +20 L to ₹3 Cr, +25 L after that.
  function step(cur) {
    if (cur < 100) return 5;
    if (cur < 200) return 10;
    if (cur < 300) return 20;
    return 25;
  }
  const nextBid = (cur, base) => (cur == null ? base : cur + step(cur));

  function basePrice(p) {
    if (!p.capped) return p.r >= 72 ? 50 : p.r >= 66 ? 40 : 30;
    if (p.r >= 82) return 200;
    if (p.r >= 78) return 150;
    if (p.r >= 74) return 125;
    if (p.r >= 70) return 100;
    return 75;
  }

  // Cost of keeping players before the auction: capped slots cost 18/14/11/18/14 Cr in order, uncapped 4 Cr each.
  function retentionCost(players) {
    const capped = players.filter((p) => p.capped).length;
    const uncapped = players.length - capped;
    let cost = uncapped * RETAIN_COST_UNCAPPED;
    for (let i = 0; i < capped; i++) cost += RETAIN_COST_CAPPED[i];
    return cost;
  }

  function retentionCheck(players) {
    const capped = players.filter((p) => p.capped).length;
    const uncapped = players.length - capped;
    if (players.length > MAX_RETAIN) return 'max';
    if (capped > MAX_RETAIN_CAPPED) return 'capped';
    if (uncapped > MAX_RETAIN_UNCAPPED) return 'uncapped';
    return null;
  }
  IPLA.rules = { PURSE, MIN_SQUAD, MAX_SQUAD, MAX_OVERSEAS, MAX_RETAIN, MAX_RETAIN_CAPPED, MAX_RETAIN_UNCAPPED, RETAIN_COST_CAPPED, RETAIN_COST_UNCAPPED, MIN_PRICE, step, nextBid, basePrice, retentionCost, retentionCheck };
})();
