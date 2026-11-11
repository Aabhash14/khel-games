// Boot: wire the scenes together and start on the title screen.
import { boot, go, E } from './core/engine.js';
import { UI } from './core/ui.js';
import { initAudio } from './core/audio.js';
import { Photo } from './core/photo.js';
import { setLang, L } from './core/i18n.js';
import { SCENES, pause } from './scenes/common.js';
import { menuScene } from './scenes/menu.js';
import { yosinScene } from './scenes/yosin.js';
import { upakuScene } from './scenes/upaku.js';
import { lakheyScene } from './scenes/lakhey.js';
import { rathScene } from './scenes/rath.js';
import { finaleScene } from './scenes/finale.js';

Object.assign(SCENES, { menu: menuScene, yosin: yosinScene, upaku: upakuScene, lakhey: lakheyScene, rath: rathScene, finale: finaleScene });

setLang(L);
UI.init();
Photo.init(document.getElementById('photo'));
boot(document.getElementById('game'));
go(menuScene);

// Browsers only allow sound after a gesture.
let asked = false;
const wake = () => { initAudio(); if (!asked) { asked = true; Photo.askMotion(); } };
addEventListener('pointerdown', wake, { passive: true });
addEventListener('keydown', wake);

// Pause when the tab is hidden or Escape is pressed during a chapter.
const restart = () => E.scene && go(E.scene);
document.addEventListener('visibilitychange', () => { if (document.hidden && E.scene !== menuScene && !document.getElementById('hud').hidden) pause(restart); });
addEventListener('keydown', (e) => { if ((e.key === 'Escape' || e.key === 'p') && E.scene !== menuScene && !document.getElementById('hud').hidden) pause(restart); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
