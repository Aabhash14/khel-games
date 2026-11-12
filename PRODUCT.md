# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and JavaScript. No framework, no build step, no backend. Every game is a self-contained folder with relative paths; the whole `play` folder deploys as one static site.

## Users

Teenagers and young people in Nepal (and their friends), mostly on phones, opening a link someone shared. They want a game that gives them a result or a story within about a minute, and something worth showing a friend.

## Product Purpose

Khel (खेल) is a growing collection of small, free browser games. Most are built around decisions (bluffing, trusting strangers, guessing, betting on yourself) rather than pure reflex. The landing page at the site root lets a visitor see every game and start one in one tap.

## Positioning

Games with a Nepali voice: real places (Asan bazaar, Kathmandu rooftops, Sagarmatha camps, Indra Jatra at Hanuman Dhoka), Nepali-language play, and decision-led mechanics. Each game has its own committed visual world rather than a shared template.

## Capabilities and Constraints

- Hosting must cost nothing (planned: Cloudflare Pages on a domain the user owns). Anything server-side must stay in free tiers and be optional.
- English and Nepali (Devanagari) in every game; Nepali-first games default to Nepali.
- Games work offline as installable PWAs (each has its own `manifest.webmanifest`, `sw.js`, `icon.svg`).
- Collections nest one level: `play/<game>/` and `play/nepali-games/<game>/`.
- Playable: Tuin Paar, Imposter, Know Me, Pro Scout, Orbit Switch, Changa Chet, Himal Climb, Bato Harayo, Mol-Molai, Indra Jatra. Planned (no game yet): Bagh-Chal, Momo Rush, Tihar Diyo.

## Brand Commitments

- Collection name: **Khel · खेल** (confirmed 2026-11-10).
- Each game keeps its own look; hubs frame the games, they do not restyle them.
- Copy is casual, short, teen-voiced, in both languages.

## Evidence on Hand

- Each game folder has a README with real rules and features, and an `icon.svg`.
- No player counts, ratings, reviews or press exist. Do not invent them.
- Mol-Molai uses OpenStreetMap data (ODbL credit required).

## Product Principles

1. A real decision beats a faster reflex.
2. A result in about a minute, then something to share.
3. Nepali first, never Nepali as decoration.
4. Free to host, free to play, no accounts.
