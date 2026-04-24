import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Search() {
  const history = useHistory();
  const query = useQuery();
  const { playingMode, category } = useParams<{ playingMode?: string; category?: string }>();

  const [value, setValue] = useState(query.get('search') || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const closeWith = (path: string) => {
    setOpen(false);
    window.setTimeout(() => history.replace(path), 250);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) {
      closeWith(category ? `/${playingMode}/category/${category}` : `/${playingMode}/`);
      return;
    }
    const q = encodeURIComponent(value);
    closeWith(
      category
        ? `/${playingMode}/category/${category}/?search=${q}`
        : `/${playingMode}/?search=${q}`
    );
  };

  const clear = () => {
    closeWith(category ? `/${playingMode}/category/${category}` : `/${playingMode}/`);
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center px-4 transition-all duration-300 ${
        open ? 'bg-black/60 opacity-100 backdrop-blur-md' : 'pointer-events-none opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) clear();
      }}
    >
      <form
        onSubmit={submit}
        className={`flex w-full max-w-2xl items-stretch gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : '-translate-y-6'
        }`}
      >
        <Button type="button" variant="ghost" size="icon" onClick={clear} aria-label="Cancel">
          <X className="size-4" />
        </Button>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="text"
            spellCheck={false}
            placeholder="Search streams…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            className="h-11 pl-9 text-base"
          />
        </div>
        <Button type="submit" size="lg">
          <SearchIcon className="size-4" /> Search
        </Button>
      </form>
    </div>
  );
}
