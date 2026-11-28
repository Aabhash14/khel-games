/* Pro Scout — scoring helpers: streak bonus, result grid, verdict line. */
(() => {
  'use strict';

  window.PS = window.PS || {};

  const streakBonus = (n) => (n >= 3 ? 50 * Math.min(n - 2, 3) : 0); // 3 in a row +50, 4 +100, 5+ +150

  const gridOf = (results) => results.map((r) => (r.final ? (r.ok ? '💰' : '💸') : r.doubled ? (r.ok ? '🌟' : '💀') : r.ok ? ['🟩', '🟨', '🟧'][r.stage] : '🟥')).join('');
  function verdict(score) {
    if (score >= 5000) return 'Legendary. That final bet paid off.';
    if (score >= 3200) return 'Elite scout. Clubs should be calling you.';
    if (score >= 2200) return 'Sharp eye. Very little gets past you.';
    if (score >= 1300) return 'Solid scouting. A few more highlights to watch.';
    if (score >= 500) return 'Rookie scout. The album will help.';
    return 'Back to the stands for some research!';
  }

  PS.Scoring = { streakBonus, gridOf, verdict };
})();
