# RallyQ

A free, open-play pickleball court rotation manager — like PickleQ, but with a
fairness engine that explicitly solves the odd-number-of-players problem
instead of leaving the organizer to eyeball it.

## What it solves

Paddle-stack queues (and most queue apps) break down the moment the waiting
pool isn't a clean multiple of 4. RallyQ never leaves that ambiguous:

- **Fairness scoring** ranks every waiting player by games played (primary)
  and wait time (tiebreaker), so the engine always knows exactly who's next.
- **Flex players** — the true remainder that can't form a full group — are
  explicitly tagged and shown in a dedicated tray, first in line to sub into
  the next open seat. Never silently stuck at the back of an undifferentiated
  line.
- **King of the Court mode** (toggle per court) only rotates the *losing*
  team out, so just 2 seats turn over at a time instead of 4 — which
  structurally absorbs odd numbers, since a lone flex player can slot
  straight into the seats just freed.
- **Partner/opponent variety** and **skill balancing** are optional toggles
  that bias team-building without breaking the fairness queue.

## Features

- Multi-court live view (4+ courts), tap-to-score, win detection
- The Rack: a paddle-rack styled visual queue, color-coded by status
- Player check-in / rest / bulk-add roster management
- Session leaderboard (win rate, games played)
- Fully client-side — no login, no backend, session persists via
  `localStorage` so a refresh won't lose state
- Built to deploy as a static site (Vercel, Netlify, GitHub Pages, etc.)

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static site to `dist/`.

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect the repo in the Vercel dashboard — it auto-detects the Vite
config. No environment variables needed.

## Notes

- All data lives in the browser's `localStorage` under the key
  `rallyq.session.v1`. Clearing site data resets the session.
- This is a single-organizer-screen tool by design — there's no shared
  backend, so it's intended to run on one device (the desk/tablet running
  the session), not as a multi-device live feed for players' phones.
