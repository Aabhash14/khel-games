# Pro Scout

**Status:** Playable

A guess-the-athlete quiz built around one decision: **answer now for more points, or buy another clue?**
157 athletes from 16 sports (football, basketball, tennis, cricket incl. Nepal, F1, athletics and more).

Plain HTML, CSS and JavaScript: no framework, no build step, no backend. Free to host.

## Categories (14 + Quick Mix + Daily)

| Category | You see | You guess |
|---|---|---|
| Face Reveal | One window of the face (eyes, hair or smile), then a second, then the whole face | Who it is |
| Footballer Photo | Same, footballers only | Who it is |
| Which Sport? | Photo with a sticker over the face, then without | Their sport |
| Who Am I? | Two written clues, then a third, then the giveaway | Who it is |
| Career Path | Half the club path, then all of it | Whose career |
| First Club | Name + photo | First senior club / team |
| Flag Them | Name + photo | Country |
| Nickname | "The Black Mamba" | Who it is |
| Odd One Out | Four names | The one who doesn't share the link (country, club, or birth decade) |
| Club Connection | A club | Which of four played there |
| Who's Older? | Two athletes | The older one |
| Birth Year | Name + photo | Year born |
| Shirt Number | Name + photo | Iconic number |
| Position | Footballer | GK / DF / MF / FW |

## Scoring

- 300 on the first clue, 200 after one extra clue, 100 after two (Who's Older and Position: 200 / 100).
- **Hot streak**: 3 right in a row +50, 4 +100, 5 or more +150 each.
- **Final bet**: before question 10 you see its category and stake any part of your score (at least 300 is always allowed). Right = win the stake, wrong = lose it, and each clue halves the win. Double down and 50:50 are off for this one.
- **Double down** (2 per round): double points if right, lose the points if wrong.
- **50:50** (1 per round): removes two wrong answers.
- Correct answers put the player's card in your **sticker album**; first-clue answers without 50:50 earn a **gold** card.

## Sharing

- **Daily Scout**: 10 categories, same questions for everyone that day (seeded by date). Result is saved once per day.
- **Challenge a friend**: every result makes a link (`?cat=…&seed=…&score=…&by=…`) that gives your friend the exact same 10 questions and shows your score to beat.

Keys: `1`–`4` answer, `R` next clue, `D` double down, `F` 50:50, `Enter` next.

## Data and photos

- Player facts live in `data.js`. They're mostly things that don't change (country, birth year, first club, nickname). Career paths are as of mid-2026 and were checked against Wikipedia in November 2026. When a player moves, add the new club to the end of their `path`.
- `also` lists loan clubs. They're never shown, but they stop "Club Connection" and "Odd One Out" from offering a player who actually did play there as a wrong answer.
- `faces.js` pins one Wikimedia photo per player and stores where the eyes, nose and mouth are (found offline with OpenCV's YuNet face detector, November 2026). The face rounds cut their eye / hair / smile windows from those points, and every portrait is cropped to the head so shirt numbers don't give answers away. Five players (tiny faces or a group photo) have no face points and are left out of the face rounds.
- Photos load from upload.wikimedia.org, so they need an internet connection. If a pinned photo ever disappears, the game falls back to the player's current Wikipedia page image (via the REST API) and leaves them out of the face rounds. After each answer the game links to the photo's Wikimedia Commons page, which shows its author and licence.
- To add a player: add them to `data.js`, then regenerate `faces.js` (or add an entry with just `u`, `W`, `H` to use a photo without face rounds).
- Flags: flagcdn.com. Font: Archivo (Google Fonts).

## Run locally

From the `play` folder:

```bash
python -m http.server 8000
# open http://localhost:8000/pro-scout/
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Screens: home, loading, play, result, album |
| `style.css` | Sticker-album look |
| `data.js` | Players, sports, countries |
| `faces.js` | Pinned photo per player + face landmark positions (generated) |
| `game.js` | Question generators, clue ladder, face windows, scoring, final bet, album, daily/challenge, sound |
| `sw.js` | Offline app shell (network first) |
| `manifest.webmanifest`, `icon.svg` | Install to home screen |
