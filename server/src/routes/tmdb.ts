import type { FastifyInstance } from 'fastify';
import { request } from 'undici';
import { config } from '../config.js';
import { queries } from '../db.js';

// Allowlist — only TMDB read endpoints we actually use.
const PATH_ALLOW = /^\/?3\/(search\/(movie|tv)|movie\/\d+|tv\/\d+(\/season\/\d+)?)\/?$/;
const PARAM_ALLOW = new Set(['language', 'query', 'append_to_response', 'page']);

const TTL_MS = config.tmdbCacheHours * 3600 * 1000;

// In-flight dedupe: concurrent requests for the same key share one upstream fetch.
const inFlight = new Map<string, Promise<{ body: string; status: number }>>();

// Outbound concurrency cap. Keeps us well under TMDB's ~40/sec ceiling even
// if the client fires off a rail's worth of lookups at once.
let active = 0;
const waiters: Array<() => void> = [];
async function acquire() {
  if (active < config.tmdbConcurrency) {
    active++;
    return;
  }
  await new Promise<void>((res) => waiters.push(res));
  active++;
}
function release() {
  active--;
  const next = waiters.shift();
  if (next) next();
}

// Normalize free-text search so "The Matrix", "The Matrix ", "The Matrix (1999)"
// all hit the same cache entry.
function normalizeQuery(s: string): string {
  return s.trim().replace(/\s+/g, ' ').replace(/\s*\(\d{4}\)\s*$/, '');
}

function buildKey(path: string, params: Record<string, string>): string {
  const parts = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`);
  return `${path.replace(/^\/+/, '/')}?${parts.join('&')}`;
}

async function fetchTmdb(url: string): Promise<{ body: string; status: number }> {
  const init = {
    method: 'GET' as const,
    headersTimeout: 20_000,
    bodyTimeout: 20_000,
    headers: {
      'user-agent': 'StreamifyTmdbProxy/2.0',
      accept: 'application/json',
    },
  };
  let res = await request(url, init);

  // One-shot 429 retry honoring Retry-After.
  if (res.statusCode === 429) {
    const retry = Number(res.headers['retry-after'] ?? 1);
    await new Promise((r) => setTimeout(r, Math.max(1000, retry * 1000)));
    res = await request(url, init);
  }

  const body = await res.body.text();
  return { body, status: res.statusCode };
}

export function registerTmdb(app: FastifyInstance) {
  // Boot-time prune: drop anything older than 2× TTL. Cheap safety net so
  // the table doesn't grow unbounded across deploys.
  try {
    queries.tmdbPrune.run(Date.now() - 2 * TTL_MS);
  } catch (err) {
    app.log.warn({ err }, 'tmdb cache prune failed');
  }

  app.get('/api/tmdb', async (req, reply) => {
    if (!config.tmdbApiKey) {
      return reply.code(503).send({ error: 'TMDB proxy not configured' });
    }

    const q = req.query as Record<string, unknown>;
    const path = typeof q.path === 'string' ? q.path : '';
    if (!path || !PATH_ALLOW.test(path)) {
      return reply.code(403).send({ error: 'Path not allowed' });
    }

    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(q)) {
      if (!PARAM_ALLOW.has(k)) continue;
      if (typeof v !== 'string' || v.length > 512) continue;
      params[k] = k === 'query' ? normalizeQuery(v) : v;
    }

    const key = buildKey(path, params);
    const now = Date.now();

    // Cache hit?
    const row = queries.tmdbGet.get(key) as
      | { body: string; status: number; fetched_at: number }
      | undefined;
    if (row && now - row.fetched_at < TTL_MS) {
      reply.code(row.status);
      reply.header('content-type', 'application/json');
      reply.header('cache-control', `public, max-age=${Math.floor(TTL_MS / 1000)}`);
      reply.header('x-streamify-cache', 'hit');
      return reply.send(row.body);
    }

    // Miss — coalesce concurrent fetches for the same key.
    let pending = inFlight.get(key);
    if (!pending) {
      pending = (async () => {
        await acquire();
        try {
          const url = new URL(`https://api.themoviedb.org/${path.replace(/^\/+/, '')}`);
          url.searchParams.set('api_key', config.tmdbApiKey);
          for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

          const result = await fetchTmdb(url.toString());
          if (result.status >= 200 && result.status < 300) {
            queries.tmdbPut.run(key, result.body, result.status, now);
          }
          return result;
        } finally {
          release();
          inFlight.delete(key);
        }
      })();
      inFlight.set(key, pending);
    }

    try {
      const { body, status } = await pending;
      reply.code(status);
      reply.header('content-type', 'application/json');
      if (status >= 200 && status < 300) {
        reply.header('cache-control', `public, max-age=${Math.floor(TTL_MS / 1000)}`);
      }
      reply.header('x-streamify-cache', row ? 'stale' : 'miss');
      return reply.send(body);
    } catch (err) {
      app.log.warn({ err, key }, 'tmdb upstream failed');
      // Serve the stale row if we have one — better than a hard error.
      if (row) {
        reply.code(row.status);
        reply.header('content-type', 'application/json');
        reply.header('x-streamify-cache', 'stale-fallback');
        return reply.send(row.body);
      }
      return reply.code(502).send({ error: 'TMDB upstream failed' });
    }
  });
}
