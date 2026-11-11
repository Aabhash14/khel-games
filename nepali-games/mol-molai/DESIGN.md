---
name: Mol-Molai
description: A Dashain haggling game in Asan bazaar, printed as a two-ink Nepali patro.
colors:
  patro-vermilion: "#d7261e"
  vermilion-deep: "#a8150e"
  press-black: "#141414"
  ink-grey: "#4a4a4a"
  newsprint: "#fdfcf8"
  newsprint-shade: "#f1efe8"
typography:
  numeral-day:
    fontFamily: "Mukta, Nirmala UI, Noto Sans Devanagari, Kohinoor Devanagari, system-ui, sans-serif"
    fontSize: "clamp(34px, 11vw, 52px)"
    fontWeight: 800
    lineHeight: 0.95
    fontFeature: "tnum"
  display:
    fontFamily: "Mukta, Nirmala UI, Noto Sans Devanagari, Kohinoor Devanagari, system-ui, sans-serif"
    fontSize: "clamp(40px, 12vw, 58px)"
    fontWeight: 800
    lineHeight: 1
  headline:
    fontFamily: "Mukta, Nirmala UI, Noto Sans Devanagari, Kohinoor Devanagari, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "Mukta, Nirmala UI, Noto Sans Devanagari, Kohinoor Devanagari, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Mukta, Nirmala UI, Noto Sans Devanagari, Kohinoor Devanagari, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Mukta, Nirmala UI, Noto Sans Devanagari, Kohinoor Devanagari, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1.3
rounded:
  none: "0px"
spacing:
  hair: "1px"
  rule: "2px"
  cell-pad: "6px 8px"
  sheet-gutter: "14px"
  page-gutter: "16px"
  cell: "64px"
components:
  band:
    backgroundColor: "{colors.patro-vermilion}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
  band-numeral:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.patro-vermilion}"
    typography: "{typography.numeral-day}"
    width: "74px"
  cell-move:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.press-black}"
    rounded: "{rounded.none}"
    padding: "{spacing.cell-pad}"
    height: "{spacing.cell}"
  cell-move-hover:
    backgroundColor: "{colors.newsprint-shade}"
  cell-move-primary:
    backgroundColor: "{colors.patro-vermilion}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "{spacing.cell-pad}"
    height: "{spacing.cell}"
  cell-move-primary-hover:
    backgroundColor: "{colors.vermilion-deep}"
  cell-move-dark:
    backgroundColor: "{colors.press-black}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "{spacing.cell-pad}"
    height: "{spacing.cell}"
  level-cell:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.press-black}"
    typography: "{typography.numeral-day}"
    rounded: "{rounded.none}"
    padding: "{spacing.cell-pad}"
  level-cell-selected:
    backgroundColor: "{colors.patro-vermilion}"
    textColor: "#ffffff"
  play-cell:
    backgroundColor: "{colors.patro-vermilion}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "72px"
  play-cell-hover:
    backgroundColor: "{colors.vermilion-deep}"
  price-value:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.patro-vermilion}"
    height: "66px"
  history-strip:
    backgroundColor: "{colors.newsprint-shade}"
    textColor: "{colors.press-black}"
    padding: "4px 10px"
---

# Design System: Mol-Molai

## Overview

**Creative North Star: "The Bazaar Patro"**

Mol-Molai is printed, not rendered. Every surface outside the bazaar scene reads as a page of a Nepali wall calendar (patro): two inks, vermilion and black, pressed onto bright white newsprint, divided into square ruled day-cells. Each level is a dated cell on the month sheet, and every price, walk time and tally is set like the day's numeral: the heaviest, largest thing on its surface. Labels are small, bold and quiet; the numbers do the teaching.

The chrome is flat and dense the way a patro is dense: no cards, no pills, no gradients, no radii. Structure comes from 2px black rules between regions and 1px hairlines between cells. Colour carries meaning only: solid vermilion marks the single move the player most likely wants, black cells mark a committing alternative, and everything else stays newsprint. Used numbers are never erased; they stay on the page struck through, as history.

The bazaar canvas is the one place colour runs free. Asan's shopfronts, keepers, goods and evening light are drawn in full colour so the haggle (the product's hero) has a face. Anything printed on top of or beside that scene (the price box, the stamp, the map, icons, stars) returns to the two inks.

**Key Characteristics:**
- Two inks on newsprint: vermilion and black, with one paper shade as the only third tone.
- Square ruled day-cells on one grid module; rules, never shadows or radii.
- Mukta 800 numerals are the largest elements on every surface.
- One solid red cell per decision; black cells for buying or committing.
- History is struck through, not removed.
- Motion is mechanical: numbers roll one course, results are stamped.
- The full-colour bazaar scene is the sole sanctioned exception to two inks.

## Colors

A strict duotone press palette: vermilion and black on warm white newsprint, plus one shade of paper.

### Primary
- **Patro Vermilion** (#d7261e): the patro's red ink. The play band and page bands, the one primary move cell, the selected level cell, the play cell, the current/holiday level numeral, the price on the table, filled stars, the "need" marker, the focus ring, text selection, and every "matters to you" mark on the map.
- **Vermilion Deep** (#a8150e): hover/pressed state of every red surface, and the colour of small field labels (stat names, fact names, the moves label, speaker names, the result tally labels). Also the strike line through the keeper's previous ask.

### Neutral
- **Press Black** (#141414): all text, every rule and hairline, the dark committing cell, the deal line, the meter fill, map streets, pins and route.
- **Ink Grey** (#4a4a4a): secondary text only (descriptions, the player's own speaker label, thoughts and tells, struck-through own offers, map landmark names). It is black ink printed light, not a third hue.
- **Newsprint** (#fdfcf8): the page. Every background in the chrome, the band numeral cell, the price box body, map blocks and street casings.
- **Newsprint Shade** (#f1efe8): the only third tone. Hover on newsprint cells, the history strip, the moves label row, the "money" row of the list, earned badge chips.

White (#ffffff) appears only as text and icons reversed out of red or black cells.

### Named Rules
**The Two Inks Rule.** Chrome, map, icons, stars, stamp and price box use only vermilion, black, grey-black and newsprint. If a new surface needs a third colour to be understood, it needs a rule or a numeral instead.

**The One Red Cell Rule.** A set of moves carries at most one solid vermilion cell: the move the player most likely wants (offer, go to this shop, go home when the list is done, play). Red is a recommendation, not decoration.

**The Bazaar Exception Rule.** The canvas bazaar scene (buildings, keepers, goods, crowd, time-of-day light) is drawn in full colour. The exception ends at the scene: anything laid over it as information is printed in the two inks.

## Typography

**Display Font:** Mukta 800 (self-hosted woff2, Devanagari + Latin subsets, SIL OFL), with Nirmala UI, Noto Sans Devanagari, Kohinoor Devanagari, system-ui
**Body Font:** Mukta 500 / 700 (same stack)

**Character:** One Devanagari-first humanist sans in three weights. 800 for numerals and anything you act on, 700 for emphasis, 500 for reading. Tabular numerals everywhere (set on the body), so prices and clocks never jitter as they roll.

### Hierarchy
- **Day Numeral** (800, clamp(34px, 11vw, 52px) on phones, clamp(56px, 6.6vw, 104px) on wide screens, 0.95): the level numerals on the month sheet. Siblings at the same rank: the band numeral (50px, 64px on page bands), the result tally (clamp(40px, 12.5vw, 68px)), the price on the table (canvas, clamp(58px, 15.5% of viewport height, 104px)), and the price box value in the sheet (30px).
- **Display** (800, clamp(40px, 12vw, 58px), 1): the title in a page band.
- **Headline** (800, 24px, 1.15; 30px in a page band, 34px on wide screens): level name in the briefing, result headline, month name (24px, vermilion).
- **Title** (800, 13.5px-20px, 1.05-1.3): level name in the play band (20px), shop names (15.5px), move titles (13.5px), place line (15px), stat values (18px).
- **Body** (500, 15.5px, 1.5, max 62-68ch): dialogue lines, briefing idea, result note. Thoughts and tells are italic in Ink Grey.
- **Label** (800, 11-12px, 1.3): field names above values (stat strip, facts, tally, moves label, speaker names). Vermilion Deep for field names; Ink Grey for keys inside move cells. Sentence case, no tracking.

### Named Rules
**The Numeral Is Largest Rule.** On every surface the biggest type is a number the player needs: level, price, minutes, money saved. Words never outrank the numeral.

**The Struck History Rule.** A superseded number stays visible with a line through it: previous asks (Vermilion Deep strike on canvas), offer history (struck numerals on the shade strip), met goals and finished list items (2px vermilion strike).

## Layout

Everything sits on the day-cell grid. Moves are a 4-column grid of cells (min height 64px, 56px while haggling) that span 1, 2 or all 4 columns; empty slots are filled with blank cells so the ruling stays complete. The month sheet is a 4x3 grid of level cells (aspect 1:1.08). Stats, facts, goals and tallies are 2-4 column ruled rows. Gutters are 14px inside the play sheet and 16px on pages; cell padding is 6px 8px.

Phone first: in play, the red band and a 4-cell stat strip sit fixed at the top, the bazaar canvas fills the screen, and a ruled bottom sheet (max 58vh, 3px black top rule, sticky head) holds dialogue and moves within thumb reach. Pages (month sheet, result) are a single 560px column ruled on both sides.

Wide screens (min-width 900px and aspect at least 5:4): the bottom sheet becomes a right-hand column (min(440px, 36vw), 3px black left rule) and the scene and band fill the rest. The month sheet hangs as one 1180px wall sheet: level grid on the left (1.3fr), briefing, goals and badges on the right (1fr), with numerals scaling up to 104px. The result page widens to 760px. Below 380px the stat strip and band numeral tighten. Safe-area insets pad bands and the sheet.

## Elevation & Depth

None. The chrome is flat paper: no box-shadows, no blur, no layering by tone. Separation comes from rule weight alone: a 3px black rule where the sheet meets the scene, 2px rules between regions, 1px hairlines between cells, and 16% black hairlines between dialogue and receipt lines. Depth and soft shadows exist only inside the full-colour bazaar scene.

### Named Rules
**The Rules Not Shadows Rule.** If two regions need separating, draw a rule. A heavier boundary means a heavier rule (1px, 2px, 3px), never a shadow or a lift.

## Shapes

Square everything: zero radius on cells, buttons, bands, chips, meters, the price box and map pins. Icons are a single drawn 24px set with 2px square-capped, mitred strokes. Small solid squares (7-9px) are the bullet vocabulary: black for neutral list items and tells, vermilion for events, needs, new toles and earned badges. Disabled cells are hatched with a 135deg diagonal rule pattern rather than faded. The only curves are the speech tail under the price box (a black wedge), the player's location ring on the map, and the star glyph.

## Components

### Move Cells
Day-cells that are the buttons. Square, ruled by hairlines, content stacked top-to-bottom: a small key line (price or minutes) with an icon at right, then the title.
- **Shape:** square (0px), min height 64px, padding 6px 8px.
- **Default:** newsprint, black text, Ink Grey key; hover to Newsprint Shade (0.12s background transition).
- **Primary:** solid Patro Vermilion, white text and key; hover Vermilion Deep. One per set.
- **Dark:** solid Press Black, white text; hover #333. Used for committing alternatives: buy at their price, start the planned route.
- **Disabled:** 40% black text on a diagonal hatch.
- **Focus:** 3px vermilion outline, 2px offset (global).

### Shop Rows
Full-width rows: shop name (800) and goods (500, grey) on the left, walk time as a 24px numeral in a hairline-ruled cell on the right. The numeral cell turns red for the next stop, black for "you are here"; a selected row inverts to black; a vermilion square follows the name when the shop sells something you need.

### Price Box (sheet)
A five-cell stepper row under a 2px rule: two step cells each side (large steps in grey), and the value cell between with a label, the price in 30px vermilion 800, and the share of their ask. Below it, the history strip on Newsprint Shade lists every offer struck through: yours in grey, theirs in Vermilion Deep.

### Price on the Table (canvas)
The keeper's ask set as the day's numeral: a newsprint box with a vermilion header strip (white label), 2px black border and a 2px rule under the header, the ask in vermilion 800, the previous ask small in grey with a Vermilion Deep strike, and a black wedge pointing to the keeper.

### Bands
The play band: vermilion, white level name (20px 800) and tole (13px 700) at left, square icon tools separated by 50% white hairlines, and the level numeral on a newsprint cell at right in vermilion 800. Page bands use the same anatomy at display size. A 4-cell stat strip on newsprint sits beneath, labels in Vermilion Deep, values 18px 800; reputation is a row of 9px squares (black filled, vermilion for bad).

### Level Cells
Month-sheet day-cells: big numeral top-left, tithi name, level name, three stars (and a lock when closed). Current and holiday numerals print in vermilion; the selected cell is solid vermilion with everything reversed to white; locked cells are hatched with 38% black text. Holiday numerals stay vermilion even when locked.

### Play and Result Actions
The play cell is a full-width vermilion bar (72px, 24px 800 label, 30px play icon at right). Result actions are a ruled grid; the primary action spans the full row in vermilion (70px, 22px). Text links are 800 weight, underlined 2px in vermilion with a 4px offset.

### Chips
Badge chips are hairline-ruled cells on newsprint, 12.5px 700 grey; earned chips go black on Newsprint Shade with a 7px vermilion square.

### Meter
A 18px track with a 2px black border on newsprint; the fill is solid black (0.9s ease-out width transition) and the target is a 3px vermilion tick overshooting the track.

### Map
The map of Asan is printed in the same two inks. Blocks are newsprint with a black 1px outline and a 30% black dot screen; water is ruled with 35% black lines; streets are black casings with newsprint centres. Toles are black squares with heavy black names on a newsprint knock-out. Each shop is a small day-cell pin with a 2px black border and the walk time as its numeral: vermilion pins sell what you need, newsprint pins do not, a black diagonal strikes a sold-out shop, and a black square carries route order. Planned routes are dashed black; the chosen leg and the walk in progress are solid vermilion. The player is a black dot in a pulsing vermilion ring. Temples are vermilion triangles. A north arrow, scale bar and the "© OpenStreetMap contributors" credit stay visible. The mini-map in the lane wears a 2px black frame and a black label tab.

### Motion
- **Roll:** a changed number rolls down one course with a small overshoot (0.32s, cubic-bezier(0.16, 1, 0.3, 1)).
- **Stamp:** earned result stars and the canvas "bought" stamp land like a rubber stamp: scale down from 1.8 with a slight rotation, overshoot to 0.94, settle (0.45s, stars staggered 0.18s). The canvas stamp is a double-ruled vermilion rectangle, tilted.
- **Page fade:** pages fade in 0.25s on the same ease.
- All of it is removed under prefers-reduced-motion.

## Do's and Don'ts

### Do:
- **Do** print chrome, map, icons, stars and overlays in Patro Vermilion, Press Black, Ink Grey and Newsprint, with Newsprint Shade as the only third tone.
- **Do** make the numeral the largest element of every surface, in Mukta 800 with tabular figures.
- **Do** build every control as a square ruled cell on the grid: 2px rules between regions, 1px hairlines between cells, 0px radius.
- **Do** give each decision exactly one solid red cell, and use black cells for buying or committing.
- **Do** keep superseded numbers on the page struck through.
- **Do** roll changing numbers and stamp results; drop both under reduced motion.
- **Do** keep the bazaar scene in full colour and return to two inks for anything drawn on it.
- **Do** keep the sheet at the bottom on phones and move it to a right-hand column on wide screens.

### Don't:
- **Don't** add rounded corners, shadows, gradients or pill shapes to chrome.
- **Don't** introduce a third hue in chrome, map, icons or stars; colour belongs to the bazaar scene only.
- **Don't** put more than one vermilion cell in a set of moves.
- **Don't** erase used offers or met goals; strike them.
- **Don't** let a label or word outrank the number it describes.
- **Don't** fade disabled cells to ghosts; hatch them.
