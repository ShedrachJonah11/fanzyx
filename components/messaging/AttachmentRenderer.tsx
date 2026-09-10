"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Pause, Play, X } from "lucide-react";
import {
  formatDuration,
  markAudioPlaying,
  markAudioStopped,
  registerAudioStop,
} from "@/lib/audio";
import type { MessageAttachment } from "@/services/dtos";
import { cn } from "@/lib/utils";

type Props = {
  attachment: MessageAttachment;
  mine?: boolean;
};

export function AttachmentRenderer({ attachment, mine }: Props) {
  if (attachment.kind === "image") {
    return <ImageBubble att={attachment} />;
  }
  if (attachment.kind === "video") {
    return <VideoBubble att={attachment} />;
  }
  return <AudioBubble att={attachment} mine={mine} />;
}

/* ── Image ────────────────────────────────────────── */

function ImageBubble({ att }: { att: MessageAttachment }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block rounded-[12px] overflow-hidden hairline bg-black"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={att.url}
          alt=""
          className="block max-w-[280px] max-h-[360px] w-auto h-auto object-contain"
        />
      </button>
      {open ? <Lightbox url={att.url} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  const stop = (e: ReactMouseEvent) => e.stopPropagation();
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="on-media absolute top-4 right-4 inline-flex items-center justify-center size-10 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80"
      >
        <X className="size-4" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        onClick={stop}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}

/* ── Video ────────────────────────────────────────── */

function VideoBubble({ att }: { att: MessageAttachment }) {
  return (
    <div className="relative inline-block rounded-[12px] overflow-hidden hairline bg-black">
      <video
        src={att.url}
        poster={att.posterUrl ?? undefined}
        controls
        playsInline
        preload="metadata"
        className="block max-w-[320px] max-h-[420px] w-auto h-auto bg-black"
      />
      {att.durationMs ? (
        <span className="on-media absolute bottom-1.5 right-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-white">
          {formatDuration(att.durationMs)}
        </span>
      ) : null}
    </div>
  );
}

/* ── Audio (voice note) ─────────────────────────── */

const BAR_COUNT = 40;

function AudioBubble({
  att,
  mine,
}: {
  att: MessageAttachment;
  mine?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [elapsedMs, setElapsedMs] = useState(0);
  const durationMs = att.durationMs ?? 0;
  const id = att.mediaId || att.url;

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    setPlaying(false);
    markAudioStopped(id);
  }, [id]);

  // Register with the shared coordinator so other bubbles playing pauses us.
  useEffect(() => registerAudioStop(id, stop), [id, stop]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      stop();
      return;
    }
    markAudioPlaying(id);
    el.play().then(() => setPlaying(true)).catch(() => {});
  };

  const onTimeUpdate = () => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setProgress(el.currentTime / el.duration);
    setElapsedMs(el.currentTime * 1000);
  };

  const onEnded = () => {
    setPlaying(false);
    setProgress(0);
    setElapsedMs(0);
    markAudioStopped(id);
  };

  const bars = att.waveform && att.waveform.length > 0 ? att.waveform : null;
  const activeMs = playing || progress > 0 ? elapsedMs : durationMs;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-[16px] min-w-[220px] max-w-[300px]",
        mine
          ? "bg-white/[0.15]"
          : "bg-white/[0.06] hairline"
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="inline-flex items-center justify-center size-9 rounded-full bg-white text-black shrink-0 hover:opacity-90"
      >
        {playing ? (
          <Pause className="size-4" fill="currentColor" />
        ) : (
          <Play className="size-4 translate-x-[1px]" fill="currentColor" />
        )}
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <WaveformBars
          waveform={bars}
          progress={progress}
          onSeek={(fraction) => {
            const el = audioRef.current;
            if (!el || !el.duration) return;
            el.currentTime = el.duration * fraction;
          }}
        />
        <span className="text-[10px] text-white/70 tabular-nums">
          {formatDuration(activeMs)}
        </span>
      </div>
      <audio
        ref={audioRef}
        src={att.url}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}

/**
 * Render N bars scaled to their [0,1] sample. Bars up to the progress cursor
 * are drawn fully opaque; the rest are dimmed. Click to seek.
 */
function WaveformBars({
  waveform,
  progress,
  onSeek,
}: {
  waveform: number[] | null;
  progress: number;
  onSeek: (fraction: number) => void;
}) {
  // Fall back to uniform bars if no waveform data.
  const samples =
    waveform && waveform.length > 0
      ? waveform.slice(0, BAR_COUNT).concat(
          waveform.length < BAR_COUNT
            ? Array(BAR_COUNT - waveform.length).fill(0.3)
            : []
        )
      : Array(BAR_COUNT).fill(0.4);

  return (
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        onSeek(Math.max(0, Math.min(1, x / rect.width)));
      }}
      className="w-full flex items-center gap-[2px] h-7"
      aria-label="Seek"
    >
      {samples.map((v, i) => {
        const cutoff = progress * BAR_COUNT;
        const played = i <= cutoff;
        const height = Math.max(3, Math.round(v * 22));
        return (
          <span
            key={i}
            className={cn(
              "flex-1 rounded-full transition-opacity",
              played ? "bg-white" : "bg-white/40"
            )}
            style={{ height }}
          />
        );
      })}
    </button>
  );
}
