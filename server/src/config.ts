import 'dotenv/config';

function required(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 8787),
  xtreamDns: (process.env.XTREAM_DNS ?? '').replace(/\/+$/, ''),
  proxyEnabled: /^(1|true|yes)$/i.test(process.env.PROXY_ENABLED ?? ''),
  tmdbApiKey: process.env.TMDB_API_KEY ?? '',
  dbPath: process.env.DB_PATH ?? './data/streamify.sqlite',
  epgUrl: process.env.EPG_URL ?? '',
  epgValidHours: Number(process.env.EPG_VALID_HOURS ?? 12),
  staticDir: process.env.STATIC_DIR ?? '',
  // TMDB response cache lifetime. 30 days default — titles are effectively
  // static post-release; the only field that drifts (vote_average) is
  // visually negligible.
  tmdbCacheHours: Number(process.env.TMDB_CACHE_HOURS ?? 720),
  // Max concurrent outbound TMDB requests. TMDB's upper limit is ~40/sec;
  // 8 gives plenty of headroom.
  tmdbConcurrency: Number(process.env.TMDB_CONCURRENCY ?? 8),
};

export type Config = typeof config;
