import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import dateFormat from 'dateformat';

import { useDispatch, useSelector } from '@/store/legacy';
import { setPlayingChannel } from '../../actions/playingChannel';
import { downloadEpgData, getEpg } from '../../other/epg-database';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Programme {
  start: number;
  end: number;
  title: string;
  description?: string;
}

export default function EpgFullListing() {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const { category, date } = useParams<{ category?: string; date?: string }>();

  const playlist = useSelector((s) => s.playlist) as any[];
  const h24 = useSelector((s) => s.h24);
  const tick60 = useSelector((s) => s.timer60);

  const [dayOffset, setDayOffset] = useState<number>(() => {
    if (!date) return 0;
    const parsed = parseInt(date, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  useEffect(() => {
    playlist.forEach((c) => {
      if (c.epg_channel_id) {
        downloadEpgData(c.stream_id, c.epg_channel_id, Math.max(1, dayOffset + 1), c.shift || 0);
      }
    });
  }, [playlist, dayOffset, tick60]);

  const dayLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return dateFormat(d, 'dddd, mmm d');
  }, [dayOffset]);

  const close = () => {
    const target = location.pathname.replace(/\/tvguide.*$/, '/');
    history.replace(target);
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-neutral-950 pt-16">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-4 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">TV Guide</h1>
            <p className="text-sm text-neutral-400">{dayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
              disabled={dayOffset === 0}
              aria-label="Previous day"
            >
              <ChevronLeft />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDayOffset(0)}>
              Today
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDayOffset((d) => Math.min(6, d + 1))}
              disabled={dayOffset >= 6}
              aria-label="Next day"
            >
              <ChevronRight />
            </Button>
            <Button variant="outline" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1800px] px-4 pb-12 md:px-8">
          <ul className="flex flex-col gap-2">
            {playlist.map((ch) => (
              <ChannelGuideRow
                key={ch.stream_id}
                channel={ch}
                dayOffset={dayOffset}
                h24={h24}
                onPlay={() => {
                  dispatch(setPlayingChannel(ch));
                  history.replace(
                    `/live/category/${category || ch.category_id || 'all'}/`
                  );
                }}
              />
            ))}
            {playlist.length === 0 && (
              <li className="py-24 text-center text-neutral-500">
                No channels loaded. Pick a category first.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  channel: any;
  dayOffset: number;
  h24: string;
  onPlay: () => void;
}

function ChannelGuideRow({ channel, dayOffset, h24, onPlay }: RowProps) {
  const tick60 = useSelector((s) => s.timer60);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  useEffect(() => {
    if (!channel.epg_channel_id) {
      setProgrammes([]);
      return;
    }
    const arr = getEpg(channel.epg_channel_id, dayOffset + 1, channel.shift || 0) as Programme[];
    setProgrammes(Array.isArray(arr) ? arr : []);
  }, [channel.epg_channel_id, dayOffset, tick60]);

  return (
    <li className="flex gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <button
        type="button"
        onClick={onPlay}
        className="flex w-48 shrink-0 flex-col items-start gap-2 text-left"
      >
        <div className="flex h-14 w-full items-center justify-center overflow-hidden rounded bg-neutral-800">
          {channel.stream_icon ? (
            <img
              src={channel.stream_icon}
              alt=""
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-bold text-neutral-500">
              {channel.name?.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        <div className="w-full truncate text-sm font-semibold text-neutral-100">
          {channel.num} · {channel.name}
        </div>
      </button>

      <div className="min-w-0 flex-1">
        {programmes.length === 0 ? (
          <div className="flex h-full min-h-[56px] items-center text-sm text-neutral-500">
            No program guide for this channel.
          </div>
        ) : (
          <ol className="flex flex-col divide-y divide-neutral-800">
            {programmes.slice(0, 6).map((p, idx) => {
              const isNow = p.start <= Date.now() && p.end > Date.now();
              return (
                <li
                  key={`${p.start}-${idx}`}
                  className={cn(
                    'flex items-baseline gap-3 py-2 text-sm',
                    isNow ? 'text-white' : 'text-neutral-300'
                  )}
                >
                  <span className="flex w-28 shrink-0 items-center gap-2 text-xs tabular-nums text-neutral-500">
                    {isNow && <Clock className="size-3 text-brand" />}
                    {dateFormat(new Date(p.start), h24)}–{dateFormat(new Date(p.end), h24)}
                  </span>
                  <span className="truncate font-medium">{p.title}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </li>
  );
}
