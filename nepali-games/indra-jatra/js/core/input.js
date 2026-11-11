// One input layer for touch buttons and the keyboard. Scenes ask for named actions:
// held('left') while pressed, tapped('action') once per press.
const held = new Set(), taps = new Set();
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'action', Enter: 'action',
};
let enabled = true;

addEventListener('keydown', (e) => {
  const a = KEYS[e.code];
  if (!a || !enabled || e.target.closest?.('button:not(.ctl), a, input')) return;
  if (!held.has(a)) taps.add(a);
  held.add(a); e.preventDefault();
  document.querySelector(`.ctl[data-action="${a}"]`)?.classList.add('on');
});
addEventListener('keyup', (e) => {
  const a = KEYS[e.code];
  if (!a) return;
  held.delete(a);
  document.querySelector(`.ctl[data-action="${a}"]`)?.classList.remove('on');
});
addEventListener('blur', clearAll);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearAll(); });

export function clearAll() { held.clear(); taps.clear(); document.querySelectorAll('.ctl.on').forEach((b) => b.classList.remove('on')); }
export const isHeld = (a) => held.has(a);
export const tapped = (a) => taps.has(a);
export function endFrame() { taps.clear(); }
export function setEnabled(on) { enabled = on; if (!on) clearAll(); }

// Bind a touch/mouse button to an action. Pointer capture keeps the hold if the thumb slides.
export function bindButton(el, action, onPress) {
  const down = (e) => {
    if (!enabled || el.disabled) return;
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
    if (!held.has(action)) taps.add(action);
    held.add(action); el.classList.add('on');
    if (navigator.vibrate) navigator.vibrate(6);
    onPress && onPress();
  };
  const up = () => { held.delete(action); el.classList.remove('on'); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
