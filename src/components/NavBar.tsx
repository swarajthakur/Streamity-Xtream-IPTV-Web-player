import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Grid3x3, Menu, Search as SearchIcon, Tv } from 'lucide-react';

import { useSelector } from '@/store/legacy';
import { useAuth } from '../other/auth';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const fullScreen = useSelector((s) => s.fullScreen);
  const location = useLocation();
  const auth = useAuth() as any;
  const { playingMode } = useParams<{ playingMode?: string }>();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (fullScreen) return null;

  const isAuthed = auth.isAuth?.();
  const inMenu = location.pathname.includes('menu');
  const showActions = isAuthed && !inMenu;
  const search = window.location.search;

  const iconClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-neutral-200 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-4 transition-colors duration-300 md:px-10',
        scrolled
          ? 'bg-neutral-950/95 backdrop-blur shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-b from-neutral-950/85 to-transparent'
      )}
    >
      <Link to="/" className="flex items-center gap-3">
        <img src="/img/streamify-logo.svg" alt="Streamify" className="h-6 md:h-7" />
      </Link>

      {showActions && (
        <nav className="flex items-center gap-2">
          {location.pathname.includes('live') && (
            <Link
              to={`${location.pathname.split('?')[0]}tvguide/`}
              className={iconClass}
              aria-label="TV Guide"
              title="TV Guide"
            >
              <Tv className="size-4" />
            </Link>
          )}
          <Link
            to={{ pathname: `${location.pathname.split('?')[0]}search/`, search }}
            className={iconClass}
            aria-label="Search"
            title="Search"
          >
            <SearchIcon className="size-4" />
          </Link>
          {playingMode && (
            <Link
              to={{ pathname: `/${playingMode}/category/`, search }}
              className={iconClass}
              aria-label="Categories"
              title="Categories"
            >
              <Grid3x3 className="size-4" />
            </Link>
          )}
          <Link to="menu/" className={iconClass} aria-label="Menu" title="Menu">
            <Menu className="size-4" />
          </Link>
        </nav>
      )}
    </header>
  );
}
