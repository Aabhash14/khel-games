# Orbit Switch

A one-button arcade game. Tap (or press Space) to jump between the inner and outer orbit, dodge the pink blocks and grab the gold stars (+3). It gets faster as your score goes up.

Plain HTML, CSS and JavaScript: no framework, no build step, no server. That's why it can be hosted for free.

## Controls

| Action | Input |
|---|---|
| Switch orbit | Tap, click, Space, Up/Down arrow |
| Pause | Esc or P (also pauses automatically when you switch tabs) |
| Mute | M or the speaker button |

## Run locally

Option 1: double-click `orbit-switch/index.html`. Everything works except offline mode.

Option 2 (recommended, behaves like the real site). Run this from the `play` folder, one level above this one:

```bash
python -m http.server 8000
# open http://localhost:8000/orbit-switch/
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Page, menus |
| `style.css` | Menu/UI styling |
| `game.js` | The whole game |
| `sw.js` | Offline support (network first: players always get the newest version when online) |
| `manifest.webmanifest`, `icon.svg` | Install-to-home-screen support |

## Free hosting on your own domain (Cloudflare Pages)

1. Create a free GitHub account and a new repository, then push the whole `play` folder (all games) to it.
2. Create a free Cloudflare account, go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repo.
3. Build settings: framework preset **None**, build command **empty**, output directory **/**.
4. Deploy. You get a free `*.pages.dev` URL.
5. In the project, open **Custom domains → Set up a domain** and enter your domain (e.g. `play.yourdomain.com`).
   - If the domain's DNS is on Cloudflare (free plan), it's set up automatically.
   - Otherwise, add the CNAME record Cloudflare shows you at your domain registrar.
6. HTTPS is issued automatically. Every `git push` redeploys the games.

Each game lives in its own folder, so this one is served at `https://yourdomain.com/orbit-switch/`. All paths in the game are relative, so it works inside any folder name.

Cost: €0. Only your domain renewal, which you already pay.

Alternatives that are also free: GitHub Pages, Netlify (free tier has a bandwidth cap).
