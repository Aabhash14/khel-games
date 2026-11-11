---
name: Khel · खेल (collection hub)
description: The root hub of the Khel games collection, a Nepali corner-shop shelf where every game is a box you turn over before you play.
colors:
  wall: "#0b5d57"
  wall-deep: "#06403c"
  wall-text: "#eafff9"
  wall-soft: "#a9ddd2"
  sign: "#f2b51d"
  sign-letter: "#ad160e"
  sign-ink: "#1a1410"
  vermilion: "#d7261e"
  wood: "#94532a"
  wood-hi: "#d08a4e"
  wood-dark: "#4f2610"
  paper: "#fff6d8"
  paper-ink: "#2a1d12"
  card: "#c89a63"
  card-dark: "#a77a46"
  card-label: "#f3e6cc"
  card-ink: "#3b2611"
  stamp-ink: "#5e0b06"
  pencil-red: "#a3150d"
  focus: "#ffd23f"
typography:
  display:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "clamp(58px, 17vw, 96px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0em"
  display-latin:
    fontFamily: "Anton, Mukta, Arial Narrow, sans-serif"
    fontSize: "0.56em"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Anton, Mukta, Arial Narrow, sans-serif"
    fontSize: "12.4cqi"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "0.01em"
  headline-ne:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "8.4cqi"
    fontWeight: 800
    lineHeight: 1.25
  title:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "clamp(16px, 4.2vw, 19px)"
    fontWeight: 700
    lineHeight: 1.45
  body:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "max(13px, 6.6cqi)"
    fontWeight: 700
    lineHeight: 1.32
  body-page:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Anton, Mukta, Arial Narrow, sans-serif"
    fontSize: "max(11px, 5.2cqi)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.08em"
  label-ui:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.45
rounded:
  strip: "2px"
  label: "3px"
  face: "4px"
  key: "6px"
  sign: "12px"
  pill: "999px"
spacing:
  gutter: "16px"
  gutter-wide: "28px"
  box-gap: "22px"
  box-gap-wide: "26px"
  plank: "30px"
  box-depth: "40px"
  headroom: "34px"
components:
  signboard:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.sign-letter}"
    typography: "{typography.display}"
    rounded: "{rounded.sign}"
    padding: "0.12em 0.62em 0.02em"
  shelf-tag:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.strip}"
    padding: "4px 12px 3px"
  lang-toggle:
    backgroundColor: "{colors.wall-deep}"
    textColor: "{colors.wall-soft}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.pill}"
    padding: "3px"
  lang-toggle-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.pill}"
  dice-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.pill}"
    padding: "0 16px 0 12px"
    height: "44px"
  box-face:
    rounded: "{rounded.face}"
    width: "clamp(168px, 47vw, 214px)"
  box-label:
    rounded: "{rounded.label}"
    padding: "3cqi 4cqi 3.4cqi"
  play-key:
    typography: "{typography.display-latin}"
    rounded: "{rounded.key}"
    height: "46px"
  box-soon:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-ink}"
    rounded: "{rounded.face}"
  box-soon-back:
    backgroundColor: "{colors.card-label}"
    textColor: "{colors.paper-ink}"
  played-sticker:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.vermilion}"
    rounded: "{rounded.pill}"
    size: "24cqi"
---

# Design System: Khel · खेल (collection hub)

**Scope.** This system governs the root hub only: `index.html` at the site root with `assets/hub.css`, `assets/hub.js`, `assets/art/`, `assets/icon.svg` and `assets/fonts/`. Every game folder (`know-me/`, `pro-scout/`, `orbit-switch/`, `nepali-games/*`) keeps its own committed visual world, and some carry their own DESIGN.md (`know-me/DESIGN.md`, `nepali-games/mol-molai/DESIGN.md`). Those are separate systems. Nothing here applies inside a game, and nothing inside a game changes this hub. The hub frames the games; it never restyles them.

## Overview

**Creative North Star: "The Pasal Shelf"**

The hub is a Nepali corner shop seen from the counter. A painted peacock-teal wall carries the page, a tin signboard bolted at a slight tilt names the shop, and wooden plank shelves hold the games as physical boxes. Each box wears its game's own colours and art, so the page looks like a shop stocked by many brands, not a store grid drawn from one template. You browse box fronts, pull one forward, turn it over to read the back, then press Play.

Density is a real shelf: boxes of different heights stand on a shared plank, slightly angled toward the viewer, with paper price-tag strips naming each shelf by the kind of decision its games ask for. Materials do the work that cards and borders would do elsewhere: painted wall with a faint grain and a ceiling light wash, lit plank edge, cardboard and tape, paper tags, a rubber stamp, a round "played" sticker. Type is loud packaging type: condensed Anton caps for Latin, heavy Mukta for Devanagari, both at box-label scale.

The world rejects the app-store grid of same-size rounded tiles. Shelf, box and tag are the only containers.

**Key Characteristics:**
- Peacock-teal painted wall as the page ground; wood, paper, tin and cardboard as the only surfaces on it.
- Every game is a 3D box with front, two spines and a back; the box turns over in 3D as the signature interaction.
- Per-box colour comes from the game, through a fixed set of custom properties; the shelf supplies everything else.
- Bilingual by structure: every visible string exists in English and Nepali, switched by `html[lang]`.
- Box internals scale with the box (container query units), so one label grid holds at every width.

## Colors

A saturated shop palette: teal wall, mustard tin, vermilion paint, warm wood and paper, with each game box bringing its own colours on top.

### Primary
- **Peacock Teal Wall** (wall): the page ground and the browser theme colour. It carries most of the screen; everything else sits on it.

### Secondary
- **Tin Signboard Mustard** (sign): the signboard ground only. Its rarity keeps the name the loudest thing on the wall.
- **Sign-Paint Red** (sign-letter): the Devanagari खेल lettering on the signboard.

### Tertiary
- **Vermilion** (vermilion): the painted inner rule of the signboard and the lettering on the played sticker.

### Neutral
- **Deep Wall** (wall-deep): the wall's shadowed bottom, the html background behind overscroll, and the inset well of the language toggle.
- **Wall Chalk** (wall-text): primary text on the wall (tagline, toggle hover).
- **Wall Mint** (wall-soft): secondary text on the wall (footer, inactive toggle option), tinted from the wall rather than grey.
- **Sign Ink** (sign-ink): the Latin KHEL on the signboard and the selection text colour.
- **Plank Wood** (wood), **Lit Edge** (wood-hi), **Plank Shadow** (wood-dark): the shelf plank body, its lit top edge (also the scrollbar thumb), and its bottom lip.
- **Price-Tag Paper** (paper) with **Tag Ink** (paper-ink): shelf tags, the active language option and the dice button. Paper is the hub's control material.
- **Cardboard** (card), **Cardboard Fold** (card-dark), **Cardboard Label** (card-label), **Marker Brown** (card-ink): the coming-soon box front, spines, back, and lettering.
- **Stamp Oxblood** (stamp-ink): the COMING SOON rubber stamp.
- **Pencil Red** (pencil-red): the dashed "being built" note on a coming-soon back.
- **Bulb Yellow** (focus): focus rings, text selection, and the played sticker ground.

### Named Rules
**The Brand-Owns-the-Box Rule.** A game box's colours are the game's, set per box through `--bg`, `--ink`, `--label`, `--label-ink` and `--accent`. Hub colours never paint a playable box, and box colours never leak onto the wall, plank or tags.

**The Paper Is the Control Rule.** Hub-level controls (language toggle active state, dice button) are price-tag paper on the wall. Do not introduce a new control colour.

## Typography

**Display Font:** Anton (with Mukta, Arial Narrow fallback), self-hosted, 400 latin only
**Body Font:** Mukta (with system-ui fallback), self-hosted, 500 / 700 / 800, latin and devanagari subsets

**Character:** Anton is condensed packaging type for Latin names, bands and the Play key; Mukta at 800 is its Devanagari partner and carries all running copy. Nepali is set as a first-class headline, never as a caption under English.

### Hierarchy
- **Display** (Mukta 800, clamp(58px, 17vw, 96px), 1): खेल on the signboard, with **Display Latin** KHEL beside it in Anton at 0.56em, uppercase, 0.02em tracking.
- **Headline** (Anton 400, 12.4cqi, 1.02, uppercase, 0.01em): the game name on a box label; **Headline Nepali** (Mukta 800, 8.4cqi, 1.25) sits directly under it in the box's `--bg` colour.
- **Title** (Mukta 700, clamp(16px, 4.2vw, 19px)): the one-line tagline under the sign, max 34ch, balanced. Shelf tags use Mukta 800 at 16px with a 13px 700 count.
- **Body** (Mukta 700, max(13px, 6.6cqi), 1.32): the hook on a box back. The decide line follows at max(12.5px, 6.2cqi) in 800. Page-level body (footer) is Mukta 500 at 15px, line-height 1.45, max 52ch.
- **Label** (Anton 400, max(11px, 5.2cqi), 0.08em, uppercase): the box band. Spines use Anton 13px, 0.06em, set vertically. Facts chips are Mukta 700 at max(11px, 5.2cqi). Controls (toggle, dice) are Mukta 800 at 15px.

### Named Rules
**The Devanagari Swap Rule.** Wherever Anton or uppercase tracking is applied, any `lang="ne"` span inside switches to Mukta 800 (700 in bands) with letter-spacing 0 and no text-transform. Devanagari is never tracked, never uppercased, never set in Anton.

**The Floor-Under-Fluid Rule.** Box type scales in container units but every reading size has a px floor (`max(11px, …)` and up). New box text follows the same pattern.

## Layout

The page is a single column: tools row, signboard, tagline, then shelves, then a short footer, all inside a 1180px max width.

- **Phones (below 760px):** box width is clamp(168px, 47vw, 214px), so about two boxes show per shelf. Each shelf is a horizontal scroller with mandatory snap, 16px scroll padding, and a thin wood-coloured scrollbar. Gutters are 16px; boxes sit 22px apart with 34px of headroom above for the lift and turn.
- **760px and up:** box width fixes at 200px, gutters grow to 28px, shelves wrap side by side along the wall and stop scrolling; each shelf's boxes centre on their plank with 26px gaps.
- **1100px and up:** box width 214px; the tools row tightens so the first shelf stays in the first viewport.
- **Rhythm:** shelves stack 14px apart. The plank is 30px tall and boxes stand 4px into it. The shelf tag overlaps the plank face, rotated -0.8deg, inset to the shelf gutter.
- Box height comes from its own aspect ratio (`--ar`, about 0.6 to 0.86), so a shelf reads as mixed stock standing on one line (`align-items: flex-end`).

## Elevation & Depth

Depth is physical and real 3D, not a card shadow scale. Boxes are CSS 3D objects (perspective 760px, preserve-3d) with a front, a back and two spines at 40px depth, each resting at a slight per-box angle (`--rest`, about ±16 to 20deg). Shadows exist only where an object meets a surface or hangs off a wall.

### Shadow Vocabulary
- **Contact shadow** (radial-gradient ellipse under each box, black at 0.5): the box standing on the plank. It shrinks and fades as the box lifts.
- **Hung tin** (`0 14px 26px -8px rgb(0 0 0 / .55), 0 3px 6px rgb(0 0 0 / .25)`): the signboard hanging off the wall.
- **Plank drop** (`0 16px 18px -6px rgb(0 0 0 / .45)` with a 3px wood-dark inner lip): the shelf throwing shadow on the wall below.
- **Paper on wood** (`0 2px 3px rgb(0 0 0 / .35)`): shelf tags and the played sticker.
- **Paper control** (`0 3px 8px rgb(0 0 0 / .3)`, hover `0 6px 14px rgb(0 0 0 / .32)`): the dice button.
- **Key lip** (`0 3px 2px` in the box colour darkened 45%, plus `0 6px 12px rgb(0 0 0 / .25)`): the Play key's pressable edge; it deepens on hover and collapses to 1px on press.
- **Art lift** (`drop-shadow(0 6px 10px rgb(0 0 0 / .3))`): contained icon art floating on a box front. Full-bleed art has none.

### Named Rules
**The Things Touch Things Rule.** Every shadow describes a real contact: box on plank, tin on wall, paper on wood, key above face. No ambient glows, no shadows on flat panels.

## Shapes

Small, honest corners from real materials: 2px on paper strips and spines, 3px on labels and fact chips, 4px on box faces and the stamp, 6px on the Play key and focus rings, 12px on the tin signboard. Pills (999px) are reserved for wall controls and the dashed "being built" note; circles for sign bolts, the sticker and the turn-back button. Slight rotations carry the handmade feel: sign -1.2deg, tags -0.8deg, tape -2deg, stamp -9deg, sticker 14deg. Hairlines are `currentColor` mixed to 25 to 35% so they follow each box's ink.

## Components

### Signboard
Painted tin, bolted up. Mustard ground with a 3px vermilion rule inset 5px from the edge, two dark bolts at the top corners, a 12px radius, a -1.2deg tilt. खेल in Mukta 800 in sign-paint red and KHEL in Anton in sign ink share a baseline. It is the page's h1 and appears once.

### Wall controls (language toggle, dice)
- **Language toggle:** a deep-wall inset well (pill, 3px padding) holding EN and ने; the active option is a paper pill, the inactive one wall-mint text that brightens on hover. Each option is at least 46 by 40px. It sets `html[lang]`, persists to localStorage, and defaults from the browser language.
- **Dice "pick for me":** a paper pill (44px tall) with an inline dice SVG. Hover lifts 2px and turns the dice 180deg; a click rolls it the same way and opens a random playable box (coming-soon boxes are excluded).
- **Focus:** every control uses the global 3px Bulb Yellow outline at 3px offset.

### Shelf (tag and plank)
A shelf is a labelled section: a paper price-tag h2 (shelf name plus a smaller game count, both bilingual) stuck on the front of a wood plank, with a scrolling track of boxes standing on it. Shelves are named by the decision their games ask for, not by genre. The plank is a three-band wood gradient (4px lit edge, body, darker bottom) with a 3px shadow lip.

### Game Box (signature component)
Every playable game is one box built from the same label grid. The box element sets the game's look through inline custom properties:

| Property | Role |
|---|---|
| `--bg` | front face colour, spine colour (darkened 28%), Play key ground, Nepali name colour on the label |
| `--ink` | band and spine text on the front, Play key text |
| `--label` | the front label panel and the whole back face |
| `--label-ink` | text on the label and back |
| `--accent` | the Play triangle |
| `--ar` | width-to-height ratio, varied per box so shelves look stocked, not gridded |
| `--rest` | resting Y rotation, alternating sign along a shelf (about ±16 to 20deg) |

**Front (top to bottom):** the **band** (Anton caps "Khel No. NN" on the left, the game's languages on the right, e.g. "ने · EN" with the first-listed language being the game's default, a 1px rule under it); the **art** (the game's own icon art from `assets/art/<id>.svg`, either contained with an art-lift shadow or full-bleed with the `bleed` modifier); the **label** panel (Anton name, Mukta Nepali name in `--bg`, then a three-word teaser separated by middots above a hairline). The whole front is one button (`aria-expanded`, `aria-controls` pointing at the back) inside the h3. A **played** sticker (yellow disc, vermilion Anton caps, 14deg) appears top right once the game has been opened.

**Spines:** left spine carries the English name, right spine the Nepali name (or English again for English-only games), set vertically in Anton or Mukta 800.

**Back (top to bottom):** the band repeated as a header carrying the game name, with a circular turn-back button (40px, arrow-loop SVG) top right; the **hook** (one or two sentences, real places and stakes); the **decide** line (the choice the game asks for, in 800, colour mixed 80% `--bg` into the ink); **facts** (up to three bordered chips, each sourced from the game's README, the last one naming its languages); the **Play** key (full width, 46px minimum, Anton caps, `--bg` ground, `--ink` text, play triangle in `--accent`, 6px radius, key-lip shadow). The back is `inert` until turned.

**Motion:** easing is `cubic-bezier(.22, 1, .36, 1)` throughout. At rest the box sits at `--rest`. Hover lifts it 10px and 14px toward the viewer and turns it 15% further. Opening runs `pull-turn` over 0.95s: the first 32% pulls the box up 22px and forward 30px at its resting angle, the rest rotates it to 180deg, while the contact shadow shrinks. Focus moves to the back's Play key after 320ms. With reduced motion, faces swap instantly with no lift or pull. Without JavaScript, the noscript style lays front and back out flat, one after the other.

**Adding a new playable game:**
1. Add an `<li class="slot">` to the shelf whose decision type fits; update that shelf tag's count in both languages.
2. Give the `<article class="box">` an `id` matching the game slug and set all seven custom properties inline. Take `--bg`, `--ink` and `--accent` from the game's own visual world; choose `--label`/`--label-ink` as a light or dark panel that reads clearly. Check contrast for the Nepali name (`--bg` on `--label`), the decide line, the band (`--ink` on `--bg`) and the Play key before shipping. Alternate `--rest` sign against the neighbouring box and vary `--ar` from it.
3. Draw the box art as `assets/art/<id>.svg` from the game's own icon and palette; use `bleed` for scene art, contained for an emblem.
4. Copy an existing box's markup exactly and fill the band (next "Khel No." number and languages), label (name, Nepali name, bilingual teaser), both spines, and the back (bilingual hook, decide line, three README-sourced facts, Play link to the game folder with a trailing slash). Keep the sr-only "turn over to read more" and "Turn back" strings.
5. Never invent counts, ratings or claims; facts come from the README.

### Coming-Soon Box (cardboard variant)
A planned game is a taped plain cardboard box: add `soon` to the box, set only `--ar` and `--rest` inline (the variant supplies the colours). The front has no band, art or sticker: a strip of translucent packing tape across the top at -2deg, the Nepali name large (13cqi) over the English name smaller (9cqi) in marker brown, and an oxblood COMING SOON rubber stamp (3px border, -9deg). The back has the band header, the hook, and a dashed pencil-red "Being built" pill in place of the decide line, facts and Play. The dice never picks a coming-soon box. When the game ships, replace the variant with a full game box and move it to its decision shelf.

## Do's and Don'ts

### Do:
- **Do** keep the wall teal and let wood, paper, tin and cardboard be the only surfaces on it.
- **Do** build every new game as a box with the band / art / label front and the band / hook / decide / facts / Play back, colour-set through `--bg`, `--ink`, `--label`, `--label-ink`, `--accent`, `--ar`, `--rest`.
- **Do** write every visible string twice, as `data-l="en"` and `data-l="ne"` with `lang="ne"`, and apply the Devanagari Swap Rule wherever Anton or tracking appears.
- **Do** keep box internals in container units with px floors so the label grid holds from 168px to 214px wide.
- **Do** keep shadows to real contacts and the motion on the shared ease, with a reduced-motion path that swaps faces instantly.
- **Do** name shelves by the decision their games ask for.

### Don't:
- **Don't** lay games out as a grid of same-size rounded tiles; boxes vary in height and stand on planks.
- **Don't** paint a playable box in hub colours or restyle a game to fit the hub; the game's own world supplies its box.
- **Don't** set Devanagari in Anton, uppercase it, or track it.
- **Don't** add ambient glows, gradient text, or shadows on flat panels.
- **Don't** put counts, ratings, reviews or play times on boxes unless the game's README states them.
