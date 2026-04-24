import { request } from 'undici';
import sax from 'sax';
import { queries, db } from './db.js';
import { config } from './config.js';

interface Programme {
  id: string;
  start: number;
  stop: number;
  title: string;
  description: string;
}

function parseXmltvDate(s: string): number {
  // XMLTV: "20260424120000 +0000"
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s+([+-]\d{4}))?/.exec(s.trim());
  if (!m) return 0;
  const [, y, mo, d, h, mi, se, tz] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${se}${tz ? tz.slice(0, 3) + ':' + tz.slice(3) : 'Z'}`;
  return Math.floor(new Date(iso).getTime() / 1000);
}

/**
 * Pulls the XMLTV document from the configured URL and replaces the EPG
 * cache. Returns a status string (same as the old PHP). Streams the XML to
 * avoid loading the whole document in memory.
 */
export async function ingestEpg(overrides?: {
  dns?: string;
  username?: string;
  password?: string;
}): Promise<string> {
  let epgUrl = config.epgUrl;
  if (!epgUrl) {
    const { dns, username, password } = overrides ?? {};
    if (!dns || !username || !password) return 'EPG XML not configured';
    epgUrl = `${dns.replace(/\/+$/, '')}/xmltv.php?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}`;
  }
  try {
    new URL(epgUrl);
  } catch {
    return 'Not a valid URL';
  }

  // Skip if cache is fresh.
  const row = queries.avgStopSince.get() as { avg_stop: number } | undefined;
  const threshold = Math.floor(Date.now() / 1000) - config.epgValidHours * 3600;
  if (row?.avg_stop && row.avg_stop > threshold) return 'EPG already updated';

  // Drop anything older than 12h.
  queries.deleteOld.run(Math.floor(Date.now() / 1000) - 12 * 3600);

  const res = await request(epgUrl, {
    method: 'GET',
    headersTimeout: 60_000,
    bodyTimeout: 300_000,
    headers: {
      'user-agent': 'Mozilla/5.0 Streamify/2.0',
      accept: 'application/xml,text/xml,*/*',
    },
  });
  if (res.statusCode >= 400) return `Can't download EPG url (HTTP ${res.statusCode})`;

  const parser = sax.createStream(true, { trim: true, normalize: true });
  let current: Programme | null = null;
  let currentText: 'title' | 'desc' | null = null;
  const batch: Programme[] = [];
  const cutoff = Math.floor(Date.now() / 1000) - 24 * 3600;
  let count = 0;

  const insertMany = db.transaction((items: Programme[]) => {
    for (const p of items) {
      queries.insertProgramme.run(p.id, p.start, p.stop, p.title, p.description);
    }
  });

  return await new Promise<string>((resolve, reject) => {
    parser.on('error', (err) => reject(err));

    parser.on('opentag', (node) => {
      if (node.name === 'programme') {
        const start = parseXmltvDate(String(node.attributes.start ?? ''));
        const stop = parseXmltvDate(String(node.attributes.stop ?? ''));
        const id = String(node.attributes.channel ?? '');
        if (id && start >= cutoff && stop > start) {
          current = { id, start, stop, title: '', description: '' };
        }
      } else if (current && node.name === 'title') currentText = 'title';
      else if (current && node.name === 'desc') currentText = 'desc';
    });

    parser.on('text', (t) => {
      if (!current || !currentText) return;
      if (currentText === 'title') current.title += t;
      else current.description += t;
    });

    parser.on('closetag', (name) => {
      if (name === 'title' || name === 'desc') currentText = null;
      if (name === 'programme' && current) {
        batch.push(current);
        current = null;
        count++;
        if (batch.length >= 500) {
          insertMany(batch.splice(0));
        }
      }
    });

    parser.on('end', () => {
      if (batch.length > 0) insertMany(batch.splice(0));
      resolve(`EPG scraping completed. Added ${count} items.`);
    });

    (res.body as unknown as NodeJS.ReadableStream).pipe(parser);
  });
}
