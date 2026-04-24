import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { useDispatch, useSelector } from '@/store/legacy';
import { cn } from '@/lib/utils';
import Popup from '../Popup/Popup';

import { setPlaylist } from '../../actions/set-Playlist';
import { setGroupList } from '../../actions/set-Group';
import { resetMemory, setGroup } from '../../other/last-opened-mode';
import { loadGroup, loadPlaylist } from '../../other/load-playlist';
import DB from '../../other/local-db';

// Keep legacy sub-components; they are rewritten in their own phase.
import Player from '../Player/Player';
import EpgListing from './EpgListing';
import Channels from './Channels';

export default function MainLive() {
  const playingChannel = useSelector((s) => s.playingCh);
  const playlist = useSelector((s) => s.playlist);
  const dispatch = useDispatch();
  const history = useHistory();
  const { category } = useParams<{ category?: string }>();

  const [showNoStreams, setShowNoStreams] = useState(false);

  const blurred =
    isNaN(Number(category)) || category === undefined || history.location.pathname.includes('menu');

  useEffect(() => {
    const run = async () => {
      if (category !== undefined && category !== '0') {
        let chs = (await loadPlaylist('live', category)) || [];
        if (category === 'fav') {
          chs = chs.filter((x: any) => DB.findOne('live', x.stream_id, true));
        }
        dispatch(setPlaylist(chs));
        if (chs.length === 0) setShowNoStreams(true);
      } else if (resetMemory('live')) {
        const gps = await loadGroup('live');
        if (!gps || gps.length === 0) {
          history.replace('/');
          return;
        }
        gps.unshift({ category_name: 'Only favorites', category_id: 'fav' });
        setGroup(gps[1].category_id);
        dispatch(setGroupList(gps));
        history.replace('/live/category/' + gps[1].category_id + '/');
      } else {
        history.replace('/live/category/');
      }
    };
    run();
  }, [dispatch, category, history]);

  return (
    <>
      <main
        className={cn(
          'min-h-screen bg-neutral-950 pt-20 transition-[filter] duration-500',
          blurred && 'pointer-events-none blur-sm'
        )}
      >
        <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-6 px-4 pb-6 md:px-8 lg:grid-cols-12">
          <section className="lg:col-span-5 xl:col-span-5">
            <h2
              className="truncate text-lg font-semibold tracking-tight text-neutral-100 md:text-xl"
              title={playingChannel?.name}
            >
              {playingChannel?.name || 'No channel selected'}
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-neutral-800 bg-black shadow-2xl">
              <Player />
            </div>
            <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <EpgListing
                Epg={playingChannel ? playingChannel.epg_channel_id : null}
                Shift={playingChannel ? playingChannel.shift : 0}
              />
            </div>
          </section>

          <section className="lg:col-span-7 xl:col-span-7">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-2">
              <Channels playlist={playlist} />
            </div>
          </section>
        </div>
      </main>

      {showNoStreams && (
        <Popup
          type="error"
          title="No channels in this category"
          description="Try a different category or check your provider."
          icon="fas fa-times"
          onclick={() => {
            setShowNoStreams(false);
            history.replace('/live/category/');
          }}
        />
      )}
    </>
  );
}
