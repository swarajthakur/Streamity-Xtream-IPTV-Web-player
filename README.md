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

The Vite dev server proxies `/proxy.php`, `/tmdb.php`, `/epg.php`, and
`/epg-api.php` to `PHP_DEV_URL` (default `http://localhost:8000`). Point it
at the Fastify server instead:

```bash
PHP_DEV_URL=http://localhost:8787 npm run dev
```

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
- The backend routes are deliberately mounted at the legacy `/proxy.php`,
  `/tmdb.php`, `/epg.php` paths so the frontend needs zero rewrites during
  the migration.
- `public/proxy.php`, `tmdb.php`, `epg.php`, `epg-api.php`, `config.php`,
  and `sql_table.sql` are superseded by `server/` and can be deleted once
  you've confirmed the Node backend works against your provider.
