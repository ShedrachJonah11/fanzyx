"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  EyeOff,
  Flag,
  Link as LinkIcon,
  MoreHorizontal,
  Share2,
  Trash2,
  UserX,
} from "lucide-react";
import { ReportUserModal } from "@/components/user/ReportUserModal";
import { ReportPostModal } from "@/components/user/ReportPostModal";
import { useBlockUser } from "@/services/hooks/users";
import { useAuth } from "@/services/context";
import { posts as postsApi } from "@/services/modules/posts";
import { ApiError } from "@/services/apiClient";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  onSelect?: () => void;
  hidden?: boolean;
};

export function PostMenu({
  postId,
  authorUsername,
  onShare,
  onCopyLink,
  onHide,
  onDeleted,
}: {
  postId?: string;
  authorUsername?: string;
  onShare?: () => void;
  onCopyLink?: () => void;
  onHide?: () => void;
  onDeleted?: () => void;
} = {}) {
  const [open, setOpen] = useState(false);
  const [reportUserOpen, setReportUserOpen] = useState(false);
  const [reportPostOpen, setReportPostOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const isSelf = !!authorUsername && user?.username === authorUsername;
  const blockState = useBlockUser(authorUsername ?? "");

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

  const handleBlock = async () => {
    if (!authorUsername) return;
    try {
      await blockState.block();
      toast.success(`@${authorUsername} blocked`);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "self_block"
            ? "You can't block yourself"
            : e.code === "user_not_found"
            ? "This user is no longer available."
            : e.detail ?? e.message
          : "Couldn't block user";
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    try {
      await postsApi.delete(postId);
      toast.success("Post deleted");
      onDeleted?.();
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail ?? e.message : "Couldn't delete post";
      toast.error(msg);
    } finally {
      setConfirmDelete(false);
    }
  };

  const items: Item[] = [
    { label: "Share", icon: Share2, onSelect: onShare },
    { label: "Copy link", icon: LinkIcon, onSelect: onCopyLink },
    { label: "Hide", icon: EyeOff, onSelect: onHide, hidden: isSelf },
    {
      label: "Report post",
      icon: Flag,
      danger: true,
      hidden: !postId || isSelf,
      onSelect: () => setReportPostOpen(true),
    },
    {
      label: "Report user",
      icon: Flag,
      danger: true,
      hidden: !authorUsername || isSelf,
      onSelect: () => setReportUserOpen(true),
    },
    {
      label: "Block user",
      icon: UserX,
      danger: true,
      hidden: !authorUsername || isSelf,
      onSelect: handleBlock,
    },
    {
      label: "Delete post",
      icon: Trash2,
      danger: true,
      hidden: !postId || !isSelf,
      onSelect: () => setConfirmDelete(true),
    },
  ];

  return (
    <>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Post options"
          className="text-white/50 hover:text-white p-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
        >
          <MoreHorizontal className="size-4" />
        </button>

        {open ? (
          <div
            role="menu"
            className="animate-fade-in absolute top-full right-0 mt-2 z-20 min-w-[200px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
          >
            {items
              .filter((i) => !i.hidden)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      item.onSelect?.();
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2.5 transition-colors",
                      item.danger
                        ? "text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        : "text-white/85 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
          </div>
        ) : null}
      </div>

      {reportUserOpen && authorUsername ? (
        <ReportUserModal
          username={authorUsername}
          onClose={() => setReportUserOpen(false)}
        />
      ) : null}

      {reportPostOpen && postId ? (
        <ReportPostModal
          postId={postId}
          onClose={() => setReportPostOpen(false)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDeleteModal
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}

function ConfirmDeleteModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const doIt = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="relative w-full max-w-sm surface-card p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Delete this post?</h3>
          <p className="text-sm text-white/60 mt-1">
            This is permanent. Subscribers who unlocked it will lose access.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-9 px-3 rounded-[10px] text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={doIt}
            disabled={busy}
            className="h-9 px-3 rounded-[10px] text-sm text-white bg-red-500 hover:bg-red-500/90 disabled:opacity-60 transition-colors"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
