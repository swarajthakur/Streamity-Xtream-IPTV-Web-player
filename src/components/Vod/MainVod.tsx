import { useEffect, useMemo, useState } from 'react';
import { Route, Switch, useHistory, useLocation, useParams } from 'react-router-dom';
import { Info, Play, Search as SearchIcon } from 'lucide-react';

import { useDispatch, useSelector } from '@/store/legacy';
import { setPlaylist } from '../../actions/set-Playlist';
import { setGroupList } from '../../actions/set-Group';
import { resetMemory } from '../../other/last-opened-mode';
import { loadGroup, loadPlaylist } from '../../other/load-playlist';
import DB from '../../other/local-db';
import { Button } from '@/components/ui/button';
import { Rail } from '@/components/browse/Rail';
import { PosterCard } from '@/components/browse/PosterCard';
import Popup from '../Popup/Popup';
import MoreInfo from './MoreInfo';
import VodPlayer from './VodPlayer';
import SeriesPlayer from '../Series/SeriesPlayer';

interface Item {
  stream_id?: number | string;
  series_id?: number | string;
  name: string;
  stream_icon?: string;
  cover?: string;
  category_id?: string;
  direct_source?: string;
  container_extension?: string;
  rating?: number | string;
  tmdb?: any;
}

interface Category {
  category_id: string;
  category_name: string;
  favorite?: 1;
  history?: 1;
}

const MAX_PER_RAIL = 24;

export default function MainVod() {
  const { category, playingMode } = useParams<{ category?: string; playingMode?: string }>();
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  const categories = useSelector((s) => s.groupsList) as Category[];
  const playlist = useSelector((s) => s.playlist) as Item[];

  const [loading, setLoading] = useState(true);
  const [showNoMatches, setShowNoMatches] = useState(false);

  const query = new URLSearchParams(location.search);
  const searchText = query.get('search');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const needsReset = resetMemory(playingMode || '');

      // Kick both fetches off in parallel. Categories comes back tiny and fast;
      // playlist is the heavy one.
      const needsGroup = needsReset || categories.length === 0;
      const [gps, chs] = await Promise.all([
        needsGroup ? loadGroup(playingMode || '') : Promise.resolve(categories as any[]),
        loadPlaylist(playingMode || '', category || 'ALL') as Promise<Item[]>,
      ]);

      if (cancelled) return;

      if (needsGroup) {
        if (!gps || gps.length === 0) {
          history.replace('/');
          return;
        }
        const withSpecials = [...gps];
        withSpecials.unshift(
          { category_id: 'fav', favorite: 1, category_name: 'Only favorites' },
          { category_id: 'toend', history: 1, category_name: 'Continue watching' }
        );
        dispatch(setGroupList(withSpecials));
      }

      let items = Array.isArray(chs) ? chs : [];
      if (category && isNaN(Number(category))) {
        items = items.filter((s) => {
          const id = playingMode === 'series' ? s.series_id : s.stream_id;
          const f = DB.findOne(playingMode || '', id, category === 'fav');
          return f && (category === 'fav' || (f.tot > 3 && f.tot < 95));
        });
      }
      dispatch(setPlaylist(items));
      setLoading(false);
    };
    run().catch((err) => {
      console.error(err);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, category, playingMode, history]);

  // Build category-id → items[] once per playlist change. Replaces the
  // previous N·M filter pass on every render.
  const byCategory = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of playlist) {
      const key = String(it.category_id ?? '');
      const bucket = m.get(key);
      if (bucket) bucket.push(it);
      else m.set(key, [it]);
    }
    return m;
  }, [playlist]);

  // Favorites + Continue-watching buckets (only for VOD/series).
  const specialBuckets = useMemo(() => {
    if (!playingMode) return { fav: [] as Item[], toend: [] as Item[] };
    const fav: Item[] = [];
    const toend: Item[] = [];
    for (const s of playlist) {
      const id = playingMode === 'series' ? s.series_id : s.stream_id;
      const favRec = DB.findOne(playingMode, id, true);
      const histRec = DB.findOne(playingMode, id, false);
      if (favRec) fav.push(s);
      if (histRec && histRec.tot > 3 && histRec.tot < 95) toend.push(s);
    }
    return { fav, toend };
  }, [playlist, playingMode]);

  const searchResults = useMemo(() => {
    if (!searchText) return null;
    const q = searchText.toLowerCase();
    return playlist.filter((x) => x.name?.toLowerCase().includes(q));
  }, [searchText, playlist]);

  useEffect(() => {
    if (searchResults && searchResults.length === 0 && playlist.length > 0) setShowNoMatches(true);
    else setShowNoMatches(false);
  }, [searchResults, playlist.length]);

  const hero = useMemo(() => {
    if (searchText || playlist.length === 0) return null;
    const pool = category
      ? playlist.filter((x) => String(x.category_id) === String(category))
      : playlist;
    return pickHero(pool);
  }, [playlist, category, searchText]);

  const isSeries = playingMode === 'series';

  const gotoDetail = (item: Item) => {
    const id = isSeries ? item.series_id : item.stream_id;
    const catId = item.category_id || 'all';
    history.push(`/${playingMode}/category/${catId}/${id}/info/`);
  };

  const getRailItems = (c: Category): Item[] => {
    if (c.favorite === 1) return specialBuckets.fav;
    if (c.history === 1) return specialBuckets.toend;
    return byCategory.get(String(c.category_id)) ?? [];
  };

  const railCategories = useMemo(
    () => categories.filter((c) => getRailItems(c).length > 0),
    // getRailItems closes over memoized buckets; re-run when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, byCategory, specialBuckets]
  );

  return (
    <main className="min-h-screen bg-neutral-950 pb-24 text-neutral-50">
      {hero && <VodHero item={hero} isSeries={isSeries} onInfo={() => gotoDetail(hero)} />}

      {searchResults ? (
        <section className="mx-auto w-full max-w-[1800px] px-4 pt-24 md:px-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-100">
            <SearchIcon className="size-4 text-neutral-500" />
            Results for “{searchText}”
          </h2>
          <div className="flex flex-wrap gap-3">
            {searchResults.slice(0, 60).map((item) => (
              <PosterCard
                key={String(item.stream_id ?? item.series_id)}
                title={item.name}
                image={item.stream_icon || item.cover}
                onClick={() => gotoDetail(item)}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="relative -mt-16 space-y-2">
          {railCategories.map((c) => {
            const items = getRailItems(c).slice(0, MAX_PER_RAIL);
            return (
              <Rail key={c.category_id} title={c.category_name}>
                {items.map((item) => (
                  <PosterCard
                    key={String(item.stream_id ?? item.series_id)}
                    title={item.name}
                    image={item.stream_icon || item.cover}
                    onClick={() => gotoDetail(item)}
                  />
                ))}
              </Rail>
            );
          })}
          {!loading && railCategories.length === 0 && (
            <div className="px-8 py-16 text-center text-sm text-neutral-500">
              Nothing to watch in this view.
            </div>
          )}
        </div>
      )}

      {loading && !hero && (
        <div className="px-4 pt-32 md:px-10">
          <div className="space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-48 animate-pulse rounded bg-neutral-800" />
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div
                      key={j}
                      className="aspect-[2/3] w-40 flex-none animate-pulse rounded-md bg-neutral-800 md:w-48"
                      style={{ animationDelay: `${(i * 6 + j) * 50}ms` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNoMatches && (
        <Popup
          type="info"
          error={false}
          title={`No match for "${searchText}"`}
          description="Clear the search to see everything."
          onclick={() => {
            setShowNoMatches(false);
            history.replace(location.pathname.split('?')[0]);
          }}
        />
      )}

      <Switch>
        <Route path="/movie/category/:category/:stream_id/play/">
          <VodPlayer />
        </Route>
        <Route path="/series/category/:category/:stream_id/play/season/:season/episode/:episode/">
          <SeriesPlayer />
        </Route>
        <Route path="/:playingMode/category/:category/:stream_id/info/">
          <MoreInfo key={'info-' + category} />
        </Route>
      </Switch>
    </main>
  );
}

interface HeroProps {
  item: Item;
  isSeries: boolean;
  onInfo: () => void;
}

function VodHero({ item, isSeries, onInfo }: HeroProps) {
  const history = useHistory();
  const playUrl = (() => {
    const id = isSeries ? item.series_id : item.stream_id;
    const cat = item.category_id || 'all';
    if (isSeries) return `/series/category/${cat}/${id}/info/`;
    return `/movie/category/${cat}/${id}/play/`;
  })();

  const bg = item.stream_icon || item.cover;

  return (
    <section className="relative h-[60vh] min-h-[360px] w-full overflow-hidden">
      {bg && (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          style={{ filter: 'blur(18px) saturate(120%)', transform: 'scale(1.1)' }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/30 to-transparent" />

      <div className="relative z-10 flex h-full items-end">
        <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 md:px-10">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neutral-200 backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand" /> Featured
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white drop-shadow-lg md:text-6xl">
              {item.name}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => history.push(playUrl)}>
                <Play className="fill-current" /> {isSeries ? 'Details' : 'Play'}
              </Button>
              <Button size="lg" variant="secondary" onClick={onInfo}>
                <Info /> More info
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function pickHero(list: Item[]): Item | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const clean = list.filter(
    (x) =>
      x &&
      x.name &&
      !/xxx|porn|sex|bbc|bitch|cunt|cock|cum|piss|anal|tits|blowjob|masturbate|dick|suck|gangbang/i.test(
        x.name
      )
  );
  const highRated = clean.filter((x) => Number(x.rating ?? 0) >= 7);
  const pool = highRated.length > 0 ? highRated : clean;
  if (pool.length === 0) return null;
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}
