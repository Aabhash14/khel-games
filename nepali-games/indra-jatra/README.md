# Indra Jatra · इन्द्रजात्रा

Eight days of Yenya (येँया) in Kathmandu, played hands-on. Balance the Yosin against the wind with two thumbs, carry Aji's flame on the Upaku walk, dare Majipa Lakhey in real time, and drive Kumari's heavy chariot through the lanes of the lower town. Nepali first, with an English toggle.

Hook: **Raise the Yosin, dare the Lakhey, drive Kumari's chariot. How many lamps can you light this Yenya?**
हुक: **योसिं ठड्याऊ, लाखेलाई जिस्क्याऊ, कुमारीको रथ डोर्‍याऊ। यो येँयामा कति दियो बाल्न सक्छौ?**

## Chapters

| # | Chapter | Controls | What makes it tense |
|---|---|---|---|
| 1 | Raise the Yosin · योसिं ठड्याउने (Day 1, Hanuman Dhoka) | Hold **Left rope** and **Right rope** (two thumbs, or ← →) | Both ropes lift; one rope tips the pole. It is an inverted pendulum: the higher it stands, the more it wants to fall. Gusts are announced by a wall of dust and flapping flags 1.7 s ahead. Beat the astrologer's sait (34 s). Too far and the elders stop the pull. |
| 2 | The Upaku walk · उपाकु वनेगु (Day 1, evening) | Hold **Walk**, hold **Cover** in the wind, hold **Light** at shrines | No score, on purpose. A first-person walk through real photographs: the night street at Basantapur (the camera dollies forward as you walk), then a real photo of each of the six shrines (Ashok Binayak, Jaisidewal, Lagan, Akash Bhairav, Jana Baha, Annapurna in Asan). You carry a brass thali with Aji's diyo; Aama and Bhai walk beside you as silhouettes. Cover the flame in the wind; a memory of Aji at each shrine. Music: a real Newar bansuri ensemble. |
| 3 | Lakhey · लाखे (Asan, Indrachowk, Maru) | Hold **Forward** / **Back**, tap **Lakhey!** to taunt | Nerve builds faster the closer you stand, but is only kept once you're back in the crowd. He warns before every lunge (a stare with the drums cut out, or stamping with the drums racing), and sometimes the warning is a bluff. Taunting multiplies your nerve and makes him angrier. Pulukisi may charge through. |
| 4 | Kumari Jatra · कुमारी जात्रा (Kwaneya route) | Hold **Pull**, **Brake**, wheel levers **Left** / **Right** | A top-down drive. The chariot gathers speed slowly and drifts to the outside of bends; scrape the walls and you lose time. Stay behind Bhairav's chariot: too close and you hit it, too far and the crowd floods the road. Crawl through crowds on the road, stop for offerings for Kumari's blessing, be home by 7 pm. |
| 5 | The last nights · जात्राको अन्त्य | Tap **Catch** | Catch the lucky fish in Swet Bhairav's jaand, watch Dagin's procession, see the Yosin come down, make your 1080×1920 story card. |

Chapters 1, 3 and 4 light up to 3 lamps each (9 in total). The card title comes from the total. Twelve **Jatra notes** unlock along the way.

## Balance (simulated, 300 runs per bot, human-speed reactions)

| Chapter | Careless | Decent | Skilled |
|---|---|---|---|
| Yosin | random presses: 1.0 | hold both, correct late: 1.5 | quick corrections: 2.5 |
| Lakhey | never retreat: 1.0 | read his signs: 1.9 | read signs and taunt: 3.0 |
| Kumari Jatra | hold Pull only: 1.0 | drive well, ignore crowds: 1.0 | drive well, slow for crowds, stop for offerings: 3.0 |

## Living photos

Real photographs of Indra Jatra from Wikimedia Commons (11 photos, 1.6 MB as WebP; credits in `photos/CREDITS.md` and in-game under Jatra notes) are brought to life by a small WebGL renderer (`js/core/photo.js`):

- **Depth:** each photo has a hand-marked depth layout (a horizon gradient plus subject blobs: the Lakhey's mask, the Yosin, the crowd). Tilting the phone or moving the mouse shifts near layers more than far ones, so the photo feels three-dimensional.
- **Motion and light:** slow Ken Burns camera moves, crossfades, lamplight flicker, film grain and a vignette. There are colour grades for chapter openings, night scenes, and dimmed, softly blurred backdrops behind gameplay.
- **Where they appear:** a slideshow on the menu, a photo behind every chapter opening and result, and backdrops behind play. Those are Durbar Square's crowd for the Yosin, Basantapur at night for Upaku, Hanuman Dhoka at night for Lakhey, and **the real Swet Bhairav mask** in the finale, with the jaand pipe drawn from his actual mouth. The chariot drive stays top-down without a photo.
- **The share card** uses a real photo of the Yosin over the crowd, with the photographer's credit printed on it.
- **Fallbacks and accessibility:** without WebGL a plain 2D version is used. Reduced-motion settings switch off parallax and flicker.
- **Who is shown:** photos where the living goddess Kumari, or the boys who embody Ganesh and Bhairav, can be identified are deliberately not used.

## Sound

**Real recordings** (in `sounds/`, credits in `sounds/CREDITS.md` and in-game under Jatra notes):
- A real **Indra Jatra 2010** evening recording near Hanuman Dhoka, with neighbours dancing in a courtyard (Benbojangles, CC BY-NC 4.0). This is the music bed in every chapter except Upaku.
- **Kathmandu Durbar Square** in the evening: market, puja, children (LukeIRL, CC BY 4.0). The crowd for the Yosin, Lakhey and the chariot.
- **Patan Durbar Square** in the evening, with temple bells and a conch (soundandmelodies, CC0). The ambience for the Upaku walk, the menu and the finale.
- A **Newar bansuri (flute) ensemble with dhime**, performed in Newari dress in Lalitpur (Janak Bhatta, Wikimedia Commons, CC BY-SA 4.0; audio taken from the video). The music of the Upaku walk and Dagin's procession.

The recordings react to play: the music opens up and gets louder as tension rises, Lakhey's stare ducks it, and his stamping speeds it up. Loops are crossfaded so there's no seam. The Indra Jatra recording is **non-commercial**: remove it if the game is ever monetised.

**Synthesised on top** (Web Audio, `js/core/audio.js`): the rope crew's chant, wood creaks, scrapes, heartbeats, ghungru, temple bells, cheers and gasps. If a recording can't load, a synthesised dhime/bhusya/horn/reed ensemble plays instead.

## Code

Plain ES modules, no build step. Serve the folder over http (it will not run from `file://`).

```
index.html, style.css, sw.js, manifest.webmanifest, icon.svg, fonts/, sounds/, photos/
js/
  main.js              boot, scene registry, pause on hide/Escape
  core/   engine.js    game loop, scene switching, slow motion
          input.js     touch buttons + keyboard as named actions (held / tapped)
          audio.js     synth instruments, sequencer, ambience, effects
          fx.js        particles, camera shake, flash, vignette
          photo.js     WebGL living photos: depth parallax, camera moves, grading
          ui.js        HUD chips, subtitles, thumb controls, banners, sheets
          i18n.js      Nepali/English words, Devanagari digits, clock times
          store.js     progress in localStorage (works when storage is blocked)
  rules/  yosin.js, lakhey.js, rath.js, rand.js   pure game rules, testable in Node
  art/    side.js      side-view painter: houses, pagodas, Yosin, Lakhey, chariots, Kumari
          top.js       top-down painter: rooftops, temples, chariots, crowds
  scenes/ menu, yosin, upaku, lakhey, rath, finale, card, common (intro, pause, results)
  data/   strings.js   every word, the Jatra notes, chapter order
          credits.js   recording and photo credits shown in the game
```

Rules never touch the DOM or canvas, so balance is tested by running bots against `js/rules/*` in Node.

## Culture: what the game shows

- **Yosin (lingo)** from the forest at Nala, raised before Hanuman Dhoka with Indra's flag; it comes down on the last day.
- **Eight days**, Bhadra Shukla Dwadashi to Ashwin Krishna Chaturthi.
- **Upaku wanegu**: families who lost someone that year walk the old city with incense and lamps.
- **The legend** of Indra caught stealing parijat flowers, and of his mother **Dagin**, who takes the year's dead with her.
- **Majipa Lakhey**, **Pulukisi**, **Akash Bhairav** and **Swet Bhairav** with jaand flowing from his mouth.
- **Kumari Jatra**: three chariots in order (Ganesh, Bhairav, Kumari); Kumari is carried so her feet never touch the ground; offerings along the route.

### Simplifications (on purpose)

- The Kwaneya route's order of places is kept (Hanuman Dhoka, Maru, Chikanmugal, Jaisidewal, Lagan, Hyumat, Bhimsenthan, Maru, home), but the street geometry is simplified. The 7 pm target is a game goal, not the real schedule. In reality the chariots are pulled by large crowds at walking pace.
- The six Upaku stops are well-known old-city shrines, not a claim about any family's exact route.
- Kumari, Ganesh and Bhairav appear only as small, generic, respectful figures. No real Kumari is depicted.
- Upaku has no score: scoring a walk of remembrance would be wrong.

Fonts: Mukta (SIL OFL, `fonts/OFL.txt`).
