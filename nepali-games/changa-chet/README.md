# Changa Chet (चङ्गा चेट)

**Status:** Playable

Dashain kite fight over the Kathmandu rooftops. Steer your kite, cross a rival's string and saw back and forth to cut it. **चेट!**

Plain HTML, CSS and JavaScript: no framework, no build step, no audio or image files. Free to host.

## How to play

| Action | Touch | Mouse | Keyboard |
|---|---|---|---|
| Steer your kite | Drag anywhere (kite follows your finger's movement) | Move the mouse | Arrow keys / WASD |
| Cut a rival | Cross their string, then saw fast | same | same |
| Pause | – | – | Esc or P (also pauses when you switch tabs) |
| Mute | Speaker button | Speaker button | M |

- **Duel bar:** appears where strings cross. Red (left) = how close you are to cutting them. Their colour (right) = wear on your string.
- **String (धागो) meter:** every duel wears your string down. It recovers slowly when you're not fighting. At zero, your kite is cut.
- **Catch them off guard:** a rival that isn't actively sawing does half the damage.
- **Manja spool (gold):** gives a fresh string and a sharper cut for 8 seconds.
- **Birds** knock your kite off course for a moment.
- Rivals get more skilled and more numerous as your score goes up (up to 4 at once).

## Features

- Kathmandu skyline: brick houses with black water tanks, a pagoda, a stupa with prayer flags, snowy Himalaya
- Sky slowly shifts from day to golden evening
- Madal-style beat and an original bansuri-style tune, all generated in code
- Nepali / English toggle (Nepali uses Devanagari digits)
- Works offline and can be installed to a phone's home screen
- Best score saved in the browser

## Run locally

From the `play` folder:

```bash
python -m http.server 8000
# open http://localhost:8000/nepali-games/changa-chet/
```

Or double-click `index.html` (everything works except offline mode).

## Files

| File | Purpose |
|---|---|
| `index.html` | Page, menu and game-over cards |
| `style.css` | Card/menu styling (Nepal flag + prayer flag palette, dhaka band) |
| `game.js` | The whole game: physics, rivals, scenery, sound, language |
| `sw.js` | Offline support (network first: players always get the newest version when online) |
| `manifest.webmanifest`, `icon.svg` | Install-to-home-screen support |

## Tuning

The main balance numbers are in `game.js`:

- `engage()`: your cut rate (`mine`), rival damage (`theirs`), string recovery (`fray - 0.1 * dt`)
- `spawnRival()`: rival skill curve
- `maxRivals()`: how many rivals fly at once
- `updatePickup()`: how often manja appears
