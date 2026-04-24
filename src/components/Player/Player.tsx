import { useEffect, useRef, useState } from 'react';
import { Loader2, Maximize, Minimize, Pause, PictureInPicture, Play, Volume2, VolumeX } from 'lucide-react';

import { useSelector } from '@/store/legacy';
import TsPlayer from './TsPlayer';
import { cn } from '@/lib/utils';
import { generateUrl, catchupUrlGenerator, convertTsToM3u8 } from '../../other/generate-url';
import Fullscreen from '../Live/Fullscreen.js';

const HIDE_DELAY_MS = 3000;

export default function Player() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const playingChannel = useSelector((s) => s.playingCh || { disabled: true });

  const [play, setPlay] = useState<boolean>(Boolean(playingChannel));
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [pip, setPip] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState<string | undefined>(undefined);

  // Fullscreen control
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (fullscreen) {
      el.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [fullscreen]);

  // Exit fullscreen via ESC syncs state
  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // URL derivation when channel changes
  useEffect(() => {
    if (!playingChannel || (playingChannel as any).disabled) {
      setIsLoading(false);
      return;
    }
    setError(false);
    let ip = (playingChannel as any).direct_source
      ? convertTsToM3u8((playingChannel as any).direct_source)
      : generateUrl('live', (playingChannel as any).stream_id, 'm3u8');
    if ((playingChannel as any).timeshift) {
      ip = catchupUrlGenerator(
        ip,
        (playingChannel as any).timeshift,
        (playingChannel as any).duration
      );
    }
    setUrl(ip);
    setPlay(true);
  }, [playingChannel]);

  // PiP
  useEffect(() => {
    const video = wrapperRef.current?.querySelector('video');
    if (!video) return;
    if (pip) {
      (video as any).requestPictureInPicture?.().catch(() => setPip(false));
    } else if (document.pictureInPictureElement === video) {
      (document as any).exitPictureInPicture?.().catch(() => {});
    }
  }, [pip]);

  const revealOverlay = () => {
    setOverlayVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (fullscreen) setOverlayVisible(false);
    }, HIDE_DELAY_MS);
  };

  const effectiveVolume = muted ? 0 : volume / 100;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'group/player relative w-full select-none overflow-hidden bg-black',
        fullscreen ? 'h-screen' : 'aspect-video'
      )}
      onDoubleClick={() => setFullscreen((v) => !v)}
      onMouseMove={() => revealOverlay()}
      onMouseLeave={() => fullscreen || setOverlayVisible(true)}
    >
      <TsPlayer
        url={url}
        playing={play}
        volume={effectiveVolume}
        onPlaying={() => {
          setError(false);
          setIsLoading(false);
        }}
        onLoading={(v: boolean) => {
          setIsLoading(v);
          if (v) setError(false);
        }}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
      />

      {/* Placeholder when nothing's loaded */}
      {!url && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-neutral-500">
            <Play className="size-10 opacity-30" />
            <span className="text-xs uppercase tracking-wider">No channel selected</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="size-10 animate-spin text-brand" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center">
          <div>
            <div className="text-lg font-semibold text-white">Can&apos;t play this stream</div>
            <div className="mt-1 text-sm text-neutral-400">
              Try another channel or reload.
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 py-3 transition-opacity duration-300',
          overlayVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <button
          type="button"
          onClick={() => setPlay((p) => !p)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label={play ? 'Pause' : 'Play'}
        >
          {play ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            setMuted(v === 0);
          }}
          aria-label="Volume"
          className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/20 accent-[color:var(--color-brand)] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPip((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
            aria-label="Picture in Picture"
          >
            <PictureInPicture className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        </div>
      </div>

      {fullscreen && (
        <Fullscreen
          externalShow={overlayVisible}
          cTitle={(playingChannel as any).title}
          cDesc={(playingChannel as any).desc}
          cDuration={(playingChannel as any).duration}
        />
      )}
    </div>
  );
}
