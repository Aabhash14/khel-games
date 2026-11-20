# Lakhey Run (लाखे दौड)

A 3D endless runner set during Indra Jatra. You are a Newar kid who dared to tease Majipa Lakhey, and now he is chasing you through old Kathmandu at dusk. Pick your runner: a boy in tapālan, black waistcoat, patuka and Bhaktapur topi, or a girl in haku patasi (black sari with a red border), red blouse, shawl, white patuka and flowers in her bun.

## Play

- Swipe left / right: change lane. At a corner, swipe the way the road turns.
- Swipe up: jump clay pots and bamboo poles. Swipe down: slide under marigold torans.
- Carts, cows and stone lions block a lane: go around them (a well-timed jump clears a cow).
- Hitting a pot, pole or garland makes you stumble and the Lakhey catches up. Stumble again while he is close and he grabs you. Running head-on into a cart or lion, or missing a corner, ends the run.
- Mohar (gold coins) fill the **Jatra** meter. When it is full, tap Jatra (or press N) for a 6.5 s rush: faster, unstoppable, pulls in mohar.
- Pickups: **Dhime** drum (mohar fly to you), **Bhusya** cymbals (double score), **Chamar** yak-tail whisk (survive one hit), **Yomari** (kept between runs).
- Forks: pick **Sun Gali** (more mohar, more obstacles) or **Mandir Bato** (a power-up is guaranteed, better Yomari odds).
- Getting caught: eat Yomari to keep running (1, then 2, then 4). Buy Yomari at the stall for 300 mohar.
- **Daily run**: everyone gets the same streets that day. Results can be shared as a 1080 × 1920 story image.
- Keyboard: arrows or WASD, Space to jump, N for Jatra rush, P to pause.

## How it is made

- `three.js` r149 (vendored in `js/vendor`, MIT). Plain scripts, no build step, no image or model files: every mesh is built from primitives and every texture is painted on a canvas at load time (`js/tex.js`).
- `js/chars.js`: the Lakhey (glossy red mask with flame brows, gold nose, fangs, green earrings; shaggy red mane; gold brocade top, marigold garland, red sash, belt of brass bells, gold-hemmed skirt, two tie-dyed scarves), following photos of Majipa Lakhey at Indra Jatra, and the two Newar runners. Parts are merged per bone, so each character is a handful of draw calls.
- `js/world.js`: Newari houses (brick, carved lattice windows, struts, deep tiled eaves), tiered pagodas with gilded finials, stone lions, chaityas, bunting, lanterns, onlookers, pigeons, obstacles, pickups. Static pieces are merged per material per street segment.
- `js/game.js`: segments joined by square chowks (left, right or fork), physics, collisions, chase camera, particles.
- Performance: no shadow maps (soft blob shadows), Lambert lighting for scenery, merged meshes, streets ahead built a few pieces per frame (no hitches), and a render resolution that adapts to hold 60 fps.
- Test hooks: `LR.G.manual = true` stops the loop; `LR.G.step(dt, n, draw)` and `LR.G.swipe(dir)` drive it; `LR.G._dbg` exposes state.
- `js/audio.js`: synthesised dhime drums, bhusya cymbals and bansuri; tempo follows running speed.
- Saved locally (`localStorage` key `lakhey-run-v1`): best score, daily best, mohar, Yomari, language, sound.

When shipping changes, bump `CACHE` in `sw.js` and the `?v=` numbers in `index.html` together.
