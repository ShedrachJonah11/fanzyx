"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import { EmojiPicker } from "frimousse";
import {
  DollarSign,
  ImagePlus,
  Lock,
  Mic,
  Plus,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMessagingStore } from "@/services/stores/messaging";
import { wsClient } from "@/services/ws/client";
import { uploadFile } from "@/services/modules/uploads";
import { ApiError } from "@/services/apiClient";
import { useAuth } from "@/services/context";
import { TipModal } from "@/components/tip/TipModal";
import {
  computeWaveform,
  formatDuration,
  getSharedAudioContext,
} from "@/lib/audio";
import type {
  MessageAttachment,
  MessageAttachmentKind,
  UploadKind,
} from "@/services/dtos";
import { cn } from "@/lib/utils";

const TYPING_THROTTLE_MS = 2_000;
const MAX_LEN = 4_000;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const VIDEO_MIMES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
]);

const IMAGE_MAX = 8 * 1024 * 1024;
const VIDEO_MAX = 512 * 1024 * 1024;
const AUDIO_MAX = 32 * 1024 * 1024;

const ATTACH_ACCEPT = [
  ...IMAGE_MIMES,
  ...VIDEO_MIMES,
  ...AUDIO_MIMES,
].join(",");

type QueuedUpload = {
  id: string;
  file: File;
  kind: MessageAttachmentKind;
  uploadKind: UploadKind;
  previewUrl: string;
  status: "uploading" | "ready" | "error";
  progress: number; // 0..1
  mediaId?: string;
  publicUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  waveform?: number[];
  error?: string;
};

function classifyFile(
  file: File
): { kind: MessageAttachmentKind; uploadKind: UploadKind } | null {
  const t = file.type;
  if (IMAGE_MIMES.has(t)) return { kind: "image", uploadKind: "image" };
  if (VIDEO_MIMES.has(t)) return { kind: "video", uploadKind: "video" };
  if (AUDIO_MIMES.has(t)) return { kind: "audio", uploadKind: "audio" };
  return null;
}

function validateSize(kind: MessageAttachmentKind, size: number): string | null {
  if (kind === "image" && size > IMAGE_MAX) return "Image is too large (max 8MB)";
  if (kind === "video" && size > VIDEO_MAX) return "Video is too large (max 512MB)";
  if (kind === "audio" && size > AUDIO_MAX) return "Audio is too large (max 32MB)";
  return null;
}

async function probeImage(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

async function probeVideo(
  url: string
): Promise<{ width: number; height: number; durationMs: number }> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;
    v.onloadedmetadata = () => {
      resolve({
        width: v.videoWidth,
        height: v.videoHeight,
        durationMs: Math.round((v.duration || 0) * 1000),
      });
    };
    v.onerror = () => resolve({ width: 0, height: 0, durationMs: 0 });
  });
}

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

export function Composer({ convId }: { convId: string }) {
  const sendMessage = useMessagingStore((s) => s.sendMessage);
  const conv = useMessagingStore((s) => s.conversations[convId]);
  const { user } = useAuth();
  const isCreator = user?.role === "creator";
  const canTip = !isCreator;

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [ppvOpen, setPpvOpen] = useState(false);
  const [priceKobo, setPriceKobo] = useState<number | null>(null);
  const [previewBody, setPreviewBody] = useState("");
  const [recording, setRecording] = useState<null | {
    startedAt: number;
    stream: MediaStream;
    recorder: MediaRecorder;
    chunks: Blob[];
    mimeType: string;
  }>(null);
  const [recordElapsedMs, setRecordElapsedMs] = useState(0);
  const [recordLevels, setRecordLevels] = useState<number[]>([]);

  const lastTypingSent = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const plusWrapRef = useRef<HTMLDivElement | null>(null);
  const emojiWrapRef = useRef<HTMLDivElement | null>(null);
  const recAnalyserRef = useRef<AnalyserNode | null>(null);
  const recRafRef = useRef<number | null>(null);
  const recTimerRef = useRef<number | null>(null);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
    lastTypingSent.current = now;
    wsClient.send({ type: "typing", conversation_id: convId });
  }, [convId]);

  const anyUploading = useMemo(
    () => queue.some((q) => q.status === "uploading"),
    [queue]
  );
  const readyAttachments = useMemo(
    () => queue.filter((q) => q.status === "ready" && q.mediaId),
    [queue]
  );

  const toAttachment = (q: QueuedUpload): MessageAttachment => ({
    kind: q.kind,
    mediaId: q.mediaId!,
    url: q.publicUrl || q.previewUrl,
    mimeType: q.file.type || null,
    sizeBytes: q.file.size,
    width: q.width ?? null,
    height: q.height ?? null,
    durationMs: q.durationMs ?? null,
    posterUrl: null,
    waveform: q.waveform ?? null,
  });

  const submit = useCallback(
    async (overrideAttachments?: MessageAttachment[]) => {
      const value = body.trim();
      const atts =
        overrideAttachments ?? readyAttachments.map((q) => toAttachment(q));
      if (!value && atts.length === 0) return;
      if (sending || (!overrideAttachments && anyUploading)) return;
      setSending(true);
      setBody("");
      if (!overrideAttachments) {
        setQueue((prev) => prev.filter((q) => q.status === "uploading"));
      }
      const price = overrideAttachments ? null : priceKobo;
      const preview =
        !overrideAttachments && price && previewBody.trim()
          ? previewBody.trim()
          : undefined;
      try {
        await sendMessage(convId, value, {
          attachments: atts.length > 0 ? atts : undefined,
          priceKobo: price ?? undefined,
          previewBody: preview,
        });
        if (!overrideAttachments) {
          setPriceKobo(null);
          setPreviewBody("");
        }
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.code === "blocked") toast.error("You can't message this user.");
          else if (e.code === "self_message")
            toast.error("You can't message yourself.");
          else if (e.code === "creator_required")
            toast.error("Only creators can charge for messages.");
          else if (e.code === "attachment_not_ready")
            toast.error("Attachment isn't ready yet — try again.");
          else if (e.code === "attachment_not_owned")
            toast.error("You don't own this attachment.");
          else if (e.code === "attachment_not_found")
            toast.error("Attachment was removed.");
          else if (e.code === "dup_attachment")
            toast.error("Duplicate attachment.");
          else if (e.code === "empty_message")
            toast.error("Message can't be empty.");
          else toast.error(e.detail ?? e.message);
        }
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
    },
    [
      body,
      readyAttachments,
      sending,
      anyUploading,
      convId,
      sendMessage,
      priceKobo,
      previewBody,
    ]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // Close popovers on outside click / Escape.
  useEffect(() => {
    if (!plusOpen && !emojiOpen) return;
    const onDown = (ev: MouseEvent) => {
      if (plusOpen && !plusWrapRef.current?.contains(ev.target as Node))
        setPlusOpen(false);
      if (emojiOpen && !emojiWrapRef.current?.contains(ev.target as Node))
        setEmojiOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      setPlusOpen(false);
      setEmojiOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [plusOpen, emojiOpen]);

  // Revoke preview blob URLs when items leave the queue.
  useEffect(() => {
    return () => {
      queue.forEach((q) => {
        if (q.previewUrl.startsWith("blob:")) URL.revokeObjectURL(q.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadQueued = useCallback(
    async (q: QueuedUpload) => {
      try {
        // Probe metadata before upload (best-effort).
        if (q.kind === "image") {
          const { width, height } = await probeImage(q.previewUrl);
          setQueue((prev) =>
            prev.map((it) => (it.id === q.id ? { ...it, width, height } : it))
          );
        } else if (q.kind === "video") {
          const { width, height, durationMs } = await probeVideo(q.previewUrl);
          setQueue((prev) =>
            prev.map((it) =>
              it.id === q.id ? { ...it, width, height, durationMs } : it
            )
          );
        }

        const res = await uploadFile(q.file, q.uploadKind, (loaded, total) => {
          setQueue((prev) =>
            prev.map((it) =>
              it.id === q.id ? { ...it, progress: total ? loaded / total : 0 } : it
            )
          );
        });
        setQueue((prev) =>
          prev.map((it) =>
            it.id === q.id
              ? {
                  ...it,
                  status: "ready",
                  progress: 1,
                  mediaId: res.mediaId,
                  publicUrl: res.publicUrl,
                }
              : it
          )
        );
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.detail ?? err.message
            : err instanceof Error
            ? err.message
            : "Upload failed";
        setQueue((prev) =>
          prev.map((it) =>
            it.id === q.id ? { ...it, status: "error", error: msg } : it
          )
        );
        toast.error(msg);
      }
    },
    []
  );

  const onFilesPicked = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const nextItems: QueuedUpload[] = [];
    for (const file of files) {
      const cls = classifyFile(file);
      if (!cls) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      const sizeErr = validateSize(cls.kind, file.size);
      if (sizeErr) {
        toast.error(`${file.name}: ${sizeErr}`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      nextItems.push({
        id: crypto.randomUUID(),
        file,
        kind: cls.kind,
        uploadKind: cls.uploadKind,
        previewUrl,
        status: "uploading",
        progress: 0,
      });
    }
    if (nextItems.length === 0) return;
    setQueue((prev) => [...prev, ...nextItems]);
    nextItems.forEach((q) => uploadQueued(q));
  };

  const removeQueued = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((q) => q.id === id);
      if (target && target.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((q) => q.id !== id);
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setBody((b) => b + emoji);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = (body.slice(0, start) + emoji + body.slice(end)).slice(
      0,
      MAX_LEN
    );
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  /* ── Voice-note recording ─────────────────────────────── */

  const stopRecordingCleanup = useCallback(() => {
    if (recRafRef.current != null) {
      cancelAnimationFrame(recRafRef.current);
      recRafRef.current = null;
    }
    if (recTimerRef.current != null) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    recAnalyserRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (recording) return;
    if (typeof MediaRecorder === "undefined") {
      toast.error("Voice notes aren't supported in this browser.");
      return;
    }
    const mimeType = pickRecorderMime();
    if (!mimeType) {
      toast.error("No supported audio codec in this browser.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone permission denied.");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    // Live level meter.
    const ctx = getSharedAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    recAnalyserRef.current = analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!recAnalyserRef.current) return;
      recAnalyserRef.current.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.min(1, Math.sqrt(sum / buf.length) * 2);
      setRecordLevels((prev) => {
        const next = [...prev, rms];
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });
      recRafRef.current = requestAnimationFrame(tick);
    };
    recRafRef.current = requestAnimationFrame(tick);

    const startedAt = Date.now();
    recTimerRef.current = window.setInterval(() => {
      setRecordElapsedMs(Date.now() - startedAt);
    }, 100);

    recorder.start();
    setRecording({ startedAt, stream, recorder, chunks, mimeType });
    setRecordElapsedMs(0);
    setRecordLevels([]);
  }, [recording]);

  const cancelRecording = useCallback(() => {
    if (!recording) return;
    try {
      recording.recorder.stop();
    } catch {}
    recording.stream.getTracks().forEach((t) => t.stop());
    stopRecordingCleanup();
    setRecording(null);
    setRecordElapsedMs(0);
    setRecordLevels([]);
  }, [recording, stopRecordingCleanup]);

  const stopRecordingAndSend = useCallback(async () => {
    if (!recording) return;
    const { recorder, stream, chunks, mimeType, startedAt } = recording;
    const finalDurationMs = Date.now() - startedAt;

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    try {
      recorder.stop();
    } catch {}
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    stopRecordingCleanup();
    setRecording(null);
    setRecordElapsedMs(0);
    setRecordLevels([]);

    if (chunks.length === 0) {
      toast.error("Recording was empty.");
      return;
    }
    if (finalDurationMs < 500) {
      toast.info("Hold to record — that was too short.");
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size > AUDIO_MAX) {
      toast.error("Voice note is too long (max 32MB).");
      return;
    }

    const ext = mimeType.includes("mp4")
      ? "m4a"
      : mimeType.includes("mpeg")
      ? "mp3"
      : "webm";
    const file = new File([blob], `voice-${Date.now()}.${ext}`, {
      type: mimeType,
    });

    let waveform: number[] | undefined;
    try {
      waveform = await computeWaveform(blob, 40);
    } catch {}

    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(blob);
    const queued: QueuedUpload = {
      id,
      file,
      kind: "audio",
      uploadKind: "audio",
      previewUrl,
      status: "uploading",
      progress: 0,
      durationMs: finalDurationMs,
      waveform,
    };
    setQueue((prev) => [...prev, queued]);
    try {
      const res = await uploadFile(file, "audio", (loaded, total) => {
        setQueue((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, progress: total ? loaded / total : 0 } : it
          )
        );
      });
      const attachment: MessageAttachment = {
        kind: "audio",
        mediaId: res.mediaId,
        url: res.publicUrl,
        mimeType: mimeType,
        sizeBytes: file.size,
        width: null,
        height: null,
        durationMs: finalDurationMs,
        posterUrl: null,
        waveform: waveform ?? null,
      };
      setQueue((prev) => {
        const target = prev.find((q) => q.id === id);
        if (target && target.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return prev.filter((q) => q.id !== id);
      });
      await submit([attachment]);
    } catch (err) {
      setQueue((prev) => prev.filter((q) => q.id !== id));
      const msg =
        err instanceof ApiError
          ? err.detail ?? err.message
          : err instanceof Error
          ? err.message
          : "Voice note upload failed";
      toast.error(msg);
    }
  }, [recording, stopRecordingCleanup, submit]);

  useEffect(() => {
    return () => {
      if (recording) {
        try {
          recording.recorder.stop();
        } catch {}
        recording.stream.getTracks().forEach((t) => t.stop());
      }
      stopRecordingCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSend =
    !sending &&
    !anyUploading &&
    (body.trim().length > 0 || readyAttachments.length > 0);

  /* ── Recording UI ─────────────────────────────────────── */

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={cancelRecording}
          aria-label="Cancel recording"
          className="inline-flex items-center justify-center size-10 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
        >
          <Trash2 className="size-4" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-3 h-10 px-4 rounded-[16px] bg-white/[0.04] hairline">
          <span
            aria-hidden
            className="size-2.5 rounded-full bg-red-400 animate-pulse shrink-0"
          />
          <span className="text-[13px] text-white/80 tabular-nums shrink-0">
            {formatDuration(recordElapsedMs)}
          </span>
          <div className="flex-1 flex items-center gap-[2px] h-6 overflow-hidden">
            {recordLevels.map((v, i) => (
              <span
                key={i}
                className="flex-1 rounded-full bg-white/70"
                style={{ height: Math.max(3, Math.round(v * 22)) }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={stopRecordingAndSend}
          aria-label="Send voice note"
          className="inline-flex items-center justify-center size-10 rounded-full bg-gradient-brand text-white on-media shrink-0 hover:opacity-95 transition-opacity"
        >
          <Send className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* PPV chip */}
      {isCreator && priceKobo ? (
        <div className="flex items-center gap-2 self-start px-2.5 py-1.5 rounded-full bg-gradient-brand text-white on-media text-[12px]">
          <Lock className="size-3.5" />
          <span className="font-semibold">
            ₦{(priceKobo / 100).toLocaleString("en-NG")} to unlock
          </span>
          {previewBody.trim() ? (
            <span className="text-white/85 max-w-[160px] truncate">
              · “{previewBody.trim()}”
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setPriceKobo(null);
              setPreviewBody("");
            }}
            aria-label="Clear price"
            className="ml-1 inline-flex items-center justify-center size-4 rounded-full bg-white/25 hover:bg-white/40"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : null}

      {/* Attachment preview strip */}
      {queue.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {queue.map((q) => (
            <QueuedTile key={q.id} q={q} onRemove={() => removeQueued(q.id)} />
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        {/* Plus menu — upload / tip */}
        <div ref={plusWrapRef} className="relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept={ATTACH_ACCEPT}
            multiple
            hidden
            onChange={onFilesPicked}
          />
          <button
            type="button"
            onClick={() => setPlusOpen((v) => !v)}
            aria-label="Attach or tip"
            aria-haspopup="menu"
            aria-expanded={plusOpen}
            className={cn(
              "inline-flex items-center justify-center size-10 rounded-full transition-colors",
              plusOpen
                ? "bg-gradient-brand text-white on-media"
                : "text-white/70 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Plus
              className={cn(
                "size-4 transition-transform",
                plusOpen && "rotate-45"
              )}
            />
          </button>
          {plusOpen ? (
            <div
              role="menu"
              className="animate-fade-in absolute bottom-full left-0 mb-2 z-30 min-w-[200px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setPlusOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 text-white/85 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <ImagePlus className="size-4" /> Photo, video or audio
              </button>
              {conv && canTip ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPlusOpen(false);
                    setTipOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 text-white/85 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <DollarSign className="size-4" /> Send a tip
                </button>
              ) : null}
              {/* PPV moved to a dedicated icon button next to + */}
            </div>
          ) : null}
        </div>

        {/* PPV toggle — creators only */}
        {isCreator ? (
          <button
            type="button"
            onClick={() => setPpvOpen(true)}
            aria-label={priceKobo ? "Edit unlock price" : "Charge to unlock"}
            title={priceKobo ? "Edit unlock price" : "Charge to unlock"}
            className={cn(
              "inline-flex items-center justify-center size-10 rounded-full transition-colors shrink-0",
              priceKobo
                ? "bg-gradient-brand text-white on-media"
                : "text-white/70 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Lock className="size-4" />
          </button>
        ) : null}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            const v = e.target.value.slice(0, MAX_LEN);
            setBody(v);
            if (v) notifyTyping();
          }}
          onKeyDown={onKeyDown}
          placeholder="Message…"
          rows={1}
          className="flex-1 min-w-0 resize-none max-h-32 rounded-[16px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 px-4 py-2.5 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
        />

        {/* Emoji */}
        <div ref={emojiWrapRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Insert emoji"
            aria-haspopup="dialog"
            aria-expanded={emojiOpen}
            className="inline-flex items-center justify-center size-10 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Smile className="size-4" />
          </button>
          {emojiOpen ? (
            <div
              role="dialog"
              className="animate-fade-in absolute bottom-full right-0 mb-2 z-30 surface-elev rounded-[14px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] w-[320px] overflow-hidden"
            >
              <EmojiPicker.Root
                className="flex flex-col h-[360px] bg-transparent text-white"
                onEmojiSelect={({ emoji }) => {
                  insertEmoji(emoji);
                  setEmojiOpen(false);
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
                  <EmojiPicker.List className="select-none pb-2" />
                </EmojiPicker.Viewport>
              </EmojiPicker.Root>
            </div>
          ) : null}
        </div>

        {/* Record voice note */}
        <button
          type="button"
          onClick={startRecording}
          aria-label="Record voice note"
          className="inline-flex items-center justify-center size-10 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
        >
          <Mic className="size-4" />
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={() => submit()}
          aria-label="Send message"
          disabled={!canSend}
          className="inline-flex items-center justify-center size-10 rounded-full bg-gradient-brand text-white on-media shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
        >
          {sending ? (
            <span
              aria-hidden
              className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
            />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>

      {tipOpen && conv ? (
        <TipModal
          target={{
            username: conv.other.username,
            displayName: conv.other.displayName,
            avatarUrl: conv.other.avatarUrl,
          }}
          onClose={() => setTipOpen(false)}
        />
      ) : null}

      {ppvOpen ? (
        <PpvModal
          initialPriceKobo={priceKobo}
          initialPreview={previewBody}
          onClose={() => setPpvOpen(false)}
          onSave={(nextPriceKobo, nextPreview) => {
            setPriceKobo(nextPriceKobo);
            setPreviewBody(nextPreview);
            setPpvOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

const PPV_MIN_NAIRA = 100;
const PPV_MAX_NAIRA = 200_000;
const PREVIEW_MAX = 280;

function PpvModal({
  initialPriceKobo,
  initialPreview,
  onClose,
  onSave,
}: {
  initialPriceKobo: number | null;
  initialPreview: string;
  onClose: () => void;
  onSave: (priceKobo: number | null, preview: string) => void;
}) {
  const [naira, setNaira] = useState<string>(
    initialPriceKobo ? String(initialPriceKobo / 100) : ""
  );
  const [preview, setPreview] = useState<string>(initialPreview);

  const parsed = Number(naira);
  const valid =
    naira.trim() === "" ||
    (Number.isFinite(parsed) &&
      parsed >= PPV_MIN_NAIRA &&
      parsed <= PPV_MAX_NAIRA);

  const save = () => {
    if (!valid) return;
    const trimmed = naira.trim();
    if (!trimmed) {
      onSave(null, "");
      return;
    }
    const kobo = Math.round(parsed * 100);
    onSave(kobo, preview.slice(0, PREVIEW_MAX));
  };

  return (
    <Modal open onClose={onClose} title="Charge to unlock" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-white/60">
          Fans see the preview and price, then pay to reveal the full message
          and any attachments. You keep 90%.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-white/70">
            Price (₦)
          </span>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-[14px]">
              ₦
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={PPV_MIN_NAIRA}
              max={PPV_MAX_NAIRA}
              step={50}
              value={naira}
              onChange={(e) => setNaira(e.target.value)}
              placeholder={`${PPV_MIN_NAIRA} – ${PPV_MAX_NAIRA.toLocaleString()}`}
              className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 pl-8 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
            />
          </div>
          {!valid ? (
            <span className="text-[11px] text-red-300">
              Price must be between ₦{PPV_MIN_NAIRA} and ₦
              {PPV_MAX_NAIRA.toLocaleString()}.
            </span>
          ) : (
            <span className="text-[11px] text-white/45">
              Leave blank to send as a free message.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-white/70">
            Preview text (optional)
          </span>
          <textarea
            value={preview}
            onChange={(e) => setPreview(e.target.value.slice(0, PREVIEW_MAX))}
            placeholder="tap to see 👀"
            rows={3}
            className="w-full resize-none rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 px-3.5 py-2.5 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
          />
          <span className="text-[11px] text-white/45 self-end tabular-nums">
            {preview.length}/{PREVIEW_MAX}
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid}>
            {naira.trim() ? "Set price" : "Clear price"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function QueuedTile({
  q,
  onRemove,
}: {
  q: QueuedUpload;
  onRemove: () => void;
}) {
  const pct = Math.max(0, Math.min(1, q.progress));
  return (
    <div className="relative w-20 h-20 rounded-[10px] overflow-hidden hairline bg-black shrink-0">
      {q.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={q.previewUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : q.kind === "video" ? (
        <video
          src={q.previewUrl}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-white/[0.06]">
          <Mic className="size-5 text-white/80" />
          {q.durationMs ? (
            <span className="text-[10px] text-white/70 tabular-nums">
              {formatDuration(q.durationMs)}
            </span>
          ) : null}
        </div>
      )}
      {q.status === "uploading" ? (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
          <div
            className="h-full bg-gradient-brand"
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
      ) : null}
      {q.status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-[10px] text-red-300 px-1 text-center">
          Failed
        </div>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="on-media absolute top-1 right-1 inline-flex items-center justify-center size-5 rounded-full bg-black/70 text-white hover:bg-black"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
