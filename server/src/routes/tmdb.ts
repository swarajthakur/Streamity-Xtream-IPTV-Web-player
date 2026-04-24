import type { FastifyInstance } from 'fastify';
import { request } from 'undici';
import { config } from '../config.js';

// Allowlist — only TMDB read endpoints we actually use.
const PATH_ALLOW = /^\/?3\/(search\/(movie|tv)|movie\/\d+|tv\/\d+(\/season\/\d+)?)\/?$/;
const PARAM_ALLOW = new Set(['language', 'query', 'append_to_response', 'page']);

export function registerTmdb(app: FastifyInstance) {
  app.get('/api/tmdb', async (req, reply) => {
    if (!config.tmdbApiKey) {
      return reply.code(503).send({ error: 'TMDB proxy not configured' });
    }
    const q = req.query as Record<string, unknown>;
    const path = typeof q.path === 'string' ? q.path : '';
    if (!path || !PATH_ALLOW.test(path)) {
      return reply.code(403).send({ error: 'Path not allowed' });
    }
    const url = new URL(`https://api.themoviedb.org/${path.replace(/^\/+/, '')}`);
    url.searchParams.set('api_key', config.tmdbApiKey);
    for (const [k, v] of Object.entries(q)) {
      if (!PARAM_ALLOW.has(k)) continue;
      if (typeof v !== 'string' || v.length > 512) continue;
      url.searchParams.set(k, v);
    }
    const res = await request(url.toString(), {
      method: 'GET',
      headersTimeout: 20_000,
      bodyTimeout: 20_000,
      headers: {
        'user-agent': 'StreamifyTmdbProxy/2.0',
        accept: 'application/json',
      },
    });
    reply.code(res.statusCode);
    reply.header('content-type', 'application/json');
    const body = await res.body.text();
    return reply.send(body);
  });
}
