# IPL Auction · आईपीएल लिलामी

**Status:** Playable · Khel No. 12

You run one IPL franchise through a full mega auction against nine computer-run franchises, then through the whole IPL season. Every match is simulated ball by ball, and you play your own matches live.

Plain HTML, CSS and JavaScript. No framework, no build step, no backend. Works offline once loaded. English and Nepali.

## Flow

1. **Auction format:**
   - *Full new team*: every franchise starts empty with ₹120 Cr, no retentions and no RTM.
   - *Retain + RTM*: the 2025 mega-auction rules below.
2. **Pick a franchise:** any of the 10.
3. **Retention** (Retain + RTM only): keep up to 6 players from your IPL 2026 squad (max 5 capped, 2 uncapped). Capped slots cost ₹18 / 14 / 11 / 18 / 14 Cr, uncapped ₹4 Cr. Each unused slot becomes an RTM card. The computer teams retain their own stars.
4. **Auction:** two marquee sets, then capped and uncapped sets by role (batters, all-rounders, keepers, fast bowlers, spinners). After that, an accelerated round brings back a shortlist of up to 40 unsold players.
   - The hammer falls after 3 seconds with no bid (going once, twice, sold).
   - **Skip player:** drop out and let the computer finish the lot instantly.
   - **Skip set:** fast-forward the set. It stops at any player you starred in *Coming up*, unless you gave him an auto-bid.
   - **Max bid (auto-bid):** tap *Max bid* on a player card and set your limit. The game bids for you, a beat after each rival bid, up to that price, live or while skipping. Players with auto-bids show it in *Coming up*.
   - **RTM (2025 rules):** the former team says it will match, the top bidder gets one final raise, then the former team matches or lets go. You face this from both sides.
5. **Fill:** if you finish under 18 players, you sign leftovers at base price. The list only shows players you can actually sign.
6. **Results:** analyst grade (ranked by best-XI strength), best steal, biggest buy, all ten squads.
7. **Season:** 70 league matches (14 per team: everyone once, plus five rivals home and away), then Qualifier 1, Eliminator, Qualifier 2 and the Final.
   - **Your matches:** call the toss, choose to bat or bowl, pick your XI (11 players, max 4 overseas), then play live.
     - While batting, set the intent: Steady, Balanced (automatic and chase-aware) or Attack.
     - While bowling, choose who bowls the next over (max 4 overs each, no bowler twice in a row) or leave it on Auto.
     - The live view has a score bar, the batters at the crease, the bowler's figures, ball chips for the current over and commentary.
     - Speeds are 1× to 15×, and you can pause, skip an over or simulate to the end.
   - **Impact Player (IPL rule):** at the innings break each side may swap one XI player for one from its squad (max 4 overseas still applies). The chasing side usually brings in a batter, the defending side a bowler. Computer captains make the swap a real captain would; you pick yours from two drop-downs (the game suggests one). The scorecard shows who came in.
   - **Other matches:** simulated one at a time, or straight through to your next match.
   - **Hub tabs:** a points table with real NRR, form and the playoff bracket; Orange and Purple Caps; stats leaders (sixes, fours, highest scores, best figures, best SR, best economy); every result with a full scorecard; and your own fixtures and top performers.
   - **Scorecards:** batting with dismissals, extras, total and run rate, did not bat, fall of wickets, bowling figures, a runs-per-over chart and the player of the match.
8. **Share:** a 1080×1920 story image with your XI, grade, season result and the cap holders.
9. **Next season (career):** after the Final, *Next season* rolls the game into the following year:
   - **Season review:** awards (Orange and Purple Caps, Most Valuable Player, Emerging Player: the best uncapped player), every rating change in your squad, rising stars, big names who slipped, and Indian players who got capped.
   - **No ageing:** the year moves on, but players don't get older and nobody retires. Ratings move only with what a player did: a batter who scored more, and faster, than batters of his skill usually do goes up; one who flopped goes down. Bowlers the same with wickets and economy. A full season counts more than a few games, steps stay small (±5 at most), and prospects keep growing toward their ceiling, quicker when they play.
   - **Who stays:** keep any of your players at the price you paid, or release them. The purse is ₹120 Cr plus ₹5 Cr for every year after 2027, minus the salaries you keep (max 25 kept, 8 overseas, and enough left to reach 18 players). Computer teams keep their stars and the players worth their price, and release the rest.
   - **Mini auction:** released players and last year's unsold names go under the hammer (no RTM). Then the new season starts. Career totals, titles and your season-by-season record carry on.

## Season life: form, injuries, pitches, captains, news

- **Form:** every player has a form level from ❄ cold to 🔥 red hot. It moves after each match with what he did (runs and strike rate, wickets and economy) and is worth up to ±4 rating points in a match. Players who sit out drift back to normal.
- **Injuries:** players can get hurt in a match (fast bowlers more often), usually for 1–5 matches, sometimes for most of the season. Injured players can't be picked. Computer teams and your saved XI swap in the best fit player (same role first). About 12–20 injuries a season.
- **Pitch conditions:** every match gets a pitch (good, flat road, green top, dry turner, slow and low) and maybe dew, weighted by the ground (Chepauk dry or slow, Chinnaswamy flat). The pitch changes pace and spin bowling, scoring, and how power hitters and anchors do. A dry pitch turns more in the second innings, and dew helps the chasing side. The pre-match screen shows a pitch report with the par score, and each player in the XI picker shows ▲ suits the pitch / ▼ pitch is against him. Computer captains read the pitch at the toss (dew: chase; dry or slow: bat first) and pick their XI on batting and bowling skill, form and pitch fit, balancing batting depth against five front-line bowlers.
- **Captaincy:** each franchise has a captain (known leaders such as Dhoni, Rohit Sharma or Shreyas Iyer rate highest). The captain's rating lifts or lowers the whole XI a little (more in the field than with the bat). A great captain leads from the front, and a weak one can feel the pressure. If the captain isn't playing, the best leader in the XI stands in. Pick yours in the Mine tab or before a match.
- **News:** a News tab, plus the two latest headlines on the hub: hundreds, 4-wicket hauls, teenagers starring, 230+ totals, thrillers and thrashings, injuries and returns, players in red-hot form, cap changes, winning and losing streaks, playoff places, champions, and every result of your own team.
- **Prospects and underrated players:** players who are still developing have a hidden ceiling, and scouts show it as 🌱 ★ to ★★★. They grow toward that ceiling each season in career mode, and computer teams pay a little more for them. About 1 in 8 mid-rated players are underrated: they play 3–6 points better than their rating. Scouts spot about 70% of them (💎). Computer teams don't know, so they come cheap. The Stats tab lists the best uncapped players and the best bargains (bought for ₹2 Cr or less).
- **Batting and bowling skill:** every player has an overall rating (his auction value) plus his own batting and bowling skill, and the match engine uses those two. Narine bowls like a specialist (Bat 74 · Bowl 87), Abhishek Sharma bats like one (Bat 92 · Bowl 58), Rashid Khan can bat (Bowl 89 · Bat 62), and Bumrah bats like a No. 11.
- **Mine tab:** captain picker, your **top 10 batters** (runs, average, strike rate, high score) and **top 10 bowlers** (overs, wickets, economy, average, best), then every player in your squad with role, skill, rating, form, injury status, matches, runs, average, strike rate, wickets, economy and last five scores. Tap a player for his full sheet: every game this season, his price and his career totals.

The game saves after every auction lot and every match, so a closed tab resumes where you left off. A live match in progress is not saved; you restart it.

## Rules (2025 mega auction format)

| Rule | Value |
|---|---|
| Purse | ₹120 Cr |
| Squad | 18–25, max 8 overseas |
| Bid steps | +₹5 L to ₹1 Cr, +₹10 L to ₹2 Cr, +₹20 L to ₹3 Cr, then +₹25 L |
| Base prices | Uncapped ₹30–50 L; capped ₹75 L – ₹2 Cr (from our rating) |
| Bid limit | You can never bid so much that you can't fill 18 players at ₹30 L each |

The real 2027 event is a *mini* auction (no RTM; the purse is not announced yet). This game plays the bigger mega-auction format on purpose.

## Files

| File | What |
|---|---|
| `js/data.js` | **Player pool + teams.** One line per player: name, 2026 team, country, role, rating, capped (about 460 players: the ten 2026 squads, Indian players without a deal, and overseas T20 regulars). Batting and bowling skills for all-rounders and the exceptions. Update this each season. |
| `js/rules.js` | Purse, bid steps, base prices, retention costs |
| `js/engine.js` | Auction state, sets, computer valuations, RTM decisions, fill, next year's mini auction |
| `js/world.js` | Potential, underrated players, form, injuries, pitches, captaincy, news, awards and the career rollover (performance-based rating changes, which players computer teams keep) |
| `js/season.js` | Best XI (max 4 overseas, a keeper, then the batting/bowling mix that scores best, found by swapping players until no swap helps), team strength (XI plus bench depth), analyst grades |
| `js/match.js` | Ball-by-ball T20 engine: outcome odds, bowler choice, dismissals, extras and free hits, results, player of the match, compact scorecards |
| `js/league.js` | Fixtures, playoffs, points table with NRR, every stats leaderboard |
| `js/tour.js` | Season screens: hub, pre-match (toss + XI), the live broadcast, scorecards |
| `js/main.js` | Screens, the live clock, modals, saving |
| `js/i18n.js` | English + Nepali text and money formatting (₹ Cr / करोड) |
| `js/audio.js` | Synthesised paddle, bell, gavel and crowd that swells with the price |
| `js/share.js` | Story image |

## Data notes

- Potential and the underrated bonus are seeded per career, so each new game hides different gems.
- In career mode, ratings move with performance, not age. Each off-season, batting skill (top 60 batters) and bowling skill (top 70 bowlers) are nudged back toward the real pool's level, so scoring stays IPL-like year after year (first-innings average about 186–195 over five simulated seasons, Orange Cap 650–900, Purple Cap 23–30).

- Squads are the IPL 2026 squads (retentions, trades and the 16 Dec 2025 auction buys).
- An extra 78 players are not in any 2026 IPL squad: international names (for example Harry Brook, Ben Stokes, Adam Zampa and Rahmanullah Gurbaz) and the best of the associate nations: Nepal (Sandeep Lamichhane, Dipendra Singh Airee, Rohit Paudel and seven more), USA, Netherlands, Scotland, Ireland, Zimbabwe, UAE, Namibia, Oman and Canada. Their card shows *New to IPL*, and they have no RTM. Pakistan players are left out because they do not play in the IPL.
- Every player shows their full country name, in English or Nepali.
- Each team plays home games at its own ground. Grounds change scoring (Chinnaswamy and Wankhede are high-scoring; Chepauk and Ekana are slow and help spinners).
- **Ratings are our own estimates**, not official numbers. They drive base prices, computer bids and the season.
- No team logos or player photos. Players show initials in their 2026 team colours.

## How the computer teams think

Each computer team works out a value for every player, and that value changes as the auction goes on:

- **Base value:** `WORTH` in `engine.js` maps the rating to a price. On top of that come seeded per-team noise and the franchise's taste (`style` in `data.js`).
- **Must-have targets:** each team picks 2–3 names at the start and is willing to pay 30% more for them. It also holds money back for the ones still to come, which is why some teams sit quiet on good players early on.
- **Squad needs:** a team pays more for roles it is short of, and much less once a role is full or it is near 8 overseas players.
- **Scarcity:** when few good players of a role are left and many teams are short of that role, prices for it rise.
- **Budget pacing:** a team's spending shifts with how much money it has per open squad slot.
- **Grudges:** two teams that fought hard (5+ bids each) bid up to 12% harder against each other next time. Your most frequent opponent becomes your **rival** (⚔ on the board).
- **Heat of battle:** deep in a one-on-one war (4+ bids each), owners get carried away and bid up to 12% past their plan (big spenders and star-chasers most), softened above ₹26 Cr so records fall only in the biggest wars. Commentary calls it: "*X refuse to back down!*"; a sniper coming in after "going once" gets "*X strike late!*".
- **On screen:** each bid pops a paddle in the team colours with the amount on that team's table in the board, and the floor sits in an auction-hall backdrop (LED wall, stage beams, ten team tables; no logos). Each franchise's personality (Big spender, Waits for the war, Late striker, Price pusher) shows in its squad sheet.
- **Bidding styles** (`bid` in `data.js`):
  - *Aggressive* (PBKS, KKR, SRH): bids quickly, makes jump bids to the next round number, and isn't scared off by jumps.
  - *Patient* (CSK, GT): only joins once a fight is already on.
  - *Sniper* (MI, RR): comes in after "going once".
  - *Bluffer* (DC, LSG, RCB): sometimes pushes the price up on a player it doesn't need, and can get stuck with him.

**Tells you can read:**
- A team that answers instantly still has plenty of room.
- "*X thinking…*" means that team is close to its limit.
- A JUMP bid (yours or theirs) can scare off nervous teams that are near their limit ("*X back off!*").
- The card shows which teams are short of the role and how many teams have the player on their wishlist.

With all ten teams run by the computer, a full auction sells about 180–190 players for about ₹670–690 Cr. Top buys land around ₹18–27 Cr, and teams finish with ₹0–9 Cr left, much like the real 2025 auction.

## Sound

Everything is generated in code (`audio.js`), with no audio files, and there is no constant background noise: no crowd hiss and no drone. Sounds play only when something happens: paddle knocks (higher in pitch as the price climbs), bells for going once/twice (deep bongs past ₹10 Cr), the gavel, and crowd roars for big sales, fours, sixes and wickets.

Tension at big prices: a heartbeat from ₹10 Cr, a snare roll from ₹20 Cr, a drum and brass hit at every ₹5 Cr mark, and an air horn past the IPL record (₹27 Cr). In a tight chase, the heartbeat starts in the last 4 overs and the roll in the last 2.

## How a match is simulated

Each delivery picks an outcome (dot, 1, 2, 3, 4, 6 or out, plus wides, no-balls with a free hit, and leg byes). The odds depend on:

- **Batter against bowler:** batting skill against bowling skill. Specialist bowlers bat like tail-enders, whatever their bowling rating.
- **Phase:** in the powerplay there are more fours. The middle overs bring more singles and spin. At the death there are more sixes and more wickets.
- **Intent:** attack brings more boundaries and more risk. The automatic intent reads the chase (required rate, wickets in hand).
- **Settling in:** new batters are shaky, set batters are freer, and batters past 50 (and again past 80) take more risks.
- **The ground:** each venue has its own scoring rate and spin help.

Computer captains pick bowlers by skill and phase: pace up front and at the death, spin in the middle. A feasibility check means the 20 overs can always be bowled within the 4-overs-each rule.

**Playing styles:** batters are tagged power hitters (more sixes, more risk) or anchors (rotate the strike, cash in once set); bowlers are death specialists (yorkers in overs 17-20, captains save them for then) or new-ball bowlers (swing in the powerplay). Batting orders follow a real T20 shape: specialist batters in the top four (power hitters open, anchors at three or four), then finishers and all-rounders, then the bowlers. Even the best batter always has a fair chance of getting out each ball.

**Live win predictor:** the broadcast shows each side's win % every ball (first innings: projected total against the ground's par; chase: runs needed against what the balls and wickets left usually produce).

**Calibration** (thousands of simulated matches and five-season careers): first-innings average about 188, 18-19 sixes and about 30 fours per match, about 6 wickets an innings, 13-15% of innings bowled out, 45-50 totals of 200+ and about 10 of 240+ a season, 12-15 hundreds a season, about 20 four-wicket hauls and 3-5 five-fors. Chasing sides win about 54% (a little more with dew), close to the IPL's long-run record. Skill now matters both ways: the best bowlers go at about 7-8 an over, and a batter's edge over an ordinary bowler is softer than a great bowler's edge over an ordinary batter. Season leaders: Orange Cap about 650-800 runs, Purple Cap 24-28 wickets, close to IPL 2024-25. The caps tables show average and strike rate; the stats tab adds most 50+ scores and best batting average.
