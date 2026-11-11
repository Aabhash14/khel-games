# Bato Harayo (बाटो हरायो)

**Status:** Playable

A night-time story game. The last bus dropped you at the wrong stop, your phone is dead, and it's pitch dark. Find your way to your mamaghar (your maternal uncle's home) before morning by asking the strangers you meet, but not all of them tell the truth.

Plain HTML, CSS and JavaScript: no framework, no build step, no audio or image files. Free to host. Defaults to Nepali, with an English toggle on the menu.

## How to play

- Each place shows what you see, who you meet, and **your own thoughts (मनमा...)**, which often hint at who to trust.
- **Ask the way (बाटो सोध्ने)**, then choose a path. Paths are named by landmarks: the uphill path, the riverside path, the stone stairs, the path by the peepal tree...
- **"Are you sure?" (पक्का हो?)** can expose a joker. **Talk a little (गफ गर्ने)** reveals more about a person.
- **Memory (सम्झना)** lists everything people told you.
- Walking takes time and **strength (शक्ति)**. Dark places raise **fear (डर)**; too much fear and you panic and run blindly.
- Keyboard: number keys 1–9 pick a choice, M mutes.

## Your phone

Your phone is dead at the start. At a **tea shop** you can charge it (20 minutes, +12%), and the **truck driver** can top it up from his truck (+8%). Use the battery wisely:

- **Torch (टर्च):** halves the fear of dark places and stops you slipping, but drains 3% per walk.
- **Call Mama (मामालाई फोन):** 5% per call. Mama always knows the right path, but there is **no signal** in the forest, by the river or on the bridge, and 1 in 4 calls drops.

## Decisions on the road

Sometimes the road itself asks you to choose (each at most once per night):

| Situation | Choices |
|---|---|
| A little girl lost and crying | Help her home (35 min): her father gives you a real torch and the right way. Or walk past, and her crying stays with you. |
| A snake on the path | Wait quietly, toss a stone (it might rear up!), or push around through the thorns. |
| Sudden rain | Shelter under a tree (25 min) or keep walking soaked (strength). |
| Jackal eyes in the dark (after midnight) | Scare them with the torch (if you have light), shout, or back away the way you came. |

## Badges (पदक)

Nine badges are collected across nights and shown on the menu: home before midnight, kind heart (helped the girl), spotted the kichkandi (saw her feet and didn't follow), dog's best friend, hello Mama, riddle solved (took the jhankri's path), home without the phone, survived the night, and tea lover (tea at two shops).

## Voices

Conversations are two-way and spoken aloud: you ask ("नमस्ते! … जाने बाटो कता हो?"), they answer, and your inner thoughts are voiced too. Each person has their own voice (the old woman slow and gentle, the cowherd boy high and quick, the woman in white low and slow).

- Uses the browser's built-in speech (Web Speech API): free, no audio files, nothing extra to host.
- **Nepali:** Microsoft Edge has real Nepali voices. Chrome and others read the Nepali text with a Hindi voice. If no suitable voice exists, the game says so and stays silent.
- **English:** any English voice (an Indian English voice is preferred when available).
- The speech-bubble button (top right) turns voices on/off; the speaker button mutes everything.

## The people of the night

| Person | Can you trust them? |
|---|---|
| Old woman with a lantern (हजुरआमा) | Yes. Chat for roasted corn. |
| Grandfather with stories (हजुरबुबा) | Yes. Chat and he tells a folk tale with a warning about the woman in white. |
| Tea-shop didi (चिया पसलकी दिदी) | Yes. Free hot tea restores strength. |
| Porter with a doko (भरिया दाइ) | Yes, but only knows the next step. |
| Truck driver (ट्रक ड्राइभर) | Yes. |
| Sadhu baba (साधु बाबा) | Almost always. His tika calms your fear. |
| Jhankri with a drum (झाँक्री) | Yes, but answers in riddles about the landmarks. |
| Cowherd boy (गोठालो केटो) | Sometimes jokes. Watch for the giggle and ask "पक्का हो?" |
| Tipsy uncle (रक्सी खाएका काका) | No. His answer changes every time. |
| Woman in a white sari | Never. Talk to her and look at her feet. Following her leads you astray. |
| Scruffy dog (कुकुर) | Can't talk, but follow it and it leads you two steps toward the village. |

## Endings

- **घर पुगियो!** Reach home. ★★★ before 2:00 AM, ★★ before 3:30 AM, ★ before dawn.
- **बिहान भयो** Dawn breaks at 5:30 while you're still lost; a milkman walks you home.
- **थाकेर निदाइयो** Strength runs out and you fall asleep by the road until morning.

Every night is different: the map, the village and the people are randomly generated (about 19 places per night, home at least 4 steps away, always at least two honest helpers on the true route).

## Run locally

From the `play` folder:

```bash
python -m http.server 8000
# open http://localhost:8000/nepali-games/bato-harayo/
```

## Files

| File | Purpose |
|---|---|
| `index.html` | HUD, story panel, memory list, menu and ending cards |
| `style.css` | Collection card styling plus the night theme |
| `game.js` | Story content (both languages), map generation, choices, night scenes, sound |
| `sw.js` | Offline support (network first: players always get the newest version when online) |
| `manifest.webmanifest`, `icon.svg` | Install-to-home-screen support |

## Writing more story

All text lives near the top of `game.js` in `SCENES`, `PEOPLE`, `EVENTS`, `THOUGHTS`, `LINES` and `ENDINGS`, each with `ne` and `en`. To add a new person, add an entry to `PEOPLE` (pick a `kind`: honest, riddle, joker, drunk, liar, dog or sadhu), list the `scenes` they appear in, and add a cap in `PEOPLE_CAPS`. Their drawing goes in `drawPerson()`.
