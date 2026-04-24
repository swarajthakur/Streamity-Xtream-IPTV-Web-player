import { useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useSelector } from '@/store/legacy';
import { generateUrl } from '../../other/generate-url';
import { Button } from '@/components/ui/button';

export default function VodPlayer() {
  const history = useHistory();
  const { stream_id } = useParams<{ stream_id?: string }>();
  const playlist = useSelector((s) => s.playlist) as any[];
  const videoRef = useRef<HTMLVideoElement>(null);

  const item = playlist.find((x) => String(x.stream_id) === String(stream_id));
  const ext = item?.container_extension || 'mp4';
  const url = item?.direct_source || generateUrl('movie', stream_id, ext);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') history.goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history]);

  useEffect(() => {
    videoRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="absolute left-0 top-0 z-10 flex w-full items-center gap-3 bg-gradient-to-b from-black to-transparent p-4">
        <Button variant="ghost" size="icon" onClick={() => history.goBack()} aria-label="Back">
          <ArrowLeft />
        </Button>
        <h1 className="truncate text-lg font-semibold text-white">{item?.name ?? 'Playing'}</h1>
      </div>
      <video
        ref={videoRef}
        src={url}
        controls
        autoPlay
        className="h-full w-full bg-black"
      />
    </div>
  );
}
