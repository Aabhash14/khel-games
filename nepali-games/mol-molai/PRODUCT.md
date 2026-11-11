# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nepali players on phones, in Nepal and abroad. Casual, short sessions (a few minutes, often one-handed, on the bus or between tasks). Nepali is the default language; English is a toggle. They already know what Dashain shopping in Asan feels like, so the game should feel recognisable, not explained.

## Product Purpose

A haggling game set in Asan bazaar at Dashain. The player gets a budget and a shopping list from Aama and must buy everything, keeping as much money as possible, by bargaining, bluffing and reading shopkeepers. Success is a player who finishes a level, wants to try the next one, and feels clever about a deal they pulled off.

## Positioning

The core skill is reading people: shopkeepers have hidden lowest prices, patience and personalities, show tells, call you back, and catch lies, and the bazaar remembers your reputation. It is played on a real map of Asan (OpenStreetMap streets, real tole names) with real walking times, so planning a route between competing shops is part of the game.

## Operating Context

- Played in a mobile browser, installable to the home screen, works offline.
- Free static hosting (Cloudflare Pages planned), no backend, no paid services.
- Part of the `nepali-games` collection in the `play` folder; each game is a self-contained folder.

## Capabilities and Constraints

- Plain HTML, CSS and JavaScript, no build step, no framework. Everything drawn in canvas or DOM; sound generated in code; no image or audio files.
- Progression is **numbered levels** with a savings target (and the day's time limit); beating the target unlocks the next level. Levels are the only mode: the old "Today's bazaar" and random bazaar modes are removed.
- Existing systems to keep: 17 shopkeepers with personalities across 8 real toles, haggling moves (offer, true/false "other shop" claim, accept, chat, walk away), tells, reputation, first-sale (बोहनी) discounts, goat stock selling out, lane events, badges, voices (Web Speech API, gendered per character), bilingual text, map with route planning.
- Map data © OpenStreetMap contributors (ODbL): the credit must stay visible on the in-game map and in the README.

## Brand Commitments

- Name: Mol-Molai (मोलमोलाई). Nepali first, Devanagari digits in Nepali mode.
- Belongs to the Nepali Games collection; the user opted out of the Proshore design system for this folder.

## Evidence on Hand

- Working game: `index.html`, `style.css`, `game.js`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `README.md`.
- Balance data from simulated players (README "Tuning" section).
- No real player feedback, reviews or usage numbers yet; do not invent any.

## Product Principles

- Phone first: every decision reachable with a thumb, readable at arm's length, short sessions.
- The haggle is the hero: the shopkeeper's face and the price on the table matter more than chrome.
- Teach by playing: early levels introduce one idea at a time; no walls of rules.
- Feel the bazaar: Asan's sound, crowd and festival mood, not a generic shop UI.
- Fair challenge: every loss is readable (you can see why you overpaid or got caught).
