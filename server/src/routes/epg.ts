import type { FastifyInstance } from 'fastify';
import { queries } from '../db.js';
import { ingestEpg } from '../epg-ingest.js';

export function registerEpg(app: FastifyInstance) {
  // POST /api/epg with fields:
  //   init=1                → triggers EPG ingest (optionally with dns/username/password)
  //   epg_id, start, stop   → returns programmes in range
  app.post('/api/epg', async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, string>;

    if (body.init) {
      const msg = await ingestEpg({
        dns: body.dns,
        username: body.username,
        password: body.password,
      });
      return reply.type('text/plain').send(msg);
    }

    const list = { epg_listings: [] as any[] };
    const epgId = body.epg_id;
    const start = Number(body.start);
    const stop = Number(body.stop);

    if (!epgId || !start || !stop) {
      return reply.type('application/json').send(list);
    }

    list.epg_listings = queries.getEpg.all(epgId, stop, start) as any[];
    return reply.type('application/json').send(list);
  });
}
