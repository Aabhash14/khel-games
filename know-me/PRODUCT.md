# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Teenagers (and young adults) on their phones, in Nepal and abroad. Short, casual sessions, often with friends nearby or in a group chat. They want a quick, fun answer to "what kind of person am I?" and something to post or send.

## Product Purpose

Know Me is a quick personality game. You answer 8 everyday "what would you do?" situations and get one of 16 types. Then you send a challenge link and friends guess what you picked. Success is a player who finishes in about a minute, posts their type to a story, and sends the challenge to friends.

## Positioning

Not a questionnaire: every question is a small real-life dilemma with four concrete answers, and the second half is a social game (friends guess your answers and score how well they know you, then see how well you match).

## Operating Context

- Played in a mobile browser, installable to the home screen, works offline.
- Free static hosting (Cloudflare Pages planned), no backend, no paid services.
- Part of the `play` folder; each game is a self-contained folder.
- Results are shared mainly as Instagram / TikTok story images; challenge links go through chat apps.

## Capabilities and Constraints

- Plain HTML, CSS and JavaScript, no build step, no framework. No image files; fonts (Anton, Mukta) are self-hosted in fonts/; story images are drawn in canvas on the device.
- Flow (kept short on purpose): 8 questions -> result -> challenge friends. No "guess your own type" step.
- Four traits (Drive: Bold/Steady, Energy: Social/Solo, Compass: Head/Heart, Pace: Planner/Flow), 16 types.
- Friend challenge: link carries name, question ids and answers in the URL hash. Exact pick +2, same lean +1. After playing, the friend can take the test and see a match %.
- Save result as a story-sized image (1080x1920 PNG), shared with the system share sheet where supported, downloaded otherwise.
- Bilingual: English by default, Nepali toggle. All text lives in data.js in both languages.
- Scenario ids are stored in share links and must never be renumbered.

## Brand Commitments

- Name: Know Me (Nepali: मलाई चिन).
- The user opted out of the Proshore design system for the `play` folder.

## Evidence on Hand

- Working game in this folder (index.html, style.css, data.js, game.js, sw.js, manifest.webmanifest, icon.svg).
- No player feedback, usage numbers or reviews yet; do not invent any.
- This is a fun test, not a validated psychological assessment; never claim otherwise.

## Product Principles

- One minute to a result: fewer screens, fewer words, one tap per question.
- Teen voice: casual and funny, never preachy or clinical.
- Made to be posted: the result must look good as a screenshot or story image.
- The friend challenge is the replay loop, so it stays one tap away from the result.
- Kind results: every type has a real superpower; blind spots are teasing, not insults.

## Accessibility & Inclusion

- Readable at arm's length on a phone, large tap targets, works one-handed.
- Gender-neutral wording in both languages.
- Respect reduced-motion settings.
