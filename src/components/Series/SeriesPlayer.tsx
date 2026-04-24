import { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { ArrowLeft, SkipForward } from 'lucide-react';

import { getSeriesInfo } from '../../other/load-playlist';
import { useSelector } from '@/store/legacy';
import { generateUrl } from '../../other/generate-url';
import { Button } from '@/components/ui/button';

interface Params {
  category?: string;
  stream_id?: string;
  season?: string;
  episode?: string;
}

export default function SeriesPlayer() {
  const history = useHistory();
  const { category, stream_id, season, episode } = useParams<Params>();
  const playlist = useSelector((s) => s.playlist) as any[];
  const videoRef = useRef<HTMLVideoElement>(null);

  const [episodes, setEpisodes] = useState<Record<string, any[]>>({});

  const series = playlist.find((x) => String(x.series_id) === String(stream_id));

  useEffect(() => {
    if (!series) return;
    (async () => {
      const res = await getSeriesInfo(series.series_id, series.name, false, series.tmdb);
      if (res?.episodes) setEpisodes(res.episodes);
    })();
  }, [series]);

  const current = episodes[String(season)]?.find(
    (e: any) => String(e.episode_num ?? e.episode) === String(episode)
  );

  const url = current?.direct_source || current?.url ||
    generateUrl('series', current?.id ?? '', current?.container_extension || 'mp4');

  const gotoNext = () => {
    const seasonArr = episodes[String(season)] || [];
    const idx = seasonArr.findIndex(
      (e: any) => String(e.episode_num ?? e.episode) === String(episode)
    );
    if (idx >= 0 && idx + 1 < seasonArr.length) {
      const next = seasonArr[idx + 1];
      history.replace(
        `/series/category/${category}/${stream_id}/play/season/${season}/episode/${next.episode_num ?? next.episode}/`
      );
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') history.goBack();
      if (e.key === 'n' || e.key === 'N') gotoNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    videoRef.current?.focus();
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="absolute left-0 top-0 z-10 flex w-full items-center gap-3 bg-gradient-to-b from-black to-transparent p-4">
        <Button variant="ghost" size="icon" onClick={() => history.goBack()} aria-label="Back">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-white">
            {series?.name}
          </h1>
          <div className="truncate text-sm text-neutral-400">
            S{season} · E{episode} {current?.title ? `— ${current.title}` : ''}
          </div>
        </div>
        <Button variant="secondary" onClick={gotoNext}>
          <SkipForward /> Next episode
        </Button>
      </div>
      {url ? (
        <video
          ref={videoRef}
          key={url}
          src={url}
          controls
          autoPlay
          className="h-full w-full bg-black"
          onEnded={gotoNext}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-neutral-500">Loading…</div>
      )}
    </div>
  );
}
