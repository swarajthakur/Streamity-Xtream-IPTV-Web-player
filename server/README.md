# Streamify backend

Fastify + better-sqlite3 service. Replaces the legacy PHP endpoints the
old player shipped with. Routes live under `/api/*` (proxy, tmdb, epg).

## Quick start

```bash
cd server
cp .env.example .env
# edit .env — set XTREAM_DNS, TMDB_API_KEY, EPG_URL as needed
npm install
npm run dev
```

Defaults to `http://localhost:8787`. The Vite dev server proxies `/api/*`
to `BACKEND_URL` (default `http://localhost:8787`), so as long as both are
running the frontend reaches the API with no further config.

```bash
# from repo root
npm run dev               # Vite on :3006 (SPA)
npm run dev:server        # Fastify on :8787 (API) — separate shell
```

## Endpoints

| Method | Path           | Purpose                                                              |
|--------|----------------|----------------------------------------------------------------------|
| GET    | `/api/healthz` | Liveness                                                             |
| ANY    | `/api/proxy`   | CORS proxy to `XTREAM_DNS`. Off unless `PROXY_ENABLED=true`.         |
| GET    | `/api/tmdb`    | Server-side TMDB v3 read proxy (key hidden). `path=` is allowlisted. |
| POST   | `/api/epg`     | `init=1` ingests EPG; otherwise `{epg_id, start, stop}` → list.      |

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
