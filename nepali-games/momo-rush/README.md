# Momo Rush · मःम रश

**Status:** Playable · Khel No. 15

Run a Kathmandu evening momo stall for one short week. Every morning you shop at the bazaar, every evening you fold, steam and serve with your own thumbs, and in between you read the people at your counter: the regular who wants udharo, the hungry student, the "health inspector" who may be fake, the food vlogger. Make Rs 1,500 rent by the end of the week.
English and Nepali, works offline as a PWA, also opens straight from `file://`.

Hook: **Fold, steam, serve. Udharo or cash only? Make rent by the end of the week.**
हुक: **बेर, पका, खुवाऊ। उधारो कि नगद मात्र? हप्ता सकिनुअघि भाडा जुटाऊ।**

## How it plays

A week is 5 days. Each day is three short screens:

1. **Morning bazaar** (about 10 s). Tap filling bowls to buy plates of buff, chicken or veg with your cash (and the tip jar once the cash runs out). Leftovers go bad at night; run out and customers walk away. A daily **rumour** hints at demand ("Futsal final tonight: buff fans", "Ekadashi: lots of people skip meat", "Bandh called", "Rain: everyone wants jhol"). Where it came from matters: a ward office notice is right 90% of the time, tea-shop gossip 60%, TikTok 40%.
2. **Service** (80 to 100 s of real time, 6 PM to 9 PM on the clock). Hands-on, no menus:
   - **Fold:** tap a filling bowl, then flick up on the dough three times.
   - **Steam:** drag the tray into a steamer tier. Each tier has a cook meter: raw, done, **gold** (perfect), soggy, burnt. Tap or drag the tier when it glows gold for sparkles and bigger tips. Burnt plates puff black smoke and pay half.
   - **Dress:** drag the plate through the red **achar** (no achar, no tip), dip it in the **jhol** pot (day 3 on), or fry it on the **tawa** for **kothey** (day 4 on).
   - **Serve:** drag the plate onto the customer. Patience shows on their faces: happy, tapping foot, frown, phone out.
   - **Special customers** pop a card. **Swipe right for yes, left for no** (or the buttons, or ← →). You have 10 seconds.
3. **Evening.** A receipt with the day's hisab and what happened to your decisions, then spend tips on **one of three upgrades** offered (or keep them; unspent tips count as cash at the end).

Day 1 is a guided tutorial (buff and veg only, the clock waits until your first plate is served). Days get busier and add chicken, jhol and kothey.

## Decisions

| Who | Ask | What can happen |
| --- | --- | --- |
| Regular (Hari dai, Kanchha, Bunty) | Two plates on udharo | Pays back 1 to 2 days later with 20% extra, or never. Hari almost always pays, Kanchha about half the time, Bunty almost never. Refusing costs reputation. |
| Hungry student | One free plate | Feeding them gains reputation. If friends were watching, 3 extra customers come tomorrow. |
| "Health inspector" | Rs 400 fee right now | Half are real. A badge and receipt book usually means real, sunglasses at night usually means fake, but the tell lies 20% of the time. Refuse a real one: Rs 1,200 fine. Pay a fake one: Rs 400 gone. |
| Food vlogger | Free plate for a review | Served perfect (gold, achar, not kept waiting): up to +50% crowd tomorrow if they are big. Burnt or angry: bad review and fewer people. Refusing is safe but the boost is small. |

Upgrades (three offered each evening, run by run they differ): **bigger steamer** (4th tier and a longer gold window), **bhai helper** (slowly folds for the next order), **timur achar** (+20% patience, bigger tips), **painted signboard** (+20% customers), **new gas regulator** (steams 30% faster).

## Modes and sharing

| Mode | What it is |
| --- | --- |
| Daily Momo #n | A date-seeded week: the same rumours, customers and special visitors for everyone that day (#1 = 1 Nov 2026, local date). Best result per day is saved. |
| Start a week | A random week. A week in progress is saved after each day and can be continued. |

The week result gives a funny title (Buff Momo Baadshah, Jhol Ka Jadugar, Udharo Ka Raja, Free Momo Daani, Burnt Momo Specialist...), profit, stars, a **Your calls this week** list (filling gone bad and sell-outs, udharo given and paid back, inspectors read right, the vlog, free plates), share text and a **1080×1920 story image** of the stall with the week's receipt and your two biggest calls (Web Share with files, or a PNG download plus copied text). Best week is kept in `localStorage`.

## Balance (Node bot, 150 weeks per row, human-speed reactions)

| Player | Avg profit | Profitable weeks | Rent paid |
| --- | --- | --- | --- |
| Decent hands, reads tells, buys to the rumour | Rs 3,784 | 100% | 100% |
| Pro | Rs 5,379 | 100% | 100% |
| Casual | Rs 651 | 79% | 99% |
| Careless (slow, random buying and answers) | Rs -1,894 | 1% | 14% |
| Careless hands, smart decisions | Rs -1,320 | 0% | 30% |

Decisions move the result for the same decent hands: says yes to everyone Rs 3,291, says no to everyone Rs 2,906 (fines + lost reputation), ignores rumours Rs 3,218, believes every rumour Rs 3,424, random stock Rs 2,247. Neither blanket answer wins: reading the tells beats both by Rs 500 to 900. Upgrades are close to each other on average, so the choice depends on how you play: the bhai and timur achar help slow players most, the signboard only pays if you can keep up.

Edge cases: once the cash box is empty, filling can be paid from the tip jar; if even that is gone, the bazaar offers to close the week early instead of four empty evenings. During the tutorial only the tutorial filling can be picked. The bhai folds the filling you tapped, or his own guess if you tapped none. On a phone turned sideways the play screen asks to be held upright and the clock waits. "Perfect" counts plates served at gold, and the evening chips count plates, so the numbers on the receipt always add up. A week closed early shows the days actually played on the story.

## Code

Classic scripts, no build step, no dependencies. Runs from a web server or straight from `file://` (the service worker only registers over http).

```
index.html, style.css, sw.js, manifest.webmanifest, icon.svg, fonts/
js/
  rules.js   pure rules: seeded week, rumours, customers, cook meters, decisions, money, upgrades (window.MRRules, or module.exports in Node)
  i18n.js    every string in English and Nepali, Devanagari digits, Indian grouping (1,00,000)
  audio.js   WebAudio synth: madal + bansuri loop that speeds up in the rush, steam and tawa sizzle beds, lid clanks, coins
  art.js     canvas painter: dusk street, tarp, bulbs, painted sign, customers, steamer, plates, bowls
  share.js   1080x1920 story image and share / download fallback
  main.js    screens, touch / mouse / keyboard input, the real-time loop, particles, haptics, test hooks
```

Rules never touch the DOM, so the balance bot drives the exact same `step()` and action functions in Node.

Test hooks on `window.MR`: `MR.manual = true` stops the animation loop, `MR.step(dt, n)` advances it by hand, `MR.state()` returns a summary, `MR.pos(kind, i)` gives screen coordinates of stations for real pointer input, `MR.start(daily, opts)`, `MR.open(stock)`, `MR.act(name, ...args)`.

Keyboard: 1 2 3 filling, Space fold, S steamer (load or pull the most cooked tier), A achar, J jhol, K tawa, Q W E R pick a plate, Enter serve, Backspace bin, ← → answer a card, Esc pause.

## Art and sound

Everything is drawn in code on canvas (no image files, no emoji): blue-and-orange tarp, string bulbs, prayer flags strung across the street, thin brick houses with water tanks on the roofs and painted shop boards (चिया, किराना, सैलुन...) over half-open shutters, all smeared in the wet street, where bikes, a safa tempo and a microbus pass behind your customers. Night falls over each service: the sky darkens and the moon climbs from behind the valley rim. Customers lean on the counter (impatient fingers drum), the bhai helper peeks over the board and pats the dough, a hand-painted yellow "मःम पसल" sign, a stacked aluminium steamer over a blue gas flame, steel plates, red achar in a clay bowl. Upgrade tiles are painted the same way. All sound is synthesised with WebAudio, starts on the first tap and remembers mute. Reduced-motion settings calm the shake, flicker and particles.

## Credits

Fonts (SIL Open Font License 1.1, copies in `fonts/OFL.txt`): Pacifico, Yatra One, Anton, Mukta. Everything else made for Khel.
