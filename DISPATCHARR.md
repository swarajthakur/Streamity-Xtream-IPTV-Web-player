# Dispatcharr tuning notes

This player talks to an Xtream-compatible backend. If you use **Dispatcharr** as
that backend, a few settings on the Dispatcharr side control whether live
channels play smoothly. These notes capture the configuration that works with
this player.

The player itself needs no changes — all tuning is server-side in Dispatcharr.

---

## 1. Stream profile — transcode to H.264 + AAC

Many Xtream feeds ship MPEG-2 video and AC-3 audio. Browsers cannot decode
either in Media Source Extensions (you get either a black screen with audio,
or video with no sound). The fix is to re-encode with FFmpeg to H.264 + AAC
before the stream reaches the browser.

**Settings → Stream Profiles → Add Profile**

Name: `transcode-h264-aac`

Parameters:

```
-hide_banner -loglevel error -fflags +genpts -i {streamUrl} -c:v libx264 -preset veryfast -tune zerolatency -profile:v main -level 4.1 -pix_fmt yuv420p -g 50 -sc_threshold 0 -c:a aac -b:a 128k -ac 2 -ar 48000 -f mpegts -mpegts_flags +resend_headers pipe:1
```

What each flag does:

| Flag | Purpose |
|---|---|
| `-fflags +genpts` | Regenerates presentation timestamps; fixes jitter on feeds with bad PTS |
| `-c:v libx264` | Re-encode to H.264 (kills MPEG-2 and HEVC passthrough) |
| `-preset veryfast` | Best latency/CPU tradeoff for live. Drop to `ultrafast` if CPU-bound |
| `-tune zerolatency` | Disables look-ahead — critical for live, avoids 2–3 s lag |
| `-profile:v main -level 4.1` | Widest browser compatibility |
| `-pix_fmt yuv420p` | Forces 4:2:0 chroma; browsers refuse 4:2:2/4:4:4 even as H.264 |
| `-g 50 -sc_threshold 0` | Keyframe every 50 frames (~2 s @ 25 fps); faster channel-change startup |
| `-c:a aac -b:a 128k -ac 2 -ar 48000` | Re-encode audio to stereo AAC 48 kHz (kills AC-3/E-AC-3) |
| `-f mpegts -mpegts_flags +resend_headers` | Periodic PAT/PMT resends so mid-stream joiners get init data |
| `pipe:1` | Send output to stdout; Dispatcharr streams it to the client |

Apply this profile to every channel that plays with wrong codec (typically
MPEG-2 channels, +1 / timeshift channels, and DVB AC-3 channels). +1 channels
do not inherit from their parent — you must set the profile explicitly.

### Alternative — passthrough for already-compatible channels

If a channel already delivers H.264 + AAC, transcoding is wasted CPU. Use a
second profile for those:

Name: `passthrough`

```
-hide_banner -loglevel error -i {streamUrl} -c copy -f mpegts pipe:1
```

This just rebundles the TS container — nearly free CPU-wise. Assign it as the
default and switch to `transcode-h264-aac` only on channels that need it.

### If you're CPU-constrained

Drop resolution and CPU preset — profile becomes `transcode-h264-aac-lite`:

```
-hide_banner -loglevel error -fflags +genpts -i {streamUrl} -c:v libx264 -preset ultrafast -tune zerolatency -profile:v main -pix_fmt yuv420p -vf scale=-2:720 -maxrate 2500k -bufsize 5000k -g 50 -sc_threshold 0 -c:a aac -b:a 96k -ac 2 -ar 48000 -f mpegts -mpegts_flags +resend_headers pipe:1
```

Differences: `ultrafast` preset (~40% less CPU), downscale to 720p (~55% fewer
pixels), and a 2.5 Mbps ceiling.

If the Dispatcharr pod has GPU access (`/dev/dri/renderD128` is mounted), swap
`libx264 -preset ... -tune zerolatency` for one of:

- NVIDIA: `-c:v h264_nvenc -preset p4 -tune ll`
- Intel QSV: `-c:v h264_qsv -preset veryfast`
- VAAPI: `-vaapi_device /dev/dri/renderD128 -vf 'format=nv12,hwupload' -c:v h264_vaapi`

---

## 2. Proxy settings — multi-client stability

**Settings → Proxy** (Dispatcharr v0.21.0+)

Dispatcharr already shares one backend FFmpeg across all clients watching the
same channel — there is no on/off toggle for relay. But the default values
cause the one shared stream to get torn down and rebuilt as soon as a second
client joins, so **both** clients buffer. The fix is in three settings.

| Setting | Default / observed | Set to | Why |
|---|---|---|---|
| **Buffering Speed** | `1.0` | `0.85` | Threshold below which Dispatcharr calls a stream "stalled". At exactly 1.0, any I/O contention from a second client dips the pipe below realtime and triggers a rebuild. 0.85 gives 15% headroom. |
| **New Client Buffer (seconds)** | `0` | `5` | Joining client starts 5 s behind live instead of racing to the front. Biggest single fix for "second client breaks everything" — the initial burst no longer starves client 1. |
| **Channel Shutdown Delay** | `0` | `15` | Transient disconnects (tab switch, phone going to sleep, page reload) no longer kill FFmpeg and force a restart. Survives brief drops. |

Leave the others at their current values:

- `Buffering Timeout: 15` — fine
- `Buffer Chunk TTL: 60` — fine
- `Channel Initialization Grace Period: 5` — fine

### If it still buffers after these changes

- Verify both clients are on the **same channel**. Different channels = two
  separate FFmpeg processes; no proxy setting helps.
- If yes, you're CPU-bound, not mis-detected. Move as many channels as
  possible to the `passthrough` profile, and keep `transcode-h264-aac` only on
  the ones that actually need codec conversion.
- Check CPU steal time inside the pod:
  ```
  kubectl exec -it <dispatcharr-pod> -- sh -c "top -b -n 1 | head -5"
  ```
  If `%st` on the `Cpu(s)` line is above ~5, the Kubernetes node is
  oversubscribed and nothing you do in Dispatcharr will save you.

---

## 3. Verify it's working

Open the browser console with a live channel playing. This player logs the
codec every time the stream starts:

```
[TsPlayer] codec { video: "avc1.4d4028", audio: "mp4a.40.2", w: 1920, h: 1080 }
```

- `video: "avc1...."` → H.264, decoder will work.
- `video: "hvc1...."` → HEVC, browser cannot decode. Dispatcharr profile not applied.
- `video: ""` → no video track emitted. Usually MPEG-2 — browser rejected it before metadata.
- `audio: "mp4a...."` or `"mp3"` → works.
- missing `audio` → AC-3 / E-AC-3 passthrough; transcode profile not applied.

If the codec line confirms H.264 + AAC/MP3 and the stream still stutters, the
problem is network or CPU, not codec.
