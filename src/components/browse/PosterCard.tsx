import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ImageOff, Info, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lookupMovie, lookupSeries, type TmdbInfo } from '@/other/tmdb-lookup';

interface PosterCardProps {
  title: string;
  image?: string | null;
  subtitle?: string;
  onClick?: () => void;
  /** Aspect ratio of the card. Defaults to 2:3 (portrait, movie poster). */
  aspect?: 'poster' | 'landscape' | 'square';
  className?: string;
  /** Enables TMDB enrichment: fallback poster, hover backdrop + trailer. */
  kind?: 'movie' | 'series';
  streamId?: string | number;
  tmdbHint?: any;
}

const aspectClass: Record<NonNullable<PosterCardProps['aspect']>, string> = {
  poster: 'aspect-[2/3]',
  landscape: 'aspect-video',
  square: 'aspect-square',
};

const HOVER_DELAY_MS = 180;

function posterUrl(tmdb: TmdbInfo | undefined | null): string | undefined {
  return tmdb?.image || tmdb?.cover;
}
function backdropUrl(tmdb: TmdbInfo | undefined | null): string | undefined {
  return tmdb?.backdrop_path?.[0] || tmdb?.cover || tmdb?.image;
}

export function PosterCard({
  title,
  image,
  subtitle,
  onClick,
  aspect = 'poster',
  className,
  kind,
  streamId,
  tmdbHint,
}: PosterCardProps) {
  const [broken, setBroken] = useState(false);
  const [preview, setPreview] = useState(false);
  const [tmdb, setTmdb] = useState<TmdbInfo | null>(null);
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);

  const canEnrich = Boolean(kind && streamId);

  // Fire TMDB lookup when the provider didn't supply an image. Cheap after
  // the first hit (client memory → sessionStorage → server SQLite).
  useEffect(() => {
    if (!canEnrich) return;
    if (image && !broken) return;
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    const fn = kind === 'series' ? lookupSeries : lookupMovie;
    fn(streamId, title, tmdbHint).then((res) => {
      if (res?.info) setTmdb(res.info);
    });
  }, [canEnrich, image, broken, kind, streamId, title, tmdbHint]);

  // On hover, always ensure we have TMDB details — the preview wants a
  // backdrop and trailer regardless of whether the initial poster existed.
  const prefetchForHover = () => {
    if (!canEnrich || triggeredRef.current) return;
    triggeredRef.current = true;
    const fn = kind === 'series' ? lookupSeries : lookupMovie;
    fn(streamId, title, tmdbHint).then((res) => {
      if (res?.info) setTmdb(res.info);
    });
  };

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    onClick?.();
  };

  const enter = () => {
    prefetchForHover();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPreview(true), HOVER_DELAY_MS);
  };
  const leave = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPreview(false);
  };

  const effectiveImage = image && !broken ? image : posterUrl(tmdb);
  const effectiveBackdrop = backdropUrl(tmdb) ?? effectiveImage;
  const trailer = tmdb?.youtube_trailer;

  return (
    <div
      onMouseEnter={enter}
      onMouseLeave={leave}
      className={cn('group relative w-40 shrink-0 snap-start md:w-48 lg:w-52', className)}
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative block w-full overflow-hidden rounded-md bg-neutral-800 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        aria-label={title}
      >
        <div className={cn('relative w-full', aspectClass[aspect])}>
          {effectiveImage ? (
            <img
              src={effectiveImage}
              alt={title}
              loading="lazy"
              onError={() => setBroken(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-800 to-neutral-900 p-3 text-neutral-400">
              <ImageOff className="size-6" />
              <span className="line-clamp-2 text-center text-xs font-medium">{title}</span>
            </div>
          )}
        </div>
      </button>

      {preview && (
        <div
          className={cn(
            'pointer-events-auto absolute left-1/2 top-1/2 z-30 w-[22rem] -translate-x-1/2 -translate-y-1/2 scale-110',
            'origin-center overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-2xl shadow-black/70'
          )}
          onClick={handleClick}
        >
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {trailer ? (
              <iframe
                title={title}
                src={`https://www.youtube-nocookie.com/embed/${trailer}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playlist=${trailer}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute inset-0 h-full w-full border-0"
                style={{ pointerEvents: 'none' }}
              />
            ) : effectiveBackdrop ? (
              <img
                src={effectiveBackdrop}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-600">
                <ImageOff className="size-8" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />
          </div>
          <div className="space-y-3 p-4">
            <div className="truncate text-base font-semibold text-white">{title}</div>
            {(tmdb?.genre || subtitle) && (
              <div className="truncate text-xs text-neutral-400">{tmdb?.genre || subtitle}</div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                aria-label="Play"
              >
                <Play className="size-4 fill-current" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10"
                aria-label="More info"
              >
                <Info className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
