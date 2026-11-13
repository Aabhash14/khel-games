# Duo · जोडी

Seven two-player games on one phone. Lay the phone flat on the table between you: Red sits at the bottom, Blue at the top. Everything for the top player is turned to face them. No internet needed.

## The games

| Game | How it works |
| --- | --- |
| Memory · जोडी मिलाऊ | 24 cards with painted pictures (animals, momo, kite, diyo, madal, temple and more), drawn sharp at your screen's resolution. Flip two; a pair is yours and you go again. Most pairs wins. |
| Pool · पुल | 8-ball, simplified. Drag back from the white ball, let go to shoot. The first colour you pot is yours. Fouls give the other player ball in hand. Black too early loses. |
| Who Is It? · को हो? | 36 cartoon people, each clearly different (head shape, hair, hats, glasses, mouths, freckles, headphones, colours). Each player gets a secret one. Pick a yes/no question from 27; the phone answers and knocks down faces that don't fit. A wrong final guess loses. |
| Four in a Row · चार मिलाऊ | 10 × 10 board, laid sideways so neither player reads it upside down. Tap a row; the coin slides in against the gold edge. Four in a line gets slashed and cut in half. |
| Dots & Boxes · थोप्ला र कोठा | 5 × 7 boxes, so no ties. Close a box and go again. |
| Sea Battle · जलयुद्ध | Each player hides 5 boats while the other looks away (tap a boat to turn it, or Shuffle). Hit = fire again. |
| Animal Stack · जनावरको थाक | Take turns dropping a drawn animal (elephant, rhino, yak, tiger, lion, red panda, goat, cow, turtle) onto a tempo roof: drag to aim, Turn to rotate 45°, Drop. The animals are alive: they blink, wag, flick ears, squash when bumped, and panic with kicking legs when they fall. Each has its own call. Make the pile topple and you lose. Real physics (Matter.js). |

Who starts takes turns from match to match. Wins are tallied per game on the home board; **Story** makes a 1080×1920 image of the rivalry for Instagram or TikTok.

## Features

- English and Nepali (EN / ने toggle, remembered)
- Player names, wins and language are saved on the device
- Synthesised sound, no audio files: woodblock clicks, chimes, a madal drum, a bansuri-style flute, a call for every animal; haptics; mute button
- Pause button (left edge) with Resume / Restart / Games; the game pauses itself when the app goes to the background
- Screen stays awake while playing; works offline as an installable PWA (needs `http://`)

## Code

```
index.html          home board + game shell
style.css           Tempo Art look (see DESIGN.md), plus per-game styles
js/icons.js         the drawn icon set for the game tiles
js/main.js          home, names, tally, overlays, effects; the game API
js/games/*.js       one module per game
js/pics.js          Memory card pictures, painted on canvas at device resolution
js/animals.js       the 9 drawn animals: canvas art with life (blink, wag, ears, falling panic) + physics outlines
js/vendor/          Matter.js 0.19.0 physics (MIT, loaded only by Animal Stack)
js/faces.js         the 36 cartoon people for Who Is It? (seeded roster, SVG) and the 27 questions
js/audio.js         Web Audio synth
js/share.js         story image
js/i18n.js          English + Nepali copy
```

Each game exports `{ id, mount(arena, api) }` (its tile icon lives in `js/icons.js`) and returns `{ destroy, pause?, resume? }`. The `api` gives `turn(p)`, `score(p, v)`, `msg(p, text)`, `face(p)` (turn the board to a player), `callout`, `shake`, `buzz`, `burst`, `live` and `over(winner, note)`. To add a game: write a module, import it in `main.js`, and add its strings to `i18n.js`.

Native ES modules, so serve it over http (`python -m http.server` from the repo root).

## Credits

Physics: [Matter.js](https://brm.io/matter-js/) 0.19.0 by Liam Brummitt (MIT License, header kept in `js/vendor/matter.min.js`). Fonts: Bungee and Bungee Shade (David Jonathan Ross), Yatra One, Hind, all SIL Open Font License, self-hosted in `fonts/`. All art is drawn in code. © 2026 Aabhash Shahi.
