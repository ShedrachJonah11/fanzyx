"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BellOff, Check, MoreHorizontal, Pin, Search, SquarePen } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewChatModal } from "./NewChatModal";
import { ConversationMenu } from "./ConversationMenu";
import { useMessagingStore } from "@/services/stores/messaging";
import { messages as messagesApi } from "@/services/modules/messages";
import { ApiError } from "@/services/apiClient";
import type { ConversationFilter, ConversationOut } from "@/services/dtos";
import { cn, timeAgo } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

const FILTERS: { value: ConversationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "pinned", label: "Pinned" },
];

type Props = {
  basePath: "/messages" | "/dashboard/messages";
  activeConvId?: string;
};

export function ConversationList({ basePath, activeConvId }: Props) {
  const filter = useMessagingStore((s) => s.filter);
  const setFilter = useMessagingStore((s) => s.setFilter);
  const conversations = useMessagingStore((s) => s.conversations);
  const order = useMessagingStore((s) => s.convOrder);
  const loading = useMessagingStore((s) => s.convListLoading);
  const loaded = useMessagingStore((s) => s.convListLoaded);
  const presenceByUser = useMessagingStore((s) => s.presenceByUser);
  const hydrate = useMessagingStore((s) => s.hydrateConversations);
  const markRead = useMessagingStore((s) => s.markRead);

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate, filter]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuWrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return order
      .map((id) => conversations[id])
      .filter((c): c is ConversationOut => !!c)
      .filter((c) => {
        if (filter === "unread" && c.unreadCount === 0) return false;
        if (filter === "pinned" && !c.pinned) return false;
        if (!q) return true;
        const name = (c.other.displayName ?? "").toLowerCase();
        const preview = (c.lastMessage?.body ?? "").toLowerCase();
        return (
          c.other.username.toLowerCase().includes(q) ||
          name.includes(q) ||
          preview.includes(q)
        );
      });
  }, [order, conversations, filter, q]);

  const markAllRead = async () => {
    setMenuOpen(false);
    if (markingAll) return;
    const unread = Object.values(conversations).filter((c) => c.unreadCount > 0);
    if (unread.length === 0) {
      toast.info("No unread conversations.");
      return;
    }
    setMarkingAll(true);
    try {
      await Promise.all(
        unread.map((c) =>
          messagesApi.markRead(c.id).catch(() => null).then(() => markRead(c.id))
        )
      );
      toast.success(`Marked ${unread.length} as read`);
    } catch (e) {
      if (e instanceof ApiError)
        toast.error(e.detail ?? "Couldn't mark all read");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header — its own bottom border extends full-width across the shell
          (matched by the thread header's border so they form one line). */}
      <div className="p-3 flex flex-col gap-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full h-10 rounded-[10px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
            />
          </div>
          <div ref={menuWrapRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Chat menu"
              className="inline-flex items-center justify-center size-10 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="animate-fade-in absolute top-full right-0 mt-2 z-30 min-w-[180px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setNewChatOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 text-white/85 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <SquarePen className="size-4" /> New chat
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 text-white/85 hover:bg-white/[0.06] hover:text-white transition-colors disabled:opacity-60"
                >
                  <Check className="size-4" />{" "}
                  {markingAll ? "Marking…" : "Mark all as read"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {FILTERS.map((f) => {
            const active = f.value === filter;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center h-8 px-3.5 rounded-full text-[12px] font-medium transition-colors shrink-0",
                  active
                    ? "bg-gradient-brand text-white on-media"
                    : "bg-white/[0.04] hairline text-white/70 hover:bg-white/[0.08]"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && visible.length === 0 ? (
          <ul>
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 p-3">
                <SkeletonCircle size={44} />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-32 rounded-full" />
                  <Skeleton className="h-2.5 w-48 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        ) : visible.length === 0 && loaded ? (
          <EmptyState
            className="!bg-transparent !border-none mt-4"
            title={
              q
                ? "No matches"
                : filter === "unread"
                ? "No unread messages"
                : filter === "pinned"
                ? "Nothing pinned"
                : "No conversations yet"
            }
            body={
              !q && filter === "all"
                ? "Start a chat from a creator's profile or via the menu."
                : undefined
            }
            imageSize={140}
          />
        ) : (
          <ul>
            {visible.map((conv) => {
              const isActive = conv.id === activeConvId;
              const online = presenceByUser[conv.other.id]?.online;
              const name = conv.other.displayName || conv.other.username;
              const preview = conv.lastMessage?.deletedAt
                ? "Message deleted"
                : conv.lastMessage?.locked
                ? conv.lastMessage.previewBody || "🔒 Paid message"
                : conv.lastMessage?.body || "New attachment";
              return (
                <li
                  key={conv.id}
                  className={cn(
                    "relative group border-b border-white/[0.04] transition-colors",
                    isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                  )}
                >
                  <Link
                    href={`${basePath}/${conv.id}`}
                    className="flex items-center gap-3 p-3 pr-12"
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        name={name}
                        gradient={BRAND_GRADIENT}
                        image={conv.other.avatarUrl ?? undefined}
                        size={44}
                      />
                      {online ? (
                        <span
                          aria-label="Online"
                          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-400 ring-2 ring-[var(--bg-elev)]"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[14px] font-semibold text-white truncate">
                          {name}
                        </span>
                        <VerifiedBadge active={conv.other.verified} />
                        {conv.pinned ? (
                          <Pin className="size-3 text-white/60" />
                        ) : null}
                        {conv.muted ? (
                          <BellOff className="size-3 text-white/60" />
                        ) : null}
                        {conv.lastMessageAt ? (
                          <span className="ml-auto text-[11px] text-white/45 shrink-0">
                            {timeAgo(conv.lastMessageAt)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p
                          className={cn(
                            "text-[12px] truncate flex-1",
                            conv.unreadCount > 0
                              ? "text-white/85 font-medium"
                              : "text-white/55"
                          )}
                        >
                          {preview}
                        </p>
                        {conv.unreadCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-gradient-brand text-white text-[10px] font-bold on-media shrink-0">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <ConversationMenu conv={conv} variant="row" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {newChatOpen ? (
        <NewChatModal
          basePath={basePath}
          onClose={() => setNewChatOpen(false)}
        />
      ) : null}
    </div>
  );
}
