# Duo · जोडी — Tempo Art

Chosen 2026-11-12 from five design directions. Duo looks like the back of a hand-painted Nepali truck or tempo: saturated painted panels, white pinstripes, sign-painter capitals, brushy Devanagari, and bumper stripes framing every screen.

## Palette

| Token | Hex | Job |
| --- | --- | --- |
| green | `#0c5a3b` | page ground |
| green-2 / green-3 | `#08402a` / `#052c1c` | secondary buttons, overlays |
| yellow | `#ffcb1f` | crown, boards, plaques, bumper stripes |
| red | `#d41f16` | Player 1 (bottom) |
| blue | `#1f52d4` | Player 2 (top) |
| pink, leaf | `#ff4f9a`, `#17803a` | extra tile fills only |
| white | `#fffaf0` | pinstripes, HUD plaques |
| ink | `#141210` | keylines, text on yellow and pink |

Tile fills cycle red, blue, yellow, pink, leaf. Text on yellow and pink is ink; on red, blue and leaf it is white.

## Type

- **Bungee**: Latin labels, buttons, scores, callouts.
- **Bungee Shade**: the DUO logo only.
- **Yatra One**: all Devanagari, player names, and the logo's जोडी.
- **Hind** 600/700: body copy and rules.

In Nepali mode, every Bungee role falls back to Yatra One at a larger size.

## Signatures

- **Pinstripe**: an ink keyline, then a band of the fill colour, a white line, and the fill again, all as inset box-shadows on every painted panel.
- **Bumper stripes**: 135° ink and yellow stripes at the top and bottom of every screen, and across the middle of the split overlays.
- **Painted coins**: the player colour with a white ring and an ink outline.
- **Callouts**: white Bungee lettering with a stacked red-then-ink sign-painter shade (offset text shadow; the world's lettering, never box shadows).
- **Slogan**: पालो पर्खनुस् ("Wait your turn") on a red ribbon in the crown.

## Rules

- The active player's HUD fills with their colour and gains a white and ink ring; the waiting player's HUD stays white.
- No glows: rings are solid outlines, and shadows have an offset and a blur.
- Icons come from the one stroke set in `js/icons.js`, drawn in `currentColor`.
