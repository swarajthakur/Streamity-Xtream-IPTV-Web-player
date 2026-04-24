import { useEffect, useState } from 'react';
import dateFormat from 'dateformat';

import { useSelector } from '@/store/legacy';
import { getEpgNow } from '../../other/epg-database';
import { cn } from '@/lib/utils';

interface EpgItem {
  start: number;
  end: number;
  title: string;
  description?: string;
}

interface EpgListingProps {
  Epg?: string | null;
  Shift?: number;
}

export default function EpgListing({ Epg, Shift }: EpgListingProps) {
  const tick60 = useSelector((s) => s.timer60);
  const h24 = useSelector((s) => s.h24);
  const [items, setItems] = useState<EpgItem[]>([]);

  useEffect(() => {
    const arr = getEpgNow(Epg, Shift || 0);
    setItems(arr && arr.length ? arr : []);
  }, [Epg, Shift, tick60]);

  if (!Epg) {
    return (
      <div className="p-4 text-sm text-neutral-500">
        {items.length === 0 ? 'No program guide for this channel.' : null}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-sm text-neutral-500">Fetching program guide…</div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <ul className="flex flex-col gap-3">
        {items.slice(0, 6).map((ep, idx) => {
          const isNow = ep.start <= Date.now() && ep.end > Date.now();
          return (
            <li key={`${ep.start}-${idx}`} className="flex gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center pt-0.5">
                <span
                  className={cn(
                    'inline-block size-2 rounded-full',
                    isNow ? 'animate-pulse bg-brand' : 'bg-neutral-700'
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs tabular-nums text-neutral-400">
                    {dateFormat(new Date(ep.start), h24)} –{' '}
                    {dateFormat(new Date(ep.end), h24)}
                  </span>
                  <span className="truncate text-sm font-semibold text-neutral-100">
                    {ep.title}
                  </span>
                </div>
                {idx === 0 && ep.description && (
                  <p className="mt-1 line-clamp-3 text-xs text-neutral-400">
                    {ep.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
