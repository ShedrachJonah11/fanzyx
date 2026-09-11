"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { X, Lock, Trash2, Volume2, VolumeX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { stories } from "@/services/modules/stories";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import type { StoryFeedGroupOut, StoryOut } from "@/services/dtos";
import { cn, timeAgo } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";
const IMAGE_DURATION_MS = 6000;

type Props = {
  groups: StoryFeedGroupOut[];
  initialGroupIndex: number;
  initialStoryIndex?: number;
  onClose: () => void;
};

export function StoryPlayer({
  groups,
  initialGroupIndex,
  initialStoryIndex = 0,
  onClose,
}: Props) {
  const { user } = useAuth();
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const rawGroup = groups[groupIdx];
  // Filter out anything we deleted in-session so navigation doesn't hit them.
  const group = useMemo<StoryFeedGroupOut | undefined>(
    () =>
      rawGroup
        ? {
            ...rawGroup,
            stories: rawGroup.stories.filter((s) => !deletedIds.has(s.id)),
          }
        : undefined,
    [rawGroup, deletedIds]
  );
  const story: StoryOut | undefined = group?.stories[storyIdx];
  const isOwner = !!user && story?.creator.username === user.username;

  // Duration for this story (video → real duration; image → constant).
  const [durationMs, setDurationMs] = useState<number>(IMAGE_DURATION_MS);

  // Advance across groups + stories.
  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((s) => s - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx((g) => g - 1);
      setStoryIdx(Math.max(0, prevGroup.stories.length - 1));
    }
    setProgress(0);
  }, [groupIdx, storyIdx, groups]);

  const goNext = useCallback(() => {
    if (group && storyIdx < group.stories.length - 1) {
      setStoryIdx((s) => s + 1);
      setProgress(0);
      return;
    }
    if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
      setProgress(0);
      return;
    }
    onClose();
  }, [group, storyIdx, groupIdx, groups, onClose]);

  const openDeleteConfirm = useCallback(() => {
    if (!story || deleting) return;
    setPaused(true);
    setConfirmingDelete(true);
  }, [story, deleting]);

  const cancelDelete = useCallback(() => {
    setConfirmingDelete(false);
    setPaused(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!story || deleting) return;
    setDeleting(true);
    try {
      await stories.delete(story.id);
      const deletedId = story.id;
      setDeletedIds((prev) => new Set(prev).add(deletedId));
      toast.success("Story deleted");
      setConfirmingDelete(false);

      // Advance: if there was a next story in this group, stay put (the
      // deleted one is filtered out so `storyIdx` now points at what was
      // "next"). If this was the last one in the group, jump to next
      // group or close.
      const remaining =
        (group?.stories.length ?? 0) - (deletedIds.has(deletedId) ? 0 : 1);
      if (remaining <= 0) {
        if (groupIdx < groups.length - 1) {
          setGroupIdx((g) => g + 1);
          setStoryIdx(0);
          setProgress(0);
        } else {
          onClose();
        }
      } else {
        // Clamp storyIdx into the new (shorter) group.
        setStoryIdx((s) => Math.min(s, remaining - 1));
        setProgress(0);
      }
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "not_owner"
            ? "You can only delete your own stories."
            : e.detail ?? e.message
          : "Couldn't delete story";
      toast.error(msg);
    } finally {
      setDeleting(false);
      setPaused(false);
    }
  }, [story, deleting, group, groupIdx, groups.length, onClose, deletedIds]);

  // Keyboard nav + body scroll lock.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmingDelete) cancelDelete();
        else onClose();
      } else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev, confirmingDelete, cancelDelete]);

  // View-bump on first visit to each story (fire-and-forget, ignore errors).
  useEffect(() => {
    if (!story) return;
    if (story.viewed) return;
    if (story.locked) return;
    stories.get(story.id).catch(() => {});
  }, [story]);

  // Progress driver — RAF loop for images; video element drives its own for videos.
  // When the story changes we reset progress/duration *inside* the effect body,
  // avoiding a separate render-phase setState.
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastStoryId = useRef<string | null>(null);
  const isVideo = story?.media?.kind === "video";

  useEffect(() => {
    if (!story) return;

    // Reset per-story state on transitions.
    if (lastStoryId.current !== story.id) {
      lastStoryId.current = story.id;
      startRef.current = null;
      setDurationMs(IMAGE_DURATION_MS);
      setProgress(0);
    }

    if (story.locked || isVideo || paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startRef.current = null;
      return;
    }

    if (startRef.current === null) {
      startRef.current = performance.now();
    }

    const tick = (now: number) => {
      const p = Math.min(1, (now - (startRef.current ?? now)) / durationMs);
      setProgress(p);
      if (p >= 1) {
        goNext();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [story, isVideo, paused, durationMs, goNext]);

  if (!group || !story) return null;

  const creator = group.creator;
  const name = creator.displayName || creator.username;

  const ui = (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none"
      role="dialog"
      aria-modal
      aria-label={`Stories from ${name}`}
    >
      {/* Media area */}
      <div className="relative w-full h-[100dvh] sm:w-[420px] sm:h-[calc(100dvh-3rem)] sm:my-6 sm:rounded-2xl overflow-hidden bg-neutral-900">
        {story.locked ? (
          <LockedView creator={creator} onClose={onClose} />
        ) : story.media?.kind === "video" && story.media.playbackUrl ? (
          <VideoStory
            src={story.media.playbackUrl}
            poster={story.media.posterUrl ?? undefined}
            muted={muted}
            paused={paused}
            onDuration={(d) => setDurationMs(d * 1000)}
            onProgress={setProgress}
            onEnded={goNext}
          />
        ) : story.media?.playbackUrl || story.media?.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.media.playbackUrl ?? story.media.posterUrl ?? ""}
            alt=""
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        ) : null}

        {/* Progress bars */}
        <div
          className="absolute top-0 inset-x-0 flex gap-1 px-3 z-20"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          {group.stories.map((_, i) => {
            const scale = i < storyIdx ? 1 : i > storyIdx ? 0 : progress;
            return (
              <div
                key={i}
                className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden"
              >
                <div
                  className="h-full w-full bg-white origin-left"
                  style={{
                    transform: `scaleX(${scale})`,
                    willChange: "transform",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div
          className="absolute top-0 inset-x-0 flex items-center gap-3 px-4 z-20"
          style={{
            paddingTop: "calc(max(0.75rem, env(safe-area-inset-top)) + 1rem)",
          }}
        >
          <Avatar
            name={name}
            gradient={BRAND_GRADIENT}
            image={creator.avatarUrl ?? undefined}
            size={36}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[14px] font-semibold text-white truncate drop-shadow">
                {name}
              </span>
              <VerifiedBadge active={creator.verified} />
              <span className="text-[11px] text-white/70 shrink-0 drop-shadow">
                · {timeAgo(story.createdAt)}
              </span>
            </div>
          </div>
          {isVideo && !story.locked ? (
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute" : "Mute"}
              className="on-media inline-flex items-center justify-center size-9 rounded-full bg-black/45 text-white hover:bg-black/65 backdrop-blur"
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          ) : null}
          {isOwner ? (
            <button
              type="button"
              onClick={openDeleteConfirm}
              disabled={deleting}
              aria-label="Delete story"
              title="Delete"
              className="on-media inline-flex items-center justify-center size-9 rounded-full bg-black/45 text-white hover:bg-red-500/60 backdrop-blur disabled:opacity-50"
            >
              {deleting ? (
                <span
                  aria-hidden
                  className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="on-media inline-flex items-center justify-center size-9 rounded-full bg-black/45 text-white hover:bg-black/65 backdrop-blur"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Caption */}
        {story.caption && !story.locked ? (
          <div
            className="absolute inset-x-4 z-20"
            style={{
              bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
            }}
          >
            <p className="text-white text-[14px] leading-relaxed drop-shadow-lg bg-black/35 backdrop-blur px-3 py-2 rounded-[10px]">
              {story.caption}
            </p>
          </div>
        ) : null}

        {/* Tap zones (behind the header) */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous"
          className="absolute inset-y-0 left-0 w-1/3 z-10 focus:outline-none"
        />
        <button
          type="button"
          onClick={goNext}
          aria-label="Next"
          className="absolute inset-y-0 right-0 w-1/3 z-10 focus:outline-none"
        />
        {/* Middle zone: pause hold */}
        <button
          type="button"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          onPointerCancel={() => setPaused(false)}
          aria-label={paused ? "Resume" : "Hold to pause"}
          className="absolute inset-y-0 left-1/3 right-1/3 z-10 focus:outline-none"
        />

        {/* Delete-confirm sheet — bottom sheet inside the player. */}
        {confirmingDelete ? (
          <div className="absolute inset-0 z-30 flex items-end justify-center">
            <button
              type="button"
              aria-label="Cancel delete"
              onClick={cancelDelete}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <div
              role="dialog"
              aria-modal
              aria-label="Delete story"
              className="relative w-full surface-card rounded-t-[20px] sm:rounded-[20px] sm:mb-6 sm:mx-4 p-5 flex flex-col gap-4 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.7)]"
              style={{
                paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center size-10 rounded-full bg-red-500/15 text-red-300 shrink-0">
                  <Trash2 className="size-4" />
                </span>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-[15px]">
                    Delete this story?
                  </h3>
                  <p className="text-white/60 text-[13px] mt-0.5">
                    It&apos;ll disappear for everyone right away. This can&apos;t be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="inline-flex items-center h-10 px-4 rounded-full text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-bold text-white bg-red-500 hover:bg-red-500/90 disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span
                        aria-hidden
                        className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
                      />
                      Deleting…
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  // Render into document.body so ancestor stacking contexts (PageTransition
  // animation, DashboardShell backdrop-blur bars) can't trap our z-index.
  if (typeof document === "undefined") return null;
  return createPortal(ui, document.body);
}

function VideoStory({
  src,
  poster,
  muted,
  paused,
  onDuration,
  onProgress,
  onEnded,
}: {
  src: string;
  poster?: string;
  muted: boolean;
  paused: boolean;
  onDuration: (seconds: number) => void;
  onProgress: (fraction: number) => void;
  onEnded: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (paused) el.pause();
    else el.play().catch(() => {});
  }, [paused]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className="absolute inset-0 w-full h-full object-contain bg-black"
      autoPlay
      playsInline
      muted={muted}
      onLoadedMetadata={(e) => {
        const d = e.currentTarget.duration;
        if (Number.isFinite(d) && d > 0) onDuration(d);
      }}
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        if (el.duration > 0) onProgress(el.currentTime / el.duration);
      }}
      onEnded={onEnded}
    />
  );
}

function LockedView({
  creator,
  onClose,
}: {
  creator: StoryFeedGroupOut["creator"];
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ backgroundImage: BRAND_GRADIENT }}
    >
      <span className="inline-flex items-center justify-center size-14 rounded-full bg-white/[0.14] backdrop-blur text-white">
        <Lock className="size-6" />
      </span>
      <div className="on-media flex flex-col gap-1">
        <h3 className="text-white text-lg font-semibold">Subscribers only</h3>
        <p className="text-white/80 text-sm max-w-[280px]">
          Subscribe to see @{creator.username}&apos;s stories.
        </p>
      </div>
      <a
        href={`/creator/${creator.username}#subscribe`}
        onClick={onClose}
        className={cn(
          "inline-flex items-center h-10 px-5 rounded-full text-[13px] font-bold uppercase tracking-wider",
          "bg-white text-[#FD23A7] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)]"
        )}
      >
        Subscribe
      </a>
    </div>
  );
}
