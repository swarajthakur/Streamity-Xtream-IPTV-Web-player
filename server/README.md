# Streamify backend

Fastify + better-sqlite3 replacement for the legacy PHP endpoints
(`proxy.php`, `tmdb.php`, `epg.php`, `epg-api.php`). Routes are mounted at
the same `.php` paths so the frontend needs zero changes.

## Quick start

```bash
cd server
cp .env.example .env
# edit .env — set XTREAM_DNS, TMDB_API_KEY, EPG_URL as needed
npm install
npm run dev
```

Defaults to `http://localhost:8787`. The Vite dev server already proxies
`/proxy.php`, `/tmdb.php`, `/epg.php`, and `/epg-api.php` to
`PHP_DEV_URL` (default `http://localhost:8000`) — point that env var at
this server's port:

```bash
# from repo root
PHP_DEV_URL=http://localhost:8787 npm run dev   # Vite
# in another shell
cd server && npm run dev                         # Fastify
```

## Endpoints

| Method | Path           | Purpose                                                              |
|--------|----------------|----------------------------------------------------------------------|
| GET    | `/api/healthz` | Liveness                                                             |
| ANY    | `/proxy.php`   | CORS proxy to `XTREAM_DNS`. Off unless `PROXY_ENABLED=true`.         |
| GET    | `/tmdb.php`    | Server-side TMDB v3 read proxy (key hidden). `path=` is allowlisted. |
| POST   | `/epg.php`     | `init=1` ingests EPG; otherwise `{epg_id, start, stop}` → list.      |

## Production single-origin deploy

Build the Vite frontend then point the server at it:

```bash
npm run build                  # from repo root → build/
cd server
npm run build                  # → server/dist/
STATIC_DIR=../build npm start
```

One Fastify process now serves both the SPA and the API routes — no
CORS, no Apache, no PHP runtime.

## Differences from the PHP version

- **SQLite instead of MySQL.** The old `sql_table.sql` maps 1:1; the only
  schema change is that timestamps are stored as Unix epoch integers
  rather than `TIMESTAMP` strings (simpler range queries, no TZ
  ambiguity).
- **Streaming proxy.** The old `proxy.php` buffered upstream responses
  via `file_get_contents`, which falls apart on long-lived HLS/TS
  streams. This version uses `undici` and streams the body straight
  through.
- **Streaming XML parse.** EPG ingest uses `sax` so the XMLTV document is
  never fully in memory.
- **SSRF defense.** DNS-resolves the proxy target and refuses private /
  loopback / link-local / multicast addresses. Same URL allowlist (must
  start with `XTREAM_DNS`) as the PHP version.
