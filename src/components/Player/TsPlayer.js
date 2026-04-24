import React, { useEffect, useRef } from "react"
import mpegts from "mpegts.js"

// Plays progressive MPEG-TS streams (Dispatcharr and many Xtream servers serve raw
// video/mp2t at the /live/.../id.m3u8 endpoint — not an HLS playlist). hls.js can't
// consume that; mpegts.js can.
const TsPlayer = ({ url, playing, volume, onError, onLoading, onPlaying }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        if (!url || !videoRef.current) return;
        if (!mpegts.getFeatureList().mseLivePlayback) {
            onError && onError(new Error("MSE live playback not supported"));
            return;
        }

        const player = mpegts.createPlayer(
            { type: "mpegts", isLive: true, url },
            {
                // Buffer tuned for smooth playback over minimum latency.
                enableStashBuffer: true,
                stashInitialSize: 384,              // KB — larger stash smooths jitter
                autoCleanupSourceBuffer: true,
                autoCleanupMaxBackwardDuration: 30,
                autoCleanupMinBackwardDuration: 10,
                // Don't speed up to chase live edge — that's what caused fast-forwarding.
                liveBufferLatencyChasing: false,
                liveBufferLatencyChasingOnPaused: false,
                lazyLoad: false,
                lazyLoadMaxDuration: 0,
                isLive: true,
            }
        );
        playerRef.current = player;

        const onErr = (_type, detail) => {
            onError && onError(new Error(detail || "mpegts error"));
        };
        player.on(mpegts.Events.ERROR, onErr);
        player.on(mpegts.Events.LOADING_COMPLETE, () => onLoading && onLoading(false));
        player.on(mpegts.Events.MEDIA_INFO, () => onLoading && onLoading(false));

        player.attachMediaElement(videoRef.current);
        player.load();
        onLoading && onLoading(true);

        return () => {
            try { player.pause(); } catch (e) {}
            try { player.unload(); } catch (e) {}
            try { player.detachMediaElement(); } catch (e) {}
            try { player.destroy(); } catch (e) {}
            playerRef.current = null;
        };
    }, [url]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (playing) {
            const p = v.play();
            if (p && p.catch) p.catch(() => {});
        } else {
            v.pause();
        }
    }, [playing, url]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }, [volume]);

    return (
        <video
            ref={videoRef}
            style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            playsInline
            onPlaying={() => onPlaying && onPlaying()}
            onWaiting={() => onLoading && onLoading(true)}
            onError={() => onError && onError(new Error("<video> error"))}
        />
    );
};

export default TsPlayer;
