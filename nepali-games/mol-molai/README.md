# Mol-Molai (मोलमोलाई)

**Status:** Playable

Dashain shopping in Asan bazaar, in 12 levels. Aama gives you money and a shopping list; buy everything and bring home at least the level's savings target before the bazaar closes. Haggle, bluff, read the shopkeepers' faces, and plan your route across the real streets of Asan.

Plain HTML, CSS and JavaScript: no framework, no build step, no audio or image files. Free to host. Defaults to Nepali, with an English toggle on the menu.

## Levels

The game is played level by level on a month sheet styled like a printed Nepali patro (wall calendar). Each level is a day-cell with its tithi in the corner (दशमी, Vijaya Dashami, printed red as on a real patro). Each level opens more of Asan, adds items, and teaches one new idea with a red **सुझाव (tip)** the first time it matters. Pass a level by buying everything and saving at least its target; more savings earn more stars, and passing unlocks the next level. Progress is saved in the browser.

| Level | Name | New idea | Open toles | Items | Bazaar open | ★ / ★★ / ★★★ (share of budget saved) |
|---|---|---|---|---|---|---|
| 1 | पहिलो मोल · First haggle | Naming your price | Asan Tol | 2 | 3 h | 8% / 22% / 30% |
| 2 | दुई पसल · Two shops | "The other shop said this" | + Kamalakshi | 3 | 3½ h | 10% / 22% / 29% |
| 3 | छोडेर हिँड्ने · Walk away | Being called back | + Bhotahity | 3 | 4 h | 12% / 20% / 25% |
| 4 | अनुहार पढ · Read the face | Tells | + Balkumari | 3 | 4½ h | 13% / 21% / 26% |
| 5 | झुटको खेल · Bluffing | Lies and reputation | + Kel Tol | 4 | 5 h | 14% / 21% / 26% |
| 6 | गफ · Small talk | Chatting | + Indra Chowk | 4 | 5½ h | 14% / 21% / 26% |
| 7 | खसी · The goat | Goats selling out | + Khula Manch | 4 (goat) | 6 h | 13% / 18% / 23% |
| 8 | पूरा असन · All of Asan | Route planning | + Bangemuda | 5 | 6 h | 15% / 20% / 25% |
| 9 | बदनाम · Bad name | Starting with a poor reputation | all | 5 | 5½ h | 15% / 20% / 25% |
| 10 | छोटो दिन · Short day | Little time | all | 5 | 4½ h | 16% / 21% / 26% |
| 11 | कडा पसले · Tough sellers | Higher lowest prices | all | 5 (goat) | 5 h | 14% / 18% / 22% |
| 12 | अन्तिम बजार · Last bazaar | Everything at once | all | 6 (goat) | 5 h | 15% / 19% / 22% |

## The look

Every screen is printed as a patro: two inks (vermilion and black) on white newsprint, ruled day-cells, and heavy Devanagari numerals in the self-hosted **Mukta** typeface. In play, a red band shows the level, with a strip for money, target, time left and your name in the bazaar. The price on the table sits in a red-headed box like the day's big date numeral. Your moves are day-cells (the main move in solid red), and every offer you and the shopkeeper made stays on the sheet, struck through. Numbers roll into place when they change; stars are stamped onto the result sheet.

## How to play

In a shop, pick an item. The shopkeeper names a price. Set your own price with the − / + buttons, then:

| Move | What happens |
|---|---|
| **Name my price** (मेरो दाम भन्ने) | They accept, or come down a little. Too low and they lose patience; very low is an insult. Going lower than your last offer annoys them. |
| **"The other shop said this"** (अर्को पसलमा यति भन्यो) | True if another shop really quoted you that price (or a friend bought it there). Lies can work, but they may shout down the lane to check. Caught lying: their price goes up and your **name in the bazaar** (बजारमा नाम) drops, which makes every new shop start higher. |
| **Buy at their price** | Done. Never do this on the first price. |
| **Chat a little** (12 min) | They warm up a bit. You learn if they have made their first sale of the day yet. Cloth Dai gives a real discount to people who chat. |
| **Walk away** | They may call you back with a better price. If not, they remember: come back later and the price is a little higher. |

Push your luck too far and you get thrown out of the shop for an hour.

### Reading faces

After each offer the game describes what you notice: a relaxed smile and slow sips of tea mean there's lots of room; head-scratching means some; sweat, sighs and reaching for the wrapping paper mean you're close to their real limit; folded arms mean their patience is running out. The drawn shopkeeper's face shows the same thing.

## The map of Asan

The bazaar is laid out on the **real streets of Asan**, taken from OpenStreetMap (© OpenStreetMap contributors, ODbL). Place names are spelled as they are on the map:

असन टोल (Asan Tol) · कमलाक्षी (Kamalakshi) · भोटाहिटी (Bhotahity) · बालकुमारी (Balkumari) · केल टोल (Kel Tol) · इन्द्रचोक (Indra Chowk) · बाङ्गेमुडा (Bangemuda) · खुला मञ्च (Khula Manch), with landmarks अन्नपूर्ण अजिमा, असन गणेश, जनबाहल, न्हैकनतल्ला, नःघल, ताहिटि, मखन, भेडासिंङ, सबल बाहल, रानी पोखरी and कान्ति पथ.

- **Walking takes real time.** Minutes come from the actual street distance (at a crowded-bazaar pace of 45 m a minute): next door is 1–2 minutes, Asan Tol to Indra Chowk about 9, Indra Chowk to Khula Manch about 19.
- **The street** shows the tole you are standing in: Asan Tol has the Annapurna temple chowk; Khula Manch is the open ground where goats are sold for Dashain, with the Dharahara beyond the trees.
- **Mini-map** (top right of the street): your position, every shop (a gold ring means it sells something on your list) and your route. Tap it to open the full map.
- **Full map and route planner** (नक्सा र रुट): tap a shop pin to see what it sells, how long the walk is and which toles you pass on the way. Walk there now, or add several shops to a **route** to see the total walking time, then follow it stop by stop ("अर्को रोकाइ"). Comparing prices across toles saves money but costs time.

## The shopkeepers

Seventeen shopkeepers, several selling the same things, so you can compare and quote one against another.

| Tole | Shopkeeper | Sells | Style |
|---|---|---|---|
| असन टोल | Tuladhar Sahuji (तुलाधर साहुजी) | rice, spices, tika, cards | Cunning: starts high, swears "final!" when it isn't |
| असन टोल | Spice Didi (मसला दिदी) | rice, spices, tika, cards | Honest, and knows all the gossip: getting caught lying here hurts double |
| असन टोल | Hajurama (हजुरआमा) | fruit, tika | Kind: paying her fair price raises your name, squeezing her lowers it |
| कमलाक्षी | Shrestha Sahu (श्रेष्ठ साहु) | rice, spices, tika, cards | Poker face, no tells |
| कमलाक्षी | Kite Dai (चङ्गा दाइ) | kites, cards | Cheerful and fair |
| भोटाहिटी | Shop Boy (पसले भाइ) | shoes, clothes, topi | Easy to fool, but too low and he phones the owner |
| भोटाहिटी | Maharjan Dai (महर्जन दाइ) | shoes, clothes, topi | Cunning |
| बालकुमारी | Kansakar Sahu (कंसाकार साहु) | brass | Poker face |
| बालकुमारी | Fruit Didi (फलफूल दिदी) | fruit, tika | Honest |
| केल टोल | Bajracharya Dai (बज्राचार्य दाइ) | brass | Honest |
| केल टोल | Kite Boy (चङ्गा भाइ) | kites, cards | Easy to fool, phones his uncle |
| इन्द्रचोक | Cloth Dai (कपडा दाइ) | daura suruwal, sari, topi | Loves a chat, and gives chatty customers a real discount |
| इन्द्रचोक | Pradhan Didi (प्रधान दिदी) | daura suruwal, sari, topi | Cheerful |
| बाङ्गेमुडा | Shakya Sahuji (शाक्य साहुजी) | dhaka topi, daura, shoes | Cunning |
| खुला मञ्च | Goat Trader (खसी बेपारी) | goats | Grumpy, little patience, often calls you back |
| खुला मञ्च | Village Ba (गाउँका बा) | goats | Honest farmer, cheaper towards evening, but few goats |
| खुला मञ्च | Big Dealer (ठूला बेपारी) | goats | Cunning |

Each day every shop stocks a random part of its range, so the best route changes daily.

## Bazaar life

- **बोहनी (first sale):** shopkeepers who haven't made their first sale of the day are keen to make one, so prices are lower early. Incense burning at an empty shop is the hint.
- **Goats sell out:** other customers buy goats through the day. Bargain with the farmer late, or buy early?
- **On the way:** a cow blocks the lane, an auntie whispers a shopkeeper's lowest price, a friend tells you what they paid (a true quote you can use), or a tourist overpays and puts a shopkeeper in a good mood.
- **List (सूची):** Aama's rough price for each item, plus every price you've been quoted.

## Scoring

Buy every item on the level's list and bring home at least its savings target to pass. The result sheet shows what you saved against the target and what each star needs. Paying first prices runs out of money. Each attempt generates a fresh bazaar (prices, stock, list) within the level's rules.

Nine badges are collected across games: first sale, big heart, master bluffer (3 lies believed, never caught), busted, half price, called back, beat a sly trader, goat home, and Aama amazed (3 stars).

## Controls

| Action | Input |
|---|---|
| Choose an option | Tap / click, or number keys 1–9 (0 for the 10th) |
| Change your price | − / + buttons, or arrow keys (Shift for bigger steps) |
| Walk to a shop | Tap a shop in the street, pick it from the list, or tap its pin on the map |
| Open the map | Tap the mini-map, or **नक्सा र रुट** |
| Shopping list and notebook | **List** button or L |
| Mute | Speaker button or M |

## Voices

Shopkeepers, you and your thoughts are spoken aloud with the browser's built-in speech (free, no audio files).

- **Each character has a gender and an age:** Didi and Hajurama use a female voice, the others a male voice. Old characters (Hajurama, Village Ba) speak slower, young ones (Shop Boy, Kite Seller) a little higher and quicker. Pitch changes are kept small so the words stay clear.
- **Your own voice:** pick female or male on the menu ("मेरो आवाज"). Your character in the lane changes to match.
- **Real Nepali voices** exist in **Microsoft Edge** (Hemkala, female; Sagar, male) and on **Android** phones. Chrome on a computer has no Nepali voice and reads the Nepali text with a Hindi voice; the game says so at the start of the day. If the device has only one voice, the other gender is imitated with pitch.
- Prices are read naturally ("३५०० रुपैयाँ", not "रु. ३,५००").
- The speech-bubble button turns voices off. With voices off, each shopkeeper gets a short murmur sound instead.

## The bazaar

The lane is drawn in code to look like Asan: you start at the chowk by the gilded three-tier Annapurna temple (bells, the long golden banner, pigeons), then walk past old Newari brick houses with carved lattice windows and painted concrete blocks with black water tanks, balconies and laundry. Tangled electric wires hang between concrete poles, shops have tin signboards, rolled-up shutters, blue tarps and strips of sachets in the doorway, and the brick-paved street is busy with porters carrying doko baskets, women in saris, men in dhaka topis, children and motorbikes. Inside, shops have a tube light, a Kartik 2083 calendar, packed shelves, incense and a glass counter. The light turns warm in the afternoon and orange towards closing time.

A little 3D: the brick street is a ground plane in perspective (nearer bricks and people are bigger and slide past faster as you walk), tall houses show their side walls beside shorter ones and the open chowk, windows are recessed, and signboards, balconies and tarps cast shadows. Each shop interior is a small room in one-point perspective, with angled side shelves, a ceiling, and a counter you can see the top of.

## Run locally

From the `play` folder:

```bash
python -m http.server 8000
# open http://localhost:8000/nepali-games/mol-molai/
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Patro band and stat strip, the bottom sheet, list sheet, level month sheet and result sheet |
| `style.css` | The patro look: two inks, ruled day-cells, Mukta font faces |
| `fonts/` | Mukta (self-hosted, works offline) and its SIL Open Font License |
| `game.js` | Text in both languages, shopkeepers, the Asan map data and route finding, haggling rules, bazaar generation, drawing, sound |
| `sw.js` | Offline support (network first: players always get the newest version when online) |
| `manifest.webmanifest`, `icon.svg` | Install-to-home-screen support |

## Tuning

The haggling numbers live near the top of `game.js`:

- `KINDP`: each personality's first-price range (`open`), lowest-price range (`floor`), `patience`, `susp` (how likely they catch a lie) and `callback` chance, all as multiples of the item's fair price.
- `KEEPERS`: the shopkeepers (tole, personality, what they sell, look, voice). `CAT`: what each kind of shop stocks.
- `MAP`: the streets (from OpenStreetMap) and toles. `WALK_M_PER_MIN`: walking pace.
- `KIND`: how often each personality accepts a fair offer (`acc`) and how fast they come down (`conc`).
- `LEVELS`: each level's open toles, number of items, goat or big item, star thresholds (share of budget saved), bazaar hours, starting reputation and toughness. `LEVEL_TEXT`: names and the tip each level teaches.

These were balanced with simulated players on the real map: paying first prices always runs out of money, simple "start at half and creep up" haggling at the nearest shop mostly earns ★, comparing every seller earns ★★ about half the time (but walks about 90 minutes a day), and only near-perfect reading of the shopkeepers reliably earns ★★★.

## Credits

Street map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the Open Database License (ODbL). The credit is also shown on the in-game map.

Typeface: Mukta by Ek Type, SIL Open Font License 1.1 (`fonts/OFL.txt`).
