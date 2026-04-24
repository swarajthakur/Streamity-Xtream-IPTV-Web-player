import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Film, Grid3x3, Search as SearchIcon, Tv, User, Video, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Entry {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
}

export default function LateralBar() {
  const location = useLocation();
  const history = useHistory();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(location.pathname.includes('menu'));
  }, [location.pathname]);

  const mode = location.pathname.includes('live')
    ? 'live'
    : location.pathname.includes('movie')
      ? 'movie'
      : location.pathname.includes('series')
        ? 'series'
        : null;

  const go = (path: string) => {
    setOpen(false);
    setTimeout(() => history.replace(path), 250);
  };

  const primary: Entry[] = [
    {
      icon: <Tv className="size-5" />,
      label: 'Live Channels',
      to: '/live/',
      active: mode === 'live',
    },
    {
      icon: <Film className="size-5" />,
      label: 'Movies',
      to: '/movie/',
      active: mode === 'movie',
    },
    {
      icon: <Video className="size-5" />,
      label: 'TV Series',
      to: '/series/',
      active: mode === 'series',
    },
  ];

  const secondary = () => {
    if (!mode) return [];
    const base = location.pathname.replace('menu', '').replace(/\/+$/, '');
    const entries: Entry[] = [
      {
        icon: <SearchIcon className="size-4" />,
        label: 'Search',
        to: `/${mode}/search/`,
        active: false,
      },
      {
        icon: <Grid3x3 className="size-4" />,
        label: 'Categories',
        to: `/${mode}/category/`,
        active: false,
      },
    ];
    if (mode === 'live') {
      entries.splice(1, 0, {
        icon: <Tv className="size-4" />,
        label: 'TV Guide',
        to: `${base}/tvguide/`,
        active: false,
      });
    }
    return entries;
  };

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-50 flex transition-opacity duration-300',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => history.goBack()}
      />

      <aside
        className={cn(
          'relative flex h-full w-full max-w-xs flex-col gap-2 border-r border-neutral-800 bg-neutral-950 p-6 transition-transform duration-300 md:max-w-sm',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between pb-4">
          <img src="/img/streamify-logo.svg" alt="Streamify" className="h-6" />
          <button
            type="button"
            onClick={() => history.goBack()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {primary.map((e) => (
            <button
              key={e.to}
              type="button"
              onClick={() => go(e.to)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium transition-colors',
                e.active
                  ? 'bg-brand/15 text-white'
                  : 'text-neutral-200 hover:bg-white/5 hover:text-white'
              )}
            >
              {e.icon}
              {e.label}
            </button>
          ))}
        </nav>

        {secondary().length > 0 && (
          <div className="mt-2 border-t border-neutral-800 pt-4">
            <div className="px-3 pb-2 text-xs uppercase tracking-wider text-neutral-500">
              {mode === 'live' ? 'Live' : mode === 'movie' ? 'Movies' : 'Series'}
            </div>
            <nav className="flex flex-col gap-1">
              {secondary().map((e) => (
                <button
                  key={e.label}
                  type="button"
                  onClick={() => go(e.to)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {e.icon}
                  {e.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        <div className="mt-auto border-t border-neutral-800 pt-4">
          <button
            type="button"
            onClick={() => go('/info/')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
          >
            <User className="size-4" />
            Account info
          </button>
        </div>
      </aside>
    </div>
  );
}
