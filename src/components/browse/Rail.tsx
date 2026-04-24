import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RailProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Netflix-style horizontal rail. Arrow buttons show on hover (desktop) and
 * page the scroll container by ~80% of viewport width.
 */
export function Rail({ title, children, className }: RailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className={cn('group/rail relative space-y-2 py-4', className)}>
      <h2 className="px-4 text-lg font-semibold tracking-tight text-neutral-100 md:px-10 md:text-xl">
        {title}
      </h2>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-black/70 to-transparent text-white opacity-0 transition-opacity group-hover/rail:opacity-100 md:flex"
        >
          <ChevronLeft className="size-6" />
        </button>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 scrollbar-none md:gap-4 md:px-10 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {children}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll(1)}
          className="absolute right-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-black/70 to-transparent text-white opacity-0 transition-opacity group-hover/rail:opacity-100 md:flex"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
    </section>
  );
}
