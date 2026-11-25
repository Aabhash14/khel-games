# Bagh-Chal · बाघ चाल

**Status:** Playable · Khel No. 14

Nepal's own board game: 4 tigers against 20 goats on a carved, lacquered sal-wood board with brass inlay. Tigers win by eating 5 goats; goats win by trapping every tiger. Play the computer at three levels as either side, pass one phone between two people, or take on the **Daily Bagh**: the same middle-game board for everyone, you as the goats against Hard, with a story image to share. English and Nepali, works offline as a PWA, and also opens straight from `file://`.

Hook: **4 tigers. 20 goats. Eat 5, or trap all 4.**
हुक: **४ बाघ। २० बाख्रा। ५ वटा खाऊ, वा चारै बाघ थुन।**

## How to play

- **Tap or drag the pieces.** Tap a piece and its legal moves get a glowing ring; tap a ring (or just drag the piece there). Goats come out of the trough under the board: every empty point pulses with a ring and the next goat in the trough lifts up, so tap a ring or drag that goat up.
- Every game opens with one line on what winning means for your side ("You're the goats. Trap all 4 tigers...").
- Captures glow red with a ring and a dashed arc showing the leap, and the goat about to be eaten glows red. The tiger crouches, pounces in a high arc, claws the goat, lands with a squash; the goat tumbles into the tray above the board.
- **Hints** (eye button): goats that can be eaten right now pulse red, risky drop points get a red cross, and each tiger shows one dot per move it still has.
- **Undo** against the computer takes back your move and its reply. No undo in the Daily.
- Keyboard: Tab onto the board, arrow keys move between points, Enter or Space taps.
- A game in progress is saved after every move. If the phone drops the tab, **Continue your game** on the home screen picks it up. Leaving a game from the menu drops it.
- Undo on a finished game also takes that result back out of your record.

## Rules (standard)

- 5x5 grid of 25 points. Lines run along every row and column; diagonals run through the points where row + column is even.
- The 4 tigers start on the corners. **Goats move first.**
- **Placement:** each goat turn drops one of the 20 goats on any empty point. Goats cannot move until all 20 are down.
- **Tiger turn:** move one tiger one step along a line to an empty point, **or** jump in a straight line over a neighbouring goat to the empty point right behind it (along a real line). One capture per turn, no chains.
- After all goats are placed, a goat turn slides one goat one step along a line.
- **Tigers win** at 5 goats eaten (or if the goats have no move at all). **Goats win** when it is the tigers' turn and no tiger can move.
- **Draw:** once all goats are placed, the same position (board + side to move) for the 3rd time. The game warns on the 2nd.

## Modes

| Mode | What it is |
| --- | --- |
| Daily Bagh | One board a day, the same for everyone. Daily #1 = 20 Nov 2026 (local date). You play the goats against Hard, starting after all 20 goats are down, so a round is a few minutes. Generated from the day number: two seeded engines play a seeded opening plus a seeded number of plies; of the positions where it is the goats' move with at most one goat gone, the one where the goats are a little ahead (depth-4 score near +450) is kept, else the best one found. In engine tests a Medium-strength player wins about a third of these boards, draws a third and loses a third; an Easy-strength player loses. Tiger days were tried and dropped: Hard goats held every tiger start, even with 4 goats already eaten. The board is cached for the day in `bagh.dailyPos` (version 2). |
| Play the computer | Pick tigers or goats, pick Easy / Medium / Hard. Wins, losses, draws and your fastest win are saved per level and side. |
| Pass and play | Two people, one phone. |
| Learn in a minute | Three hands-on steps: drop a goat, make a capture, trap the last tiger. Skippable. |

## The computer

`js/ai.js`: negamax alpha-beta with iterative deepening, a transposition table (Zobrist hashing, incremental), capture quiescence, killer and history move ordering, repetition awareness and a time budget. Evaluation, from the tigers' side: goats eaten, tiger mobility (diagonal points count extra), trapped and nearly trapped tigers, goats hanging right now (weighted by whose turn it is), and goats still in hand.

- **Easy:** depth 2, a random move about a third of the time, otherwise a soft pick among the top moves.
- **Medium:** depth 4, an occasional slip, a tighter soft pick.
- **Hard:** iterative deepening to the time limit (about 1.2 s in the worker, 0.35 s on the main thread), always the best move found.

The search runs in a Web Worker (`js/worker.js`) after the "thinking" frame has painted, so the board keeps animating. From `file://` (where workers cannot load) it falls back to the main thread with a shorter budget.

Measured in Node (`test-ai.js`, 150 to 300 ms per move): Hard as goats beat random, greedy, Easy and Medium tigers every game; Hard as tigers beat random, greedy, Easy and Medium goats every game. Hard vs Hard ends in draws or narrow tiger wins.

## Feel

- Everything is drawn in code on canvas (`js/art.js`): wood grain, lamp light, a carved bead-and-petal border, brass corner plates, inlaid brass lines, brass studs, embossed brass bagh-face tokens with red lacquer rings, cream clay goats with horns and a tika.
- Tigers breathe and their eyes glow while the computer thinks; goats bob when it is their side thinking.
- A capture shakes the board, throws sparks, rakes three claw marks across the goat, rings the tray socket it lands in and buzzes the phone (`navigator.vibrate`); a newly trapped tiger shakes, dims and gets an iron ring.
- At the end the winners celebrate on the board: a hop ripples out from the middle with brass (goats) or red (tigers) sparks, then the result sheet slides up.
- Sound is all Web Audio (`js/audio.js`): wooden clacks, a goat bleat, tiger growl and roar, temple bells, and a low madal pulse that gets faster and busier as goats fall. Mute is remembered.
- `prefers-reduced-motion` shortens animations and turns off shake, particles and thinking wobble.

## Files

| File | Job |
| --- | --- |
| `js/rules.js` | Pure rules: board graph, move generation, make/unmake with incremental hashing, win/draw, `Game` with repetition and undo. No DOM, runs in Node. |
| `js/ai.js` | Search, levels, Daily Bagh generator, day numbers. No DOM, runs in Node and in the worker. |
| `js/worker.js` | Runs the search and the Daily board generator off the main thread. |
| `js/art.js` | Board, tokens, trays, sprites. |
| `js/view.js` | Play canvas: layout (portrait and landscape), tweens, particles, tap and drag input, keyboard points. |
| `js/main.js` | Screens, game flow, computer turns, undo, hints, tutorial, Daily, stats, result sheet. Test hooks on `window.BC`. |
| `js/share.js` | 1080x1920 story image (final board, result, moves, date) and Web Share / download fallback. |
| `js/audio.js` | Synthesised sound. |
| `js/i18n.js` | English + Nepali copy. |
| `sw.js` | Network-first offline cache (`bagh-chal-v3`). Bump `CACHE` and the `?v=` strings together. |

Stored locally: `bagh.lang`, `bagh.muted`, `bagh.prefs`, `bagh.stats`, `bagh.daily`, `bagh.dailyPos`, `bagh.learned`, `bagh.session` (the game in progress).

## Credits

- Fonts: Yatra One and Hind, plus Mukta for the Devanagari digits (Hind draws them as Latin digits). SIL Open Font License, `fonts/OFL.txt`, self-hosted.
- All art and sound made in code for this repo. No images, no audio files.
