"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { EmojiPicker } from "frimousse";
import {
  BarChart3,
  Calendar,
  Check,
  Film,
  Hash,
  ImagePlus,
  Music2,
  Plus,
  Smile,
  Upload,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { uploadFile } from "@/services/modules/uploads";
import { posts as postsApi } from "@/services/modules/posts";
import { ApiError } from "@/services/apiClient";
import type { PostPollIn, PostVisibility, UploadKind } from "@/services/dtos";
import { cn, formatNaira } from "@/lib/utils";

const MAX_MEDIA = 20;
const MAX_CAPTION = 2000;
const MAX_TAGS = 10;
const TAG_REGEX = /^[a-z0-9_]{1,30}$/;
const MAX_POLL_OPTIONS = 5;
const MIN_POLL_OPTIONS = 2;
const PPV_MIN_NAIRA = 1_000;
const PPV_MAX_NAIRA = 500_000;

type ChipKey = "tags" | "poll";

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#/, "").toLowerCase();
}

type MediaItem = {
  localId: string;
  file: File;
  kind: UploadKind;
  previewUrl: string;
  progress: "queued" | "uploading" | "done" | "error";
  mediaId?: string;
  publicUrl?: string;
  error?: string;
};

function pickKind(file: File): UploadKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "image";
}

function makeLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function NewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("free");
  const [priceNaira, setPriceNaira] = useState<string>("3500");
  const [allowComments, setAllowComments] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [scheduled, setScheduled] = useState<string>(""); // datetime-local
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState<string>("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [pollQuestion, setPollQuestion] = useState<string>("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollExpires, setPollExpires] = useState<string>("");
  const [activeChip, setActiveChip] = useState<ChipKey | null>(null);
  const [publishing, setPublishing] = useState<null | "publish" | "draft" | "schedule">(
    null
  );

  const readyMedia = media.filter((m) => m.progress === "done" && m.mediaId);
  const uploading = media.some((m) => m.progress === "uploading" || m.progress === "queued");

  const trimmedOptions = pollOptions.map((o) => o.trim());
  const validPollOptions = trimmedOptions.filter((o) => o.length > 0);
  const pollHasContent =
    pollQuestion.trim().length > 0 || validPollOptions.length > 0;
  const pollComplete =
    pollQuestion.trim().length > 0 &&
    pollQuestion.trim().length <= 200 &&
    validPollOptions.length >= MIN_POLL_OPTIONS &&
    validPollOptions.length <= MAX_POLL_OPTIONS &&
    validPollOptions.every((o) => o.length <= 80) &&
    (!pollExpires || new Date(pollExpires).getTime() > Date.now());
  const pollValid = !pollHasContent || pollComplete;

  const priceNum = Number(priceNaira);
  const priceValid =
    visibility !== "ppv" ||
    (Number.isFinite(priceNum) &&
      priceNum >= PPV_MIN_NAIRA &&
      priceNum <= PPV_MAX_NAIRA);

  const canSubmit =
    !publishing &&
    !uploading &&
    (caption.trim().length > 0 || readyMedia.length > 0 || pollHasContent) &&
    priceValid &&
    pollValid;

  const toggleChip = (c: ChipKey) =>
    setActiveChip((prev) => (prev === c ? null : c));

  const addTag = (raw: string) => {
    const t = normalizeTag(raw);
    if (!t) return;
    if (!TAG_REGEX.test(t)) {
      setTagError("Tags: lowercase letters, digits, or _. Max 30 chars.");
      return;
    }
    if (tags.includes(t)) {
      setTagError("You've already added that tag.");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      setTagError(`Max ${MAX_TAGS} tags.`);
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagError(null);
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
    setTagError(null);
  };

  const setPollOption = (i: number, val: string) => {
    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? val.slice(0, 80) : o)));
  };

  const addPollOption = () => {
    setPollOptions((prev) =>
      prev.length < MAX_POLL_OPTIONS ? [...prev, ""] : prev
    );
  };

  const removePollOption = (i: number) => {
    setPollOptions((prev) =>
      prev.length <= MIN_POLL_OPTIONS ? prev : prev.filter((_, idx) => idx !== i)
    );
  };

  const handleFilesPicked = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list || list.length === 0) return;
      const room = MAX_MEDIA - media.length;
      const files = Array.from(list).slice(0, room);
      if (list.length > room) {
        toast.error(`You can upload up to ${MAX_MEDIA} files per post.`);
      }
      e.target.value = "";

      const items: MediaItem[] = files.map((file) => ({
        localId: makeLocalId(),
        file,
        kind: pickKind(file),
        previewUrl: URL.createObjectURL(file),
        progress: "queued",
      }));
      setMedia((prev) => [...prev, ...items]);

      await Promise.all(items.map((it) => uploadOne(it)));
    },
    [media.length]
  );

  const uploadOne = async (item: MediaItem) => {
    setMedia((prev) =>
      prev.map((m) => (m.localId === item.localId ? { ...m, progress: "uploading" } : m))
    );
    try {
      const { mediaId, publicUrl } = await uploadFile(item.file, item.kind);
      setMedia((prev) =>
        prev.map((m) =>
          m.localId === item.localId
            ? { ...m, progress: "done", mediaId, publicUrl }
            : m
        )
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail ?? e.message : (e as Error).message;
      setMedia((prev) =>
        prev.map((m) =>
          m.localId === item.localId
            ? { ...m, progress: "error", error: msg }
            : m
        )
      );
      toast.error(`Upload failed: ${msg}`);
    }
  };

  const removeMedia = (localId: string) => {
    setMedia((prev) => {
      const target = prev.find((m) => m.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.localId !== localId);
    });
  };

  const submit = async (mode: "publish" | "draft" | "schedule") => {
    if (!canSubmit) return;
    if (mode === "schedule" && !scheduled) {
      toast.error("Pick a date and time to schedule.");
      return;
    }
    setPublishing(mode);
    try {
      const mediaIds = media
        .filter((m) => m.progress === "done" && m.mediaId)
        .map((m) => m.mediaId as string);

      const dto: Parameters<typeof postsApi.create>[0] = {
        caption: caption.trim() || undefined,
        visibility,
        mediaIds: mediaIds.length ? mediaIds : undefined,
        allowComments,
        sendNotification,
      };
      if (visibility === "ppv") {
        const kobo = Math.max(
          PPV_MIN_NAIRA * 100,
          Math.min(PPV_MAX_NAIRA * 100, Math.round(Number(priceNaira) * 100))
        );
        dto.ppvPriceKobo = kobo;
      }
      if (mode === "publish") dto.publish = true;
      if (mode === "schedule") {
        dto.scheduledFor = new Date(scheduled).toISOString();
      }
      if (tags.length > 0) dto.tags = tags;
      if (pollHasContent && pollComplete) {
        const poll: PostPollIn = {
          question: pollQuestion.trim(),
          options: validPollOptions,
        };
        if (pollExpires) poll.expiresAt = new Date(pollExpires).toISOString();
        dto.poll = poll;
      }

      const post = await postsApi.create(dto);
      const msg =
        mode === "publish"
          ? "Post published"
          : mode === "schedule"
          ? "Post scheduled"
          : "Draft saved";
      toast.success(msg);
      media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      router.replace(mode === "publish" ? `/creator/${post.creator.username}` : "/dashboard/posts");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "onboarding_incomplete"
            ? "Finish creator setup first."
            : e.code === "age_required"
            ? "Confirm you're 18+ first."
            : e.code === "invalid_media"
            ? "One or more uploads failed. Try re-uploading."
            : e.detail ?? e.message
          : "Couldn't create post";
      toast.error(msg);
    } finally {
      setPublishing(null);
    }
  };

  return (
    <DashboardShell
      title="Create a post"
      subtitle="Share something new with your fans."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Caption */}
          <div className="surface-card p-5">
            <div className="relative">
              <Textarea
                placeholder="What's on your mind?"
                className="!bg-transparent !border-transparent focus:!border-transparent focus:!bg-transparent p-0 text-[17px] min-h-[100px] pr-9 !resize-none"
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
              />
              <EmojiPickerButton
                onPick={(e) =>
                  setCaption((prev) => (prev + e).slice(0, MAX_CAPTION))
                }
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
              <span>{caption.length}/{MAX_CAPTION}</span>
            </div>
          </div>

          {/* Media */}
          <div className="surface-card p-5 flex flex-col gap-4">
            {media.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[16px] border-2 border-dashed border-white/10 hover:border-white/25 transition-colors p-10 flex flex-col items-center gap-3 text-center"
              >
                <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand-soft border border-white/10 text-white/80">
                  <Upload className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-medium text-white">
                    Click to add photos, videos, or audio
                  </span>
                  <span className="text-xs text-white/50">
                    Up to {MAX_MEDIA} files. Images, video, or audio.
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <PillHint icon={<ImagePlus className="size-4" />}>Image</PillHint>
                  <PillHint icon={<Film className="size-4" />}>Video</PillHint>
                  <PillHint icon={<Music2 className="size-4" />}>Audio</PillHint>
                </div>
              </button>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {media.map((m) => (
                    <MediaTile key={m.localId} item={m} onRemove={() => removeMedia(m.localId)} />
                  ))}
                  {media.length < MAX_MEDIA ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-[14px] border-2 border-dashed border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 text-white/60 hover:text-white transition-colors"
                    >
                      <ImagePlus className="size-5" />
                      <span className="text-[11px]">Add</span>
                    </button>
                  ) : null}
                </div>
                <span className="text-[11px] text-white/45">
                  {readyMedia.length}/{media.length} uploaded
                </span>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleFilesPicked}
            />
          </div>

          {/* ── Chips: Tags / Poll ───────────────────────── */}
          <div className="surface-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ChipButton
                icon={<Hash className="size-3.5" />}
                label="Tag"
                badge={tags.length > 0 ? String(tags.length) : null}
                active={activeChip === "tags"}
                onClick={() => toggleChip("tags")}
              />
              <ChipButton
                icon={<BarChart3 className="size-3.5" />}
                label="Poll"
                badge={pollHasContent ? "●" : null}
                active={activeChip === "poll"}
                onClick={() => toggleChip("poll")}
              />
            </div>

            {activeChip === "tags" ? (
              <div className="pt-2 flex flex-col gap-3">
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full text-[12px] font-medium text-[#FD5CC9] bg-white/[0.04] hairline"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          aria-label={`Remove ${t}`}
                          className="inline-flex items-center justify-center size-4 rounded-full text-white/60 hover:text-white hover:bg-white/[0.1]"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45">#</span>
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(e) => {
                      setTagDraft(e.target.value);
                      if (tagError) setTagError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " " || e.key === ",") {
                        e.preventDefault();
                        const parts = tagDraft
                          .split(/[\s,]+/)
                          .map(normalizeTag)
                          .filter(Boolean);
                        for (const p of parts) addTag(p);
                        setTagDraft("");
                      } else if (e.key === "Backspace" && !tagDraft && tags.length > 0) {
                        removeTag(tags[tags.length - 1]);
                      }
                    }}
                    onBlur={() => {
                      if (tagDraft.trim()) {
                        addTag(tagDraft);
                        setTagDraft("");
                      }
                    }}
                    placeholder="Enter tag and click space or enter or comma"
                    disabled={tags.length >= MAX_TAGS}
                    className="w-full h-11 rounded-[10px] bg-white/[0.04] hairline text-[13px] text-white pl-7 pr-3 outline-none focus:border-white/25 focus:bg-white/[0.06] disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center justify-between">
                  {tagError ? (
                    <span className="text-[11px] text-red-300">{tagError}</span>
                  ) : (
                    <span className="text-[11px] text-white/45">
                      Lowercase letters, digits, or _.
                    </span>
                  )}
                  <span className="text-[11px] text-white/40">
                    {tags.length}/{MAX_TAGS}
                  </span>
                </div>
              </div>
            ) : null}

            {activeChip === "poll" ? (
              <div className="pt-2 flex flex-col gap-3">
                <Input
                  label={`Question (${pollQuestion.length}/200)`}
                  placeholder="Ask your fans something…"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value.slice(0, 200))}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-white/70">Options</label>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-white/50 w-5 text-right">{i + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => setPollOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        maxLength={80}
                        className="flex-1 h-10 rounded-[10px] bg-white/[0.04] hairline text-[13px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06]"
                      />
                      {pollOptions.length > MIN_POLL_OPTIONS ? (
                        <button
                          type="button"
                          onClick={() => removePollOption(i)}
                          aria-label="Remove option"
                          className="inline-flex items-center justify-center size-8 rounded-full text-white/50 hover:text-white hover:bg-white/[0.06]"
                        >
                          <X className="size-4" />
                        </button>
                      ) : (
                        <span className="w-8" />
                      )}
                    </div>
                  ))}
                  {pollOptions.length < MAX_POLL_OPTIONS ? (
                    <button
                      type="button"
                      onClick={addPollOption}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs text-white/75 hover:text-white hover:bg-white/[0.06] self-start"
                    >
                      <Plus className="size-3.5" /> Add option
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/70">
                    Expires (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={pollExpires}
                    onChange={(e) => setPollExpires(e.target.value)}
                    min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                    className="h-10 rounded-[10px] bg-white/[0.04] hairline text-[13px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06]"
                  />
                </div>

                {pollHasContent && !pollValid ? (
                  <span className="text-[11px] text-red-300">
                    Need a question, {MIN_POLL_OPTIONS}–{MAX_POLL_OPTIONS} filled
                    options, and a future expiry (if set).
                  </span>
                ) : null}
              </div>
            ) : null}

          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Post visibility (back on the sidebar) */}
          <div className="surface-card p-5">
            <div className="text-xs uppercase tracking-wider text-white/45 mb-3">
              Post visibility
            </div>
            <div className="flex flex-col gap-2">
              <VisibilityOption
                active={visibility === "free"}
                onClick={() => setVisibility("free")}
                title="Free"
                body="Everyone can see this post."
              />
              <VisibilityOption
                active={visibility === "subscribers"}
                onClick={() => setVisibility("subscribers")}
                title="Subscribers only"
                body="Only active subscribers can access this post."
              />
              <VisibilityOption
                active={visibility === "ppv"}
                onClick={() => setVisibility("ppv")}
                title="Pay-per-view"
                body="Fans pay individually to unlock the post."
              />
            </div>

            {visibility === "ppv" ? (
              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55">₦</span>
                  <input
                    type="number"
                    min={PPV_MIN_NAIRA}
                    max={PPV_MAX_NAIRA}
                    step={100}
                    value={priceNaira}
                    onChange={(e) => setPriceNaira(e.target.value)}
                    className={cn(
                      "w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-8 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06]",
                      !priceValid && priceNaira && "border-red-400/40"
                    )}
                  />
                </div>
                <span className="text-[11px] text-white/45">
                  Min (₦) {PPV_MIN_NAIRA.toLocaleString()} – {PPV_MAX_NAIRA.toLocaleString()}
                </span>
                {!priceValid && priceNaira ? (
                  <span className="text-[11px] text-red-300">
                    Price must be between {formatNaira(PPV_MIN_NAIRA)} and{" "}
                    {formatNaira(PPV_MAX_NAIRA)}.
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="surface-card p-5 flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider text-white/45">Schedule</div>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/50 pointer-events-none" />
              <input
                type="datetime-local"
                value={scheduled}
                onChange={(e) => setScheduled(e.target.value)}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-10 pr-3 outline-none focus:border-white/25 focus:bg-white/[0.06]"
              />
            </div>
            <span className="text-[11px] text-white/45">
              Optional. Leave blank to publish now or save as draft.
            </span>
          </div>

          <div className="surface-card p-5 flex flex-col gap-1">
            <Toggle
              label="Allow comments"
              on={allowComments}
              onChange={setAllowComments}
            />
            <Toggle
              label="Notify subscribers"
              on={sendNotification}
              onChange={setSendNotification}
            />
          </div>

          <div className="flex flex-col gap-2">
            {scheduled ? (
              <Button
                size="lg"
                className="w-full"
                onClick={() => submit("schedule")}
                disabled={!canSubmit}
              >
                {publishing === "schedule" ? "Scheduling…" : "Schedule post"}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => submit("publish")}
                disabled={!canSubmit}
              >
                {publishing === "publish" ? "Publishing…" : "Publish now"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => submit("draft")}
              disabled={!canSubmit}
            >
              {publishing === "draft" ? "Saving…" : "Save as draft"}
            </Button>
            {uploading ? (
              <span className="text-[11px] text-white/50 text-center">
                Uploads in progress…
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── UI bits ─────────────────────────────────────────── */

function EmojiPickerButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="absolute top-1 right-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Insert emoji"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center justify-center size-8 rounded-full text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <Smile className="size-4" />
      </button>
      {open ? (
        <div
          role="dialog"
          className="animate-fade-in absolute top-full right-0 mt-2 z-30 surface-elev rounded-[14px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] w-[320px] overflow-hidden"
        >
          <EmojiPicker.Root
            className="flex flex-col h-[360px] bg-transparent text-white"
            onEmojiSelect={({ emoji }) => {
              onPick(emoji);
              setOpen(false);
            }}
          >
            <EmojiPicker.Search
              placeholder="Search emoji…"
              className="mx-3 mt-3 h-9 rounded-[10px] bg-white/[0.04] hairline px-3 text-[13px] text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/[0.06]"
            />
            <EmojiPicker.Viewport className="flex-1 relative">
              <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
                Loading…
              </EmojiPicker.Loading>
              <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
                No emoji found.
              </EmojiPicker.Empty>
              <EmojiPicker.List
                className="select-none pb-2"
                components={{
                  CategoryHeader: ({ category, ...props }) => (
                    <div
                      {...props}
                      className="sticky top-0 z-10 bg-[#141026]/90 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/45"
                    >
                      {category.label}
                    </div>
                  ),
                  Row: ({ children, ...props }) => (
                    <div {...props} className="flex px-2">
                      {children}
                    </div>
                  ),
                  Emoji: ({ emoji, ...props }) => (
                    <button
                      {...props}
                      type="button"
                      className="size-8 inline-flex items-center justify-center rounded-md text-[18px] data-[active]:bg-white/[0.08] hover:bg-white/[0.08] transition-colors"
                    >
                      {emoji.emoji}
                    </button>
                  ),
                }}
              />
            </EmojiPicker.Viewport>
          </EmojiPicker.Root>
        </div>
      ) : null}
    </div>
  );
}

function ChipButton({
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors hairline",
        active
          ? "bg-gradient-brand text-white on-media border-transparent"
          : "bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span
          className={cn(
            "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-semibold",
            active ? "bg-white/25 text-white" : "bg-white/[0.1] text-white/85"
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function MediaTile({
  item,
  onRemove,
}: {
  item: MediaItem;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-square rounded-[14px] overflow-hidden hairline bg-black">
      {item.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.previewUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : item.kind === "video" ? (
        <video src={item.previewUrl} className="w-full h-full object-cover" muted />
      ) : (
        <div className="w-full h-full bg-gradient-brand-soft flex items-center justify-center">
          <Music2 className="size-6 text-white" />
        </div>
      )}

      {item.progress !== "done" ? (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          {item.progress === "error" ? (
            <span className="text-[10px] text-red-300 text-center px-2">Failed</span>
          ) : (
            <span
              aria-hidden
              className="size-5 rounded-full border-2 border-white/25 border-t-white/85 animate-spin"
            />
          )}
        </div>
      ) : (
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center justify-center size-5 rounded-full bg-black/60 text-green-300">
          <Check className="size-3" />
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="absolute top-1.5 right-1.5 inline-flex items-center justify-center size-6 rounded-full bg-black/70 text-white hover:bg-black"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function PillHint({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs rounded-full bg-white/[0.05] hairline text-white/80 h-8 px-3">
      {icon}
      {children}
    </span>
  );
}

function VisibilityOption({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-[12px] p-3 flex items-start gap-3 transition-all border",
        active
          ? "bg-gradient-brand-soft border-white/15"
          : "border-transparent bg-white/[0.03] hover:bg-white/[0.05]"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex items-center justify-center size-4 rounded-full border",
          active ? "border-white bg-white" : "border-white/30"
        )}
      >
        {active ? <span className="size-1.5 rounded-full bg-black" /> : null}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{title}</span>
        <span className="text-xs text-white/55">{body}</span>
      </div>
    </button>
  );
}

