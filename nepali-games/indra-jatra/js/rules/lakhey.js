// Daring Majipa Lakhey, in real time.
// x: 0 = safe in the crowd, 1 = right under his mask. Hold forward to creep, hold back to retreat.
// Nerve builds faster the closer you are. Reach the crowd again to keep it.
// Before every lunge he gives a sign (a stare, or stamping). Some signs are bluffs.
import { clamp } from './rand.js';

export const LAKHEY = {
  rounds: ['asan', 'indra', 'maru'],
  roundTime: 30,
  creep: 0.17, retreat: 0.85,
  reach: 0.55,          // a lunge catches you if you are further in than this
  lungeDur: 0.5,        // the catch is decided at the middle of the lunge
  tauntMin: 0.35,
  stars: [200, 110],
};

export function createLakhey(rand) {
  const s = { rand, round: 0, total: 0, caught: 0, banked: [], over: false, puluk: false };
  resetRound(s);
  return s;
}

function resetRound(s) {
  s.x = 0; s.pot = 0; s.roundT = LAKHEY.roundTime; s.A = 1 + s.round * 0.55;
  s.mode = 'dance'; s.modeT = 2 + s.rand() * 1.5; s.tell = null; s.bluff = false; s.judged = false;
  s.tauntCD = 0; s.end = null; s.endT = 0; s.left = false;
  s.pulukAt = s.round >= 1 && !s.puluk && s.rand() < 0.6 ? 8 + s.rand() * 14 : -1;
}

function danceTime(s) { return (1.1 + s.rand() * 2.6) / Math.sqrt(s.A); }
function tellTime(s) {
  const quick = s.round >= 1 && s.rand() < 0.25;
  return quick ? 0.38 : clamp(0.8 - 0.07 * s.A, 0.5, 0.8);
}

// inp: { fwd, back, taunt } (taunt is a tap). Returns events.
export function stepLakhey(s, dt, inp) {
  const ev = [];
  if (s.over) return ev;
  if (s.end) { // a round is closing: wait, then start the next
    s.endT -= dt;
    if (s.endT <= 0) {
      s.end = null; s.round++;
      if (s.round >= LAKHEY.rounds.length) { s.over = true; ev.push({ type: 'over' }); }
      else { resetRound(s); ev.push({ type: 'round', round: s.round }); }
    }
    return ev;
  }
  s.roundT -= dt;
  s.tauntCD = Math.max(0, s.tauntCD - dt);

  // the player
  const pushed = s.pushT > 0;
  if (pushed) { s.pushT -= dt; s.x = Math.max(0, s.x - 0.6 * dt); }
  else if (inp.back) s.x = Math.max(0, s.x - LAKHEY.retreat * dt);
  else if (inp.fwd) s.x = Math.min(0.98, s.x + LAKHEY.creep * dt * (1 - s.x * 0.35));
  if (s.x > 0.02) s.left = true;
  if (s.x > 0.12) s.pot += dt * 6 * s.x * s.x * (1 + 0.25 * s.round);
  if (inp.taunt && s.x >= LAKHEY.tauntMin && s.tauntCD <= 0 && s.mode !== 'lunge') {
    s.pot = s.pot * 1.3 + 3; s.A += 0.5; s.tauntCD = 1.3;
    if (s.mode === 'dance') s.modeT = Math.min(s.modeT, 0.5 + s.rand() * 0.6);
    ev.push({ type: 'taunt' });
  }

  // Pulukisi charges through once, in the later rounds
  if (s.pulukAt > 0 && LAKHEY.roundTime - s.roundT >= s.pulukAt) {
    s.pulukAt = -1; s.puluk = true; s.pushT = 1.4;
    ev.push({ type: 'puluk' });
  }

  // the Lakhey
  s.modeT -= dt;
  if (s.mode === 'dance' && s.modeT <= 0) {
    s.mode = 'tell'; s.tell = s.rand() < 0.5 ? 'eye' : 'stamp';
    s.bluff = s.rand() < 0.28; s.modeT = tellTime(s);
    ev.push({ type: 'tell', tell: s.tell });
  } else if (s.mode === 'tell' && s.modeT <= 0) {
    if (s.bluff) { s.mode = 'dance'; s.modeT = danceTime(s); ev.push({ type: 'bluff' }); }
    else { s.mode = 'lunge'; s.modeT = LAKHEY.lungeDur; s.judged = false; ev.push({ type: 'lunge' }); }
  } else if (s.mode === 'lunge') {
    if (!s.judged && s.modeT <= LAKHEY.lungeDur / 2) {
      s.judged = true;
      if (s.x > LAKHEY.reach) {
        s.caught++; s.banked.push(0); s.pot = 0;
        ev.push({ type: 'caught' });
        s.end = 'caught'; s.endT = 2.2; s.mode = 'recover';
        return ev;
      }
      ev.push({ type: 'miss', close: s.x > LAKHEY.reach - 0.15 });
    }
    if (s.modeT <= 0) { s.mode = 'recover'; s.modeT = 0.9; s.A += 0.15; }
  } else if (s.mode === 'recover' && s.modeT <= 0) { s.mode = 'dance'; s.modeT = danceTime(s); }
  s.A += dt * 0.03;

  // banking: back in the crowd with some nerve, or time is up
  if ((s.left && s.x <= 0 && s.pot > 0.5) || s.roundT <= 0) {
    const n = Math.round(s.pot);
    s.total += n; s.banked.push(n);
    ev.push({ type: 'bank', n, timeUp: s.roundT <= 0 });
    s.end = 'bank'; s.endT = 1.6;
  }
  return ev;
}

export function lakheyLamps(s) {
  return s.total >= LAKHEY.stars[0] ? 3 : s.total >= LAKHEY.stars[1] ? 2 : 1;
}
