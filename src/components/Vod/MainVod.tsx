import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, useHistory, useLocation, useParams } from 'react-router-dom';
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

export default function MainVod() {
  const { category, playingMode } = useParams<{ category?: string; playingMode?: string }>();
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  const categories = useSelector((s) => s.groupsList) as Category[];
  const playlist = useSelector((s) => s.playlist) as Item[];

  const [loading, setLoading] = useState(true);
  const [showNoMatches, setShowNoMatches] = useState(false);
  const [streamList, setStreamList] = useState<Item[]>([]);
  const [hero, setHero] = useState<Item | null>(null);

  const query = new URLSearchParams(location.search);
  const searchText = query.get('search');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const needsReset = resetMemory(playingMode || '');
      let cats = categories;

      if (needsReset || cats.length === 0) {
        const gps = (await loadGroup(playingMode || '')) as Category[];
        if (!gps || gps.length === 0) {
          history.replace('/');
          return;
        }
        gps.unshift(
          { category_id: 'fav', favorite: 1, category_name: 'Only favorites' },
          { category_id: 'toend', history: 1, category_name: 'Continue watching' }
        );
        dispatch(setGroupList(gps));
        cats = gps;
      }

      const chs = ((await loadPlaylist(playingMode || '', category || 'ALL')) || []) as Item[];

      let filtered = chs;
      if (category && isNaN(Number(category))) {
        filtered = chs.filter((s) => {
          const id = playingMode === 'series' ? s.series_id : s.stream_id;
          const f = DB.findOne(playingMode || '', id, category === 'fav');
          return f && (category === 'fav' || (f.tot > 3 && f.tot < 95));
        });
      }

      dispatch(setPlaylist(filtered));
      setStreamList(filtered);

      const pool = category
        ? filtered.filter((x) => String(x.category_id) === String(category))
        : filtered;
      setHero(pickHero(pool));
      setLoading(false);
    };
    run().catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [dispatch, category, playingMode, history]);

  const viewList = useMemo(() => {
    if (!searchText) return streamList;
    const q = searchText.toLowerCase();
    return streamList.filter((x) => x.name?.toLowerCase().includes(q));
  }, [streamList, searchText]);

  useEffect(() => {
    if (searchText && viewList.length === 0 && streamList.length > 0) {
      setShowNoMatches(true);
    } else {
      setShowNoMatches(false);
    }
  }, [searchText, viewList.length, streamList.length]);

  const railCategories = useMemo(
    () =>
      categories.filter((c) => {
        const items = getRailItems(c, viewList, playingMode || '');
        return items.length > 0;
      }),
    [categories, viewList, playingMode]
  );

  const isSeries = playingMode === 'series';

  const gotoDetail = (item: Item) => {
    const id = isSeries ? item.series_id : item.stream_id;
    const catId = item.category_id || 'all';
    history.push(`/${playingMode}/category/${catId}/${id}/info/`);
  };

  return (
    <main className="min-h-screen bg-neutral-950 pb-24 text-neutral-50">
      {hero && !searchText && (
        <VodHero item={hero} isSeries={isSeries} onInfo={() => gotoDetail(hero)} />
      )}

      {searchText ? (
        <section className="mx-auto w-full max-w-[1800px] px-4 pt-24 md:px-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-100">
            <SearchIcon className="size-4 text-neutral-500" />
            Results for “{searchText}”
          </h2>
          <div className="flex flex-wrap gap-3">
            {viewList.slice(0, 60).map((item) => (
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
            const items = getRailItems(c, viewList, playingMode || '');
            return (
              <Rail key={c.category_id} title={c.category_name}>
                {items.slice(0, 30).map((item) => (
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

      {loading && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
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
    <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
      {bg && (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          style={{ filter: 'blur(20px) saturate(120%)', transform: 'scale(1.1)' }}
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

function getRailItems(c: Category, list: Item[], mode: string): Item[] {
  if (c.favorite === 1 || c.history === 1) {
    return list.filter((s) => {
      const id = mode === 'series' ? s.series_id : s.stream_id;
      const f = DB.findOne(mode, id, c.favorite === 1);
      return f && (c.favorite === 1 || (f.tot > 3 && f.tot < 95));
    });
  }
  return list.filter((s) => String(s.category_id) === String(c.category_id));
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
