// The game loop and scene switching. A scene is an object with optional
// enter(params), exit(), update(dt), draw(g), resize().
import { endFrame } from './input.js';

export const E = {
  cv: null, g: null, W: 0, H: 0, dpr: 1, t: 0, scene: null, paused: false, timeScale: 1, slowT: 0,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  photoOnly: false, // while true the game canvas stays clear so the living photo shows
};
let last = 0;

export function boot(canvas) {
  E.cv = canvas; E.g = canvas.getContext('2d');
  resize();
  addEventListener('resize', resize);
  requestAnimationFrame(loop);
}

function resize() {
  E.dpr = Math.min(2, devicePixelRatio || 1);
  E.W = innerWidth; E.H = innerHeight;
  E.cv.width = Math.round(E.W * E.dpr); E.cv.height = Math.round(E.H * E.dpr);
  E.scene?.resize?.();
}

// a moment of slow motion (a lunge, a near miss)
export function slowmo(scale, secs) { if (E.reduced) return; E.timeScale = scale; E.slowT = secs; }

function loop(now) {
  const real = Math.min(0.1, (now - (last || now)) / 1000);
  last = now;
  if (E.slowT > 0) { E.slowT -= real; if (E.slowT <= 0) E.timeScale = 1; }
  const dt = real * E.timeScale;
  try {
    if (!E.paused && E.scene) { E.t += dt; E.scene.update?.(dt, real); }
    endFrame();
    E.g.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    if (E.photoOnly) E.g.clearRect(0, 0, E.W, E.H); else E.scene?.draw?.(E.g);
  } catch (err) { console.error(err); }
  requestAnimationFrame(loop);
}

export function go(scene, params) {
  E.scene?.exit?.();
  E.scene = scene; E.paused = false; E.timeScale = 1; E.slowT = 0; E.photoOnly = false;
  scene.enter?.(params);
}
