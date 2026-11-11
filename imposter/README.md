# Imposter · नक्कली को?

A pass-the-phone party game for 3 to 12 people in one room. Everyone gets the same secret word on a folded chit, except the imposter.

## How a round goes

1. **Deal the chits.** Pass the phone around. Each person holds the red button to peek at their chit, then lets go to fold it.
2. **Clues.** Two rounds: each person says ONE word that fits the secret word (15-second ring each). The imposter never goes first.
3. **Talk.** A 90 to 120 second argument with music that speeds up as time runs out. `+30s` if needed.
4. **Point on 3.** The phone counts 3, 2, 1, and everyone points. Tap who got the most fingers (or Tie / nobody), then hold to reveal.
5. **Last chance.** A caught imposter gets 15 seconds to pick the crew's word from 6 options. Right answer steals the round.

## Modes

- **Classic**: the imposter knows and only sees a one-word hint that fits both words of the pair (e.g. "Street snack" for Momo / Chowmein). No chit shows the pack name.
- **Sneaky**: the imposter gets a close twin word (Momo vs Chowmein, Tiger vs Leopard) and does not know they are the imposter.

## Points

| Result | Points |
| --- | --- |
| Crew catches the imposter and the guess is wrong | +1 for each crew member |
| Imposter not caught | +2 imposter |
| Imposter caught but guesses the word | +3 imposter |

## Content

8 packs, 98 word pairs, all in English and Nepali: Food, Places, School, Festivals, Online, Animals, Sports, At home. Edit `js/words.js` to add more; each entry is `[English, Nepali, twin English, twin Nepali, hint English, hint Nepali]`. The hint must fit both words.

## Features

- English and Nepali (EN / ने toggle, remembers your choice)
- Synthesised sound (heartbeat, drum roll, stamp, adaptive discussion music), haptics, mute button
- Story image (1080×1920) of the round result to share on Instagram or TikTok
- Names, packs and mode are remembered; screen stays awake during a game
- Works offline as an installable PWA (needs `http://`, not `file://`)

## Code

```
index.html      all screens
style.css       notebook-paper look
js/words.js     word packs
js/rules.js     pure rules (no DOM), testable in Node
js/main.js      screen flow, hold buttons, timers, effects
js/audio.js     Web Audio synth
js/share.js     story image
js/i18n.js      English + Nepali copy
```

Native ES modules, so serve it over http (`python -m http.server` from the repo root).

## Credits

Fonts: Anton, Mukta, Kalam (SIL Open Font License). © 2026 Aabhash Shahi.
