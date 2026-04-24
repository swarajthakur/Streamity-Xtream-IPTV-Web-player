import type { FastifyInstance } from 'fastify';
import { Readable } from 'node:stream';
import { request } from 'undici';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { config } from '../config.js';

function isPrivateIp(ip: string): boolean {
  if (!isIP(ip)) return true; // refuse anything we can't classify
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  // IPv6: refuse loopback, link-local, unique-local, multicast
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('ff')) return true;
  return false;
}

async function validateUpstream(target: URL): Promise<void> {
  if (!/^https?:$/.test(target.protocol)) throw new Error('Invalid scheme');
  if (!config.xtreamDns) throw new Error('XTREAM_DNS not configured');
  if (!target.toString().startsWith(config.xtreamDns)) throw new Error('URL not allowed');
  const { address } = await lookup(target.hostname);
  if (isPrivateIp(address)) throw new Error('Private address refused');
}

/**
 * Replaces proxy.php. Streams the upstream response body, preserving the
 * Content-Type header. Supports GET and POST (application/x-www-form-urlencoded).
 *
 * Query: ?url=<absolute URL inside XTREAM_DNS>
 */
export function registerProxy(app: FastifyInstance) {
  if (!config.proxyEnabled) {
    app.all('/proxy.php', async (_req, reply) => reply.code(403).send('Proxy not available'));
    return;
  }

  const handler = async (req: any, reply: any) => {
    const raw = req.query?.url;
    if (!raw || typeof raw !== 'string') return reply.code(400).send('Missing URL');
    let target: URL;
    try {
      target = new URL(raw);
    } catch {
      return reply.code(400).send('Invalid URL');
    }
    try {
      await validateUpstream(target);
    } catch (e: any) {
      return reply.code(403).send(e.message);
    }

    const init: Parameters<typeof request>[1] = {
      method: req.method as any,
      headersTimeout: 30_000,
      bodyTimeout: 30_000,
      maxRedirections: 0,
      headers: {
        'user-agent': 'StreamifyProxy/2.0',
        accept: '*/*',
      },
    };

    if (req.method === 'POST' && req.body && typeof req.body === 'object') {
      init.method = 'POST';
      init.headers = {
        ...init.headers,
        'content-type': 'application/x-www-form-urlencoded',
      };
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(req.body as Record<string, any>)) {
        if (v !== undefined && v !== null) params.append(k, String(v));
      }
      init.body = params.toString();
    }

    const upstream = await request(target.toString(), init);
    reply.code(upstream.statusCode);
    const ct = upstream.headers['content-type'];
    if (ct) reply.header('content-type', Array.isArray(ct) ? ct[0] : ct);
    const cl = upstream.headers['content-length'];
    if (cl) reply.header('content-length', Array.isArray(cl) ? cl[0] : cl);
    return reply.send(Readable.fromWeb(upstream.body as any));
  };

  app.get('/proxy.php', handler);
  app.post('/proxy.php', handler);
}
