import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

import { config } from './config.js';
import { registerProxy } from './routes/proxy.js';
import { registerTmdb } from './routes/tmdb.js';
import { registerEpg } from './routes/epg.js';

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  // Upstream streams can be large; don't let Fastify choke on body limits for
  // incoming form bodies (which stay small).
  bodyLimit: 1 * 1024 * 1024,
});

await app.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});
await app.register(formbody); // application/x-www-form-urlencoded bodies

app.get('/api/healthz', async () => ({ ok: true, time: Date.now() }));

registerProxy(app);
registerTmdb(app);
registerEpg(app);

// Optional: serve built Vite frontend from STATIC_DIR.
if (config.staticDir) {
  const dir = resolve(config.staticDir);
  if (existsSync(dir)) {
    await app.register(fastifyStatic, { root: dir, prefix: '/', wildcard: false });
    // SPA fallback — any unmatched GET returns index.html.
    app.setNotFoundHandler((req, reply) => {
      if (req.method !== 'GET') return reply.code(404).send();
      return reply.sendFile('index.html');
    });
  } else {
    app.log.warn({ dir }, 'STATIC_DIR does not exist; skipping static serve');
  }
}

app.listen({ host: config.host, port: config.port }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
