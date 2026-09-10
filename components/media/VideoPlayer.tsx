"use client";

import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayerProps,
  type VideoMimeType,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

export type VideoPlayerProps = {
  src: string;
  poster?: string | null;
  aspectRatio?: string;
  className?: string;
} & Omit<Partial<MediaPlayerProps>, "src" | "poster" | "aspectRatio">;

const VIDEO_MIME_BY_EXT: Record<string, VideoMimeType> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  ogv: "video/ogg",
};

function isHls(url: string) {
  return /\.m3u8($|\?)/i.test(url);
}

function isDash(url: string) {
  return /\.mpd($|\?)/i.test(url);
}

function guessVideoMime(url: string): VideoMimeType {
  // Strip query/hash, take the extension of the last path segment.
  const clean = url.split("?")[0].split("#")[0];
  const ext = clean.slice(clean.lastIndexOf(".") + 1).toLowerCase();
  return VIDEO_MIME_BY_EXT[ext] ?? "video/mp4";
}

/**
 * Vidstack-based video player. Supports mp4/webm plus HLS/DASH via the
 * underlying provider auto-detection. Uses the polished default layout
 * (fullscreen, PIP, captions, keyboard nav, gestures, playback speed).
 *
 * We pass `src` as an object with an explicit `type` because Vidstack's
 * auto-detection uses the URL extension — R2 objects served through our
 * signed URLs often have no extension, in which case detection silently
 * fails and the player renders empty.
 *
 * `crossOrigin` is intentionally NOT set — enabling it requires the CDN to
 * send `Access-Control-Allow-Origin`, which our R2 bucket doesn't by default.
 */
export function VideoPlayer({
  src,
  poster,
  aspectRatio,
  className,
  ...rest
}: VideoPlayerProps) {
  const source = isHls(src)
    ? { src, type: "application/x-mpegurl" as const }
    : isDash(src)
    ? { src, type: "application/dash+xml" as const }
    : { src, type: guessVideoMime(src) };

  return (
    <MediaPlayer
      src={source}
      poster={poster ?? undefined}
      aspectRatio={aspectRatio}
      playsInline
      className={className}
      {...rest}
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
