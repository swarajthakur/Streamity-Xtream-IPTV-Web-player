import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import { Star } from 'lucide-react';
import dateFormat from 'dateformat';

import { useDispatch, useSelector } from '@/store/legacy';
import { setPlayingChannel } from '../../actions/playingChannel';
import DB from '../../other/local-db';
import {
  downloadEpgData,
  getSingleEpgNow,
} from '../../other/epg-database';
import Popup from '../Popup/Popup';
import { cn } from '@/lib/utils';

interface ChannelData {
  stream_id: number | string;
  name: string;
  num: number | string;
  stream_icon?: string;
  epg_channel_id?: string;
  shift?: number;
}

const ROW_HEIGHT = 72; // px

export default function Channels({ playlist }: { playlist: ChannelData[] }) {
  const playingChannel = useSelector((s) => s.playingCh);
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const searchText = new URLSearchParams(location.search).get('search');

  const [popup, setPopup] = useState<{ title: string; description: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(480);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = Math.floor(entries[0].contentRect.height);
      if (h > 0) setHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const channels = useMemo(() => {
    if (!Array.isArray(playlist)) return [];
    if (searchText) {
      const q = searchText.toLowerCase();
      return playlist.filter((x) => x.name?.toLowerCase().includes(q));
    }
    return playlist;
  }, [playlist, searchText]);

  useEffect(() => {
    if (searchText && channels.length === 0 && playlist?.length > 0) {
      setPopup({
        title: `No stream found with "${searchText}"`,
        description: 'Search will be cleared.',
      });
    }
  }, [searchText, channels.length, playlist?.length]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const ch = channels[index];
    const selected = playingChannel?.stream_id === ch.stream_id;
    return (
      <ChannelRow
        style={style}
        channel={ch}
        selected={selected}
        onClick={() => dispatch(setPlayingChannel(ch))}
      />
    );
  };

  return (
    <>
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        {height > 0 && channels.length > 0 && (
          <List
            height={height}
            width="100%"
            itemCount={channels.length}
            itemSize={ROW_HEIGHT}
          >
            {Row}
          </List>
        )}
        {channels.length === 0 && !searchText && (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No channels in this playlist.
          </div>
        )}
      </div>
      {popup && (
        <Popup
          type="info"
          error={false}
          title={popup.title}
          description={popup.description}
          onclick={() => {
            setPopup(null);
            history.replace(location.pathname.split('?')[0]);
          }}
        />
      )}
    </>
  );
}

interface ChannelRowProps {
  channel: ChannelData;
  selected: boolean;
  onClick: () => void;
  style: React.CSSProperties;
}

function ChannelRow({ channel, selected, onClick, style }: ChannelRowProps) {
  const h24Format = useSelector((s) => s.h24);
  const tick60 = useSelector((s) => s.timer60);
  const tick5 = useSelector((s) => s.timer5);

  const [epgNow, setEpgNow] = useState<any>(null);
  const [favorite, setFavorite] = useState<boolean>(false);
  const [imgOk, setImgOk] = useState<boolean>(Boolean(channel.stream_icon));

  useEffect(() => {
    setFavorite(Boolean(DB.findOne('live', channel.stream_id, true)));
    if (!channel.epg_channel_id) return;
    (async () => {
      await downloadEpgData(channel.stream_id, channel.epg_channel_id, 1, channel.shift || 0);
      const now = getSingleEpgNow(channel.epg_channel_id, channel.shift || 0);
      setEpgNow(now || null);
    })();
  }, [channel.stream_id]);

  useEffect(() => {
    if (!channel.epg_channel_id) return;
    const now = getSingleEpgNow(channel.epg_channel_id, channel.shift || 0);
    if (!now) setEpgNow(null);
    else if (!epgNow || epgNow.start !== now.start) setEpgNow({ ...now });
  }, [tick60]);

  const progress =
    epgNow && epgNow.start && epgNow.end
      ? Math.max(0, Math.min(100, ((tick5 - epgNow.start) / (epgNow.end - epgNow.start)) * 100))
      : 0;

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorite) DB.del('live', channel.stream_id, true);
    else DB.set('live', channel.stream_id, { id: channel.stream_id }, true);
    setFavorite(!favorite);
  };

  return (
    <div style={style} className="px-2">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className={cn(
          'flex h-full w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
          selected
            ? 'border-brand/60 bg-brand/15'
            : 'border-transparent hover:border-neutral-800 hover:bg-white/5'
        )}
      >
        <div className="w-8 shrink-0 text-center text-sm font-medium text-neutral-500">
          {channel.num}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-800">
          {channel.stream_icon && imgOk ? (
            <img
              src={channel.stream_icon}
              alt=""
              loading="lazy"
              onError={() => setImgOk(false)}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs font-bold text-neutral-500">
              {channel.name?.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-neutral-100">{channel.name}</div>
          {epgNow ? (
            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
              <span className="tabular-nums text-neutral-500">
                {dateFormat(new Date(epgNow.start), h24Format)} –{' '}
                {dateFormat(new Date(epgNow.end), h24Format)}
              </span>
              <span className="truncate">{epgNow.title}</span>
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-neutral-600">No EPG</div>
          )}
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className={cn(
                'h-full transition-all',
                selected ? 'bg-white' : 'bg-neutral-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={toggleFav}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-white/10 hover:text-yellow-400"
        >
          <Star
            className={cn('size-4', favorite && 'fill-yellow-400 text-yellow-400')}
          />
        </button>
      </div>
    </div>
  );
}
