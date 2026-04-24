# Streamify

A modern, Netflix-inspired web player for Xtream-compatible IPTV playlists.

**Stack:** Vite 5 + React 18 + TypeScript + Tailwind v4 + shadcn/ui on the
frontend, Fastify 5 + better-sqlite3 on the backend.

## Run it

```bash
# 1. Frontend
npm install
npm run dev              # Vite on http://localhost:3006

# 2. Backend (in a separate shell)
cd server
cp .env.example .env     # fill in XTREAM_DNS, TMDB_API_KEY, EPG_URL
npm install
cd ..
npm run dev:server       # Fastify on http://localhost:8787
```

The Vite dev server proxies `/api/*` to `BACKEND_URL` (default
`http://localhost:8787`, which matches the Fastify server). Nothing else
to wire up — just run both processes.

### What actually happens

- Browser loads the React app from Vite on `:3006`.
- App makes `POST /api/epg`, `GET /api/tmdb?...`, etc.
- Vite's dev proxy forwards those `/api/*` requests to Fastify on `:8787`.
- Fastify reads/writes SQLite, proxies TMDB/Xtream, ingests XMLTV.

If you don't run the backend, `/api/*` calls fail and you'll see empty
EPG, no TMDB metadata, and no proxy mode. Live TV still plays because
that stream URL points at the provider directly, not at our API.

## Configuration

Frontend runtime config in `public/config.js`:

- `window.playername` — app name shown in the title bar
- `window.dns` — Xtream provider base URL (e.g. `http://provider.tld:80`)
- `window.cors` — set `true` if the provider lacks CORS; routes through the proxy
- `window.https` — set `true` if streams are served over HTTPS
- `window.tmdb` — optional TMDB API key used directly by the frontend if set

Backend config in `server/.env` (see `server/.env.example` for the full list).

## Production

Build both pieces, then serve everything from the Fastify process:

```bash
npm run build              # Vite → ./build
npm run build:server       # Fastify → ./server/dist
STATIC_DIR=../build npm run server
```

One process serves the SPA and the API on the same origin. No PHP runtime,
no Apache rewrite rules, no MySQL.

## Features

- Live TV with virtualized channel list, EPG now/next, progress bars, favorites
- Movies and Series browsing with TMDB metadata
- Program guide, 12h/24h time format
- Picture-in-Picture, fullscreen, keyboard navigation
- Resume playback, auto-play next episode

## Dispatcharr users

See [`DISPATCHARR.md`](./DISPATCHARR.md) for server-side stream-profile and
proxy tuning that keeps live channels playing smoothly in browsers.

## Architecture notes

- `src/store/legacy.ts` is a Zustand-backed compatibility shim for
  `react-redux`. Vite aliases `react-redux` to it so legacy `useSelector` /
  `useDispatch` calls keep working until every component migrates.
- Backend routes live under `/api/*` (`/api/proxy`, `/api/tmdb`,
  `/api/epg`, `/api/healthz`). The frontend hits them through Vite's
  dev proxy; in prod Fastify serves both the SPA and the API on the
  same origin (see *Production* above).
