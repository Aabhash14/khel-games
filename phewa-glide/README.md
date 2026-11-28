# Phewa Glide (फेवा उडान)

A 3D paragliding game over Pokhara. Run off the Sarangkot launch, climb in thermals with the circling vultures, soar the ridge when the lake breeze blows, fly through prayer-flag rings over Phewa Lake, Tal Barahi and the World Peace Pagoda, then flare onto the landing target at Lakeside.

## Play

- **Drag** anywhere (or ← → / A D) to turn. The glider banks into the turn and the pilot leans.
- **Drag up** (↑ / W) for speed bar: faster, but you sink more. Speed bar plus a hard turn is a spiral dive, for losing height fast.
- **Drag down** (↓ / S) for brakes: slower. Brake when your feet are 2–4 m above the grass to **flare**: the speed you bleed off cushions the touchdown (+200).
- **Thermals**: where the vultures circle and a cumulus sits on top. Circle inside to climb; the vario beeps faster as you go up. There's sinking air around their edges.
- **Ridge lift**: on windy flights the breeze hits Sarangkot's south face; fly along it at about 100 m above the slope.
- **Rings** score 100 each; taking them in order builds a chain bonus. The gold arrow points to the next ring, then to the landing.
- **Landing**: bullseye +500, target +350/+250, field up to +150, anywhere else +25. Water and trees score nothing (the boatmen fish you out). Hard landings lose 100. Air time adds up to 200.
- Flights: **Morning breeze** (easy, strong thermals), **Midday tour** (to the Peace Pagoda and back), **Golden hour** (ridge soaring, weaker air, sunset). Each unlocks after a star on the previous one. **Daily flight**: a seeded course and sky, the same for everyone that day.
- Wings: Lali, Himal, Dhaka (a dhaka-topi weave) and Saanjh.
- P or Esc pauses.

## How it is made

- `three.js` r149 (vendored in `js/vendor`, MIT). Plain scripts, no build step, no image or model files. Every mesh is built in code and every texture is painted on a canvas at load time.
- `js/world.js`: a 300 × 300 heightfield valley (Sarangkot ridge, Raniban ridge, rice terraces in the terrain shader, the lake basin, a flattened landing field and launch ramp); the Annapurna range and Machhapuchhre on a 30 km ring of far land; a sky shader with shared haze; Phewa Lake with a planar mirror reflection; instanced forests, Lakeside houses (with black rooftop water tanks), crowd, vultures, prayer flags and billboard cumulus (one draw call, sorted back to front); Tal Barahi, the stupa, the launch tea stall and tower, the target, windsock and a light pillar over the landing.
- `js/chars.js`: the canopy is built cell by cell with an airfoil profile. It flexes, the braked side's trailing edge drops, it swings up from the grass on launch and collapses after landing. Lines run from the risers to the swinging pilot, and the pilot's arms, legs, head and pose follow the controls (seated, speed bar, legs down for landing, running, cheering).
- `js/game.js`: flight model (airspeed lag, sink polar, bank-driven turn rate, sink in turns, spiral dive, a flare cushion in ground effect), thermals that lean with the wind, ridge lift from the terrain slope, ring planning from the glide ratio so every course is flyable, the daily course generator, AI pilots (thermalling and ridge soaring), chase camera, launch and landing sequences.
- Simulation time runs 2.7× real time, so a flight takes a few minutes; displayed speeds and climb rates are what you see on screen.
- Performance: instancing everywhere, no shadow maps (the wing's shadow is cast along the sun in the terrain shader), a reflection pass every other frame, and resolution, then reflections, that step down if frames run long.
- Dev: `?fly=0|1|2|daily` jumps straight into a flight; add `&ff=12` to fast-forward 12 seconds. `PG.G.manual = true` stops the loop; `PG.G.step(dt, n, draw)` drives it; `PG.G._dbg` exposes state.
- Saved locally (`localStorage` key `phewa-glide-v1`): stars and bests per flight, daily best, wing, language, sound.

When shipping changes, bump `CACHE` in `sw.js` and the `?v=` numbers in `index.html` together.
