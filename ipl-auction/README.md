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
   - **Skip set:** fast-forward the set. It stops at any player you starred in *Coming up*.
   - **RTM (2025 rules):** the former team says it will match, the top bidder gets one final raise, then the former team matches or lets go. You face this from both sides.
5. **Fill:** if you finish under 18 players, you sign leftovers at base price. The list only shows players you can actually sign.
6. **Results:** analyst grade (ranked by best-XI strength), best steal, biggest buy, all ten squads.
7. **Season:** 70 league matches (14 per team: everyone once, plus five rivals home and away), then Qualifier 1, Eliminator, Qualifier 2 and the Final.
   - **Your matches:** call the toss, choose to bat or bowl, pick your XI (11 players, max 4 overseas), then play live.
     - While batting, set the intent: Steady, Balanced (automatic and chase-aware) or Attack.
     - While bowling, choose who bowls the next over (max 4 overs each, no bowler twice in a row) or leave it on Auto.
     - The live view has a score bar, the batters at the crease, the bowler's figures, ball chips for the current over and commentary.
     - Speeds are 1× to 15×, and you can pause, skip an over or simulate to the end.
   - **Other matches:** simulated one at a time, or straight through to your next match.
   - **Hub tabs:** a points table with real NRR, form and the playoff bracket; Orange and Purple Caps; stats leaders (sixes, fours, highest scores, best figures, best SR, best economy); every result with a full scorecard; and your own fixtures and top performers.
   - **Scorecards:** batting with dismissals, extras, total and run rate, did not bat, fall of wickets, bowling figures, a runs-per-over chart and the player of the match.
8. **Share:** a 1080×1920 story image with your XI, grade, season result and the cap holders.

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
| `js/data.js` | **Player pool + teams.** One line per player: name, 2026 team, country, role, rating, capped. Update this each season. |
| `js/rules.js` | Purse, bid steps, base prices, retention costs |
| `js/engine.js` | Auction state, sets, computer valuations, RTM decisions, fill |
| `js/season.js` | Best XI (max 4 overseas, a keeper, 5 bowling options), team strength, analyst grades |
| `js/match.js` | Ball-by-ball T20 engine: outcome odds, bowler choice, dismissals, extras and free hits, results, player of the match, compact scorecards |
| `js/league.js` | Fixtures, playoffs, points table with NRR, every stats leaderboard |
| `js/tour.js` | Season screens: hub, pre-match (toss + XI), the live broadcast, scorecards |
| `js/main.js` | Screens, the live clock, modals, saving |
| `js/i18n.js` | English + Nepali text and money formatting (₹ Cr / करोड) |
| `js/audio.js` | Synthesised paddle, bell, gavel and crowd that swells with the price |
| `js/share.js` | Story image |

## Data notes

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

Everything is generated in code (`audio.js`), with no audio files. The sound builds as the price climbs:

| Price | Added |
|---|---|
| ₹5 Cr | heartbeat (it gets faster with every bid) |
| ₹10 Cr | low drone whose pitch rises with the price; "going once/twice" become deep bongs |
| ₹15 Cr | snare roll |
| ₹20 Cr | high riser |
| ₹25 Cr | everything faster and louder |
| Above ₹27 Cr (IPL record) | air horn, timpani and a roar |

Each ₹5 Cr mark also gets a timpani hit, a brass stab and a slight screen shake, and the stage glow shifts from gold to red. Paddle knocks rise in pitch with the price.

## How a match is simulated

Each delivery picks an outcome (dot, 1, 2, 3, 4, 6 or out, plus wides, no-balls with a free hit, and leg byes). The odds depend on:

- **Batter against bowler:** batting skill against bowling skill. Specialist bowlers bat like tail-enders, whatever their bowling rating.
- **Phase:** in the powerplay there are more fours. The middle overs bring more singles and spin. At the death there are more sixes and more wickets.
- **Intent:** attack brings more boundaries and more risk. The automatic intent reads the chase (required rate, wickets in hand).
- **Settling in:** new batters are shaky, set batters are freer, and batters past 50 (and again past 80) take more risks.
- **The ground:** each venue has its own scoring rate and spin help.

Computer captains pick bowlers by skill and phase: pace up front and at the death, spin in the middle. A feasibility check means the 20 overs can always be bowled within the 4-overs-each rule.

**Calibration:** over 300 simulated matches the engine gives a first-innings average of about 180, 16–17 sixes and 2 fifties per match, about 15–19 hundreds per 100 matches, about 16% of innings bowled out and chases won about half the time. Over a full season the Orange Cap usually lands around 650–900 runs and the Purple Cap around 25–30 wickets.
