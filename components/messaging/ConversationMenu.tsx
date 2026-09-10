"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useMessagingStore } from "@/services/stores/messaging";
import { ApiError } from "@/services/apiClient";
import type { ConversationOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

type Props = {
  conv: ConversationOut;
  /** "row" = list-row kebab (always visible now). "header" = thread header. */
  variant?: "row" | "header";
  className?: string;
  /** Fires after successful delete — used by the thread view to navigate back. */
  onDeleted?: () => void;
};

/**
 * Per-conversation kebab menu — pin/unpin, mute/unmute, view profile.
 * Used in the list rows AND in the thread header.
 */
export function ConversationMenu({
  conv,
  className,
  onDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const togglePin = useMessagingStore((s) => s.togglePin);
  const toggleMute = useMessagingStore((s) => s.toggleMute);
  const deleteConversation = useMessagingStore((s) => s.deleteConversation);

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

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={wrapRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Conversation menu"
        className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
      >
        <MoreVertical className="size-4" />
      </button>
      {open ? (
        <div
          role="menu"
          onClick={stop}
          className="animate-fade-in absolute top-full right-0 mt-1 z-40 min-w-[180px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
        >
          <MenuItem
            icon={conv.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
            label={conv.pinned ? "Unpin chat" : "Pin chat"}
            onClick={() => {
              setOpen(false);
              togglePin(conv.id, !conv.pinned);
            }}
          />
          <MenuItem
            icon={conv.muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            label={conv.muted ? "Unmute" : "Mute"}
            onClick={() => {
              setOpen(false);
              toggleMute(conv.id, !conv.muted);
            }}
          />
          <Link
            href={`/creator/${conv.other.username}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 text-white/85 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <UserRound className="size-4" /> View profile
          </Link>
          <div className="my-1 h-px bg-white/[0.06]" />
          <MenuItem
            icon={<Trash2 className="size-4" />}
            label="Delete conversation"
            destructive
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
          />
        </div>
      ) : null}

      {confirming ? (
        <DeleteConfirm
          name={conv.other.displayName || conv.other.username}
          busy={deleting}
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            if (deleting) return;
            setDeleting(true);
            try {
              await deleteConversation(conv.id);
              toast.success("Conversation deleted");
              setConfirming(false);
              onDeleted?.();
              // If we're currently viewing this thread, navigate away.
              if (typeof window !== "undefined" && !onDeleted) {
                const path = window.location.pathname;
                if (path.endsWith(`/${conv.id}`)) {
                  const basePath = path.slice(0, -conv.id.length - 1);
                  router.replace(basePath);
                }
              }
            } catch (e) {
              const msg =
                e instanceof ApiError
                  ? e.detail ?? "Couldn't delete conversation"
                  : "Couldn't delete conversation";
              toast.error(msg);
            } finally {
              setDeleting(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function DeleteConfirm({
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel, busy]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Delete conversation"
        className="relative w-full max-w-sm surface-card p-5 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-red-500/15 text-red-300 shrink-0">
            <TriangleAlert className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-[15px]">
              Delete this conversation?
            </h3>
            <p className="text-white/60 text-[13px] mt-1">
              This clears your chat with{" "}
              <span className="text-white font-medium">{name}</span>. Messages
              can&apos;t be recovered.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center h-10 px-4 rounded-full text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-bold text-white bg-red-500 hover:bg-red-500/90 disabled:opacity-60"
          >
            {busy ? (
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
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 transition-colors",
        destructive
          ? "text-red-300 hover:bg-red-500/10 hover:text-red-200"
          : "text-white/85 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
