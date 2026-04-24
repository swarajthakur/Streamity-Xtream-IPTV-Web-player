import { getVodInfo, getSeriesInfo } from './load-playlist';

export interface TmdbInfo {
  name?: string;
  cover?: string;
  image?: string;
  backdrop_path?: string[];
  description?: string;
  plot?: string;
  youtube_trailer?: string;
  genre?: string;
  rating?: number | string;
  cast?: string;
  director?: string;
  releasedate?: string;
  duration?: string;
}

export interface Lookup {
  info?: TmdbInfo;
  episodes?: Record<string, any[]>;
}

type Key = string;

const SESSION_PREFIX = 'tmdb:';
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;

const memory = new Map<Key, Promise<Lookup | null>>();

function sessionGet(key: Key): Lookup | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: Lookup };
    if (Date.now() - parsed.ts > SESSION_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function sessionSet(key: Key, data: Lookup | null): void {
  if (!data) return;
  try {
    sessionStorage.setItem(
      SESSION_PREFIX + key,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // Quota exceeded or disabled — ignore; server cache still absorbs.
  }
}

function dedupe(key: Key, fetcher: () => Promise<Lookup | null>): Promise<Lookup | null> {
  const cached = sessionGet(key);
  if (cached) return Promise.resolve(cached);
  const existing = memory.get(key);
  if (existing) return existing;
  const p = fetcher()
    .then((data) => {
      if (data) sessionSet(key, data);
      return data;
    })
    .catch(() => null);
  memory.set(key, p);
  return p;
}

export function lookupMovie(id: any, name: string, hint?: any): Promise<Lookup | null> {
  if (!id || !name) return Promise.resolve(null);
  return dedupe(`movie:${id}`, () => getVodInfo(id, name, hint));
}

export function lookupSeries(
  id: any,
  name: string,
  hint?: any,
  onlyInfo = true
): Promise<Lookup | null> {
  if (!id || !name) return Promise.resolve(null);
  return dedupe(`series:${id}:${onlyInfo ? 'info' : 'full'}`, () =>
    getSeriesInfo(id, name, onlyInfo, hint)
  );
}
