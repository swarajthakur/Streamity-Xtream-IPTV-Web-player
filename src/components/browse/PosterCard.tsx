import { useRef, useState, type MouseEvent } from 'react';
import { ImageOff, Info, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PosterCardProps {
  title: string;
  image?: string | null;
  subtitle?: string;
  onClick?: () => void;
  /** Aspect ratio of the card. Defaults to 2:3 (portrait, movie poster). */
  aspect?: 'poster' | 'landscape' | 'square';
  className?: string;
}

const aspectClass: Record<NonNullable<PosterCardProps['aspect']>, string> = {
  poster: 'aspect-[2/3]',
  landscape: 'aspect-video',
  square: 'aspect-square',
};

const HOVER_DELAY_MS = 420;

export function PosterCard({
  title,
  image,
  subtitle,
  onClick,
  aspect = 'poster',
  className,
}: PosterCardProps) {
  const [broken, setBroken] = useState(false);
  const [preview, setPreview] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    onClick?.();
  };

  const enter = () => {
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

  return (
    <div
      onMouseEnter={enter}
      onMouseLeave={leave}
      className={cn('group relative w-40 shrink-0 snap-start md:w-48 lg:w-52', className)}
    >
      {/* Base card — flows in the rail */}
      <button
        type="button"
        onClick={handleClick}
        className="relative block w-full overflow-hidden rounded-md bg-neutral-800 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        aria-label={title}
      >
        <div className={cn('relative w-full', aspectClass[aspect])}>
          {image && !broken ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              onError={() => setBroken(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-500">
              <ImageOff className="size-8" />
            </div>
          )}
        </div>
      </button>

      {/* Expanded preview — absolutely positioned so it doesn't reflow the
          rail. Appears on hover after a short delay. */}
      {preview && (
        <div
          className={cn(
            'pointer-events-auto absolute left-1/2 top-1/2 z-30 w-[22rem] -translate-x-1/2 -translate-y-1/2 scale-110',
            'origin-center overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-2xl shadow-black/70',
            'transition-all duration-200'
          )}
          onClick={handleClick}
        >
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {image && !broken && (
              <img
                src={image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />
          </div>
          <div className="space-y-3 p-4">
            <div className="truncate text-base font-semibold text-white">{title}</div>
            {subtitle && <div className="truncate text-xs text-neutral-400">{subtitle}</div>}
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
