# Tuin Paar · तुइन पार

A river-crossing mind game. Get everyone across the gorge on the *tuin* (a basket on a cable) without anyone getting eaten.
English and Nepali, works offline as a PWA.

## How it plays

- Tap people and animals to load the basket, then drag the basket across (or press **Pull**).
- Someone who can pull has to ride: **Didi**, **Bhai** or the **Monkey**. Bhai can't pull alone.
- On a bank with no human, eaters eat: tiger → goat / hen / dog, goat → grass, dog → cat, cat → fish, hen → corn, monkey → momo / corn.
- Fewest trips wins 3 stars. The river rises every trip and floods at best + 6. Undo and Hint are always there (a hint caps you at 2 stars).

## Modes

| Mode | What it is |
| --- | --- |
| Today's tuin | One seeded puzzle a day, the same for everyone. Tuin #1 = 11 Nov 2026 (local date). Best trips 9–13. |
| Levels | 12 hand-picked puzzles, each unlocked by finishing the one before. |
| Make one for a friend | Pick the cast and basket size; the solver checks it can be done and shows the best trip count, then you send a link (`#c=<code>&by=<name>`). |

Finishing a puzzle gives a 1080×1920 story image and a short share line.

## Code

| File | Job |
| --- | --- |
| `js/cast.js` | The 12 characters and their rules. `IDS` order is used in share links: only append. |
| `js/engine.js` | Pure rules, BFS solver, seeded generator, daily + level puzzles, share-link encode/decode. No DOM, so it runs in Node. |
| `js/main.js` | Screens, tokens, basket drag, undo/hint, result sheets, builder. |
| `js/share.js` | Story image canvas and Web Share / download fallback. |
| `js/audio.js` | Synthesised sound, including a river bed that gets louder as the water rises. |
| `js/i18n.js` | English + Nepali copy. |

Levels were picked from an offline search of ~100k casts, ranked by how many extra trips the rules force over a crossing with no rules.
A 3-seat basket is almost always trivial once a human can guard, so only level 6 uses one.

Stored locally: `tuin.levels`, `tuin.daily`, `tuin.name`, `tuin.lang`, `tuin.muted`.

## Art

- **Characters:** [Fluent Emoji 3D](https://github.com/microsoft/fluentui-emoji) by Microsoft, MIT License (`img/LICENSE-fluentui-emoji.txt`), 224px WebP, self-hosted. Didi and Bhai use the full-body standing/walking figures. Each character has a real-world size and a facing in `js/cast.js`; they turn toward where they are heading, get a warm rim light from the sun, a contact shadow and a cast shadow thrown left, and breathe slowly.
- **Sounds:** real recordings in `sfx/`, one per character plus `chomp` and `splash`, trimmed and loudness-matched. Sources and licences in `sfx/CREDITS.md`. The monkey (CC BY-SA 4.0) and Bhai (CC BY 3.0) clips need the visible credit at the bottom of the home screen; keep it. If a file is missing, the game falls back to its synthesised sound.
- **Scene:** procedural SVG in `img/`: `gorge.svg` (sky, Himalaya, forest ridge, inner gorge), `rock.svg` (lit noise, tiles), `water.svg` (current and foam, tiles and scrolls), `weave.svg` (bamboo basket). No photos, no external requests.
