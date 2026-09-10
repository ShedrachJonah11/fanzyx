"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import { EmojiPicker } from "frimousse";
import {
  DollarSign,
  ImagePlus,
  Mic,
  Plus,
  Send,
  Smile,
  X,
} from "lucide-react";
import { useMessagingStore } from "@/services/stores/messaging";
import { wsClient } from "@/services/ws/client";
import { uploadFile } from "@/services/modules/uploads";
import { ApiError } from "@/services/apiClient";
import { useAuth } from "@/services/context";
import { TipModal } from "@/components/tip/TipModal";
import type { MessageAttachment, UploadKind } from "@/services/dtos";
import { cn } from "@/lib/utils";

const TYPING_THROTTLE_MS = 2_000;
const MAX_LEN = 4_000;

export function Composer({ convId }: { convId: string }) {
  const sendMessage = useMessagingStore((s) => s.sendMessage);
  const conv = useMessagingStore((s) => s.conversations[convId]);
  const { user } = useAuth();
  const canTip = user?.role !== "creator";

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<
    MessageAttachment[]
  >([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  const lastTypingSent = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const plusWrapRef = useRef<HTMLDivElement | null>(null);
  const emojiWrapRef = useRef<HTMLDivElement | null>(null);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
    lastTypingSent.current = now;
    wsClient.send({ type: "typing", conversation_id: convId });
  }, [convId]);

  const submit = useCallback(async () => {
    const value = body.trim();
    if (!value && pendingAttachments.length === 0) return;
    if (sending) return;
    setSending(true);
    const attachments = pendingAttachments;
    setBody("");
    setPendingAttachments([]);
    try {
      await sendMessage(convId, value, {
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "blocked") toast.error("You can't message this user.");
        else if (e.code === "self_message")
          toast.error("You can't message yourself.");
        else toast.error(e.detail ?? e.message);
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [body, pendingAttachments, sending, convId, sendMessage]);

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

  const onFilePicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind: UploadKind = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
      ? "audio"
      : "image";
    setUploading(true);
    try {
      const { publicUrl } = await uploadFile(file, kind);
      setPendingAttachments((prev) => [
        ...prev,
        { url: publicUrl, type: file.type },
      ]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.detail ?? err.message
          : err instanceof Error
          ? err.message
          : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const removePending = (idx: number) =>
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));

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

  const canSend =
    !sending && (body.trim().length > 0 || pendingAttachments.length > 0);

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment preview strip */}
      {pendingAttachments.length > 0 || uploading ? (
        <div className="flex gap-2 flex-wrap">
          {pendingAttachments.map((att, i) => (
            <div
              key={att.url + i}
              className="relative size-16 rounded-[10px] overflow-hidden hairline bg-black"
            >
              {att.type?.startsWith("video/") ? (
                <video
                  src={att.url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removePending(i)}
                aria-label="Remove attachment"
                className="on-media absolute top-0.5 right-0.5 inline-flex items-center justify-center size-5 rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {uploading ? (
            <div className="size-16 rounded-[10px] hairline bg-white/[0.04] flex items-center justify-center">
              <span
                aria-hidden
                className="size-5 rounded-full border-2 border-white/25 border-t-white animate-spin"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        {/* Plus menu — upload / tip */}
        <div ref={plusWrapRef} className="relative shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={onFilePicked}
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
              className="animate-fade-in absolute bottom-full left-0 mb-2 z-30 min-w-[180px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
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
                <ImagePlus className="size-4" /> Upload photo or video
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
            </div>
          ) : null}
        </div>

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

        {/* Record audio (placeholder) */}
        <button
          type="button"
          onClick={() =>
            toast.info("Voice notes coming soon.")
          }
          aria-label="Record voice note"
          className="inline-flex items-center justify-center size-10 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
        >
          <Mic className="size-4" />
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={submit}
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
    </div>
  );
}
