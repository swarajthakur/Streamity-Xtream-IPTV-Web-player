import { useState, type MouseEvent } from 'react';
import { ImageOff, Play } from 'lucide-react';
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

export function PosterCard({
  title,
  image,
  subtitle,
  onClick,
  aspect = 'poster',
  className,
}: PosterCardProps) {
  const [broken, setBroken] = useState(false);

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group relative w-40 shrink-0 snap-start overflow-hidden rounded-md bg-neutral-800 text-left ring-offset-neutral-950 transition-transform duration-300 hover:z-10 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:w-48 lg:w-52',
        className
      )}
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-2 p-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-sm font-semibold text-white">{title}</div>
            {subtitle && <div className="truncate text-xs text-neutral-300">{subtitle}</div>}
          </div>
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white text-black">
            <Play className="size-4 fill-current" />
          </div>
        </div>
      </div>
    </button>
  );
}
