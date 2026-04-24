import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Play, Star } from 'lucide-react';

import { useSelector } from '@/store/legacy';
import { getSeriesInfo, getVodInfo } from '../../other/load-playlist';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Params {
  playingMode?: string;
  category?: string;
  stream_id?: string;
}

interface Episode {
  id: string;
  title: string;
  season?: string | number;
  episode?: string | number;
  episode_num?: string | number;
  duration?: string;
  duration_secs?: number;
  info?: {
    plot?: string;
    movie_image?: string;
    duration?: string;
    duration_secs?: number;
  };
  direct_source?: string;
  url?: string;
}

export default function MoreInfo() {
  const history = useHistory();
  const { playingMode, category, stream_id } = useParams<Params>();
  const playlist = useSelector((s) => s.playlist) as any[];

  const [info, setInfo] = useState<any>(null);
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({});
  const [season, setSeason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const item =
    playlist.find((x) => {
      const id = playingMode === 'series' ? x.series_id : x.stream_id;
      return String(id) === String(stream_id);
    }) || null;

  const close = () => {
    const back = `/${playingMode}/category/${category || ''}${category ? '/' : ''}`;
    history.replace(back);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      if (!item) {
        setLoading(false);
        return;
      }
      if (playingMode === 'series') {
        const res = await getSeriesInfo(item.series_id, item.name, false, item.tmdb);
        if (res) {
          setInfo(res.info || {});
          setEpisodes(res.episodes || {});
          const seasons = Object.keys(res.episodes || {});
          if (seasons.length > 0) setSeason(seasons[0]);
        }
      } else {
        const res = await getVodInfo(item.stream_id, item.name, item.tmdb);
        if (res) setInfo(res.info || res);
      }
      setLoading(false);
    };
    run();
  }, [item, playingMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const backdrop =
    (info?.backdrop_path && info.backdrop_path[0]) ||
    info?.cover ||
    info?.movie_image ||
    item?.stream_icon ||
    item?.cover;

  const isSeries = playingMode === 'series';

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/90 backdrop-blur">
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="fixed right-6 top-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/90 text-white shadow-lg ring-1 ring-white/10 hover:bg-neutral-800"
      >
        <ArrowLeft className="size-5" />
      </button>

      <div className="relative mx-auto max-w-5xl">
        <div className="relative h-[50vh] min-h-[320px] w-full overflow-hidden">
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h1 className="max-w-3xl text-4xl font-bold text-white md:text-5xl">
              {item?.name || 'Loading…'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
              {info?.rating && (
                <span className="inline-flex items-center gap-1 text-yellow-400">
                  <Star className="size-4 fill-current" /> {Number(info.rating).toFixed(1)}
                </span>
              )}
              {info?.releasedate && <span>{String(info.releasedate).slice(0, 4)}</span>}
              {info?.duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" /> {info.duration}
                </span>
              )}
              {info?.genre && <span>{info.genre}</span>}
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 pb-16 pt-6">
          {!isSeries && (
            <Button
              size="lg"
              onClick={() =>
                history.push(`/movie/category/${category}/${stream_id}/play/`)
              }
            >
              <Play className="fill-current" /> Play
            </Button>
          )}

          {info?.plot && (
            <p className="max-w-3xl text-base leading-relaxed text-neutral-200">{info.plot}</p>
          )}

          {info?.cast && (
            <div className="text-sm text-neutral-400">
              <span className="text-neutral-500">Cast: </span>
              {info.cast}
            </div>
          )}
          {info?.director && (
            <div className="text-sm text-neutral-400">
              <span className="text-neutral-500">Director: </span>
              {info.director}
            </div>
          )}

          {isSeries && Object.keys(episodes).length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                {Object.keys(episodes)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeason(s)}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-sm transition-colors',
                        s === season
                          ? 'bg-brand text-white'
                          : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                      )}
                    >
                      Season {s}
                    </button>
                  ))}
              </div>

              <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/40">
                {season &&
                  (episodes[season] || []).map((ep) => (
                    <li
                      key={ep.id}
                      className="flex items-center gap-4 p-4 transition-colors hover:bg-white/5"
                    >
                      <div className="w-10 shrink-0 text-2xl font-bold text-neutral-500">
                        {ep.episode_num ?? ep.episode}
                      </div>
                      {ep.info?.movie_image && (
                        <img
                          src={ep.info.movie_image}
                          alt=""
                          className="h-16 w-28 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-neutral-100">
                          {ep.title}
                        </div>
                        {ep.info?.plot && (
                          <div className="line-clamp-2 text-sm text-neutral-400">
                            {ep.info.plot}
                          </div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          history.push(
                            `/series/category/${category}/${stream_id}/play/season/${ep.season || season}/episode/${ep.episode_num || ep.episode}/`
                          )
                        }
                      >
                        <Play className="fill-current" />
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {loading && (
            <div className="py-8 text-center text-neutral-500">Loading details…</div>
          )}
        </div>
      </div>
    </div>
  );
}
