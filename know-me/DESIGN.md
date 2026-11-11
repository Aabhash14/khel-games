---
name: Know Me
description: A personality game played as a trading-card pack. Open it, get dealt 8 cards, pull your holo rare.
colors:
  cobalt: "#2140ff"
  cobalt-deep: "#1328c9"
  paper: "#ffffff"
  ink: "#0b0b2e"
  soft: "#cdd6ff"
  hi: "#ffe66b"
  bold: "#ff5a36"
  steady: "#10b39c"
  social: "#ffbf1a"
  solo: "#7b61ff"
  head: "#139bff"
  heart: "#ff4f9a"
  plan: "#34c759"
  flow: "#b45cff"
typography:
  display-hero:
    fontFamily: "Anton, Mukta, Arial Narrow, sans-serif"
    fontSize: "clamp(110px, 36vw, 150px)"
    fontWeight: 400
    lineHeight: 0.9
  display:
    fontFamily: "Anton, Mukta, Arial Narrow, sans-serif"
    fontSize: "clamp(52px, 17vw, 74px)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Anton, Mukta, Arial Narrow, sans-serif"
    fontSize: "clamp(32px, 9.5vw, 40px)"
    fontWeight: 400
    lineHeight: 1
  headline-ne:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.15
  button:
    fontFamily: "Anton, Mukta, Arial Narrow, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.03em"
  title:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "clamp(23px, 6.6vw, 28px)"
    fontWeight: 800
    lineHeight: 1.18
  answer:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1
  meta:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  slot: "7px"
  sm: "12px"
  card-sm: "14px"
  md: "16px"
  lg: "20px"
  pill: "999px"
spacing:
  tight: "8px"
  gap: "12px"
  gutter: "16px"
  block: "22px"
  section: "44px"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cobalt}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "56px"
  button-primary-big:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.md}"
    height: "64px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "56px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    height: "48px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "58px"
  lang-toggle-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "34px"
  question-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "9px"
  answer-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.answer}"
    rounded: "{rounded.card-sm}"
    padding: "7px"
  sticker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 12px 14px"
  album-slot:
    rounded: "{rounded.slot}"
  rules-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
---

# Design System: Know Me

## Overview

**Creative North Star: "The Holo Pull"**

Know Me is an album page, and everything on it is a card. The ground is a flat, saturated cobalt; on it sit objects cut from white card stock: a crimped foil pack, question cards, answer cards dealt in a 2x2 grid, stickers, and the holo trading card the player pulls at the end. The page itself never carries colour beyond cobalt, white and ink. Colour arrives only on the cards, and the rarest colour of all, the rainbow holo foil, is reserved for the pack, the card back, and the inside of the trading card, where it follows the player's finger or the phone's tilt.

Density is low and the voice is loud. Display type is heavy condensed uppercase (Anton) set large and tight; everything else is a bold, friendly sans (Mukta) that also carries Devanagari. Objects sit slightly crooked (a degree or two of rotation), lift on soft blue-black shadows, and move with short, snappy springs: the pack tears, question cards are thrown off-screen, slots pop as they fill, the rare flips over. With reduced motion, all of that stops and the state simply changes.

The world explicitly refuses the quiz-app default: no headline-plus-progress-bar, no rounded answer list on a pastel gradient. Progress is an album strip of 8 card-shaped slots, and answers are cards, not rows.

**Key Characteristics:**
- Three-colour page: cobalt ground, white card stock, ink type and frames.
- Colour lives on cards: 8 trait-pole colours and the conic holo foil never paint the page.
- Every surface is a card: white stock, ink inner frame, slight tilt, soft drop shadow.
- Anton uppercase for display in English; Mukta 800 takes over display roles in Nepali.
- Holo foil plus a pointer- or tilt-driven sheen is the signature material.
- Motion is physical (tear, deal, pop, flip) and is fully removed under reduced motion.

## Colors

A three-colour album page (cobalt, white, ink) carrying cards that hold every other colour in the system.

### Primary
- **Album Cobalt** (cobalt): the page itself. Full-bleed background on html and body, the theme colour, the story-image ground, and the text colour inside white primary buttons, the active language segment and the pack title. Never used as a card fill.

### Secondary
- **Trait-pole colours** (bold, steady, social, solo, head, heart, plan, flow): one colour per trait pole, four axes of two. They appear on cards only: the split band of a question card (the axis's two poles side by side), the band of the holo card (the player's strongest pole), the small swatches in the card's stat boxes, the shapes in the generated card art, a picked answer's key strip, and the filled album slots. Every pole shape in the art is outlined in ink.

### Tertiary
- **Holo Foil** (conic gradient: pink, yellow, mint, periwinkle, violet; a paler twin for card interiors and answer keys): the rare material. Full-strength foil covers the sealed pack and the card back; pale foil fills the trading card's frame and the answer cards' letter strip. Each card seeds its foil angle from the answers (`--hue`), so no two pulls look the same.
- **Highlight Yellow** (hi): the one signal colour on the page. Focus rings, text selection, input focus border, and the wavy underline under error text. It also fills the superpower sticker's mark.

### Neutral
- **Card Stock White** (paper): card faces, buttons, inputs, stickers, pills, the pack label, and all primary text on cobalt.
- **Deep Ink** (ink): all text on white stock, the inner frame on every card, band rules, the outlines of art shapes and the emblem.
- **Soft Periwinkle** (soft): secondary text on cobalt (meta lines, hints, prompts above the question card, ledes, the "miss" verdict). About 4.5:1 on cobalt; do not set it smaller than 13px.
- **Deep Cobalt** (cobalt-deep): the scrollbar track only.

### Named Rules
**The Three-Ink Page Rule.** Anything that sits directly on the cobalt page is white, ink or soft periwinkle, plus yellow for focus, selection and errors. If it needs another colour, it has to become a card first.

**The Colour-Means-Trait Rule.** The eight pole colours always mean their trait pole. Never use one as a decorative accent, a status colour, or a button fill.

**The Foil Is Rare Rule.** Full-strength holo foil appears only on the pack and the card back; pale foil only inside a card's frame or an answer key. Foil never becomes a page background or a button.

## Typography

**Display Font:** Anton (with Mukta, Arial Narrow, sans-serif)
**Body Font:** Mukta (with system-ui, sans-serif), self-hosted at 500, 700 and 800, Latin and Devanagari subsets

**Character:** A poster-weight condensed caps face for anything that should feel printed on a card, paired with a round, heavy humanist sans that stays friendly in both English and Nepali.

### Hierarchy
- **Display hero** (Anton 400, clamp(110px, 36vw, 150px), 0.9): the friend's score numeral; the match percentage sits one step down (clamp(84px, 26vw, 112px), 0.95).
- **Display** (Anton 400, clamp(52px, 17vw, 74px), 0.88, cobalt on white): the pack title.
- **Headline** (Anton 400, clamp(32px, 9.5vw, 40px), 1, uppercase): section and screen titles. Verdicts and score tiers use Anton at 34px.
- **Button** (Anton 400, 21px, 0.03em, uppercase; 25px on big buttons).
- **Title** (Mukta 800, clamp(23px, 6.6vw, 28px), 1.18, balanced): the situation text on the question card.
- **Answer** (Mukta 700, 19px, 1.25): answer-card text.
- **Body** (Mukta 500, 17px, 1.45): running text; ledes cap at 34ch.
- **Meta** (Mukta 500, 15px; fine print 13px), soft periwinkle on cobalt.
- **Label** (Mukta 800, 12.5 to 14px): language toggle, answer tags, card stat labels (uppercase only inside the card).
- **On-card type** scales with the card using container units: the card name in Anton at 9.4cqw, stat numerals in Anton at 10.5cqw.

### Named Rules
**The Nepali Display Rule.** Anton has no Devanagari. Under `:lang(ne)` every Anton role switches to Mukta 800 at a slightly smaller size and looser leading (headline 30px/1.15, buttons 20px, card name 8.6cqw/1.15) with letter-spacing reset to 0. Never let Devanagari fall through to Anton's fallback.

**The Caps Are Display Rule.** Uppercase belongs to Anton roles and card-internal labels. Running Mukta text stays in sentence case.

## Layout

A single centred column, max 440px wide, with 16px side gutters and safe-area padding top and bottom; desktop shows the same phone column on the cobalt field. There are no width breakpoints; the only media queries are hover capability and reduced motion. Large type scales with clamp() against viewport width, and card internals scale with their own width through container units, so one card design renders from a 56px mini to a 320px hero.

Rhythm: 12px between sibling cards, buttons and stickers; 18 to 24px between blocks within a screen; 44px before a new section (the challenge and match blocks). Answers sit in a 2x2 grid with 12px gaps; during play the question screen is a full-height column with the album strip pushed to the bottom. The album strip is an 8-column grid of card-shaped slots (63:88) with 7px gaps.

## Elevation & Depth

Depth is physical: white card objects lift off the cobalt page on soft, blue-tinted drop shadows, and the hero card and pack live in real 3D (perspective 1000 to 1100px, rotateX/rotateY from drag or device tilt). Every shadow is tinted with the page's own deep blue (rgb 6 12 90), never neutral grey, and none is a hard offset.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 14px 30px rgb(6 12 90 / .45)`): question card, primary button, stickers, match lines.
- **Dealt card at rest** (`box-shadow: 0 8px 18px rgb(6 12 90 / .32)`): answer cards.
- **Picked** (`box-shadow: 0 16px 28px rgb(6 12 90 / .45)`): a chosen answer, lifted 6px and scaled 1.04; the friend's true pick adds a 4px white ring.
- **Pack** (`box-shadow: 0 30px 50px rgb(6 12 90 / .55)`): the sealed pack, the highest object on the page.
- **Holo card** (`box-shadow: 0 6cqw 12cqw rgb(6 12 90 / .5)`): scales with card size.

### Named Rules
**The Blue Shadow Rule.** Shadows are soft and tinted rgb(6 12 90). A shadow that is grey, black, or hard-offset does not belong to this world.

## Shapes

Everything is a rounded rectangle, and most of it is card-proportioned. The trading card, its back, the mini cards and the album slots all use the 63:88 trading-card ratio; the pack is 25:37. Cards are built as white stock with an ink inner frame inset a few pixels (3px ink line on the question card, 2.5px on answers, 1.1cqw on the holo card), and their header bands are separated by an ink rule. Corners step from 7px (slots) through 12px (stickers), 14px (answers), 16px (buttons, inputs, pack) and 20px (question card); the holo card rounds at 5.5cqw. Pills (999px) are reserved for the language toggle, answer tags and the rules pill. Cards sit off-axis: answers at -1.4 to 1.2 degrees, the question card at -1.2, the pack at -4, stickers at -2 and 1.6.

## Components

### Buttons
Thick, white and confident; buttons are the only full-width white slabs besides cards.
- **Shape:** gently rounded (16px), 2.5px white border, full width, min height 56px (64px for the big call to action).
- **Primary:** white fill, cobalt Anton caps, card-lift shadow. Optional 22px stroked line icon before the label.
- **Ghost:** transparent with a 75%-white border, white caps.
- **Text:** borderless, Mukta 700 17px, underlined with a 5px offset; used for the quiet "start again" exit.
- **Press / Focus:** press nudges down 2px and scales to 0.985; focus is a 3px yellow outline offset 3px.

### Inputs / Fields
- **Style:** white fill, ink Mukta 700 19px, 16px radius, 58px tall, 3px transparent border, cobalt caret.
- **Focus:** the border turns highlight yellow (no outline).
- **Error:** a white bold line under the field with a wavy yellow underline.
- **Read-only link field:** smaller (14px, 52px tall) beside an auto-width button.

### Navigation
A top strip only: the KNOW ME wordmark (Anton 24px, white) as the home control on the left, or a 44px round back button with a stroked arrow; on the right, the EN | नेपाली segmented pill (2px 70%-white outline; the active segment is a white pill with cobalt text).

### Question Card
White stock tilted -1.2 degrees with an ink inner frame. The header band is split down the middle into the question axis's two pole colours, carries the card count (and points, in friend play) in Anton caps, and sits on a 3px ink rule. The situation text below is Mukta 800, balanced. When answered, the card is thrown off to the right (translate and rotate 18 degrees).

### Answer Cards
Four portrait cards dealt in a 2x2 grid, each with its own tilt and foil hue. A pale-foil key strip carries the letter A to D in Anton; below it the answer text, then an optional ink pill tag (for example the friend's real pick). States: hover lifts 4px and straightens; picked lifts 6px, scales 1.04, and the key strip takes the chosen pole's colour; unchosen cards fade to 45%; in friend play the truth gets a white ring and a pop, a wrong guess is struck through and shrinks, a near guess gets a dashed inner frame.

### Holo Trading Card (signature)
The reward. White stock, a pale-foil frame inside a 1.1cqw ink border with diagonal light streaks; a pole-coloured name band with the type name in Anton caps and the card number; a framed art window; the tagline; and four stat boxes (pole swatch, label, big Anton numeral). The art is generated per player: each trait draws its own ink-outlined pole-colour shape (starburst or circle, triangle or heart, dot cluster or ringed dot, zigzags or waves), and the type's emblem sits in ink on a white centre badge. A sheen overlay (radial highlight plus diagonal rainbow bands, overlay blend) follows `--mx`/`--my` from drag or device tilt. The back is full foil with a tilted white KNOW ME plate. Flips on a 0.95s spring. The 1080x1920 story image redraws the same card in canvas on cobalt.

### Album Slots
Eight card-shaped slots in a strip. Empty: 2px dashed 55%-white border. Filled during play: a solid white border and the answer's pole colour, popping in with a slight rotation. In friend scoring: white for exact, 55% white for close, an outline only for a miss.

### Stickers
Two white stickers side by side in a two-column row, tilted in opposite directions, each led by a drawn mark in a 34px ink-ringed circle (a lightning bolt on yellow for the superpower, a warning triangle on pink for the blind spot). The mark is the label; the text after it is the content, with the category name available only to screen readers.

### Sealed Pack
Full foil with diagonal stripes, crimped top and bottom edges, a white label plate with the cobalt pack title, tilted -4 degrees and tilting in 3D. On open, the top crimp rips away and the pack drops out.

## Do's and Don'ts

### Do:
- **Do** keep the page to cobalt, white, ink and soft periwinkle; put every other colour on a card.
- **Do** build new surfaces as white card stock with an ink inner frame, a slight tilt and a blue-tinted shadow (0 14px 30px rgb(6 12 90 / .45)).
- **Do** use a pole colour only to mean that pole, and outline pole shapes in ink.
- **Do** label with a drawn mark or a card band, the way stickers and question cards do.
- **Do** switch every Anton role to Mukta 800 under `:lang(ne)`.
- **Do** use highlight yellow for focus (3px outline, 3px offset), selection and error underlines.
- **Do** make motion physical (tear, deal, pop, flip) and remove all of it under prefers-reduced-motion.

### Don't:
- **Don't** put a small uppercase eyebrow or kicker line above a heading; a card band or a drawn mark carries the label instead.
- **Don't** use holo foil as a page background, a button fill, or a text colour.
- **Don't** add a progress bar or a list of answer rows; progress is the album strip and answers are dealt cards.
- **Don't** use grey, black or hard-offset shadows.
- **Don't** set Devanagari in Anton or let it fall back to a system display face.
- **Don't** use pastel gradients on the page.
