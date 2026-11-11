# Khel · खेल

Small, free browser games, shelved as boxes on one landing page. Turn a box over, then play.
No accounts, no installs, no build step. Everything is plain HTML, CSS and JavaScript, and most games work offline as installable PWAs.

Made by **Aabhash Shahi**.

## The games

| Game | What you do | Folder |
| --- | --- | --- |
| Mol-Molai (मोलमोलाई) | Haggle, bluff and read shopkeepers' faces in Asan bazaar | `nepali-games/mol-molai` |
| Bato Harayo (बाटो हरायो) | Lost on a dark road. Ask strangers the way, not everyone tells the truth | `nepali-games/bato-harayo` |
| Indra Jatra (इन्द्रजात्रा) | Eight days of Yenya: raise the Yosin, carry Aji's flame, dare Majipa Lakhey, drive Kumari's chariot | `nepali-games/indra-jatra` |
| Changa Chet (चङ्गा चेट) | Dashain kite fight over Kathmandu rooftops | `nepali-games/changa-chet` |
| Himal Climb (हिमाल चढाइ) | Climb the 10 highest mountains on their real routes | `nepali-games/himal-climb` |
| Bagh-Chal (बाघ चाल) | The traditional Nepali tiger and goats board game | `nepali-games/bagh-chal` |
| Momo Rush (मःम रश) | Momo shop rush | `nepali-games/momo-rush` |
| Tihar Diyo (तिहार दियो) | Light the diyos for Tihar | `nepali-games/tihar-diyo` |
| Know Me | Open a pack, pull your personality card, dare friends to guess your answers | `know-me` |
| Pro Scout | Guess the athlete from a pixelated photo, career path, nickname or flag | `pro-scout` |
| Orbit Switch | One-button arcade: switch orbits, dodge blocks, grab stars | `orbit-switch` |

Several games are English and Nepali (use the EN / ने toggle). Each game folder has its own README with details.
Some folders (Bagh-Chal, Momo Rush, Tihar Diyo) currently hold only a README.

## Run locally

Any static server works, for example:

```sh
python -m http.server 8765
```

Then open <http://localhost:8765/>. Opening `index.html` straight from disk also works for most games, but service workers and installing as an app need `http://`.

## Layout

```
index.html        landing page (the shelf of boxes)
assets/           landing page CSS, JS, fonts and box art
nepali-games/     games with a Nepali theme
know-me/  pro-scout/  orbit-switch/   other games
DESIGN.md  PRODUCT.md                 design system and product notes
```

## Hosting

Static files only, so any free static host works (Cloudflare Pages, GitHub Pages, Netlify).

## Credits

Fonts: Anton, Mukta and Pacifico (SIL Open Font License). © 2026 Aabhash Shahi.
