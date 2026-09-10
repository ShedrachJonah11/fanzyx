"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Upload, X } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { uploadFile } from "@/services/modules/uploads";
import { stories } from "@/services/modules/stories";
import { ApiError } from "@/services/apiClient";
import type { StoryOut, UploadKind } from "@/services/dtos";
import { cn } from "@/lib/utils";

const MAX_CAPTION = 280;
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 80;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (story: StoryOut) => void;
};

export function StoryCreator({ open, onClose, onCreated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [subsOnly, setSubsOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const kind: Extract<UploadKind, "image" | "video"> | null = useMemo(() => {
    if (!file) return null;
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return null;
  }, [file]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, busy]);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!open) return null;

  const pickFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Only image or video files are supported.");
      return;
    }
    const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (f.size > maxMb * 1024 * 1024) {
      toast.error(`File too large — max ${maxMb}MB.`);
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!file || !kind || busy) return;
    setBusy(true);
    try {
      const { mediaId } = await uploadFile(file, kind);
      const trimmed = caption.trim();
      const story = await stories.create({
        mediaId,
        caption: trimmed || undefined,
        visibility: subsOnly ? "subscribers" : "free",
      });
      toast.success("Story posted");
      onCreated?.(story);
      onClose();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "invalid_media"
            ? "That media couldn't be attached — try another file."
            : e.code === "creator_required"
            ? "Only creators can post stories."
            : e.detail ?? e.message
          : e instanceof Error
          ? e.message
          : "Couldn't post story";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Create a story"
        className="relative w-full max-w-md rounded-[20px] overflow-hidden surface-card flex flex-col max-h-[92dvh]"
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-lg font-semibold text-white">New story</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 flex flex-col gap-4">
          {/* Media picker / preview */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={onFileChange}
          />

          {previewUrl && kind ? (
            <div className="relative rounded-[16px] overflow-hidden bg-black aspect-[9/16] max-h-[50vh]">
              {kind === "video" ? (
                <video
                  src={previewUrl}
                  className="absolute inset-0 w-full h-full object-contain"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={busy}
                aria-label="Remove media"
                className="on-media absolute top-3 right-3 inline-flex items-center justify-center size-9 rounded-full bg-black/55 backdrop-blur text-white hover:bg-black/75 disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={pickFile}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-[16px] hairline bg-white/[0.03] hover:bg-white/[0.06] transition-colors aspect-[9/16] max-h-[50vh] text-white/70"
              )}
            >
              <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand text-white">
                <ImagePlus className="size-5" />
              </span>
              <span className="text-sm font-medium text-white">Pick a photo or video</span>
              <span className="text-[11px] text-white/50">
                Max {MAX_IMAGE_MB}MB images · {MAX_VIDEO_MB}MB videos
              </span>
            </button>
          )}

          {/* Caption */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/70">
              Caption ({caption.length}/{MAX_CAPTION})
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
              placeholder="Say something…"
              rows={2}
              disabled={busy}
              className="resize-none rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 px-3.5 py-2.5 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors disabled:opacity-60"
            />
          </div>

          {/* Visibility */}
          <div className="rounded-[12px] hairline bg-white/[0.02] px-3.5 py-1">
            <Toggle
              label="Subscribers only"
              description="Only your active subscribers will see this story."
              on={subsOnly}
              onChange={setSubsOnly}
              disabled={busy}
              size="sm"
            />
          </div>
        </div>

        <div className="border-t border-white/[0.05] px-5 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center h-10 px-4 rounded-full text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !file}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-[13px] font-bold text-white on-media bg-gradient-brand shadow-[0_10px_30px_-12px_rgba(253,35,167,0.55)] hover:opacity-95 disabled:opacity-50"
          >
            {busy ? (
              <>
                <span
                  aria-hidden
                  className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
                />
                Posting…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Post story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
