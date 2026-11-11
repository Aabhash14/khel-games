# Himal Climb (हिमाल चढाइ)

**Status:** Playable

Climb the 10 highest mountains on Earth, one level each, from the lowest (Annapurna I, 8,091 m) to the highest (Sagarmatha / Everest, 8,849 m). Every level follows the mountain's real standard route with its usual camp heights and named stretches: icefalls crossed on ladders, rock bands, couloirs, the death zone above 8,000 m, oxygen bottles, and a night summit push that ends at sunrise. Summit a mountain to unlock the next one. Each run ends at the summit: the challenge is to get there, and then to get there faster.

Plain HTML, CSS and JavaScript: no framework, no build step, no audio or image files. Free to host.

## Levels

Levels get longer and harder as the mountains get taller: more taps to the top, fewer and crumblier holds, more falling ice and rock, and faster strength drain.

| Level | Mountain | Height | Rank | Where | Route | Stretches you climb through |
|---|---|---|---|---|---|---|
| 1 | Annapurna I | 8,091 m | 10th | Nepal | North Face | North Annapurna Glacier, crevasse field, Dutch Rib, under the Sickle, North Face, summit ridge |
| 2 | Nanga Parbat | 8,126 m | 9th | Pakistan | Kinshofer Route | Diamir Glacier, Diamir Face, Kinshofer Wall, Bazhin Basin, summit pyramid |
| 3 | Manaslu | 8,163 m | 8th | Nepal | Northeast Face | Manaslu Glacier, Manaslu Icefall, summit plateau, summit pinnacle |
| 4 | Dhaulagiri I | 8,167 m | 7th | Nepal | Northeast Ridge | Chhonbardan Glacier, Dhaulagiri Icefall, Northeast Col, Northeast Ridge, summit couloir |
| 5 | Cho Oyu | 8,188 m | 6th | Nepal–China | Northwest Ridge | Gyabrag Glacier, scree slope, ice cliff, Yellow Band, summit plateau |
| 6 | Makalu | 8,485 m | 5th | Nepal–China | Northwest Ridge | Barun Glacier, crevasse field, ice headwall, Makalu La, French Couloir |
| 7 | Lhotse | 8,516 m | 4th | Nepal–China | West Face | Khumbu Icefall, Western Cwm, Lhotse Face, Lhotse Couloir |
| 8 | Kangchenjunga | 8,586 m | 3rd | Nepal–India | Southwest Face | Yalung Glacier, lower and upper icefalls, Great Shelf, the Gangway, summit rocks (you stop just below the top, by the tradition kept since 1955) |
| 9 | K2 | 8,611 m | 2nd | Pakistan–China | Abruzzi Spur | Godwin-Austen Glacier, House's Chimney, Black Pyramid, the Shoulder, the Bottleneck, the Traverse |
| 10 | Sagarmatha (Everest) | 8,849 m | 1st | Nepal–China | South Col Route | Khumbu Icefall, Western Cwm, Lhotse Face, Yellow Band, Geneva Spur, the Balcony (oxygen stash), South Summit, Hillary Step |

Camp heights vary between sources and seasons. The game uses commonly quoted values (for example Everest: Base Camp 5,364 m, Camp 1 6,065 m, Camp 2 6,400 m, Camp 3 7,162 m, Camp 4 7,950 m).

## How to play

| Action | Touch | Mouse | Keyboard |
|---|---|---|---|
| Pick a mountain | Tap a peak in the menu | Click a peak | ← → on the peaks |
| Climb into a column | Tap the column (or the ↖ ↑ ↗ buttons) | Click the column | ← ↑ → (also A W D, J K L, 1 2 3) |
| Pause | – | – | Esc or P (also pauses when you switch tabs) |
| Mute | Speaker button | Speaker button | M |

- **Solid holds** are safe: brown rock holds on rock, kicked steps (dark notches with a white lip) on snow and ice. **Ladders** are the only way across a crevasse.
- **Bare wall** and **grey cracked holds** (orange cracks) make you slip and cost strength.
- **Falling ice and rock:** a yellow ⚠ and a red column warn you first. Move to another column. The game always leaves you a safe hold to escape to, and nothing falls while you are near a ladder.
- **Strength (बल)** drains all the time, faster as the air gets thinner. Each step gives a little back, except above 8,000 m (the death zone), where the body can no longer recover.
- **Nun chiya (butter tea)** cups give +30 strength below the oxygen camp. **Camps** give +40.
- **Oxygen (O₂):** starts at the first camp at 7,000 m or higher, with a fresh bottle at every camp after that (and at Everest's Balcony). Bottles left on the route give +60 O₂ and +15 strength. While you have oxygen, the thin air drains you half as fast. Without it, the edges of your vision close in.
- The last camp is where the summit push starts, at night by headlamp. The sun rises on the way up.
- If your strength runs out, your Sherpa helps you back down and the run ends.

## Features

- 10 real mountains, each with its own route, camps, ground types, hazards and skyline
- Mountain picker in the menu: 10 peaks that get taller, locked until you summit the one before; finished peaks turn blue
- Best height and fastest summit time saved per mountain; "Next" button after each summit
- Ground types: moraine, icefall seracs, snow, blue ice, yellow limestone, dark rock
- The yellow fixed rope runs from base camp to the top, and the climber stays clipped to it; crampons and an ice axe on snow and ice, an oxygen cylinder and hose on oxygen
- Night summit push (stars, headlamp), sunrise, deep-blue morning sky on top
- Jet-stream wind and heavy breathing on summit day
- Tents and prayer flags at every camp, the flag of Nepal on the summit
- Sound generated in code: mountain wind, singing bowl at camps, bansuri-style tunes
- Nepali / English toggle (Nepali uses Devanagari digits)
- Works offline and can be installed to a phone's home screen

## Run locally

From the `play` folder:

```bash
python -m http.server 8000
# open http://localhost:8000/nepali-games/himal-climb/
```

Or double-click `index.html` (everything works except offline mode).

For testing, add `?all` to the address (`.../himal-climb/?all`) to open every mountain without saving the unlocks.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page, menu with mountain picker, game-over card |
| `style.css` | Card/menu styling (shared look with the other Nepali games) and the picker |
| `game.js` | The whole game: mountain and route data, levels, wall generation, climbing, hazards, oxygen, scenery, sound, language |
| `sw.js` | Offline support (network first: players always get the newest version when online) |
| `manifest.webmanifest`, `icon.svg` | Install-to-home-screen support |

Saved in the browser: `hc_prog` (unlocked levels and per-mountain records), `hc_level` (last mountain picked), `hc_lang`, `hc_muted`.

## Tuning

All mountain data is in `MOUNTAINS` at the top of `game.js`. Per mountain: `start` (starting height), `camps`, `sections` (from height, ground, hazard rate, crevasse rate, names), `marks` (extra ledges, Everest only) and the difficulty knobs:

- `rows`: taps from start to summit (200 on Annapurna up to 770 on Everest)
- `dmax`: how sparse and crumbly the holds get by the top
- `haz`: overall rate of falling ice and rock
- `drain`: how fast strength drains (0.7 on Annapurna up to 1 on K2 and Everest)

Tested with simulated players (summit rate):

| Player | Annapurna | Dhaulagiri | Cho Oyu | Makalu | Lhotse | Kangchenjunga | K2 | Everest |
|---|---|---|---|---|---|---|---|---|
| Casual | ~40% | ~0% | 0% | 0% | 0% | 0% | 0% | 0% |
| Average | ~100% | ~75% | ~65% | ~20% | 0% | 0% | 0% | 0% |
| Good | 100% | ~98% | ~97% | ~90% | ~65% | ~20% | ~3% | 0% |
| Expert | 100% | 100% | 100% | ~100% | ~90% | ~85% | ~45% | ~45% |

Other numbers in `game.js`:

- `update()`: drain `1.6 + 6 × altitude share` per second × the mountain's `drain`; ×0.5 on oxygen, ×1.1 without above the oxygen camp; a bottle lasts about 45 s
- `step()`: +0.6 strength per step below 8,000 m; tea +30; oxygen bottle +60 O₂ and +15 strength
- `slip()`: −6 strength; `rockHit()`: −20 strength and knocked down 2 rows
- `genRow()`: holds per row, cracked-hold rate, tea and oxygen spacing, crevasses
- `updateRocks()`: falling ice and rock frequency (× section and mountain `haz`) and warning time
