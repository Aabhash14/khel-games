# Know Me

**Status:** Playable

Open a pack, answer 8 quick questions, pull your holo personality card. Then dare your friends to guess your answers.

For teens, in English and Nepali. Plain HTML, CSS and JavaScript: no framework, no build step, no backend. Free to host (any static host, e.g. Cloudflare Pages).

## How it plays

1. **Tear open the pack.** 8 questions, 2 per trait, drawn from a pool of 36, so a new pack gives new questions.
2. **Answer 8 cards.** Each answer fills one album slot with the colour of the trait it leans to.
3. **Pull your card.** One of 16 types as a holo trading card: name, card number, art, tagline and 4 trait stats. Tap to flip it; drag it (or tilt the phone) to move the foil. Below it: a superpower and a weakness.
4. **Save for your story.** Draws a 1080x1920 PNG of your card. On phones it opens the share sheet (Instagram, TikTok…); on computers it downloads.
5. **Send a challenge.** Type your first name to get a link. Friends see your card face down and guess your 8 picks: exact pick **+2**, same lean **+1**. Then they can get their own card and see a match % with you.

## Traits

| Trait | Poles | Card art |
|---|---|---|
| Drive | Bold / Steady | starburst / circle |
| Energy | Social / Solo | dot cluster / ringed dot |
| Compass | Head / Heart | triangle / heart |
| Pace | Planner / Flow | straight stripes / waves |

Shape size follows how strong the trait is; positions come from a seed made from your answers, so the same answers always draw the same card.

## Files

- `data.js`: all text in English and Nepali (`[en, ne]` pairs): questions, 16 types, match lines, score tiers, UI. **Never renumber scenario `id`s**: challenge links store them.
- `game.js`: screens, scoring, card art (SVG on screen, canvas for the story image), challenge links.
- `style.css`: the card-album look. Colours are CSS variables at the top.
- `fonts/`: Anton (display, Latin) and Mukta (body, Latin + Devanagari), self-hosted. OFL licence in `fonts/OFL.txt`.
- `PRODUCT.md`: who the game is for and what must stay true.

## Notes

- Challenge links hold the name, question ids and answers in the URL hash, lightly scrambled. It stops casual peeking, not someone determined.
- Saved on the device only (localStorage): last card, language, your name, challenge scores.
- Just for fun; not a real psychology test (the game says so on the home screen).
- Works offline after the first visit (network-first service worker).
- Old 12-question challenge links still work.
