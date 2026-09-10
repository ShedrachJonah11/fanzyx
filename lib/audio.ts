"use client";

let sharedCtx: AudioContext | null = null;

/**
 * Lazily create a single AudioContext for the tab. Reusing one across audio
 * bubbles lets us pause the previously-playing voice note when a new one
 * starts (via `stopAllExcept`).
 */
export function getSharedAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("AudioContext requested outside the browser");
  }
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

/**
 * Decode an audio blob and compute an RMS-ish waveform, `samples` bars long,
 * each in [0, 1]. Used at record-time to embed the shape in the message
 * payload so the recipient renders the same bars.
 */
export async function computeWaveform(
  blob: Blob,
  samples = 40
): Promise<number[]> {
  const buf = await blob.arrayBuffer();
  const ctx = getSharedAudioContext();
  const audio = await ctx.decodeAudioData(buf.slice(0));
  const raw = audio.getChannelData(0);
  const chunk = Math.max(1, Math.floor(raw.length / samples));
  const out: number[] = [];
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < chunk; j++) sum += Math.abs(raw[i * chunk + j] || 0);
    out.push(Math.min(1, (sum / chunk) * 2));
  }
  return out;
}

/* ── Playback coordination ────────────────────────────── */

const listeners = new Set<() => void>();
let currentlyPlayingId: string | null = null;

/**
 * Register a stop callback keyed by an id. When another id starts playing,
 * every other registered listener fires so the previously-playing bubble
 * can pause itself.
 */
export function registerAudioStop(
  id: string,
  onStop: () => void
): () => void {
  const wrapped = () => {
    if (currentlyPlayingId !== id) onStop();
  };
  listeners.add(wrapped);
  return () => {
    listeners.delete(wrapped);
  };
}

/** Call before starting playback of `id` — stops every other listener. */
export function markAudioPlaying(id: string) {
  currentlyPlayingId = id;
  listeners.forEach((fn) => fn());
}

export function markAudioStopped(id: string) {
  if (currentlyPlayingId === id) currentlyPlayingId = null;
}

/** Format milliseconds as m:ss for voice-note duration labels. */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return "0:00";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
