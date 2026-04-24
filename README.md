# Streamify

A modern, Netflix-inspired web player for Xtream-compatible IPTV playlists.

> Note: this repository is mid-rehaul. The frontend is being rebuilt on Vite +
> React 19 + TypeScript + Tailwind + shadcn/ui, and the legacy PHP/MySQL
> backend is being rewritten in Node (Fastify + SQLite). See phase progress in
> the project task list. The original PHP entry points (`proxy.php`,
> `tmdb.php`, `epg.php`, `epg-api.php`, `config.php`) still work today.

## Features

- Xtream API playlist support
- Live, Movies, and Series browsing
- Program guide and metadata
- Picture-in-Picture
- Favorites and resume playback
- Auto-play next episode
- Keyboard navigation

## Configuration

Edit `public/config.js`:

- `window.playername` — app name shown in the title bar
- `window.dns` — Xtream provider base URL (e.g. `http://provider.tld:80`)
- `window.cors` — set `true` if the provider lacks CORS; routes through the proxy
- `window.https` — set `true` if streams are served over HTTPS
- `window.tmdb` — optional TMDB API key used as a metadata fallback

## Legacy PHP deploy (today)

1. Fill in `public/config.js` and `public/config.php`.
2. Import `public/sql_table.sql` into your MySQL database.
3. Serve the built `build/` directory alongside the `*.php` files on Apache.

## Dispatcharr users

See [`DISPATCHARR.md`](./DISPATCHARR.md) for server-side stream-profile and proxy tuning that keeps live channels playing smoothly in browsers.
