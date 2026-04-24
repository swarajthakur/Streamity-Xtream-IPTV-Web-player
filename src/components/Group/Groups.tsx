import { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Search as SearchIcon, Star, X } from 'lucide-react';

import { useSelector } from '@/store/legacy';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getGroup } from '../../other/last-opened-mode';

interface Group {
  category_id: string;
  category_name: string;
}

export default function Groups() {
  const history = useHistory();
  const { playingMode, category } = useParams<{ playingMode?: string; category?: string }>();
  const groupsTemp = useSelector((s) => s.groupsList) as Group[];
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The /category/ path (without an :category param) opens the picker.
    setOpen(isNaN(Number(category)));
  }, [category]);

  useEffect(() => {
    if (!groupsTemp || groupsTemp.length === 0) {
      history.replace('/');
    }
  }, [groupsTemp, history]);

  const groups = useMemo(() => {
    if (!Array.isArray(groupsTemp)) return [];
    if (!search) return groupsTemp;
    const q = search.toLowerCase();
    return groupsTemp.filter((g) => g.category_name.toLowerCase().includes(q));
  }, [groupsTemp, search]);

  const close = () => {
    setOpen(false);
    window.setTimeout(() => history.goBack(), 300);
  };

  const selectAll = () => {
    setOpen(false);
    window.setTimeout(() => history.replace(`/${playingMode}/`), 300);
  };

  const selectGroup = (g: Group) => {
    setOpen(false);
    window.setTimeout(
      () => history.replace(`/${playingMode}/category/${g.category_id}/`),
      300
    );
  };

  const activeId = typeof getGroup === 'function' ? getGroup() : null;

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-40 transition-opacity duration-300',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      <aside
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 border-b border-neutral-800 p-4">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              spellCheck={false}
              className="pl-9"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {playingMode !== 'live' && (
              <li>
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 hover:bg-white/5 hover:text-white"
                >
                  <Star className="size-4 text-neutral-500" />
                  All
                </button>
              </li>
            )}
            {groups.map((g) => {
              const isActive = String(g.category_id) === String(activeId);
              const isFav = g.category_id === 'fav';
              return (
                <li key={'GP-' + g.category_id}>
                  <button
                    type="button"
                    onClick={() => selectGroup(g)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-brand/15 text-white'
                        : 'text-neutral-200 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {isFav ? (
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-neutral-600" />
                    )}
                    <span className="truncate">{g.category_name}</span>
                  </button>
                </li>
              );
            })}
            {groups.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-neutral-500">
                No categories match “{search}”.
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
