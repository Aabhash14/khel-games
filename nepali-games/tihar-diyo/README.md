# Tihar Diyo · तिहार दियो

**Status:** Playable

A Tihar night puzzle. Turn the carved tiles of a Newari window so oil flows from the brass kalash and every diyo on the house lights up.
Five nights of Tihar, 30 levels, a new puzzle every day. English and Nepali, works offline as a PWA. Khel No. 16.

## How it plays

- **Tap** a tile to turn it right. **Hold** it (or right-click) to turn it left. Each is one move.
- Oil flows out of the kalash along channels that meet. A diyo lights when the oil reaches it.
- You win when every diyo is lit **and** no oil spills: no open channel end may point at the wall, a carved panel, or a tile without a matching channel.
- **Par** is the exact fewest moves (each tile turned the short way round). Par = 3 stars, a little over = 2, more = 1.
  Three little lamps under the move count show the stars still on the table. The move that costs a star blows one out, and the subtitle asks: finish for fewer stars, or restart and go for 3? (In Nepali, par is लक्ष्य.)
- **Laxmi's footprints** are hint tokens. You start with 3 and earn one each time you 3-star a level. A hint sets one tile right, but caps that level at 2 stars, so it is spend now or save for a harder night. The hint button asks once before it spends.
- Stars open the nights: Kukur Tihar needs 9, Laxmi Puja 20, Mha Puja 32, Bhai Tika 44.

A first-time player sees **Start playing** on top, which goes straight into Kaag Tihar level 1. After that the daily is the main button.

Keyboard: arrows move, Space or Enter turns right, Shift+Space or Q turns left, R restarts, H asks for a hint.

## The five nights

| Night | House | New idea |
| --- | --- | --- |
| Kaag Tihar | Brick house, crows on the eave | Turning, holding, leaks, carved panels |
| Kukur Tihar | Brick house, a dog in a marigold mala | Nailed tiles that can't turn |
| Laxmi Puja | Kamero and rato mato walls, Laxmi's footprints to the door | Four-way crossings, two kalash |
| Govardhan · Mha Puja | Teal night, Mha Puja mandalas | Wind tile with a prayer flag that turns itself every 3 or 4 moves, so the last moves need timing |
| Bhai Tika | Seven-colour tika on the lintel | Everything at once, up to 7x7 |

Grids grow from 3x3 to 7x7. Each night has its own sky, wall, garland and rangoli colours.

## Aajako Diyo (daily)

A 6x6 puzzle generated from the local date (seeded PRNG), the same for everyone. #1 = 1 Oct 2026. The weekday picks the twist:
none, nails, two kalash, a crossing, wind, two kalash + crossing, wind + nails. The generator nails extra tiles until the solver finds exactly one answer.
Finishing gives a share line (moves vs par, lamps, a dot map: ● turned in the fewest moves, ○ turned more than needed, · a tile you can't turn) and a 1080x1920 story image of the lit house.
The story image shows a glowing lattice in the window instead of the solved grid, so posting it never spoils the day's puzzle.

## Feel

A finger on a tile presses it in. Holding draws a ring that fills anticlockwise with an arrow, and the tile turns left when the ring closes. Tiles snap with a spring, a small bounce and a wooden click. Oil spreads tile by tile with a running glint; each new connection plays a rising glint and each diyo that lights plays the next note up the scale.
Spilling ends drip. On a win every diyo flares, marigold petals fall, phuljhadi sparks and fireworks go up, a ghanti chord rings and a short deusi-bhailo style tune plays over madal.
Under it all: night breeze, crickets, far temple bells, and a tanpura drone that swells (then a madal comes in) as more diyos light. Haptics on supported phones. Reduced motion is respected.
After a win, tap outside the result to lower it and look at the lit house; tap the tab to bring it back. The top bar (Khel, language, sound) stays usable while the result is up.

On a phone held sideways the window takes the left side and the counters and buttons stack on the right; short screens slim the roof and sill so tiles stay as big as possible.

## Code

| File | Job |
| --- | --- |
| `js/rules.js` | Pure rules: tile masks and rotation, oil flow and leaks, wind, the solver (counts answers), par, stars, hints, the seeded spanning-tree generator, the daily puzzle. No DOM, runs in Node. |
| `js/levels.js` | The 30 frozen levels as data strings, with par and the idea each one introduces. |
| `js/art.js` | Everything drawn in canvas: the house, roof, torana, carved window, tiles, oil, kalash, diyos, garlands, rangoli, per-night motifs and palettes. |
| `js/stage.js` | The live canvas: layout, spring animation, oil spread, particles, tap / hold / right-click / keyboard input. |
| `js/main.js` | Screens, progress, scoring, hints, result sheet, daily. Test hooks on `window.TD`. |
| `js/share.js` | Story image and share text, Web Share with a download fallback. |
| `js/audio.js` | All sound, synthesised with Web Audio. |
| `js/i18n.js` | English + Nepali copy. |

Level data format: `'WxH[wN]:sol:rot:it:mod'` where `sol` is one hex channel mask per cell (N=1, E=2, S=4, W=8, 0 = carved panel), `rot` the clockwise turns from the answer to the start, `it` marks `s` kalash and `d` diyo, `mod` marks `x` nailed and `w` wind tiles, and `wN` is the wind period.
Levels were picked offline from seeded candidates, each checked by the solver to have exactly one answer. Don't hand-edit them: par and uniqueness are tested.

Plain `<script>` files, no build step, no modules, so it also opens from `file://` (the service worker and font preloads only run over http).

Stored locally: `tihar-diyo-v1` (stars, best moves, footprints, daily results and streak, mute) and `diyo.lang` (falls back to `khel.lang`).

## Credits

- Every picture and sound is made in code. No image or audio files.
- Fonts: [Mukta](https://fonts.google.com/specimen/Mukta) and [Yatra One](https://fonts.google.com/specimen/Yatra+One), SIL Open Font License (`fonts/OFL.txt`), self-hosted.
